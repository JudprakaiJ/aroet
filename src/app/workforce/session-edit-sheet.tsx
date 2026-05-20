"use client";

import { useEffect, useState, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { Icon, type IconName } from "@/components/icons";
import {
  updateSession,
  createManualSession,
  deleteSession,
  type SessionPatch,
} from "./session-actions";
import type { HoursSession } from "./queries";

type Props = {
  open: boolean;
  onClose: () => void;
  /** When set → edit mode. When null → create mode using `defaultDate`. */
  session: HoursSession | null;
  defaultDate: string;
  engineerCode: string;
};

const ACTIVITIES: { id: string; label: string; icon: IconName }[] = [
  { id: "field",  label: "Field",  icon: "wrench" },
  { id: "travel", label: "Travel", icon: "car" },
  { id: "remote", label: "Remote", icon: "cloud" },
  { id: "office", label: "Office", icon: "doc" },
];

export function SessionEditSheet({ open, onClose, session, defaultDate, engineerCode }: Props) {
  const isEdit = Boolean(session);
  const [date, setDate] = useState(defaultDate);
  const [soNumber, setSoNumber] = useState("");
  const [activity, setActivity] = useState("field");
  const [travel, setTravel] = useState(0);
  const [work, setWork] = useState(0);
  const [office, setOffice] = useState(0);
  const [breakMin, setBreakMin] = useState(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setConfirmDelete(false);
    if (session) {
      setDate(session.session_date);
      setSoNumber(session.so_number ?? "");
      setActivity(session.activity_type ?? "field");
      setTravel(session.travel_minutes ?? 0);
      setWork(session.work_minutes ?? 0);
      setOffice(session.office_minutes ?? 0);
      setBreakMin(session.break_minutes ?? 0);
      setNotes(session.work_done ?? "");
    } else {
      setDate(defaultDate);
      setSoNumber("");
      setActivity("field");
      setTravel(0);
      setWork(480);
      setOffice(0);
      setBreakMin(60);
      setNotes("");
    }
  }, [open, session, defaultDate]);

  const totalMin = travel + work + office + breakMin;

  const onSave = () => {
    setError(null);
    startTransition(async () => {
      if (isEdit && session) {
        const patch: SessionPatch = {
          session_date: date,
          so_number: soNumber.trim() || null,
          activity_type: activity,
          travel_minutes: travel,
          work_minutes: work,
          office_minutes: office,
          break_minutes: breakMin,
          work_done: notes.trim() || null,
        };
        const r = await updateSession(session.id, patch);
        if (r.success) onClose();
        else setError(r.error ?? "Save failed");
      } else {
        const r = await createManualSession({
          engineer_code: engineerCode,
          session_date: date,
          so_number: soNumber.trim() || null,
          activity_type: activity,
          travel_minutes: travel,
          work_minutes: work,
          office_minutes: office,
          break_minutes: breakMin,
          work_done: notes.trim() || null,
        });
        if (r.success) onClose();
        else setError(r.error ?? "Create failed");
      }
    });
  };

  const onDelete = () => {
    if (!session) return;
    setError(null);
    startTransition(async () => {
      const r = await deleteSession(session.id);
      if (r.success) onClose();
      else setError(r.error ?? "Delete failed");
    });
  };

  const isApproved = session?.approval_status === "approved";
  const isReturned = session?.approval_status === "returned";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit session" : "Add session"}
      sub={isEdit ? `${session?.session_date} · ${session?.so_number ?? "office"}` : "Manual entry"}
      footer={
        <div style={{ display: "flex", gap: 8 }}>
          {isEdit && (
            confirmDelete ? (
              <button
                type="button"
                className="btn btn-danger btn-block"
                disabled={pending}
                onClick={onDelete}
                style={{ flex: 1 }}
              >
                <Icon name="x" size={12} />{" "}
                {isApproved ? "Delete approved" : "Confirm delete"}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-ghost"
                disabled={pending}
                onClick={() => setConfirmDelete(true)}
                style={{ flex: "none", color: "var(--danger)" }}
                title={isApproved ? "Delete (admin only)" : "Delete"}
              >
                <Icon name="x" size={12} />
              </button>
            )
          )}
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={pending || isApproved}
            onClick={onSave}
            style={{ flex: 1 }}
          >
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create session"}
          </button>
        </div>
      }
    >
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        {isApproved && session?.approved_by && (
          <div
            className="card"
            style={{
              padding: 10,
              background: "var(--ok-soft)",
              color: "var(--ok)",
              fontSize: 12,
              borderColor: "rgba(22,163,74,.3)",
            }}
          >
            <Icon name="check" size={12} /> Approved by{" "}
            <strong className="mono">{session.approved_by}</strong>
            {session.approved_at && (
              <span style={{ marginLeft: 4, opacity: 0.85 }}>
                on{" "}
                {new Date(session.approved_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "2-digit",
                })}
              </span>
            )}{" "}
            — view only. Ask admin to return it for editing.
          </div>
        )}
        {isReturned && session?.return_reason && (
          <div
            className="card"
            style={{
              padding: 10,
              background: "var(--danger-soft)",
              color: "var(--danger)",
              fontSize: 12,
              borderColor: "rgba(220,38,38,.3)",
            }}
          >
            <Icon name="alert" size={12} /> <strong>Returned:</strong>{" "}
            {session.return_reason}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label className="fieldlbl">Date</label>
            <input
              type="date"
              className="field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isApproved}
            />
          </div>
          <div>
            <label className="fieldlbl">SO (blank = office)</label>
            <input
              type="text"
              className="field mono"
              placeholder="SO2611-AR-001"
              value={soNumber}
              onChange={(e) => setSoNumber(e.target.value)}
              disabled={isApproved}
            />
          </div>
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
                disabled={isApproved}
              >
                <Icon name={a.icon} size={12} /> {a.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="fieldlbl">Time buckets · minutes</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <BucketInput label="Work"   value={work}    onChange={setWork}    disabled={isApproved} />
            <BucketInput label="Travel" value={travel}  onChange={setTravel}  disabled={isApproved} />
            <BucketInput label="Office" value={office}  onChange={setOffice}  disabled={isApproved} />
            <BucketInput label="Break"  value={breakMin} onChange={setBreakMin} disabled={isApproved} />
          </div>
          <div
            style={{
              marginTop: 6,
              padding: 8,
              background: "var(--surface-2)",
              borderRadius: 8,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11.5,
              color: "var(--ink-3)",
            }}
          >
            <span>Total elapsed (Travel + Work + Office + Break)</span>
            <span className="mono" style={{ fontWeight: 700, color: "var(--ink)" }}>
              {Math.floor(totalMin / 60)}h{(totalMin % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        <div>
          <label className="fieldlbl">Notes</label>
          <textarea
            className="field"
            rows={3}
            placeholder="What did you do?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isApproved}
          />
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

function BucketInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label
        style={{
          fontSize: 10.5,
          color: "var(--ink-3)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: ".05em",
          marginBottom: 4,
          display: "block",
        }}
      >
        {label}
      </label>
      <input
        type="number"
        className="field mono"
        min={0}
        step={15}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        disabled={disabled}
      />
    </div>
  );
}
