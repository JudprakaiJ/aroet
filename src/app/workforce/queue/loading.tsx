import { SkeletonAppBar, SkeletonRow, Skeleton } from "@/components/primitives/skeleton";

export default function QueueLoading() {
  return (
    <>
      <SkeletonAppBar title="Approvals" />
      <div className="scroll md:hidden">
        <div className="page-px" style={{ paddingBottom: 10 }}>
          <Skeleton width={140} height={11} radius={4} />
        </div>
        {Array.from({ length: 2 }).map((_, g) => (
          <div key={g} style={{ padding: "0 14px", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Skeleton width={28} height={28} radius={14} />
                <Skeleton width={100} height={13} />
              </div>
              <Skeleton width={92} height={32} radius={8} />
            </div>
            <div className="card" style={{ overflow: "hidden" }}>
              <SkeletonRow count={3} />
            </div>
          </div>
        ))}
      </div>
      <div className="dt-body hidden md:block">
        {Array.from({ length: 2 }).map((_, g) => (
          <div key={g} className="dt-panel" style={{ marginBottom: 14 }}>
            <div className="dt-panel-h">
              <Skeleton width={160} height={13} />
              <Skeleton width={120} height={28} radius={6} />
            </div>
            <SkeletonRow count={4} />
          </div>
        ))}
      </div>
    </>
  );
}
