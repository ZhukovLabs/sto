'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { Input, type FieldSize } from '../Input/Input';

export interface TimeInputProps {
  /** Значение в формате HH:MM; во время ввода — частичное («9», «09:3»). */
  value: string;
  onChange: (value: string) => void;
  label?: string;
  size?: FieldSize;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

const MAX_MINUTES = 24 * 60;

function toDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4);
}

function toDisplay(digits: string): string {
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function countDigits(value: string): number {
  let count = 0;
  for (const char of value) {
    if (char >= '0' && char <= '9') {
      count += 1;
    }
  }
  return count;
}

/** Дописывает цифру с ограничениями 24-часового формата. */
function pushDigit(digits: string, digit: string): string {
  if (digits.length >= 4 || !/^[0-9]$/.test(digit)) {
    return digits;
  }
  let next = digits + digit;
  if (next.length === 1 && Number(digit) > 2) {
    next = `0${digit}`;
  }
  if (next.length === 2 && Number(next) > 23) {
    return digits;
  }
  if (next.length === 3 && Number(digit) > 5) {
    next = `${next.slice(0, 2)}0${digit}`;
  }
  return next;
}

function digitsFromTotal(total: number): string {
  const wrapped = ((total % MAX_MINUTES) + MAX_MINUTES) % MAX_MINUTES;
  const hours = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  return `${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}`;
}

/** Позиция каретки (в отображении) после n набранных цифр. */
function caretAfterDigits(n: number): number {
  return n <= 2 ? n : Math.min(5, n + 1);
}

/**
 * Поле времени с маской HH:MM, 24-часовой формат. Каретка остаётся там, где
 * её поставил пользователь: вставка и удаление работают в любой позиции.
 * Ограничения на лету (часы ≤ 23, минуты ≤ 59), «:» ставится сама.
 * Стрелки ↑/↓ — ±1 минута, с Shift — ±15. При потере фокуса значение
 * дополняется («9» → «09:00»). Одинаково во всех браузерах.
 */
export function TimeInput({
  value,
  onChange,
  label,
  size = 'sm',
  disabled,
  className,
  'aria-label': ariaLabel,
}: TimeInputProps) {
  const [digits, setDigits] = useState(() => toDigits(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);

  useEffect(() => {
    setDigits(toDigits(value));
  }, [value]);

  // После контролируемой перерисовки возвращаем каретку на место.
  useLayoutEffect(() => {
    if (caretRef.current !== null && inputRef.current !== null) {
      inputRef.current.setSelectionRange(caretRef.current, caretRef.current);
      caretRef.current = null;
    }
  });

  const emit = (next: string) => {
    setDigits(next);
    onChange(toDisplay(next));
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const el = event.currentTarget;
    const raw = el.value;
    if (raw === '') {
      caretRef.current = 0;
      emit('');
      return;
    }
    const prevDisplay = toDisplay(digits);
    let prefix = 0;
    while (
      prefix < Math.min(prevDisplay.length, raw.length) &&
      prevDisplay[prefix] === raw[prefix]
    ) {
      prefix += 1;
    }
    let suffix = 0;
    while (
      suffix < Math.min(prevDisplay.length, raw.length) - prefix &&
      prevDisplay[prevDisplay.length - 1 - suffix] === raw[raw.length - 1 - suffix]
    ) {
      suffix += 1;
    }
    const inserted = raw.slice(prefix, raw.length - suffix);
    const removedLength = prevDisplay.length - suffix - prefix;
    const prefixDigits = countDigits(prevDisplay.slice(0, prefix));
    let head = digits.slice(0, prefixDigits);
    for (const digit of inserted) {
      head = pushDigit(head, digit);
    }
    const tail = digits.slice(
      prefixDigits + countDigits(prevDisplay.slice(prefix, prefix + removedLength)),
    );
    const stream = head + tail;
    let validated = '';
    for (const digit of stream) {
      validated = pushDigit(validated, digit);
    }
    caretRef.current = caretAfterDigits(head.length);
    emit(validated);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const step = (event.key === 'ArrowUp' ? 1 : -1) * (event.shiftKey ? 15 : 1);
      const padded = digits.padEnd(4, '0');
      const total = Number(padded.slice(0, 2)) * 60 + Number(padded.slice(2));
      emit(digitsFromTotal(total + step));
    }
  };

  const onBlur = () => {
    if (digits !== '' && digits.length < 4) {
      emit(digits.padEnd(4, '0'));
    }
  };

  return (
    <span className="inline-flex w-20 flex-col">
      <Input
        ref={inputRef}
        size={size}
        inputMode="numeric"
        autoComplete="off"
        placeholder="--:--"
        disabled={disabled}
        aria-label={ariaLabel}
        label={label}
        className={`text-center font-mono ${className ?? ''}`}
        value={toDisplay(digits)}
        onChange={onInputChange}
        onKeyDown={onKeyDown}
        onFocus={(event) => event.currentTarget.select()}
        onBlur={onBlur}
      />
    </span>
  );
}
