import app from "./app.js";
import { makeDb } from "./db/client.js";
import { materialize } from "./data/materialize.js";
import type { Bindings } from "./env.js";

export default {
  // HTTP requests handler
  fetch: app.fetch,

  // Cron triggers
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    const db = makeDb(env.DB);
    const now = Date.now();
    
    // Background materialize
    ctx.waitUntil(materialize(db, now).catch(err => {
      console.error("Materialization cron failed:", err);
    }));
  },
};
