'use client';

import { useEffect, useState } from 'react';
import { Button, Checkbox, Input, Modal, Text, Textarea } from '@sto/ui';
import type { TeamMemberRow } from '@/lib/api';
import { apiSend } from '@/shared/api/client';
import { PhotoField } from '@/shared/ui/PhotoField';

export interface MemberDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Редактируемый участник; null — создание */
  member: TeamMemberRow | null;
}

interface FormState {
  name: string;
  role: string;
  spec: string;
  photo: string | null;
  photoAlt: string;
  isActive: boolean;
}

function toForm(member: TeamMemberRow | null): FormState {
  return {
    name: member?.name ?? '',
    role: member?.role ?? '',
    spec: member?.spec ?? '',
    photo: member?.photo ?? null,
    photoAlt: member?.photoAlt ?? '',
    isActive: member?.isActive ?? true,
  };
}

export function MemberDialog({ open, onClose, onSaved, member }: MemberDialogProps) {
  const [form, setForm] = useState<FormState>(() => toForm(member));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(toForm(member));
      setError(null);
    }
  }, [open, member]);

  const submit = async (): Promise<void> => {
    if (form.name.trim().length < 2 || form.name.trim().length > 80) {
      setError('Имя: от 2 до 80 знаков');
      return;
    }
    if (form.role.trim().length < 2 || form.role.trim().length > 120) {
      setError('Должность: от 2 до 120 знаков');
      return;
    }
    if (form.spec.trim().length < 2) {
      setError('Укажите специализацию');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const body = {
        name: form.name.trim(),
        role: form.role.trim(),
        spec: form.spec.trim(),
        photo: form.photo,
        photoAlt: form.photoAlt.trim() === '' ? null : form.photoAlt.trim(),
        isActive: form.isActive,
      };
      await apiSend(
        member === null ? '/api/team' : `/api/team/${member.id}`,
        member === null ? 'POST' : 'PATCH',
        body,
        'Не удалось сохранить участника',
      );
      onSaved();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось сохранить');
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={member === null ? 'Новый участник' : 'Участник команды'}
      description={member === null ? 'Отображается в разделе команды на сайте' : undefined}
      size="md"
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!pending) {
            void submit();
          }
        }}
      >
        <Input
          id="member-name"
          label="Имя"
          value={form.name}
          maxLength={80}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
        <Input
          id="member-role"
          label="Должность"
          placeholder="Мастер-моторист"
          helper="Показывается на сайте под именем"
          value={form.role}
          maxLength={120}
          onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
        />
        <Textarea
          id="member-spec"
          label="Специализация"
          placeholder="Двигатели, ГРМ, система охлаждения"
          rows={2}
          maxLength={300}
          value={form.spec}
          onChange={(event) => setForm((prev) => ({ ...prev, spec: event.target.value }))}
        />
        <PhotoField
          value={form.photo}
          onChange={(url) => setForm((prev) => ({ ...prev, photo: url }))}
          onRemove={() => setForm((prev) => ({ ...prev, photo: null }))}
        />
        <Input
          id="member-photo-alt"
          label="Описание фото (необязательно)"
          placeholder="Максим за стойкой приёмки"
          helper="Подпись для скринридеров"
          value={form.photoAlt}
          maxLength={120}
          onChange={(event) => setForm((prev) => ({ ...prev, photoAlt: event.target.value }))}
        />
        <Checkbox
          label="Показывать на сайте"
          checked={form.isActive}
          onChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
        />
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
