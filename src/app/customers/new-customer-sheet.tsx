"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import { createCustomer } from "./actions";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function NewCustomerSheet({ open, onClose }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setCode("");
    setName("");
    setCity("");
    setCountry("");
    setAddress("");
    setNotes("");
    setContactName("");
    setContactRole("");
    setContactPhone("");
    setContactEmail("");
    setError(null);
  }, [open]);

  const onSave = () => {
    setError(null);
    if (!name.trim()) {
      setError("Legal name required");
      return;
    }
    startTransition(async () => {
      const contacts = contactName.trim()
        ? [
            {
              name: contactName.trim(),
              role: contactRole.trim() || undefined,
              phone: contactPhone.trim() || undefined,
              email: contactEmail.trim() || undefined,
              is_primary: true,
            },
          ]
        : undefined;

      const r = await createCustomer({
        code: code.trim() || undefined,
        name: name.trim(),
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        contacts,
      });
      if (!r.success) {
        setError(r.error ?? "Create failed");
        return;
      }
      onClose();
      if (r.code) router.push(`/customers/${encodeURIComponent(r.code)}`);
      else router.refresh();
    });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New customer"
      sub="Add to directory"
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={pending}
          onClick={onSave}
        >
          {pending ? "Creating…" : "Create customer"}
        </button>
      }
    >
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label className="fieldlbl">Legal name</label>
          <input
            type="text"
            className="field"
            placeholder="e.g. Sumipol Co., Ltd."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="fieldlbl">Code (optional — auto-generated)</label>
          <input
            type="text"
            className="field mono"
            placeholder="SUM01"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label className="fieldlbl">City</label>
            <input
              type="text"
              className="field"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <label className="fieldlbl">Country</label>
            <input
              type="text"
              className="field"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="fieldlbl">Address</label>
          <textarea
            className="field"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div>
          <label className="fieldlbl">Notes</label>
          <textarea
            className="field"
            rows={2}
            placeholder="Anything notable about the account"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div
          style={{
            borderTop: "1px solid var(--line-2)",
            paddingTop: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div className="kicker">Primary contact (optional)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label className="fieldlbl">Name</label>
              <input
                type="text"
                className="field"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div>
              <label className="fieldlbl">Role</label>
              <input
                type="text"
                className="field"
                placeholder="Maintenance lead"
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label className="fieldlbl">Phone</label>
              <input
                type="tel"
                className="field"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="fieldlbl">Email</label>
              <input
                type="email"
                className="field"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
          </div>
        </div>

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
