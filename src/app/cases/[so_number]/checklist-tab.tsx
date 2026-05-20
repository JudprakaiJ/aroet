import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { CodeBadge } from "@/components/primitives/code-badge";
import {
  eligibleForChecklist,
  machineTypeFor,
  type ItemStatus,
  type TemplateKey,
} from "@/lib/checklist";
import { ensureCaseChecklist } from "./checklist-actions";
import { ChecklistItemRow } from "./checklist-item-row";
import type { CaseDetail } from "./queries";

type SectionRow = {
  id: number;
  template_id: number;
  section_no: string;
  title: string;
  display_order: number;
};

type ItemRow = {
  id: number;
  section_id: number;
  item_no: string;
  text: string;
  expected_value: string | null;
  is_critical: boolean;
  display_order: number;
};

type ResultRow = {
  case_checklist_id: number;
  item_id: number;
  status: ItemStatus | null;
  remark: string | null;
};

type TemplateRow = {
  id: number;
  name: string;
  machine_type: string;
  version: string | null;
};

type MachineEntry = {
  machine_no: string;
  product_code: string | null;
  is_primary: boolean;
};

type ResolvedMachine = MachineEntry & {
  template: TemplateRow | null;
  templateKey: TemplateKey | null;
  caseChecklistId: number | null;
};

