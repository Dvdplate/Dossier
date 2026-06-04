import {
  toLocalParts,
  localToInstant,
  parseTimeOfDay,
  localISODate,
  daysInMonth,
} from "./time.js";

interface RecurrenceRule {
  id: number;
  type: "daily" | "weekly" | "monthly";
  timeOfDay: string; // "HH:MM" local
  dayOfWeek: number | null; // 0=Sun..6=Sat
  dayOfMonth: number | null; // 1–31
}

/**
 * Compute the next fire time strictly after `fromMs`.
 * `timeOfDay` is interpreted as local wall-clock in APP_TZ.
 */
export function computeNextRunAt(rule: RecurrenceRule, fromMs: number): number {
  const from = toLocalParts(fromMs);
  const { hour, minute } = parseTimeOfDay(rule.timeOfDay);

  if (rule.type === "daily") {
    // Try today at the specified time
    const todayAt = localToInstant({
      year: from.year,
      month: from.month,
      day: from.day,
      hour,
      minute,
    });

    if (todayAt > fromMs) return todayAt;

    // Tomorrow
    return localToInstant({
      year: from.year,
      month: from.month,
      day: from.day + 1, // Luxon handles month overflow
      hour,
      minute,
    });
  }

  if (rule.type === "weekly") {
    const targetDow = rule.dayOfWeek!;
    let daysAhead = (targetDow - from.weekday0Sun + 7) % 7;

    if (daysAhead === 0) {
      // Same weekday — check if the time has passed
      const sameDay = localToInstant({
        year: from.year,
        month: from.month,
        day: from.day,
        hour,
        minute,
      });
      if (sameDay > fromMs) return sameDay;
      daysAhead = 7;
    }

    return localToInstant({
      year: from.year,
      month: from.month,
      day: from.day + daysAhead,
      hour,
      minute,
    });
  }

  // monthly
  const targetDay = rule.dayOfMonth!;

  // Try this month first
  const effectiveDayThisMonth = Math.min(
    targetDay,
    daysInMonth(from.year, from.month),
  );
  const thisMonth = localToInstant({
    year: from.year,
    month: from.month,
    day: effectiveDayThisMonth,
    hour,
    minute,
  });
  if (thisMonth > fromMs) return thisMonth;

  // Next month (handle year wrap)
  let nextYear = from.year;
  let nextMonth = from.month + 1;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear++;
  }

  const effectiveDayNextMonth = Math.min(
    targetDay,
    daysInMonth(nextYear, nextMonth),
  );
  return localToInstant({
    year: nextYear,
    month: nextMonth,
    day: effectiveDayNextMonth,
    hour,
    minute,
  });
}

/**
 * Occurrence key = "${ruleId}:${localDate}" — the dedupe identity.
 * Keyed on the LOCAL date of the occurrence.
 */
export function occurrenceKey(ruleId: number, occurrenceMs: number): string {
  return `${ruleId}:${localISODate(occurrenceMs)}`;
}
