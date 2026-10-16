import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import sanitizeHtmlLibrary from 'sanitize-html';
import { PrismaService } from '../prisma/prisma.service';
import { deleteUploadByUrl } from '../uploads/storage';
import { notifyWebRevalidate } from '../web-revalidate';

const TITLE_MIN = 5;
const TITLE_MAX = 200;
const EXCERPT_MAX = 300;
const CONTENT_MIN = 5;
const CONTENT_MAX = 50_000;
const SLUG_MAX = 120;

/** Карточка новости для списка на сайте. */
export interface NewsCardView {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
}

/** Полная новость (админка). */
export interface NewsView extends NewsCardView {
  content: string;
  isPublished: boolean;
  /** Ссылка на первоисточник (автоновости из RSS) либо null. */
  sourceUrl: string | null;
  createdAt: Date;
}

/** Публичная статья: без служебных полей (источник, черновость, createdAt). */
export interface PublicNewsView extends NewsCardView {
  content: string;
}

const RU_TRANSLIT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

/** Слаг из заголовка: транслит кириллицы, [a-z0-9-], дефисы схлопнуты. */
export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .split('')
    .map((char) => RU_TRANSLIT[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, '');
}

/** Короткая отметка времени в слаг (YYMMDDHHmm): ссылка всегда уникальна. */
export function timestampSlug(now = new Date()): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return [
    String(now.getFullYear()).slice(2),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
  ].join('');
}

/**
 * Зачистка HTML редактора: allowlist-санитайзер пропускает только разметку
 * статей (p/h2/h3/списки/выделение/ссылки/картинки), вырезая скрипты, on*-атрибуты
 * и опасные схемы ссылок (javascript:, data:, vbscript: - включая закодированные
 * сущностями варианты). Контент пишет только админ и ИИ-конвейер, но защищаемся
 * на хранении (defense in depth).
 */
