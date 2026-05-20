# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Internal field-service tool for **A&R Optical Equipment (Thailand)**. Tracks service cases, machines, customers, engineer timesheets, PM checklists, and clock-in/clock-out sessions. Phase 1 is open-access (no auth yet); the active engineer is **hardcoded `me = 'JKH'`** across server actions until auth lands (Sprint 6).

Stack: Next.js 15 (App Router, Turbopack) + React 19 + TypeScript (strict) + Tailwind v4 (CSS-first via `@theme` in `globals.css`, no `tailwind.config.ts`) + Supabase (Postgres + `@supabase/ssr`). Deployed on Vercel.

**Active branch is `redesign`** — full UI rebuild from scratch on top of the existing server actions / lib / Supabase schema. `main` still holds the legacy UI. The redesign-branch commits (`phase 0` → `phase 3b`) are the source of truth for the current app.

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

When you add a schema change, create the next numbered file (`sql/10_*.sql`) rather than editing an applied one.

Current migrations:

| File | Purpose |
|---|---|
| `01_migration.sql` | Base schema (cases, customers, machines, engineers, sessions, refs, admin_log, checklist tables) |
| `02_seed_checklists.sql` | ~460 PM checklist items across 6 machine templates (DLM, MCVP4, MCVP8-V1/V2, SPV2, SPV3) |
| `03_workforce_approvals.sql` | `approval_status` enum on sessions, `session_approval_log`, engineer roles |
| `04_shared_sessions.sql` | `is_shared` flag + `idx_sessions_engineer_date_raw` for cross-SO copy-paste detection |
| `05_new_case_workflow.sql` | `case_machines` junction + `project_mapping` table (backfills from `cases.machine_no`) |
| `06_contacts_and_machine_fields.sql` | Customer contacts + extra machine columns |
| `07_planning_type_code.sql` | `type_code` backfill on sessions (T/V/A/WFH/OFF/AL/SICK/PERS/WKND) |
| `08_sessions_nullable_so.sql` | Drops NOT NULL on `sessions.so_number` for leave types (AL/SICK/PERS) |
| `09_clockin.sql` | Adds `clock_in_at`, `clock_out_at`, `paused_at`, `paused_total_minutes` + `idx_sessions_active` partial index |

⚠️ **Migration drift is a real footgun** — Supabase joins to a missing table return `[]` *silently* (no error). If a query that should return rows returns empty, verify the table actually exists in the DB before debugging code. Use the Supabase MCP `list_tables` or a SQL probe.

## Supabase client selection (important)

Three factories live in `src/lib/supabase/`. Pick the right one — using the wrong one is a real bug source:

- `client.ts` → `createClient()` — browser only, anon key, uses `@supabase/ssr`'s `createBrowserClient`.
- `server.ts` → `await createClient()` — Server Components / route handlers, anon key, reads cookies. Use for read paths that should respect future RLS.
- `service.ts` → `createServiceClient()` — **server-only**, service-role key, bypasses RLS. Required for all writes (server actions, admin tools). Never import this from a `"use client"` file.

Pages that do live reads should export `export const dynamic = "force-dynamic";` (most already do) so Next.js doesn't statically cache Supabase queries.

## Architecture

### Routes (App Router, `src/app/`)

Server Components for data fetching, Client Components for interaction, Server Actions in `actions.ts` files for mutations. Almost every mutating page follows the pattern: `page.tsx` (server, reads via service client) → `*-client.tsx` or `form.tsx` (client) → `actions.ts` (`"use server"`, service client + `revalidatePath`).

Top-level routes (redesign branch): `/` (dashboard), `/cases`, `/cases/new`, `/cases/[so_number]`, `/customers`, `/machines`, `/machines/[machine_no]`, `/engineers` (timesheet), `/planning`, `/workforce`, `/admin/bulk-reparse`, `/me` (profile + role switcher).

`/workforce` is **one route with three tabs** (`?tab=plan|hours|queue`) — the page reads `searchParams.tab` and dispatches to `PlanView` / `HoursView` / `QueueView`. Add new workforce features as tabs, not sibling routes.

Path alias `@/*` → `src/*` (tsconfig). Use it instead of relative paths beyond one level.

### Design system (`src/app/globals.css` + `src/components/`)

Tailwind v4 with **CSS-first config** — design tokens are CSS custom properties under `:root` in `globals.css`. No `tailwind.config.ts`. Token families:

