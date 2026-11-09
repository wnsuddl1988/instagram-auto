import type {
  CharacterMotionSessionState,
  EditorialIntelligenceSessionState,
  EditorialV2ApprovedStageId,
  EditorialV2JsonValue,
  FieldRepairPackage,
  ImportApprovalState,
  ImportIssue,
  PromptPackage,
  PublishExecutionIntent,
  PublishPlatformId,
  PublishVisibilityIntent,
  RelaunchDirectionId,
  RenderManifest,
  RenderProfileId,
  ResearchWindowPreset,
  ScenePlanningSessionState,
  SessionPublicationLedger,
  TargetDurationSeconds,
  TrendBriefImportValidationSummary,
  VoiceProviderMode,
} from "./contracts";

export const EDITORIAL_V2_DRAFT_NAMESPACE = "shorts-editorial-os-v2-draft-store" as const;
export const EDITORIAL_V2_DRAFT_SCHEMA_VERSION = "1.0.0" as const;
export const EDITORIAL_V2_DRAFT_MAX_BYTES = 8_388_608;
export const EDITORIAL_V2_DRAFT_MAX_RAW_TEXT_BYTES = 4_194_304;
export const EDITORIAL_V2_DRAFT_AUTOSAVE_DEBOUNCE_MS = 1_350;

export const EDITORIAL_V2_DRAFT_STAGE_ORDER = [
  "trend_brief_import",
  "editorial_intelligence",
  "scene_planning",
  "character_motion",
  "render_integration",
  "publish_integration",
  "relaunch_readiness",
] as const satisfies readonly EditorialV2ApprovedStageId[];

export type EditorialV2DraftSchemaVersion = typeof EDITORIAL_V2_DRAFT_SCHEMA_VERSION;
export type EditorialV2DraftRevision = number;
export type EditorialV2DraftStageId = (typeof EDITORIAL_V2_DRAFT_STAGE_ORDER)[number];
export type EditorialV2DraftApprovalLikeState =
  | "not_approved"
  | "invalidated"
  | "pending_reconfirmation";

export interface EditorialV2DraftStageState {
  readonly stageId: EditorialV2DraftStageId;
  readonly approvalAuthority: "non_canonical_draft";
  readonly approvalLikeState: EditorialV2DraftApprovalLikeState;
}

export interface ResearchImportDraftState extends EditorialV2DraftStageState {
  readonly stageId: "trend_brief_import";
  readonly researchInput: {
    readonly researchCutoffDate: string;
    readonly researchWindow: ResearchWindowPreset;
    readonly domain: string;
    readonly audience: string;
    readonly targetDurationSeconds: TargetDurationSeconds;
    readonly additionalFocus: string;
  };
  readonly generatedPrompt: PromptPackage | null;
  readonly rawImport: string;
  readonly normalizedPreview: EditorialV2JsonValue | null;
  readonly rawHash: string;
  readonly normalizedHash: string;
  readonly validationSummary: TrendBriefImportValidationSummary | null;
  readonly sessionHashes: readonly string[];
  readonly repairInput: string;
  readonly repairPrompt: PromptPackage | null;
  readonly repairPreview: FieldRepairPackage | null;
  readonly repairIssues: readonly ImportIssue[];
  readonly uiSelectionState: Readonly<Record<string, string | number | boolean | null>>;
  readonly approvalState: ImportApprovalState | "pending_reconfirmation";
}

export interface EditorialIntelligenceDraftState extends EditorialV2DraftStageState {
  readonly stageId: "editorial_intelligence";
  readonly session: EditorialIntelligenceSessionState;
  readonly normalizationMethod: string;
  readonly scriptRawHash: string;
  readonly scriptNormalizedHash: string;
  readonly rawImportHashes: readonly string[];
  readonly repairPrompt: PromptPackage | null;
  readonly repairPackage: FieldRepairPackage | null;
  readonly repairIssues: readonly ImportIssue[];
}

export interface ScenePlanningDraftState extends EditorialV2DraftStageState {
  readonly stageId: "scene_planning";
  readonly session: ScenePlanningSessionState;
  readonly selectedSceneId: string | null;
}

