"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import { createMachine } from "./actions";
import type { CustomerLite } from "@/app/customers/queries";

type Props = {
  open: boolean;
  onClose: () => void;
  customers: CustomerLite[];
  /** Pre-select a customer (used when adding from /customers/[code]). */
  defaultCustomerCode?: string;
};

export function NewMachineSheet({ open, onClose, customers, defaultCustomerCode }: Props) {
  const router = useRouter();
  const [machineNo, setMachineNo] = useState("");
  const [customerCode, setCustomerCode] = useState(defaultCustomerCode ?? "");
  const [productCode, setProductCode] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setMachineNo("");
    setCustomerCode(defaultCustomerCode ?? "");
    setProductCode("");
    setSerialNo("");
    setInstallationDate("");
    setWarrantyExpiry("");
    setNotes("");
    setError(null);
  }, [open, defaultCustomerCode]);

  const onSave = () => {
    setError(null);
    if (!machineNo.trim()) {
      setError("Machine number required");
      return;
    }
    if (!customerCode) {
      setError("Customer required");
      return;
    }
    startTransition(async () => {
      const r = await createMachine({
        machine_no: machineNo.trim(),
        customer_code: customerCode,
        product_code: productCode.trim() || undefined,
        serial_no: serialNo.trim() || undefined,
        installation_date: installationDate || undefined,
        warranty_expiry: warrantyExpiry || undefined,
        notes: notes.trim() || undefined,
      });
      if (!r.success) {
        setError(r.error ?? "Create failed");
        return;
      }
      onClose();
      if (r.machine_no) router.push(`/machines/${encodeURIComponent(r.machine_no)}`);
      else router.refresh();
    });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New machine"
      sub="Register equipment"
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={pending}
          onClick={onSave}
        >
          {pending ? "Creating…" : "Create machine"}
        </button>
      }
    >
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label className="fieldlbl">Machine number</label>
          <input
            type="text"
            className="field mono"
            placeholder="e.g. MCSF15"
            value={machineNo}
            onChange={(e) => setMachineNo(e.target.value.toUpperCase())}
          />
        </div>

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
          <label className="fieldlbl">Machine type</label>
          <input
            type="text"
            className="field mono"
            placeholder="DLM / MCVP4 / MCVP8V1 / MCVP8V2 / SPV2 / SPV3"
            value={productCode}
            onChange={(e) => setProductCode(e.target.value.toUpperCase())}
          />
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
            rows={2}
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
