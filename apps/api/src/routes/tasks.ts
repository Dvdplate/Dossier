import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { CreateTaskInput, UpdateTaskInput, ReorderInput } from "@dossier/core";
import {
  createTask,
  updateTask,
  completeTask,
  deleteTask,
  reorderTasks,
} from "../data/tasks.js";
import type { Db } from "../db/client.js";
import { AppError } from "../app.js";

type Variables = {
  db: Db;
  now: number;
};

const app = new Hono<{ Variables: Variables }>();

app.post("/", zValidator("json", CreateTaskInput), async (c) => {
  const db = c.get("db");
  const now = c.get("now");
  const input = c.req.valid("json");

  const task = await createTask(db, input, now);
  return c.json(task, 201);
});

app.patch("/:id", zValidator("json", UpdateTaskInput), async (c) => {
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) throw new AppError("invalid_id", "Invalid task ID", 400);

  const input = c.req.valid("json");
  const task = await updateTask(db, id, input);
  if (!task) throw new AppError("not_found", "Task not found", 404);

  return c.json(task);
});

app.post("/:id/complete", async (c) => {
  const db = c.get("db");
  const now = c.get("now");
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) throw new AppError("invalid_id", "Invalid task ID", 400);

  const task = await completeTask(db, id, now);
  if (!task) throw new AppError("not_found", "Task not found", 404);

  return c.json(task);
});

app.post("/reorder", zValidator("json", ReorderInput), async (c) => {
  const db = c.get("db");
  const input = c.req.valid("json");

  await reorderTasks(db, input);
  return c.json({ success: true });
});

app.delete("/:id", async (c) => {
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) throw new AppError("invalid_id", "Invalid task ID", 400);

  const task = await deleteTask(db, id);
  if (!task) throw new AppError("not_found", "Task not found", 404);

  return c.json({ success: true });
});

export default app;
