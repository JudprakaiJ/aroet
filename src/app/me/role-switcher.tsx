"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { setDemoRole, setActingAs } from "./role-actions";
import { APPROVERS, type DemoRole, type ApproverCode } from "./role-types";

type Props = {
  current: DemoRole;
  actingAs: ApproverCode;
};

export function RoleSwitcher({ current, actingAs }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const setRole = (next: DemoRole) => {
    if (next === current) return;
    startTransition(async () => {
      await setDemoRole(next);
      router.refresh();
    });
  };

  const setApprover = (next: ApproverCode) => {
    if (next === actingAs) return;
    startTransition(async () => {
      await setActingAs(next);
      router.refresh();
    });
  };

  return (
    <div className="card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div className="kicker" style={{ marginBottom: 8 }}>
          Demo · view as
        </div>
        <div className="tabs" role="tablist">
          <button
            type="button"
            data-active={current === "admin"}
            onClick={() => setRole("admin")}
            disabled={pending}
          >
            <Icon name="star" size={12} /> Admin
          </button>
          <button
            type="button"
            data-active={current === "engineer"}
            onClick={() => setRole("engineer")}
            disabled={pending}
          >
            <Icon name="wrench" size={12} /> Engineer
          </button>
        </div>
      </div>

      {current === "admin" && (
        <div>
          <div className="kicker" style={{ marginBottom: 6 }}>
            Acting as · approver identity
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {APPROVERS.map((code) => (
              <button
                key={code}
                type="button"
                className="fchip"
                data-on={actingAs === code || undefined}
                onClick={() => setApprover(code)}
                disabled={pending}
              >
                {code}
              </button>
            ))}
          </div>
          <div
            className="sub"
            style={{
              textTransform: "none",
              letterSpacing: 0,
              fontSize: 11,
              color: "var(--ink-3)",
              marginTop: 6,
            }}
          >
            Goes into <span className="mono">approved_by</span> when you approve hours.
          </div>
        </div>
      )}

      <div
        className="sub"
        style={{
          textTransform: "none",
          letterSpacing: 0,
          fontSize: 11.5,
          color: "var(--ink-3)",
          paddingTop: 4,
          borderTop: "1px solid var(--line-2)",
        }}
      >
        {current === "admin"
          ? "Approvals + reports + customer/machine admin visible in the sidebar."
          : "Field-engineer view: Workspace only — Admin section hidden."}
        <br />
        Persisted in a cookie. Real per-user gating ships with auth (Sprint 6).
      </div>
    </div>
  );
}
