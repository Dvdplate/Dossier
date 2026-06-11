# DOSSIER

A calm, single-focus personal task tracker. One ordered queue where position is priority — the top task is always your current objective. Recurring reminders, a birthday tracker, and a mission log. Built as a React SPA on Cloudflare Workers + D1, with an optional Android app via Capacitor.

## Stack

- **API:** Hono on a Cloudflare Worker
- **Database:** Cloudflare D1 (SQLite) via Drizzle ORM
- **Frontend:** Vite + React + Tailwind CSS (browser SPA + optional Capacitor Android shell)
- **Auth:** ECDSA P-256 device key signing — no passwords
- **Timezone:** Africa/Johannesburg (SAST, UTC+2)

---

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create the D1 database

```bash
npx wrangler d1 create dossier-main-db
```

Copy the `database_id` from the output and paste it into `apps/api/wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "dossier-main-db",
    "database_id": "<paste your id here>",
    "migrations_dir": "drizzle"
  }
]
```

### 3. Apply migrations

```bash
pnpm --filter api db:migrate
```

### 4. Provision a device

Every request is authenticated by a device key pair — there are no passwords. Run this once per device (phone, desktop, browser profile):

```bash
pnpm add-device "My Phone"
```

This prints a JSON credential object. Register the device from an already-authenticated session in the **Devices** tab, then paste the credential JSON on the target device.

---

## Local development

Run both servers in separate terminals:

```bash
# Terminal 1 — Worker + local D1 (API on http://localhost:8787)
pnpm --filter api dev

# Terminal 2 — Vite dev server with HMR (proxies /api → :8787)
pnpm --filter web dev
```

Open `http://localhost:5173`. On first load the app will prompt for your device credential JSON.

### Trigger the scheduled handler locally

```bash
curl "http://localhost:8787/cdn-cgi/handler/scheduled"
```

This runs the recurring-reminder materialization once — useful for verifying a standing order fires correctly without waiting for the 10-minute cron.

---

## Build & check

```bash
pnpm build          # build all workspaces
pnpm typecheck      # TypeScript check across all packages
pnpm test           # run tests (API CORS + auth)
pnpm lint           # lint
```

Or per-package:

```bash
pnpm --filter api build       pnpm --filter web build
pnpm --filter api typecheck   pnpm --filter web typecheck
```

---

## Deploy

### 1. Apply migrations to remote D1

```bash
pnpm --filter api db:migrate:remote
```

### 2. Register at least one device for production

```bash
pnpm add-device "My Phone"
```

### 3. Build and deploy

```bash
pnpm deploy   # builds all workspaces, then wrangler deploy (Worker + apps/web/dist)
```

Or explicitly:

```bash
pnpm build && pnpm --filter api deploy
```

The Worker serves both the API at `/api/*` and the SPA at everything else.

---

## Android (Capacitor)

The Android app wraps the same React SPA in a Capacitor WebView. It talks to the deployed Worker over HTTPS with CORS — not the local dev server.

1. Set `VITE_API_BASE_URL` in `apps/web/.env.production` to your deployed Worker URL (e.g. `https://dossier.<account-subdomain>.workers.dev/api`). This file is committed; it contains only a public URL.
2. Build and sync the native project:

```bash
pnpm --filter web build:android
```

3. Open in Android Studio and run on an emulator or device:

```bash
pnpm --filter web android:open
```

4. Paste your device credential JSON when prompted — same flow as the browser app.

**Notes:**
- The default path is testing against the deployed HTTPS Worker. Pointing at a local Worker (`http://127.0.0.1:8787`) requires Android cleartext network configuration and is not the default setup.
- For live-reload during native development, temporarily add a `server.url` entry to `capacitor.config.ts` pointing at your Vite dev server — do not commit that change.

---

## How authentication works

Each device has an ECDSA P-256 key pair. The private key lives only in the device's localStorage — it never leaves the browser. Every API request is signed with it:

```
X-Device-Id:  <uuid>
X-Timestamp:  <unix seconds>
X-Signature:  <base64 ECDSA signature over "METHOD\npath\ntimestamp">
```

The Worker verifies the signature against the public key stored in D1. Requests with a missing, expired (>5 min), or invalid signature are rejected with 401.

To add a new device or revoke one, open the **Devices** tab while authenticated. Adding a device registers its public key and shows a credential JSON to copy to the new device. Paste that JSON on the target device to sign in — AuthGate only stores the credential locally.

The CLI (`pnpm add-device M5-Mac`) is a convenience for generating key pairs offline; the public key must still be registered via the Devices tab (or `db:studio` for the first bootstrap device).

---

## Project structure

```
apps/
  api/          Hono Worker — API routes, D1 schema, device auth, recurring-reminder materialization
  web/          Vite + React SPA (+ Capacitor Android) — focus queue, standing orders, black book, mission log
packages/
  core/         Shared pure logic: timezone utils, recurrence, birthday helpers, types + zod schemas
  config/       Shared Tailwind preset (007 First Light palette) and tsconfig base
docs/
  db.md         D1 schema, migrations, local dev, Drizzle Studio, troubleshooting
```

## Database management

```bash
pnpm --filter api db:generate        # drizzle-kit: schema → SQL migration
pnpm --filter api db:migrate         # apply migrations to local D1
pnpm --filter api db:migrate:remote  # apply migrations to remote D1
pnpm --filter api db:clean           # wipe local D1 and re-apply migrations
pnpm explorer                        # Drizzle Studio (inspect / manage local D1)
```

Migrations live in `apps/api/drizzle/` and are committed to version control. Never hand-edit an applied migration. See [docs/db.md](docs/db.md) for the full database guide.
