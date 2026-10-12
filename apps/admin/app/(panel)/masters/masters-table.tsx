'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Text } from '@sto/ui';
import { readProxyError, type MasterRow } from '@/lib/api';

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

async function fetchMasters(): Promise<MasterRow[]> {
  const response = await fetch('/api/masters');
  if (!response.ok) {
    throw await readProxyError(response, 'Не удалось загрузить мастеров');
  }
  return response.json();
}

async function createMaster(master: { name: string; telegramChatId: string }): Promise<void> {
  const response = await fetch('/api/masters', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(master),
  });
  if (!response.ok) {
    throw await readProxyError(response, 'Не удалось добавить мастера');
  }
}

async function updateMaster(id: string, patch: { isActive?: boolean }): Promise<void> {
  const response = await fetch(`/api/masters/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    throw await readProxyError(response, 'Не удалось обновить мастера');
  }
}

async function deleteMaster(id: string): Promise<void> {
  const response = await fetch(`/api/masters/${id}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) {
    throw await readProxyError(response, 'Не удалось удалить мастера');
  }
}

export function MastersTable() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [chatId, setChatId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const masters = useQuery({ queryKey: ['masters'], queryFn: fetchMasters });

  const invalidate = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['masters'] });
  };

  const create = useMutation({
    mutationFn: createMaster,
    onSuccess: () => {
      setName('');
      setChatId('');
      setFormError(null);
      invalidate();
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { isActive?: boolean } }) =>
      updateMaster(id, patch),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteMaster,
    onSuccess: () => {
      setConfirmDeleteId(null);
      invalidate();
    },
  });

  const submit = (): void => {
    if (create.isPending) {
      return;
    }
    if (name.trim().length < 2 || chatId.trim().length < 5) {
      setFormError('Имя: от 2 символов, chat_id: от 5 цифр');
      return;
    }
    create.mutate({ name: name.trim(), telegramChatId: chatId.trim() });
  };

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex flex-col gap-3.5 rounded-lg border border-border bg-panel p-5 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="flex-1">
          <Input
            id="master-name"
            label="Имя"
            placeholder="Сергей"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="flex-1">
          <Input
            id="master-chat-id"
            label="chat_id"
            placeholder="1160368886"
            inputMode="numeric"
            value={chatId}
            onChange={(event) => setChatId(event.target.value)}
          />
        </div>
        <Button type="submit" loading={create.isPending}>
          Добавить
        </Button>
      </form>

      {formError !== null ? (
        <Text variant="caption" className="text-danger">
          {formError}
        </Text>
      ) : null}

      {masters.isPending ? (
        <Text variant="body" color="dim">
          Загружаем…
        </Text>
      ) : null}

      {masters.isError ? (
        <Text variant="body" className="text-danger">
          {masters.error instanceof Error ? masters.error.message : 'Не удалось загрузить мастеров'}
        </Text>
      ) : null}

      {masters.data !== undefined && masters.data.length === 0 ? (
        <div className="flex flex-col gap-1.5 rounded-lg border border-dashed border-border p-5">
          <Text variant="body" color="muted">
            Мастеров пока нет — заявки в Telegram не уходят.
          </Text>
          <Text variant="caption" color="dim">
            Мастер пишет боту любое сообщение, получает chat_id, вы добавляете его в форме выше.
          </Text>
        </div>
      ) : null}

      {masters.data !== undefined && masters.data.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full border-collapse">
            <thead className="bg-panel-2">
              <tr>
                <th className="px-5 py-3 text-left font-mono text-caption uppercase tracking-[0.08em] text-content-dim">
                  Мастер
                </th>
                <th className="hidden px-5 py-3 text-left font-mono text-caption uppercase tracking-[0.08em] text-content-dim sm:table-cell">
                  chat_id
                </th>
                <th className="px-5 py-3 text-left font-mono text-caption uppercase tracking-[0.08em] text-content-dim">
                  Статус
                </th>
                <th className="px-5 py-3 text-right font-mono text-caption uppercase tracking-[0.08em] text-content-dim">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-panel">
              {masters.data.map((master) => (
                <tr key={master.id} className={master.isActive ? '' : 'opacity-60'}>
                  <td className="px-5 py-3.5">
                    <Text variant="body" className="font-semibold text-content">
                      {master.name}
                    </Text>
                    <Text variant="caption" color="dim">
                      с {dateFormat.format(new Date(master.createdAt))}
                    </Text>
                  </td>
                  <td className="hidden px-5 py-3.5 sm:table-cell">
                    <Text variant="mono" color="muted">
                      {master.telegramChatId}
                    </Text>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 font-mono text-caption uppercase ${
                        master.isActive
                          ? 'border-primary/50 bg-primary/10 text-primary'
                          : 'border-border bg-panel-2 text-content-dim'
                      }`}
                    >
                      {master.isActive ? 'Получает заявки' : 'На паузе'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        loading={update.isPending && update.variables?.id === master.id}
                        onClick={() =>
                          update.mutate({ id: master.id, patch: { isActive: !master.isActive } })
                        }
                      >
                        {master.isActive ? 'Пауза' : 'Включить'}
                      </Button>
                      {confirmDeleteId === master.id ? (
                        <Button
                          variant="primary"
                          size="sm"
                          loading={remove.isPending && remove.variables === master.id}
                          onClick={() => remove.mutate(master.id)}
                        >
                          Точно удалить
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDeleteId(master.id)}
                        >
                          Удалить
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
