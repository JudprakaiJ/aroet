import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { OfflineBanner } from "@/components/offline-banner";
import { SyncWatcher } from "@/components/sync-watcher";
import { getSidebarCounts } from "@/components/sidebar-counts";
import { currentUser, isApprover } from "@/lib/auth/current-user";

export async function Shell({ children }: { children: ReactNode }) {
  const [counts, me] = await Promise.all([getSidebarCounts(), currentUser()]);
  const role: "admin" | "engineer" =
    me && isApprover(me.role) ? "admin" : "engineer";
  const code = me?.code ?? "JKH";
  return (
    <div className="aroet-shell-root">
      <Sidebar counts={counts} role={role} me={code} />
      <main className="aroet-shell-main">
        <SyncWatcher />
        <OfflineBanner />
        {children}
        <BottomNav pendingCount={counts.pendingApprovals} showPendingBadge={role === "admin"} />
      </main>
    </div>
  );
}
