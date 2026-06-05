import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

const LOCAL_D1_DIR = resolve(".wrangler/state/v3/d1/miniflare-D1DatabaseObject");

function readWranglerJsonc(path: string): Record<string, unknown> {
  const raw = readFileSync(path, "utf8");
  const stripped = raw.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  return JSON.parse(stripped) as Record<string, unknown>;
}

function getConfiguredD1DatabaseName(): string {
  const config = readWranglerJsonc(resolve("wrangler.jsonc"));
  const databases = config.d1_databases as Array<{ database_name?: string }> | undefined;
  const name = databases?.[0]?.database_name;
  if (!name) {
    throw new Error("wrangler.jsonc is missing d1_databases[0].database_name");
  }
  return name;
}

function hasD1Migrations(dbPath: string): boolean {
  try {
    const tables = execSync(`sqlite3 "${dbPath}" ".tables"`, { encoding: "utf8" });
    return tables.includes("d1_migrations");
  } catch {
    return false;
  }
}

function localD1DatabaseUrl(): string {
  if (process.env.DRIZZLE_DB_URL) {
    return process.env.DRIZZLE_DB_URL;
  }

  getConfiguredD1DatabaseName();

  if (!existsSync(LOCAL_D1_DIR)) {
    throw new Error(
      "Local D1 not found. Run `pnpm --filter api db:migrate` (or `pnpm --filter api db:clean`) first.",
    );
  }

  const dbPaths = readdirSync(LOCAL_D1_DIR)
    .filter((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite")
    .map((name) => join(LOCAL_D1_DIR, name))
    .filter(hasD1Migrations);

  if (dbPaths.length === 0) {
    throw new Error(
      "No migrated local D1 database found. Run `pnpm --filter api db:migrate` first.",
    );
  }

  if (dbPaths.length > 1) {
    throw new Error(
      `Found ${dbPaths.length} local D1 databases (expected 1). Run \`pnpm --filter api db:clean\` to reset.`,
    );
  }

  return `file:${dbPaths[0]}`;
}

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: localD1DatabaseUrl(),
  },
});
