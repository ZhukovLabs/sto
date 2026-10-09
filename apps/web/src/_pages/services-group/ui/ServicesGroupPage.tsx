import { ChevronRight } from 'lucide-react';
import { Breadcrumbs, BynSign, Container, Heading, Text } from '@/shared/ui';
import { UNIT_SHORT, formatPriceFrom } from '@/entities/service';
import type { CatalogGroup } from '@/entities/service';

interface ServicesGroupPageProps {
  group: CatalogGroup;
}

export function ServicesGroupPage({ group }: ServicesGroupPageProps) {
  const active = group.services.filter((service) => service.isActive);
  const priceFrom =
    active.length > 0 ? Math.min(...active.map((service) => service.priceFrom)) : null;

  return (
    <>
      <section className="border-b border-border">
        <Container size="site" className="pb-8 pt-8 sm:pb-10 sm:pt-10">
          <Breadcrumbs
            items={[
              { label: 'Главная', href: '/' },
              { label: 'Услуги и цены', href: '/services' },
              { label: group.title },
            ]}
          />
          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <Heading variant="display-sm" font="display" as="h1" className="uppercase">
              {group.title}
            </Heading>
            <Text variant="body-lg" color="muted" className="font-mono">
              {active.length}{' '}
              {active.length === 1 ? 'услуга' : active.length < 5 ? 'услуги' : 'услуг'}
              {priceFrom !== null && (
                <>
                  {' · от '}
                  {priceFrom}
                  <BynSign aria-label="белорусских рублей" />
                </>
              )}
            </Text>
          </div>
        </Container>
      </section>

      <Container size="site" className="pb-20 pt-6 sm:pt-8">
        <ul className="flex flex-col">
          {active.map((service) => (
            <li key={service.id} className="border-b border-border last:border-b-0">
              <a
                href={`/services/${group.id}/${service.id}`}
                className="group flex items-center gap-4 py-5 transition-colors hover:bg-panel sm:gap-6 sm:px-4"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-body-lg font-medium text-content">{service.title}</span>
                  {service.description !== '' && (
                    <Text variant="body" color="dim" className="line-clamp-2">
                      {service.description}
                    </Text>
                  )}
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="whitespace-nowrap font-mono text-body-lg text-content">
                    {formatPriceFrom(service)}
                    <BynSign aria-label="белорусских рублей" />
                  </span>
                  {service.unit !== null && (
                    <span className="font-mono text-caption text-content-dim">
                      {UNIT_SHORT[service.unit]}
                    </span>
                  )}
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-5 shrink-0 text-content-dim transition-transform group-hover:translate-x-0.5 group-hover:text-content"
                  strokeWidth={2}
                />
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
