import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { unlink } from 'node:fs/promises';

export const UPLOADS_URL_PREFIX = '/uploads/';

export const UPLOAD_MIME_TYPES: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

export function uploadsDir(): string {
  const configured = process.env.UPLOADS_DIR;
  const dir = resolve(
    configured && configured.length > 0 ? configured : join(process.cwd(), 'uploads'),
  );
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function deleteUploadByUrl(url: string | null | undefined): void {
  if (typeof url !== 'string' || !url.startsWith(UPLOADS_URL_PREFIX)) {
    return;
  }
  const name = url.slice(UPLOADS_URL_PREFIX.length);
  if (name.length === 0 || name.includes('/') || name.includes('\\') || name.includes('..')) {
    return;
  }
  void unlink(join(uploadsDir(), name)).catch((): undefined => undefined);
}
