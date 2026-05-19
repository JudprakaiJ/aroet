"use client";

import { useEffect, useState } from "react";
import { computeElapsedMinutes, type ActiveSession } from "@/lib/clock/types";

type Props = {
  session: ActiveSession;
  onClick?: () => void;
  variant?: "appbar" | "desktop";
};

export function TimerChip({ session, onClick, variant = "appbar" }: Props) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const min = computeElapsedMinutes(session);
  const h = Math.floor(min / 60);
  const m = min % 60;
  const paused = Boolean(session.paused_at);
  const height = variant === "desktop" ? 30 : 32;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="active session"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "0 10px",
        borderRadius: 8,
        background: paused ? "var(--surface-2)" : "var(--red-50)",
        border: "1px solid",
        borderColor: paused ? "var(--line)" : "var(--red-line)",
        color: paused ? "var(--ink-3)" : "var(--red)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: ".02em",
        height,
        cursor: "pointer",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          background: paused ? "var(--ink-4)" : "var(--red)",
          animation: paused ? "none" : "pulse-presence 1.2s infinite",
        }}
      />
      <span className="mono">
        {h}:{m.toString().padStart(2, "0")}
      </span>
      <span style={{ opacity: 0.7 }}>{session.type_code}</span>
      {paused && <span>· PAUSED</span>}
    </button>
  );
}
