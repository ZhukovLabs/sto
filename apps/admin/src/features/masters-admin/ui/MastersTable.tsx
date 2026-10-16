'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  SegmentedControl,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Text,
} from '@sto/ui';
import { apiDelete, apiGet, apiSend } from '@/shared/api/client';
import { pluralRu } from '@/shared/lib/plural';
import { EmptyState } from '@/shared/ui/EmptyState';
import { SearchInput } from '@/shared/ui/SearchInput';
import type { MasterRow } from '@/lib/api';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { MasterDialog } from './MasterDialog';

const MASTERS_KEY = ['masters'] as const;

const MASTER_FORMS = ['мастер', 'мастера', 'мастеров'] as const;

type MastersFilter = 'all' | 'active' | 'paused';

const FILTER_OPTIONS = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'paused', label: 'На паузе' },
];

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function masterPlural(count: number): string {
  return pluralRu(count, MASTER_FORMS);
}

function MastersTableHead(): React.JSX.Element {
  return (
    <TableHead>
      <TableRow className="hover:bg-transparent">
        <TableHeadCell>Мастер</TableHeadCell>
        <TableHeadCell className="hidden sm:table-cell">chat_id</TableHeadCell>
        <TableHeadCell className="hidden sm:table-cell">Статус</TableHeadCell>
        <TableHeadCell className="text-right">Действия</TableHeadCell>
      </TableRow>
    </TableHead>
  );
}

export function MastersTable(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<MastersFilter>('all');
  const [actionError, setActionError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; master: MasterRow | null }>({
    open: false,
    master: null,
  });
  const [confirming, setConfirming] = useState<MasterRow | null>(null);

  const masters = useQuery({
    queryKey: MASTERS_KEY,
    queryFn: () => apiGet<MasterRow[]>('/api/masters', 'Не удалось загрузить мастеров'),
  });

  const invalidate = (): void => {
    void queryClient.invalidateQueries({ queryKey: MASTERS_KEY });
  };

  const onError = (error: Error): void => {
    setActionError(error.message);
  };

  const update = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiSend(`/api/masters/${id}`, 'PATCH', { isActive }, 'Не удалось обновить мастера'),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (master: MasterRow) =>
      apiDelete(`/api/masters/${master.id}`, 'Не удалось удалить мастера'),
    onSuccess: () => {
      setActionError(null);
      setConfirming(null);
      invalidate();
    },
    onError,
  });

  const list = masters.data ?? [];
  const normalizedQuery = query.trim().toLowerCase();
  const searching = normalizedQuery !== '';

  const filtered = useMemo(() => {
    let result = list;
    if (filter === 'active') {
      result = result.filter((master) => master.isActive);
    } else if (filter === 'paused') {
      result = result.filter((master) => !master.isActive);
    }
    if (!searching) {
      return result;
    }
    return result.filter(
      (master) =>
        master.name.toLowerCase().includes(normalizedQuery) ||
        master.telegramChatId.includes(normalizedQuery),
    );
  }, [list, filter, normalizedQuery, searching]);

  const emptyText = searching
    ? `По запросу «${query.trim()}» ничего не нашлось.`
    : filter === 'active'
      ? 'Активных мастеров нет.'
      : 'На паузе никого нет.';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Поиск мастера"
          aria-label="Поиск мастера"
        />
        <SegmentedControl
          items={FILTER_OPTIONS}
          value={filter}
          onChange={(value) => setFilter(value as MastersFilter)}
          aria-label="Фильтр мастеров"
        />
        <span className="ml-auto flex items-center gap-4 whitespace-nowrap">
          <Text variant="caption" color="dim" className="font-mono uppercase tracking-[0.08em]">
            {filtered.length} {masterPlural(filtered.length)}
          </Text>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setDialog({ open: true, master: null })}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Мастер
          </Button>
        </span>
      </div>

      {actionError !== null ? (
        <Text variant="caption" className="text-danger">
          {actionError}
        </Text>
      ) : null}

      {masters.isPending ? (
        <div className="rounded-xl border border-border bg-panel">
          <Table>
            <MastersTableHead />
            <TableBody>
              {Array.from({ length: 4 }, (_, row) => (
                <TableRow key={row}>
                  <TableCell>
                    <span className="flex flex-col gap-1.5">
                      <Skeleton height="1rem" className="max-w-32" />
                      <Skeleton height="0.75rem" className="max-w-20" />
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton height="1rem" className="max-w-24" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton height="1.25rem" className="max-w-28" rounded="full" />
                  </TableCell>
                  <TableCell>
                    <span className="flex justify-end">
                      <Skeleton height="2.25rem" className="max-w-44" />
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : masters.isError ? (
        <Text variant="body" className="text-danger">
          {masters.error instanceof Error ? masters.error.message : 'Не удалось загрузить мастеров'}
        </Text>
      ) : list.length === 0 ? (
        <EmptyState
          title="Мастеров пока нет — заявки в Telegram не уходят."
          hint="Мастер пишет боту любое сообщение и получает свой chat_id — добавьте его сюда."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setDialog({ open: true, master: null })}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Мастер
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-panel">
          <Table>
            <MastersTableHead />
            <TableBody>
              {filtered.map((master) => (
                <TableRow key={master.id} className={master.isActive ? '' : 'opacity-60'}>
                  <TableCell className="max-w-[280px]">
                    <Text variant="body" className="font-semibold text-content">
                      {master.name}
                    </Text>
                    <Text variant="caption" color="dim">
                      с {dateFormat.format(new Date(master.createdAt))}
                    </Text>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap sm:table-cell">
                    <Text variant="mono" color="muted">
                      {master.telegramChatId}
                    </Text>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant={master.isActive ? 'success' : 'neutral'}
                      size="sm"
                      dot
                      className="whitespace-nowrap"
                    >
                      {master.isActive ? 'Получает заявки' : 'На паузе'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        loading={update.isPending && update.variables?.id === master.id}
                        onClick={() => update.mutate({ id: master.id, isActive: !master.isActive })}
                      >
                        {master.isActive ? 'Пауза' : 'Включить'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Изменить ${master.name}`}
                        onClick={() => setDialog({ open: true, master })}
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger hover:bg-danger/10"
                        aria-label={`Удалить ${master.name}`}
                        onClick={() => setConfirming(master)}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4}>
                    <Text variant="body" color="muted" className="block py-8 text-center">
                      {emptyText}
                    </Text>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      )}

      <MasterDialog
        open={dialog.open}
        master={dialog.master}
        onClose={() => setDialog({ open: false, master: null })}
        onSaved={() => {
          setDialog({ open: false, master: null });
          invalidate();
        }}
      />

      <ConfirmDialog
        open={confirming !== null}
        title="Удалить мастера?"
        description={
          <>
            <span className="font-semibold text-content">{confirming?.name ?? ''}</span> перестанет
            получать заявки в Telegram.
          </>
        }
        loading={remove.isPending}
        onConfirm={() => {
          if (confirming !== null) {
            remove.mutate(confirming);
          }
        }}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
