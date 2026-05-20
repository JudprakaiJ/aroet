"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { createChecklistTemplate } from "./actions";

export function NewTemplateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [machineType, setMachineType] = useState("");
  const [version, setVersion] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setMachineType("");
    setVersion("");
    setName("");
    setError(null);
  };

  const onCreate = () => {
    setError(null);
    startTransition(async () => {
      const r = await createChecklistTemplate({
        machine_type: machineType,
        version: version.trim() || null,
        name,
      });
      if (!r.success) {
        setError(r.error ?? "Failed");
        return;
      }
      reset();
      setOpen(false);
      if (r.id) router.push(`/admin/checklists/${r.id}`);
      else router.refresh();
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setOpen(true)}
        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        <Icon name="plus" size={14} /> New template
      </button>
    );
  }

  return (
    <div className="card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>New template</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label className="fieldlbl">Machine type</label>
          <input
            type="text"
            className="field mono"
            placeholder="DLM / MCVP4 / MCVP8 / SPV2 / SPV3"
            value={machineType}
            onChange={(e) => setMachineType(e.target.value.toUpperCase())}
          />
        </div>
        <div>
          <label className="fieldlbl">Version (optional)</label>
          <input
            type="text"
            className="field mono"
            placeholder="V1 / V2 / V3"
            value={version}
            onChange={(e) => setVersion(e.target.value.toUpperCase())}
          />
        </div>
      </div>
      <div>
        <label className="fieldlbl">Name (shown to engineers)</label>
        <input
          type="text"
          className="field"
          placeholder="e.g. 12 MEVP Vision Processor"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      {error && (
        <div
          style={{
            padding: 8,
            background: "var(--danger-soft)",
            color: "var(--danger)",
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          <Icon name="alert" size={11} /> {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          disabled={pending}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onCreate}
          disabled={pending}
        >
          {pending ? "Creating…" : "Create"}
        </button>
      </div>
    </div>
  );
}
