"use client";

import { useState, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { Icon, type IconName } from "@/components/icons";
import { ServiceChip } from "@/components/primitives/service-chip";
import { clockIn } from "@/app/clock/actions";
import type { DashboardCase } from "@/app/dashboard/queries";

type Props = {
  open: boolean;
  onClose: () => void;
  cases: DashboardCase[];
};

const ACTIVITIES: { id: string; label: string; icon: IconName }[] = [
  { id: "field",  label: "Field",  icon: "wrench" },
  { id: "travel", label: "Travel", icon: "car" },
  { id: "remote", label: "Remote", icon: "cloud" },
  { id: "office", label: "Office", icon: "doc" },
];

export function CasePickerSheet({ open, onClose, cases }: Props) {
  const [selected, setSelected] = useState<DashboardCase | null>(null);
  const [activity, setActivity] = useState("field");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setSelected(null);
    setActivity("field");
    setError(null);
  };

  const onStart = () => {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const r = await clockIn({
        so_number: selected.so_number,
        machine_no: selected.machines[0] ?? null,
        activity_type: activity,
      });
      if (r.success) {
        reset();
        onClose();
      } else {
        setError(r.error ?? "Clock-in failed");
      }
    });
  };

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={selected ? "Pick activity" : "Pick a case to clock in"}
      sub={selected ? selected.so_number : `${cases.length} active`}
      footer={
        selected ? (
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={pending}
            onClick={onStart}
          >
            {pending ? "Starting…" : "Start clock-in"}
          </button>
        ) : undefined
      }
    >
      <div style={{ padding: 14 }}>
        {!selected ? (
          cases.length === 0 ? (
            <div className="sub" style={{ padding: 18, textTransform: "none", letterSpacing: 0, fontSize: 13, textAlign: "center" }}>
              No active cases assigned to you. Open <a href="/cases">Cases</a> to find one.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {cases.map((c) => (
                <button
                  key={c.so_number}
                  type="button"
                  onClick={() => setSelected(c)}
                  className="card row-link"
                  style={{
                    padding: 12,
                    textAlign: "left",
                    display: "block",
                    width: "100%",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)" }}>
                      {c.so_number}
                    </span>
                    {c.service_type_code && <ServiceChip typ={c.service_type_code} />}
                  </div>
                  <div className="truncate" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                    {c.title ?? "Untitled"}
                  </div>
                  <div
                    className="sub truncate"
                    style={{ textTransform: "none", letterSpacing: 0, fontSize: 11.5, color: "var(--ink-3)" }}
                  >
                    {c.customer_name ?? "—"}
                    {c.machines.length > 0 ? ` · ${c.machines[0]}` : ""}
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="card-flat" style={{ padding: 12 }}>
              <div className="kicker" style={{ marginBottom: 4 }}>
                Case
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                {selected.title ?? selected.so_number}
              </div>
              <div className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                {selected.customer_name ?? "—"}
                {selected.machines.length > 0 ? ` · ${selected.machines[0]}` : ""}
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setSelected(null)}
                style={{ marginTop: 8, padding: 0, minHeight: 20, fontSize: 11, color: "var(--ink-3)" }}
              >
                ← Pick another
              </button>
            </div>

            <div>
              <label className="fieldlbl">Activity</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ACTIVITIES.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="fchip"
                    data-on={activity === a.id || undefined}
                    onClick={() => setActivity(a.id)}
                  >
                    <Icon name={a.icon} size={14} /> {a.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div
                className="card"
                style={{
                  padding: 10,
                  background: "var(--danger-soft)",
                  borderColor: "rgba(220,38,38,.3)",
                  color: "var(--danger)",
                  fontSize: 13,
                }}
              >
                <Icon name="alert" size={12} /> {error}
              </div>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
