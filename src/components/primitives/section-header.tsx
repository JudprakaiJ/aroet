import type { ReactNode } from "react";

type Props = {
  title: ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
};

export function SectionHeader({ title, action }: Props) {
  return (
    <div className="sec-h">
      <h2>{title}</h2>
      {action &&
        (action.href ? (
          <a href={action.href} className="more">
            {action.label}
          </a>
        ) : (
          <button type="button" className="more" onClick={action.onClick}>
            {action.label}
          </button>
        ))}
    </div>
  );
}
