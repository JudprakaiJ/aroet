# AROET Phase 1 — Build Bundle

Internal field-service tool for **A&R Optical Equipment (Thailand)**.
Built on Next.js 15 + TypeScript + Tailwind v4 + Supabase + Vercel.

---

## What's in this bundle

```
aroet-phase1/
├── sql/
│   ├── 01_migration.sql              # Schema changes + new tables
│   ├── 02_seed_checklists.sql        # Seeds 6 PM templates from A&R PDFs
│   ├── 03_workforce_approvals.sql    # NEW: session approvals + engineer role
│   └── checklist-data.json           # Reference (inspect-only)
└── src/
    ├── app/
    │   ├── layout.tsx, page.tsx, globals.css
    │   ├── cases/
    │   │   ├── page.tsx                # Card list with filter chips + Bulk parse button
    │   │   ├── new/                    # New case form (paste & parse)
    │   │   └── [so_number]/            # Detail with 6 tabs
    │   ├── customers/page.tsx
    │   ├── machines/page.tsx, [machine_no]/page.tsx
    │   ├── engineers/page.tsx          # Timesheet
    │   ├── planning/page.tsx           # Overdue / Due 30d / Later
    │   ├── workforce/                  # NEW
    │   │   ├── page.tsx                  # Server: load engineers + sessions
    │   │   ├── calendar.tsx              # Client: heat map + expandable rows + approval
    │   │   └── actions.ts                # submit / approve / return / bulkApproveByPeriod
    │   └── admin/bulk-reparse/         # Bulk parse all cases
    ├── components/top-nav.tsx          # 6 menu items (added Workforce)
    └── lib/
        ├── format.ts                     # Badges, time formatting
        ├── pay-period.ts                 # NEW: 1-20 / 21-end / custom helper
        ├── planner/parser.ts             # v5 parser (with holiday detection)
        └── supabase/{client,server,service}.ts
        ├── planner/
        │   ├── parser.ts                 # Parser v5 (sessions+refs+admin_log)
        │   └── time-input.ts             # "1h30" → 90 helper for forms
        └── supabase/
            ├── client.ts, server.ts      # @supabase/ssr
            └── service.ts                # Service role (bypass RLS)
```

---

## How to deploy

### Step 1 — Run SQL in Supabase

Open Supabase SQL Editor at https://supabase.com/dashboard

Paste & run **in order**:

1. **`sql/01_migration.sql`** — adds columns to `sessions`, creates new tables (`case_references`, `admin_log`, `checklist_templates`, etc.), grants permissions, disables RLS.
2. **`sql/02_seed_checklists.sql`** — seeds 6 templates from official A&R Belgium PDFs (DLM 29 items, MCVP4 88, MCVP8 V1 120, MCVP8 V2 134, SPV2 45, SPV3 44 = **460 items total**).
3. **`sql/03_workforce_approvals.sql`** — adds `is_customer_related` + `approval_status` columns to `sessions`, creates `session_approval_log` audit table, adds `role` to `engineers` and backfills team roles (PPI=boss, SPE=tech_manager, CCH/LRO=admin, others=engineer).

After both run, you should see:
```
template       sections  items
---            ---       ---
DLM              4        29
MCVP4           12        88
MCVP8 V1        16       120
MCVP8 V2        16       134
SPV2             7        45
SPV3             7        44
```

### Step 2 — Replace src/ in the Codespace repo

In the Codespace terminal:

```bash
cd /workspaces/aroet
rm -rf src/
# Then unzip this bundle's src/ into /workspaces/aroet/
```

### Step 3 — Verify environment variables

