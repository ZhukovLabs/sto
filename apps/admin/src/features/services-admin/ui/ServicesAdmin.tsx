'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EyeOff, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { Badge, Button, Input, Tabs, TabsContent, TabsList, TabsTrigger, Text } from '@sto/ui';
import {
  SERVICE_UNIT_LABELS,
  readProxyError,
  type ServiceGroupRow,
  type ServiceRow,
  type ServicesCatalog,
} from '@/lib/api';
import { GroupDialog } from './GroupDialog';
import { ServiceDialog } from './ServiceDialog';
import { ShowcaseTab } from './ShowcaseTab';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

const GROUP_PREFIX = 'group:';

async function fetchCatalog(): Promise<ServicesCatalog> {
  const response = await fetch('/api/services');
  if (!response.ok) {
    throw await readProxyError(response, 'Не удалось загрузить услуги');
  }
  return response.json();
}

function put(url: string, body: unknown): Promise<void> {
  return fetch(url, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (response) => {
    if (!response.ok) {
      throw await readProxyError(response, 'Не удалось сохранить порядок');
    }
  });
}

function priceLabel(service: ServiceRow): string {
  const range =
    service.priceTo === null
      ? `от ${service.priceFrom}`
      : `${service.priceFrom}–${service.priceTo}`;
  return service.unit === null ? range : `${range} ${SERVICE_UNIT_LABELS[service.unit]}`;
}

function photoSrc(photo: string): string {
  return photo.startsWith('/services/')
    ? `/services/photos/${photo.slice('/services/'.length)}`
    : photo;
}

function DragHandle(): React.JSX.Element {
  return (
    <span className="flex size-7 select-none items-center justify-center rounded font-mono text-caption leading-none text-content-dim">
      ⠿
    </span>
  );
}

function servicePlural(count: number): string {
  const last = count % 10;
  const lastTwo = count % 100;
  if (last === 1 && lastTwo !== 11) return 'услуга';
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return 'услуги';
  return 'услуг';
}

function SortableGroupListItem({
  group,
  index,
  active,
  onSelect,
}: {
  group: ServiceGroupRow;
  index: number;
  active: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${GROUP_PREFIX}${group.id}`,
  });
  return (
    <div
      ref={setNodeRef}
      data-sortable-id={`${GROUP_PREFIX}${group.id}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: [transition, 'opacity 140ms ease'].filter(Boolean).join(', '),
      }}
      className={`group/item relative flex items-center gap-1 rounded-lg ${
        isDragging ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <button
        type="button"
        aria-label={`Порядок группы «${group.title}»`}
        className="flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-content-dim opacity-0 transition-opacity hover:text-content focus-visible:opacity-100 active:cursor-grabbing group-hover/item:opacity-100"
        {...attributes}
        {...listeners}
      >
        <span className="font-mono text-caption leading-none">⠿</span>
      </button>
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? 'true' : undefined}
        className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-colors motion-reduce:transition-none ${
          active
            ? 'bg-panel-2 text-content shadow-[inset_2px_0_0_0_var(--color-primary)]'
            : 'text-content-muted hover:bg-panel-2/60 hover:text-content'
        }`}
      >
        <span className="w-4 shrink-0 font-mono text-caption text-content-dim">{index + 1}</span>
        <span className="min-w-0 flex-1 truncate font-mono text-caption uppercase tracking-[0.06em]">
          {group.title}
        </span>
        {group.isActive ? null : (
          <EyeOff className="size-3.5 shrink-0 text-content-dim" aria-hidden="true" />
        )}
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 font-mono text-micro leading-none ${
            active ? 'bg-primary/15 text-primary' : 'bg-panel-2 text-content-dim'
          }`}
        >
          {group.services.length}
        </span>
      </button>
    </div>
  );
}

function ServiceRowInner({
  service,
  index,
  handle,
  onEdit,
  onDelete,
  deleting,
}: {
  service: ServiceRow;
  index: number;
  handle: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 px-2 py-3 hover:bg-panel-2/60 sm:grid-cols-[auto_auto_auto_1fr_auto_auto_auto_auto] ${
        service.isActive ? '' : 'opacity-60'
      }`}
    >
      {handle}
      <span className="w-4 font-mono text-caption text-content-dim">{index + 1}</span>
      {service.photo !== null ? (
        <img
          src={photoSrc(service.photo)}
          alt=""
          className="hidden size-9 rounded object-cover sm:block"
        />
      ) : (
        <span className="hidden size-9 rounded bg-panel-2 sm:block" aria-hidden="true" />
      )}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-body font-semibold text-content">{service.title}</span>
        <span className="truncate font-mono text-caption text-content-dim">
          {service.description}
        </span>
      </span>
      <span className="hidden whitespace-nowrap font-mono text-caption text-content sm:block">
        {priceLabel(service)} руб.
      </span>
      {!service.isActive ? (
        <span className="hidden sm:inline-flex">
          <Badge variant="neutral">скрыта</Badge>
        </span>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
        aria-label={`Изменить «${service.title}»`}
      >
        <Pencil className="size-3.5" aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        loading={deleting}
        onClick={onDelete}
        aria-label={`Удалить «${service.title}»`}
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}

function SortableServiceRow({
  service,
  index,
  onEdit,
  onDelete,
  deleting,
}: {
  service: ServiceRow;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: service.id,
  });
  return (
    <div
      ref={setNodeRef}
      data-sortable-id={service.id}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: [transition, 'opacity 140ms ease'].filter(Boolean).join(', '),
      }}
      className={isDragging ? 'opacity-0' : 'opacity-100'}
    >
      <ServiceRowInner
        service={service}
        index={index}
        handle={
          <button
            type="button"
            aria-label="Порядок услуги"
            className="flex size-7 cursor-grab touch-none items-center justify-center rounded text-content-dim hover:text-content active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <DragHandle />
          </button>
        }
        onEdit={onEdit}
        onDelete={onDelete}
        deleting={deleting}
      />
    </div>
  );
}

