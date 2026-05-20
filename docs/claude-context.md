# Claude Context — AROET

Durable context for any Claude (Code / web / mobile) session working on AROET. Read this once at the start of a new session — supplements `CLAUDE.md` (which has the technical architecture) with the human + workflow context that doesn't live in the codebase.

For deep technical detail (routes, schema, migrations, auth seam, design tokens, ภาษาไทย workflows), read `CLAUDE.md` at the repo root.

---

## User

**Job** (engineer code `JKH`) — engineer/owner at A&R Optical Equipment (Thailand). Builds and uses AROET himself, alongside ~10 field engineers + 4 admin.

- Writes Thai mixed with English technical terms. Reply in the same register.
- Uses the app on both **mobile** (in the field) and **desktop** (office) — design needs to work at both sizes.
- Comfortable with git, Next.js, Supabase, Vercel — talk to him as a peer dev, not a beginner.
- Until auth ships (Sprint 6), the active engineer is hardcoded `JKH`. See `CLAUDE.md` § "Auth seam" for the spots to swap.
- Admins (PPI / CCH / LRO / SPE) approve sessions. Demo uses an `aroet_acting_as` cookie set from `/me` to pick which admin's name lands in `approved_by`.

## Communication style

Rules from the original project brief (`AROET-claude-code-brief.md` § Communication style) — Job set these explicitly, they're durable preferences:

- **Be concise.** Short replies, no preamble, no recap of what just happened.
- **Ask one question at a time** with 2-4 options when a fork in the road appears.
- **Show mockups** when layout changes (ASCII sketches are fine).
- **After commits:** commit + push + summarize in 3-5 bullets.
- **Wait for "go ahead" / "approve"** before destructive steps (file deletion, branch creation, merges into `main`). Don't be proactive about destructive ops.

## Redesign status (as of 2026-05-20, post-phase-5P)

UI rebuild lives on branch **`redesign`** (Vercel preview auto-builds). `main` still runs the old UI in production.

Phases shipped on `redesign`:

| Phase | What |
|---|---|
| 0 | Strip old UI (kept all server actions + lib + sql + layout) |
| 1 | Foundation: design tokens, icons, responsive shell, Dashboard |
| 2a | Cases routes: list / new / detail (5 tabs) |
| 2.5 | Desktop refresh — sidebar, top bar, KPI dashboard, table cases |
| 3 | Clock-in + PM Checklist + Notifications + Role + Offline banner |
| 3b | Switch case + Change activity + Edit start time sheets *(later replaced)* |
| 4 | Emergency switch + offline mutation queue *(later collapsed)* |
| **5a** | Customers + Machines read-only UI |
| **5b** | Demo role toggle actually toggles + /me shortcuts polish |
| **5c** | /planning grid + /workforce hours timesheet |
| **5d** | Office clock-in entry point on dashboard |
| **5e** | Collapse 3 mid-session sheets into one "What's next?" |
| **5f** | Edit / add / delete sessions on /workforce Hours |
| **5g** | "Started earlier" backdate chips |
| **5h** | Long-running + crossed-midnight reminders |
| **5i** | Approvals queue + approver identity attribution |
| **5j** | /planning grid cells become assign/edit modals |
| **5k** | Case detail polish (tab counts, links, lead dedup) |
| **5L** | Multi-machine awareness on case detail (group-by, picker) |
| **5M** | Per-machine PM checklist (schema migration + UI rework) |
| **5N** | /admin/bulk-reparse UI + role gate |
| **5O** | Edit case detail (planned / in_progress only) |
| **5P** | Multi-machine title parse + inline machine register + simpler new-case form |

**Sidebar — every link now lives:**

| Route | Status |
|---|---|
| `/` Dashboard | ✅ |
| `/cases` + detail (with Edit) | ✅ |
| `/customers` + detail | ✅ |
| `/machines` + detail | ✅ |
| `/workforce` Hours + edit | ✅ |
| `/workforce/queue` Approvals | ✅ |
| `/planning` grid + assign | ✅ |
| `/admin/bulk-reparse` | ✅ |
| `/me` role + acting-as | ✅ |

**Required SQL migrations**: `sql/01` → `sql/10` must all be applied. `10_checklist_per_machine.sql` is required for the per-machine checklist UI to render. Per `CLAUDE.md` gotcha: missing migrations cause silent empty arrays.

