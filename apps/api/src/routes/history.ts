import { Hono } from "hono";
import { getHistory } from "../data/tasks.js";
import type { Db } from "../db/client.js";

type Variables = {
  db: Db;
};

const app = new Hono<{ Variables: Variables }>();

app.get("/", async (c) => {
  const db = c.get("db");
  const cursorParam = c.req.query("cursor");
  const cursor = cursorParam ? parseInt(cursorParam) : undefined;
  
  const result = await getHistory(db, cursor);
  return c.json(result);
});

export default app;
