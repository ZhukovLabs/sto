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
import { Button, Checkbox, Text } from '@sto/ui';
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
  return `≈ ${price} BYN`;
}

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

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center justify-between gap-4 rounded-lg px-2 py-3 transition-opacity ${
        isDragging ? 'opacity-0' : 'opacity-100 hover:bg-panel-2/60'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Порядок канала"
          className="flex size-7 cursor-grab touch-none items-center justify-center rounded text-content-dim hover:text-content active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <DragHandle />
        </button>
        <span className="w-4 font-mono text-caption text-content-dim">{index + 1}</span>
        <Checkbox
          checked={enabled}
          onChange={(checked) => onToggle(channel, checked)}
          label={NOTIFICATION_CHANNEL_LABELS[channel]}
        />
        <span className="ml-auto font-mono text-caption text-content-dim">{priceLabel(price)}</span>
      </div>
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
  return (
    <div className="flex cursor-grabbing items-center gap-3 rounded-lg border border-border bg-panel-2 px-4 py-3 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.55)]">
      <DragHandle active />
      <span className="w-4 font-mono text-caption text-content-dim">{index + 1}</span>
      <span className="text-body font-semibold text-content">
        {NOTIFICATION_CHANNEL_LABELS[channel]}
      </span>
      <span
        className={`rounded-full border px-2.5 py-1 font-mono text-caption uppercase ${
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
  const [saved, setSaved] = useState(false);
  const [dragging, setDragging] = useState<NotificationChannel | null>(null);

  if (settings.data !== undefined && !loaded) {
    setOrder(settings.data.channelOrder);
    setEnabled(settings.data.channelOrder);
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
    if (over !== null && active.id !== over.id) {
      setOrder((current) =>
        arrayMove(
          current,
          current.indexOf(active.id as NotificationChannel),
          current.indexOf(over.id as NotificationChannel),
        ),
      );
    }
  };

  const toggle = (channel: NotificationChannel, checked: boolean): void => {
    setEnabled((current) =>
      checked ? [...current, channel] : current.filter((item) => item !== channel),
    );
  };

  const save = useMutation({
    mutationFn: () =>
      saveSettings({ channelOrder: order.filter((channel) => enabled.includes(channel)) }),
    onSuccess: async (next) => {
      setSaved(true);
      setOrder(next.channelOrder);
      setEnabled(next.channelOrder);
      await queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      window.setTimeout(() => setSaved(false), 2500);
    },
  });

  return (
    <div className="flex flex-col gap-9">
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-6">
        <Text variant="caption" className="font-mono uppercase tracking-[0.12em] text-content-dim">
          // БАЛАНС SMS-ШЛЮЗА
        </Text>
        {balance.isPending ? (
          <Text color="dim">Загружаем…</Text>
        ) : balance.isError ? (
          <Text className="text-danger">{balance.error.message}</Text>
        ) : balance.data.available ? (
          <p className="font-mono text-stat text-content">{balance.data.balance} BYN</p>
        ) : (
          <Text className="text-danger">{balance.data.error ?? 'SMS-шлюз не настроен'}</Text>
        )}
        <div>
          <Button
            variant="outline"
            size="sm"
            loading={balance.isFetching}
            onClick={() => void balance.refetch()}
          >
            Обновить
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-6">
        <Text variant="caption" className="font-mono uppercase tracking-[0.12em] text-content-dim">
          // ДНЕВНОЙ ЛИМИТ ПЛАТНЫХ УВЕДОМЛЕНИЙ
        </Text>
        {budget.isPending ? (
          <Text color="dim">Загружаем…</Text>
        ) : budget.isError ? (
          <Text className="text-danger">{budget.error.message}</Text>
        ) : budget.data.exhausted ? (
          <>
            <p className="font-mono text-stat text-danger">
              {budget.data.used} / {budget.data.limit}
            </p>
            <Text className="text-danger">
              Лимит на {budget.data.day} исчерпан — подтверждения уходят только через Telegram.
            </Text>
          </>
        ) : (
          <p className="font-mono text-stat text-content">
            {budget.data.used} / {budget.data.limit}
          </p>
        )}
        <Text color="dim">
          Считаются только платные каналы (Viber и SMS). Telegram бесплатен и не ограничивается.
          Лимит задаётся переменной PAID_CHANNELS_DAILY_LIMIT.
        </Text>
      </section>

      <section className="flex flex-col gap-5 rounded-xl border border-border bg-panel p-6">
        <Text variant="caption" className="font-mono uppercase tracking-[0.12em] text-content-dim">
          // КАНАЛЫ ПОДТВЕРЖДЕНИЙ
        </Text>
        <DndContext
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
        <Text color="dim">
          Подтверждение идёт по списку сверху вниз: первый канал сработал — остальные не пробуются.
          Перетащите канал за «⠿», чтобы изменить порядок. Снятие галочки выключает канал.
        </Text>
        {save.isError ? <Text className="text-danger">{save.error.message}</Text> : null}
        <div className="flex items-center gap-4">
          <Button
            loading={save.isPending}
            disabled={enabled.length === 0}
            onClick={() => save.mutate()}
          >
            Сохранить
          </Button>
          {saved ? <Text color="dim">Сохранено</Text> : null}
        </div>
      </section>
    </div>
  );
}
