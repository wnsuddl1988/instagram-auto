export const FULL_SCRIPT_CAPTION_CONTRACT_VERSION = "money_shorts_dynamic_semantic_caption_v6";
// Compatibility exports for callers that imported the previous names.
export const SEMANTIC_CAPTION_CONTRACT_VERSION = FULL_SCRIPT_CAPTION_CONTRACT_VERSION;
export const DYNAMIC_CAPTION_CONTRACT_VERSION = FULL_SCRIPT_CAPTION_CONTRACT_VERSION;
export const SAMPLE_REVIEW_CAPTION_CONTRACT_VERSION = FULL_SCRIPT_CAPTION_CONTRACT_VERSION;
export const DYNAMIC_CAPTION_FONT = "Black Han Sans";

const MAX_WORDS_PER_DISPLAY_UNIT = 16;
const MAX_VISIBLE_CHARS_PER_BLOCK = 34;
const TARGET_VISIBLE_CHARS_PER_LINE = 16;
const MAX_VISIBLE_CHARS_PER_LINE = 20;
const MAX_CAPTION_DWELL_SEC = 6.8;
const SAFE_TEXT_MAX_Y = 1580;
const STRONG_SENTENCE_END_PATTERN = /[.!?…。！？]$/u;
const CLAUSE_PUNCTUATION_PATTERN = /[,，;；:：…]$/u;
const DISPLAY_TRAILING_PUNCTUATION_PATTERN = /[\s"'“”‘’.,!?…，。！？:;；：]+$/u;
const CLAUSE_ENDING_PATTERN = /(?:지만|는데|면서|으면|라면|다면|하면|되면|보면|수록|해서|니까|라도|전에|후에|때문에|덕분에|반면|대신|부터|까지|보다|하려면|않고|말고|두고|놓고|확인하고|비교하고|계산하고|바꾸고|옮기고|나누고|남기고|줄이고|늘리고)$/u;
const PIVOT_START_PATTERN = /^(?:그리고|하지만|그런데|그래서|그러면|반면|대신|결국|특히|먼저|다음|이때)$/u;
const ALLOWED_BOUNDARY_TYPES = new Set([
  "sentence",
  "script_segment",
  "clause_punctuation",
  "clause_ending",
  "pivot_start",
]);

export const DYNAMIC_CAPTION_EMPHASIS_PALETTE = Object.freeze({
  risk: { assColor: "&H00575FFF", hex: "#FF5F57" },
  money: { assColor: "&H0057C8FF", hex: "#FFC857" },
  action: { assColor: "&H00A4E352", hex: "#52E3A4" },
  contrast: { assColor: "&H00FFD864", hex: "#64D8FF" },
  recall: { assColor: "&H00C375FF", hex: "#FF75C3" },
});

const EMPHASIS_RULES = [
  { category: "recall", keywords: ["저장", "팔로우", "다시", "기억", "다음 선택"] },
  { category: "risk", keywords: ["손실", "손해", "위험", "빚", "부채", "대출", "이자", "고정비", "하락", "떨어", "깨진", "막혀"] },
  { category: "money", keywords: ["월급", "소득", "돈", "현금", "비용", "생활비", "총액", "금액", "가격", "결제", "금리", "원금", "저축", "투자", "자산", "수익", "세금", "월세", "전세", "통장", "계좌", "카드", "예산"] },
  { category: "action", keywords: ["확인", "적어", "나눠", "옮겨", "바꿔", "줄여", "해지", "남겨", "계산", "비교", "선택", "자동이체"] },
  { category: "contrast", keywords: ["이유", "기준", "조건", "먼저", "대신", "하지만", "반면", "결국", "보다"] },
];

const HIGH_IMPACT_ROLES = new Set(["hook", "consequence", "habit", "recommendation", "save"]);
const ROLE_FALLBACK_CATEGORY = {
  hook: "contrast",
  consequence: "risk",
  habit: "action",
  recommendation: "action",
  save: "recall",
};

const CAPTION_LAYOUTS = Object.freeze({
  upper_high: { x: 540, y: 500 },
  upper_mid: { x: 540, y: 650 },
  upper_low: { x: 540, y: 800 },
  lower_high: { x: 540, y: 1100 },
  lower_mid: { x: 540, y: 1240 },
  lower_safe: { x: 540, y: 1380 },
});

const ROLE_LAYOUT_SEQUENCE = {
  hook: ["upper_high", "upper_mid", "upper_low"],
  problem: ["lower_high", "lower_mid", "lower_safe"],
  situation: ["lower_mid", "lower_safe", "lower_high"],
  consequence: ["upper_high", "upper_low", "upper_mid"],
  psychology: ["upper_low", "upper_mid", "upper_high"],
  mindset: ["upper_mid", "upper_high", "upper_low"],
  habit: ["lower_high", "lower_safe", "lower_mid"],
  recommendation: ["upper_low", "upper_high", "upper_mid"],
  save: ["lower_safe", "upper_mid", "lower_high"],
};

const ROLE_MOTION_PRESET = {
  hook: "hook_pop",
  problem: "evidence_snap",
  situation: "soft_settle",
  consequence: "risk_punch",
  psychology: "contrast_reveal",
  mindset: "contrast_reveal",
  habit: "action_lift",
  recommendation: "action_lift",
  save: "recall_land",
};
const ALLOWED_MOTION_PRESETS = new Set(Object.values(ROLE_MOTION_PRESET));

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizedTranscript(value) {
  return String(value ?? "").normalize("NFKC").replace(/\s+/gu, " ").trim();
}

function coverageCharacters(value) {
  return [...String(value ?? "").normalize("NFKC").replace(/\s+/gu, "")].length;
}

function normalizeWord(value) {
  return String(value ?? "")
    .replace(/^[\s"'“”‘’([{]+/u, "")
    .replace(/[\s"'“”‘’.,!?…，。！？:;\])}]+$/u, "")
    .trim();
}

function validateAlignment(alignmentDocument) {
  const alignment = alignmentDocument?.alignment ?? alignmentDocument;
  const characters = alignment?.characters;
  const starts = alignment?.character_start_times_seconds;
  const ends = alignment?.character_end_times_seconds;
  if (
    !Array.isArray(characters) || characters.length === 0 ||
    !Array.isArray(starts) || starts.length !== characters.length ||
    !Array.isArray(ends) || ends.length !== characters.length
  ) {
    throw new Error("ElevenLabs character alignment arrays are missing or inconsistent.");
  }

  let textOffset = 0;
  const entries = characters.map((character, index) => {
    const text = String(character ?? "");
    const entry = {
      index,
      text,
      startOffset: textOffset,
      endOffset: textOffset + text.length,
      startSec: finiteNumber(starts[index]),
      endSec: finiteNumber(ends[index]),
    };
    textOffset += text.length;
    return entry;
  });
  return {
    entries,
    alignedText: characters.map((character) => String(character ?? "")).join(""),
  };
}

function performanceTextForScene(scene) {
  return String(
    scene?.speechDirection?.performanceText ?? scene?.ttsText ?? scene?.narration ?? "",
  ).trim();
}

function tokenSpans(text, globalStartOffset) {
  const tokens = [];
  const matcher = /\S+/gu;
  let match;
  while ((match = matcher.exec(text)) !== null) {
    tokens.push({
      text: match[0],
      startOffset: globalStartOffset + match.index,
      endOffset: globalStartOffset + match.index + match[0].length,
    });
  }
  return tokens;
}

function visibleCharacterCount(tokens) {
  return tokens.reduce((sum, token) => sum + coverageCharacters(token.text), 0);
}

function displayUnitFits(tokens) {
  return tokens.length <= MAX_WORDS_PER_DISPLAY_UNIT &&
    visibleCharacterCount(tokens) <= MAX_VISIBLE_CHARS_PER_BLOCK;
}

function semanticBoundaryType(leftToken, rightToken) {
  const left = normalizeWord(leftToken?.text);
  const right = normalizeWord(rightToken?.text);
  if (CLAUSE_PUNCTUATION_PATTERN.test(String(leftToken?.text ?? ""))) return "clause_punctuation";
  if (CLAUSE_ENDING_PATTERN.test(left)) return "clause_ending";
  if (PIVOT_START_PATTERN.test(right)) return "pivot_start";
  return null;
}

function chooseSemanticSplit(tokens) {
  const candidates = [];
  for (let split = 1; split < tokens.length; split++) {
    const leftTokens = tokens.slice(0, split);
    const rightTokens = tokens.slice(split);
    if (tokens.length >= 4 && (leftTokens.length < 2 || rightTokens.length < 2)) continue;
    const boundaryType = semanticBoundaryType(tokens[split - 1], tokens[split]);
    if (!boundaryType) continue;
    const leftChars = visibleCharacterCount(leftTokens);
    const rightChars = visibleCharacterCount(rightTokens);
    const overflowPenalty = Math.max(0, leftChars - MAX_VISIBLE_CHARS_PER_BLOCK) * 40 +
      Math.max(0, rightChars - MAX_VISIBLE_CHARS_PER_BLOCK) * 40;
    const boundaryPenalty = boundaryType === "clause_punctuation" ? 0 : boundaryType === "clause_ending" ? 3 : 5;
    candidates.push({
      split,
      boundaryType,
      score: overflowPenalty + Math.abs(leftChars - rightChars) + Math.abs(split - tokens.length / 2) * 2 + boundaryPenalty,
    });
  }
  return candidates.sort((a, b) => a.score - b.score)[0] ?? null;
}

function splitOversizedSemanticUnit(tokens, terminalBoundaryType) {
  if (displayUnitFits(tokens)) return [{ tokens, boundaryType: terminalBoundaryType }];
  const split = chooseSemanticSplit(tokens);
  if (!split) return [{ tokens, boundaryType: "unsplittable_overflow" }];
  return [
    ...splitOversizedSemanticUnit(tokens.slice(0, split.split), split.boundaryType),
    ...splitOversizedSemanticUnit(tokens.slice(split.split), terminalBoundaryType),
  ];
}

function sourceSegmentsForScene(scene, performanceText, globalStartOffset) {
  const directed = Array.isArray(scene?.speechDirection?.segments)
    ? scene.speechDirection.segments
      .map((segment) => String(segment?.text ?? "").trim())
      .filter(Boolean)
    : [];
  const fallback = String(performanceText)
    .split(/\r?\n/gu)
    .map((text) => text.trim())
    .filter(Boolean);
  const candidates = directed.length > 0 ? directed : fallback;
  const segments = [];
  let localCursor = 0;
  for (const text of candidates) {
    const localStart = performanceText.indexOf(text, localCursor);
    if (localStart < 0) return sourceSegmentsForScene({ speechDirection: { segments: [] } }, performanceText, globalStartOffset);
    segments.push({
      text,
      startOffset: globalStartOffset + localStart,
      endOffset: globalStartOffset + localStart + text.length,
    });
    localCursor = localStart + text.length;
  }
  if (normalizedTranscript(candidates.join(" ")) !== normalizedTranscript(performanceText)) {
    if (directed.length > 0) {
      return sourceSegmentsForScene({ speechDirection: { segments: [] } }, performanceText, globalStartOffset);
    }
    return [{ text: performanceText, startOffset: globalStartOffset, endOffset: globalStartOffset + performanceText.length }];
  }
  return segments;
}

function sentenceUnitsForSegment(segment) {
  const tokens = tokenSpans(segment.text, segment.startOffset);
  const units = [];
  let current = [];
  for (const token of tokens) {
    current.push(token);
    if (STRONG_SENTENCE_END_PATTERN.test(token.text)) {
      units.push({ tokens: current, boundaryType: "sentence" });
      current = [];
    }
  }
  if (current.length > 0) units.push({ tokens: current, boundaryType: "script_segment" });
  return units;
}

function sentenceSemanticTokenGroups(scene, performanceText, sceneStartOffset) {
  const sourceSegments = sourceSegmentsForScene(scene, performanceText, sceneStartOffset);
  const sourceSegmentEndOffsets = new Set(sourceSegments.map((segment) => segment.endOffset));
  const sentenceEndOffsets = new Set();
  const groups = sourceSegments.flatMap((segment) =>
    sentenceUnitsForSegment(segment).flatMap((unit) => {
      if (unit.boundaryType === "sentence") {
        sentenceEndOffsets.add(unit.tokens[unit.tokens.length - 1].endOffset);
      }
      return splitOversizedSemanticUnit(unit.tokens, unit.boundaryType);
    })
  );
  return { groups, sourceSegmentEndOffsets, sentenceEndOffsets };
}

function captionLines(tokens) {
  if (visibleCharacterCount(tokens) <= TARGET_VISIBLE_CHARS_PER_LINE || tokens.length < 3) {
    return [tokens];
  }
  let bestSplit = 1;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let split = 1; split < tokens.length; split++) {
    const left = visibleCharacterCount(tokens.slice(0, split));
    const right = visibleCharacterCount(tokens.slice(split));
    const score = Math.max(left, right) * 2 + Math.abs(left - right);
    if (score < bestScore) {
      bestScore = score;
      bestSplit = split;
    }
  }
  return [tokens.slice(0, bestSplit), tokens.slice(bestSplit)];
}

function fontSizeFor(lines) {
  const maxLineChars = Math.max(...lines.map(visibleCharacterCount));
  if (maxLineChars <= 7) return 92;
  if (maxLineChars <= 10) return 84;
  if (maxLineChars <= 13) return 76;
  if (maxLineChars <= 16) return 68;
  if (maxLineChars <= 18) return 60;
  if (maxLineChars <= 20) return 54;
  return 48;
}

function matchesEmphasis(word, emphasis) {
  const normalizedWord = normalizeWord(word);
  const normalizedEmphasis = normalizeWord(emphasis);
  return Boolean(
    normalizedWord && normalizedEmphasis &&
    (normalizedWord.includes(normalizedEmphasis) || normalizedEmphasis.includes(normalizedWord))
  );
}

function stripDisplayTerminalPunctuation(value) {
  return String(value ?? "").replace(DISPLAY_TRAILING_PUNCTUATION_PATTERN, "").trimEnd();
}

function emphasisCategoryForWord(word) {
  const normalized = normalizeWord(word);
  for (const rule of EMPHASIS_RULES) {
    if (rule.keywords.some((keyword) =>
      normalized.includes(keyword) || keyword.includes(normalized)
    )) return rule.category;
  }
  return "contrast";
}

function emphasisWordsForScene(scene, text) {
  const directed = Array.isArray(scene?.speechDirection?.emphasisWords)
    ? scene.speechDirection.emphasisWords.map((word) => String(word ?? "").trim()).filter(Boolean)
    : [];
  const sourceTokens = String(text ?? "").split(/\s+/gu).map(normalizeWord).filter(Boolean);
  const candidates = [];
  const addCandidate = (candidate, directedBySpeech = false, forcedCategory = null) => {
    const matchedToken = sourceTokens.find((token) => matchesEmphasis(token, candidate));
    if (!matchedToken || candidates.some((item) => item.text === matchedToken)) return;
    const category = forcedCategory ?? emphasisCategoryForWord(matchedToken);
    candidates.push({
      text: matchedToken,
      category,
      strength: directedBySpeech || HIGH_IMPACT_ROLES.has(scene?.sceneRole) || ["risk", "action", "recall"].includes(category)
        ? "strong"
        : "standard",
      directedBySpeech,
    });
  };
  directed.forEach((candidate) => addCandidate(candidate, true));
  EMPHASIS_RULES.forEach((rule) => rule.keywords.forEach((keyword) => {
    if (text.includes(keyword)) addCandidate(keyword, false, rule.category);
  }));

  if (candidates.length === 0 && HIGH_IMPACT_ROLES.has(scene?.sceneRole)) {
    const fallback = sourceTokens
      .filter((token) => token.length >= 2)
      .sort((a, b) => b.length - a.length)[0];
    if (fallback) addCandidate(fallback, false, ROLE_FALLBACK_CATEGORY[scene.sceneRole] ?? "contrast");
  }

  const maxCount = HIGH_IMPACT_ROLES.has(scene?.sceneRole) ? 2 : 1;
  if (maxCount === 1 || candidates.length <= 1) return candidates.slice(0, maxCount);
  const selected = [candidates[0]];
  const differentCategory = candidates.find((candidate) =>
    candidate.text !== selected[0].text && candidate.category !== selected[0].category
  );
  if (differentCategory) selected.push(differentCategory);
  else if (candidates[1]) selected.push(candidates[1]);
  return selected.slice(0, maxCount);
}

export function escapeAssText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\r?\n/g, " ");
}

function captionAssText(lines, emphasisWords, fontSize) {
  const finalToken = lines[lines.length - 1]?.[lines[lines.length - 1].length - 1] ?? null;
  const appliedEmphasis = [];
  const usedEmphasis = new Set();
  const displayLines = lines.map((line) => line.map((token) => ({
    ...token,
    displayText: token === finalToken ? stripDisplayTerminalPunctuation(token.text) : token.text,
  })).filter((token) => token.displayText));
  const assText = displayLines.map((line) => line.map((token) => {
    const escaped = escapeAssText(token.displayText);
    const emphasis = emphasisWords.find((candidate) =>
      !usedEmphasis.has(candidate.text) && matchesEmphasis(token.text, candidate.text)
    );
    if (!emphasis) return escaped;
    usedEmphasis.add(emphasis.text);
    const palette = DYNAMIC_CAPTION_EMPHASIS_PALETTE[emphasis.category];
    const strong = emphasis.strength === "strong";
    appliedEmphasis.push({ ...emphasis, color: palette.hex, assColor: palette.assColor });
    return "{\\c" + palette.assColor + "\\fs" + (fontSize + (strong ? 14 : 8)) +
      "\\bord" + (strong ? 8 : 7) + "\\shad" + (strong ? 3 : 2) + "}" + escaped +
      "{\\c&H00F2EFE8&\\fs" + fontSize + "\\bord6\\shad2}";
  }).join(" ")).join("\\N");
  return {
    assText,
    displayText: displayLines.flat().map((token) => token.displayText).join(" "),
    appliedEmphasis,
  };
}

function captionPlacement(sceneRole, sceneIndex, groupIndex) {
  const sequence = ROLE_LAYOUT_SEQUENCE[sceneRole] ?? ROLE_LAYOUT_SEQUENCE.situation;
  const placementId = sequence[(sceneIndex + groupIndex) % sequence.length];
  return { placementId, ...CAPTION_LAYOUTS[placementId] };
}

function motionPresetForScene(sceneRole) {
  return ROLE_MOTION_PRESET[sceneRole] ?? "soft_settle";
}

function captionVisualBounds({ y, lineCount, fontSize }) {
  const halfHeight = Math.ceil(lineCount * fontSize * 0.72 + 18);
  return { top: y - halfHeight, bottom: y + halfHeight };
}

function timedEntriesForSpan(entries, startOffset, endOffset) {
  return entries.filter((entry) =>
    entry.endOffset > startOffset &&
    entry.startOffset < endOffset &&
    entry.startSec !== null &&
    entry.endSec !== null
  );
}

function buildRawBlocks(plannedScenes, measuredScenes, alignmentData) {
  const blocks = [];
  let searchCursor = 0;

  for (let sceneIndex = 0; sceneIndex < plannedScenes.length; sceneIndex++) {
    const scene = plannedScenes[sceneIndex];
    const performanceText = performanceTextForScene(scene);
    if (!performanceText) {
      throw new Error("Scene " + scene.sceneNumber + " has no TTS performance text.");
    }
    const sceneStartOffset = alignmentData.alignedText.indexOf(performanceText, searchCursor);
    if (sceneStartOffset < 0) {
      throw new Error("Scene " + scene.sceneNumber + " full transcript was not found in ElevenLabs alignment.");
    }
    searchCursor = sceneStartOffset + performanceText.length;
    const grouped = sentenceSemanticTokenGroups(scene, performanceText, sceneStartOffset);
    const groups = grouped.groups;
    if (groups.length === 0) {
      throw new Error("Scene " + scene.sceneNumber + " produced no full-script caption blocks.");
    }

    groups.forEach((displayGroup, groupIndex) => {
      const group = displayGroup.tokens;
      const timedEntries = timedEntriesForSpan(
        alignmentData.entries,
        group[0].startOffset,
        group[group.length - 1].endOffset,
      );
      if (timedEntries.length === 0) {
        throw new Error("Scene " + scene.sceneNumber + " caption block has no character timing.");
      }
      const lines = captionLines(group);
      const fontSize = fontSizeFor(lines);
      const text = group.map((token) => token.text).join(" ");
      const emphasisWords = emphasisWordsForScene(scene, text);
      const renderedCaption = captionAssText(lines, emphasisWords, fontSize);
      const placement = captionPlacement(scene.sceneRole, sceneIndex, groupIndex);
      const visualBounds = captionVisualBounds({
        y: placement.y,
        lineCount: lines.length,
        fontSize,
      });
      const wordTimings = group.map((token) => {
        const wordEntries = timedEntriesForSpan(
          alignmentData.entries,
          token.startOffset,
          token.endOffset,
        );
        if (wordEntries.length === 0) {
          throw new Error("Scene " + scene.sceneNumber + " word has no character timing: " + token.text);
        }
        return {
          text: token.text,
          startSec: Number(wordEntries[0].startSec.toFixed(3)),
          endSec: Number(wordEntries[wordEntries.length - 1].endSec.toFixed(3)),
        };
      });
      blocks.push({
        id: "scene-" + String(scene.sceneNumber).padStart(2, "0") +
          "-full-" + String(groupIndex + 1).padStart(2, "0"),
        sceneNumber: Number(scene.sceneNumber),
        sceneRole: scene.sceneRole ?? "unknown",
        sceneIndex,
        text,
        displayText: renderedCaption.displayText,
        assText: renderedCaption.assText,
        wordCount: group.length,
        visibleCharacterCount: visibleCharacterCount(group),
        lineCount: lines.length,
        maxLineVisibleChars: Math.max(...lines.map(visibleCharacterCount)),
        startSec: Number(timedEntries[0].startSec.toFixed(3)),
        sourceEndSec: Number(timedEntries[timedEntries.length - 1].endSec.toFixed(3)),
        anchorType: "elevenlabs_full_script_character_range",
        anchorText: group[0].text,
        cueSource: "full_tts_transcript",
        anchorDeltaMs: 0,
        sourceStartOffset: group[0].startOffset,
        sourceEndOffset: group[group.length - 1].endOffset,
        boundaryType: displayGroup.boundaryType,
        endsSentence: grouped.sentenceEndOffsets.has(group[group.length - 1].endOffset),
        endsSourceSegment: grouped.sourceSegmentEndOffsets.has(group[group.length - 1].endOffset),
        x: placement.x,
        y: placement.y,
        placementId: placement.placementId,
        visualTop: visualBounds.top,
        visualBottom: visualBounds.bottom,
        fontSize,
        emphasisWords: emphasisWords.map((item) => item.text),
        emphasisItems: renderedCaption.appliedEmphasis,
        motionPreset: motionPresetForScene(scene.sceneRole),
        wordTimings,
      });
    });
  }

  return blocks.map((block, index) => {
    const next = blocks[index + 1] ?? null;
    const measured = measuredScenes[block.sceneIndex];
    const sceneSpokenEndSec = finiteNumber(measured?.spokenEndSec) ??
      finiteNumber(measured?.endSec) ??
      block.sourceEndSec;
    const desiredEndSec = next
      ? Math.max(block.sourceEndSec, next.startSec - 0.04)
      : Math.max(block.sourceEndSec + 0.08, sceneSpokenEndSec + 0.08);
    const endSec = next
      ? Math.min(desiredEndSec, next.startSec - 0.01)
      : desiredEndSec;
    if (!(endSec > block.startSec) || endSec + 0.021 < block.sourceEndSec) {
      throw new Error("Caption timing collapsed near " + block.id + ".");
    }
    return {
      ...block,
      endSec: Number(endSec.toFixed(3)),
      dwellSec: Number((endSec - block.startSec).toFixed(3)),
    };
  });
}

function buildFullScriptAudit(plannedScenes, measuredScenes, captions) {
  const sourceByScene = new Map(plannedScenes.map((scene) => [
    Number(scene.sceneNumber),
    normalizedTranscript(performanceTextForScene(scene)),
  ]));
  const captionByScene = new Map(plannedScenes.map((scene) => [
    Number(scene.sceneNumber),
    normalizedTranscript(
      captions
        .filter((caption) => caption.sceneNumber === Number(scene.sceneNumber))
        .map((caption) => caption.text)
        .join(" "),
    ),
  ]));
  const sourceTranscript = normalizedTranscript([...sourceByScene.values()].join(" "));
  const captionTranscript = normalizedTranscript([...captionByScene.values()].join(" "));
  const displayTranscript = normalizedTranscript(captions.map((caption) => caption.displayText).join(" "));
  const sourceCharacters = coverageCharacters(sourceTranscript);
  const captionCharacters = coverageCharacters(captionTranscript);
  const captionCoverageRatio = sourceCharacters > 0
    ? Number((captionCharacters / sourceCharacters).toFixed(4))
    : 0;
  const exactTranscriptMatchPass = sourceTranscript === captionTranscript;
  const perSceneTranscriptMatchPass = plannedScenes.every((scene) =>
    sourceByScene.get(Number(scene.sceneNumber)) === captionByScene.get(Number(scene.sceneNumber))
  );
  const firstStart = captions[0]?.startSec ?? 0;
  const lastEnd = captions[captions.length - 1]?.endSec ?? 0;
  const timelineDuration = Math.max(
    ...measuredScenes.map((scene) => finiteNumber(scene?.endSec) ?? finiteNumber(scene?.spokenEndSec) ?? 0),
    lastEnd,
  );
  const screenDutyRatio = timelineDuration > 0
    ? Number((captions.reduce((sum, caption) => sum + caption.dwellSec, 0) / timelineDuration).toFixed(4))
    : 0;
  const gaps = captions.slice(0, -1).map((caption, index) =>
    Number((captions[index + 1].startSec - caption.endSec).toFixed(3))
  );
  const maxCaptionGapSec = gaps.length > 0 ? Math.max(...gaps) : 0;
  const minCaptionGapSec = gaps.length > 0 ? Math.min(...gaps) : 0;
  const distinctYPositions = new Set(captions.map((caption) => caption.y)).size;
  const distinctPlacements = new Set(captions.map((caption) => caption.placementId)).size;
  let longestSamePlacementRun = 0;
  let currentPlacementRun = 0;
  let previousPlacement = null;
  for (const caption of captions) {
    currentPlacementRun = caption.placementId === previousPlacement ? currentPlacementRun + 1 : 1;
    previousPlacement = caption.placementId;
    longestSamePlacementRun = Math.max(longestSamePlacementRun, currentPlacementRun);
  }
  const appliedEmphasis = captions.flatMap((caption) => caption.emphasisItems);
  const distinctEmphasisColors = new Set(appliedEmphasis.map((item) => item.color)).size;
  const distinctEmphasisCategories = new Set(appliedEmphasis.map((item) => item.category)).size;
  const distinctMotionPresets = new Set(captions.map((caption) => caption.motionPreset)).size;
  const distinctSceneRoles = new Set(captions.map((caption) => caption.sceneRole)).size;
  const highImpactCaptions = captions.filter((caption) => HIGH_IMPACT_ROLES.has(caption.sceneRole));
  const displayWordCoveragePass = captions.every((caption) =>
    normalizedTranscript(caption.displayText) === normalizedTranscript(stripDisplayTerminalPunctuation(caption.text))
  );
  const displayTerminalPunctuationAbsent = captions.every((caption) =>
    !DISPLAY_TRAILING_PUNCTUATION_PATTERN.test(caption.displayText)
  );
  const perSceneCounts = plannedScenes.map((scene) =>
    captions.filter((caption) => caption.sceneNumber === Number(scene.sceneNumber)).length
  );
  const sceneBoundaryTimingPass = plannedScenes.every((scene, sceneIndex) => {
    const sceneCaptions = captions.filter((caption) => caption.sceneNumber === Number(scene.sceneNumber));
    const measured = measuredScenes[sceneIndex];
    const expectedStart = finiteNumber(measured?.spokenStartSec) ?? finiteNumber(measured?.startSec);
    const expectedEnd = finiteNumber(measured?.spokenEndSec) ?? finiteNumber(measured?.endSec);
    if (sceneCaptions.length === 0 || expectedStart === null || expectedEnd === null) return false;
    return Math.abs(sceneCaptions[0].startSec - expectedStart) <= 0.35 &&
      Math.abs(sceneCaptions[sceneCaptions.length - 1].sourceEndSec - expectedEnd) <= 0.35;
  });
  const expectedSentenceBoundaryCount = plannedScenes.reduce((sum, scene) =>
    sum + tokenSpans(performanceTextForScene(scene), 0)
      .filter((token) => STRONG_SENTENCE_END_PATTERN.test(token.text)).length, 0);
  const expectedSourceSegmentBoundaryCount = plannedScenes.reduce((sum, scene) =>
    sum + sourceSegmentsForScene(scene, performanceTextForScene(scene), 0).length, 0);
  const sentenceBoundaryCount = captions.filter((caption) => caption.endsSentence).length;
  const sourceSegmentBoundaryCount = captions.filter((caption) => caption.endsSourceSegment).length;
  const arbitrarySplitCount = captions.filter((caption) =>
    !ALLOWED_BOUNDARY_TYPES.has(caption.boundaryType)
  ).length;
  const sentenceBlockCount = captions.filter((caption) => caption.boundaryType === "sentence").length;
  const semanticPhraseBlockCount = captions.filter((caption) =>
    ["clause_punctuation", "clause_ending", "pivot_start"].includes(caption.boundaryType)
  ).length;
  const maxVisibleCharactersPerBlock = Math.max(...captions.map((caption) => caption.visibleCharacterCount));
  const maxLineVisibleChars = Math.max(...captions.map((caption) => caption.maxLineVisibleChars));
  const maxLineCount = Math.max(...captions.map((caption) => caption.lineCount));
  const displayUnitLengthPass = captions.every((caption) =>
    caption.wordCount >= 1 &&
    caption.wordCount <= MAX_WORDS_PER_DISPLAY_UNIT &&
    caption.visibleCharacterCount <= MAX_VISIBLE_CHARS_PER_BLOCK &&
    caption.lineCount <= 2 &&
    caption.maxLineVisibleChars <= MAX_VISIBLE_CHARS_PER_LINE
  );

  return {
    contractVersion: FULL_SCRIPT_CAPTION_CONTRACT_VERSION,
    timingSource: "elevenlabs_character_alignment_full_script",
    mode: "full_script_dynamic_semantic_aligned",
    blockCount: captions.length,
    firstCaptionStartSec: firstStart,
    maxWordsPerBlock: Math.max(...captions.map((caption) => caption.wordCount)),
    minWordsPerBlock: Math.min(...captions.map((caption) => caption.wordCount)),
    maxVisibleCharactersPerBlock,
    maxLineVisibleChars,
    maxLineCount,
    sentenceBlockCount,
    semanticPhraseBlockCount,
    arbitrarySplitCount,
    expectedSentenceBoundaryCount,
    sentenceBoundaryCount,
    expectedSourceSegmentBoundaryCount,
    sourceSegmentBoundaryCount,
    maxDwellSec: Math.max(...captions.map((caption) => caption.dwellSec)),
    minY: Math.min(...captions.map((caption) => caption.y)),
    maxY: Math.max(...captions.map((caption) => caption.y)),
    distinctYPositions,
    distinctPlacements,
    longestSamePlacementRun,
    sourceTranscript,
    captionTranscript,
    displayTranscript,
    sourceCharacterCount: sourceCharacters,
    captionCharacterCount: captionCharacters,
    captionCoverageRatio,
    screenDutyRatio,
    maxCaptionGapSec,
    minCaptionGapSec,
    firstTwoSecondsHook: firstStart < 2,
    displayUnitLengthPass,
    wordsPerBlockPass: displayUnitLengthPass,
    dwellPass: captions.every((caption) =>
      caption.dwellSec > 0 && caption.dwellSec <= MAX_CAPTION_DWELL_SEC + 0.001
    ),
    safeFramePass: captions.every((caption) =>
      caption.visualTop >= 300 && caption.visualBottom <= SAFE_TEXT_MAX_Y
    ),
    dynamicPlacementPass:
      distinctYPositions >= Math.min(3, captions.length) &&
      distinctPlacements >= Math.min(3, captions.length) &&
      longestSamePlacementRun <= 2,
    multiPositionNarrativeFlowPass:
      distinctYPositions >= Math.min(3, captions.length) &&
      longestSamePlacementRun <= 2,
    positionStrategy: "scene_role_caption_safe_zone_six_position_v1",
    wordAnchoredPass: captions.every((caption) =>
      caption.anchorDeltaMs === 0 &&
      caption.wordTimings.length === caption.wordCount &&
      caption.startSec === caption.wordTimings[0].startSec &&
      caption.sourceEndSec === caption.wordTimings[caption.wordTimings.length - 1].endSec
    ),
    fullScriptCoveragePass:
      exactTranscriptMatchPass &&
      perSceneTranscriptMatchPass &&
      captionCoverageRatio === 1,
    exactTranscriptMatchPass,
    displayWordCoveragePass,
    displayTerminalPunctuationAbsent,
    perSceneTranscriptMatchPass,
    perSceneBlockCountPass: perSceneCounts.every((count) => count >= 1),
    minBlocksPerScene: Math.min(...perSceneCounts),
    maxBlocksPerScene: Math.max(...perSceneCounts),
    sceneBoundaryTimingPass,
    noCaptionOverlapPass: minCaptionGapSec >= 0,
    captionGapPass: maxCaptionGapSec <= 0.12,
    screenDutyPass: screenDutyRatio >= 0.9 && screenDutyRatio <= 1.01,
    sentenceBoundaryPreservedPass: sentenceBoundaryCount === expectedSentenceBoundaryCount,
    sourceSegmentBoundaryPreservedPass: sourceSegmentBoundaryCount === expectedSourceSegmentBoundaryCount,
    arbitraryMidPhraseSplitAbsent: arbitrarySplitCount === 0,
    sentenceSemanticSegmentationPass:
      displayUnitLengthPass &&
      sentenceBoundaryCount === expectedSentenceBoundaryCount &&
      sourceSegmentBoundaryCount === expectedSourceSegmentBoundaryCount &&
      arbitrarySplitCount === 0,
    oneWordFragmentAbsent: captions.every((caption) =>
      caption.wordCount > 1 || caption.endsSentence || caption.endsSourceSegment
    ),
    maxEmphasizedWordsPerCaption: Math.max(...captions.map((caption) => caption.emphasisItems.length)),
    distinctEmphasisColors,
    distinctEmphasisCategories,
    semanticColorPalettePass:
      appliedEmphasis.length > 0 &&
      distinctEmphasisColors >= Math.min(2, distinctEmphasisCategories) &&
      appliedEmphasis.every((item) =>
        DYNAMIC_CAPTION_EMPHASIS_PALETTE[item.category]?.hex === item.color
      ),
    emphasisDensityPass: captions.every((caption) => caption.emphasisItems.length <= 2),
    highImpactRoleEmphasisPass: highImpactCaptions.every((caption) =>
      caption.emphasisItems.some((item) => item.strength === "strong")
    ),
    distinctMotionPresets,
    motionDiversityPass:
      captions.every((caption) => ALLOWED_MOTION_PRESETS.has(caption.motionPreset)) &&
      distinctMotionPresets >= Math.min(3, distinctSceneRoles),
    bottomFixedSubtitleBar: false,
    fullSentenceBottomLock: false,
    karaokeFixedLowerLine: false,
    font: DYNAMIC_CAPTION_FONT,
  };
}

export function buildDynamicCaptionTimeline({ ttsScenes, audioScenes, alignmentDocument }) {
  const alignmentData = validateAlignment(alignmentDocument);
  const plannedScenes = [...ttsScenes].sort((a, b) => Number(a.sceneNumber) - Number(b.sceneNumber));
  const measuredScenes = [...audioScenes].sort((a, b) => Number(a.sceneNumber) - Number(b.sceneNumber));
  if (plannedScenes.length === 0 || plannedScenes.length !== measuredScenes.length) {
    throw new Error("TTS scene and measured audio scene counts do not match.");
  }
  const captions = buildRawBlocks(plannedScenes, measuredScenes, alignmentData);
  if (captions.length === 0) throw new Error("No full-script caption blocks were produced.");
  return {
    captions,
    audit: buildFullScriptAudit(plannedScenes, measuredScenes, captions),
  };
}

function secToAssTime(sec) {
  const totalCentiseconds = Math.max(0, Math.round(Number(sec) * 100));
  const hours = Math.floor(totalCentiseconds / 360000);
  const minutes = Math.floor((totalCentiseconds % 360000) / 6000);
  const seconds = Math.floor((totalCentiseconds % 6000) / 100);
  const centiseconds = totalCentiseconds % 100;
  return hours + ":" +
    String(minutes).padStart(2, "0") + ":" +
    String(seconds).padStart(2, "0") + "." +
    String(centiseconds).padStart(2, "0");
}

export function createDynamicCaptionAss(captions) {
  const lines = [
    "[Script Info]",
    "Title: Money Shorts Dynamic Semantic Character-Aligned Captions",
    "ScriptType: v4.00+",
    "PlayResX: 1080",
    "PlayResY: 1920",
    "ScaledBorderAndShadow: yes",
    "WrapStyle: 2",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    "Style: Caption," + DYNAMIC_CAPTION_FONT + ",76,&H00F2EFE8,&H0057C8FF,&H00100F0D,&H00000000,-1,0,0,0,100,100,0,0,1,6,2,5,60,60,0,1",
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];
  for (const caption of captions) {
    const position = caption.motionPreset === "action_lift"
      ? "\\move(" + caption.x + "," + (caption.y + 28) + "," + caption.x + "," + caption.y + ",0,190)"
      : caption.motionPreset === "contrast_reveal"
        ? "\\move(" + (caption.x - 24) + "," + caption.y + "," + caption.x + "," + caption.y + ",0,180)"
        : "\\pos(" + caption.x + "," + caption.y + ")";
    const motionByPreset = {
      hook_pop: "\\fad(35,65)\\fscx88\\fscy88\\t(0,110,0.75,\\fscx104\\fscy104)\\t(110,220,0.7,\\fscx100\\fscy100)",
      evidence_snap: "\\fad(40,70)\\fscx92\\fscy92\\t(0,145,0.8,\\fscx101\\fscy101)\\t(145,230,0.75,\\fscx100\\fscy100)",
      soft_settle: "\\fad(55,85)\\fscx96\\fscy96\\t(0,220,0.65,\\fscx100\\fscy100)",
      risk_punch: "\\fad(30,70)\\fscx90\\fscy90\\t(0,95,0.8,\\fscx105\\fscy105)\\t(95,215,0.7,\\fscx100\\fscy100)",
      contrast_reveal: "\\fad(45,75)\\fscx95\\fscy95\\t(0,190,0.7,\\fscx100\\fscy100)",
      action_lift: "\\fad(40,70)\\fscx93\\fscy93\\t(0,190,0.7,\\fscx100\\fscy100)",
      recall_land: "\\fad(35,95)\\fscx90\\fscy90\\t(0,120,0.75,\\fscx103\\fscy103)\\t(120,245,0.68,\\fscx100\\fscy100)",
    };
    const motion = "{\\an5" + position + "\\fs" + caption.fontSize + motionByPreset[caption.motionPreset] + "}";
    lines.push(
      "Dialogue: 0," + secToAssTime(caption.startSec) + "," + secToAssTime(caption.endSec) +
      ",Caption,,0,0,0,," + motion + caption.assText,
    );
  }
  return lines.join("\n") + "\n";
}
