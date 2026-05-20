"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/components/primitives/avatar";
import { TypeBlock } from "@/components/primitives/type-block";
import { CodeBadge } from "@/components/primitives/code-badge";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import { fmtDay, fmtTime } from "@/lib/format";
import {
  approveSession,
  returnSession,
  bulkApproveSessions,
} from "./actions";
import type { QueueGroup, QueueSession } from "./queries";

type Props = {
  groups: QueueGroup[];
  isAdmin: boolean;
  actingAs: string;
};

export function QueueSection({ groups, isAdmin, actingAs }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [returnFor, setReturnFor] = useState<QueueSession | null>(null);

  const onApprove = (id: number) => {
    setError(null);
    startTransition(async () => {
      const r = await approveSession(id);
      if (!r.success) setError(r.error ?? "Failed");
    });
  };

  const onBulk = (ids: number[]) => {
    if (ids.length === 0) return;
    setError(null);
    startTransition(async () => {
      const r = await bulkApproveSessions(ids);
      if (!r.success) setError(r.error ?? "Failed");
    });
  };

  if (groups.length === 0) {
    return (
      <div style={{ padding: "0 14px" }}>
        <div
          className="card"
          style={{
            padding: 28,
            textAlign: "center",
            color: "var(--ink-3)",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 6 }}>✨</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
            All clear — no pending sessions
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            Engineers will see their hours here after they submit.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isAdmin && (
        <div
          className="card"
          style={{
            margin: "0 14px 12px",
            padding: 12,
            background: "var(--warn-soft)",
            color: "var(--warn)",
            borderColor: "rgba(217,119,6,.3)",
            fontSize: 12,
          }}
        >
          <Icon name="alert" size={12} /> Switch to <strong>Admin</strong> view in{" "}
          <Link href="/me" style={{ color: "inherit", textDecoration: "underline" }}>
            /me
          </Link>{" "}
          to approve.
        </div>
      )}

      {error && (
        <div
          className="card"
          style={{
            margin: "0 14px 12px",
            padding: 10,
            background: "var(--danger-soft)",
            color: "var(--danger)",
            fontSize: 13,
            borderColor: "rgba(220,38,38,.3)",
          }}
        >
          <Icon name="alert" size={12} /> {error}
        </div>
      )}

      <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 14 }}>
        {groups.map((g) => (
          <EngineerGroup
            key={g.engineer_code}
            group={g}
            onApprove={onApprove}
            onReturn={(s) => setReturnFor(s)}
            onBulkApprove={() => onBulk(g.sessions.map((s) => s.id))}
            pending={pending}
            disabled={!isAdmin}
          />
        ))}
      </div>

      <ReturnSheet
        open={returnFor !== null}
        onClose={() => setReturnFor(null)}
        session={returnFor}
      />

      <div
        style={{
          padding: "12px 14px",
          textAlign: "right",
          fontSize: 11,
          color: "var(--ink-4)",
        }}
      >
        Approving as <span className="mono" style={{ fontWeight: 700 }}>{actingAs}</span>
      </div>
    </>
  );
}

