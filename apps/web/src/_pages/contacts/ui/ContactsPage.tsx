import Image from 'next/image';
import { site } from '@/shared/config/site';
import { Breadcrumbs, Container, Heading, Text } from '@/shared/ui';
import { CallbackButton } from '@/features/callback-request';

const telegramHref = `https://t.me/${site.telegram.replace('@', '')}`;
const viberHref = `viber://chat?number=%2B${site.viber.replace('+', '')}`;

export function ContactsPage() {
  const [mts, a1] = site.phones;

  return (
    <>
      <section className="border-b border-border">
        <Container size="site" className="pb-8 pt-8 sm:pb-10 sm:pt-10">
          <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Контакты' }]} />
          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <Heading variant="display-sm" font="display" as="h1" className="uppercase">
              Контакты
            </Heading>
            <Text variant="body-lg" color="muted" className="font-mono">
              {site.city} · {site.hours.short}
            </Text>
          </div>
        </Container>
      </section>

      <Container size="site" className="pb-20 pt-8">
        <div className="grid items-stretch gap-3.5 lg:grid-cols-[8fr_4fr]">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border lg:col-start-1 lg:row-start-1">
            <Image
              src="/contacts/workshop.webp"
              alt="Цех автосервиса «ПроМакс»"
              fill
              priority
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
            />
          </div>

          <address className="flex flex-col justify-between gap-6 rounded-lg bg-primary p-6 not-italic lg:col-start-2 lg:row-start-1">
            <span className="font-mono text-caption uppercase tracking-[0.12em] text-primary-ink">
              записывайтесь — подберём время
            </span>
            <div className="flex flex-col gap-5">
              {[mts, a1].map((phone) => (
                <a key={phone.value} href={`tel:${phone.value}`} className="flex flex-col gap-1.5">
                  <Heading
                    variant="display-xs"
                    font="display"
                    className="whitespace-nowrap leading-none text-primary-ink"
                  >
                    {phone.pretty}
                  </Heading>
                  <span className="font-mono text-caption uppercase tracking-[0.12em] text-primary-ink">
                    {phone.label}
                  </span>
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 border-t border-primary-ink pt-4">
                <a href={telegramHref} className="font-semibold text-primary-ink hover:underline">
                  Telegram — {site.telegram}
                </a>
                <a href={viberHref} className="font-semibold text-primary-ink hover:underline">
                  Viber — {mts.pretty}
                </a>
              </div>
              <span className="font-mono text-caption leading-relaxed tracking-[0.08em] text-primary-ink">
                {site.hours.label.toUpperCase()} · {site.hours.note.toUpperCase()}
                <br />
                {site.address.toUpperCase()}
              </span>
            </div>
          </address>

          <div className="relative aspect-[21/7] overflow-hidden rounded-lg border border-border bg-panel lg:col-span-2 lg:row-start-2">
            <iframe
              src={`https://yandex.ru/map-widget/v1/?ll=${site.map.lon}%2C${site.map.lat}&z=${site.map.zoom}&pt=${site.map.lon},${site.map.lat},pm2orgm`}
              title={`Карта Гомеля — автосервис «ПроМакс»`}
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start gap-4 rounded-lg border border-border bg-panel p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-body-lg font-medium text-content">
              Не нашли нужную услугу или есть вопрос?
            </span>
            <Text variant="body" color="muted">
              Позвоните или оставьте заявку — перезвоним в течение часа в рабочее время.
            </Text>
          </div>
          <CallbackButton size="md" pill className="shrink-0">
            Оставить заявку
          </CallbackButton>
        </div>
      </Container>
    </>
  );
}
