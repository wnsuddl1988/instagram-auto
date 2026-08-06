import type {
  EditorialV2Namespace,
  EditorialV2SchemaVersion,
} from "./schema-version";

export const EDITORIAL_V2_ARTIFACT_KINDS = [
  "trend_brief",
  "evidence_pack",
  "topic_candidates",
  "topic_evaluation",
  "selected_angle",
  "script_package",
  "scene_cards",
  "visual_asset_plan",
  "voice_subtitle_package",
  "preview_render",
  "final_render",
  "publish_package",
] as const;

export type EditorialV2ArtifactKind = (typeof EDITORIAL_V2_ARTIFACT_KINDS)[number];

export const EDITORIAL_V2_QUALITY_GATES = [
  "Watch Reason Gate",
  "Freshness Gate",
  "Evidence Gate",
  "Claim-to-Source Gate",
  "Genericity Gate",
  "Visual Proof Gate",
  "Retention Gate",
  "Financial Safety Gate",
  "Rights Gate",
  "Brand Consistency Gate",
  "Publish Readiness Gate",
] as const;

export type EditorialV2QualityGate = (typeof EDITORIAL_V2_QUALITY_GATES)[number];
export type ArtifactValidationStatus = "pass" | "fail" | "not_run";
export type ArtifactApprovalStatus = "pending" | "approved" | "rejected" | "invalidated";

export interface ArtifactGateValidation {
  readonly gate: EditorialV2QualityGate;
  readonly status: ArtifactValidationStatus;
  readonly blocking: boolean;
  readonly reason: string;
  readonly evidenceReferences: readonly string[];
  readonly evaluatedAt: string;
}

export interface ArtifactApproval {
  readonly status: ArtifactApprovalStatus;
  readonly reason: string;
  readonly decidedAt: string | null;
  readonly evidenceReferences: readonly string[];
}

export interface ArtifactEnvelope<
  TKind extends EditorialV2ArtifactKind = EditorialV2ArtifactKind,
  TPayload = unknown,
> {
  readonly namespace: EditorialV2Namespace;
  readonly schemaVersion: EditorialV2SchemaVersion;
  readonly artifactId: string;
  readonly projectId: string;
  readonly kind: TKind;
  readonly revision: number;
  readonly contentHash: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly upstreamArtifactIds: readonly string[];
  readonly validation: readonly ArtifactGateValidation[];
  readonly approval: ArtifactApproval;
  readonly payload: TPayload;
}

export interface TrendBriefPayload {
  readonly title: string;
  readonly watchReason: string;
  readonly observedAt: string;
  readonly sourceRefs: readonly string[];
}

export interface EvidenceClaim {
  readonly claimId: string;
  readonly text: string;
  readonly sourceRefs: readonly string[];
  readonly contentHash: string;
}

export interface EvidencePackPayload {
  readonly claims: readonly EvidenceClaim[];
  readonly sourceRefs: readonly string[];
}

export interface TopicCandidate {
  readonly candidateId: string;
  readonly title: string;
  readonly angle: string;
  readonly evidenceRefs: readonly string[];
  readonly sourceSignalId: string;
  readonly angleType: TopicAngleType;
  readonly workingTitle: string;
  readonly hookPromise: string;
  readonly viewerQuestion: string;
  readonly lifeImpact: string;
  readonly claimRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly numberRefs: readonly string[];
  readonly generationRationale: string;
  readonly ordinal: number;
}

export interface TopicCandidatesPayload {
  readonly candidates: readonly TopicCandidate[];
}

export interface TopicEvaluationPayload {
  readonly candidateId: string;
  readonly score: number;
  readonly reasons: readonly string[];
}

export interface SelectedAnglePayload {
  readonly candidateId: string;
  readonly angle: string;
  readonly selectionReason: string;
}

export interface ScriptPackagePayload {
  readonly hook: string;
  readonly narration: readonly string[];
  readonly sourceRefs: readonly string[];
}

export interface SceneCard {
  readonly sceneId: string;
  readonly order: number;
  readonly purpose: string;
  readonly narration: string;
  readonly keyCaption: string;
  readonly evidenceRefs: readonly string[];
  readonly numberOrComparison: string | null;
  readonly visualizationType: string;
  readonly characterMotion: string;
  readonly cameraOrScreenMotion: string;
  readonly transition: string;
  readonly soundEffect: string;
  readonly retentionBeat: string;
  readonly sourceRefs: readonly string[];
  readonly enabled: boolean;
}

export interface SceneCardsPayload {
  readonly scenes: readonly SceneCard[];
}

export interface VisualAssetPlanPayload {
  readonly sceneAssetIds: Readonly<Record<string, readonly string[]>>;
}

export interface VoiceSubtitlePackagePayload {
  readonly voiceProfileId: string;
  readonly subtitleTrackId: string;
  readonly sceneIds: readonly string[];
}

export interface RenderArtifactPayload {
  readonly renderId: string;
  readonly inputArtifactIds: readonly string[];
  readonly outputContentHash: string;
}

export interface PublishPackagePayload {
  readonly destinationProfiles: readonly string[];
  readonly finalRenderArtifactId: string;
  readonly publishApproved: boolean;
}

export interface ArtifactPayloadByKind {
  readonly trend_brief: TrendBriefPayload;
  readonly evidence_pack: EvidencePackPayload;
  readonly topic_candidates: TopicCandidatesPayload;
  readonly topic_evaluation: TopicEvaluationPayload;
  readonly selected_angle: SelectedAnglePayload;
  readonly script_package: ScriptPackagePayload;
  readonly scene_cards: SceneCardsPayload;
  readonly visual_asset_plan: VisualAssetPlanPayload;
  readonly voice_subtitle_package: VoiceSubtitlePackagePayload;
  readonly preview_render: RenderArtifactPayload;
  readonly final_render: RenderArtifactPayload;
  readonly publish_package: PublishPackagePayload;
}

export type EditorialV2Artifact = {
  [TKind in EditorialV2ArtifactKind]: ArtifactEnvelope<TKind, ArtifactPayloadByKind[TKind]>;
}[EditorialV2ArtifactKind];

export interface PromptPackage {
  readonly packageId: string;
  readonly projectId: string;
  readonly promptVersion: string;
  readonly requestedArtifactKind: EditorialV2ArtifactKind;
  readonly instructions: string;
  readonly inputArtifactIds: readonly string[];
  readonly expectedNamespace: EditorialV2Namespace;
  readonly expectedSchemaVersion: EditorialV2SchemaVersion;
  readonly createdAt: string;
}

export const RAW_IMPORTED_RESPONSE_TRUST = "UNTRUSTED_DATA" as const;

export interface RawImportedResponse {
  readonly trust: typeof RAW_IMPORTED_RESPONSE_TRUST;
  readonly packageId: string;
  readonly rawText: string;
  readonly receivedAt: string;
  readonly sourceLabel: string;
}

export interface NormalizedImportedResult<TValue = unknown> {
  readonly packageId: string;
  readonly normalizedAt: string;
  readonly value: TValue;
  readonly warnings: readonly string[];
}

export interface ImportValidationIssue {
  readonly fieldPath: string;
  readonly code: string;
  readonly message: string;
  readonly blocking: boolean;
}

export interface ImportValidationSummary {
  readonly valid: boolean;
  readonly issues: readonly ImportValidationIssue[];
  readonly validatedAt: string;
}

export interface RepairRequest {
  readonly requestId: string;
  readonly packageId: string;
  readonly fieldPaths: readonly string[];
  readonly reason: string;
  readonly requestedAt: string;
}

export interface FieldLevelRepairResult {
  readonly requestId: string;
  readonly fieldPath: string;
  readonly status: "repaired" | "unresolved" | "rejected";
  readonly value: unknown;
  readonly reason: string;
}

export const RESEARCH_WINDOW_PRESETS = ["24h", "7d", "30d"] as const;
export type ResearchWindowPreset = (typeof RESEARCH_WINDOW_PRESETS)[number];
export type TargetDurationSeconds = 30 | 45 | 60;

export interface TrendResearchPromptInput {
  readonly projectId: string;
  readonly researchCutoffDate: string;
  readonly researchWindow: ResearchWindowPreset;
  readonly domain: string;
  readonly audience: string;
  readonly targetDurationSeconds: TargetDurationSeconds;
  readonly additionalFocus?: string;
}

export interface TrendBriefImportSource {
  readonly sourceId: string;
  readonly publisher: string;
  readonly title: string;
  readonly url: string;
  readonly publishedAt: string;
  readonly eventDate: string | null;
}

export interface TrendBriefImportNumber {
  readonly value: number;
  readonly unit: string;
  readonly currency: string | null;
  readonly asOf: string;
  readonly context: string;
}

export interface TrendBriefImportSignal {
  readonly signalId: string;
  readonly headline: string;
  readonly claim: string;
  readonly whyNow: string;
  readonly audienceImpact: string;
  readonly sourceRefs: readonly string[];
  readonly numbers: readonly TrendBriefImportNumber[];
}

export interface TrendBriefImportCandidate {
  readonly schemaVersion: string;
  readonly researchCutoffDate: string;
  readonly researchWindow: ResearchWindowPreset;
  readonly domain: string;
  readonly audience: string;
  readonly targetDurationSeconds: TargetDurationSeconds;
  readonly briefTitle: string;
  readonly executiveSummary: string;
  readonly sources: readonly TrendBriefImportSource[];
  readonly signals: readonly TrendBriefImportSignal[];
}

