import { describe, it, expect } from "vitest";
import {
  toLocalParts,
  localToInstant,
  localISODate,
  parseTimeOfDay,
  daysInMonth,
  APP_TZ,
} from "../src/time.js";

describe("time", () => {
  describe("APP_TZ", () => {
    it("is Africa/Johannesburg", () => {
      expect(APP_TZ).toBe("Africa/Johannesburg");
    });
  });

  describe("toLocalParts + localToInstant round-trip", () => {
    it("round-trips through SAST correctly", () => {
      // 2025-06-15 10:30 SAST = 08:30 UTC
      const ms = localToInstant({ year: 2025, month: 6, day: 15, hour: 10, minute: 30 });
      const parts = toLocalParts(ms);

      expect(parts.year).toBe(2025);
      expect(parts.month).toBe(6);
      expect(parts.day).toBe(15);
      expect(parts.hour).toBe(10);
      expect(parts.minute).toBe(30);
    });

    it("handles midnight correctly", () => {
      const ms = localToInstant({ year: 2025, month: 1, day: 1, hour: 0, minute: 0 });
      const parts = toLocalParts(ms);

      expect(parts.year).toBe(2025);
      expect(parts.month).toBe(1);
      expect(parts.day).toBe(1);
      expect(parts.hour).toBe(0);
      expect(parts.minute).toBe(0);
    });
  });

  describe("weekday0Sun mapping", () => {
    it("maps Sunday to 0", () => {
      // 2025-06-15 is a Sunday
      const ms = localToInstant({ year: 2025, month: 6, day: 15 });
      expect(toLocalParts(ms).weekday0Sun).toBe(0);
    });

    it("maps Monday to 1", () => {
      const ms = localToInstant({ year: 2025, month: 6, day: 16 });
      expect(toLocalParts(ms).weekday0Sun).toBe(1);
    });

    it("maps Saturday to 6", () => {
      const ms = localToInstant({ year: 2025, month: 6, day: 14 });
      expect(toLocalParts(ms).weekday0Sun).toBe(6);
    });

    it("maps Wednesday to 3", () => {
      const ms = localToInstant({ year: 2025, month: 6, day: 18 });
      expect(toLocalParts(ms).weekday0Sun).toBe(3);
    });
  });

  describe("localISODate", () => {
    it("formats as YYYY-MM-DD in SAST", () => {
      const ms = localToInstant({ year: 2025, month: 3, day: 5, hour: 14, minute: 0 });
      expect(localISODate(ms)).toBe("2025-03-05");
    });

    it("handles date boundary near midnight UTC (early morning SAST)", () => {
      // Something at 01:00 SAST = 23:00 previous day UTC
      const ms = localToInstant({ year: 2025, month: 1, day: 2, hour: 1, minute: 0 });
      expect(localISODate(ms)).toBe("2025-01-02");
    });
  });

  describe("parseTimeOfDay", () => {
    it("parses HH:MM", () => {
      expect(parseTimeOfDay("08:30")).toEqual({ hour: 8, minute: 30 });
      expect(parseTimeOfDay("23:59")).toEqual({ hour: 23, minute: 59 });
      expect(parseTimeOfDay("00:00")).toEqual({ hour: 0, minute: 0 });
    });
  });

  describe("daysInMonth", () => {
    it("returns 28 for Feb in a common year", () => {
      expect(daysInMonth(2025, 2)).toBe(28);
    });

    it("returns 29 for Feb in a leap year", () => {
      expect(daysInMonth(2024, 2)).toBe(29);
    });

    it("returns 31 for January", () => {
      expect(daysInMonth(2025, 1)).toBe(31);
    });

    it("returns 30 for April", () => {
      expect(daysInMonth(2025, 4)).toBe(30);
    });
  });
});
