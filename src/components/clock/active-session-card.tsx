"use client";

import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { TypeBlock } from "@/components/primitives/type-block";
import { ActiveSessionSheet } from "./active-session-sheet";
import { ClockOutReviewSheet } from "./clock-out-review-sheet";
import { computeElapsedMinutes, type ActiveSession } from "@/lib/clock/types";

const ACTIVITY_ICON: Record<string, IconName> = {
  field: "wrench",
  travel: "car",
  remote: "cloud",
  office: "doc",
  training: "clip-list",
  upgrade: "trending-up",
};

export function ActiveSessionCard({ session }: { session: ActiveSession }) {
  const [, setTick] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const min = computeElapsedMinutes(session);
  const h = Math.floor(min / 60);
  const m = min % 60;
  const paused = Boolean(session.paused_at);
  const icon = ACTIVITY_ICON[session.activity_type] ?? "wrench";

  return (
    <>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="card"
        style={{
          padding: 14,
          display: "flex",
          gap: 12,
          alignItems: "center",
          background: paused
            ? "var(--surface)"
            : "linear-gradient(180deg, var(--red-50), var(--surface))",
          borderColor: paused ? "var(--line)" : "var(--red-line)",
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: paused ? "var(--surface-2)" : "var(--red)",
            color: paused ? "var(--ink-3)" : "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
            position: "relative",
          }}
        >
          <Icon name={icon} size={20} />
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              width: 10,
              height: 10,
              borderRadius: 5,
              background: paused ? "var(--ink-4)" : "var(--red)",
              border: "2px solid var(--surface)",
              animation: paused ? "none" : "pulse-presence 1.2s infinite",
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <TypeBlock t={session.type_code} />
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: ".06em",
                color: paused ? "var(--ink-3)" : "var(--red)",
                textTransform: "uppercase",
              }}
            >
              {paused ? "Paused" : "Clocked in"}
            </span>
          </div>
          <div className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
            {session.case_title ??
              session.so_number ??
              (session.activity_type === "office" ? "Office time" : "Active session")}
          </div>
          <div
            className="sub truncate"
            style={{ textTransform: "none", letterSpacing: 0, fontSize: 11.5, color: "var(--ink-3)" }}
          >
            {session.customer_name ??
              session.so_number ??
              (session.activity_type === "office" ? "Admin / reports / calls" : "—")}
          </div>
        </div>
        <div
          className="mono"
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: paused ? "var(--ink-3)" : "var(--ink)",
            flex: "none",
          }}
        >
          {h}:{m.toString().padStart(2, "0")}
        </div>
      </button>

      <ActiveSessionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        session={session}
        onRequestClockOut={() => {
          setSheetOpen(false);
          setReviewOpen(true);
        }}
      />
      <ClockOutReviewSheet
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        session={session}
      />
    </>
  );
}
