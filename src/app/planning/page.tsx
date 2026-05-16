import { redirect } from "next/navigation";

export default async function PlanningRedirect({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; weeks?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ tab: "plan" });
  if (params.from) qs.set("from", params.from);
  if (params.weeks) qs.set("weeks", params.weeks);
  redirect(`/workforce?${qs.toString()}`);
}
