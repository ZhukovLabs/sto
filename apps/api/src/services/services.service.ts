import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { notifyWebRevalidate } from '../web-revalidate';
import { SLUG_PATTERN, slugify } from './slug';
import { deleteUploadByUrl } from '../uploads/storage';
import type { Prisma } from '../generated/prisma/client';

export const SERVICE_UNITS = ['wheel', 'pcs', 'season'] as const;
export type ServiceUnit = (typeof SERVICE_UNITS)[number];

export const GROUP_ICONS = [
  'scan',
  'wrench',
  'disc',
  'cog',
  'gauge',
  'circle',
  'snowflake',
] as const;
export type GroupIcon = (typeof GROUP_ICONS)[number];

export const SHOWCASE_SIZE = 8;

const TITLE_PATTERN = /^.{2,120}$/s;
const DESCRIPTION_PATTERN = /^.{0,300}$/s;
const ID_PATTERN = /^[A-Za-z0-9-]{2,60}$/;

export interface ServiceView {
  id: string;
  groupId: string;
  title: string;
  description: string;
  priceFrom: number;
  priceTo: number | null;
  unit: ServiceUnit | null;
  photo: string | null;
  position: number;
  isActive: boolean;
}

export interface ServiceGroupView {
  id: string;
  title: string;
  icon: GroupIcon | null;
  photo: string | null;
  position: number;
  isActive: boolean;
  services: ServiceView[];
}

export interface ShowcaseSlotView {
  serviceId: string;
  position: number;
}

export interface CatalogView {
  groups: ServiceGroupView[];
  showcase: ShowcaseSlotView[];
}

function assertTitle(value: unknown, field = 'title'): asserts value is string {
  if (typeof value !== 'string' || !TITLE_PATTERN.test(value)) {
    throw new BadRequestException(`${field} — от 2 до 120 символов`);
  }
}

function assertDescription(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !DESCRIPTION_PATTERN.test(value)) {
    throw new BadRequestException('description — до 300 символов');
  }
}

function assertPriceFrom(value: unknown): asserts value is number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 100000) {
    throw new BadRequestException('priceFrom — целое от 0 до 100000');
  }
}

function parsePriceTo(value: unknown, priceFrom: number): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > 100000 ||
    value < priceFrom
  ) {
    throw new BadRequestException('priceTo — целое, не меньше priceFrom');
  }
  return value;
}

function parseUnit(value: unknown): ServiceUnit | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value !== 'string' || !(SERVICE_UNITS as readonly string[]).includes(value)) {
    throw new BadRequestException(`unit — одно из: ${SERVICE_UNITS.join(', ')}`);
  }
  return value as ServiceUnit;
}

function parseIcon(value: unknown): GroupIcon | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value !== 'string' || !(GROUP_ICONS as readonly string[]).includes(value)) {
    throw new BadRequestException(`icon — одно из: ${GROUP_ICONS.join(', ')}`);
  }
  return value as GroupIcon;
}

function parsePhoto(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value !== 'string' || value.length > 300 || !/^\/[\w\-./]+$/.test(value)) {
    throw new BadRequestException('photo — путь вида /uploads/… или /services/…');
  }
  return value;
}

function assertId(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    throw new BadRequestException('id — 2–60 символов: латиница, цифры, дефис');
  }
}

function parseIsActive(value: unknown): boolean {
  if (typeof value !== 'boolean') {
    throw new BadRequestException('isActive — boolean');
  }
  return value;
}

function toServiceView(row: {
  id: string;
  groupId: string;
  title: string;
  description: string;
  priceFrom: number;
  priceTo: number | null;
  unit: string | null;
  photo: string | null;
  position: number;
  isActive: boolean;
}): ServiceView {
  return {
    id: row.id,
    groupId: row.groupId,
    title: row.title,
    description: row.description,
    priceFrom: row.priceFrom,
    priceTo: row.priceTo,
    unit: (row.unit as ServiceUnit | null) ?? null,
    photo: row.photo,
    position: row.position,
    isActive: row.isActive,
  };
}

function toGroupView(
  row: {
    id: string;
    title: string;
    icon: string | null;
    photo: string | null;
    position: number;
    isActive: boolean;
  },
  services: ServiceView[],
): ServiceGroupView {
  return {
    id: row.id,
    title: row.title,
    icon: (row.icon as GroupIcon | null) ?? null,
    photo: row.photo,
    position: row.position,
    isActive: row.isActive,
    services,
  };
}

type ServiceCreate = {
  groupId: string;
  title: string;
  description: string;
  priceFrom: number;
  priceTo: number | null;
  unit: ServiceUnit | null;
  photo: string | null;
};

type ServicePatch = Partial<ServiceCreate & { isActive: boolean }>;

type GroupCreate = {
  title: string;
  icon: GroupIcon | null;
  photo: string | null;
};

