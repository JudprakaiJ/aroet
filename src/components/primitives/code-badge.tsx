import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  icon?: ReactNode;
};

export function CodeBadge({ children, icon }: Props) {
  return (
    <span className="codebadge">
      {icon}
      {children}
    </span>
  );
}
