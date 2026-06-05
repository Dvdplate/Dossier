import { Hono } from "hono";
import { makeDb, Db } from "./db/client.js";
import { auth as authMiddleware } from "./middleware/auth.js";
import queueRoutes from "./routes/queue.js";
import tasksRoutes from "./routes/tasks.js";
import historyRoutes from "./routes/history.js";
import remindersRoutes from "./routes/reminders.js";
import birthdaysRoutes from "./routes/birthdays.js";
import devicesRoutes from "./routes/devices.js";
import type { Bindings } from "./env.js";

// Export the AppError class so routes can use it
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: 400 | 401 | 403 | 404 | 409 | 500 = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export type Variables = {
  db: Db;
  now: number;
  deviceId?: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// 1. Drizzle client per request
app.use("*", async (c, next) => {
  c.set("db", makeDb(c.env.DB));
  await next();
});

// 2. Inject current time for deterministic tests
app.use("*", async (c, next) => {
  const override = c.env.NOW_OVERRIDE;
  const nowMs = override ? parseInt(override, 10) : Date.now();
  c.set("now", nowMs);
  await next();
});

// 3. Mount sub-app for /api with auth
const api = new Hono<{ Bindings: Bindings; Variables: Variables }>();
api.use("*", authMiddleware);

api.route("/queue", queueRoutes);
api.route("/tasks", tasksRoutes);
api.route("/history", historyRoutes);
api.route("/reminders", remindersRoutes);
api.route("/birthdays", birthdaysRoutes);
api.route("/devices", devicesRoutes);

// Mount under /api
app.route("/api", api);

// 4. Fallback for static assets in local/fallback mode (if run_worker_first is used)
app.all("*", (c) => {
  // If ASSETS binding exists, proxy to it (for SPA fallback)
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.notFound();
});

// Central error handler
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: { code: err.code, message: err.message } }, err.status);
  }
  
  // Zod validation errors from @hono/zod-validator
  if (err.name === "ZodError" || err.message.includes("Invalid HTTP header") || err.message.includes("Unexpected token")) {
     return c.json({ error: { code: "validation_error", message: err.message } }, 400);
  }

  // Log real error internally, return generic message to client
  console.error("Unhandled exception:", err);
  return c.json({ error: { code: "internal_error", message: "Internal server error" } }, 500);
});

app.notFound((c) => {
  return c.json({ error: { code: "not_found", message: "Not found" } }, 404);
});

export default app;
