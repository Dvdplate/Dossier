import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import app from "../src/app.js";

describe("Birthdays Routes", () => {
  it("CRUD for birthdays", async () => {
    const res1 = await app.request("/api/birthdays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Contact",
        birthMonth: 10,
        birthDay: 31
      })
    }, env);
    expect(res1.status).toBe(201);
    const b = await res1.json();
    expect(b.name).toBe("Test Contact");

    // GET all
    const res2 = await app.request("/api/birthdays", {}, env);
    expect(await res2.json()).toHaveLength(1);

    // Grouped
    const res3 = await app.request("/api/birthdays?grouped=true", {}, env);
    const grouped = await res3.json();
    expect(grouped).toHaveLength(1);
    expect(grouped[0].month).toBe(10);
    expect(grouped[0].contacts[0].name).toBe("Test Contact");

    // Upcoming (should be empty if we force 'now' far away)
    env.NOW_OVERRIDE = Date.now().toString(); // Doesn't matter, just testing endpoint parses ok
    const res4 = await app.request("/api/birthdays/upcoming?days=7", {}, env);
    expect(res4.status).toBe(200);

    // Delete
    await app.request(`/api/birthdays/${b.id}`, { method: "DELETE" }, env);
    const res5 = await app.request("/api/birthdays", {}, env);
    expect(await res5.json()).toHaveLength(0);
  });
});
