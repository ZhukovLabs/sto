'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, LayoutGrid, Table2 } from 'lucide-react';
import {
  SegmentedControl,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from '@/shared/ui';
import { groupIcon, PriceByn, ServiceCard } from '@/entities/service';
import type { CatalogGroup } from '@/entities/service';

const VIEW_STORAGE_KEY = 'sto-services-view';

type ViewMode = 'cards' | 'table';

const VIEW_ITEMS = [
  { value: 'cards', label: 'Карточки', icon: <LayoutGrid className="size-3.5" /> },
  { value: 'table', label: 'Таблица', icon: <Table2 className="size-3.5" /> },
];

function GroupTitle({ group }: { group: CatalogGroup }) {
  const Icon = groupIcon(group.icon);
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-panel-2">
        {Icon ? <Icon className="size-4 text-primary" aria-hidden="true" /> : null}
      </span>
      <h2 id={`group-${group.id}`} className="min-w-0">
        <a
          href={`/services/${group.id}`}
          className="font-mono text-base font-bold uppercase tracking-[0.08em] text-content transition-colors hover:text-primary"
        >
          {group.title}
        </a>
      </h2>
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
      <span className="font-mono text-caption uppercase tracking-[0.08em] text-content-dim">
        {group.services.length}
      </span>
    </div>
  );
}

function GroupCards({ group }: { group: CatalogGroup }) {
  return (
    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {group.services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          group={group}
          href={`/services/${group.id}/${service.id}`}
        />
      ))}
    </div>
  );
}

function GroupTable({
  group,
  onSelect,
}: {
  group: CatalogGroup;
  onSelect: (title: string) => void;
}) {
  return (
    <Table>
      <TableHead>
        <TableRow className="hover:bg-transparent">
          <TableHeadCell scope="col">Услуга</TableHeadCell>
          <TableHeadCell scope="col" className="w-32 text-right">
            Цена
          </TableHeadCell>
          <TableHeadCell scope="col" className="w-14">
            <span className="sr-only">Записаться</span>
          </TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {group.services.map((service) => (
          <TableRow key={service.id}>
            <TableCell>
              <div className="flex flex-col gap-0.5">
                <a
                  href={`/services/${group.id}/${service.id}`}
                  className="font-medium transition-colors hover:text-primary"
                >
                  {service.title}
                </a>
                <span className="text-caption text-content-muted">{service.description}</span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <PriceByn service={service} className="font-mono text-sm font-bold text-primary" />
            </TableCell>
            <TableCell className="text-right">
              <button
                type="button"
                onClick={() => onSelect(service.title)}
                aria-label={`Записаться: ${service.title}`}
                className="flex size-8 items-center justify-center rounded-md bg-panel-2 transition-colors hover:bg-primary-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <ArrowRight className="size-4 text-primary" aria-hidden="true" />
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ServicesCatalog({
  catalog,
  onOrder,
}: {
  catalog: CatalogGroup[];
  /** Вызывается с названием услуги или '' для записи без предвыбора */
  onOrder: (service: string) => void;
}) {
  const [view, setView] = useState<ViewMode>('cards');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
      if (saved === 'table' || saved === 'cards') {
        setView(saved);
      }
    } catch {
      // localStorage недоступен — остаёмся на дефолте
    }
  }, []);

  const changeView = (next: string) => {
    if (next !== 'cards' && next !== 'table') return;
    setView(next);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // приватный режим — просто не запоминаем
    }
  };

  const totalCount = catalog.reduce((sum, group) => sum + group.services.length, 0);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-caption uppercase tracking-[0.08em] text-content-dim">
          {totalCount} услуг · цены ориентировочные
        </span>
        <div className="hidden sm:block">
          <SegmentedControl
            aria-label="Вид отображения услуг"
            items={VIEW_ITEMS}
            value={view}
            onChange={changeView}
          />
        </div>
      </div>

      {catalog.map((group) => (
        <section
          key={group.id}
          aria-labelledby={`group-${group.id}`}
          className="flex flex-col gap-5"
        >
          <GroupTitle group={group} />
          {view === 'cards' ? (
            <GroupCards group={group} />
          ) : (
            <>
              <div className="sm:hidden">
                <GroupCards group={group} />
              </div>
              <div className="hidden sm:block">
                <GroupTable group={group} onSelect={onOrder} />
              </div>
            </>
          )}
        </section>
      ))}

      <button
        type="button"
        onClick={() => onOrder('')}
        className="group flex h-14 items-center justify-between rounded-lg bg-primary px-6 transition-colors duration-300 hover:bg-primary-hover sm:px-8"
      >
        <span className="text-left font-mono text-sm font-bold uppercase tracking-[0.12em] text-primary-ink sm:text-base">
          Запишитесь онлайн — сами выберете время
        </span>
        <ArrowRight
          className="size-6 shrink-0 text-primary-ink transition-transform duration-300 group-hover:translate-x-2"
          aria-hidden="true"
        />
      </button>
      <p className="-mt-6 text-caption leading-normal text-content-dim">
        Точную стоимость называем после осмотра и фиксируем до начала работ — цена не меняется. Не
        нашли нужную услугу — позвоните, подскажем.
      </p>
    </div>
  );
}
