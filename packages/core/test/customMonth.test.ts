import { describe, it, expect } from "vitest";
import { customMonthOf } from "../src/customMonth.js";
import { toLocalParts, localToInstant } from "../src/time.js";

describe("customMonthOf", () => {
  it("on the 25th, starts a new custom month", () => {
    const ms = localToInstant({ year: 2025, month: 6, day: 25, hour: 12 });
    const cm = customMonthOf(ms);

    const startParts = toLocalParts(cm.start);
    expect(startParts.month).toBe(6);
    expect(startParts.day).toBe(25);
    expect(cm.monthKey).toBe("2025-06");
  });

  it("on the 24th, belongs to previous month's custom window", () => {
    const ms = localToInstant({ year: 2025, month: 6, day: 24, hour: 12 });
    const cm = customMonthOf(ms);

    const startParts = toLocalParts(cm.start);
    expect(startParts.month).toBe(5);
    expect(startParts.day).toBe(25);
    expect(cm.monthKey).toBe("2025-05");
  });

  it("mid-month (10th) belongs to previous month's window", () => {
    const ms = localToInstant({ year: 2025, month: 3, day: 10, hour: 8 });
    const cm = customMonthOf(ms);

    expect(cm.monthKey).toBe("2025-02");
    const startParts = toLocalParts(cm.start);
    expect(startParts.month).toBe(2);
    expect(startParts.day).toBe(25);
  });

  it("handles Dec→Jan rollover (Jan 10th belongs to Dec window)", () => {
    const ms = localToInstant({ year: 2025, month: 1, day: 10, hour: 12 });
    const cm = customMonthOf(ms);

    expect(cm.monthKey).toBe("2024-12");
    const startParts = toLocalParts(cm.start);
    expect(startParts.year).toBe(2024);
    expect(startParts.month).toBe(12);
    expect(startParts.day).toBe(25);
  });

  it("Dec 25th starts a new December window, ending Jan 24th", () => {
    const ms = localToInstant({ year: 2025, month: 12, day: 25, hour: 12 });
    const cm = customMonthOf(ms);

    expect(cm.monthKey).toBe("2025-12");
    const endParts = toLocalParts(cm.end);
    expect(endParts.year).toBe(2026);
    expect(endParts.month).toBe(1);
    expect(endParts.day).toBe(24);
  });

  it("end is the last ms of the 24th", () => {
    const ms = localToInstant({ year: 2025, month: 6, day: 25, hour: 12 });
    const cm = customMonthOf(ms);
    const endParts = toLocalParts(cm.end);

    expect(endParts.month).toBe(7);
    expect(endParts.day).toBe(24);
    expect(endParts.hour).toBe(23);
    expect(endParts.minute).toBe(59);
  });
});
