import { toLocalParts, localToInstant } from "./time.js";
import type { CustomMonth } from "./types.js";

/**
 * The app "month" runs 25th→24th.
 *
 * If local day >= 25, the window starts the 25th of this calendar month.
 * Otherwise, it starts the 25th of the previous calendar month.
 * End = 24th of the month after start, last ms of that day.
 * monthKey = "YYYY-MM" of the start date.
 *
 * Birthdays do NOT use this — they group by calendar month.
 */
export function customMonthOf(ms: number): CustomMonth {
  const parts = toLocalParts(ms);

  let startYear: number;
  let startMonth: number;

  if (parts.day >= 25) {
    startYear = parts.year;
    startMonth = parts.month;
  } else {
    // Previous calendar month's 25th
    if (parts.month === 1) {
      startYear = parts.year - 1;
      startMonth = 12;
    } else {
      startYear = parts.year;
      startMonth = parts.month - 1;
    }
  }

  // End month is the month after start
  let endYear: number;
  let endMonth: number;
  if (startMonth === 12) {
    endYear = startYear + 1;
    endMonth = 1;
  } else {
    endYear = startYear;
    endMonth = startMonth + 1;
  }

  const start = localToInstant({
    year: startYear,
    month: startMonth,
    day: 25,
  });

  // End of the 24th = 23:59:59.999
  const endDayStart = localToInstant({
    year: endYear,
    month: endMonth,
    day: 24,
    hour: 23,
    minute: 59,
  });
  // Add 59 seconds + 999ms to get end of the minute
  const end = endDayStart + 59 * 1000 + 999;

  const monthKey = `${startYear}-${String(startMonth).padStart(2, "0")}`;

  return { start, end, monthKey };
}
