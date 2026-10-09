import { NextResponse, type NextRequest } from 'next/server';
import { API_URL } from '@/shared/config/api';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const date = request.nextUrl.searchParams.get('date') ?? '';
  const response = await fetch(`${API_URL}/bookings/slots?date=${encodeURIComponent(date)}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    return NextResponse.json({ message: 'Не удалось загрузить свободное время' }, { status: 502 });
  }
  return NextResponse.json(await response.json());
}