export function sanitizeHtml(html: string): string {
  return sanitizeHtmlLibrary(html, {
    allowedTags: [
      'p',
      'h2',
      'h3',
      'ul',
      'ol',
      'li',
      'strong',
      'em',
      'a',
      'img',
      'br',
      'blockquote',
    ],
    allowedAttributes: {
      a: ['href', 'title'],
      img: ['src', 'alt'],
    },
    allowedSchemes: ['http', 'https'],
    allowProtocolRelative: false,
    // Ссылки наружу открываем в новой вкладке без передачи referrer-контекста.
    transformTags: {
      a: sanitizeHtmlLibrary.simpleTransform('a', {
        rel: 'noopener noreferrer nofollow',
        target: '_blank',
      }),
    },
  });
}

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Потолок выдачи: без него список и страница сайта растут бесконечно. */
  private static readonly PUBLIC_TAKE = 100;
  private static readonly ADMIN_TAKE = 300;

  /** Опубликованные новости для сайта, свежие сверху. */
  async listPublic(): Promise<NewsCardView[]> {
    const items = await this.prisma.news.findMany({
      where: { isPublished: true },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      select: this.cardSelect(),
      take: NewsService.PUBLIC_TAKE,
    });
    return items;
  }

  /** Опубликованная новость по слагу для страницы статьи (без служебных полей). */
  async getPublicBySlug(slug: string): Promise<PublicNewsView> {
    const item = await this.prisma.news.findFirst({
      where: { slug, isPublished: true },
      select: this.select(),
    });
    if (item === null) {
      throw new NotFoundException('Новость не найдена');
    }
    // Служебные поля (sourceUrl, isPublished, createdAt) наружу не отдаём.
    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt,
      cover: item.cover,
      publishedAt: item.publishedAt,
      updatedAt: item.updatedAt,
      content: item.content,
    };
  }

  /** Все новости для админки, свежие сверху. */
  async listAll(): Promise<NewsView[]> {
    return this.prisma.news.findMany({
      orderBy: [{ updatedAt: 'desc' }],
      select: this.select(),
      take: NewsService.ADMIN_TAKE,
    });
  }

  async create(body: unknown): Promise<NewsView> {
    const data = this.validate(body);
    // К слагу всегда добавляем отметку времени — ссылки не конфликтуют при одинаковых заголовках.
    const stamp = timestampSlug();
    const base = data.slug ?? slugifyTitle(data.title);
    const item = await this.prisma.news
      .create({
        data: {
          ...data,
          slug: await this.uniqueSlug(`${base.slice(0, SLUG_MAX - stamp.length - 1)}-${stamp}`),
        },
        select: this.select(),
      })
      .catch((error: unknown) => {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'P2002'
        ) {
          throw new BadRequestException('Новость из этого источника уже собрана');
        }
        throw error;
      });
    this.logger.log(`Новость добавлена: ${item.id} (${item.slug})`);
    notifyWebRevalidate();
    return item;
  }

  async update(id: string, body: unknown): Promise<NewsView> {
    const patch = this.validatePatch(body);
    const existing = await this.prisma.news.findFirst({
      where: { id },
      select: { slug: true, publishedAt: true },
    });
    if (existing === null) {
      throw new NotFoundException('Новость не найдена');
    }
    let slug: string | undefined;
    if (patch.slug !== undefined && patch.slug !== existing.slug) {
      slug = await this.uniqueSlug(patch.slug);
    }
    // Первая публикация фиксирует дату (дальше не меняем).
    const item = await this.prisma.news
      .update({
        where: { id },
        data: {
          ...patch,
          ...(slug !== undefined ? { slug } : {}),
          ...(patch.isPublished === true && existing.publishedAt === null
            ? { publishedAt: new Date() }
            : {}),
        },
        select: this.select(),
      })
      .catch((error: unknown) => {
        // Конкурентная смена слага на занятый (uniqueSlug проверил до запроса, но гонка).
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'P2002'
        ) {
          throw new BadRequestException('Такой слаг уже занят — придумайте другой');
        }
        throw error;
      });
    this.logger.log(`Новость обновлена: ${id}`);
    notifyWebRevalidate();
    return item;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.news.findFirst({ where: { id }, select: { cover: true } });
    if (existing === null) {
      return;
    }
    await this.prisma.news
      .delete({ where: { id }, select: { id: true } })
      .catch((error: unknown) => {
        // Удалённая параллельно - не ошибка; прочее (сбой БД) не глотаем.
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'P2025'
        ) {
          return;
        }
        throw error;
      });
    if (existing.cover !== null) {
      void deleteUploadByUrl(existing.cover);
    }
    this.logger.log(`Новость удалена: ${id}`);
    notifyWebRevalidate();
  }

  /** Свободный слаг: если занят — суффикс -2, -3… */
  private async uniqueSlug(base: string): Promise<string> {
    let candidate = base;
    for (let i = 2; ; i += 1) {
      const taken = await this.prisma.news.findFirst({
        where: { slug: candidate },
        select: { id: true },
      });
      if (taken === null) {
        return candidate;
      }
      const tail = `-${i}`;
      candidate = `${base.slice(0, SLUG_MAX - tail.length)}${tail}`;
    }
  }

  private cardSelect() {
    return {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      cover: true,
      publishedAt: true,
      updatedAt: true,
    } as const;
  }

  private select() {
    return {
      ...this.cardSelect(),
      content: true,
      isPublished: true,
      sourceUrl: true,
      createdAt: true,
    } as const;
  }

  /** Полная валидация для создания. */
  private validate(body: unknown): {
    title: string;
    excerpt: string | null;
    content: string;
    cover: string | null;
    isPublished: boolean;
    slug?: string;
    sourceUrl?: string | null;
  } {
    const patch = this.validatePatch(body);
    if (patch.title === undefined || patch.content === undefined) {
      throw new BadRequestException('Заголовок и текст обязательны');
    }
    return {
      title: patch.title,
      content: patch.content,
      excerpt: patch.excerpt ?? null,
      cover: patch.cover ?? null,
      isPublished: patch.isPublished ?? false,
      slug: patch.slug,
      sourceUrl: patch.sourceUrl ?? null,
    };
  }

  /** Частичная валидация: undefined — не меняем. */
  private validatePatch(body: unknown): {
    title?: string;
    excerpt?: string | null;
    content?: string;
    cover?: string | null;
    isPublished?: boolean;
    slug?: string;
    sourceUrl?: string | null;
  } {
    if (typeof body !== 'object' || body === null) {
      throw new BadRequestException('Некорректное тело запроса');
    }
    const patch = body as Record<string, unknown>;
    const data: {
      title?: string;
      excerpt?: string | null;
      content?: string;
      cover?: string | null;
      isPublished?: boolean;
      slug?: string;
      sourceUrl?: string | null;
    } = {};

    if (patch.title !== undefined) {
      const title = typeof patch.title === 'string' ? patch.title.trim() : '';
      if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
        throw new BadRequestException(`Заголовок: от ${TITLE_MIN} до ${TITLE_MAX} символов`);
      }
      data.title = title;
    }
    if (patch.excerpt !== undefined) {
      if (patch.excerpt === null) {
        data.excerpt = null;
      } else {
        const excerpt = typeof patch.excerpt === 'string' ? patch.excerpt.trim() : '';
        if (excerpt.length > EXCERPT_MAX) {
          throw new BadRequestException(`Короткое описание: до ${EXCERPT_MAX} символов`);
        }
        data.excerpt = excerpt === '' ? null : excerpt;
      }
    }
    if (patch.content !== undefined) {
      const content = typeof patch.content === 'string' ? patch.content.trim() : '';
      if (content.length < CONTENT_MIN || content.length > CONTENT_MAX) {
        throw new BadRequestException(
          `Текст новости: от ${CONTENT_MIN} до ${CONTENT_MAX} символов`,
        );
      }
      data.content = sanitizeHtml(content);
    }
    if (patch.cover !== undefined) {
      if (patch.cover === null || patch.cover === '') {
        data.cover = null;
      } else if (typeof patch.cover === 'string' && /^\/uploads\//.test(patch.cover)) {
        data.cover = patch.cover;
      } else {
        throw new BadRequestException('Обложка — путь вида /uploads/…');
      }
    }
    if (patch.isPublished !== undefined) {
      if (typeof patch.isPublished !== 'boolean') {
        throw new BadRequestException('isPublished должен быть boolean');
      }
      data.isPublished = patch.isPublished;
    }
    if (patch.slug !== undefined) {
      const slug = slugifyTitle(typeof patch.slug === 'string' ? patch.slug : '');
      if (slug === '') {
        throw new BadRequestException('Слаг: латиница, цифры и дефисы');
      }
      data.slug = slug;
    }
    if (patch.sourceUrl !== undefined) {
      if (patch.sourceUrl === null || patch.sourceUrl === '') {
        data.sourceUrl = null;
      } else {
        const sourceUrl = typeof patch.sourceUrl === 'string' ? patch.sourceUrl.trim() : '';
        try {
          const parsed = new URL(sourceUrl);
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            throw new Error();
          }
          data.sourceUrl = parsed.toString();
        } catch {
          throw new BadRequestException('sourceUrl должен быть http(s)-ссылкой');
        }
      }
    }
    return data;
  }
}
