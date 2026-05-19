import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { SyncChip } from "@/components/primitives/sync-chip";
import { ClockInWidget } from "@/components/clock/clock-in-widget";
import { Bell } from "@/components/notifications/bell";
import type { ActiveSession } from "@/lib/clock/types";
import type { NotificationItem } from "@/components/notifications/queries";

type Props = {
  title: string;
  sub?: string;
  leftIcon?: Extract<IconName, "menu" | "back">;
  showSync?: boolean;
  showBell?: boolean;
  activeSession?: ActiveSession | null;
  notifications?: NotificationItem[];
  right?: ReactNode;
};

export function AppBar({
  title,
  sub,
  leftIcon = "menu",
  showSync = true,
  showBell = true,
  activeSession = null,
  notifications,
  right,
}: Props) {
  return (
    <div className="appbar">
      <button type="button" className="iconbtn tap" aria-label={leftIcon}>
        <Icon name={leftIcon} size={18} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        {sub && <div className="sub">{sub}</div>}
        <h1 className="truncate">{title}</h1>
      </div>
      {activeSession ? (
        <ClockInWidget activeSession={activeSession} variant="appbar" />
      ) : (
        showSync && <SyncChip status="online" />
      )}
      {showBell && notifications && <Bell items={notifications} variant="appbar" />}
      {right}
    </div>
  );
}
