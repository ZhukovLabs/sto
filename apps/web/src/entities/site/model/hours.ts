import type { SiteHours, SiteHoursData } from './types';

const DAY_SHORT: Record<string, string> = {
  mon: 'Пн',
  tue: 'Вт',
  wed: 'Ср',
  thu: 'Чт',
  fri: 'Пт',
  sat: 'Сб',
  sun: 'Вс',
};

const DAY_ORDER: readonly string[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** «Пн–Сб», «Ежедневно», «Сб, Вс» — непрерывные отрезки через тире. */
function daysLabel(days: readonly string[]): string {
  if (days.length === 7) {
    return 'Ежедневно';
  }
  const runs: string[][] = [];
  for (const day of days) {
    const last = runs[runs.length - 1];
    if (
      last !== undefined &&
      DAY_ORDER.indexOf(last[last.length - 1]) === DAY_ORDER.indexOf(day) - 1
    ) {
      last.push(day);
    } else {
      runs.push([day]);
    }
  }
  return runs
    .map((run) =>
      run.length >= 2
        ? `${DAY_SHORT[run[0]]}–${DAY_SHORT[run[run.length - 1]]}`
        : DAY_SHORT[run[0]],
    )
    .join(', ');
}

/** '09:00' → '9:00'. */
function fmtTime(value: string): string {
  return `${Number(value.slice(0, 2))}${value.slice(2)}`;
}

/** '09:00' → '9'; '08:30' → '8:30'. */
function shortTime(value: string): string {
  return value.endsWith(':00') ? fmtTime(value).slice(0, -3) : fmtTime(value);
}

export function formatSiteHours(data: SiteHoursData): SiteHours {
  const days = daysLabel(data.days);
  const wholeHours = data.from.endsWith(':00') && data.to.endsWith(':00');
  const time = wholeHours
    ? `${shortTime(data.from)}–${shortTime(data.to)}`
    : `${fmtTime(data.from)}–${fmtTime(data.to)}`;
  const disabled = DAY_ORDER.filter((day) => !data.days.includes(day));
  return {
    label: `${days} ${fmtTime(data.from)}–${fmtTime(data.to)}`,
    short: `${days} ${time}`,
    note:
      disabled.length === 0
        ? ''
        : `${disabled.map((day) => DAY_SHORT[day]).join(', ')} — по записи`,
  };
}
