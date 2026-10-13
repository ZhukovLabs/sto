import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { UPLOAD_MAX_BYTES, UPLOAD_MIME_TYPES, uploadsDir } from '../uploads/storage';
import { s3PutImage } from '../uploads/s3';
import { SOURCE_HEADERS, SOURCE_TIMEOUT_MS } from './news-http';

/**
 * Обложки автоновостей со стоковых фото по ключевым словам от ИИ.
 * Приоритет провайдеров: Pixabay -> Unsplash -> Pexels -> Openverse (CC0, без ключа);
 * у стоков без заданного ключа провайдер молча пропускается. Картинки из
 * статей-источников не используются - авторские права.
 * Найденный файл сохраняется в S3 (ключ news/<uuid>.<ext>, URL /uploads/…),
 * при недоступном S3 - на локальный диск. null = обложки нет, сайт покажет заглушку.
 */
@Injectable()
export class NewsCoverService {
  private readonly logger = new Logger(NewsCoverService.name);

  async downloadStockCover(keywords: string): Promise<string | null> {
    // Узкие ключи («Li L8») на стоках часто пусты - на втором круге пробуем общие.
    for (const query of [keywords, 'car automobile']) {
      const providers = [
        this.pixabayCover.bind(this),
        this.unsplashCover.bind(this),
        this.pexelsCover.bind(this),
        this.openverseCover.bind(this),
      ];
      for (const provider of providers) {
        const url = await provider(query).catch(() => null);
        if (url === null) {
          continue;
        }
        const cover = await this.downloadImage(url).catch(() => null);
        if (cover !== null) {
          return cover;
        }
      }
    }
    return null;
  }

  /** Pixabay: бесплатно, ключ выдаётся сразу (PIXABAY_API_KEY). */
  private async pixabayCover(keywords: string): Promise<string | null> {
    const key = process.env.PIXABAY_API_KEY;
    if (key === undefined || key === '') {
      return null;
    }
    const response = await fetch(
      `https://pixabay.com/api/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(keywords)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=5`,
      { signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS) },
    );
    if (!response.ok) {
      return null;
    }
    const body = (await response.json().catch(() => null)) as {
      hits?: { largeImageURL?: string; webformatURL?: string }[];
    } | null;
    for (const photo of body?.hits ?? []) {
      const url = photo.largeImageURL ?? photo.webformatURL;
      if (url !== undefined) {
        return url;
      }
    }
    return null;
  }

  /** Unsplash: бесплатно, нужен ключ приложения (UNSPLASH_ACCESS_KEY). */
  private async unsplashCover(keywords: string): Promise<string | null> {
    const key = process.env.UNSPLASH_ACCESS_KEY;
    if (key === undefined || key === '') {
      return null;
    }
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keywords)}&per_page=5&orientation=landscape&content_filter=high`,
      {
        headers: { Authorization: `Client-ID ${key}` },
        signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
      },
    );
    if (!response.ok) {
      return null;
    }
    const body = (await response.json().catch(() => null)) as {
      results?: { urls?: { regular?: string } }[];
    } | null;
    for (const photo of body?.results ?? []) {
      const url = photo.urls?.regular;
      if (url !== undefined) {
        return url;
      }
    }
    return null;
  }

  /** Pexels: бесплатно, но выдача новых ключей приостановлена (PEXELS_API_KEY). */
  private async pexelsCover(keywords: string): Promise<string | null> {
    const key = process.env.PEXELS_API_KEY;
    if (key === undefined || key === '') {
      return null;
    }
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keywords)}&per_page=5&orientation=landscape&size=large`,
      { headers: { Authorization: key }, signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS) },
    );
    if (!response.ok) {
      return null;
    }
    const body = (await response.json().catch(() => null)) as {
      photos?: { src?: { large2x?: string; large?: string } }[];
    } | null;
    for (const photo of body?.photos ?? []) {
      const url = photo.src?.large2x ?? photo.src?.large;
      if (url !== undefined) {
        return url;
      }
    }
    return null;
  }

  /** Openverse: без ключа, только CC0 - лицензия без атрибуции. */
  private async openverseCover(keywords: string): Promise<string | null> {
    const response = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(keywords)}&license=cc0&page_size=20`,
      { headers: SOURCE_HEADERS, signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS) },
    );
    if (!response.ok || (response.headers.get('content-type') ?? '').includes('text/html')) {
      // под троттлингом Openverse отдаёт html-заглушку вместо json
      return null;
    }
    const body = (await response.json().catch(() => null)) as {
      results?: { url?: string; width?: number }[];
    } | null;
    for (const photo of body?.results ?? []) {
      if (photo.url !== undefined && (photo.width ?? 0) >= 640) {
        return photo.url;
      }
    }
    return null;
  }

  /** Скачивает картинку; null при любом несоответствии формату или размеру. */
  private async downloadImage(url: string): Promise<string | null> {
    const response = await fetch(url, {
      headers: SOURCE_HEADERS,
      signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
    });
    if (!response.ok) {
      return null;
    }
    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() ?? '';
    const ext = UPLOAD_MIME_TYPES[contentType];
    if (ext === undefined) {
      return null;
    }
    // content-length известен - отказываемся заранее, не буферизуя гигантские ответы.
    const declared = Number(response.headers.get('content-length') ?? 0);
    if (declared > UPLOAD_MAX_BYTES) {
      return null;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > UPLOAD_MAX_BYTES) {
      return null;
    }
    const name = `news/${randomUUID()}.${ext}`;
    if (await s3PutImage(name, buffer, contentType)) {
      this.logger.log(`Обложка сохранена в S3: ${name}`);
      return `/uploads/${name}`;
    }
    await writeFile(join(uploadsDir(), name), buffer);
    return `/uploads/${name}`;
  }
}
