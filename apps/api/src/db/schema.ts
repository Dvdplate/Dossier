import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// tasks
// ---------------------------------------------------------------------------

export const tasks = sqliteTable(
  "tasks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    notes: text("notes"),
    position: real("position").notNull(),
    status: text("status").notNull().default("active"),
    origin: text("origin").notNull().default("manual"),
    ruleId: integer("rule_id").references(() => recurringRules.id, { onDelete: "set null" }),
    occurrenceKey: text("occurrence_key"),
    createdAt: integer("created_at").notNull(),
    completedAt: integer("completed_at"),
  },
  (t) => [
    index("idx_tasks_status_position").on(t.status, t.position),
    index("idx_tasks_rule_status").on(t.ruleId, t.status),
    uniqueIndex("idx_tasks_occurrence_key").on(t.occurrenceKey),
  ],
);

// ---------------------------------------------------------------------------
// recurring_rules
// ---------------------------------------------------------------------------

export const recurringRules = sqliteTable(
  "recurring_rules",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    type: text("type").notNull(),
    timeOfDay: text("time_of_day").notNull(),
    dayOfWeek: integer("day_of_week"),
    dayOfMonth: integer("day_of_month"),
    active: integer("active", { mode: "boolean" }).default(true),
    nextRunAt: integer("next_run_at").notNull(),
    lastFiredAt: integer("last_fired_at"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    index("idx_rules_active_next").on(t.active, t.nextRunAt),
  ],
);

// ---------------------------------------------------------------------------
// birthdays
// ---------------------------------------------------------------------------

export const birthdays = sqliteTable("birthdays", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  birthMonth: integer("birth_month").notNull(),
  birthDay: integer("birth_day").notNull(),
  birthYear: integer("birth_year"),
  note: text("note"),
  createdAt: integer("created_at").notNull(),
});
