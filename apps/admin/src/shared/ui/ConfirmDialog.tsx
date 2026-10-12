'use client';

import { useRef, type ReactNode } from 'react';
import { Button, Modal, Text } from '@sto/ui';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Удалить',
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const snapshot = useRef<ReactNode>(null);
  if (open) {
    snapshot.current = description;
  }
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <div className="flex flex-col gap-5">
        <Text variant="body" color="muted">
          {snapshot.current}
        </Text>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Отмена
          </Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
