import type {
  ApprovedScenePlanningSessionSnapshot,
  VoiceCostEstimateClass,
  VoicePlanValidationIssue,
  VoicePlanValidationSummary,
  VoiceProviderMode,
  VoiceRequestPlan,
} from "./contracts";

export interface BuildVoiceRequestPlanInput {
  readonly mode: VoiceProviderMode;
  readonly locale: string;
  readonly voiceIdentity: string;
  readonly providerId?: string;
  readonly providerLabel?: string;
  readonly targetDurationSeconds: number;
  readonly manualCostBasisLabel?: string;
  readonly ownerExternalApprovalConfirmed?: boolean;
}

const SUPPORTED_LOCALES = new Set(["ko-KR", "en-US"]);

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function characterCount(value: string): number {
  return [...value.replace(/\s/gu, "")].length;
}

function wordCount(value: string): number {
  return value.trim() === "" ? 0 : value.trim().split(/\s+/u).length;
}

function estimateDurationSeconds(narration: string, locale: string): number {
  const charactersPerSecond = locale === "ko-KR" ? 5.4 : 12;
  return round(Math.max(1, characterCount(narration) / charactersPerSecond));
}

function costClass(input: BuildVoiceRequestPlanInput): VoiceCostEstimateClass {
  if (!input.manualCostBasisLabel?.trim()) return "unknown";
  return input.mode === "existing_external_provider" ? "provider_estimate_unverified" : "manual_basis_only";
}

export function buildVoiceRequestPlan(
  planning: ApprovedScenePlanningSessionSnapshot,
  input: BuildVoiceRequestPlanInput,
): VoiceRequestPlan {
  const enabledScenes = planning.sceneCards.filter((scene) => scene.enabled).sort((left, right) => left.order - right.order);
  const scenes = enabledScenes.map((scene) => ({
    sceneId: scene.sceneId,
    sceneOrder: scene.order,
    narration: scene.narration,
    characterCount: characterCount(scene.narration),
    wordCount: wordCount(scene.narration),
    estimatedDurationSeconds: estimateDurationSeconds(scene.narration, input.locale),
    locale: input.locale,
    voiceIdentity: input.voiceIdentity,
    sourceScriptHash: planning.approvedScriptNormalizedHash,
    executionRequested: false as const,
    executed: false as const,
    audioCreated: false as const,
  }));
  const totalEstimatedDurationSeconds = round(scenes.reduce((total, scene) => total + scene.estimatedDurationSeconds, 0));
  const externalProviderRequired = input.mode === "existing_external_provider";
  const provider = input.mode === "plan_only" && !input.providerId?.trim()
    ? null
    : {
        providerId: input.providerId?.trim() ?? "manual-future",
        displayLabel: input.providerLabel?.trim() ?? (input.mode === "manual_audio_future" ? "Manual audio future" : "Unconfigured provider"),
        mode: input.mode,
        locale: input.locale,
        voiceIdentity: input.voiceIdentity,
        configuredForPlanning: Boolean(input.providerId?.trim()) || input.mode === "manual_audio_future",
        ownerExternalApprovalConfirmed: input.ownerExternalApprovalConfirmed === true,
        actualRequestExecuted: false as const,
        audioCreated: false as const,
      };
  return {
    planVersion: "voice-request-plan-v1",
    sourceScriptHash: planning.approvedScriptNormalizedHash,
    mode: input.mode,
    provider,
    scenes,
    usage: {
      totalCharacters: scenes.reduce((total, scene) => total + scene.characterCount, 0),
      totalWords: scenes.reduce((total, scene) => total + scene.wordCount, 0),
      totalEstimatedDurationSeconds,
      targetDurationSeconds: round(input.targetDurationSeconds),
      durationVarianceSeconds: round(totalEstimatedDurationSeconds - input.targetDurationSeconds),
    },
    costEstimateClass: costClass(input),
    manualCostBasisLabel: input.manualCostBasisLabel?.trim() || null,
    externalProviderRequired,
    requiresOwnerApproval: externalProviderRequired,
    ownerApprovalConfirmed: externalProviderRequired && input.ownerExternalApprovalConfirmed === true,
    actualRequestExecuted: false,
    audioCreated: false,
    productionReady: false,
  };
}