export type ImportedResponseFormat = "json_object" | "json_array" | "markdown" | "unsupported";
export type ImportNormalizationMethod =
  | "exact_json"
  | "fenced_json"
  | "embedded_json"
  | "structured_markdown"
  | "unsupported";
export type ImportIssueSeverity = "error" | "warning";

export interface ImportIssue {
  readonly code: string;
  readonly severity: ImportIssueSeverity;
  readonly blocking: boolean;
  readonly fieldPath: string;
  readonly message: string;
  readonly repairable: boolean;
}

export interface TrendBriefImportValidationSummary extends ImportValidationSummary {
  readonly issues: readonly ImportIssue[];
  readonly blockingIssueCount: number;
  readonly warningCount: number;
}

export interface FieldRepairOperation {
  readonly path: string;
  readonly value: unknown;
}

export interface FieldRepairPackage {
  readonly repairs: readonly FieldRepairOperation[];
}

export type ImportApprovalState = "not_approved" | "approved" | "invalidated";

export interface ApprovedTrendBriefSessionSnapshot {
  readonly candidate: TrendBriefImportCandidate;
  readonly rawHash: string;
  readonly normalizedHash: string;
  readonly expectedInput: TrendResearchPromptInput;
  readonly validationSummary: TrendBriefImportValidationSummary;
  readonly approvalState: "approved";
}

export type EvidenceVerificationLevel = "structural_only";
export type EvidenceFreshnessClassification = "fresh" | "stale" | "unknown";

export interface EvidenceSourceRecord {
  readonly sourceId: string;
  readonly publisher: string;
  readonly title: string;
  readonly url: string;
  readonly publishedAt: string;
  readonly eventDate: string | null;
  readonly freshness: EvidenceFreshnessClassification;
  readonly originalIndex: number;
}

export interface EvidenceClaimRecord {
  readonly claimId: string;
  readonly signalId: string;
  readonly headline: string;
  readonly claim: string;
  readonly whyNow: string;
  readonly audienceImpact: string;
  readonly sourceRefs: readonly string[];
  readonly numberRefs: readonly string[];
}

export interface EvidenceNumberRecord {
  readonly numberId: string;
  readonly signalId: string;
  readonly value: number;
  readonly unit: string;
  readonly currency: string | null;
  readonly asOf: string;
  readonly context: string;
  readonly sourceRefs: readonly string[];
}

export interface EvidenceSignalCoverage {
  readonly signalId: string;
  readonly sourceCount: number;
  readonly numberCount: number;
  readonly freshSourceCount: number;
}

export interface EvidenceCoverageSummary {
  readonly sourceCount: number;
  readonly signalCount: number;
  readonly numberCount: number;
  readonly freshSourceCount: number;
  readonly signalCoverage: readonly EvidenceSignalCoverage[];
  readonly warnings: readonly string[];
}

export interface EvidencePackProvenance {
  readonly rawHash: string;
  readonly normalizedHash: string;
  readonly researchCutoffDate: string;
  readonly researchWindow: ResearchWindowPreset;
  readonly domain: string;
  readonly audience: string;
  readonly targetDurationSeconds: TargetDurationSeconds;
  readonly sourceImportSchemaVersion: string;
}

export interface EvidencePackDraft {
  readonly verificationLevel: EvidenceVerificationLevel;
  readonly provenance: EvidencePackProvenance;
  readonly sources: readonly EvidenceSourceRecord[];
  readonly claims: readonly EvidenceClaimRecord[];
  readonly numbers: readonly EvidenceNumberRecord[];
  readonly coverage: EvidenceCoverageSummary;
}

export interface EvidenceReviewState {
  readonly status: "not_reviewed" | "approved" | "invalidated";
  readonly blockingIssues: readonly string[];
  readonly warnings: readonly string[];
}

export type TopicAngleType = "number_first" | "why_now" | "life_impact";

export type TopicEvaluationMetricName =
  | "watch_reason"
  | "freshness"
  | "evidence"
  | "specificity"
  | "visual_proof"
  | "audience_relevance"
  | "retention_potential"
  | "financial_safety";

export interface TopicEvaluationMetric {
  readonly name: TopicEvaluationMetricName;
  readonly label: string;
  readonly score: number;
  readonly weight: number;
  readonly weightedScore: number;
  readonly reasons: readonly string[];
  readonly evidenceReferences: readonly string[];
}

export interface TopicEvaluationResult {
  readonly candidateId: string;
  readonly totalScore: number;
  readonly blockingIssues: readonly string[];
  readonly warnings: readonly string[];
  readonly scoreBreakdown: readonly TopicEvaluationMetric[];
  readonly rank: number;
  readonly tieBreakKey: string;
  readonly scoreMeaning: "heuristic_pre_score_not_quality_gate";
}

export interface SelectedAngleDraft {
  readonly selectedAngleId: string;
  readonly candidateId: string;
  readonly sourceSignalId: string;
  readonly workingTitle: string;
  readonly hookPromise: string;
  readonly angleStatement: string;
  readonly viewerQuestion: string;
  readonly sourceRefs: readonly string[];
  readonly claimRefs: readonly string[];
  readonly numberRefs: readonly string[];
}

export interface SelectedAngleValidationIssue {
  readonly code: string;
  readonly fieldPath: string;
  readonly message: string;
  readonly blocking: boolean;
}

export interface SelectedAngleValidationSummary {
  readonly valid: boolean;
  readonly blockingIssueCount: number;
  readonly warningCount: number;
  readonly issues: readonly SelectedAngleValidationIssue[];
}

export type SelectedAngleApprovalState = "not_approved" | "approved" | "invalidated";

export const DETAILED_SCRIPT_BEAT_TYPES = [
  "anomaly_or_problem",
  "common_interpretation_crack",
  "evidence_and_number",
  "hidden_cause_or_connection",
  "audience_life_impact",
  "misread_correction",
  "practical_check_or_action",
  "next_signal_to_watch",
] as const;

export type DetailedScriptBeatType = (typeof DETAILED_SCRIPT_BEAT_TYPES)[number];

export interface DetailedScriptBeat {
  readonly beatId: string;
  readonly beatType: DetailedScriptBeatType;
  readonly purpose: string;
  readonly narration: string;
  readonly keyCaption: string;
  readonly claimRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly numberRefs: readonly string[];
  readonly retentionDevice: string;
}

export interface DetailedScriptPackage {
  readonly schemaVersion: string;
  readonly selectedAngleId: string;
  readonly title: string;
  readonly audience: string;
  readonly durationSeconds: TargetDurationSeconds;
  readonly thesis: string;
  readonly beats: readonly DetailedScriptBeat[];
  readonly closingAction: string;
  readonly nextSignal: string;
  readonly financialSafetyNote: string;
}

export interface DetailedScriptValidationIssue extends ImportIssue {}

export interface DetailedScriptValidationSummary extends ImportValidationSummary {
  readonly issues: readonly DetailedScriptValidationIssue[];
  readonly blockingIssueCount: number;
  readonly warningCount: number;
}

export type DetailedScriptApprovalState = "not_approved" | "approved" | "invalidated";

export interface EditorialIntelligenceSessionState {
  readonly approvedTrendBrief: ApprovedTrendBriefSessionSnapshot | null;
  readonly evidencePack: EvidencePackDraft | null;
  readonly evidenceReview: EvidenceReviewState;
  readonly topicCandidates: readonly TopicCandidate[];
  readonly topicEvaluations: readonly TopicEvaluationResult[];
  readonly selectedAngle: SelectedAngleDraft | null;
  readonly selectedAngleApproval: SelectedAngleApprovalState;
  readonly scriptPrompt: PromptPackage | null;
  readonly scriptRawText: string;
  readonly scriptPackage: DetailedScriptPackage | null;
  readonly scriptValidation: DetailedScriptValidationSummary | null;
  readonly scriptRepairText: string;
  readonly scriptApproval: DetailedScriptApprovalState;
}

export interface ApprovedDetailedScriptSessionSnapshot {
  readonly approvedScript: DetailedScriptPackage;
  readonly evidencePack: EvidencePackDraft;
  readonly selectedAngle: SelectedAngleDraft;
  readonly scriptRawHash: string;
  readonly scriptNormalizedHash: string;
  readonly evidenceIdentity: string;
  readonly validation: DetailedScriptValidationSummary;
  readonly approvalState: "approved";
  readonly audience: string;
  readonly durationSeconds: TargetDurationSeconds;
}

export interface SceneCardRevision {
  readonly value: number;
  readonly origin: "deterministic_default" | "user_override";
}

export interface SceneCardProvenance {
  readonly beatId: string;
  readonly beatType: DetailedScriptBeatType;
  readonly sourceSignalId: string;
  readonly claimRefs: readonly string[];
  readonly numberRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly selectedAngleId: string;
  readonly scriptPackageIdentity: string;
  readonly sceneRevision: SceneCardRevision;
}

export interface SceneCardDraft extends SceneCard {
  readonly provenance: SceneCardProvenance;
}

export interface SceneCardValidationIssue {
  readonly code: string;
  readonly sceneId: string | null;
  readonly fieldPath: string;
  readonly message: string;
  readonly blocking: boolean;
}

