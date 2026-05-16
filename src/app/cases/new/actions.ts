"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export interface NewCaseInput {
  so_number: string;
  customer_code: string;
  // Optional fields below
  sr_number?: string;
  machine_nos?: string[];
  primary_machine_no?: string;
  project_code?: string;
  service_type_code?: string;
  title?: string;
  description?: string;
  due_date?: string;
  lead_engineer?: string;
  other_engineers?: string[];
}

const SERVICE_TYPE_NAMES: Record<string, string> = {
  "7505": "Curative maintenance",
  "7504": "Installation",
  "7515": "Curative maintenance under Warranty",
  "7508": "Upgrade installation",
  "7507": "Preventive Maintenance",
  "7512": "Service Agreement",
  "7235": "Service Promotion",
  "7506": "Customer Training",
  "7506-1": "Internal Training",
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

    const machines = input.machine_nos ?? [];
    const primaryMachine = input.primary_machine_no || machines[0] || null;
    const serviceTypeCode = input.service_type_code || "7505";

    const { error: caseError } = await supabase.from("cases").insert({
      so_number: input.so_number.trim(),
      sr_number: input.sr_number?.trim() || null,
      title: input.title?.trim() || null,
      description: input.description?.trim() || null,
      service_type_code: serviceTypeCode,
      service_type_name: SERVICE_TYPE_NAMES[serviceTypeCode] || serviceTypeCode,
      customer_code: customer.code,
      customer_name: customer.name,
      contact_name: customer.contact_name,
      machine_no: primaryMachine,
      project_code: input.project_code?.trim() || null,
      due_date: input.due_date || null,
      status: "planned",
      source: "aroet",
    });
    if (caseError) return { success: false, error: `Case insert failed: ${caseError.message}` };

    // case_machines junction (only if machines provided)
    if (machines.length > 0) {
      const machineRows = machines.map((m) => ({
        so_number: input.so_number,
        machine_no: m,
        is_primary: m === primaryMachine,
      }));
      const { error: cmError } = await supabase.from("case_machines").insert(machineRows);
      if (cmError) console.error("[createCase] case_machines:", cmError.message);
    }

    // case_engineers (only if lead provided)
    if (input.lead_engineer) {
      const engineerRows: any[] = [
        { so_number: input.so_number, engineer_code: input.lead_engineer, is_lead: true },
      ];
      for (const code of input.other_engineers || []) {
        if (code === input.lead_engineer) continue;
        engineerRows.push({ so_number: input.so_number, engineer_code: code, is_lead: false });
      }
      const { error: ceError } = await supabase.from("case_engineers").insert(engineerRows);
      if (ceError) console.error("[createCase] case_engineers:", ceError.message);
    }

    revalidatePath("/cases");
    revalidatePath("/");
    return { success: true, so_number: input.so_number };
  } catch (e: any) {
    return { success: false, error: e.message || "Unknown error" };
  }
}

/**
 * Smart title parser — uses regex + DB lookup
 * Parses D365 case titles like:
 *   "SO2604-05 - ESRY13 - Line#15 - Installation and Training Automapper..."
 * Returns:
 *   so_number, project_code, machine_code, subject, unmatched_codes (hints)
 */
export async function parseTitleSmart(title: string): Promise<{
  so_number?: string;
  project_code?: string;
  machine_code?: string;
  subject?: string;
  unmatched_codes: string[];
}> {
  if (!title || !title.trim()) {
    return { unmatched_codes: [] };
  }

  const supabase = createServiceClient();
  const text = title.trim();

  // 1. Extract SO number
  const soMatch = text.match(/\bSO\d{4}-\d{1,3}\b/i);
  const so_number = soMatch ? soMatch[0].toUpperCase() : undefined;

  // 2. Extract all candidate codes
  // Patterns: uppercase+digits, Line#N, Group N, MCE#N, AR-style serial
  const codePatterns = [
    /\bLine#\d+\b/gi,
    /\bGroup\s+\d+\b/gi,
    /\bMCE#\d+\b/gi,
    /\bAR\d+SV\d+\b/g,
    /\b[A-Z]{3,7}\d{2,3}\b/g, // ESRY13, ROTH99, MITSF27, ESTH48
    /\b(?:RE|MCVP|SPF|SPV|PE|DLM|TLS|MTVP|MCV)\d+(?:-\d+)?\b/gi,
  ];

  const candidatesSet = new Set<string>();
  for (const p of codePatterns) {
    const matches = text.match(p) ?? [];
    for (const m of matches) {
      candidatesSet.add(m);
    }
  }

  // 3. Filter out noise
  const candidates: string[] = [];
  for (const c of Array.from(candidatesSet)) {
    // Skip if matches SO
    if (so_number && c.toUpperCase() === so_number.toUpperCase()) continue;
    // Skip 10+ digit POs
    if (/^\d{10,}$/.test(c)) continue;
    // Skip PO formats
    if (/^E?LN\d{2}-\d{4}-\d+$/i.test(c)) continue;
    // Skip CS prefix
    if (/^CS\d{4,}$/i.test(c)) continue;
    // Skip SQ
    if (/^SQ\d/i.test(c)) continue;
    candidates.push(c);
  }

  // 4. DB lookup — find which candidates match machines vs projects
  let machine_code: string | undefined;
  let project_code: string | undefined;
  const matched_codes: string[] = [];

  if (candidates.length > 0) {
    // Query machines
    const { data: machinesData } = await supabase
      .from("machines")
      .select("machine_no")
      .in("machine_no", candidates);
    const machineSet = new Set((machinesData ?? []).map((m: any) => m.machine_no));

    // Query projects from cases table
    const { data: projectsData } = await supabase
      .from("cases")
      .select("project_code")
      .in("project_code", candidates)
      .not("project_code", "is", null);
    const projectSet = new Set(
      (projectsData ?? []).map((p: any) => p.project_code).filter(Boolean)
    );

    // Match
    for (const c of candidates) {
      if (machineSet.has(c) && !machine_code) {
        machine_code = c;
        matched_codes.push(c);
      } else if (projectSet.has(c) && !project_code) {
        project_code = c;
        matched_codes.push(c);
      }
    }
  }

  // 5. Build subject by stripping all known tokens + noise
  let subject = text;
  if (so_number) subject = subject.replace(new RegExp(escapeRegex(so_number), "i"), "");
  for (const c of candidates) {
    subject = subject.replace(new RegExp("\\b" + escapeRegex(c) + "\\b", "gi"), "");
  }
  // Strip noise patterns
  subject = subject.replace(/\bCS\d{4,}\b/gi, "");
  subject = subject.replace(/\bE?LN\d{2}-\d{4}-\d+\b/gi, "");
  subject = subject.replace(/\(SQ\d{4}-\d{1,3}(?:\s+SQ\d{4}-\d{1,3})*\)/gi, "");
  subject = subject.replace(/\b\d{10,}\b/g, "");
  subject = subject.replace(/\s*-\s*-\s*/g, " - ");
  subject = subject.replace(/^[\s\-,]+|[\s\-,]+$/g, "");
  subject = subject.replace(/\s+/g, " ").trim();

  // Final cleanup: standalone "- 0" leftovers
  subject = subject.replace(/\s+-\s+\d+\s*$/g, "").trim();
  subject = subject.replace(/^[\s\-,]+|[\s\-,]+$/g, "").trim();

  // Unmatched candidates (hints for user)
  const unmatched_codes = candidates.filter((c) => !matched_codes.includes(c));

  return {
    so_number,
    project_code,
    machine_code,
    subject: subject.length > 0 ? subject : undefined,
    unmatched_codes,
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
