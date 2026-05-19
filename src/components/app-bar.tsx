import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";
import { SyncChip } from "@/components/primitives/sync-chip";

type Props = {
  title: string;
  sub?: string;
  leftIcon?: Extract<IconName, "menu" | "back">;
  showSync?: boolean;
  showBell?: boolean;
  unreadCount?: number;
  right?: ReactNode;
};

export function AppBar({
  title,
  sub,
  leftIcon = "menu",
  showSync = true,
  showBell = true,
  unreadCount = 0,
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
      {showSync && <SyncChip status="online" />}
      {showBell && (
        <button
          type="button"
          className="iconbtn tap"
          aria-label="notifications"
          style={{ position: "relative" }}
        >
          <Icon name="bell" size={18} />
          {unreadCount > 0 && (
            <span className="cbadge" style={{ position: "absolute", top: 4, right: 4 }}>
              {unreadCount}
            </span>
          )}
        </button>
      )}
      {right}
    </div>
  );
}
