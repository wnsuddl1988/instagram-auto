import type {
  LocalPreviewProbeStreamSummary,
  LocalPreviewRenderInput,
  LocalPreviewRenderMetadata,
  LocalPreviewRenderRequest,
  LocalPreviewValidationIssue,
  LocalPreviewValidationSummary,
} from "./local-preview-contracts";
import {
  LOCAL_PREVIEW_MAX_OUTPUT_BYTES,
  LOCAL_PREVIEW_PROFILE_ID,
} from "./local-preview-contracts";

const REQUEST_KEYS = new Set([
  "expectedProjectRevision",
  "expectedRenderCheckpointHash",
  "profile",
  "ownerLocalPreviewConfirmation",
]);

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function issue(code: string, fieldPath: string, message: string, blocking = true, sceneId: string | null = null): LocalPreviewValidationIssue {
  return { code, fieldPath, message, blocking, sceneId };
}

export function validateLocalPreviewRequest(value: unknown): readonly LocalPreviewValidationIssue[] {
  const issues: LocalPreviewValidationIssue[] = [];
  if (!isRecord(value)) return [issue("request_object_required", "$request", "Preview render request는 JSON object여야 합니다.")];
  for (const key of Object.keys(value)) {
    if (!REQUEST_KEYS.has(key)) issues.push(issue("client_content_or_path_forbidden", key, "Identifier 외 client content/path field는 허용되지 않습니다."));
  }
  if (!Number.isSafeInteger(value.expectedProjectRevision) || Number(value.expectedProjectRevision) < 0) issues.push(issue("project_revision_invalid", "expectedProjectRevision", "Project revision은 0 이상의 정수여야 합니다."));
  if (typeof value.expectedRenderCheckpointHash !== "string" || !/^[a-f0-9]{64}$/u.test(value.expectedRenderCheckpointHash)) issues.push(issue("render_checkpoint_hash_invalid", "expectedRenderCheckpointHash", "Canonical Render checkpoint SHA-256이 필요합니다."));
  if (value.profile !== LOCAL_PREVIEW_PROFILE_ID) issues.push(issue("final_profile_forbidden", "profile", "preview_540x960 profile만 허용됩니다."));
  if (value.ownerLocalPreviewConfirmation !== true) issues.push(issue("owner_local_preview_confirmation_required", "ownerLocalPreviewConfirmation", "로컬 Preview 경계에 대한 Owner 확인이 필요합니다."));
  return issues;
}

export function parseLocalPreviewRenderRequest(value: unknown): LocalPreviewRenderRequest {
  const issues = validateLocalPreviewRequest(value);
  if (issues.some((entry) => entry.blocking)) throw new Error(issues.map((entry) => entry.code).join(","));
  const record = value as Readonly<Record<string, unknown>>;
  return {
    expectedProjectRevision: Number(record.expectedProjectRevision),
    expectedRenderCheckpointHash: String(record.expectedRenderCheckpointHash),
    profile: LOCAL_PREVIEW_PROFILE_ID,
    ownerLocalPreviewConfirmation: true,
  };
}

