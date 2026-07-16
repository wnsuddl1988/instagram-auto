#!/usr/bin/env node
/** Deterministic, no-media/no-network guard for full-script aligned captions. */

import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

import {
  DYNAMIC_CAPTION_CONTRACT_VERSION,
  FULL_SCRIPT_CAPTION_CONTRACT_VERSION,
  DYNAMIC_CAPTION_FONT,
  DYNAMIC_CAPTION_LAYOUT_VERSION,
  DYNAMIC_CAPTION_TWO_LINE_GAP_PX,
  DYNAMIC_CAPTION_EMPHASIS_PALETTE,
  buildDynamicCaptionTimeline,
  createDynamicCaptionAss,
} from "./_money-shorts-dynamic-captions.mjs";

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) {
    passed += 1;
    console.log("PASS  " + label);
  } else {
    failed += 1;
    console.error("FAIL  " + label);
  }
}

function normalized(value) {
  return String(value ?? "").normalize("NFKC").replace(/\s+/gu, " ").trim();
}

function loadTypescriptModule(filePath) {
  const source = readFileSync(filePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const sandboxModule = { exports: {} };
  vm.runInNewContext(output, {
    module: sandboxModule,
    exports: sandboxModule.exports,
    console,
  });
  return sandboxModule.exports;
}

function buildSyntheticTimeline(ttsScenes, totalDurationSec) {
  const text = ttsScenes
    .map((scene) => scene.speechDirection.performanceText)
    .join("\n");
  const characters = [...text];
  const step = totalDurationSec / characters.length;
  const starts = characters.map((_, index) => Number((index * step).toFixed(4)));
  const ends = starts.map((start) => Number((start + step * 0.82).toFixed(4)));
  let searchCursor = 0;
  const audioScenes = ttsScenes.map((scene) => {
    const performanceText = scene.speechDirection.performanceText;
    const offset = text.indexOf(performanceText, searchCursor);
    const endOffset = offset + [...performanceText].length - 1;
    searchCursor = offset + performanceText.length;
    return {
      sceneNumber: scene.sceneNumber,
      spokenStartSec: starts[offset],
      spokenEndSec: ends[endOffset],
      startSec: starts[offset],
      endSec: ends[endOffset],
    };
  });
  return buildDynamicCaptionTimeline({
    ttsScenes,
    audioScenes,
    alignmentDocument: {
      alignment: {
        characters,
        character_start_times_seconds: starts,
        character_end_times_seconds: ends,
      },
    },
  });
}

const scenes = [
  ["hook", "주가가 싸졌는데 더 위험해질 수 있는 이유.\n가격이 내려갔다는 사실만으로 살 이유가 생기진 않아."],
  ["situation", "주가가 급하게 떨어지면 예전 가격이 기준처럼 보이고,"],
  ["consequence", "가격이 아니라 깨진 투자 이유에 돈을 계속 묶게 돼."],
  ["psychology", "사람은 낮아진 가격을 보면 손실 가능성보다 할인 기회부터 크게 느껴."],
  ["mindset", "자산을 지키는 사람은 처음 가정이 살아 있는지부터 확인해."],
  ["habit", "매수 화면을 열기 전에 하락 원인과 처음 매수 이유를 한 줄씩 적어."],
  ["save", "다음 선택 전에 다시 보고 저장해 둬.\n투자 기준도 계속 알려줄 테니 팔로우해 둬."],
].map(([sceneRole, narration], index) => ({
  sceneNumber: index + 1,
  sceneRole,
  narration,
  speechDirection: {
    performanceText: narration,
    emphasisWords: index === 0 ? ["위험"] : [],
    segments: String(narration).split("\n").map((text) => ({ text })),
  },
  sampleReviewCaptionCues: [
    { displayText: "이 문구만 뽑으면 실패", anchorText: "주가가 싸졌는데" },
  ],
}));

const timeline = buildSyntheticTimeline(scenes, 48);
const captions = timeline.captions;
const audit = timeline.audit;
const ass = createDynamicCaptionAss(captions);
const plainAssText = normalized(ass.replace(/\{[^}]*\}/gu, "").replace(/\\N/gu, " "));
const sourceTranscript = normalized(scenes.map((scene) => scene.narration).join(" "));
const captionTranscript = normalized(captions.map((caption) => caption.text).join(" "));
const displayCaptionTranscript = normalized(captions.map((caption) => caption.displayText).join(" "));

