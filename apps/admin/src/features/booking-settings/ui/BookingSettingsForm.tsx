'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Checkbox, Input, Text } from '@sto/ui';
import {
  readProxyError,
  type BookingSettings,
  type DayOverview,
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

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface ExceptionRow {
  rowId: string;
  date: string;
  enabled: boolean;
  from: string;
  to: string;
  blockedTimes: string[];
  /** false — окно from/to ещё не правили вручную, можно подставлять по дате. */
  windowTouched: boolean;
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

async function fetchDayOverview(date: string): Promise<DayOverview> {
  const response = await fetch(`/api/bookings/day-overview?date=${encodeURIComponent(date)}`);
  if (!response.ok) {
    throw await readProxyError(response, 'Не удалось загрузить слоты дня');
  }
  return response.json();
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime());
}

function scheduleWindowFor(date: string, schedule: ScheduleMap): { from: string; to: string } {
  const key = WEEKDAY_KEYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
  const day = schedule[key];
  if (day === undefined) {
    return { from: '09:00', to: '20:00' };
  }
  return { from: day.from, to: day.to };
}

function SlotGrid({
  date,
  blockedTimes,
  onToggle,
  onBlockMany,
}: {
  date: string;
  blockedTimes: string[];
  onToggle: (time: string) => void;
  onBlockMany: (times: string[]) => void;
}) {
  const overview = useQuery({
    queryKey: ['day-overview', date],
    queryFn: () => fetchDayOverview(date),
  });

  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [rangeError, setRangeError] = useState<string | null>(null);

  if (overview.isPending) {
    return (
      <Text variant="micro" color="dim" className="font-mono uppercase">
        Загружаем слоты…
      </Text>
    );
  }
  if (overview.isError) {
    return (
      <Text variant="caption" className="text-danger">
        {overview.error.message}
      </Text>
    );
  }
  if (!overview.data.enabled) {
    return null;
  }

  const blockedSet = new Set(blockedTimes);
  const blockedWithBookings = overview.data.slots.filter(
    (slot) => blockedSet.has(slot.time) && slot.bookingNames.length > 0,
  );

  const slots = overview.data.slots;
  const stepMinutes =
    slots.length > 1 ? timeToMinutes(slots[1].time) - timeToMinutes(slots[0].time) : 60;

  const applyBlockRange = () => {
    if (!TIME_PATTERN.test(rangeFrom) || !TIME_PATTERN.test(rangeTo)) {
      setRangeError('Укажите время в формате HH:MM');
      return;
    }
    const from = timeToMinutes(rangeFrom);
    const to = timeToMinutes(rangeTo);
    if (from >= to) {
      setRangeError('Конец периода должен быть позже начала');
      return;
    }
    const hits = slots
      .filter((slot) => {
        if (slot.past) {
          return false;
        }
        const start = timeToMinutes(slot.time);
        return start < to && start + stepMinutes > from;
      })
      .map((slot) => slot.time);
    if (hits.length === 0) {
      setRangeError('В этом периоде нет доступных слотов');
      return;
    }
    setRangeError(null);
    onBlockMany(hits);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="group" aria-label="Слоты дня">
        {overview.data.slots.map((slot) => {
          const blocked = blockedSet.has(slot.time);
          const booked = slot.bookingNames.length > 0;
          return (
            <button
              key={slot.time}
              type="button"
              aria-pressed={blocked}
              aria-disabled={slot.past}
              title={
                slot.bookingNames.length > 0
                  ? `Запись: ${slot.bookingNames.join(', ')}`
                  : slot.past
                    ? 'Время прошло'
                    : 'Свободен'
              }
              onClick={() => !slot.past && onToggle(slot.time)}
              className={`h-10 rounded-lg border-[1.5px] font-mono text-caption tracking-[0.06em] transition-colors motion-reduce:transition-none ${
                slot.past
                  ? 'cursor-not-allowed border-transparent bg-panel text-content-dim opacity-55'
                  : blocked
                    ? 'border-danger bg-danger-soft font-semibold text-danger'
                    : booked
                      ? 'border-transparent bg-panel text-content hover:border-danger'
                      : 'border-transparent bg-panel text-content hover:border-primary'
              }`}
            >
              {slot.time}
              {booked && !blocked ? ' ●' : ''}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Text variant="micro" color="dim" className="font-mono uppercase">
          Заблокировать период
        </Text>
        <input
          type="time"
          value={rangeFrom}
          aria-label="Период блокировки, начало"
          onChange={(event) => setRangeFrom(event.target.value)}
          className="rounded-lg border border-border bg-panel px-3 py-1.5 font-mono text-caption text-content"
        />
        <span className="font-mono text-caption text-content-muted">—</span>
        <input
          type="time"
          value={rangeTo}
          aria-label="Период блокировки, конец"
          onChange={(event) => setRangeTo(event.target.value)}
          className="rounded-lg border border-border bg-panel px-3 py-1.5 font-mono text-caption text-content"
        />
        <Button variant="outline" size="sm" onClick={applyBlockRange}>
          Заблокировать
        </Button>
        {rangeError ? (
          <Text variant="caption" className="text-danger">
            {rangeError}
          </Text>
        ) : null}
      </div>
      <Text variant="micro" color="dim">
        Клик по времени или период — блокировка для новых записей. ● — есть активная запись (имя в
        подсказке), прошедшее время приглушено. Период захватывает и те слоты, которые он режет
        пополам.
      </Text>
      {blockedWithBookings.length > 0 ? (
        <Text variant="caption" className="text-warning">
          {blockedWithBookings
            .map((slot) => `${slot.time} — ${slot.bookingNames.join(', ')}`)
            .join('; ')}
          : запись останется, но новые на это время не создадутся.
        </Text>
      ) : null}
    </div>
  );
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
  const [formError, setFormError] = useState<string | null>(null);

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
        rowId: crypto.randomUUID(),
        date,
        enabled: window.enabled,
        from: window.from ?? '09:00',
        to: window.to ?? '20:00',
        blockedTimes: [...(window.blockedTimes ?? [])],
        windowTouched: true,
      })),
    );
  }, [settings.data]);

  const mutation = useMutation({
    mutationFn: (patch: unknown) => saveSettings(patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['booking-settings'] });
      void queryClient.invalidateQueries({ queryKey: ['day-overview'] });
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

  const changeExceptionDate = (index: number, date: string) => {
    setExceptions((rows) =>
      rows.map((row, i) => {
        if (i !== index) {
          return row;
        }
        if (date !== '' && isValidDate(date) && !row.windowTouched) {
          const window = scheduleWindowFor(date, schedule);
          return { ...row, date, from: window.from, to: window.to };
        }
        return { ...row, date };
      }),
    );
  };

  const toggleBlocked = (index: number, time: string) => {
    setExceptions((rows) =>
      rows.map((row, i) => {
        if (i !== index) {
          return row;
        }
        const blockedTimes = row.blockedTimes.includes(time)
          ? row.blockedTimes.filter((item) => item !== time)
          : [...row.blockedTimes, time];
        return { ...row, blockedTimes };
      }),
    );
  };

  const blockMany = (index: number, times: string[]) => {
    setExceptions((rows) =>
      rows.map((row, i) => {
        if (i !== index) {
          return row;
        }
        const blockedTimes = [...new Set([...row.blockedTimes, ...times])].sort();
        return { ...row, blockedTimes };
      }),
    );
  };

  const submit = () => {
    const exceptionsMap: ExceptionsMap = {};
    for (const row of exceptions) {
      if (row.date === '') {
        continue;
      }
      if (exceptionsMap[row.date] !== undefined) {
        setFormError(`Дата ${row.date} указана дважды — оставьте одну строку`);
        return;
      }
      if (!row.enabled) {
        exceptionsMap[row.date] = { enabled: false };
        continue;
      }
      const blockedTimes = [...new Set(row.blockedTimes)]
        .filter((time) => time >= row.from && time < row.to)
        .sort();
      exceptionsMap[row.date] = {
        enabled: true,
        from: row.from,
        to: row.to,
        blockedTimes: blockedTimes.length > 0 ? blockedTimes : undefined,
      };
    }
    setFormError(null);
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
                {
                  rowId: crypto.randomUUID(),
                  date: '',
                  enabled: false,
                  from: '09:00',
                  to: '20:00',
                  blockedTimes: [],
                  windowTouched: false,
                },
              ])
            }
          >
            Добавить дату
          </Button>
        </div>
        <Text variant="micro" color="dim">
          Отдельная дата перекрывает недельное расписание: можно закрыть день целиком, изменить часы
          или заблокировать отдельные слоты и периоды. Слоты появляются у включённой даты.
        </Text>
        {exceptions.length === 0 ? (
          <Text variant="body" color="muted">
            Исключений нет — работают обычные дни недели.
          </Text>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {exceptions.map((row, index) => (
              <div key={row.rowId} className="flex flex-col gap-3 py-3">
                <div className="flex flex-wrap items-center gap-4">
                  <input
                    type="date"
                    value={row.date}
                    onChange={(event) => changeExceptionDate(index, event.target.value)}
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
                        onChange={(event) =>
                          updateException(index, { from: event.target.value, windowTouched: true })
                        }
                        className="rounded-lg border border-border bg-panel px-3 py-1.5"
                      />
                      —
                      <input
                        type="time"
                        value={row.to}
                        onChange={(event) =>
                          updateException(index, { to: event.target.value, windowTouched: true })
                        }
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
                {row.enabled && isValidDate(row.date) ? (
                  <SlotGrid
                    date={row.date}
                    blockedTimes={row.blockedTimes}
                    onToggle={(time) => toggleBlocked(index, time)}
                    onBlockMany={(times) => blockMany(index, times)}
                  />
                ) : null}
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
        {formError ? (
          <Text variant="body" className="text-danger">
            {formError}
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
