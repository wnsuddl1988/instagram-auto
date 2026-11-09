import type {
  ApprovedDetailedScriptSessionSnapshot,
  AssetAcquisitionMode,
  CharacterMotionTag,
  EvidenceNumberRecord,
  RightsReviewState,
  SceneCardDraft,
  SceneVisualPlan,
  VisualCostClass,
  VisualProofIssue,
  VisualProofSummary,
  VisualStrategyClass,
  VisualStrategyType,
} from "./contracts";

export const EVIDENCE_FIRST_VISUAL_STRATEGIES = [
  "number_text_motion",
  "chart_comparison",
  "official_source_card",
  "timeline",
  "relationship_diagram",
  "map",
] as const satisfies readonly VisualStrategyType[];

export const SUPPORTING_VISUAL_STRATEGIES = [
  "character_motion",
  "generated_image",
  "generated_video",
  "stock_video",
  "direct_upload",
] as const satisfies readonly VisualStrategyType[];

const MANUAL_ONLY_STRATEGIES = new Set<VisualStrategyType>([
  "generated_image",
  "generated_video",
  "stock_video",
  "direct_upload",
]);

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function numbersForScene(
  scene: SceneCardDraft,
  snapshot: ApprovedDetailedScriptSessionSnapshot,
): readonly EvidenceNumberRecord[] {
  return scene.provenance.numberRefs
    .map((numberId) => snapshot.evidencePack.numbers.find((entry) => entry.numberId === numberId))
    .filter((entry): entry is EvidenceNumberRecord => entry !== undefined);
}

function compatibleNumbers(records: readonly EvidenceNumberRecord[]): readonly EvidenceNumberRecord[] {
  if (records.length < 2) return [];
  const first = records[0];
  return records.filter((entry) => entry.unit === first.unit && entry.currency === first.currency);
}

function sceneDates(
  scene: SceneCardDraft,
  snapshot: ApprovedDetailedScriptSessionSnapshot,
): readonly { readonly evidenceRef: string; readonly date: string; readonly label: string }[] {
  const entries: { evidenceRef: string; date: string; label: string }[] = [];
  for (const numberRef of scene.provenance.numberRefs) {
    const record = snapshot.evidencePack.numbers.find((entry) => entry.numberId === numberRef);
    const date = record?.asOf.match(/^(\d{4}-\d{2}-\d{2})/u)?.[1];
    if (record && date) entries.push({ evidenceRef: numberRef, date, label: record.context });
  }
  for (const sourceRef of scene.provenance.sourceRefs) {
    const source = snapshot.evidencePack.sources.find((entry) => entry.sourceId === sourceRef);
    const value = source?.eventDate ?? source?.publishedAt ?? "";
    const date = value.match(/^(\d{4}-\d{2}-\d{2})/u)?.[1];
    if (source && date) entries.push({ evidenceRef: sourceRef, date, label: source.title });
  }
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.date)) return false;
    seen.add(entry.date);
    return true;
  });
}

function defaultStrategy(
  scene: SceneCardDraft,
  snapshot: ApprovedDetailedScriptSessionSnapshot,
): VisualStrategyType {
  const numbers = numbersForScene(scene, snapshot);
  if (compatibleNumbers(numbers).length >= 2) return "chart_comparison";
  if (numbers.length >= 1) return "number_text_motion";
  if (sceneDates(scene, snapshot).length >= 2) return "timeline";
  if (scene.provenance.sourceRefs.length >= 1) return "official_source_card";
  return "relationship_diagram";
}

function strategyClass(strategy: VisualStrategyType): VisualStrategyClass {
  if ((EVIDENCE_FIRST_VISUAL_STRATEGIES as readonly VisualStrategyType[]).includes(strategy)) return "evidence_first";
  if (strategy === "character_motion") return "supporting";
  return "illustrative";
}

function acquisitionMode(strategy: VisualStrategyType): AssetAcquisitionMode {
  if (strategy === "generated_image") return "manual_ai_image";
  if (strategy === "generated_video") return "manual_ai_video";
  if (strategy === "stock_video") return "manual_stock";
  if (strategy === "direct_upload") return "direct_upload_required";
  return "deterministic_overlay";
}

