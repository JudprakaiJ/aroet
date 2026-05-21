# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Internal field-service tool for **A&R Optical Equipment (Thailand)**. Tracks service cases, machines, customers, engineer timesheets, PM checklists, and clock-in/clock-out sessions. Phase 1 was open-access; engineer identity is still **hardcoded `me = 'JKH'`** across server actions until auth lands (Sprint 6). **Admin identity for approval/reparse uses a `aroet_acting_as` cookie** set from `/me` (PPI / CCH / LRO / SPE), so the demo can show approver attribution working without real auth.

Stack: Next.js 15 (App Router, Turbopack) + React 19 + TypeScript (strict) + Tailwind v4 (CSS-first via `@theme` in `globals.css`, no `tailwind.config.ts`) + Supabase (Postgres + `@supabase/ssr`). Deployed on Vercel.

**Active branch is `redesign`** — full UI rebuild from scratch on top of the existing server actions / lib / Supabase schema. `main` still holds the legacy UI. Once the redesign branch is ready, merge `redesign` → `main`. Commits `phase 0` → `phase 5P` are the source of truth for the current app.

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

When you add a schema change, create the next numbered file (`sql/11_*.sql`) rather than editing an applied one.

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
| `08_sessions_nullable_so.sql` | Drops NOT NULL on `sessions.so_number` for leave + office types |
| `09_clockin.sql` | Adds `clock_in_at`, `clock_out_at`, `paused_at`, `paused_total_minutes` + `idx_sessions_active` partial index |
| `10_checklist_per_machine.sql` | **Per-machine PM checklist** — backfills `case_checklists.machine_no` (primary first, fallback to `cases.machine_no`), UNIQUE on `(so_number, machine_no)`, supporting index |
| `11_grant_service_role.sql` | **Grants service_role write on every public table** + default privileges. Without this, server actions using `createServiceClient()` hit `permission denied for table ...` on INSERT/UPDATE because earlier migrations only granted `anon, authenticated`. |
| `12_auth.sql` | Phase 6 PIN auth: `engineers.pin_hash` column + `login_attempts` rate-limit table + bumps JKH to `role='admin'` for demo. |
| `13_customer_geo_cleanup.sql` | Data cleanup of `customers.city` / `customers.country`: standalone country names smashed in city, "<city>, COUNTRY" jammed in one field, "<postal> COUNTRY" no-comma cases, trailing commas, and country inference from company name. Re-runnable. |
| `14_drop_cases_description.sql` | **⚠ pending — not applied yet (verified 2026-05-20).** Drops the legacy `cases.description` column. The code stopped reading/writing it in phase 6f (Subject field has been the only entry point since phase 5P). Safe to run any time. |
| `15_drop_machines_version.sql` | Applied (verified 2026-05-20). Dropped the `machines.version` column. Phase 6g consolidated "machine type" onto `product_code` — MCVP8 V1/V2 distinction now lives in the product code itself (`MCVP8V1` vs `MCVP8V2`), which is what the checklist resolver already keyed on. |
| `16_clean_checklist_text.sql` | Applied (verified 2026-05-20). Phase 6h-2 cleanup of the Belgian-English in `checklist_items.text` (322 of 460 items). Idempotent — keyed on `(machine_type, version, section_no, item_no)` with `text <> new_text` guard, so re-runs are no-ops. Engineer pass/fail results key off `item_id` so this is a pure text refresh. Canonical source is `sql/checklist-data.json`. |
| `17_admin_log_assignment_event.sql` | **⚠ pending — not applied yet.** Phase 6k-4: extends `admin_log.event_type` CHECK to allow `'engineer_assigned'`. Without it, `createCase` / `updateCase` write the notification row that silently fails on the constraint — case is created but assigned engineers don't get the Bell notification. Re-runnable. |
| `18_sessions_source_planning.sql` | **⚠ pending — not applied yet.** Phase 6l-2: extends `sessions.source` CHECK from `('manual','planner')` to `('manual','planner','planning')`. Without it, both the `/planning` grid (since Phase 5j!) AND the new case-form Plan dates picker fail with `sessions_source_check` violation. This is why no `source='planning'` rows existed in the DB before — the feature was silently broken. Re-runnable. |

⚠️ **Migration drift is a real footgun** — Supabase joins to a missing table return `[]` *silently* (no error). If a query that should return rows returns empty, verify the table actually exists in the DB before debugging code. Use the Supabase MCP `list_tables` or a SQL probe.

⚠️ **Supabase nested selects need an FK** — `cases.customer_code` has no FK to `customers`, so a query like `cases.select(\"..., customers(city, country)\")` silently returns `data = null` with an error. Always query customers separately and join in JS for that relation. (Same caveat applies to any table without an explicit FK constraint.)