check("caption contract is dynamic-semantic v6", audit.contractVersion === FULL_SCRIPT_CAPTION_CONTRACT_VERSION && audit.contractVersion === "money_shorts_dynamic_semantic_caption_v6");
check("compatibility contract export points to v6", DYNAMIC_CAPTION_CONTRACT_VERSION === FULL_SCRIPT_CAPTION_CONTRACT_VERSION);
check("caption mode is full-script dynamic-semantic aligned", audit.mode === "full_script_dynamic_semantic_aligned");
check("all script text is present in order", sourceTranscript === captionTranscript);
check("audit requires exact transcript equality", audit.exactTranscriptMatchPass);
check("audit requires every scene transcript", audit.perSceneTranscriptMatchPass);
check("coverage ratio is exactly one", audit.fullScriptCoveragePass && audit.captionCoverageRatio === 1);
check("source and caption character counts match", audit.sourceCharacterCount === audit.captionCharacterCount);
check("spoken transcript punctuation remains in the timing source", captions[0]?.text.endsWith(".") && captionTranscript.includes("않아."));
check("display captions remove only terminal punctuation", audit.displayTerminalPunctuationAbsent && audit.displayWordCoveragePass && displayCaptionTranscript.includes("않아") && !displayCaptionTranscript.includes("않아."));
check("editorial summary cues cannot replace the transcript", !captionTranscript.includes("이 문구만 뽑으면 실패"));
check("every caption is a bounded two-line sentence or semantic phrase", audit.displayUnitLengthPass && captions.every((caption) => caption.wordCount >= 1 && caption.wordCount <= 16 && caption.visibleCharacterCount <= 34 && caption.lineCount <= 2 && caption.maxLineVisibleChars <= 20));
check("two-line captions use the comfortable line-gap layout contract",
  audit.layoutVersion === DYNAMIC_CAPTION_LAYOUT_VERSION &&
  audit.twoLineSpacingPass === true &&
  audit.twoLineSpacingPx === DYNAMIC_CAPTION_TWO_LINE_GAP_PX &&
  captions.every((caption) => caption.lineCount === 2 ? caption.lineGapPx === 18 : caption.lineGapPx === 0) &&
  ass.includes("\\N{\\fs18}\\h"));
check("source sentence boundaries are preserved", audit.sentenceBoundaryPreservedPass && audit.sentenceBoundaryCount === audit.expectedSentenceBoundaryCount);
check("script paragraph boundaries are preserved", audit.sourceSegmentBoundaryPreservedPass && audit.sourceSegmentBoundaryCount === audit.expectedSourceSegmentBoundaryCount);
check("arbitrary mid-phrase splits are forbidden", audit.sentenceSemanticSegmentationPass && audit.arbitraryMidPhraseSplitAbsent && audit.arbitrarySplitCount === 0);
check("opening sentences remain intact instead of being split every four words",
  captions[0]?.text === "주가가 싸졌는데 더 위험해질 수 있는 이유." &&
  captions[1]?.text === "가격이 내려갔다는 사실만으로 살 이유가 생기진 않아.");
