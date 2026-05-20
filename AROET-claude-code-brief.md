# AROET Redesign — Strip + Replace Strategy

## What you're doing

Replacing the entire UI of an existing Next.js app called **AROET** with a new design exported from Claude Design. **Keep the logic, replace the look.** Plus implementing a new **Checklist** system for PM (Preventive Maintenance) workflow.

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

### Workflow — use git branch

```bash
git checkout -b redesign
# Work in this branch — main keeps running aroet.vercel.app
# Vercel auto-creates preview URL for redesign branch

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

```bash
git checkout -b redesign

find src/app -name "actions.ts"    # KEEP all
ls src/lib/                         # KEEP

find src/app -name "page.tsx" -delete
find src/app -name "loading.tsx" -delete
find src/app -name "error.tsx" -delete
rm -rf src/components/*
rm -f src/app/globals.css

ls -R src/app/ | head -30
```

Commit: `git commit -am "phase 0: strip old UI, keep server actions"`

### Phase 1 — Foundation (~1-2 days)

1. Read the design zip thoroughly — all 118 components
2. Port design tokens from `aroet.css` → new `src/app/globals.css`
3. Update tailwind.config.ts — expose AROET colors as utilities
4. Shell components in `src/components/`:
   - `StatusBar`, `AppBar`, `BottomNav` (mobile)
   - `Sidebar` (desktop, 200px)
   - `Sheet`, `Toast`, `Modal`
   - `Avatar`, `StatusPill`, `ServiceChip`, `CodeBadge`, `TypeBlock`
5. Convert JSX → TSX — replace `window.Icons` with ES imports
6. Responsive layout shell:
   - Mobile (≤768px): bottom nav, full-width content
   - Desktop (>768px): left sidebar 200px + content
7. First page — Dashboard at `/`:
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
| `/customers` | (list) | — |
| `/customers/[code]` | CustomerTimeline | — |
| `/machines` | — | — |
| `/machines/[no]` | MachineTimeline | — |
| `/workforce` | dispatcher (plan/hours/queue) | — |
| `/workforce?tab=plan` | PlanGrid | assignSession, deleteSessionFromGrid |
| `/workforce?tab=hours` | HoursScreen | — |
| `/workforce?tab=queue` | ApproveScreen | bulkApproveSessions, approveSession, returnSession |
| `/team` | (engineers list) | — |
| `/me` | MeScreen | — |
| `/checklists` | NEW — template editor | — (new feature) |
| `/checklists/[code]` | NEW — template editor for code | — |

### Phase 3 — New workflows from design

1. **Clock-in system** (5 sheets in design): Smart Start → TimerChip → Active Session → Clock-out Review → Change Activity → Switch Case
2. **Notifications panel**
3. **Smart Paste Sheet** — wrap parseTitleSmart
4. **Role switcher** in /me (localStorage flag until auth ships)
5. **Sync queue / offline banner**
6. **Checklist system** — see dedicated section below

### Phase 4 — Polish + merge

Test → user signs off → `git merge redesign → main`

---

## 🆕 Checklist System (NEW FEATURE)

A&R has 12 PM checklist templates from PDFs that need to become an in-app system. Engineers run them at customer sites, admin manages templates.

### Source data (12 templates from PDFs)

| Code | Machine type | Sections | Source PDF |
|---|---|---|---|
| 11 | MCVP8-V1 Control Unit | 21 | Checklist_MCVP8_V1.pdf, 7504_-_CheckList_-_11_-_MCVP8.pdf |
| 12 | MEVP Packing Unit | 8 | 7504_-_CheckList_-_12_-_MEVP.pdf |
| 34 | MITSF Identification | 11 | 7504_-_CheckList_-_34_-_MITSF.pdf |
| 42 | Focovision SR2 | 5 | 7504_-_CheckList_-_42_-_Focovision_SR2.pdf |
| 44 | Focovision SPV2 | 7 | 7504_-_CheckList_-_44_-_Focovision_SPV2.pdf |
| 46 | LensMapper DLM | 4 | 7504_-_CheckList_-_46_-_LensMapper_DLM.pdf |
| D1 | ProMapper | 8 | 7504_-_CheckList_-_D1_-_ProMapper.pdf |
| F1 | MTVP4 AutoInker | 10 | 7504_-_CheckList_-_F1_-_MTVP4.pdf |
| F2 | MCVP4-001/14 AutoMapper | 12 | 7504_-_CheckList_-_F2_-_MCVP4.pdf |
| F3 | MCVP4-V3 AutoMapper | 12 | 7504_-_CheckList_-_F3_-_MCVP4-V3.pdf |
| H1 | Focovision SPV3 | 7 | 7504_-_CheckList_-_H1_-_Focovision_SPV3.pdf |
| H2 | Focovision SR3 | 5 | 7504_-_CheckList_-_H2_-_Focovision_SR3.pdf |

**110 sections, ~600+ items total.** Patterns observed:
- Code format: `{NN}-{MACHINE}-{VERSION}`
- Many sections repeat across templates (PPOS, TLS, DLM+, General, Computer, Calibration, Conveyor) → support shared sections
- Optional sections (UV inking, WAX, Spectrometer, Marking, Centring gripper, Polarisation, Angular gripper) → toggleable per machine instance
- Item format: `{section}.{item} {description}` (e.g. "1.1 Exchange of suction cup")
- Some items have hyperlinks (underlined) → guide URLs

### Data model — add to schema

```sql
-- Template definitions (admin maintains)
create table checklist_templates (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,           -- "F3", "11", "H1"
  name text not null,                  -- "MCVP4-V3", "MCVP8-V1"
  full_name text,                      -- "MCVP4-V3 — AutoMapper"
  unit_type text,                      -- "Control Unit", "Packing", "Identification"
  version text default '1.0',
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by text references engineers(code),
  updated_by text references engineers(code)
);

create table checklist_template_sections (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references checklist_templates(id) on delete cascade,
  order_num int not null,              -- 1, 2, 3...
  code text not null,                  -- "§1", "§2"
  name text not null,                  -- "Loading station", "Turntable"
  is_optional boolean default false,   -- can be toggled off
  shared_section_id uuid references checklist_template_sections(id),  -- references master shared section
  notes text,
  unique (template_id, order_num)
);

create table checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references checklist_template_sections(id) on delete cascade,
  order_num int not null,
  code text not null,                  -- "1.1", "2.3"
  description text not null,
  photo_required boolean default false,
  is_required boolean default false,   -- must complete to submit
  guide_url text,                      -- link to PDF/video procedure
  notes text,
  unique (section_id, order_num)
);

-- Mapping machines → templates (one machine = one template)
create table machine_checklist_mappings (
  machine_no text references machines(machine_no) on delete cascade,
  template_id uuid references checklist_templates(id),
  enabled_sections uuid[],             -- which optional sections are on for this machine
  primary key (machine_no)
);

-- Engineer runs a checklist for a specific case
create table case_checklists (
  id uuid primary key default gen_random_uuid(),
  so_number text references cases(so_number) on delete cascade,
  machine_no text references machines(machine_no),
  template_id uuid references checklist_templates(id),
  template_version text,
  started_at timestamptz default now(),
  completed_at timestamptz,
  submitted_at timestamptz,
  submitted_by text references engineers(code),
  status text default 'in_progress'    -- in_progress, completed, submitted, verified
    check (status in ('in_progress', 'completed', 'submitted', 'verified'))
);

-- Each item result
create table case_checklist_results (
  id uuid primary key default gen_random_uuid(),
  case_checklist_id uuid references case_checklists(id) on delete cascade,
  item_id uuid references checklist_template_items(id),
  status text                          -- ok, ng, na, pending
    check (status in ('ok', 'ng', 'na', 'pending')),
  note text,
  photo_urls text[],                   -- Supabase Storage URLs
  completed_by text references engineers(code),
  completed_at timestamptz,
  unique (case_checklist_id, item_id)
);

-- Indexes
create index idx_case_checklists_so on case_checklists(so_number);
create index idx_case_checklist_results_checklist on case_checklist_results(case_checklist_id);
```

### UI — Checklist Runner (engineer at site)

Route: `/cases/[so]/checklist` (inside case detail, tab "Checklist")

**Mobile (primary use case):**
- Header: case + machine + "X / Y · 26%" progress bar
- Section chips at top (horizontal scroll): completed green / in-progress amber / pending gray
- Items list:
  - Pending: white bg, gray border, big checkbox
  - Active (currently focused): white bg, **red 2px border**, action buttons inline (OK / NG / N/A · Photo · Note · Guide)
  - OK: green bg with checkmark icon, time stamp
  - NG: red bg with alert icon + **mandatory note** + photos
  - N/A: gray bg with minus icon
- Sticky bottom: "Save draft" + "Continue ↓"

**Tap interaction:**
- Tap item → expand to show OK/NG/N/A buttons
- Tap OK → save instantly, advance to next
- Tap NG → require note before save
- Photo button → opens camera or file picker
- Guide button → opens modal with PDF/video

### UI — Template Editor (admin)

Route: `/checklists` (list) and `/checklists/[code]` (editor)

**Desktop layout:**
- Left sidebar (220px): list of templates with `code` badge + machine name + item count
- Main area:
  - Header: code · name · version · "active" badge · last edited info
  - Action buttons: Versions / Preview / Save
  - Tabs: Sections | Linked machines (47) | Settings
  - Sections list (collapsible accordions):
    - Each section: §N · name · item count · optional/shared tags · edit/delete buttons
    - Expanded: items inline with code, description, "photo" / "required" tags, edit button
    - "+ Add item" at bottom of each section
  - "+ Add section" button at bottom (or "import from another template")

**Features:**
- Sections can be marked `is_optional` (toggleable per machine instance)
- Sections can be marked `is_shared` (reused across templates, e.g. "General", "Calibration")
- Versioning: create new version → keep old templates linked to historical cases
- Preview mode → see what runner will look like

### Import seed data

The 12 PDFs are in user uploads. After deploying the schema:
1. Write a one-time import script (e.g. `sql/import-checklists.sql` or `scripts/import-checklists.ts`)
2. Parse each PDF (use existing chat history — already done at `/home/claude/checklists.json` from earlier session, or re-parse)
3. Insert templates + sections + items
4. Run once on dev DB, verify, then on prod

### Workflow

```
1. Admin creates/imports templates (one-time)
2. Admin assigns template to each machine (via machine_checklist_mappings)
3. Engineer opens PM case → "Checklist" tab
4. System loads template based on case.machine_no
5. Engineer ticks items at site
6. Each NG requires note + (optionally) photo
7. Engineer clicks "Submit"
8. Admin verifies in case detail
9. Optional: NG items auto-generate follow-up Curative cases
10. Service Report DOCX (Sprint 7) uses checklist results
```

---

## Data model (Supabase tables)

Existing:
- **cases** — so_number (PK), sr_number, title, description, service_type_code, service_type_name, customer_code, customer_name, machine_no, project_code, status, due_date, source, planner_note, contact_name, customer_po, created_at, close_date
- **sessions** — id, so_number (nullable), engineer_code, session_date, travel_minutes, work_minutes, office_minutes, break_minutes, activity_type, type_code, is_weekend, is_holiday, work_done, source, approval_status, approved_at
- **customers** — code (PK), name, city, country, address, notes, contact_name, contact_mobile
- **machines** — machine_no (PK), customer_code, customer_name, name, product_code, serial_no, version, warranty_expiry, installation_date, notes
- **engineers** — code (PK), full_name, role, is_active
- **case_machines** — id, so_number, machine_no, is_primary
- **case_engineers** — so_number, engineer_code, is_lead
- **customer_contacts** — id, customer_code, name, role, phone, email, is_primary
- **session_approval_log** — session_id, action, notes

New (Checklist):
- **checklist_templates**
- **checklist_template_sections**
- **checklist_template_items**
- **machine_checklist_mappings**
- **case_checklists**
- **case_checklist_results**

### Service Types (9 D365 codes)
7505 Curative · 7504 Installation · 7515 Curative under Warranty · 7508 Upgrade · 7507 PM · 7512 Service Agreement · 7235 Service Promotion · 7506 Customer Training · 7506-1 Internal Training

### Engineers
Field: JKH (Job), PSU, RKO, TCH, RMA, IRO, KBU, JYE, SSU, UKA
Admin: PPI, SPE, CCH, LRO

### Session type colors (already in design)
T (green) · V (dark green) · A (gray) · PERS (light blue) · AL (lavender) · SICK (dark gray) · WFH (cream) · OFF (beige) · Weekend (light red)

---

## Existing server actions (REUSE — never rewrite)

```
src/app/cases/new/actions.ts:
  - createCase, suggestProjectCode, createCustomerInline, createMachineInline, parseTitleSmart

src/app/cases/[so_number]/actions.ts:
  - updateCaseStatus, etc.

src/app/cases/[so_number]/session-actions.ts:
  - createSession, updateSession, deleteSession
  - submitSession, approveSession, returnSession

src/app/workforce/queue/actions.ts:
  - bulkApproveSessions

src/app/planning/actions.ts:
  - assignSession, deleteSessionFromGrid

src/lib/supabase/server.ts: createClient()
src/lib/supabase/service.ts: createServiceClient()
```

### New server actions for Checklist
Create in `src/app/checklists/actions.ts` and `src/app/cases/[so_number]/checklist-actions.ts`:

```
Template management (admin):
  - createTemplate, updateTemplate, deleteTemplate
  - addSection, updateSection, deleteSection
  - addItem, updateItem, deleteItem
  - assignMachineTemplate(machine_no, template_id)

Checklist runner (engineer):
  - startChecklist(so_number) → create case_checklists row
  - updateChecklistItem(case_checklist_id, item_id, status, note, photo_urls)
  - submitChecklist(case_checklist_id)

Admin verification:
  - verifyChecklist(case_checklist_id)
  - generateFollowupCase(case_checklist_id) // auto-create Curative cases for NG items
```

---

## Constraints

- **No new dependencies** unless necessary. Ask first.
- **TypeScript.** Convert all JSX → TSX with types.
- **Server components by default.** `'use client'` only when needed.
- **Tailwind only.** Inline `style={{}}` OK for one-offs.
- **Components in `/src/components/`** — keep pages thin.
- **Mobile-first responsive.** Test 375px AND 1400px.
- **Touch targets ≥44px** on mobile.
- **Commit frequently.**
- **Never rewrite server actions.** Reuse them.
- **Supabase Storage** for checklist photos: bucket `checklist-photos`, public read, authenticated write.

---

## How to start

### Your first response:

1. `git status` and `git branch`
2. `git checkout -b redesign`
3. `ls src/app/` and `ls src/components/`
4. `find src/app -name "actions.ts"`
5. Show me the exact strip plan as bash commands
6. **Wait for my approval** before deleting

### After strip approved:

1. Extract design zip, read every JSX file
2. Read `aroet.css` end-to-end
3. Show me **Phase 1 file plan** as a tree
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
- DOCX report generation — Sprint 7 (uses checklist data)
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
- **Checklist flow**: open PM case → start checklist → tick items → submit → admin verify
- Vercel preview deploys
- User signs off

---

## TL;DR

```
1. git checkout -b redesign
2. Strip: delete page.tsx, loading.tsx, error.tsx, components/*, globals.css
3. Read design zip cold
4. Show Phase 1 file tree plan
5. Wait for approval
6. Build Phase 1 → 2 → 3 → 4
7. Phase 3 includes: Clock-in system + Notifications + Smart Paste + Checklist runner + Template editor
8. Run checklist import script to seed 12 templates
9. Merge redesign → main
```
