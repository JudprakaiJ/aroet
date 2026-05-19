# AROET Redesign — Strip + Replace Strategy

## What you're doing

Replacing the entire UI of an existing Next.js app called **AROET** with a new design exported from Claude Design. **Keep the logic, replace the look.**

---

## Strategy: Strip + Replace

### What to KEEP (don't touch)
- `/src/lib/**` — Supabase clients, parser, utils, types
- `/src/app/**/actions.ts` — all server actions (createCase, parseTitleSmart, sessions, approvals, etc.)
- `/src/app/api/**` — API routes (if any)
- `/src/app/layout.tsx` — root layout (will update minimally for new shell)
- `package.json` — dependencies stay
- `tailwind.config.ts`, `next.config.ts`, `tsconfig.json`
- `/sql/**` — migration scripts
- `.env.local` — Supabase credentials
- Supabase DB (untouched)

### What to DELETE/REPLACE
- All `/src/app/**/page.tsx` — every page
- All `/src/app/**/loading.tsx`, `error.tsx` — loading/error states
- `/src/components/**` — all components
- `/src/app/globals.css` — replace with new design tokens
- Existing UI (TopNav, Cards, Tables, Modals)

### Workflow — use git branch

```bash
git checkout -b redesign
# Work in this branch — main keeps running aroet.vercel.app
# Vercel auto-creates preview URL for redesign branch

# When ready to ship:
git checkout main
git merge redesign
git push
# Production updated
```

---

## Context

- Repo: `github.com/JudprakaiJ/aroet` (already cloned locally)
- Production: `aroet.vercel.app` (auto-deploys from `main`)
- Stack: Next.js 15 App Router, Tailwind CSS, Supabase, Vercel
- ~10 engineers + 4 admin at A&R Optical Thailand
- Used on mobile (field) AND desktop (office)
- Brand color: `#C8102E`

### Files attached
1. `AROET_field_service_tool_app.zip` — Claude Design export (118 React components, aroet.css design system)
2. This brief

---

## Phase plan

### Phase 0 — Strip (~10 min, one-time)

On the `redesign` branch, delete old UI but keep server actions and lib:

```bash
git checkout -b redesign

# Audit first — list what we're keeping
find src/app -name "actions.ts"    # KEEP all of these
ls src/lib/                         # KEEP

# Delete UI
find src/app -name "page.tsx" -delete
find src/app -name "loading.tsx" -delete
find src/app -name "error.tsx" -delete
rm -rf src/components/*
rm -f src/app/globals.css

# Verify what's left
ls -R src/app/ | head -30
```

After strip, `src/app/` should still have:
- `layout.tsx` (root layout — minimal/empty body)
- `actions.ts` files in subdirectories (orphaned but referenced by lib)

Commit: `git commit -am "phase 0: strip old UI, keep server actions"`

### Phase 1 — Foundation (~1-2 days)

1. **Read the design zip thoroughly** — all 118 components
2. **Port design tokens** from `aroet.css` → new `src/app/globals.css`
3. **Update tailwind.config.ts** — expose AROET colors (red, type chips) as utilities
4. **Shell components** in `src/components/`:
   - `StatusBar`, `AppBar`, `BottomNav` (mobile)
   - `Sidebar` (desktop, 200px)
   - `Sheet`, `Toast`, `Modal`
   - `Avatar`, `StatusPill`, `ServiceChip`, `CodeBadge`, `TypeBlock`
5. **Convert JSX → TSX** — replace `window.Icons` etc with ES imports
6. **Responsive layout shell**:
   - Mobile (≤768px): bottom nav, full-width content
   - Desktop (>768px): left sidebar 200px + content
   - Tailwind: `md:hidden` mobile-only, `hidden md:flex` desktop-only
7. **First page — Dashboard at `/`**:
   - Smart Start CTA
   - 4 stat cards
   - My active cases (Supabase query)
   - Today's sessions

