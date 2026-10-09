import { NextResponse } from 'next/server';
import { API_URL } from '@/shared/config/api';

export async function GET(): Promise<NextResponse> {
  const response = await fetch(`${API_URL}/bookings/dates`, { cache: 'no-store' });
  if (!response.ok) {
    return NextResponse.json({ message: 'Не удалось загрузить доступные дни' }, { status: 502 });
  }
  return NextResponse.json(await response.json());
}
