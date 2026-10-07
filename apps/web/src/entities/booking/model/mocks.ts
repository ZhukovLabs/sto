import type { BookingSettings } from './types';

export const BOOKING_SETTINGS: BookingSettings = {
  slotStepMinutes: 60,
  horizonDays: 14,
  workDays: [1, 2, 3, 4, 5, 6],
  hours: { from: 9, to: 20 },
  overrides: {
    '2026-11-03': { disabled: true, note: 'перенос выходного' },
    '2026-11-10': { hours: { from: 10, to: 16 }, note: 'сокращённый день' },
  },
};
