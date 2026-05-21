"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { EmptyState } from "@/components/primitives/empty-state";
import { ContactSheet } from "./contact-sheet";
import type { CustomerContact } from "../queries";

type Props = {
  contacts: CustomerContact[];
  customerCode: string;
  admin: boolean;
};

export function ContactsPanel({ contacts, customerCode, admin }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CustomerContact | null>(null);

  const empty = contacts.length === 0;

  return (
    <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 10 }}>
      {admin && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setAddOpen(true)}
            style={{ minHeight: 32, padding: "0 12px", fontSize: 12 }}
          >
            <Icon name="plus" size={12} /> Add contact
          </button>
        </div>
      )}

      {empty ? (
        <EmptyState icon="user" title="No contacts yet" compact />
      ) : (
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
              {admin && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditTarget(c)}
                  style={{ minHeight: 28, padding: "0 8px", fontSize: 11, flex: "none" }}
                >
                  <Icon name="wrench" size={11} /> Edit
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {admin && (
        <>
          <ContactSheet
            open={addOpen}
            onClose={() => setAddOpen(false)}
            customerCode={customerCode}
          />
          <ContactSheet
            open={!!editTarget}
            onClose={() => setEditTarget(null)}
            customerCode={customerCode}
            contact={editTarget}
          />
        </>
      )}
    </div>
  );
}
