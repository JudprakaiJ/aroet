# AROET Fix Patch 1 — Server Actions + Bulk Re-parse

## Two fixes:

### Fix 1: `next.config.ts` — Server Actions allowed origins

**Problem**: Codespace proxy sends mismatched `x-forwarded-host` and `origin` headers.
Next.js Server Actions reject the request with "Invalid Server Actions request".

**Fix**: Replace `next.config.ts` at project root.

### Fix 2: Bulk re-parse admin page

**Problem**: Existing cases (imported from old data) have planner_note but no parsed sessions.
You don't want to manually click "Re-parse" on 883 cases.

**Fix**: New admin page at `/admin/bulk-reparse` — one click re-parses all cases.

---

## How to apply

```bash
cd /workspaces/aroet

# 1. Replace next.config.ts at root
# (overwrite the existing one)

# 2. Copy admin folder into src/app/
# Structure:
#   src/app/admin/bulk-reparse/
#     ├── page.tsx
#     ├── actions.ts
#     └── form.tsx

# 3. Restart dev server
# Ctrl+C the running npm run dev
rm -rf .next
npm run dev
```

## After restart

1. Hard-refresh browser (`Ctrl+Shift+R`)
2. Go to `/admin/bulk-reparse`
3. See stats — should show "Without parsed sessions: 883" or similar
4. Choose "Only empty cases" (recommended)
5. Click "Re-parse N cases" → confirm
6. Wait 30-60 seconds (processes 50 at a time)
7. See result: how many sessions/refs/events inserted + any errors

## What gets re-parsed

For each case with `planner_note`:
- **Sessions**: per engineer, per day (T/B/W/AR + activity_type)
- **References**: CS, GI, GT, Invoice numbers
- **Admin log**: invoice_sent, rs_done, acceptance events

**Existing manual entries are preserved** (parser only deletes `source='planner'`).

## After bulk re-parse

Visit a case like `/cases/SO2601-13` — should now show:
- Stats: 6 sessions, 27h work, 30h30 travel, 2 engineers
- Sessions tab: cards grouped by day with activity badges
- Admin log tab: parsed events from Customer report/Acceptance/RS done lines
