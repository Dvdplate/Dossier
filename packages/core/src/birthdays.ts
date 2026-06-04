import { toLocalParts, daysInMonth } from "./time.js";
import { MONTH_NAMES } from "./format.js";
import type { Birthday, UpcomingBirthday, BirthdayMonthGroup } from "./types.js";

/**
 * Find all birthdays in the next `days` days (inclusive of today).
 * Handles Dec→Jan wrap and Feb 29 → Feb 28 in common years.
 */
export function birthdaysUpcoming(
  list: Birthday[],
  nowMs: number,
  days = 7,
): UpcomingBirthday[] {
  const now = toLocalParts(nowMs);
  const results: UpcomingBirthday[] = [];

  for (const b of list) {
    let nextMonth = b.birthMonth;
    let nextDay = b.birthDay;
    let nextYear = now.year;

    // Clamp Feb 29 → Feb 28 in common years
    const dim = daysInMonth(nextYear, nextMonth);
    if (nextDay > dim) nextDay = dim;

    // Build this year's occurrence
    let occMonth = nextMonth;
    let occDay = nextDay;
    let occYear = nextYear;

    // If the birthday has already passed this year, roll to next year
    if (
      occMonth < now.month ||
      (occMonth === now.month && occDay < now.day)
    ) {
      occYear = now.year + 1;
      // Re-clamp for next year (leap year may differ)
      const dimNext = daysInMonth(occYear, occMonth);
      occDay = Math.min(b.birthDay, dimNext);
    }

    // Calculate days until
    const todayEpoch = dayEpoch(now.year, now.month, now.day);
    const occEpoch = dayEpoch(occYear, occMonth, occDay);
    const daysUntil = occEpoch - todayEpoch;

    if (daysUntil < 0 || daysUntil > days) continue;

    const turning =
      b.birthYear != null ? occYear - b.birthYear : null;

    results.push({
      id: b.id,
      name: b.name,
      birthMonth: b.birthMonth,
      birthDay: b.birthDay,
      birthYear: b.birthYear,
      note: b.note,
      daysUntil,
      label: daysUntil === 0 ? "today" : `in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`,
      turning,
    });
  }

  // Sort by daysUntil, then name
  results.sort((a, b) => a.daysUntil - b.daysUntil || a.name.localeCompare(b.name));
  return results;
}

/** Simple day count from a reference point for difference calculation */
function dayEpoch(year: number, month: number, day: number): number {
  // Use a simplified calculation — good enough for ≤366 day spans
  // Days from year 0 (approximate, but consistent within small ranges)
  const y = month <= 2 ? year - 1 : year;
  const m = month <= 2 ? month + 12 : month;
  return (
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) +
    Math.floor((153 * (m - 3) + 2) / 5) +
    day
  );
}

/**
 * Group birthdays by calendar month (Jan→Dec), day-sorted.
 * Non-empty months only. Shows current age when birthYear is set.
 */
export function groupBirthdaysByMonth(
  list: Birthday[],
  nowMs?: number,
): BirthdayMonthGroup[] {
  const now = nowMs != null ? toLocalParts(nowMs) : null;
  const byMonth = new Map<number, BirthdayMonthGroup>();

  for (const b of list) {
    if (!byMonth.has(b.birthMonth)) {
      byMonth.set(b.birthMonth, {
        month: b.birthMonth,
        monthName: MONTH_NAMES[b.birthMonth - 1],
        contacts: [],
      });
    }

    let currentAge: number | null = null;
    if (b.birthYear != null && now) {
      currentAge = now.year - b.birthYear;
      // If birthday hasn't happened yet this year, subtract 1
      if (
        now.month < b.birthMonth ||
        (now.month === b.birthMonth && now.day < b.birthDay)
      ) {
        currentAge--;
      }
    }

    byMonth.get(b.birthMonth)!.contacts.push({ ...b, currentAge });
  }

  // Sort contacts within each month by day
  for (const group of byMonth.values()) {
    group.contacts.sort((a, b) => a.birthDay - b.birthDay);
  }

  // Return months in Jan→Dec order, non-empty only
  return Array.from({ length: 12 }, (_, i) => byMonth.get(i + 1))
    .filter((g): g is BirthdayMonthGroup => g != null);
}
