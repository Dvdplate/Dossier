# Database

DOSSIER stores all persistent data in **Cloudflare D1** — SQLite at the edge. The API accesses it through **Drizzle ORM**. The schema in `apps/api/src/db/schema.ts` is the source of truth; SQL migrations in `apps/api/drizzle/` are generated from it and applied with Wrangler.

---

## How it fits together

```
schema.ts  ──generate──▶  drizzle/*.sql  ──migrate──▶  D1 (local or remote)
     │                                                    │
     └──────────────── Drizzle ORM ◀── makeDb(c.env.DB) ──┘
                              │
                         data/*.ts  (queries)
                              │
                         routes/*.ts  (HTTP handlers)
```

On every request, the Worker builds a Drizzle client from the D1 binding:

```ts
// apps/api/src/db/client.ts
export function makeDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
```

Handlers stay thin: they validate input, call functions in `apps/api/src/data/`, and return JSON. Business logic that does not need the database lives in `packages/core/`.

---

## Configuration

All D1 settings live in `apps/api/wrangler.jsonc`.

| Field | Value | Notes |
|-------|-------|-------|
| Worker `name` | `dossier` | The deployed Worker name. **Not** used for `wrangler d1` commands. |
| `database_name` | `dossier-main-db` | Pass this to `wrangler d1 migrations apply`, `d1 execute`, etc. |
| `database_id` | `369ae0e5-8cdb-4142-87f8-97a0776a80ce` | Cloudflare resource ID (not secret, but tied to your account). |
| `binding` | `DB` | How the Worker reaches D1: `c.env.DB` / `env.DB`. |
| `migrations_dir` | `drizzle` | Relative to `apps/api/`. |

**Common mistake:** running `wrangler d1 migrations apply dossier` uses the Worker name and can create a second, stale local database. Always use `dossier-main-db`.

---

## Local vs remote

| Environment | Storage | How to migrate |
|-------------|---------|----------------|
| **Local dev** | `apps/api/.wrangler/state/v3/d1/` (git-ignored) | `pnpm --filter api db:migrate` |
| **Production** | Cloudflare D1 (`dossier-main-db`) | `pnpm --filter api db:migrate:remote` |

`pnpm --filter api dev` (Wrangler) uses a local D1 simulation backed by a single SQLite file under `.wrangler/`. Production uses the remote D1 binding with the same schema.

There should be **exactly one** local app database. If Drizzle Studio or migrations behave oddly, reset:

```bash
pnpm db:clean   # wipes local D1 state and re-applies all migrations
```

---

## Commands

From the repo root:

| Command | What it does |
|---------|----------------|
| `pnpm --filter api db:generate` | Diff `schema.ts` → new SQL file in `drizzle/` |
| `pnpm --filter api db:migrate` | Apply pending migrations to **local** D1 |
| `pnpm --filter api db:migrate:remote` | Apply pending migrations to **remote** D1 |
| `pnpm db:clean` | Delete local D1 state and re-migrate from scratch |
| `pnpm explorer` | Open Drizzle Studio (local D1 GUI) |

First-time local setup:

```bash
pnpm --filter api db:migrate
```

Deploy flow: generate (if schema changed) → migrate locally to verify → `db:migrate:remote` → deploy Worker.

---

## Drizzle Studio (`pnpm explorer`)

Studio connects to the local SQLite file via `apps/api/drizzle.config.ts`. It reads `database_name` from `wrangler.jsonc` and expects a single migrated database under `.wrangler/state/v3/d1/`.

Override the path if needed:

```bash
DRIZZLE_DB_URL="file:/absolute/path/to/db.sqlite" pnpm explorer
```

**Studio quirk:** empty form fields are sent as SQL `NULL`, which bypasses column defaults. For `created_at`, either:

- Omit the column in raw SQL (see below), or
- Paste a Unix timestamp in **milliseconds** (e.g. output of `node -e "console.log(Date.now())"`).

Example insert that lets defaults work:

```sql
INSERT INTO devices (id, nickname, public_key_jwk)
VALUES (
  'your-uuid-here',
  'My Device',
  '{"crv":"P-256","ext":true,"key_ops":["verify"],"kty":"EC","x":"...","y":"..."}'
);
```

---

## Schema change workflow

1. Edit `apps/api/src/db/schema.ts`.
2. Run `pnpm --filter api db:generate` — review the new file in `apps/api/drizzle/`.
3. Run `pnpm --filter api db:migrate` locally and test.
4. Commit the schema **and** the generated migration.
5. Before deploy: `pnpm --filter api db:migrate:remote`.

Rules:

- Never edit a migration that has already been applied (local or remote).
- Prefer additive changes; SQLite/D1 table rebuilds are expensive.
- Migrations are forward-only.

---

## Timestamps

All `created_at` columns are **Unix epoch milliseconds** (integer), not ISO date strings.

The database default (when the column is omitted from an insert):

```sql
cast(unixepoch('subsecond') * 1000 as integer)
```

