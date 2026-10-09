import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SCHEDULE,
  blockedMinutesFor,
  isValidDate,
  isValidTime,
  pruneExceptions,
  slotStarts,
  todayIsoMinsk,
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

describe('todayIsoMinsk', () => {
  it('полночь UTC — та же дата (03:00 Минска)', () => {
    expect(todayIsoMinsk(new Date('2026-10-08T00:00:00Z'))).toBe('2026-10-08');
  });

  it('21:00 UTC — уже следующий день Минска', () => {
    expect(todayIsoMinsk(new Date('2026-10-08T21:00:00Z'))).toBe('2026-10-09');
  });

  it('20:59 UTC — ещё сегодняшний день', () => {
    expect(todayIsoMinsk(new Date('2026-10-08T20:59:59Z'))).toBe('2026-10-08');
  });
});

describe('pruneExceptions', () => {
  it('удаляет прошедшие даты, оставляет сегодняшнюю и будущие', () => {
    const exceptions = {
      '2026-10-07': { enabled: false },
      '2026-10-08': { enabled: true, from: '09:00', to: '20:00' },
      '2026-10-09': { enabled: false },
    };
    expect(pruneExceptions(exceptions, '2026-10-08')).toEqual({
      '2026-10-08': { enabled: true, from: '09:00', to: '20:00' },
      '2026-10-09': { enabled: false },
    });
  });

  it('пустая карта остаётся пустой', () => {
    expect(pruneExceptions({}, '2026-10-08')).toEqual({});
  });

  it('невалидные ключи не трогает (их чистит валидация на входе)', () => {
    const exceptions = { garbage: { enabled: false } };
    expect(pruneExceptions(exceptions, '2026-10-08')).toEqual(exceptions);
  });
});

describe('blockedMinutesFor', () => {
  it('возвращает минуты заблокированных слотов включённого исключения', () => {
    const settings = {
      exceptions: {
        '2026-10-12': {
          enabled: true,
          from: '09:00',
          to: '20:00',
          blockedTimes: ['10:00', '14:00'],
        },
      },
    };
    const blocked = blockedMinutesFor('2026-10-12', settings);
    expect(blocked.size).toBe(2);
    expect(blocked.has(10 * 60)).toBe(true);
    expect(blocked.has(14 * 60)).toBe(true);
    expect(blocked.has(11 * 60)).toBe(false);
  });

  it('пусто для даты без исключения, без blockedTimes и для выключенного дня', () => {
    expect(blockedMinutesFor('2026-10-12', { exceptions: {} }).size).toBe(0);
    expect(
      blockedMinutesFor('2026-10-12', {
        exceptions: { '2026-10-12': { enabled: true, from: '09:00', to: '20:00' } },
      }).size,
    ).toBe(0);
    expect(
      blockedMinutesFor('2026-10-12', {
        exceptions: { '2026-10-12': { enabled: false, blockedTimes: ['10:00'] } },
      }).size,
    ).toBe(0);
  });
});
