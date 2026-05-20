"use server";

import { currentUser, isApprover } from "@/lib/auth/current-user";
import type { DemoRole, ApproverCode } from "./role-types";

/**
 * Backwards-compat shims for code that still calls getDemoRole / getActingAs.
 * After phase 6a these resolve to the real signed-in user's role and code,
 * not the demo cookie. The setDemoRole / setActingAs writers are no-ops now
 * (kept so old callers don't crash; the /me UI dropped them in phase 6a).
 */

export async function getDemoRole(): Promise<DemoRole> {
  const me = await currentUser();
  if (me && isApprover(me.role)) return "admin";
  return "engineer";
}

export async function getActingAs(): Promise<ApproverCode> {
  const me = await currentUser();
  if (me && (me.code === "PPI" || me.code === "CCH" || me.code === "LRO" || me.code === "SPE" || me.code === "JKH")) {
    // JKH is an honorary approver code while Job is the only admin tester.
    return me.code as ApproverCode;
  }
  return "PPI";
}

export async function setDemoRole(_role: DemoRole): Promise<void> {
  // Demo toggle is gone after auth — real role comes from engineers.role.
  void _role;
}

export async function setActingAs(_code: ApproverCode): Promise<void> {
  void _code;
}
