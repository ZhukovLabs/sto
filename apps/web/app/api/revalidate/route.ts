import { createHash, timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

function secretMatches(candidate: unknown, secret: string): boolean {
  if (typeof candidate !== 'string' || candidate.length === 0) {
    return false;
  }
  const a = createHash('sha256').update(candidate).digest();
  const b = createHash('sha256').update(secret).digest();
  return timingSafeEqual(a, b);
}

/** Вебхук @sto/api: сбрасывает кэш каталога услуг и команды после изменений в админке. */
export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.REVALIDATE_SECRET;
  const body = (await request.json().catch(() => null)) as { secret?: unknown } | null;
  if (typeof secret !== 'string' || secret.length === 0 || !secretMatches(body?.secret, secret)) {
    return NextResponse.json({ message: 'Недостаточно прав' }, { status: 401 });
  }
  revalidateTag('services', 'minutes');
  revalidateTag('team', 'minutes');
  revalidateTag('site-settings', 'minutes');
  revalidateTag('faq', 'minutes');
  revalidateTag('news', 'minutes');
  return NextResponse.json({ revalidated: true });
}
