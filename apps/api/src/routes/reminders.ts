import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { CreateRuleInput, UpdateRuleInput } from "@dossier/core";
import {
  getRules,
  createRule,
  updateRule,
  deleteRule,
} from "../data/reminders.js";
import type { Db } from "../db/client.js";
import { AppError } from "../app.js";

type Variables = {
  db: Db;
  now: number;
};

const app = new Hono<{ Variables: Variables }>();

app.get("/", async (c) => {
  const db = c.get("db");
  const rules = await getRules(db);
  return c.json(rules);
});

app.post("/", zValidator("json", CreateRuleInput), async (c) => {
  const db = c.get("db");
  const now = c.get("now");
  const input = c.req.valid("json");

  const rule = await createRule(db, input, now);
  return c.json(rule, 201);
});

app.patch("/:id", zValidator("json", UpdateRuleInput), async (c) => {
  const db = c.get("db");
  const now = c.get("now");
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) throw new AppError("invalid_id", "Invalid rule ID", 400);

  const input = c.req.valid("json");
  const rule = await updateRule(db, id, input, now);
  if (!rule) throw new AppError("not_found", "Rule not found", 404);

  return c.json(rule);
});

app.delete("/:id", async (c) => {
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) throw new AppError("invalid_id", "Invalid rule ID", 400);

  const rule = await deleteRule(db, id);
  if (!rule) throw new AppError("not_found", "Rule not found", 404);

  return c.json({ success: true });
});

export default app;
