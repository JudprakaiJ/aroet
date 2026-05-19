import type { ReactNode } from "react";

export function CodeBadge({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="ar-codebadge">
      {icon}
      {children}
    </span>
  );
}
