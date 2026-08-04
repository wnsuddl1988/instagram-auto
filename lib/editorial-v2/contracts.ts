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
