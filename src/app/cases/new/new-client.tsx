"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { CodeBadge } from "@/components/primitives/code-badge";
import { SERVICE_TYPES } from "@/lib/service-types";
import {
  createCase,
  createMachineInline,
  parseTitleSmart,
  type NewCaseInput,
  type ParseTitleResult,
} from "./actions";

type Customer = { code: string; name: string };
type Machine = { machine_no: string; customer_code: string | null; name: string | null; product_code: string | null };
type Engineer = { code: string; full_name: string | null; role: string | null };

type Props = {
  customers: Customer[];
  machines: Machine[];
  engineers: Engineer[];
};

type Form = {
  so_number: string;
  sr_number: string;
  customer_code: string;
  machine_nos: string[];
  primary_machine_no: string;
  service_type_code: string;
  project_code: string;
  subject: string;
  due_date: string;
  lead_engineer: string;
};

const SAMPLE_PASTE =
  "SO2606-09 - Hoya Lens Thailand - MITSF27 MCSF15 - Line#15 - Preventive Maintenance";

const EMPTY_FORM: Form = {
  so_number: "",
  sr_number: "",
  customer_code: "",
  machine_nos: [],
  primary_machine_no: "",
  service_type_code: "7505",
  project_code: "",
  subject: "",
  due_date: "",
  lead_engineer: "JKH",
};

