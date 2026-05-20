"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { setDemoRole } from "./role-actions";
import type { DemoRole } from "./role-types";

type Props = {
  current: DemoRole;
};

export function RoleSwitcher({ current }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const set = (next: DemoRole) => {
    if (next === current) return;
    startTransition(async () => {
      await setDemoRole(next);
      router.refresh();
    });
  };

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="kicker" style={{ marginBottom: 8 }}>
        Demo · view as
      </div>
      <div className="tabs" role="tablist">
        <button
          type="button"
          data-active={current === "admin"}
          onClick={() => set("admin")}
          disabled={pending}
        >
          <Icon name="star" size={12} /> Admin
        </button>
        <button
          type="button"
          data-active={current === "engineer"}
          onClick={() => set("engineer")}
          disabled={pending}
        >
          <Icon name="wrench" size={12} /> Engineer
        </button>
      </div>
      <div
        className="sub"
        style={{
          textTransform: "none",
          letterSpacing: 0,
          fontSize: 11.5,
          color: "var(--ink-3)",
          marginTop: 8,
        }}
      >
        {current === "admin"
          ? "Approvals + reports + customer/machine admin visible in the sidebar."
          : "Field-engineer view: Workspace only — Admin section hidden."}
        <br />
        Persisted in a cookie; toggles the whole shell (sidebar + bottom-nav). Real per-user gating ships with auth (Sprint 6).
      </div>
    </div>
  );
}
