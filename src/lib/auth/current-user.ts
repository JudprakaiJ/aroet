import "server-only";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./session";

export type Role = "engineer" | "tech_manager" | "admin" | "boss";

export type CurrentUser = {
  code: string;
  full_name: string | null;
  role: Role;
};

let cache: { token: string; user: CurrentUser | null } | null = null;

/**
 * Resolve the current logged-in engineer from the session cookie.
 * Returns null when not authenticated. Cached per request via a
 * module-level variable keyed on the raw token string.
 */
export async function currentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  if (cache && cache.token === token) return cache.user;

  const session = await verifySessionToken(token);
  if (!session) {
    cache = { token, user: null };
    return null;
  }

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("engineers")
    .select("code, full_name, role, is_active")
    .eq("code", session.code)
    .maybeSingle();
  if (!data || !data.is_active) {
    cache = { token, user: null };
    return null;
  }

  const user: CurrentUser = {
    code: data.code,
    full_name: data.full_name,
    role: (data.role as Role) ?? "engineer",
  };
  cache = { token, user };
  return user;
}

export function isApprover(role: Role): boolean {
  return role === "admin" || role === "boss";
}

/** Helpful when an action only makes sense for a logged-in user. */
export async function requireUser(): Promise<CurrentUser> {
  const u = await currentUser();
  if (!u) throw new Error("Not authenticated");
  return u;
}

/** For action paths that need admin-level role (approvals, bulk reparse). */
export async function requireApprover(): Promise<CurrentUser> {
  const u = await requireUser();
  if (!isApprover(u.role)) throw new Error("Admin role required");
  return u;
}

/**
 * Convenience for pages: returns current user's engineer code, falling back
 * to JKH if somehow the session is missing (middleware should prevent this).
 */
export async function meCode(): Promise<string> {
  const u = await currentUser();
  return u?.code ?? "JKH";
}
