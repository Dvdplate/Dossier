import { eq } from "drizzle-orm";
import { birthdays } from "../db/schema.js";
import type { Db } from "../db/client.js";
import type { CreateBirthdayInput, UpdateBirthdayInput } from "@dossier/core";

export async function getBirthdays(db: Db) {
  return db.select().from(birthdays).orderBy(birthdays.birthMonth, birthdays.birthDay);
}

export async function createBirthday(db: Db, input: CreateBirthdayInput, nowMs: number) {
  const [row] = await db
    .insert(birthdays)
    .values({
      name: input.name,
      birthMonth: input.birthMonth,
      birthDay: input.birthDay,
      birthYear: input.birthYear ?? null,
      note: input.note ?? null,
      createdAt: nowMs,
    })
    .returning();
  return row;
}

export async function updateBirthday(db: Db, id: number, input: UpdateBirthdayInput) {
  const values: Record<string, unknown> = {};
  if (input.name !== undefined) values.name = input.name;
  if (input.birthMonth !== undefined) values.birthMonth = input.birthMonth;
  if (input.birthDay !== undefined) values.birthDay = input.birthDay;
  if (input.birthYear !== undefined) values.birthYear = input.birthYear;
  if (input.note !== undefined) values.note = input.note;

  if (Object.keys(values).length === 0) return null;

  const [row] = await db.update(birthdays).set(values).where(eq(birthdays.id, id)).returning();
  return row ?? null;
}

export async function deleteBirthday(db: Db, id: number) {
  const [row] = await db.delete(birthdays).where(eq(birthdays.id, id)).returning();
  return row ?? null;
}
