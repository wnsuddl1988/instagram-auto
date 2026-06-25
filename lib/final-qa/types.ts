export const FINAL_QA_SCHEMA_VERSION = "money_shorts_final_qa_v1" as const;

/**
 * A single QA check within a checklist run.
 * Each check is either pass or fail with a code and optional detail.
 */
export interface QaCheckResult {
  checkId: string;
  /** Human-readable label for this check. */
  label: string;
  passed: boolean;
  /** Short machine-readable code used to identify the failure type. */
  code: string | null;
  /** Human-readable detail when the check fails. */
  detail: string | null;
}

/** Severity grouping for a QA check. */
export type QaSeverity = "blocker" | "warning" | "info";

/** A check definition used to drive the checklist. */
export interface QaCheckSpec {
  checkId: string;
  label: string;
  severity: QaSeverity;
}

/**
 * The complete final QA result for a source-first package chain.
 * Aggregates structural checks across all linked local modules.
 */
export interface FinalQaResult {
  schemaVersion: typeof FINAL_QA_SCHEMA_VERSION;
  qaRunId: string;
  /** Source Blueprint videoId or Script packageId. */
  sourceId: string;
  sourceType: "blueprint" | "script_package";
  /** Overall readiness gate. True only when all blocker checks pass. */
  readyForRender: boolean;
  /** True when any risk-review check is blocked. */
  isRiskBlocked: boolean;
  checks: QaCheckResult[];
  /** Summary counts. */
  summary: {
    total: number;
    passed: number;
    failed: number;
    blockersFailed: number;
  };
  createdAt?: string;
}

/** Input package chain for one QA run. All packages are optional except the core ones. */
export interface FinalQaInput {
  /** Source id (Blueprint videoId or Script packageId). */
  sourceId: string;
  sourceType: "blueprint" | "script_package";
  /** Non-empty Fact Card ids from the source. */
  factCardIds: string[];
  /** Non-empty source citation ids from the source. */
  sourceCitationIds: string[];
  /**
   * Risk review result. Provide when available.
   * If omitted the risk check is skipped with a warning.
   */
  riskReview?: {
    isBlocked: boolean;
    overallRiskLevel: string;
    findings: unknown[];
  };
  /**
   * Script package validation result from lib/scripts.
   * Provide when source is a script package.
   */
  scriptValidation?: { ok: boolean; errors: Array<{ code: string; message: string }> };
  /**
   * Chart card package validation result from lib/chart-cards.
   * Provide when chart cards are part of the chain.
   */
  chartCardValidation?: { ok: boolean; errors: Array<{ code: string; message: string }> };
  /**
   * Image prompt package validation result from lib/image-prompts.
   * Provide when image prompts are part of the chain.
   */
  imagePromptValidation?: { ok: boolean; errors: Array<{ code: string; message: string }> };
  /**
   * Voice profile validation result from lib/voice-profiles.
   * Provide when a voice profile is part of the chain.
   */
  voiceProfileValidation?: { ok: boolean; errors: Array<{ code: string; message: string }> };
  /**
   * TTS script package validation result from lib/voice-profiles.
   * Provide when a TTS package is part of the chain.
   */
  ttsValidation?: { ok: boolean; errors: Array<{ code: string; message: string }> };
  /**
   * Timeline validation result from lib/timeline.
   * Provide when a timeline is part of the chain.
   */
  timelineValidation?: { ok: boolean; errors: Array<{ code: string; message: string }> };
  /** Timeline measuredAudioDurationSec — for cross-checking with render plan. */
  timelineMeasuredDurationSec?: number;

  // ── Per-package linkage fields for cross-package id consistency checks ────────
  // When provided, the checker verifies these ids match the core sourceId/factCardIds/sourceCitationIds
  // (or an explicitly declared related blueprint id — see blueprintVideoId below).

  /**
   * When the core sourceId is a Script Package, provide the expected Script Package id here.
   * The checker verifies that sourceId === scriptPackageId (blocker when mismatched).
   * Leave unset when no explicit package id check is needed.
   */
  scriptPackageId?: string;

  /**
   * When the core sourceId is a Script Package, the originating Blueprint videoId may differ.
   * Provide it here so Timeline/Render Manifest ids (which use the Blueprint videoId) can
   * be cross-checked correctly instead of being compared against the script packageId.
   * Leave unset when the core sourceId is already a Blueprint videoId.
   */
  blueprintVideoId?: string;

  // Timeline cross-check fields
  timelineId?: string;
  timelineSourceId?: string;
  timelineFactCardIds?: string[];
  timelineSourceCitationIds?: string[];

  // Render manifest cross-check fields
  renderManifestSourceId?: string;
  renderManifestFactCardIds?: string[];
  renderManifestSourceCitationIds?: string[];
  /** Timeline id stored in the render manifest — must match timelineId. */
  renderManifestTimelineId?: string;

  /**
   * Render manifest validation result from lib/render-plan.
   * Provide when a render manifest is part of the chain.
   */
  renderManifestValidation?: { ok: boolean; errors: Array<{ code: string; message: string }> };
  /** Render manifest plannedOutputPath — must be relative placeholder. */
  renderManifestPlannedOutputPath?: string;
  /** Render manifest estimatedDurationSec from ffmpegPlan — for cross-checking with timeline. */
  renderManifestEstimatedDurationSec?: number;
  /** Caption overlay count from render manifest — must be > 0. */
  renderManifestCaptionCount?: number;
  /** Source overlay count from render manifest — checked when source refs provided. */
  renderManifestSourceOverlayCount?: number;
}