Commit → push → user reviews Vercel preview URL.

### Phase 2 — Core pages

| URL | Design component | Reuses server actions |
|---|---|---|
| `/cases` | CasesScreen | (read-only query) |
| `/cases/new` | SmartPasteSheet + create form | createCase, parseTitleSmart, suggestProjectCode, createCustomerInline, createMachineInline |
| `/cases/[so]` | CaseDetailScreen | updateCaseStatus, createSession, submitSession |
| `/customers` | (use CaseCard-like list) | — |
| `/customers/[code]` | CustomerTimeline | — |
| `/machines` | — | — |
| `/machines/[no]` | MachineTimeline | — |
| `/workforce` | dispatcher (plan/hours/queue) | — |
| `/workforce?tab=plan` | PlanGrid | assignSession, deleteSessionFromGrid |
| `/workforce?tab=hours` | HoursScreen | — |
| `/workforce?tab=queue` | ApproveScreen | bulkApproveSessions, approveSession, returnSession |
| `/team` | (engineers list) | — |
| `/me` | MeScreen | — |

For each page:
1. Open design component (e.g. `CasesScreen` in `aroet-screens.jsx`)
2. Convert to Next.js page (TypeScript, server component first)
3. Replace inline data (e.g. `AROET.CASES`) with Supabase query
4. Test in dev
5. Commit

### Phase 3 — New workflows from design

Features that didn't exist before:

1. **Clock-in system**:
   - States: idle / active / paused
   - Smart Start CTA → starts session
   - TimerChip (sticky in AppBar when active)
   - Active Session Sheet
   - Clock-out Review Sheet
   - Change Activity Sheet
   - Switch Case Sheet
   - Need new server actions: `clockIn(caseId, activity)`, `clockOut(sessionId, notes)`

2. **Notifications panel**:
   - Trigger: session approved/returned, case assigned
   - Source: poll `session_approval_log` + `cases` updated_at on intervals

3. **Checklist UI** — PM workflow:
   - 6 machine types: DLM (29 items), MCVP4 (89), MCVP8_V1 (121), MCVP8_V2 (135), SPV2 (46), SPV3 (45) — 465 total
   - Need new table: `case_checklist_items` (so_number, item_id, completed, completed_by, notes)
   - Need migration: import 465 items as `checklist_templates`
   - UI: collapsible sections, checkboxes, progress bar

4. **Smart Paste Sheet** — wrap existing parseTitleSmart in new design

5. **Role switcher in `/me`** — until auth ships, use localStorage flag `aroet_role` = engineer/admin

6. **Sync queue / offline banner** — show `Offline` badge if `navigator.onLine === false`. Real offline support = Sprint 6.

### Phase 4 — Polish + merge

1. Test every flow on `redesign` branch (Vercel preview URL)
2. Mobile (375px) + desktop (1400px)
3. `npm run build` passes
4. User signs off
5. `git checkout main && git merge redesign && git push`
6. Production updated

---

## Data model (Supabase tables)

- **cases** — so_number (PK), sr_number, title, description, service_type_code, service_type_name, customer_code, customer_name, machine_no, project_code, status, due_date, source, planner_note, contact_name, customer_po, created_at, close_date
- **sessions** — id, so_number (nullable), engineer_code, session_date, travel_minutes, work_minutes, office_minutes, break_minutes, activity_type, type_code, is_weekend, is_holiday, work_done, source, approval_status, approved_at
- **customers** — code (PK), name, city, country, address, notes, contact_name, contact_mobile
- **machines** — machine_no (PK), customer_code, customer_name, name, product_code, serial_no, version, warranty_expiry, installation_date, notes
- **engineers** — code (PK), full_name, role, is_active
- **case_machines** — id, so_number, machine_no, is_primary
- **case_engineers** — so_number, engineer_code, is_lead
- **customer_contacts** — id, customer_code, name, role, phone, email, is_primary
- **session_approval_log** — session_id, action, notes

