"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import {
  updateChecklistSection,
  deleteChecklistSection,
  moveChecklistSection,
  createChecklistItem,
  bulkAddItems,
} from "../actions";
import { ItemRow } from "./item-row";
import type { ChecklistSectionEdit } from "../queries";

type Props = {
  section: ChecklistSectionEdit;
  admin: boolean;
  isFirst: boolean;
  isLast: boolean;
};

export function SectionCard({ section, admin, isFirst, isLast }: Props) {
  const router = useRouter();
  const [editHead, setEditHead] = useState(false);
  const [sectionNo, setSectionNo] = useState(section.section_no);
  const [title, setTitle] = useState(section.title);
  const [confirmDel, setConfirmDel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [newItemNo, setNewItemNo] = useState(suggestNextItemNo(section));
  const [newItemText, setNewItemText] = useState("");
  const [newItemExpected, setNewItemExpected] = useState("");
  const [newItemCritical, setNewItemCritical] = useState(false);
  const [bulkStartNo, setBulkStartNo] = useState(suggestNextItemNo(section));
  const [bulkText, setBulkText] = useState("");

  const saveHead = () => {
    setError(null);
    startTransition(async () => {
      const r = await updateChecklistSection(section.id, {
        section_no: sectionNo,
        title,
      });
      if (!r.success) {
        setError(r.error ?? "Save failed");
        return;
      }
      setEditHead(false);
      router.refresh();
    });
  };

  const onDel = () => {
    setError(null);
    startTransition(async () => {
      const r = await deleteChecklistSection(section.id);
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
      await moveChecklistSection(section.id, direction);
      router.refresh();
    });
  };

  const onAddItem = () => {
    setError(null);
    if (!newItemNo.trim() || !newItemText.trim()) {
      setError("Item # and text required");
      return;
    }
    startTransition(async () => {
      const r = await createChecklistItem({
        section_id: section.id,
        item_no: newItemNo,
        text: newItemText,
        expected_value: newItemExpected || null,
        is_critical: newItemCritical,
      });
      if (!r.success) {
        setError(r.error ?? "Add failed");
        return;
      }
      setNewItemText("");
      setNewItemExpected("");
      setNewItemCritical(false);
      setNewItemNo(bumpItemNo(newItemNo));
      router.refresh();
    });
  };

  const onBulkAdd = () => {
    setError(null);
    if (!bulkStartNo.trim() || !bulkText.trim()) {
      setError("Start # and text required");
      return;
    }
    startTransition(async () => {
      const r = await bulkAddItems(section.id, bulkStartNo, bulkText);
      if (!r.success) {
        setError(r.error ?? "Add failed");
        return;
      }
      setBulkText("");
      setBulkOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Section head */}
      <div
        style={{
          padding: "10px 14px",
          background: "var(--surface-2)",
          borderBottom: "1px solid var(--line-2)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {editHead ? (
          <>
            <input
              type="text"
              className="field mono"
              style={{ width: 70, minHeight: 30 }}
              value={sectionNo}
              onChange={(e) => setSectionNo(e.target.value)}
            />
            <input
              type="text"
              className="field"
              style={{ flex: 1, minWidth: 120, minHeight: 30 }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary"
              style={{ minHeight: 30, padding: "0 10px", fontSize: 12 }}
              onClick={saveHead}
              disabled={pending}
            >
              Save
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ minHeight: 30, padding: "0 8px", fontSize: 12 }}
              onClick={() => {
                setEditHead(false);
                setSectionNo(section.section_no);
                setTitle(section.title);
              }}
              disabled={pending}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <span className="chip mono" style={{ fontSize: 11, fontWeight: 600 }}>
              §{section.section_no}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{section.title}</span>
            <span className="sub" style={{ fontSize: 11, textTransform: "none", letterSpacing: 0 }}>
              {section.items.length} item{section.items.length === 1 ? "" : "s"}
            </span>
            {admin && (
              <span style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ minHeight: 28, padding: "0 6px" }}
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
                  style={{ minHeight: 28, padding: "0 6px" }}
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
                  style={{ minHeight: 28, padding: "0 8px", fontSize: 11 }}
                  onClick={() => setEditHead(true)}
                  disabled={pending}
                >
                  <Icon name="wrench" size={11} /> Edit
                </button>
                {confirmDel ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ minHeight: 28, padding: "0 8px", fontSize: 11 }}
                      onClick={() => setConfirmDel(false)}
                      disabled={pending}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      style={{ minHeight: 28, padding: "0 8px", fontSize: 11 }}
                      onClick={onDel}
                      disabled={pending}
                    >
                      <Icon name="x" size={11} /> {pending ? "…" : "Delete"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ minHeight: 28, padding: "0 8px", fontSize: 11, color: "var(--danger)" }}
                    onClick={() => setConfirmDel(true)}
                    disabled={pending}
                  >
                    <Icon name="x" size={11} /> Delete
                  </button>
                )}
              </span>
            )}
          </>
        )}
      </div>

      {/* Items */}
      <div>
        {section.items.map((it, i) => (
          <ItemRow
            key={it.id}
            item={it}
            admin={admin}
            isFirst={i === 0}
            isLast={i === section.items.length - 1}
          />
        ))}
        {section.items.length === 0 && (
          <div style={{ padding: 16, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>
            No items yet.
          </div>
        )}
      </div>

      {/* Add item / bulk */}
      {admin && (
        <div style={{ padding: 10, borderTop: "1px solid var(--line-2)", display: "flex", flexDirection: "column", gap: 8 }}>
          {addOpen ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 120px", gap: 8 }}>
                <input
                  type="text"
                  className="field mono"
                  placeholder="1.1"
                  value={newItemNo}
                  onChange={(e) => setNewItemNo(e.target.value)}
                  style={{ minHeight: 32 }}
                />
                <input
                  type="text"
                  className="field"
                  placeholder="Item text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  style={{ minHeight: 32 }}
                />
                <input
                  type="text"
                  className="field mono"
                  placeholder="Expected (opt.)"
                  value={newItemExpected}
                  onChange={(e) => setNewItemExpected(e.target.value)}
                  style={{ minHeight: 32, fontSize: 11 }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={newItemCritical}
                    onChange={(e) => setNewItemCritical(e.target.checked)}
                  />
                  Critical (REQ)
                </label>
                <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setAddOpen(false)} disabled={pending}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={onAddItem} disabled={pending}>
                    {pending ? "Adding…" : "Add item"}
                  </button>
                </span>
              </div>
            </div>
          ) : bulkOpen ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 8 }}>
                <input
                  type="text"
                  className="field mono"
                  placeholder="Start # (1.1)"
                  value={bulkStartNo}
                  onChange={(e) => setBulkStartNo(e.target.value)}
                />
                <span style={{ fontSize: 11, color: "var(--ink-3)", alignSelf: "center" }}>
                  Auto-increments. Each line below becomes one item.
                </span>
              </div>
              <textarea
                className="field"
                rows={6}
                placeholder={"Paste one item per line:\nGeneral cleaning\nExchange fan filter\nCheck backplane voltages"}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setBulkOpen(false)} disabled={pending}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={onBulkAdd} disabled={pending}>
                  {pending ? "Adding…" : "Add all"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ minHeight: 30, padding: "0 10px", fontSize: 12 }}
                onClick={() => setAddOpen(true)}
              >
                <Icon name="plus" size={11} /> Add item
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ minHeight: 30, padding: "0 10px", fontSize: 12 }}
                onClick={() => setBulkOpen(true)}
              >
                Bulk paste…
              </button>
            </div>
          )}

          {error && (
            <div style={{ padding: 8, background: "var(--danger-soft)", color: "var(--danger)", borderRadius: 6, fontSize: 12 }}>
              <Icon name="alert" size={11} /> {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function suggestNextItemNo(section: ChecklistSectionEdit): string {
  const last = section.items[section.items.length - 1];
  if (last) return bumpItemNo(last.item_no);
  return `${section.section_no}.1`;
}

function bumpItemNo(no: string): string {
  const m = no.match(/^(.*?)(\d+)$/);
  if (!m) return no + ".1";
  return m[1] + (parseInt(m[2], 10) + 1);
}
