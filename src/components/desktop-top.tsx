import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { SyncChip } from "@/components/primitives/sync-chip";

type Crumb = { label: string; href?: string };

type Props = {
  title: string;
  crumbs?: Crumb[];
  searchPlaceholder?: string;
  showClockIn?: boolean;
  showSync?: boolean;
  showBell?: boolean;
  unreadCount?: number;
  right?: ReactNode;
};

export function DesktopTopBar({
  title,
  crumbs = [],
  searchPlaceholder = "Search cases, customers, machines…",
  showClockIn = true,
  showSync = true,
  showBell = true,
  unreadCount = 0,
  right,
}: Props) {
  return (
    <div className="dt-top">
      <div>
        {crumbs.length > 0 && (
          <div className="crumbs">
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                {c.href ? (
                  <a href={c.href} style={{ color: "inherit", textDecoration: "none" }}>
                    {c.label}
                  </a>
                ) : (
                  <span>{c.label}</span>
                )}
                {i < crumbs.length - 1 && <span className="sep">/</span>}
              </span>
            ))}
          </div>
        )}
        <div className="title">{title}</div>
      </div>

      <div className="actions">
        <div className="search-wrap">
          <span className="ico">
            <Icon name="search" size={14} />
          </span>
          <input className="search" placeholder={searchPlaceholder} />
        </div>

        {showClockIn && (
          <button
            type="button"
            className="dt-pill"
            style={{
              background: "var(--red-50)",
              color: "var(--red)",
              borderColor: "var(--red-line)",
              fontWeight: 700,
              letterSpacing: ".02em",
            }}
          >
            <Icon name="play" size={12} /> Clock in
          </button>
        )}

        {showSync && <SyncChip status="online" />}

        {showBell && (
          <button type="button" className="dt-pill ghost" aria-label="notifications" style={{ position: "relative", padding: "0 8px" }}>
            <Icon name="bell" size={14} />
            {unreadCount > 0 && (
              <span className="cbadge" style={{ position: "absolute", top: 2, right: 0 }}>
                {unreadCount}
              </span>
            )}
          </button>
        )}

        {right}
      </div>
    </div>
  );
}
