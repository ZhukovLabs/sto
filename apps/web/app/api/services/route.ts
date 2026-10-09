import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3002';

/** Названия активных услуг для диалога записи. */
export async function GET(): Promise<NextResponse> {
  const response = await fetch(`${API_URL}/services/catalog`, { next: { tags: ['services'] } });
  if (!response.ok) {
    return NextResponse.json({ message: 'Не удалось загрузить услуги' }, { status: 502 });
  }
  const data = (await response.json()) as {
    groups: { services: { title: string }[] }[];
  };
  const titles = data.groups.flatMap((group) => group.services.map((service) => service.title));
  return NextResponse.json(titles);
}
