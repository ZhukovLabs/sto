'use client';

import { useEffect, useState } from 'react';
import { Button, Checkbox, Input, Modal, Select, Text } from '@sto/ui';
import { GROUP_ICONS, GROUP_ICON_LABELS, readProxyError, type ServiceGroupRow } from '@/lib/api';
import { PhotoField } from './PhotoField';

export interface GroupDialogProps {
  open: boolean;
  onClose: () => void;
  /** Вызывается после успешного сохранения (до закрытия) — чтобы обновить каталог. */
  onSaved: () => void;
  /** Редактируемая группа; null — создание */
  group: ServiceGroupRow | null;
}

interface FormState {
  title: string;
  icon: string;
  photo: string | null;
  isActive: boolean;
}

function toForm(group: ServiceGroupRow | null): FormState {
  return {
    title: group?.title ?? '',
    icon: group?.icon ?? '',
    photo: group?.photo ?? null,
    isActive: group?.isActive ?? true,
  };
}

export function GroupDialog({ open, onClose, onSaved, group }: GroupDialogProps) {
  const [form, setForm] = useState<FormState>(() => toForm(group));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(toForm(group));
      setError(null);
    }
  }, [open, group]);

  const submit = async (): Promise<void> => {
    if (form.title.trim().length < 2) {
      setError('Название: от 2 символов');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const body = {
        title: form.title.trim(),
        icon: form.icon === '' ? null : form.icon,
        photo: form.photo,
        isActive: form.isActive,
      };
      const response = await fetch(
        group === null ? '/api/services/groups' : `/api/services/groups/${group.id}`,
        {
          method: group === null ? 'POST' : 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) {
        throw await readProxyError(response, 'Не удалось сохранить группу');
      }
      onSaved();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось сохранить группу');
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={group === null ? 'Новая группа' : 'Группа'}
      size="md"
    >
      <div className="flex flex-col gap-4">
        <Input
          id="group-title"
          label="Название"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
        />
        <Select
          label="Иконка"
          value={form.icon}
          onChange={(value) => setForm((prev) => ({ ...prev, icon: value }))}
          options={[
            { value: '', label: '— нет —' },
            ...GROUP_ICONS.map((icon) => ({ value: icon, label: GROUP_ICON_LABELS[icon] })),
          ]}
        />
        <PhotoField
          value={form.photo}
          onChange={(url) => setForm((prev) => ({ ...prev, photo: url }))}
          onRemove={() => setForm((prev) => ({ ...prev, photo: null }))}
        />
        <Checkbox
          label="Активна (показывается на сайте)"
          checked={form.isActive}
          onChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
        />
        {group !== null && group.services.length > 0 ? (
          <Text variant="caption" color="dim">
            В группе {group.services.length} услуг — при удалении группы удалятся и они.
          </Text>
        ) : null}
        {error !== null ? (
          <Text variant="caption" className="text-danger">
            {error}
          </Text>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button loading={pending} onClick={() => void submit()}>
            Сохранить
          </Button>
        </div>
      </div>
    </Modal>
  );
}
