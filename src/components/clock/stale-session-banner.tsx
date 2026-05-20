import { Icon } from "@/components/icons";
import { fmtDate } from "@/lib/format";
import type { ActiveSession } from "@/lib/clock/types";

/**
 * Server-side banner shown when the engineer is still clocked in on a
 * session that started before "today" in Bangkok time. Almost always
 * means they forgot to clock out.
 */
export function StaleSessionBanner({ session }: { session: ActiveSession }) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const startedDate = new Date(session.clock_in_at).toLocaleDateString("en-CA", {
    timeZone: "Asia/Bangkok",
  });
  if (startedDate >= today) return null;

  const startedAt = new Date(session.clock_in_at);
  const days = Math.max(
    1,
    Math.floor((Date.now() - startedAt.getTime()) / (24 * 60 * 60 * 1000))
  );

  return (
    <div
      className="card"
      style={{
        margin: "10px 14px",
        padding: 12,
        background: "var(--danger-soft)",
        borderColor: "rgba(220, 38, 38, .3)",
        color: "var(--danger)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "var(--danger)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
        }}
      >
        <Icon name="alert" size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>
          Forgot to clock out
        </div>
        <div
          className="sub"
          style={{
            textTransform: "none",
            letterSpacing: 0,
            fontSize: 11.5,
            color: "var(--danger)",
            opacity: 0.85,
            marginTop: 2,
          }}
        >
          Still running since {fmtDate(session.clock_in_at)} · {days} day
          {days === 1 ? "" : "s"}. Tap the timer to fix or close.
        </div>
      </div>
    </div>
  );
}
