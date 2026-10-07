import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Circle,
  CircleDot,
  Cog,
  Disc,
  Droplets,
  Gauge,
  ScanLine,
  Snowflake,
} from 'lucide-react';
import { BynSign, Container, Heading, Text } from '@/shared/ui';
import { getServices } from '@/entities/service';
import type { Service } from '@/entities/service';

const ICONS: Record<string, LucideIcon> = {
  diagnostics: ScanLine,
  brakes: Disc,
  oil: Droplets,
  timing: Cog,
  clutch: CircleDot,
  alignment: Gauge,
  tyres: Circle,
  ac: Snowflake,
};

const BYN_CLASS = 'inline h-[0.76em] w-auto -translate-y-[0.08em]';

function PriceByn({
  service,
  className,
  showFrom = true,
}: {
  service: Service;
  className?: string;
  showFrom?: boolean;
}) {
  return (
    <span className={className}>
      {service.fixed || !showFrom ? null : 'от '}
      {service.priceFrom > 0 || service.fixed ? service.priceFrom : '0'}{' '}
      <BynSign className={BYN_CLASS} aria-label="белорусских рублей" />
      {service.unit === 'за колесо' ? '/кол' : ''}
    </span>
  );
}

export async function Services() {
  const services = await getServices();
  const featured = services.find((s) => s.id === 'diagnostics') ?? services[0];
  if (!featured) {
    return null;
  }
  const rest = services.filter((s) => s !== featured && s.id !== 'suspension');
  const rowOne = rest.slice(0, 2);
  const rowTwo = rest.slice(2, 7);

  return (
    <section id="services" className="border-b border-border">
      <Container size="site" className="py-16 lg:py-[72px]">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <Heading variant="section" font="display" as="h2" className="uppercase">
            Услуги и цены
          </Heading>
          <a
            href="#"
            className="inline-flex shrink-0 items-center gap-1.5 text-body font-medium text-primary transition-colors hover:text-primary-400 sm:pb-1"
          >
            Полный прейскурант
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </div>

        <div className="mt-8 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-[586px_1fr_1fr]">
          <a
            href="#"
            className="group flex flex-col gap-3.5 rounded-lg border-[1.5px] border-primary bg-panel-2 p-6 text-content transition-colors duration-300 hover:border-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:col-span-2 lg:col-span-1"
          >
            <span className="flex items-center justify-between">
              <span className="flex size-11 items-center justify-center rounded-md bg-primary/15">
                <ScanLine className="size-5 text-primary" aria-hidden="true" />
              </span>
              <span className="font-mono text-micro uppercase text-content/80">
                Первым 20 — 0 <BynSign className={BYN_CLASS} aria-label="белорусских рублей" />
              </span>
            </span>
            <span className="text-lg font-bold leading-snug">{featured.title}</span>
            <span className="text-sm leading-normal text-content-muted">
              подвеска, двигатель, электрика — читаем ошибки и находим причину, а не продаём лишнее
            </span>
            <span className="mt-auto flex items-center justify-between pt-3.5">
              <span className="font-mono text-base font-bold">
                остальным — <PriceByn service={featured} />
              </span>
              <span className="flex size-8 items-center justify-center rounded-md bg-primary-ink transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="size-4 text-primary" aria-hidden="true" />
              </span>
            </span>
          </a>

          {rowOne.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index + 2} />
          ))}
        </div>

        <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
          {rowTwo.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index + 4} />
          ))}
        </div>

        <Text variant="caption" className="mt-5 font-mono text-content-dim">
          * Точная смета — после диагностики и до начала работ. Цена в смете не меняется.
        </Text>
      </Container>
    </section>
  );
}

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const Icon = ICONS[service.id];
  return (
    <a
      href="#"
      className="group flex flex-col gap-3.5 rounded-lg border border-border bg-panel p-5 transition-colors duration-300 hover:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <span className="flex items-center justify-between">
        <span className="flex size-9.5 items-center justify-center rounded-md bg-panel-2 transition-colors group-hover:bg-primary/15">
          {Icon ? <Icon className="size-4.5 text-primary" aria-hidden="true" /> : null}
        </span>
        <Text variant="caption" className="hidden font-mono text-content-dim sm:block">
          {String(index).padStart(2, '0')}
        </Text>
      </span>
      <span className="text-base font-semibold leading-[1.3] text-content">{service.title}</span>
      <span className="mt-auto flex items-center justify-between pt-3.5">
        <PriceByn service={service} className="font-mono text-sm font-bold text-primary" />
        <ArrowRight
          className="size-4 text-content-dim transition-transform group-hover:translate-x-0.5 group-hover:text-content"
          aria-hidden="true"
        />
      </span>
    </a>
  );
}
