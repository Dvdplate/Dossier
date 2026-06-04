import { eq, sql } from "drizzle-orm";
import { recurringRules } from "../db/schema.js";
import { tasks } from "../db/schema.js";
import type { Db } from "../db/client.js";
import type { CreateRuleInput, UpdateRuleInput } from "@dossier/core";
import { computeNextRunAt } from "@dossier/core";

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getRules(db: Db) {
  return db.select().from(recurringRules).orderBy(recurringRules.createdAt);
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function createRule(db: Db, input: CreateRuleInput, nowMs: number) {
  const nextRunAt = computeNextRunAt(
    { id: 0, type: input.type, timeOfDay: input.timeOfDay, dayOfWeek: input.dayOfWeek ?? null, dayOfMonth: input.dayOfMonth ?? null },
    nowMs,
  );

  const [row] = await db
    .insert(recurringRules)
    .values({
      title: input.title,
      type: input.type,
      timeOfDay: input.timeOfDay,
      dayOfWeek: input.dayOfWeek ?? null,
      dayOfMonth: input.dayOfMonth ?? null,
      nextRunAt,
      createdAt: nowMs,
    })
    .returning();
  return row;
}

export async function updateRule(db: Db, id: number, input: UpdateRuleInput, nowMs: number) {
  // Fetch existing rule to merge schedule fields
  const [existing] = await db.select().from(recurringRules).where(eq(recurringRules.id, id));
  if (!existing) return null;

  const values: Record<string, unknown> = {};
  if (input.title !== undefined) values.title = input.title;
  if (input.type !== undefined) values.type = input.type;
  if (input.timeOfDay !== undefined) values.timeOfDay = input.timeOfDay;
  if (input.dayOfWeek !== undefined) values.dayOfWeek = input.dayOfWeek;
  if (input.dayOfMonth !== undefined) values.dayOfMonth = input.dayOfMonth;
  if (input.active !== undefined) values.active = input.active;

  // Recompute next_run_at if any schedule field changed
  const scheduleChanged =
    input.type !== undefined || input.timeOfDay !== undefined ||
    input.dayOfWeek !== undefined || input.dayOfMonth !== undefined;

  if (scheduleChanged) {
    const merged = {
      id,
      type: (input.type ?? existing.type) as "daily" | "weekly" | "monthly",
      timeOfDay: input.timeOfDay ?? existing.timeOfDay,
      dayOfWeek: input.dayOfWeek !== undefined ? input.dayOfWeek : existing.dayOfWeek,
      dayOfMonth: input.dayOfMonth !== undefined ? input.dayOfMonth : existing.dayOfMonth,
    };
    values.nextRunAt = computeNextRunAt(merged, nowMs);
  }

  if (Object.keys(values).length === 0) return existing;

  const [row] = await db.update(recurringRules).set(values).where(eq(recurringRules.id, id)).returning();
  return row ?? null;
}

export async function deleteRule(db: Db, id: number) {
  // Nullify rule_id on related tasks first
  await db.update(tasks).set({ ruleId: null }).where(eq(tasks.ruleId, id));
  const [row] = await db.delete(recurringRules).where(eq(recurringRules.id, id)).returning();
  return row ?? null;
}

export async function toggleRule(db: Db, id: number, active: boolean, nowMs: number) {
  const values: Record<string, unknown> = { active };

  // When reactivating, recompute next_run_at from now
  if (active) {
    const [existing] = await db.select().from(recurringRules).where(eq(recurringRules.id, id));
    if (!existing) return null;

    values.nextRunAt = computeNextRunAt(
      {
        id,
        type: existing.type as "daily" | "weekly" | "monthly",
        timeOfDay: existing.timeOfDay,
        dayOfWeek: existing.dayOfWeek,
        dayOfMonth: existing.dayOfMonth,
      },
      nowMs,
    );
  }

  const [row] = await db.update(recurringRules).set(values).where(eq(recurringRules.id, id)).returning();
  return row ?? null;
}
