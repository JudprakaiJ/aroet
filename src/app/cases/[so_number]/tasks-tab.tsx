import { Icon } from "@/components/icons";

export function TasksTab({ serviceTypeCode }: { serviceTypeCode: string | null }) {
  const isPM = serviceTypeCode === "7507";
  return (
    <div className="card" style={{ margin: "0 14px 24px", padding: 24, textAlign: "center" }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "var(--surface-2)",
          color: "var(--ink-3)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <Icon name="clip-list" size={22} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
        {isPM ? "PM checklist coming in Phase 3" : "No template for this service type"}
      </div>
      <div
        className="sub"
        style={{ textTransform: "none", letterSpacing: 0, fontSize: 12, color: "var(--ink-3)" }}
      >
        465 checklist items across DLM / MCVP4 / MCVP8 / SPV2 / SPV3 will land in the next phase.
      </div>
    </div>
  );
}
