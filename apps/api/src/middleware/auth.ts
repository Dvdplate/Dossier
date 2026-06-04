import { createMiddleware } from "hono/factory";
import type { Bindings } from "../env.js";

/**
 * Bearer-token auth middleware.
 * If AUTH_TOKEN is unset in env, all requests pass through (open mode).
 * When set, requests must include `Authorization: Bearer <token>`.
 * Uses Web Crypto timing-safe compare to prevent timing attacks.
 */
export const auth = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
  const expected = c.env.AUTH_TOKEN;
  if (!expected) return next();

  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: { code: "unauthorized", message: "Missing bearer token" } }, 401);
  }

  const token = header.slice(7);
  const encoder = new TextEncoder();
  const a = encoder.encode(expected);
  const b = encoder.encode(token);

  if (a.byteLength !== b.byteLength) {
    return c.json({ error: { code: "unauthorized", message: "Invalid token" } }, 401);
  }

  const isEqual = await crypto.subtle.timingSafeEqual(a, b);
  if (!isEqual) {
    return c.json({ error: { code: "unauthorized", message: "Invalid token" } }, 401);
  }

  return next();
});
