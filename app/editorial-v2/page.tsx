import { notFound } from "next/navigation";

import EditorialV2Workbench from "../../components/editorial-v2/EditorialV2Workbench";
import { isEditorialV2Enabled } from "../../lib/editorial-v2/feature-flag";

export default function EditorialV2Page() {
  if (!isEditorialV2Enabled()) {
    notFound();
  }

  return <EditorialV2Workbench />;
}
