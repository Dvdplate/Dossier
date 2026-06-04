import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { env } from "cloudflare:test";
import app from "../src/app.js";

describe("Tasks Routes", () => {
  it("GET /api/queue returns empty array initially", async () => {
    const res = await app.request("/api/queue", {}, env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("POST /api/tasks creates task at bottom", async () => {
    const res1 = await app.request("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Task 1" })
    }, env);
    expect(res1.status).toBe(201);
    const t1 = await res1.json();
    
    const res2 = await app.request("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Task 2" })
    }, env);
    const t2 = await res2.json();

    expect(t1.position).toBeLessThan(t2.position);
    
    const queue = await (await app.request("/api/queue", {}, env)).json();
    expect(queue).toHaveLength(2);
    expect(queue[0].title).toBe("Task 1"); // Focus is still Task 1
  });

  it("PATCH /api/tasks/:id updates fields", async () => {
    const resCreate = await app.request("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Original" })
    }, env);
    const t = await resCreate.json();

    const resPatch = await app.request(`/api/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated", notes: "Note" })
    }, env);
    expect(resPatch.status).toBe(200);
    const t2 = await resPatch.json();
    expect(t2.title).toBe("Updated");
    expect(t2.notes).toBe("Note");
  });

  it("POST /api/tasks/:id/complete archives and appears in history", async () => {
    const resCreate = await app.request("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "To Complete" })
    }, env);
    const t = await resCreate.json();

    const resComplete = await app.request(`/api/tasks/${t.id}/complete`, { method: "POST" }, env);
    expect(resComplete.status).toBe(200);

    const queue = await (await app.request("/api/queue", {}, env)).json();
    expect(queue).toHaveLength(0);

    const historyRes = await app.request("/api/history", {}, env);
    const history = await historyRes.json();
    expect(history.items).toHaveLength(1);
    expect(history.items[0].title).toBe("To Complete");
  });

  it("POST /api/tasks/reorder updates positions", async () => {
    const req = (title: string) => app.request("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    }, env).then(r => r.json());

    const t1 = await req("T1");
    const t2 = await req("T2");
    
    // T1 is index 0. Reorder to put T2 first.
    const resReorder = await app.request("/api/tasks/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: [t2.id, t1.id] })
    }, env);
    expect(resReorder.status).toBe(200);

    const queue = await (await app.request("/api/queue", {}, env)).json();
    expect(queue[0].title).toBe("T2"); // Focus changed
    expect(queue[1].title).toBe("T1");
  });

  it("returns explicit typed JSON errors without stack traces", async () => {
    const res = await app.request("/api/tasks/9999", { method: "DELETE" }, env);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe("not_found");
    expect(body.error.message).toBe("Task not found");
    expect(body.stack).toBeUndefined(); // No stack
  });
});
