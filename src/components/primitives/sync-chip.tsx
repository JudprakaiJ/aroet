type Status = "online" | "offline" | "syncing";

const STYLES: Record<Status, { bg: string; border: string; color: string; dot: string; label: string }> = {
  online:  { bg: "var(--surface-2)", border: "var(--line)",            color: "var(--ink-2)", dot: "var(--ok)",   label: "LIVE" },
  syncing: { bg: "var(--info-soft)", border: "rgba(14,165,233,.3)",    color: "var(--info)",  dot: "var(--info)", label: "SYNC…" },
  offline: { bg: "#FEF3C7",          border: "#FCD34D",                color: "#92400E",      dot: "var(--warn)", label: "OFFLINE" },
};

export function SyncChip({ status = "online" }: { status?: Status }) {
  const s = STYLES[status];
  return (
    <span
      aria-label="sync status"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 8px",
        borderRadius: 8,
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: ".05em",
        height: 32,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          background: s.dot,
        }}
      />
      {s.label}
    </span>
  );
}
