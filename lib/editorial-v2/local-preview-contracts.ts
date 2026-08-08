import type {
  CharacterDirectionId,
  CharacterRigMotionTag,
  DetailedScriptBeatType,
  RightsReviewState,
  SubtitleCue,
  VisualCostClass,
  VisualStrategyType,
} from "./contracts";

export const SHORTS_EDITORIAL_OS_V2_LOCAL_PREVIEW_RENDER_ENABLED = "SHORTS_EDITORIAL_OS_V2_LOCAL_PREVIEW_RENDER_ENABLED" as const;
export const LOCAL_PREVIEW_PROFILE_ID = "preview_540x960" as const;
export const LOCAL_PREVIEW_WIDTH = 540 as const;
export const LOCAL_PREVIEW_HEIGHT = 960 as const;
export const LOCAL_PREVIEW_FPS = 30 as const;
export const LOCAL_PREVIEW_MAX_REQUEST_BYTES = 16_384;
export const LOCAL_PREVIEW_MAX_OUTPUT_BYTES = 100 * 1024 * 1024;
export const LOCAL_PREVIEW_MAX_SCENE_FRAMES = 30;

export type LocalPreviewProfileId = typeof LOCAL_PREVIEW_PROFILE_ID;
export type LocalPreviewRenderStatus = "not_ready" | "ready" | "rendering" | "completed" | "cache_hit" | "failed" | "in_flight";
export type LocalPreviewAssetResolution = "resolved_local_primitive" | "preview_placeholder_only";
export type LocalPreviewValidationLevel = "LOCAL_USER_CONTENT_PREVIEW_ONLY";

export interface LocalPreviewSourceMetadata {
  readonly sourceId: string;
  readonly publisher: string;
  readonly title: string;
  readonly publishedAt: string;
  readonly eventDate: string | null;
  readonly urlText: string;
}

export interface LocalPreviewNumberMetadata {
  readonly numberId: string;
  readonly value: number;
  readonly unit: string;
  readonly currency: string | null;
  readonly asOf: string;
  readonly context: string;
  readonly sourceRefs: readonly string[];
}

export interface LocalPreviewCharacterPose {
  readonly phase: 0 | 0.5 | 1;
  readonly motionTag: CharacterRigMotionTag;
  readonly translateX: number;
  readonly translateY: number;
  readonly scale: number;
  readonly rotationDegrees: number;
  readonly opacity: number;
  readonly label: "CHARACTER_MOTION_PREVIEW_PROXY";
  readonly productionAnimation: false;
}

export interface LocalPreviewSceneInput {
  readonly sceneId: string;
  readonly order: number;
  readonly durationMs: number;
  readonly beatType: DetailedScriptBeatType;
  readonly purpose: string;
  readonly narration: string;
  readonly keyCaption: string;
  readonly sourceRefs: readonly string[];
  readonly numberRefs: readonly string[];
  readonly claimRefs: readonly string[];
  readonly sources: readonly LocalPreviewSourceMetadata[];
  readonly numbers: readonly LocalPreviewNumberMetadata[];
  readonly primaryVisualStrategy: VisualStrategyType;
  readonly secondaryStrategies: readonly VisualStrategyType[];
  readonly chartLabels: readonly string[];
  readonly chartUnit: string | null;
  readonly timelineEntries: readonly { readonly evidenceRef: string; readonly date: string; readonly label: string }[];
  readonly relationshipLabels: readonly string[];
  readonly characterDirection: CharacterDirectionId;
  readonly characterMotionTag: CharacterRigMotionTag;
  readonly reducedMotionTag: string;
  readonly estimatedSubtitleCues: readonly SubtitleCue[];
  readonly rightsState: RightsReviewState;
  readonly costClass: VisualCostClass;
  readonly unresolvedAssets: readonly string[];
  readonly assetResolution: LocalPreviewAssetResolution;
  readonly safeAreaState: "structural_precheck_pass" | "structural_precheck_blocked";
  readonly sceneRevision: number;
  readonly fingerprint: string;
}

export interface LocalPreviewSceneFrame {
  readonly sceneId: string;
  readonly sceneOrder: number;
  readonly phase: 0 | 0.5 | 1;
  readonly durationMs: number;
  readonly fileName: string;
}

export interface LocalPreviewRenderInput {
  readonly schemaVersion: "local-preview-input-v1";
  readonly projectId: string;
  readonly projectRevision: number;
  readonly projectIntegrityHash: string;
  readonly sourceCheckpointHashes: Readonly<{
    editorialIntelligence: string;
    scenePlanning: string;
    characterMotion: string;
    renderIntegration: string;
  }>;
  readonly renderCheckpointHash: string;
  readonly profile: Readonly<{
    profileId: LocalPreviewProfileId;
    width: typeof LOCAL_PREVIEW_WIDTH;
    height: typeof LOCAL_PREVIEW_HEIGHT;
    fps: typeof LOCAL_PREVIEW_FPS;
    actualFinal: false;
    productionReady: false;
    audioMode: "silent_placeholder";
    subtitleAlignment: "estimated_not_audio_aligned";
    assetResolutionLevel: "local_preview_with_placeholders";
  }>;
  readonly sceneCount: number;
  readonly durationMs: number;
  readonly selectedCharacterDirection: CharacterDirectionId;
  readonly scenes: readonly LocalPreviewSceneInput[];
  readonly warnings: readonly string[];
  readonly createdFromCanonicalApprovedCheckpoints: true;
}

