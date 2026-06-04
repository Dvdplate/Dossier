import { DateTime } from "luxon";

/** Single timezone constant — never hardcode +2 */
export const APP_TZ = "Africa/Johannesburg";

export interface LocalParts {
  year: number;
  month: number; // 1–12
  day: number; // 1–31
  hour: number;
  minute: number;
  weekday0Sun: number; // 0=Sun..6=Sat
}

/** Convert UTC epoch ms → local date/time parts in APP_TZ */
export function toLocalParts(ms: number): LocalParts {
  const dt = DateTime.fromMillis(ms, { zone: APP_TZ });
  return {
    year: dt.year,
    month: dt.month,
    day: dt.day,
    hour: dt.hour,
    minute: dt.minute,
    // Luxon: 1=Mon..7=Sun → remap to 0=Sun..6=Sat
    weekday0Sun: dt.weekday === 7 ? 0 : dt.weekday,
  };
}

/** Convert local parts back to UTC epoch ms */
export function localToInstant(parts: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
}): number {
  const dt = DateTime.fromObject(
    {
      year: parts.year,
      month: parts.month,
      day: parts.day,
      hour: parts.hour ?? 0,
      minute: parts.minute ?? 0,
      second: 0,
      millisecond: 0,
    },
    { zone: APP_TZ },
  );
  return dt.toMillis();
}

/** epoch ms → "YYYY-MM-DD" in local timezone */
export function localISODate(ms: number): string {
  const dt = DateTime.fromMillis(ms, { zone: APP_TZ });
  return dt.toFormat("yyyy-MM-dd");
}

/** Parse "HH:MM" → { hour, minute } */
export function parseTimeOfDay(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(":").map(Number);
  return { hour: h, minute: m };
}

/** Days in a given month (handles leap years) */
export function daysInMonth(year: number, month: number): number {
  return DateTime.fromObject({ year, month }, { zone: APP_TZ }).daysInMonth!;
}
