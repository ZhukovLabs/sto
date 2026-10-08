import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3002';

export async function GET(): Promise<NextResponse> {
  const response = await fetch(`${API_URL}/bookings/dates`, { cache: 'no-store' });
  if (!response.ok) {
    return NextResponse.json({ message: 'Не удалось загрузить доступные дни' }, { status: 502 });
  }
  return NextResponse.json(await response.json());
}
