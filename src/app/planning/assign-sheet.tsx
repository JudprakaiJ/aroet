"use client";

import { useEffect, useState, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import { TypeBlock } from "@/components/primitives/type-block";
import { assignSession, deleteSessionFromGrid } from "./actions";
import type { PlanSession } from "./queries";

type Props = {
  open: boolean;
  onClose: () => void;
  engineer: { code: string; full_name: string | null } | null;
  date: string | null;
  session: PlanSession | null;
};

const TYPES = [
  { code: "T",    label: "Field" },
  { code: "V",    label: "Field+VAT" },
  { code: "A",    label: "Admin" },
  { code: "WFH",  label: "WFH" },
  { code: "OFF",  label: "Office" },
  { code: "PERS", label: "Personal" },
  { code: "AL",   label: "Annual leave" },
  { code: "SICK", label: "Sick" },
];

const NEEDS_SO = new Set(["T", "V", "A"]);

export function AssignSheet({ open, onClose, engineer, date, session }: Props) {
  const [typeCode, setTypeCode] = useState("T");
  const [soNumber, setSoNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isEdit = Boolean(session);
  const isReadOnly = Boolean(
    session && (session.source !== "planning" || session.approval_status === "approved" || session.clock_in_at)
  );

  useEffect(() => {
    if (!open) return;
    setError(null);
    setConfirmDelete(false);
    if (session) {
      setTypeCode(session.type_code ?? "T");
      setSoNumber(session.so_number ?? "");
      setNotes(session.work_done ?? "");
    } else {
      setTypeCode("T");
      setSoNumber("");
      setNotes("");
    }
  }, [open, session]);

  const needsSo = NEEDS_SO.has(typeCode);

  const onSave = () => {
    if (!engineer || !date) return;
    setError(null);
    startTransition(async () => {
      const r = await assignSession({
        engineer_code: engineer.code,
        session_date: date,
        type_code: typeCode,
        so_number: needsSo ? soNumber.trim() || null : null,
        work_done: notes.trim() || undefined,
        existing_id: session?.id,
      });
      if (r.success) {
        onClose();
      } else {
        setError(r.error ?? "Save failed");
      }
    });
  };

  const onDelete = () => {
    if (!session) return;
    setError(null);
    startTransition(async () => {
      const r = await deleteSessionFromGrid(session.id);
      if (r.success) {
        onClose();
      } else {
        setError(r.error ?? "Delete failed");
      }
    });
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });

  const readOnlyReason = !session
    ? null
    : session.approval_status === "approved"
    ? `Approved — locked. Ask admin to return for editing.`
    : session.clock_in_at
    ? "Created by clock-in — edit on the Hours timesheet instead."
    : session.source === "planner"
    ? "Parsed from planner note — re-parse the case to change it."
    : session.source === "manual"
    ? "Manual entry — edit on the Hours timesheet instead."
    : null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? (isReadOnly ? "Session" : "Edit plan") : "Add plan"}
      sub={engineer && date ? `${engineer.code} · ${fmtDate(date)}` : undefined}
      footer={
        isReadOnly ? (
          <button type="button" className="btn btn-secondary btn-block" onClick={onClose}>
            Close
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            {isEdit &&
              (confirmDelete ? (
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={pending}
                  onClick={onDelete}
                  style={{ flex: 1 }}
                >
                  <Icon name="x" size={12} /> Confirm delete
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={pending}
                  onClick={() => setConfirmDelete(true)}
                  style={{ flex: "none", color: "var(--danger)" }}
                  aria-label="Delete"
                >
                  <Icon name="x" size={12} />
                </button>
              ))}
            <button
              type="button"
              className="btn btn-primary btn-block"
              disabled={pending}
              onClick={onSave}
              style={{ flex: 1 }}
            >
              {pending ? "Saving…" : isEdit ? "Save" : "Add"}
            </button>
          </div>
        )
      }
    >
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        {readOnlyReason && (
          <div
            className="card"
            style={{
              padding: 10,
              background: "var(--warn-soft)",
              borderColor: "rgba(217,119,6,.3)",
              color: "var(--warn)",
              fontSize: 12,
            }}
          >
            <Icon name="alert" size={12} /> {readOnlyReason}
          </div>
        )}

        <div>
          <label className="fieldlbl">Type</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {TYPES.map((t) => (
              <button
                key={t.code}
                type="button"
                className="fchip"
                data-on={typeCode === t.code || undefined}
                onClick={() => setTypeCode(t.code)}
                disabled={isReadOnly || pending}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <TypeBlock t={t.code} />
                <span style={{ fontSize: 11 }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {needsSo && (
          <div>
            <label className="fieldlbl">SO number</label>
            <input
              type="text"
              className="field mono"
              placeholder="SO2611-AR-001"
              value={soNumber}
              onChange={(e) => setSoNumber(e.target.value)}
              disabled={isReadOnly || pending}
            />
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-4)",
                marginTop: 4,
              }}
            >
              Required for field / admin types. Leave blank for office, WFH, leave, etc.
            </div>
          </div>
        )}

        <div>
          <label className="fieldlbl">Notes (optional)</label>
          <textarea
            className="field"
            rows={3}
            placeholder="Why this plan? Tag/remind yourself…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isReadOnly || pending}
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
