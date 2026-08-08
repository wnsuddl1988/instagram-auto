"use client";

import { useCallback, useMemo, useState } from "react";

import type {
  ApprovedCharacterMotionSessionSnapshot,
  ApprovedDetailedScriptSessionSnapshot,
  ApprovedPublishIntegrationSessionSnapshot,
  ApprovedRelaunchReadinessSessionSnapshot,
  ApprovedRenderIntegrationSessionSnapshot,
  ApprovedScenePlanningSessionSnapshot,
  ApprovedTrendBriefSessionSnapshot,
  EditorialV2ApprovedStageId,
  EditorialV2JsonValue,
} from "../../lib/editorial-v2/contracts";
import type { EditorialV2ApprovedCheckpointOption } from "../../lib/editorial-v2/persistence-contracts";
import CharacterMotionWorkbench from "./CharacterMotionWorkbench";
import EditorialIntelligenceWorkbench from "./EditorialIntelligenceWorkbench";
import ResearchImportWorkbench from "./ResearchImportWorkbench";
import PublishIntegrationWorkbench from "./PublishIntegrationWorkbench";
import ProjectWorkspacePanel from "./ProjectWorkspacePanel";
import RenderIntegrationWorkbench from "./RenderIntegrationWorkbench";
import SampleRelaunchWorkbench from "./SampleRelaunchWorkbench";
import ScenePlanningWorkbench from "./ScenePlanningWorkbench";