export function ServicesAdmin() {
  const queryClient = useQueryClient();
  const catalog = useQuery({ queryKey: ['admin-services'], queryFn: fetchCatalog });
  const [tab, setTab] = useState('catalog');

  const [serviceDialog, setServiceDialog] = useState<{
    open: boolean;
    service: ServiceRow | null;
    groupId: string;
  }>({ open: false, service: null, groupId: '' });
  const [groupDialog, setGroupDialog] = useState<{ open: boolean; group: ServiceGroupRow | null }>({
    open: false,
    group: null,
  });
  const [confirmGroup, setConfirmGroup] = useState<ServiceGroupRow | null>(null);
  const [confirmService, setConfirmService] = useState<ServiceRow | null>(null);
  const [deletingService, setDeletingService] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{
    kind: 'group' | 'service';
    id: string;
    width: number;
  } | null>(null);

  const invalidate = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['admin-services'] });
  };

  const closeDialogs = (): void => {
    setServiceDialog((prev) => ({ ...prev, open: false }));
    setGroupDialog((prev) => ({ ...prev, open: false }));
  };

  /** Мгновенно применяет новый каталог к кэшу react-query (для оптимистичных drag-n-drop и отката). */
  const setCatalog = (updater: (data: ServicesCatalog) => ServicesCatalog): void => {
    queryClient.setQueryData<ServicesCatalog>(['admin-services'], (data) =>
      data === undefined ? data : updater(data),
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const groups = catalog.data?.groups ?? [];

  const [query, setQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const searching = normalizedQuery !== '';

  const filteredGroups = useMemo(() => {
    if (!searching) return groups;
    return groups
      .map((group) => ({
        ...group,
        services: group.services.filter(
          (service) =>
            service.title.toLowerCase().includes(normalizedQuery) ||
            service.description.toLowerCase().includes(normalizedQuery),
        ),
      }))
      .filter(
        (group) => group.services.length > 0 || group.title.toLowerCase().includes(normalizedQuery),
      );
  }, [groups, normalizedQuery, searching]);

  const selectedGroup = useMemo(() => {
    const found = groups.find((group) => group.id === selectedGroupId);
    return found ?? groups[0] ?? null;
  }, [groups, selectedGroupId]);

  const onDragStart = (event: DragStartEvent): void => {
    const id = String(event.active.id);
    const node = document.querySelector(`[data-sortable-id="${id}"]`);
    setDragging({
      kind: id.startsWith(GROUP_PREFIX) ? 'group' : 'service',
      id,
      width: node ? node.getBoundingClientRect().width : 0,
    });
  };

  const onDragEnd = async (event: DragEndEvent): Promise<void> => {
    setDragging(null);
    const { active, over } = event;
    if (over === null || active.id === over.id) {
      return;
    }
    const activeId = String(active.id);
    const overId = String(over.id);
    const snapshot = catalog.data;
    if (snapshot === undefined) {
      return;
    }
    setOrderError(null);
    try {
      if (activeId.startsWith(GROUP_PREFIX) && overId.startsWith(GROUP_PREFIX)) {
        const next = arrayMove(
          snapshot.groups.map((group) => group.id),
          snapshot.groups.findIndex((group) => `${GROUP_PREFIX}${group.id}` === activeId),
          snapshot.groups.findIndex((group) => `${GROUP_PREFIX}${group.id}` === overId),
        );
        setCatalog((data) => ({
          ...data,
          groups: next.flatMap((id, position) => {
            const group = data.groups.find((item) => item.id === id);
            return group === undefined ? [] : [{ ...group, position }];
          }),
        }));
        await put('/api/services/groups/order', { ids: next });
        return;
      }
      if (!activeId.startsWith(GROUP_PREFIX) && !overId.startsWith(GROUP_PREFIX)) {
        const group = snapshot.groups.find((item) =>
          item.services.some((service) => service.id === activeId),
        );
        if (group === undefined) {
          return;
        }
        const next = arrayMove(
          group.services.map((service) => service.id),
          group.services.findIndex((service) => service.id === activeId),
          group.services.findIndex((service) => service.id === overId),
        );
        setCatalog((data) => ({
          ...data,
          groups: data.groups.map((item) =>
            item.id !== group.id
              ? item
              : {
                  ...item,
                  services: next.flatMap((id, position) => {
                    const service = item.services.find((row) => row.id === id);
                    return service === undefined ? [] : [{ ...service, position }];
                  }),
                },
          ),
        }));
        await put('/api/services/order', { groupId: group.id, ids: next });
      }
    } catch (error) {
      setCatalog(() => snapshot);
      setOrderError(error instanceof Error ? error.message : 'Не удалось сохранить порядок');
    }
  };

  const deleteService = async (): Promise<void> => {
    if (confirmService === null) {
      return;
    }
    setDeletingService(true);
    try {
      const response = await fetch(`/api/services/${confirmService.id}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 404) {
        throw await readProxyError(response, 'Не удалось удалить услугу');
      }
      setConfirmService(null);
      invalidate();
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'Не удалось удалить услугу');
    } finally {
      setDeletingService(false);
    }
  };

  const deleteGroup = async (): Promise<void> => {
    if (confirmGroup === null) {
      return;
    }
    setDeletingGroup(true);
    try {
      const response = await fetch(`/api/services/groups/${confirmGroup.id}`, {
        method: 'DELETE',
      });
      if (!response.ok && response.status !== 404) {
        throw await readProxyError(response, 'Не удалось удалить группу');
      }
      setConfirmGroup(null);
      invalidate();
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'Не удалось удалить группу');
    } finally {
      setDeletingGroup(false);
    }
  };

  if (catalog.isPending) {
    return (
      <Text variant="body" color="dim">
        Загружаем…
      </Text>
    );
  }

  if (catalog.isError) {
    return (
      <Text variant="body" className="text-danger">
        {catalog.error instanceof Error ? catalog.error.message : 'Не удалось загрузить услуги'}
      </Text>
    );
  }

  const overlayGroup =
    dragging?.kind === 'group'
      ? groups.find((group) => `${GROUP_PREFIX}${group.id}` === dragging.id)
      : undefined;
  const overlayService =
    dragging?.kind === 'service'
      ? groups.flatMap((group) => group.services).find((service) => service.id === dragging.id)
      : undefined;

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={tab} onChange={setTab}>
        <TabsList aria-label="Разделы услуг">
          <TabsTrigger value="catalog">Каталог</TabsTrigger>
          <TabsTrigger value="showcase">Витрина главной</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <div className="flex flex-col gap-5">
            <div className="relative w-full sm:max-w-64">
              <Input
                size="sm"
                leftIcon={<Search className="size-4" aria-hidden="true" />}
                placeholder="Поиск услуги"
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

            <DndContext
              id="services-order"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={onDragStart}
              onDragEnd={(event) => void onDragEnd(event)}
              onDragCancel={() => setDragging(null)}
            >
              <div className="grid items-start gap-6 lg:grid-cols-[264px_1fr] lg:gap-8">
                <aside className="hidden lg:block">
                  <div className="sticky top-20 flex flex-col gap-1.5">
                    <span className="px-1 pb-1 font-mono text-micro uppercase tracking-[0.14em] text-content-dim">
                      Группы
                    </span>
                    <SortableContext items={groups.map((group) => `${GROUP_PREFIX}${group.id}`)}>
                      {groups.map((group, index) => (
                        <SortableGroupListItem
                          key={group.id}
                          group={group}
                          index={index}
                          active={selectedGroup?.id === group.id && !searching}
                          onSelect={() => setSelectedGroupId(group.id)}
                        />
                      ))}
                    </SortableContext>
                    <div className="mt-2 border-t border-border pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setGroupDialog({ open: true, group: null })}
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                        Группа
                      </Button>
                    </div>
                  </div>
                </aside>

                <div className="scroll-slim -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:hidden">
                  {groups.map((group) => {
                    const active = group.id === selectedGroup?.id && !searching;
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => setSelectedGroupId(group.id)}
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
                  <button
                    type="button"
                    onClick={() => setGroupDialog({ open: true, group: null })}
                    className="shrink-0 rounded-full border border-dashed border-border-strong px-3.5 py-1.5 font-mono text-caption uppercase tracking-[0.08em] text-content-dim transition-colors hover:border-primary hover:text-primary"
                  >
                    + Группа
                  </button>
                </div>

                {searching ? (
                  <div className="flex min-w-0 flex-col gap-3">
                    {filteredGroups.length === 0 ? (
                      <Text variant="body" color="muted" className="py-10 text-center">
                        По запросу «{query.trim()}» ничего не нашлось.
                      </Text>
                    ) : (
                      filteredGroups.map((group) => (
                        <div key={group.id}>
                          <span className="mb-1.5 block px-1 font-mono text-micro uppercase tracking-[0.14em] text-content-dim">
                            {group.title} · {group.services.length}
                          </span>
                          <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-panel p-2">
                            {group.services.map((service, serviceIndex) => (
                              <ServiceRowInner
                                key={service.id}
                                service={service}
                                index={serviceIndex}
                                handle={<span aria-hidden className="size-7" />}
                                onEdit={() =>
                                  setServiceDialog({ open: true, service, groupId: group.id })
                                }
                                onDelete={() => setConfirmService(service)}
                                deleting={deletingService && confirmService?.id === service.id}
                              />
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : selectedGroup === null ? (
                  <div className="rounded-xl border border-dashed border-border-strong px-6 py-12 text-center">
                    <Text variant="body" color="muted">
                      Групп пока нет — создайте первую.
                    </Text>
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-4"
                      onClick={() => setGroupDialog({ open: true, group: null })}
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                      Группа
                    </Button>
                  </div>
                ) : (
                  <section className="flex min-w-0 flex-col gap-5 rounded-xl border border-border bg-panel p-6 sm:p-7">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
                      <h3 className="font-mono text-base font-bold uppercase tracking-[0.08em] text-content">
                        {selectedGroup.title}
                      </h3>
                      <span className="font-mono text-caption uppercase tracking-[0.08em] text-content-muted">
                        {selectedGroup.services.length}{' '}
                        {servicePlural(selectedGroup.services.length)}
                      </span>
                      {!selectedGroup.isActive ? <Badge variant="neutral">скрыта</Badge> : null}
                      <span className="ml-auto flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setGroupDialog({ open: true, group: selectedGroup })}
                          aria-label={`Изменить группу «${selectedGroup.title}»`}
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:bg-danger/10"
                          onClick={() => setConfirmGroup(selectedGroup)}
                          aria-label={`Удалить группу «${selectedGroup.title}»`}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            setServiceDialog({
                              open: true,
                              service: null,
                              groupId: selectedGroup.id,
                            })
                          }
                        >
                          <Plus className="size-3.5" aria-hidden="true" />
                          Услуга
                        </Button>
                      </span>
                    </div>

                    <SortableContext items={selectedGroup.services.map((service) => service.id)}>
                      <div className="flex flex-col divide-y divide-border">
                        {selectedGroup.services.map((service, serviceIndex) => (
                          <SortableServiceRow
                            key={service.id}
                            service={service}
                            index={serviceIndex}
                            deleting={deletingService && confirmService?.id === service.id}
                            onEdit={() =>
                              setServiceDialog({
                                open: true,
                                service,
                                groupId: selectedGroup.id,
                              })
                            }
                            onDelete={() => setConfirmService(service)}
                          />
                        ))}
                        {selectedGroup.services.length === 0 ? (
                          <Text variant="caption" color="dim" className="px-2 py-4 text-center">
                            В группе пока нет услуг — добавьте первую.
                          </Text>
                        ) : null}
                      </div>
                    </SortableContext>
                  </section>
                )}
              </div>
              <DragOverlay
                dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}
              >
                {overlayGroup !== undefined && dragging !== null ? (
                  <div
                    className="pointer-events-none flex animate-fade-in items-center gap-1 rounded-lg border border-border-strong bg-panel-2 px-1 py-0.5 text-content shadow-[inset_2px_0_0_0_var(--color-primary),0_24px_48px_-12px_rgba(0,0,0,0.7)]"
                    style={{ width: dragging.width }}
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-6 shrink-0 items-center justify-center font-mono text-caption text-content-dim"
                    >
                      ⠿
                    </span>
                    <span className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2.5">
                      <span className="w-4 shrink-0 font-mono text-caption text-content-dim">
                        {groups.findIndex((group) => group.id === overlayGroup.id) + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-caption uppercase tracking-[0.06em]">
                        {overlayGroup.title}
                      </span>
                      {overlayGroup.isActive ? null : (
                        <EyeOff className="size-3.5 shrink-0 text-content-dim" aria-hidden="true" />
                      )}
                      <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-micro leading-none text-primary">
                        {overlayGroup.services.length}
                      </span>
                    </span>
                  </div>
                ) : overlayService !== undefined && dragging !== null ? (
                  <div
                    className="pointer-events-none animate-fade-in rounded-lg border border-border-strong bg-panel shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)]"
                    style={{ width: dragging.width }}
                  >
                    <ServiceRowInner
                      service={overlayService}
                      index={
                        groups
                          .find((group) =>
                            group.services.some((service) => service.id === overlayService.id),
                          )
                          ?.services.findIndex((service) => service.id === overlayService.id) ?? 0
                      }
                      handle={
                        <span
                          aria-hidden="true"
                          className="flex size-7 items-center justify-center font-mono text-caption text-content-dim"
                        >
                          ⠿
                        </span>
                      }
                      onEdit={() => {}}
                      onDelete={() => {}}
                      deleting={false}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>

            {orderError !== null ? (
              <Text variant="caption" className="text-danger">
                {orderError}
              </Text>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="showcase">
          <ShowcaseTab catalog={catalog.data} onSaved={invalidate} />
        </TabsContent>
      </Tabs>

      <ServiceDialog
        open={serviceDialog.open}
        onClose={closeDialogs}
        onSaved={invalidate}
        groups={groups}
        service={serviceDialog.service}
        defaultGroupId={serviceDialog.groupId || groups[0]?.id || ''}
      />

      <GroupDialog
        open={groupDialog.open}
        onClose={closeDialogs}
        onSaved={invalidate}
        group={groupDialog.group}
      />

      <ConfirmDialog
        open={confirmService !== null}
        title="Удалить услугу?"
        description={`«${confirmService?.title ?? ''}» будет удалена безвозвратно. Отменить будет нельзя.`}
        loading={deletingService}
        onConfirm={() => void deleteService()}
        onCancel={() => setConfirmService(null)}
      />

      <ConfirmDialog
        open={confirmGroup !== null}
        title="Удалить группу?"
        description={`Группа «${confirmGroup?.title ?? ''}» и её услуги (${confirmGroup?.services.length ?? 0}) будут удалены безвозвратно.`}
        loading={deletingGroup}
        onConfirm={() => void deleteGroup()}
        onCancel={() => setConfirmGroup(null)}
      />
    </div>
  );
}
