const LABELS: Record<string, string> = {
  planned: "Planned",
  in_progress: "In progress",
  completed: "Completed",
  verified: "Verified",
  canceled: "Canceled",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className="ar-status" data-s={status}>
      <span className="ar-status-dot" />
      {LABELS[status] ?? status}
    </span>
  );
}
