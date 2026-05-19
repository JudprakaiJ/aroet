export type CaseStatus = "planned" | "in_progress" | "completed" | "verified" | "canceled";

const LABELS: Record<CaseStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  completed: "Completed",
  verified: "Verified",
  canceled: "Canceled",
};

export function StatusPill({ s }: { s: CaseStatus | (string & {}) }) {
  const label = (LABELS as Record<string, string>)[s] ?? s;
  return (
    <span className="status" data-s={s}>
      <span className="d" />
      {label}
    </span>
  );
}
