import Link from "next/link";
import { Icon } from "@/components/icons";

type Props = {
  pendingCount: number;
  overlapNote?: string;
};

export function ApprovalBanner({ pendingCount, overlapNote }: Props) {
  if (pendingCount <= 0) return null;
  return (
    <div style={{ padding: "10px 14px 0" }}>
      <Link
        href="/workforce/queue"
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          borderColor: "var(--red-line)",
          background: "var(--red-50)",
          width: "100%",
          textAlign: "left",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "var(--red)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="inbox" size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
            {pendingCount} sessions pending approval
          </div>
          {overlapNote && (
            <div
              className="sub"
              style={{ textTransform: "none", letterSpacing: 0, fontSize: 12 }}
            >
              {overlapNote}
            </div>
          )}
        </div>
        <Icon name="chevron" size={18} />
      </Link>
    </div>
  );
}
