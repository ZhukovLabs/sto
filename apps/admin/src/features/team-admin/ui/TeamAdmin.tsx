'use client';

import { useState } from 'react';
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
import { EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Text } from '@sto/ui';
import { readProxyError, type TeamMemberRow } from '@/lib/api';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { MemberDialog } from './MemberDialog';

const TEAM_KEY = ['team'] as const;

async function fetchTeam(): Promise<TeamMemberRow[]> {
  const response = await fetch('/api/team');
  if (!response.ok) {
    throw await readProxyError(response, 'Не удалось загрузить команду');
  }
  return response.json();
}

function TeamRowInner({
  member,
  index,
  handle,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  member: TeamMemberRow;
  index: number;
  handle: React.ReactNode;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      {handle}
      <span className="w-4 font-mono text-caption text-content-dim">{index + 1}</span>
      <span className="size-11 shrink-0 overflow-hidden rounded-md border border-border bg-panel-2">
        {member.photo !== null ? (
          <img src={member.photo} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center font-mono text-caption text-content-dim">
            -
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-body font-semibold text-content">{member.name}</span>
        <span className="truncate font-mono text-caption uppercase tracking-[0.08em] text-content-dim">
          {member.role}
        </span>
      </span>
      {!member.isActive ? <Badge variant="neutral">скрыт</Badge> : null}
      <span className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={member.isActive ? 'Скрыть с сайта' : 'Показать на сайте'}
          onClick={onToggleActive}
        >
          <EyeOff className="size-3.5" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`Изменить ${member.name}`}
          onClick={onEdit}
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`Удалить ${member.name}`}
          onClick={onDelete}
        >
          <Trash2 className="size-4 text-danger" />
        </Button>
      </span>
    </>
  );
}

function SortableRow({
  member,
  index,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  member: TeamMemberRow;
  index: number;
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
      className={`flex items-center gap-3 border-b border-border px-4 py-4 sm:px-5 ${
        isDragging ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <TeamRowInner
        member={member}
        index={index}
        handle={
          <button
            type="button"
            aria-label="Порядок участника"
            className="flex size-7 cursor-grab touch-none items-center justify-center rounded font-mono text-caption text-content-dim hover:text-content active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            ⠿
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
  const [orderError, setOrderError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; member: TeamMemberRow | null }>({
    open: false,
    member: null,
  });
  const [confirming, setConfirming] = useState<TeamMemberRow | null>(null);
  const [drag, setDrag] = useState<{ id: string; width: number } | null>(null);
  const [pendingOrder, setPendingOrder] = useState<TeamMemberRow[] | null>(null);

  const teamQuery = useQuery({ queryKey: TEAM_KEY, queryFn: fetchTeam });
  const team = pendingOrder ?? teamQuery.data ?? null;

  const invalidate = (): void => {
    void queryClient.invalidateQueries({ queryKey: TEAM_KEY });
  };

  const toggleActive = useMutation({
    mutationFn: async (member: TeamMemberRow) => {
      const response = await fetch(`/api/team/${member.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isActive: !member.isActive }),
      });
      if (!response.ok) {
        throw await readProxyError(response, 'Не удалось изменить видимость');
      }
    },
    onSuccess: invalidate,
  });

  const removeMember = useMutation({
    mutationFn: async (member: TeamMemberRow) => {
      const response = await fetch(`/api/team/${member.id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw await readProxyError(response, 'Не удалось удалить участника');
      }
    },
    onSuccess: invalidate,
  });

  const persistOrder = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/team/order', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) {
        throw await readProxyError(response, 'Не удалось сохранить порядок');
      }
    },
    onSuccess: () => {
      setOrderError(null);
      setPendingOrder(null);
      invalidate();
    },
    onError: (error) => {
      setOrderError(error instanceof Error ? error.message : 'Не удалось сохранить порядок');
      setPendingOrder(null);
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const members = team ?? [];

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
    setOrderError(null);
    // Оптимистичный порядок живёт до ответа сервера; откат — в onError мутации.
    setPendingOrder(next);
    persistOrder.mutate(next.map((member) => member.id));
  };

  const dragged = drag === null ? null : (members.find((member) => member.id === drag.id) ?? null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <Text variant="mono" color="dim" className="tracking-[0.08em]">
          {`// ${members.length} УЧАСТНИК${members.length % 10 === 1 && members.length !== 11 ? '' : 'ОВ'}`}
        </Text>
        <Button type="button" size="sm" onClick={() => setDialog({ open: true, member: null })}>
          <Plus className="size-4" />
          Добавить
        </Button>
      </div>

      {teamQuery.isPending ? (
        <Text color="muted">Загрузка…</Text>
      ) : teamQuery.isError ? (
        <Text variant="caption" className="text-danger">
          {teamQuery.error instanceof Error
            ? teamQuery.error.message
            : 'Не удалось загрузить команду'}
        </Text>
      ) : members.length === 0 ? (
        <Text color="muted">Команда пуста — добавьте первого мастера.</Text>
      ) : (
        <div className="rounded-xl border border-border bg-panel">
          <DndContext
            id="team-order"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={members.map((member) => member.id)}
              strategy={verticalListSortingStrategy}
            >
              {members.map((member, index) => (
                <SortableRow
                  key={member.id}
                  member={member}
                  index={index}
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
                  className="pointer-events-none flex animate-fade-in items-center gap-3 rounded-lg border border-border-strong bg-panel px-4 py-4 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)] sm:px-5"
                  style={{ width: drag.width }}
                >
                  <TeamRowInner
                    member={dragged}
                    index={members.findIndex((member) => member.id === dragged.id)}
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
        </div>
      )}

      {orderError !== null ? (
        <Text variant="caption" className="text-danger">
          {orderError}
        </Text>
      ) : null}
      {toggleActive.error instanceof Error ? (
        <Text variant="caption" className="text-danger">
          {toggleActive.error.message}
        </Text>
      ) : null}
      {removeMember.error instanceof Error ? (
        <Text variant="caption" className="text-danger">
          {removeMember.error.message}
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
            setConfirming(null);
          }
        }}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
