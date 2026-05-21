import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";

type Props = {
  icon?: IconName;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
};

export function EmptyState({ icon = "inbox", title, body, action, compact = false }: Props) {
  const pad = compact ? 18 : 28;
  const iconSize = compact ? 18 : 22;
  const iconBox = compact ? 36 : 48;
  return (
    <div
      className="card"
      style={{ padding: pad, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: compact ? 6 : 10 }}
    >
      <div
        style={{
          width: iconBox,
          height: iconBox,
          borderRadius: 12,
          background: "var(--surface-2)",
          color: "var(--ink-3)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={iconSize} />
      </div>
      <div style={{ fontSize: compact ? 13 : 14, fontWeight: 600, color: "var(--ink)" }}>
        {title}
      </div>
      {body && (
        <div style={{ fontSize: 12, color: "var(--ink-3)", maxWidth: 320, lineHeight: 1.5 }}>
          {body}
        </div>
      )}
      {action && <div style={{ marginTop: 4 }}>{action}</div>}
    </div>
  );
}
