'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Pencil, Plus, Rss, Trash2 } from 'lucide-react';
import { Badge, Button, IconButton, Skeleton, Text } from '@sto/ui';
import { apiDelete, apiGet, apiSend } from '@/shared/api/client';
import { pluralRu } from '@/shared/lib/plural';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import type { NewsRow } from '@/lib/api';
import { readProxyError, type AutoNewsLastRun, type AutoNewsResult } from '@/lib/api';
import { NewsForm } from './NewsForm';

const NEWS_KEY = ['news'] as const;
/** Как часто админка сверяется с сервером о ходе автогенерации. */
const AUTO_STATUS_POLL_MS = 5000;
/** Сколько минут после завершения показываем итог прошлого прогона. */
const AUTO_LAST_FRESH_MS = 15 * 60 * 1000;

const NEWS_FORMS = ['новость', 'новости', 'новостей'] as const;

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

async function fetchNews(): Promise<NewsRow[]> {
  return apiGet<NewsRow[]>('/api/news', 'Не удалось загрузить новости');
}

function NewsRowView({
  item,
  toggling,
  onEdit,
  onTogglePublished,
  onDelete,
}: {
  item: NewsRow;
  toggling: boolean;
  onEdit: () => void;
  onTogglePublished: () => void;
  onDelete: () => void;
}) {
  const date = item.publishedAt ?? item.updatedAt;
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-panel-2/60 motion-reduce:transition-none sm:gap-4 sm:px-5 ${
        item.isPublished ? '' : 'opacity-70'
      }`}
    >
      <span className="flex h-12 w-16 shrink-0 overflow-hidden rounded border border-border bg-panel-2">
        {item.cover !== null ? (
          <img src={item.cover} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center font-mono text-caption text-content-dim">
            —
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-body font-semibold text-content">{item.title}</span>
          {!item.isPublished ? (
            <Badge variant="neutral" size="sm">
              черновик
            </Badge>
          ) : null}
          {item.sourceUrl !== null ? (
            <Badge variant="neutral" size="sm">
              rss
            </Badge>
          ) : null}
        </span>
        <span className="truncate font-mono text-caption text-content-dim">
          /news/{item.slug} · {dateFormat.format(new Date(date))}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <span className="hidden sm:inline-flex">
          <IconButton
            variant="ghost"
            size="sm"
            loading={toggling}
            label={
              item.isPublished
                ? `Скрыть «${item.title}» с сайта`
                : `Опубликовать «${item.title}» на сайте`
            }
            icon={
              item.isPublished ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )
            }
            onClick={onTogglePublished}
          />
        </span>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Изменить «${item.title}»`}
          onClick={onEdit}
        >
          <Pencil className="size-3.5" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-danger hover:bg-danger/10"
          aria-label={`Удалить «${item.title}»`}
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </Button>
      </span>
    </div>
  );
}

