# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Internal field-service tool for **A&R Optical Equipment (Thailand)**. Tracks service cases, machines, customers, engineer timesheets, and PM checklist scaffolding. Phase 1 is open-access (no auth yet); a stub `currentUserCode()` returns `'SYSTEM'` until auth lands.

Stack: Next.js 15 (App Router, Turbopack) + React 19 + TypeScript (strict) + Tailwind v4 + Supabase (Postgres + `@supabase/ssr`). Deployed on Vercel from `main`.

## Commands

```bash
npm run dev      # next dev --turbopack
npm run build    # next build --turbopack
npm start        # next start
```

There is **no** lint script, no test runner, and no `tsc` script — type errors surface only via `npm run build` or the IDE. If you add tests/lint, wire them into `package.json` so future runs find them.

## Environment

`.env.local` must contain three vars; server actions throw clear errors when `SUPABASE_SERVICE_ROLE_KEY` is missing.

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

The same vars must be set in Vercel project settings.

## Database

Supabase Postgres. There is no migration framework — SQL files in `sql/` are run **in numbered order** by hand in the Supabase SQL Editor when introducing schema changes. Each file is written to be re-runnable (`if not exists`, idempotent backfills). RLS is **disabled** on app tables (Phase 1).

When you add a schema change, create the next numbered file (`sql/09_*.sql`) rather than editing an applied one.

## Supabase client selection (important)

Three factories live in `src/lib/supabase/`. Pick the right one — using the wrong one is a real bug source:

- `client.ts` → `createClient()` — browser only, anon key, uses `@supabase/ssr`'s `createBrowserClient`.
- `server.ts` → `await createClient()` — Server Components / route handlers, anon key, reads cookies. Use for read paths that should respect future RLS.
- `service.ts` → `createServiceClient()` — **server-only**, service-role key, bypasses RLS. Required for all writes (server actions, admin tools). Never import this from a `"use client"` file.

Pages that do live reads should export `export const dynamic = "force-dynamic";` (most already do) so Next.js doesn't statically cache Supabase queries.

## Architecture

### Routes (App Router, `src/app/`)

Server Components for data fetching, Client Components for interaction, Server Actions in `actions.ts` files for mutations. Almost every mutating page follows the pattern: `page.tsx` (server, reads via service client) → `*-client.tsx` or `form.tsx` (client) → `actions.ts` (`"use server"`, service client + `revalidatePath`).

Top-level routes: `/` (dashboard), `/cases`, `/cases/new`, `/cases/[so_number]`, `/customers`, `/machines`, `/machines/[machine_no]`, `/engineers` (timesheet), `/planning`, `/workforce`, `/admin/bulk-reparse`.

`/workforce` is **one route with three tabs** (`?tab=plan|hours|queue`) — the page reads `searchParams.tab` and dispatches to `PlanView` / `HoursView` / `QueueView`. Add new workforce features as tabs, not sibling routes.

Path alias `@/*` → `src/*` (tsconfig). Use it instead of relative paths beyond one level.

### Planner parser (`src/lib/planner/parser.ts`)

The parser is the core of the data pipeline. Engineers paste free-form text into `cases.planner_note`; `parsePlannerNote()` extracts three structured outputs:

1. **Sessions** — per-engineer, per-day time tracking (travel/work/break/office minutes, activity type, weekend/holiday flags).
2. **References** — CS / GI / GT / Invoice / Quote numbers.
3. **Admin log** — invoice_sent, rs_done, acceptance_signed, etc.

Critical invariants when touching this code or any reparse flow:

- Every parser-generated row carries `source = 'planner'`; manual entries carry `source = 'manual'`. **Reparse must only delete `source='planner'` rows** — never wipe manual entries. The reparse server actions (`src/app/cases/[so_number]/actions.ts`, `src/app/admin/bulk-reparse/actions.ts`) rely on this.
- Known engineer codes are hardcoded in `KNOWN_ENGINEERS` in `parser.ts`. New engineers must be added there or they'll be silently dropped.
- Bulk reparse processes in batches of 25 (`BATCH_SIZE` in `admin/bulk-reparse/actions.ts`); the client calls the action repeatedly with `batchStart` until `hasMore` is false. Don't convert it to a single long-running call.
- Sessions can be flagged `is_shared` when the same engineer-date-raw_line appears on multiple SOs (engineer copy-pasted into several cases). Detection happens during parse via the `idx_sessions_engineer_date_raw` index.
- Sessions may have **null `so_number`** for leave types (AL/SICK/PERS) — see `sql/08_sessions_nullable_so.sql`. Don't add a NOT NULL assumption back.

### Workforce approvals

Sessions move through `approval_status` = `draft` → `submitted` → `approved` | `returned`. Every transition writes a row to `session_approval_log` (audit). Engineer roles (`engineers.role`) are `engineer | tech_manager | admin | boss`, backfilled in `sql/03_workforce_approvals.sql`. The `currentUserCode()` stub in `src/app/workforce/actions.ts` is the auth seam — replace it (not the call sites) when wiring real auth.

### UI conventions

Brand color is AR red `#C8102E` (used in `top-nav.tsx`). Shared badge/format helpers (status, activity, reference type, admin event labels, date/time formatters) live in `src/lib/format.ts` — extend that file rather than re-defining badge colors in pages.

Pay period helpers in `src/lib/pay-period.ts` understand multiple presets (`month | h1_1_15 | h2_16_end | h1_1_20 | h2_21_end | custom`); use `computePayPeriod()` rather than hand-rolling date math in new timesheet views.
