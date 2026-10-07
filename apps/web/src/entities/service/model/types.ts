export interface Service {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceFrom: number;
  priceTo?: number;
  unit?: string;
  fixed?: boolean;
  popular?: boolean;
}
