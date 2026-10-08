'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Text } from '@sto/ui';
import { REQUEST_STATUS_LABELS, readProxyError, type RequestStatus } from '@/lib/api';

interface RequestRow {
  id: string;
  name: string;
  phone: string;
  status: string;
  createdAt: string;
}

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function prettyPhone(phone: string): string {
  const match = phone.match(/^(\+?375)(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return match === null ? phone : `+375 ${match[2]} ${match[3]}-${match[4]}-${match[5]}`;
}

const CHIP_STYLES: Record<string, string> = {
  new: 'border-primary/50 bg-primary/10 text-primary',
  called: 'border-content-dim/50 bg-panel-2 text-content-muted',
  taken: 'border-success/50 bg-success/10 text-success',
  cancelled: 'border-border text-content-dim',
};

const ROW_FADE: Record<string, string> = {
  new: '',
  called: '',
  taken: 'opacity-60',
  cancelled: 'opacity-60',
};

function statusLabel(status: string): string {
  return status in REQUEST_STATUS_LABELS ? REQUEST_STATUS_LABELS[status as RequestStatus] : status;
}

async function fetchRequests(): Promise<RequestRow[]> {
  const response = await fetch('/api/requests');
  if (!response.ok) {
    throw await readProxyError(response, 'Не удалось загрузить заявки');
  }
  return response.json();
}

async function updateStatus(id: string, status: RequestStatus): Promise<void> {
  const response = await fetch(`/api/requests/${id}/status`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw await readProxyError(response, 'Не удалось обновить заявку');
  }
}

export function RequestsTable() {
  const queryClient = useQueryClient();
  const requests = useQuery({ queryKey: ['requests'], queryFn: fetchRequests });
  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RequestStatus }) => updateStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });

  if (requests.isPending) {
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
  if (requests.data.length === 0) {
    return (
      <Text variant="body" color="muted">
        Заявок пока нет — новые появятся здесь автоматически.
      </Text>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-left">
        <thead className="bg-panel-2">
          <tr>
            {['Когда', 'Клиент', 'Телефон', 'Статус', ''].map((label) => (
              <th
                key={label}
                className={`px-5 py-3 font-mono text-caption font-normal uppercase tracking-[0.1em] text-content-dim ${
                  label === '' ? 'sr-only' : ''
                }`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-panel">
          {requests.data.map((request) => {
            const status = request.status;
            const pending = mutation.isPending && mutation.variables?.id === request.id;
            return (
              <tr key={request.id} className={ROW_FADE[status] ?? ''}>
                <td className="px-5 py-4 font-mono text-caption text-content-muted">
                  {dateFormat.format(new Date(request.createdAt))}
                </td>
                <td className="px-5 py-4">
                  <Text variant="body" className="font-semibold">
                    {request.name}
                  </Text>
                </td>
                <td className="px-5 py-4">
                  <a
                    href={`tel:${request.phone.replace(/[^0-9+]/g, '')}`}
                    className="font-mono text-sm text-content-muted transition-colors hover:text-primary"
                  >
                    {prettyPhone(request.phone)}
                  </a>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-caption uppercase tracking-[0.08em] ${
                      CHIP_STYLES[status] ?? CHIP_STYLES.cancelled
                    }`}
                  >
                    {statusLabel(status)}
                  </span>
                </td>
                <td className="px-5 py-4 text-right whitespace-nowrap">
                  {status === 'new' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      loading={pending}
                      onClick={() => mutation.mutate({ id: request.id, status: 'called' })}
                    >
                      Перезвонили
                    </Button>
                  ) : null}
                  {status === 'called' ? (
                    <span className="inline-flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        loading={pending}
                        onClick={() => mutation.mutate({ id: request.id, status: 'taken' })}
                      >
                        Взят
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        loading={pending}
                        onClick={() => mutation.mutate({ id: request.id, status: 'cancelled' })}
                      >
                        Отменить
                      </Button>
                    </span>
                  ) : null}
                  {status === 'taken' || status === 'cancelled' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      loading={pending}
                      onClick={() => mutation.mutate({ id: request.id, status: 'new' })}
                    >
                      Вернуть
                    </Button>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
