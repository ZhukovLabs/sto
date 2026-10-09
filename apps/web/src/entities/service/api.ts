import type { Service, ServiceGroup, ShowcaseSlot } from './model/types';
import { API_URL } from '@/shared/config/api';

export interface CatalogGroup extends ServiceGroup {
  services: Service[];
}

export interface ServiceCatalogData {
  groups: CatalogGroup[];
  showcase: ShowcaseSlot[];
}

/**
 * Каталог услуг из @sto/api для серверных компонентов.
 * Кэшируется с тегом services — сбрасывается вебхуком /api/revalidate.
 * При недоступном API возвращает null (например, сборка в CI без бэкенда).
 */
export async function getServiceCatalog(): Promise<ServiceCatalogData | null> {
  try {
    const response = await fetch(`${API_URL}/services/catalog`, {
      next: { tags: ['services'], revalidate: 3600 },
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as ServiceCatalogData;
  } catch {
    return null;
  }
}

/** Список названий активных услуг для диалога записи (клиентский fetch). */
export async function fetchServiceTitles(): Promise<string[]> {
  const response = await fetch('/api/services');
  if (!response.ok) {
    throw new Error('Не удалось загрузить список услуг');
  }
  const titles = (await response.json()) as string[];
  return [...titles, 'Другое'];
}
