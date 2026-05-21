import { SkeletonAppBar, SkeletonRow, Skeleton } from "@/components/primitives/skeleton";

export default function CasesLoading() {
  return (
    <>
      <SkeletonAppBar title="Cases" />
      {/* Mobile */}
      <div className="scroll md:hidden">
        <div className="page-px" style={{ paddingBottom: 8, paddingTop: 4 }}>
          <Skeleton height={40} radius={10} />
        </div>
        <div className="chiprail">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} width={72} height={32} radius={999} />
          ))}
        </div>
        <div className="card" style={{ margin: "8px 14px", overflow: "hidden" }}>
          <SkeletonRow count={6} />
        </div>
      </div>
      {/* Desktop */}
      <div className="dt-body hidden md:block">
        <div className="dt-panel">
          <div className="dt-filters">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} width={70} height={26} radius={6} />
            ))}
          </div>
          <SkeletonRow count={8} />
        </div>
      </div>
    </>
  );
}
