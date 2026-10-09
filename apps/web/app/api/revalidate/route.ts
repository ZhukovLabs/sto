import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

/** Вебхук @sto/api: сбрасывает кэш каталога услуг после изменений в админке. */
export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.REVALIDATE_SECRET;
  const body = (await request.json().catch(() => null)) as { secret?: unknown } | null;
  if (typeof secret !== 'string' || secret.length === 0 || body?.secret !== secret) {
    return NextResponse.json({ message: 'Недостаточно прав' }, { status: 401 });
  }
  revalidateTag('services', 'minutes');
  return NextResponse.json({ revalidated: true });
}
