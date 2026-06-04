import { computeNextRunAt, occurrenceKey } from "./recurrence.js";

interface RuleSnapshot {
  id: number;
  title: string;
  type: "daily" | "weekly" | "monthly";
  timeOfDay: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  nextRunAt: number;
}

interface MaterializeInput {
  nowMs: number;
  rules: RuleSnapshot[];
  minPosition: number | null; // MIN(position) of active tasks, null if none
  activeRuleIds: Set<number>; // rule_ids that already have an active task
  existingKeys: Set<string>; // occurrence_keys already in use
}

interface TaskInsert {
  title: string;
  position: number;
  origin: "daily" | "weekly" | "monthly";
  ruleId: number;
  occurrenceKey: string;
}

interface RuleAdvance {
  ruleId: number;
  nextRunAt: number;
  lastFiredAt: number;
}

interface MaterializeResult {
  inserts: TaskInsert[];
  advances: RuleAdvance[];
}

/**
 * Pure, no-pile-up materialize planner.
 *
 * For each rule with nextRunAt <= now:
 *   - ALWAYS advance next_run_at = computeNextRunAt(rule, now) + set last_fired_at = now
 *     (this collapses a week of missed fires into one — we jump straight past now)
 *   - Insert a task at top ONLY IF:
 *     1. occurrenceKey ∉ existingKeys (dedupe)
 *     2. ruleId ∉ activeRuleIds (one active task per rule at a time)
 *
 * Insert position = (minPosition ?? 0) - 1, decrementing per insert.
 * Mutates activeRuleIds so one pass can't double-insert.
 */
export function planMaterialize(input: MaterializeInput): MaterializeResult {
  const { nowMs, rules, existingKeys, activeRuleIds } = input;
  const inserts: TaskInsert[] = [];
  const advances: RuleAdvance[] = [];

  let runningMinPosition = input.minPosition ?? 0;

  for (const rule of rules) {
    if (rule.nextRunAt > nowMs) continue;

    // Always advance past now
    const nextRunAt = computeNextRunAt(rule, nowMs);
    advances.push({
      ruleId: rule.id,
      nextRunAt,
      lastFiredAt: nowMs,
    });

    // Dedupe: skip if this occurrence already exists or rule already has an active task
    const key = occurrenceKey(rule.id, rule.nextRunAt);
    if (existingKeys.has(key) || activeRuleIds.has(rule.id)) {
      continue;
    }

    // Insert at top
    runningMinPosition -= 1;
    inserts.push({
      title: rule.title,
      position: runningMinPosition,
      origin: rule.type,
      ruleId: rule.id,
      occurrenceKey: key,
    });

    // Prevent double-insert in this pass
    activeRuleIds.add(rule.id);
  }

  return { inserts, advances };
}
