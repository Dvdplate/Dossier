# AGENTS.md

Guidance for AI coding agents (and humans) working in this repository. Read it
before making changes.

Your Most important objective above all, is to produce clean, readable and easily human-maintainable code

## Stack

- **Language:** TypeScript everywhere.
- **Frontend:** Vite-bundled React, styled entirely with Tailwind CSS — a browser
  SPA with an optional Capacitor Android shell.
- **API:** Hono running on a Cloudflare Worker.
- **Database:** Cloudflare D1 (SQLite), accessed through Drizzle ORM, with schema
  and migrations managed by drizzle-kit.
- **Monorepo:** pnpm workspaces orchestrated with Turborepo.

## Project Overview

Briefly: what this product is and how the pieces fit.

- A full-stack TypeScript application split into deployable **apps** and reusable
  **packages** inside a single monorepo.
- `apps/web` is the React SPA (+ Capacitor Android); `apps/api` is a Hono Worker backed by D1.
- The frontend calls the Worker's HTTP API; both build on shared code in
  `packages/*`.

## Repository Layout

Where things live. Know this before you navigate.

```text
.
├── apps/
│   ├── web/                  # Vite + React SPA (Tailwind; Capacitor Android in android/)
│   └── api/                  # Hono app on a Cloudflare Worker
│       ├── src/
│       │   └── db/schema.ts  # Drizzle schema (source of truth)
│       ├── drizzle/          # Generated SQL migrations
│       ├── drizzle.config.ts # drizzle-kit config
│       └── wrangler.toml     # Worker config + D1 binding
├── packages/
│   ├── ui/                   # Shared React components (Tailwind)
│   ├── core/                 # Shared domain logic and types
│   └── config/               # Shared eslint / tsconfig / tailwind config
├── package.json              # Workspace root
├── pnpm-workspace.yaml
└── turbo.json                # Task pipeline
```

## Setup & Commands

Commands to know before changing anything. Prefer running checks **filtered** to
the package you touched, then the full pipeline before you finish.

**Use pnpm only.** Never run `npm` or `yarn` in this repo — a second lockfile
breaks the workspace. The version is pinned via the root `packageManager` field;
let Corepack honor it rather than installing pnpm another way.

```bash
# First-time setup
pnpm install
cp apps/api/.dev.vars.example apps/api/.dev.vars   # local Worker secrets
cp apps/web/.env.example apps/web/.env             # local frontend (VITE_*) vars

# Develop
pnpm --filter web dev          # Vite dev server (frontend)
pnpm --filter api dev          # wrangler dev (Worker + local D1)

# Verify
pnpm build                     # Vite build + Worker build across the graph
pnpm test                      # run all tests
pnpm --filter api test         # test one package
pnpm lint                      # lint
pnpm typecheck                 # type-check
pnpm format                    # format

# Database (D1 + Drizzle)
pnpm --filter api db:generate        # drizzle-kit generate (schema -> SQL migration)
pnpm --filter api db:migrate         # wrangler d1 migrations apply <DB> --local
pnpm --filter api db:migrate:remote  # wrangler d1 migrations apply <DB> --remote
pnpm --filter api db:studio          # drizzle-kit studio (inspect data)

# Deploy
pnpm --filter api deploy       # wrangler deploy

# Worker secrets (production)
wrangler secret put <KEY>      # never commit secrets
```

Run migrations locally before remote. A change is not done until the relevant
checks pass.

## Readable Code Above All

Code is read far more often than it is written. Optimize every change for the
next person who has to understand it.

- Clarity beats cleverness. If a reader has to pause to decode it, rewrite it.
- When readability conflicts with raw efficiency or a stylistic preference,
  readability wins, unless there is a measured, documented performance need.
- Favor the obvious solution over the impressive one.

## Minimalism

Minimalism here is about structure and linkage, not terse syntax or premature
optimization. It does **not** mean cutting features, degrading UX, or producing
something inferior. A minimal solution is a complete solution — one that does
everything it needs to do, with no unnecessary complexity layered on top.

- Use the fewest concepts, layers, and indirections needed to express the
  solution.
- Prefer deleting or merging over adding. Less code is less to read and break.
- Avoid speculative abstraction. Build for what is needed now, not for an
  imagined future.
- Never omit required functionality in the name of "keeping it simple". Simple
  means easy to understand and change, not incomplete or watered-down.
- The goal is code a newcomer can read and confidently modify — not code that
  does less.

## Structure & How Code Links Together

The shape of the system matters more than any single line — and in a monorepo,
the links between packages matter most.

- Clear module boundaries, obvious data flow, low coupling, high cohesion.
- Names and file layout should reveal intent and how pieces relate.
- Make dependencies explicit and, where possible, one-directional. Avoid hidden
  or circular links between modules.
- Import across packages only through their public entry points, never deep into
  internals.
- Apps depend on packages, never the reverse; packages must not depend on apps.
- A change to a shared package affects every consumer. Check the blast radius
  before editing it.

## Plan Before You Build

- State the smallest structural change that satisfies the goal before writing
  code.
- Identify which app or package owns the change before touching anything.
- Reuse existing patterns and files instead of introducing parallel ones.

## Frontend Conventions

For the Vite + React SPA.

- Keep components small and focused. Colocate state with the component that owns
  it; lift it only when it is genuinely shared.
- This is a client-rendered SPA: keep data fetching in a dedicated layer (hooks
  or a query client) that calls the Worker API, not scattered through components.
