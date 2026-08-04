"use client";

import { useState } from "react";

import type {
  ApprovedDetailedScriptSessionSnapshot,
  ApprovedTrendBriefSessionSnapshot,
} from "../../lib/editorial-v2/contracts";
import EditorialIntelligenceWorkbench from "./EditorialIntelligenceWorkbench";
import ResearchImportWorkbench from "./ResearchImportWorkbench";
import ScenePlanningWorkbench from "./ScenePlanningWorkbench";

export default function EditorialV2Workbench() {
  const [approvedSnapshot, setApprovedSnapshot] = useState<ApprovedTrendBriefSessionSnapshot | null>(null);
  const [approvedScriptSnapshot, setApprovedScriptSnapshot] = useState<ApprovedDetailedScriptSessionSnapshot | null>(null);
  const intelligenceKey = approvedSnapshot
    ? `${approvedSnapshot.rawHash}:${approvedSnapshot.normalizedHash}`
    : "no-approved-trend-brief";
  const planningKey = approvedScriptSnapshot
    ? `${approvedScriptSnapshot.scriptNormalizedHash}:${approvedScriptSnapshot.evidenceIdentity}`
    : "no-approved-detailed-script";

  function handleApprovedTrendBriefChange(snapshot: ApprovedTrendBriefSessionSnapshot | null): void {
    setApprovedSnapshot(snapshot);
    setApprovedScriptSnapshot(null);
  }

  return (
    <div>
      <ResearchImportWorkbench onApprovedImportChange={handleApprovedTrendBriefChange} />
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
          onApprovedScriptChange={setApprovedScriptSnapshot}
        />
      )}
      <aside aria-live="polite" style={{ maxWidth: 1180, margin: "24px auto 0", padding: "0 24px" }}>
        <strong>Scene Planning session-only 연결:</strong>{" "}
        {approvedScriptSnapshot
          ? "승인된 Detailed Script snapshot이 Scene Planning에 전달됐습니다. upstream 변경 시 planning 전체가 무효화됩니다."
          : "승인된 Detailed Script Package가 없어 Scene Planning이 잠겨 있습니다."}
        <p>실제 자산·렌더·저장·외부 요청은 없습니다.</p>
      </aside>
      {approvedScriptSnapshot && (
        <ScenePlanningWorkbench
          key={planningKey}
          approvedScriptSnapshot={approvedScriptSnapshot}
        />
      )}
    </div>
  );
}
