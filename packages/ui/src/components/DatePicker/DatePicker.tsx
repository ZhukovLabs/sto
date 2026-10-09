'use client';

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
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
const MONTHS_GEN = [
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

const toMasked = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

/** Шаблон с фиксированными позициями: сегменты дд/мм/гггг и несглаживаемые точки. */
const TEMPLATE = 'дд.мм.гггг';
const isDigitSlot = (index: number) => index !== 2 && index !== 5;
const isComplete = (masked: string) => /^\d{2}\.\d{2}\.\d{4}$/.test(masked);

/** Цифры в шаблон по порядку слева направо. */
function fillTemplate(digits: string): string {
  const chars = TEMPLATE.split('');
  let di = 0;
  for (let i = 0; i < chars.length && di < digits.length; i += 1) {
    if (isDigitSlot(i)) chars[i] = digits[di++];
  }
  return chars.join('');
}

/** Позиция каретки в маске после n-й цифры. */
function caretAfterDigits(masked: string, digitsPos: number): number {
  let seen = 0;
  let index = 0;
  while (index < masked.length && seen < digitsPos) {
    if (/\d/.test(masked[index])) seen += 1;
    index += 1;
  }
  return index;
}

/** Парсинг готовой строки дд.мм.гггг → ISO; null, если даты не существует. */
function parseMasked(masked: string): string | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(masked);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (
    date.getFullYear() !== Number(yyyy) ||
    date.getMonth() !== Number(mm) - 1 ||
    date.getDate() !== Number(dd)
  ) {
    return null;
  }
  return toIso(date);
}

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
  error?: ReactNode;
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
  placeholder = 'дд.мм.гггг',
  error,
  helper,
  min,
  max,
  isDateDisabled,
  format,
}: DatePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(() => (value ? toMasked(value) : TEMPLATE));
  const [maskError, setMaskError] = useState<string | null>(null);
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
      return `${date.getDate()} ${MONTHS_GEN[date.getMonth()]}`;
    });

  const cells = useMemo(() => buildMonth(view.year, view.month), [view]);

  const dayDisabled = (date: Date) => {
    const iso = toIso(date);
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return isDateDisabled?.(iso) ?? false;
  };

  /** Применяет строку маски к значению. finalize — blur/Enter: неполный ввод тоже ошибка. */
  const commitText = (candidate: string, finalize: boolean): boolean => {
    if (isComplete(candidate)) {
      const iso = parseMasked(candidate);
      if (!iso) {
        setMaskError('Такой даты не существует — пример: 15.09.2026');
        return false;
      }
      if (min && iso < min) {
        setMaskError('Дата раньше доступного диапазона');
        return false;
      }
      if (max && iso > max) {
        setMaskError('Дата позже доступного диапазона');
        return false;
      }
      if (isDateDisabled?.(iso)) {
        setMaskError('На эту дату нет свободных слотов');
        return false;
      }
      setMaskError(null);
      if (iso !== value) onChange(iso);
      return true;
    }
    if (finalize) {
      if (candidate === TEMPLATE || candidate === '') {
        setMaskError(null);
        if (value) onChange('');
        return true;
      }
      setMaskError('Введите дату полностью — например, 15.09.2026');
      return false;
    }
    return false;
  };

  /**
   * Посегментная правка: длины 9/10/11 — локальные правки по фиксированным позициям
   * (цифра занимает слот, Backspace возвращает глиф, точки несглаживаемы),
   * прочие длины — вставка/очистка, цифры раскладываются по шаблону с начала.
   */
  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const el = event.target;
    const raw = el.value;
    let next = text;
    let caret = el.selectionStart ?? raw.length;
    if (raw.length === 10) {
      const chars = TEMPLATE.split('');
      for (let i = 0; i < 10; i += 1) {
        if (isDigitSlot(i) && /\d/.test(raw[i])) chars[i] = raw[i];
      }
      next = chars.join('');
    } else if (raw.length === 9) {
      let p = 0;
      while (p < raw.length && raw[p] === text[p]) p += 1;
      if (p < 10 && isDigitSlot(p)) {
        const chars = text.split('');
        chars[p] = TEMPLATE[p];
        next = chars.join('');
      }
      caret = Math.min(p, 9);
    } else if (raw.length === 11) {
      let p = 0;
      while (p < text.length && text[p] === raw[p]) p += 1;
      let slot = p;
      if (slot < 10 && !isDigitSlot(slot)) slot += 1; // вставка над точкой — пишем в следующий слот
      if (slot < 10 && /\d/.test(raw[p])) {
        const chars = text.split('');
        chars[slot] = raw[p];
        next = chars.join('');
      }
      caret = Math.min(slot + 1, 10);
    } else {
      const digits = (raw.match(/\d/g) ?? []).join('').slice(0, 8);
      next = fillTemplate(digits);
      const filled = (next.match(/\d/g) ?? []).length;
      caret = caretAfterDigits(next, filled);
    }
    el.value = next;
    el.setSelectionRange(caret, caret);
    setText(next);
    if (isComplete(next)) commitText(next, false);
    else setMaskError(null);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (commitText(text, true)) setOpen(false);
    } else if (event.key === 'Escape') {
      setText(value ? toMasked(value) : TEMPLATE);
      setMaskError(null);
    }
  };

  const onInputBlur = () => {
    setFocused(false);
    commitText(text, true);
  };

  useEffect(() => {
    if (!open) return;
    const anchor = triggerRef.current;
    const grid = gridRef.current;
    if (!anchor || !grid) return;
    const auto = autoUpdate(
      anchor,
      grid,
      () => {
        computePosition(anchor, grid, {
          strategy: 'fixed',
          placement: 'bottom-end',
          middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
        }).then(({ x, y }) => {
          setPosition({ top: y, left: x });
        });
      },
      { animationFrame: true },
    );
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
        inputRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      auto();
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey, true);
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

  useEffect(() => {
    setText(value ? toMasked(value) : TEMPLATE);
  }, [value]);

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
                    setMaskError(null);
                    onChange(iso);
                    setOpen(false);
                    inputRef.current?.focus();
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

  const display = maskError && text ? text : focused ? text : value ? formatLabel(value) : '';

  return (
    <div ref={rootRef} className="relative flex w-full flex-col gap-2">
      {label ? (
        <label htmlFor={id} className="text-label font-semibold uppercase text-content">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          aria-invalid={Boolean(maskError ?? error)}
          value={display}
          onChange={onInputChange}
          onKeyDown={onInputKeyDown}
          onFocus={() => {
            setFocused(true);
            requestAnimationFrame(() => inputRef.current?.setSelectionRange(0, 0));
          }}
          onBlur={onInputBlur}
          className={`h-12 w-full rounded-lg border bg-panel pr-11 pl-4 text-body-lg text-content transition-colors motion-reduce:transition-none placeholder:text-content-dim ${
            (maskError ?? error)
              ? 'border-danger hover:border-danger'
              : 'border-border hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-bg'
          }`}
        />
        <button
          ref={triggerRef}
          type="button"
          aria-label="Открыть календарь"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-content-dim transition-colors hover:bg-panel hover:text-content focus:outline-none focus:ring-2 focus:ring-focus motion-reduce:transition-none"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect
              x="1.75"
              y="2.5"
              width="12.5"
              height="11"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="M1.75 6h12.5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M5.25 1v2.5M10.75 1v2.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      {helper ? <span className="text-caption text-content-dim">{helper}</span> : null}
      {(maskError ?? error) ? (
        <span className="text-caption text-danger">{maskError ?? error}</span>
      ) : null}
      {popover}
    </div>
  );
}
