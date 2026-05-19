"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { SERVICE_TYPES } from "@/lib/service-types";
import { createCase, parseTitleSmart, type NewCaseInput } from "./actions";

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
  title: string;
  description: string;
  due_date: string;
  lead_engineer: string;
};

const SAMPLE_PASTE = "SO2606-09 - Hoya Lens Thailand - MITSF27 - ESLA22 - Preventive Maintenance MITSF27";

const EMPTY_FORM: Form = {
  so_number: "",
  sr_number: "",
  customer_code: "",
  machine_nos: [],
  primary_machine_no: "",
  service_type_code: "7505",
  project_code: "",
  title: "",
  description: "",
  due_date: "",
  lead_engineer: "JKH",
};

export function NewCaseClient({ customers, machines, engineers }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"smart" | "manual">("smart");
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [paste, setPaste] = useState("");
  const [parsed, setParsed] = useState<{
    so_number?: string;
    project_code?: string;
    machine_code?: string;
    subject?: string;
    unmatched_codes: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
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
      setForm((f) => ({
        ...f,
        so_number: result.so_number ?? f.so_number,
        project_code: result.project_code ?? f.project_code,
        title: result.subject ?? f.title,
        ...(result.machine_code
          ? { machine_nos: f.machine_nos.includes(result.machine_code) ? f.machine_nos : [...f.machine_nos, result.machine_code], primary_machine_no: f.primary_machine_no || result.machine_code }
          : {}),
      }));
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [paste, mode]);

  const canSubmit =
    form.so_number.trim() &&
    form.sr_number.trim() &&
    form.customer_code &&
    form.machine_nos.length > 0 &&
    form.service_type_code &&
    form.description.trim() &&
    form.lead_engineer;

  const onSubmit = () => {
    setError(null);
    const payload: NewCaseInput = {
      so_number: form.so_number.trim(),
      sr_number: form.sr_number.trim(),
      customer_code: form.customer_code,
      machine_nos: form.machine_nos,
      primary_machine_no: form.primary_machine_no || form.machine_nos[0],
      service_type_code: form.service_type_code,
      project_code: form.project_code.trim() || undefined,
      title: form.title.trim() || undefined,
      description: form.description.trim(),
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
            placeholder="SO2606-… - Customer - Machine - Project - Subject"
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
              <ParsedRow label="Project" value={parsed.project_code} ok={Boolean(parsed.project_code)} />
              <ParsedRow label="Machine" value={parsed.machine_code} ok={Boolean(parsed.machine_code)} />
              <ParsedRow label="Subject" value={parsed.subject} ok={Boolean(parsed.subject)} />
              {parsed.unmatched_codes.length > 0 && (
                <div className="smartpaste-row">
                  <span className="lbl">Unmatched</span>
                  <span className="val" style={{ color: "var(--ink-3)" }}>
                    {parsed.unmatched_codes.join(", ")}
                  </span>
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
        <Field label="SR number" required>
          <input
            className="field mono"
            value={form.sr_number}
            onChange={(e) => setField("sr_number", e.target.value.toUpperCase())}
            placeholder="SR26-AROET03450"
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
              setField("primary_machine_no", "");
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

        <Field label="Machines" required>
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
                    if (!on && !form.primary_machine_no) setField("primary_machine_no", m.machine_no);
                    if (on && form.primary_machine_no === m.machine_no) setField("primary_machine_no", next[0] ?? "");
                  }}
                >
                  {m.machine_no}
                  {m.product_code ? <span className="cnt">{m.product_code}</span> : null}
                </button>
              );
            })}
          </div>
        </Field>
      </Section>

      <Section title="Service type & project">
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
        <Field label="Project code">
          <input
            className="field mono"
            value={form.project_code}
            onChange={(e) => setField("project_code", e.target.value.toUpperCase())}
            placeholder="ESLA22"
          />
        </Field>
      </Section>

      <Section title="Title & description">
        <Field label="Title">
          <input
            className="field"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder="Brief subject"
          />
        </Field>
        <Field label="Description" required>
          <textarea
            className="field"
            rows={3}
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            placeholder="Why is this case open?"
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
        Only SO + Customer + Machine + Service type + Description + Lead are required. Everything else can be edited later.
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
}: {
  label: string;
  value: string | undefined;
  required?: boolean;
  ok: boolean;
}) {
  return (
    <div className="smartpaste-row">
      <span className="lbl">{label}</span>
      {value ? (
        <>
          <span className="val">{value}</span>
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
