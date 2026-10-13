import type { SiteCoords } from './types';

/**
 * Ссылка на маршрут в Яндекс.Картах: по точным координатам, если заданы,
 * иначе поиск по адресу. Ведёт от текущего положения пользователя.
 */
export function mapsRouteHref(address: string, coords?: SiteCoords | null): string {
  const target =
    coords !== undefined && coords !== null
      ? `${coords.lat},${coords.lon}`
      : encodeURIComponent(address);
  return `https://yandex.ru/maps/?rtext=~${target}`;
}
