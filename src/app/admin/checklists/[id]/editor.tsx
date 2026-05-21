"use client";

import { useState } from "react";
import { EmptyState } from "@/components/primitives/empty-state";
import { TemplateHeader } from "./template-header";
import { SectionCard } from "./section-card";
import { AddSectionForm } from "./add-section-form";
import type { ChecklistTemplateEdit } from "../queries";

type Props = {
  template: ChecklistTemplateEdit;
  admin: boolean;
};

export function Editor({ template, admin }: Props) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
      <TemplateHeader template={template} admin={admin} />

      {template.sections.map((s, i) => (
        <SectionCard
          key={s.id}
          section={s}
          admin={admin}
          isFirst={i === 0}
          isLast={i === template.sections.length - 1}
        />
      ))}

      {template.sections.length === 0 && (
        <EmptyState
          icon="clip-list"
          title="No sections yet"
          body={admin ? "Add the first section using the + button below." : undefined}
          compact
        />
      )}

      {admin && (
        <AddSectionForm
          templateId={template.id}
          open={addOpen}
          onToggle={() => setAddOpen((x) => !x)}
        />
      )}
    </div>
  );
}
