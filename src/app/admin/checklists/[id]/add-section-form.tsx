"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { createChecklistSection } from "../actions";

type Props = {
  templateId: number;
  open: boolean;
  onToggle: () => void;
};

export function AddSectionForm({ templateId, open, onToggle }: Props) {
  const router = useRouter();
  const [sectionNo, setSectionNo] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onAdd = () => {
    setError(null);
    startTransition(async () => {
      const r = await createChecklistSection(templateId, sectionNo, title);
      if (!r.success) {
        setError(r.error ?? "Add failed");
        return;
      }
      setSectionNo("");
      setTitle("");
      onToggle();
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button type="button" className="btn btn-secondary" onClick={onToggle}>
        <Icon name="plus" size={12} /> Add section
      </button>
    );
  }

  return (
    <div className="card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="kicker">New section</div>
      <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 10 }}>
        <input
          type="text"
          className="field mono"
          placeholder="No. (1)"
          value={sectionNo}
          onChange={(e) => setSectionNo(e.target.value)}
        />
        <input
          type="text"
          className="field"
          placeholder="Title (e.g. General)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      {error && (
        <div style={{ padding: 8, background: "var(--danger-soft)", color: "var(--danger)", borderRadius: 6, fontSize: 12 }}>
          <Icon name="alert" size={11} /> {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <button type="button" className="btn btn-ghost" onClick={onToggle} disabled={pending}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={onAdd} disabled={pending}>
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
    </div>
  );
}
