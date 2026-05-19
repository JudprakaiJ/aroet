import { findServiceType } from "@/lib/service-types";

type Props = {
  typ: string | null | undefined;
  full?: boolean;
};

export function ServiceChip({ typ, full }: Props) {
  const t = findServiceType(typ);
  if (!t) return null;
  return (
    <span className="chip chip-soft">
      {full ? `${t.code} · ${t.name}` : t.short}
    </span>
  );
}