export interface SceneCardValidationSummary {
  readonly valid: boolean;
  readonly blockingIssueCount: number;
  readonly warningCount: number;
  readonly enabledSceneCount: number;
  readonly issues: readonly SceneCardValidationIssue[];
}

export type VisualStrategyType =
  | "number_text_motion"
  | "chart_comparison"
  | "official_source_card"
  | "timeline"
  | "relationship_diagram"
  | "map"
  | "character_motion"
  | "generated_image"
  | "generated_video"
  | "stock_video"
  | "direct_upload";

export type VisualStrategyClass = "evidence_first" | "supporting" | "illustrative";

export type AssetAcquisitionMode =
  | "deterministic_overlay"
  | "manual_ai_image"
  | "manual_ai_video"
  | "manual_stock"
  | "direct_upload_required";

export type VisualCostClass = "none_estimate" | "low_estimate" | "medium_estimate" | "high_estimate" | "unknown_estimate";

export type RightsReviewState = "not_required" | "pending_manual_review" | "reviewed_for_planning";

export type CharacterMotionTag =
  | "none"
  | "point_to_source"
  | "highlight_number"
  | "trace_relationship"
  | "watch_timeline";

export interface ChartPlan {
  readonly numberRefs: readonly string[];
  readonly labels: readonly string[];
  readonly unit: string;
  readonly comparisonMode: "side_by_side";
}

export interface SourceCardPlan {
  readonly sourceRefs: readonly string[];
  readonly publisherLabels: readonly string[];
  readonly downloadExpected: false;
}

export interface TimelinePlan {
  readonly entries: readonly {
    readonly evidenceRef: string;
    readonly date: string;
    readonly label: string;
  }[];
}

export interface RelationshipDiagramPlan {
  readonly labels: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly inventedCausalityAllowed: false;
}

export interface GeneratedImagePlan {
  readonly promptDraft: string;
  readonly illustrativeOnly: true;
  readonly actualGenerationRequested: false;
}

export interface GeneratedVideoPlan {
  readonly promptDraft: string;
  readonly illustrativeOnly: true;
  readonly actualGenerationRequested: false;
}

export interface StockVideoPlan {
  readonly contextRequirement: string;
  readonly searchRequested: false;
  readonly illustrativeOnly: true;
}

export interface DirectUploadPlan {
  readonly requirement: string;
  readonly uploadRequested: false;
}

export interface SceneVisualPlan {
  readonly sceneId: string;
  readonly sceneRevision: SceneCardRevision;
  readonly primaryStrategy: VisualStrategyType;
  readonly primaryStrategyClass: VisualStrategyClass;
  readonly secondaryStrategies: readonly VisualStrategyType[];
  readonly acquisitionMode: AssetAcquisitionMode;
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly numberRefs: readonly string[];
  readonly chartPlan: ChartPlan | null;
  readonly sourceCardPlan: SourceCardPlan | null;
  readonly timelinePlan: TimelinePlan | null;
  readonly relationshipDiagramPlan: RelationshipDiagramPlan | null;
  readonly generatedImagePlan: GeneratedImagePlan | null;
  readonly generatedVideoPlan: GeneratedVideoPlan | null;
  readonly stockVideoPlan: StockVideoPlan | null;
  readonly directUploadPlan: DirectUploadPlan | null;
  readonly characterMotionTag: CharacterMotionTag;
  readonly cameraMotion: string;
  readonly textMotion: string;
  readonly generationPromptDraft: string | null;
  readonly stockContextRequirement: string | null;
  readonly directUploadRequirement: string | null;
  readonly costClass: VisualCostClass;
  readonly requiresOwnerApproval: boolean;
  readonly ownerApprovalConfirmed: boolean;
  readonly rightsReviewState: RightsReviewState;
  readonly visualProofClass: "STRUCTURAL_PRECHECK_ONLY";
  readonly warnings: readonly string[];
  readonly blockingIssues: readonly string[];
}

export interface VisualProofIssue {
  readonly code: string;
  readonly sceneId: string | null;
  readonly fieldPath: string;
  readonly message: string;
  readonly blocking: boolean;
}

export interface VisualProofSummary {
  readonly valid: boolean;
  readonly blockingIssueCount: number;
  readonly warningCount: number;
  readonly verificationLevel: "STRUCTURAL_PRECHECK_ONLY";
  readonly issues: readonly VisualProofIssue[];
}

export type ScenePlanningApprovalState = "not_approved" | "approved" | "invalidated";

export interface ApprovedScenePlanningSessionSnapshot {
  readonly approvedScriptIdentity: string;
  readonly sceneCards: readonly SceneCardDraft[];
  readonly sceneValidation: SceneCardValidationSummary;
  readonly visualPlan: readonly SceneVisualPlan[];
  readonly visualProof: VisualProofSummary;
  readonly approvalState: "approved";
}

export interface ScenePlanningSessionState {
  readonly approvedScript: ApprovedDetailedScriptSessionSnapshot | null;
  readonly sceneCards: readonly SceneCardDraft[];
  readonly sceneValidation: SceneCardValidationSummary | null;
  readonly sceneCardApproval: ScenePlanningApprovalState;
  readonly visualPlan: readonly SceneVisualPlan[];
  readonly visualProof: VisualProofSummary | null;
  readonly planningApproval: ScenePlanningApprovalState;
}

// Slice 5 augments the approved planning identity without weakening the Slice 4 contract.
export interface ApprovedScenePlanningSessionSnapshot {
  readonly approvedScriptRawHash: string;
  readonly approvedScriptNormalizedHash: string;
  readonly evidenceIdentity: string;
  readonly selectedAngleId: string;
}

export type CharacterDirectionId =
  | "loop_signal_navigator"
  | "pin_field_finch"
  | "moa_archive_sprite";

export type CharacterDirectionStatus = "comparison_only";

export type CharacterSilhouetteClass =
  | "asymmetric_open_signal_ring"
  | "direction_pin_with_information_wings"
  | "layered_archive_tabs";

export type CharacterVisualRole =
  | "signal_navigation"
  | "source_navigation"
  | "number_navigation"
  | "comparison_navigation"
  | "warning_navigation"
  | "timeline_navigation"
  | "relationship_navigation";

export interface CharacterDirectionDefinition {
  readonly directionId: CharacterDirectionId;
  readonly temporaryDisplayName: string;
  readonly status: CharacterDirectionStatus;
  readonly silhouetteClass: CharacterSilhouetteClass;
  readonly silhouetteDescription: string;
  readonly visualRoles: readonly CharacterVisualRole[];
  readonly personality: string;
  readonly motionVocabularyEmphasis: readonly string[];
  readonly implementationComplexity: "low" | "medium" | "high";
  readonly maintenanceComplexity: "low" | "medium" | "high";
  readonly accessibilityConsiderations: readonly string[];
  readonly screenOccupancyTargetPercent: number;
  readonly evidencePriorityRule: "character_secondary_evidence_first";
  readonly rightsProvenance: "internal_svg_primitives_only";
  readonly similarityRisks: readonly string[];
  readonly prohibitedMotifs: readonly string[];
  readonly reducedMotionBehavior: string;
  readonly finalIdentityApproved: false;
}

export type CharacterRigLayerId =
  | "root"
  | "body"
  | "signalCore"
  | "indicator"
  | "pointer"
  | "leftGuide"
  | "rightGuide"
  | "evidencePanel"
  | "accent"
  | "focusMarker";

export interface CharacterRigLayerDefinition {
  readonly layerId: CharacterRigLayerId;
  readonly semanticRole: CharacterVisualRole;
  readonly primitive: "circle" | "ellipse" | "rect" | "path" | "line" | "polyline";
  readonly transformOrigin: readonly [number, number];
  readonly zOrder: number;
  readonly opacity: number;
  readonly scale: number;
  readonly rotationDegrees: number;
  readonly translation: readonly [number, number];
  readonly fillToken: string;
  readonly strokeToken: string;
  readonly reducedMotionVisible: boolean;
}

export interface CharacterRigDefinition {
  readonly rigVersion: "character-rig-v1";
  readonly directionId: CharacterDirectionId;
  readonly viewBox: readonly [number, number, number, number];
  readonly layers: readonly CharacterRigLayerDefinition[];
  readonly evidenceNavigationLayerIds: readonly CharacterRigLayerId[];
  readonly occupancyTargetPercent: number;
  readonly reducedMotionDescription: string;
  readonly prohibitedMotifMarkers: readonly string[];
  readonly productionExportReady: false;
}

export const CHARACTER_RIG_MOTION_TAGS = [
  "idle_scan",
  "signal_detect",
  "source_scan",
  "number_emphasis",
  "compare_left_right",
  "cause_effect_link",
  "warning_pulse",
  "discovery_reveal",
  "next_signal_point",
  "chart_assist",
  "source_card_assist",
] as const;

export type CharacterRigMotionTag = (typeof CHARACTER_RIG_MOTION_TAGS)[number];
export type CharacterMotionIntensity = "low" | "medium" | "high";

export interface CharacterMotionTiming {
  readonly durationMs: number;
  readonly easingToken: "ease_in_out" | "ease_out" | "linear_soft";
  readonly loopPolicy: "none" | "limited_2" | "ambient_pause";
}

export interface CharacterMotionKeyframe {
  readonly offset: number;
  readonly opacity: number;
  readonly scale: number;
  readonly rotationDegrees: number;
  readonly translateX: number;
  readonly translateY: number;
}

