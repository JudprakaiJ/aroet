"use client";

import { useMemo, useState, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import { computeElapsedMinutes, type ActiveSession } from "@/lib/clock/types";
import { fmtTime } from "@/lib/format";
import { clockOut } from "@/app/clock/actions";

type Props = {
  open: boolean;
  onClose: () => void;
  session: ActiveSession;
};

export function ClockOutReviewSheet({ open, onClose, session }: Props) {
  const [travel, setTravel] = useState(0);
  const [breakMin, setBreakMin] = useState(60);
  const [notes, setNotes] = useState("");
  const [submitNow, setSubmitNow] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const elapsedMin = useMemo(() => computeElapsedMinutes(session), [session]);
  const work = Math.max(0, elapsedMin - travel - breakMin);

  const onSave = () => {
    setError(null);
    startTransition(async () => {
      const r = await clockOut(session.id, {
        travel_minutes: travel,
        break_minutes: breakMin,
        notes: notes.trim() || undefined,
        submit_immediately: submitNow,
      });
      if (r.success) {
        onClose();
      } else {
        setError(r.error ?? "Save failed");
      }
    });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Clock out · review"
      sub={session.so_number ?? "Open clock-in"}
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={pending}
          onClick={onSave}
        >
          {pending ? "Saving…" : submitNow ? "Save & submit" : "Save draft"}
        </button>
      }
    >
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="card-flat" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="kicker">Total elapsed</span>
            <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
              {fmtTime(elapsedMin)}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 6, borderTop: "1px solid var(--line-2)" }}>
            <span className="kicker">{session.activity_type === "office" ? "Office" : session.activity_type === "travel" ? "Travel" : "Work"} after travel + break</span>
            <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: "var(--red)" }}>
              {fmtTime(work)}
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label className="fieldlbl">Travel · mins</label>
            <input
              className="field mono"
              type="number"
              min={0}
              step={15}
              value={travel}
              onChange={(e) => setTravel(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
          <div>
            <label className="fieldlbl">Break · mins</label>
            <input
              className="field mono"
              type="number"
              min={0}
              step={15}
              value={breakMin}
              onChange={(e) => setBreakMin(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
        </div>

        <div className="tpick" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <button type="button" onClick={() => { setTravel(0); setBreakMin(60); }}>Standard</button>
          <button type="button" onClick={() => { setTravel(0); setBreakMin(0); }}>No break</button>
          <button type="button" onClick={() => { setTravel(60); setBreakMin(60); }}>+60 travel</button>
        </div>

        <div>
          <label className="fieldlbl">Notes</label>
          <textarea
            className="field"
            rows={3}
            placeholder="Observations, fault codes, next steps…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 0",
            cursor: "pointer",
          }}
        >
          <span style={{ flex: 1, fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>
            Submit for approval now
          </span>
          <span
            role="switch"
            aria-checked={submitNow}
            className="switch"
            data-on={submitNow}
            onClick={() => setSubmitNow((v) => !v)}
          />
        </label>

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
