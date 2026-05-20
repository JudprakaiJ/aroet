"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import { addContactToCustomer, updateContact, deleteContact } from "../actions";
import type { CustomerContact } from "../queries";

type Props = {
  open: boolean;
  onClose: () => void;
  customerCode: string;
  /** When present, sheet is in edit mode. Otherwise it creates a new contact. */
  contact?: CustomerContact | null;
};

export function ContactSheet({ open, onClose, customerCode, contact }: Props) {
  const router = useRouter();
  const editing = !!contact;
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setName(contact?.name ?? "");
    setRole(contact?.role ?? "");
    setPhone(contact?.phone ?? "");
    setEmail(contact?.email ?? "");
    setIsPrimary(contact?.is_primary ?? false);
    setError(null);
    setConfirmDelete(false);
  }, [open, contact]);

  const onSave = () => {
    setError(null);
    if (!name.trim()) {
      setError("Name required");
      return;
    }
    startTransition(async () => {
      const payload = {
        name: name.trim(),
        role: role.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        is_primary: isPrimary,
      };
      const r = editing
        ? await updateContact(contact!.id, payload)
        : await addContactToCustomer(customerCode, payload);
      if (!r.success) {
        setError(r.error ?? "Save failed");
        return;
      }
      onClose();
      router.refresh();
    });
  };

  const onDelete = () => {
    if (!editing) return;
    startTransition(async () => {
      const r = await deleteContact(contact!.id);
      if (!r.success) {
        setError(r.error ?? "Delete failed");
        setConfirmDelete(false);
        return;
      }
      onClose();
      router.refresh();
    });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "Edit contact" : "New contact"}
      sub={customerCode}
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={pending}
          onClick={onSave}
        >
          {pending ? "Saving…" : editing ? "Save changes" : "Add contact"}
        </button>
      }
    >
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label className="fieldlbl">Name</label>
          <input
            type="text"
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="fieldlbl">Role / title</label>
          <input
            type="text"
            className="field"
            placeholder="e.g. Maintenance lead"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label className="fieldlbl">Phone</label>
            <input
              type="tel"
              className="field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="fieldlbl">Email</label>
            <input
              type="email"
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "var(--ink)",
          }}
        >
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
          />
          Make primary contact
        </label>

        {editing && (
          <div
            style={{
              borderTop: "1px dashed var(--line-2)",
              paddingTop: 10,
              display: "flex",
              gap: 6,
              justifyContent: "flex-end",
            }}
          >
            {confirmDelete ? (
              <>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ minHeight: 30, padding: "0 10px", fontSize: 12 }}
                  onClick={() => setConfirmDelete(false)}
                  disabled={pending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ minHeight: 30, padding: "0 12px", fontSize: 12 }}
                  onClick={onDelete}
                  disabled={pending}
                >
                  <Icon name="x" size={11} /> {pending ? "Deleting…" : "Confirm delete"}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ minHeight: 30, padding: "0 10px", fontSize: 12, color: "var(--danger)" }}
                onClick={() => setConfirmDelete(true)}
              >
                <Icon name="x" size={11} /> Delete contact
              </button>
            )}
          </div>
        )}

        {error && (
          <div
            className="card"
            style={{
              padding: 10,
              background: "var(--danger-soft)",
              borderColor: "rgba(220,38,38,.3)",
              color: "var(--danger)",
              fontSize: 13,
            }}
          >
            <Icon name="alert" size={12} /> {error}
          </div>
        )}
      </div>
    </Sheet>
  );
}
