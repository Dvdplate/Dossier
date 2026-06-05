import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import type { Bindings } from "../env.js";
import { makeDb } from "../db/client.js";
import { devices } from "../db/schema.js";
import { buildAuthMessage, verifyDeviceSignature } from "../lib/deviceAuth.js";

const TIMESTAMP_TOLERANCE_SECONDS = 300; // 5-minute replay window

function unauthorized(message: string) {
  return Response.json({ error: { code: "unauthorized", message } }, { status: 401 });
}

export const auth = createMiddleware<{ Bindings: Bindings; Variables: { deviceId?: string } }>(async (c, next) => {
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
  const message = buildAuthMessage(c.req.method, `${url.pathname}${url.search}`, timestamp);
  const isValid = await verifyDeviceSignature({
    publicKeyJwk: JSON.parse(device.publicKeyJwk) as JsonWebKey,
    message,
    signatureB64: signature,
  });

  if (!isValid) {
    return unauthorized("Invalid signature");
  }

  c.set("deviceId", deviceId);
  return next();
});
