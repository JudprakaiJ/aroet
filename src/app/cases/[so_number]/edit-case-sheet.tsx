"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import { CodeBadge } from "@/components/primitives/code-badge";
import { SERVICE_TYPES } from "@/lib/service-types";
import { updateCase } from "./actions";
import type { CaseDetail, LiteCustomer, LiteMachine } from "./queries";

type Props = {
  open: boolean;
  onClose: () => void;
  c: CaseDetail;
  customers: LiteCustomer[];
  machines: LiteMachine[];
};

export function EditCaseSheet({ open, onClose, c, customers, machines }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(c.title ?? "");
  const [description, setDescription] = useState(c.description ?? "");
  const [customerCode, setCustomerCode] = useState(c.customer_code ?? "");
  const [machineNos, setMachineNos] = useState<string[]>(c.machines.map((m) => m.machine_no));
  const [projectCode, setProjectCode] = useState(c.project_code ?? "");
  const [serviceTypeCode, setServiceTypeCode] = useState(c.service_type_code ?? "7505");
  const [dueDate, setDueDate] = useState(c.due_date ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setTitle(c.title ?? "");
    setDescription(c.description ?? "");
    setCustomerCode(c.customer_code ?? "");
    setMachineNos(c.machines.map((m) => m.machine_no));
    setProjectCode(c.project_code ?? "");
    setServiceTypeCode(c.service_type_code ?? "7505");
    setDueDate(c.due_date ?? "");
    setError(null);
  }, [open, c]);

  const availableMachines = useMemo(
    () => machines.filter((m) => !customerCode || m.customer_code === customerCode),
    [machines, customerCode]
  );

  // Already-attached machines that aren't in the available list (eg. customer mismatch)
  // stay in the picker so they can be unticked instead of orphaned.
  const machineDisplay = useMemo(() => {
    const set = new Map<string, LiteMachine>();
    for (const m of availableMachines) set.set(m.machine_no, m);
    for (const mn of machineNos) {
      if (!set.has(mn)) {
        set.set(mn, { machine_no: mn, customer_code: null, product_code: null });
      }
    }
    return Array.from(set.values());
  }, [availableMachines, machineNos]);

  const toggleMachine = (mn: string) => {
    setMachineNos((prev) =>
      prev.includes(mn) ? prev.filter((x) => x !== mn) : [...prev, mn]
    );
  };

  const onSave = () => {
    setError(null);
    if (machineNos.length === 0) {
      setError("At least 1 machine required");
      return;
    }
    if (!customerCode) {
      setError("Customer required");
      return;
    }
    startTransition(async () => {
      const r = await updateCase(c.so_number, {
        title: title.trim() || null,
        description: description.trim() || null,
        customer_code: customerCode,
        machine_nos: machineNos,
        project_code: projectCode.trim() || null,
        service_type_code: serviceTypeCode,
        due_date: dueDate || null,
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
      title="Edit case"
      sub={c.so_number}
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
          <label className="fieldlbl">Subject</label>
          <input
            type="text"
            className="field"
            placeholder="Short title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="fieldlbl">Description</label>
          <textarea
            className="field"
            rows={3}
            placeholder="Optional — anything notable about scope, requested by, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
            {customers.map((cust) => (
              <option key={cust.code} value={cust.code}>
                {cust.code} — {cust.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="fieldlbl">
            Machines ({machineNos.length}){customerCode ? "" : " — pick customer first"}
          </label>
          {machineDisplay.length === 0 ? (
            <div
              className="sub"
              style={{
                padding: 10,
                background: "var(--surface-2)",
                borderRadius: 8,
                textTransform: "none",
                letterSpacing: 0,
                fontSize: 12,
                color: "var(--ink-3)",
              }}
            >
              No machines for this customer yet.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                maxHeight: 240,
                overflow: "auto",
              }}
            >
              {machineDisplay.map((m) => {
                const selected = machineNos.includes(m.machine_no);
                return (
                  <div
                    key={m.machine_no}
                    className="card-flat"
                    style={{
                      padding: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      background: selected ? "var(--red-50)" : undefined,
                      borderColor: selected ? "var(--red-line)" : undefined,
                    }}
                    onClick={() => toggleMachine(m.machine_no)}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      readOnly
                      style={{ flex: "none" }}
                    />
                    <CodeBadge>{m.machine_no}</CodeBadge>
                    {m.product_code && (
                      <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{m.product_code}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label className="fieldlbl">Service type</label>
            <select
              className="field"
              value={serviceTypeCode}
              onChange={(e) => setServiceTypeCode(e.target.value)}
            >
              {SERVICE_TYPES.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.code} · {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="fieldlbl">Due date</label>
            <input
              type="date"
              className="field"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="fieldlbl">Project code</label>
          <input
            type="text"
            className="field mono"
            placeholder="e.g. Line#15 / Group 2 / MCE#3"
            value={projectCode}
            onChange={(e) => setProjectCode(e.target.value)}
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