- **Brand**: `--red` (#C8102E), `--red-50/100/200/700/line` for tinted surfaces.
- **Surfaces / lines / ink**: `--bg`, `--surface`, `--surface-2`, `--line`, `--line-2`, `--ink` → `--ink-5`.
- **Status**: `--ok / info / warn / danger` (+`-soft` for backgrounds).
- **Session-type chips**: `--t-bg/fg`, `--v-bg/fg`, `--a/pers/al/sick/wfh/off/wknd-*` (matches D365 type codes).
- **Radii / tap**: `--r-xs..2xl`, `--tap` (44px), `--tap-lg` (52px).
- **Fonts**: `--sans` (Inter + Sarabun for Thai), `--mono` (JetBrains Mono).

Dark mode is wired (`[data-theme="dark"]`) but the toggle is not exposed yet.

**Component primitives** (`src/components/primitives/`): `Avatar`, `StatusPill`, `ServiceChip`, `CodeBadge`, `TypeBlock`, `SectionHeader`, `SyncChip`. Use these instead of redefining inline.

**Icons** (`src/components/icons.tsx`): single `<Icon name={...}/>` component with a typed `IconName` union — extend the union and the switch when adding glyphs.

**Format helpers** (`src/lib/format.ts`): `fmtDate`, `fmtTime`, `fmtDay`, `statusBadge`, `activityBadge`, `referenceTypeBadge`, `adminEventLabel`. Extend this file rather than re-defining badge colors in pages.

### Responsive shell (`src/components/shell.tsx`)

One shell renders both layouts via CSS visibility — **not** separate routes:

- **Mobile (`< 768px`)**: top `AppBar` + `BottomNav`. Sheets slide up from the bottom (`src/components/sheet.tsx`).
- **Desktop (`≥ 768px`, `md:`)**: `Sidebar` (left) + `DesktopTop` (top). BottomNav is hidden.
- `OfflineBanner` mounts globally and shows a red strip when `navigator.onLine === false`.
- `TimerChip` (top bar) and notifications `Bell` are rendered in both AppBar and DesktopTop.

Use `md:hidden` / `hidden md:block` to gate per-layout DOM. Do **not** create parallel mobile/desktop route trees.

### Clock-in system (`src/lib/clock/`, `src/app/clock/actions.ts`, `src/components/clock/`)

Only-one-active-session-per-engineer model. State is **derived from columns**, no status enum:

- Active session = `clock_in_at IS NOT NULL AND clock_out_at IS NULL AND engineer_code = me`.
- Paused = `paused_at IS NOT NULL`. `paused_total_minutes` accumulates across pauses.
- Sessions can have **null `so_number`** for open clock-ins / leave types — see `sql/08_sessions_nullable_so.sql`. Don't add a NOT NULL assumption back.

Server actions in `src/app/clock/actions.ts` (all use `ME = 'JKH'`):

- `clockIn({so_number, machine_no, activity_type})` — rejects if engineer already has an active session.
- `pauseSession(id)` / `resumeSession(id)` — sets/clears `paused_at`, accumulates `paused_total_minutes` on resume.
- `clockOut(id, review)` — finalizes; splits elapsed minutes minus travel/break across `work_minutes` / `travel_minutes` / `office_minutes` based on `activity_type` (`office` → office bucket, `travel` → travel bucket, else → work bucket).
- `switchActiveCase(id, new_so, new_machine)` — preserves `clock_in_at` + `paused_total`; mid-session SO swap.
- `changeActivity(id, new_activity_type)` — updates `activity_type` + `type_code` mid-session; new time logs to the new bucket on next clock-out.
- `editStartTime(id, new_clock_in_iso)` — backdate the clock-in (must be in past).
- `listMyActiveCasesForSwitch(currentSo)` — uses `cases.machine_no` **directly**, not the `case_machines` junction, for resilience against migration drift.

Components in `src/components/clock/`:

- `SmartStartCTA` — Dashboard hero when no active session. Picks next case, opens `CasePickerSheet`.
- `ActiveSessionCard` / `TimerChip` — Live counter (refresh every 1s via `setInterval` in `useEffect`). Tap → `ActiveSessionSheet`.
- `ActiveSessionSheet` — Big timer, pause/resume, clock-out, plus 3 row-link secondary actions (switch case / change activity / edit start time) that open their own sheets.
- `ClockOutReviewSheet` — Editable travel/break/notes + "Submit immediately" toggle (sets `approval_status='submitted'` + writes `session_approval_log`).

### PM Checklist (`src/lib/checklist.ts` + `src/app/cases/[so_number]/checklist-*`)

Tables already exist (seeded ~460 items across 6 templates in `sql/02`). The redesign added the UI:

- `src/lib/checklist.ts` — `machineTypeFor(productCode)` + `eligibleForChecklist(serviceTypeCode)` lookup. Only PM (service_type `7507`) + known product codes (DLM / MCVP4 / MCVP8-V1 / MCVP8-V2 / SPV2 / SPV3) show a checklist; everything else gets a placeholder Tasks tab.
- `src/app/cases/[so_number]/checklist-actions.ts` — `ensureCaseChecklist`, `toggleChecklistItem`, `completeCaseChecklist`.
- `ChecklistTab` (`checklist-tab.tsx`) renders collapsible sections with per-item checkbox + remark input, progress bar in header.

Photo upload is not wired yet (deferred — needs Supabase Storage).

### Notifications (`src/components/notifications/`)

Bell in top bar. Unions `session_approval_log` + `admin_log` for cases assigned to me, sorts desc, limit 50. **Unread tracked in localStorage** under `aroet_notif_seen_at` (single timestamp). "Mark all read" updates the key to now. No `is_read` column added — defer until auth.

Panel is a Sheet on mobile, popover on desktop (click-outside dismiss).

### Role switcher (`src/app/me/`)

`/me` page shows profile + counts + a role toggle. Writes `localStorage.aroet_role = 'admin' | 'engineer'`. **No server-side gating yet** — sidebar still shows all sections. The toggle currently only flips a client-rendered "Admin mode" badge. Full role gating ships with auth.

### Planner parser (`src/lib/planner/parser.ts`)

The parser is the core of the data pipeline. Engineers paste free-form text into `cases.planner_note`; `parsePlannerNote()` extracts three structured outputs:

1. **Sessions** — per-engineer, per-day time tracking (travel/work/break/office minutes, activity type, weekend/holiday flags).
2. **References** — CS / GI / GT / Invoice / Quote numbers.
3. **Admin log** — invoice_sent, rs_done, acceptance_signed, etc.

Critical invariants when touching this code or any reparse flow:

- Every parser-generated row carries `source = 'planner'`; manual entries (including clock-in sessions) carry `source = 'manual'`. **Reparse must only delete `source='planner'` rows** — never wipe manual entries. The reparse server actions (`src/app/cases/[so_number]/actions.ts`, `src/app/admin/bulk-reparse/actions.ts`) rely on this.
- Known engineer codes are hardcoded in `KNOWN_ENGINEERS` in `parser.ts`. New engineers must be added there or they'll be silently dropped.
- Bulk reparse processes in batches of 25 (`BATCH_SIZE` in `admin/bulk-reparse/actions.ts`); the client calls the action repeatedly with `batchStart` until `hasMore` is false. Don't convert it to a single long-running call.
- Sessions can be flagged `is_shared` when the same engineer-date-raw_line appears on multiple SOs (engineer copy-pasted into several cases). Detection happens during parse via the `idx_sessions_engineer_date_raw` index.

### Workforce approvals

Sessions move through `approval_status` = `draft` → `submitted` → `approved` | `returned`. Every transition writes a row to `session_approval_log` (audit). Engineer roles (`engineers.role`) are `engineer | tech_manager | admin | boss`, backfilled in `sql/03_workforce_approvals.sql`. The active-engineer constant (`ME = 'JKH'` in `src/app/clock/actions.ts` and `currentUserCode()` in `src/app/workforce/actions.ts`) is the auth seam — replace those (not the call sites) when wiring real auth.

### Service types (`src/lib/service-types.ts`)

9 D365 service type codes: `7505 Curative`, `7506 ...`, `7507 PM`, etc. Use `findServiceType(code)` instead of hardcoding labels. `7507` is the gate for PM checklist eligibility.

### Pay periods (`src/lib/pay-period.ts`)

Pay period helpers understand multiple presets (`month | h1_1_15 | h2_16_end | h1_1_20 | h2_21_end | custom`); use `computePayPeriod()` rather than hand-rolling date math in new timesheet views.

## Auth seam (where to swap when Sprint 6 lands)

Replace these constants — **not** the call sites — when wiring real auth:

- `ME = 'JKH'` in `src/app/clock/actions.ts`
- `currentUserCode()` in `src/app/workforce/actions.ts`
- `ROLE = 'admin'` hardcoded in `src/components/shell.tsx`
- `localStorage.aroet_role` toggle in `src/app/me/role-switcher.tsx`
