import type { ReactNode } from "react";

type Props = {
  on?: boolean;
  count?: number | null;
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
};

export function FilterChip({ on, count, children, onClick, type = "button" }: Props) {
  return (
    <button type={type} className="fchip" data-on={on || undefined} onClick={onClick}>
      <span>{children}</span>
      {count !== null && count !== undefined && <span className="cnt">{count}</span>}
    </button>
  );
}