function costClass(strategy: VisualStrategyType): VisualCostClass {
  if (strategy === "generated_image") return "medium_estimate";
  if (strategy === "generated_video") return "high_estimate";
  if (strategy === "stock_video") return "medium_estimate";
  if (strategy === "direct_upload") return "unknown_estimate";
  return "none_estimate";
}

function rightsState(strategy: VisualStrategyType): RightsReviewState {
  return MANUAL_ONLY_STRATEGIES.has(strategy) ? "pending_manual_review" : "not_required";
}

function visualPrompt(scene: SceneCardDraft): string {
  return [
    "Supporting illustration only; do not add people, institutions, events, logos, trademarks, or factual details.",
    `Scene purpose: ${scene.purpose}`,
    `Narration context: ${scene.narration}`,
    `Evidence labels: ${scene.evidenceRefs.join(", ") || "none"}`,
  ].join("\n");
}

export function createSceneVisualPlanForStrategy(
  scene: SceneCardDraft,
  snapshot: ApprovedDetailedScriptSessionSnapshot,
  strategy: VisualStrategyType,
  previous?: SceneVisualPlan,
): SceneVisualPlan {
  const numbers = numbersForScene(scene, snapshot);
  const comparable = compatibleNumbers(numbers);
  const dates = sceneDates(scene, snapshot);
  const sources = scene.provenance.sourceRefs
    .map((sourceId) => snapshot.evidencePack.sources.find((entry) => entry.sourceId === sourceId))
    .filter((entry) => entry !== undefined);
  const manual = MANUAL_ONLY_STRATEGIES.has(strategy);
  const promptDraft = strategy === "generated_image" || strategy === "generated_video"
    ? previous?.generationPromptDraft ?? visualPrompt(scene)
    : null;
  const characterMotion = scene.characterMotion as CharacterMotionTag;
  return {
    sceneId: scene.sceneId,
    sceneRevision: { ...scene.provenance.sceneRevision },
    primaryStrategy: strategy,
    primaryStrategyClass: strategyClass(strategy),
    secondaryStrategies: characterMotion === "none" || strategy === "character_motion" ? [] : ["character_motion"],
    acquisitionMode: acquisitionMode(strategy),
    evidenceRefs: [...scene.evidenceRefs],
    sourceRefs: [...scene.provenance.sourceRefs],
    numberRefs: [...scene.provenance.numberRefs],
    chartPlan: strategy === "chart_comparison" ? {
      numberRefs: comparable.map((entry) => entry.numberId),
      labels: comparable.map((entry) => entry.context),
      unit: comparable[0]?.unit ?? "",
      comparisonMode: "side_by_side",
    } : null,
    sourceCardPlan: strategy === "official_source_card" ? {
      sourceRefs: sources.map((entry) => entry.sourceId),
      publisherLabels: sources.map((entry) => entry.publisher),
      downloadExpected: false,
    } : null,
    timelinePlan: strategy === "timeline" ? { entries: dates.map((entry) => ({ ...entry })) } : null,
    relationshipDiagramPlan: strategy === "relationship_diagram" ? {
      labels: unique([scene.purpose, scene.keyCaption]),
      evidenceRefs: [...scene.evidenceRefs],
      inventedCausalityAllowed: false,
    } : null,
    generatedImagePlan: strategy === "generated_image" ? {
      promptDraft: promptDraft ?? "",
      illustrativeOnly: true,
      actualGenerationRequested: false,
    } : null,
    generatedVideoPlan: strategy === "generated_video" ? {
      promptDraft: promptDraft ?? "",
      illustrativeOnly: true,
      actualGenerationRequested: false,
    } : null,
    stockVideoPlan: strategy === "stock_video" ? {
      contextRequirement: previous?.stockContextRequirement ?? scene.purpose,
      searchRequested: false,
      illustrativeOnly: true,
    } : null,
    directUploadPlan: strategy === "direct_upload" ? {
      requirement: previous?.directUploadRequirement ?? "향후 직접 제공할 보조 자산이 필요합니다.",
      uploadRequested: false,
    } : null,
    characterMotionTag: characterMotion,
    cameraMotion: scene.cameraOrScreenMotion,
    textMotion: scene.provenance.numberRefs.length > 0 ? "number_emphasis" : "caption_reveal",
    generationPromptDraft: promptDraft,
    stockContextRequirement: strategy === "stock_video" ? previous?.stockContextRequirement ?? scene.purpose : null,
    directUploadRequirement: strategy === "direct_upload" ? previous?.directUploadRequirement ?? "향후 직접 제공할 보조 자산이 필요합니다." : null,
    costClass: costClass(strategy),
    requiresOwnerApproval: manual,
    ownerApprovalConfirmed: manual && previous?.requiresOwnerApproval === true ? previous.ownerApprovalConfirmed : false,
    rightsReviewState: manual
      ? previous?.requiresOwnerApproval === true && previous.rightsReviewState === "reviewed_for_planning"
        ? "reviewed_for_planning"
        : rightsState(strategy)
      : "not_required",
    visualProofClass: "STRUCTURAL_PRECHECK_ONLY",
    warnings: [],
    blockingIssues: [],
  };
}

