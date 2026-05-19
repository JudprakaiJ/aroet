import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="aroet-shell-root">
      <Sidebar />
      <main className="aroet-shell-main">
        {children}
        <BottomNav />
      </main>
    </div>
  );
}
