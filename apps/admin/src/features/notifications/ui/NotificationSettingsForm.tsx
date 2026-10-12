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
} from '@dnd-kit/sortable';
import { MessageSquare, Phone, RefreshCw, Send } from 'lucide-react';
import { Checkbox, IconButton, Text } from '@sto/ui';
import { CSS } from '@dnd-kit/utilities';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CHANNEL_LABELS,
  readProxyError,
  type ChannelsPrice,
  type NotificationChannel,
  type NotificationSettings,
  type PaidBudget,
  type SmsBalance,
} from '@/lib/api';

async function fetchSettings(): Promise<NotificationSettings> {
  const response = await fetch('/api/notifications/settings');
  if (!response.ok) {
    throw await readProxyError(response, 'Не удалось загрузить настройки');
  }
  return response.json();
}

async function saveSettings(patch: NotificationSettings): Promise<NotificationSettings> {
  const response = await fetch('/api/notifications/settings', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    throw await readProxyError(response, 'Не удалось сохранить настройки');
  }
  return response.json();
}

async function fetchBalance(): Promise<SmsBalance> {
  const response = await fetch('/api/notifications/balance');
  if (!response.ok) {
    throw await readProxyError(response, 'Не удалось получить баланс');
  }
  return response.json();
}

async function fetchChannelsPrice(): Promise<ChannelsPrice> {
  const response = await fetch('/api/notifications/channels-price');
  if (!response.ok) {
    throw await readProxyError(response, 'Не удалось получить цены каналов');
  }
  return response.json();
}

async function fetchPaidBudget(): Promise<PaidBudget> {
  const response = await fetch('/api/notifications/budget');
  if (!response.ok) {
    throw await readProxyError(response, 'Не удалось получить дневной лимит');
  }
  return response.json();
}

function priceLabel(price: string | null | undefined): string | null {
  if (price === undefined) {
    return null;
  }
  if (price === null) {
    return 'бесплатно';
  }
  return `≈ ${price} руб.`;
}

const CHANNEL_ICONS: Record<NotificationChannel, typeof Send> = {
  telegram: Send,
  viber: Phone,
  sms: MessageSquare,
};

function DragHandle(props: { active?: boolean }): React.JSX.Element {
  return (
    <span
      className={`flex size-7 select-none items-center justify-center rounded font-mono text-caption leading-none ${
        props.active ? 'text-primary' : 'text-content-dim'
      }`}
    >
      ⠿
    </span>
  );
}

function ChannelRow({
  channel,
  index,
  enabled,
  price,
  onToggle,
}: {
  channel: NotificationChannel;
  index: number;
  enabled: boolean;
  price: string | null | undefined;
  onToggle: (channel: NotificationChannel, checked: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: channel,
  });
  const Icon = CHANNEL_ICONS[channel];
  const label = NOTIFICATION_CHANNEL_LABELS[channel];

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-lg px-2 py-3 transition-opacity sm:gap-4 ${
        isDragging ? 'opacity-0' : 'opacity-100 hover:bg-panel-2/60'
      }`}
    >
      <button
        type="button"
        aria-label={`Порядок канала ${label}`}
        className="flex size-7 cursor-grab touch-none items-center justify-center rounded text-content-dim hover:text-content active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <DragHandle />
      </button>
      <span className="w-4 font-mono text-caption text-content-dim">{index + 1}</span>
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
          enabled
            ? 'border-primary/40 bg-primary/10 text-primary'
            : 'border-border bg-panel-2 text-content-dim'
        }`}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span
        className={`text-body font-semibold ${enabled ? 'text-content' : 'text-content-muted'}`}
      >
        {label}
      </span>
      <span className="ml-auto hidden font-mono text-caption text-content-dim sm:block">
        {priceLabel(price)}
      </span>
      <span className="shrink-0">
        <Checkbox
          checked={enabled}
          onChange={(checked) => onToggle(channel, checked)}
          aria-label={`${label} — канал включён`}
        />
      </span>
    </li>
  );
}

