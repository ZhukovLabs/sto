import { BRANDS } from './model/mocks';
import type { Brand } from './model/types';

/**
 * Слой доступа к данным марок. Пока возвращает моки —
 * при появлении эндпоинта в @sto/api заменить тело на fetch с revalidate.
 */
export async function getBrands(): Promise<Brand[]> {
  return BRANDS;
}