The API also passes `nowMs` explicitly from request context where tests need a fixed clock. `completed_at`, `next_run_at`, and `last_fired_at` follow the same millisecond convention.

---

## Tables

### `tasks`

The focus queue. `position` (real) defines order within a status; lower = higher priority.

| Column | Type | Notes |
|--------|------|-------|
| `id` | integer | Auto-increment PK |
| `title` | text | Required |
| `notes` | text | Optional |
| `position` | real | Sort key within `status` |
| `status` | text | `active` \| `completed` (default `active`) |
| `origin` | text | `manual` \| `daily` \| `weekly` \| `monthly` (default `manual`) |
| `rule_id` | integer | FK → `recurring_rules.id`, `ON DELETE SET NULL` |
| `occurrence_key` | text | Unique per recurring firing; dedupes materialized tasks |
| `created_at` | integer | Ms since epoch; auto-default |
| `completed_at` | integer | Ms when completed; null while active |

Indexes: `(status, position)`, `(rule_id, status)`, unique `(occurrence_key)`.

### `recurring_rules`

Standing orders (daily / weekly / monthly reminders). A cron handler materializes due rules into `tasks`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | integer | Auto-increment PK |
| `title` | text | Task title when materialized |
| `type` | text | `daily` \| `weekly` \| `monthly` |
| `time_of_day` | text | Local `HH:MM` (Africa/Johannesburg in core logic) |
| `day_of_week` | integer | `0`–`6` (Sun–Sat); weekly only |
| `day_of_month` | integer | `1`–`31`; monthly only |
| `active` | integer | Boolean (default true) |
| `next_run_at` | integer | UTC epoch ms; when to fire next |
| `last_fired_at` | integer | UTC epoch ms; last materialization |
| `created_at` | integer | Auto-default |

Index: `(active, next_run_at)` — used by the materializer cron.

Materialization runs every 10 minutes (`wrangler.jsonc` cron) and via `GET /cdn-cgi/handler/scheduled` in local dev. Logic: `apps/api/src/data/materialize.ts` + `packages/core`.

### `birthdays`

Contacts for the Black Book.

| Column | Type | Notes |
|--------|------|-------|
| `id` | integer | Auto-increment PK |
| `name` | text | Required |
| `birth_month` | integer | `1`–`12` |
| `birth_day` | integer | `1`–`31` |
| `birth_year` | integer | Optional; enables age / “turning” labels |
| `note` | text | Optional |
| `created_at` | integer | Auto-default |

### `devices`

ECDSA P-256 public keys for request signing. No passwords.

| Column | Type | Notes |
|--------|------|-------|
| `id` | text | UUID string (PK). Must match `deviceId` in the client credential. |
| `nickname` | text | Display name |
| `public_key_jwk` | text | JSON string of the **public** JWK (`kty`, `crv`, `x`, `y`) |
| `created_at` | integer | Auto-default |

**Registering a device**

Normal flow: **Devices** tab in the app (while signed in on another device), or API `POST /api/devices`.

Bootstrap (first device, nothing registered yet):

```bash
pnpm add-device "My Mac"
```

Copy the printed UUID → `id`, public key JSON → `public_key_jwk`, paste credential JSON into AuthGate on that device.

`id` is **not** `0` or `1` — it must be the UUID from `crypto.randomUUID()`.

---

## Migrations on disk

```
apps/api/drizzle/
  0000_amazing_namora.sql   # tasks, recurring_rules, birthdays
  0001_tranquil_xavin.sql   # devices
  0002_absent_chronomancer.sql   # created_at defaults on all tables
```

Wrangler tracks applied migrations in the `d1_migrations` table inside D1.

---

## File reference

| Path | Role |
|------|------|
| `apps/api/src/db/schema.ts` | Drizzle schema (source of truth) |
| `apps/api/src/db/client.ts` | `makeDb()` factory |
| `apps/api/src/data/*.ts` | Queries and writes |
| `apps/api/drizzle/` | Generated SQL migrations |
| `apps/api/drizzle.config.ts` | drizzle-kit + Studio config (local SQLite path) |
| `apps/api/wrangler.jsonc` | D1 binding and migration dir |
| `apps/api/scripts/clean-local-db.sh` | Reset local D1 |
| `apps/api/scripts/setup-local-db.sh` | First-time migrate helper |

---

## Troubleshooting

**`NOT NULL constraint failed: devices.created_at` in Studio**  
Studio inserted `NULL` for an empty field. Use raw SQL without `created_at`, or paste `Date.now()` as an integer.

**Two local databases / wrong data in Studio**  
Something ran `wrangler d1` with the Worker name instead of `dossier-main-db`. Run `pnpm db:clean`.

**`No migrations present at .../migrations`**  
The migrate command used the wrong database name. Use `dossier-main-db` (see `apps/api/package.json` scripts).

**Schema changed but app still sees old columns**  
Apply migrations: local `db:migrate`, production `db:migrate:remote`.

**Port 4983 in use (`pnpm explorer`)**  
A previous Studio session is still running. Stop it or use `pnpm --filter api db:studio -- --port 4984`.
