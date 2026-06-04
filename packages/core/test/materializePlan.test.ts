import { describe, it, expect } from "vitest";
import { planMaterialize } from "../src/materializePlan.js";
import { localToInstant } from "../src/time.js";
import { computeNextRunAt } from "../src/recurrence.js";

function makeRule(
  id: number,
  nextRunAt: number,
  overrides: Partial<{
    type: "daily" | "weekly" | "monthly";
    timeOfDay: string;
    dayOfWeek: number | null;
    dayOfMonth: number | null;
    title: string;
  }> = {},
) {
  return {
    id,
    title: overrides.title ?? `Rule ${id}`,
    type: overrides.type ?? "daily",
    timeOfDay: overrides.timeOfDay ?? "08:00",
    dayOfWeek: overrides.dayOfWeek ?? null,
    dayOfMonth: overrides.dayOfMonth ?? null,
    nextRunAt,
  };
}

describe("planMaterialize", () => {
  it("inserts one task at top for a single due rule", () => {
    const dueAt = localToInstant({ year: 2025, month: 6, day: 15, hour: 8 });
    const now = dueAt + 1; // 1ms after

    const result = planMaterialize({
      nowMs: now,
      rules: [makeRule(1, dueAt)],
      minPosition: 100,
      activeRuleIds: new Set(),
      existingKeys: new Set(),
    });

    expect(result.inserts).toHaveLength(1);
    expect(result.inserts[0].position).toBe(99); // 100 - 1
    expect(result.inserts[0].ruleId).toBe(1);
    expect(result.inserts[0].origin).toBe("daily");
    expect(result.advances).toHaveLength(1);
  });

  it("skips insert when occurrence key already exists (still advances)", () => {
    const dueAt = localToInstant({ year: 2025, month: 6, day: 15, hour: 8 });
    const now = dueAt + 1;
    const key = `1:2025-06-15`;

    const result = planMaterialize({
      nowMs: now,
      rules: [makeRule(1, dueAt)],
      minPosition: 100,
      activeRuleIds: new Set(),
      existingKeys: new Set([key]),
    });

    expect(result.inserts).toHaveLength(0);
    expect(result.advances).toHaveLength(1); // still advances
  });

  it("skips insert when rule already has an active task (still advances)", () => {
    const dueAt = localToInstant({ year: 2025, month: 6, day: 15, hour: 8 });
    const now = dueAt + 1;

    const result = planMaterialize({
      nowMs: now,
      rules: [makeRule(1, dueAt)],
      minPosition: 100,
      activeRuleIds: new Set([1]),
      existingKeys: new Set(),
    });

    expect(result.inserts).toHaveLength(0);
    expect(result.advances).toHaveLength(1);
  });

  it("missed-week collapse: exactly 1 insert, advance jumps past now", () => {
    // Rule was due a week ago, never fired
    const aWeekAgo = localToInstant({ year: 2025, month: 6, day: 8, hour: 8 });
    const now = localToInstant({ year: 2025, month: 6, day: 15, hour: 12 });

    const result = planMaterialize({
      nowMs: now,
      rules: [makeRule(1, aWeekAgo)],
      minPosition: 0,
      activeRuleIds: new Set(),
      existingKeys: new Set(),
    });

    expect(result.inserts).toHaveLength(1);
    expect(result.advances).toHaveLength(1);
    // next_run_at should be computed from NOW, not from the old due time
    expect(result.advances[0].nextRunAt).toBeGreaterThan(now);
    expect(result.advances[0].lastFiredAt).toBe(now);
  });

  it("not-yet-due rules produce 0 inserts", () => {
    const future = localToInstant({ year: 2025, month: 6, day: 20, hour: 8 });
    const now = localToInstant({ year: 2025, month: 6, day: 15, hour: 12 });

    const result = planMaterialize({
      nowMs: now,
      rules: [makeRule(1, future)],
      minPosition: 0,
      activeRuleIds: new Set(),
      existingKeys: new Set(),
    });

    expect(result.inserts).toHaveLength(0);
    expect(result.advances).toHaveLength(0);
  });

  it("multiple due rules get decrementing positions", () => {
    const dueAt = localToInstant({ year: 2025, month: 6, day: 15, hour: 8 });
    const now = dueAt + 1;

    const result = planMaterialize({
      nowMs: now,
      rules: [
        makeRule(1, dueAt, { title: "First" }),
        makeRule(2, dueAt, { title: "Second" }),
      ],
      minPosition: 0,
      activeRuleIds: new Set(),
      existingKeys: new Set(),
    });

    expect(result.inserts).toHaveLength(2);
    expect(result.inserts[0].position).toBe(-1);
    expect(result.inserts[1].position).toBe(-2);
    expect(result.advances).toHaveLength(2);
  });

  it("uses default min position of 0 when null", () => {
    const dueAt = localToInstant({ year: 2025, month: 6, day: 15, hour: 8 });
    const now = dueAt + 1;

    const result = planMaterialize({
      nowMs: now,
      rules: [makeRule(1, dueAt)],
      minPosition: null,
      activeRuleIds: new Set(),
      existingKeys: new Set(),
    });

    expect(result.inserts[0].position).toBe(-1);
  });

  it("prevents double-insert of same rule in one pass", () => {
    const dueAt = localToInstant({ year: 2025, month: 6, day: 15, hour: 8 });
    const now = dueAt + 1;

    // Same rule appears twice (shouldn't happen in practice, but defensive)
    const result = planMaterialize({
      nowMs: now,
      rules: [makeRule(1, dueAt), makeRule(1, dueAt)],
      minPosition: 0,
      activeRuleIds: new Set(),
      existingKeys: new Set(),
    });

    // Second insert blocked because activeRuleIds was mutated
    expect(result.inserts).toHaveLength(1);
    expect(result.advances).toHaveLength(2);
  });
});
