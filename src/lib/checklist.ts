export type TemplateKey = { machine_type: string; version: string | null };

export function machineTypeFor(productCode: string | null | undefined): TemplateKey | null {
  if (!productCode) return null;
  const code = productCode.toUpperCase();
  if (code.startsWith("DLM")) return { machine_type: "DLM", version: null };
  if (code.startsWith("MCVP4")) return { machine_type: "MCVP4", version: null };
  if (code.startsWith("MCVP8")) {
    if (code.includes("V2")) return { machine_type: "MCVP8", version: "V2" };
    return { machine_type: "MCVP8", version: "V1" };
  }
  if (code.startsWith("SPV2")) return { machine_type: "SPV2", version: null };
  if (code.startsWith("SPV3")) return { machine_type: "SPV3", version: null };
  return null;
}

export function eligibleForChecklist(serviceTypeCode: string | null | undefined): boolean {
  // PM only for Phase 3 — installation/upgrade/curative get the placeholder
  return serviceTypeCode === "7507";
}

export type ItemStatus = "pass" | "fail" | "na";
