"use client";

import { useState } from "react";

import type { ApprovedTrendBriefSessionSnapshot } from "../../lib/editorial-v2/contracts";
import EditorialIntelligenceWorkbench from "./EditorialIntelligenceWorkbench";
import ResearchImportWorkbench from "./ResearchImportWorkbench";

export default function EditorialV2Workbench() {
  const [approvedSnapshot, setApprovedSnapshot] = useState<ApprovedTrendBriefSessionSnapshot | null>(null);
  const intelligenceKey = approvedSnapshot
    ? `${approvedSnapshot.rawHash}:${approvedSnapshot.normalizedHash}`
    : "no-approved-trend-brief";

  return (
    <div>
      <ResearchImportWorkbench onApprovedImportChange={setApprovedSnapshot} />
      <aside aria-live="polite" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px" }}>
        <strong>Session-only 연결:</strong>{" "}
        {approvedSnapshot
          ? "승인된 Trend Brief가 Intelligence 단계로 전달됐습니다. 입력이 바뀌면 downstream 전체가 무효화됩니다."
          : "승인된 Trend Brief가 없어 Intelligence 단계가 잠겨 있습니다."}
        <p>네트워크 요청과 영구 저장은 없습니다.</p>
      </aside>
      {approvedSnapshot && (
        <EditorialIntelligenceWorkbench
          key={intelligenceKey}
          approvedSnapshot={approvedSnapshot}
        />
      )}
    </div>
  );
}
