import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SCHEDULE,
  isValidDate,
  isValidTime,
  slotStarts,
  weekdayKeyFor,
  windowForDate,
} from './booking.settings';

describe('isValidDate', () => {
  it('принимает корректные даты', () => {
    expect(isValidDate('2026-10-08')).toBe(true);
    expect(isValidDate('2026-02-28')).toBe(true);
  });

  it('отвергает несуществующие даты и мусор', () => {
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('08.10.2026')).toBe(false);
    expect(isValidDate('')).toBe(false);
  });
});

describe('isValidTime', () => {
  it('принимает HH:MM и отвергает выход за границы', () => {
    expect(isValidTime('00:00')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('9:00')).toBe(false);
  });
});

describe('weekdayKeyFor', () => {
  it('возвращает правильный день недели даты', () => {
    // 2026-10-08 — четверг, 2026-10-11 — воскресенье
    expect(weekdayKeyFor('2026-10-08')).toBe('thu');
    expect(weekdayKeyFor('2026-10-11')).toBe('sun');
  });
});

describe('windowForDate', () => {
  it('исключение по дате перекрывает недельное расписание', () => {
    const settings = {
      schedule: DEFAULT_SCHEDULE,
      exceptions: {
        '2026-10-12': { enabled: false },
        '2026-10-13': { enabled: true, from: '10:00', to: '15:00' },
      },
    };
    expect(windowForDate('2026-10-12', settings)).toEqual({
      enabled: false,
      from: '09:00',
      to: '20:00',
    });
    expect(windowForDate('2026-10-13', settings)).toEqual({
      enabled: true,
      from: '10:00',
      to: '15:00',
    });
    // воскресенье без исключения — выходной из расписания
    expect(windowForDate('2026-10-11', settings).enabled).toBe(false);
  });
});

describe('slotStarts', () => {
  it('шаг 60 на окне 9–20 даёт слоты 9..19', () => {
    const starts = slotStarts({ from: '09:00', to: '20:00' }, 60);
    expect(starts).toHaveLength(11);
    expect(starts[0]).toBe(9 * 60);
    expect(starts[starts.length - 1]).toBe(19 * 60);
  });

  it('шаг не влезает в конец — последний слот раньше', () => {
    // 9–20 шагом 120: 9,11,13,15,17,19? 19+120>20 → нет; 17+120=19 ✓
    const starts = slotStarts({ from: '09:00', to: '20:00' }, 120);
    expect(starts).toEqual([9 * 60, 11 * 60, 13 * 60, 15 * 60, 17 * 60]);
  });

  it('окно короче шага — пусто', () => {
    expect(slotStarts({ from: '09:00', to: '09:30' }, 60)).toEqual([]);
  });
});
