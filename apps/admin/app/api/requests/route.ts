import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, apiListRequests } from '@/lib/api';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  try {
    const requests = await apiListRequests(token);
    return NextResponse.json(requests);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить заявки';
    return NextResponse.json({ message }, { status: 502 });
  }
}
