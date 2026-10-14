'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  IconButton,
  Pagination,
  SegmentedControl,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Text,
  Tooltip,
} from '@sto/ui';
import { readProxyError, type BookingRow } from '@/lib/api';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { InboxDetailsDialog } from './InboxDetailsDialog';
import {
  actionsFor,
  badgeVariantFor,
  formatCreatedAt,
  prettyPhone,
  returnAction,
  statusLabel,
  type InboxRow,
} from './inbox-shared';

interface RequestRow {
  id: string;
  name: string;
  phone: string;
  comment: string | null;
  status: string;
  createdAt: string;
}

type KindFilter = 'all' | 'callback' | 'booking';

const ROW_FADE: Record<string, string> = {
  taken: 'opacity-60',
  cancelled: 'opacity-60',
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'Все' },
  { value: 'new', label: 'Новые' },
  { value: 'called', label: 'Перезвонили' },
  { value: 'booked', label: 'Ждут подтверждения' },
  { value: 'confirmed', label: 'Подтверждены' },
  { value: 'taken', label: 'Взятые' },
  { value: 'cancelled', label: 'Отменённые' },
];

const KIND_OPTIONS = [
  { value: 'all', label: 'Все' },
  { value: 'callback', label: 'Перезвони мне' },
  { value: 'booking', label: 'Сам запишусь' },
];

const PAGE_SIZE = 20;
const NAME_TOOLTIP_THRESHOLD = 25;

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

