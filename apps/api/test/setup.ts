import { beforeAll, beforeEach } from "vitest";
import { env } from "cloudflare:test";

beforeAll(async () => {
  const db = env.DB;
  
  await db.prepare("CREATE TABLE IF NOT EXISTS birthdays (id integer PRIMARY KEY AUTOINCREMENT NOT NULL, name text NOT NULL, birth_month integer NOT NULL, birth_day integer NOT NULL, birth_year integer, note text, created_at integer NOT NULL);").run();
  await db.prepare("CREATE TABLE IF NOT EXISTS recurring_rules (id integer PRIMARY KEY AUTOINCREMENT NOT NULL, title text NOT NULL, type text NOT NULL, time_of_day text NOT NULL, day_of_week integer, day_of_month integer, active integer DEFAULT 1, next_run_at integer NOT NULL, last_fired_at integer, created_at integer NOT NULL);").run();
  await db.prepare("CREATE TABLE IF NOT EXISTS tasks (id integer PRIMARY KEY AUTOINCREMENT NOT NULL, title text NOT NULL, notes text, position real NOT NULL, status text DEFAULT 'active' NOT NULL, origin text DEFAULT 'manual' NOT NULL, rule_id integer, occurrence_key text, created_at integer NOT NULL, completed_at integer, FOREIGN KEY (rule_id) REFERENCES recurring_rules(id) ON UPDATE no action ON DELETE set null);").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_rules_active_next ON recurring_rules (active,next_run_at);").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_tasks_status_position ON tasks (status,position);").run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_tasks_rule_status ON tasks (rule_id,status);").run();
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_occurrence_key ON tasks (occurrence_key);").run();
});

beforeEach(async () => {
  const db = env.DB;
  await db.prepare("DELETE FROM tasks").run();
  await db.prepare("DELETE FROM recurring_rules").run();
  await db.prepare("DELETE FROM birthdays").run();
});