## Supabase client selection (important)

Three factories live in `src/lib/supabase/`. Pick the right one — using the wrong one is a real bug source:

- `client.ts` → `createClient()` — browser only, anon key, uses `@supabase/ssr`'s `createBrowserClient`.
- `server.ts` → `await createClient()` — Server Components / route handlers, anon key, reads cookies. Use for read paths that should respect future RLS.
- `service.ts` → `createServiceClient()` — **server-only**, service-role key, bypasses RLS. Required for all writes (server actions, admin tools). Never import this from a `"use client"` file.

Pages that do live reads should export `export const dynamic = "force-dynamic";` (most already do) so Next.js doesn't statically cache Supabase queries.

## Architecture

### Routes (App Router, `src/app/`)

Server Components for data fetching, Client Components for interaction, Server Actions in `actions.ts` files for mutations. Almost every mutating page follows the pattern: `page.tsx` (server, reads via service client) → `*-client.tsx` or `*-section.tsx` (client) → `actions.ts` (`"use server"`, service client + `revalidatePath`).

Top-level routes (redesign branch, all live):

| Route | Owner | Purpose |
|---|---|---|
| `/` | engineer | Dashboard: QuickActionsHero (inline Case/Travel/Office + Planned-today + Continue-last suggestions), stale-session banner, my cases, today, upcoming |
| `/cases` | engineer | Detail-card list (responsive grid 1/2/3 cols) with flag + customer/city, machine+serial list, collapsed planned-date ranges, hours logged, team avatars. Filter rail + scope chips. |
| `/cases/new` | engineer | Smart-paste + manual create. Multi-machine + inline machine register |
| `/cases/[so_number]` | engineer | Card-style hero (SO + flag + customer/city + subject + machines/serials + Plan + Hours + Team) + 4 tabs (Sessions / Checklist / Refs / Admin) + footer "See similar →" link + Edit case sheet (mirrors create form: customer, machines, lead+team, service type, due, Plan dates) |
| `/customers` + `/customers/[code]` | admin | List + detail with Contacts / Machines / Cases tabs. Admin: "+ New customer", Edit / Delete (guarded), Add/Edit/Delete contact, Add machine pre-filled with this customer |
| `/machines` + `/machines/[machine_no]` | admin | List + service history per machine. Admin: "+ New machine" (customer picker), Edit / Delete (guarded) |
| `/planning` | all | Engineer × N-day grid (1w/2w/4w). Click any cell to assign / edit |
| `/workforce` | all | Pay-period Hours timesheet. Edit / add / delete sessions inline |
| `/workforce/queue` | admin | Approvals queue grouped by engineer. Approve / bulk-approve / return-with-reason |
| `/admin/checklists` + `/admin/checklists/[id]` | admin | PM checklist template editor — list, create, edit template / sections / items, duplicate templates, ↑↓ reorder, bulk-paste items. Schema unchanged. |
| `/admin/bulk-reparse` | admin | Batched reparse of all planner notes with live progress |
| `/me` | engineer | Profile + (legacy) demo role toggle + shortcuts. Real role + identity come from `currentUser()` since phase 6a. |

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

**Component primitives** (`src/components/primitives/`): `Avatar`, `StatusPill`, `ServiceChip`, `CodeBadge`, `TypeBlock`, `SectionHeader`, `SyncChip`, `EmptyState`, `Skeleton` / `SkeletonRow` / `SkeletonCard` / `SkeletonAppBar`. Use these instead of redefining inline.

**Cases primitives** (`src/app/cases/`): `case-card.tsx` (`CaseCard` — detail card used in list + hero), `plan-ranges-picker.tsx` (`PlanRangesPicker` — shared by `/cases/new` + edit sheet for multi-range planning), `empty-state.tsx` (delegates to the primitive).

**Country flags** (`src/lib/country.ts`): `countryFlag()` / `countryIso()` / `countryLabel()` — map `customers.country` (UPPERCASE text) → ISO-2 → flag emoji. Covers all currently-in-DB countries plus likely additions.

**Icons** (`src/components/icons.tsx`): single `<Icon name={...}/>` component with a typed `IconName` union — extend the union and the switch when adding glyphs.

**Format helpers** (`src/lib/format.ts`): `fmtDate`, `fmtDateLong`, `fmtTime`, `fmtDay`, `statusBadge`, `activityBadge`, `referenceTypeBadge`, `adminEventLabel`. Extend this file rather than re-defining badge colors in pages.

### Responsive shell (`src/components/shell.tsx`)

One shell renders both layouts via CSS visibility — **not** separate routes:

