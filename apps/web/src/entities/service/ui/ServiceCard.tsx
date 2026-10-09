import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Circle, Cog, Disc, Gauge, ScanLine, Snowflake, Wrench } from 'lucide-react';
import { BynSign } from '@sto/ui';
import type { GroupIconKey, Service, ServiceGroup, ServiceUnit } from '../model/types';

const ICONS: Record<GroupIconKey, LucideIcon> = {
  scan: ScanLine,
  wrench: Wrench,
  disc: Disc,
  cog: Cog,
  gauge: Gauge,
  circle: Circle,
  snowflake: Snowflake,
};

const BYN_CLASS = 'inline h-[0.76em] w-auto -translate-y-[0.08em]';

const UNIT_SHORT: Record<ServiceUnit, string> = {
  wheel: '/кол',
  pcs: '/шт',
  season: '/сезон',
};

export function groupIcon(icon: GroupIconKey | null): LucideIcon | null {
  return icon === null ? null : (ICONS[icon] ?? null);
}

export function servicePhoto(service: Service, group?: ServiceGroup): string | null {
  return service.photo ?? group?.photo ?? null;
}

export function PriceByn({ service, className }: { service: Service; className?: string }) {
  const unitShort = service.unit === null ? null : (UNIT_SHORT[service.unit] ?? null);
  return (
    <span className={`whitespace-nowrap ${className ?? ''}`}>
      {service.priceTo !== null
        ? `${service.priceFrom}–${service.priceTo}`
        : `от ${service.priceFrom}`}{' '}
      <BynSign className={BYN_CLASS} aria-label="белорусских рублей" />
      {unitShort ? <span className="text-[0.85em] text-content-dim"> {unitShort}</span> : null}
    </span>
  );
}

export interface ServiceCardProps {
  service: Service;
  group?: ServiceGroup;
  className?: string;
  /** Клик по карточке: в каталоге открывает диалог записи */
  onSelect?: (title: string) => void;
}

export function ServiceCard({ service, group, className, onSelect }: ServiceCardProps) {
  const Icon = groupIcon(group?.icon ?? null);
  const photo = servicePhoto(service, group);
  const interactiveClass =
    'group relative flex overflow-hidden rounded-lg border border-border bg-panel transition-colors duration-300 hover:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 max-sm:flex-row max-sm:items-center max-sm:gap-3 max-sm:p-3.5 sm:min-h-48 sm:flex-col sm:justify-end sm:p-5';
  const content = (
    <>
      {photo ? (
        <>
          <Image
            src={photo}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, 45vw"
            className="hidden object-cover opacity-55 transition-[opacity,scale] duration-500 group-hover:scale-[1.03] group-hover:opacity-70 motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:block"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 hidden bg-gradient-to-t from-bg via-bg/60 to-transparent sm:block"
          />
        </>
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-0 hidden items-center justify-center bg-panel-2 sm:flex"
        >
          {Icon ? <Icon className="size-12 text-content-dim" /> : null}
        </span>
      )}

      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-md bg-panel-2 transition-colors group-hover:bg-primary/15 sm:hidden`}
      >
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
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(service.title)}
        className={`${interactiveClass} text-left ${className ?? ''}`}
      >
        {content}
      </button>
    );
  }

  return (
    <a href="#" className={`${interactiveClass} ${className ?? ''}`}>
      {content}
    </a>
  );
}
