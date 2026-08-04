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
