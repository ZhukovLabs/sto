import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const GROUPS: Array<{
  id: string;
  title: string;
  icon: string;
  photo: string;
  services: Array<{
    id: string;
    title: string;
    description: string;
    priceFrom: number;
    priceTo?: number;
    unit?: 'wheel' | 'pcs' | 'season';
    photo?: string;
  }>;
}> = [
  {
    id: 'diagnostics',
    title: 'Диагностика',
    icon: 'scan',
    photo: '/services/diag.webp',
    services: [
      {
        id: 'diagnostics',
        title: 'Компьютерная диагностика',
        description: 'Находим причину, а не продаём лишнее',
        priceFrom: 10,
        photo: '/services/diag.webp',
      },
      {
        id: 'diagnostika-podveski',
        title: 'Диагностика подвески',
        description: 'На подъёмнике, с показом каждого узла. Первым 20 — бесплатно.',
        priceFrom: 0,
        photo: '/services/diag.webp',
      },
      {
        id: 'diagnostika-pered-poezdkoj',
        title: 'Диагностика перед дальней поездкой',
        description: 'Полный осмотр за 40 минут, чек-лист на руки.',
        priceFrom: 20,
      },
    ],
  },
  {
    id: 'maintenance',
    title: 'Техобслуживание',
    icon: 'wrench',
    photo: '/services/oil.webp',
    services: [
      {
        id: 'zamena-masla',
        title: 'Замена масла и фильтров',
        description: 'Масло по каталогу вашего авто.',
        priceFrom: 15,
        priceTo: 20,
        photo: '/services/oil.webp',
      },
      {
        id: 'zamena-svechej',
        title: 'Замена свечей зажигания',
        description: 'Проверим зазоры и состояние катушек.',
        priceFrom: 12,
      },
      {
        id: 'zamena-filtrov',
        title: 'Замена воздушного и салонного фильтров',
        description: 'Быстро, без разборки половины торпедо.',
        priceFrom: 8,
      },
      {
        id: 'to-po-reglamentu',
        title: 'ТО по регламенту (комплекс)',
        description: 'Масло, фильтры и осмотр по карте ТО.',
        priceFrom: 120,
      },
    ],
  },
  {
    id: 'brakes',
    title: 'Тормозная система',
    icon: 'disc',
    photo: '/services/brakes.webp',
    services: [
      {
        id: 'kolodki',
        title: 'Замена колодок и дисков',
        description: 'Покажем износ — решаете вы.',
        priceFrom: 15,
        photo: '/services/brakes.webp',
      },
      {
        id: 'tormoznye-diski',
        title: 'Замена тормозных дисков',
        description: 'Комплект на ось, с проверкой биения.',
        priceFrom: 30,
      },
      {
        id: 'tormoznaya-zhidkost',
        title: 'Замена тормозной жидкости',
        description: 'С прокачкой всех контуров.',
        priceFrom: 15,
      },
      {
        id: 'reviziya-supportov',
        title: 'Ревизия суппортов',
        description: 'Чистка, смазка направляющих, пыльники.',
        priceFrom: 25,
      },
    ],
  },
  {
    id: 'engine',
    title: 'Двигатель и трансмиссия',
    icon: 'cog',
    photo: '/services/engine.webp',
    services: [
      {
        id: 'remen-grm',
        title: 'Замена ремня ГРМ',
        description: 'По регламенту, с роликами и помпой.',
        priceFrom: 80,
        priceTo: 150,
        photo: '/services/engine.webp',
      },
      {
        id: 'sceplenie',
        title: 'Замена сцепления',
        description: 'Комплект под ваш пробег и стиль.',
        priceFrom: 70,
        priceTo: 180,
        photo: '/services/clutch.webp',
      },
      {
        id: 'zamena-pompy',
        title: 'Замена помпы',
        description: 'Заодно с ремнём ГРМ — дешевле.',
        priceFrom: 40,
      },
      {
        id: 'zamena-opory-dvigatelya',
        title: 'Замена опоры двигателя',
        description: 'Убираем вибрацию на кузове.',
        priceFrom: 35,
      },
      {
        id: 'prokladka-klapannoj-kryshki',
        title: 'Замена прокладки клапанной крышки',
        description: 'Ставим маслостойкую, не «убиваем» болты.',
        priceFrom: 20,
      },
    ],
  },
  {
    id: 'suspension',
    title: 'Подвеска и рулевое',
    icon: 'gauge',
    photo: '/services/align.webp',
    services: [
      {
        id: 'razval-shozdenie',
        title: 'Развал-схождение',
        description: '3D-стенд, распечатка до/после.',
        priceFrom: 20,
        photo: '/services/align.webp',
      },
      {
        id: 'zamena-amortizatorov',
        title: 'Замена амортизаторов и стоек',
        description: 'Со стяжками и проверкой пыльников.',
        priceFrom: 40,
        unit: 'pcs',
      },
      {
        id: 'zamena-rychagov',
        title: 'Замена рычагов подвески',
        description: 'С запрессовкой сайлентблоков.',
        priceFrom: 35,
      },
      {
        id: 'stojki-stabilizatora',
        title: 'Замена стоек стабилизатора',
        description: 'Пара — за час.',
        priceFrom: 12,
      },
      {
        id: 'rulevye-tjagi',
        title: 'Замена рулевых тяг и наконечников',
        description: 'С последующим развал-схождением.',
        priceFrom: 20,
      },
    ],
  },
  {
    id: 'tyres',
    title: 'Шиномонтаж',
    icon: 'circle',
    photo: '/services/tyres.webp',
    services: [
      {
        id: 'shinomontazh',
        title: 'Шиномонтаж',
        description: 'Смена, проколы, хранение.',
        priceFrom: 6,
        unit: 'wheel',
        photo: '/services/tyres.webp',
      },
      {
        id: 'balansirovka',
        title: 'Балансировка колёс',
        description: 'Грузики по весу, проверка на стенде.',
        priceFrom: 4,
        unit: 'wheel',
      },
      {
        id: 'remont-prokola',
        title: 'Ремонт прокола',
        description: 'Жгут или грибок — по типу повреждения.',
        priceFrom: 8,
      },
      {
        id: 'hranenie-shin',
        title: 'Сезонное хранение шин',
        description: 'Сухой склад, напомним о смене.',
        priceFrom: 60,
        unit: 'season',
      },
    ],
  },
  {
    id: 'ac',
    title: 'Кондиционер',
    icon: 'snowflake',
    photo: '/services/ac.webp',
    services: [
      {
        id: 'kondicioner',
        title: 'Заправка и ремонт кондиционера',
        description: 'Ищем утечку, а не заливаем.',
        priceFrom: 100,
        photo: '/services/ac.webp',
      },
      {
        id: 'poisk-utechki-kondicionera',
        title: 'Поиск утечки хладагента',
        description: 'Ультрафиолет и вакуумирование.',
        priceFrom: 25,
      },
      {
        id: 'antibakterialnaya-obrabotka',
        title: 'Антибактериальная обработка системы',
        description: 'Убираем запах за один визит.',
        priceFrom: 45,
      },
    ],
  },
];

