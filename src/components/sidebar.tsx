"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import { Avatar } from "@/components/primitives/avatar";
import type { SidebarCounts } from "./sidebar-counts";

type Item = {
  id: string;
  label: string;
  icon: IconName;
  href: string;
  matches: (p: string) => boolean;
  countKey?: keyof SidebarCounts;
  badgeKey?: keyof SidebarCounts;
};

const WORKSPACE: Item[] = [
  { id: "dashboard", label: "Dashboard", icon: "home",       href: "/",          matches: (p) => p === "/" },
  { id: "cases",     label: "Cases",     icon: "folder",     href: "/cases",     matches: (p) => p.startsWith("/cases"), countKey: "cases" },
  { id: "plan",      label: "Plan",      icon: "calendar",   href: "/planning",  matches: (p) => p.startsWith("/planning") },
  { id: "hours",     label: "Hours",     icon: "clock",      href: "/workforce", matches: (p) => p.startsWith("/workforce") && !p.startsWith("/workforce/queue") },
];

const ADMIN: Item[] = [
  { id: "approvals", label: "Approvals", icon: "inbox",       href: "/workforce/queue", matches: (p) => p.startsWith("/workforce/queue"), badgeKey: "pendingApprovals" },
  { id: "reports",   label: "Reports",   icon: "trending-up", href: "/workforce?tab=hours", matches: (p) => p === "/workforce" && false },
  { id: "customers", label: "Customers", icon: "building",    href: "/customers", matches: (p) => p.startsWith("/customers") },
  { id: "machines",  label: "Machines",  icon: "cube",        href: "/machines",  matches: (p) => p.startsWith("/machines") },
  { id: "imports",   label: "Imports",   icon: "cloud",       href: "/admin/bulk-reparse", matches: (p) => p.startsWith("/admin") },
];

const SYSTEM: Item[] = [
  { id: "settings", label: "Settings", icon: "wrench", href: "/me", matches: (p) => p.startsWith("/me") },
];

type Props = {
  counts: SidebarCounts;
  role: "admin" | "engineer";
  me: string;
};

export function Sidebar({ counts, role, me }: Props) {
  const pathname = usePathname() ?? "/";
  const renderItem = (item: Item) => {
    const on = item.matches(pathname);
    const count = item.countKey ? counts[item.countKey] : null;
    const badge = item.badgeKey ? counts[item.badgeKey] : null;
    return (
      <Link key={item.id} href={item.href} className="item" data-on={on || undefined}>
        <span className="ico">
          <Icon name={item.icon} size={16} />
        </span>
        <span style={{ flex: 1 }}>{item.label}</span>
        {badge ? <span className="badge">{badge}</span> : count != null ? <span className="cnt">{count}</span> : null}
      </Link>
    );
  };

  return (
    <aside className="dt-side">
      <div className="brand">
        <span className="logo">AR</span>
        <span className="name">AROET</span>
        <span className="ver">v0.4</span>
      </div>

      <div className="secs">Workspace</div>
      {WORKSPACE.map(renderItem)}

      {role === "admin" && (
        <>
          <div className="secs">Admin</div>
          {ADMIN.map(renderItem)}
        </>
      )}

      <div className="secs">System</div>
      {SYSTEM.map(renderItem)}

      <div className="user">
        <Avatar code={me} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>
            {role === "admin" ? "Admin" : "Engineer"}
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: "var(--ink-3)",
              fontFamily: "var(--mono)",
            }}
          >
            {me}
          </div>
        </div>
      </div>
    </aside>
  );
}