function EngineerGroup({
  group,
  onApprove,
  onReturn,
  onBulkApprove,
  pending,
  disabled,
}: {
  group: QueueGroup;
  onApprove: (id: number) => void;
  onReturn: (s: QueueSession) => void;
  onBulkApprove: () => void;
  pending: boolean;
  disabled: boolean;
}) {
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div
        style={{
          padding: "12px 14px",
          background: "var(--surface-2)",
          borderBottom: "1px solid var(--line-2)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Avatar code={group.engineer_code} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
            {group.engineer_name ?? group.engineer_code}
          </div>
          <div
            className="sub"
            style={{
              textTransform: "none",
              letterSpacing: 0,
              fontSize: 11,
              color: "var(--ink-3)",
            }}
          >
            {group.count} session{group.count === 1 ? "" : "s"} ·{" "}
            <span className="mono">{fmtTime(group.total_minutes)}</span>
          </div>
        </div>
        <button
          type="button"
          className="dt-pill primary"
          onClick={onBulkApprove}
          disabled={pending || disabled}
        >
          <Icon name="check" size={12} /> Approve all
        </button>
      </div>

      <div style={{ overflow: "auto" }}>
        <table className="dt-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Type</th>
              <th>SO</th>
              <th className="num">Work</th>
              <th className="num">Travel</th>
              <th className="num">Office</th>
              <th className="num">Break</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {group.sessions.map((s) => (
              <tr key={s.id} data-weekend={s.is_weekend || undefined}>
                <td className="mono" style={{ fontSize: 11.5 }}>
                  {fmtDay(s.session_date)}
                </td>
                <td>
                  {s.type_code ? (
                    <TypeBlock t={s.type_code} />
                  ) : (
                    <span style={{ color: "var(--ink-4)" }}>—</span>
                  )}
                </td>
                <td className="mono" style={{ fontSize: 11.5 }}>
                  {s.so_number ? (
                    <Link
                      href={`/cases/${encodeURIComponent(s.so_number)}`}
                      style={{ color: "var(--ink)", textDecoration: "none" }}
                    >
                      <CodeBadge>{s.so_number}</CodeBadge>
                    </Link>
                  ) : (
                    <span style={{ color: "var(--ink-4)" }}>—</span>
                  )}
                </td>
                <td className="num">
                  {(s.work_minutes ?? 0) > 0 ? fmtTime(s.work_minutes) : ""}
                </td>
                <td className="num">
                  {(s.travel_minutes ?? 0) > 0 ? fmtTime(s.travel_minutes) : ""}
                </td>
                <td className="num">
                  {(s.office_minutes ?? 0) > 0 ? fmtTime(s.office_minutes) : ""}
                </td>
                <td className="num">
                  {(s.break_minutes ?? 0) > 0 ? fmtTime(s.break_minutes) : ""}
                </td>
                <td
                  className="truncate"
                  style={{ maxWidth: 220, fontSize: 11.5, color: "var(--ink-3)" }}
                  title={s.work_done ?? ""}
                >
                  {s.work_done ?? "—"}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button
                    type="button"
                    className="dt-pill"
                    onClick={() => onReturn(s)}
                    disabled={pending || disabled}
                    style={{ marginRight: 4 }}
                  >
                    Return
                  </button>
                  <button
                    type="button"
                    className="dt-pill primary"
                    onClick={() => onApprove(s.id)}
                    disabled={pending || disabled}
                  >
                    <Icon name="check" size={11} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReturnSheet({
  open,
  onClose,
  session,
}: {
  open: boolean;
  onClose: () => void;
  session: QueueSession | null;
}) {
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = () => {
    if (!session) return;
    if (!reason.trim()) {
      setError("Reason required");
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await returnSession(session.id, reason.trim());
      if (r.success) {
        setReason("");
        onClose();
      } else {
        setError(r.error ?? "Failed");
      }
    });
  };

  return (
    <Sheet
      open={open}
      onClose={() => {
        setReason("");
        setError(null);
        onClose();
      }}
      title="Return session"
      sub={session ? `${session.engineer_code} · ${session.session_date}` : ""}
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={pending || !reason.trim()}
          onClick={onSubmit}
        >
          {pending ? "Sending…" : "Send back to engineer"}
        </button>
      }
    >
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 12, color: "var(--ink-3)" }}>
          The engineer will see this reason and can fix the entry, then re-submit.
        </div>
        <textarea
          className="field"
          rows={4}
          placeholder="What needs to be fixed?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          autoFocus
        />
        {error && (
          <div style={{ color: "var(--danger)", fontSize: 12 }}>
            <Icon name="alert" size={12} /> {error}
          </div>
        )}
      </div>
    </Sheet>
  );
}
