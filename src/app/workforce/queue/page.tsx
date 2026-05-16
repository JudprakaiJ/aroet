import { redirect } from "next/navigation";

export default async function QueueRedirect({
  searchParams,
}: {
  searchParams: Promise<{ engineer?: string; status?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ tab: "queue" });
  if (params.engineer) qs.set("engineer", params.engineer);
  if (params.status) qs.set("status", params.status);
  redirect(`/workforce?${qs.toString()}`);
}
