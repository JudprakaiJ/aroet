"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import { CodeBadge } from "@/components/primitives/code-badge";
import { SERVICE_TYPES } from "@/lib/service-types";
import { PlanRangesPicker } from "../plan-ranges-picker";
import { updateCase } from "./actions";
import type {
  CaseDetail,
  LiteCustomer,
  LiteMachine,
  LiteEngineer,
  PlanRangeEntry,
} from "./queries";

type Props = {
  open: boolean;
  onClose: () => void;
  c: CaseDetail;
  customers: LiteCustomer[];
  machines: LiteMachine[];
  engineers: LiteEngineer[];
  initialPlanRanges: PlanRangeEntry[];
};

export function EditCaseSheet({
  open,
  onClose,
  c,
  customers,
  machines,
  engineers,
  initialPlanRanges,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(c.title ?? "");
  const [customerCode, setCustomerCode] = useState(c.customer_code ?? "");
  const [machineNos, setMachineNos] = useState<string[]>(c.machines.map((m) => m.machine_no));
  const [projectCode, setProjectCode] = useState(c.project_code ?? "");
  const [serviceTypeCode, setServiceTypeCode] = useState(c.service_type_code ?? "7505");
  const [dueDate, setDueDate] = useState(c.due_date ?? "");
  const [leadEngineer, setLeadEngineer] = useState(
    c.assignees.find((a) => a.is_lead)?.engineer_code ?? ""
  );
  const [otherEngineers, setOtherEngineers] = useState<string[]>(
    c.assignees.filter((a) => !a.is_lead).map((a) => a.engineer_code)
  );
  const [planRanges, setPlanRanges] = useState<PlanRangeEntry[]>(initialPlanRanges);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setTitle(c.title ?? "");
    setCustomerCode(c.customer_code ?? "");
    setMachineNos(c.machines.map((m) => m.machine_no));
    setProjectCode(c.project_code ?? "");
    setServiceTypeCode(c.service_type_code ?? "7505");
    setDueDate(c.due_date ?? "");
    setLeadEngineer(c.assignees.find((a) => a.is_lead)?.engineer_code ?? "");
    setOtherEngineers(c.assignees.filter((a) => !a.is_lead).map((a) => a.engineer_code));
    setPlanRanges(initialPlanRanges);
    setError(null);
  }, [open, c, initialPlanRanges]);

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
    setMachineNos((prev) => (prev.includes(mn) ? prev.filter((x) => x !== mn) : [...prev, mn]));
  };

  const toggleOtherEngineer = (code: string) => {
    if (code === leadEngineer) return;
    setOtherEngineers((prev) => (prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]));
  };

  const assignedCodes = useMemo(() => {
    const set = new Set<string>();
    if (leadEngineer) set.add(leadEngineer);
    for (const c of otherEngineers) set.add(c);
    return Array.from(set);
  }, [leadEngineer, otherEngineers]);

  const onSave = () => {
    setError(null);
    if (!customerCode) return setError("Customer required");
    if (machineNos.length === 0) return setError("At least 1 machine required");
    if (!leadEngineer) return setError("Lead engineer required");
    // Drop any plan ranges whose engineer is no longer assigned
    const cleanRanges = planRanges.filter((r) => assignedCodes.includes(r.engineer_code));

    startTransition(async () => {
      const r = await updateCase(c.so_number, {
        title: title.trim() || null,
        customer_code: customerCode,
        machine_nos: machineNos,
        project_code: projectCode.trim() || null,
        service_type_code: serviceTypeCode,
        due_date: dueDate || null,
        lead_engineer: leadEngineer,
        other_engineers: otherEngineers,
        plan_ranges: cleanRanges,
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
        <button type="button" className="btn btn-primary btn-block" disabled={pending} onClick={onSave}>
          {pending ? "Saving…" : "Save changes"}
        </button>
      }
    >
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Subject */}
        <Section title="Subject">
          <Field label="Subject">
            <textarea
              className="field"
              rows={3}
              placeholder="Short note about the case"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
        </Section>

        {/* Customer & machines */}
        <Section title="Customer & machines">
          <Field label="Customer" required>
            <select
              className="field"
              value={customerCode}
              onChange={(e) => {
                setCustomerCode(e.target.value);
                setMachineNos([]);
              }}
            >
              <option value="">Select customer…</option>
              {customers.map((cust) => (
                <option key={cust.code} value={cust.code}>
                  {cust.code} · {cust.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={`Machines (${machineNos.length})${customerCode ? "" : " — pick customer first"}`} required>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {machineDisplay.length === 0 ? (
                <div
                  style={{
                    padding: 10,
                    background: "var(--surface-2)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--ink-3)",
                  }}
                >
                  No machines for this customer yet.
                </div>
              ) : (
                machineDisplay.map((m) => {
                  const on = machineNos.includes(m.machine_no);
                  return (
                    <button
                      key={m.machine_no}
                      type="button"
                      className="fchip"
                      data-on={on || undefined}
                      onClick={() => toggleMachine(m.machine_no)}
                    >
                      {m.machine_no}
                      {m.product_code && <span className="cnt">{m.product_code}</span>}
                    </button>
                  );
                })
              )}
            </div>
          </Field>

          <Field label="Project code">
            <input
              type="text"
              className="field mono"
              placeholder="e.g. Line#15 / Group 2 / MCE#3"
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value)}
            />
          </Field>
        </Section>

        {/* Service type */}
        <Section title="Service type">
          <Field label="Service type">
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
          </Field>
        </Section>

        {/* Schedule & lead */}
        <Section title="Schedule & team">
          <Field label="Due date">
            <input
              type="date"
              className="field"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
          <Field label="Lead engineer" required>
            <select
              className="field mono"
              value={leadEngineer}
              onChange={(e) => {
                const newLead = e.target.value;
                setLeadEngineer(newLead);
                // If lead is now in others, remove from there
                if (newLead) setOtherEngineers((prev) => prev.filter((c) => c !== newLead));
              }}
            >
              <option value="">Select engineer…</option>
              {engineers.map((eng) => (
                <option key={eng.code} value={eng.code}>
                  {eng.code} · {eng.full_name ?? "—"}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Other engineers (${otherEngineers.length})`}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {engineers
                .filter((eng) => eng.code !== leadEngineer)
                .map((eng) => {
                  const on = otherEngineers.includes(eng.code);
                  return (
                    <button
                      key={eng.code}
                      type="button"
                      className="fchip"
                      data-on={on || undefined}
                      onClick={() => toggleOtherEngineer(eng.code)}
                    >
                      {eng.code}
                      {eng.full_name && <span className="cnt">{eng.full_name}</span>}
                    </button>
                  );
                })}
            </div>
          </Field>
        </Section>

        {/* Plan ranges */}
        <Section title="Plan dates">
          <PlanRangesPicker
            engineerCodes={assignedCodes}
            engineers={engineers}
            value={planRanges}
            onChange={setPlanRanges}
          />
        </Section>

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="kicker">{title}</div>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="fieldlbl">
        {label}
        {required && <span style={{ color: "var(--red)", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}
