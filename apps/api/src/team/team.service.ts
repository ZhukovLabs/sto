import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { notifyWebRevalidate } from '../web-revalidate';
import { deleteUploadByUrl } from '../uploads/storage';
import { isPrismaErrorCode } from '../prisma-errors';

export interface TeamMemberView {
  id: string;
  name: string;
  role: string;
  spec: string;
  photo: string | null;
  photoAlt: string | null;
  position: number;
  isActive: boolean;
}

const NAME_MAX = 80;
const ROLE_MAX = 120;
const SPEC_MAX = 300;
const PHOTO_ALT_MAX = 200;

function toStringValue(value: unknown, max: number, field: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new BadRequestException(`${field} — строка до ${max} знаков`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed.length > max) {
    throw new BadRequestException(`${field} — строка до ${max} знаков`);
  }
  return trimmed;
}

function toRequiredString(value: unknown, max: number, field: string): string {
  const parsed = toStringValue(value, max, field);
  if (parsed === null) {
    throw new BadRequestException(`${field} — обязательная непустая строка до ${max} знаков`);
  }
  return parsed;
}

function parsePhoto(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value !== 'string' || value.length > 300 || !/^\/[\w\-./]+$/.test(value)) {
    throw new BadRequestException('photo — путь вида /uploads/… или /master/…');
  }
  return value;
}

function toView(member: {
  id: string;
  name: string;
  role: string;
  spec: string;
  photo: string | null;
  photoAlt: string | null;
  position: number;
  isActive: boolean;
}): TeamMemberView {
  return {
    id: member.id,
    name: member.name,
    role: member.role,
    spec: member.spec,
    photo: member.photo,
    photoAlt: member.photoAlt,
    position: member.position,
    isActive: member.isActive,
  };
}

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  /** Публичный список для сайта: только активные, по порядку. */
  async listPublic(): Promise<TeamMemberView[]> {
    const members = await this.prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    return members.map(toView);
  }

  /** Полный список для админки. */
  async listAll(): Promise<TeamMemberView[]> {
    const members = await this.prisma.teamMember.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    return members.map(toView);
  }

  async create(body: Record<string, unknown>): Promise<TeamMemberView> {
    const name = toRequiredString(body.name, NAME_MAX, 'name');
    const role = toRequiredString(body.role, ROLE_MAX, 'role');
    const spec = toRequiredString(body.spec, SPEC_MAX, 'spec');
    const photo = parsePhoto(body.photo);
    const photoAlt = toStringValue(body.photoAlt, PHOTO_ALT_MAX, 'photoAlt');
    const last = await this.prisma.teamMember.findFirst({
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const member = await this.prisma.teamMember.create({
      data: { name, role, spec, photo, photoAlt, position: (last?.position ?? -1) + 1 },
    });
    notifyWebRevalidate();
    return toView(member);
  }

  async update(id: string, body: Record<string, unknown>): Promise<TeamMemberView> {
    const existing = await this.prisma.teamMember.findUnique({ where: { id } });
    if (existing === null) {
      throw new NotFoundException('Участник команды не найден');
    }
    const data: {
      name?: string;
      role?: string;
      spec?: string;
      photo?: string | null;
      photoAlt?: string | null;
      isActive?: boolean;
    } = {};
    if (body.name !== undefined) {
      data.name = toRequiredString(body.name, NAME_MAX, 'name');
    }
    if (body.role !== undefined) {
      data.role = toRequiredString(body.role, ROLE_MAX, 'role');
    }
    if (body.spec !== undefined) {
      data.spec = toRequiredString(body.spec, SPEC_MAX, 'spec');
    }
    let photoToDelete: string | null = null;
    if (body.photo !== undefined) {
      data.photo = parsePhoto(body.photo);
      if (existing.photo !== null && existing.photo !== data.photo) {
        photoToDelete = existing.photo;
      }
    }
    if (body.photoAlt !== undefined) {
      data.photoAlt = toStringValue(body.photoAlt, PHOTO_ALT_MAX, 'photoAlt');
    }
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') {
        throw new BadRequestException('isActive — boolean');
      }
      data.isActive = body.isActive;
    }
    try {
      const member = await this.prisma.teamMember.update({ where: { id }, data });
      deleteUploadByUrl(photoToDelete);
      notifyWebRevalidate();
      return toView(member);
    } catch (error) {
      if (isPrismaErrorCode(error, 'P2025')) {
        throw new NotFoundException('Участник команды не найден');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.teamMember.findUnique({
      where: { id },
      select: { photo: true },
    });
    if (existing === null) {
      throw new NotFoundException('Участник команды не найден');
    }
    try {
      await this.prisma.teamMember.delete({ where: { id } });
    } catch (error) {
      if (isPrismaErrorCode(error, 'P2025')) {
        throw new NotFoundException('Участник команды не найден');
      }
      throw error;
    }
    deleteUploadByUrl(existing.photo);
    notifyWebRevalidate();
  }

  async reorder(body: Record<string, unknown>): Promise<void> {
    if (!Array.isArray(body.ids) || body.ids.some((id) => typeof id !== 'string')) {
      throw new BadRequestException('ids — массив строк');
    }
    const ids = body.ids as string[];
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('id не должны повторяться');
    }
    if (ids.length === 0) {
      return;
    }
    await this.prisma.$transaction(async (tx) => {
      const count = await tx.teamMember.count({ where: { id: { in: ids } } });
      if (count !== ids.length) {
        throw new BadRequestException('Список содержит неизвестных участников');
      }
      for (const [position, id] of ids.entries()) {
        await tx.teamMember.update({ where: { id }, data: { position } });
      }
    });
    notifyWebRevalidate();
  }
}
