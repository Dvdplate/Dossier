import type { RecurringRule } from "./types.js";

/** Deterministic English month names for display and tests */
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

/**
 * Human-readable cadence description for a recurring rule.
 * "DAILY · 08:00" | "WEEKLY · MON · 18:30" | "MONTHLY · 15th · 09:00"
 */
export function describeCadence(
  rule: Pick<RecurringRule, "type" | "timeOfDay" | "dayOfWeek" | "dayOfMonth">,
): string {
  const time = rule.timeOfDay;

  switch (rule.type) {
    case "daily":
      return `DAILY · ${time}`;
    case "weekly":
      return `WEEKLY · ${DAY_NAMES[rule.dayOfWeek!]} · ${time}`;
    case "monthly":
      return `MONTHLY · ${ordinal(rule.dayOfMonth!)} · ${time}`;
  }
}

/** "today" | "yesterday" | "N days ago" */
export function relativeDayLabel(
  targetMs: number,
  nowMs: number,
): string {
  const daysDiff = Math.floor((nowMs - targetMs) / (24 * 60 * 60 * 1000));
  if (daysDiff === 0) return "today";
  if (daysDiff === 1) return "yesterday";
  return `${daysDiff} days ago`;
}

/** Calculate age on a specific date given birth year */
export function ageOn(
  month: number,
  day: number,
  birthYear: number,
  nowMs: number,
): number {
  // Simple: current year - birth year, adjusted if birthday hasn't passed
  const nowDate = new Date(nowMs);
  const thisYear = nowDate.getFullYear();
  let age = thisYear - birthYear;

  const nowMonth = nowDate.getMonth() + 1;
  const nowDay = nowDate.getDate();

  if (nowMonth < month || (nowMonth === month && nowDay < day)) {
    age--;
  }

  return age;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}
