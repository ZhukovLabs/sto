import Image from 'next/image';
import { MessageCircle, Send } from 'lucide-react';
import { site } from '@/shared/config/site';
import { Container, Heading } from '@/shared/ui';
import { CallbackButton } from '@/features/callback-request';
import { YandexMap } from './YandexMap';

const telegramHref = `https://t.me/${site.telegram.replace('@', '')}`;
const viberHref = `viber://chat?number=%2B${site.viber.replace('+', '')}`;

export function Contacts() {
  const [phone] = site.phones;

  return (
    <section id="contacts" className="border-b border-border">
      <div className="relative min-h-[560px] overflow-hidden lg:min-h-[640px]">
        <Image
          src="/contacts/workshop.webp"
          alt="Цех автосервиса «ПроМакс»"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-bg via-bg/55 to-bg/30" />

        <div className="absolute inset-0 flex flex-col justify-end">
          <Container size="site" className="pb-14 lg:pb-16">
            <span className="font-mono text-caption uppercase tracking-[0.14em] text-content-muted">
              {site.city} · {site.hours.label} · {site.hours.note}
            </span>
            <Heading
              variant="display-lg"
              font="display"
              as="h2"
              className="mt-4 uppercase text-content"
            >
              Пригоняйте — <span className="text-primary">разберёмся</span>
            </Heading>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a href={`tel:${phone.value}`} className="group">
                <Heading
                  variant="display-sm"
                  font="display"
                  className="whitespace-nowrap leading-none text-content transition-colors group-hover:text-primary"
                >
                  {phone.pretty}
                </Heading>
              </a>

              <CallbackButton id="contacts-cta" size="lg" pill className="sm:min-w-[210px]">
                Записаться онлайн
              </CallbackButton>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={telegramHref}
                  className="inline-flex h-12 items-center gap-2.5 rounded-full border border-border bg-panel-2/80 px-4 font-mono text-caption uppercase tracking-[0.1em] text-content backdrop-blur-sm transition-colors hover:border-primary hover:text-primary"
                >
                  <Send aria-hidden className="size-4" />
                  Telegram
                </a>
                <a
                  href={viberHref}
                  className="inline-flex h-12 items-center gap-2.5 rounded-full border border-border bg-panel-2/80 px-4 font-mono text-caption uppercase tracking-[0.1em] text-content backdrop-blur-sm transition-colors hover:border-primary hover:text-primary"
                >
                  <MessageCircle aria-hidden className="size-4" />
                  Viber
                </a>
              </div>
            </div>
          </Container>
        </div>
      </div>

      <div className="relative h-[280px] lg:h-[340px]">
        <YandexMap
          lat={site.map.lat}
          lon={site.map.lon}
          zoom={site.map.zoom}
          title={`${site.name} — ${site.city}`}
        />
      </div>
    </section>
  );
}
