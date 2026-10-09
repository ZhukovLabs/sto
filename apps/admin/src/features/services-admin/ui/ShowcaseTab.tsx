'use client';

import { useEffect, useState } from 'react';
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
import { X } from 'lucide-react';
import { Button, Select, Text } from '@sto/ui';
import { readProxyError, type ServicesCatalog } from '@/lib/api';

export const SHOWCASE_SIZE = 8;

export interface ShowcaseTabProps {
  catalog: ServicesCatalog;
  onSaved: () => void;
}

interface SlotInfo {
  id: string;
  title: string;
  groupTitle: string;
}

function DragHandle(): React.JSX.Element {
  return (
    <span className="flex size-7 select-none items-center justify-center rounded font-mono text-caption leading-none text-content-dim">
      ⠿
    </span>
  );
}

function SlotRow({
  slot,
  index,
  onRemove,
}: {
  slot: SlotInfo;
  index: number;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slot.id,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-lg px-2 py-2.5 transition-opacity ${
        isDragging ? 'opacity-0' : 'opacity-100 hover:bg-panel-2/60'
      }`}
    >
      <button
        type="button"
        aria-label="Порядок в витрине"
        className="flex size-7 cursor-grab touch-none items-center justify-center rounded text-content-dim hover:text-content active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <DragHandle />
      </button>
      <span className="w-4 font-mono text-caption text-content-dim">{index + 1}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body font-semibold text-content">{slot.title}</span>
        <span className="truncate font-mono text-caption text-content-dim">
          {slot.groupTitle.toUpperCase()}
        </span>
      </span>
      <button
        type="button"
        aria-label={`Убрать «${slot.title}» из витрины`}
        className="flex size-7 items-center justify-center rounded text-content-dim transition-colors hover:bg-panel-2 hover:text-danger"
        onClick={() => onRemove(slot.id)}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </li>
  );
}

function SlotCard({ slot, index }: { slot: SlotInfo; index: number }): React.JSX.Element {
  return (
    <div className="flex cursor-grabbing items-center gap-3 rounded-lg border border-border bg-panel-2 px-4 py-3 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.55)]">
      <DragHandle />
      <span className="w-4 font-mono text-caption text-content-dim">{index + 1}</span>
      <span className="text-body font-semibold text-content">{slot.title}</span>
    </div>
  );
}

export function ShowcaseTab({ catalog, onSaved }: ShowcaseTabProps) {
  const [ids, setIds] = useState<string[]>(catalog.showcase.map((slot) => slot.serviceId));
  const [candidate, setCandidate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => {
    setIds(catalog.showcase.map((slot) => slot.serviceId));
  }, [catalog.showcase]);

  const serviceById = new Map(
    catalog.groups.flatMap((group) => group.services).map((s) => [s.id, s]),
  );
  const groupByServiceId = new Map(
    catalog.groups.flatMap((group) => group.services.map((service) => [service.id, group])),
  );
  const slots: SlotInfo[] = ids.flatMap((id) => {
    const service = serviceById.get(id);
    const group = groupByServiceId.get(id);
    if (service === undefined || group === undefined) {
      return [];
    }
    return [{ id, title: service.title, groupTitle: group.title }];
  });

  const savedIds = catalog.showcase.map((slot) => slot.serviceId).join('\n');
  const dirty = ids.join('\n') !== savedIds;

  const available = catalog.groups
    .flatMap((group) => group.services)
    .filter((service) => service.isActive && !ids.includes(service.id));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = (event: DragStartEvent): void => {
    setDragging(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent): void => {
    setDragging(null);
    const { active, over } = event;
    if (over !== null && active.id !== over.id) {
      setIds((current) =>
        arrayMove(current, current.indexOf(String(active.id)), current.indexOf(String(over.id))),
      );
    }
  };

  const add = (): void => {
    if (candidate === '') {
      return;
    }
    if (ids.length >= SHOWCASE_SIZE) {
      setError(`В витрине ровно ${SHOWCASE_SIZE} услуг — сначала уберите лишнюю`);
      return;
    }
    setError(null);
    setIds((current) => [...current, candidate]);
    setCandidate('');
  };

  const save = async (): Promise<void> => {
    if (ids.length !== SHOWCASE_SIZE) {
      setError(`Витрина — ровно ${SHOWCASE_SIZE} услуг, выбрано ${ids.length}`);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/services/showcase', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ serviceIds: ids }),
      });
      if (!response.ok) {
        throw await readProxyError(response, 'Не удалось сохранить витрину');
      }
      setSaved(true);
      onSaved();
      window.setTimeout(() => setSaved(false), 2500);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Не удалось сохранить витрину');
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="flex flex-col gap-5 rounded-xl border border-border bg-panel p-6">
      <Text variant="caption" className="font-mono uppercase tracking-[0.12em] text-content-dim">
        // ВИТРИНА ГЛАВНОЙ — РОВНО {SHOWCASE_SIZE} УСЛУГ
      </Text>
      <Text color="dim">
        Первая услуга — большая карточка с бейджем «Первым 20 — 0 BYN», дальше две средних и пять
        маленьких. Изменения на сайте появляются сразу после сохранения.
      </Text>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragging(null)}
      >
        <SortableContext items={ids}>
          <ul className="flex flex-col gap-1">
            {slots.map((slot, index) => (
              <SlotRow
                key={slot.id}
                slot={slot}
                index={index}
                onRemove={(id) => setIds((current) => current.filter((item) => item !== id))}
              />
            ))}
          </ul>
        </SortableContext>
        <DragOverlay dropAnimation={null}>
          {dragging !== null
            ? (() => {
                const overlaySlot = slots.find((slot) => slot.id === dragging);
                return overlaySlot !== undefined ? (
                  <SlotCard slot={overlaySlot} index={ids.indexOf(dragging)} />
                ) : null;
              })()
            : null}
        </DragOverlay>
      </DndContext>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Select
            label="Добавить услугу"
            value={candidate}
            onChange={setCandidate}
            placeholder="Выберите активную услугу"
            options={available.map((service) => ({
              value: service.id,
              label: service.title,
            }))}
          />
        </div>
        <Button
          variant="outline"
          disabled={candidate === '' || ids.length >= SHOWCASE_SIZE}
          onClick={add}
        >
          Добавить
        </Button>
      </div>

      {error !== null ? (
        <Text variant="caption" className="text-danger">
          {error}
        </Text>
      ) : null}
      <div className="flex items-center gap-4">
        <Button loading={pending} disabled={!dirty} onClick={() => void save()}>
          Сохранить витрину
        </Button>
        {saved ? <Text color="dim">Сохранено</Text> : null}
        {!saved && dirty ? (
          <Text variant="caption" color="dim">
            Есть несохранённые изменения
          </Text>
        ) : null}
      </div>
    </section>
  );
}
