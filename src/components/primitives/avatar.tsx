import type { CSSProperties } from "react";

type Props = {
  code: string;
  size?: number;
};

export function Avatar({ code, size }: Props) {
  const style: CSSProperties | undefined = size
    ? { width: size, height: size, fontSize: size * 0.4 }
    : undefined;
  return (
    <span className="avatar" data-tone={code} style={style}>
      {code}
    </span>
  );
}
