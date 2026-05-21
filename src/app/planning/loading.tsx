import { SkeletonAppBar, Skeleton } from "@/components/primitives/skeleton";

export default function PlanningLoading() {
  return (
    <>
      <SkeletonAppBar title="Planning" />
      <div className="scroll md:hidden">
        <div className="page-px" style={{ paddingBottom: 8, display: "flex", gap: 8 }}>
          <Skeleton width={44} height={44} radius={10} />
          <Skeleton height={44} radius={10} style={{ flex: 1 }} />
          <Skeleton width={44} height={44} radius={10} />
        </div>
        <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 6 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={56} radius={10} />
          ))}
        </div>
      </div>
      <div className="dt-body hidden md:block">
        <div className="dt-panel">
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line-2)", display: "flex", gap: 8 }}>
            <Skeleton width={120} height={28} radius={6} />
            <Skeleton width={80} height={28} radius={6} />
            <Skeleton width={80} height={28} radius={6} />
          </div>
          <div style={{ padding: 14, display: "grid", gridTemplateColumns: "100px repeat(7, 1fr)", gap: 6 }}>
            {Array.from({ length: 40 }).map((_, i) => (
              <Skeleton key={i} height={48} radius={6} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
