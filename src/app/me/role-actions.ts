"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ROLE_COOKIE, type DemoRole } from "./role-types";

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
