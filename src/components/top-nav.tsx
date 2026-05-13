"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", exact: true },
  { label: "Cases", href: "/cases" },
  { label: "Workforce", href: "/workforce", exact: true },
  { label: "Queue", href: "/workforce/queue" },
  { label: "Customers", href: "/customers" },
  { label: "Machines", href: "/machines" },
  { label: "Planning", href: "/planning" },
  { label: "Team", href: "/engineers" },
];

export default function TopNav() {
  const pathname = usePathname() || "";
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 mr-2">
          <span
            className="text-white px-2.5 py-1 rounded-md text-[11px] font-bold tracking-widest"
            style={{ background: "#C8102E" }}
          >
            AROET
          </span>
          <span className="font-semibold text-slate-800 text-[15px] hidden sm:inline">
            Service
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[14px] px-3.5 py-2 rounded-lg transition-colors"
              style={
                isActive(item.href, item.exact)
                  ? { background: "#FEE2E5", color: "#C8102E", fontWeight: 600 }
                  : { color: "#475569", fontWeight: 500 }
              }
            >
              {item.label}
            </Link>
          ))}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden ml-auto p-2 text-slate-500 text-xl"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block px-6 py-3.5 text-[14px] border-b border-slate-50"
              style={
                isActive(item.href, item.exact)
                  ? { background: "#FEE2E5", color: "#C8102E", fontWeight: 600 }
                  : { color: "#334155", fontWeight: 500 }
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
