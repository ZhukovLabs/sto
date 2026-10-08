'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Text } from '@sto/ui';
import {
  BOOKING_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
  readProxyError,
  type BookingRow,
  type BookingStatus,
  type RequestStatus,
} from '@/lib/api';

interface RequestRow {
  id: string;
  name: string;
  phone: string;
  status: string;
  createdAt: string;
}

type InboxRow = {
  kind: 'callback' | 'booking';
  id: string;
  name: string;
  phone: string;
  status: string;
  createdAt: string;
  scheduledAt: string | null;
  car: string | null;
  services: string[];
  comment: string | null;
};

type KindFilter = 'all' | 'callback' | 'booking';

const createdFormat = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const bookingFormat = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

function prettyPhone(phone: string): string {
  const match = phone.match(/^(\+?375)(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return match === null ? phone : `+375 ${match[2]} ${match[3]}-${match[4]}-${match[5]}`;
}

const CHIP_STYLES: Record<string, string> = {
  new: 'border-primary/50 bg-primary/10 text-primary',
  booked: 'border-primary/50 bg-primary/10 text-primary',
  called: 'border-content-dim/50 bg-panel-2 text-content-muted',
  confirmed: 'border-content-dim/50 bg-panel-2 text-content-muted',
  taken: 'border-success/50 bg-success/10 text-success',
  cancelled: 'border-border text-content-dim',
};

const ROW_FADE: Record<string, string> = {
  taken: 'opacity-60',
  cancelled: 'opacity-60',
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'new', label: 'Новые' },
  { value: 'called', label: 'Перезвонили' },
  { value: 'booked', label: 'Записаны' },
  { value: 'confirmed', label: 'Подтверждены' },
  { value: 'taken', label: 'Взятые' },
  { value: 'cancelled', label: 'Отменённые' },
];

const KIND_OPTIONS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'callback', label: 'Перезвони мне' },
  { value: 'booking', label: 'Сам запишусь' },
];

function statusLabel(row: InboxRow): string {
  if (row.kind === 'callback') {
    return row.status in REQUEST_STATUS_LABELS
      ? REQUEST_STATUS_LABELS[row.status as RequestStatus]
      : row.status;
  }
  return row.status in BOOKING_STATUS_LABELS
    ? BOOKING_STATUS_LABELS[row.status as BookingStatus]
    : row.status;
}

async function fetchJson<T>(url: string, fallback: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw await readProxyError(response, fallback);
  }
  return (await response.json()) as T;
}

async function patchStatus(kind: InboxRow['kind'], id: string, status: string): Promise<void> {
  const base = kind === 'callback' ? '/api/requests' : '/api/bookings';
  const response = await fetch(`${base}/${id}/status`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw await readProxyError(response, 'Не удалось обновить статус');
  }
}