function ChannelCard({
  channel,
  index,
  enabled,
}: {
  channel: NotificationChannel;
  index: number;
  enabled: boolean;
}): React.JSX.Element {
  const Icon = CHANNEL_ICONS[channel];
  return (
    <div className="flex cursor-grabbing items-center gap-3 rounded-lg border border-border-strong bg-panel-2 px-4 py-3 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.55)] sm:gap-4">
      <DragHandle active />
      <span className="w-4 font-mono text-caption text-content-dim">{index + 1}</span>
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${
          enabled
            ? 'border-primary/40 bg-primary/10 text-primary'
            : 'border-border bg-panel text-content-dim'
        }`}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="text-body font-semibold text-content">
        {NOTIFICATION_CHANNEL_LABELS[channel]}
      </span>
      <span
        className={`ml-2 rounded-full border px-2.5 py-1 font-mono text-caption uppercase ${
          enabled
            ? 'border-primary/50 bg-primary/10 text-primary'
            : 'border-border text-content-dim'
        }`}
      >
        {enabled ? 'включён' : 'выключен'}
      </span>
    </div>
  );
}

export function NotificationSettingsForm() {
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: ['notification-settings'], queryFn: fetchSettings });
  const balance = useQuery({ queryKey: ['sms-balance'], queryFn: fetchBalance });
  const prices = useQuery({
    queryKey: ['channels-price'],
    queryFn: fetchChannelsPrice,
    retry: 1,
  });
  const budget = useQuery({ queryKey: ['paid-budget'], queryFn: fetchPaidBudget });

  const [order, setOrder] = useState<NotificationChannel[]>([...NOTIFICATION_CHANNELS]);
  const [enabled, setEnabled] = useState<NotificationChannel[]>([...NOTIFICATION_CHANNELS]);
  const [loaded, setLoaded] = useState(false);
  const [dragging, setDragging] = useState<NotificationChannel | null>(null);

  if (settings.data !== undefined && !loaded) {
    setOrder(settings.data.channelOrder);
    setEnabled(settings.data.enabled);
    setLoaded(true);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = (event: DragStartEvent): void => {
    setDragging(event.active.id as NotificationChannel);
  };

  const onDragEnd = (event: DragEndEvent): void => {
    setDragging(null);
    const { active, over } = event;
    if (over === null || active.id === over.id) {
      return;
    }
    const next = arrayMove(
      order,
      order.indexOf(active.id as NotificationChannel),
      order.indexOf(over.id as NotificationChannel),
    );
    setOrder(next);
    save.mutate({ order: next, enabled: next.filter((c) => enabled.includes(c)) });
  };

  const toggle = (channel: NotificationChannel, checked: boolean): void => {
    const next = checked ? [...enabled, channel] : enabled.filter((item) => item !== channel);
    if (next.length === 0) {
      return;
    }
    setEnabled(next);
    save.mutate({ order, enabled: order.filter((item) => next.includes(item)) });
  };

  const save = useMutation({
    mutationFn: (patch: { order: NotificationChannel[]; enabled: NotificationChannel[] }) =>
      saveSettings({ channelOrder: patch.order, enabled: patch.enabled }),
    onSuccess: async (next) => {
      setOrder(next.channelOrder);
      setEnabled(next.enabled);
      await queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
  });

  const budgetUsed = budget.data?.used ?? 0;
  const budgetLimit = budget.data?.limit ?? 0;
  const budgetPct =
    budgetLimit > 0 ? Math.min(100, Math.round((budgetUsed / budgetLimit) * 100)) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <section className="relative flex flex-col gap-4 rounded-xl border border-border bg-panel p-6">
          <Text
            variant="caption"
            className="font-mono uppercase tracking-[0.12em] text-content-dim"
          >
            БАЛАНС SMS
          </Text>
          {balance.isPending ? (
            <Text color="dim">Загружаем…</Text>
          ) : balance.isError ? (
            <Text className="text-danger">{balance.error.message}</Text>
          ) : balance.data.available ? (
            <p className="font-mono text-stat text-content">
              {balance.data.balance} <span className="text-body text-content-muted">руб.</span>
            </p>
          ) : (
            <Text className="text-danger">{balance.data.error ?? 'SMS-шлюз не настроен'}</Text>
          )}
          <IconButton
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4"
            label="Обновить баланс"
            icon={
              <RefreshCw
                className={`size-4 ${balance.isFetching ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
            }
            onClick={() => void balance.refetch()}
          />
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-6">
          <Text
            variant="caption"
            className="font-mono uppercase tracking-[0.12em] text-content-dim"
          >
            ПЛАТНЫЕ УВЕДОМЛЕНИЯ · СЕГОДНЯ
          </Text>
          {budget.isPending ? (
            <Text color="dim">Загружаем…</Text>
          ) : budget.isError ? (
            <Text className="text-danger">{budget.error.message}</Text>
          ) : (
            <>
              <p
                className={`font-mono text-stat ${
                  budget.data.exhausted ? 'text-danger' : 'text-content'
                }`}
              >
                {budget.data.used}
                <span className="text-body text-content-muted"> / {budget.data.limit}</span>
              </p>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-panel-2"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={budgetLimit}
                aria-valuenow={budgetUsed}
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ${
                    budget.data.exhausted ? 'bg-danger' : 'bg-primary'
                  }`}
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
              {budget.data.exhausted ? (
                <Text className="text-danger">
                  Лимит на {budget.data.day} исчерпан — подтверждения уходят только через Telegram.
                </Text>
              ) : null}
            </>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-panel p-6">
        <Text variant="caption" className="font-mono uppercase tracking-[0.12em] text-content-dim">
          КАНАЛЫ ПОДТВЕРЖДЕНИЙ
        </Text>
        {settings.isError ? (
          <Text className="text-danger">{settings.error.message}</Text>
        ) : settings.isPending ? (
          <Text color="dim">Загружаем…</Text>
        ) : (
          <DndContext
            id="notification-channels"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={() => setDragging(null)}
          >
            <SortableContext items={order}>
              <ul className="flex flex-col gap-1">
                {order.map((channel, index) => (
                  <ChannelRow
                    key={channel}
                    channel={channel}
                    index={index}
                    enabled={enabled.includes(channel)}
                    price={prices.data?.[channel]}
                    onToggle={toggle}
                  />
                ))}
              </ul>
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {dragging !== null ? (
                <ChannelCard
                  channel={dragging}
                  index={order.indexOf(dragging)}
                  enabled={enabled.includes(dragging)}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
        {save.isError ? <Text className="text-danger">{save.error.message}</Text> : null}
      </section>
    </div>
  );
}
