import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Container, Heading, Reveal, Text } from '@/shared/ui';
import { getServiceCatalog, ServiceCard } from '@/entities/service';
import type { CatalogGroup } from '@/entities/service';

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
    <section id="services" className="scroll-mt-20 border-b border-border sm:scroll-mt-24">
      <Container size="site" className="pt-16 pb-24 lg:pt-[72px]">
        <Reveal className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <Heading variant="section" font="display" as="h2" className="uppercase">
            Услуги и цены
          </Heading>
          <Link
            href="/services"
            className="inline-flex shrink-0 items-center gap-1.5 text-body font-medium text-primary transition-colors hover:text-primary-400 sm:pb-1"
          >
            Все услуги и цены
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Reveal>

        <Reveal delay={80} className="mt-3 max-w-[560px]">
          <Text variant="body" color="muted" className="leading-normal">
            Показываем цены сразу. Даже те, что у других написаны «по запросу».
          </Text>
        </Reveal>

        <div className="mt-8 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-10">
          <Reveal delay={120} className="sm:col-span-2 lg:col-span-4">
            <ShowcaseCard item={featured} className="h-full" />
          </Reveal>
          {rowOne.map((item, index) => (
            <Reveal
              key={item.group.services[item.index].id}
              delay={200 + index * 80}
              className="lg:col-span-3"
            >
              <ShowcaseCard item={item} className="h-full" />
            </Reveal>
          ))}
          {rowTwo.map((item, index) => (
            <Reveal
              key={item.group.services[item.index].id}
              delay={360 + index * 60}
              className="lg:col-span-2"
            >
              <ShowcaseCard item={item} className="h-full" />
            </Reveal>
          ))}
          <Reveal variant="wipe" delay={500} className="col-span-full">
            <SlabLink />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function ShowcaseCard({ item, className }: { item: ShowcaseItem; className?: string }) {
  const service = item.group.services[item.index];
  return (
    <ServiceCard
      service={service}
      group={item.group}
      className={className}
      href={`/services/${item.group.id}/${service.id}`}
    />
  );
}

function SlabLink() {
  return (
    <Link
      href="/services"
      className="group flex h-14 items-center justify-between rounded-lg bg-primary px-6 transition-colors duration-300 hover:bg-primary-hover sm:px-8"
    >
      <span className="font-mono text-base font-bold uppercase tracking-[0.12em] text-primary-ink">
        Все услуги и цены
      </span>
      <ArrowRight className="size-6 text-primary-ink transition-transform duration-300 group-hover:translate-x-2" />
    </Link>
  );
}
