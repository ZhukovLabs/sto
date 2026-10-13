import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Breadcrumbs, Container, Heading, Text } from '@/shared/ui';
import { getNewsBySlug } from '@/entities/news';
import { NewsCoverFallback } from '@/entities/news/ui/NewsCoverFallback';
import { site } from '@/shared/config/site';

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

interface NewsArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: NewsArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);
  if (article === null) {
    return { title: `Новость не найдена — ${site.name}` };
  }
  return {
    title: `${article.title} — ${site.name}`,
    description: article.excerpt ?? `Новость автосервиса ${site.name} в ${site.city}.`,
    alternates: { canonical: `/news/${slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt ?? undefined,
      type: 'article',
      url: `/news/${slug}`,
      ...(article.cover !== null ? { images: [article.cover] } : {}),
    },
  };
}

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);
  if (article === null) {
    notFound();
  }
  const date = dateFormat.format(new Date(article.publishedAt ?? article.updatedAt));

  return (
    <>
      <section className="border-b border-border">
        <Container size="site" className="pb-8 pt-8 sm:pb-10 sm:pt-10">
          <Breadcrumbs
            items={[
              { label: 'Главная', href: '/' },
              { label: 'Новости', href: '/news' },
              { label: article.title },
            ]}
          />
          <div className="mt-5 min-w-0">
            <Text variant="caption" color="dim" className="font-mono uppercase tracking-[0.12em]">
              {date}
            </Text>
            <Heading variant="display-sm" font="display" as="h1" className="mt-3 uppercase">
              {article.title}
            </Heading>
            {article.excerpt !== null ? (
              <Text variant="lead" color="muted" className="mt-5 max-w-[640px]">
                {article.excerpt}
              </Text>
            ) : null}
          </div>
        </Container>
      </section>

      <Container size="site" className="pb-20 pt-10">
        <div className="mx-auto flex max-w-[640px] flex-col gap-8">
          {article.cover !== null ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border">
              <Image
                src={article.cover}
                alt={article.title}
                fill
                sizes="(min-width: 1024px) 640px, 100vw"
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border">
              <NewsCoverFallback
                text={`${article.title} ${article.excerpt ?? ''}`}
                iconSize="size-12"
              />
            </div>
          )}
          {/* Контент пишет только администратор и чистится на записи (sanitizeHtml в @sto/api). */}
          <div className="rich-content" dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
      </Container>
    </>
  );
}
