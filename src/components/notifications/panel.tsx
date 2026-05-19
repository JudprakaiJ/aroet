"use client";

import Link from "next/link";
import { Sheet } from "@/components/sheet";
import { Avatar } from "@/components/primitives/avatar";
import { Icon, type IconName } from "@/components/icons";
import { adminEventLabel } from "@/lib/format";
import type { NotificationItem } from "./queries";

type Props = {
  open: boolean;
  onClose: () => void;
  items: NotificationItem[];
  onMarkAllRead: () => void;
  seenAtIso: string;
};

const APPROVAL_LABEL: Record<string, string> = {
  submitted: "submitted for approval",
  approved: "approved",
  returned: "returned for changes",
  edited_after_approval: "edited after approval",
  reset_to_draft: "reset to draft",
};

const APPROVAL_TONE: Record<string, { bg: string; color: string; icon: IconName }> = {
  submitted: { bg: "var(--info-soft)", color: "var(--info)", icon: "send" },
  approved:  { bg: "var(--ok-soft)",   color: "var(--ok)",   icon: "check" },
  returned:  { bg: "var(--danger-soft)", color: "var(--danger)", icon: "alert" },
};

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function groupByDay(items: NotificationItem[]): { label: string; rows: NotificationItem[] }[] {
  const today = new Date().toISOString().slice(0, 10);
  const todayRows: NotificationItem[] = [];
  const earlierRows: NotificationItem[] = [];
  for (const it of items) {
    if (it.happened_at.startsWith(today)) todayRows.push(it);
    else earlierRows.push(it);
  }
  const out = [];
  if (todayRows.length) out.push({ label: "Today", rows: todayRows });
  if (earlierRows.length) out.push({ label: "Earlier", rows: earlierRows });
  return out;
}

export function NotificationsPanel({ open, onClose, items, onMarkAllRead, seenAtIso }: Props) {
  const groups = groupByDay(items);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Notifications"
      sub={items.length ? `${items.length} recent` : "All caught up"}
      footer={
        items.length > 0 ? (
          <button type="button" className="btn btn-ghost btn-block" onClick={onMarkAllRead}>
            <Icon name="check" size={14} /> Mark all read
          </button>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <div
          style={{ padding: 36, textAlign: "center", color: "var(--ink-3)" }}
        >
          <div
            style={{
              display: "inline-flex",
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--surface-2)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            <Icon name="bell" size={20} />
          </div>
          <div style={{ fontSize: 13 }}>Nothing new in your sessions or assigned cases.</div>
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.label}>
            <div
              className="kicker"
              style={{ padding: "12px 14px 4px", background: "var(--surface-2)" }}
            >
              {g.label}
            </div>
            {g.rows.map((n) => {
              const unread = n.happened_at > seenAtIso;
              const tone = n.kind === "approval"
                ? APPROVAL_TONE[n.action] ?? APPROVAL_TONE.submitted
                : { bg: "var(--surface-2)", color: "var(--ink-3)", icon: "history" as IconName };
              const label =
                n.kind === "approval"
                  ? `Session ${APPROVAL_LABEL[n.action] ?? n.action}`
                  : adminEventLabel[n.action] ?? n.action;
              return (
                <Link
                  key={n.id}
                  href={n.so_number ? `/cases/${n.so_number}` : "/"}
                  onClick={onClose}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--line-2)",
                    background: unread ? "var(--red-50)" : "transparent",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: tone.bg,
                      color: tone.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "none",
                    }}
                  >
                    <Icon name={tone.icon} size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                      {n.actor && <Avatar code={n.actor} size={18} />}
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                        {label}
                      </span>
                      <span
                        className="mono"
                        style={{ marginLeft: "auto", fontSize: 10.5, color: "var(--ink-4)" }}
                      >
                        {relTime(n.happened_at)}
                      </span>
                    </div>
                    {n.so_number && (
                      <div
                        className="sub truncate"
                        style={{
                          textTransform: "none",
                          letterSpacing: 0,
                          fontSize: 11.5,
                          color: "var(--ink-3)",
                          marginTop: 2,
                        }}
                      >
                        <span className="mono">{n.so_number}</span>
                        {n.comment ? ` · ${n.comment}` : ""}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))
      )}
    </Sheet>
  );
}
