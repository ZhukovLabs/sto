'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Button, Checkbox, Input, Select, Text, TimeInput } from '@sto/ui';
import {
  readProxyError,
  type BookingSettings,
  type DayOverview,
  type ExceptionsMap,
  type ScheduleMap,
} from '@/lib/api';

const WEEKDAYS: { key: keyof ScheduleMap; label: string; short: string }[] = [
  { key: 'mon', label: 'Понедельник', short: 'ПН' },
  { key: 'tue', label: 'Вторник', short: 'ВТ' },
  { key: 'wed', label: 'Среда', short: 'СР' },
  { key: 'thu', label: 'Четверг', short: 'ЧТ' },
  { key: 'fri', label: 'Пятница', short: 'ПТ' },
  { key: 'sat', label: 'Суббота', short: 'СБ' },
  { key: 'sun', label: 'Воскресенье', short: 'ВС' },
];

const STEP_OPTIONS = [30, 60, 90, 120].map((step) => ({
  value: String(step),
  label: `${step} мин`,
}));

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

const WEEKDAY_SHORT = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const dateInputClass =
  'h-10 rounded-lg border border-border bg-panel px-3 font-mono text-caption text-content focus:border-primary focus:outline-none';

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

interface FormState {
  schedule: ScheduleMap;
  slotStepMinutes: number;
  horizonDays: number;
  capacity: number;
  onlineDisabled: boolean;
  exceptions: ExceptionRow[];
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

function weekdayShort(date: string): string {
  return WEEKDAY_SHORT[new Date(`${date}T00:00:00Z`).getUTCDay()] ?? '';
}

function scheduleWindowFor(date: string, schedule: ScheduleMap): { from: string; to: string } {
  const key = WEEKDAY_KEYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
  const day = schedule[key];
  if (day === undefined) {
    return { from: '09:00', to: '20:00' };
  }
  return { from: day.from, to: day.to };
}

function stateFromSettings(data: BookingSettings): FormState {
  return {
    schedule: data.schedule,
    slotStepMinutes: data.slotStepMinutes,
    horizonDays: data.horizonDays,
    capacity: data.capacity,
    onlineDisabled: data.onlineDisabled,
    exceptions: Object.entries(data.exceptions ?? {})
      .map(([date, window]) => ({
        rowId: crypto.randomUUID(),
        date,
        enabled: window.enabled,
        from: window.from ?? '09:00',
        to: window.to ?? '20:00',
        blockedTimes: [...(window.blockedTimes ?? [])],
        windowTouched: true,
      }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function serializeState(state: FormState): string {
  const exceptions = state.exceptions
    .filter((row) => row.date !== '')
    .map((row) => ({
      date: row.date,
      enabled: row.enabled,
      from: row.enabled ? row.from : null,
      to: row.enabled ? row.to : null,
      blockedTimes: row.enabled ? [...row.blockedTimes].sort() : null,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return JSON.stringify({
    schedule: state.schedule,
    slotStepMinutes: state.slotStepMinutes,
    horizonDays: state.horizonDays,
    capacity: state.capacity,
    onlineDisabled: state.onlineDisabled,
    exceptions,
  });
}

function DayOffBadge() {
  return (
    <span className="inline-flex h-10 items-center rounded-full border border-border px-3 font-mono text-micro uppercase tracking-[0.1em] text-content-dim">
      Выходной
    </span>
  );
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
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-panel-2/40 p-4">
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
        <TimeInput
          value={rangeFrom}
          aria-label="Период блокировки, начало"
          onChange={setRangeFrom}
        />
        <span className="font-mono text-caption text-content-muted">—</span>
        <TimeInput value={rangeTo} aria-label="Период блокировки, конец" onChange={setRangeTo} />
        <Button variant="outline" size="sm" onClick={applyBlockRange}>
          Заблокировать период
        </Button>
        {rangeError ? (
          <Text variant="caption" className="text-danger">
            {rangeError}
          </Text>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-micro uppercase tracking-[0.06em] text-content-dim">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-sm bg-panel ring-1 ring-border"
          />
          свободен
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-sm bg-danger-soft ring-1 ring-danger"
          />
          заблокирован
        </span>
        <span>● — есть запись</span>
        <span>период режет слоты пополам</span>
      </div>
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
  const [onlineDisabled, setOnlineDisabled] = useState(false);
  const [exceptions, setExceptions] = useState<ExceptionRow[]>([]);
  const didInit = useRef(false);
  const savedRef = useRef<string | null>(null);

  const snapshot = useMemo(
    () =>
      schedule === null
        ? null
        : serializeState({ schedule, slotStepMinutes, horizonDays, capacity, onlineDisabled, exceptions }),
    [schedule, slotStepMinutes, horizonDays, capacity, onlineDisabled, exceptions],
  );

  useEffect(() => {
    if (didInit.current || settings.data === null || settings.data === undefined) {
      return;
    }
    didInit.current = true;
    const state = stateFromSettings(settings.data);
    setSchedule(state.schedule);
    setSlotStepMinutes(state.slotStepMinutes);
    setHorizonDays(state.horizonDays);
    setCapacity(state.capacity);
    setOnlineDisabled(state.onlineDisabled);
    setExceptions(state.exceptions);
    savedRef.current = serializeState(state);
  }, [settings.data]);

  const mutation = useMutation({
    mutationFn: (patch: unknown) => saveSettings(patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['day-overview'] });
    },
  });

  const duplicateDates = useMemo(() => {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const row of exceptions) {
      if (row.date === '') {
        continue;
      }
      if (seen.has(row.date)) {
        dupes.add(row.date);
      }
      seen.add(row.date);
    }
    return dupes;
  }, [exceptions]);

  function timesComplete(): boolean {
    if (schedule === null) {
      return false;
    }
    for (const day of Object.values(schedule)) {
      if (day.enabled && (!TIME_PATTERN.test(day.from) || !TIME_PATTERN.test(day.to))) {
        return false;
      }
    }
    return exceptions.every(
      (row) =>
        !row.enabled ||
        (TIME_PATTERN.test(row.from) && TIME_PATTERN.test(row.to) && row.from < row.to),
    );
  }

  function buildPatch(): unknown {
    const exceptionsMap: ExceptionsMap = {};
    for (const row of exceptions) {
      if (row.date === '') {
        continue;
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
    return {
      slotStepMinutes,
      horizonDays,
      capacity,
      onlineDisabled,
      schedule,
      exceptions: exceptionsMap,
    };
  }

  // Автосохранение: применяем изменения как в остальных разделах — сразу,
  // с короткой паузой на завершение ввода времени.
  useEffect(() => {
    if (snapshot === null || snapshot === savedRef.current) {
      return;
    }
    if (duplicateDates.size > 0 || !timesComplete()) {
      return;
    }
    const timer = window.setTimeout(() => {
      mutation.mutate(buildPatch(), {
        onSuccess: () => {
          savedRef.current = snapshot;
        },
      });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [snapshot, duplicateDates]);

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

  const addException = () => {
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
    ]);
  };

  return (
    <div className="flex flex-col gap-8">
      {mutation.isError ? (
        <Text variant="body" className="text-danger">
          Не удалось сохранить: {mutation.error.message}
        </Text>
      ) : null}
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex min-w-0 flex-col gap-1">
            <Text variant="label" className="font-mono uppercase tracking-[0.12em] text-content-dim">
              Онлайн-запись на сайте
            </Text>
            <Text variant="caption" color="dim">
              Закрытая запись заменяет диалог кнопки «Записаться» на «позвоните нам»
            </Text>
          </div>
          <Checkbox
            checked={!onlineDisabled}
            onChange={(checked) => setOnlineDisabled(!checked)}
            label="Принимаем"
          />
        </div>
        <Text variant="label" className="font-mono uppercase tracking-[0.12em] text-content-dim">
          Режим работы по дням недели
        </Text>
        <div className="grid gap-x-10 sm:grid-cols-2">
          {[WEEKDAYS.slice(0, 3), WEEKDAYS.slice(3)].map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col">
              {column.map(({ key, label }, indexInColumn) => (
                <div
                  key={key}
                  className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-border py-3 ${
                    indexInColumn < column.length - 1 ? 'border-b' : ''
                  }`}
                >
                  <div className="w-44 shrink-0">
                    <Checkbox
                      checked={schedule[key].enabled}
                      onChange={(checked) => updateDay(key, { enabled: checked })}
                      label={
                        <Text variant="body" color={schedule[key].enabled ? undefined : 'muted'}>
                          {label}
                        </Text>
                      }
                    />
                  </div>
                  {schedule[key].enabled ? (
                    <span className="inline-flex shrink-0 items-center gap-2 font-mono text-caption text-content-muted">
                      <TimeInput
                        value={schedule[key].from}
                        aria-label={`${label}, начало`}
                        onChange={(from) => updateDay(key, { from })}
                      />
                      <span aria-hidden className="leading-none">
                        —
                      </span>
                      <TimeInput
                        value={schedule[key].to}
                        aria-label={`${label}, конец`}
                        onChange={(to) => updateDay(key, { to })}
                      />
                    </span>
                  ) : (
                    <DayOffBadge />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-6">
        <Text variant="label" className="font-mono uppercase tracking-[0.12em] text-content-dim">
          Параметры записи
        </Text>
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Шаг слота"
            size="md"
            options={STEP_OPTIONS}
            value={String(slotStepMinutes)}
            onChange={(value) => setSlotStepMinutes(Number(value))}
          />
          <Input
            type="number"
            label="Горизонт, дней"
            min={1}
            max={60}
            value={String(horizonDays)}
            onChange={(event) => setHorizonDays(Number(event.target.value))}
          />
          <Input
            type="number"
            label="Одновременных записей"
            min={1}
            max={10}
            value={String(capacity)}
            onChange={(event) => setCapacity(Number(event.target.value))}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Text variant="label" className="font-mono uppercase tracking-[0.12em] text-content-dim">
            Исключения по датам
          </Text>
          <Button variant="outline" size="sm" onClick={addException}>
            Добавить дату
          </Button>
        </div>
        <Text variant="micro" color="dim">
          Дата перекрывает недельное расписание: закрыть день целиком, изменить часы или
          заблокировать отдельные слоты. Слоты появляются у включённой даты.
        </Text>
        {exceptions.length === 0 ? (
          <Text variant="body" color="muted">
            Исключений нет — работают обычные дни недели.
          </Text>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {exceptions.map((row, index) => {
              const isDuplicate = duplicateDates.has(row.date);
              return (
                <div key={row.rowId} className="flex flex-col gap-3 py-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="relative inline-flex items-center gap-2">
                      <input
                        type="date"
                        value={row.date}
                        aria-label="Дата исключения"
                        onChange={(event) => changeExceptionDate(index, event.target.value)}
                        className={`${dateInputClass} ${isDuplicate ? 'border-danger' : ''}`}
                      />
                      {isValidDate(row.date) ? (
                        <span className="rounded-full border border-border px-2.5 py-1 font-mono text-micro uppercase tracking-[0.1em] text-content-dim">
                          {weekdayShort(row.date)}
                        </span>
                      ) : null}
                    </span>
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
                        <TimeInput
                          value={row.from}
                          aria-label="Часы работы, начало"
                          onChange={(from) => updateException(index, { from, windowTouched: true })}
                        />
                        <span aria-hidden>—</span>
                        <TimeInput
                          value={row.to}
                          aria-label="Часы работы, конец"
                          onChange={(to) => updateException(index, { to, windowTouched: true })}
                        />
                      </span>
                    ) : (
                      <DayOffBadge />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto hover:bg-danger/10 hover:text-danger"
                      aria-label={`Удалить дату${row.date ? ` ${row.date}` : ''}`}
                      onClick={() => setExceptions((rows) => rows.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Удалить
                    </Button>
                  </div>
                  {isDuplicate ? (
                    <Text variant="caption" className="text-danger">
                      Эта дата уже указана в другой строке
                    </Text>
                  ) : null}
                  {row.enabled && isValidDate(row.date) ? (
                    <SlotGrid
                      date={row.date}
                      blockedTimes={row.blockedTimes}
                      onToggle={(time) => toggleBlocked(index, time)}
                      onBlockMany={(times) => blockMany(index, times)}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
