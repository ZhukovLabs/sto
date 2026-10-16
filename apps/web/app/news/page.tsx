import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs, Container, Heading, Text } from '@/shared/ui';
import { getNewsList } from '@/entities/news';
import { NewsCoverFallback } from '@/entities/news/ui/NewsCoverFallback';
import { pluralRu } from '@/shared/lib/plural';
import { site } from '@/shared/config/site';

const NEWS_FORMS = ['новость', 'новости', 'новостей'] as const;

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export const metadata: Metadata = {
  title: `Новости и полезные материалы — ${site.name}, ${site.city}`,
  description: `Советы автосервиса ${site.name} в ${site.city}: сезонная подготовка, разбор частых поломок и случаи из цеха. Пишем раз–два в неделю, по делу.`,
};

export default async function NewsListPage() {
  const news = (await getNewsList()) ?? [];

  return (
    <>
      <section className="border-b border-border">
        <Container size="site" className="pb-8 pt-8 sm:pb-10 sm:pt-10">
          <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Новости' }]} />
          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <Heading variant="display-sm" font="display" as="h1" className="uppercase">
              Новости
            </Heading>
            <Text variant="body-lg" color="muted" className="font-mono">
              {news.length > 0
                ? `${news.length} ${pluralRu(news.length, NEWS_FORMS)}`
                : 'скоро появятся'}
            </Text>
          </div>
        </Container>
      </section>

      <Container size="site" className="pb-20 pt-10">
        {news.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong px-6 py-16 text-center">
            <Text variant="body" color="muted">
              Новости скоро появятся — пишем о сезонной подготовке, частых поломках и случаях из
              цеха.
            </Text>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((card) => (
              <li key={card.id}>
                <Link
                  href={`/news/${card.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-panel transition-colors duration-300 hover:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  <span className="relative block aspect-[16/10] border-b border-border bg-panel-2">
                    {card.cover !== null ? (
                      <Image
                        src={card.cover}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, 50vw"
                        className="object-cover transition-[opacity,scale] duration-500 group-hover:scale-[1.02] group-hover:opacity-90 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      />
                    ) : (
                      <NewsCoverFallback text={`${card.title} ${card.excerpt ?? ''}`} />
                    )}
                  </span>
                  <span className="flex flex-1 flex-col gap-2 p-5">
                    <span className="font-mono text-caption uppercase tracking-[0.08em] text-content-dim">
                      {dateFormat.format(new Date(card.publishedAt ?? card.updatedAt))}
                    </span>
                    <span className="text-base font-semibold leading-snug text-content transition-colors group-hover:text-primary">
                      {card.title}
                    </span>
                    {card.excerpt !== null ? (
                      <span className="text-caption leading-relaxed text-content-muted">
                        {card.excerpt}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
