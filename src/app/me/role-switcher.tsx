"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";

type Role = "admin" | "engineer";
const KEY = "aroet_role";

export function RoleSwitcher({ defaultRole = "admin" }: { defaultRole?: Role }) {
  const [role, setRole] = useState<Role>(defaultRole);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (stored === "admin" || stored === "engineer") setRole(stored);
    setMounted(true);
  }, []);

  const set = (next: Role) => {
    setRole(next);
    if (typeof window !== "undefined") localStorage.setItem(KEY, next);
  };

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="kicker" style={{ marginBottom: 8 }}>
        Demo · view as
      </div>
      <div className="tabs" role="tablist">
        <button type="button" data-active={role === "admin"} onClick={() => set("admin")}>
          <Icon name="star" size={12} /> Admin
        </button>
        <button type="button" data-active={role === "engineer"} onClick={() => set("engineer")}>
          <Icon name="wrench" size={12} /> Engineer
        </button>
      </div>
      <div
        className="sub"
        style={{ textTransform: "none", letterSpacing: 0, fontSize: 11.5, color: "var(--ink-3)", marginTop: 8 }}
      >
        {mounted ? (role === "admin" ? "Approvals + reports + customer/machine admin visible." : "Field-engineer view: only Workspace.") : "Loading…"}
        <br />
        Server-side gating ships with real auth (Sprint 6); for now this only affects client-rendered preferences.
      </div>
    </div>
  );
}