- **Mobile (`< 768px`)**: top `AppBar` + `BottomNav`. Sheets slide up from the bottom (`src/components/sheet.tsx`).
- **Desktop (`≥ 768px`, `md:`)**: `Sidebar` (left) + `DesktopTop` (top). BottomNav is hidden.
- `OfflineBanner` mounts globally and shows a red strip when `navigator.onLine === false`.
- `TimerChip` (top bar) and notifications `Bell` are rendered in both AppBar and DesktopTop.
- `Shell` reads `aroet_role` cookie via `getDemoRole()` and passes the role to `Sidebar` + `BottomNav` so the Admin section + pending badge respond to the demo toggle in real time.

Use `md:hidden` / `hidden md:block` to gate per-layout DOM. Do **not** create parallel mobile/desktop route trees.

### Clock-in system — "What's next?" pattern

**Mental model:** engineer's question is always _"What am I doing right now?"_ — not _"do I switch / change activity / emergency / pause?"_. The entire clock-in surface collapses to one sheet with four big options.

State derived from sessions columns, no enum:

- Active session = `clock_in_at IS NOT NULL AND clock_out_at IS NULL AND engineer_code = me`.
- Paused = `paused_at IS NOT NULL`. `paused_total_minutes` accumulates across pauses.
- Sessions can have **null `so_number`** for office work or leave types — `sql/08`. Don't add a NOT NULL assumption back.

**UI** (`src/components/clock/`):
- `QuickActionsHero` — Dashboard hero. Shows inline action chips (no nested sheet for top-level actions):
  - **Idle state**: greeting + backdate chip row (Now/15m/30m/1h/2h ago) + 3 buttons (🔧 Case / 🚗 Travel / 📄 Office). Case opens `WhatsNextSheet` at `pick-case` step directly.
  - **Active state**: live timer (h:mm:ss, tap to edit start time) + status + case info + 3 buttons (🔄 Switch / ⏸ Break or ▶ Resume when paused / ✅ Done).
  - **Above the hero (idle only)**: when there's a `source='planning'` session for today → blue "Planned today" suggestion with 1-tap Start. When no plan but last clock-out within 8h and case still open → "Continue SO123" suggestion.
- `WhatsNextSheet` — Four big options (subset reached via Switch / Case picker):
  - 🔧 **Work on a case** → search step (planned-today first, then recent 7d, then mine, then any). Picker chips show "Planned today" / "Today/Yesterday/Nd ago" / "Mine".
  - ✈ **Travelling** → close current, start a travel session
  - 🏢 **Office time** → close current, start an office session (no SO)
  - ⏸ **Take a break** (or "End break" when paused)
  - Plus a "Started: Now / 15m / 30m / 1h / 2h ago" chip row that backdates both close + start (no timeline gap).
  - Accepts `defaultStep?: "home" | "pick-case"` so callers can open straight into the search step.
- `TimerChip` — Live counter (refresh every 1s via `setInterval`). Long-press TimerChip → WhatsNext.
- `ActiveSessionSheet` — Big timer + two primary actions ("What's next?" / "Done for today") + one secondary row (Edit start time).
- `ClockOutReviewSheet` — Editable travel/break/notes + "Submit immediately" toggle (sets `approval_status='submitted'` + writes `session_approval_log`).
- `StaleSessionBanner` — Red banner on Dashboard when active session started before today (Bangkok TZ). TimerChip turns amber + "· check?" suffix when elapsed > 10h.

**Server actions** (`src/app/clock/actions.ts`, all use `ME = 'JKH'`):

- `clockIn({so_number, machine_no, activity_type, started_at?})` — rejects if engineer already has an active session. `so_number` can be null (office). `started_at` lets the new session start in the past.
- `chainNext({kind, so_number?, machine_no?, backdate_minutes?})` — close current + start new, both at the same moment. Bucket allocation depends on the *previous* activity. Clamps backdate to current session's start so we can't close earlier than we opened.
- `takeBreak()` / `endBreak()` — pause/resume on the currently active session.
- `pauseSession(id)` / `resumeSession(id)` — low-level, called from offline queue.
- `clockOut(id, review)` — finalizes; splits elapsed minutes minus travel/break across `work_minutes` / `travel_minutes` / `office_minutes` based on `activity_type`.
- `editStartTime(id, new_clock_in_iso)` — backdate the clock-in.
- `startOfficeSession()` — thin wrapper on `clockIn({so_number:null, activity_type:'office'})`.
- `searchCasesForEmergency(query)` — case picker query for WhatsNext.

⚠️ **Don't reintroduce `switchActiveCase` / `changeActivity` / `emergencySwitchCase`** — they were removed in phase 5e. Every mid-day transition goes through `chainNext`.

