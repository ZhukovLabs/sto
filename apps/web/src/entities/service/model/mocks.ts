import type { Service } from './types';

const services: Service[] = [
  {
    id: 'oil',
    slug: 'zamena-masla',
    title: 'Замена масла и фильтров',
    description: 'Масло по каталогу вашего авто, без «универсального» залитья.',
    priceFrom: 15,
    priceTo: 20,
    popular: true,
  },
  {
    id: 'diagnostics',
    slug: 'diagnostika',
    title: 'Компьютерная диагностика',
    description: 'Считаем ошибки, объясняем на человеческом, печатаем список.',
    priceFrom: 10,
    popular: true,
  },
  {
    id: 'suspension',
    slug: 'diagnostika-podveski',
    title: 'Диагностика подвески',
    description: 'На подъёмнике, с показом каждого узла. Первым 20 — бесплатно.',
    priceFrom: 0,
  },
  {
    id: 'timing',
    slug: 'remen-grm',
    title: 'Замена ремня ГРМ',
    description: 'По регламенту производителя, с заменой роликов и помпы.',
    priceFrom: 80,
    priceTo: 150,
  },
  {
    id: 'clutch',
    slug: 'sceplenie',
    title: 'Замена сцепления',
    description: 'Комплект подбираем под ваш пробег и стиль езды.',
    priceFrom: 70,
    priceTo: 180,
  },
  {
    id: 'brakes',
    slug: 'kolodki',
    title: 'Замена колодок и дисков',
    description: 'Покажем износ старых — решаете вы, а не «надо срочно».',
    priceFrom: 15,
  },
  {
    id: 'alignment',
    slug: 'razval-shozdenie',
    title: 'Развал-схождение',
    description: '3D-стенд, распечатка «до/после» на руки.',
    priceFrom: 20,
  },
  {
    id: 'tyres',
    slug: 'shinomontazh',
    title: 'Шиномонтаж',
    description: 'Сезонная смена, ремонт проколов, хранение.',
    priceFrom: 6,
    unit: 'за колесо',
  },
  {
    id: 'ac',
    slug: 'kondicioner',
    title: 'Заправка и ремонт кондиционера',
    description: 'Диагностика утечки, а не просто «залить и забыть».',
    priceFrom: 100,
  },
];

export function getServices(): Service[] {
  return services;
}
