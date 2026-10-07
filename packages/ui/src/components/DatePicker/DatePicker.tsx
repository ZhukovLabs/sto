'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const MONTHS_NOM = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];
const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

const fromIso = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/** Сетка месяца: Пн-первый, недо-дни предыдущего месяца = null. */
function buildMonth(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= total; day += 1) cells.push(new Date(year, month, day));
  return cells;
}

export interface DatePickerProps {
  value: string;
  onChange: (iso: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  helper?: string;
  min?: string;
  max?: string;
  isDateDisabled?: (iso: string) => boolean;
  format?: (iso: string) => string;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Выберите дату',
  error,
  helper,
  min,
  max,
  isDateDisabled,
  format,
}: DatePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const base = value ? fromIso(value) : new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const id = useId();

  const todayIso = toIso(new Date());
  const minDate = min ? fromIso(min) : null;
  const atMinMonth = minDate
    ? view.year === minDate.getFullYear() && view.month === minDate.getMonth()
    : false;
  const formatLabel =
    format ??
    ((iso: string) => {
      const date = fromIso(iso);
      return `${date.getDate()} ${
        [
          'января',
          'февраля',
          'марта',
          'апреля',
          'мая',
          'июня',
          'июля',
          'августа',
          'сентября',
          'октября',
          'ноября',
          'декабря',
        ][date.getMonth()]
      }`;
    });

  const cells = useMemo(() => buildMonth(view.year, view.month), [view]);

  const dayDisabled = (date: Date) => {
    const iso = toIso(date);
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return isDateDisabled?.(iso) ?? false;
  };

  useEffect(() => {
    if (!open) return;
    let frame = 0;
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const height = gridRef.current?.offsetHeight ?? 352;
      const width = gridRef.current?.offsetWidth ?? 304;
      const margin = 8;
      const fitsBelow = rect.bottom + margin + height <= window.innerHeight - margin;
      const fitsAbove = rect.top - margin - height >= margin;
      const top = fitsBelow || !fitsAbove ? rect.bottom + margin : rect.top - margin - height;
      setPosition({
        top,
        left: Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin)),
      });
    };
    frame = requestAnimationFrame(update);
    const onPointerDown = (event: PointerEvent) => {
      if (
        !rootRef.current?.contains(event.target as Node) &&
        !gridRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, view]);

  useEffect(() => {
    if (open) {
      const base = value ? fromIso(value) : new Date();
      setView({ year: base.getFullYear(), month: base.getMonth() });
    }
  }, [open, value]);

  useEffect(() => {
    if (open) {
      const focusable = gridRef.current?.querySelector<HTMLElement>('[data-focusable="true"]');
      focusable?.focus();
    }
  }, [open, view]);

  const shiftMonth = (delta: number) => {
    setView((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const moveFocus = (days: number) => {
    const buttons = Array.from(
      gridRef.current?.querySelectorAll<HTMLButtonElement>('button[data-iso]') ?? [],
    );
    if (!buttons.length) return;
    const currentIndex = buttons.findIndex((button) => button === document.activeElement);
    const currentIso =
      currentIndex >= 0
        ? buttons[currentIndex].dataset.iso
        : value || buttons.find((b) => !b.disabled)?.dataset.iso;
    if (!currentIso) return;
    const target = fromIso(currentIso);
    target.setDate(target.getDate() + days);
    const targetIso = toIso(target);
    const next = buttons.find((button) => button.dataset.iso === targetIso);
    if (next && !next.disabled) next.focus();
  };

  const onGridKeyDown = (event: React.KeyboardEvent) => {
    const map: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    if (event.key in map) {
      event.preventDefault();
      moveFocus(map[event.key]);
    } else if (event.key === 'PageUp') {
      event.preventDefault();
      shiftMonth(-1);
    } else if (event.key === 'PageDown') {
      event.preventDefault();
      shiftMonth(1);
    }
  };

  const popover = open
    ? createPortal(
        <div
          ref={gridRef}
          role="dialog"
          aria-label="Выбор даты"
          onKeyDown={onGridKeyDown}
          style={{
            top: position?.top ?? -9999,
            left: position?.left ?? 0,
            visibility: position ? 'visible' : 'hidden',
          }}
          className="fixed z-(--z-modal) w-[304px] animate-fade-in rounded-lg border-[1.5px] border-border-strong bg-panel p-3 shadow-[0_32px_80px_-16px_rgb(0_0_0/0.75)]"
        >
          <div className="mb-2 grid grid-cols-[2rem_1fr_2rem] items-center">
            <button
              type="button"
              aria-label="Предыдущий месяц"
              onClick={() => shiftMonth(-1)}
              disabled={atMinMonth}
              className="flex size-8 items-center justify-center rounded-md text-content-muted transition-colors hover:bg-panel hover:text-content disabled:cursor-not-allowed disabled:opacity-35 motion-reduce:transition-none"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                  d="M8 1L3 6l5 5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span className="font-mono text-caption uppercase tracking-[0.1em] text-content">
              {MONTHS_NOM[view.month]} {view.year}
            </span>
            <button
              type="button"
              aria-label="Следующий месяц"
              onClick={() => shiftMonth(1)}
              className="flex size-8 items-center justify-center rounded-md text-content-muted transition-colors hover:bg-panel hover:text-content motion-reduce:transition-none"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                  d="M4 1l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7">
            {WEEKDAYS.map((weekday) => (
              <span
                key={weekday}
                className="text-center font-mono text-micro uppercase tracking-[0.1em] text-content-dim"
              >
                {weekday}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, index) => {
              if (!date) return <span key={`empty-${index}`} />;
              const iso = toIso(date);
              const disabled = dayDisabled(date);
              const selected = iso === value;
              const isToday = iso === todayIso;
              return (
                <button
                  key={iso}
                  type="button"
                  data-iso={iso}
                  data-focusable={!disabled}
                  role="gridcell"
                  aria-selected={selected}
                  aria-disabled={disabled}
                  tabIndex={-1}
                  disabled={disabled}
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={`flex size-9 items-center justify-center rounded-md text-body transition-colors motion-reduce:transition-none ${
                    selected
                      ? 'bg-primary font-semibold text-primary-ink'
                      : disabled
                        ? 'cursor-not-allowed text-content-dim opacity-45'
                        : isToday
                          ? 'border-[1.5px] border-primary text-primary hover:bg-panel'
                          : 'text-content hover:bg-panel'
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div ref={rootRef} className="relative flex w-full flex-col gap-2">
      {label ? (
        <label htmlFor={id} className="text-label font-semibold uppercase text-content">
          {label}
        </label>
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-12 w-full items-center justify-between rounded-lg border bg-panel px-4 text-body-lg transition-colors motion-reduce:transition-none ${
          error
            ? 'border-danger hover:border-danger'
            : 'border-border hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-bg'
        }`}
      >
        <span className={value ? 'text-content' : 'text-content-dim'}>
          {value ? formatLabel(value) : placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className="text-content-dim"
        >
          <rect
            x="1.5"
            y="3"
            width="13"
            height="11.5"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M5 1.5V4M11 1.5V4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {helper ? <span className="text-caption text-content-dim">{helper}</span> : null}
      {error ? <span className="text-caption text-danger">{error}</span> : null}
      {popover}
    </div>
  );
}
