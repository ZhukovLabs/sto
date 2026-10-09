import { NextResponse } from 'next/server';
import { API_URL } from '@/shared/config/api';

/** Названия активных услуг для диалога записи. */
export async function GET(): Promise<NextResponse> {
  try {
    const response = await fetch(`${API_URL}/services/catalog`, { next: { tags: ['services'] } });
    if (!response.ok) {
      return NextResponse.json({ message: 'Не удалось загрузить услуги' }, { status: 502 });
    }
    const data = (await response.json()) as {
      groups: { services: { title: string }[] }[];
    };
    const titles = data.groups.flatMap((group) => group.services.map((service) => service.title));
    return NextResponse.json(titles);
  } catch {
    return NextResponse.json({ message: 'Не удалось загрузить услуги' }, { status: 502 });
  }
}