export interface CharacterMotionDraftState extends EditorialV2DraftStageState {
  readonly stageId: "character_motion";
  readonly session: CharacterMotionSessionState;
  readonly comparisonMotionTag: string;
}

export interface RenderIntegrationDraftState extends EditorialV2DraftStageState {
  readonly stageId: "render_integration";
  readonly voiceMode: VoiceProviderMode;
  readonly locale: string;
  readonly voiceIdentity: string;
  readonly providerId: string;
  readonly providerLabel: string;
  readonly manualCostBasisLabel: string;
  readonly ownerExternalApprovalConfirmed: boolean;
  readonly targetDurationSeconds: number;
  readonly selectedProfileId: RenderProfileId;
  readonly approvedVoiceKey: string | null;
  readonly approvedRenderKey: string | null;
  readonly lastApprovedManifest: RenderManifest | null;
}

export interface PublishIntegrationDraftState extends EditorialV2DraftStageState {
  readonly stageId: "publish_integration";
  readonly selectedPlatforms: readonly PublishPlatformId[];
  readonly instagramExpectedId: string;
  readonly instagramObservedId: string;
  readonly instagramLabel: string;
  readonly instagramOwnerConfirmed: boolean;
  readonly youtubeExpectedId: string;
  readonly youtubeObservedId: string;
  readonly youtubeLabel: string;
  readonly youtubeOwnerConfirmed: boolean;
  readonly instagramHashtags: string;
  readonly youtubeHashtags: string;
  readonly instagramCoverSceneId: string;
  readonly youtubeCoverSceneId: string;
  readonly youtubeVisibility: PublishVisibilityIntent;
  readonly executionIntent: PublishExecutionIntent;
  readonly scheduledAtIso: string;
  readonly timezone: string;
  readonly validationNowIso: string;
  readonly scheduleOwnerConfirmation: boolean;
  readonly ledger: SessionPublicationLedger;
  readonly actualPublishNotIncludedConfirmed: boolean;
  readonly approvedPackageHash: string | null;
}

export interface SampleRelaunchDraftState extends EditorialV2DraftStageState {
  readonly stageId: "relaunch_readiness";
  readonly selectedDirectionId: RelaunchDirectionId | "";
  readonly reviewedDirectionIds: readonly RelaunchDirectionId[];
  readonly identityDraft: {
    readonly channelNameCandidate: string;
    readonly handleCandidates: string;
    readonly oneLinePromise: string;
    readonly primaryAudience: string;
    readonly prohibitedWords: string;
    readonly tagline: string;
  };
  readonly acknowledgementStates: {
    readonly productionGapsAcknowledged: boolean;
    readonly controlTowerApprovalAcknowledged: boolean;
  };
  readonly approvedIdentity: string | null;
}

export interface EditorialV2DraftStageStateMap {
  readonly trend_brief_import?: ResearchImportDraftState;
  readonly editorial_intelligence?: EditorialIntelligenceDraftState;
  readonly scene_planning?: ScenePlanningDraftState;
  readonly character_motion?: CharacterMotionDraftState;
  readonly render_integration?: RenderIntegrationDraftState;
  readonly publish_integration?: PublishIntegrationDraftState;
  readonly relaunch_readiness?: SampleRelaunchDraftState;
}

export interface EditorialV2DraftIntegrity {
  readonly algorithm: "sha256";
  readonly canonicalization: "stable-json-v1";
  readonly canonicalHash: string;
}

export interface EditorialV2DraftValidationIssue {
  readonly code: string;
  readonly fieldPath: string;
  readonly message: string;
  readonly blocking: true;
}

export interface EditorialV2DraftValidationSummary {
  readonly valid: boolean;
  readonly issues: readonly EditorialV2DraftValidationIssue[];
}