export function NewCaseClient({ customers, machines: initialMachines, engineers }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"smart" | "manual">("smart");
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [paste, setPaste] = useState("");
  const [parsed, setParsed] = useState<ParseTitleResult | null>(null);
  const [machines, setMachines] = useState<Machine[]>(initialMachines);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [createMachineOpen, setCreateMachineOpen] = useState<{ machine_no: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const customerMachines = useMemo(
    () => machines.filter((m) => !form.customer_code || m.customer_code === form.customer_code),
    [machines, form.customer_code]
  );

  const setField = useCallback(<K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
  }, []);

  useEffect(() => {
    if (mode !== "smart") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!paste.trim()) {
      setParsed(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const result = await parseTitleSmart(paste);
      setParsed(result);
      setForm((f) => {
        const knownInDb = new Set(machines.map((m) => m.machine_no));
        const addable = result.machine_codes.filter(
          (mn) => !f.machine_nos.includes(mn) && knownInDb.has(mn)
        );
        const nextMachines = [...f.machine_nos, ...addable];
        return {
          ...f,
          so_number: result.so_number ?? f.so_number,
          project_code: result.project_code ?? f.project_code,
          subject: result.subject ?? f.subject,
          machine_nos: nextMachines,
        };
      });
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [paste, mode, machines]);

  const canSubmit =
    form.so_number.trim() &&
    form.customer_code &&
    form.machine_nos.length > 0 &&
    form.service_type_code &&
    form.lead_engineer;

  const onSubmit = () => {
    setError(null);
    const payload: NewCaseInput = {
      so_number: form.so_number.trim(),
      sr_number: form.sr_number.trim(),
      customer_code: form.customer_code,
      machine_nos: form.machine_nos,
      service_type_code: form.service_type_code,
      project_code: form.project_code.trim() || undefined,
      title: form.subject.trim() || undefined,
      description: form.subject.trim() || undefined,
      due_date: form.due_date || undefined,
      lead_engineer: form.lead_engineer,
    };
    startTransition(async () => {
      const result = await createCase(payload);
      if (result.success && result.so_number) {
        router.push(`/cases/${result.so_number}`);
      } else {
        setError(result.error ?? "Create failed");
      }
    });
  };

  const onCreateMachine = (
    machineNo: string,
    productCode: string,
    serialNo: string
  ) => {
    if (!form.customer_code) {
      setError("Pick a customer before adding a machine.");
      return;
    }
    startTransition(async () => {
      const r = await createMachineInline({
        machine_no: machineNo,
        customer_code: form.customer_code,
        product_code: productCode || undefined,
        serial_no: serialNo || undefined,
      });
      if (!r.success) {
        setError(r.error ?? "Create machine failed");
        return;
      }
      // Add to local list so the chip shows up + selected
      const newMachine: Machine = {
        machine_no: machineNo,
        customer_code: form.customer_code,
        name: null,
        product_code: productCode || null,
      };
      setMachines((prev) => [...prev, newMachine]);
      setForm((f) => ({
        ...f,
        machine_nos: f.machine_nos.includes(machineNo) ? f.machine_nos : [...f.machine_nos, machineNo],
      }));
      setCreateMachineOpen(null);
    });
  };

  const unknownMachines = useMemo(
    () => parsed?.unmatched_codes ?? [],
    [parsed]
  );

  return (
    <div style={{ padding: "10px 14px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="tabs" role="tablist">
        <button type="button" data-active={mode === "smart"} onClick={() => setMode("smart")}>
          Smart paste
        </button>
        <button type="button" data-active={mode === "manual"} onClick={() => setMode("manual")}>
          Manual
        </button>
      </div>

      {mode === "smart" && (
        <div className="smartpaste">
          <label className="fieldlbl">Paste D365 title</label>
          <textarea
            className="field"
            rows={3}
            placeholder="SO2606-… - Customer - Machine1 Machine2 - Project - Subject"
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
          />
          {!paste && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setPaste(SAMPLE_PASTE)}
              style={{ marginTop: 6 }}
            >
              Use example
            </button>
          )}
          {parsed && (
            <div style={{ marginTop: 10 }}>
              <ParsedRow label="SO" value={parsed.so_number} required ok={Boolean(parsed.so_number)} />
              <ParsedRow
                label="Project"
                value={parsed.project_code}
                ok={Boolean(parsed.project_code)}
                note={parsed.project_code_source === "pattern" ? "from pattern" : undefined}
              />
              <div className="smartpaste-row">
                <span className="lbl">Machines</span>
                {parsed.machine_codes.length > 0 ? (
                  <span
                    className="val"
                    style={{ display: "inline-flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}
                  >
                    {parsed.machine_codes.map((mn) => (
                      <CodeBadge key={mn}>{mn}</CodeBadge>
                    ))}
                  </span>
                ) : (
                  <span className="vmiss">not found · ok</span>
                )}
              </div>
              <ParsedRow label="Subject" value={parsed.subject} ok={Boolean(parsed.subject)} />
              {unknownMachines.length > 0 && form.customer_code && (
                <div
                  className="card"
                  style={{
                    marginTop: 8,
                    padding: 10,
                    background: "var(--warn-soft)",
                    color: "var(--warn)",
                    borderColor: "rgba(217,119,6,.3)",
                    fontSize: 12,
                  }}
                >
                  <div style={{ marginBottom: 6 }}>
                    <Icon name="alert" size={11} /> Machines not in DB yet — add them?
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {unknownMachines.map((mn) => (
                      <button
                        key={mn}
                        type="button"
                        className="fchip"
                        onClick={() => setCreateMachineOpen({ machine_no: mn })}
                      >
                        <Icon name="plus" size={10} /> Add {mn}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {unknownMachines.length > 0 && !form.customer_code && (
                <div
                  className="sub"
                  style={{
                    marginTop: 8,
                    textTransform: "none",
                    letterSpacing: 0,
                    fontSize: 11.5,
                    color: "var(--ink-3)",
                  }}
                >
                  Pick a customer first to register: {unknownMachines.join(", ")}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Section title="Identifiers">
        <Field label="SO number" required>
          <input
            className="field mono"
            value={form.so_number}
            onChange={(e) => setField("so_number", e.target.value.toUpperCase())}
            placeholder="SO2606-09"
          />
        </Field>
        <Field label="SR number">
          <input
            className="field mono"
            value={form.sr_number}
            onChange={(e) => setField("sr_number", e.target.value.toUpperCase())}
            placeholder="SR26-AROET03450 (optional)"
          />
        </Field>
      </Section>

      <Section title="Customer & machines">
        <Field label="Customer" required>
          <select
            className="field"
            value={form.customer_code}
            onChange={(e) => {
              setField("customer_code", e.target.value);
              setField("machine_nos", []);
            }}
          >
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label={`Machines (${form.machine_nos.length})`} required>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {customerMachines.length === 0 && (
              <div className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 12 }}>
                Pick a customer first.
              </div>
            )}
            {customerMachines.map((m) => {
              const on = form.machine_nos.includes(m.machine_no);
              return (
                <button
                  key={m.machine_no}
                  type="button"
                  className="fchip"
                  data-on={on || undefined}
                  onClick={() => {
                    const next = on
                      ? form.machine_nos.filter((x) => x !== m.machine_no)
                      : [...form.machine_nos, m.machine_no];
                    setField("machine_nos", next);
                  }}
                >
                  {m.machine_no}
                  {m.product_code ? <span className="cnt">{m.product_code}</span> : null}
                </button>
              );
            })}
            {form.customer_code && (
              <button
                type="button"
                className="fchip"
                onClick={() => setCreateMachineOpen({ machine_no: "" })}
                style={{ borderStyle: "dashed" }}
              >
                <Icon name="plus" size={10} /> New machine
              </button>
            )}
          </div>
        </Field>

        <Field label="Project code">
          <input
            className="field mono"
            value={form.project_code}
            onChange={(e) => setField("project_code", e.target.value.toUpperCase())}
            placeholder="ESTH98 / Line#15 / Group 2"
          />
        </Field>
      </Section>

      <Section title="Service type">
        <Field label="Service type" required>
          <select
            className="field"
            value={form.service_type_code}
            onChange={(e) => setField("service_type_code", e.target.value)}
          >
            {SERVICE_TYPES.map((t) => (
              <option key={t.code} value={t.code}>
                {t.code} · {t.name}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="Subject">
        <Field label="Subject">
          <textarea
            className="field"
            rows={3}
            value={form.subject}
            onChange={(e) => setField("subject", e.target.value)}
            placeholder="Optional — short note about what this case is about"
          />
        </Field>
      </Section>

      <Section title="Schedule & lead">
        <Field label="Due date">
          <input
            className="field"
            type="date"
            value={form.due_date}
            onChange={(e) => setField("due_date", e.target.value)}
          />
        </Field>
        <Field label="Lead engineer" required>
          <select
            className="field mono"
            value={form.lead_engineer}
            onChange={(e) => setField("lead_engineer", e.target.value)}
          >
            <option value="">Select engineer…</option>
            {engineers.map((e) => (
              <option key={e.code} value={e.code}>
                {e.code} · {e.full_name ?? "—"}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <div
        className="sub"
        style={{ textTransform: "none", letterSpacing: 0, fontSize: 12, color: "var(--ink-3)" }}
      >
        Only SO + Customer + Machine + Service type + Lead are required. Subject and dates can be filled later from the case detail.
      </div>

      {error && (
        <div
          className="card"
          style={{
            padding: 12,
            background: "var(--danger-soft)",
            borderColor: "rgba(220,38,38,.3)",
            color: "var(--danger)",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => router.push("/cases")}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!canSubmit || pending}
          onClick={onSubmit}
        >
          {pending ? "Creating…" : "Create case"}
        </button>
      </div>

      {createMachineOpen !== null && (
        <CreateMachineInline
          initialNo={createMachineOpen.machine_no}
          customerCode={form.customer_code}
          onCancel={() => setCreateMachineOpen(null)}
          onSubmit={onCreateMachine}
          pending={pending}
        />
      )}
    </div>
  );
}

function CreateMachineInline({
  initialNo,
  customerCode,
  onSubmit,
  onCancel,
  pending,
}: {
  initialNo: string;
  customerCode: string;
  onSubmit: (machineNo: string, productCode: string, serialNo: string) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const [machineNo, setMachineNo] = useState(initialNo);
  const [productCode, setProductCode] = useState("");
  const [serialNo, setSerialNo] = useState("");

  return (
    <div
      className="card"
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        maxWidth: 480,
        margin: "0 auto",
        padding: 16,
        boxShadow: "0 8px 24px rgba(0,0,0,.18)",
        zIndex: 50,
        background: "var(--surface)",
        borderColor: "var(--red-line)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
          Register new machine
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="close"
          style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--ink-3)" }}
        >
          <Icon name="x" size={16} />
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          className="field mono"
          placeholder="MCSF15"
          value={machineNo}
          onChange={(e) => setMachineNo(e.target.value.toUpperCase())}
          autoFocus
        />
        <input
          className="field mono"
          placeholder="Product code (e.g. MCVP8-V1)"
          value={productCode}
          onChange={(e) => setProductCode(e.target.value.toUpperCase())}
        />
        <input
          className="field mono"
          placeholder="Serial no (optional)"
          value={serialNo}
          onChange={(e) => setSerialNo(e.target.value)}
        />
        <div style={{ display: "flex", gap: 6, fontSize: 11, color: "var(--ink-3)" }}>
          Customer: <span className="mono">{customerCode}</span>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!machineNo.trim() || pending}
          onClick={() => onSubmit(machineNo.trim(), productCode.trim(), serialNo.trim())}
        >
          {pending ? "Adding…" : "Add machine"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="kicker" style={{ marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
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
        {required ? " *" : ""}
      </label>
      {children}
    </div>
  );
}

function ParsedRow({
  label,
  value,
  required,
  ok,
  note,
}: {
  label: string;
  value: string | undefined;
  required?: boolean;
  ok: boolean;
  note?: string;
}) {
  return (
    <div className="smartpaste-row">
      <span className="lbl">{label}</span>
      {value ? (
        <>
          <span className="val">{value}</span>
          {note && (
            <span className="chip" style={{ padding: "1px 6px", fontSize: 9 }}>
              {note}
            </span>
          )}
          {ok ? (
            <span className="vchk">
              <Icon name="check" size={14} />
            </span>
          ) : (
            <span className="chip" style={{ padding: "1px 6px" }}>
              auto
            </span>
          )}
        </>
      ) : (
        <span className={required ? "val" : "vmiss"} style={required ? { color: "var(--danger)" } : undefined}>
          {required ? "not found" : "not found · ok"}
        </span>
      )}
    </div>
  );
}
