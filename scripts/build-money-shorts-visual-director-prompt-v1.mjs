#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// build-money-shorts-visual-director-prompt-v1.mjs
//
// MONEY SHORTS OS — VISUAL DIRECTOR PROMPT v1 (data-only, no-live)
//
// 금리 동결(rate freeze) Golden Sample용 6개 이미지 프롬프트를 결정론적으로 생성한다.
// 스타일: premium editorial financial explainer, cinematic, realistic, high detail,
//         vertical 9:16.
// 각 프롬프트는 Golden Sample Structure의 씬 역할(hook/curiosity/point1/point2/point3/
// twist_action)에 매핑되며, 이미지 안 텍스트/워터마크/왜곡된 손/일반 사무직 미소/가짜
// 차트/저품질 stock 느낌을 금지한다.
//
// 이 스크립트는 절대 하지 않는다:
//   - 이미지 생성 / ChatGPT / Playwright / 네트워크 / OpenAI / env / secret
//   - render / TTS / mux / upload / deploy
// Node built-in(fs/url/path)만 사용. Math.random 미사용(결정론적).
//
// 산출물: scripts/fixtures/visual_director_prompts.rate_freeze.v1.json
// ──────────────────────────────────────────────────────────────────────────

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "fixtures", "visual_director_prompts.rate_freeze.v1.json");

// 모든 프롬프트에 공통으로 붙는 style anchor (editorial financial explainer, realistic).
const STYLE_ANCHOR =
  "Premium editorial financial explainer still, cinematic, photographic realism (not 3D, " +
  "not illustration, not animation), high detail, sharp focus. Korean personal-finance " +
  "short-form vertical 9:16 frame. Calm warm-neutral editorial color grade with a single " +
  "amber/warm-yellow accent. Grounded, believable Korean household or urban economic-life " +
  "setting — not a glossy advertisement, not a posed stock photo. Face-minimized: focus on " +
  "hands, objects, documents and space; any people are incidental, background, or cropped. " +
  "Keep the lower third and the top strip clear and uncluttered so information cards and " +
  "captions can be overlaid later.";

// 이미지 안에 절대 넣지 말아야 할 것(negative). image_generation_contract와 정합.
const NEGATIVE_PROMPT_RULES = [
  "no readable text, letters, numbers, words, or labels rendered inside the image",
  "no watermark, no logo, no signature, no UI chrome",
  "no distorted or malformed hands, no extra fingers",
  "no generic smiling office worker, no corporate handshake cliché",
  "no fake or unreadable charts, no gibberish graphs, no invented financial figures",
  "no low-quality stock-photo feel, no oversaturated stock lighting",
  "no glossy gold-heavy 'wealth ad' look, no fear/horror mood, no investment-profit implication",
  "no abstract graph wallpaper unrelated to the script"
];

// Golden Sample Structure(핸드오프) → 6개 이미지 씬 역할 매핑.
// 7구간 중 twist(20~26s)와 action(26~30s)은 하나의 twist_action 이미지 위에 카드 2장으로 처리.
const SCENES = [
  {
    sceneId: "scene_1",
    order: 1,
    sceneRole: "hook",
    blueprintPhase: "0.0~2.0s Hook",
    voiceLine: "금리 동결? 아직 안심하면 안 됩니다.",
    screenText: "아직 안심 금지",
    subject:
      "A quiet Korean kitchen table at morning light: a smartphone lying face-down beside a " +
      "half-finished cup of coffee and an unopened utility/loan envelope. A hand rests near " +
      "the phone, hesitating. Mood is calm-but-unsettled, the moment right before checking bad news.",
    visualIntent:
      "Central negative space for a big hook card. Warm morning light, shallow depth of field, " +
      "the envelope subtly emphasized as the source of worry."
  },
  {
    sceneId: "scene_2",
    order: 2,
    sceneRole: "curiosity_contrast",
    blueprintPhase: "2.0~5.0s Curiosity",
    voiceLine: "금리는 멈췄지만, 내 이자는 바로 안 멈출 수 있습니다.",
    screenText: "내 이자는 다릅니다",
    subject:
      "A split-feeling composition on a desk: on one side a folded newspaper / news card about " +
      "the central bank; on the other side an open household wallet with a bank passbook and a " +
      "loan statement. A single connecting line of tension between the two, like a detective's clue board.",
    visualIntent:
      "Contrast the 'rate news' object against the 'my wallet' object so a later card can bridge them. " +
      "Clean surface, one amber accent on the wallet side."
  },
  {
    sceneId: "scene_3",
    order: 3,
    sceneRole: "point_1_variable_rate",
    blueprintPhase: "5.0~10.0s Point 1",
    voiceLine: "첫째, 변동금리는 반영 시점을 확인해야 합니다.",
    screenText: "변동금리: 반영 시점",
    subject:
      "A close, tidy desk scene: a paper loan schedule and a wall/desk calendar with one date " +
      "circled, next to a pen. Focus on the calendar date and the schedule, suggesting a 'reflection " +
      "timing / next payment date' check — no numbers legible in-image.",
    visualIntent:
      "Checklist-card surface. Calendar + schedule read as 'when the variable rate actually hits me'. " +
      "Medium shot, desk lamp warmth."
  },
  {
    sceneId: "scene_4",
    order: 4,
    sceneRole: "point_2_deposit",
    blueprintPhase: "10.0~15.0s Point 2",
    voiceLine: "둘째, 예금은 갈아타기 전에 만기와 손실을 봐야 합니다.",
    screenText: "예금: 만기·손실 확인",
    subject:
      "A hand holding a bank passbook / deposit certificate over a table, with a small clock or " +
      "hourglass nearby suggesting maturity and time. A second document slightly aside implies a " +
      "'switch' decision. Grounded, no legible figures.",
    visualIntent:
      "Represent deposit switch / maturity / early-withdrawal-loss as physical objects. Medium shot, " +
      "calm neutral tone with amber accent on the passbook."
  },
  {
    sceneId: "scene_5",
    order: 5,
    sceneRole: "point_3_loan",
    blueprintPhase: "15.0~20.0s Point 3",
    voiceLine: "셋째, 대출자는 월 납입액을 다시 계산해야 합니다.",
    screenText: "대출: 월 납입액",
    subject:
      "A person's hands using a simple calculator beside a monthly household budget notebook and a " +
      "few fixed-cost receipts (rent, insurance). The gesture of 're-calculating the monthly payment'. " +
      "Warm desk light, focused on hands and objects.",
    visualIntent:
      "Checklist-card surface for loan / monthly payment / fixed costs. Medium shot, budgeting mood, " +
      "no legible numbers on the calculator or notebook."
  },
  {
    sceneId: "scene_6",
    order: 6,
    sceneRole: "twist_action",
    blueprintPhase: "20.0~30.0s Twist + Action",
    voiceLine: "뉴스는 금리를 말하지만, 내 지갑은 현금흐름이 결정합니다. 오늘은 금리보다 고정비부터 확인하세요.",
    screenText: "내 지갑은 현금흐름 / 오늘 할 일: 고정비 확인",
    subject:
      "A calm resolved still: a household hand placing a single receipt or a fixed-cost list onto a " +
      "tidy table, coffee finished, phone now set aside. The clue-board tension resolves into a simple " +
      "'check your fixed costs today' gesture. Warm, decisive, quietly optimistic.",
    visualIntent:
      "Support a single-sentence big twist card then a final action card. Central calm composition with " +
      "room for a card, one amber accent on the receipt/list."
  }
];

