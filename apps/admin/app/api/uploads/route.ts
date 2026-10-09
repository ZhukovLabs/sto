import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, ApiError, apiUploadPhoto } from '@/lib/api';

const ALLOWED_TYPES = new Set(['image/webp', 'image/jpeg', 'image/png']);
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: 'Некорректный запрос' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ message: 'Файл не передан' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ message: 'Файл должен быть webp, jpeg или png' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ message: 'Файл больше 5 МБ' }, { status: 400 });
  }
  try {
    const url = await apiUploadPhoto(token, file);
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : 'Не удалось загрузить файл';
    return NextResponse.json({ message }, { status });
  }
}
