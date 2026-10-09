'use client';

import { useState } from 'react';
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
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Tabs, TabsContent, TabsList, TabsTrigger, Text } from '@sto/ui';
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

function SortableGroupHeader({
  group,
  index,
  onEdit,
  onDelete,
  onAddService,
}: {
  group: ServiceGroupRow;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onAddService: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${GROUP_PREFIX}${group.id}`,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-wrap items-center gap-3 transition-opacity ${
        isDragging ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <button
        type="button"
        aria-label="Порядок группы"
        className="flex size-7 cursor-grab touch-none items-center justify-center rounded text-content-dim hover:text-content active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <DragHandle />
      </button>
      <span className="w-4 font-mono text-caption text-content-dim">{index + 1}</span>
      <h3 className="font-mono text-base font-bold uppercase tracking-[0.08em] text-content">
        {group.title}
      </h3>
      <span className="font-mono text-caption uppercase tracking-[0.08em] text-content-dim">
        {group.services.length}
      </span>
      {!group.isActive ? <Badge variant="neutral">скрыта</Badge> : null}
      <span aria-hidden="true" className="h-px min-w-6 flex-1 bg-border" />
      <Button variant="ghost" size="sm" onClick={onAddService}>
        <Plus className="size-3.5" aria-hidden="true" />
        Услуга
      </Button>
      <Button variant="outline" size="sm" onClick={onEdit}>
        <Pencil className="size-3.5" aria-hidden="true" />
        Изменить
      </Button>
      <Button variant="ghost" size="sm" onClick={onDelete}>
        Удалить
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
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 px-2 py-2.5 transition-opacity sm:grid-cols-[auto_auto_auto_1fr_auto_auto_auto_auto] ${
        isDragging ? 'opacity-0' : 'opacity-100 hover:bg-panel-2/60'
      } ${service.isActive ? '' : 'opacity-60'}`}
    >
      <button
        type="button"
        aria-label="Порядок услуги"
        className="flex size-7 cursor-grab touch-none items-center justify-center rounded text-content-dim hover:text-content active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <DragHandle />
      </button>
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
        {priceLabel(service)} BYN
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

function ServiceCard({ service }: { service: ServiceRow }): React.JSX.Element {
  return (
    <div className="flex cursor-grabbing items-center gap-3 rounded-lg border border-border bg-panel-2 px-4 py-3 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.55)]">
      <DragHandle />
      <span className="text-body font-semibold text-content">{service.title}</span>
      <span className="font-mono text-caption text-content-dim">{priceLabel(service)} BYN</span>
    </div>
  );
}

function GroupCard({ group }: { group: ServiceGroupRow }): React.JSX.Element {
  return (
    <div className="flex cursor-grabbing items-center gap-3 rounded-lg border border-border bg-panel-2 px-4 py-3 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.55)]">
      <DragHandle />
      <span className="font-mono text-base font-bold uppercase tracking-[0.08em] text-content">
        {group.title}
      </span>
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
  const [dragging, setDragging] = useState<{ kind: 'group' | 'service'; id: string } | null>(null);

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

  const onDragStart = (event: DragStartEvent): void => {
    const id = String(event.active.id);
    setDragging(id.startsWith(GROUP_PREFIX) ? { kind: 'group', id } : { kind: 'service', id });
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
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4">
              <Text color="dim">
                Порядок групп и услуг меняется перетаскиванием за «⠿» и сохраняется сразу.
              </Text>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGroupDialog({ open: true, group: null })}
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Группа
              </Button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={onDragStart}
              onDragEnd={(event) => void onDragEnd(event)}
              onDragCancel={() => setDragging(null)}
            >
              <SortableContext items={groups.map((group) => `${GROUP_PREFIX}${group.id}`)}>
                <div className="flex flex-col gap-6">
                  {groups.map((group, index) => (
                    <section
                      key={group.id}
                      className="flex flex-col gap-3 rounded-xl border border-border bg-panel p-5"
                    >
                      <SortableGroupHeader
                        group={group}
                        index={index}
                        onEdit={() => setGroupDialog({ open: true, group })}
                        onDelete={() => setConfirmGroup(group)}
                        onAddService={() =>
                          setServiceDialog({ open: true, service: null, groupId: group.id })
                        }
                      />
                      <SortableContext items={group.services.map((service) => service.id)}>
                        <div className="flex flex-col divide-y divide-border">
                          {group.services.map((service, serviceIndex) => (
                            <SortableServiceRow
                              key={service.id}
                              service={service}
                              index={serviceIndex}
                              deleting={deletingService && confirmService?.id === service.id}
                              onEdit={() =>
                                setServiceDialog({ open: true, service, groupId: group.id })
                              }
                              onDelete={() => setConfirmService(service)}
                            />
                          ))}
                          {group.services.length === 0 ? (
                            <Text variant="caption" color="dim" className="px-2 py-3">
                              В группе пока нет услуг.
                            </Text>
                          ) : null}
                        </div>
                      </SortableContext>
                    </section>
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {overlayGroup !== undefined ? (
                  <GroupCard group={overlayGroup} />
                ) : overlayService !== undefined ? (
                  <ServiceCard service={overlayService} />
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

      {confirmService !== null ? (
        <ConfirmBar
          text={`Удалить «${confirmService.title}»? Отменить будет нельзя.`}
          pending={deletingService}
          onConfirm={() => void deleteService()}
          onCancel={() => setConfirmService(null)}
        />
      ) : null}

      {confirmGroup !== null ? (
        <ConfirmBar
          text={`Удалить группу «${confirmGroup.title}» и её услуги (${confirmGroup.services.length})?`}
          pending={deletingGroup}
          onConfirm={() => void deleteGroup()}
          onCancel={() => setConfirmGroup(null)}
        />
      ) : null}
    </div>
  );
}

function ConfirmBar({
  text,
  pending,
  onConfirm,
  onCancel,
}: {
  text: string;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="alertdialog"
      aria-label="Подтверждение удаления"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger/40 bg-panel px-4 py-3"
    >
      <Text variant="body">{text}</Text>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Отмена
        </Button>
        <Button variant="primary" size="sm" loading={pending} onClick={onConfirm}>
          Точно удалить
        </Button>
      </div>
    </div>
  );
}
