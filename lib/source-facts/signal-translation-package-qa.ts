/**
 * signal-translation-package-qa.ts
 *
 * Pure deterministic QA helper for Money Shorts Scene Packages.
 * Owner/QA-facing report layer on top of existing validation helpers.
 * No AI judgment, no external API, no DB, no clipboard.
 */
import {
  CAPTION_SYSTEM_V1,
  MONEY_SHORTS_SCENE_ROLES,
  validateSceneCardsForGeneration,
} from "./signal-translation";
import type { CaptionSafeZone, MoneyShortsSceneRole, SceneCard } from "./signal-translation";
import type { MoneyShortsScenePackage } from "./signal-translation-generator";

// ── Image prompt / text policy QA lists ──────────────────────────────────────
// Structural scan only — no AI semantic judgment.

// Anchor keywords that confirm editorial life-economy report style is declared.
const IMAGE_STYLE_ANCHOR_KEYWORDS = [
  "editorial",
  "life-economy",
  "report",
  "signal card",
  "clue",
  "connection lines",
  "off-white",
  "charcoal",
  "warm yellow",
] as const;

// Keywords that indicate disallowed visual styles (premium-finance-ad, fear, etc.).
const IMAGE_FORBIDDEN_STYLE_KEYWORDS = [
  "premium finance ad",
  "luxury gold",
  "horror",
  "fear",
  "profit",
  "investment return",
  "abstract graph",
  "wealth",
  "rich",
] as const;

// Required semantic categories in imageTextPolicy.forbiddenText.
// Each entry is a minimum keyword that must appear somewhere in the array.
const IMAGE_TEXT_POLICY_REQUIRED_FORBIDDEN_CATEGORIES: Array<{
  keyword: string;
  label: string;
}> = [
  { keyword: "unverified", label: "unverified numbers" },
  { keyword: "investment return", label: "investment return claims" },
  { keyword: "subtitle", label: "extra subtitles" },
  { keyword: "source", label: "source text not backed by citation" },
];

// Visual template ids that require matching keywords in imagePrompt.
const VISUAL_TEMPLATE_PROMPT_KEYWORDS: Record<string, string[]> = {
  life_object: ["object", "item", "household", "product", "everyday", "오브젝트", "생활"],
  signal_card: ["card", "chart", "signal", "indicator", "카드", "신호"],
  clue_cards: ["clue", "detective", "단서", "card", "note", "카드"],
  action_checklist: ["checklist", "list", "action", "check", "체크리스트", "점검"],
};

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
    captionSafeZoneWarningCount: number;
    voiceNarrationWarningCount: number;
    imagePromptPolicyWarningCount: number;
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

// ── Caption System V1 safe-zone checks ───────────────────────────────────────
// Structural/spec check only — no render, no image, no AI judgment.
// Returns warning messages when a scene's layoutSafeZone diverges from CAPTION_SYSTEM_V1 policy.

