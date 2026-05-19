"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Home,
  Folder,
  Clock,
  User,
  Plus,
  Calendar,
  Building,
  Cube,
  Bell,
} from "@/components/icons";
import { Sheet } from "@/components/sheet";
import { ToastProvider } from "@/components/toast";

const SIDEBAR_ITEMS = [
  { label: "Dashboard", href: "/", icon: Home, exact: true },
  { label: "Cases",     href: "/cases",     icon: Folder },
  { label: "Workforce", href: "/workforce", icon: Calendar },
  { label: "Customers", href: "/customers", icon: Building },
  { label: "Machines",  href: "/machines",  icon: Cube },
  { label: "Team",      href: "/engineers", icon: User },
];

// Bottom-nav items split into left two + right two; FAB sits between them.
const BOTTOM_LEFT = [
  { id: "home",  href: "/",       label: "Home",  icon: Home },
  { id: "cases", href: "/cases",  label: "Cases", icon: Folder },
];
const BOTTOM_RIGHT = [
  { id: "hours", href: "/workforce?tab=hours", label: "Hours", icon: Clock },
  { id: "me",    href: "/engineers",            label: "Me",    icon: User },
];

const TITLE_MAP: { match: (p: string) => boolean; title: string; sub?: string }[] = [
  { match: (p) => p === "/",                        title: "Dashboard" },
  { match: (p) => p === "/cases",                   title: "Cases" },
  { match: (p) => p === "/cases/new",               title: "New case",        sub: "Create" },
  { match: (p) => p.startsWith("/cases/"),          title: "Case",             sub: "Detail" },
  { match: (p) => p === "/workforce",               title: "Workforce" },
  { match: (p) => p === "/workforce/queue",         title: "Approval queue",   sub: "Workforce" },
  { match: (p) => p === "/customers",               title: "Customers" },
  { match: (p) => p.startsWith("/customers/"),      title: "Customer",         sub: "Detail" },
  { match: (p) => p === "/machines",                title: "Machines" },
  { match: (p) => p.startsWith("/machines/"),       title: "Machine",          sub: "Detail" },
  { match: (p) => p === "/engineers",               title: "Team" },
  { match: (p) => p === "/planning",                title: "Planning" },
  { match: (p) => p === "/admin/bulk-reparse",      title: "Bulk reparse",     sub: "Admin" },
];

function deriveTitle(pathname: string): { title: string; sub?: string } {
  for (const entry of TITLE_MAP) {
    if (entry.match(pathname)) return { title: entry.title, sub: entry.sub };
  }
  return { title: "AROET" };
}

function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2 font-bold tracking-wide text-[14px] text-ink">
      <span
        className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-[5px] text-white font-bold text-[11px] font-mono"
        style={{ background: "var(--color-red)" }}
      >
        A
      </span>
      AROET
    </span>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="hidden md:flex md:flex-col md:w-[220px] md:shrink-0 md:sticky md:top-0 md:h-screen bg-surface border-r border-line p-2.5">
      <Link href="/" className="flex items-center gap-2.5 px-1.5 py-2 pb-3.5 mb-2 border-b border-line">
        <BrandMark />
        <span className="ml-1 text-[11px] text-ink-3 font-medium tracking-wide">Service</span>
      </Link>
      <nav className="flex flex-col gap-0.5">
        {SIDEBAR_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors"
              style={{
                background: active ? "var(--color-red-50)" : "transparent",
                color: active ? "var(--color-red)" : "var(--color-ink-2)",
                minHeight: 36,
              }}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-3 border-t border-line text-[11px] text-ink-4 px-2">
        Phase 1 redesign · open access
      </div>
    </aside>
  );
}

function AppBar({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="md:hidden sticky top-0 z-20 bg-page">
      <div className="flex items-center gap-2.5 px-3.5 pt-2 pb-3">
        <Link href="/" className="shrink-0">
          <BrandMark />
        </Link>
        <div className="flex-1 min-w-0 ml-1">
          {sub && (
            <div className="text-[11px] font-medium text-ink-3 tracking-wide uppercase truncate">{sub}</div>
          )}
          <h1 className="text-[18px] font-bold tracking-tight text-ink truncate m-0 leading-tight">{title}</h1>
        </div>
        <button
          type="button"
          aria-label="notifications"
          className="w-10 h-10 inline-flex items-center justify-center rounded-lg bg-surface border border-line text-ink-2 hover:bg-hover"
        >
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}

function BottomNav({
  pathname,
  onFab,
}: {
  pathname: string;
  onFab: () => void;
}) {
  function isActive(href: string) {
    const path = href.split("?")[0];
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(path + "/");
  }

  const tabClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[44px] text-[10.5px] font-semibold tracking-tight ${
      active ? "text-red" : "text-ink-3"
    }`;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-line grid"
      style={{
        gridTemplateColumns: "1fr 1fr 80px 1fr 1fr",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 6px)",
        paddingTop: 6,
      }}
    >
      {BOTTOM_LEFT.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.href);
        return (
          <Link key={tab.id} href={tab.href} className={tabClass(active)}>
            <Icon size={22} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
      <div className="relative flex justify-center">
        <button
          type="button"
          onClick={onFab}
          aria-label="quick add"
          className="absolute -top-[22px] w-[58px] h-[58px] rounded-full text-white inline-flex items-center justify-center"
          style={{
            background: "var(--color-red)",
            boxShadow:
              "0 10px 26px rgba(200,16,46,0.4), 0 2px 6px rgba(200,16,46,0.3)",
            border: "3px solid var(--color-page)",
            transition: "transform 0.1s, box-shadow 0.15s",
          }}
        >
          <Plus size={26} strokeWidth={2.4} />
        </button>
        <span className="text-[9.5px] font-semibold text-ink-3 mt-[36px] tracking-wide">Quick add</span>
      </div>
      {BOTTOM_RIGHT.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.href);
        return (
          <Link key={tab.id} href={tab.href} className={tabClass(active)}>
            <Icon size={22} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function QuickAddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Quick add" sub="What's next">
      <div className="px-4 pb-6 grid gap-2.5">
        <Link
          href="/cases/new"
          onClick={onClose}
          className="ar-btn ar-btn-primary ar-btn-block"
        >
          <Plus size={18} strokeWidth={2.4} />
          New case
        </Link>
        <button type="button" disabled className="ar-btn ar-btn-secondary ar-btn-block" title="Coming in Phase 5">
          <Clock size={18} />
          Add session (coming soon)
        </button>
        <button type="button" disabled className="ar-btn ar-btn-secondary ar-btn-block" title="Coming in Phase 4">
          <Folder size={18} />
          Clock in (coming soon)
        </button>
      </div>
    </Sheet>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const [quickOpen, setQuickOpen] = useState(false);
  const { title, sub } = deriveTitle(pathname);

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar pathname={pathname} />
        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          <AppBar title={title} sub={sub} />
          <main className="flex-1 pb-[96px] md:pb-0">{children}</main>
        </div>
      </div>
      <BottomNav pathname={pathname} onFab={() => setQuickOpen(true)} />
      <QuickAddSheet open={quickOpen} onClose={() => setQuickOpen(false)} />
    </ToastProvider>
  );
}