export function NewsAdmin(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [autoInfo, setAutoInfo] = useState<AutoNewsResult | null>(null);
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoLast, setAutoLast] = useState<AutoNewsLastRun | null>(null);
  const [editing, setEditing] = useState<NewsRow | 'new' | null>(null);
  const [confirming, setConfirming] = useState<NewsRow | null>(null);

  const newsQuery = useQuery({ queryKey: NEWS_KEY, queryFn: fetchNews });

  const invalidate = (): void => {
    void queryClient.invalidateQueries({ queryKey: NEWS_KEY });
  };

  // Состояние генерации живёт на сервере: лоадер переживает перезагрузку страницы
  // и не даёт запустить вторую генерацию из другой вкладки.
  const prevRunningRef = useRef(false);
  useEffect(() => {
    let cancelled = false;
    const tick = async (): Promise<void> => {
      // Фоновая вкладка не поллит: генсостояние важно, только когда админ смотрит.
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      try {
        const response = await fetch('/api/news/auto/status');
        if (!response.ok) {
          return;
        }
        const state = (await response.json()) as {
          running: boolean;
          last: AutoNewsLastRun | null;
        };
        if (cancelled) {
          return;
        }
        if (state.last !== null) {
          setAutoLast((prev) => (prev?.finishedAt === state.last?.finishedAt ? prev : state.last));
        }
        const wasRunning = prevRunningRef.current;
        prevRunningRef.current = state.running;
        setAutoRunning(state.running);
        if (wasRunning && !state.running) {
          void queryClient.invalidateQueries({ queryKey: NEWS_KEY });
        }
      } catch {
        // сеть моргнула - следующий тик поправит
      }
    };
    void tick();
    const timer = setInterval(() => void tick(), AUTO_STATUS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [queryClient]);

  const onError = (error: Error): void => {
    setActionError(error.message);
    if (/уже идёт/i.test(error.message)) {
      setAutoRunning(true);
    }
  };

  const autoRun = useMutation({
    mutationFn: async (): Promise<AutoNewsResult> => {
      const response = await fetch('/api/news/auto', { method: 'POST' });
      if (!response.ok) {
        throw await readProxyError(response, 'Не удалось собрать новость');
      }
      return (await response.json()) as AutoNewsResult;
    },
    onSuccess: (result) => {
      setActionError(null);
      setAutoInfo(result);
      setAutoLast(null);
      invalidate();
    },
    onError,
  });

  const togglePublished = useMutation({
    mutationFn: (item: NewsRow) =>
      apiSend(
        `/api/news/${item.id}`,
        'PATCH',
        { isPublished: !item.isPublished },
        'Не удалось изменить видимость',
      ),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError,
  });

  const removeItem = useMutation({
    mutationFn: (item: NewsRow) => apiDelete(`/api/news/${item.id}`, 'Не удалось удалить новость'),
    onSuccess: () => {
      setActionError(null);
      setConfirming(null);
      invalidate();
    },
    onError,
  });

  if (editing !== null) {
    return (
      <NewsForm
        item={editing === 'new' ? null : editing}
        onBack={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          invalidate();
        }}
      />
    );
  }

  const list = newsQuery.data ?? [];
  const generating = autoRun.isPending || autoRunning;
  const lastFresh =
    autoLast !== null && Date.now() - new Date(autoLast.finishedAt).getTime() < AUTO_LAST_FRESH_MS
      ? autoLast
      : null;
  const autoDone: AutoNewsResult | null = autoInfo ?? lastFresh?.result ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Text variant="caption" color="dim" className="font-mono uppercase tracking-[0.08em]">
          {list.length} {pluralRu(list.length, NEWS_FORMS)}
        </Text>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={generating}
            disabled={generating}
            onClick={() => {
              setAutoInfo(null);
              setAutoLast(null);
              autoRun.mutate();
            }}
          >
            <Rss className="size-3.5" aria-hidden="true" />
            {generating ? 'Собираем…' : 'Собрать из RSS'}
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={() => setEditing('new')}>
            <Plus className="size-3.5" aria-hidden="true" />
            Новость
          </Button>
        </div>
      </div>

      {generating ? (
        <Text variant="caption" color="dim">
          ИИ собирает новость: ленты → выбор лучшей → переработка и проверка. Это занимает пару
          минут, страницу можно перезагрузить — прогресс не потеряется.
        </Text>
      ) : null}

      {autoDone !== null ? (
        <Text variant="caption" className="text-success">
          Опубликовано из «{autoDone.pickedFrom}» (выбор из {autoDone.candidates})
          {autoDone.focus !== '' ? ` · фокус: ${autoDone.focus}` : ''}
          {autoDone.reason !== '' ? ` — ${autoDone.reason}` : ''} · /news/{autoDone.slug}
        </Text>
      ) : null}

      {lastFresh !== null && !lastFresh.ok && lastFresh.message !== undefined ? (
        <Text variant="caption" className="text-danger">
          Прошлая генерация не удалась: {lastFresh.message}
        </Text>
      ) : null}

      {newsQuery.isPending ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-panel p-5">
          {Array.from({ length: 3 }, (_, row) => (
            <div key={row} className="flex items-center gap-4">
              <Skeleton width="4rem" height="3rem" />
              <span className="flex flex-1 flex-col gap-1.5">
                <Skeleton height="1rem" className="max-w-72" />
                <Skeleton height="0.75rem" className="max-w-48" />
              </span>
              <Skeleton width="7rem" height="2.25rem" />
            </div>
          ))}
        </div>
      ) : newsQuery.isError ? (
        <Text variant="body" className="text-danger">
          {newsQuery.error instanceof Error
            ? newsQuery.error.message
            : 'Не удалось загрузить новости'}
        </Text>
      ) : list.length === 0 ? (
        <EmptyState
          title="Новостей ещё нет — напишите первую."
          hint="Раз или два в неделю: сезонные чек-листы, ответы на частые вопросы, случаи из цеха."
          action={
            <Button variant="primary" size="sm" onClick={() => setEditing('new')}>
              <Plus className="size-3.5" aria-hidden="true" />
              Новость
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-panel">
          {list.map((item) => (
            <NewsRowView
              key={item.id}
              item={item}
              toggling={togglePublished.isPending && togglePublished.variables?.id === item.id}
              onEdit={() => setEditing(item)}
              onTogglePublished={() => togglePublished.mutate(item)}
              onDelete={() => setConfirming(item)}
            />
          ))}
        </div>
      )}

      {actionError !== null ? (
        <Text variant="caption" className="text-danger">
          {actionError}
        </Text>
      ) : null}

      <ConfirmDialog
        open={confirming !== null}
        title="Удалить новость?"
        description={
          <>
            <span className="font-semibold text-content">{confirming?.title ?? ''}</span> будет
            удалена со страницы «Новости».
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
