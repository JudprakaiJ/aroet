"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import {
  updateChecklistTemplate,
  deleteChecklistTemplate,
  duplicateChecklistTemplate,
} from "../actions";
import type { ChecklistTemplateEdit } from "../queries";

type Props = {
  template: ChecklistTemplateEdit;
  admin: boolean;
};

export function TemplateHeader({ template, admin }: Props) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(template.name);
  const [machineType, setMachineType] = useState(template.machine_type);
  const [version, setVersion] = useState(template.version ?? "");
  const [description, setDescription] = useState(template.description ?? "");
  const [source, setSource] = useState(template.source ?? "");
  const [isActive, setIsActive] = useState(template.is_active);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [dupOpen, setDupOpen] = useState(false);
  const [dupName, setDupName] = useState("");
  const [dupVersion, setDupVersion] = useState("");

  const [confirmDel, setConfirmDel] = useState(false);

  const onSave = () => {
    setError(null);
    startTransition(async () => {
      const r = await updateChecklistTemplate(template.id, {
        name,
        machine_type: machineType,
        version: version || null,
        description: description || null,
        source: source || null,
        is_active: isActive,
      });
      if (!r.success) {
        setError(r.error ?? "Save failed");
        return;
      }
      setEdit(false);
      router.refresh();
    });
  };

  const onDelete = () => {
    setError(null);
    startTransition(async () => {
      const r = await deleteChecklistTemplate(template.id);
      if (!r.success) {
        setError(r.error ?? "Delete failed");
        setConfirmDel(false);
        return;
      }
      router.push("/admin/checklists");
      router.refresh();
    });
  };

  const onDuplicate = () => {
    setError(null);
    if (!dupName.trim()) {
      setError("New name required");
      return;
    }
    startTransition(async () => {
      const r = await duplicateChecklistTemplate(template.id, dupName, dupVersion || null);
      if (!r.success) {
        setError(r.error ?? "Duplicate failed");
        return;
      }
      setDupOpen(false);
      if (r.id) router.push(`/admin/checklists/${r.id}`);
    });
  };

  if (!admin || !edit) {
    return (
      <div className="card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="chip mono" style={{ fontSize: 11, fontWeight: 600 }}>
            {template.machine_type}{template.version ? ` · ${template.version}` : ""}
          </span>
          {!template.is_active && (
            <span className="chip chip-soft" style={{ fontSize: 10, color: "var(--ink-3)" }}>
              Inactive
            </span>
          )}
          {template.source && (
            <span className="sub" style={{ fontSize: 11, textTransform: "none", letterSpacing: 0 }}>
              {template.source}
            </span>
          )}
          {admin && (
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ minHeight: 30, padding: "0 10px", fontSize: 12 }}
                onClick={() => setEdit(true)}
              >
                <Icon name="wrench" size={12} /> Edit
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ minHeight: 30, padding: "0 10px", fontSize: 12 }}
                onClick={() => {
                  setDupName(`${template.name} (copy)`);
                  setDupVersion(template.version ?? "");
                  setDupOpen(true);
                }}
              >
                <Icon name="folder" size={12} /> Duplicate
              </button>
            </div>
          )}
        </div>
        {template.description && (
          <div style={{ fontSize: 13, color: "var(--ink-2)", whiteSpace: "pre-wrap" }}>
            {template.description}
          </div>
        )}

        {dupOpen && (
          <div
            style={{
              borderTop: "1px dashed var(--line-2)",
              paddingTop: 10,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div className="kicker">Duplicate template</div>
            <input
              type="text"
              className="field"
              placeholder="New name"
              value={dupName}
              onChange={(e) => setDupName(e.target.value)}
            />
            <input
              type="text"
              className="field mono"
              placeholder="Version (optional)"
              value={dupVersion}
              onChange={(e) => setDupVersion(e.target.value.toUpperCase())}
            />
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-ghost" onClick={() => setDupOpen(false)} disabled={pending}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={onDuplicate} disabled={pending}>
                {pending ? "Cloning…" : "Clone with all items"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: 8, background: "var(--danger-soft)", color: "var(--danger)", borderRadius: 6, fontSize: 12 }}>
            <Icon name="alert" size={11} /> {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label className="fieldlbl">Machine type</label>
          <input
            type="text"
            className="field mono"
            value={machineType}
            onChange={(e) => setMachineType(e.target.value.toUpperCase())}
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
        <label className="fieldlbl">Name</label>
        <input type="text" className="field" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="fieldlbl">Description</label>
        <textarea
          className="field"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className="fieldlbl">Source</label>
        <input
          type="text"
          className="field"
          placeholder="A&R Official / In-house / etc."
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Active (engineers can use this template)
      </label>

      {error && (
        <div style={{ padding: 8, background: "var(--danger-soft)", color: "var(--danger)", borderRadius: 6, fontSize: 12 }}>
          <Icon name="alert" size={11} /> {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, justifyContent: "space-between", alignItems: "center" }}>
        {confirmDel ? (
          <span style={{ display: "flex", gap: 6 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmDel(false)} disabled={pending}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={onDelete} disabled={pending}>
              <Icon name="x" size={11} /> {pending ? "Deleting…" : "Confirm delete"}
            </button>
          </span>
        ) : (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ color: "var(--danger)" }}
            onClick={() => setConfirmDel(true)}
            disabled={pending}
          >
            <Icon name="x" size={12} /> Delete template
          </button>
        )}
        <span style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          <button type="button" className="btn btn-ghost" onClick={() => setEdit(false)} disabled={pending}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onSave} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </button>
        </span>
      </div>
    </div>
  );
}
