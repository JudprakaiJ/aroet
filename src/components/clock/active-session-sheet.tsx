"use client";

import { useEffect, useState, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { Icon, type IconName } from "@/components/icons";
import { TypeBlock } from "@/components/primitives/type-block";
import { computeElapsedMinutes, type ActiveSession } from "@/lib/clock/types";
import { pauseSession, resumeSession } from "@/app/clock/actions";

type Props = {
  open: boolean;
  onClose: () => void;
  session: ActiveSession;
  onRequestClockOut: () => void;
};

const ACTIVITY_ICON: Record<string, IconName> = {
  field: "wrench",
  travel: "car",
  remote: "cloud",
  office: "doc",
  training: "clip-list",
  upgrade: "trending-up",
};

function fmtElapsedSec(totalMin: number, extraSec: number): string {
  const totalSec = totalMin * 60 + extraSec;
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function ActiveSessionSheet({ open, onClose, session, onRequestClockOut }: Props) {
  const [, setTick] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [open]);

  const min = computeElapsedMinutes(session);
  const extraSec = session.paused_at
    ? 0
    : Math.floor((Date.now() - new Date(session.clock_in_at).getTime()) / 1000) % 60;
  const paused = Boolean(session.paused_at);
  const icon = ACTIVITY_ICON[session.activity_type] ?? "wrench";

  const onPauseResume = () => {
    startTransition(async () => {
      if (paused) await resumeSession(session.id);
      else await pauseSession(session.id);
    });
  };

  return (
    <Sheet open={open} onClose={onClose} title="Active session" sub={session.so_number ?? "Open clock-in"}>
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            padding: 18,
            background: paused
              ? "linear-gradient(180deg, var(--surface-2), var(--surface))"
              : "linear-gradient(180deg, var(--red-50), var(--surface))",
            borderRadius: 14,
            border: "1px solid",
            borderColor: paused ? "var(--line)" : "var(--red-line)",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: paused ? "var(--ink-3)" : "var(--ink)",
              lineHeight: 1,
            }}
          >
            {fmtElapsedSec(min, extraSec)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            <TypeBlock t={session.type_code} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: ".06em",
                color: paused ? "var(--ink-3)" : "var(--red)",
                textTransform: "uppercase",
              }}
            >
              {paused ? "Paused" : "Live"}
            </span>
          </div>
        </div>

        <div className="card" style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "var(--surface-2)",
              color: "var(--ink-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <Icon name={icon} size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>
                {session.so_number ?? "—"}
              </span>
              <span className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 11 }}>
                {session.activity_type}
              </span>
            </div>
            <div className="truncate" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginTop: 2 }}>
              {session.case_title ?? "Untitled case"}
            </div>
            <div className="sub truncate" style={{ textTransform: "none", letterSpacing: 0, fontSize: 11.5, color: "var(--ink-3)" }}>
              {session.customer_name ?? "—"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="btn btn-secondary btn-block"
            disabled={pending}
            onClick={onPauseResume}
          >
            <Icon name={paused ? "play" : "pause"} size={14} />
            {paused ? "Resume" : "Pause"}
          </button>
          <button type="button" className="btn btn-primary btn-block" onClick={onRequestClockOut}>
            <Icon name="stop" size={12} />
            Clock out
          </button>
        </div>
      </div>
    </Sheet>
  );
}