export interface CharacterMotionDefinition {
  readonly motionTag: CharacterRigMotionTag;
  readonly semanticPurpose: string;
  readonly timing: CharacterMotionTiming;
  readonly keyframes: readonly CharacterMotionKeyframe[];
  readonly affectedLayerIds: readonly CharacterRigLayerId[];
  readonly affectedSemanticRoles: readonly CharacterVisualRole[];
  readonly maximumScale: number;
  readonly maximumRotationDegrees: number;
  readonly maximumTranslation: number;
  readonly screenOccupancyConstraintPercent: number;
  readonly reducedMotionAlternative: string;
  readonly evidenceObstructionPolicy: "never_cover_primary_evidence";
  readonly allowedDirectionIds: readonly CharacterDirectionId[];
  readonly createsNewFact: false;
  readonly rapidFlashAllowed: false;
}

export interface SceneCharacterMotionAssignment {
  readonly sceneId: string;
  readonly sceneOrder: number;
  readonly directionId: CharacterDirectionId;
  readonly motionTag: CharacterRigMotionTag;
  readonly intensity: CharacterMotionIntensity;
  readonly enabled: boolean;
  readonly characterRole: "secondary_evidence_navigation";
  readonly reducedMotionAlternative: string;
  readonly screenOccupancyClass: "compact" | "standard";
  readonly primaryVisualStrategy: VisualStrategyType;
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly numberRefs: readonly string[];
  readonly obstructionWarning: string | null;
  readonly userOverride: boolean;
}

export interface CharacterMotionPlan {
  readonly planVersion: "character-motion-plan-v1";
  readonly vocabularyVersion: "character-motion-v1";
  readonly directionId: CharacterDirectionId;
  readonly sourcePlanningIdentity: string;
  readonly assignments: readonly SceneCharacterMotionAssignment[];
  readonly reducedMotionAssignments: readonly SceneCharacterMotionAssignment[];
  readonly productionRendered: false;
}

export interface CharacterComparisonScene {
  readonly sceneId: string;
  readonly sceneOrder: number;
  readonly narration: string;
  readonly keyCaption: string;
  readonly primaryVisualStrategy: VisualStrategyType;
  readonly semanticMotionTag: CharacterRigMotionTag;
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly numberRefs: readonly string[];
}

export interface CharacterComparisonResult {
  readonly scene: CharacterComparisonScene;
  readonly comparedDirectionIds: readonly CharacterDirectionId[];
  readonly sameSceneIdentityConfirmed: boolean;
  readonly sameSemanticMotionTagConfirmed: boolean;
  readonly standardMotionReviewed: boolean;
  readonly reducedMotionReviewed: boolean;
}

export type CharacterOriginalityCheckId =
  | "not_money_face"
  | "not_reference_silhouette"
  | "not_reference_expression_prop_palette"
  | "not_reference_signature_motion"
  | "no_external_svg_icon_font"
  | "no_third_party_logo"
  | "no_real_person_face"
  | "evidence_first_priority"
  | "character_secondary_only"
  | "screen_occupancy_within_target"
  | "no_evidence_obstruction"
  | "reduced_motion_supported"
  | "no_rapid_flashing"
  | "status_not_color_only"
  | "internal_svg_rights_provenance";

export interface CharacterOriginalityCheck {
  readonly checkId: CharacterOriginalityCheckId;
  readonly label: string;
  readonly confirmed: boolean;
  readonly blocking: true;
}

export interface CharacterAccessibilityReview {
  readonly reducedMotionCompared: boolean;
  readonly rapidFlashingAbsent: boolean;
  readonly statusNotColorOnly: boolean;
  readonly evidenceRemainsReadable: boolean;
  readonly blockingIssueCount: number;
}

export interface CharacterRightsReview {
  readonly sourceStatus: "OWNED_ORIGINAL";
  readonly provenance: "internal_svg_primitives_only";
  readonly externalAssetsUsed: false;
  readonly thirdPartyMarksUsed: false;
  readonly realPersonLikenessUsed: false;
  readonly blockingIssueCount: number;
}

export interface CharacterDirectionSelectionDraft {
  readonly directions: readonly CharacterDirectionDefinition[];
  readonly rigs: readonly CharacterRigDefinition[];
  readonly motionPlans: readonly CharacterMotionPlan[];
  readonly comparisonResult: CharacterComparisonResult | null;
  readonly selectedDirectionId: CharacterDirectionId | null;
  readonly originalityChecks: readonly CharacterOriginalityCheck[];
  readonly rightsReview: CharacterRightsReview;
  readonly accessibilityReview: CharacterAccessibilityReview;
  readonly approvalState: CharacterDirectionApprovalState;
  readonly finalName: null;
  readonly finalPalette: null;
  readonly finalBrandIdentity: null;
}

export interface CharacterDirectionValidationIssue {
  readonly code: string;
  readonly fieldPath: string;
  readonly message: string;
  readonly blocking: boolean;
}

export interface CharacterDirectionValidationSummary {
  readonly valid: boolean;
  readonly blockingIssueCount: number;
  readonly warningCount: number;
  readonly issues: readonly CharacterDirectionValidationIssue[];
}

export type CharacterDirectionApprovalState = "not_approved" | "provisionally_approved" | "invalidated";

export interface ApprovedCharacterMotionSessionSnapshot {
  readonly selectedDirectionId: CharacterDirectionId;
  readonly temporaryDisplayName: string;
  readonly rigVersion: "character-rig-v1";
  readonly motionVocabularyVersion: "character-motion-v1";
  readonly comparisonSceneId: string;
  readonly sceneMotionAssignments: readonly SceneCharacterMotionAssignment[];
  readonly reducedMotionAssignments: readonly SceneCharacterMotionAssignment[];
  readonly originalityReview: readonly CharacterOriginalityCheck[];
  readonly rightsReview: CharacterRightsReview;
  readonly accessibilityReview: CharacterAccessibilityReview;
  readonly provisionalApprovalState: "provisionally_approved";
  readonly sourcePlanningIdentity: string;
  readonly sessionOnly: true;
  readonly finalIdentityApproved: false;
  readonly productionAssetCreated: false;
}

export interface CharacterMotionSessionState {
  readonly approvedPlanning: ApprovedScenePlanningSessionSnapshot | null;
  readonly representativeScene: CharacterComparisonScene | null;
  readonly selection: CharacterDirectionSelectionDraft | null;
  readonly validation: CharacterDirectionValidationSummary | null;
  readonly approvedSnapshot: ApprovedCharacterMotionSessionSnapshot | null;
  readonly playbackState: "playing" | "paused";
  readonly previewSpeed: 0.75 | 1 | 1.25;
  readonly reducedMotion: boolean;
}

export type VoiceProviderMode = "plan_only" | "existing_external_provider" | "manual_audio_future";

export interface VoiceProviderReference {
  readonly providerId: string;
  readonly displayLabel: string;
  readonly mode: VoiceProviderMode;
  readonly locale: string;
  readonly voiceIdentity: string;
  readonly configuredForPlanning: boolean;
  readonly ownerExternalApprovalConfirmed: boolean;
  readonly actualRequestExecuted: false;
  readonly audioCreated: false;
}

export interface VoiceRequestScene {
  readonly sceneId: string;
  readonly sceneOrder: number;
  readonly narration: string;
  readonly characterCount: number;
  readonly wordCount: number;
  readonly estimatedDurationSeconds: number;
  readonly locale: string;
  readonly voiceIdentity: string;
  readonly sourceScriptHash: string;
  readonly executionRequested: false;
  readonly executed: false;
  readonly audioCreated: false;
}

export interface VoiceUsageEstimate {
  readonly totalCharacters: number;
  readonly totalWords: number;
  readonly totalEstimatedDurationSeconds: number;
  readonly targetDurationSeconds: number;
  readonly durationVarianceSeconds: number;
}

export type VoiceCostEstimateClass = "unknown" | "manual_basis_only" | "provider_estimate_unverified";

export interface VoiceRequestPlan {
  readonly planVersion: "voice-request-plan-v1";
  readonly sourceScriptHash: string;
  readonly mode: VoiceProviderMode;
  readonly provider: VoiceProviderReference | null;
  readonly scenes: readonly VoiceRequestScene[];
  readonly usage: VoiceUsageEstimate;
  readonly costEstimateClass: VoiceCostEstimateClass;
  readonly manualCostBasisLabel: string | null;
  readonly externalProviderRequired: boolean;
  readonly requiresOwnerApproval: boolean;
  readonly ownerApprovalConfirmed: boolean;
  readonly actualRequestExecuted: false;
  readonly audioCreated: false;
  readonly productionReady: false;
}

export interface VoicePlanValidationIssue {
  readonly code: string;
  readonly sceneId: string | null;
  readonly fieldPath: string;
  readonly message: string;
  readonly blocking: boolean;
}

export interface VoicePlanValidationSummary {
  readonly valid: boolean;
  readonly blockingIssueCount: number;
  readonly warningCount: number;
  readonly issues: readonly VoicePlanValidationIssue[];
}

export type VoicePlanApprovalState = "not_approved" | "approved" | "invalidated";
export type SubtitleAlignmentStatus = "estimated_not_audio_aligned";

