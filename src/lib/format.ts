export const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
  planned:     { bg: "#DBEAFE", text: "#1E40AF", label: "Planned" },
  in_progress: { bg: "#FEF3C7", text: "#92400E", label: "In progress" },
  verified:    { bg: "#D1FAE5", text: "#065F46", label: "Verified" },
  completed:   { bg: "#D1FAE5", text: "#065F46", label: "Completed" },
  canceled:    { bg: "#F1F5F9", text: "#64748B", label: "Canceled" },
};

export const activityBadge: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  field:    { bg: "#E6F1FB", text: "#185FA5", label: "Field",    icon: "🔧" },
  travel:   { bg: "#FBEAF0", text: "#993556", label: "Travel",   icon: "✈" },
  remote:   { bg: "#EEEDFE", text: "#5B21B6", label: "Remote",   icon: "💻" },
  training: { bg: "#FAEEDA", text: "#6B3D04", label: "Training", icon: "📘" },
  upgrade:  { bg: "#D1FAE5", text: "#065F46", label: "Upgrade",  icon: "⬆" },
  office:   { bg: "#F1F5F9", text: "#475569", label: "Office",   icon: "🏢" },
};

export const referenceTypeBadge: Record<string, { bg: string; text: string; label: string }> = {
  CS:       { bg: "#DDEBF7", text: "#185FA5", label: "CS" },
  GI:       { bg: "#FAEEDA", text: "#6B3D04", label: "GI" },
  GT:       { bg: "#FAEEDA", text: "#6B3D04", label: "GT" },
  INVOICE:  { bg: "#FBEAF0", text: "#993556", label: "Invoice" },
  QUOTE:    { bg: "#EEEDFE", text: "#5B21B6", label: "Quote" },
  SHIPMENT: { bg: "#F1F5F9", text: "#475569", label: "Shipment" },
  OTHER:    { bg: "#F1F5F9", text: "#475569", label: "Other" },
};

export const adminEventLabel: Record<string, string> = {
  invoice_sent:         "Invoice sent",
  acceptance_signed:    "Acceptance signed",
  acceptance_pending:   "Acceptance pending",
  rs_report_done:       "RS Report done",
  service_report_done:  "Service Report done",
  is_done:              "Intervention Sheet done",
  post_mail:            "Post mail",
  case_closed:          "Case closed",
  waiting_parts:        "Waiting parts",
  meeting:              "Meeting",
  phone_call:           "Phone call",
  other:                "Other",
};

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

export function fmtDateLong(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtDay(d: string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function fmtTime(min: number | null | undefined): string {
  if (!min) return "0";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h${m.toString().padStart(2, "0")}`;
  if (h) return `${h}h`;
  return `${m}m`;
}
