"use client";

import { useState, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { Icon, type IconName } from "@/components/icons";
import { callOrQueue } from "@/lib/offline/queue";

type Props = {
  open: boolean;
  onClose: () => void;
  sessionId: number;
  currentActivity: string;
};

const ACTIVITIES: { id: string; label: string; icon: IconName; description: string }[] = [
  { id: "field",  label: "Field",  icon: "wrench", description: "On-site work" },
  { id: "travel", label: "Travel", icon: "car",    description: "Driving / flight" },
  { id: "remote", label: "Remote", icon: "cloud",  description: "Phone / remote support" },
  { id: "office", label: "Office", icon: "doc",    description: "Reports / admin" },
];

export function ChangeActivitySheet({ open, onClose, sessionId, currentActivity }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (next: string) => {
    if (next === currentActivity) {
      onClose();
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await callOrQueue("changeActivity", [sessionId, next]);
      if (r.success) onClose();
      else setError(r.error ?? "Failed");
    });
  };

  return (
    <Sheet open={open} onClose={onClose} title="Change activity" sub="Future time logs to the new bucket">
      <div style={{ padding: 14 }}>
        {ACTIVITIES.map((a) => (
          <button
            key={a.id}
            type="button"
            disabled={pending}
            onClick={() => set(a.id)}
            className="row-link"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 0",
              width: "100%",
              textAlign: "left",
              background: "transparent",
              border: 0,
              borderBottom: "1px solid var(--line-2)",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: a.id === currentActivity ? "var(--red-50)" : "var(--surface-2)",
                color: a.id === currentActivity ? "var(--red)" : "var(--ink-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "none",
              }}
            >
              <Icon name={a.icon} size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{a.label}</div>
              <div
                className="sub"
                style={{ textTransform: "none", letterSpacing: 0, fontSize: 11.5 }}
              >
                {a.description}
              </div>
            </div>
            {a.id === currentActivity && (
              <span className="chip chip-slate" style={{ fontSize: 10 }}>
                current
              </span>
            )}
          </button>
        ))}
        {error && (
          <div
            className="card"
            style={{
              marginTop: 12,
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
