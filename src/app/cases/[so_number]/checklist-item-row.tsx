"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { toggleChecklistItem } from "./checklist-actions";
import type { ItemStatus } from "@/lib/checklist";

type Props = {
  so_number: string;
  case_checklist_id: number;
  item_id: number;
  item_no: string;
  text: string;
  isCritical: boolean;
  expectedValue: string | null;
  initialStatus: ItemStatus | null;
  initialRemark: string | null;
};

export function ChecklistItemRow({
  so_number,
  case_checklist_id,
  item_id,
  item_no,
  text,
  isCritical,
  expectedValue,
  initialStatus,
  initialRemark,
}: Props) {
  const [status, setStatus] = useState<ItemStatus | null>(initialStatus);
  const [remark, setRemark] = useState(initialRemark ?? "");
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = (next: ItemStatus | null) => {
    setStatus(next);
    startTransition(async () => {
      await toggleChecklistItem(so_number, case_checklist_id, item_id, next, remark);
    });
  };

  const saveRemark = () => {
    if (status === null) return;
    startTransition(async () => {
      await toggleChecklistItem(so_number, case_checklist_id, item_id, status, remark);
    });
  };

  const checked = status === "pass";
  const failed = status === "fail";

  return (
    <div
      style={{
        padding: "10px 14px",
        borderBottom: "1px solid var(--line-2)",
        opacity: pending ? 0.7 : 1,
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <button
          type="button"
          onClick={() => set(checked ? null : "pass")}
          aria-label="toggle pass"
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            border: "2px solid",
            borderColor: checked ? "var(--red)" : failed ? "var(--danger)" : "var(--ink-5)",
            background: checked ? "var(--red)" : failed ? "var(--danger-soft)" : "var(--surface)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
            cursor: "pointer",
            marginTop: 2,
          }}
        >
          {checked && <Icon name="check" size={14} sw={3} />}
          {failed && <Icon name="x" size={14} sw={3} />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "baseline", flexWrap: "wrap" }}>
            <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", fontWeight: 600 }}>
              {item_no}
            </span>
            <span
              style={{
                fontSize: 13,
                color: "var(--ink)",
                fontWeight: 500,
                textDecoration: checked ? "line-through" : undefined,
                opacity: checked ? 0.65 : 1,
              }}
            >
              {text}
            </span>
            {isCritical && <span className="chip chip-red" style={{ fontSize: 9 }}>REQ</span>}
            {expectedValue && (
              <span className="chip chip-mono" style={{ fontSize: 10 }}>
                {expectedValue}
              </span>
            )}
          </div>
          {expanded && (
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
              <textarea
                className="field"
                rows={2}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                onBlur={saveRemark}
                placeholder="Notes (optional)…"
                style={{ fontSize: 12 }}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => set("fail")}
                  style={{ color: failed ? "var(--danger)" : "var(--ink-2)" }}
                >
                  Mark fail
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => set("na")}
                  style={{ color: status === "na" ? "var(--ink) " : "var(--ink-3)" }}
                >
                  N/A
                </button>
                {status !== null && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => set(null)}
                    style={{ marginLeft: "auto" }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setExpanded((e) => !e)}
            style={{ padding: "2px 0", minHeight: 18, fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}
          >
            {expanded ? "Hide" : remark ? `Note: ${remark.slice(0, 30)}${remark.length > 30 ? "…" : ""}` : "Add note / mark fail"}
          </button>
        </div>
      </div>
    </div>
  );
}
