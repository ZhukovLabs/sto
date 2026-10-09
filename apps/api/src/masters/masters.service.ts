import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const NAME_PATTERN = /^.{2,80}$/s;
const CHAT_ID_PATTERN = /^-?[0-9]{5,20}$/;

@Injectable()
export class MastersService {
  private readonly logger = new Logger(MastersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<
    Array<{ id: string; name: string; telegramChatId: string; isActive: boolean; createdAt: Date }>
  > {
    const masters = await this.prisma.master.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, telegramChatId: true, isActive: true, createdAt: true },
    });
    return masters.map((master) => ({
      ...master,
      telegramChatId: master.telegramChatId.toString(),
    }));
  }

  async create(name: unknown, telegramChatId: unknown): Promise<{ id: string }> {
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const chatId =
      typeof telegramChatId === 'string' ? telegramChatId.trim() : String(telegramChatId ?? '');
    if (!NAME_PATTERN.test(cleanName)) {
      throw new BadRequestException('Имя: от 2 до 80 символов');
    }
    if (!CHAT_ID_PATTERN.test(chatId)) {
      throw new BadRequestException(
        'Некорректный chat_id — пришлите его мастеру через /start у бота',
      );
    }
    return this.prisma.master
      .create({
        data: { name: cleanName, telegramChatId: BigInt(chatId) },
        select: { id: true },
      })
      .catch((error: unknown) => {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'P2002'
        ) {
          throw new ConflictException('Мастер с таким chat_id уже добавлен');
        }
        throw error;
      });
  }

  async update(id: string, name?: unknown, isActive?: unknown): Promise<{ id: string }> {
    const data: { name?: string; isActive?: boolean } = {};
    if (name !== undefined) {
      const cleanName = typeof name === 'string' ? name.trim() : '';
      if (!NAME_PATTERN.test(cleanName)) {
        throw new BadRequestException('Имя: от 2 до 80 символов');
      }
      data.name = cleanName;
    }
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        throw new BadRequestException('isActive должен быть boolean');
      }
      data.isActive = isActive;
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Нечего обновлять');
    }
    return this.prisma.master.update({ where: { id }, data, select: { id: true } }).catch(() => {
      throw new NotFoundException('Мастер не найден');
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.master.delete({ where: { id }, select: { id: true } }).catch(() => {
      throw new NotFoundException('Мастер не найден');
    });
    this.logger.log(`Мастер удалён: ${id}`);
  }
}
