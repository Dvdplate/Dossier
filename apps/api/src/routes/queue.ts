import { Hono } from "hono";
import { getActiveTasks } from "../data/tasks.js";
import { materialize } from "../data/materialize.js";
import type { Db } from "../db/client.js";

type Variables = {
  db: Db;
  now: number;
};

const app = new Hono<{ Variables: Variables }>();

app.get("/", async (c) => {
  const db = c.get("db");
  const now = c.get("now");

  // Materialize any due rules into the queue first
  await materialize(db, now);

  // Return the active queue
  const tasks = await getActiveTasks(db);
  return c.json(tasks);
});

export default app;
