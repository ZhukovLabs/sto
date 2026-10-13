import { NextResponse, type NextRequest } from 'next/server';
import { ApiError, SESSION_COOKIE, apiCreateNews, apiListNews } from '@/lib/api';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  try {
    const items = await apiListNews(token);
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить новости';
    return NextResponse.json({ message }, { status: 502 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  if (title.length < 5 || title.length > 200) {
    return NextResponse.json({ message: 'Заголовок: от 5 до 200 символов' }, { status: 400 });
  }
  if (content.length < 5 || content.length > 50000) {
    return NextResponse.json({ message: 'Текст новости: от 5 до 50000 символов' }, { status: 400 });
  }
  const input: {
    title: string;
    content: string;
    excerpt?: string;
    cover?: string | null;
    isPublished?: boolean;
    slug?: string;
  } = { title, content };
  if (typeof body?.excerpt === 'string' && body.excerpt.trim() !== '') {
    input.excerpt = body.excerpt.trim();
  }
  if (typeof body?.cover === 'string' && body.cover.startsWith('/uploads/')) {
    input.cover = body.cover;
  }
  if (typeof body?.isPublished === 'boolean') {
    input.isPublished = body.isPublished;
  }
  if (typeof body?.slug === 'string' && body.slug.trim() !== '') {
    input.slug = body.slug;
  }
  try {
    const item = await apiCreateNews(token, input);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось создать новость';
    return NextResponse.json({ message }, { status });
  }
}
