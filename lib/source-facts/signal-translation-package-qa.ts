/**
 * signal-translation-package-qa.ts
 *
 * Pure deterministic QA helper for Money Shorts Scene Packages.
 * Owner/QA-facing report layer on top of existing validation helpers.
 * No AI judgment, no external API, no DB, no clipboard.
 */
import {
  MONEY_SHORTS_SCENE_ROLES,
  validateSceneCardsForGeneration,
} from "./signal-translation";
import type { MoneyShortsSceneRole, SceneCard } from "./signal-translation";
import type { MoneyShortsScenePackage } from "./signal-translation-generator";

// ── Risk keyword scan lists ───────────────────────────────────────────────────
// Structural scan only — no AI semantic judgment.
// These lists target expression patterns that are out of scope for a
// deterministic economic signal translation (not blanket financial advice bans).

const DETERMINISTIC_FORECAST_KEYWORDS = [
  "확실히",
  "반드시",
  "무조건",
  "보장",
  "예정입니다",
] as const;

const INVESTMENT_ADVICE_KEYWORDS = [
  "매수",
  "매도",
  "추천주",
  "수익 보장",
  "목표가",
  "투자 추천",
] as const;

const FEAR_HYPE_KEYWORDS = ["폭락", "붕괴", "패닉", "대재앙"] as const;

const ALL_RISK_KEYWORDS: readonly string[] = [
  ...DETERMINISTIC_FORECAST_KEYWORDS,
  ...INVESTMENT_ADVICE_KEYWORDS,
  ...FEAR_HYPE_KEYWORDS,
];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MoneyShortsScenePackageQaIssue {
  scope: "brief" | "scenes" | "scene";
  sceneNumber?: number;
  field: string;
  code: string;
  message: string;
}

