"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import { updateMachine } from "../actions";
import type { MachineDetail } from "../queries";
import type { CustomerLite } from "@/app/customers/queries";

type Props = {
  open: boolean;
  onClose: () => void;
  m: MachineDetail;
  customers: CustomerLite[];
};

export function EditMachineSheet({ open, onClose, m, customers }: Props) {
  const router = useRouter();
  const [customerCode, setCustomerCode] = useState(m.customer_code ?? "");
  const [name, setName] = useState(m.name ?? "");
  const [productCode, setProductCode] = useState(m.product_code ?? "");
  const [serialNo, setSerialNo] = useState(m.serial_no ?? "");
  const [version, setVersion] = useState(m.version ?? "");
  const [installationDate, setInstallationDate] = useState(m.installation_date ?? "");
  const [warrantyExpiry, setWarrantyExpiry] = useState(m.warranty_expiry ?? "");
  const [notes, setNotes] = useState(m.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setCustomerCode(m.customer_code ?? "");
    setName(m.name ?? "");
    setProductCode(m.product_code ?? "");
    setSerialNo(m.serial_no ?? "");
    setVersion(m.version ?? "");
    setInstallationDate(m.installation_date ?? "");
    setWarrantyExpiry(m.warranty_expiry ?? "");
    setNotes(m.notes ?? "");
    setError(null);
  }, [open, m]);

  const onSave = () => {
    setError(null);
    if (!customerCode) {
      setError("Customer required");
      return;
    }
    startTransition(async () => {
      const r = await updateMachine(m.machine_no, {
        customer_code: customerCode,
        name: name.trim() || undefined,
        product_code: productCode.trim() || undefined,
        serial_no: serialNo.trim() || undefined,
        version: version.trim() || undefined,
        installation_date: installationDate || undefined,
        warranty_expiry: warrantyExpiry || undefined,
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
      title="Edit machine"
      sub={m.machine_no}
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
          <label className="fieldlbl">Customer</label>
          <select
            className="field"
            value={customerCode}
            onChange={(e) => setCustomerCode(e.target.value)}
          >
            <option value="">— select —</option>
            {customers.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="fieldlbl">Display name</label>
          <input
            type="text"
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label className="fieldlbl">Product code</label>
            <input
              type="text"
              className="field mono"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <label className="fieldlbl">Version</label>
            <input
              type="text"
              className="field mono"
              value={version}
              onChange={(e) => setVersion(e.target.value.toUpperCase())}
            />
          </div>
        </div>

        <div>
          <label className="fieldlbl">Serial number</label>
          <input
            type="text"
            className="field mono"
            value={serialNo}
            onChange={(e) => setSerialNo(e.target.value.toUpperCase())}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label className="fieldlbl">Installation date</label>
            <input
              type="date"
              className="field"
              value={installationDate}
              onChange={(e) => setInstallationDate(e.target.value)}
            />
          </div>
          <div>
            <label className="fieldlbl">Warranty expiry</label>
            <input
              type="date"
              className="field"
              value={warrantyExpiry}
              onChange={(e) => setWarrantyExpiry(e.target.value)}
            />
          </div>
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
