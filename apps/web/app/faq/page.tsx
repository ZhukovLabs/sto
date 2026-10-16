import { Breadcrumbs, Container, Heading, Text } from '@/shared/ui';
import { CallbackButton } from '@/features/callback-request';
import { getFaq } from '@/entities/faq';
import { pluralRu } from '@/shared/lib/plural';
import { site } from '@/shared/config/site';

const FAQ_FORMS = ['вопрос', 'вопроса', 'вопросов'] as const;

export const metadata = {
  title: `Вопросы и ответы — ${site.name}`,
  description:
    'Как записаться, сколько стоит диагностика, что с гарантией — отвечаем на частые вопросы об автосервисе «ПроМакс» в Гомеле.',
};

export default async function FaqPage() {
  const items = await getFaq();

  return (
    <>
      <section className="border-b border-border">
        <Container size="site" className="pb-8 pt-8 sm:pb-10 sm:pt-10">
          <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Вопросы и ответы' }]} />
          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <Heading variant="display-sm" font="display" as="h1" className="uppercase">
              Вопросы <span className="text-primary">и ответы</span>
            </Heading>
            <Text variant="body-lg" color="muted" className="font-mono">
              {items.length > 0
                ? `${items.length} ${pluralRu(items.length, FAQ_FORMS)}`
                : 'частые вопросы'}
            </Text>
          </div>
        </Container>
      </section>

      <Container size="site" className="pb-20 pt-10">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong px-6 py-16 text-center">
            <Text variant="body" color="muted">
              Пока собираем частые вопросы — задайте свой, ответим и добавим сюда.
            </Text>
            <div className="mt-5">
              <CallbackButton size="md" pill>
                Задать вопрос
              </CallbackButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
            <ul className="min-w-0 flex-1 flex-col">
              {items.map((item, index) => (
                <li key={item.id} className="border-b border-border last:border-b-0">
                  <details name="faq" className="group scroll-mt-24">
                    <summary className="flex cursor-pointer list-none items-baseline gap-4 py-5 marker:hidden [&::-webkit-details-marker]:hidden">
                      <span className="w-6 shrink-0 pt-0.5 font-mono text-caption text-content-dim">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1 text-body-lg font-semibold text-content transition-colors group-hover:text-primary group-open:text-primary">
                        {item.question}
                      </span>
                      <span
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 font-mono text-body-lg leading-none text-content-dim transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none"
                      >
                        +
                      </span>
                    </summary>
                    <p className="max-w-[640px] whitespace-pre-line pb-6 pl-10 text-body text-content-muted">
                      {item.answer}
                    </p>
                  </details>
                </li>
              ))}
            </ul>

            <aside className="flex w-full flex-col gap-4 self-start rounded-xl border border-border bg-panel p-6 lg:w-80">
              <Text variant="micro" color="dim" className="font-mono uppercase tracking-[0.12em]">
                не нашли ответ?
              </Text>
              <Text variant="body" color="muted">
                Позвоните или оставьте заявку — разберёмся по вашей машине и подскажем по стоимости.
              </Text>
              <CallbackButton size="md" pill className="mt-1">
                Задать вопрос
              </CallbackButton>
            </aside>
          </div>
        )}
      </Container>
    </>
  );
}
