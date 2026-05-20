import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { SyncStatus } from "@/components/sync-status";
import { ClockInWidget } from "@/components/clock/clock-in-widget";
import { Bell } from "@/components/notifications/bell";
import type { ActiveSession } from "@/lib/clock/types";
import type { NotificationItem } from "@/components/notifications/queries";

type Crumb = { label: string; href?: string };

type Props = {
  title: string;
  crumbs?: Crumb[];
  searchPlaceholder?: string;
  showClockIn?: boolean;
  showSync?: boolean;
  showBell?: boolean;
  activeSession?: ActiveSession | null;
  notifications?: NotificationItem[];
  right?: ReactNode;
};

export function DesktopTopBar({
  title,
  crumbs = [],
  searchPlaceholder = "Search cases, customers, machines…",
  showClockIn = true,
  showSync = true,
  showBell = true,
  activeSession = null,
  notifications,
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

        {activeSession ? (
          <ClockInWidget activeSession={activeSession} variant="desktop" />
        ) : (
          showClockIn && (
            <span
              className="dt-pill"
              style={{
                background: "var(--red-50)",
                color: "var(--red)",
                borderColor: "var(--red-line)",
                fontWeight: 700,
                letterSpacing: ".02em",
                opacity: 0.7,
                cursor: "default",
              }}
              title="Use Smart Start CTA on Dashboard"
            >
              <Icon name="play" size={12} /> Clock in
            </span>
          )
        )}

        {showSync && !activeSession && <SyncStatus />}

        {showBell && notifications && <Bell items={notifications} variant="desktop" />}

        {right}
      </div>
    </div>
  );
}
