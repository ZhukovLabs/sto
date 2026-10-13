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
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, IconButton, Skeleton, Text } from '@sto/ui';
import { apiDelete, apiGet, apiSend } from '@/shared/api/client';
import { pluralRu } from '@/shared/lib/plural';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import type { FaqItemRow } from '@/lib/api';
import { FaqDialog } from './FaqDialog';

const FAQ_KEY = ['faq'] as const;

const FAQ_FORMS = ['вопрос', 'вопроса', 'вопросов'] as const;

/** Колонки: handle · № · вопрос/ответ · действия (фиксированная — шапка и строки не разъезжаются). */
const FAQ_GRID_COLS =
  'grid-cols-[auto_auto_minmax(0,1fr)_6.25rem] sm:grid-cols-[auto_auto_minmax(0,1fr)_8.75rem]';

const HEADER_CELL_CLASS =
  'font-mono text-caption font-bold uppercase tracking-[0.08em] text-content-dim';

async function fetchFaq(): Promise<FaqItemRow[]> {
  const items = await apiGet<FaqItemRow[]>('/api/faq', 'Не удалось загрузить FAQ');
  return items;
}

function DragHandle(): React.JSX.Element {
  return (
    <span className="flex size-7 select-none items-center justify-center rounded font-mono text-caption leading-none text-content-dim">
      ⠿
    </span>
  );
}

function FaqHeaderRow(): React.JSX.Element {
  return (
    <div
      className={`grid ${FAQ_GRID_COLS} items-center gap-2 border-b border-border px-4 py-2.5 sm:gap-3 sm:px-5`}
    >
      <span aria-hidden="true" className="size-7" />
      <span className={`w-4 text-center ${HEADER_CELL_CLASS}`}>№</span>
      <span className={HEADER_CELL_CLASS}>Вопрос</span>
      <span className={`flex justify-end ${HEADER_CELL_CLASS}`}>Действия</span>
    </div>
  );
}

