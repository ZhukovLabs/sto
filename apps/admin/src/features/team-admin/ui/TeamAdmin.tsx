'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  IconButton,
  SegmentedControl,
  Skeleton,
  Text,
} from '@sto/ui';
import { apiDelete, apiGet, apiSend } from '@/shared/api/client';
import { pluralRu } from '@/shared/lib/plural';
import { EmptyState } from '@/shared/ui/EmptyState';
import { SearchInput } from '@/shared/ui/SearchInput';
import type { TeamMemberRow } from '@/lib/api';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { MemberDialog } from './MemberDialog';

const TEAM_KEY = ['team'] as const;

const TEAM_FORMS = ['участник', 'участника', 'участников'] as const;

type TeamFilter = 'all' | 'active' | 'hidden';

const FILTER_OPTIONS = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'На сайте' },
  { value: 'hidden', label: 'Скрытые' },
];

/** Колонки строки: handle · № · фото · имя/должность · специализация (lg) · действия (фиксированная — иначе auto-ширина кнопок разъезжает шапку и строки) */
const TEAM_GRID_COLS =
  'grid-cols-[auto_auto_auto_minmax(0,1.2fr)_6.25rem] sm:grid-cols-[auto_auto_auto_minmax(0,1.2fr)_8.75rem] lg:grid-cols-[auto_auto_auto_minmax(0,1.2fr)_minmax(0,1fr)_8.75rem]';

const HEADER_CELL_CLASS =
  'font-mono text-caption font-bold uppercase tracking-[0.08em] text-content-dim';

function DragHandle(): React.JSX.Element {
  return (
    <span className="flex size-7 select-none items-center justify-center rounded font-mono text-caption leading-none text-content-dim">
      ⠿
    </span>
  );
}

function TeamHeaderRow(): React.JSX.Element {
  return (
    <div
      className={`grid ${TEAM_GRID_COLS} items-center gap-2 border-b border-border px-4 py-2.5 sm:gap-3 sm:px-5`}
    >
      <span aria-hidden="true" className="size-7" />
      <span className={`w-4 text-center ${HEADER_CELL_CLASS}`}>№</span>
      <span aria-hidden="true" className="size-11" />
      <span className={HEADER_CELL_CLASS}>Сотрудник</span>
      <span className={`hidden lg:block ${HEADER_CELL_CLASS}`}>Специализация</span>
      <span className={`flex justify-end ${HEADER_CELL_CLASS}`}>Действия</span>
    </div>
  );
}

function TeamRowInner({
  member,
  position,
  handle,
  toggling,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  member: TeamMemberRow;
  /** Позиция в полном списке — это порядок на сайте, не в выборке. */
  position: number;
  handle: React.ReactNode;
  toggling: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`grid ${TEAM_GRID_COLS} items-center gap-2 px-4 py-3 transition-colors hover:bg-panel-2/60 motion-reduce:transition-none sm:gap-3 sm:px-5 ${
        member.isActive ? '' : 'opacity-60'
      }`}
    >
      {handle}
      <span className="w-4 text-center font-mono text-caption text-content-dim">{position + 1}</span>
      <Avatar name={member.name} src={member.photo ?? undefined} size="md" shape="square" />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-body font-semibold text-content">{member.name}</span>
          {!member.isActive ? (
            <Badge variant="neutral" size="sm">
              скрыт
            </Badge>
          ) : null}
        </span>
        <span className="truncate font-mono text-caption uppercase tracking-[0.08em] text-content-dim">
          {member.role}
        </span>
      </span>
      <span className="hidden min-w-0 truncate text-caption text-content-muted lg:block">
        {member.spec}
      </span>
      <span className="flex items-center justify-end gap-1">
        <span className="hidden sm:inline-flex">
          <IconButton
            variant="ghost"
            size="sm"
            loading={toggling}
            label={
              member.isActive
                ? `Скрыть ${member.name} с сайта`
                : `Показать ${member.name} на сайте`
            }
            icon={
              member.isActive ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )
            }
            onClick={onToggleActive}
          />
        </span>
        <Button variant="outline" size="sm" aria-label={`Изменить ${member.name}`} onClick={onEdit}>
          <Pencil className="size-3.5" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-danger hover:bg-danger/10"
          aria-label={`Удалить ${member.name}`}
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </Button>
      </span>
    </div>
  );
}

