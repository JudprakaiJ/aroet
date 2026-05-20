"use client";

import { useEffect, useState } from "react";
import { SyncChip } from "@/components/primitives/sync-chip";
import { getQueueLength, subscribeQueueLength } from "@/lib/offline/queue";

export function SyncStatus() {
  const [online, setOnline] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setOnline(navigator.onLine);
    setCount(getQueueLength());
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    const unsub = subscribeQueueLength(setCount);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      unsub();
    };
  }, []);

  const status: "online" | "offline" | "syncing" = !online
    ? "offline"
    : count > 0
      ? "syncing"
      : "online";

  return <SyncChip status={status} count={count} />;
}
