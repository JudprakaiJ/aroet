"use client";

import { useEffect, useState, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import {
  listMyActiveCasesForSwitch,
  switchActiveCase,
  type SwitchableCase,
} from "@/app/clock/actions";

type Props = {
  open: boolean;
  onClose: () => void;
  sessionId: number;
  currentSoNumber: string | null;
};

export function SwitchCaseSheet({ open, onClose, sessionId, currentSoNumber }: Props) {
  const [cases, setCases] = useState<SwitchableCase[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setCases(null);
    setError(null);
    listMyActiveCasesForSwitch(currentSoNumber).then(setCases).catch((e) => {
      setError(e?.message ?? "Failed to load cases");
    });
  }, [open, currentSoNumber]);

  const pick = (c: SwitchableCase) => {
    setError(null);
    startTransition(async () => {
      const r = await switchActiveCase(sessionId, c.so_number, c.machine_no);
      if (r.success) onClose();
      else setError(r.error ?? "Switch failed");
    });
  };

  return (
    <Sheet open={open} onClose={onClose} title="Switch case" sub="Continue elapsed time on a different SO">
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        {cases === null ? (
          <div className="sub" style={{ padding: 18, textAlign: "center", textTransform: "none", letterSpacing: 0 }}>
            Loading…
          </div>
        ) : cases.length === 0 ? (
          <div className="sub" style={{ padding: 18, textAlign: "center", textTransform: "none", letterSpacing: 0 }}>
            No other active cases assigned to you.
          </div>
        ) : (
          cases.map((c) => (
            <button
              key={c.so_number}
              type="button"
              disabled={pending}
              onClick={() => pick(c)}
              className="card row-link"
              style={{
                padding: 12,
                textAlign: "left",
                display: "block",
                width: "100%",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)" }}>
                  {c.so_number}
                </span>
                {c.machine_no && (
                  <span className="codebadge" style={{ fontSize: 10 }}>
                    {c.machine_no}
                  </span>
                )}
              </div>
              <div className="truncate" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                {c.title ?? "Untitled"}
              </div>
              <div
                className="sub truncate"
                style={{ textTransform: "none", letterSpacing: 0, fontSize: 11.5, color: "var(--ink-3)" }}
              >
                {c.customer_name ?? "—"}
              </div>
            </button>
          ))
        )}
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