export interface SubtitleCue {
  readonly cueId: string;
  readonly sceneId: string;
  readonly sceneOrder: number;
  readonly cueOrder: number;
  readonly text: string;
  readonly startSeconds: number;
  readonly endSeconds: number;
  readonly keyCaption: boolean;
  readonly safeZone: "lower_safe_caption_zone";
  readonly alignmentStatus: SubtitleAlignmentStatus;
}

export interface SceneSubtitlePlan {
  readonly sceneId: string;
  readonly sceneOrder: number;
  readonly narration: string;
  readonly keyCaption: string;
  readonly startSeconds: number;
  readonly endSeconds: number;
  readonly cues: readonly SubtitleCue[];
  readonly alignmentStatus: SubtitleAlignmentStatus;
}

export interface SubtitleTrackPlan {
  readonly trackVersion: "subtitle-track-plan-v1";
  readonly sourceScriptHash: string;
  readonly locale: string;
  readonly targetDurationSeconds: number;
  readonly scenePlans: readonly SceneSubtitlePlan[];
  readonly cues: readonly SubtitleCue[];
  readonly safeZone: "lower_safe_caption_zone";
  readonly alignmentStatus: SubtitleAlignmentStatus;
  readonly audioAlignmentPerformed: false;
  readonly productionReady: false;
}

export interface SubtitleValidationIssue {
  readonly code: string;
  readonly sceneId: string | null;
  readonly fieldPath: string;
  readonly message: string;
  readonly blocking: boolean;
}

export interface SubtitleValidationSummary {
  readonly valid: boolean;
  readonly blockingIssueCount: number;
  readonly warningCount: number;
  readonly issues: readonly SubtitleValidationIssue[];
}

export type RenderProfileId = "preview_540x960" | "final_1080x1920";

export interface RenderProfile {
  readonly profileId: RenderProfileId;
  readonly label: string;
  readonly width: 540 | 1080;
  readonly height: 960 | 1920;
  readonly framesPerSecond: 30;
  readonly bitrateIntent: "low_preview" | "production_intent_unverified";
  readonly encodingIntent: "fast_preview" | "production_quality_intent";
  readonly preview: boolean;
  readonly final: boolean;
  readonly executionAllowed: boolean;
  readonly productionReady: false;
}

export type RenderLayerType =
  | "base_placeholder"
  | "primary_visual"
  | "supporting_visual"
  | "source_metadata"
  | "number_chart_metadata"
  | "character"
  | "subtitle"
  | "key_caption"
  | "safe_area";

export interface SceneRenderLayer {
  readonly layerId: string;
  readonly layerType: RenderLayerType;
  readonly logicalUri: string;
  readonly required: boolean;
  readonly resolved: boolean;
  readonly role: "primary" | "secondary" | "overlay" | "guide";
  readonly zIndex: number;
  readonly sourceRefs: readonly string[];
  readonly numberRefs: readonly string[];
  readonly rightsReviewState: RightsReviewState;
  readonly costClass: VisualCostClass;
}

export interface SceneRenderFingerprint {
  readonly sceneId: string;
  readonly fingerprintVersion: "scene-render-fingerprint-v1";
  readonly fingerprint: string;
  readonly sceneContentHash: string;
  readonly voiceHash: string;
  readonly subtitleHash: string;
  readonly characterHash: string;
  readonly profileHash: string;
}

export interface SceneRenderInput {
  readonly sceneId: string;
  readonly sceneOrder: number;
  readonly enabled: boolean;
  readonly durationSeconds: number;
  readonly primaryVisualStrategy: VisualStrategyType;
  readonly acquisitionMode: AssetAcquisitionMode;
  readonly narration: string;
  readonly keyCaption: string;
  readonly sourceRefs: readonly string[];
  readonly numberRefs: readonly string[];
  readonly layers: readonly SceneRenderLayer[];
  readonly characterAssignment: SceneCharacterMotionAssignment | null;
  readonly subtitleCueIds: readonly string[];
  readonly unresolvedRequirements: readonly string[];
  readonly characterOccupancyPercent: number;
  readonly characterOccupancyTargetPercent: number;
  readonly characterOverlapsSubtitleSafeZone: boolean;
  readonly characterIntrudesPrimarySafeZone: boolean;
  readonly obstructionPolicySatisfied: boolean;
  readonly characterIsPrimaryVisual: boolean;
  readonly captionDensityClass: "normal" | "dense";
  readonly evidenceDensityClass: "normal" | "dense";
  readonly structuralSafeAreaPrecheck: "STRUCTURAL_SAFE_AREA_PRECHECK";
  readonly fingerprint: SceneRenderFingerprint;
}

export interface RenderManifest {
  readonly manifestVersion: "render-manifest-v1";
  readonly sourcePlanningIdentity: string;
  readonly sourceScriptHash: string;
  readonly selectedAngleId: string;
  readonly selectedCharacterDirectionId: CharacterDirectionId;
  readonly profile: RenderProfile;
  readonly voicePlan: VoiceRequestPlan;
  readonly subtitleTrack: SubtitleTrackPlan;
  readonly scenes: readonly SceneRenderInput[];
  readonly enabledSceneCount: number;
  readonly totalDurationSeconds: number;
  readonly globalSafeAreaPolicy: "evidence_first_no_obstruction";
  readonly integrationReadiness: "INTEGRATION_PRECHECK_ONLY";
  readonly manifestHash: string;
  readonly renderExecuted: false;
  readonly audioCreated: false;
  readonly externalRequestsMade: false;
  readonly productionReady: false;
}

export interface RenderManifestValidationIssue {
  readonly code: string;
  readonly sceneId: string | null;
  readonly fieldPath: string;
  readonly message: string;
  readonly blocking: boolean;
}

export interface RenderManifestValidationSummary {
  readonly valid: boolean;
  readonly blockingIssueCount: number;
  readonly warningCount: number;
  readonly verificationLevel: "INTEGRATION_PRECHECK_ONLY";
  readonly issues: readonly RenderManifestValidationIssue[];
}

export type SceneRenderExecutionStatus = "not_started" | "blocked" | "synthetic_fixture_pass" | "failed_retryable";

export interface RenderAttemptRecord {
  readonly attemptId: string;
  readonly sceneId: string;
  readonly fingerprint: string;
  readonly profileId: RenderProfileId;
  readonly status: SceneRenderExecutionStatus;
  readonly retryable: boolean;
  readonly outputHash: string | null;
  readonly syntheticFixtureOnly: boolean;
}

export interface RenderRecoveryPlan {
  readonly planVersion: "render-recovery-plan-v1";
  readonly globalInvalidation: boolean;
  readonly globalReasons: readonly string[];
  readonly changedSceneIds: readonly string[];
  readonly reusableSceneIds: readonly string[];
  readonly removedSceneIds: readonly string[];
  readonly newSceneIds: readonly string[];
  readonly retryableSceneIds: readonly string[];
  readonly blockedSceneIds: readonly string[];
  readonly previousOutputsAssumed: false;
  readonly persistenceUsed: false;
}

export interface RendererBridgeCapability {
  readonly capabilityId:
    | "scene_concat"
    | "profile_selection"
    | "audio_placeholder"
    | "subtitle_overlay"
    | "character_overlay"
    | "text_overlay"
    | "transitions"
    | "fingerprint_verification"
    | "manifest_hash_verification"
    | "ffprobe_verification";
  readonly planned: true;
  readonly implemented: false;
  readonly externalExecutionRequired: boolean;
}

export interface RendererBridgePlan {
  readonly bridgeVersion: "renderer-bridge-plan-v1";
  readonly manifestHash: string;
  readonly profileId: RenderProfileId;
  readonly capabilities: readonly RendererBridgeCapability[];
  readonly sceneLogicalUris: readonly string[];
  readonly missingRequirements: readonly string[];
  readonly executionReady: false;
  readonly networkRequired: false;
  readonly filesystemAccessDeclared: false;
  readonly processExecutionDeclared: false;
  readonly v1ImportsUsed: false;
}

export interface SyntheticRenderProofResult {
  readonly proofVersion: "synthetic-render-proof-v1";
  readonly profileId: "preview_540x960";
  readonly sceneCount: 8;
  readonly width: 540;
  readonly height: 960;
  readonly videoStreamPresent: boolean;
  readonly audioStreamPresent: boolean;
  readonly subtitleStreamPresent: boolean;
  readonly durationSeconds: number;
  readonly outputSha256: string;
  readonly nonEmptyOutput: boolean;
  readonly repositoryStatusUnchanged: boolean;
  readonly syntheticOnly: true;
}

export type RenderIntegrationApprovalState = "not_approved" | "approved" | "invalidated";

export interface ApprovedRenderIntegrationSessionSnapshot {
  readonly sourceDetailedScriptSnapshot: ApprovedDetailedScriptSessionSnapshot;
  readonly sourceCharacterSnapshot: ApprovedCharacterMotionSessionSnapshot;
  readonly voicePlan: VoiceRequestPlan;
  readonly subtitleTrack: SubtitleTrackPlan;
  readonly renderManifest: RenderManifest;
  readonly validation: RenderManifestValidationSummary;
  readonly bridgePlan: RendererBridgePlan;
  readonly approvalState: "approved";
  readonly sessionOnly: true;
  readonly ttsConnected: false;
  readonly audioCreated: false;
  readonly renderExecuted: false;
  readonly productionReady: false;
}

