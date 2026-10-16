import type { NewsArticle, NewsCard } from './model/types';
import { API_URL } from '@/shared/config/api';

/**
 * Опубликованные новости из @sto/api для серверных компонентов.
 * Кэшируется с тегом news — сбрасывается вебхуком /api/revalidate.
 * При недоступном API возвращает null (например, сборка в CI без бэкенда):
 * список деградирует в «скоро появятся», а не в падающую страницу.
 */
export async function getNewsList(): Promise<NewsCard[] | null> {
  try {
    const response = await fetch(`${API_URL}/news`, {
      next: { tags: ['news'], revalidate: 3600 },
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as NewsCard[];
  } catch {
    return null;
  }
}

/**
 * Статья по слагу; null — новости точно нет (404). Сбой API (5xx, сеть) пробрасываем:
 * временная недоступность не должна выглядеть как «статья удалена» и выметать её из выдачи.
 */
export async function getNewsBySlug(slug: string): Promise<NewsArticle | null> {
  const response = await fetch(`${API_URL}/news/by-slug/${encodeURIComponent(slug)}`, {
    next: { tags: ['news'], revalidate: 3600 },
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`API новостей ответил ${response.status}`);
  }
  return (await response.json()) as NewsArticle;
}