export interface MoneyShortsScenePackageQaReport {
  isValid: boolean;
  errors: MoneyShortsScenePackageQaIssue[];
  warnings: MoneyShortsScenePackageQaIssue[];
  summary: {
    sceneCount: number;
    captionBlockCount: number;
    imagePromptSceneCount: number;
    voiceTimingSceneCount: number;
    layoutSafeZoneSceneCount: number;
    sourceCitationSceneCount: number;
    riskNotesSceneCount: number;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeIssue(
  scope: MoneyShortsScenePackageQaIssue["scope"],
  field: string,
  code: string,
  message: string,
  sceneNumber?: number,
): MoneyShortsScenePackageQaIssue {
  const issue: MoneyShortsScenePackageQaIssue = { scope, field, code, message };
  if (sceneNumber !== undefined) issue.sceneNumber = sceneNumber;
  return issue;
}

function scanRiskKeywords(text: string): string[] {
  return ALL_RISK_KEYWORDS.filter((kw) => text.includes(kw));
}

function collectSceneTextsForRiskScan(scene: SceneCard): string[] {
  const texts: string[] = [
    scene.narration,
    scene.spokenCaption,
    scene.imagePrompt,
    ...scene.screenText,
  ];
  if (scene.hookTitle) texts.push(scene.hookTitle);
  return texts;
}

// ── Core builder ─────────────────────────────────────────────────────────────

export function buildMoneyShortsScenePackageQaReport(
  scenePackage: MoneyShortsScenePackage,
): MoneyShortsScenePackageQaReport {
  const errors: MoneyShortsScenePackageQaIssue[] = [];
  const warnings: MoneyShortsScenePackageQaIssue[] = [];

  const { brief, sceneCards } = scenePackage;

  // ── Reuse existing validators ──────────────────────────────────────────────

  const sceneValidation = validateSceneCardsForGeneration(sceneCards);
  sceneValidation.errors.forEach((e) =>
    errors.push(makeIssue("scenes", e.field, e.code, e.message)),
  );
  sceneValidation.warnings.forEach((w) =>
    warnings.push(makeIssue("scenes", w.field, w.code, w.message)),
  );

  // MoneyShortsScenePackage는 raw FactCard citation ids를 들고 있지 않으므로
  // generator가 FactCard 기준으로 계산한 citationValidation을 source-of-truth로 재사용한다.
  scenePackage.citationValidation.errors.forEach((e) =>
    errors.push(makeIssue("scenes", e.field, e.code, e.message)),
  );
  scenePackage.citationValidation.warnings.forEach((w) =>
    warnings.push(makeIssue("scenes", w.field, w.code, w.message)),
  );

  // ── Brief-level checks ─────────────────────────────────────────────────────

  if (!brief.viewerTakeaway.trim()) {
    warnings.push(
      makeIssue("brief", "brief.viewerTakeaway", "empty_viewer_takeaway", "viewerTakeaway is empty."),
    );
  }

  if (brief.recommendedActions.length === 0) {
    warnings.push(
      makeIssue("brief", "brief.recommendedActions", "empty_recommended_actions", "recommendedActions is empty."),
    );
  }

  if (brief.actionBoundaries.length === 0) {
    warnings.push(
      makeIssue("brief", "brief.actionBoundaries", "empty_action_boundaries", "actionBoundaries is empty."),
    );
  }

  if (brief.doNotOverclaimActions.length === 0) {
    warnings.push(
      makeIssue(
        "brief",
        "brief.doNotOverclaimActions",
        "empty_do_not_overclaim_actions",
        "doNotOverclaimActions is empty.",
      ),
    );
  }

  // Brief risk scan: viewerTakeaway + recommendedActions
  const briefRiskTexts = [
    brief.viewerTakeaway,
    ...brief.recommendedActions,
  ];
  briefRiskTexts.forEach((text) => {
    const hits = scanRiskKeywords(text);
    hits.forEach((kw) =>
      warnings.push(
        makeIssue(
          "brief",
          "brief.riskScan",
          "risk_keyword_in_brief",
          `Risk keyword "${kw}" found in brief text: "${text}".`,
        ),
      ),
    );
  });

  // ── sceneRole sequence cross-check ────────────────────────────────────────
  // Already covered by validateFixedSixSceneCards inside validateSceneCardsForGeneration.
  // Extra guard: ensure expected role ordering matches MONEY_SHORTS_SCENE_ROLES.
  const expectedRoles: readonly MoneyShortsSceneRole[] = MONEY_SHORTS_SCENE_ROLES;
  sceneCards.forEach((scene, index) => {
    const expected = expectedRoles[index];
    if (expected && scene.sceneRole !== expected) {
      errors.push(
        makeIssue(
          "scene",
          `scenes.${index}.sceneRole`,
          "scene_role_sequence_mismatch",
          `Scene ${scene.sceneNumber} role is "${scene.sceneRole}", expected "${expected}".`,
          scene.sceneNumber,
        ),
      );
    }
  });

  // ── Per-scene QA checks ───────────────────────────────────────────────────
  let captionBlockCount = 0;
  let imagePromptSceneCount = 0;
  let sourceCitationSceneCount = 0;
  let riskNotesSceneCount = 0;

  sceneCards.forEach((scene) => {
    const n = scene.sceneNumber;

    captionBlockCount += scene.captionBlocks.length;

    if (scene.imagePrompt.trim()) imagePromptSceneCount++;
    if (scene.sourceCitationIds.length > 0) sourceCitationSceneCount++;
    if (scene.riskNotes.length > 0) riskNotesSceneCount++;

    // Hook Title max-lines warning (scene 1)
    if (scene.sceneRole === "hook" && scene.hookTitle) {
      const lines = scene.hookTitle.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length > 2) {
        warnings.push(
          makeIssue(
            "scene",
            `scenes.${n - 1}.hookTitle`,
            "hook_title_exceeds_max_lines",
            `hookTitle has ${lines.length} lines; Caption System V1 recommends ≤2.`,
            n,
          ),
        );
      }
    }

    // spokenCaption length warning (> 40 chars signals possible overflow)
    if (scene.spokenCaption.length > 40) {
      warnings.push(
        makeIssue(
          "scene",
          `scenes.${n - 1}.spokenCaption`,
          "spoken_caption_long",
          `spokenCaption length ${scene.spokenCaption.length} may exceed 2-line layout.`,
          n,
        ),
      );
    }

    // imagePrompt missing warning
    if (!scene.imagePrompt.trim()) {
      warnings.push(
        makeIssue(
          "scene",
          `scenes.${n - 1}.imagePrompt`,
          "missing_image_prompt",
          "imagePrompt is empty.",
          n,
        ),
      );
    }

    // imageTextPolicy quality check
    if (
      scene.imageTextPolicy.allowedText.length === 0 &&
      scene.imageTextPolicy.forbiddenText.length === 0
    ) {
      warnings.push(
        makeIssue(
          "scene",
          `scenes.${n - 1}.imageTextPolicy`,
          "empty_image_text_policy",
          "imageTextPolicy has no allowedText or forbiddenText entries.",
          n,
        ),
      );
    }

    // voiceTiming emphasisWords check
    if (scene.voiceTiming.emphasisWords.length === 0) {
      warnings.push(
        makeIssue(
          "scene",
          `scenes.${n - 1}.voiceTiming.emphasisWords`,
          "empty_voice_timing_emphasis_words",
          "voiceTiming.emphasisWords is empty.",
          n,
        ),
      );
    }

    // layoutSafeZone quality check — spokenCaption is required
    const lsz = scene.layoutSafeZone;
    if (!lsz.spokenCaption) {
      warnings.push(
        makeIssue(
          "scene",
          `scenes.${n - 1}.layoutSafeZone.spokenCaption`,
          "missing_layout_safe_zone_spoken_caption",
          "layoutSafeZone.spokenCaption is missing.",
          n,
        ),
      );
    }

    // sourceNote check
    if (!scene.sourceNote || !scene.sourceNote.trim()) {
      warnings.push(
        makeIssue(
          "scene",
          `scenes.${n - 1}.sourceNote`,
          "missing_source_note",
          "sourceNote is absent or empty.",
          n,
        ),
      );
    }

    // riskNotes check
    if (scene.riskNotes.length === 0) {
      warnings.push(
        makeIssue(
          "scene",
          `scenes.${n - 1}.riskNotes`,
          "missing_risk_notes",
          "riskNotes is empty.",
          n,
        ),
      );
    }

    // Per-scene risk keyword scan
    const sceneTexts = collectSceneTextsForRiskScan(scene);
    sceneTexts.forEach((text) => {
      const hits = scanRiskKeywords(text);
      hits.forEach((kw) =>
        warnings.push(
          makeIssue(
            "scene",
            `scenes.${n - 1}.riskScan`,
            "risk_keyword_in_scene",
            `Risk keyword "${kw}" found in scene ${n} text: "${text}".`,
            n,
          ),
        ),
      );
    });
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  const summary: MoneyShortsScenePackageQaReport["summary"] = {
    sceneCount: sceneCards.length,
    captionBlockCount,
    imagePromptSceneCount,
    voiceTimingSceneCount: sceneCards.length, // always present by type
    layoutSafeZoneSceneCount: sceneCards.length, // always present by type
    sourceCitationSceneCount,
    riskNotesSceneCount,
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary,
  };
}
