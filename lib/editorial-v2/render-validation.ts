import type {
  ApprovedCharacterMotionSessionSnapshot,
  ApprovedScenePlanningSessionSnapshot,
  RenderManifest,
  RenderManifestValidationIssue,
  RenderManifestValidationSummary,
  SubtitleValidationSummary,
  VoicePlanValidationSummary,
} from "./contracts";
import { buildSceneRenderFingerprint, hashRenderManifest, RENDER_PROFILES } from "./render-manifest";

export interface ValidateRenderManifestContext {
  readonly approvedPlanning: ApprovedScenePlanningSessionSnapshot;
  readonly approvedCharacterMotion: ApprovedCharacterMotionSessionSnapshot;
  readonly voiceValidation: VoicePlanValidationSummary;
  readonly subtitleValidation: SubtitleValidationSummary;
}

function hasUnsafePhysicalLocation(value: string): boolean {
  return /^(?:[a-z]:[\\/]|file:\/\/|\.\.[\\/]|[\\/]{2})/iu.test(value);
}

function hasNetworkUrl(value: string): boolean {
  return /^(?:https?|wss?):\/\//iu.test(value);
}

export function validateRenderManifest(
  manifest: RenderManifest,
  context: ValidateRenderManifestContext,
): readonly RenderManifestValidationIssue[] {
  const issues: RenderManifestValidationIssue[] = [];
  const add = (code: string, sceneId: string | null, fieldPath: string, message: string, blocking = true): void => {
    issues.push({ code, sceneId, fieldPath, message, blocking });
  };
  if (!context.approvedPlanning) add("approved_planning_missing", null, "approvedPlanning", "Approved Scene Planning snapshot이 필요합니다.");
  if (!context.approvedCharacterMotion) add("approved_character_missing", null, "approvedCharacterMotion", "Approved Character Motion snapshot이 필요합니다.");
  if (manifest.sourcePlanningIdentity !== context.approvedCharacterMotion.sourcePlanningIdentity) add("planning_identity_mismatch", null, "sourcePlanningIdentity", "Character와 manifest의 planning identity가 다릅니다.");
  if (manifest.sourceScriptHash !== context.approvedPlanning.approvedScriptNormalizedHash) add("script_identity_mismatch", null, "sourceScriptHash", "Manifest script identity가 approved script와 다릅니다.");
  if (manifest.selectedAngleId !== context.approvedPlanning.selectedAngleId) add("angle_identity_mismatch", null, "selectedAngleId", "Manifest angle identity가 approved planning과 다릅니다.");
  if (manifest.selectedCharacterDirectionId !== context.approvedCharacterMotion.selectedDirectionId) add("character_identity_mismatch", null, "selectedCharacterDirectionId", "Manifest character direction이 approved character와 다릅니다.");
  if (manifest.enabledSceneCount < 7 || manifest.enabledSceneCount > 10) add("enabled_scene_count_outside_range", null, "enabledSceneCount", "활성 장면 수는 7–10이어야 합니다.");
  if (!context.voiceValidation.valid) add("voice_validation_blocking", null, "voicePlan", "Voice plan blocking issue가 남아 있습니다.");
  if (!context.subtitleValidation.valid) add("subtitle_validation_blocking", null, "subtitleTrack", "Subtitle plan blocking issue가 남아 있습니다.");
  if (manifest.voicePlan.mode === "existing_external_provider" && !manifest.voicePlan.ownerApprovalConfirmed) add("external_provider_unapproved", null, "voicePlan/ownerApprovalConfirmed", "외부 voice provider 계획은 Owner 확인이 필요합니다.");
  if (manifest.voicePlan.actualRequestExecuted || manifest.voicePlan.audioCreated || manifest.renderExecuted || manifest.audioCreated || manifest.externalRequestsMade) add("execution_state_forbidden", null, "renderExecuted", "TTS/audio/render/network 실행 상태는 Slice 6에서 허용되지 않습니다.");
  if (manifest.subtitleTrack.alignmentStatus !== "estimated_not_audio_aligned" || manifest.subtitleTrack.audioAlignmentPerformed) add("subtitle_alignment_false_claim", null, "subtitleTrack/alignmentStatus", "Subtitle를 audio-aligned로 표시할 수 없습니다.");
  if (manifest.productionReady || manifest.integrationReadiness !== "INTEGRATION_PRECHECK_ONLY") add("production_ready_false_claim", null, "productionReady", "Manifest는 integration precheck이며 production-ready가 아닙니다.");
  const expectedProfile = RENDER_PROFILES.find((entry) => entry.profileId === manifest.profile.profileId);
  if (!expectedProfile || JSON.stringify(expectedProfile) !== JSON.stringify(manifest.profile)) add("render_profile_mismatch", null, "profile", "Render profile이 고정 preview/final 계약과 다릅니다.");
  if (manifest.profile.final && manifest.profile.executionAllowed) add("final_profile_execution_forbidden", null, "profile/executionAllowed", "Final 1080×1920 실행은 금지됩니다.");
  if (manifest.manifestHash !== hashRenderManifest(manifest)) add("manifest_hash_invalid", null, "manifestHash", "Manifest hash가 현재 내용과 일치하지 않습니다.");

  const approvedSceneIds = new Set(context.approvedPlanning.sceneCards.map((scene) => scene.sceneId));
  const seen = new Set<string>();
  manifest.scenes.forEach((scene, index) => {
    const path = `scenes/${index}`;
    if (!approvedSceneIds.has(scene.sceneId)) add("unknown_scene_id", scene.sceneId, `${path}/sceneId`, "Approved planning에 없는 scene입니다.");
    if (seen.has(scene.sceneId)) add("duplicate_render_scene", scene.sceneId, `${path}/sceneId`, "Render scene ID가 중복됩니다.");
    seen.add(scene.sceneId);
    if (scene.enabled && scene.durationSeconds <= 0) add("scene_duration_invalid", scene.sceneId, `${path}/durationSeconds`, "활성 장면 duration은 양수여야 합니다.");
    if (scene.enabled && !manifest.voicePlan.scenes.some((voiceScene) => voiceScene.sceneId === scene.sceneId)) add("scene_voice_missing", scene.sceneId, `${path}/voice`, "활성 장면 voice request가 없습니다.");
    if (scene.enabled && !manifest.subtitleTrack.scenePlans.some((subtitleScene) => subtitleScene.sceneId === scene.sceneId)) add("scene_subtitle_missing", scene.sceneId, `${path}/subtitle`, "활성 장면 subtitle plan이 없습니다.");
    const primaryLayers = scene.layers.filter((entry) => entry.layerType === "primary_visual");
    if (scene.enabled && primaryLayers.length !== 1) add("primary_visual_layer_missing", scene.sceneId, `${path}/layers`, "활성 장면에는 정확히 하나의 primary visual layer가 필요합니다.");
    if (scene.enabled && primaryLayers.some((entry) => !entry.resolved)) add("required_visual_unresolved", scene.sceneId, `${path}/layers/primary_visual`, "필수 primary visual이 해결되지 않았습니다.");
    if (scene.characterIsPrimaryVisual || scene.primaryVisualStrategy === "character_motion") add("character_only_primary_forbidden", scene.sceneId, `${path}/primaryVisualStrategy`, "Character는 primary visual이 될 수 없습니다.");
    if (scene.characterOccupancyPercent > scene.characterOccupancyTargetPercent) add("character_occupancy_over_target", scene.sceneId, `${path}/characterOccupancyPercent`, "Character occupancy가 direction target을 넘습니다.");
    if (scene.characterOverlapsSubtitleSafeZone) add("character_subtitle_safe_zone_overlap", scene.sceneId, `${path}/characterOverlapsSubtitleSafeZone`, "Character guide가 subtitle safe zone과 겹칩니다.");
    if (scene.characterIntrudesPrimarySafeZone) add("character_primary_safe_zone_intrusion", scene.sceneId, `${path}/characterIntrudesPrimarySafeZone`, "Character가 chart/number/source primary safe zone을 침범합니다.");
    if (!scene.obstructionPolicySatisfied) add("character_obstruction_policy_violation", scene.sceneId, `${path}/obstructionPolicySatisfied`, "Character evidence obstruction policy를 만족하지 않습니다.");
    if (scene.characterOccupancyTargetPercent > 0 && scene.characterOccupancyPercent >= scene.characterOccupancyTargetPercent * 0.85) add("character_occupancy_near_limit", scene.sceneId, `${path}/characterOccupancyPercent`, "Character occupancy가 target의 85% 이상입니다.", false);
    if (scene.captionDensityClass === "dense") add("caption_density_warning", scene.sceneId, `${path}/captionDensityClass`, "Caption density가 높아 frame 검증이 필요합니다.", false);
    if (scene.evidenceDensityClass === "dense") add("evidence_density_warning", scene.sceneId, `${path}/evidenceDensityClass`, "Chart/source/number density가 높아 frame 검증이 필요합니다.", false);
    if (scene.structuralSafeAreaPrecheck !== "STRUCTURAL_SAFE_AREA_PRECHECK") add("safe_area_precheck_missing", scene.sceneId, `${path}/structuralSafeAreaPrecheck`, "Structural safe-area precheck label이 필요합니다.");
    if (scene.acquisitionMode !== "deterministic_overlay") add("manual_visual_asset_missing", scene.sceneId, `${path}/acquisitionMode`, "수동/AI/stock visual은 실제 asset이 없어 unresolved 상태입니다.");
    if (scene.acquisitionMode === "direct_upload_required") add("manual_upload_required_warning", scene.sceneId, `${path}/acquisitionMode`, "향후 수동 upload asset이 필요하며 현재 file input이나 asset은 없습니다.", false);
    const visual = context.approvedPlanning.visualPlan.find((entry) => entry.sceneId === scene.sceneId);
    if (visual?.requiresOwnerApproval && !visual.ownerApprovalConfirmed) add("paid_visual_owner_approval_missing", scene.sceneId, `${path}/ownerApprovalConfirmed`, "비용 가능 visual plan에 Owner 확인이 없습니다.");
    if (visual?.requiresOwnerApproval && visual.rightsReviewState !== "reviewed_for_planning") add("visual_rights_unresolved", scene.sceneId, `${path}/rightsReviewState`, "수동 visual의 rights review가 해결되지 않았습니다.");
    if (visual?.costClass === "unknown_estimate") add("visual_cost_unknown", scene.sceneId, `${path}/costClass`, "Visual 비용 등급이 unknown입니다.", false);
    if (["generated_image", "generated_video", "stock_video"].includes(scene.primaryVisualStrategy)) add("ai_stock_manual_warning", scene.sceneId, `${path}/primaryVisualStrategy`, "AI/stock asset은 아직 생성·확보되지 않았습니다.", false);
    scene.layers.forEach((entry, layerIndex) => {
      if (hasUnsafePhysicalLocation(entry.logicalUri)) add("physical_file_path_forbidden", scene.sceneId, `${path}/layers/${layerIndex}/logicalUri`, "물리 file path는 manifest에 포함할 수 없습니다.");
      if (hasNetworkUrl(entry.logicalUri)) add("network_url_forbidden", scene.sceneId, `${path}/layers/${layerIndex}/logicalUri`, "Network URL은 manifest에 포함할 수 없습니다.");
      if (!entry.logicalUri.startsWith("asset://")) add("logical_uri_scheme_invalid", scene.sceneId, `${path}/layers/${layerIndex}/logicalUri`, "Layer는 asset:// logical URI만 사용합니다.");
      if (entry.required && !entry.resolved) add("required_layer_unresolved", scene.sceneId, `${path}/layers/${layerIndex}/resolved`, "필수 layer가 unresolved입니다.");
      if (entry.layerType === "character" && entry.role === "primary") add("character_layer_primary_forbidden", scene.sceneId, `${path}/layers/${layerIndex}/role`, "Character layer role은 primary일 수 없습니다.");
    });
    const { fingerprint: _fingerprint, ...withoutFingerprint } = scene;
    const expectedFingerprint = buildSceneRenderFingerprint({
      scene: withoutFingerprint,
      voicePlan: manifest.voicePlan,
      subtitleTrack: manifest.subtitleTrack,
      characterDirectionId: manifest.selectedCharacterDirectionId,
      profile: manifest.profile,
    });
    if (scene.fingerprint.fingerprint !== expectedFingerprint.fingerprint) add("scene_fingerprint_invalid", scene.sceneId, `${path}/fingerprint`, "Scene fingerprint가 현재 입력과 일치하지 않습니다.");
  });
  if (manifest.enabledSceneCount !== manifest.scenes.filter((scene) => scene.enabled).length) add("enabled_scene_count_mismatch", null, "enabledSceneCount", "enabledSceneCount가 manifest scenes와 다릅니다.");
  if (Math.abs(manifest.totalDurationSeconds - manifest.subtitleTrack.targetDurationSeconds) > 0.01) add("manifest_duration_mismatch", null, "totalDurationSeconds", "Manifest와 subtitle target duration이 다릅니다.");
  add("tts_not_connected_warning", null, "voicePlan", "TTS provider는 연결·호출되지 않았습니다.", false);
  if (manifest.voicePlan.costEstimateClass === "unknown") add("voice_cost_unknown_warning", null, "voicePlan/costEstimateClass", "Voice 비용 근거가 없어 unknown으로 유지됩니다.", false);
  add("subtitle_estimated_warning", null, "subtitleTrack", "Subtitle timing은 estimated_not_audio_aligned입니다.", false);
  add("renderer_complexity_unverified", null, "scenes", "Transitions/layer composition complexity는 runtime render로 검증되지 않았습니다.", false);
  if (manifest.profile.final) add("final_profile_metadata_only", null, "profile", "Final profile은 production-intent metadata이며 실행되지 않습니다.", false);
  add("browser_runtime_unverified", null, "integrationReadiness", "브라우저 UI와 실제 frame은 검증되지 않았습니다.", false);
  return issues;
}

export function summarizeRenderManifestValidation(
  issues: readonly RenderManifestValidationIssue[],
): RenderManifestValidationSummary {
  const blockingIssueCount = issues.filter((issue) => issue.blocking).length;
  return {
    valid: blockingIssueCount === 0,
    blockingIssueCount,
    warningCount: issues.length - blockingIssueCount,
    verificationLevel: "INTEGRATION_PRECHECK_ONLY",
    issues: issues.map((issue) => ({ ...issue })),
  };
}

export function canApproveRenderIntegration(
  manifest: RenderManifest | null,
  renderValidation: RenderManifestValidationSummary | null,
  voiceValidation: VoicePlanValidationSummary | null,
  subtitleValidation: SubtitleValidationSummary | null,
): boolean {
  return Boolean(
    manifest
    && renderValidation?.valid
    && renderValidation.blockingIssueCount === 0
    && voiceValidation?.valid
    && voiceValidation.blockingIssueCount === 0
    && subtitleValidation?.valid
    && subtitleValidation.blockingIssueCount === 0
    && !manifest.renderExecuted
    && !manifest.audioCreated
    && !manifest.externalRequestsMade
    && !manifest.productionReady,
  );
}