export interface EditorialV2FullDraftSnapshot {
  readonly namespace: typeof EDITORIAL_V2_DRAFT_NAMESPACE;
  readonly schemaVersion: "1.0.0";
  readonly draftSchemaVersion: EditorialV2DraftSchemaVersion;
  readonly projectId: string;
  readonly draftRevision: EditorialV2DraftRevision;
  readonly baseProjectRevision: number;
  readonly baseApprovedStage: EditorialV2ApprovedStageId | null;
  readonly baseApprovedCheckpointHash: string;
  readonly savedAtIso: string;
  readonly stageStates: EditorialV2DraftStageStateMap;
  readonly dirtyStageIds: readonly EditorialV2DraftStageId[];
  readonly draftHash: string;
  readonly integrity: EditorialV2DraftIntegrity;
}

export interface EditorialV2DraftBuildInput {
  readonly projectId: string;
  readonly draftRevision: number;
  readonly baseProjectRevision: number;
  readonly baseApprovedStage: EditorialV2ApprovedStageId | null;
  readonly baseApprovedCheckpointHash: string;
  readonly savedAtIso: string;
  readonly stageStates: EditorialV2DraftStageStateMap;
  readonly dirtyStageIds: readonly EditorialV2DraftStageId[];
}

export interface EditorialV2DraftSaveRequest {
  readonly projectId: string;
  readonly expectedDraftRevision: number;
  readonly expectedBaseProjectRevision: number;
  readonly draft: EditorialV2FullDraftSnapshot;
}

export interface EditorialV2DraftSaveResult {
  readonly ok: boolean;
  readonly status: "saved" | "draft_revision_conflict" | "base_project_conflict" | "integrity_conflict" | "schema_conflict" | "validation_error" | "not_found" | "disabled" | "io_error";
  readonly projectId: string | null;
  readonly draftRevision: number | null;
  readonly draftHash: string | null;
  readonly message: string;
  readonly conflict: EditorialV2DraftConflict | null;
}

export interface EditorialV2DraftLoadResult {
  readonly ok: boolean;
  readonly status: "ready" | "not_found" | "corrupted" | "schema_conflict" | "validation_error" | "disabled" | "io_error";
  readonly projectId: string;
  readonly draft: EditorialV2FullDraftSnapshot | null;
  readonly recoveryState: EditorialV2DraftRecoveryState | null;
  readonly message: string;
}

export interface EditorialV2DraftConflict {
  readonly code: "draft_revision_conflict" | "base_project_conflict";
  readonly expectedDraftRevision: number;
  readonly actualDraftRevision: number;
  readonly expectedBaseProjectRevision: number;
  readonly actualBaseProjectRevision: number;
  readonly autosavePaused: true;
  readonly automaticMerge: false;
}

export type EditorialV2DraftHydrationStatus =
  | "safe_to_hydrate"
  | "stale_draft"
  | "revision_conflict"
  | "corrupted_draft"
  | "schema_mismatch"
  | "project_mismatch";

export interface EditorialV2DraftHydrationDecision {
  readonly status: EditorialV2DraftHydrationStatus;
  readonly safe: boolean;
  readonly autoHydrate: boolean;
  readonly approvalDowngraded: boolean;
  readonly reasons: readonly string[];
  readonly draft: EditorialV2FullDraftSnapshot | null;
}

export interface EditorialV2DraftRecoveryState {
  readonly projectId: string;
  readonly currentExists: boolean;
  readonly currentValid: boolean;
  readonly currentDraftRevision: number | null;
  readonly lastKnownGoodExists: boolean;
  readonly lastKnownGoodValid: boolean;
  readonly lastKnownGoodDraftRevision: number | null;
  readonly corruptionPreserved: boolean;
  readonly automaticRecoveryAllowed: false;
  readonly ownerConfirmationRequired: true;
}

export type EditorialV2DraftAutosaveStatus =
  | "disabled"
  | "no_project"
  | "loading"
  | "hydrating"
  | "clean"
  | "unsaved_changes"
  | "saving"
  | "saved"
  | "conflict"
  | "corrupted"
  | "error";

export interface EditorialV2DraftRecoveryRequest {
  readonly action: "recover_draft";
  readonly ownerConfirmed: boolean;
  readonly expectedCorruptedRevision: number | null;
  readonly approvedAtIso: string;
}