function FaqRowInner({
  item,
  position,
  handle,
  toggling,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  item: FaqItemRow;
  position: number;
  handle: React.ReactNode;
  toggling: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`grid ${FAQ_GRID_COLS} items-center gap-2 px-4 py-3 transition-colors hover:bg-panel-2/60 motion-reduce:transition-none sm:gap-3 sm:px-5 ${
        item.isActive ? '' : 'opacity-60'
      }`}
    >
      {handle}
      <span className="w-4 text-center font-mono text-caption text-content-dim">
        {position + 1}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-body font-semibold text-content">{item.question}</span>
          {!item.isActive ? (
            <Badge variant="neutral" size="sm">
              скрыт
            </Badge>
          ) : null}
        </span>
        <span className="truncate text-caption text-content-muted">{item.answer}</span>
      </span>
      <span className="flex items-center justify-end gap-1">
        <span className="hidden sm:inline-flex">
          <IconButton
            variant="ghost"
            size="sm"
            loading={toggling}
            label={
              item.isActive
                ? `Скрыть «${item.question}» с сайта`
                : `Показать «${item.question}» на сайте`
            }
            icon={
              item.isActive ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )
            }
            onClick={onToggleActive}
          />
        </span>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Изменить «${item.question}»`}
          onClick={onEdit}
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-danger hover:bg-danger/10"
          aria-label={`Удалить «${item.question}»`}
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </Button>
      </span>
    </div>
  );
}

function SortableRow({
  item,
  position,
  toggling,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  item: FaqItemRow;
  position: number;
  toggling: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  return (
    <div
      ref={setNodeRef}
      data-sortable-id={item.id}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: [transition, 'opacity 140ms ease'].filter(Boolean).join(', '),
      }}
      className={isDragging ? 'opacity-0' : 'opacity-100'}
    >
      <FaqRowInner
        item={item}
        position={position}
        toggling={toggling}
        handle={
          <button
            type="button"
            aria-label="Порядок вопроса"
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

export function FaqAdmin(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; item: FaqItemRow | null }>({
    open: false,
    item: null,
  });
  const [confirming, setConfirming] = useState<FaqItemRow | null>(null);
  const [drag, setDrag] = useState<{ id: string; width: number } | null>(null);
  const [pendingOrder, setPendingOrder] = useState<FaqItemRow[] | null>(null);

  const faqQuery = useQuery({ queryKey: FAQ_KEY, queryFn: fetchFaq });
  const items = pendingOrder ?? faqQuery.data ?? null;

  const invalidate = (): void => {
    void queryClient.invalidateQueries({ queryKey: FAQ_KEY });
  };

  const onError = (error: Error): void => {
    setActionError(error.message);
  };

  const toggleActive = useMutation({
    mutationFn: (item: FaqItemRow) =>
      apiSend(
        `/api/faq/${item.id}`,
        'PATCH',
        { isActive: !item.isActive },
        'Не удалось изменить видимость',
      ),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError,
  });

  const removeItem = useMutation({
    mutationFn: (item: FaqItemRow) => apiDelete(`/api/faq/${item.id}`, 'Не удалось удалить вопрос'),
    onSuccess: () => {
      setActionError(null);
      setConfirming(null);
      invalidate();
    },
    onError,
  });

  const persistOrder = useMutation({
    mutationFn: (ids: string[]) =>
      apiSend('/api/faq/order', 'PUT', { ids }, 'Не удалось сохранить порядок'),
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

  const list = items ?? [];
  const dragging = drag === null ? null : (list.find((item) => item.id === drag.id) ?? null);

  const onDragStart = (event: DragStartEvent): void => {
    const id = String(event.active.id);
    const node = document.querySelector(`[data-sortable-id="${id}"]`);
    setDrag({ id, width: node ? node.getBoundingClientRect().width : 0 });
  };

  const onDragEnd = (event: DragEndEvent): void => {
    setDrag(null);
    const { active, over } = event;
    // База - оптимистичный порядок: пока летит прошлый reorder, серверный data отстал.
    const current = pendingOrder ?? faqQuery.data;
    if (over === null || active.id === over.id || current === undefined) {
      return;
    }
    if (persistOrder.isPending) {
      // Не складываем драги в очередь: дайте долететь прошлому изменению.
      return;
    }
    const oldIndex = current.findIndex((item) => item.id === active.id);
    const newIndex = current.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    const next = arrayMove(current, oldIndex, newIndex);
    setActionError(null);
    // Оптимистичный порядок живёт до ответа сервера; откат — в onError мутации.
    setPendingOrder(next);
    persistOrder.mutate(next.map((item) => item.id));
  };

  const openCreate = (): void => setDialog({ open: true, item: null });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Text variant="caption" color="dim" className="font-mono uppercase tracking-[0.08em]">
          {list.length} {pluralRu(list.length, FAQ_FORMS)}
        </Text>
        <Button type="button" variant="primary" size="sm" onClick={openCreate}>
          <Plus className="size-3.5" aria-hidden="true" />
          Вопрос
        </Button>
      </div>

      {faqQuery.isPending ? (
        <div className="rounded-xl border border-border bg-panel">
          <FaqHeaderRow />
          <div className="flex flex-col divide-y divide-border">
            {Array.from({ length: 4 }, (_, row) => (
              <div
                key={row}
                className={`grid ${FAQ_GRID_COLS} items-center gap-2 px-4 py-3.5 sm:gap-3 sm:px-5`}
              >
                <Skeleton width="1.75rem" height="1rem" />
                <Skeleton width="1rem" height="1rem" />
                <span className="flex flex-col gap-1.5">
                  <Skeleton height="1rem" className="max-w-64" />
                  <Skeleton height="0.75rem" className="max-w-96" />
                </span>
                <Skeleton width="7rem" height="2.25rem" />
              </div>
            ))}
          </div>
        </div>
      ) : faqQuery.isError ? (
        <Text variant="body" className="text-danger">
          {faqQuery.error instanceof Error ? faqQuery.error.message : 'Не удалось загрузить FAQ'}
        </Text>
      ) : list.length === 0 ? (
        <EmptyState
          title="FAQ пока пуст — добавьте первый вопрос."
          hint="Отвечайте так, как отвечаете клиентам по телефону: коротко и по делу."
          action={
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" aria-hidden="true" />
              Вопрос
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-panel">
          <FaqHeaderRow />
          <div className="flex flex-col divide-y divide-border">
            <DndContext
              id="faq-order"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragCancel={() => setDrag(null)}
            >
              <SortableContext
                items={list.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {list.map((item, index) => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    position={index}
                    toggling={toggleActive.isPending && toggleActive.variables?.id === item.id}
                    onEdit={() => setDialog({ open: true, item })}
                    onToggleActive={() => toggleActive.mutate(item)}
                    onDelete={() => setConfirming(item)}
                  />
                ))}
              </SortableContext>
              <DragOverlay
                dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}
              >
                {dragging !== null && drag !== null ? (
                  <div
                    className="pointer-events-none animate-fade-in rounded-lg border border-border-strong bg-panel shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)]"
                    style={{ width: drag.width }}
                  >
                    <FaqRowInner
                      item={dragging}
                      position={list.findIndex((item) => item.id === dragging.id)}
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
          </div>
        </div>
      )}

      {actionError !== null ? (
        <Text variant="caption" className="text-danger">
          {actionError}
        </Text>
      ) : null}

      <FaqDialog
        open={dialog.open}
        item={dialog.item}
        onClose={() => setDialog({ open: false, item: null })}
        onSaved={() => {
          setDialog({ open: false, item: null });
          invalidate();
        }}
      />

      <ConfirmDialog
        open={confirming !== null}
        title="Удалить вопрос?"
        description={
          <>
            <span className="font-semibold text-content">{confirming?.question ?? ''}</span> будет
            удалён со страницы «Вопросы и ответы».
          </>
        }
        loading={removeItem.isPending}
        onConfirm={() => {
          if (confirming !== null) {
            removeItem.mutate(confirming);
          }
        }}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