### Case detail (`src/app/cases/[so_number]/`)

Four tabs in the strip via `?tab=sessions|tasks|refs|admin`, with `tasks` rendered as "Checklist". A fifth state `?tab=similar` is still valid — reached via the "See similar cases →" footer link below the active tab. Tab counts come from `getCaseAggregates` (sessions_count + hours_logged now exclude `source='planning'` — Plan dates are forecasts, not logged work).

**Hero card** (`hero.tsx`):
- Status pill + service chip
- Subject + customer name (linked to `/customers/[code]`)
- Grid: Machine (linked `<CodeBadge>` per machine to `/machines/[no]`), Project, Due, Hours logged
- Assignees row with star badge on the lead avatar
- Action row: **Add session** + **Edit case** (wrench, when editable) + **Change status** (refresh)

**Edit case sheet** (`edit-case-sheet.tsx`, phase 5O):
- `updateCase(so_number, patch)` reconciles `case_machines` (add/remove + exactly one primary) and syncs `cases.machine_no` with the chosen primary.
- Gate: rejects when status is `completed` / `verified` / `canceled`. The Edit button hides in those states; engineers reopen via the Status menu first.
- Editable fields: Subject, Description, Customer (picker), Machines (multi-select + Make primary), Service type, Project code, Due date.

**Sessions tab** (`sessions-tab.tsx`, phase 5L):
- Group by **Date** or **Machine** toggle (appears when case has > 1 machine).
- Date view: each day's section header shows per-machine totals as chips ("MACHINE-A 6h · MACHINE-B 2h · — 0h45").
- Machine view: groups by `machine_no`, shows day count + total per machine.
- Each session card has machine code (CodeBadge), activity badge, time chips, approval chip with approver tooltip + name suffix, returned-reason banner.

**Add session sheet** (`add-session-sheet.tsx`): machine picker chip row when case has > 1 machine.

**Checklist tab** (`checklist-tab.tsx`, phase 5M):
- Per-machine: one collapsible block per case machine, each with its own template + sections + items.
- Overall progress card at top sums across all machines (`8/116 items · 7%`).
- Server-side: single batched fetch of templates/sections/items/results for all machines — no N+1.
- Only single primary machine? Renders as before with the template name in the header.
- Cases not eligible (non-PM service type, missing machine, no template) show a friendly placeholder.

### New Case form (`src/app/cases/new/`, phase 5P)

- **Smart paste** (`parseTitleSmart`): returns `machine_codes: string[]` (all matches — fixes "MCSF13 MCSF15" only reading the first). DB-confirmed machines come first; unknown candidates land in `unmatched_codes`.
- **Project code fallback**: when no DB match, falls back to regex on `Line#NN` / `Group N` / `MCE#N` and returns `project_code_source: 'pattern'` so the UI labels it.
- **Inline machine register**: paste surfaces a warning + "Add MCSF15" chips when machines are unknown. Opens a floating card with `machine_no` + `product_code` + `serial_no`; on save the machine is persisted and added to the form.
- **Manual list**: dashed "+ New machine" chip at the end of customer's machines triggers the same flow.
- **Subject field** replaces separate Title + Description. `createCase` writes it into `cases.title` only — the legacy `cases.description` column was dropped in phase 6f / sql/14.
- **SR number is optional** (UI + server). Only SO + Customer + ≥1 Machine + Service type + Lead block submit.
- **Layout**: Project code lives inside the "Customer & machines" card, directly under the Machines chip row — D365 titles read "machines, then project", so the form mirrors that. Service type is its own card after.
- **Rollback safety**: if `case_machines` insert fails (e.g. FK violation), the case row is deleted and the engineer sees the real error — no orphan cases with empty machine lists.

`getCase` has a **legacy fallback** for cases predating `sql/05`: if `case_machines` is empty but `cases.machine_no` is set, it synthesizes a single primary entry so the UI never falsely reports "no machine".

### Planning grid (`src/app/planning/`, phase 5j)

- Engineer × N-day grid (1w / 2w / 4w), Monday-aligned, weekend tint.
- Click any cell → `AssignSheet`:
  - Empty cell → "Add plan"
  - `source='planning'` row → "Edit plan" (8 type chips, SO field only when T/V/A, notes, Save / Delete)
  - Clock-in / `source='manual'` / approved / `source='planner'` → read-only banner pointing at the right edit path (Hours timesheet or re-parse) with 🔒 marker on the grid

### Workforce — Hours + Approvals

