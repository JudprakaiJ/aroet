"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { currentUser, isApprover } from "@/lib/auth/current-user";

async function adminOrError(): Promise<string | null> {
  const me = await currentUser();
  if (!me || !isApprover(me.role)) return "Admin role required";
  return null;
}

type Result<T = unknown> = { success: boolean; error?: string } & T;

function ok(extra: Record<string, unknown> = {}): { success: true } & Record<string, unknown> {
  return { success: true, ...extra };
}
function fail(error: string): { success: false; error: string } {
  return { success: false, error };
}

/* -------------------- template -------------------- */

export interface NewTemplateInput {
  machine_type: string;
  version?: string | null;
  name: string;
  description?: string | null;
  source?: string | null;
  is_active?: boolean;
}

export async function createChecklistTemplate(
  input: NewTemplateInput
): Promise<Result<{ id?: number }>> {
  const denied = await adminOrError();
  if (denied) return fail(denied);
  if (!input.machine_type?.trim()) return fail("Machine type required");
  if (!input.name?.trim()) return fail("Name required");

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("checklist_templates")
    .insert({
      machine_type: input.machine_type.trim(),
      version: input.version?.trim() || null,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      source: input.source?.trim() || "A&R Official",
      is_active: input.is_active ?? true,
    })
    .select("id")
    .single();

  if (error) return fail(error.message);
  revalidatePath("/admin/checklists");
  return { ...ok(), id: data.id };
}

export interface TemplatePatch {
  machine_type?: string;
  version?: string | null;
  name?: string;
  description?: string | null;
  source?: string | null;
  is_active?: boolean;
}

export async function updateChecklistTemplate(
  id: number,
  patch: TemplatePatch
): Promise<Result> {
  const denied = await adminOrError();
  if (denied) return fail(denied);

  const updates: Record<string, unknown> = {};
  if (patch.machine_type !== undefined) {
    if (!patch.machine_type.trim()) return fail("Machine type cannot be blank");
    updates.machine_type = patch.machine_type.trim();
  }
  if (patch.version !== undefined) updates.version = patch.version?.trim() || null;
  if (patch.name !== undefined) {
    if (!patch.name.trim()) return fail("Name cannot be blank");
    updates.name = patch.name.trim();
  }
  if (patch.description !== undefined) updates.description = patch.description?.trim() || null;
  if (patch.source !== undefined) updates.source = patch.source?.trim() || null;
  if (patch.is_active !== undefined) updates.is_active = patch.is_active;

  const supabase = createServiceClient();
  const { error } = await supabase.from("checklist_templates").update(updates).eq("id", id);
  if (error) return fail(error.message);

  revalidatePath("/admin/checklists");
  revalidatePath(`/admin/checklists/${id}`);
  return ok();
}

export async function deleteChecklistTemplate(id: number): Promise<Result> {
  const denied = await adminOrError();
  if (denied) return fail(denied);

  const supabase = createServiceClient();
  const { count } = await supabase
    .from("case_checklists")
    .select("id", { count: "exact", head: true })
    .eq("template_id", id);
  if (count && count > 0) {
    return fail(
      `Cannot delete — ${count} case checklist${count === 1 ? "" : "s"} reference this template. Toggle inactive instead.`
    );
  }

  const { error } = await supabase.from("checklist_templates").delete().eq("id", id);
  if (error) return fail(error.message);

  revalidatePath("/admin/checklists");
  return ok();
}

export async function duplicateChecklistTemplate(
  sourceId: number,
  newName: string,
  newVersion: string | null
): Promise<Result<{ id?: number }>> {
  const denied = await adminOrError();
  if (denied) return fail(denied);
  if (!newName.trim()) return fail("New name required");

  const supabase = createServiceClient();

  const { data: src } = await supabase
    .from("checklist_templates")
    .select("machine_type, version, name, description, source")
    .eq("id", sourceId)
    .maybeSingle();
  if (!src) return fail("Source template not found");

  const { data: newTpl, error: tplErr } = await supabase
    .from("checklist_templates")
    .insert({
      machine_type: src.machine_type,
      version: newVersion?.trim() || null,
      name: newName.trim(),
      description: src.description,
      source: src.source,
      is_active: true,
    })
    .select("id")
    .single();
  if (tplErr || !newTpl) return fail(tplErr?.message ?? "Failed to clone template");

  const { data: sections } = await supabase
    .from("checklist_sections")
    .select("id, section_no, title, display_order")
    .eq("template_id", sourceId)
    .order("display_order", { ascending: true });

  for (const s of sections ?? []) {
    const { data: newSection, error: secErr } = await supabase
      .from("checklist_sections")
      .insert({
        template_id: newTpl.id,
        section_no: s.section_no,
        title: s.title,
        display_order: s.display_order,
      })
      .select("id")
      .single();
    if (secErr || !newSection) {
      await supabase.from("checklist_templates").delete().eq("id", newTpl.id);
      return fail(`Failed cloning section ${s.section_no}: ${secErr?.message}`);
    }

    const { data: items } = await supabase
      .from("checklist_items")
      .select("item_no, text, expected_value, is_critical, display_order")
      .eq("section_id", s.id)
      .order("display_order", { ascending: true });
    if (items && items.length > 0) {
      const rows = items.map((it) => ({
        section_id: newSection.id,
        item_no: it.item_no,
        text: it.text,
        expected_value: it.expected_value,
        is_critical: it.is_critical,
        display_order: it.display_order,
      }));
      const { error: itemErr } = await supabase.from("checklist_items").insert(rows);
      if (itemErr) {
        await supabase.from("checklist_templates").delete().eq("id", newTpl.id);
        return fail(`Failed cloning items for section ${s.section_no}: ${itemErr.message}`);
      }
    }
  }

  revalidatePath("/admin/checklists");
  return { ...ok(), id: newTpl.id };
}

