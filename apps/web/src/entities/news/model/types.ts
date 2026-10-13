export interface NewsCard {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface NewsArticle extends NewsCard {
  content: string;
}
