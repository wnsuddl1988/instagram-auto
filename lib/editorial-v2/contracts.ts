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