export interface RenderIntegrationSessionState {
  readonly approvedCharacterMotion: ApprovedCharacterMotionSessionSnapshot | null;
  readonly voicePlan: VoiceRequestPlan | null;
  readonly voiceValidation: VoicePlanValidationSummary | null;
  readonly voiceApproval: VoicePlanApprovalState;
  readonly subtitleTrack: SubtitleTrackPlan | null;
  readonly subtitleValidation: SubtitleValidationSummary | null;
  readonly selectedProfileId: RenderProfileId;
  readonly renderManifest: RenderManifest | null;
  readonly renderValidation: RenderManifestValidationSummary | null;
  readonly recoveryPlan: RenderRecoveryPlan | null;
  readonly bridgePlan: RendererBridgePlan | null;
  readonly approvalState: RenderIntegrationApprovalState;
  readonly approvedSnapshot: ApprovedRenderIntegrationSessionSnapshot | null;
}

export type PublishPlatformId = "instagram_reels" | "youtube_shorts";
export type PublishExecutionIntent = "immediate_future" | "scheduled_future";
export type PublishVisibilityIntent = "public" | "unlisted" | "private";
export type PlatformPolicyAuthority = "internal_planning_only";

export interface PlatformMetadataPolicy {
  readonly policyVersion: "publish-metadata-policy-v1";
  readonly authority: PlatformPolicyAuthority;
  readonly actualCurrentPlatformLimitsVerified: false;
  readonly lengthPolicy: "conservative_warning_only";
}

export interface PublishExpectedDestinationIdentity {
  readonly platformId: PublishPlatformId;
  readonly stableDestinationId: string;
  readonly displayLabel: string;
  readonly ownerConfirmation: boolean;
  readonly identityPolicyVersion: "publish-identity-policy-v1";
}

export type PublishIdentityObservationLevel = "manual_unverified" | "external_readonly_future";

export interface PublishObservedDestinationIdentity {
  readonly platformId: PublishPlatformId;
  readonly stableDestinationId: string;
  readonly displayLabel: string;
  readonly observationLevel: PublishIdentityObservationLevel;
  readonly observedBy: string;
  readonly observedAtIso: string;
  readonly sourceDescription: string;
}

export interface PublishIdentityComparison {
  readonly platformId: PublishPlatformId;
  readonly expectedStableDestinationId: string;
  readonly observedStableDestinationId: string;
  readonly platformMatches: boolean;
  readonly stableDestinationIdMatches: boolean;
  readonly ownerConfirmed: boolean;
  readonly matchesForPlanning: boolean;
  readonly identityExecutionVerified: false;
  readonly blockingReasons: readonly string[];
}

export interface PublishHashtagPlan {
  readonly rawHashtags: readonly string[];
  readonly normalizedHashtags: readonly string[];
  readonly duplicateCount: number;
}

export interface PublishSourceDisclosurePlan {
  readonly disclosureVersion: "publish-source-disclosure-v1";
  readonly statement: string;
  readonly sources: readonly {
    readonly sourceId: string;
    readonly publisher: string;
    readonly title: string;
    readonly url: string;
    readonly sourceExistenceVerified: false;
  }[];
  readonly sourceExistenceVerified: false;
}

export interface PublishCoverPlan {
  readonly selectedSceneId: string;
  readonly titleOverlay: string;
  readonly logicalUri: string;
  readonly metadataOnly: true;
  readonly actualCoverCreated: false;
}

export interface PublishMetadataDraft {
  readonly platformId: PublishPlatformId;
  readonly title: string;
  readonly description: string;
  readonly caption: string;
  readonly hashtags: PublishHashtagPlan;
  readonly sourceDisclosure: PublishSourceDisclosurePlan;
  readonly coverPlan: PublishCoverPlan;
  readonly accessibilityDescription: string;
  readonly visibilityIntent: PublishVisibilityIntent;
  readonly policy: PlatformMetadataPolicy;
  readonly metadataHash: string;
}

export interface PublishScheduleIntent {
  readonly executionIntent: PublishExecutionIntent;
  readonly scheduledAtIso: string | null;
  readonly timezone: string | null;
  readonly validationNowIso: string;
  readonly scheduleOwnerConfirmation: boolean;
  readonly schedulerCapabilityRequired: boolean;
  readonly schedulerAvailable: false;
  readonly executionReady: false;
}

export interface PublishDeduplicationKey {
  readonly keyVersion: "publish-dedupe-key-v1";
  readonly platformId: PublishPlatformId;
  readonly stableDestinationId: string;
  readonly renderManifestHash: string;
  readonly metadataHash: string;
  readonly visibilityIntent: PublishVisibilityIntent;
  readonly coverPlanHash: string;
  readonly value: string;
}

export interface PublishDuplicateCheckResult {
  readonly duplicate: boolean;
  readonly blocking: boolean;
  readonly matchedAttemptIds: readonly string[];
  readonly checkedSessionOnly: true;
  readonly remotePlatformChecked: false;
  readonly durableLedgerChecked: false;
}

export interface PlatformPublishPackage {
  readonly platformId: PublishPlatformId;
  readonly expectedDestinationIdentity: PublishExpectedDestinationIdentity;
  readonly observedDestinationIdentity: PublishObservedDestinationIdentity;
  readonly identityComparison: PublishIdentityComparison;
  readonly metadata: PublishMetadataDraft;
  readonly coverPlan: PublishCoverPlan;
  readonly visibilityIntent: PublishVisibilityIntent;
  readonly renderLogicalUri: string;
  readonly coverLogicalUri: string;
  readonly dedupeKey: PublishDeduplicationKey;
  readonly blockingIssues: readonly string[];
  readonly warnings: readonly string[];
}

export interface PublishPackage {
  readonly packageId: string;
  readonly packageVersion: "publish-package-v1";
  readonly renderIntegrationIdentity: string;
  readonly renderManifestHash: string;
  readonly finalProfileIdentity: string;
  readonly platformPackages: readonly PlatformPublishPackage[];
  readonly metadataPolicyVersion: "publish-metadata-policy-v1";
  readonly sourceDisclosure: PublishSourceDisclosurePlan;
  readonly rightsSummary: {
    readonly planningState: "planning_review_only";
    readonly unresolved: boolean;
  };
  readonly costSummary: {
    readonly classification: VoiceCostEstimateClass;
    readonly paidPossible: boolean;
    readonly ownerConfirmation: boolean;
  };
  readonly executionIntent: PublishExecutionIntent;
  readonly scheduleIntent: PublishScheduleIntent;
  readonly createdFromSessionIdentity: string;
  readonly executionRequested: false;
  readonly externalCallExecuted: false;
  readonly uploadExecuted: false;
  readonly publicationExecuted: false;
  readonly durableLedgerAvailable: false;
  readonly executionReady: false;
}

export type PublicationAttemptStatus =
  | "planned"
  | "blocked"
  | "dry_run_in_progress"
  | "dry_run_success"
  | "dry_run_failed"
  | "superseded";

export interface PublicationAttemptRecord {
  readonly attemptId: string;
  readonly platformId: PublishPlatformId;
  readonly dedupeKey: string;
  readonly attemptOrdinal: number;
  readonly status: PublicationAttemptStatus;
  readonly requestedAtIso: string;
  readonly completedAtIso: string | null;
  readonly failureCode: string | null;
  readonly failureMessage: string | null;
  readonly retryable: boolean;
  readonly identityMatchAtAttempt: boolean;
  readonly externalExecution: false;
  readonly dryRun: true;
}

export interface PlatformPublicationState {
  readonly platformId: PublishPlatformId;
  readonly dedupeKey: string;
  readonly latestAttemptId: string | null;
  readonly latestStatus: PublicationAttemptStatus | "not_attempted";
  readonly successful: boolean;
  readonly failed: boolean;
  readonly blocked: boolean;
  readonly retryable: boolean;
}

export interface SessionPublicationLedger {
  readonly ledgerVersion: "session-publication-ledger-v1";
  readonly sessionIdentity: string;
  readonly attempts: readonly PublicationAttemptRecord[];
  readonly platformStates: readonly PlatformPublicationState[];
  readonly durable: false;
  readonly remoteSynchronized: false;
}

export type PublishRecoveryReason =
  | "platform_dry_run_failed"
  | "identity_mismatch"
  | "duplicate_blocked"
  | "non_retryable_failure"
  | "schedule_expired"
  | "package_changed";

export interface PlatformRecoveryAction {
  readonly platformId: PublishPlatformId;
  readonly action: "preserve_success" | "retry_failed_dry_run" | "change_plan_required" | "no_action";
  readonly reasons: readonly PublishRecoveryReason[];
  readonly attemptIds: readonly string[];
  readonly actualRetryExecuted: false;
}

export interface PublishRecoveryPlan {
  readonly planVersion: "publish-recovery-plan-v1";
  readonly successfulPlatformIds: readonly PublishPlatformId[];
  readonly failedPlatformIds: readonly PublishPlatformId[];
  readonly retryablePlatformIds: readonly PublishPlatformId[];
  readonly blockedPlatformIds: readonly PublishPlatformId[];
  readonly unchangedSuccessfulAttemptIds: readonly string[];
  readonly requiredPlanChanges: readonly string[];
  readonly globalBlockingReasons: readonly string[];
  readonly nextAllowedActions: readonly PlatformRecoveryAction[];
  readonly actualRetryExecuted: false;
}

