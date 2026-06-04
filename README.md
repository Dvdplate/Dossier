# DOSSIER

A calm, single-focus personal task tracker. One ordered queue where position is priority — the top task is always your current objective. Recurring reminders, a birthday tracker, and a mission log. Built as an installable PWA on Cloudflare Workers + D1.

## Stack

- **API:** Hono on a Cloudflare Worker
- **Database:** Cloudflare D1 (SQLite) via Drizzle ORM
- **Frontend:** Vite + React + Tailwind CSS, shipped as a PWA
- **Timezone:** Africa/Johannesburg (SAST, UTC+2)

---

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create the D1 database

```bash
npx wrangler d1 create quest-maker-v3
```

Copy the `database_id` from the output and paste it into `apps/api/wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "quest-maker-v3",
    "database_id": "<paste your id here>",
    "migrations_dir": "drizzle"
  }
]
```

### 3. Generate and apply migrations

```bash
# Generate SQL from the Drizzle schema (already done — committed in apps/api/drizzle/)
pnpm --filter api db:generate

# Apply to local D1
pnpm --filter api db:migrate
```

### 4. Configure local secrets (optional)

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars
```

Set `AUTH_TOKEN` in `.dev.vars` if you want the local API to require a bearer token. Leave it blank to run the API open.

> **Security note:** The Black Book stores names and dates of note for real people. For any remote (non-localhost) deployment, set an `AUTH_TOKEN` so the API isn't publicly readable.

---

## Local development

Run both servers in separate terminals:

```bash
# Terminal 1 — Worker + local D1 (API on http://localhost:8787)
pnpm --filter api dev

# Terminal 2 — Vite dev server with HMR (proxies /api → :8787)
pnpm --filter web dev
```

Open `http://localhost:5173`.

### Trigger the scheduled handler locally

```bash
curl "http://localhost:8787/cdn-cgi/handler/scheduled"
```

This runs the recurring-reminder materialization once — useful for testing that a standing order fires correctly without waiting for the 10-minute cron.

---

## Build

```bash
pnpm build          # typecheck + build all workspaces
pnpm typecheck      # TypeScript check across all packages
pnpm test           # run all test suites
pnpm lint           # lint
```

---

## Deploy

### 1. Apply migrations to the remote D1

```bash
pnpm --filter api db:migrate:remote
```

### 2. Set a production auth token (recommended)

```bash
npx wrangler secret put AUTH_TOKEN
```

Enter a strong random string. The installed app will prompt you once on first open and store the token locally.

### 3. Build the frontend and deploy the Worker

```bash
pnpm --filter web build          # builds apps/web/dist
pnpm --filter api deploy         # wrangler deploy (bundles Worker + uploads assets)
```

The Worker serves both the API at `/api/*` and the SPA at everything else.

---

## Icon generation

PNG icons (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon-180.png`) are committed in `apps/web/public/icons/`. If you edit `emblem.svg`, regenerate them:

```bash
pnpm --filter web build:icons
```

Requires `sharp` (already a devDependency of `apps/web`).

---

## Project structure

```
apps/
  api/          Hono Worker — API routes, D1 schema, recurring-reminder materialization
  web/          Vite + React PWA — focus queue, standing orders, black book, mission log
packages/
  core/         Shared pure logic: timezone utils, recurrence, birthday helpers, types + zod schemas
  config/       Shared Tailwind preset (007 First Light palette) and tsconfig base
```

## Database management

```bash
pnpm --filter api db:generate        # drizzle-kit: schema → SQL migration
pnpm --filter api db:migrate         # apply migrations to local D1
pnpm --filter api db:migrate:remote  # apply migrations to remote D1
pnpm --filter api db:studio          # Drizzle Studio (requires D1 HTTP credentials)
```

Migrations live in `apps/api/drizzle/` and are committed to version control. Never hand-edit an applied migration.
