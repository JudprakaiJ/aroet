"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import type { ItemStatus } from "@/lib/checklist";

const ME = "JKH";

export async function ensureCaseChecklist(
  so_number: string,
  machine_no: string | null,
  template_id: number
): Promise<{ success: boolean; case_checklist_id?: number; error?: string }> {
  const supabase = createServiceClient();

  // Lookup by (so_number, machine_no) — one checklist per case+machine.
  let q = supabase
    .from("case_checklists")
    .select("id")
    .eq("so_number", so_number);
  q = machine_no === null ? q.is("machine_no", null) : q.eq("machine_no", machine_no);
  const { data: existing } = await q.maybeSingle();

  if (existing) return { success: true, case_checklist_id: existing.id };

  const { data, error } = await supabase
    .from("case_checklists")
    .insert({
      so_number,
      machine_no,
      template_id,
      performed_by: ME,
      performed_at: new Date().toISOString().slice(0, 10),
      status: "in_progress",
    })
    .select("id")
    .single();

  if (error || !data) return { success: false, error: error?.message ?? "Insert failed" };
  revalidatePath(`/cases/${so_number}`);
  return { success: true, case_checklist_id: data.id };
}

export async function toggleChecklistItem(
  so_number: string,
  case_checklist_id: number,
  item_id: number,
  status: ItemStatus | null,
  remark?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  if (status === null) {
    const { error } = await supabase
      .from("case_checklist_item_results")
      .delete()
      .eq("case_checklist_id", case_checklist_id)
      .eq("item_id", item_id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("case_checklist_item_results")
      .upsert(
        {
          case_checklist_id,
          item_id,
          status,
          remark: remark?.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "case_checklist_id,item_id" }
      );
    if (error) return { success: false, error: error.message };
  }

  revalidatePath(`/cases/${so_number}`);
  return { success: true };
}

export async function completeCaseChecklist(
  so_number: string,
  case_checklist_id: number,
  general_remark?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("case_checklists")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      general_remark: general_remark?.trim() || null,
    })
    .eq("id", case_checklist_id);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/cases/${so_number}`);
  return { success: true };
}
