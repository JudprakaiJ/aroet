"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import { CodeBadge } from "@/components/primitives/code-badge";
import { addSession } from "./session-actions";

type Props = {
  open: boolean;
  onClose: () => void;
  soNumber: string;
  machines: { machine_no: string; is_primary: boolean }[];
};

const ACTIVITIES: { id: string; label: string; icon: "wrench" | "car" | "cloud" | "doc" }[] = [
  { id: "field",  label: "Field",  icon: "wrench" },
  { id: "travel", label: "Travel", icon: "car" },
  { id: "remote", label: "Remote", icon: "cloud" },
  { id: "office", label: "Office", icon: "doc" },
];

const PRESETS = [
  { id: "9-17", start: "09:00", end: "17:00" },
  { id: "8-17", start: "08:00", end: "17:00" },
  { id: "AM",   start: "08:00", end: "12:00" },
  { id: "PM",   start: "13:00", end: "17:00" },
];

const ME = "JKH";

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function AddSessionSheet({ open, onClose, soNumber, machines }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const primary =
    machines.find((m) => m.is_primary)?.machine_no ?? machines[0]?.machine_no ?? null;
  const [activity, setActivity] = useState("field");
  const [date, setDate] = useState(today);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [travel, setTravel] = useState(0);
  const [breakMin, setBreakMin] = useState(60);
  const [workDone, setWorkDone] = useState("");
  const [machineNo, setMachineNo] = useState<string | null>(primary);
  const [submitNow, setSubmitNow] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Re-sync machine when sheet opens (in case machines changed)
  useEffect(() => {
    if (open) setMachineNo(primary);
  }, [open, primary]);

  const duration = useMemo(() => {
    const d = toMin(end) - toMin(start) - breakMin;
    return d > 0 ? d : 0;
  }, [start, end, breakMin]);

  const onSave = () => {
    setError(null);
    const startMinutes = toMin(start);
    const endMinutes = toMin(end);
    if (endMinutes - startMinutes - breakMin <= 0) {
      setError("Start/end + break leaves no duration");
      return;
    }
    startTransition(async () => {
      const r = await addSession({
        so_number: soNumber,
        machine_no: machineNo,
        engineer_code: ME,
        session_date: date,
        activity_type: activity,
        start_minutes: startMinutes,
        end_minutes: endMinutes,
        break_minutes: breakMin,
        work_done: workDone.trim() || undefined,
        submit_immediately: submitNow,
      });
      if (r.success) {
        setWorkDone("");
        onClose();
      } else {
        setError(r.error ?? "Save failed");
      }
    });
  };

  const fmtH = (m: number) => `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, "0") : ""}`;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add session"
      sub={`Case ${soNumber}`}
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={pending || duration <= 0}
          onClick={onSave}
        >
          {pending ? "Saving…" : submitNow ? "Save & submit" : "Save draft"}
        </button>
      }
    >
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
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

        {machines.length > 1 && (
          <div>
            <label className="fieldlbl">Machine</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {machines.map((m) => (
                <button
                  key={m.machine_no}
                  type="button"
                  className="fchip"
                  data-on={machineNo === m.machine_no || undefined}
                  onClick={() => setMachineNo(m.machine_no)}
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  <CodeBadge>{m.machine_no}</CodeBadge>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="fieldlbl">Date</label>
          <input
            className="field"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label className="fieldlbl">Start</label>
            <input className="field mono" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className="fieldlbl">End</label>
            <input className="field mono" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>

        <div className="tpick" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setStart(p.start);
                setEnd(p.end);
              }}
            >
              {p.id}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label className="fieldlbl">Travel (min)</label>
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
            <label className="fieldlbl">Break (min)</label>
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

        <div
          className="card-flat"
          style={{
            padding: 10,
            display: "flex",
            gap: 10,
            alignItems: "center",
            fontSize: 13,
            color: "var(--ink-2)",
          }}
        >
          <Icon name="clock" size={14} />
          <span style={{ flex: 1 }}>
            <strong className="mono">{fmtH(duration)}</strong> on case
            {travel > 0 && <span className="sub" style={{ marginLeft: 8, textTransform: "none", letterSpacing: 0, fontSize: 11 }}>+ {fmtH(travel)} travel</span>}
            {breakMin > 0 && <span className="sub" style={{ marginLeft: 8, textTransform: "none", letterSpacing: 0, fontSize: 11 }}>− {fmtH(breakMin)} break</span>}
          </span>
        </div>

        <div>
          <label className="fieldlbl">Notes</label>
          <textarea
            className="field"
            rows={3}
            value={workDone}
            onChange={(e) => setWorkDone(e.target.value)}
            placeholder="Observations, fault codes, next steps…"
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
            {error}
          </div>
        )}
      </div>
    </Sheet>
  );
}
