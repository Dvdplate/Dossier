import { eq } from "drizzle-orm";
import { devices } from "../db/schema.js";
import type { Db } from "../db/client.js";
import type { CreateDeviceInput } from "@dossier/core";

function normalizeFlatObjectJson(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid JWK");
  }
  const obj = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) sorted[key] = obj[key];
  return JSON.stringify(sorted);
}

export async function listDevices(db: Db) {
  return db.select().from(devices).orderBy(devices.createdAt);
}

export async function createDevice(db: Db, input: CreateDeviceInput, nowMs: number) {
  const publicKeyJwk = normalizeFlatObjectJson(input.publicKeyJwk);
  const [row] = await db
    .insert(devices)
    .values({
      id: input.deviceId,
      nickname: input.nickname,
      publicKeyJwk,
      createdAt: nowMs,
    })
    .returning();
  return row;
}

export async function deleteDevice(db: Db, id: string) {
  const [row] = await db.delete(devices).where(eq(devices.id, id)).returning();
  return row ?? null;
}
