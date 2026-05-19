import type { CSSProperties, ReactNode } from "react";

export type SessionTypeKey = "T" | "V" | "A" | "PERS" | "AL" | "SICK" | "WFH" | "OFF" | "WKND";

type Props = {
  t: SessionTypeKey | (string & {});
  children?: ReactNode;
  style?: CSSProperties;
};

export function TypeBlock({ t, children, style }: Props) {
  return (
    <span className="tblk" data-t={t} style={style}>
      {children ?? t}
    </span>
  );
}
