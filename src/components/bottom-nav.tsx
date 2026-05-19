"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

type Tab = { id: string; label: string; icon: IconName; href: string; matches: (path: string) => boolean };

const TABS_LEFT: Tab[] = [
  { id: "home",  label: "Home",  icon: "home",   href: "/",       matches: (p) => p === "/" },
  { id: "cases", label: "Cases", icon: "folder", href: "/cases",  matches: (p) => p.startsWith("/cases") },
];

const TABS_RIGHT: Tab[] = [
  { id: "hours", label: "Hours", icon: "clock", href: "/workforce", matches: (p) => p.startsWith("/workforce") },
  { id: "me",    label: "Me",    icon: "user",  href: "/me",        matches: (p) => p.startsWith("/me") },
];

type Props = {
  pendingCount?: number;
  showPendingBadge?: boolean;
};

export function BottomNav({ pendingCount = 0, showPendingBadge = false }: Props) {
  const pathname = usePathname() ?? "/";
  return (
    <div className="tabbar">
      {TABS_LEFT.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className="tabbtn"
          data-active={t.matches(pathname)}
        >
          <span className="icn">
            <Icon name={t.icon} size={22} />
          </span>
          <span>{t.label}</span>
        </Link>
      ))}
      <div className="fabwrap">
        <button type="button" className="fab" aria-label="quick add" data-pulse="true">
          <Icon name="plus" size={26} />
        </button>
        <span className="fablabel">Quick add</span>
      </div>
      {TABS_RIGHT.map((t) => {
        const badge = t.id === "hours" && showPendingBadge ? pendingCount : 0;
        return (
          <Link
            key={t.id}
            href={t.href}
            className="tabbtn"
            data-active={t.matches(pathname)}
          >
            <span className="icn" style={{ position: "relative" }}>
              <Icon name={t.icon} size={22} />
              {badge > 0 && (
                <span className="cbadge" style={{ position: "absolute", top: -4, right: -10 }}>
                  {badge}
                </span>
              )}
            </span>
            <span>{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
