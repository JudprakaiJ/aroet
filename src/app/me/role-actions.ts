"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  ROLE_COOKIE,
  ACTING_AS_COOKIE,
  APPROVERS,
  DEFAULT_APPROVER,
  type DemoRole,
  type ApproverCode,
} from "./role-types";

export async function setDemoRole(role: DemoRole): Promise<void> {
  const store = await cookies();
  store.set(ROLE_COOKIE, role, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}

export async function getDemoRole(): Promise<DemoRole> {
  const store = await cookies();
  const v = store.get(ROLE_COOKIE)?.value;
  return v === "engineer" ? "engineer" : "admin";
}

export async function setActingAs(code: ApproverCode): Promise<void> {
  const store = await cookies();
  if (!(APPROVERS as readonly string[]).includes(code)) return;
  store.set(ACTING_AS_COOKIE, code, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}

export async function getActingAs(): Promise<ApproverCode> {
  const store = await cookies();
  const v = store.get(ACTING_AS_COOKIE)?.value;
  if (v && (APPROVERS as readonly string[]).includes(v)) return v as ApproverCode;
  return DEFAULT_APPROVER;
}
