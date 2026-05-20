"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { CasePickerSheet } from "./case-picker-sheet";
import { startOfficeSession } from "@/app/clock/actions";
import type { DashboardCase } from "@/app/dashboard/queries";

type Props = {
  engineerCode: string;
  cases: DashboardCase[];
};

export function SmartStartCTA({ engineerCode, cases }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const noCases = cases.length === 0;

  const onStartOffice = () => {
    setError(null);
    startTransition(async () => {
      const r = await startOfficeSession();
      if (!r.success) setError(r.error ?? "Could not start office session");
    });
  };

  return (
    <>
      <div
        className="card"
        style={{
          padding: 16,
          display: "flex",
          gap: 12,
          alignItems: "center",
          background: "linear-gradient(180deg, var(--red-50), var(--surface))",
          borderColor: "var(--red-line)",
        }}
      >
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={noCases}
          aria-label="Pick case"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: noCases ? "var(--ink-5)" : "var(--red)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
            cursor: noCases ? "not-allowed" : "pointer",
            border: "none",
          }}
        >
          <Icon name="play" size={20} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
            Ready when you are, {engineerCode}
          </div>
          <div
            className="sub"
            style={{
              textTransform: "none",
              letterSpacing: 0,
              fontSize: 12,
              color: "var(--ink-3)",
              marginTop: 2,
            }}
          >
            {noCases
              ? "No active cases — start office time for admin work."
              : "Tap to clock in on a case, or start office time."}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flex: "none" }}>
          <button
            type="button"
            className="dt-pill"
            onClick={onStartOffice}
            disabled={pending}
            title="Start office time"
          >
            <Icon name="doc" size={12} /> Office
          </button>
          {!noCases && (
            <button
              type="button"
              className="dt-pill primary"
              onClick={() => setPickerOpen(true)}
              disabled={pending}
            >
              <Icon name="play" size={12} /> Case
            </button>
          )}
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
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          <Icon name="alert" size={12} /> {error}
        </div>
      )}

      <CasePickerSheet open={pickerOpen} onClose={() => setPickerOpen(false)} cases={cases} />
    </>
  );
}
