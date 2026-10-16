'use client';

import { useEffect, useState } from 'react';
import { Button, Checkbox, Input, Modal, Text, Textarea } from '@sto/ui';
import { apiSend } from '@/shared/api/client';
import type { FaqItemRow } from '@/lib/api';

export interface FaqDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Редактируемый вопрос; null — создание */
  item: FaqItemRow | null;
}

interface FormState {
  question: string;
  answer: string;
  isActive: boolean;
}

function toForm(item: FaqItemRow | null): FormState {
  return {
    question: item?.question ?? '',
    answer: item?.answer ?? '',
    isActive: item?.isActive ?? true,
  };
}

export function FaqDialog({ open, onClose, onSaved, item }: FaqDialogProps) {
  const [form, setForm] = useState<FormState>(() => toForm(item));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(toForm(item));
      setError(null);
    }
  }, [open, item]);

  const submit = async (): Promise<void> => {
    if (pending) {
      return;
    }
    const question = form.question.trim();
    const answer = form.answer.trim();
    if (question.length < 5 || question.length > 200) {
      setError('Вопрос: от 5 до 200 знаков');
      return;
    }
    if (answer.length < 5 || answer.length > 2000) {
      setError('Ответ: от 5 до 2000 знаков');
      return;
    }
    setPending(true);
    setError(null);
    try {
      await apiSend(
        item === null ? '/api/faq' : `/api/faq/${item.id}`,
        item === null ? 'POST' : 'PATCH',
        { question, answer, isActive: form.isActive },
        'Не удалось сохранить вопрос',
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
      title={item === null ? 'Новый вопрос' : 'Вопрос'}
      description={item === null ? 'Появится на странице «Вопросы и ответы»' : undefined}
      size="md"
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Input
          id="faq-question"
          label="Вопрос"
          placeholder="Нужно ли записываться заранее?"
          value={form.question}
          maxLength={200}
          onChange={(event) => setForm((prev) => ({ ...prev, question: event.target.value }))}
        />
        <Textarea
          id="faq-answer"
          label="Ответ"
          placeholder="Да, так машина не будет ждать. Запишитесь онлайн или позвоните."
          rows={5}
          maxLength={2000}
          value={form.answer}
          onChange={(event) => setForm((prev) => ({ ...prev, answer: event.target.value }))}
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
