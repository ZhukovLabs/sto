import Image from 'next/image';
import { site } from '@/shared/config/site';
import { Container, Heading } from '@/shared/ui';

const telegramHref = `https://t.me/${site.telegram.replace('@', '')}`;
const viberHref = `viber://chat?number=%2B${site.viber.replace('+', '')}`;

export function Contacts() {
  const [mts, a1] = site.phones;

  return (
    <section id="contacts" className="border-b border-border">
      <Container size="site" className="py-16 lg:py-[72px]">
        <div className="grid items-stretch gap-3.5 lg:grid-cols-[8fr_4fr]">
          <div className="group relative aspect-[16/9] overflow-hidden rounded-lg border border-border lg:col-start-1 lg:row-start-1">
            <Image
              src="/contacts/workshop.webp"
              alt="Цех автосервиса «ПроМакс»"
              fill
              priority
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover transition-[scale] duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            <span className="absolute left-4 top-4 rounded-lg border border-border bg-panel-2 px-3.5 py-2.5 font-mono text-caption uppercase tracking-[0.1em] text-content">
              {site.city} · {site.hours.short}
            </span>
          </div>

          <div className="flex flex-col justify-between gap-6 rounded-lg bg-primary p-6 lg:col-start-2 lg:row-start-1">
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
          </div>

          <div className="relative aspect-[21/7] overflow-hidden rounded-lg border border-border bg-panel lg:col-span-2 lg:row-start-2">
            <iframe
              src="https://yandex.ru/map-widget/v1/?ll=30.9754%2C52.4345&z=14&pt=30.9754,52.4345,pm2orgm"
              title="Карта Гомеля — автосервис «ПроМакс»"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
