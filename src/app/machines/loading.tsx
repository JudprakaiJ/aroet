import { SkeletonAppBar, SkeletonRow, Skeleton } from "@/components/primitives/skeleton";

export default function MachinesLoading() {
  return (
    <>
      <SkeletonAppBar title="Machines" />
      <div className="scroll md:hidden">
        <div className="page-px" style={{ paddingBottom: 8 }}>
          <Skeleton height={40} radius={10} />
        </div>
        <div className="card" style={{ margin: "8px 14px", overflow: "hidden" }}>
          <SkeletonRow count={6} />
        </div>
      </div>
      <div className="dt-body hidden md:block">
        <div className="dt-panel">
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--line-2)" }}>
            <Skeleton width={360} height={34} radius={7} />
          </div>
          <SkeletonRow count={8} />
        </div>
      </div>
    </>
  );
}
