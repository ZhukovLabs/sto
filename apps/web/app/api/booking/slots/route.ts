import { NextResponse, type NextRequest } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3002';

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
