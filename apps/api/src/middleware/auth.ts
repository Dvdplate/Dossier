import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import type { Bindings } from "../env.js";
import { makeDb } from "../db/client.js";
import { devices } from "../db/schema.js";

const TIMESTAMP_TOLERANCE_SECONDS = 300; // 5-minute replay window

function unauthorized(message: string) {
  return Response.json({ error: { code: "unauthorized", message } }, { status: 401 });
}

export const auth = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
  const deviceId = c.req.header("X-Device-Id");
  const timestampStr = c.req.header("X-Timestamp");
  const signature = c.req.header("X-Signature");

  if (!deviceId || !timestampStr || !signature) {
    return unauthorized("Missing auth headers");
  }

  const timestamp = parseInt(timestampStr, 10);
  const now = Math.floor(Date.now() / 1000);
  if (isNaN(timestamp) || Math.abs(now - timestamp) > TIMESTAMP_TOLERANCE_SECONDS) {
    return unauthorized("Request expired");
  }

  const db = makeDb(c.env.DB);
  const device = await db.select().from(devices).where(eq(devices.id, deviceId)).get();
  if (!device) {
    return unauthorized("Unknown device");
  }

  const url = new URL(c.req.url);
  const message = `${c.req.method}\n${url.pathname}${url.search}\n${timestamp}`;

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    JSON.parse(device.publicKeyJwk) as JsonWebKey,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"],
  );

  const sigBytes = Uint8Array.from(atob(signature), (ch) => ch.charCodeAt(0));
  const isValid = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    publicKey,
    sigBytes,
    new TextEncoder().encode(message),
  );

  if (!isValid) {
    return unauthorized("Invalid signature");
  }

  return next();
});
