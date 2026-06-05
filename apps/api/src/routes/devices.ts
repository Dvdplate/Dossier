import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { AppError } from "../app.js";
import type { Db } from "../db/client.js";
import { CreateDeviceInput } from "@dossier/core";
import { createDevice, deleteDevice, listDevices } from "../data/devices.js";

type Variables = {
  db: Db;
  now: number;
  deviceId?: string;
};

const app = new Hono<{ Variables: Variables }>();

app.get("/", async (c) => {
  const db = c.get("db");
  const currentDeviceId = c.get("deviceId");
  const rows = await listDevices(db);

  return c.json(
    rows.map((d) => ({
      id: d.id,
      nickname: d.nickname,
      createdAt: d.createdAt,
      isCurrent: currentDeviceId ? d.id === currentDeviceId : false,
    })),
  );
});

app.post("/", zValidator("json", CreateDeviceInput), async (c) => {
  const db = c.get("db");
  const nowMs = c.get("now");
  const input = c.req.valid("json");
  const row = await createDevice(db, input, nowMs);
  return c.json({ id: row.id, nickname: row.nickname, createdAt: row.createdAt }, 201);
});

app.delete("/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  if (!id) throw new AppError("invalid_id", "Invalid device ID", 400);

  const currentDeviceId = c.get("deviceId");
  if (currentDeviceId && id === currentDeviceId) {
    throw new AppError("cannot_delete_current", "Cannot delete the current device", 400);
  }

  const deleted = await deleteDevice(db, id);
  if (!deleted) throw new AppError("not_found", "Device not found", 404);
  return c.json({ success: true });
});

export default app;

