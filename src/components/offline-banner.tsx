"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";

export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;
  return (
    <div
      role="status"
      style={{
        flex: "none",
        padding: "6px 14px",
        background: "var(--danger)",
        color: "#fff",
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: ".04em",
        textTransform: "uppercase",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <Icon name="alert" size={12} />
      Offline · changes you make may not save until connection is back
    </div>
  );
}
