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
import { MemberDialog } from './MemberDialog';

const TEAM_KEY = ['team'] as const;

async function fetchTeam(): Promise<TeamMemberRow[]> {
  const response = await fetch('/api/team');
  if (!response.ok) {
    throw await readProxyError(response, 'Не удалось загрузить команду');
  }
  return response.json();
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
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 border-b border-border px-4 py-4 sm:px-5 ${
        isDragging ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <button
        type="button"
        aria-label="Порядок участника"
        className="flex size-7 cursor-grab touch-none items-center justify-center rounded font-mono text-caption text-content-dim hover:text-content active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
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
  const [dragId, setDragId] = useState<string | null>(null);
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
    setDragId(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent): void => {
    setDragId(null);
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

  const dragged = members.find((member) => member.id === dragId) ?? null;

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
                  onDelete={() => {
                    if (
                      window.confirm(
                        `Удалить ${member.name} из команды? Фото останется в загрузках.`,
                      )
                    ) {
                      removeMember.mutate(member);
                    }
                  }}
                />
              ))}
            </SortableContext>
            <DragOverlay>
              {dragged !== null ? (
                <div className="flex items-center gap-3 rounded-lg border border-primary bg-panel px-4 py-4 shadow-lg sm:px-5">
                  <span className="size-11 shrink-0 overflow-hidden rounded-md border border-border bg-panel-2">
                    {dragged.photo !== null ? (
                      <img src={dragged.photo} alt="" className="size-full object-cover" />
                    ) : null}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-body font-semibold text-content">
                      {dragged.name}
                    </span>
                    <span className="truncate font-mono text-caption uppercase tracking-[0.08em] text-content-dim">
                      {dragged.role}
                    </span>
                  </span>
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
    </div>
  );
}
