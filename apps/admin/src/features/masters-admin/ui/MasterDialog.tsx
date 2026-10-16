'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Modal, Text } from '@sto/ui';
import { apiSend } from '@/shared/api/client';
import type { MasterRow } from '@/lib/api';

export interface MasterDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Редактируемый мастер; null — создание */
  master: MasterRow | null;
}

export function MasterDialog({ open, onClose, onSaved, master }: MasterDialogProps) {
  const [name, setName] = useState('');
  const [chatId, setChatId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setName(master?.name ?? '');
      setChatId('');
      setError(null);
    }
  }, [open, master]);

  const submit = async (): Promise<void> => {
    if (pending) {
      return;
    }
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 80) {
      setError('Имя: от 2 до 80 символов');
      return;
    }
    const cleanChatId = chatId.trim();
    if (master === null && (cleanChatId.length < 5 || !/^\d+$/.test(cleanChatId))) {
      setError('chat_id: только цифры, от 5 знаков');
      return;
    }
    setPending(true);
    setError(null);
    try {
      await apiSend(
        master === null ? '/api/masters' : `/api/masters/${master.id}`,
        master === null ? 'POST' : 'PATCH',
        master === null ? { name: cleanName, telegramChatId: cleanChatId } : { name: cleanName },
        master === null ? 'Не удалось добавить мастера' : 'Не удалось сохранить мастера',
      );
      onSaved();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось сохранить мастера');
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={master === null ? 'Новый мастер' : 'Мастер'}
      description={master === null ? 'Будет получать заявки в Telegram' : undefined}
      size="sm"
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Input
          id="master-name"
          label="Имя"
          placeholder="Сергей"
          value={name}
          maxLength={80}
          onChange={(event) => setName(event.target.value)}
        />
        {master === null ? (
          <Input
            id="master-chat-id"
            label="chat_id"
            placeholder="1160368886"
            inputMode="numeric"
            helper="Мастер пишет боту любое сообщение и получает свой chat_id в ответ"
            value={chatId}
            onChange={(event) => setChatId(event.target.value)}
          />
        ) : (
          <Input
            id="master-chat-id-readonly"
            label="chat_id"
            value={master.telegramChatId}
            disabled
            helper="Заменить нельзя — удалите мастера и добавьте заново"
          />
        )}
        {error !== null ? (
          <Text variant="caption" className="text-danger">
            {error}
          </Text>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" loading={pending}>
            Сохранить
          </Button>
        </div>
      </form>
    </Modal>
  );
}
