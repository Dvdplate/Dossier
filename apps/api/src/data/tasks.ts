import { eq, and, desc, lt, sql, inArray } from "drizzle-orm";
import { tasks } from "../db/schema.js";
import type { Db } from "../db/client.js";
import type { CreateTaskInput, UpdateTaskInput, ReorderInput } from "@dossier/core";

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getActiveTasks(db: Db) {
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.status, "active"))
    .orderBy(tasks.position);
}

export async function getHistory(db: Db, cursor?: number, limit = 20) {
  const conditions = [eq(tasks.status, "completed")];
  if (cursor != null) {
    conditions.push(lt(tasks.completedAt, cursor));
  }

  const rows = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.completedAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1].completedAt : null;

  return { items, nextCursor };
}

export async function getMinPosition(db: Db): Promise<number | null> {
  const [row] = await db
    .select({ min: sql<number>`MIN(${tasks.position})` })
    .from(tasks)
    .where(eq(tasks.status, "active"));
  return row?.min ?? null;
}

export async function getActiveRuleIds(db: Db): Promise<Set<number>> {
  const rows = await db
    .select({ ruleId: tasks.ruleId })
    .from(tasks)
    .where(and(eq(tasks.status, "active"), sql`${tasks.ruleId} IS NOT NULL`));
  return new Set(rows.map((r) => r.ruleId!));
}

export async function getExistingOccurrenceKeys(db: Db, ruleIds: number[]): Promise<Set<string>> {
  if (ruleIds.length === 0) return new Set();
  const rows = await db
    .select({ key: tasks.occurrenceKey })
    .from(tasks)
    .where(and(inArray(tasks.ruleId, ruleIds), sql`${tasks.occurrenceKey} IS NOT NULL`));
  return new Set(rows.map((r) => r.key!));
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function createTask(db: Db, input: CreateTaskInput, nowMs: number) {
  const [maxRow] = await db
    .select({ max: sql<number>`MAX(${tasks.position})` })
    .from(tasks)
    .where(eq(tasks.status, "active"));
  const position = (maxRow?.max ?? 0) + 1024;

  const [row] = await db
    .insert(tasks)
    .values({
      title: input.title,
      notes: input.notes ?? null,
      position,
      createdAt: nowMs,
    })
    .returning();
  return row;
}

export async function updateTask(db: Db, id: number, input: UpdateTaskInput) {
  const values: Record<string, unknown> = {};
  if (input.title !== undefined) values.title = input.title;
  if (input.notes !== undefined) values.notes = input.notes;

  if (Object.keys(values).length === 0) return null;

  const [row] = await db.update(tasks).set(values).where(eq(tasks.id, id)).returning();
  return row ?? null;
}

export async function completeTask(db: Db, id: number, nowMs: number) {
  const [row] = await db
    .update(tasks)
    .set({ status: "completed", completedAt: nowMs })
    .where(eq(tasks.id, id))
    .returning();
  return row ?? null;
}

export async function deleteTask(db: Db, id: number) {
  const [row] = await db.delete(tasks).where(eq(tasks.id, id)).returning();
  return row ?? null;
}

export async function reorderTasks(db: Db, input: ReorderInput) {
  if ("order" in input) {
    // Full reorder: renumber positions by array index
    const stmts = input.order.map((id, i) =>
      db.update(tasks).set({ position: i * 1024 }).where(eq(tasks.id, id)),
    );
    await db.batch(stmts as [typeof stmts[0], ...typeof stmts]);
    return;
  }

  // Single-item directional move
  const { id, direction } = input;
  const active = await getActiveTasks(db);
  const idx = active.findIndex((t) => t.id === id);
  if (idx === -1) return;

  if (direction === "top") {
    const minPos = active.length > 0 ? active[0].position : 0;
    await db.update(tasks).set({ position: minPos - 1 }).where(eq(tasks.id, id));
    return;
  }

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= active.length) return;

  // Swap positions with neighbor
  const current = active[idx];
  const neighbor = active[swapIdx];
  await db.batch([
    db.update(tasks).set({ position: neighbor.position }).where(eq(tasks.id, current.id)),
    db.update(tasks).set({ position: current.position }).where(eq(tasks.id, neighbor.id)),
  ]);
}