async function deleteRow(kind: InboxRow['kind'], id: string): Promise<void> {
  const base = kind === 'callback' ? '/api/requests' : '/api/bookings';
  const response = await fetch(`${base}/${id}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) {
    throw await readProxyError(response, 'Не удалось удалить обращение');
  }
}

export function InboxTable() {
  const queryClient = useQueryClient();
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<InboxRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InboxRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error: Error) => {
      setActionError(error.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ kind, id }: { kind: InboxRow['kind']; id: string }) => deleteRow(kind, id),
    onSuccess: () => {
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error: Error) => {
      setActionError(error.message);
    },
  });

  const rows = useMemo<InboxRow[]>(() => {
    const callbacks: InboxRow[] = (requests.data ?? []).map((r) => ({
      kind: 'callback' as const,
      id: r.id,
      name: r.name,
      phone: r.phone,
      status: r.status,
      createdAt: r.createdAt,
      scheduledAt: null,
      car: null,
      services: [],
      comment: r.comment,
    }));
    const bookingRows: InboxRow[] = (bookings.data ?? []).map((b) => ({
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
    const filtered = [
      ...(kindFilter === 'booking' ? [] : callbacks),
      ...(kindFilter === 'callback' ? [] : bookingRows),
    ];
    return filtered.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [kindFilter, requests.data, bookings.data]);

  const visible = useMemo(
    () => (statusFilter === 'all' ? rows : rows.filter((row) => row.status === statusFilter)),
    [rows, statusFilter],
  );

  useEffect(() => {
    setPage(1);
  }, [kindFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (selected === null) {
      return;
    }
    const fresh = rows.find((row) => row.kind === selected.kind && row.id === selected.id);
    if (fresh === undefined || fresh.status !== selected.status) {
      setSelected(fresh ?? null);
    }
  }, [rows, selected]);

  const loading = requests.isPending || bookings.isPending;
  const pendingFor = (id: string) => mutation.isPending && mutation.variables?.id === id;
  const pendingDelete =
    removeMutation.isPending && removeMutation.variables?.id === deleteTarget?.id;
  // Списки приходят окном (по умолчанию 200): достигли потолка — подсказываем.
  const capped = (requests.data?.length ?? 0) >= 200 || (bookings.data?.length ?? 0) >= 200;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          items={KIND_OPTIONS}
          value={kindFilter}
          onChange={(value) => setKindFilter(value as KindFilter)}
          aria-label="Тип обращений"
        />
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
          size="sm"
          fit="auto"
          aria-label="Статус обращений"
        />
      </div>

      {actionError === null ? null : (
        <Text variant="body" className="text-danger">
          {actionError}
        </Text>
      )}

      {loading ? (
        <Text variant="body" color="muted">
          Загружаем…
        </Text>
      ) : requests.isError ? (
        <Text variant="body" className="text-danger">
          {requests.error.message}
        </Text>
      ) : bookings.isError ? (
        <Text variant="body" className="text-danger">
          {bookings.error.message}
        </Text>
      ) : visible.length === 0 ? (
        <Text variant="body" color="muted">
          {rows.length === 0
            ? 'Обращений пока нет — новые появятся здесь автоматически.'
            : 'Ничего не найдено по фильтру.'}
        </Text>
      ) : (
        <div className="rounded-xl border border-border bg-panel">
          <Table>
            <TableHead>
              <TableRow className="hover:bg-transparent">
                <TableHeadCell>Тип</TableHeadCell>
                <TableHeadCell>Создана</TableHeadCell>
                <TableHeadCell>Имя</TableHeadCell>
                <TableHeadCell>Телефон</TableHeadCell>
                <TableHeadCell>Статус</TableHeadCell>
                <TableHeadCell className="text-right">Действия</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageRows.map((row) => {
                const actions = actionsFor(row);
                const back = returnAction(row);
                const pending = pendingFor(row.id);
                return (
                  <TableRow
                    key={`${row.kind}-${row.id}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Открыть обращение от ${row.name}`}
                    onClick={() => setSelected(row)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelected(row);
                      }
                    }}
                    className={`cursor-pointer ${ROW_FADE[row.status] ?? ''}`}
                  >
                    <TableCell className="whitespace-nowrap">
                      <span className="font-mono text-caption uppercase tracking-[0.08em] text-content-dim">
                        {row.kind === 'callback' ? 'Перезвони' : 'Запись'}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-caption text-content-muted">
                      {formatCreatedAt(row.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      {row.name.length > NAME_TOOLTIP_THRESHOLD ? (
                        <Tooltip content={row.name}>
                          <Text variant="body" className="max-w-56 font-semibold" truncate>
                            {row.name}
                          </Text>
                        </Tooltip>
                      ) : (
                        <Text variant="body" className="font-semibold">
                          {row.name}
                        </Text>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <a
                        href={`tel:${row.phone.replace(/[^0-9+]/g, '')}`}
                        onClick={(event) => event.stopPropagation()}
                        className="font-mono text-sm text-content-muted transition-colors hover:text-primary"
                      >
                        {prettyPhone(row.phone)}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant={badgeVariantFor(row.status)} size="sm">
                        {statusLabel(row)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        {actions.map((action, index) => (
                          <Button
                            key={action.status}
                            variant={index === 0 ? 'primary' : 'outline'}
                            size="sm"
                            loading={pending}
                            onClick={() =>
                              mutation.mutate({
                                kind: row.kind,
                                id: row.id,
                                status: action.status,
                              })
                            }
                          >
                            {action.label}
                          </Button>
                        ))}
                        {back === null ? null : (
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={pending}
                            onClick={() =>
                              mutation.mutate({
                                kind: row.kind,
                                id: row.id,
                                status: back.status,
                              })
                            }
                          >
                            {back.label}
                          </Button>
                        )}
                        <IconButton
                          variant="ghost"
                          size="sm"
                          label={`Удалить обращение от ${row.name}`}
                          icon={<Trash2 size={15} strokeWidth={1.8} />}
                          disabled={removeMutation.isPending}
                          onClick={() => setDeleteTarget(row)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!loading && !requests.isError && !bookings.isError && visible.length > 0 && pageCount > 1 ? (
        <Pagination
          page={safePage}
          pageCount={pageCount}
          onChange={setPage}
          aria-label="Страницы обращений"
        />
      ) : null}

      {!loading && capped ? (
        <Text variant="caption" color="dim">
          Показаны последние 200 обращений каждого типа — более старые ищите через фильтр статуса.
        </Text>
      ) : null}

      <InboxDetailsDialog
        row={selected}
        pendingStatus={selected !== null && pendingFor(selected.id)}
        pendingDelete={removeMutation.isPending}
        onClose={() => setSelected(null)}
        onStatus={(status) => {
          if (selected !== null) {
            mutation.mutate({ kind: selected.kind, id: selected.id, status });
          }
        }}
        onDelete={() => setDeleteTarget(selected)}
      />

      <ConfirmDeleteDialog
        row={deleteTarget}
        loading={pendingDelete}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget !== null) {
            removeMutation.mutate(
              { kind: deleteTarget.kind, id: deleteTarget.id },
              { onSettled: () => setDeleteTarget(null) },
            );
          }
        }}
      />
    </div>
  );
}
