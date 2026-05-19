"use client";

import { useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { StatusPill } from "@/components/primitives/status-pill";
import { updateCaseStatus, type CaseStatus } from "./actions";

const OPTIONS: { id: CaseStatus; description: string }[] = [
  { id: "planned",     description: "Scheduled, not started" },
  { id: "in_progress", description: "Work underway" },
  { id: "completed",   description: "Work done, awaiting verification" },
  { id: "verified",    description: "Closed out by admin" },
  { id: "canceled",    description: "No longer needed" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  soNumber: string;
  currentStatus: CaseStatus;
};

export function StatusMenu({ open, onClose, soNumber, currentStatus }: Props) {
  const [pending, startTransition] = useTransition();
  const set = (next: CaseStatus) => {
    if (next === currentStatus) {
      onClose();
      return;
    }
    startTransition(async () => {
      const r = await updateCaseStatus(soNumber, next);
      if (r.success) onClose();
    });
  };

  return (
    <Sheet open={open} onClose={onClose} title="Change status" sub={soNumber}>
      <div style={{ padding: "4px 0 14px" }}>
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            disabled={pending}
            onClick={() => set(o.id)}
            className="row-link"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              width: "100%",
              textAlign: "left",
              background: "transparent",
              border: 0,
              borderBottom: "1px solid var(--line-2)",
            }}
          >
            <StatusPill s={o.id} />
            <div style={{ flex: 1, fontSize: 13, color: "var(--ink-2)" }}>{o.description}</div>
            {o.id === currentStatus && (
              <span className="chip chip-slate" style={{ fontSize: 10 }}>current</span>
            )}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
