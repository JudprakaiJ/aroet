"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { drainQueue, getQueueLength } from "@/lib/offline/queue";

export function SyncWatcher() {
  const router = useRouter();

  useEffect(() => {
    const drainAndRefresh = async () => {
      const before = getQueueLength();
      if (before === 0) return;
      const { flushed } = await drainQueue();
      if (flushed > 0) router.refresh();
    };

    const onOnline = () => drainAndRefresh();
    window.addEventListener("online", onOnline);
    if (navigator.onLine) drainAndRefresh();
    return () => window.removeEventListener("online", onOnline);
  }, [router]);

  return null;
}
