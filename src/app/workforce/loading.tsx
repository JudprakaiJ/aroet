import { SkeletonAppBar, SkeletonRow, Skeleton } from "@/components/primitives/skeleton";

export default function WorkforceLoading() {
  return (
    <>
      <SkeletonAppBar title="Hours" />
      <div className="scroll md:hidden">
        <div className="page-px" style={{ paddingBottom: 8, display: "flex", gap: 8 }}>
          <Skeleton width={44} height={44} radius={10} />
          <Skeleton height={44} radius={10} style={{ flex: 1 }} />
          <Skeleton width={44} height={44} radius={10} />
        </div>
        <div className="page-px" style={{ marginBottom: 12 }}>
          <Skeleton height={88} radius={14} />
        </div>
        <div className="card" style={{ margin: "0 14px 14px", overflow: "hidden" }}>
          <SkeletonRow count={5} />
        </div>
      </div>
      <div className="dt-body hidden md:block">
        <div className="dt-panel" style={{ marginBottom: 14 }}>
          <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={64} radius={10} />
            ))}
          </div>
        </div>
        <div className="dt-panel">
          <SkeletonRow count={8} />
        </div>
      </div>
    </>
  );
}
