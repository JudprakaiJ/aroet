# AROET Block 3 — `src/` bundle

## What's included

Replace your entire `src/` folder with this bundle. Contains:

```
src/
├── app/
│   ├── globals.css                  ← updated theme (white + AR red accent)
│   ├── layout.tsx                   ← uses TopNav
│   ├── page.tsx                     ← Dashboard
│   ├── cases/
│   │   ├── page.tsx                 ← list 100 cases
│   │   └── [so_number]/page.tsx     ← case detail (sessions, machine, engineers)
│   ├── machines/
│   │   ├── page.tsx                 ← list + Unknown version filter
│   │   └── [machine_no]/page.tsx    ← machine service history
│   ├── customers/page.tsx           ← customer list with machine/case counts
│   ├── engineers/page.tsx           ← team timesheet (this month)
│   ├── planning/page.tsx            ← overdue / due-soon / planned groups
│   └── calendar/page.tsx            ← month calendar grid
├── components/
│   └── top-nav.tsx                  ← horizontal nav (white + AR red)
└── lib/
    ├── format.ts                    ← shared date/time/status helpers
    └── supabase/
        ├── client.ts
        └── server.ts
```

## How to install in Codespace

1. Delete current `src/` folder
2. Extract this zip into the project root — it will recreate `src/`
3. `npm run dev` (should already be running)

If you need to run `npm install` again — none of the packages changed.

## What works

- Dashboard with active/total counts + upcoming cases
- All 6 navigation menus (Cases / Customers / Machines / Planning / Calendar / Team)
- Click any SO number → detail page
- Click any machine number → service history
- Calendar shows cases by due date
- Planning groups by overdue / due-soon / later

## What's NOT implemented yet (Block 4+)

- Adding/editing sessions (currently read-only)
- Checklist UI
- Document generation (Service Report / Acceptance PDF)
- Login + admin toggle
- Setting machine `hardware_version` from UI