### Service Types (9 D365 codes — display as ServiceChip)
- 7505 Curative maintenance · 7504 Installation · 7515 Curative under Warranty · 7508 Upgrade installation · 7507 PM · 7512 Service Agreement · 7235 Service Promotion · 7506 Customer Training · 7506-1 Internal Training

### Engineers
- Field: JKH (Job — current user until auth), PSU, RKO, TCH, RMA, IRO, KBU, JYE, SSU, UKA
- Admin: PPI, SPE, CCH, LRO

### Session type colors (already in design's aroet.css)
T (green) · V (dark green) · A (gray) · PERS (light blue) · AL (lavender) · SICK (dark gray) · WFH (cream) · OFF (beige) · Weekend (light red)

---

## Existing server actions (REUSE — never rewrite)

```
src/app/cases/new/actions.ts:
  - createCase(input)
  - suggestProjectCode(machine, customer)
  - createCustomerInline(input)
  - createMachineInline(input)
  - parseTitleSmart(title)   // D365 title parser with DB lookup

src/app/cases/[so_number]/actions.ts:
  - updateCaseStatus, etc.

src/app/cases/[so_number]/session-actions.ts:
  - createSession, updateSession, deleteSession
  - submitSession, approveSession, returnSession

src/app/workforce/queue/actions.ts:
  - bulkApproveSessions

src/app/planning/actions.ts:
  - assignSession, deleteSessionFromGrid

src/lib/supabase/server.ts:
  - createClient() for server components

src/lib/supabase/service.ts:
  - createServiceClient() for server actions (bypass RLS)
```

---

## Constraints

- **No new dependencies** unless necessary. Ask first.
- **TypeScript.** Convert all JSX → TSX with types.
- **Server components by default.** `'use client'` only when needed.
- **Tailwind only.** No styled-components, no CSS modules.
- **Components in `/src/components/`** — keep pages thin.
- **Mobile-first responsive.** Test 375px AND 1400px.
- **Touch targets ≥44px** on mobile.
- **Commit frequently.** Each milestone = commit + push.
- **Never rewrite server actions.** Reuse them.

---

## How to start

### Your first response:

1. `git status` and `git branch` — confirm state
2. `git checkout -b redesign`
3. `ls src/app/` and `ls src/components/` — show what's there now
4. `find src/app -name "actions.ts"` — list every server action file we're keeping
5. Show me the **exact strip plan** as bash commands
6. **Wait for my approval** before deleting

### After strip approved:

1. Extract design zip, read every JSX file
2. Read `aroet.css` end-to-end
3. Show me **Phase 1 file plan** as a tree (files in `src/app/*` and `src/components/*`)
4. **Wait for approval** before writing code

---

## Communication style

- User: Job (JKH). Thai with English technical terms.
- **Concise.** Short replies.
- Ask **one question at a time** with 2-4 options.
- Show mockups when layout changes.
- Commit + push + summarize in 3-5 bullets.

---

## Out of scope

- Authentication — Sprint 6
- DOCX report generation — Sprint 7
- Pay calculation — Sprint 8
- Migration SQL chunks — user handles separately

---

## Success criteria for merge

Before `git merge redesign → main`:
- All pages at same URLs (cases, workforce, etc.)
- `npm run build` passes
- Mobile (375px) usable with bottom nav
- Desktop (1400px) has sidebar
- Full flow: dashboard → open case → add session → submit → approve
- Vercel preview deploys
- User signs off

---

## TL;DR

```
1. git checkout -b redesign
2. Strip: delete page.tsx, loading.tsx, error.tsx, components/*, globals.css
   (KEEP: actions.ts, lib/, layout.tsx)
3. Read design zip cold
4. Show Phase 1 file tree plan
5. Wait for approval
6. Build Phase 1 → 2 → 3 → 4
7. Merge redesign → main
```
