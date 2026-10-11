import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const MEMBERS = [
  {
    name: 'Максим',
    role: 'Владелец · мастер',
    spec: 'Принимает машину, считает смету, отвечает за гарантию',
    photo: '/master/portrait.webp',
    photoAlt: 'Максим за стойкой приёмки',
  },
  {
    name: 'Сергей',
    role: 'Мастер-моторист',
    spec: 'Двигатели, ГРМ, система охлаждения',
    photo: '/master/master2.webp',
    photoAlt: 'Сергей за работой в моторном отсеке',
  },
  {
    name: 'Андрей',
    role: 'Механик',
    spec: 'ТО, расходники, шиномонтаж',
    photo: '/master/master3.webp',
    photoAlt: 'Андрей в шиномонтажном цеху',
  },
];

async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.teamMember.count();
    if (existing > 0) {
      console.info(`Команда уже заполнена (${existing}), сид пропущен`);
      return;
    }

    await prisma.teamMember.createMany({
      data: MEMBERS.map((member, index) => ({ ...member, position: index })),
    });
    console.info(`Добавлено участников: ${MEMBERS.length}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
