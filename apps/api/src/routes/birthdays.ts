import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { CreateBirthdayInput, UpdateBirthdayInput, groupBirthdaysByMonth, birthdaysUpcoming } from "@dossier/core";
import {
  getBirthdays,
  createBirthday,
  updateBirthday,
  deleteBirthday,
} from "../data/birthdays.js";
import type { Db } from "../db/client.js";
import { AppError } from "../app.js";

type Variables = {
  db: Db;
  now: number;
};

const app = new Hono<{ Variables: Variables }>();

app.get("/", async (c) => {
  const db = c.get("db");
  const grouped = c.req.query("grouped") === "true";
  const birthdays = await getBirthdays(db);

  if (grouped) {
    const now = c.get("now");
    return c.json(groupBirthdaysByMonth(birthdays, now));
  }
  
  return c.json(birthdays);
});

app.get("/upcoming", async (c) => {
  const db = c.get("db");
  const now = c.get("now");
  const daysStr = c.req.query("days");
  const days = daysStr ? parseInt(daysStr) : 7;
  
  const birthdays = await getBirthdays(db);
  const upcoming = birthdaysUpcoming(birthdays, now, days);
  
  return c.json(upcoming);
});

app.post("/", zValidator("json", CreateBirthdayInput), async (c) => {
  const db = c.get("db");
  const now = c.get("now");
  const input = c.req.valid("json");

  const bday = await createBirthday(db, input, now);
  return c.json(bday, 201);
});

app.patch("/:id", zValidator("json", UpdateBirthdayInput), async (c) => {
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) throw new AppError("invalid_id", "Invalid birthday ID", 400);

  const input = c.req.valid("json");
  const bday = await updateBirthday(db, id, input);
  if (!bday) throw new AppError("not_found", "Birthday not found", 404);

  return c.json(bday);
});

app.delete("/:id", async (c) => {
  const db = c.get("db");
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) throw new AppError("invalid_id", "Invalid birthday ID", 400);

  const bday = await deleteBirthday(db, id);
  if (!bday) throw new AppError("not_found", "Birthday not found", 404);

  return c.json({ success: true });
});

export default app;