export function validateLocalPreviewInput(input: LocalPreviewRenderInput): readonly LocalPreviewValidationIssue[] {
  const issues: LocalPreviewValidationIssue[] = [];
  if (input.createdFromCanonicalApprovedCheckpoints !== true) issues.push(issue("canonical_approved_checkpoint_authority_required", "createdFromCanonicalApprovedCheckpoints", "Canonical approved checkpoint만 render source가 될 수 있습니다."));
  if (!Number.isSafeInteger(input.projectRevision) || input.projectRevision < 0) issues.push(issue("project_revision_invalid", "projectRevision", "Project revision이 유효하지 않습니다."));
  if (!/^[a-f0-9]{64}$/u.test(input.projectIntegrityHash) || !/^[a-f0-9]{64}$/u.test(input.renderCheckpointHash)) issues.push(issue("checkpoint_identity_invalid", "sourceCheckpointHashes", "Project/checkpoint identity가 SHA-256 형식이 아닙니다."));
  if (input.profile.profileId !== LOCAL_PREVIEW_PROFILE_ID || input.profile.width !== 540 || input.profile.height !== 960 || input.profile.fps !== 30) issues.push(issue("preview_profile_invalid", "profile", "540×960, 30fps preview profile만 허용됩니다."));
  if (input.profile.actualFinal !== false || input.profile.productionReady !== false) issues.push(issue("production_boundary_false_claim", "profile", "Local preview를 final/production-ready로 표시할 수 없습니다."));
  if (input.profile.audioMode !== "silent_placeholder") issues.push(issue("actual_audio_forbidden", "profile.audioMode", "PA-3 audio는 silent placeholder만 허용됩니다."));
  if (input.profile.subtitleAlignment !== "estimated_not_audio_aligned") issues.push(issue("subtitle_alignment_false_claim", "profile.subtitleAlignment", "Subtitle은 estimated_not_audio_aligned여야 합니다."));
  if (input.sceneCount !== input.scenes.length || input.sceneCount < 7 || input.sceneCount > 10) issues.push(issue("enabled_scene_count_invalid", "scenes", "활성 장면은 7~10개여야 합니다."));
  if (input.durationMs !== input.scenes.reduce((total, scene) => total + scene.durationMs, 0)) issues.push(issue("duration_total_mismatch", "durationMs", "Scene duration 합계가 일치하지 않습니다."));
  const ids = new Set<string>();
  input.scenes.forEach((scene, index) => {
    const base = `scenes/${index}`;
    if (ids.has(scene.sceneId)) issues.push(issue("scene_id_duplicate", `${base}/sceneId`, "Scene ID가 중복됐습니다.", true, scene.sceneId));
    ids.add(scene.sceneId);
    if (scene.order !== index + 1) issues.push(issue("scene_order_unstable", `${base}/order`, "Scene order는 1부터 연속이어야 합니다.", true, scene.sceneId));
    if (!Number.isSafeInteger(scene.durationMs) || scene.durationMs < 500 || scene.durationMs > 60_000) issues.push(issue("scene_duration_invalid", `${base}/durationMs`, "Scene duration 범위가 유효하지 않습니다.", true, scene.sceneId));
    if (!scene.narration.trim() || !scene.keyCaption.trim()) issues.push(issue("scene_content_missing", base, "Approved narration과 key caption이 필요합니다.", true, scene.sceneId));
    if (!scene.primaryVisualStrategy) issues.push(issue("primary_visual_missing", `${base}/primaryVisualStrategy`, "Primary visual strategy가 필요합니다.", true, scene.sceneId));
    if (scene.primaryVisualStrategy === "character_motion") issues.push(issue("character_primary_only_forbidden", `${base}/primaryVisualStrategy`, "Character는 evidence의 secondary layer여야 합니다.", true, scene.sceneId));
    if (scene.safeAreaState !== "structural_precheck_pass") issues.push(issue("safe_area_structural_blocker", `${base}/safeAreaState`, "Safe-area structural blocker가 남아 있습니다.", true, scene.sceneId));
    if (scene.sourceRefs.some((ref) => !scene.sources.some((source) => source.sourceId === ref))) issues.push(issue("source_ref_mismatch", `${base}/sourceRefs`, "Source ref가 canonical evidence metadata와 일치하지 않습니다.", true, scene.sceneId));
    if (scene.numberRefs.some((ref) => !scene.numbers.some((number) => number.numberId === ref))) issues.push(issue("number_ref_mismatch", `${base}/numberRefs`, "Number ref가 canonical evidence metadata와 일치하지 않습니다.", true, scene.sceneId));
    if (scene.estimatedSubtitleCues.length === 0 || scene.estimatedSubtitleCues.some((cue) => cue.alignmentStatus !== "estimated_not_audio_aligned")) issues.push(issue("estimated_subtitle_invalid", `${base}/estimatedSubtitleCues`, "Estimated subtitle cue가 누락되거나 false claim입니다.", true, scene.sceneId));
    if (scene.rightsState === "pending_manual_review") issues.push(issue("unresolved_asset_rights_warning", `${base}/rightsState`, "외부 asset rights는 미해결 상태이며 placeholder로만 표시됩니다.", false, scene.sceneId));
    if (scene.unresolvedAssets.length > 0) issues.push(issue("preview_placeholder_warning", `${base}/unresolvedAssets`, "미해결 asset은 Preview placeholder로만 표시됩니다.", false, scene.sceneId));
  });
  issues.push(issue("silent_placeholder_audio_warning", "profile.audioMode", "실제 TTS/음성이 아닌 silent placeholder입니다.", false));
  issues.push(issue("estimated_subtitle_warning", "profile.subtitleAlignment", "Subtitle timing은 audio-aligned가 아닌 추정값입니다.", false));
  issues.push(issue("character_motion_proxy_warning", "selectedCharacterDirection", "Character motion은 preview proxy이며 production animation이 아닙니다.", false));
  issues.push(issue("runtime_variance_warning", "$runtime", "System font와 Chromium rendering은 환경별 차이가 있을 수 있습니다.", false));
  issues.push(issue("source_existence_unverified_warning", "$provenance", "PA-3는 persisted metadata를 표시하며 실제 source 존재를 다시 확인하지 않습니다.", false));
  return issues;
}

