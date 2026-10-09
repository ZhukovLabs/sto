import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BynSign, Container, Heading } from '@/shared/ui';
import { getServiceCatalog, PriceByn, ServiceCard } from '@/entities/service';
import type { CatalogGroup } from '@/entities/service';

const BYN_CLASS = 'inline h-[0.76em] w-auto -translate-y-[0.08em]';

interface ShowcaseItem {
  group: CatalogGroup;
  index: number;
}

function resolveShowcase(data: Awaited<ReturnType<typeof getServiceCatalog>>): ShowcaseItem[] {
  if (data === null) {
    return [];
  }
  const items: ShowcaseItem[] = [];
  for (const slot of data.showcase) {
    for (const group of data.groups) {
      const index = group.services.findIndex((service) => service.id === slot.serviceId);
      if (index >= 0) {
        items.push({ group, index });
        break;
      }
    }
  }
  return items;
}

export async function Services() {
  const data = await getServiceCatalog();
  const showcase = resolveShowcase(data);
  const featured = showcase[0];
  if (featured === undefined) {
    return null;
  }
  const rest = showcase.slice(1);
  const rowOne = rest.slice(0, 2);
  const rowTwo = rest.slice(2);

  return (
    <section id="services" className="border-b border-border">
      <Container size="site" className="pt-16 pb-24 lg:pt-[72px]">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <Heading variant="section" font="display" as="h2" className="uppercase">
            Услуги и цены
          </Heading>
          <Link
            href="/services"
            className="inline-flex shrink-0 items-center gap-1.5 text-body font-medium text-primary transition-colors hover:text-primary-400 sm:pb-1"
          >
            Полный прейскурант
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-8 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-10">
          <FeaturedCard item={featured} className="sm:col-span-2 lg:col-span-4" />
          {rowOne.map((item) => (
            <ShowcaseCard
              key={item.group.services[item.index].id}
              item={item}
              className="lg:col-span-3"
            />
          ))}
          {rowTwo.map((item) => (
            <ShowcaseCard
              key={item.group.services[item.index].id}
              item={item}
              className="lg:col-span-2"
            />
          ))}
          <SlabLink />
        </div>
      </Container>
    </section>
  );
}

function ShowcaseCard({ item, className }: { item: ShowcaseItem; className?: string }) {
  const service = item.group.services[item.index];
  return <ServiceCard service={service} group={item.group} className={className} />;
}

function SlabLink() {
  return (
    <Link
      href="/services"
      className="group col-span-full flex h-14 items-center justify-between rounded-lg bg-primary px-6 transition-colors duration-300 hover:bg-primary-hover sm:px-8"
    >
      <span className="font-mono text-base font-bold uppercase tracking-[0.12em] text-primary-ink">
        Все услуги и цены
      </span>
      <ArrowRight className="size-6 text-primary-ink transition-transform duration-300 group-hover:translate-x-2" />
    </Link>
  );
}

function FeaturedCard({ item, className }: { item: ShowcaseItem; className?: string }) {
  const featured = item.group.services[item.index];
  const photo = featured.photo ?? item.group.photo;
  return (
    <a
      href="#"
      className={`group relative flex flex-col justify-end gap-1.5 overflow-hidden rounded-lg border-[1.5px] border-primary bg-panel-2 p-5 text-content transition-colors duration-300 hover:border-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${className ?? ''}`}
    >
      {photo ? (
        <>
          <Image
            src={photo}
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
