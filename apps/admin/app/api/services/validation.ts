import {
  GROUP_ICONS,
  SERVICE_UNITS,
  type GroupInput,
  type ServiceInput,
  type ServiceUnit,
} from '@/lib/api';

export type InputResult<T> = { ok: true; input: T } | { ok: false; message: string };

const PHOTO_PATTERN = /^\/(uploads|services|master)\/[\w./-]+$/;

function readText(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() : null;
}

function readNullableText(value: unknown): string | null {
  const text = readText(value);
  return text !== '' ? text : null;
}

/** undefined = поля нет, null = осознанный сброс. */
function readPhoto(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }
  const photo = value.trim();
  return PHOTO_PATTERN.test(photo) ? photo : undefined;
}

/**
 * Валидация услуги: partial=false для POST (обязательные поля нужны),
 * partial=true для PATCH (проверяем только присутствующие поля).
 */
export function readServiceInput(
  body: Record<string, unknown>,
  partial = false,
): InputResult<ServiceInput | Partial<ServiceInput>> {
  const patch: Partial<ServiceInput> = {};

  if (body.title !== undefined) {
    const title = readText(body.title);
    if (title === null || title.length < 2 || title.length > 200) {
      return { ok: false, message: 'Название: от 2 до 200 знаков' };
    }
    patch.title = title;
  } else if (!partial) {
    return { ok: false, message: 'Название обязательно' };
  }

  if (body.description !== undefined) {
    const description = readText(body.description);
    if (description === null || description.length < 2 || description.length > 2000) {
      return { ok: false, message: 'Описание: от 2 до 2000 знаков' };
    }
    patch.description = description;
  } else if (!partial) {
    return { ok: false, message: 'Описание обязательно' };
  }

  if (body.priceFrom !== undefined) {
    if (
      typeof body.priceFrom !== 'number' ||
      !Number.isFinite(body.priceFrom) ||
      body.priceFrom < 0
    ) {
      return { ok: false, message: 'Цена «от»: неотрицательное число' };
    }
    patch.priceFrom = body.priceFrom;
  } else if (!partial) {
    return { ok: false, message: 'Цена «от» обязательна' };
  }

  if (body.priceTo !== undefined) {
    if (body.priceTo === null) {
      patch.priceTo = null;
    } else if (
      typeof body.priceTo !== 'number' ||
      !Number.isFinite(body.priceTo) ||
      body.priceTo < (patch.priceFrom ?? 0)
    ) {
      return { ok: false, message: 'Цена «до»: число не меньше цены «от»' };
    } else {
      patch.priceTo = body.priceTo;
    }
  }

  if (body.unit !== undefined) {
    if (body.unit === null) {
      patch.unit = null;
    } else if (typeof body.unit !== 'string' || !SERVICE_UNITS.includes(body.unit as ServiceUnit)) {
      return { ok: false, message: 'Единица измерения: wheel, pcs или season' };
    } else {
      patch.unit = body.unit as ServiceUnit;
    }
  }

  if (body.groupId !== undefined) {
    const groupId = readText(body.groupId);
    if (groupId === null || groupId === '') {
      return { ok: false, message: 'Группа обязательна' };
    }
    patch.groupId = groupId;
  } else if (!partial) {
    return { ok: false, message: 'Группа обязательна' };
  }

  if (body.details !== undefined) {
    patch.details = readNullableText(body.details);
  }
  if (body.photo !== undefined) {
    const photo = readPhoto(body.photo);
    if (photo !== undefined) {
      patch.photo = photo;
    }
  }
  if (typeof body.isActive === 'boolean') {
    patch.isActive = body.isActive;
  }

  return { ok: true, input: patch };
}

/** Валидация группы услуг; partial=true для PATCH. */
export function readGroupInput(
  body: Record<string, unknown>,
  partial = false,
): InputResult<GroupInput | Partial<GroupInput>> {
  const patch: Partial<GroupInput> = {};

  if (body.title !== undefined) {
    const title = readText(body.title);
    if (title === null || title.length < 2 || title.length > 120) {
      return { ok: false, message: 'Название группы: от 2 до 120 знаков' };
    }
    patch.title = title;
  } else if (!partial) {
    return { ok: false, message: 'Название группы обязательно' };
  }

  if (body.icon !== undefined) {
    if (body.icon === null) {
      patch.icon = null;
    } else if (
      typeof body.icon !== 'string' ||
      !(GROUP_ICONS as readonly string[]).includes(body.icon)
    ) {
      return { ok: false, message: 'Неизвестная иконка группы' };
    } else {
      patch.icon = body.icon as GroupInput['icon'];
    }
  }

  if (body.photo !== undefined) {
    const photo = readPhoto(body.photo);
    if (photo !== undefined) {
      patch.photo = photo;
    }
  }
  if (typeof body.isActive === 'boolean') {
    patch.isActive = body.isActive;
  }

  return { ok: true, input: patch };
}