**`/workforce`** (`hours-section.tsx`, phase 5f):
- Pay-period picker (5 presets + prev/next month). Engineer picker visible only to admin.
- Totals card: work / travel / office / break / days / total + per-approval-status counts.
- Day-by-day table with click-to-edit. "+ Add session" pre-fills today.
- `SessionEditSheet`: Date / SO (blank = office) / activity chips / 4 minute buckets / Notes + Save + Delete (2-step confirm). Locked + read-only when approved; returned reason shown in red.

**`/workforce/queue`** (phase 5i):
- Lists submitted sessions grouped by engineer. "Approve all" per engineer + per-row Approve + Return-with-reason (required).
- Server gating: `approveSession` / `returnSession` / `bulkApproveSessions` reject when `getDemoRole() !== 'admin'`; otherwise stamp `approved_by = getActingAs()` + `approved_at` + write `session_approval_log`.
- "Approving as PPI" footnote at the bottom of the queue.
- Engineer side sees approver in chip tooltip + edit-sheet banner ("Approved by PPI on 15 May 14, 04:30").

### Bulk reparse (`/admin/bulk-reparse`, phase 5N)

- Page reads counts (`totalWithPlannerNote` / `withSessions` / `withoutSessions`) on load.
- Client iterates `bulkReparseBatch(start, { onlyEmpty })` until `hasMore = false`. Batch size = 25 (controlled in `actions.ts`).
- Live progress bar, running totals, scrollable error list.
- Server gate: `bulkReparseBatch` calls `requireAdmin()` — engineer role rejected.
- Re-runnable: deletes `source='planner'` rows first. Manual entries + clock-in sessions never touched.

### Notifications (`src/components/notifications/`)

Bell in top bar. Unions `session_approval_log` + `admin_log` for cases assigned to me, sorts desc, limit 50. **Unread tracked in localStorage** under `aroet_notif_seen_at` (single timestamp). "Mark all read" updates the key to now. No `is_read` column added — defer until auth.

### Role + acting-as (`/me`, phase 5b + 5i)

Cookie-backed demo identity:

| Cookie | Used by | Default | Values |
|---|---|---|---|
| `aroet_role` | Shell, sidebar gating, bulk-reparse gate | `admin` | `admin` / `engineer` |
| `aroet_acting_as` | Approve / return / bulk-approve actions → `approved_by` column | `PPI` | `PPI` / `CCH` / `LRO` / `SPE` |

Server actions read these via `getDemoRole()` and `getActingAs()` in `src/app/me/role-actions.ts`. The `/me` page exposes a role toggle + (when role=admin) a chip picker for the approver identity. `revalidatePath('/', 'layout')` after a change so the whole shell re-renders.

### Planner parser (`src/lib/planner/parser.ts`)

The parser is the core of the data pipeline. Engineers paste free-form text into `cases.planner_note`; `parsePlannerNote()` extracts three structured outputs:

1. **Sessions** — per-engineer, per-day time tracking (travel/work/break/office minutes, activity type, weekend/holiday flags).
2. **References** — CS / GI / GT / Invoice / Quote numbers.
3. **Admin log** — invoice_sent, rs_done, acceptance_signed, etc.

Critical invariants when touching this code or any reparse flow:

- Every parser-generated row carries `source = 'planner'`; manual entries (including clock-in sessions and planning grid entries) carry `source = 'manual'` or `source = 'planning'`. **Reparse must only delete `source='planner'` rows** — never wipe manual entries. Re-running bulk reparse is safe.
- Known engineer codes are hardcoded in `KNOWN_ENGINEERS` in `parser.ts`. New engineers must be added there or they'll be silently dropped.
- Bulk reparse processes in batches of 25 (`BATCH_SIZE` in `admin/bulk-reparse/actions.ts`); the client calls the action repeatedly with `batchStart` until `hasMore` is false. Don't convert it to a single long-running call.
- Sessions can be flagged `is_shared` when the same engineer-date-raw_line appears on multiple SOs (engineer copy-pasted into several cases). Detection happens during parse via the `idx_sessions_engineer_date_raw` index.

### Service types (`src/lib/service-types.ts`)

9 D365 service type codes: `7505 Curative`, `7506 Customer Training`, `7507 PM`, etc. Use `findServiceType(code)` instead of hardcoding labels. `7507` is the gate for PM checklist eligibility (per `eligibleForChecklist` in `src/lib/checklist.ts`).

### Pay periods (`src/lib/pay-period.ts`)

Pay period helpers understand multiple presets (`month | h1_1_15 | h2_16_end | h1_1_20 | h2_21_end | custom`); use `computePayPeriod()` rather than hand-rolling date math in new timesheet views. `daysInRange(start, end)` returns the ISO date list.

### Offline queue (`src/lib/offline/queue.ts`)