`.env.local` (already set up):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...     # NEW — for write operations
```

If `SUPABASE_SERVICE_ROLE_KEY` is missing, copy it from Supabase Dashboard → Settings → API → service_role key.

Add the same key to **Vercel** → Project → Settings → Environment Variables.

### Step 4 — Push & deploy

```bash
cd /workspaces/aroet
git add -A
git commit -m "Phase 1: parser v5 + cases UI + checklist seed"
git push
```

Vercel auto-deploys from main.

---

## What works after deploy

### Cases (`/cases`)
- Card list with filter chips: All / Active / Overdue / PM / Curative
- Search via `?q=...`
- AROET cases (manually created) have purple badge
- Overdue cases have red border-left

### New Case (`/cases/new`)
- Paste content from Planner → auto-parse:
  - Title (first line if not date)
  - Sessions (per engineer, per day)
  - References (CS, GI, Invoice numbers)
  - Admin log (invoice sent, RS done, acceptance signed)
- Customer / Machine autocomplete dropdowns
- Engineer chips with lead star (★)
- AROET SO format: `SO{YYMM}-AR-{NNN}` (e.g. `SO2611-AR-001`)

### Case Overview (`/cases/[so_number]`)
- Header + 4 stats
- Green banner if parsed
- **6 tabs**: Sessions / References / Admin log / Machine / Engineers / Planner note
- Re-parse button with confirm dialog (deletes only `source='planner'`, keeps manual)
- Session cards grouped by day
  - Activity badge (Field / Travel / Remote / Training / Upgrade / Office)
  - T (travel) / B (break) / W (work) / AR (office) chips
  - Weekend flag (amber)
  - Manual ✋ vs Parsed 🪄 indicator
  - SO-switch link (→ SO2509-19)
  - Parse warnings (⚠)

### Machines / Customers / Team / Planning / Calendar
- Machine detail with full case history per serial
- Customer list with machine + case counts
- Team timesheet (current month) with weekend hours separated
- Planning groups: Overdue / Due 30d / Later
- Calendar month grid

---

## What's NOT in Phase 1 (saved for Phase 2)

```
❌ Checklist Editor UI                 (schema seeded; UI not built)
❌ PM Execution UI (PASS/FAIL/photos)  (schema ready; UI not built)
❌ Pay/Billing rules                   (raw time stored; calc done in Excel)
❌ Document generation                 (Service Report, Acceptance .docx)
❌ Login / auth / permissions          (Phase 1 is open access)
❌ Add Session form (in Overview)      (re-parse handles most cases)
```

---

## Schema reference (Phase 1 changes)

### `sessions` — added columns
```
source               'manual' | 'planner'  (default: manual)
break_minutes        int                    (default: 0)
work_minutes         int                    (replaces normal_minutes)
office_minutes       int                    (AR= time, default: 0)
activity_type        field | travel | remote | training | upgrade | office
is_holiday           boolean                (default: false)
is_weekend           boolean                (auto from session_date)
switched_to_so       text                   (SO number, if mid-day switch)
parse_warning        text                   (computed != planner warning)
raw_line             text                   (original planner line, for debug)
```

### New tables
```
case_references     — GI/CS/INVOICE/QUOTE numbers (parser-extracted, editable)
admin_log           — invoice_sent, rs_done, acceptance_signed events

checklist_templates — 6 seeded (DLM, MCVP4, MCVP8 V1/V2, SPV2, SPV3)
checklist_sections, checklist_items
case_checklists, case_checklist_item_results,
case_checklist_section_results, case_checklist_parts, case_checklist_photos
                    — placeholders for Phase 2 PM Execution UI
```

---

## Parser v5 — the 4 fixes from v4

| Fix | Issue | Fix |
|-----|-------|-----|
| **A** | `AR=time-block` (e.g. `AR=13:30-17:15`) was missed | Extract as `office_minutes` |
| **B** | `(+1h30')` in travel was counted as break (was timezone offset) | Detect `+/-` prefix → ignore |
| **C** | `(30 minutes lunch)` wasn't counted as break | Match "X minutes/hour" patterns |
| **D** | Planner's `C=` sometimes wrong vs actual computed | Override planner with computed; flag warning |

Plus:
- Activity type detection (field/travel/remote/training/upgrade/office)
- Reference extraction (CS, GI, GT, INVOICE)
- Admin log extraction (invoice_sent, rs_done, etc.)
- Strip `====` separators from work_done

---

## Roadmap

**Phase 2** (next):
- Checklist Editor UI
- PM Execution screen (PASS/FAIL/N/A + parts + photos)
- Document generation (Service Report, Acceptance)
- Login + permissions

**Phase 3**:
- Pay/Billing rules
- Cross-SO session linking
- Reporting dashboard
