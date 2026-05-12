# Fix Patch 2 — Better error messages

## Problem
"Re-parse failed: Case not found" was misleading.

## Real cause (most likely)
`SUPABASE_SERVICE_ROLE_KEY` missing from `.env.local`.

When the env var is missing, the service client connects with `undefined`
as the key → effectively unauthenticated → query returns no rows → "not found".

## Fix steps

### 1. Check .env.local
```bash
cat /workspaces/aroet/.env.local
```

Expected 3 lines:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 2. If service_role missing — get it
Supabase Dashboard → Settings → API → "service_role secret" → copy

### 3. Add to .env.local
```bash
echo 'SUPABASE_SERVICE_ROLE_KEY=eyJ...your-key...' >> /workspaces/aroet/.env.local
```

### 4. Apply this patch
Replace `src/app/cases/[so_number]/actions.ts` with the file in this zip.

### 5. Also add to Vercel
Vercel → Project → Settings → Environment Variables → add `SUPABASE_SERVICE_ROLE_KEY` for Production.

### 6. Restart dev server
```bash
Ctrl+C
rm -rf .next
npm run dev
```

### 7. Hard refresh + try re-parse again
Now if anything fails, you'll get a specific error message
(missing env var, RLS rejection, etc) instead of "Case not found".