`callOrQueue(key, args)` runs the action online or stores it in `localStorage.aroet_offline_queue` when offline. Supported keys after phase 5e: `pause`, `resume`, `editStartTime`. Other transitions (`chainNext`, `clockOut`, etc.) require online — they're destructive enough that pending state would cause more confusion than queuing.

## Auth seam (where to swap when Sprint 6 lands)

Replace these constants / cookie reads — **not** the call sites — when wiring real auth:

- `ME = 'JKH'` in `src/app/clock/actions.ts`, `src/app/cases/[so_number]/add-session-sheet.tsx`, `src/app/workforce/queries.ts`, `src/app/me/page.tsx` (any file with a top-level `ME` constant)
- `getDemoRole()` in `src/app/me/role-actions.ts` → returns from auth session
- `getActingAs()` in `src/app/me/role-actions.ts` → returns the actual logged-in admin
- `Shell` in `src/components/shell.tsx` consumes `getDemoRole()` already, so no change needed there
- Engineer dropdown in `/me/role-switcher.tsx` and `/workforce` becomes a real session lookup

---

## ภาษาไทย — โน้ตทำงานสำหรับ Job

### Quick tour

| ทำที่ไหน | ทำอะไร |
|---|---|
| Dashboard | กด **What's next?** → 4 ตัวเลือก: Case / Travel / Office / Break |
| Active session ที่ TimerChip | กด → ActiveSessionSheet (เห็นนาฬิกาใหญ่ + Done for today). Long-press → WhatsNext ตรงๆ |
| `/cases/new` | Smart paste → parser อ่าน SO + machines (หลายเครื่อง) + project + subject ให้. Machine ที่ยังไม่ใน DB → ปุ่ม "Add MCSF15" |
| `/cases/[so_number]` | Edit case (ไอคอน wrench) ใช้ได้เมื่อ status เป็น planned/in_progress. Per-machine checklist ใต้ Checklist tab |
| `/workforce` | แก้ session ย้อนหลังได้ทุกใบที่ยัง approved ไม่ได้. กด row → Edit sheet |
| `/workforce/queue` | Admin approve / return-with-reason (acting as PPI/CCH ที่ตั้งไว้ใน `/me`) |
| `/planning` | กด cell ใดก็ตามเพื่อ assign / edit plan. Cell ที่ source ≠ planning จะ read-only |
| `/admin/bulk-reparse` | Re-parse planner notes batches ละ 25 cases. Engineer view ใช้ไม่ได้ |
| `/me` | สลับ **Admin / Engineer** view + เลือก **Acting as** (เลือกว่าใครเป็นคน approve) |

### Workflow ที่ใช้กันจริง

**1. เริ่มงานต่อ session ใหม่:**
- เปิด dashboard → Active session ไม่มี → กด What's next? → เลือก type
- ถ้าเริ่มงานจริงไปแล้วครึ่งชั่วโมง → ใน sheet เลือก "Started: 30m ago" ก่อนกด

**2. เปลี่ยน case / activity ระหว่างวัน:**
- กด TimerChip บน top bar → ActiveSessionSheet → "What's next?"
- หรือ long-press TimerChip ไปที่ WhatsNext ตรงๆ
- กดตัวเลือกใหม่ = ปิด session เก่า + เปิดอันใหม่ทันที (ไม่มี gap)

**3. ลืม clock in / clock out:**
- **ลืม clock in (ทำงานไปแล้ว 1 ชม.):** WhatsNext → "Started: 1h ago" → เลือก type
- **ลืม clock out (ค้างยันรุ่งเช้า):** Dashboard มี banner สีแดง "Forgot to clock out" → กด timer → Edit start time หรือ Done for today
- **แก้ session ย้อนหลัง:** ไป `/workforce` → กด row ที่ผิด → edit sheet → ปรับ travel/work/break + SO + activity + Save
- **เพิ่ม session ที่ลืมลงทั้งใบ:** `/workforce` → ปุ่ม + Add session → กรอกใหม่ทั้งหมด

**4. งาน multi-machine PM:**
- สร้าง case ที่ `/cases/new` → เลือก machines ทุกตัว (เป็น chips multi-select)
- ใน case detail → Add session ถาม machine ทุกครั้ง (ถ้ามี > 1)
- Sessions tab toggle "Group by Date / Machine" — ดูแยกตามเครื่องได้
- Checklist tab → 1 collapsible block ต่อเครื่อง — กดเครื่องไหน → เห็น sections + items แยกของเครื่องนั้น

