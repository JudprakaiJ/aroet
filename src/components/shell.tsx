import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { OfflineBanner } from "@/components/offline-banner";
import { getSidebarCounts } from "@/components/sidebar-counts";

const ME = "JKH";
const ROLE: "admin" | "engineer" = "admin";

export async function Shell({ children }: { children: ReactNode }) {
  const counts = await getSidebarCounts();
  return (
    <div className="aroet-shell-root">
      <Sidebar counts={counts} role={ROLE} me={ME} />
      <main className="aroet-shell-main">
        <OfflineBanner />
        {children}
        <BottomNav pendingCount={counts.pendingApprovals} showPendingBadge={ROLE === "admin"} />
      </main>
    </div>
  );
}
