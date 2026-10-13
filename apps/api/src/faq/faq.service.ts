import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { notifyWebRevalidate } from '../web-revalidate';

const QUESTION_MIN = 5;
const QUESTION_MAX = 200;
const ANSWER_MIN = 5;
const ANSWER_MAX = 2000;

/** P2025 (запись не найдена) -> 404; прочие ошибки пробрасываем как есть. */
function prismaNotFound(error: unknown): unknown {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
    return new NotFoundException('Вопрос не найден');
  }
  return error;
}

export interface FaqItemView {
  id: string;
  question: string;
  answer: string;
  position: number;
  isActive: boolean;
}

@Injectable()
export class FaqService {
  private readonly logger = new Logger(FaqService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Активные вопросы для сайта, по порядку. */
  async listPublic(): Promise<FaqItemView[]> {
    const items = await this.prisma.faqItem.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      select: this.select(),
    });
    return items;
  }

  /** Все вопросы для админки. */
  async listAll(): Promise<FaqItemView[]> {
    return this.prisma.faqItem.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      select: this.select(),
    });
  }

  async create(body: unknown): Promise<FaqItemView> {
    const { question, answer } = this.validate(body);
    const last = await this.prisma.faqItem.findFirst({
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const item = await this.prisma.faqItem.create({
      data: { question, answer, position: (last?.position ?? -1) + 1 },
      select: this.select(),
    });
    this.logger.log(`FAQ добавлен: ${item.id}`);
    notifyWebRevalidate();
    return item;
  }

  async reorder(body: unknown): Promise<void> {
    if (
      typeof body !== 'object' ||
      body === null ||
      !Array.isArray((body as { ids: unknown }).ids)
    ) {
      throw new BadRequestException('ids должен быть массивом');
    }
    const ids = (body as { ids: unknown[] }).ids;
    if (ids.some((id) => typeof id !== 'string')) {
      throw new BadRequestException('ids должен содержать строки');
    }
    try {
      await this.prisma.$transaction(
        ids.map((id, index) =>
          this.prisma.faqItem.update({
            where: { id: id as string },
            data: { position: index },
            select: { id: true },
          }),
        ),
      );
    } catch (error) {
      throw prismaNotFound(error);
    }
    notifyWebRevalidate();
  }

  async update(id: string, body: unknown): Promise<FaqItemView> {
    if (typeof body !== 'object' || body === null) {
      throw new BadRequestException('Некорректное тело запроса');
    }
    const patch = body as Record<string, unknown>;
    const data: { question?: string; answer?: string; isActive?: boolean } = {};
    if (patch.question !== undefined || patch.answer !== undefined) {
      const { question, answer } = this.validate(patch);
      if (patch.question !== undefined) {
        data.question = question;
      }
      if (patch.answer !== undefined) {
        data.answer = answer;
      }
    }
    if (patch.isActive !== undefined) {
      if (typeof patch.isActive !== 'boolean') {
        throw new BadRequestException('isActive должен быть boolean');
      }
      data.isActive = patch.isActive;
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Нечего обновлять');
    }
    const item = await this.prisma.faqItem
      .update({ where: { id }, data, select: this.select() })
      .catch((error: unknown) => {
        throw prismaNotFound(error);
      });
    notifyWebRevalidate();
    return item;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.faqItem
      .delete({ where: { id }, select: { id: true } })
      .catch((error: unknown) => {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'P2025'
        ) {
          return null;
        }
        throw error;
      });
    this.logger.log(`FAQ удалён: ${id}`);
    notifyWebRevalidate();
  }

  private select() {
    return { id: true, question: true, answer: true, position: true, isActive: true } as const;
  }

  /** Валидация пары вопрос/ответ из тела запроса. */
  private validate(body: unknown): { question: string; answer: string } {
    if (typeof body !== 'object' || body === null) {
      throw new BadRequestException('Некорректное тело запроса');
    }
    const { question, answer } = body as Record<string, unknown>;
    const cleanQuestion = typeof question === 'string' ? question.trim() : '';
    const cleanAnswer = typeof answer === 'string' ? answer.trim() : '';
    if (cleanQuestion.length < QUESTION_MIN || cleanQuestion.length > QUESTION_MAX) {
      throw new BadRequestException(`Вопрос: от ${QUESTION_MIN} до ${QUESTION_MAX} символов`);
    }
    if (cleanAnswer.length < ANSWER_MIN || cleanAnswer.length > ANSWER_MAX) {
      throw new BadRequestException(`Ответ: от ${ANSWER_MIN} до ${ANSWER_MAX} символов`);
    }
    return { question: cleanQuestion, answer: cleanAnswer };
  }
}
