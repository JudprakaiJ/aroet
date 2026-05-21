type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: React.CSSProperties;
};

export function Skeleton({ width = "100%", height = 12, radius = 6, style }: SkeletonProps) {
  return (
    <span
      className="skl"
      style={{
        display: "inline-block",
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

export function SkeletonCard({
  height = 64,
  style,
}: {
  height?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="card"
      style={{
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: height,
        ...style,
      }}
    >
      <Skeleton width="60%" height={12} />
      <Skeleton width="40%" height={10} />
    </div>
  );
}

export function SkeletonRow({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 12,
            padding: "12px 14px",
            borderBottom: "1px solid var(--line-2)",
            background: "var(--surface)",
            alignItems: "center",
          }}
        >
          <Skeleton width={28} height={28} radius={14} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <Skeleton width="55%" height={12} />
            <Skeleton width="35%" height={10} />
          </div>
          <Skeleton width={48} height={10} />
        </div>
      ))}
    </>
  );
}

export function SkeletonAppBar({ title }: { title?: string }) {
  return (
    <>
      <div className="appbar md:hidden">
        <div style={{ flex: 1 }}>
          {title ? (
            <h1>{title}</h1>
          ) : (
            <Skeleton width={140} height={22} radius={6} />
          )}
          <Skeleton width={80} height={11} radius={4} style={{ marginTop: 4 }} />
        </div>
        <Skeleton width={44} height={44} radius={10} />
      </div>
      <div className="dt-top hidden md:block">
        <div style={{ display: "flex", alignItems: "center", height: "100%", gap: 14, padding: "0 18px" }}>
          {title ? (
            <span className="title">{title}</span>
          ) : (
            <Skeleton width={160} height={17} />
          )}
          <Skeleton width={120} height={11} style={{ marginLeft: 4 }} />
        </div>
      </div>
    </>
  );
}
