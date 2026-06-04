import { describe, it, expect } from "vitest";
import { computeNextRunAt, occurrenceKey } from "../src/recurrence.js";
import { localToInstant, toLocalParts, localISODate } from "../src/time.js";

describe("computeNextRunAt", () => {
  const makeRule = (
    overrides: Partial<{
      type: "daily" | "weekly" | "monthly";
      timeOfDay: string;
      dayOfWeek: number | null;
      dayOfMonth: number | null;
    }> = {},
  ) => ({
    id: 1,
    type: overrides.type ?? "daily",
    timeOfDay: overrides.timeOfDay ?? "08:00",
    dayOfWeek: overrides.dayOfWeek ?? null,
    dayOfMonth: overrides.dayOfMonth ?? null,
  });

  describe("daily", () => {
    it("returns today if time hasn't passed yet", () => {
      const from = localToInstant({ year: 2025, month: 6, day: 15, hour: 7, minute: 0 });
      const next = computeNextRunAt(makeRule({ timeOfDay: "08:00" }), from);
      const parts = toLocalParts(next);

      expect(parts.day).toBe(15);
      expect(parts.hour).toBe(8);
      expect(parts.minute).toBe(0);
    });

    it("returns tomorrow if time has passed (strictly after)", () => {
      const from = localToInstant({ year: 2025, month: 6, day: 15, hour: 8, minute: 0 });
      const next = computeNextRunAt(makeRule({ timeOfDay: "08:00" }), from);
      const parts = toLocalParts(next);

      expect(parts.day).toBe(16);
      expect(parts.hour).toBe(8);
    });

    it("no same-day refire (strictly after)", () => {
      // fromMs is exactly at the fire time
      const from = localToInstant({ year: 2025, month: 6, day: 15, hour: 8, minute: 0 });
      const next = computeNextRunAt(makeRule({ timeOfDay: "08:00" }), from);

      expect(next).toBeGreaterThan(from);
    });
  });

  describe("weekly", () => {
    it("returns same day if time hasn't passed", () => {
      // 2025-06-16 is Monday (weekday0Sun=1)
      const from = localToInstant({ year: 2025, month: 6, day: 16, hour: 7, minute: 0 });
      const next = computeNextRunAt(
        makeRule({ type: "weekly", dayOfWeek: 1, timeOfDay: "08:00" }),
        from,
      );
      const parts = toLocalParts(next);
      expect(parts.day).toBe(16);
    });

    it("returns next week if same day and time passed", () => {
      const from = localToInstant({ year: 2025, month: 6, day: 16, hour: 9, minute: 0 });
      const next = computeNextRunAt(
        makeRule({ type: "weekly", dayOfWeek: 1, timeOfDay: "08:00" }),
        from,
      );
      const parts = toLocalParts(next);
      expect(parts.day).toBe(23); // next Monday
    });

    it("wraps weekday correctly (from Wed to Mon)", () => {
      // 2025-06-18 is Wednesday (weekday0Sun=3)
      const from = localToInstant({ year: 2025, month: 6, day: 18, hour: 12, minute: 0 });
      const next = computeNextRunAt(
        makeRule({ type: "weekly", dayOfWeek: 1, timeOfDay: "08:00" }),
        from,
      );
      const parts = toLocalParts(next);
      expect(parts.day).toBe(23); // next Monday
      expect(parts.weekday0Sun).toBe(1);
    });

    it("handles Sunday target from Saturday", () => {
      // 2025-06-14 is Saturday (weekday0Sun=6)
      const from = localToInstant({ year: 2025, month: 6, day: 14, hour: 12, minute: 0 });
      const next = computeNextRunAt(
        makeRule({ type: "weekly", dayOfWeek: 0, timeOfDay: "08:00" }),
        from,
      );
      const parts = toLocalParts(next);
      expect(parts.day).toBe(15); // next Sunday
      expect(parts.weekday0Sun).toBe(0);
    });
  });

  describe("monthly", () => {
    it("returns this month if day hasn't passed", () => {
      const from = localToInstant({ year: 2025, month: 6, day: 10, hour: 7, minute: 0 });
      const next = computeNextRunAt(
        makeRule({ type: "monthly", dayOfMonth: 15, timeOfDay: "09:00" }),
        from,
      );
      const parts = toLocalParts(next);
      expect(parts.month).toBe(6);
      expect(parts.day).toBe(15);
    });

    it("returns next month if day has passed", () => {
      const from = localToInstant({ year: 2025, month: 6, day: 20, hour: 12, minute: 0 });
      const next = computeNextRunAt(
        makeRule({ type: "monthly", dayOfMonth: 15, timeOfDay: "09:00" }),
        from,
      );
      const parts = toLocalParts(next);
      expect(parts.month).toBe(7);
      expect(parts.day).toBe(15);
    });

    it("clamps day 31 to Feb 28 in common year", () => {
      const from = localToInstant({ year: 2025, month: 1, day: 31, hour: 12, minute: 0 });
      const next = computeNextRunAt(
        makeRule({ type: "monthly", dayOfMonth: 31, timeOfDay: "09:00" }),
        from,
      );
      const parts = toLocalParts(next);
      expect(parts.month).toBe(2);
      expect(parts.day).toBe(28);
    });

    it("clamps day 31 to Feb 29 in leap year", () => {
      const from = localToInstant({ year: 2024, month: 1, day: 31, hour: 12, minute: 0 });
      const next = computeNextRunAt(
        makeRule({ type: "monthly", dayOfMonth: 31, timeOfDay: "09:00" }),
        from,
      );
      const parts = toLocalParts(next);
      expect(parts.month).toBe(2);
      expect(parts.day).toBe(29);
    });

    it("handles year wrap (Dec → Jan)", () => {
      const from = localToInstant({ year: 2025, month: 12, day: 20, hour: 12, minute: 0 });
      const next = computeNextRunAt(
        makeRule({ type: "monthly", dayOfMonth: 15, timeOfDay: "09:00" }),
        from,
      );
      const parts = toLocalParts(next);
      expect(parts.year).toBe(2026);
      expect(parts.month).toBe(1);
      expect(parts.day).toBe(15);
    });

    it("fires via SAST not UTC (result is local wall-clock)", () => {
      const from = localToInstant({ year: 2025, month: 6, day: 1, hour: 0 });
      const next = computeNextRunAt(
        makeRule({ type: "monthly", dayOfMonth: 5, timeOfDay: "06:00" }),
        from,
      );
      const parts = toLocalParts(next);
      expect(parts.hour).toBe(6);
      expect(parts.minute).toBe(0);
    });
  });
});

describe("occurrenceKey", () => {
  it("returns ruleId:localDate", () => {
    const ms = localToInstant({ year: 2025, month: 6, day: 15, hour: 8 });
    expect(occurrenceKey(42, ms)).toBe("42:2025-06-15");
  });

  it("uses local date, not UTC date", () => {
    // 01:00 SAST = 23:00 previous day UTC
    const ms = localToInstant({ year: 2025, month: 1, day: 2, hour: 1 });
    expect(occurrenceKey(1, ms)).toBe("1:2025-01-02");
  });
});