function checkSafeZoneAgainstPolicy(
  zone: CaptionSafeZone,
  policy: CaptionSafeZone,
  fieldLabel: string,
): string[] {
  const msgs: string[] = [];
  if (zone.xMin < policy.xMin || zone.xMax > policy.xMax) {
    msgs.push(
      `${fieldLabel} x range [${zone.xMin},${zone.xMax}] exceeds policy [${policy.xMin},${policy.xMax}].`,
    );
  }
  if (zone.yMin < policy.yMin || zone.yMax > policy.yMax) {
    msgs.push(
      `${fieldLabel} y range [${zone.yMin},${zone.yMax}] exceeds policy [${policy.yMin},${policy.yMax}].`,
    );
  }
  if (policy.maxLines !== undefined) {
    if (zone.maxLines === undefined) {
      msgs.push(`${fieldLabel} is missing policy-required maxLines (policy: ${policy.maxLines}).`);
    } else if (zone.maxLines > policy.maxLines) {
      msgs.push(`${fieldLabel} maxLines ${zone.maxLines} exceeds policy max ${policy.maxLines}.`);
    }
  }
  if (policy.fontPxMin !== undefined) {
    if (zone.fontPxMin === undefined) {
      msgs.push(`${fieldLabel} is missing policy-required fontPxMin (policy: ${policy.fontPxMin}).`);
    } else if (zone.fontPxMin < policy.fontPxMin) {
      msgs.push(`${fieldLabel} fontPxMin ${zone.fontPxMin} is below policy minimum ${policy.fontPxMin}.`);
    }
  }
  if (policy.fontPxMax !== undefined) {
    if (zone.fontPxMax === undefined) {
      msgs.push(`${fieldLabel} is missing policy-required fontPxMax (policy: ${policy.fontPxMax}).`);
    } else if (zone.fontPxMax > policy.fontPxMax) {
      msgs.push(`${fieldLabel} fontPxMax ${zone.fontPxMax} exceeds policy maximum ${policy.fontPxMax}.`);
    }
  }
  return msgs;
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
  let captionSafeZoneWarningCount = 0;
  let voiceNarrationWarningCount = 0;
  let imagePromptPolicyWarningCount = 0;

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

    // ── Caption System V1 safe-zone spec checks (structural/spec only) ────────
    // Warn when declared layoutSafeZone values fall outside CAPTION_SYSTEM_V1 bounds.
    // These are advisory: publication gate is not affected.
    {
      let sceneCaptionSzWarnings = 0;

      // spokenCaption safe-zone
      if (lsz.spokenCaption) {
        const msgs = checkSafeZoneAgainstPolicy(
          lsz.spokenCaption,
          CAPTION_SYSTEM_V1.spokenCaption,
          "layoutSafeZone.spokenCaption",
        );
        msgs.forEach((msg) => {
          warnings.push(
            makeIssue(
              "scene",
              `scenes.${n - 1}.layoutSafeZone.spokenCaption`,
              "caption_system_v1_spoken_caption_out_of_range",
              msg,
              n,
            ),
          );
          sceneCaptionSzWarnings++;
        });
      }

      // hookTitle safe-zone (hook scene only)
      if (scene.sceneRole === "hook" && lsz.hookTitle) {
        const msgs = checkSafeZoneAgainstPolicy(
          lsz.hookTitle,
          CAPTION_SYSTEM_V1.hookTitle,
          "layoutSafeZone.hookTitle",
        );
        msgs.forEach((msg) => {
          warnings.push(
            makeIssue(
              "scene",
              `scenes.${n - 1}.layoutSafeZone.hookTitle`,
              "caption_system_v1_hook_title_out_of_range",
              msg,
              n,
            ),
          );
          sceneCaptionSzWarnings++;
        });
      } else if (scene.sceneRole === "hook" && scene.hookTitle && !lsz.hookTitle) {
        // hookTitle text present but no safe-zone declared
        warnings.push(
          makeIssue(
            "scene",
            `scenes.${n - 1}.layoutSafeZone.hookTitle`,
            "caption_system_v1_hook_title_safe_zone_missing",
            "Scene has hookTitle text but layoutSafeZone.hookTitle is not declared.",
            n,
          ),
        );
        sceneCaptionSzWarnings++;
      }

      // sourceNote safe-zone
      if (scene.sourceNote && scene.sourceNote.trim() && lsz.sourceNote) {
        const msgs = checkSafeZoneAgainstPolicy(
          lsz.sourceNote,
          CAPTION_SYSTEM_V1.sourceNote,
          "layoutSafeZone.sourceNote",
        );
        msgs.forEach((msg) => {
          warnings.push(
            makeIssue(
              "scene",
              `scenes.${n - 1}.layoutSafeZone.sourceNote`,
              "caption_system_v1_source_note_out_of_range",
              msg,
              n,
            ),
          );
          sceneCaptionSzWarnings++;
        });
      } else if (scene.sourceNote && scene.sourceNote.trim() && !lsz.sourceNote) {
        warnings.push(
          makeIssue(
            "scene",
            `scenes.${n - 1}.layoutSafeZone.sourceNote`,
            "caption_system_v1_source_note_safe_zone_missing",
            "Scene has sourceNote text but layoutSafeZone.sourceNote is not declared.",
            n,
          ),
        );
        sceneCaptionSzWarnings++;
      }

      // sceneLabel safe-zone (required on every scene)
      {
        const msgs = checkSafeZoneAgainstPolicy(
          lsz.sceneLabel,
          CAPTION_SYSTEM_V1.sceneLabel,
          "layoutSafeZone.sceneLabel",
        );
        msgs.forEach((msg) => {
          warnings.push(
            makeIssue(
              "scene",
              `scenes.${n - 1}.layoutSafeZone.sceneLabel`,
              "caption_system_v1_scene_label_out_of_range",
              msg,
              n,
            ),
          );
          sceneCaptionSzWarnings++;
        });
      }

      captionSafeZoneWarningCount += sceneCaptionSzWarnings;
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

    // ── Voice / Narration structural QA (warning-only, no AI/ElevenLabs) ──────
    {
      let sceneVnWarnings = 0;

      // 1. Narration density: characters per second
      const maxCharsForDuration = scene.durationSec * 18;
      if (scene.narration.length > maxCharsForDuration) {
        warnings.push(
          makeIssue(
            "scene",
            `scenes.${n - 1}.narration`,
            "narration_too_dense_for_duration",
            `narration length ${scene.narration.length} exceeds ${maxCharsForDuration} (durationSec ${scene.durationSec} × 18).`,
            n,
          ),
        );
        sceneVnWarnings++;
      }

      // 2. Voice pace by scene role
      const pace = scene.voiceTiming.pace;
      if (scene.sceneRole === "signal" || scene.sceneRole === "why_expert_interpretation" ||
          scene.sceneRole === "life_impact" || scene.sceneRole === "watch_scenario_outlook") {
        if (pace === "fast") {
          warnings.push(
            makeIssue(
              "scene",
              `scenes.${n - 1}.voiceTiming.pace`,
              "voice_pace_mismatch_for_scene_role",
              `Scene role "${scene.sceneRole}" expects "normal" or "slow" pace; got "${pace}".`,
              n,
            ),
          );
          sceneVnWarnings++;
        }
      } else if (scene.sceneRole === "action_closing") {
        if (pace === "fast") {
          warnings.push(
            makeIssue(
              "scene",
              `scenes.${n - 1}.voiceTiming.pace`,
              "voice_pace_mismatch_for_scene_role",
              `Scene role "action_closing" expects "normal" or "slow" pace; got "${pace}".`,
              n,
            ),
          );
          sceneVnWarnings++;
        }
      }

      // 3. Pause consistency
      if (scene.voiceTiming.pauses.length === 0) {
        warnings.push(
          makeIssue(
            "scene",
            `scenes.${n - 1}.voiceTiming.pauses`,
            "voice_pause_missing",
            "voiceTiming.pauses is empty — no pause markers declared.",
            n,
          ),
        );
        sceneVnWarnings++;
      } else {
        const missingPauses = scene.voiceTiming.pauses.filter(
          (p) => !scene.narration.includes(p),
        );
        if (missingPauses.length > 0) {
          warnings.push(
            makeIssue(
              "scene",
              `scenes.${n - 1}.voiceTiming.pauses`,
              "voice_pause_not_found_in_narration",
              `Pause marker(s) not found in narration: ${missingPauses.map((p) => `"${p}"`).join(", ")}.`,
              n,
            ),
          );
          sceneVnWarnings++;
        }
      }

      // 4. Hook narration curiosity marker
      if (scene.sceneRole === "hook") {
        const curiosityMarkers = ["?", "까요", "일까요", "무슨", "왜", "진짜"];
        const hasMarker = curiosityMarkers.some((m) => scene.narration.includes(m));
        if (!hasMarker) {
          warnings.push(
            makeIssue(
              "scene",
              `scenes.${n - 1}.narration`,
              "hook_narration_lacks_curiosity_marker",
              "Hook narration has no curiosity marker (?, 까요, 일까요, 무슨, 왜, 진짜).",
              n,
            ),
          );
          sceneVnWarnings++;
        }
      }

      // 5. Action closing check-action marker
      if (scene.sceneRole === "action_closing") {
        const checkMarkers = ["점검", "확인", "살펴", "체크", "정리"];
        const combined = scene.narration + scene.spokenCaption;
        const hasMarker = checkMarkers.some((m) => combined.includes(m));
        if (!hasMarker) {
          warnings.push(
            makeIssue(
              "scene",
              `scenes.${n - 1}.narration`,
              "action_closing_lacks_check_action_marker",
              `action_closing has no life-check marker (점검, 확인, 살펴, 체크, 정리) in narration/spokenCaption.`,
              n,
            ),
          );
          sceneVnWarnings++;
        }
      }

      voiceNarrationWarningCount += sceneVnWarnings;
    }

    // ── Image Prompt / Image Text Policy structural QA (warning-only) ──────────
    {
      let sceneIpWarnings = 0;

      // 1. Style anchor check — at least 2 anchor keywords expected in imagePrompt
      if (scene.imagePrompt.trim()) {
        const promptLower = scene.imagePrompt.toLowerCase();
        const foundAnchors = IMAGE_STYLE_ANCHOR_KEYWORDS.filter((kw) =>
          promptLower.includes(kw.toLowerCase()),
        );
        if (foundAnchors.length < 2) {
          warnings.push(
            makeIssue(
              "scene",
              `scenes.${n - 1}.imagePrompt`,
              "image_prompt_lacks_style_anchor",
              `imagePrompt has only ${foundAnchors.length} style anchor(s) (need ≥2 from: ${IMAGE_STYLE_ANCHOR_KEYWORDS.join(", ")}).`,
              n,
            ),
          );
          sceneIpWarnings++;
        }
      }

      // 2. Forbidden style keyword scan
      if (scene.imagePrompt.trim()) {
        const promptLower = scene.imagePrompt.toLowerCase();
        const hits = IMAGE_FORBIDDEN_STYLE_KEYWORDS.filter((kw) =>
          promptLower.includes(kw.toLowerCase()),
        );
        hits.forEach((kw) => {
          warnings.push(
            makeIssue(
              "scene",
              `scenes.${n - 1}.imagePrompt`,
              "image_prompt_forbidden_style_keyword",
              `imagePrompt contains forbidden style keyword: "${kw}".`,
              n,
            ),
          );
          sceneIpWarnings++;
        });
      }

      // 3. imageTextPolicy.forbiddenText minimum required categories
      {
        const forbiddenJoined = scene.imageTextPolicy.forbiddenText
          .map((t) => t.toLowerCase())
          .join(" ");
        IMAGE_TEXT_POLICY_REQUIRED_FORBIDDEN_CATEGORIES.forEach(({ keyword, label }) => {
          if (!forbiddenJoined.includes(keyword.toLowerCase())) {
            warnings.push(
              makeIssue(
                "scene",
                `scenes.${n - 1}.imageTextPolicy.forbiddenText`,
                "image_text_policy_missing_required_forbidden_text",
                `imageTextPolicy.forbiddenText is missing required category "${label}" (keyword: "${keyword}").`,
                n,
              ),
            );
            sceneIpWarnings++;
          }
        });
      }

      // 4. imagePrompt vs imageTextPolicy consistency
      // If allowedText is empty the prompt should mention no-text/no-numbers intent.
      if (scene.imageTextPolicy.allowedText.length === 0) {
        const promptLower = scene.imagePrompt.toLowerCase();
        const hasTextRestrictionHint = ["no text", "no numbers", "no subtitle", "no label", "text-free"].some(
          (hint) => promptLower.includes(hint),
        );
        if (!hasTextRestrictionHint) {
          warnings.push(
            makeIssue(
              "scene",
              `scenes.${n - 1}.imagePrompt`,
              "image_prompt_text_policy_not_reflected",
              "imageTextPolicy.allowedText is empty but imagePrompt does not mention text restriction (no text/no numbers/no subtitle).",
              n,
            ),
          );
          sceneIpWarnings++;
        }
      }

      // 5. Visual object coverage
      if (scene.visualObjects.length === 0) {
        warnings.push(
          makeIssue(
            "scene",
            `scenes.${n - 1}.visualObjects`,
            "visual_objects_missing",
            "visualObjects is empty — no visual elements declared for this scene.",
            n,
          ),
        );
        sceneIpWarnings++;
      }

      // 6. visualTemplateId reflection in imagePrompt
      {
        const templateKeywords = VISUAL_TEMPLATE_PROMPT_KEYWORDS[scene.visualTemplateId];
        if (templateKeywords && scene.imagePrompt.trim()) {
          const promptLower = scene.imagePrompt.toLowerCase();
          const hasKeyword = templateKeywords.some((kw) => promptLower.includes(kw.toLowerCase()));
          if (!hasKeyword) {
            warnings.push(
              makeIssue(
                "scene",
                `scenes.${n - 1}.imagePrompt`,
                "visual_template_not_reflected_in_prompt",
                `visualTemplateId "${scene.visualTemplateId}" not reflected in imagePrompt (expected one of: ${templateKeywords.join(", ")}).`,
                n,
              ),
            );
            sceneIpWarnings++;
          }
        }
      }

      imagePromptPolicyWarningCount += sceneIpWarnings;
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
    captionSafeZoneWarningCount,
    voiceNarrationWarningCount,
    imagePromptPolicyWarningCount,
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary,
  };
}
