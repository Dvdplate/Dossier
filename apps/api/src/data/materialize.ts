import { eq, and, lte } from "drizzle-orm";
import { tasks, recurringRules } from "../db/schema.js";
import type { Db } from "../db/client.js";
import { planMaterialize } from "@dossier/core";
import { getMinPosition, getActiveRuleIds, getExistingOccurrenceKeys } from "./tasks.js";

/**
 * Materialize due recurring rules into tasks.
 * Reads all active rules whose next_run_at <= now,
 * computes inserts + advances via the pure planner in @dossier/core,
 * then writes everything in a single batch.
 */
export async function materialize(db: Db, nowMs: number): Promise<number> {
  // Fetch due rules
  const dueRules = await db
    .select()
    .from(recurringRules)
    .where(and(eq(recurringRules.active, true), lte(recurringRules.nextRunAt, nowMs)));

  if (dueRules.length === 0) return 0;

  const ruleIds = dueRules.map((r) => r.id);
  const [minPosition, activeRuleIds, existingKeys] = await Promise.all([
    getMinPosition(db),
    getActiveRuleIds(db),
    getExistingOccurrenceKeys(db, ruleIds),
  ]);

  const { inserts, advances } = planMaterialize({
    nowMs,
    rules: dueRules.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type as "daily" | "weekly" | "monthly",
      timeOfDay: r.timeOfDay,
      dayOfWeek: r.dayOfWeek,
      dayOfMonth: r.dayOfMonth,
      nextRunAt: r.nextRunAt,
    })),
    minPosition,
    activeRuleIds,
    existingKeys,
  });

  if (inserts.length === 0 && advances.length === 0) return 0;

  // Build batch: task inserts + rule advances
  const stmts: any[] = [];

  for (const ins of inserts) {
    stmts.push(
      db.insert(tasks).values({
        title: ins.title,
        position: ins.position,
        status: "active",
        origin: ins.origin,
        ruleId: ins.ruleId,
        occurrenceKey: ins.occurrenceKey,
        createdAt: nowMs,
      }).onConflictDoNothing({ target: tasks.occurrenceKey }),
    );
  }

  for (const adv of advances) {
    stmts.push(
      db
        .update(recurringRules)
        .set({ nextRunAt: adv.nextRunAt, lastFiredAt: adv.lastFiredAt })
        .where(eq(recurringRules.id, adv.ruleId)),
    );
  }

  if (stmts.length > 0) {
    await db.batch(stmts as [typeof stmts[0], ...typeof stmts]);
  }

  return inserts.length;
}
