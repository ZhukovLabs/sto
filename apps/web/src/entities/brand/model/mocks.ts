import type { Brand } from './types';

const brands: Brand[] = [
  { id: 'renault', name: 'Renault' },
  { id: 'kia', name: 'Kia' },
  { id: 'hyundai', name: 'Hyundai' },
  { id: 'volkswagen', name: 'Volkswagen' },
  { id: 'skoda', name: 'Skoda' },
  { id: 'toyota', name: 'Toyota' },
  { id: 'ford', name: 'Ford' },
  { id: 'nissan', name: 'Nissan' },
];

export function getBrands(): Brand[] {
  return brands;
}
