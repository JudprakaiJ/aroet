import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { eligibleForChecklist, machineTypeFor, type ItemStatus } from "@/lib/checklist";
import { ensureCaseChecklist } from "./checklist-actions";
import { ChecklistItemRow } from "./checklist-item-row";
import type { CaseDetail } from "./queries";

type SectionRow = {
  id: number;
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
  item_id: number;
  status: ItemStatus | null;
  remark: string | null;
};

export async function ChecklistTab({ c }: { c: CaseDetail }) {
  if (!eligibleForChecklist(c.service_type_code)) {
    return <PlaceholderCard reason="non-PM" serviceTypeCode={c.service_type_code} />;
  }
  const primary = c.machines.find((m) => m.is_primary) ?? c.machines[0];
  if (!primary) return <PlaceholderCard reason="no-machine" serviceTypeCode={c.service_type_code} />;

  const supabase = await createClient();
  const { data: machineRow } = await supabase
    .from("machines")
    .select("product_code")
    .eq("machine_no", primary.machine_no)
    .maybeSingle();

  const key = machineTypeFor(machineRow?.product_code);
  if (!key) {
    return <PlaceholderCard reason="unmapped" serviceTypeCode={c.service_type_code} productCode={machineRow?.product_code ?? null} />;
  }

  let tmpl = supabase
    .from("checklist_templates")
    .select("id, name")
    .eq("machine_type", key.machine_type)
    .eq("is_active", true);
  if (key.version === null) tmpl = tmpl.is("version", null);
  else tmpl = tmpl.eq("version", key.version);

  const { data: template } = await tmpl.maybeSingle();
  if (!template) {
    return <PlaceholderCard reason="no-template" serviceTypeCode={c.service_type_code} productCode={machineRow?.product_code ?? null} />;
  }

  // Ensure case_checklist row
  const ensured = await ensureCaseChecklist(c.so_number, primary.machine_no, template.id);
  if (!ensured.success || !ensured.case_checklist_id) {
    return <PlaceholderCard reason="init-failed" serviceTypeCode={c.service_type_code} />;
  }
  const caseChecklistId = ensured.case_checklist_id;

  const [{ data: sections }, { data: items }, { data: results }] = await Promise.all([
    supabase
      .from("checklist_sections")
      .select("id, section_no, title, display_order")
      .eq("template_id", template.id)
      .order("display_order", { ascending: true }),
    (async () => {
      const { data: secs } = await supabase
        .from("checklist_sections")
        .select("id")
        .eq("template_id", template.id);
      const sectionIds = (secs ?? []).map((s: { id: number }) => s.id);
      if (sectionIds.length === 0) return { data: [] as ItemRow[] };
      return supabase
        .from("checklist_items")
        .select("id, section_id, item_no, text, expected_value, is_critical, display_order")
        .in("section_id", sectionIds)
        .order("display_order", { ascending: true });
    })(),
    supabase
      .from("case_checklist_item_results")
      .select("item_id, status, remark")
      .eq("case_checklist_id", caseChecklistId),
  ]);

  const secs = (sections ?? []) as SectionRow[];
  const itms = (items ?? []) as ItemRow[];
  const res = ((results ?? []) as ResultRow[]).reduce((m, r) => {
    m.set(r.item_id, { status: r.status, remark: r.remark });
    return m;
  }, new Map<number, { status: ItemStatus | null; remark: string | null }>());

  const totalItems = itms.length;
  const doneItems = itms.filter((i) => res.get(i.id)?.status === "pass").length;
  const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const sectionsWithItems = secs.map((s) => {
    const own = itms.filter((i) => i.section_id === s.id);
    const ownDone = own.filter((i) => res.get(i.id)?.status === "pass").length;
    return { section: s, items: own, done: ownDone };
  });

  return (
    <div style={{ padding: "0 14px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        className="card"
        style={{
          padding: 14,
          background: "linear-gradient(180deg, var(--red-50), var(--surface))",
          borderColor: "var(--red-line)",
        }}
      >
        <div className="kicker" style={{ color: "var(--red)" }}>
          Template
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginTop: 4, marginBottom: 6 }}>
          {template.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 8, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background: "var(--red)",
                transition: "width .25s",
              }}
            />
          </div>
          <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
            {doneItems}/{totalItems}
          </span>
        </div>
      </div>

      {sectionsWithItems.map(({ section, items, done }) => (
        <details
          key={section.id}
          className="card"
          style={{ padding: 0, overflow: "hidden" }}
          open
        >
          <summary
            style={{
              padding: "12px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              listStyle: "none",
              borderBottom: items.length > 0 ? "1px solid var(--line-2)" : "none",
            }}
          >
            <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)" }}>
              {section.section_no}
            </span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{section.title}</span>
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
            const r = res.get(i.id);
            return (
              <ChecklistItemRow
                key={i.id}
                so_number={c.so_number}
                case_checklist_id={caseChecklistId}
                item_id={i.id}
                item_no={i.item_no}
                text={i.text}
                isCritical={i.is_critical}
                expectedValue={i.expected_value}
                initialStatus={r?.status ?? null}
                initialRemark={r?.remark ?? null}
              />
            );
          })}
        </details>
      ))}
    </div>
  );
}

function PlaceholderCard({
  reason,
  serviceTypeCode,
  productCode,
}: {
  reason: string;
  serviceTypeCode: string | null;
  productCode?: string | null;
}) {
  const message =
    reason === "non-PM"
      ? "Checklist UI is currently PM-only (service type 7507)."
      : reason === "no-machine"
        ? "Add a primary machine to enable the PM checklist."
        : reason === "unmapped" || reason === "no-template"
          ? `No template for product ${productCode ?? "—"}. Supported: DLM / MCVP4 / MCVP8-V1 / MCVP8-V2 / SPV2 / SPV3.`
          : "Couldn't load checklist.";
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
      <div
        className="sub"
        style={{ textTransform: "none", letterSpacing: 0, fontSize: 12, color: "var(--ink-3)" }}
      >
        {message}
      </div>
    </div>
  );
}