export interface PublishBridgeCapability {
  readonly capabilityId:
    | "destination_identity_read"
    | "media_upload"
    | "metadata_publish"
    | "cover_publish"
    | "immediate_publish"
    | "scheduled_publish"
    | "publication_status_read"
    | "publication_cancel"
    | "duplicate_remote_check"
    | "per_platform_retry"
    | "durable_publication_ledger";
  readonly available: false;
  readonly future: true;
}

export interface PublishBridgePlan {
  readonly bridgeVersion: "publish-bridge-plan-v1";
  readonly packageId: string;
  readonly platformPlans: readonly {
    readonly platformId: PublishPlatformId;
    readonly logicalRenderUri: string;
    readonly logicalCoverUri: string;
    readonly expectedDestinationId: string;
    readonly observedManualDestinationId: string;
    readonly metadataPackageIdentity: string;
    readonly scheduleIntent: PublishScheduleIntent;
    readonly dedupeKey: string;
    readonly requiredCapabilities: readonly PublishBridgeCapability[];
    readonly unavailableCapabilities: readonly PublishBridgeCapability["capabilityId"][];
  }[];
  readonly missingCredentials: true;
  readonly missingExternalIdentityVerification: true;
  readonly missingDurableLedger: true;
  readonly executionReady: false;
  readonly executionCommand: null;
  readonly externalRequest: null;
}

export interface PublishDryRunResult {
  readonly dryRunVersion: "publish-dry-run-v1";
  readonly packageId: string;
  readonly instagramStatus: "dry_run_success";
  readonly youtubeInitialStatus: "dry_run_failed";
  readonly youtubeRetryStatus: "dry_run_success";
  readonly retryPlatformIds: readonly ["youtube_shorts"];
  readonly duplicateSuccessBlocked: true;
  readonly wrongAccountBlocked: true;
  readonly pastScheduleBlocked: true;
  readonly missingOwnerConfirmationBlocked: true;
  readonly executionReady: false;
  readonly externalExecution: false;
  readonly uploadExecuted: false;
  readonly publicationExecuted: false;
  readonly repositoryStatusUnchanged: boolean;
  readonly syntheticOnly: true;
}

export interface PublishValidationIssue {
  readonly code: string;
  readonly platformId: PublishPlatformId | null;
  readonly fieldPath: string;
  readonly message: string;
  readonly blocking: boolean;
}

export interface PublishValidationSummary {
  readonly valid: boolean;
  readonly blockingIssueCount: number;
  readonly warningCount: number;
  readonly verificationLevel: "PUBLISH_INTEGRATION_PRECHECK_ONLY";
  readonly executionEligible: false;
  readonly issues: readonly PublishValidationIssue[];
}

export type PublishApprovalState = "not_approved" | "approved" | "invalidated";

export interface ApprovedPublishIntegrationSessionSnapshot {
  readonly publishPackage: PublishPackage;
  readonly validation: PublishValidationSummary;
  readonly bridgePlan: PublishBridgePlan;
  readonly ledger: SessionPublicationLedger;
  readonly recoveryPlan: PublishRecoveryPlan;
  readonly approvalState: "approved";
  readonly sessionOnly: true;
  readonly externalIdentityVerified: false;
  readonly uploadExecuted: false;
  readonly publicationExecuted: false;
  readonly schedulingExecuted: false;
  readonly durableLedgerAvailable: false;
  readonly executionReady: false;
}

export interface PublishIntegrationSessionState {
  readonly approvedRenderIntegration: ApprovedRenderIntegrationSessionSnapshot | null;
  readonly publishPackage: PublishPackage | null;
  readonly validation: PublishValidationSummary | null;
  readonly bridgePlan: PublishBridgePlan | null;
  readonly ledger: SessionPublicationLedger;
  readonly recoveryPlan: PublishRecoveryPlan | null;
  readonly approvalState: PublishApprovalState;
  readonly approvedSnapshot: ApprovedPublishIntegrationSessionSnapshot | null;
}

// Slice 8 augments the approved publish snapshot without weakening the Slice 7 contract.
export interface ApprovedPublishIntegrationSessionSnapshot {
  readonly sourceRenderIntegrationSnapshot: ApprovedRenderIntegrationSessionSnapshot;
  readonly sourceRenderIntegrationIdentity: string;
  readonly sceneFingerprints: readonly SceneRenderFingerprint[];
  readonly selectedCharacterDirectionId: CharacterDirectionId;
  readonly platformPackages: readonly PlatformPublishPackage[];
  readonly publishMetadata: readonly PublishMetadataDraft[];
  readonly sourceDisclosures: readonly PublishSourceDisclosurePlan[];
  readonly destinationIdentityPlan: readonly PublishExpectedDestinationIdentity[];
  readonly dedupeKeys: readonly PublishDeduplicationKey[];
}

export type RepresentativeSampleStatus =
  | "synthetic_local_proof_ready"
  | "user_content_production_blocked"
  | "public_launch_blocked";

export type RepresentativeSampleLevel = "REPRESENTATIVE_SAMPLE_PRECHECK_ONLY";

export interface RepresentativeSampleProvenance {
  readonly trendBriefIdentity: string;
  readonly evidencePackIdentity: string;
  readonly selectedAngleIdentity: string;
  readonly detailedScriptIdentity: string;
  readonly scenePlanningIdentity: string;
  readonly characterMotionIdentity: string;
  readonly renderIntegrationIdentity: string;
  readonly publishIntegrationIdentity: string;
  readonly renderManifestHash: string;
  readonly publishPackageHash: string;
  readonly selectedCharacterDirectionId: CharacterDirectionId;
  readonly platformPackageIdentities: readonly string[];
}

export interface RepresentativeSampleScene {
  readonly sceneId: string;
  readonly sceneOrder: number;
  readonly narration: string;
  readonly keyCaption: string;
  readonly beatType: DetailedScriptBeatType;
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly numberRefs: readonly string[];
  readonly primaryVisualStrategy: VisualStrategyType;
  readonly secondaryVisualStrategies: readonly VisualStrategyType[];
  readonly characterMotion: SceneCharacterMotionAssignment | null;
  readonly subtitleCueSummary: string;
  readonly publishCoverCandidate: boolean;
  readonly unresolvedAssets: readonly string[];
  readonly rightsState: RightsReviewState;
  readonly costState: VisualCostClass;
  readonly safeAreaState: "structural_precheck_pass" | "structural_precheck_blocked";
  readonly actualAssetAvailable: false;
  readonly productionReady: false;
}

export interface RepresentativeSampleStoryboard {
  readonly storyboardVersion: "representative-storyboard-v1";
  readonly sceneCount: 8;
  readonly scenes: readonly RepresentativeSampleScene[];
  readonly sourceOrderPreserved: true;
  readonly syntheticOnly: true;
  readonly productionReady: false;
  readonly publicLaunchReady: false;
}

export interface RepresentativeSampleRenderProfile {
  readonly profileVersion: "representative-sample-profile-v1";
  readonly width: 1080;
  readonly height: 1920;
  readonly framesPerSecond: 30;
  readonly targetDurationSeconds: 24;
  readonly syntheticToneAudio: true;
  readonly actualTts: false;
  readonly actualVisualAssets: false;
  readonly publicReady: false;
}

export interface RepresentativeSampleReferenceRegistry {
  readonly evidenceRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly numberRefs: readonly string[];
}

export interface RepresentativeSampleProvenanceChecks {
  readonly publishSnapshotApproved: boolean;
  readonly renderSnapshotApproved: boolean;
  readonly renderManifestMatchesPublishPackage: boolean;
  readonly selectedCharacterDirectionMatches: boolean;
  readonly sceneFingerprintsMatch: boolean;
  readonly platformPackagesMatch: boolean;
  readonly upstreamExecutionFlagsClear: boolean;
}

export interface RepresentativeSamplePackage {
  readonly packageVersion: "representative-sample-package-v1";
  readonly packageId: string;
  readonly status: "synthetic_local_proof_ready";
  readonly productionStatus: "user_content_production_blocked";
  readonly launchStatus: "public_launch_blocked";
  readonly validationLevel: RepresentativeSampleLevel;
  readonly provenance: RepresentativeSampleProvenance;
  readonly storyboard: RepresentativeSampleStoryboard;
  readonly renderProfile: RepresentativeSampleRenderProfile;
  readonly referenceRegistry: RepresentativeSampleReferenceRegistry;
  readonly provenanceChecks: RepresentativeSampleProvenanceChecks;
  readonly sourceDisclosurePresent: boolean;
  readonly publishMetadataPresent: boolean;
  readonly unresolvedRequirements: readonly string[];
  readonly executionRequested: false;
  readonly externalRequestsMade: false;
  readonly userContentIncluded: false;
  readonly actualAssetsIncluded: false;
  readonly actualRenderExecuted: false;
  readonly syntheticOnly: true;
  readonly productionReady: false;
  readonly publicLaunchReady: false;
}

export interface RepresentativeSampleRenderProof {
  readonly proofVersion: "representative-sample-render-proof-v1";
  readonly sceneCount: 8;
  readonly width: 1080;
  readonly height: 1920;
  readonly framesPerSecond: 30;
  readonly durationSeconds: number;
  readonly videoStreamPresent: boolean;
  readonly audioStreamPresent: boolean;
  readonly subtitleStreamPresent: boolean;
  readonly outputSha256: string;
  readonly nonEmptyOutput: boolean;
  readonly repositoryStatusUnchanged: boolean;
  readonly temporaryDirectoryRemoved: boolean;
  readonly publicReady: false;
  readonly syntheticOnly: true;
}