**5. Multi-day case + daily notes:**
- ทุก session มี **Notes** field (work_done) — เขียนว่าทำอะไรไปวันนั้น
- หลายวัน = หลาย session rows ต่อ case
- SessionsTab default group by date — เห็นวันละ section พร้อม total

**6. Approve workflow:**
- Engineer ทำงาน → กด "Submit immediately" ตอน Done for today
- หรือ submit ทีหลังที่ `/workforce` (กด session row → ตอนนี้ยังไม่มี submit button จากตรงนั้น แต่ status เปลี่ยนเป็น draft → ใน UI bulk-submit ทำใน hours-section)
- Admin เปิด `/me` → ตั้ง role=Admin + Acting as=PPI (หรือ CCH)
- เข้า `/workforce/queue` → ดูตาม engineer → กด Approve / Approve all / Return + เหตุผล

**7. Bulk reparse (อัพ planner note หลายๆ cases พร้อมกัน):**
- Admin only — สลับ role admin ก่อน
- `/admin/bulk-reparse` → toggle "Only cases without parsed sessions" (ถ้าเปิด = parse เฉพาะ case ที่ยังไม่มี planner session)
- กด Start → ดู progress bar + error list
- ปลอดภัย re-run — ลบเฉพาะ `source='planner'` ก่อน insert ใหม่

### Gotchas

**Migration drift — silent empty arrays:**

ถ้า Supabase query ที่ join ตารางอื่น (เช่น `case_machines`) คืน `[]` แบบเงียบๆ — สงสัยก่อนว่าตารางยังไม่ถูกสร้างใน DB. ทุกครั้งที่ลง migration ใหม่ ต้องไปรันใน Supabase SQL Editor ตามลำดับเลข. ปัจจุบัน 1-10 ต้องครบ.

```sql
select table_name from information_schema.tables
 where table_schema = 'public'
 order by table_name;
```

ต้องเจอ: `case_machines`, `project_mapping`, `customer_contacts`, `session_approval_log`, `case_checklists` + machine_no UNIQUE constraint จาก sql/10

**Source column invariant:**

- `source = 'planner'` → parser-generated (เปลี่ยน/ลบได้โดย reparse)
- `source = 'manual'` → manual entry (เช่น `addSession` จาก case detail)
- `source = 'planning'` → planning grid assign
- Clock-in sessions ใช้ `source = 'manual'`

ห้ามแก้ source column นี้ลอยๆ — `reparseCase` / `bulkReparseBatch` พึ่งมันเพื่อหา rows ที่ปลอดภัยที่จะลบ

**Activity → bucket mapping:**

ตอน clock out:
- `activity_type = 'office'` → ใส่ `office_minutes`
- `activity_type = 'travel'` → ใส่ `travel_minutes` (รวมกับ travel ที่กรอกใน review)
- ที่เหลือ → `work_minutes`

ตอน planning grid assign:
- T/V/A → work_minutes = 480
- WFH → work_minutes = 480 (remote)
- OFF → office_minutes = 480
- AL/SICK/PERS → 0 ทั้งหมด (leave, ไม่ต้อง SO)

### 🔖 Session handoff (2026-05-21)

**ค้างไว้ — pickup ครั้งหน้า:**

- **ต้องรัน 2 SQL migrations ก่อน feature ใหม่ใช้งานได้:**
  - `sql/17_admin_log_assignment_event.sql` — ไม่งั้น notification "Assigned to case" จาก phase 6k-4 ตกเงียบ ๆ
  - `sql/18_sessions_source_planning.sql` — **critical!** ไม่งั้น Plan dates picker (phase 6l) + /planning grid (phase 5j!) เขียน sessions ไม่ได้เลย. การที่ DB ตอนนี้ไม่มี `source='planning'` rows ก็เพราะ constraint นี้ block ตลอด
- ยังต้องรัน sql/14 + sql/15 ค้างจากครั้งก่อน (drop legacy columns)
- 7 templates ที่ขาด (12 MEVP, 34 MITSF, 42 SR2, D1 ProMapper, F1 MTVP4, F3 MCVP4-V3, H2 SR3) — ยังไม่ได้เพิ่ม
- Job จะลอง **v0.dev + shadcn/ui** เพื่อ polish UI เพิ่ม. Repo state ปัจจุบันพร้อม import แล้ว
- PDFs 12 ไฟล์ใน `Checklist for Maintenance job/` ยัง untracked

### Phase 6 (เสร็จแล้ว)

