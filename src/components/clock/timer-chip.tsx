"use client";

import { useEffect, useRef, useState } from "react";
import { computeElapsedMinutes, type ActiveSession } from "@/lib/clock/types";

type Props = {
  session: ActiveSession;
  onClick?: () => void;
  onLongPress?: () => void;
  variant?: "appbar" | "desktop";
};

const LONG_PRESS_MS = 600;

export function TimerChip({ session, onClick, onLongPress, variant = "appbar" }: Props) {
  const [, setTick] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const firedLongRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const start = () => {
    if (!onLongPress) return;
    firedLongRef.current = false;
    timerRef.current = setTimeout(() => {
      firedLongRef.current = true;
      onLongPress();
    }, LONG_PRESS_MS);
  };
  const cancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  const handleClick = () => {
    if (firedLongRef.current) {
      firedLongRef.current = false;
      return;
    }
    onClick?.();
  };

  const min = computeElapsedMinutes(session);
  const h = Math.floor(min / 60);
  const m = min % 60;
  const paused = Boolean(session.paused_at);
  const height = variant === "desktop" ? 30 : 32;

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      aria-label="active session"
      title={onLongPress ? "Tap: details · Hold: emergency switch" : undefined}
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
