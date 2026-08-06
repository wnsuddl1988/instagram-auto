"use client";

import { useCallback, useState } from "react";

import type {
  ApprovedCharacterMotionSessionSnapshot,
  ApprovedDetailedScriptSessionSnapshot,
  ApprovedRenderIntegrationSessionSnapshot,
  ApprovedScenePlanningSessionSnapshot,
  ApprovedTrendBriefSessionSnapshot,
} from "../../lib/editorial-v2/contracts";
import CharacterMotionWorkbench from "./CharacterMotionWorkbench";
import EditorialIntelligenceWorkbench from "./EditorialIntelligenceWorkbench";
import ResearchImportWorkbench from "./ResearchImportWorkbench";
import RenderIntegrationWorkbench from "./RenderIntegrationWorkbench";
import ScenePlanningWorkbench from "./ScenePlanningWorkbench";

export default function EditorialV2Workbench() {
  const [approvedSnapshot, setApprovedSnapshot] = useState<ApprovedTrendBriefSessionSnapshot | null>(null);
  const [approvedScriptSnapshot, setApprovedScriptSnapshot] = useState<ApprovedDetailedScriptSessionSnapshot | null>(null);
  const [approvedPlanningSnapshot, setApprovedPlanningSnapshot] = useState<ApprovedScenePlanningSessionSnapshot | null>(null);
  const [approvedCharacterSnapshot, setApprovedCharacterSnapshot] = useState<ApprovedCharacterMotionSessionSnapshot | null>(null);
  const [approvedRenderSnapshot, setApprovedRenderSnapshot] = useState<ApprovedRenderIntegrationSessionSnapshot | null>(null);
  const intelligenceKey = approvedSnapshot
    ? `${approvedSnapshot.rawHash}:${approvedSnapshot.normalizedHash}`
    : "no-approved-trend-brief";
  const planningKey = approvedScriptSnapshot
    ? `${approvedScriptSnapshot.scriptNormalizedHash}:${approvedScriptSnapshot.evidenceIdentity}`
    : "no-approved-detailed-script";
  const characterKey = approvedPlanningSnapshot
    ? `${approvedPlanningSnapshot.approvedScriptNormalizedHash}:${approvedPlanningSnapshot.evidenceIdentity}:${approvedPlanningSnapshot.selectedAngleId}:${approvedPlanningSnapshot.sceneCards.map((scene) => `${scene.sceneId}:${scene.provenance.sceneRevision.value}`).join("|")}`
    : "no-approved-scene-planning";
  const renderKey = approvedCharacterSnapshot
    ? `${approvedCharacterSnapshot.sourcePlanningIdentity}:${approvedCharacterSnapshot.selectedDirectionId}:${approvedCharacterSnapshot.sceneMotionAssignments.map((assignment) => `${assignment.sceneId}:${assignment.motionTag}:${assignment.intensity}:${assignment.enabled}`).join("|")}`
    : "no-approved-character-motion";

  const handleApprovedTrendBriefChange = useCallback((snapshot: ApprovedTrendBriefSessionSnapshot | null): void => {
    setApprovedSnapshot(snapshot);
    setApprovedScriptSnapshot(null);
    setApprovedPlanningSnapshot(null);
    setApprovedCharacterSnapshot(null);
    setApprovedRenderSnapshot(null);
  }, []);

  const handleApprovedScriptChange = useCallback((snapshot: ApprovedDetailedScriptSessionSnapshot | null): void => {
    setApprovedScriptSnapshot(snapshot);
    setApprovedPlanningSnapshot(null);
    setApprovedCharacterSnapshot(null);
    setApprovedRenderSnapshot(null);
  }, []);

  const handleApprovedPlanningChange = useCallback((snapshot: ApprovedScenePlanningSessionSnapshot | null): void => {
    setApprovedPlanningSnapshot(snapshot);
    setApprovedCharacterSnapshot(null);
    setApprovedRenderSnapshot(null);
  }, []);

  const handleApprovedCharacterChange = useCallback((snapshot: ApprovedCharacterMotionSessionSnapshot | null): void => {
    setApprovedCharacterSnapshot(snapshot);
    setApprovedRenderSnapshot(null);
  }, []);

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
          onApprovedScriptChange={handleApprovedScriptChange}
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
          onApprovedScenePlanningChange={handleApprovedPlanningChange}
        />
      )}
      <aside aria-live="polite" style={{ maxWidth: 1180, margin: "24px auto 0", padding: "0 24px" }}>
        <strong>Character Motion session-only 연결:</strong>{" "}
        {approvedPlanningSnapshot
          ? "승인된 Scene Planning snapshot이 Character Motion 비교 단계로 전달됐습니다. upstream 변경 시 character state 전체가 무효화됩니다."
          : "승인된 Scene and Visual Planning이 없어 Character Motion Workbench가 잠겨 있습니다."}
        <p>브라우저 내 SVG prototype이며 network·persistence·asset export·render는 없습니다.</p>
      </aside>
      {approvedPlanningSnapshot && (
        <CharacterMotionWorkbench
          key={characterKey}
          approvedScenePlanningSnapshot={approvedPlanningSnapshot}
          onApprovedCharacterMotionChange={handleApprovedCharacterChange}
        />
      )}
      <aside aria-live="polite" style={{ maxWidth: 1180, margin: "24px auto 0", padding: "0 24px" }}>
        <strong>Render Integration session-only 연결:</strong>{" "}
        {approvedCharacterSnapshot
          ? "승인된 Character Motion snapshot이 Voice·Subtitle·Render Integration planning에 전달됐습니다. upstream 변경 시 render package 전체가 무효화됩니다."
          : "승인된 Character Motion Package가 없어 Render Integration Workbench가 잠겨 있습니다."}
        <p>External TTS·audio/asset 생성·실제 user-content/final render·network·persistence는 없습니다. Synthetic preview proof는 checker 통과 후 별도 local CLI에서만 1회 허용됩니다.</p>
        <p>현재 Render Integration approval: {approvedRenderSnapshot ? "SESSION_ONLY_APPROVED" : "NOT_APPROVED"}</p>
      </aside>
      {approvedPlanningSnapshot && approvedCharacterSnapshot && (
        <RenderIntegrationWorkbench
          key={renderKey}
          approvedScenePlanningSnapshot={approvedPlanningSnapshot}
          approvedCharacterMotionSnapshot={approvedCharacterSnapshot}
          onApprovedRenderIntegrationChange={setApprovedRenderSnapshot}
        />
      )}
    </div>
  );
}
