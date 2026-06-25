import type { FinalQaInput, FinalQaResult, QaCheckResult } from "./types";
import { FINAL_QA_SCHEMA_VERSION } from "./types";

const MAX_DURATION_MISMATCH_SEC = 0.1;

export interface FinalQaCheckerOptions {
  qaRunId?: string;
  createdAt?: string;
}

function pass(checkId: string, label: string): QaCheckResult {
  return { checkId, label, passed: true, code: null, detail: null };
}

function fail(checkId: string, label: string, code: string, detail: string): QaCheckResult {
  return { checkId, label, passed: false, code, detail };
}

/**
 * Runs the final QA checklist across all provided package chain inputs.
 * Deterministic and data-only — no external calls, no media probing.
 */
export function runFinalQa(
  input: FinalQaInput,
  options: FinalQaCheckerOptions = {},
): FinalQaResult {
  const checks: QaCheckResult[] = [];

  // ── 1. Core linkage checks (blockers) ────────────────────────────────────────

  // 1-a. sourceId present
  checks.push(
    input.sourceId
      ? pass("core-source-id", "sourceId is non-empty")
      : fail("core-source-id", "sourceId is non-empty", "missing_source_id", "sourceId is empty"),
  );

  // 1-b. factCardIds non-empty
  checks.push(
    input.factCardIds && input.factCardIds.length > 0
      ? pass("core-fact-card-ids", "factCardIds is non-empty")
      : fail("core-fact-card-ids", "factCardIds is non-empty", "missing_fact_card_ids", "factCardIds must have at least one entry"),
  );

  // 1-c. sourceCitationIds non-empty
  checks.push(
    input.sourceCitationIds && input.sourceCitationIds.length > 0
      ? pass("core-citation-ids", "sourceCitationIds is non-empty")
      : fail("core-citation-ids", "sourceCitationIds is non-empty", "missing_citation_ids", "sourceCitationIds must have at least one entry"),
  );

  // ── 2. Risk review checks (blocker when blocked, warning when missing) ────────

  if (input.riskReview !== undefined) {
    checks.push(
      !input.riskReview.isBlocked
        ? pass("risk-not-blocked", "Risk review is not blocked")
        : fail(
            "risk-not-blocked",
            "Risk review is not blocked",
            "risk_blocked",
            `Risk review returned isBlocked=true (overallRiskLevel=${input.riskReview.overallRiskLevel})`,
          ),
    );
    // high-risk warning (not a blocker by itself, but surfaced)
    const level = input.riskReview.overallRiskLevel;
    checks.push(
      level !== "high" && level !== "blocked"
        ? pass("risk-level-acceptable", "Risk level is low or medium")
        : fail(
            "risk-level-acceptable",
            "Risk level is low or medium",
            "risk_level_elevated",
            `overallRiskLevel is "${level}" — review findings before proceeding`,
          ),
    );
  } else {
    checks.push(
      fail(
        "risk-not-blocked",
        "Risk review is not blocked",
        "risk_review_not_provided",
        "riskReview was not supplied — skipping risk check",
      ),
    );
    checks.push(
      fail(
        "risk-level-acceptable",
        "Risk level is low or medium",
        "risk_review_not_provided",
        "riskReview was not supplied — skipping risk level check",
      ),
    );
  }

  // ── 3. Script validation (blocker when provided) ──────────────────────────────

  if (input.scriptValidation !== undefined) {
    checks.push(
      input.scriptValidation.ok
        ? pass("script-validation", "Script package validation passes")
        : fail(
            "script-validation",
            "Script package validation passes",
            "script_validation_failed",
            `Script validation errors: ${input.scriptValidation.errors.map((e) => e.code).join(", ")}`,
          ),
    );
  }

  // ── 4. Chart card validation (blocker when provided) ─────────────────────────

  if (input.chartCardValidation !== undefined) {
    checks.push(
      input.chartCardValidation.ok
        ? pass("chart-card-validation", "Chart card package validation passes")
        : fail(
            "chart-card-validation",
            "Chart card package validation passes",
            "chart_card_validation_failed",
            `Chart card errors: ${input.chartCardValidation.errors.map((e) => e.code).join(", ")}`,
          ),
    );
  }

  // ── 5. Image prompt validation (blocker when provided) ───────────────────────

  if (input.imagePromptValidation !== undefined) {
    checks.push(
      input.imagePromptValidation.ok
        ? pass("image-prompt-validation", "Image prompt package validation passes")
        : fail(
            "image-prompt-validation",
            "Image prompt package validation passes",
            "image_prompt_validation_failed",
            `Image prompt errors: ${input.imagePromptValidation.errors.map((e) => e.code).join(", ")}`,
          ),
    );
  }

  // ── 6. Voice profile validation (blocker when provided) ──────────────────────

  if (input.voiceProfileValidation !== undefined) {
    checks.push(
      input.voiceProfileValidation.ok
        ? pass("voice-profile-validation", "Voice profile validation passes")
        : fail(
            "voice-profile-validation",
            "Voice profile validation passes",
            "voice_profile_validation_failed",
            `Voice profile errors: ${input.voiceProfileValidation.errors.map((e) => e.code).join(", ")}`,
          ),
    );
  }

  // ── 7. TTS package validation (blocker when provided) ────────────────────────

  if (input.ttsValidation !== undefined) {
    checks.push(
      input.ttsValidation.ok
        ? pass("tts-validation", "TTS script package validation passes")
        : fail(
            "tts-validation",
            "TTS script package validation passes",
            "tts_validation_failed",
            `TTS errors: ${input.ttsValidation.errors.map((e) => e.code).join(", ")}`,
          ),
    );
  }

  // ── 8. Timeline validation (blocker when provided) ────────────────────────────

  if (input.timelineValidation !== undefined) {
    checks.push(
      input.timelineValidation.ok
        ? pass("timeline-validation", "Timeline validation passes")
        : fail(
            "timeline-validation",
            "Timeline validation passes",
            "timeline_validation_failed",
            `Timeline errors: ${input.timelineValidation.errors.map((e) => e.code).join(", ")}`,
          ),
    );
  }

  // ── 9. Render manifest validation (blocker when provided) ────────────────────

  if (input.renderManifestValidation !== undefined) {
    checks.push(
      input.renderManifestValidation.ok
        ? pass("render-manifest-validation", "Render manifest validation passes")
        : fail(
            "render-manifest-validation",
            "Render manifest validation passes",
            "render_manifest_validation_failed",
            `Render manifest errors: ${input.renderManifestValidation.errors.map((e) => e.code).join(", ")}`,
          ),
    );
  }

  // ── 10. Render output path is relative placeholder (blocker) ─────────────────

  if (input.renderManifestPlannedOutputPath !== undefined) {
    const p = input.renderManifestPlannedOutputPath;
    const isRelative = !/^\/|^[A-Za-z]:\\/.test(p);
    checks.push(
      isRelative
        ? pass("render-output-relative", "Render planned output path is relative placeholder")
        : fail(
            "render-output-relative",
            "Render planned output path is relative placeholder",
            "absolute_output_path",
            `plannedOutputPath "${p}" is absolute — must be a relative placeholder`,
          ),
    );
  }

  // ── 11. Timeline ↔ render manifest duration cross-check (blocker) ────────────

  if (
    input.timelineMeasuredDurationSec !== undefined &&
    input.renderManifestEstimatedDurationSec !== undefined
  ) {
    const delta = Math.abs(
      input.timelineMeasuredDurationSec - input.renderManifestEstimatedDurationSec,
    );
    checks.push(
      delta <= MAX_DURATION_MISMATCH_SEC
        ? pass(
            "duration-cross-check",
            "Timeline and render manifest durations are consistent",
          )
        : fail(
            "duration-cross-check",
            "Timeline and render manifest durations are consistent",
            "duration_mismatch",
            `Timeline measuredDuration (${input.timelineMeasuredDurationSec}s) vs render estimatedDuration (${input.renderManifestEstimatedDurationSec}s) delta=${delta.toFixed(3)}s > ${MAX_DURATION_MISMATCH_SEC}s`,
          ),
    );
  }

  // ── 12. Caption overlays non-empty (blocker when render manifest provided) ────

  if (input.renderManifestCaptionCount !== undefined) {
    checks.push(
      input.renderManifestCaptionCount > 0
        ? pass("render-captions-present", "Render manifest has caption overlays")
        : fail(
            "render-captions-present",
            "Render manifest has caption overlays",
            "empty_render_captions",
            "renderManifest.captionOverlays is empty — no captions planned",
          ),
    );
  }

  // ── 13–16. Cross-package linkage checks (blockers when fields provided) ────────
  //
  // Timeline and Render Manifest may be keyed to a Blueprint videoId that differs
  // from a Script packageId core sourceId. To handle both cases:
  //   - When blueprintVideoId is supplied, Timeline/Render ids are compared to it.
  //   - Otherwise, Timeline/Render ids must match the core sourceId.
  //
  // factCardIds/sourceCitationIds comparisons always compare against core arrays.

  const expectedSourceIdForPackages = input.blueprintVideoId ?? input.sourceId;

  // 13. Timeline sourceId linkage
  if (input.timelineSourceId !== undefined) {
    checks.push(
      input.timelineSourceId === expectedSourceIdForPackages
        ? pass("linkage-timeline-source-id", "Timeline sourceId matches expected source")
        : fail(
            "linkage-timeline-source-id",
            "Timeline sourceId matches expected source",
            "timeline_source_id_mismatch",
            `Timeline sourceId "${input.timelineSourceId}" does not match expected "${expectedSourceIdForPackages}"`,
          ),
    );
  }

  // 14. Timeline factCardIds linkage
  if (input.timelineFactCardIds !== undefined) {
    const coreSet = new Set(input.factCardIds);
    const timelineSet = new Set(input.timelineFactCardIds);
    const setsMatch =
      coreSet.size === timelineSet.size &&
      [...coreSet].every((id) => timelineSet.has(id));
    checks.push(
      setsMatch
        ? pass("linkage-timeline-fact-card-ids", "Timeline factCardIds match core factCardIds")
        : fail(
            "linkage-timeline-fact-card-ids",
            "Timeline factCardIds match core factCardIds",
            "timeline_fact_card_ids_mismatch",
            `Timeline factCardIds [${input.timelineFactCardIds.join(", ")}] do not match core [${input.factCardIds.join(", ")}]`,
          ),
    );
  }

  // 15. Timeline sourceCitationIds linkage
  if (input.timelineSourceCitationIds !== undefined) {
    const coreSet = new Set(input.sourceCitationIds);
    const tlSet = new Set(input.timelineSourceCitationIds);
    const setsMatch =
      coreSet.size === tlSet.size &&
      [...coreSet].every((id) => tlSet.has(id));
    checks.push(
      setsMatch
        ? pass("linkage-timeline-citation-ids", "Timeline sourceCitationIds match core sourceCitationIds")
        : fail(
            "linkage-timeline-citation-ids",
            "Timeline sourceCitationIds match core sourceCitationIds",
            "timeline_citation_ids_mismatch",
            `Timeline sourceCitationIds [${input.timelineSourceCitationIds.join(", ")}] do not match core [${input.sourceCitationIds.join(", ")}]`,
          ),
    );
  }

  // 16. Render manifest timelineId ↔ QA timelineId linkage
  if (input.timelineId !== undefined && input.renderManifestTimelineId !== undefined) {
    checks.push(
      input.renderManifestTimelineId === input.timelineId
        ? pass("linkage-render-timeline-id", "Render manifest timelineId matches timeline timelineId")
        : fail(
            "linkage-render-timeline-id",
            "Render manifest timelineId matches timeline timelineId",
            "render_timeline_id_mismatch",
            `Render manifest timelineId "${input.renderManifestTimelineId}" does not match timeline timelineId "${input.timelineId}"`,
          ),
    );
  }

  // 17. Core sourceId vs expected script package id
  if (input.scriptPackageId !== undefined) {
    checks.push(
      input.sourceId === input.scriptPackageId
        ? pass("linkage-core-script-package-id", "Core sourceId matches expected scriptPackageId")
        : fail(
            "linkage-core-script-package-id",
            "Core sourceId matches expected scriptPackageId",
            "script_package_id_mismatch",
            `Core sourceId "${input.sourceId}" does not match expected scriptPackageId "${input.scriptPackageId}"`,
          ),
    );
  }

  // 18. Render manifest sourceId linkage
  if (input.renderManifestSourceId !== undefined) {
    checks.push(
      input.renderManifestSourceId === expectedSourceIdForPackages
        ? pass("linkage-render-source-id", "Render manifest sourceId matches expected source")
        : fail(
            "linkage-render-source-id",
            "Render manifest sourceId matches expected source",
            "render_source_id_mismatch",
            `Render manifest sourceId "${input.renderManifestSourceId}" does not match expected "${expectedSourceIdForPackages}"`,
          ),
    );
  }

  // 19. Render manifest factCardIds linkage
  if (input.renderManifestFactCardIds !== undefined) {
    const coreSet = new Set(input.factCardIds);
    const renderSet = new Set(input.renderManifestFactCardIds);
    const setsMatch =
      coreSet.size === renderSet.size &&
      [...coreSet].every((id) => renderSet.has(id));
    checks.push(
      setsMatch
        ? pass("linkage-render-fact-card-ids", "Render manifest factCardIds match core factCardIds")
        : fail(
            "linkage-render-fact-card-ids",
            "Render manifest factCardIds match core factCardIds",
            "render_fact_card_ids_mismatch",
            `Render manifest factCardIds [${input.renderManifestFactCardIds.join(", ")}] do not match core [${input.factCardIds.join(", ")}]`,
          ),
    );
  }

  // 20. Render manifest sourceCitationIds linkage
  if (input.renderManifestSourceCitationIds !== undefined) {
    const coreSet = new Set(input.sourceCitationIds);
    const renderSet = new Set(input.renderManifestSourceCitationIds);
    const setsMatch =
      coreSet.size === renderSet.size &&
      [...coreSet].every((id) => renderSet.has(id));
    checks.push(
      setsMatch
        ? pass("linkage-render-citation-ids", "Render manifest sourceCitationIds match core sourceCitationIds")
        : fail(
            "linkage-render-citation-ids",
            "Render manifest sourceCitationIds match core sourceCitationIds",
            "render_citation_ids_mismatch",
            `Render manifest sourceCitationIds [${input.renderManifestSourceCitationIds.join(", ")}] do not match core [${input.sourceCitationIds.join(", ")}]`,
          ),
    );
  }

  // ── Aggregate ─────────────────────────────────────────────────────────────────

  // Blockers: all checks that are not the risk-level-acceptable warning
  const blockerCheckIds = new Set([
    "core-source-id",
    "core-fact-card-ids",
    "core-citation-ids",
    "risk-not-blocked",
    "script-validation",
    "chart-card-validation",
    "image-prompt-validation",
    "voice-profile-validation",
    "tts-validation",
    "timeline-validation",
    "render-manifest-validation",
    "render-output-relative",
    "duration-cross-check",
    "render-captions-present",
    "linkage-timeline-source-id",
    "linkage-timeline-fact-card-ids",
    "linkage-timeline-citation-ids",
    "linkage-render-timeline-id",
    "linkage-core-script-package-id",
    "linkage-render-source-id",
    "linkage-render-fact-card-ids",
    "linkage-render-citation-ids",
  ]);

  const failed = checks.filter((c) => !c.passed);
  const blockersFailed = failed.filter((c) => blockerCheckIds.has(c.checkId)).length;
  const isRiskBlocked = input.riskReview?.isBlocked === true ||
    checks.some((c) => c.checkId === "risk-not-blocked" && !c.passed && c.code === "risk_blocked");

  const result: FinalQaResult = {
    schemaVersion: FINAL_QA_SCHEMA_VERSION,
    qaRunId: options.qaRunId ?? `qa-${input.sourceId}`,
    sourceId: input.sourceId,
    sourceType: input.sourceType,
    readyForRender: blockersFailed === 0,
    isRiskBlocked,
    checks,
    summary: {
      total: checks.length,
      passed: checks.filter((c) => c.passed).length,
      failed: failed.length,
      blockersFailed,
    },
  };
  if (options.createdAt !== undefined) result.createdAt = options.createdAt;
  return result;
}
