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

    // case_machines junction (machines guaranteed non-empty by guard above)
    if (machines.length > 0) {
      const machineRows = machines.map((m) => ({
        so_number: input.so_number,
        machine_no: m,
        is_primary: m === primaryMachine,
      }));
      const { error: cmError } = await supabase.from("case_machines").insert(machineRows);
      if (cmError) {
        // Case row already inserted — roll it back so the engineer can fix the
        // problem (most likely cause: one of the machine_nos isn't in the
        // machines table, FK violation). Without this they'd see a case with
        // no machines attached and no error message.
        await supabase.from("cases").delete().eq("so_number", input.so_number);
        return {
          success: false,
          error: `Could not attach machines: ${cmError.message}. Make sure all selected machines exist in the Machines table.`,
        };
      }
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

export interface ParseTitleResult {
  so_number?: string;
  project_code?: string;
  project_code_source?: "db" | "pattern";
  /** All machine codes detected — DB-confirmed first, then unknown candidates. */
  machine_codes: string[];
  /** Subset of machine_codes that match an existing machines row. */
  machine_codes_db: string[];
  subject?: string;
  unmatched_codes: string[];
}

/**
 * Smart title parser — uses regex + DB lookup
 * Parses D365 case titles like:
 *   "SO2604-05 - ESRY13 MCSF15 - Line#15 - Installation and Training…"
 * Detects all machine codes (not just the first), and falls back to
 * project-style markers (Line#NN / Group N / MCE#N) when no DB project
 * code is known.
 */
export async function parseTitleSmart(title: string): Promise<ParseTitleResult> {
  if (!title || !title.trim()) {
    return { machine_codes: [], machine_codes_db: [], unmatched_codes: [] };
  }

  const supabase = createServiceClient();
  const text = title.trim();

  // 1. Extract SO number
  const soMatch = text.match(/\bSO\d{4}-\d{1,3}\b/i);
  const so_number = soMatch ? soMatch[0].toUpperCase() : undefined;

  // 2. Project-style codes (format markers, not machines)
  const PROJECT_PATTERNS = [/\bLine#\d+\b/gi, /\bGroup\s+\d+\b/gi, /\bMCE#\d+\b/gi];
  const MACHINE_PATTERNS = [
    /\bAR\d+SV\d+\b/g,
    /\b[A-Z]{2,7}\d{2,3}\b/g, // ESRY13, ROTH99, MITSF27, MCSF15, MCSF13
    /\b(?:RE|MCVP|SPF|SPV|PE|DLM|TLS|MTVP|MCV)\d+(?:-\d+)?\b/gi,
  ];

  const projectSet = new Set<string>();
  const machineSet = new Set<string>();
  for (const p of PROJECT_PATTERNS) {
    for (const m of text.match(p) ?? []) projectSet.add(m);
  }
  for (const p of MACHINE_PATTERNS) {
    for (const m of text.match(p) ?? []) machineSet.add(m);
  }

  const noise = (c: string) =>
    /^\d{10,}$/.test(c) ||
    /^E?LN\d{2}-\d{4}-\d+$/i.test(c) ||
    /^CS\d{4,}$/i.test(c) ||
    /^SQ\d/i.test(c) ||
    (so_number !== undefined && c.toUpperCase() === so_number.toUpperCase());

  const machineCandidates = Array.from(machineSet).filter((c) => !noise(c));
  const projectCandidates = Array.from(projectSet).filter((c) => !noise(c));

  // 3. DB lookup
  let project_code: string | undefined;
  let project_code_source: "db" | "pattern" | undefined;
  const dbMachines = new Set<string>();
  const unknownMachines: string[] = [];

  if (machineCandidates.length > 0) {
    const { data: machinesData } = await supabase
      .from("machines")
      .select("machine_no")
      .in("machine_no", machineCandidates);
    const knownMachineSet = new Set(
      ((machinesData ?? []) as { machine_no: string }[]).map((m) => m.machine_no)
    );

    // Some machine-shaped tokens may actually be project codes
    const { data: projectFromCases } = await supabase
      .from("cases")
      .select("project_code")
      .in("project_code", machineCandidates)
      .not("project_code", "is", null);
    const knownProjectSet = new Set(
      ((projectFromCases ?? []) as { project_code: string }[])
        .map((p) => p.project_code)
        .filter(Boolean)
    );

    for (const c of machineCandidates) {
      if (knownMachineSet.has(c)) {
        dbMachines.add(c);
      } else if (knownProjectSet.has(c) && !project_code) {
        project_code = c;
        project_code_source = "db";
      } else {
        unknownMachines.push(c);
      }
    }
  }

  // 4. Project pattern fallback: Line#NN / Group N / MCE#N
  if (!project_code && projectCandidates.length > 0) {
    project_code = projectCandidates[0];
    project_code_source = "pattern";
  }

  const machine_codes = [...Array.from(dbMachines), ...unknownMachines];

  // 5. Build subject by stripping all known tokens + noise
  let subject = text;
  if (so_number) subject = subject.replace(new RegExp(escapeRegex(so_number), "i"), "");
  for (const c of [...machineCandidates, ...projectCandidates]) {
    subject = subject.replace(new RegExp("\\b" + escapeRegex(c) + "\\b", "gi"), "");
  }
  subject = subject.replace(/\bCS\d{4,}\b/gi, "");
  subject = subject.replace(/\bE?LN\d{2}-\d{4}-\d+\b/gi, "");
  subject = subject.replace(/\(SQ\d{4}-\d{1,3}(?:\s+SQ\d{4}-\d{1,3})*\)/gi, "");
  subject = subject.replace(/\b\d{10,}\b/g, "");
  subject = subject.replace(/\s*-\s*-\s*/g, " - ");
  subject = subject.replace(/^[\s\-,]+|[\s\-,]+$/g, "");
  subject = subject.replace(/\s+/g, " ").trim();
  subject = subject.replace(/\s+-\s+\d+\s*$/g, "").trim();
  subject = subject.replace(/^[\s\-,]+|[\s\-,]+$/g, "").trim();

  return {
    so_number,
    project_code,
    project_code_source,
    machine_codes,
    machine_codes_db: Array.from(dbMachines),
    subject: subject.length > 0 ? subject : undefined,
    unmatched_codes: unknownMachines,
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