export function validateVoiceRequestPlan(plan: VoiceRequestPlan): readonly VoicePlanValidationIssue[] {
  const issues: VoicePlanValidationIssue[] = [];
  const add = (code: string, sceneId: string | null, fieldPath: string, message: string, blocking = true): void => {
    issues.push({ code, sceneId, fieldPath, message, blocking });
  };
  if (plan.scenes.length === 0) add("voice_scenes_missing", null, "scenes", "활성 장면의 voice request가 없습니다.");
  const seen = new Set<string>();
  plan.scenes.forEach((scene, index) => {
    const path = `scenes/${index}`;
    if (!scene.sceneId.trim()) add("voice_scene_id_missing", null, `${path}/sceneId`, "Voice scene ID가 필요합니다.");
    if (seen.has(scene.sceneId)) add("voice_scene_duplicate", scene.sceneId, `${path}/sceneId`, "Voice scene ID가 중복됩니다.");
    seen.add(scene.sceneId);
    if (!scene.narration.trim()) add("voice_narration_missing", scene.sceneId, `${path}/narration`, "내레이션이 비어 있습니다.");
    if (!scene.voiceIdentity.trim()) add("voice_identity_missing", scene.sceneId, `${path}/voiceIdentity`, "Voice identity가 필요합니다.");
    if (!SUPPORTED_LOCALES.has(scene.locale)) add("voice_locale_unverified", scene.sceneId, `${path}/locale`, "지원 확인되지 않은 locale입니다.", false);
    if (scene.estimatedDurationSeconds < 1) add("voice_duration_too_short", scene.sceneId, `${path}/estimatedDurationSeconds`, "예상 발화 시간이 너무 짧습니다.", false);
    if (scene.executed || scene.audioCreated || scene.executionRequested) add("voice_execution_forbidden", scene.sceneId, path, "Slice 6에서는 TTS 실행과 audio 생성이 금지됩니다.");
  });
  if (plan.mode === "existing_external_provider" && !plan.provider?.configuredForPlanning) add("voice_provider_missing", null, "provider", "외부 provider 참조가 필요합니다.");
  if (plan.mode === "existing_external_provider" && !plan.ownerApprovalConfirmed) add("external_voice_owner_approval_missing", null, "ownerApprovalConfirmed", "외부 provider 사용 계획에는 Owner 확인이 필요합니다.");
  if (plan.actualRequestExecuted || plan.audioCreated) add("voice_plan_execution_forbidden", null, "actualRequestExecuted", "Voice plan은 실행되거나 audio를 만들 수 없습니다.");
  if (plan.usage.targetDurationSeconds <= 0) add("voice_target_duration_invalid", null, "usage/targetDurationSeconds", "목표 길이는 양수여야 합니다.");
  if (Math.abs(plan.usage.durationVarianceSeconds) > Math.max(4, plan.usage.targetDurationSeconds * 0.3)) add("voice_duration_variance_high", null, "usage/durationVarianceSeconds", "예상 발화 길이와 목표 길이 차이가 큽니다.", false);
  if (plan.costEstimateClass !== "unknown" && !plan.manualCostBasisLabel) add("voice_cost_basis_missing", null, "manualCostBasisLabel", "비용 등급 근거가 없으므로 unknown이어야 합니다.");
  if (plan.manualCostBasisLabel && /[$€£₩]|\b(?:usd|krw|eur)\b|\d[\d,.]*\s*원/iu.test(plan.manualCostBasisLabel)) add("actual_price_claim_prohibited", null, "manualCostBasisLabel", "Slice 6에는 실제 가격 수치 주장을 기록할 수 없습니다.");
  return issues;
}

export function summarizeVoicePlanValidation(
  issues: readonly VoicePlanValidationIssue[],
): VoicePlanValidationSummary {
  const blockingIssueCount = issues.filter((issue) => issue.blocking).length;
  return {
    valid: blockingIssueCount === 0,
    blockingIssueCount,
    warningCount: issues.length - blockingIssueCount,
    issues: issues.map((issue) => ({ ...issue })),
  };
}

export function canApproveVoicePlan(summary: VoicePlanValidationSummary | null): boolean {
  return summary?.valid === true && summary.blockingIssueCount === 0;
}