function buildFinalPrompt(scene) {
  return (
    `[${scene.sceneId} — ${scene.sceneRole} | ${scene.blueprintPhase}] ` +
    `${STYLE_ANCHOR} Scene subject: ${scene.subject} Visual intent: ${scene.visualIntent} ` +
    `This still is a card-image hybrid BACKGROUND: it will be dimmed/blurred/cropped behind an ` +
    `information card, so keep composition simple, keep central and lower areas calm, and do NOT ` +
    `render any on-image text — the screen text "${scene.screenText}" is added later as a deterministic overlay card.`
  );
}

const prompts = SCENES.map((s) => ({
  sceneId: s.sceneId,
  order: s.order,
  sceneRole: s.sceneRole,
  blueprintPhase: s.blueprintPhase,
  mappedVoiceLine: s.voiceLine,
  mappedScreenText: s.screenText,
  styleAnchorApplied: true,
  finalPrompt: buildFinalPrompt(s),
  negativePromptRules: NEGATIVE_PROMPT_RULES,
  overlayPolicy: {
    onImageTextForbidden: true,
    screenTextIsDeterministicOverlay: true,
    imageIsHybridBackground: true
  },
  imageQualityExpectations: {
    minWidthPx: 1080,
    minHeightPx: 1920,
    orientation: "vertical_9_16",
    subjectRelevanceRequired: true,
    genericStockFeelForbidden: true
  }
}));

const output = {
  schemaVersion: "money_shorts_visual_director_prompts_v1",
  status: "data_only_prompts_not_generated",
  title: "Money Shorts OS — Visual Director Prompts v1 (rate freeze / 금리 동결)",
  purpose:
    "금리 동결 Golden Sample용 6개 이미지 프롬프트. premium editorial financial explainer, cinematic, " +
    "realistic, high detail, vertical 9:16. 이미지 안 텍스트/워터마크/왜곡된 손/일반 사무직 미소/가짜 차트/" +
    "저품질 stock 금지. 실제 이미지 생성은 image_generation_contract의 live ChatGPT path로만 수행하며 " +
    "이 스크립트에서는 수행하지 않는다.",
  topic: { topicId: "base-rate-hold-202605", label: "금리 동결" },
  styleAnchor: STYLE_ANCHOR,
  globalNegativePromptRules: NEGATIVE_PROMPT_RULES,
  sourceRefs: {
    imageGenerationContract: "scripts/fixtures/image_generation_contract.json",
    goldenSampleBlueprint: "scripts/fixtures/golden_sample_blueprint.rate_freeze.v1.json",
    existingFinalPrompts: "scripts/fixtures/premium-editorial-prompt-compiler-final-prompts.v1.json"
  },
  generationBoundaries: {
    imageGenerationExecuted: false,
    networkExecuted: false,
    chatgptPlaywrightRun: false,
    renderExecuted: false,
    dataOnly: true
  },
  prompts,
  audit: {
    promptCount: prompts.length,
    everyPromptHasStyleAnchor: prompts.every((p) => p.styleAnchorApplied),
    everyPromptForbidsOnImageText: prompts.every((p) => p.overlayPolicy.onImageTextForbidden),
    everyPromptVertical916: prompts.every((p) => p.imageQualityExpectations.orientation === "vertical_9_16")
  }
};

writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");

console.log("── VISUAL DIRECTOR PROMPT v1 (data-only) ──");
console.log(`  topic: 금리 동결 (base-rate-hold-202605)`);
console.log(`  prompts: ${prompts.length}`);
for (const p of prompts) {
  console.log(`  [${p.sceneId}] ${p.sceneRole} — screenText="${p.mappedScreenText}" chars=${p.finalPrompt.length}`);
}
console.log(`  output: ${OUTPUT_PATH}`);
process.exit(0);
