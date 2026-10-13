import { API_URL } from '@/shared/config/api';
import type { FaqItem } from './model/types';

/** FAQ из админки. Кэш с тегом faq — сбрасывается вебхуком /api/revalidate. */
export async function getFaq(): Promise<FaqItem[]> {
  try {
    const response = await fetch(`${API_URL}/faq`, {
      next: { tags: ['faq'], revalidate: 3600 },
    });
    if (!response.ok) {
      return [];
    }
    return (await response.json()) as FaqItem[];
  } catch {
    return [];
  }
}
