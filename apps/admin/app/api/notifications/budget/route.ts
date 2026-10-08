import { NextResponse, type NextRequest } from 'next/server';
import { apiGetPaidBudget, SESSION_COOKIE } from '@/lib/api';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token === undefined) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  try {
    const budget = await apiGetPaidBudget(token);
    return NextResponse.json(budget);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось получить дневной лимит';
    return NextResponse.json({ message }, { status: 502 });
  }
}
