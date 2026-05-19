"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { NotificationsPanel } from "./panel";
import type { NotificationItem } from "./queries";

const SEEN_KEY = "aroet_notif_seen_at";

type Props = {
  items: NotificationItem[];
  variant?: "appbar" | "desktop";
};

export function Bell({ items, variant = "appbar" }: Props) {
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState<string>("1970-01-01T00:00:00Z");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(SEEN_KEY) : null;
    if (stored) setSeenAt(stored);
    setMounted(true);
  }, []);

  const unread = mounted ? items.filter((n) => n.happened_at > seenAt).length : 0;
  const markAllRead = () => {
    const now = new Date().toISOString();
    setSeenAt(now);
    if (typeof window !== "undefined") localStorage.setItem(SEEN_KEY, now);
    setOpen(false);
  };

  const buttonProps =
    variant === "desktop"
      ? { className: "dt-pill ghost", style: { position: "relative" as const, padding: "0 8px" } }
      : { className: "iconbtn tap", style: { position: "relative" as const } };

  return (
    <>
      <button
        type="button"
        aria-label="notifications"
        onClick={() => setOpen(true)}
        {...buttonProps}
      >
        <Icon name="bell" size={variant === "desktop" ? 14 : 18} />
        {unread > 0 && (
          <span
            className="cbadge"
            style={{ position: "absolute", top: variant === "desktop" ? 2 : 4, right: variant === "desktop" ? 0 : 4 }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      <NotificationsPanel
        open={open}
        onClose={() => setOpen(false)}
        items={items}
        onMarkAllRead={markAllRead}
        seenAtIso={seenAt}
      />
    </>
  );
}
