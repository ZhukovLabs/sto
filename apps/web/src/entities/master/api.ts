import { MASTER } from './model/mocks';
import type { Master } from './model/types';

/**
 * Слой доступа к данным мастера. Пока возвращает моки —
 * при появлении эндпоинта в @sto/api заменить тело на fetch с revalidate.
 */
export async function getMaster(): Promise<Master> {
  return MASTER;
}