**Out of scope until merge / next sprints:**

- Sprint 6 — Auth (replace `ME='JKH'` + cookies → real session + RLS)
- Customer / machine create + edit forms from `/customers` and `/machines`
- Checklist photo upload (Supabase Storage)
- Notification realtime + persistent unread per user
- Drop `cases.description` column (Subject field merged)

## Gotchas

### Migration drift — silent empty arrays

When a Supabase JS query with an embedded join (e.g. `cases.select("..., case_machines(...)")`) suddenly returns `[]`, **suspect missing-migration drift before chasing client bugs**.

**Why:** AROET runs SQL migrations by hand in numbered order (no migration framework). On 2026-05-19 the clock-in CTA went dead with "กด clock in ไม่ได้" — root cause was `sql/05_new_case_workflow.sql` had never been applied. `case_machines` didn't exist, Supabase JS returned an error that the code discarded with `if (error || !data) return [];`, the query returned `[]`, and `SmartStartCTA` rendered its `disabled` branch silently.

Around 2026-05-23 (phase 5O), the same gotcha bit again: cases created from `/cases/new` showed no attached machines. Two causes were fixed in `a00af87`:
1. `createCase` was swallowing `case_machines` insert errors with `console.error`. A foreign-key violation (machine_no not in `machines`) left the case row with no junction entries. The action now rolls back the case row and surfaces a clear error.
2. Old cases predating `sql/05` only had `cases.machine_no` set. `getCase` now synthesizes a single primary entry from that legacy column when `case_machines` is empty — UI stops falsely reporting "no machine."

**How to check** before deep-debugging a flow that suddenly stops returning rows:

```sql
select table_name from information_schema.tables
 where table_schema = 'public'
 order by table_name;
```

Expected tables per migration:
- `01`: cases, sessions, customers, machines, engineers, checklist_*, case_checklist_*
- `02`: ~460 rows in `checklist_template_items`
- `03`: `session_approval_log` + approval columns on sessions
- `04`: shared session columns (`is_shared`, `shared_with_so`)
- `05`: `case_machines`, `project_mapping`
- `06`: `customer_contacts`
- `07`: `type_code` column on sessions
- `08`: `sessions.so_number` nullable
- `09`: `clock_in_at` + `paused_*` columns on sessions
- `10`: UNIQUE constraint `case_checklists_so_machine_uniq` + machine_no backfilled

When wiring new queries that join recently-added tables, don't swallow Supabase errors with `if (error || !data) return [];` while investigating — log them or surface them in the UI.

### Don't reintroduce removed clock-in actions

Phase 5e removed `switchActiveCase`, `changeActivity`, `emergencySwitchCase`, `listMyActiveCasesForSwitch` from `src/app/clock/actions.ts` and the corresponding sheets from `src/components/clock/`. Every mid-session transition now goes through `chainNext` (close current + start new) via the WhatsNextSheet. If you find yourself wanting to "update an active session in place," that's the old model — use chainNext instead.

### Source column is load-bearing

`sessions.source` ∈ {`planner`, `manual`, `planning`}. `bulkReparseBatch` and `reparseCase` only delete `source='planner'` rows — that's the invariant that makes reparse safe to re-run without nuking clock-in or manual entries. Don't repurpose the column.

## Reference files

- **`CLAUDE.md`** (repo root) — full technical architecture: routes, design system, clock-in system, planner parser, auth seam, **Thai workflow notes**, gotchas. Updated to reflect phase 5P state.
- **`AROET-claude-code-brief.md`** (repo root) — original strip+replace brief, phase plan, data model, communication rules. Historical reference.
- **`design-import/`** (local-only, gitignored) — 118 JSX files + `aroet.css` from the Claude Design export. Source zip: `AROET field service tool app.zip` in Downloads. Used as the visual reference for the redesign.

## How to resume across machines

Memory file storage on the local Claude Code install (`~/.claude/projects/<repo>/memory/`) **does not sync**. This file is the cross-machine handoff:

- On any new session (web, CLI, mobile): pull latest from `redesign`, read this file + `CLAUDE.md`, then ask Job what to work on.
- If something here drifts from reality (e.g. routes get rebuilt, commits past `a00af87`), update this file in the same commit as the change.
