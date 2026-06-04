import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import app from "../src/app.js";

describe("Auth Middleware", () => {
  it("allows open access when AUTH_TOKEN is unset", async () => {
    // env.AUTH_TOKEN is unset by default in tests
    const res = await app.request("/api/queue", {}, env);
    expect(res.status).toBe(200);
  });

  it("returns 401 when AUTH_TOKEN is set but no Bearer token provided", async () => {
    env.AUTH_TOKEN = "secret123";
    const res = await app.request("/api/queue", {}, env);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("unauthorized");

    // Cleanup
    env.AUTH_TOKEN = undefined as any;
  });

  it("allows access when AUTH_TOKEN is set and correct Bearer token provided", async () => {
    env.AUTH_TOKEN = "secret123";
    const res = await app.request("/api/queue", {
      headers: { Authorization: "Bearer secret123" }
    }, env);
    expect(res.status).toBe(200);

    // Cleanup
    env.AUTH_TOKEN = undefined as any;
  });

  it("returns 401 when AUTH_TOKEN is set but wrong token provided", async () => {
    env.AUTH_TOKEN = "secret123";
    const res = await app.request("/api/queue", {
      headers: { Authorization: "Bearer wrong" }
    }, env);
    expect(res.status).toBe(401);

    // Cleanup
    env.AUTH_TOKEN = undefined as any;
  });
});