export interface RepresentativeSampleValidationIssue {
  readonly code: string;
  readonly sceneId: string | null;
  readonly fieldPath: string;
  readonly message: string;
  readonly blocking: boolean;
}

export interface RepresentativeSampleValidationSummary {
  readonly valid: boolean;
  readonly blockingIssueCount: number;
  readonly warningCount: number;
  readonly verificationLevel: RepresentativeSampleLevel;
  readonly approvable: boolean;
  readonly publicLaunchReady: false;
  readonly issues: readonly RepresentativeSampleValidationIssue[];
}

export type RelaunchDirectionId =
  | "evidence_signal_lab"
  | "everyday_economy_lens"
  | "hidden_connection_brief";

export interface RelaunchDirectionDefinition {
  readonly directionId: RelaunchDirectionId;
  readonly temporaryDirectionLabel: string;
  readonly channelPromise: string;
  readonly editorialEmphasis: readonly string[];
  readonly audienceEmphasis: string;
  readonly tone: string;
  readonly visualIdentityPrinciples: readonly string[];
  readonly titleStyle: string;
  readonly descriptionStyle: string;
  readonly pinnedPostStyle: string;
  readonly similarityRisk: string;
  readonly prohibitedClaims: readonly string[];
  readonly provisionalOnly: true;
  readonly finalOwnerApprovalRequired: true;
}

export interface ChannelHandleCandidate {
  readonly handle: string;
  readonly platformIntent: "instagram" | "youtube" | "cross_platform";
  readonly availabilityVerified: false;
  readonly provisionalOnly: true;
}

export interface ChannelSourceDisclosureStandard {
  readonly standardVersion: "channel-source-standard-v1";
  readonly shortStatement: string;
  readonly fullStatement: string;
  readonly requiresSourceAndAsOfDate: true;
  readonly sourceExistenceExternallyVerified: false;
}

export interface ChannelFinancialSafetyStandard {
  readonly standardVersion: "channel-financial-safety-v1";
  readonly statement: string;
  readonly investmentAdviceProvided: false;
  readonly returnGuaranteesAllowed: false;
  readonly specificSecurityRecommendationsAllowed: false;
}

export interface ProvisionalChannelIdentityDraft {
  readonly draftVersion: "provisional-channel-identity-v1";
  readonly directionId: RelaunchDirectionId;
  readonly channelDisplayNameCandidate: string;
  readonly handleCandidates: readonly ChannelHandleCandidate[];
  readonly oneLinePromise: string;
  readonly primaryAudience: string;
  readonly preferredDirectionLabel: string;
  readonly prohibitedWords: readonly string[];
  readonly optionalTagline: string | null;
  readonly provisionalOnly: true;
  readonly finalBrandApproved: false;
  readonly finalHandleAvailabilityVerified: false;
  readonly actualAccountChanged: false;
  readonly finalOwnerApprovalRequired: true;
}

export interface ChannelDescriptionPackage {
  readonly descriptionVersion: "channel-description-package-v1";
  readonly instagramBioDraft: string;
  readonly youtubeShortDescription: string;
  readonly youtubeFullDescription: string;
  readonly sourceStandard: ChannelSourceDisclosureStandard;
  readonly financialSafetyStandard: ChannelFinancialSafetyStandard;
  readonly launchHashtags: readonly string[];
  readonly initialContentPillars: readonly string[];
  readonly currentPlatformLimitsVerified: false;
  readonly performanceClaimsIncluded: false;
  readonly provisionalOnly: true;
}

export interface ProfileAssetDraft {
  readonly assetDraftVersion: "profile-asset-draft-v1";
  readonly badgeText: string;
  readonly conceptDescription: string;
  readonly characterDirectionId: CharacterDirectionId;
  readonly inlineSvgPreviewOnly: true;
  readonly actualProductionAsset: false;
  readonly thirdPartyAssetsUsed: false;
}

export interface CoverAssetDraft {
  readonly assetDraftVersion: "cover-asset-draft-v1";
  readonly coverTitle: string;
  readonly coverSubtitle: string;
  readonly sourceFirstBadge: string;
  readonly safeAreaGuideRequired: true;
  readonly inlineSvgPreviewOnly: true;
  readonly actualProductionAsset: false;
  readonly thirdPartyAssetsUsed: false;
}

export interface PinnedRelaunchPostDraft {
  readonly postVersion: "pinned-relaunch-post-v1";
  readonly headline: string;
  readonly contentPromise: string;
  readonly sourceCommitment: string;
  readonly financialSafetyStatement: string;
  readonly firstContentPillars: readonly string[];
  readonly performanceClaimsIncluded: false;
  readonly publicPostCreated: false;
  readonly provisionalOnly: true;
}

export interface RelaunchAssetPlan {
  readonly planVersion: "relaunch-asset-plan-v1";
  readonly profile: ProfileAssetDraft;
  readonly verticalCover: CoverAssetDraft;
  readonly youtubeBanner: CoverAssetDraft;
  readonly pinnedPostCover: CoverAssetDraft;
  readonly characterOriginalityState: "owned_original_planning_evidence";
  readonly rightsState: "planning_review_only";
  readonly actualAssetsCreated: false;
}

export interface RelaunchPackage {
  readonly packageVersion: "relaunch-readiness-package-v1";
  readonly packageId: string;
  readonly directions: readonly RelaunchDirectionDefinition[];
  readonly selectedDirectionId: RelaunchDirectionId;
  readonly identityDraft: ProvisionalChannelIdentityDraft;
  readonly descriptions: ChannelDescriptionPackage;
  readonly pinnedPost: PinnedRelaunchPostDraft;
  readonly assetPlan: RelaunchAssetPlan;
  readonly finalBrandApproved: false;
  readonly actualAccountChanged: false;
  readonly publicLaunchReady: false;
  readonly controlTowerFinalApprovalRequired: true;
}

export interface RelaunchValidationIssue {
  readonly code: string;
  readonly fieldPath: string;
  readonly message: string;
  readonly blocking: boolean;
}

export interface RelaunchValidationSummary {
  readonly valid: boolean;
  readonly blockingIssueCount: number;
  readonly warningCount: number;
  readonly approvable: boolean;
  readonly publicLaunchReady: false;
  readonly issues: readonly RelaunchValidationIssue[];
}

export type LaunchReadinessCategory =
  | "content"
  | "evidence"
  | "brand"
  | "character"
  | "voice"
  | "assets"
  | "render"
  | "account"
  | "publishing"
  | "persistence"
  | "rights"
  | "cost"
  | "operations";

export type LaunchReadinessStatus = "ready_for_scope_request" | "blocked" | "not_verified";

export interface LaunchReadinessChecklistItem {
  readonly itemId: string;
  readonly category: LaunchReadinessCategory;
  readonly label: string;
  readonly status: LaunchReadinessStatus;
  readonly blocking: boolean;
  readonly evidence: readonly string[];
  readonly requiredAction: string;
  readonly responsibleRole: "Owner" | "ChatGPT Control Tower" | "Codex Main" | "Production Activation implementation";
  readonly externalActionRequired: boolean;
}

export interface LaunchReadinessSummary {
  readonly totalCount: number;
  readonly blockingCount: number;
  readonly notVerifiedCount: number;
  readonly categoryCounts: readonly {
    readonly category: LaunchReadinessCategory;
    readonly total: number;
    readonly blocking: number;
  }[];
  readonly canRequestProductionActivation: boolean;
  readonly publicLaunchReady: false;
}

export type RelaunchApprovalState = "not_approved" | "provisionally_approved" | "invalidated";

export interface ApprovedRelaunchReadinessSessionSnapshot {
  readonly representativePackage: RepresentativeSamplePackage;
  readonly representativeValidation: RepresentativeSampleValidationSummary;
  readonly relaunchPackage: RelaunchPackage;
  readonly relaunchValidation: RelaunchValidationSummary;
  readonly launchChecklist: readonly LaunchReadinessChecklistItem[];
  readonly launchReadiness: LaunchReadinessSummary;
  readonly selectedDirectionId: RelaunchDirectionId;
  readonly allDirectionsReviewed: true;
  readonly actualProductionGapsAcknowledged: true;
  readonly controlTowerFinalApprovalAcknowledged: true;
  readonly approvalState: "provisionally_approved";
  readonly sessionOnly: true;
  readonly finalBrandApproved: false;
  readonly actualAccountChanged: false;
  readonly actualAssetsCreated: false;
  readonly publicLaunchApproved: false;
  readonly publicLaunchReady: false;
}

export interface Slice8SessionState {
  readonly approvedPublishIntegration: ApprovedPublishIntegrationSessionSnapshot | null;
  readonly representativePackage: RepresentativeSamplePackage | null;
  readonly representativeValidation: RepresentativeSampleValidationSummary | null;
  readonly relaunchPackage: RelaunchPackage | null;
  readonly relaunchValidation: RelaunchValidationSummary | null;
  readonly launchChecklist: readonly LaunchReadinessChecklistItem[];
  readonly launchReadiness: LaunchReadinessSummary | null;
  readonly approvalState: RelaunchApprovalState;
  readonly approvedSnapshot: ApprovedRelaunchReadinessSessionSnapshot | null;
}
