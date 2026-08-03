import { notFound } from "next/navigation";

import ResearchImportWorkbench from "../../components/editorial-v2/ResearchImportWorkbench";
import { isEditorialV2Enabled } from "../../lib/editorial-v2/feature-flag";

export default function EditorialV2Page() {
  if (!isEditorialV2Enabled()) {
    notFound();
  }

  return <ResearchImportWorkbench />;
}
