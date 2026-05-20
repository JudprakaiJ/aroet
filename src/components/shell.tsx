import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { OfflineBanner } from "@/components/offline-banner";
import { SyncWatcher } from "@/components/sync-watcher";
import { getSidebarCounts } from "@/components/sidebar-counts";
import { getDemoRole } from "@/app/me/role-actions";

const ME = "JKH";

export async function Shell({ children }: { children: ReactNode }) {
  const [counts, role] = await Promise.all([getSidebarCounts(), getDemoRole()]);
  return (
    <div className="aroet-shell-root">
      <Sidebar counts={counts} role={role} me={ME} />
      <main className="aroet-shell-main">
        <SyncWatcher />
        <OfflineBanner />
        {children}
        <BottomNav pendingCount={counts.pendingApprovals} showPendingBadge={role === "admin"} />
      </main>
    </div>
  );
}
