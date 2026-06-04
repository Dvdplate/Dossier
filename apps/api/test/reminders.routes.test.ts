import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import app from "../src/app.js";

describe("Reminders Routes", () => {
  it("CRUD for reminders", async () => {
    // Create
    const res1 = await app.request("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Daily Standup",
        type: "daily",
        timeOfDay: "09:00"
      })
    }, env);
    expect(res1.status).toBe(201);
    const rule = await res1.json();
    expect(rule.nextRunAt).toBeGreaterThan(0);
    
    // Read
    const res2 = await app.request("/api/reminders", {}, env);
    const rules = await res2.json();
    expect(rules).toHaveLength(1);
    expect(rules[0].title).toBe("Daily Standup");

    // Patch (toggle active)
    const res3 = await app.request(`/api/reminders/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: false })
    }, env);
    const updated = await res3.json();
    expect(updated.active).toBe(false);

    // Delete
    const res4 = await app.request(`/api/reminders/${rule.id}`, { method: "DELETE" }, env);
    expect(res4.status).toBe(200);

    const res5 = await app.request("/api/reminders", {}, env);
    expect(await res5.json()).toHaveLength(0);
  });

  it("materializes at due time (not before)", async () => {
    // 1. Create reminder due at 09:00 SAST tomorrow
    const fromNow = Date.now();
    const res1 = await app.request("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Materialize Test", type: "daily", timeOfDay: "09:00" })
    }, env);
    const rule = await res1.json();

    // 2. Queue GET right now should NOT materialize it
    env.NOW_OVERRIDE = fromNow.toString();
    const q1 = await (await app.request("/api/queue", {}, env)).json();
    expect(q1).toHaveLength(0);

    // 3. Queue GET at/after due time SHOULD materialize it
    const dueTime = rule.nextRunAt + 1000;
    env.NOW_OVERRIDE = dueTime.toString();
    
    const res2 = await app.request("/api/queue", {}, env);
    const q2 = await res2.json();
    expect(q2).toHaveLength(1);
    expect(q2[0].title).toBe("Materialize Test");
    expect(q2[0].ruleId).toBe(rule.id);
    expect(q2[0].occurrenceKey).toContain(`${rule.id}:`);

    // 4. Idempotent: a second GET should not create another task
    const q3 = await (await app.request("/api/queue", {}, env)).json();
    expect(q3).toHaveLength(1);

    // Cleanup override
    env.NOW_OVERRIDE = undefined as any;
  });

  it("no flood: week-old next_run_at generates one task, advances past now", async () => {
    // Create
    const res1 = await app.request("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Daily Sync", type: "daily", timeOfDay: "09:00" })
    }, env);
    const rule = await res1.json();

    // Advance 'now' by 5 days
    const future = rule.nextRunAt + 5 * 24 * 60 * 60 * 1000;
    env.NOW_OVERRIDE = future.toString();

    // Materialize
    const q1 = await (await app.request("/api/queue", {}, env)).json();
    
    // Only 1 task created, not 5
    expect(q1).toHaveLength(1);
    
    // The rule's nextRunAt should be > future
    const rulesRes = await app.request("/api/reminders", {}, env);
    const updatedRule = (await rulesRes.json())[0];
    expect(updatedRule.nextRunAt).toBeGreaterThan(future);

    env.NOW_OVERRIDE = undefined as any;
  });
});
