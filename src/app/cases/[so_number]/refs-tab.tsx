import { Icon } from "@/components/icons";
import { CodeBadge } from "@/components/primitives/code-badge";
import { referenceTypeBadge, fmtDate } from "@/lib/format";
import type { CaseReference, CustomerDetail, MachineDetail } from "./queries";

type Props = {
  customer: CustomerDetail | null;
  machines: MachineDetail[];
  references: CaseReference[];
  description: string | null;
};

export function RefsTab({ customer, machines, references, description }: Props) {
  return (
    <div style={{ padding: "0 14px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
      {customer && (
        <div className="card" style={{ padding: 14 }}>
          <div className="kicker" style={{ marginBottom: 6 }}>
            Customer
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
            {customer.name}
          </div>
          <div className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 12 }}>
            {[customer.city, customer.country].filter(Boolean).join(", ") || "—"}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            <CodeBadge>{customer.code}</CodeBadge>
            {customer.contact_name && (
              <span className="chip">
                <Icon name="user" size={11} /> {customer.contact_name}
              </span>
            )}
            {customer.contact_mobile && (
              <span className="chip chip-mono">{customer.contact_mobile}</span>
            )}
          </div>
        </div>
      )}

      {machines.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="kicker" style={{ padding: "12px 14px 6px" }}>
            Machines · {machines.length}
          </div>
          {machines.map((m, i) => (
            <div
              key={m.machine_no}
              style={{
                padding: "10px 14px",
                borderTop: i === 0 ? "none" : "1px solid var(--line-2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <CodeBadge>{m.machine_no}</CodeBadge>
                {m.product_code && (
                  <span className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 12 }}>
                    {m.product_code}
                  </span>
                )}
              </div>
              <div className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 12 }}>
                {m.name ?? "—"}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                {m.serial_no && <span className="chip chip-mono">SN {m.serial_no}</span>}
                {m.installation_date && (
                  <span className="chip">
                    <Icon name="calendar" size={11} /> Installed {fmtDate(m.installation_date)}
                  </span>
                )}
                {m.warranty_expiry && (
                  <span className="chip chip-warn">Warranty {fmtDate(m.warranty_expiry)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {description && (
        <div className="card" style={{ padding: 14 }}>
          <div className="kicker" style={{ marginBottom: 6 }}>
            Description
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
            {description}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 14 }}>
        <div className="kicker" style={{ marginBottom: 8 }}>
          References · {references.length}
        </div>
        {references.length === 0 ? (
          <div className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 12 }}>
            None yet. Planner-extracted GI / CS / Invoice numbers will show here.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {references.map((r) => {
              const badge = referenceTypeBadge[r.type] ?? referenceTypeBadge.OTHER;
              return (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: 8,
                    borderRadius: 8,
                    background: "var(--surface-2)",
                    border: "1px solid var(--line-2)",
                  }}
                >
                  <span
                    className="chip"
                    style={{ background: badge.bg, color: badge.text, borderColor: "transparent" }}
                  >
                    {badge.label}
                  </span>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>
                    {r.reference_no}
                  </span>
                  {r.status && <span className="chip chip-slate">{r.status}</span>}
                  {r.description && (
                    <span
                      className="truncate"
                      style={{ flex: 1, fontSize: 12, color: "var(--ink-3)" }}
                    >
                      {r.description}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
