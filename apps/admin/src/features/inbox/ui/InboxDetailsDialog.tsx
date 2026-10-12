'use client';

import { Badge, Button, Modal } from '@sto/ui';
import { Trash2 } from 'lucide-react';
import {
  actionsFor,
  badgeVariantFor,
  formatCreatedAt,
  prettyPhone,
  returnAction,
  statusLabel,
  type InboxRow,
} from './inbox-shared';

const bookingFormat = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-caption uppercase tracking-[0.1em] text-content-dim">
        {label}
      </span>
      <div className="min-h-6 text-body text-content">{children}</div>
    </div>
  );
}

interface InboxDetailsDialogProps {
  row: InboxRow | null;
  pendingStatus: boolean;
  pendingDelete: boolean;
  onClose: () => void;
  onStatus: (status: string) => void;
  onDelete: () => void;
}

export function InboxDetailsDialog({
  row,
  pendingStatus,
  pendingDelete,
  onClose,
  onStatus,
  onDelete,
}: InboxDetailsDialogProps) {
  return (
    <Modal
      open={row !== null}
      onClose={onClose}
      title={row === null ? 'Обращение' : `${row.name} · ${statusLabel(row)}`}
      size="lg"
    >
      {row === null ? null : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Тип">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-panel px-2.5 py-1 font-mono text-caption uppercase tracking-[0.08em] text-content-muted">
                {row.kind === 'callback' ? 'Перезвони мне' : 'Сам запишусь'}
              </span>
            </Field>
            <Field label="Статус">
              <Badge variant={badgeVariantFor(row.status)} size="sm">
                {statusLabel(row)}
              </Badge>
            </Field>
            <Field label="Телефон">
              <a
                href={`tel:${row.phone.replace(/[^0-9+]/g, '')}`}
                className="w-fit font-mono text-sm text-content-muted transition-colors hover:text-primary"
              >
                {prettyPhone(row.phone)}
              </a>
            </Field>
            <Field label="Создана">
              <span className="font-mono text-sm text-content-muted">
                {formatCreatedAt(row.createdAt)}
              </span>
            </Field>
            {row.kind === 'booking' ? (
              <>
                <Field label="Запись">
                  <span className="font-mono text-sm text-content-muted">
                    {row.scheduledAt === null
                      ? '—'
                      : bookingFormat.format(new Date(row.scheduledAt))}
                  </span>
                </Field>
                <Field label="Авто">
                  <span className="text-sm [overflow-wrap:anywhere] text-content-muted">
                    {row.car ?? '—'}
                  </span>
                </Field>
                <div className="col-span-full">
                  <Field label="Услуги">
                    <span className="block text-sm [overflow-wrap:anywhere] text-content-muted">
                      {row.services.length > 0 ? row.services.join(', ') : '—'}
                    </span>
                  </Field>
                </div>
              </>
            ) : null}
            <div className="col-span-full">
              <Field label="Комментарий">
                <span className="block text-sm leading-relaxed [overflow-wrap:anywhere] text-content-muted">
                  {row.comment ?? '—'}
                </span>
              </Field>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            {actionsFor(row).map((action, index) => (
              <Button
                key={action.status}
                variant={index === 0 ? 'primary' : 'outline'}
                size="sm"
                loading={pendingStatus}
                onClick={() => onStatus(action.status)}
              >
                {action.label}
              </Button>
            ))}
            {(() => {
              const back = returnAction(row);
              return back === null ? null : (
                <Button
                  variant="ghost"
                  size="sm"
                  loading={pendingStatus}
                  onClick={() => onStatus(back.status)}
                >
                  {back.label}
                </Button>
              );
            })()}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-danger hover:bg-danger/10 hover:text-danger"
              disabled={pendingDelete}
              onClick={onDelete}
            >
              <Trash2 size={15} strokeWidth={1.8} />
              Удалить
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