const SHOWCASE: string[] = [
  'diagnostics',
  'zamena-masla',
  'kolodki',
  'remen-grm',
  'sceplenie',
  'razval-shozdenie',
  'shinomontazh',
  'kondicioner',
];

async function main(): Promise<void> {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    for (const [groupIndex, group] of GROUPS.entries()) {
      const { services, ...groupFields } = group;
      await prisma.serviceGroup.upsert({
        where: { id: group.id },
        update: { ...groupFields, position: groupIndex },
        create: { ...groupFields, position: groupIndex },
      });
      for (const [serviceIndex, service] of services.entries()) {
        const { id, ...serviceFields } = service;
        await prisma.service.upsert({
          where: { id },
          update: { ...serviceFields, groupId: group.id, position: serviceIndex },
          create: { id, ...serviceFields, groupId: group.id, position: serviceIndex },
        });
      }
    }
    const existing = await prisma.showcaseSlot.findMany({ select: { serviceId: true } });
    const existingIds = new Set(existing.map((slot) => slot.serviceId));
    for (const [position, serviceId] of SHOWCASE.entries()) {
      if (!existingIds.has(serviceId)) {
        await prisma.showcaseSlot.create({ data: { serviceId, position } });
      }
    }
    console.info(
      `Группы: ${GROUPS.length}, услуг: ${GROUPS.reduce((sum, g) => sum + g.services.length, 0)}, витрина: ${SHOWCASE.length}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main();
