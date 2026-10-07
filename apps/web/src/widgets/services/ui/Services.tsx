import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  CircleDashed,
  Cog,
  Disc,
  Droplets,
  Gauge,
  Link as LinkIcon,
  ScanLine,
  Snowflake,
} from 'lucide-react';
import { BynSign, Container, Heading } from '@/shared/ui';
import { getServices } from '@/entities/service';
import type { Service } from '@/entities/service';

const ICONS: Record<string, LucideIcon> = {
  diagnostics: ScanLine,
  brakes: Disc,
  oil: Droplets,
  timing: Cog,
  clutch: LinkIcon,
  alignment: Gauge,
  tyres: CircleDashed,
  ac: Snowflake,
};

const BYN_CLASS = 'inline h-[0.76em] w-auto -translate-y-[0.08em]';

const UNIT_SHORT: Record<string, string> = {
  'за колесо': '/кол',
};

const EXCLUDED_FROM_GRID = new Set(['suspension']);

function PriceByn({ service, className }: { service: Service; className?: string }) {
  const unitShort = service.unit ? (UNIT_SHORT[service.unit] ?? service.unit) : null;
  return (
    <span className={className}>
      от {service.priceFrom} <BynSign className={BYN_CLASS} aria-label="белорусских рублей" />
      {unitShort ? <span className="text-[0.85em] text-content-dim"> {unitShort}</span> : null}
    </span>
  );
}

export async function Services() {
  const services = await getServices();
  const featured = services.find((s) => s.id === 'diagnostics') ?? services[0];
  if (!featured) {
    return null;
  }
  const rest = services.filter((s) => s !== featured && !EXCLUDED_FROM_GRID.has(s.id));
  const rowOne = rest.slice(0, 2);
  const rowTwo = rest.slice(2);

  return (
    <section id="services" className="border-b border-border">
      <Container size="site" className="pt-16 pb-24 lg:pt-[72px]">
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

        <div className="mt-8 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-10">
          <FeaturedCard featured={featured} className="sm:col-span-2 lg:col-span-4" />
          {rowOne.map((service) => (
            <ServiceCard key={service.id} service={service} className="lg:col-span-3" />
          ))}
          {rowTwo.map((service) => (
            <ServiceCard key={service.id} service={service} className="lg:col-span-2" />
          ))}
          <SlabLink />
        </div>
      </Container>
    </section>
  );
}

function SlabLink() {
  return (
    <a
      href="#"
      className="group col-span-full flex h-14 items-center justify-between rounded-lg bg-primary px-6 transition-colors duration-300 hover:bg-primary-hover sm:px-8"
    >
      <span className="font-mono text-base font-bold uppercase tracking-[0.12em] text-primary-ink">
        Все услуги и цены
      </span>
      <ArrowRight className="size-6 text-primary-ink transition-transform duration-300 group-hover:translate-x-2" />
    </a>
  );
}

function FeaturedCard({ featured, className }: { featured: Service; className?: string }) {
  return (
    <a
      href="#"
      className={`group relative flex flex-col justify-end gap-1.5 overflow-hidden rounded-lg border-[1.5px] border-primary bg-panel-2 p-5 text-content transition-colors duration-300 hover:border-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${className ?? ''}`}
    >
      {featured.photo ? (
        <>
          <Image
            src={featured.photo}
            alt=""
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover opacity-45 transition-[opacity,scale] duration-500 group-hover:scale-[1.03] group-hover:opacity-55 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-panel-2 via-panel-2/80 to-transparent"
          />
        </>
      ) : null}
      <span className="relative inline-flex w-fit items-center gap-1.5 rounded-sm bg-primary px-2 py-1 font-mono text-caption font-bold uppercase tracking-normal text-primary-ink max-sm:self-start sm:absolute sm:top-4 sm:right-4">
        Первым 20 — 0 <BynSign className={BYN_CLASS} aria-label="белорусских рублей" />
      </span>
      <span className="relative text-xl font-bold leading-[1.2]">{featured.title}</span>
      <span className="relative text-sm leading-normal text-content-muted">
        {featured.description}
      </span>
      <span className="relative flex items-center justify-between pt-2.5">
        <span className="font-mono text-base font-bold text-primary">
          <PriceByn service={featured} />
        </span>
        <span className="flex size-8 items-center justify-center rounded-md bg-primary-ink transition-transform group-hover:translate-x-0.5">
          <ArrowRight className="size-4 text-primary" aria-hidden="true" />
        </span>
      </span>
    </a>
  );
}

function ServiceCard({ service, className }: { service: Service; className?: string }) {
  const Icon = ICONS[service.id];
  return (
    <a
      href="#"
      className={`group relative flex overflow-hidden rounded-lg border border-border bg-panel transition-colors duration-300 hover:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 max-sm:flex-row max-sm:items-center max-sm:gap-3 max-sm:p-3.5 sm:min-h-48 sm:flex-col sm:justify-end sm:p-5 ${className ?? ''}`}
    >
      {service.photo ? (
        <>
          <Image
            src={service.photo}
            alt=""
            fill
            sizes="(min-width: 1024px) 20vw, 45vw"
            className="hidden object-cover opacity-55 transition-[opacity,scale] duration-500 group-hover:scale-[1.03] group-hover:opacity-70 motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:block"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 hidden bg-gradient-to-t from-bg via-bg/60 to-transparent sm:block"
          />
        </>
      ) : null}

      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-panel-2 transition-colors group-hover:bg-primary/15 sm:hidden">
        {Icon ? <Icon className="size-4.5 text-primary" aria-hidden="true" /> : null}
      </span>

      <span className="relative flex flex-col max-sm:min-w-0 max-sm:flex-1 max-sm:gap-1 sm:gap-1.5">
        <span className="text-sm font-semibold leading-[1.3] text-content sm:text-base">
          {service.title}
        </span>
        <span className="hidden text-caption leading-normal text-content-muted sm:block">
          {service.description}
        </span>
        <span className="relative flex items-center justify-between pt-2.5 max-sm:mt-0 max-sm:pt-0">
          <PriceByn service={service} className="font-mono text-sm font-bold text-primary" />
          <ArrowRight
            className="size-4 shrink-0 text-content-dim transition-transform group-hover:translate-x-0.5 group-hover:text-content sm:hidden"
            aria-hidden="true"
          />
        </span>
      </span>
    </a>
  );
}