export default function EditorialV2Workbench() {
  const [approvedSnapshot, setApprovedSnapshot] = useState<ApprovedTrendBriefSessionSnapshot | null>(null);
  const [approvedScriptSnapshot, setApprovedScriptSnapshot] = useState<ApprovedDetailedScriptSessionSnapshot | null>(null);
  const [approvedPlanningSnapshot, setApprovedPlanningSnapshot] = useState<ApprovedScenePlanningSessionSnapshot | null>(null);
  const [approvedCharacterSnapshot, setApprovedCharacterSnapshot] = useState<ApprovedCharacterMotionSessionSnapshot | null>(null);
  const [approvedRenderSnapshot, setApprovedRenderSnapshot] = useState<ApprovedRenderIntegrationSessionSnapshot | null>(null);
  const [approvedPublishSnapshot, setApprovedPublishSnapshot] = useState<ApprovedPublishIntegrationSessionSnapshot | null>(null);
  const [approvedRelaunchSnapshot, setApprovedRelaunchSnapshot] = useState<ApprovedRelaunchReadinessSessionSnapshot | null>(null);
  const approvedCheckpointOptions = useMemo((): readonly EditorialV2ApprovedCheckpointOption[] => {
    const options: EditorialV2ApprovedCheckpointOption[] = [];
    const payload = (value: unknown): EditorialV2JsonValue => JSON.parse(JSON.stringify(value)) as EditorialV2JsonValue;
    if (approvedSnapshot) options.push({ stageId: "trend_brief_import", label: "Trend Brief Import", sourceIdentity: `${approvedSnapshot.rawHash}:${approvedSnapshot.normalizedHash}`, payload: payload(approvedSnapshot) });
    if (approvedScriptSnapshot) options.push({ stageId: "editorial_intelligence", label: "Editorial Intelligence / Script", sourceIdentity: `${approvedScriptSnapshot.scriptNormalizedHash}:${approvedScriptSnapshot.evidenceIdentity}`, payload: payload(approvedScriptSnapshot) });
    if (approvedPlanningSnapshot) options.push({ stageId: "scene_planning", label: "Scene Planning", sourceIdentity: `${approvedPlanningSnapshot.approvedScriptNormalizedHash}:${approvedPlanningSnapshot.selectedAngleId}`, payload: payload(approvedPlanningSnapshot) });
    if (approvedCharacterSnapshot) options.push({ stageId: "character_motion", label: "Character Motion", sourceIdentity: `${approvedCharacterSnapshot.sourcePlanningIdentity}:${approvedCharacterSnapshot.selectedDirectionId}`, payload: payload(approvedCharacterSnapshot) });
    if (approvedRenderSnapshot) options.push({ stageId: "render_integration", label: "Render Integration", sourceIdentity: `${approvedRenderSnapshot.renderManifest.manifestHash}:${approvedRenderSnapshot.bridgePlan.manifestHash}`, payload: payload(approvedRenderSnapshot) });
    if (approvedPublishSnapshot) options.push({ stageId: "publish_integration", label: "Publish Integration", sourceIdentity: `${approvedPublishSnapshot.publishPackage.packageId}:${approvedPublishSnapshot.publishPackage.renderManifestHash}`, payload: payload(approvedPublishSnapshot) });
    if (approvedRelaunchSnapshot) options.push({ stageId: "relaunch_readiness", label: "Relaunch Readiness", sourceIdentity: `${approvedRelaunchSnapshot.sourcePublishIntegrationIdentity}:${approvedRelaunchSnapshot.relaunchPackage.packageId}`, payload: payload(approvedRelaunchSnapshot) });
    return options;
  }, [approvedCharacterSnapshot, approvedPlanningSnapshot, approvedPublishSnapshot, approvedRelaunchSnapshot, approvedRenderSnapshot, approvedScriptSnapshot, approvedSnapshot]);
  const currentSessionStage = (approvedCheckpointOptions.at(-1)?.stageId ?? null) as EditorialV2ApprovedStageId | null;
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
  const publishKey = approvedRenderSnapshot
    ? `${approvedRenderSnapshot.renderManifest.manifestHash}:${approvedRenderSnapshot.voicePlan.sourceScriptHash}:${approvedRenderSnapshot.subtitleTrack.sourceScriptHash}:${approvedRenderSnapshot.bridgePlan.manifestHash}`
    : "no-approved-render-integration";
  const sampleRelaunchKey = approvedPublishSnapshot
    ? `${approvedPublishSnapshot.publishPackage.packageId}:${approvedPublishSnapshot.publishPackage.renderManifestHash}:${approvedPublishSnapshot.publishPackage.platformPackages.map((entry) => `${entry.platformId}:${entry.dedupeKey.value}`).join("|")}`
    : "no-approved-publish-integration";

  const handleApprovedTrendBriefChange = useCallback((snapshot: ApprovedTrendBriefSessionSnapshot | null): void => {
    setApprovedSnapshot(snapshot);
    setApprovedScriptSnapshot(null);
    setApprovedPlanningSnapshot(null);
    setApprovedCharacterSnapshot(null);
    setApprovedRenderSnapshot(null);
    setApprovedPublishSnapshot(null);
    setApprovedRelaunchSnapshot(null);
  }, []);

  const handleApprovedScriptChange = useCallback((snapshot: ApprovedDetailedScriptSessionSnapshot | null): void => {
    setApprovedScriptSnapshot(snapshot);
    setApprovedPlanningSnapshot(null);
    setApprovedCharacterSnapshot(null);
    setApprovedRenderSnapshot(null);
    setApprovedPublishSnapshot(null);
    setApprovedRelaunchSnapshot(null);
  }, []);

  const handleApprovedPlanningChange = useCallback((snapshot: ApprovedScenePlanningSessionSnapshot | null): void => {
    setApprovedPlanningSnapshot(snapshot);
    setApprovedCharacterSnapshot(null);
    setApprovedRenderSnapshot(null);
    setApprovedPublishSnapshot(null);
    setApprovedRelaunchSnapshot(null);
  }, []);

  const handleApprovedCharacterChange = useCallback((snapshot: ApprovedCharacterMotionSessionSnapshot | null): void => {
    setApprovedCharacterSnapshot(snapshot);
    setApprovedRenderSnapshot(null);
    setApprovedPublishSnapshot(null);
    setApprovedRelaunchSnapshot(null);
  }, []);

  const handleApprovedRenderChange = useCallback((snapshot: ApprovedRenderIntegrationSessionSnapshot | null): void => {
    setApprovedRenderSnapshot(snapshot);
    setApprovedPublishSnapshot(null);
    setApprovedRelaunchSnapshot(null);
  }, []);

  const handleApprovedPublishChange = useCallback((snapshot: ApprovedPublishIntegrationSessionSnapshot | null): void => {
    setApprovedPublishSnapshot(snapshot);
    setApprovedRelaunchSnapshot(null);
  }, []);

  return (
    <div>
      <ProjectWorkspacePanel approvedCheckpoints={approvedCheckpointOptions} currentSessionStage={currentSessionStage} />
      <ResearchImportWorkbench onApprovedImportChange={handleApprovedTrendBriefChange} />
      <aside aria-live="polite" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px" }}>
        <strong>Session-only 연결:</strong>{" "}
        {approvedSnapshot
          ? "승인된 Trend Brief가 Intelligence 단계로 전달됐습니다. 입력이 바뀌면 downstream 전체가 무효화됩니다."
          : "승인된 Trend Brief가 없어 Intelligence 단계가 잠겨 있습니다."}
        <p>Workbench 편집 draft의 직접 autosave는 없습니다. 별도 Project Workspace는 Owner가 확인한 승인 checkpoint만 local-only로 저장합니다.</p>
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
      {approvedScriptSnapshot && approvedPlanningSnapshot && approvedCharacterSnapshot && (
        <RenderIntegrationWorkbench
          key={renderKey}
          approvedDetailedScriptSnapshot={approvedScriptSnapshot}
          approvedScenePlanningSnapshot={approvedPlanningSnapshot}
          approvedCharacterMotionSnapshot={approvedCharacterSnapshot}
          onApprovedRenderIntegrationChange={handleApprovedRenderChange}
        />
      )}
      <aside aria-live="polite" style={{ maxWidth: 1180, margin: "24px auto 0", padding: "0 24px" }}>
        <strong>Publish Integration session-only 연결:</strong>{" "}
        {approvedRenderSnapshot
          ? "승인된 Render Integration snapshot이 platform publish planning에 전달됐습니다. upstream 변경 시 identity·metadata·ledger·recovery 전체가 무효화됩니다."
          : "승인된 Render Integration Package가 없어 Publish Integration Workbench가 잠겨 있습니다."}
        <p>실제 계정 API 조회·OAuth·upload·publish·schedule·network·durable persistence는 없습니다.</p>
        <p>현재 Publish Integration approval: {approvedPublishSnapshot ? "SESSION_ONLY_APPROVED" : "NOT_APPROVED"}</p>
      </aside>
      {approvedRenderSnapshot && (
        <PublishIntegrationWorkbench
          key={publishKey}
          approvedRenderIntegrationSnapshot={approvedRenderSnapshot}
          onApprovedPublishIntegrationChange={handleApprovedPublishChange}
        />
      )}
      <aside aria-live="polite" style={{ maxWidth: 1180, margin: "24px auto 0", padding: "0 24px" }}>
        <strong>Representative Sample · Relaunch session-only 연결:</strong>{" "}
        {approvedPublishSnapshot
          ? "승인된 Publish Integration snapshot이 대표 sample과 provisional relaunch planning에 전달됐습니다. upstream 변경 시 Slice 8 state 전체가 무효화됩니다."
          : "승인된 Publish Integration Package가 없어 Slice 8 Sample/Relaunch Workbench가 잠겨 있습니다."}
        <p>Synthetic local proof planning only · network·persistence·actual asset/account change/publish 없음 · final brand와 Production Activation은 ChatGPT Control Tower 승인 대상입니다.</p>
        <p>현재 Relaunch Readiness approval: {approvedRelaunchSnapshot ? "PROVISIONALLY_APPROVED_SESSION_ONLY" : "NOT_APPROVED"}</p>
      </aside>
      {approvedPublishSnapshot && (
        <SampleRelaunchWorkbench
          key={sampleRelaunchKey}
          approvedPublishIntegrationSnapshot={approvedPublishSnapshot}
          onApprovedRelaunchReadinessChange={setApprovedRelaunchSnapshot}
        />
      )}
    </div>
  );
}