export interface LocalPreviewRenderIdentity {
  readonly renderId: string;
  readonly renderInputHash: string;
  readonly projectId: string;
  readonly projectRevision: number;
  readonly renderCheckpointHash: string;
  readonly profile: LocalPreviewProfileId;
}

export interface LocalPreviewRenderRequest {
  readonly expectedProjectRevision: number;
  readonly expectedRenderCheckpointHash: string;
  readonly profile: LocalPreviewProfileId;
  readonly ownerLocalPreviewConfirmation: true;
}

export interface LocalPreviewPersistedProjectSummary {
  readonly projectId: string;
  readonly projectRevision: number;
  readonly projectStatus: "active" | "archived";
  readonly renderCheckpointHash: string | null;
  readonly renderManifestHash: string | null;
  readonly sceneCount: number;
  readonly durationMs: number;
  readonly unresolvedAssetCount: number;
  readonly characterDirection: CharacterDirectionId | null;
}

export interface LocalPreviewProbeStreamSummary {
  readonly video: boolean;
  readonly audio: boolean;
  readonly subtitle: boolean;
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  readonly durationMs: number;
  readonly formatName: string;
}

export interface LocalPreviewRenderMetadata {
  readonly schemaVersion: "local-preview-metadata-v1";
  readonly status: "completed";
  readonly renderId: string;
  readonly projectId: string;
  readonly projectRevision: number;
  readonly renderInputHash: string;
  readonly sourceCheckpointHashes: LocalPreviewRenderInput["sourceCheckpointHashes"];
  readonly renderCheckpointHash: string;
  readonly profile: LocalPreviewProfileId;
  readonly sceneCount: number;
  readonly durationMs: number;
  readonly width: typeof LOCAL_PREVIEW_WIDTH;
  readonly height: typeof LOCAL_PREVIEW_HEIGHT;
  readonly fps: typeof LOCAL_PREVIEW_FPS;
  readonly audioMode: "silent_placeholder";
  readonly subtitleAlignment: "estimated_not_audio_aligned";
  readonly unresolvedAssetCount: number;
  readonly placeholderSceneIds: readonly string[];
  readonly characterDirection: CharacterDirectionId;
  readonly characterMotionProxy: true;
  readonly productionAnimation: false;
  readonly productionReady: false;
  readonly outputSha256: string;
  readonly outputBytes: number;
  readonly completedAtIso: string;
  readonly probe: LocalPreviewProbeStreamSummary;
  readonly warnings: readonly string[];
}

export interface LocalPreviewValidationIssue {
  readonly code: string;
  readonly fieldPath: string;
  readonly message: string;
  readonly blocking: boolean;
  readonly sceneId: string | null;
}

export interface LocalPreviewValidationSummary {
  readonly valid: boolean;
  readonly blockingIssueCount: number;
  readonly warningCount: number;
  readonly level: LocalPreviewValidationLevel;
  readonly issues: readonly LocalPreviewValidationIssue[];
}

export interface LocalPreviewExecutionResult {
  readonly ok: boolean;
  readonly status: LocalPreviewRenderStatus;
  readonly identity: LocalPreviewRenderIdentity | null;
  readonly metadata: LocalPreviewRenderMetadata | null;
  readonly cacheStatus: "miss_rendered" | "hit_reused" | "in_flight_reused" | "not_applicable";
  readonly ffmpegExecuted: boolean;
  readonly message: string;
}

export interface LocalPreviewMediaDescriptor {
  readonly renderId: string;
  readonly mediaPath: string;
  readonly contentType: "video/mp4";
  readonly outputBytes: number;
  readonly outputSha256: string;
}

export interface LocalPreviewCacheResult {
  readonly hit: boolean;
  readonly identity: LocalPreviewRenderIdentity;
  readonly metadata: LocalPreviewRenderMetadata | null;
  readonly reason: string;
}

export function parseLocalPreviewRenderEnabled(value: unknown): boolean {
  return value === "1" || value === "true";
}

export function isLocalPreviewRenderEnabled(env: Readonly<Record<string, string | undefined>>): boolean {
  return parseLocalPreviewRenderEnabled(env[SHORTS_EDITORIAL_OS_V2_LOCAL_PREVIEW_RENDER_ENABLED]);
}

export function localPreviewProfile() {
  return {
    profileId: LOCAL_PREVIEW_PROFILE_ID,
    width: LOCAL_PREVIEW_WIDTH,
    height: LOCAL_PREVIEW_HEIGHT,
    fps: LOCAL_PREVIEW_FPS,
    actualFinal: false,
    productionReady: false,
    audioMode: "silent_placeholder",
    subtitleAlignment: "estimated_not_audio_aligned",
    assetResolutionLevel: "local_preview_with_placeholders",
  } as const;
}