function SortableRow({
  member,
  position,
  toggling,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  member: TeamMemberRow;
  position: number;
  toggling: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: member.id,
  });
  return (
    <div
      ref={setNodeRef}
      data-sortable-id={member.id}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: [transition, 'opacity 140ms ease'].filter(Boolean).join(', '),
      }}
      className={isDragging ? 'opacity-0' : 'opacity-100'}
    >
      <TeamRowInner
        member={member}
        position={position}
        toggling={toggling}
        handle={
          <button
            type="button"
            aria-label="Порядок участника"
            className="flex size-7 cursor-grab touch-none items-center justify-center rounded text-content-dim hover:text-content active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <DragHandle />
          </button>
        }
        onEdit={onEdit}
        onToggleActive={onToggleActive}
        onDelete={onDelete}
      />
    </div>
  );
}

export function TeamAdmin(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<TeamFilter>('all');
  const [actionError, setActionError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; member: TeamMemberRow | null }>({
    open: false,
    member: null,
  });
  const [confirming, setConfirming] = useState<TeamMemberRow | null>(null);
  const [drag, setDrag] = useState<{ id: string; width: number } | null>(null);
  const [pendingOrder, setPendingOrder] = useState<TeamMemberRow[] | null>(null);

  const teamQuery = useQuery({
    queryKey: TEAM_KEY,
    queryFn: () => apiGet<TeamMemberRow[]>('/api/team', 'Не удалось загрузить команду'),
  });
  const team = pendingOrder ?? teamQuery.data ?? null;

  const invalidate = (): void => {
    void queryClient.invalidateQueries({ queryKey: TEAM_KEY });
  };

  const onError = (error: Error): void => {
    setActionError(error.message);
  };

  const toggleActive = useMutation({
    mutationFn: (member: TeamMemberRow) =>
      apiSend(
        `/api/team/${member.id}`,
        'PATCH',
        { isActive: !member.isActive },
        'Не удалось изменить видимость',
      ),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError,
  });

  const removeMember = useMutation({
    mutationFn: (member: TeamMemberRow) =>
      apiDelete(`/api/team/${member.id}`, 'Не удалось удалить участника'),
    onSuccess: () => {
      setActionError(null);
      setConfirming(null);
      invalidate();
    },
    onError,
  });

  const persistOrder = useMutation({
    mutationFn: (ids: string[]) =>
      apiSend('/api/team/order', 'PUT', { ids }, 'Не удалось сохранить порядок'),
    onSuccess: () => {
      setActionError(null);
      setPendingOrder(null);
      invalidate();
    },
    onError: (error: Error) => {
      onError(error);
      setPendingOrder(null);
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const members = team ?? [];
  const normalizedQuery = query.trim().toLowerCase();
  const searching = normalizedQuery !== '';
  /** Менять порядок можно только в полном списке без поиска — иначе ids разъедутся с сервером. */
  const canReorder = filter === 'all' && !searching;

  const filtered = useMemo(() => {
    let list = members;
    if (filter === 'active') {
      list = list.filter((member) => member.isActive);
    } else if (filter === 'hidden') {
      list = list.filter((member) => !member.isActive);
    }
    if (!searching) {
      return list;
    }
    return list.filter(
      (member) =>
        member.name.toLowerCase().includes(normalizedQuery) ||
        member.role.toLowerCase().includes(normalizedQuery) ||
        member.spec.toLowerCase().includes(normalizedQuery),
    );
  }, [members, filter, normalizedQuery, searching]);

  const positionOf = (member: TeamMemberRow): number =>
    members.findIndex((item) => item.id === member.id);

  const toggling = (member: TeamMemberRow): boolean =>
    toggleActive.isPending && toggleActive.variables?.id === member.id;

  const onDragStart = (event: DragStartEvent): void => {
    const id = String(event.active.id);
    const node = document.querySelector(`[data-sortable-id="${id}"]`);
    setDrag({ id, width: node ? node.getBoundingClientRect().width : 0 });
  };

  const onDragEnd = (event: DragEndEvent): void => {
    setDrag(null);
    const { active, over } = event;
    const current = teamQuery.data;
    if (over === null || active.id === over.id || current === undefined) {
      return;
    }
    const oldIndex = current.findIndex((member) => member.id === active.id);
    const newIndex = current.findIndex((member) => member.id === over.id);
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    const next = arrayMove(current, oldIndex, newIndex);
    setActionError(null);
    // Оптимистичный порядок живёт до ответа сервера; откат — в onError мутации.
    setPendingOrder(next);
    persistOrder.mutate(next.map((member) => member.id));
  };

  const dragged = drag === null ? null : (members.find((member) => member.id === drag.id) ?? null);

  const emptyText = searching
    ? `По запросу «${query.trim()}» ничего не нашлось.`
    : filter === 'hidden'
      ? 'Скрытых участников нет.'
      : 'Активных участников нет.';

  const openCreate = (): void => setDialog({ open: true, member: null });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Поиск участника"
          aria-label="Поиск участника"
        />
        <SegmentedControl
          items={FILTER_OPTIONS}
          value={filter}
          onChange={(value) => setFilter(value as TeamFilter)}
          aria-label="Фильтр участников"
        />
        <span className="ml-auto flex items-center gap-4 whitespace-nowrap">
          <Text variant="caption" color="dim" className="font-mono uppercase tracking-[0.08em]">
            {filtered.length} {pluralRu(filtered.length, TEAM_FORMS)}
          </Text>
          <Button type="button" variant="primary" size="sm" onClick={openCreate}>
            <Plus className="size-3.5" aria-hidden="true" />
            Участник
          </Button>
        </span>
      </div>

      {teamQuery.isPending ? (
        <div className="rounded-xl border border-border bg-panel">
          <TeamHeaderRow />
          <div className="flex flex-col divide-y divide-border">
            {Array.from({ length: 4 }, (_, row) => (
              <div
                key={row}
                className={`grid ${TEAM_GRID_COLS} items-center gap-2 px-4 py-3.5 sm:gap-3 sm:px-5`}
              >
                <Skeleton width="1.75rem" height="1rem" />
                <Skeleton width="1rem" height="1rem" />
                <Skeleton width="2.75rem" height="2.75rem" rounded="lg" />
                <span className="flex flex-col gap-1.5">
                  <Skeleton height="1rem" className="max-w-40" />
                  <Skeleton height="0.75rem" className="max-w-24" />
                </span>
                <span className="hidden lg:block">
                  <Skeleton height="0.75rem" className="max-w-48" />
                </span>
                <Skeleton width="7rem" height="2.25rem" />
              </div>
            ))}
          </div>
        </div>
      ) : teamQuery.isError ? (
        <Text variant="body" className="text-danger">
          {teamQuery.error instanceof Error
            ? teamQuery.error.message
            : 'Не удалось загрузить команду'}
        </Text>
      ) : members.length === 0 ? (
        <EmptyState
          title="В команде пока никого нет — добавьте первого мастера."
          action={
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" aria-hidden="true" />
              Участник
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-panel">
          <TeamHeaderRow />
          <div className="flex flex-col divide-y divide-border">
            {canReorder ? (
              <DndContext
                id="team-order"
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragCancel={() => setDrag(null)}
              >
                <SortableContext
                  items={filtered.map((member) => member.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filtered.map((member) => (
                    <SortableRow
                      key={member.id}
                      member={member}
                      position={positionOf(member)}
                      toggling={toggling(member)}
                      onEdit={() => setDialog({ open: true, member })}
                      onToggleActive={() => toggleActive.mutate(member)}
                      onDelete={() => setConfirming(member)}
                    />
                  ))}
                </SortableContext>
                <DragOverlay
                  dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}
                >
                  {dragged !== null && drag !== null ? (
                    <div
                      className="pointer-events-none animate-fade-in rounded-lg border border-border-strong bg-panel shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)]"
                      style={{ width: drag.width }}
                    >
                      <TeamRowInner
                        member={dragged}
                        position={positionOf(dragged)}
                        toggling={false}
                        handle={
                          <span
                            aria-hidden="true"
                            className="flex size-7 items-center justify-center font-mono text-caption text-content-dim"
                          >
                            ⠿
                          </span>
                        }
                        onEdit={() => {}}
                        onToggleActive={() => {}}
                        onDelete={() => {}}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : (
              filtered.map((member) => (
                <TeamRowInner
                  key={member.id}
                  member={member}
                  position={positionOf(member)}
                  toggling={toggling(member)}
                  handle={<span aria-hidden="true" className="size-7" />}
                  onEdit={() => setDialog({ open: true, member })}
                  onToggleActive={() => toggleActive.mutate(member)}
                  onDelete={() => setConfirming(member)}
                />
              ))
            )}
            {filtered.length === 0 ? (
              <Text variant="body" color="muted" className="px-4 py-10 text-center">
                {emptyText}
              </Text>
            ) : null}
          </div>
        </div>
      )}

      {actionError !== null ? (
        <Text variant="caption" className="text-danger">
          {actionError}
        </Text>
      ) : null}

      <MemberDialog
        open={dialog.open}
        member={dialog.member}
        onClose={() => setDialog({ open: false, member: null })}
        onSaved={() => {
          setDialog({ open: false, member: null });
          invalidate();
        }}
      />

      <ConfirmDialog
        open={confirming !== null}
        title="Удалить из команды?"
        description={
          <>
            <span className="font-semibold text-content">{confirming?.name ?? ''}</span> будет
            удалён из команды. Фото останется в загрузках.
          </>
        }
        loading={removeMember.isPending}
        onConfirm={() => {
          if (confirming !== null) {
            removeMember.mutate(confirming);
          }
        }}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
