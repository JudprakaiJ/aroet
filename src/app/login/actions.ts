"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { hashPin, verifyPin } from "@/lib/auth/password";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SEC,
  signSessionToken,
} from "@/lib/auth/session";
import { checkLockout, recordFail, recordSuccess } from "@/lib/auth/rate-limit";

export type LoginEngineer = {
  code: string;
  full_name: string | null;
  role: string | null;
  has_pin: boolean;
};

export async function listLoginEngineers(): Promise<LoginEngineer[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("engineers")
    .select("code, full_name, role, pin_hash, is_active")
    .eq("is_active", true)
    .order("role", { ascending: false })
    .order("code", { ascending: true });
  if (error) {
    console.error("[listLoginEngineers]", error.message);
    return [];
  }
  return (data ?? []).map((e) => ({
    code: e.code,
    full_name: e.full_name,
    role: e.role,
    has_pin: Boolean(e.pin_hash),
  }));
}

async function setSessionCookie(code: string): Promise<void> {
  const store = await cookies();
  const token = await signSessionToken(code);
  store.set(SESSION_COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export async function loginWithPin(
  code: string,
  pin: string
): Promise<{ success: boolean; error?: string }> {
  if (!code) return { success: false, error: "Engineer required" };
  if (!/^\d{4}$/.test(pin)) return { success: false, error: "PIN must be 4 digits" };

  const lock = await checkLockout(code);
  if (!lock.allowed) {
    return {
      success: false,
      error: `Too many wrong PINs. Try again in ${lock.lockedForMin} minute${
        lock.lockedForMin === 1 ? "" : "s"
      }.`,
    };
  }

  const supabase = createServiceClient();
  const { data: eng } = await supabase
    .from("engineers")
    .select("code, pin_hash, is_active")
    .eq("code", code)
    .maybeSingle();
  if (!eng || !eng.is_active) {
    return { success: false, error: "Engineer not found or inactive" };
  }
  if (!eng.pin_hash) {
    return { success: false, error: "No PIN set yet — use 'Set up PIN' for first-time login" };
  }

  const ok = await verifyPin(pin, eng.pin_hash);
  if (!ok) {
    await recordFail(code);
    const post = await checkLockout(code);
    const tail = post.allowed
      ? ` (${post.remaining} tries left)`
      : ` (locked for ${post.lockedForMin} min)`;
    return { success: false, error: `Wrong PIN${tail}` };
  }

  await recordSuccess(code);
  await setSessionCookie(code);
  return { success: true };
}

export async function setPinAndLogin(
  code: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> {
  if (!code) return { success: false, error: "Engineer required" };
  if (!/^\d{4}$/.test(newPin)) return { success: false, error: "PIN must be 4 digits" };

  const supabase = createServiceClient();
  const { data: eng } = await supabase
    .from("engineers")
    .select("pin_hash, is_active")
    .eq("code", code)
    .maybeSingle();
  if (!eng || !eng.is_active) {
    return { success: false, error: "Engineer not found or inactive" };
  }
  if (eng.pin_hash) {
    return { success: false, error: "PIN already set. Use 'Enter PIN' instead." };
  }

  const hash = await hashPin(newPin);
  const { error } = await supabase
    .from("engineers")
    .update({ pin_hash: hash })
    .eq("code", code);
  if (error) return { success: false, error: error.message };

  await recordSuccess(code);
  await setSessionCookie(code);
  return { success: true };
}

export async function changePin(
  currentPin: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> {
  if (!/^\d{4}$/.test(newPin)) return { success: false, error: "New PIN must be 4 digits" };
  const { currentUser } = await import("@/lib/auth/current-user");
  const me = await currentUser();
  if (!me) return { success: false, error: "Not signed in" };

  const supabase = createServiceClient();
  const { data: eng } = await supabase
    .from("engineers")
    .select("pin_hash")
    .eq("code", me.code)
    .maybeSingle();
  if (!eng || !eng.pin_hash) return { success: false, error: "No PIN on file" };
  const ok = await verifyPin(currentPin, eng.pin_hash);
  if (!ok) return { success: false, error: "Current PIN is wrong" };

  const hash = await hashPin(newPin);
  const { error } = await supabase
    .from("engineers")
    .update({ pin_hash: hash })
    .eq("code", me.code);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
