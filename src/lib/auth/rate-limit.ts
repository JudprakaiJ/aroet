import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

const MAX_FAILS = 5;
const LOCKOUT_MINUTES = 10;

export type LockoutStatus =
  | { allowed: true; remaining: number }
  | { allowed: false; lockedForMin: number };

export async function checkLockout(engineerCode: string): Promise<LockoutStatus> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("login_attempts")
    .select("fail_count, locked_until")
    .eq("engineer_code", engineerCode)
    .maybeSingle();
  if (!data) return { allowed: true, remaining: MAX_FAILS };
  if (data.locked_until && new Date(data.locked_until) > new Date()) {
    const lockedForMin = Math.max(
      1,
      Math.ceil((new Date(data.locked_until).getTime() - Date.now()) / 60_000)
    );
    return { allowed: false, lockedForMin };
  }
  return { allowed: true, remaining: Math.max(0, MAX_FAILS - (data.fail_count ?? 0)) };
}

export async function recordFail(engineerCode: string): Promise<void> {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("login_attempts")
    .select("fail_count")
    .eq("engineer_code", engineerCode)
    .maybeSingle();
  const next = (existing?.fail_count ?? 0) + 1;
  const lockedUntil =
    next >= MAX_FAILS ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString() : null;
  await supabase.from("login_attempts").upsert({
    engineer_code: engineerCode,
    fail_count: next,
    last_fail_at: new Date().toISOString(),
    locked_until: lockedUntil,
  });
}

export async function recordSuccess(engineerCode: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("login_attempts").upsert({
    engineer_code: engineerCode,
    fail_count: 0,
    last_fail_at: null,
    locked_until: null,
  });
}
