import { SkeletonAppBar, Skeleton, SkeletonRow } from "@/components/primitives/skeleton";

export default function CaseDetailLoading() {
  return (
    <>
      <SkeletonAppBar />
      <div className="scroll md:hidden">
        <div className="page-px" style={{ paddingTop: 4 }}>
          <div className="hero">
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton width={120} height={20} radius={6} />
              <Skeleton width="80%" height={14} />
              <Skeleton width="60%" height={11} />
            </div>
            <Skeleton width={72} height={56} radius={10} />
          </div>
        </div>
        <div className="page-px" style={{ paddingTop: 10 }}>
          <Skeleton height={40} radius={10} />
        </div>
        <div className="card" style={{ margin: "12px 14px", overflow: "hidden" }}>
          <SkeletonRow count={4} />
        </div>
      </div>
      <div className="dt-body hidden md:block">
        <div className="card" style={{ padding: 18, marginBottom: 14 }}>
          <Skeleton width={180} height={20} radius={6} />
          <div style={{ marginTop: 10, display: "flex", gap: 14 }}>
            <Skeleton width="40%" height={12} />
            <Skeleton width="30%" height={12} />
            <Skeleton width="20%" height={12} />
          </div>
        </div>
        <div className="dt-panel">
          <SkeletonRow count={6} />
        </div>
      </div>
    </>
  );
}
