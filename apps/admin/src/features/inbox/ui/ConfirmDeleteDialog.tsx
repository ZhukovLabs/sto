'use client';

import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import type { InboxRow } from './inbox-shared';

interface ConfirmDeleteDialogProps {
  row: InboxRow | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({
  row,
  loading,
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <ConfirmDialog
      open={row !== null}
      title="Удалить обращение?"
      description={
        row && (
          <>
            Обращение от <span className="font-semibold text-content">{row.name}</span> будет
            удалено вместе с сообщением в Telegram. Действие необратимо.
          </>
        )
      }
      loading={loading}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
