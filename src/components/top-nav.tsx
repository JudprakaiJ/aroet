"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Cases", href: "/cases" },
  { label: "Customers", href: "/customers" },
  { label: "Machines", href: "/machines" },
  { label: "Planning", href: "/planning" },
  { label: "Calendar", href: "/calendar" },
  { label: "Team", href: "/engineers" },
];

export default function TopNav() {
  const pathname = usePathname() || "";
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 mr-3">
          <span
            className="text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-widest"
            style={{ background: "#C8102E" }}
          >
            AROET
          </span>
          <span className="font-semibold text-slate-700 text-sm hidden sm:inline">
            Service
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={
                isActive(item.href)
                  ? { background: "#FEE2E5", color: "#C8102E", fontWeight: 600 }
                  : { color: "#475569" }
              }
            >
              {item.label}
            </Link>
          ))}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden ml-auto p-1.5 text-slate-500"
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
              className="block px-4 py-3 text-sm border-b border-slate-50"
              style={
                isActive(item.href)
                  ? { background: "#FEE2E5", color: "#C8102E", fontWeight: 600 }
                  : { color: "#334155" }
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
