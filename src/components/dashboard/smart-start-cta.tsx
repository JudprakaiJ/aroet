import { Icon } from "@/components/icons";

type Props = {
  engineerCode: string;
};

export function SmartStartCTA({ engineerCode }: Props) {
  return (
    <div
      className="card"
      style={{
        padding: 16,
        display: "flex",
        gap: 12,
        alignItems: "center",
        background: "linear-gradient(180deg, var(--red-50), var(--surface))",
        borderColor: "var(--red-line)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "var(--red)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
        }}
      >
        <Icon name="play" size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
          Ready when you are, {engineerCode}
        </div>
        <div
          className="sub"
          style={{
            textTransform: "none",
            letterSpacing: 0,
            fontSize: 12,
            color: "var(--ink-3)",
            marginTop: 2,
          }}
        >
          Clock-in lands in Phase 3 · tap{" "}
          <span style={{ color: "var(--red)", fontWeight: 600 }}>+</span> to log a session
        </div>
      </div>
    </div>
  );
}
