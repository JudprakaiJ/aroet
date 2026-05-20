"use client";

import {
  pauseSession,
  resumeSession,
  changeActivity,
  editStartTime,
  switchActiveCase,
} from "@/app/clock/actions";

const STORAGE_KEY = "aroet_offline_queue";
const EVT_CHANGED = "aroet:queue-changed";

export type QueuedKey = "pause" | "resume" | "changeActivity" | "editStartTime" | "switchActiveCase";

export type QueuedAction = {
  id: string;
  key: QueuedKey;
  args: unknown[];
  ts: number;
};

export type CallOrQueueResult = {
  success: boolean;
  error?: string;
  queued?: boolean;
};

function read(): QueuedAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: QueuedAction[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVT_CHANGED, { detail: { length: items.length } }));
}

function pushQueue(key: QueuedKey, args: unknown[]): QueuedAction {
  const item: QueuedAction = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    key,
    args,
    ts: Date.now(),
  };
  const q = read();
  q.push(item);
  write(q);
  return item;
}

async function execute(item: QueuedAction): Promise<{ success: boolean; error?: string }> {
  switch (item.key) {
    case "pause":
      return pauseSession(item.args[0] as number);
    case "resume":
      return resumeSession(item.args[0] as number);
    case "changeActivity":
      return changeActivity(item.args[0] as number, item.args[1] as string);
    case "editStartTime":
      return editStartTime(item.args[0] as number, item.args[1] as string);
    case "switchActiveCase":
      return switchActiveCase(
        item.args[0] as number,
        item.args[1] as string,
        item.args[2] as string | null
      );
  }
}

let draining = false;

export async function drainQueue(): Promise<{ flushed: number }> {
  if (draining) return { flushed: 0 };
  if (typeof window !== "undefined" && !navigator.onLine) return { flushed: 0 };
  draining = true;
  let flushed = 0;
  try {
    while (true) {
      const q = read();
      if (q.length === 0) break;
      const head = q[0];
      try {
        const r = await execute(head);
        if (!r.success) {
          // Drop poison rows so a single bad action doesn't block the queue forever
          write(q.slice(1));
        } else {
          write(q.slice(1));
        }
        flushed += 1;
      } catch {
        // Network failure mid-drain — leave the rest for the next online tick
        break;
      }
    }
  } finally {
    draining = false;
  }
  return { flushed };
}

export async function callOrQueue(key: QueuedKey, args: unknown[]): Promise<CallOrQueueResult> {
  if (typeof window !== "undefined" && !navigator.onLine) {
    pushQueue(key, args);
    return { success: true, queued: true };
  }
  try {
    const r = await execute({ id: "live", key, args, ts: Date.now() });
    if (!r.success) return { success: false, error: r.error };
    return { success: true };
  } catch {
    pushQueue(key, args);
    return { success: true, queued: true };
  }
}

export function getQueueLength(): number {
  return read().length;
}

export function subscribeQueueLength(cb: (n: number) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<{ length: number }>).detail;
    cb(detail?.length ?? read().length);
  };
  window.addEventListener(EVT_CHANGED, handler);
  return () => window.removeEventListener(EVT_CHANGED, handler);
}
