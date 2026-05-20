"use server";

import { currentUser, isApprover } from "@/lib/auth/current-user";
import { APPROVERS, type DemoRole, type ApproverCode } from "./role-types";

export async function getDemoRole(): Promise<DemoRole> {
  const me = await currentUser();
  if (me && isApprover(me.role)) return "admin";
  return "engineer";
}

export async function getActingAs(): Promise<ApproverCode> {
  const me = await currentUser();
  if (me && (APPROVERS as readonly string[]).includes(me.code)) {
    return me.code as ApproverCode;
  }
  return "PPI";
}
