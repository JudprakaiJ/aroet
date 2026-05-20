"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import { updateCustomer } from "../actions";
import type { CustomerDetail } from "../queries";

type Props = {
  open: boolean;
  onClose: () => void;
  c: CustomerDetail;
};

export function EditCustomerSheet({ open, onClose, c }: Props) {
  const router = useRouter();
  const [name, setName] = useState(c.name ?? "");
  const [city, setCity] = useState(c.city ?? "");
  const [country, setCountry] = useState(c.country ?? "");
  const [address, setAddress] = useState(c.address ?? "");
  const [notes, setNotes] = useState(c.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setName(c.name ?? "");
    setCity(c.city ?? "");
    setCountry(c.country ?? "");
    setAddress(c.address ?? "");
    setNotes(c.notes ?? "");
    setError(null);
  }, [open, c]);

  const onSave = () => {
    setError(null);
    if (!name.trim()) {
      setError("Legal name required");
      return;
    }
    startTransition(async () => {
      const r = await updateCustomer(c.code, {
        name: name.trim(),
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (!r.success) {
        setError(r.error ?? "Save failed");
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
      title="Edit customer"
      sub={c.code}
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={pending}
          onClick={onSave}
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      }
    >
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label className="fieldlbl">Legal name</label>
          <input
            type="text"
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
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
