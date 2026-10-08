'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Checkbox, Input, Text } from '@sto/ui';
import {
  readProxyError,
  type BookingSettings,
  type ExceptionsMap,
  type ScheduleMap,
} from '@/lib/api';

const WEEKDAYS: { key: keyof ScheduleMap; label: string }[] = [
  { key: 'mon', label: 'Понедельник' },
  { key: 'tue', label: 'Вторник' },
  { key: 'wed', label: 'Среда' },
  { key: 'thu', label: 'Четверг' },
  { key: 'fri', label: 'Пятница' },
  { key: 'sat', label: 'Суббота' },
  { key: 'sun', label: 'Воскресенье' },
];

const STEP_OPTIONS = [30, 60, 90, 120];

interface ExceptionRow {
  date: string;
  enabled: boolean;
  from: string;
  to: string;
}

async function fetchSettings(): Promise<BookingSettings> {
  const response = await fetch('/api/booking-settings');
  if (!response.ok) {
    throw await readProxyError(response, 'Не удалось загрузить настройки');
  }
  return response.json();
}

async function saveSettings(patch: unknown): Promise<void> {
  const response = await fetch('/api/booking-settings', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!response.ok) {
    throw await readProxyError(response, 'Не удалось сохранить настройки');
  }
}

export function BookingSettingsForm() {
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: ['booking-settings'], queryFn: fetchSettings });

  const [schedule, setSchedule] = useState<ScheduleMap | null>(null);
  const [slotStepMinutes, setSlotStepMinutes] = useState(60);
  const [horizonDays, setHorizonDays] = useState(14);
  const [capacity, setCapacity] = useState(1);
  const [exceptions, setExceptions] = useState<ExceptionRow[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings.data === null || settings.data === undefined) {
      return;
    }
    setSchedule(settings.data.schedule);
    setSlotStepMinutes(settings.data.slotStepMinutes);
    setHorizonDays(settings.data.horizonDays);
    setCapacity(settings.data.capacity);
    setExceptions(
      Object.entries(settings.data.exceptions ?? {}).map(([date, window]) => ({
        date,
        enabled: window.enabled,
        from: window.from ?? '09:00',
        to: window.to ?? '18:00',
      })),
    );
  }, [settings.data]);

  const mutation = useMutation({
    mutationFn: (patch: unknown) => saveSettings(patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['booking-settings'] });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    },
  });

  if (settings.isPending) {
    return (
      <Text variant="body" color="muted">
        Загружаем…
      </Text>
    );
  }
  if (settings.isError || schedule === null) {
    return (
      <Text variant="body" className="text-danger">
        {settings.error?.message ?? 'Не удалось загрузить настройки'}
      </Text>
    );
  }

  const updateDay = (key: keyof ScheduleMap, patch: Partial<ScheduleMap[keyof ScheduleMap]>) => {
    setSchedule((current) =>
      current === null ? current : { ...current, [key]: { ...current[key], ...patch } },
    );
  };

  const updateException = (index: number, patch: Partial<ExceptionRow>) => {
    setExceptions((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const submit = () => {
    const exceptionsMap: ExceptionsMap = {};
    for (const row of exceptions) {
      if (row.date === '') {
        continue;
      }
      exceptionsMap[row.date] = row.enabled
        ? { enabled: true, from: row.from, to: row.to }
        : { enabled: false };
    }
    mutation.mutate({
      slotStepMinutes,
      horizonDays,
      capacity,
      schedule,
      exceptions: exceptionsMap,
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-6">
        <Text variant="label" className="font-mono uppercase tracking-[0.12em] text-content-dim">
          Режим работы по дням недели
        </Text>
        <div className="flex flex-col divide-y divide-border">
          {WEEKDAYS.map(({ key, label }) => (
            <div key={key} className="flex flex-wrap items-center gap-4 py-3">
              <label className="inline-flex w-40 items-center gap-2.5">
                <Checkbox
                  checked={schedule[key].enabled}
                  onChange={(checked) => updateDay(key, { enabled: checked })}
                />
                <Text variant="body" color={schedule[key].enabled ? undefined : 'muted'}>
                  {label}
                </Text>
              </label>
              {schedule[key].enabled ? (
                <span className="inline-flex items-center gap-2 font-mono text-caption text-content-muted">
                  <input
                    type="time"
                    value={schedule[key].from}
                    onChange={(event) => updateDay(key, { from: event.target.value })}
                    className="rounded-lg border border-border bg-panel px-3 py-1.5"
                  />
                  —
                  <input
                    type="time"
                    value={schedule[key].to}
                    onChange={(event) => updateDay(key, { to: event.target.value })}
                    className="rounded-lg border border-border bg-panel px-3 py-1.5"
                  />
                </span>
              ) : (
                <Text variant="micro" color="dim" className="font-mono uppercase">
                  Выходной
                </Text>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-6">
        <Text variant="label" className="font-mono uppercase tracking-[0.12em] text-content-dim">
          Параметры записи
        </Text>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2">
            <Text variant="micro" color="dim" className="font-mono uppercase">
              Шаг слота
            </Text>
            <select
              value={slotStepMinutes}
              onChange={(event) => setSlotStepMinutes(Number(event.target.value))}
              className="h-12 rounded-lg border border-border bg-panel px-3 font-mono text-sm text-content"
            >
              {STEP_OPTIONS.map((step) => (
                <option key={step} value={step}>
                  {step} мин
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <Text variant="micro" color="dim" className="font-mono uppercase">
              Горизонт, дней
            </Text>
            <Input
              type="number"
              min={1}
              max={60}
              value={String(horizonDays)}
              onChange={(event) => setHorizonDays(Number(event.target.value))}
            />
          </label>
          <label className="flex flex-col gap-2">
            <Text variant="micro" color="dim" className="font-mono uppercase">
              Одновременных записей
            </Text>
            <Input
              type="number"
              min={1}
              max={10}
              value={String(capacity)}
              onChange={(event) => setCapacity(Number(event.target.value))}
            />
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-6">
        <div className="flex items-center justify-between gap-4">
          <Text variant="label" className="font-mono uppercase tracking-[0.12em] text-content-dim">
            Исключения по датам
          </Text>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setExceptions((rows) => [
                ...rows,
                { date: '', enabled: false, from: '09:00', to: '18:00' },
              ])
            }
          >
            Добавить дату
          </Button>
        </div>
        {exceptions.length === 0 ? (
          <Text variant="body" color="muted">
            Исключений нет — работают обычные дни недели.
          </Text>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {exceptions.map((row, index) => (
              <div key={index} className="flex flex-wrap items-center gap-4 py-3">
                <input
                  type="date"
                  value={row.date}
                  onChange={(event) => updateException(index, { date: event.target.value })}
                  className="h-10 rounded-lg border border-border bg-panel px-3 font-mono text-sm text-content"
                />
                <label className="inline-flex items-center gap-2.5">
                  <Checkbox
                    checked={row.enabled}
                    onChange={(checked) => updateException(index, { enabled: checked })}
                  />
                  <Text variant="body" color={row.enabled ? undefined : 'muted'}>
                    Работаем
                  </Text>
                </label>
                {row.enabled ? (
                  <span className="inline-flex items-center gap-2 font-mono text-caption text-content-muted">
                    <input
                      type="time"
                      value={row.from}
                      onChange={(event) => updateException(index, { from: event.target.value })}
                      className="rounded-lg border border-border bg-panel px-3 py-1.5"
                    />
                    —
                    <input
                      type="time"
                      value={row.to}
                      onChange={(event) => updateException(index, { to: event.target.value })}
                      className="rounded-lg border border-border bg-panel px-3 py-1.5"
                    />
                  </span>
                ) : (
                  <Text variant="micro" color="dim" className="font-mono uppercase">
                    Выходной
                  </Text>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setExceptions((rows) => rows.filter((_, i) => i !== index))}
                >
                  Удалить
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center gap-4">
        <Button variant="primary" size="lg" loading={mutation.isPending} onClick={submit}>
          Сохранить
        </Button>
        {saved ? (
          <Text variant="body" className="text-success">
            Сохранено
          </Text>
        ) : null}
        {mutation.isError ? (
          <Text variant="body" className="text-danger">
            {mutation.error.message}
          </Text>
        ) : null}
      </div>
    </div>
  );
}
