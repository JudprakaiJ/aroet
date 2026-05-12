import { getReparseCounts } from "./actions";
import BulkReparseForm from "./form";

export const dynamic = "force-dynamic";

export default async function BulkReparsePage() {
  const counts = await getReparseCounts();
  return <BulkReparseForm counts={counts} />;
}
