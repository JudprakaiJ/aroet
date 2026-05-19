"use client";

import { useState, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import { editStartTime } from "@/app/clock/actions";

type Props = {
  open: boolean;
  onClose: () => void;
  sessionId: number;
  currentClockInISO: string;
};

function isoToLocalHHMM(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function EditStartTimeSheet({ open, onClose, sessionId, currentClockInISO }: Props) {
  const [hhmm, setHhmm] = useState(() => isoToLocalHHMM(currentClockInISO));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setError(null);
    const [hStr, mStr] = hhmm.split(":");
    const h = Number(hStr);
    const m = Number(mStr);
    if (!Number.isFinite(h) || !Number.isFinite(m)) {
      setError("Invalid time");
      return;
    }
    const now = new Date();
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target.getTime() > now.getTime()) {
      setError("Start time can't be in the future");
      return;
    }
    startTransition(async () => {
      const r = await editStartTime(sessionId, target.toISOString());
      if (r.success) onClose();
      else setError(r.error ?? "Save failed");
    });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Edit start time"
      sub="Backdate the clock-in if you forgot to start earlier"
      footer={
        <button type="button" className="btn btn-primary btn-block" disabled={pending} onClick={save}>
          {pending ? "Saving…" : "Save"}
        </button>
      }
    >
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label className="fieldlbl">New start time (today)</label>
          <input
            type="time"
            className="field mono"
            value={hhmm}
            onChange={(e) => setHhmm(e.target.value)}
            step={60}
          />
        </div>
        <div
          className="sub"
          style={{ textTransform: "none", letterSpacing: 0, fontSize: 12, color: "var(--ink-3)" }}
        >
          Original: <span className="mono">{isoToLocalHHMM(currentClockInISO)}</span>. Must be in the past.
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
    </Sheet>
  );
}