type GroupPatch = Partial<GroupCreate & { isActive: boolean }>;

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async catalog(onlyActive: boolean): Promise<CatalogView> {
    const [groupRows, slotRows] = await Promise.all([
      this.prisma.serviceGroup.findMany({
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        include: {
          services: {
            orderBy: [{ position: 'asc' }, { id: 'asc' }],
            where: onlyActive ? { isActive: true } : undefined,
          },
        },
      }),
      this.prisma.showcaseSlot.findMany({
        orderBy: { position: 'asc' },
        select: { serviceId: true, position: true },
      }),
    ]);
    const groups = groupRows
      .filter((group) => !onlyActive || group.isActive)
      .map((group) => toGroupView(group, group.services.map(toServiceView)));
    return { groups, showcase: slotRows };
  }

  async createGroup(body: Record<string, unknown>): Promise<ServiceGroupView> {
    assertTitle(body.title);
    const data: GroupCreate = {
      title: body.title,
      icon: parseIcon(body.icon),
      photo: parsePhoto(body.photo),
    };
    const last = await this.prisma.serviceGroup.findFirst({ orderBy: { position: 'desc' } });
    const id = await this.uniqueId(
      typeof body.id === 'string' && body.id.length > 0 ? body.id : slugify(data.title),
      (candidate) => this.prisma.serviceGroup.findUnique({ where: { id: candidate } }),
    );
    const group = await this.prisma.serviceGroup.create({
      data: { id, ...data, position: (last?.position ?? -1) + 1 },
    });
    notifyWebRevalidate();
    return toGroupView(group, []);
  }

  async updateGroup(id: string, body: Record<string, unknown>): Promise<ServiceGroupView> {
    assertId(id);
    const existing = await this.prisma.serviceGroup.findUnique({ where: { id } });
    if (existing === null) {
      throw new NotFoundException('Группа не найдена');
    }
    const patch: GroupPatch = {};
    let photoToDelete: string | null = null;
    if (body.title !== undefined) {
      assertTitle(body.title);
      patch.title = body.title;
    }
    if (body.icon !== undefined) {
      patch.icon = parseIcon(body.icon);
    }
    if (body.photo !== undefined) {
      patch.photo = parsePhoto(body.photo);
      if (existing.photo !== null && existing.photo !== patch.photo) {
        photoToDelete = existing.photo;
      }
    }
    if (body.isActive !== undefined) {
      patch.isActive = parseIsActive(body.isActive);
    }
    const group = await this.prisma.serviceGroup.update({ where: { id }, data: patch });
    deleteUploadByUrl(photoToDelete);
    notifyWebRevalidate();
    const services = await this.prisma.service.findMany({
      where: { groupId: id },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });
    return toGroupView(group, services.map(toServiceView));
  }

  async deleteGroup(id: string): Promise<void> {
    assertId(id);
    const existing = await this.prisma.serviceGroup.findUnique({
      where: { id },
      include: { services: { select: { photo: true } } },
    });
    if (existing === null) {
      throw new NotFoundException('Группа не найдена');
    }
    await this.prisma.serviceGroup.delete({ where: { id } });
    deleteUploadByUrl(existing.photo);
    for (const service of existing.services) {
      deleteUploadByUrl(service.photo);
    }
    notifyWebRevalidate();
  }

  async reorderGroups(body: Record<string, unknown>): Promise<void> {
    const ids = parseIdList(body.ids);
    const groups = await this.prisma.serviceGroup.findMany({ select: { id: true } });
    const known = new Set(groups.map((group) => group.id));
    for (const id of ids) {
      if (!known.has(id)) {
        throw new BadRequestException(`Группа ${id} не найдена`);
      }
    }
    await this.applyOrder(ids, (tx, id, position) =>
      tx.serviceGroup.update({ where: { id }, data: { position } }),
    );
    notifyWebRevalidate();
  }

  async createService(body: Record<string, unknown>): Promise<ServiceView> {
    assertTitle(body.title);
    assertDescription(body.description);
    assertPriceFrom(body.priceFrom);
    const data: ServiceCreate = {
      groupId: await this.requireGroup(body.groupId),
      title: body.title,
      description: body.description,
      priceFrom: body.priceFrom,
      priceTo: parsePriceTo(body.priceTo, body.priceFrom),
      unit: parseUnit(body.unit),
      photo: parsePhoto(body.photo),
    };
    const last = await this.prisma.service.findFirst({
      where: { groupId: data.groupId },
      orderBy: { position: 'desc' },
    });
    const id = await this.uniqueId(
      typeof body.id === 'string' && body.id.length > 0 ? body.id : slugify(data.title),
      (candidate) => this.prisma.service.findUnique({ where: { id: candidate } }),
    );
    const service = await this.prisma.service.create({
      data: { id, ...data, position: (last?.position ?? -1) + 1 },
    });
    notifyWebRevalidate();
    return toServiceView(service);
  }

  async updateService(id: string, body: Record<string, unknown>): Promise<ServiceView> {
    assertId(id);
    const existing = await this.prisma.service.findUnique({ where: { id } });
    if (existing === null) {
      throw new NotFoundException('Услуга не найдена');
    }
    const patch: ServicePatch = {};
    let photoToDelete: string | null = null;
    if (body.title !== undefined) {
      assertTitle(body.title);
      patch.title = body.title;
    }
    if (body.description !== undefined) {
      assertDescription(body.description);
      patch.description = body.description;
    }
    if (body.priceFrom !== undefined) {
      assertPriceFrom(body.priceFrom);
      patch.priceFrom = body.priceFrom;
    }
    const priceFrom = patch.priceFrom ?? existing.priceFrom;
    if (body.priceTo !== undefined) {
      patch.priceTo = parsePriceTo(body.priceTo, priceFrom);
    }
    if (body.unit !== undefined) {
      patch.unit = parseUnit(body.unit);
    }
    if (body.photo !== undefined) {
      patch.photo = parsePhoto(body.photo);
      if (existing.photo !== null && existing.photo !== patch.photo) {
        photoToDelete = existing.photo;
      }
    }
    if (body.groupId !== undefined) {
      patch.groupId = await this.requireGroup(body.groupId);
    }
    if (body.isActive !== undefined) {
      patch.isActive = parseIsActive(body.isActive);
    }
    const service = await this.prisma.service.update({ where: { id }, data: patch });
    deleteUploadByUrl(photoToDelete);
    notifyWebRevalidate();
    return toServiceView(service);
  }

  async deleteService(id: string): Promise<void> {
    assertId(id);
    const existing = await this.prisma.service.findUnique({ where: { id } });
    if (existing === null) {
      throw new NotFoundException('Услуга не найдена');
    }
    await this.prisma.service.delete({ where: { id } });
    deleteUploadByUrl(existing.photo);
    notifyWebRevalidate();
  }

  async reorderServices(body: Record<string, unknown>): Promise<void> {
    const groupId = await this.requireGroup(body.groupId);
    const ids = parseIdList(body.ids);
    const services = await this.prisma.service.findMany({
      where: { groupId },
      select: { id: true },
    });
    const known = new Set(services.map((service) => service.id));
    for (const id of ids) {
      if (!known.has(id)) {
        throw new BadRequestException(`Услуга ${id} не входит в группу ${groupId}`);
      }
    }
    await this.applyOrder(ids, (tx, id, position) =>
      tx.service.update({ where: { id }, data: { position } }),
    );
    notifyWebRevalidate();
  }

  async updateShowcase(body: Record<string, unknown>): Promise<ShowcaseSlotView[]> {
    const ids = parseIdList(body.serviceIds);
    if (ids.length !== SHOWCASE_SIZE) {
      throw new BadRequestException(`Витрина — ровно ${SHOWCASE_SIZE} услуг`);
    }
    const services = await this.prisma.service.findMany({
      where: { id: { in: ids }, isActive: true },
      select: { id: true },
    });
    const active = new Set(services.map((service) => service.id));
    const missing = ids.filter((id) => !active.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(`Неактивные или несуществующие услуги: ${missing.join(', ')}`);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.showcaseSlot.deleteMany({});
      await tx.showcaseSlot.createMany({
        data: ids.map((serviceId, position) => ({ serviceId, position })),
      });
    });
    notifyWebRevalidate();
    return ids.map((serviceId, position) => ({ serviceId, position }));
  }

  private async requireGroup(value: unknown): Promise<string> {
    if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
      throw new BadRequestException('groupId — id группы (2–60: латиница, цифры, дефис)');
    }
    const group = await this.prisma.serviceGroup.findUnique({ where: { id: value } });
    if (group === null) {
      throw new BadRequestException(`Группа ${value} не найдена`);
    }
    return value;
  }

  private async uniqueId(
    desired: string,
    exists: (id: string) => Promise<{ id: string } | null>,
  ): Promise<string> {
    if (!SLUG_PATTERN.test(desired)) {
      throw new BadRequestException('id — 2–60 строчных латинских символов, цифр и дефисов');
    }
    let candidate = desired;
    let suffix = 1;
    while ((await exists(candidate)) !== null) {
      suffix += 1;
      candidate = `${desired}-${suffix}`;
    }
    return candidate;
  }

  private async applyOrder(
    ids: string[],
    update: (tx: Prisma.TransactionClient, id: string, position: number) => Promise<unknown>,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const [position, id] of ids.entries()) {
        await update(tx, id, position);
      }
    });
  }
}

function parseIdList(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new BadRequestException('Ожидается массив id');
  }
  const ids = value as string[];
  if (new Set(ids).size !== ids.length) {
    throw new BadRequestException('id не должны повторяться');
  }
  return ids;
}