check("one-word chasing fragments are absent unless the complete source sentence is one word", audit.oneWordFragmentAbsent);
check("every caption block carries per-word character timing", captions.every((caption) => caption.wordTimings.length === caption.wordCount));
check("block starts match the first spoken word", captions.every((caption) => caption.startSec === caption.wordTimings[0].startSec));
check("block source ends match the final spoken word", captions.every((caption) => caption.sourceEndSec === caption.wordTimings[caption.wordTimings.length - 1].endSec));
check("scene boundaries match measured speech", audit.sceneBoundaryTimingPass);
check("caption order never overlaps", audit.noCaptionOverlapPass && audit.minCaptionGapSec >= 0);
check("caption gaps remain effectively continuous", audit.captionGapPass && audit.maxCaptionGapSec <= 0.12);
check("captions cover at least ninety percent of the audio timeline", audit.screenDutyPass && audit.screenDutyRatio >= 0.9);
check("hook caption starts inside two seconds", audit.firstTwoSecondsHook);
check("captions remain inside platform-safe vertical space", audit.safeFramePass && audit.maxY <= 1580);
check("caption placement uses at least three scene-aware safe positions", audit.dynamicPlacementPass && audit.multiPositionNarrativeFlowPass && audit.distinctYPositions >= 3 && audit.longestSamePlacementRun <= 2);
check("no fixed bottom bar is introduced", audit.bottomFixedSubtitleBar === false && audit.karaokeFixedLowerLine === false);
check("legacy transcript-forbidden gate is absent", !Object.hasOwn(audit, "fullTranscriptForbiddenPass"));
check("approved bold Korean font remains", DYNAMIC_CAPTION_FONT === "Black Han Sans" && ass.includes("Black Han Sans"));
check("semantic emphasis uses multiple bounded colors and stronger high-impact words", audit.semanticColorPalettePass && audit.emphasisDensityPass && audit.highImpactRoleEmphasisPass && audit.distinctEmphasisColors >= 2 && audit.maxEmphasizedWordsPerCaption <= 2 && Object.values(DYNAMIC_CAPTION_EMPHASIS_PALETTE).every((palette) => /^#[0-9A-F]{6}$/u.test(palette.hex)));
check("ASS uses role-specific pop, punch, reveal, lift and landing motion", audit.motionDiversityPass && audit.distinctMotionPresets >= 3 && /\\move\(/.test(ass) && /\\fscx105/.test(ass) && /\\fscx103/.test(ass));
check(
  "ASS contains every opening token",
  ["주가가", "싸졌는데", "살", "이유가", "생기진", "않아"].every((token) => plainAssText.includes(token)) && !plainAssText.includes("않아."),
);

for (const sceneCount of [4, 18]) {
  const boundaryScenes = Array.from({ length: sceneCount }, (_, index) => {
    const sceneRole = ["hook", "situation", "consequence", "psychology", "mindset", "habit", "save"][index % 7];
    const narration = "장면 " + (index + 1) + "에서 월급과 고정비를 확인하고 다음 선택에 쓸 돈을 충분히 남겨 둬.";
    return {
      sceneNumber: index + 1,
      sceneRole,
      narration,
      speechDirection: {
        performanceText: narration,
        emphasisWords: ["월급"],
        segments: [{ text: narration }],
      },
    };
  });
  const boundary = buildSyntheticTimeline(boundaryScenes, sceneCount * 5.2);
  check(
    sceneCount + "-scene boundary preserves the complete transcript",
    boundary.audit.fullScriptCoveragePass &&
      boundary.audit.perSceneTranscriptMatchPass &&
      boundary.audit.captionCoverageRatio === 1,
  );
}

const longSentenceText =
  "월급이 들어오면 자동이체와 카드값을 먼저 확인하고, 남은 돈은 생활비와 저축으로 나눈 뒤 다음 결제 전까지 그대로 유지해.";
const longSentenceTimeline = buildSyntheticTimeline([{
  sceneNumber: 1,
  sceneRole: "habit",
  narration: longSentenceText,
  speechDirection: {
    performanceText: longSentenceText,
    emphasisWords: ["월급"],
    segments: [{ text: longSentenceText }],
  },
}], 8.2);
check(
  "an oversized sentence splits only at an explicit semantic clause boundary",
  longSentenceTimeline.audit.fullScriptCoveragePass === true &&
    longSentenceTimeline.audit.semanticPhraseBlockCount >= 1 &&
    longSentenceTimeline.audit.arbitraryMidPhraseSplitAbsent === true &&
    longSentenceTimeline.captions[0]?.boundaryType === "clause_punctuation" &&
    longSentenceTimeline.captions[0]?.text.endsWith("확인하고,"),
);

const root = process.cwd();
const bankModule = loadTypescriptModule(path.join(root, "lib", "finance-editorial-topic-bank.ts"));
const engineModule = loadTypescriptModule(path.join(root, "lib", "finance-editorial-script-engine.ts"));
const bank = bankModule.FINANCE_EDITORIAL_TOPIC_BANK ?? [];
const buildFinanceScript = engineModule.buildFinanceEditorialScriptParts;
const scriptPartKeys = ["hook", "situation", "consequence", "psychology", "mindset", "habit", "recommendation"];
const financeCaptionFailures = [];
for (const topic of bank) {
  const parts = buildFinanceScript(topic);
  const segmentTexts = scriptPartKeys.flatMap((key) => String(parts[key] ?? "")
    .split(/\r?\n/gu)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => /[.!?…。！？,，]$/u.test(line) ? line : line + "."));
  const performanceText = segmentTexts.join("\n");
  const ttsScene = {
    sceneNumber: 1,
    sceneRole: "hook",
    narration: performanceText,
    speechDirection: {
      performanceText,
      emphasisWords: [],
      segments: segmentTexts.map((text) => ({ text })),
    },
  };
  try {
    const result = buildSyntheticTimeline(
      [ttsScene],
      Math.max(20, [...performanceText].length * 0.065),
    );
    if (
      result.audit.fullScriptCoveragePass !== true ||
      result.audit.sentenceSemanticSegmentationPass !== true ||
      result.audit.sentenceBoundaryPreservedPass !== true ||
      result.audit.sourceSegmentBoundaryPreservedPass !== true ||
      result.audit.displayUnitLengthPass !== true ||
      result.audit.arbitraryMidPhraseSplitAbsent !== true ||
      result.audit.displayTerminalPunctuationAbsent !== true ||
      result.audit.displayWordCoveragePass !== true ||
      result.audit.multiPositionNarrativeFlowPass !== true ||
      result.audit.semanticColorPalettePass !== true ||
      result.audit.highImpactRoleEmphasisPass !== true ||
      result.audit.motionDiversityPass !== true
    ) {
      financeCaptionFailures.push({ title: topic.title, audit: result.audit });
    }
  } catch (error) {
    financeCaptionFailures.push({ title: topic.title, error: error instanceof Error ? error.message : String(error) });
  }
}
check("all 500 finance scripts pass the shared sentence-semantic caption gate",
  bank.length === 500 && financeCaptionFailures.length === 0,
);
if (financeCaptionFailures.length > 0) {
  console.error(JSON.stringify(financeCaptionFailures.slice(0, 5), null, 2));
}

console.log("\n" + (passed + failed) + " checks - " + passed + " PASS, " + failed + " FAIL");
if (failed > 0) process.exit(1);