- Style only with Tailwind utility classes. Don't add a second styling system or
  reach for ad-hoc CSS files. Pull recurring patterns into `packages/ui`.
- Keep class lists legible — extract a component or a small `cn()` helper before
  a `className` grows unreadable.
- Client env vars must be `VITE_`-prefixed and are bundled into public output.
  Never put a secret in one.
- Mind the bundle: code-split routes and keep what ships to the client small.

## Android (Capacitor)

The native Android app is an online-only WebView shell — no service worker cache.

- Production Android builds bake in `VITE_API_BASE_URL` from `.env.production`
  (absolute Worker HTTPS URL). Browser dev keeps `/api` via the Vite proxy.
- After frontend changes that ship to Android, run `pnpm --filter web build:android`
  (`vite build` + `cap sync android`) before opening Android Studio.
- CORS on `/api` allows `https://localhost` and `capacitor://localhost` for the
  Capacitor WebView. Don't break same-origin `/api` for browser/Worker-hosted SPA.
- Optional live-reload via `server.url` in `capacitor.config.ts` is for local dev
  only — never commit it.

## Backend / API Conventions

For the Hono app on Cloudflare Workers.

- Validate input at the edge (e.g. a Hono validator) before it reaches any logic.
  Never trust the client.
- Keep handlers thin: validate, call domain logic, return a typed response. Put
  business logic in testable modules, ideally in shared `core`.
- Access bindings and secrets through the request context (`c.env`), never from
  module-level globals — bindings are request-scoped on Workers.
- Build the Drizzle client per request from the D1 binding (`drizzle(c.env.DB)`);
  keep queries in a data layer, not inline in routes.
- Return explicit, typed JSON errors via Hono's error handling. Don't leak
  internals or stack traces.
- Respect the Workers runtime: no Node-only APIs unless `nodejs_compat` is on,
  prefer Web APIs (fetch, Web Crypto), and keep handlers stateless and quick.

## Data & Migrations

The Drizzle schema is the source of truth. Schema changes are forward-only and
reviewed.

- Change the schema in `schema.ts`, then generate a migration with drizzle-kit.
  Never edit the database directly or hand-edit an already-applied migration.
- Apply migrations to local D1 first, then remote. Remote changes hit production.
- D1 is SQLite: prefer additive changes. Some column alterations require a table
  rebuild, so plan and coordinate destructive changes carefully.
- Commit the generated migration files. Keep seed data in version control,
  minimal and deterministic.

## Dependencies

A new library is new surface to read, learn, and maintain.

- Don't add a dependency to save a few lines you could write clearly yourself.
- Add it with `pnpm add <pkg> --filter <workspace>` — to the specific workspace
  that needs it, not the root, unless it is shared tooling.
- For the Worker, prefer libraries that run on the Workers runtime and keep the
  bundle small; avoid Node-only packages.
- Avoid duplicate or conflicting versions across packages. Justify any addition
  against what it replaces.

## Testing — Prove It Works

A change isn't done until it's verified.

- Add or update tests for the behavior you changed. Never weaken or delete a test
  to make it pass.
- Unit-test logic with Vitest. Test Worker routes against a local D1 (e.g. the
  Workers Vitest pool) so bindings behave realistically.
- Cover key flows with end-to-end tests where practical.
- Run the checks for the package you touched, then the full pipeline, before
  finishing.

## Stay In Scope

- Change only what the task requires. No drive-by refactors or reformatting of
  untouched code.
- Don't edit packages unrelated to the task. Keep the blast radius small.
- Keep diffs focused — a reviewer should see only what the change needs.
- Note unrelated problems instead of fixing them inline.

## When Unsure, Surface It

- If the goal is ambiguous or there are real tradeoffs, state them and ask rather
  than guessing.
- Prefer a small, reversible step over a large, speculative one.
- Don't invent requirements or scope that wasn't asked for.

## Git, Commits & PRs

Small, legible history.

- Keep commits focused and message them by intent: what changed and why.
- Follow the repo's commit convention (e.g. Conventional Commits) if one exists.
- Keep PRs small and single-purpose. Large changes are hard to review and revert.
- Never commit secrets, build output, or local state — keep `.dev.vars`, `.env`,
  `.wrangler/`, and `dist/` out of git.
- Ensure lint, types, and tests pass before opening a PR.

## Security, Secrets & Config

Treat every input and secret with suspicion.

- Worker secrets go through `wrangler secret put` (production) and `.dev.vars`
  (local, git-ignored). Read them via `c.env`, never hardcoded.
- `wrangler.toml` holds bindings and config (D1 binding, database id). Those ids
  are not secrets, but tokens and keys never belong there.
- Anything prefixed `VITE_` is shipped to the browser and is public. Never put a
  secret in client env.
- Validate and sanitize all external input; enforce authorization on every
  protected route. Use Web Crypto rather than rolling your own.
- Don't log secrets or personal data. Keep dependencies patched.

## Execution Checklist

- Does this reduce, or at least not add, structural complexity?
- Can a newcomer trace the flow end to end without explanation?
- Did you change only the app or package the task requires?
- For schema changes: is there a generated migration, applied locally?
- Are there tests for the new behavior, and does the full suite (build, types,
  tests) pass?
- For Android-impacting frontend changes: did `build:android` succeed and sync?
- Is the diff free of secrets, client-exposed secrets, build output, and
  unrelated changes?