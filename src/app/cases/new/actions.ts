"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { parsePlannerNote } from "@/lib/planner/parser";
import { revalidatePath } from "next/cache";

export interface NewCaseInput {
  so_number: string;
  sr_number: string;
  customer_code: string;
  machine_nos: string[];
  primary_machine_no?: string;
  project_code: string;
  service_type_code: string;
  description: string;
  due_date?: string;
  lead_engineer: string;
  other_engineers: string[];
  planner_note?: string;
  auto_parse_sessions?: boolean;
}

const SERVICE_TYPE_NAMES: Record<string, string> = {
  "7505": "Curative maintenance",
  "7507": "Preventive Maintenance",
  "7515": "Curative under warranty",
  "7504": "Installation",
  "7508": "Service Agreement",
  "7510": "Installation",
  "7512": "Service Agreement",
  "7235": "Voucher",
  "7506": "Upgrade installation",
  "7520": "Upgrade",
  "7525": "Training",
};

/**
 * Suggest project codes based on machine + customer.
 * Returns top 3-5 candidates sorted by confidence.
 */
export async function suggestProjectCode(
  machineNos: string[],
  customerCode?: string
): Promise<{ project_code: string; confidence: number; reason: string }[]> {
  const supabase = createServiceClient();

  const { data: mappings } = await supabase
    .from("project_mapping")
    .select("machine_prefix, customer_pattern, project_code, confidence, notes")
    .order("confidence", { ascending: false });

  if (!mappings || mappings.length === 0) return [];

  let customerName = "";
  if (customerCode) {
    const { data: cust } = await supabase
      .from("customers")
      .select("name")
      .eq("code", customerCode)
      .single();
    customerName = (cust?.name || "").toUpperCase();
  }

  const machinePrefixes = machineNos.map((m) => {
    const match = m.match(/^([A-Za-z]+\d{0,2}[A-Za-z]+|[A-Za-z]+)/);
    return match ? match[1].toUpperCase() : "";
  });

  const scored = new Map<string, { confidence: number; reasons: string[] }>();

  for (const m of mappings) {
    const prefix = (m.machine_prefix || "").toUpperCase();
    const customerPattern = (m.customer_pattern || "").toUpperCase();

    let score = 0;
    const reasons: string[] = [];

    if (prefix && machinePrefixes.some((p) => p.startsWith(prefix) || prefix.startsWith(p))) {
      score += m.confidence;
      reasons.push(`machine prefix ${prefix}`);
    }

    if (customerPattern && customerName.includes(customerPattern)) {
      score += m.confidence * 0.7;
      reasons.push(`customer "${customerPattern}"`);
    }

    if (score === 0) continue;

    const existing = scored.get(m.project_code);
    if (!existing || existing.confidence < score) {
      scored.set(m.project_code, { confidence: Math.round(score), reasons });
    }
  }

  return Array.from(scored.entries())
    .map(([project_code, { confidence, reasons }]) => ({
      project_code,
      confidence,
      reason: reasons.join(" + "),
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}

export async function createCustomerInline(input: {
  code: string;
  name: string;
  city?: string;
  country?: string;
}): Promise<{ success: boolean; code?: string; error?: string }> {
  const supabase = createServiceClient();

  let code = input.code.trim();
  if (!code) {
    code = input.name.trim().replace(/[^A-Z]/gi, "").substring(0, 4).toUpperCase() + "01";
  }

  const { error } = await supabase.from("customers").insert({
    code,
    name: input.name.trim(),
    city: input.city?.trim() || null,
    country: input.country?.trim() || null,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/cases/new");
  return { success: true, code };
}

export async function createMachineInline(input: {
  machine_no: string;
  customer_code: string;
  name?: string;
  product_code?: string;
  serial_no?: string;
  version?: string;
}): Promise<{ success: boolean; machine_no?: string; error?: string }> {
  const supabase = createServiceClient();

  const { error } = await supabase.from("machines").insert({
    machine_no: input.machine_no.trim(),
    customer_code: input.customer_code,
    name: input.name?.trim() || null,
    product_code: input.product_code?.trim() || null,
    serial_no: input.serial_no?.trim() || null,
    version: input.version?.trim() || null,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/cases/new");
  return { success: true, machine_no: input.machine_no };
}

export async function createCase(input: NewCaseInput): Promise<{ success: boolean; so_number?: string; error?: string }> {
  const supabase = createServiceClient();

  try {
    if (!input.so_number?.trim()) return { success: false, error: "SO number required" };
    if (!input.sr_number?.trim()) return { success: false, error: "SR number required" };
    if (!input.customer_code?.trim()) return { success: false, error: "Customer required" };
    if (!input.machine_nos || input.machine_nos.length === 0)
      return { success: false, error: "At least 1 machine required" };
    if (!input.service_type_code) return { success: false, error: "Service type required" };
    if (!input.description?.trim()) return { success: false, error: "Description required" };
    if (!input.lead_engineer) return { success: false, error: "Lead engineer required" };

    const { data: existing } = await supabase
      .from("cases")
      .select("so_number")
      .eq("so_number", input.so_number)
      .maybeSingle();
    if (existing) return { success: false, error: `SO ${input.so_number} already exists` };

    const { data: customer } = await supabase
      .from("customers")
      .select("name, code, contact_name, contact_mobile")
      .eq("code", input.customer_code)
      .single();
    if (!customer) return { success: false, error: "Customer not found" };

    const primaryMachine = input.primary_machine_no || input.machine_nos[0];

    const machinesStr =
      input.machine_nos.slice(0, 3).join(", ") + (input.machine_nos.length > 3 ? "..." : "");
    const titleParts = [input.project_code, machinesStr, input.description.split("\n")[0].substring(0, 100)].filter(Boolean);
    const title = titleParts.join(" - ");

    const { error: caseError } = await supabase.from("cases").insert({
      so_number: input.so_number.trim(),
      sr_number: input.sr_number.trim(),
      title,
      description: input.description.trim(),
      service_type_code: input.service_type_code,
      service_type_name: SERVICE_TYPE_NAMES[input.service_type_code] || input.service_type_code,
      customer_code: customer.code,
      customer_name: customer.name,
      contact_name: customer.contact_name,
      machine_no: primaryMachine,
      project_code: input.project_code.trim() || null,
      due_date: input.due_date || null,
      status: "planned",
      source: "aroet",
      planner_note: input.planner_note?.trim() || null,
    });
    if (caseError) return { success: false, error: `Case insert failed: ${caseError.message}` };

    // case_machines junction
    const machineRows = input.machine_nos.map((m) => ({
      so_number: input.so_number,
      machine_no: m,
      is_primary: m === primaryMachine,
    }));
    const { error: cmError } = await supabase.from("case_machines").insert(machineRows);
    if (cmError) console.error("[createCase] case_machines:", cmError.message);

    // case_engineers (lead + others)
    const engineerRows: any[] = [
      { so_number: input.so_number, engineer_code: input.lead_engineer, is_lead: true },
    ];
    for (const code of input.other_engineers || []) {
      if (code === input.lead_engineer) continue;
      engineerRows.push({ so_number: input.so_number, engineer_code: code, is_lead: false });
    }
    if (engineerRows.length > 0) {
      const { error: ceError } = await supabase.from("case_engineers").insert(engineerRows);
      if (ceError) console.error("[createCase] case_engineers:", ceError.message);
    }

    // Optional parse planner_note
    if (input.auto_parse_sessions && input.planner_note) {
      try {
        const parsed = parsePlannerNote(input.planner_note);
        if (parsed.sessions.length > 0) {
          const sessionRows = parsed.sessions.map((s) => ({
            ...s,
            so_number: input.so_number,
            machine_no: primaryMachine,
            source: "planner",
            approval_status: "draft",
          }));
          await supabase.from("sessions").insert(sessionRows);
        }
      } catch (e: any) {
        console.error("[createCase] parser error:", e.message);
      }
    }

    revalidatePath("/cases");
    revalidatePath("/");
    return { success: true, so_number: input.so_number };
  } catch (e: any) {
    return { success: false, error: e.message || "Unknown error" };
  }
}
