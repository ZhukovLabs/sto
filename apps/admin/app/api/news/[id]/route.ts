import { NextResponse, type NextRequest } from 'next/server';
import { ApiError, SESSION_COOKIE, apiDeleteNews, apiUpdateNews } from '@/lib/api';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const patch: {
    title?: string;
    content?: string;
    excerpt?: string | null;
    cover?: string | null;
    isPublished?: boolean;
    slug?: string;
  } = {};
  if (body?.title !== undefined) {
    if (typeof body.title !== 'string') {
      return NextResponse.json({ message: 'Некорректный заголовок' }, { status: 400 });
    }
    const title = body.title.trim();
    if (title.length < 5 || title.length > 200) {
      return NextResponse.json({ message: 'Заголовок: от 5 до 200 символов' }, { status: 400 });
    }
    patch.title = title;
  }
  if (body?.content !== undefined) {
    if (typeof body.content !== 'string') {
      return NextResponse.json({ message: 'Некорректный текст' }, { status: 400 });
    }
    const content = body.content.trim();
    if (content.length < 5 || content.length > 50000) {
      return NextResponse.json(
        { message: 'Текст новости: от 5 до 50000 символов' },
        { status: 400 },
      );
    }
    patch.content = content;
  }
  if (body?.excerpt !== undefined) {
    if (body.excerpt === null || body.excerpt === '') {
      patch.excerpt = null;
    } else if (typeof body.excerpt === 'string') {
      patch.excerpt = body.excerpt.trim();
    }
  }
  if (body?.cover !== undefined) {
    if (body.cover === null || body.cover === '') {
      patch.cover = null;
    } else if (typeof body.cover === 'string' && body.cover.startsWith('/uploads/')) {
      patch.cover = body.cover;
    } else {
      return NextResponse.json({ message: 'Обложка — путь вида /uploads/…' }, { status: 400 });
    }
  }
  if (typeof body?.isPublished === 'boolean') {
    patch.isPublished = body.isPublished;
  }
  if (body?.slug !== undefined && typeof body.slug === 'string' && body.slug.trim() !== '') {
    patch.slug = body.slug;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ message: 'Нечего обновлять' }, { status: 400 });
  }
  try {
    const item = await apiUpdateNews(token, id, patch);
    return NextResponse.json(item);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось обновить новость';
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    await apiDeleteNews(token, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось удалить новость';
    return NextResponse.json({ message }, { status });
  }
}
