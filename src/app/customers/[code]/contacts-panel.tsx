import { Icon } from "@/components/icons";
import type { CustomerContact } from "../queries";

export function ContactsPanel({ contacts }: { contacts: CustomerContact[] }) {
  if (contacts.length === 0) {
    return (
      <div style={{ padding: "0 14px" }}>
        <div
          style={{
            padding: 24,
            textAlign: "center",
            color: "var(--ink-3)",
            border: "1px dashed var(--line-2)",
            borderRadius: "var(--r-lg)",
          }}
        >
          No contacts yet.
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: "0 14px" }}>
      <div className="card" style={{ overflow: "hidden" }}>
        {contacts.map((c, i) => (
          <div
            key={c.id}
            style={{
              padding: "12px 14px",
              borderTop: i === 0 ? "none" : "1px solid var(--line-2)",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                  {c.name}
                </span>
                {c.is_primary && (
                  <span className="chip chip-red" style={{ fontSize: 10 }}>
                    Primary
                  </span>
                )}
                {c.role && (
                  <span className="chip" style={{ fontSize: 10 }}>
                    {c.role}
                  </span>
                )}
              </div>
              <div
                style={{
                  marginTop: 4,
                  display: "flex",
                  gap: 12,
                  fontSize: 12,
                  color: "var(--ink-3)",
                  flexWrap: "wrap",
                }}
              >
                {c.phone && (
                  <a href={`tel:${c.phone}`} style={{ color: "inherit", textDecoration: "none" }}>
                    <Icon name="phone" size={11} /> {c.phone}
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} style={{ color: "inherit", textDecoration: "none" }}>
                    <Icon name="mail" size={11} /> {c.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