export function validateLocalPreviewOutput(
  metadata: LocalPreviewRenderMetadata,
  probe: LocalPreviewProbeStreamSummary = metadata.probe,
): readonly LocalPreviewValidationIssue[] {
  const issues: LocalPreviewValidationIssue[] = [];
  if (metadata.status !== "completed" || metadata.schemaVersion !== "local-preview-metadata-v1") issues.push(issue("output_metadata_invalid", "metadata", "Completed metadata schema가 올바르지 않습니다."));
  if (metadata.profile !== LOCAL_PREVIEW_PROFILE_ID || metadata.width !== 540 || metadata.height !== 960 || metadata.fps !== 30) issues.push(issue("output_profile_mismatch", "metadata.profile", "출력 profile이 540×960/30fps가 아닙니다."));
  if (metadata.productionReady !== false || metadata.productionAnimation !== false || metadata.characterMotionProxy !== true) issues.push(issue("output_production_false_claim", "metadata", "Preview output을 production 결과로 표시할 수 없습니다."));
  if (metadata.audioMode !== "silent_placeholder" || metadata.subtitleAlignment !== "estimated_not_audio_aligned") issues.push(issue("output_audio_subtitle_false_claim", "metadata", "Silent audio/estimated subtitle 경계가 올바르지 않습니다."));
  if (!/^[a-f0-9]{64}$/u.test(metadata.outputSha256) || metadata.outputBytes <= 0 || metadata.outputBytes > LOCAL_PREVIEW_MAX_OUTPUT_BYTES) issues.push(issue("output_size_or_hash_invalid", "metadata.outputSha256", "출력 hash/size가 유효하지 않습니다."));
  if (!probe.video || !probe.audio || !probe.subtitle) issues.push(issue("ffprobe_stream_missing", "probe", "Video/audio/subtitle stream이 모두 필요합니다."));
  if (probe.width !== 540 || probe.height !== 960 || Math.abs(probe.fps - 30) > 0.1) issues.push(issue("ffprobe_profile_mismatch", "probe", "ffprobe profile이 540×960/30fps와 일치하지 않습니다."));
  const tolerance = Math.max(1_000, metadata.durationMs * 0.03);
  if (Math.abs(probe.durationMs - metadata.durationMs) > tolerance) issues.push(issue("ffprobe_duration_mismatch", "probe.durationMs", "ffprobe duration이 예상 범위를 벗어났습니다."));
  return issues;
}

export function summarizeLocalPreviewValidation(issues: readonly LocalPreviewValidationIssue[]): LocalPreviewValidationSummary {
  const blockingIssueCount = issues.filter((entry) => entry.blocking).length;
  return {
    valid: blockingIssueCount === 0,
    blockingIssueCount,
    warningCount: issues.length - blockingIssueCount,
    level: "LOCAL_USER_CONTENT_PREVIEW_ONLY",
    issues: issues.map((entry) => ({ ...entry })),
  };
}