export async function ChecklistTab({ c }: { c: CaseDetail }) {
  if (!eligibleForChecklist(c.service_type_code)) {
    return <PlaceholderCard reason="non-PM" />;
  }
  if (c.machines.length === 0) {
    return <PlaceholderCard reason="no-machine" />;
  }

  const supabase = await createClient();
  const machineNos = c.machines.map((m) => m.machine_no);

  // Fetch product codes for all machines in one query.
  const { data: machineRows } = await supabase
    .from("machines")
    .select("machine_no, product_code")
    .in("machine_no", machineNos);

  const productByMachine = new Map<string, string | null>();
  for (const m of (machineRows ?? []) as { machine_no: string; product_code: string | null }[]) {
    productByMachine.set(m.machine_no, m.product_code);
  }

  // Resolve each case machine to a template key (skip unmapped).
  const resolved: ResolvedMachine[] = c.machines.map((m) => ({
    machine_no: m.machine_no,
    product_code: productByMachine.get(m.machine_no) ?? null,
    is_primary: m.is_primary,
    templateKey: machineTypeFor(productByMachine.get(m.machine_no) ?? null),
    template: null,
    caseChecklistId: null,
  }));

  const mappable = resolved.filter((r) => r.templateKey !== null);
  if (mappable.length === 0) {
    return <PlaceholderCard reason="unmapped" />;
  }

  // Load templates matching every required (machine_type, version) pair.
  const templateKeys = Array.from(
    new Set(mappable.map((r) => `${r.templateKey!.machine_type}|${r.templateKey!.version ?? "_"}`))
  );
  const machineTypes = Array.from(
    new Set(mappable.map((r) => r.templateKey!.machine_type))
  );
  const { data: templates } = await supabase
    .from("checklist_templates")
    .select("id, name, machine_type, version")
    .in("machine_type", machineTypes)
    .eq("is_active", true);

  const templateByKey = new Map<string, TemplateRow>();
  for (const t of (templates ?? []) as TemplateRow[]) {
    const k = `${t.machine_type}|${t.version ?? "_"}`;
    if (templateKeys.includes(k)) templateByKey.set(k, t);
  }

  // Bind template to each machine.
  for (const r of mappable) {
    const k = `${r.templateKey!.machine_type}|${r.templateKey!.version ?? "_"}`;
    r.template = templateByKey.get(k) ?? null;
  }

  const withTemplate = mappable.filter((r) => r.template !== null);
  if (withTemplate.length === 0) {
    return <PlaceholderCard reason="no-template" />;
  }

  // Ensure case_checklist row for each (case, machine).
  for (const r of withTemplate) {
    const ensured = await ensureCaseChecklist(c.so_number, r.machine_no, r.template!.id);
    if (ensured.success) r.caseChecklistId = ensured.case_checklist_id ?? null;
  }

  const checklistIds = withTemplate
    .map((r) => r.caseChecklistId)
    .filter((id): id is number => id !== null);
  const templateIds = Array.from(new Set(withTemplate.map((r) => r.template!.id)));

  // Fetch sections + items for all needed templates + results for all checklists.
  const [{ data: sections }, { data: items }, { data: results }] = await Promise.all([
    supabase
      .from("checklist_sections")
      .select("id, template_id, section_no, title, display_order")
      .in("template_id", templateIds)
      .order("display_order", { ascending: true }),
    (async () => {
      const { data: secs } = await supabase
        .from("checklist_sections")
        .select("id")
        .in("template_id", templateIds);
      const sectionIds = (secs ?? []).map((s: { id: number }) => s.id);
      if (sectionIds.length === 0) return { data: [] as ItemRow[] };
      return supabase
        .from("checklist_items")
        .select("id, section_id, item_no, text, expected_value, is_critical, display_order")
        .in("section_id", sectionIds)
        .order("display_order", { ascending: true });
    })(),
    checklistIds.length === 0
      ? Promise.resolve({ data: [] as ResultRow[] })
      : supabase
          .from("case_checklist_item_results")
          .select("case_checklist_id, item_id, status, remark")
          .in("case_checklist_id", checklistIds),
  ]);

  const secs = (sections ?? []) as SectionRow[];
  const itms = (items ?? []) as ItemRow[];
  const res = (results ?? []) as ResultRow[];

  // Index for fast per-checklist lookups.
  const resultByChecklistItem = new Map<string, { status: ItemStatus | null; remark: string | null }>();
  for (const r of res) {
    resultByChecklistItem.set(`${r.case_checklist_id}|${r.item_id}`, {
      status: r.status,
      remark: r.remark,
    });
  }

  // Overall progress across all machines
  let totalItems = 0;
  let totalDone = 0;
  for (const r of withTemplate) {
    const tmplItems = itms.filter((i) =>
      secs.some((s) => s.id === i.section_id && s.template_id === r.template!.id)
    );
    totalItems += tmplItems.length;
    if (r.caseChecklistId !== null) {
      totalDone += tmplItems.filter(
        (i) =>
          resultByChecklistItem.get(`${r.caseChecklistId}|${i.id}`)?.status === "pass"
      ).length;
    }
  }
  const overallPct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  const multiMachine = withTemplate.length > 1;
  const skippedCount = c.machines.length - withTemplate.length;

  return (
    <div style={{ padding: "0 14px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Overall progress card */}
      <div
        className="card"
        style={{
          padding: 14,
          background: "linear-gradient(180deg, var(--red-50), var(--surface))",
          borderColor: "var(--red-line)",
        }}
      >
        <div className="kicker" style={{ color: "var(--red)" }}>
          {multiMachine ? "Overall progress" : "Template"}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginTop: 4, marginBottom: 6 }}>
          {multiMachine
            ? `${withTemplate.length} machines · ${totalDone}/${totalItems} items`
            : withTemplate[0].template!.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 8, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
            <div
              style={{
                width: `${overallPct}%`,
                height: "100%",
                background: "var(--red)",
                transition: "width .25s",
              }}
            />
          </div>
          <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
            {overallPct}%
          </span>
        </div>
        {skippedCount > 0 && (
          <div
            className="sub"
            style={{
              textTransform: "none",
              letterSpacing: 0,
              fontSize: 11.5,
              marginTop: 8,
              color: "var(--ink-3)",
            }}
          >
            <Icon name="alert" size={11} /> {skippedCount} machine
            {skippedCount === 1 ? "" : "s"} skipped — product code not mapped (supported: DLM /
            MCVP4 / MCVP8-V1 / MCVP8-V2 / SPV2 / SPV3).
          </div>
        )}
      </div>

      {/* Per-machine blocks */}
      {withTemplate.map((r, idx) => {
        const tmplSecs = secs
          .filter((s) => s.template_id === r.template!.id)
          .sort((a, b) => a.display_order - b.display_order);
        const tmplItems = itms.filter((i) =>
          tmplSecs.some((s) => s.id === i.section_id)
        );
        const machineDone = tmplItems.filter(
          (i) => resultByChecklistItem.get(`${r.caseChecklistId}|${i.id}`)?.status === "pass"
        ).length;
        const sectionsForMachine = tmplSecs.map((s) => {
          const sectionItems = tmplItems.filter((i) => i.section_id === s.id);
          const done = sectionItems.filter(
            (i) => resultByChecklistItem.get(`${r.caseChecklistId}|${i.id}`)?.status === "pass"
          ).length;
          return { section: s, items: sectionItems, done };
        });

        return (
          <details
            key={r.machine_no}
            className="card"
            style={{ padding: 0, overflow: "hidden" }}
            open={!multiMachine || idx === 0}
          >
            <summary
              style={{
                padding: "12px 14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                listStyle: "none",
                borderBottom: "1px solid var(--line-2)",
                background: "var(--surface-2)",
              }}
            >
              {multiMachine && <CodeBadge>{r.machine_no}</CodeBadge>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                  {multiMachine
                    ? `${r.product_code ?? "—"} · ${r.template!.name}`
                    : r.template!.name}
                </div>
                {multiMachine && r.is_primary && (
                  <div
                    className="sub"
                    style={{
                      textTransform: "none",
                      letterSpacing: 0,
                      fontSize: 10.5,
                      color: "var(--ink-3)",
                      marginTop: 1,
                    }}
                  >
                    Primary machine
                  </div>
                )}
              </div>
              <span
                className="chip"
                style={{
                  background:
                    machineDone === tmplItems.length && tmplItems.length > 0
                      ? "var(--ok-soft)"
                      : "var(--surface)",
                  color:
                    machineDone === tmplItems.length && tmplItems.length > 0
                      ? "var(--ok)"
                      : "var(--ink-3)",
                  borderColor: "transparent",
                  fontWeight: 700,
                }}
              >
                {machineDone}/{tmplItems.length}
              </span>
            </summary>

            {sectionsForMachine.map(({ section, items, done }) => (
              <details
                key={section.id}
                style={{
                  borderBottom: "1px solid var(--line-2)",
                }}
                open
              >
                <summary
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    listStyle: "none",
                    background: "var(--surface)",
                  }}
                >
                  <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)" }}>
                    {section.section_no}
                  </span>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>
                    {section.title}
                  </span>
                  <span
                    className="chip"
                    style={{
                      background: done === items.length && items.length > 0 ? "var(--ok-soft)" : "var(--surface-2)",
                      color: done === items.length && items.length > 0 ? "var(--ok)" : "var(--ink-3)",
                      borderColor: "transparent",
                    }}
                  >
                    {done}/{items.length}
                  </span>
                </summary>
                {items.map((i) => {
                  const existing = resultByChecklistItem.get(`${r.caseChecklistId}|${i.id}`);
                  return (
                    <ChecklistItemRow
                      key={i.id}
                      so_number={c.so_number}
                      case_checklist_id={r.caseChecklistId!}
                      item_id={i.id}
                      item_no={i.item_no}
                      text={i.text}
                      isCritical={i.is_critical}
                      expectedValue={i.expected_value}
                      initialStatus={existing?.status ?? null}
                      initialRemark={existing?.remark ?? null}
                    />
                  );
                })}
              </details>
            ))}
          </details>
        );
      })}
    </div>
  );
}

function PlaceholderCard({ reason }: { reason: "non-PM" | "no-machine" | "unmapped" | "no-template" }) {
  const message =
    reason === "non-PM"
      ? "Checklist UI is currently PM-only (service type 7507)."
      : reason === "no-machine"
        ? "Add a machine to enable the PM checklist."
        : "No template for the case machines. Supported product codes: DLM / MCVP4 / MCVP8-V1 / MCVP8-V2 / SPV2 / SPV3.";
  return (
    <div className="card" style={{ margin: "0 14px 24px", padding: 24, textAlign: "center" }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "var(--surface-2)",
          color: "var(--ink-3)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <Icon name="clip-list" size={22} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
        No checklist yet
      </div>
      <div className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 12, color: "var(--ink-3)" }}>
        {message}
      </div>
    </div>
  );
}
