'use client';

import { useEffect, useState } from 'react';
import { Button, Checkbox, Input, Modal, Select, Text, Textarea } from '@sto/ui';
import {
  SERVICE_UNITS,
  SERVICE_UNIT_LABELS,
  readProxyError,
  type ServiceGroupRow,
  type ServiceRow,
} from '@/lib/api';
import { PhotoField } from './PhotoField';

export interface ServiceDialogProps {
  open: boolean;
  onClose: () => void;
  /** Вызывается после успешного сохранения (до закрытия) — чтобы обновить каталог. */
  onSaved: () => void;
  groups: ServiceGroupRow[];
  /** Редактируемая услуга; null — создание */
  service: ServiceRow | null;
  defaultGroupId: string;
}

interface FormState {
  title: string;
  description: string;
  details: string;
  priceFrom: string;
  priceTo: string;
  unit: string;
  groupId: string;
  photo: string | null;
  isActive: boolean;
}

function toForm(service: ServiceRow | null, defaultGroupId: string): FormState {
  return {
    title: service?.title ?? '',
    description: service?.description ?? '',
    details: service?.details ?? '',
    priceFrom: service === null ? '' : String(service.priceFrom),
    priceTo:
      service?.priceTo === null || service?.priceTo === undefined ? '' : String(service.priceTo),
    unit: service?.unit ?? '',
    groupId: service?.groupId ?? defaultGroupId,
    photo: service?.photo ?? null,
    isActive: service?.isActive ?? true,
  };
}

export function ServiceDialog({
  open,
  onClose,
  onSaved,
  groups,
  service,
  defaultGroupId,
}: ServiceDialogProps) {
  const [form, setForm] = useState<FormState>(() => toForm(service, defaultGroupId));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(toForm(service, defaultGroupId));
      setError(null);
    }
  }, [open, service, defaultGroupId]);

  const submit = async (): Promise<void> => {
    const priceFrom = Number(form.priceFrom);
    if (form.title.trim().length < 2) {
      setError('Название: от 2 символов');
      return;
    }
    if (form.priceFrom.trim() === '' || !Number.isFinite(priceFrom)) {
      setError('Укажите цену «от»');
      return;
    }
    const priceTo = form.priceTo.trim() === '' ? null : Number(form.priceTo);
    if (priceTo !== null && (!Number.isFinite(priceTo) || priceTo < priceFrom)) {
      setError('Цена «до» должна быть не меньше цены «от»');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        details: form.details.trim() === '' ? null : form.details.trim(),
        priceFrom,
        priceTo,
        unit: form.unit === '' ? null : form.unit,
        groupId: form.groupId,
        photo: form.photo,
        isActive: form.isActive,
      };
      const response = await fetch(
        service === null ? '/api/services' : `/api/services/${service.id}`,
        {
          method: service === null ? 'POST' : 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) {
        throw await readProxyError(response, 'Не удалось сохранить услугу');
      }
      onSaved();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось сохранить услугу');
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={service === null ? 'Новая услуга' : 'Услуга'}
      size="md"
    >
      <div className="flex flex-col gap-4">
        <Input
          id="service-title"
          label="Название"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
        />
        <Textarea
          id="service-description"
          label="Описание"
          rows={2}
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
        />
        <Textarea
          id="service-details"
          label="Подробное описание (необязательно)"
          placeholder="Для страницы услуги: что входит, как проходит, гарантии — до 2000 символов"
          rows={5}
          maxLength={2000}
          value={form.details}
          onChange={(event) => setForm((prev) => ({ ...prev, details: event.target.value }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="service-price-from"
            label="Цена от, BYN"
            inputMode="decimal"
            value={form.priceFrom}
            onChange={(event) => setForm((prev) => ({ ...prev, priceFrom: event.target.value }))}
          />
          <Input
            id="service-price-to"
            label="Цена до (необязательно)"
            inputMode="decimal"
            value={form.priceTo}
            onChange={(event) => setForm((prev) => ({ ...prev, priceTo: event.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Единица"
            value={form.unit}
            onChange={(value) => setForm((prev) => ({ ...prev, unit: value }))}
            options={[
              { value: '', label: '— нет —' },
              ...SERVICE_UNITS.map((unit) => ({
                value: unit,
                label: SERVICE_UNIT_LABELS[unit],
              })),
            ]}
          />
          <Select
            label="Группа"
            value={form.groupId}
            onChange={(value) => setForm((prev) => ({ ...prev, groupId: value }))}
            options={groups.map((group) => ({ value: group.id, label: group.title }))}
          />
        </div>
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
