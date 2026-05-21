import { SkeletonAppBar, Skeleton } from "@/components/primitives/skeleton";

export default function ChecklistsLoading() {
  return (
    <>
      <SkeletonAppBar title="Checklists" />
      <div className="scroll">
        <div className="page-px" style={{ paddingBottom: 12 }}>
          <Skeleton width={220} height={11} radius={4} />
        </div>
        <div className="page-px" style={{ paddingBottom: 14 }}>
          <Skeleton height={56} radius={10} />
        </div>
        <div className="page-px" style={{ paddingBottom: 24 }}>
          <div className="card" style={{ overflow: "hidden" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  padding: "14px 14px",
                  borderTop: i === 0 ? "none" : "1px solid var(--line-2)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <Skeleton width="40%" height={11} />
                <Skeleton width="65%" height={14} />
                <Skeleton width="50%" height={10} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
