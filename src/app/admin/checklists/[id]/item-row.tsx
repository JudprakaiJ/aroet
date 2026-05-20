"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { updateChecklistItem, deleteChecklistItem, moveChecklistItem } from "../actions";
import type { ChecklistItemEdit } from "../queries";

type Props = {
  item: ChecklistItemEdit;
  admin: boolean;
  isFirst: boolean;
  isLast: boolean;
};

export function ItemRow({ item, admin, isFirst, isLast }: Props) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [itemNo, setItemNo] = useState(item.item_no);
  const [text, setText] = useState(item.text);
  const [expected, setExpected] = useState(item.expected_value ?? "");
  const [critical, setCritical] = useState(item.is_critical);
  const [confirmDel, setConfirmDel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSave = () => {
    setError(null);
    startTransition(async () => {
      const r = await updateChecklistItem(item.id, {
        item_no: itemNo,
        text,
        expected_value: expected || null,
        is_critical: critical,
      });
      if (!r.success) {
        setError(r.error ?? "Save failed");
        return;
      }
      setEdit(false);
      router.refresh();
    });
  };

  const onDel = () => {
    setError(null);
    startTransition(async () => {
      const r = await deleteChecklistItem(item.id);
      if (!r.success) {
        setError(r.error ?? "Delete failed");
        setConfirmDel(false);
        return;
      }
      router.refresh();
    });
  };

  const onMove = (direction: "up" | "down") => {
    startTransition(async () => {
      await moveChecklistItem(item.id, direction);
      router.refresh();
    });
  };

  return (
    <div
      style={{
        padding: "10px 14px",
        borderBottom: "1px solid var(--line-2)",
        opacity: pending ? 0.7 : 1,
      }}
    >
      {edit ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 120px", gap: 8 }}>
            <input
              type="text"
              className="field mono"
              value={itemNo}
              onChange={(e) => setItemNo(e.target.value)}
              style={{ minHeight: 30 }}
            />
            <input
              type="text"
              className="field"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ minHeight: 30 }}
            />
            <input
              type="text"
              className="field mono"
              placeholder="Expected (opt.)"
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              style={{ minHeight: 30, fontSize: 11 }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <input
                type="checkbox"
                checked={critical}
                onChange={(e) => setCritical(e.target.checked)}
              />
              Critical (REQ)
            </label>
            <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setEdit(false);
                  setItemNo(item.item_no);
                  setText(item.text);
                  setExpected(item.expected_value ?? "");
                  setCritical(item.is_critical);
                }}
                disabled={pending}
                style={{ minHeight: 30, padding: "0 10px", fontSize: 12 }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onSave}
                disabled={pending}
                style={{ minHeight: 30, padding: "0 12px", fontSize: 12 }}
              >
                {pending ? "Saving…" : "Save"}
              </button>
            </span>
          </div>
          {error && (
            <div style={{ padding: 6, background: "var(--danger-soft)", color: "var(--danger)", borderRadius: 6, fontSize: 11 }}>
              <Icon name="alert" size={10} /> {error}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span
            className="mono"
            style={{ fontSize: 10.5, color: "var(--ink-3)", fontWeight: 600, minWidth: 36, paddingTop: 2 }}
          >
            {item.item_no}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: "var(--ink)" }}>
              {item.text}
              {item.is_critical && <span className="chip chip-red" style={{ fontSize: 9, marginLeft: 6 }}>REQ</span>}
              {item.expected_value && (
                <span className="chip chip-mono" style={{ fontSize: 10, marginLeft: 6 }}>
                  {item.expected_value}
                </span>
              )}
            </div>
            {error && (
              <div style={{ padding: 6, marginTop: 6, background: "var(--danger-soft)", color: "var(--danger)", borderRadius: 6, fontSize: 11 }}>
                <Icon name="alert" size={10} /> {error}
              </div>
            )}
          </div>
          {admin && (
            <span style={{ display: "flex", gap: 4, flex: "none" }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ minHeight: 26, padding: "0 6px" }}
                onClick={() => onMove("up")}
                disabled={isFirst || pending}
                aria-label="Move up"
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ minHeight: 26, padding: "0 6px" }}
                onClick={() => onMove("down")}
                disabled={isLast || pending}
                aria-label="Move down"
                title="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ minHeight: 26, padding: "0 6px", fontSize: 11 }}
                onClick={() => setEdit(true)}
                disabled={pending}
              >
                <Icon name="wrench" size={11} />
              </button>
              {confirmDel ? (
                <>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ minHeight: 26, padding: "0 6px", fontSize: 11 }}
                    onClick={() => setConfirmDel(false)}
                    disabled={pending}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ minHeight: 26, padding: "0 6px", fontSize: 11 }}
                    onClick={onDel}
                    disabled={pending}
                  >
                    <Icon name="x" size={11} />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ minHeight: 26, padding: "0 6px", fontSize: 11, color: "var(--danger)" }}
                  onClick={() => setConfirmDel(true)}
                  disabled={pending}
                >
                  <Icon name="x" size={11} />
                </button>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
