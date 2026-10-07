export interface Service {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceFrom: number;
  priceTo?: number;
  unit?: string;
  popular?: boolean;
  /** Путь к фото-подложке карточки в public, напр. '/services/brakes.webp' */
  photo?: string;
}
