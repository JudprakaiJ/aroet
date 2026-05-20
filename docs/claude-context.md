# Claude Context — AROET

Durable context for any Claude (Code / web / mobile) session working on AROET. Read this once at the start of a new session — supplements `CLAUDE.md` (which has the technical architecture) with the human + workflow context that doesn't live in the codebase.

For deep technical detail (routes, schema, migrations, auth seam, design tokens), read `CLAUDE.md` at the repo root.

---

## User

**Job** (engineer code `JKH`) — engineer/owner at A&R Optical Equipment (Thailand). Builds and uses AROET himself, alongside ~10 field engineers + 4 admin.

- Writes Thai mixed with English technical terms. Reply in the same register.
- Uses the app on both **mobile** (in the field) and **desktop** (office) — design needs to work at both sizes.
- Comfortable with git, Next.js, Supabase, Vercel — talk to him as a peer dev, not a beginner.
- Until auth ships (Sprint 6), the active engineer is hardcoded `JKH`. See `CLAUDE.md` § "Auth seam" for the 4 spots to swap.

## Communication style

Rules from the original project brief (`AROET-claude-code-brief.md` § Communication style) — Job set these explicitly, they're durable preferences not session-specific:

- **Be concise.** Short replies, no preamble, no recap of what just happened.
- **Ask one question at a time** with 2-4 options when a fork in the road appears.
- **Show mockups** when layout changes (ASCII sketches are fine).
- **After commits:** commit + push + summarize in 3-5 bullets.
- **Wait for "go ahead" / "approve"** before destructive steps (file deletion, branch creation, merges into `main`). Don't be proactive about destructive ops.

## Redesign status (as of 2026-05-20)

UI rebuild lives on branch **`redesign`** (Vercel preview auto-builds). `main` still runs the old UI in production.

Phases shipped on `redesign`:

| Phase | What | Commit |
|---|---|---|
| 0 | Strip old UI (kept all server actions + lib + sql + layout) | `87cbf5e` |
| 1 | Foundation: design tokens, icons, responsive shell, Dashboard | `acf8c82` |
| 2a | Cases routes: list / new / detail (5 tabs) | `105949f` |
| 2.5 | Desktop refresh — sidebar, top bar, KPI dashboard, table cases | `26341a9` |
| 3 | Clock-in + PM Checklist + Notifications + Role + Offline banner | `09676a5` |
| 3b | Switch case + Change activity + Edit start time sheets | `dce5cb8` |
| 4 | Emergency switch + offline mutation queue | `3bb3d86` |

**What's missing on `redesign` (still to rebuild before merging to `main`):**

| Route | Sidebar link? | Status |
|---|---|---|
| `/admin/bulk-reparse` | ✅ Imports | 404 |
| `/customers` + `/customers/[code]` | ✅ Customers | 404 |
| `/machines` + `/machines/[machine_no]` | ✅ Machines | 404 |
| `/engineers` (timesheet) | — | missing |
| `/planning` (grid) | ✅ Plan | 404 |
| `/workforce` (3 tabs: plan/hours/queue) | ✅ Hours | 404 |
| `/workforce/queue` | ✅ Approvals | 404 |

Server actions for all of these **are intact** in `src/app/.../actions.ts` — only the UI/pages need rebuilding. Reference implementations exist on `main` (large LOC: ~4,800 total).

**Out of scope until auth (Sprint 6):**
- Server-side role gating (toggle in `/me` is cosmetic, sidebar shows everything)
- Persistent unread state per user (notifications use localStorage `aroet_notif_seen_at`)
- Checklist photo upload (needs Supabase Storage)
- Notification realtime (Supabase Realtime)

## Gotchas

### Migration drift — silent empty arrays

When a Supabase JS query with an embedded join (e.g. `cases.select("..., case_machines(...)")`) suddenly returns `[]`, **suspect missing-migration drift before chasing client bugs**.

**Why:** AROET runs SQL migrations by hand in numbered order (no migration framework). On 2026-05-19 the clock-in CTA went dead with "กด clock in ไม่ได้" — root cause was `sql/05_new_case_workflow.sql` had never been applied. `case_machines` didn't exist, Supabase JS returned an error that the code discarded with `if (error || !data) return [];`, the query returned `[]`, and `SmartStartCTA` rendered its `disabled` branch silently.

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
- `05`: **`case_machines`, `project_mapping`** ← commonly skipped
- `06`: `customer_contacts`
- `07`: `type_code` column on sessions
- `08`: `sessions.so_number` nullable
- `09`: `clock_in_at` + `paused_*` columns on sessions

When wiring new queries that join recently-added tables, don't swallow Supabase errors with `if (error || !data) return [];` while investigating — log them or surface them in the UI.

## Reference files

- **`CLAUDE.md`** (repo root) — full technical architecture: routes, design system, clock-in system, planner parser, auth seam, etc.
- **`AROET-claude-code-brief.md`** (repo root) — original strip+replace brief, phase plan, data model, communication rules.
- **`design-import/`** (local-only, gitignored) — 118 JSX files + `aroet.css` from the Claude Design export. Source zip: `AROET field service tool app.zip` in Downloads. Used as the visual reference for the redesign.

## How to resume across machines

Memory file storage on the local Claude Code install (`~/.claude/projects/<repo>/memory/`) **does not sync**. This file is the cross-machine handoff:

- On any new session (web, CLI, mobile): pull latest from `redesign`, read this file + `CLAUDE.md`, then ask Job what to work on.
- If something here drifts from reality (e.g. routes get rebuilt, commits past `3bb3d86`), update this file in the same commit as the change.
