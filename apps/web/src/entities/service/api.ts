import { SERVICES } from './model/mocks';
import type { Service } from './model/types';

/**
 * Слой доступа к данным услуг. Пока возвращает моки —
 * при появлении эндпоинта в @sto/api заменить тело на fetch с revalidate.
 */
export async function getServices(): Promise<Service[]> {
  return SERVICES;
}
