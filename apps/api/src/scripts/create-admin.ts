import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { hashPassword } from '../auth/password';

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email === undefined || email === '') {
    throw new Error('ADMIN_EMAIL не задан');
  }
  if (password === undefined || password.length < 8) {
    throw new Error('ADMIN_PASSWORD не задан или короче 8 символов');
  }
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash, name: 'Администратор', role: 'admin' },
    });
    console.info(`Администратор готов: ${user.email} (id: ${user.id})`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
