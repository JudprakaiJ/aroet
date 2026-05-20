"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { currentUser, isApprover } from "@/lib/auth/current-user";

async function adminOrError(): Promise<string | null> {
  const me = await currentUser();
  if (!me || !isApprover(me.role)) return "Admin role required";
  return null;
}

export interface MachineInput {
  machine_no: string;
  customer_code: string;
  name?: string;
  product_code?: string;
  serial_no?: string;
  warranty_expiry?: string;
  installation_date?: string;
  notes?: string;
}

export async function createMachine(
  input: MachineInput
): Promise<{ success: boolean; machine_no?: string; error?: string }> {
  const denied = await adminOrError();
  if (denied) return { success: false, error: denied };
  const supabase = createServiceClient();

  if (!input.machine_no?.trim()) return { success: false, error: "Machine number required" };
  if (!input.customer_code?.trim()) return { success: false, error: "Customer required" };

  const { data: dup } = await supabase
    .from("machines")
    .select("machine_no")
    .eq("machine_no", input.machine_no.trim())
    .maybeSingle();
  if (dup) return { success: false, error: `Machine "${input.machine_no}" already exists` };

  const { data: cust } = await supabase
    .from("customers")
    .select("name")
    .eq("code", input.customer_code)
    .single();

  const { error } = await supabase.from("machines").insert({
    machine_no: input.machine_no.trim(),
    customer_code: input.customer_code,
    customer_name: cust?.name || null,
    name: input.name?.trim() || null,
    product_code: input.product_code?.trim() || null,
    serial_no: input.serial_no?.trim() || null,
    warranty_expiry: input.warranty_expiry || null,
    installation_date: input.installation_date || null,
    notes: input.notes?.trim() || null,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/machines");
  revalidatePath("/cases/new");
  return { success: true, machine_no: input.machine_no };
}

export async function updateMachine(
  machineNo: string,
  input: Partial<MachineInput>
): Promise<{ success: boolean; error?: string }> {
  const denied = await adminOrError();
  if (denied) return { success: false, error: denied };
  const supabase = createServiceClient();
  const updates: any = {};

  if (input.name !== undefined) updates.name = input.name?.trim() || null;
  if (input.product_code !== undefined) updates.product_code = input.product_code?.trim() || null;
  if (input.serial_no !== undefined) updates.serial_no = input.serial_no?.trim() || null;
  if (input.warranty_expiry !== undefined) updates.warranty_expiry = input.warranty_expiry || null;
  if (input.installation_date !== undefined) updates.installation_date = input.installation_date || null;
  if (input.notes !== undefined) updates.notes = input.notes?.trim() || null;

  if (input.customer_code) {
    updates.customer_code = input.customer_code;
    const { data: cust } = await supabase
      .from("customers")
      .select("name")
      .eq("code", input.customer_code)
      .single();
    updates.customer_name = cust?.name || null;
  }

  const { error } = await supabase.from("machines").update(updates).eq("machine_no", machineNo);
  if (error) return { success: false, error: error.message };

  revalidatePath("/machines");
  revalidatePath(`/machines/${machineNo}`);
  return { success: true };
}

export async function deleteMachine(
  machineNo: string
): Promise<{ success: boolean; error?: string }> {
  const denied = await adminOrError();
  if (denied) return { success: false, error: denied };
  const supabase = createServiceClient();

  // Check if machine is referenced
  const { count } = await supabase
    .from("case_machines")
    .select("*", { count: "exact", head: true })
    .eq("machine_no", machineNo);

  if (count && count > 0) {
    return {
      success: false,
      error: `Cannot delete — ${count} cases reference this machine. Detach from cases first.`,
    };
  }

  const { count: caseCount } = await supabase
    .from("cases")
    .select("*", { count: "exact", head: true })
    .eq("machine_no", machineNo);

  if (caseCount && caseCount > 0) {
    return {
      success: false,
      error: `Cannot delete — ${caseCount} cases reference this machine.`,
    };
  }

  const { error } = await supabase.from("machines").delete().eq("machine_no", machineNo);
  if (error) return { success: false, error: error.message };

  revalidatePath("/machines");
  return { success: true };
}
