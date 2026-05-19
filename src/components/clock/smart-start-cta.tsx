"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { CasePickerSheet } from "./case-picker-sheet";
import type { DashboardCase } from "@/app/dashboard/queries";

type Props = {
  engineerCode: string;
  cases: DashboardCase[];
};

export function SmartStartCTA({ engineerCode, cases }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const disabled = cases.length === 0;

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
          disabled={disabled}
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: disabled ? "var(--ink-5)" : "var(--red)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
            cursor: disabled ? "not-allowed" : "pointer",
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
            {disabled
              ? "No active cases assigned to you yet."
              : "Tap to clock in on one of your active cases."}
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            className="dt-pill primary"
            onClick={() => setPickerOpen(true)}
          >
            <Icon name="play" size={12} /> Clock in
          </button>
        )}
      </div>

      <CasePickerSheet open={pickerOpen} onClose={() => setPickerOpen(false)} cases={cases} />
    </>
  );
}