export function InboxTable() {
  const queryClient = useQueryClient();
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const requests = useQuery({
    queryKey: ['requests'],
    queryFn: () => fetchJson<RequestRow[]>('/api/requests', 'Не удалось загрузить заявки'),
  });
  const bookings = useQuery({
    queryKey: ['bookings'],
    queryFn: () => fetchJson<BookingRow[]>('/api/bookings', 'Не удалось загрузить записи'),
  });

  const mutation = useMutation({
    mutationFn: ({ kind, id, status }: { kind: InboxRow['kind']; id: string; status: string }) =>
      patchStatus(kind, id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const rows = useMemo<InboxRow[]>(() => {
    if (kindFilter === 'callback' && requests.data) {
      return requests.data.map((r) => ({
        kind: 'callback' as const,
        id: r.id,
        name: r.name,
        phone: r.phone,
        status: r.status,
        createdAt: r.createdAt,
        scheduledAt: null,
        car: null,
        services: [],
        comment: null,
      }));
    }
    if (kindFilter === 'booking' && bookings.data) {
      return bookings.data.map((b) => ({
        kind: 'booking' as const,
        id: b.id,
        name: b.name,
        phone: b.phone,
        status: b.status,
        createdAt: b.createdAt,
        scheduledAt: b.scheduledAt,
        car: b.car,
        services: b.services,
        comment: b.comment,
      }));
    }
    const all: InboxRow[] = [
      ...(requests.data ?? []).map((r) => ({
        kind: 'callback' as const,
        id: r.id,
        name: r.name,
        phone: r.phone,
        status: r.status,
        createdAt: r.createdAt,
        scheduledAt: null,
        car: null,
        services: [],
        comment: null,
      })),
      ...(bookings.data ?? []).map((b) => ({
        kind: 'booking' as const,
        id: b.id,
        name: b.name,
        phone: b.phone,
        status: b.status,
        createdAt: b.createdAt,
        scheduledAt: b.scheduledAt,
        car: b.car,
        services: b.services,
        comment: b.comment,
      })),
    ];
    return all.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [kindFilter, requests.data, bookings.data]);

  const visible = useMemo(
    () => (statusFilter === 'all' ? rows : rows.filter((row) => row.status === statusFilter)),
    [rows, statusFilter],
  );

  if (requests.isPending || bookings.isPending) {
    return (
      <Text variant="body" color="muted">
        Загружаем…
      </Text>
    );
  }
  if (requests.isError) {
    return (
      <Text variant="body" className="text-danger">
        {requests.error.message}
      </Text>
    );
  }
  if (bookings.isError) {
    return (
      <Text variant="body" className="text-danger">
        {bookings.error.message}
      </Text>
    );
  }
  if (rows.length === 0) {
    return (
      <Text variant="body" color="muted">
        Обращений пока нет — новые появятся здесь автоматически.
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-border bg-panel p-1">
          {KIND_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setKindFilter(option.value)}
              className={`rounded-md px-3 py-1.5 font-mono text-caption uppercase tracking-[0.08em] transition-colors ${
                kindFilter === option.value
                  ? 'bg-primary text-primary-ink'
                  : 'text-content-muted hover:text-content'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <label className="inline-flex items-center gap-2">
          <span className="font-mono text-caption uppercase tracking-[0.08em] text-content-dim">
            Статус
          </span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-border bg-panel px-3 py-1.5 font-mono text-caption text-content"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[1100px] text-left">
          <thead className="bg-panel-2">
            <tr>
              {[
                'Тип',
                'Создана',
                'Имя',
                'Телефон',
                'Запись',
                'Авто',
                'Услуга',
                'Комментарий',
                'Статус',
                '',
              ].map((label) => (
                <th
                  key={label}
                  className={`px-3.5 py-3 font-mono text-caption font-normal uppercase tracking-[0.1em] text-content-dim ${
                    label === '' ? 'sr-only' : ''
                  }`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-panel">
            {visible.map((row) => {
              const pending = mutation.isPending && mutation.variables?.id === row.id;
              return (
                <tr key={`${row.kind}-${row.id}`} className={ROW_FADE[row.status] ?? ''}>
                  <td className="px-3.5 py-4">
                    <span className="font-mono text-caption uppercase tracking-[0.08em] whitespace-nowrap text-content-dim">
                      {row.kind === 'callback' ? 'Перезвони' : 'Запись'}
                    </span>
                  </td>
                  <td className="px-3.5 py-4 font-mono text-caption text-content-muted">
                    {createdFormat.format(new Date(row.createdAt))}
                  </td>
                  <td className="px-3.5 py-4">
                    <Text variant="body" className="font-semibold">
                      {row.name}
                    </Text>
                  </td>
                  <td className="px-3.5 py-4">
                    <a
                      href={`tel:${row.phone.replace(/[^0-9+]/g, '')}`}
                      className="font-mono text-sm whitespace-nowrap text-content-muted transition-colors hover:text-primary"
                    >
                      {prettyPhone(row.phone)}
                    </a>
                  </td>
                  <td className="px-3.5 py-4 font-mono text-caption whitespace-nowrap text-content-muted">
                    {row.scheduledAt === null
                      ? '—'
                      : bookingFormat.format(new Date(row.scheduledAt))}
                  </td>
                  <td
                    className="max-w-[110px] truncate px-3.5 py-4 text-sm text-content-muted"
                    title={row.car ?? undefined}
                  >
                    {row.car ?? '—'}
                  </td>
                  <td
                    className="max-w-[130px] truncate px-3.5 py-4 text-sm text-content-muted"
                    title={row.services.length > 0 ? row.services.join(', ') : undefined}
                  >
                    {row.services.length > 0 ? row.services.join(', ') : '—'}
                  </td>
                  <td
                    className="max-w-[150px] truncate px-3.5 py-4 text-sm text-content-muted"
                    title={row.comment ?? undefined}
                  >
                    {row.comment ?? '—'}
                  </td>
                  <td className="px-3.5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-caption uppercase tracking-[0.08em] ${
                        CHIP_STYLES[row.status] ?? CHIP_STYLES.cancelled
                      }`}
                    >
                      {statusLabel(row)}
                    </span>
                  </td>
                  <td className="px-3.5 py-4 text-right whitespace-nowrap">
                    {row.status === 'new' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        loading={pending}
                        onClick={() =>
                          mutation.mutate({ kind: row.kind, id: row.id, status: 'called' })
                        }
                      >
                        Перезвонили
                      </Button>
                    ) : null}
                    {row.status === 'booked' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        loading={pending}
                        onClick={() =>
                          mutation.mutate({ kind: row.kind, id: row.id, status: 'confirmed' })
                        }
                      >
                        Подтвердили
                      </Button>
                    ) : null}
                    {row.status === 'called' || row.status === 'confirmed' ? (
                      <span className="inline-flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          loading={pending}
                          onClick={() =>
                            mutation.mutate({ kind: row.kind, id: row.id, status: 'taken' })
                          }
                        >
                          Взят
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          loading={pending}
                          onClick={() =>
                            mutation.mutate({ kind: row.kind, id: row.id, status: 'cancelled' })
                          }
                        >
                          Отменить
                        </Button>
                      </span>
                    ) : null}
                    {row.status === 'taken' || row.status === 'cancelled' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        loading={pending}
                        onClick={() =>
                          mutation.mutate({
                            kind: row.kind,
                            id: row.id,
                            status: row.kind === 'callback' ? 'new' : 'booked',
                          })
                        }
                      >
                        Вернуть
                      </Button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center">
                  <Text variant="body" color="muted">
                    Ничего не найдено по фильтру.
                  </Text>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