export function buildVisualAssetPlan(
  sceneCards: readonly SceneCardDraft[],
  approvedSnapshot: ApprovedDetailedScriptSessionSnapshot,
): readonly SceneVisualPlan[] {
  return sceneCards.map((scene) => createSceneVisualPlanForStrategy(scene, approvedSnapshot, defaultStrategy(scene, approvedSnapshot)));
}

export function summarizeVisualProof(issues: readonly VisualProofIssue[]): VisualProofSummary {
  const blockingIssueCount = issues.filter((entry) => entry.blocking).length;
  return {
    valid: blockingIssueCount === 0,
    blockingIssueCount,
    warningCount: issues.length - blockingIssueCount,
    verificationLevel: "STRUCTURAL_PRECHECK_ONLY",
    issues: issues.map((entry) => ({ ...entry })),
  };
}

export function validateVisualAssetPlan(
  plan: readonly SceneVisualPlan[],
  sceneCards: readonly SceneCardDraft[],
  approvedSnapshot: ApprovedDetailedScriptSessionSnapshot,
): VisualProofSummary {
  const issues: VisualProofIssue[] = [];
  const sourceIds = new Set(approvedSnapshot.evidencePack.sources.map((entry) => entry.sourceId));
  const numberIds = new Set(approvedSnapshot.evidencePack.numbers.map((entry) => entry.numberId));
  const sceneIds = sceneCards.map((entry) => entry.sceneId);
  const planIds = plan.map((entry) => entry.sceneId);
  const add = (code: string, sceneId: string | null, fieldPath: string, message: string, blocking = true): void => {
    issues.push({ code, sceneId, fieldPath, message, blocking });
  };

  if (sceneIds.length !== planIds.length || !sceneIds.every((sceneId) => planIds.includes(sceneId))) {
    add("visual_scene_id_mismatch", null, "/visualPlan", "Visual Plan과 Scene Card의 scene ID 집합이 다릅니다.");
  }
  const enabledCount = sceneCards.filter((entry) => entry.enabled).length;
  if (enabledCount < 7) add("enabled_scene_count_below_minimum", null, "/sceneCards", "활성 장면이 7개 미만입니다.");

  for (const [index, visual] of plan.entries()) {
    const path = `/visualPlan/${index}`;
    const scene = sceneCards.find((entry) => entry.sceneId === visual.sceneId);
    if (!scene) {
      add("unknown_visual_scene", visual.sceneId, path, "대응하는 Scene Card가 없습니다.");
      continue;
    }
    if (!visual.primaryStrategy) add("missing_primary_strategy", scene.sceneId, `${path}/primaryStrategy`, "primary strategy를 선택하세요.");
    if (visual.sceneRevision.value !== scene.provenance.sceneRevision.value) add("scene_revision_mismatch", scene.sceneId, `${path}/sceneRevision`, "Scene Card revision과 Visual Plan이 다릅니다.");
    for (const sourceRef of visual.sourceRefs) if (!sourceIds.has(sourceRef)) add("unsupported_visual_source_ref", scene.sceneId, `${path}/sourceRefs`, `지원되지 않는 source ref: ${sourceRef}`);
    for (const numberRef of visual.numberRefs) if (!numberIds.has(numberRef)) add("unsupported_visual_number_ref", scene.sceneId, `${path}/numberRefs`, `지원되지 않는 number ref: ${numberRef}`);
    if (!scene.enabled) continue;

    const evidenceFirst = (EVIDENCE_FIRST_VISUAL_STRATEGIES as readonly VisualStrategyType[]).includes(visual.primaryStrategy);
    if (scene.evidenceRefs.length > 0 && !evidenceFirst) add("factual_scene_requires_evidence_first_visual", scene.sceneId, `${path}/primaryStrategy`, "사실 장면의 primary는 evidence-first여야 합니다.");
    if (visual.primaryStrategy === "character_motion") add("character_cannot_be_primary_proof", scene.sceneId, `${path}/primaryStrategy`, "캐릭터 모션은 secondary layer만 허용됩니다.");
    if (["generated_image", "generated_video", "stock_video"].includes(visual.primaryStrategy)) add("illustrative_visual_cannot_be_only_proof", scene.sceneId, `${path}/primaryStrategy`, "AI·stock 자산은 유일한 visual proof가 될 수 없습니다.");

    if (visual.primaryStrategy === "chart_comparison") {
      const records = numbersForScene(scene, approvedSnapshot);
      if (compatibleNumbers(records).length < 2 || !visual.chartPlan || visual.chartPlan.numberRefs.length < 2) add("incompatible_chart_plan", scene.sceneId, `${path}/chartPlan`, "차트에는 호환되는 number ref가 2개 이상 필요합니다.");
    }
    if (visual.primaryStrategy === "official_source_card" && (!visual.sourceCardPlan || visual.sourceCardPlan.sourceRefs.length < 1)) add("source_card_requires_source", scene.sceneId, `${path}/sourceCardPlan`, "source card에는 source ref가 필요합니다.");
    if (visual.primaryStrategy === "timeline" && (!visual.timelinePlan || new Set(visual.timelinePlan.entries.map((entry) => entry.date)).size < 2)) add("timeline_requires_two_dates", scene.sceneId, `${path}/timelinePlan`, "timeline에는 서로 다른 date evidence가 2개 이상 필요합니다.");
    if (visual.primaryStrategy === "map") add("map_location_evidence_required", scene.sceneId, `${path}/primaryStrategy`, "location evidence contract가 없어 map을 승인할 수 없습니다.");

    const manualStrategies = [visual.primaryStrategy, ...visual.secondaryStrategies].filter((entry) => MANUAL_ONLY_STRATEGIES.has(entry));
    const manualAcquisition = visual.acquisitionMode !== "deterministic_overlay";
    if (manualStrategies.length > 0 || manualAcquisition) {
      if (!visual.requiresOwnerApproval) add("manual_plan_owner_approval_flag_required", scene.sceneId, `${path}/requiresOwnerApproval`, "AI·stock·direct upload 계획에는 Owner 승인 표시가 필요합니다.");
      if (!visual.ownerApprovalConfirmed) add("paid_possible_owner_approval_missing", scene.sceneId, `${path}/ownerApprovalConfirmed`, "비용 가능성이 있는 계획의 Owner 확인이 필요합니다.");
      if (visual.rightsReviewState !== "reviewed_for_planning") add("rights_review_unresolved", scene.sceneId, `${path}/rightsReviewState`, "수동 자산의 rights structural review가 미결정입니다.");
      for (const strategy of unique(manualStrategies)) add(`${strategy}_planned_warning`, scene.sceneId, `${path}/primaryStrategy`, `${strategy}는 계획 메타데이터이며 실제 자산은 생성되지 않습니다.`, false);
      if (manualStrategies.length === 0) add("manual_acquisition_planned_warning", scene.sceneId, `${path}/acquisitionMode`, "manual acquisition은 계획 메타데이터이며 실제 작업은 실행되지 않습니다.", false);
      add("cost_estimate_uncertain", scene.sceneId, `${path}/costClass`, "cost class는 실제 가격 조회가 아닌 추정 등급입니다.", false);
    }
    if (visual.secondaryStrategies.includes("character_motion")) add("character_occupancy_review", scene.sceneId, `${path}/secondaryStrategies`, "캐릭터가 자료·숫자를 가리지 않는지 향후 확인해야 합니다.", false);
    if (visual.primaryStrategy === "chart_comparison" && (visual.chartPlan?.labels.length ?? 0) > 4) add("chart_label_density", scene.sceneId, `${path}/chartPlan`, "차트 label 밀도를 향후 확인하세요.", false);
  }

  return summarizeVisualProof(issues);
}