/* -------------------- section -------------------- */

export async function createChecklistSection(
  template_id: number,
  section_no: string,
  title: string
): Promise<Result<{ id?: number }>> {
  const denied = await adminOrError();
  if (denied) return fail(denied);
  if (!section_no.trim()) return fail("Section # required");
  if (!title.trim()) return fail("Section title required");

  const supabase = createServiceClient();
  const { data: max } = await supabase
    .from("checklist_sections")
    .select("display_order")
    .eq("template_id", template_id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (max?.display_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("checklist_sections")
    .insert({
      template_id,
      section_no: section_no.trim(),
      title: title.trim(),
      display_order: nextOrder,
    })
    .select("id")
    .single();
  if (error) return fail(error.message);

  revalidatePath(`/admin/checklists/${template_id}`);
  return { ...ok(), id: data.id };
}

export async function updateChecklistSection(
  id: number,
  patch: { section_no?: string; title?: string }
): Promise<Result> {
  const denied = await adminOrError();
  if (denied) return fail(denied);

  const updates: Record<string, unknown> = {};
  if (patch.section_no !== undefined) {
    if (!patch.section_no.trim()) return fail("Section # cannot be blank");
    updates.section_no = patch.section_no.trim();
  }
  if (patch.title !== undefined) {
    if (!patch.title.trim()) return fail("Title cannot be blank");
    updates.title = patch.title.trim();
  }

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("checklist_sections")
    .select("template_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("checklist_sections").update(updates).eq("id", id);
  if (error) return fail(error.message);

  if (existing) revalidatePath(`/admin/checklists/${existing.template_id}`);
  return ok();
}

export async function deleteChecklistSection(id: number): Promise<Result> {
  const denied = await adminOrError();
  if (denied) return fail(denied);

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("checklist_sections")
    .select("template_id")
    .eq("id", id)
    .maybeSingle();

  // cascade deletes items via FK
  const { error } = await supabase.from("checklist_sections").delete().eq("id", id);
  if (error) return fail(error.message);

  if (existing) revalidatePath(`/admin/checklists/${existing.template_id}`);
  return ok();
}

export async function moveChecklistSection(
  id: number,
  direction: "up" | "down"
): Promise<Result> {
  const denied = await adminOrError();
  if (denied) return fail(denied);
  return swapDisplayOrder("checklist_sections", id, direction, "template_id");
}

/* -------------------- item -------------------- */

export interface NewItemInput {
  section_id: number;
  item_no: string;
  text: string;
  expected_value?: string | null;
  is_critical?: boolean;
}

export async function createChecklistItem(input: NewItemInput): Promise<Result<{ id?: number }>> {
  const denied = await adminOrError();
  if (denied) return fail(denied);
  if (!input.item_no.trim()) return fail("Item # required");
  if (!input.text.trim()) return fail("Item text required");

  const supabase = createServiceClient();
  const { data: max } = await supabase
    .from("checklist_items")
    .select("display_order")
    .eq("section_id", input.section_id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (max?.display_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("checklist_items")
    .insert({
      section_id: input.section_id,
      item_no: input.item_no.trim(),
      text: input.text.trim(),
      expected_value: input.expected_value?.trim() || null,
      is_critical: input.is_critical ?? false,
      display_order: nextOrder,
    })
    .select("id")
    .single();
  if (error) return fail(error.message);

  await revalidateTemplateForSection(input.section_id);
  return { ...ok(), id: data.id };
}

export async function updateChecklistItem(
  id: number,
  patch: {
    item_no?: string;
    text?: string;
    expected_value?: string | null;
    is_critical?: boolean;
  }
): Promise<Result> {
  const denied = await adminOrError();
  if (denied) return fail(denied);

  const updates: Record<string, unknown> = {};
  if (patch.item_no !== undefined) {
    if (!patch.item_no.trim()) return fail("Item # cannot be blank");
    updates.item_no = patch.item_no.trim();
  }
  if (patch.text !== undefined) {
    if (!patch.text.trim()) return fail("Item text cannot be blank");
    updates.text = patch.text.trim();
  }
  if (patch.expected_value !== undefined)
    updates.expected_value = patch.expected_value?.trim() || null;
  if (patch.is_critical !== undefined) updates.is_critical = patch.is_critical;

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("checklist_items")
    .select("section_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("checklist_items").update(updates).eq("id", id);
  if (error) return fail(error.message);

  if (existing) await revalidateTemplateForSection(existing.section_id);
  return ok();
}

export async function deleteChecklistItem(id: number): Promise<Result> {
  const denied = await adminOrError();
  if (denied) return fail(denied);

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("checklist_items")
    .select("section_id")
    .eq("id", id)
    .maybeSingle();

  const { count } = await supabase
    .from("case_checklist_item_results")
    .select("id", { count: "exact", head: true })
    .eq("item_id", id);
  if (count && count > 0) {
    return fail(
      `Cannot delete — ${count} engineer result${count === 1 ? "" : "s"} reference this item.`
    );
  }

  const { error } = await supabase.from("checklist_items").delete().eq("id", id);
  if (error) return fail(error.message);

  if (existing) await revalidateTemplateForSection(existing.section_id);
  return ok();
}

export async function moveChecklistItem(
  id: number,
  direction: "up" | "down"
): Promise<Result> {
  const denied = await adminOrError();
  if (denied) return fail(denied);
  return swapDisplayOrder("checklist_items", id, direction, "section_id");
}

export async function bulkAddItems(
  section_id: number,
  startNo: string,
  pasted: string
): Promise<Result<{ added?: number }>> {
  const denied = await adminOrError();
  if (denied) return fail(denied);
  const lines = pasted
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return fail("Nothing to add");

  const supabase = createServiceClient();
  const { data: max } = await supabase
    .from("checklist_items")
    .select("display_order")
    .eq("section_id", section_id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  let nextOrder = (max?.display_order ?? 0) + 1;

  // startNo like "1.1" → split into prefix + suffix, increment last segment
  const m = startNo.match(/^(.*?)(\d+)$/);
  let prefix = "";
  let counter = 1;
  if (m) {
    prefix = m[1];
    counter = parseInt(m[2], 10) || 1;
  } else {
    prefix = startNo + ".";
  }

  const rows = lines.map((text) => ({
    section_id,
    item_no: `${prefix}${counter++}`,
    text,
    expected_value: null,
    is_critical: false,
    display_order: nextOrder++,
  }));

  const { error } = await supabase.from("checklist_items").insert(rows);
  if (error) return fail(error.message);

  await revalidateTemplateForSection(section_id);
  return { ...ok(), added: rows.length };
}

/* -------------------- helpers -------------------- */

async function swapDisplayOrder(
  table: "checklist_sections" | "checklist_items",
  id: number,
  direction: "up" | "down",
  parentKey: "template_id" | "section_id"
): Promise<Result> {
  const supabase = createServiceClient();
  const { data: row } = await supabase
    .from(table)
    .select(`id, display_order, ${parentKey}`)
    .eq("id", id)
    .maybeSingle();
  if (!row) return fail("Row not found");

  const parentId = (row as Record<string, unknown>)[parentKey] as number;
  const currentOrder = (row as { display_order: number }).display_order;

  const op = direction === "up" ? "lt" : "gt";
  const sortOrder = direction === "up";
  const { data: neighbour } = await supabase
    .from(table)
    .select("id, display_order")
    .eq(parentKey, parentId)
    [op]("display_order", currentOrder)
    .order("display_order", { ascending: !sortOrder })
    .limit(1)
    .maybeSingle();
  if (!neighbour) return ok();

  // swap orders
  await supabase
    .from(table)
    .update({ display_order: neighbour.display_order })
    .eq("id", id);
  await supabase
    .from(table)
    .update({ display_order: currentOrder })
    .eq("id", neighbour.id);

  if (table === "checklist_sections") {
    revalidatePath(`/admin/checklists/${parentId}`);
  } else {
    await revalidateTemplateForSection(parentId);
  }
  return ok();
}

async function revalidateTemplateForSection(section_id: number): Promise<void> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("checklist_sections")
    .select("template_id")
    .eq("id", section_id)
    .maybeSingle();
  if (data?.template_id) revalidatePath(`/admin/checklists/${data.template_id}`);
}
