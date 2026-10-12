'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, LayoutGrid, Search, Table2, X } from 'lucide-react';
import {
  Input,
  SegmentedControl,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Text,
} from '@/shared/ui';
import { groupIcon, PriceByn, ServiceCard } from '@/entities/service';
import type { CatalogGroup } from '@/entities/service';

const VIEW_STORAGE_KEY = 'sto-services-view';

type ViewMode = 'cards' | 'table';

const VIEW_ITEMS = [
  { value: 'cards', label: 'Карточки', icon: <LayoutGrid className="size-3.5" /> },
  { value: 'table', label: 'Таблица', icon: <Table2 className="size-3.5" /> },
];

function servicePlural(count: number): string {
  const last = count % 10;
  const lastTwo = count % 100;
  if (last === 1 && lastTwo !== 11) return 'услуга';
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return 'услуги';
  return 'услуг';
}

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
      <span className="font-mono text-caption uppercase tracking-[0.08em] text-content-muted">
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
  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState(catalog[0]?.id ?? null);
  const chipsRef = useRef<HTMLDivElement>(null);

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

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (normalizedQuery === '') return catalog;
    return catalog
      .map((group) => ({
        ...group,
        services: group.services.filter(
          (service) =>
            service.title.toLowerCase().includes(normalizedQuery) ||
            service.description.toLowerCase().includes(normalizedQuery),
        ),
      }))
      .filter((group) => group.services.length > 0);
  }, [catalog, normalizedQuery]);

  useEffect(() => {
    if (normalizedQuery !== '') return;
    const sections = catalog
      .map((group) => document.getElementById(`group-${group.id}`))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id.startsWith('group-')) {
          setActiveGroup(visible[0].target.id.slice('group-'.length));
        }
      },
      { rootMargin: '-25% 0px -65% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [catalog, normalizedQuery]);

  const scrollToGroup = (groupId: string) => {
    const el = document.getElementById(`group-${groupId}`);
    if (el === null) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const chip = chipsRef.current?.querySelector<HTMLButtonElement>(`[data-group="${groupId}"]`);
    chip?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  const totalCount = filtered.reduce((sum, group) => sum + group.services.length, 0);

  return (
    <div className="flex flex-col gap-10">
      <div className="sticky top-14 z-30 -mx-4 border-b border-border bg-bg/95 px-4 py-3 backdrop-blur-md sm:top-16 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-full sm:max-w-xs">
              <div className="relative">
                <Input
                  size="sm"
                  leftIcon={<Search className="size-4" aria-hidden="true" />}
                  placeholder="Найти услугу — масло, колодки…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Поиск услуги"
                  className="w-full"
                />
                {query !== '' ? (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Очистить поиск"
                    className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-content-dim transition-colors hover:bg-panel-2 hover:text-content"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>
            <span className="ml-auto hidden shrink-0 font-mono text-caption uppercase tracking-[0.08em] text-content-muted lg:block">
              {totalCount} {servicePlural(totalCount)}
            </span>
            <div className="ml-auto hidden shrink-0 sm:block lg:ml-4">
              <SegmentedControl
                aria-label="Вид отображения услуг"
                items={VIEW_ITEMS}
                value={view}
                onChange={changeView}
              />
            </div>
          </div>
          {normalizedQuery === '' ? (
            <div
              ref={chipsRef}
              role="navigation"
              aria-label="Разделы услуг"
              className="scroll-slim -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5"
            >
              {catalog.map((group) => {
                const active = group.id === activeGroup;
                return (
                  <button
                    key={group.id}
                    type="button"
                    data-group={group.id}
                    onClick={() => scrollToGroup(group.id)}
                    aria-current={active ? 'true' : undefined}
                    className={`shrink-0 rounded-full border px-3.5 py-1.5 font-mono text-caption uppercase tracking-[0.08em] transition-colors motion-reduce:transition-none ${
                      active
                        ? 'border-primary bg-primary text-primary-ink'
                        : 'border-border bg-panel text-content-muted hover:border-border-strong hover:text-content'
                    }`}
                  >
                    {group.title}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Text variant="body" color="muted" className="py-12 text-center">
          По запросу «{query.trim()}» ничего не нашлось. Позвоните — подскажем по любой работе.
        </Text>
      ) : (
        filtered.map((group) => (
          <section
            key={group.id}
            aria-labelledby={`group-${group.id}`}
            className="flex scroll-mt-36 flex-col gap-5"
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
        ))
      )}

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