- [x] **6a** PIN auth (sql/12 + `src/lib/auth/*` + `middleware.ts`)
- [x] **6b** Delete case when no sessions logged
- [x] **6c** Admin can delete approved sessions
- [x] **6d** Drop dead `JKH` constants + demo cookie defs (auth seam closed)
- [x] **6e** Customer / Machine CRUD sheets on `/customers` + `/machines` (admin-only)
- [x] **6f** Drop `cases.description` from code (sql/14 pending)
- [x] **6g** Drop `machines.version` — product_code IS the machine type (sql/15 pending)
- [x] **6h-1** Rename "Product" → "Machine type" in Machine UI
- [x] **6h-2** Clean Belgian-English in checklist items (sql/16, 322 of 460 changed)
- [x] **6h-3** Admin checklist editor at `/admin/checklists` (templates / sections / items CRUD + duplicate + bulk paste)
- [x] **6i** Polish — spacing tokens (`--page-px`, `--stack`, `.page-px`, `.stack-lg`), `<EmptyState>` primitive, `loading.tsx` skeletons for 8 routes. iconbtn = tap-size by default.
- [x] **6j** Dashboard hero redesign — `<QuickActionsHero>` shows 3 inline action buttons (Case / Travel / Office when idle; Switch / Break / Done when active) + backdate chip row. Old `SmartStartCTA` + `ActiveSessionCard` deleted (subsumed). Case button opens WhatsNext at `pick-case` step via new `defaultStep` prop.
- [x] **6k** Engineer-friendly dashboard:
  - **6k-1** Hero "Planned today" suggestion strip (queries `source='planning'` for today × me, 1-tap Start)
  - **6k-2** Smart case picker — sort planned_today → recent (7d) → mine → others; chips show "Planned today" / "Today/Yesterday/Nd ago" / "Mine"
  - **6k-3** "Continue last" suggestion when last clock-out within 8h AND case still open
  - **6k-4** Assignment notification — `createCase` + `updateCase` write `admin_log` with `event_type='engineer_assigned'` (needs sql/17)
- [x] **6l** Cases overhaul:
  - **6l-1** `/cases` list as detail cards (replaces `CaseListRow` + desktop table). Shows 🇹🇭 country flag (`src/lib/country.ts`), customer + city, machines with serial numbers, collapsed planned-date ranges ("19–21 May, 24–26 May" — handles non-contiguous holidays), hours logged, team avatars with lead ★. Responsive grid 1/2/3 cols.
  - **6l-2** Edit case sheet refactored to mirror `/cases/new` (Sections + Fields + fchip multi-select). Adds engineer multi-edit (Lead select + Other chips) — previously could not change assignees post-create. Adds `<PlanRangesPicker>` (shared) — multi-range entries `{engineer × from → to × T/V/A}`. `updateCase` reconciles `case_engineers` (delete/insert + is_lead update) and planning sessions (full replacement on save).
  - **6l-3** Hours bug fix — `hours_logged` and `sessions_count` everywhere now exclude `source='planning'` (forecasts shouldn't count as actuals). Planning rows also excluded from `getCaseSessions`, `getTodaySessions`, week minutes.
  - **6l-4** Case detail hero rebuilt as `.case-card-v2` — matches list-card vocabulary. SO prominent, flag + city, subject line-clamp-4, machines list with product_code + serial_no, Plan + Hours stats, Team in one compact row. Actions row (Add session / Edit / Status) lives outside the info card. Tabs trimmed to 4 (Sessions / Checklist / Refs / Admin) + "See similar cases →" footer link. `getCase` extended to fetch customer city/country + per-machine details.
- [x] **Codespaces fix** — `next.config.ts` allows `*.app.github.dev` for Server Actions

### เหลือก่อน merge → `main`

- [ ] **รัน sql/17 + sql/18** ใน Supabase SQL Editor — **critical!** Plan dates picker + /planning grid + assignment notifications ใช้ไม่ได้จนกว่าจะรัน
- [ ] รัน sql/14 + sql/15 (drop legacy columns)
- [ ] เพิ่ม 7 templates ที่ขาด (12 MEVP, 34 MITSF, 42 SR2, D1 ProMapper, F1 MTVP4, F3 MCVP4-V3, H2 SR3) ผ่าน `/admin/checklists`
- [ ] Checklist photo upload (Supabase Storage)
- [ ] Notification realtime (Supabase Realtime + persistent unread state)
- [ ] RLS on (เปิดทุกตาราง + เขียน policies — ทำท้ายสุด)
- [ ] Visual smoke test สาย mobile (375px) + desktop (1400px) ก่อน merge

### Reference files

- **`AROET-claude-code-brief.md`** (repo root) — original strip+replace strategy, data model. Still referenced from `docs/claude-context.md`.
- **`docs/claude-context.md`** — cross-machine handoff. Update when phases change.
- **`AROET_README.md`** + **`README.md`** — older bundle READMEs (Phase 1 era). Not authoritative for current state.
