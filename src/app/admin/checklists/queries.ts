import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export type ChecklistTemplateListItem = {
  id: number;
  machine_type: string;
  version: string | null;
  name: string;
  source: string | null;
  is_active: boolean;
  sections_count: number;
  items_count: number;
  case_uses_count: number;
};

export type ChecklistItemEdit = {
  id: number;
  section_id: number;
  item_no: string;
  text: string;
  expected_value: string | null;
  is_critical: boolean;
  display_order: number;
};

export type ChecklistSectionEdit = {
  id: number;
  template_id: number;
  section_no: string;
  title: string;
  display_order: number;
  items: ChecklistItemEdit[];
};

export type ChecklistTemplateEdit = {
  id: number;
  machine_type: string;
  version: string | null;
  name: string;
  description: string | null;
  source: string | null;
  is_active: boolean;
  sections: ChecklistSectionEdit[];
  case_uses_count: number;
};

export async function listChecklistTemplatesAdmin(): Promise<ChecklistTemplateListItem[]> {
  const supabase = createServiceClient();
  const [templatesRes, sectionsRes, itemsRes, usesRes] = await Promise.all([
    supabase
      .from("checklist_templates")
      .select("id, machine_type, version, name, source, is_active")
      .order("machine_type", { ascending: true })
      .order("version", { ascending: true, nullsFirst: true }),
    supabase.from("checklist_sections").select("id, template_id"),
    supabase
      .from("checklist_items")
      .select("section_id, checklist_sections!inner(template_id)"),
    supabase.from("case_checklists").select("template_id"),
  ]);

  const templates = templatesRes.data ?? [];
  const sectionsByTpl = new Map<number, number>();
  const sectionToTpl = new Map<number, number>();
  for (const s of sectionsRes.data ?? []) {
    sectionsByTpl.set(s.template_id, (sectionsByTpl.get(s.template_id) ?? 0) + 1);
    sectionToTpl.set(s.id, s.template_id);
  }
  const itemsByTpl = new Map<number, number>();
  for (const it of (itemsRes.data ?? []) as Array<{
    section_id: number;
    checklist_sections: { template_id: number } | { template_id: number }[] | null;
  }>) {
    const joined = Array.isArray(it.checklist_sections)
      ? it.checklist_sections[0]
      : it.checklist_sections;
    const tplId = joined?.template_id ?? sectionToTpl.get(it.section_id);
    if (tplId == null) continue;
    itemsByTpl.set(tplId, (itemsByTpl.get(tplId) ?? 0) + 1);
  }
  const usesByTpl = new Map<number, number>();
  for (const u of (usesRes.data ?? []) as Array<{ template_id: number | null }>) {
    if (u.template_id == null) continue;
    usesByTpl.set(u.template_id, (usesByTpl.get(u.template_id) ?? 0) + 1);
  }

  return templates.map((t) => ({
    id: t.id,
    machine_type: t.machine_type,
    version: t.version,
    name: t.name,
    source: t.source,
    is_active: t.is_active,
    sections_count: sectionsByTpl.get(t.id) ?? 0,
    items_count: itemsByTpl.get(t.id) ?? 0,
    case_uses_count: usesByTpl.get(t.id) ?? 0,
  }));
}

export async function getChecklistTemplateForEdit(
  id: number
): Promise<ChecklistTemplateEdit | null> {
  const supabase = createServiceClient();

  const { data: tpl } = await supabase
    .from("checklist_templates")
    .select("id, machine_type, version, name, description, source, is_active")
    .eq("id", id)
    .maybeSingle();
  if (!tpl) return null;

  const [sectionsRes, itemsRes, usesRes] = await Promise.all([
    supabase
      .from("checklist_sections")
      .select("id, template_id, section_no, title, display_order")
      .eq("template_id", id)
      .order("display_order", { ascending: true })
      .order("id", { ascending: true }),
    supabase
      .from("checklist_items")
      .select(
        "id, section_id, item_no, text, expected_value, is_critical, display_order, checklist_sections!inner(template_id)"
      )
      .eq("checklist_sections.template_id", id)
      .order("display_order", { ascending: true })
      .order("id", { ascending: true }),
    supabase
      .from("case_checklists")
      .select("id", { count: "exact", head: true })
      .eq("template_id", id),
  ]);

  const itemsBySection = new Map<number, ChecklistItemEdit[]>();
  for (const it of (itemsRes.data ?? []) as Array<{
    id: number;
    section_id: number;
    item_no: string;
    text: string;
    expected_value: string | null;
    is_critical: boolean;
    display_order: number;
  }>) {
    const list = itemsBySection.get(it.section_id) ?? [];
    list.push({
      id: it.id,
      section_id: it.section_id,
      item_no: it.item_no,
      text: it.text,
      expected_value: it.expected_value,
      is_critical: it.is_critical,
      display_order: it.display_order,
    });
    itemsBySection.set(it.section_id, list);
  }

  const sections: ChecklistSectionEdit[] = (sectionsRes.data ?? []).map((s) => ({
    id: s.id,
    template_id: s.template_id,
    section_no: s.section_no,
    title: s.title,
    display_order: s.display_order,
    items: itemsBySection.get(s.id) ?? [],
  }));

  return {
    id: tpl.id,
    machine_type: tpl.machine_type,
    version: tpl.version,
    name: tpl.name,
    description: tpl.description,
    source: tpl.source,
    is_active: tpl.is_active,
    sections,
    case_uses_count: usesRes.count ?? 0,
  };
}
