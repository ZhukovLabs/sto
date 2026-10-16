import { ArrowRight, Phone } from 'lucide-react';
import { Breadcrumbs, Container, Heading, Text } from '@/shared/ui';
import { CallbackButton } from '@/features/callback-request';
import { ServiceCard, UNIT_SHORT, formatPriceFrom, servicePhoto } from '@/entities/service';
import type { CatalogGroup } from '@/entities/service';
import type { Service } from '@/entities/service';
import { getSiteInfo } from '@/entities/site';
import { site } from '@/shared/config/site';

interface ServicesServicePageProps {
  group: CatalogGroup;
  service: Service;
}

export async function ServicesServicePage({ group, service }: ServicesServicePageProps) {
  const { phone } = await getSiteInfo();
  const others = group.services
    .filter((item) => item.isActive && item.id !== service.id)
    .slice(0, 4);
  const photo = servicePhoto(service, group);
  const details = service.details ?? service.description;

  return (
    <>
      <section className="border-b border-border">
        <Container size="site" className="pb-8 pt-8 sm:pb-10 sm:pt-10">
          <Breadcrumbs
            items={[
              { label: 'Главная', href: '/' },
              { label: 'Услуги и цены', href: '/services' },
              { label: group.title, href: `/services/${group.id}` },
              { label: service.title },
            ]}
          />
          <div className="mt-5 grid gap-x-12 gap-y-8 lg:grid-cols-[1fr_360px]">
            <div className="min-w-0">
              <Heading variant="display-sm" font="display" as="h1" className="uppercase">
                {service.title}
              </Heading>
              <p className="mt-5 font-mono text-2xl text-content">
                {formatPriceFrom(service)}
                {' руб.'}
                {service.unit !== null && (
                  <span className="ml-2 text-caption text-content-dim">
                    {UNIT_SHORT[service.unit]}
                  </span>
                )}
              </p>
              {details !== '' && (
                <Text
                  variant="lead"
                  color="muted"
                  className="mt-6 max-w-[640px] whitespace-pre-line"
                >
                  {details}
                </Text>
              )}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <CallbackButton
                  size="lg"
                  preselectedService={service.title}
                  className="sm:min-w-[220px]"
                />
                <a
                  href={`tel:${phone.value}`}
                  className="flex items-center justify-center gap-2 font-mono text-body text-content-muted transition-colors hover:text-content"
                >
                  <Phone aria-hidden="true" className="size-4" strokeWidth={2} />
                  {phone.pretty}
                </a>
              </div>
            </div>
            {photo !== null && (
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border lg:aspect-[360/300]">
                <img
                  src={photo}
                  alt={`${service.title} — ${site.name}`}
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover"
                />
              </div>
            )}
          </div>
        </Container>
      </section>

      <Container size="site" className="pb-20 pt-10">
        {others.length > 0 && (
          <section aria-labelledby="related-services">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-border pb-3">
              <Heading id="related-services" variant="h4" as="h2" className="uppercase">
                Другие услуги направления
              </Heading>
              <a
                href={`/services/${group.id}`}
                className="group flex items-center gap-2 font-mono text-caption uppercase tracking-[0.1em] text-content-dim transition-colors hover:text-primary"
              >
                все услуги
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </a>
            </div>
            <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {others.map((item) => (
                <li key={item.id}>
                  <ServiceCard
                    service={item}
                    group={group}
                    href={`/services/${group.id}/${item.id}`}
                    className="h-full"
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>
    </>
  );
}
