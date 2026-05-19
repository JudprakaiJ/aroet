"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

type Item = { id: string; label: string; icon: IconName; href: string; matches: (p: string) => boolean };

const ITEMS: Item[] = [
  { id: "home",      label: "Dashboard", icon: "home",      href: "/",          matches: (p) => p === "/" },
  { id: "cases",     label: "Cases",     icon: "folder",    href: "/cases",     matches: (p) => p.startsWith("/cases") },
  { id: "customers", label: "Customers", icon: "building",  href: "/customers", matches: (p) => p.startsWith("/customers") },
  { id: "machines",  label: "Machines",  icon: "cube",      href: "/machines",  matches: (p) => p.startsWith("/machines") },
  { id: "workforce", label: "Workforce", icon: "clock",     href: "/workforce", matches: (p) => p.startsWith("/workforce") || p.startsWith("/planning") },
  { id: "me",        label: "Me",        icon: "user",      href: "/me",        matches: (p) => p.startsWith("/me") },
];

export function Sidebar() {
  const pathname = usePathname() ?? "/";
  return (
    <aside className="lap-side" style={{ minHeight: "100vh" }}>
      <div className="brandblock">
        <span className="brandmark">
          <span className="box">AR</span>
          AROET
        </span>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="item"
            data-on={item.matches(pathname)}
          >
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
