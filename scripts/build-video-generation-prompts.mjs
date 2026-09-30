#!/usr/bin/env node
/**
 * 영상 생성 프롬프트 문서 생성기 (2026-09-30 품질 개선 — 모든 캐릭터 공통).
 *
 * 편마다 임시 스크립트로 만들던 _ai/{char}-ep{N}-video-generation-prompts.md를 조립 스펙 + TTS 실측에서
 * 바로 만든다. 형식은 _ai/bull-ep4-video-generation-prompts.md 계열(CAMERA/PROP LOCK, TEXT PRESERVATION 등)을
 * 그대로 따르되, 입 움직임 규칙을 바꿨다:
 *
 *   이전: "클립 전체 동안, 마지막 몇 초까지 쉬지 않고 입을 움직여라" → 대사가 끝나도 계속 말하는 영상
 *         (10편 실측: 장면마다 0.6~1.2초, 합계 14.1초 = 본편의 12%가 목소리 없이 입만 움직임).
 *   이후: SPEECH TIMING — TTS 실측으로 씬별 발화 끝 시각을 넣어 "0~X초만 말하고, X초 이후엔 입을 다물고
 *         미소·끄덕임"을 지시한다. 눈 깜빡임·호흡 같은 몸 움직임은 클립 끝까지 유지(정지 화면 방지).
 *
 * 파일럿(--pilot-dialogue 2,8,12): 지정 씬에 한해 "실제 한국어 대사를 Veo에 넣는" B안 프롬프트를 추가로 만든다.
 * Veo가 그 음절에 맞춰 입을 움직이면, 오디오를 TTS로 덮어도 리듬이 맞을 가능성이 있다(검증 필요).
 *
 * 스펙 필드(씬별): imageBrief(카드·보드 글자는 '작은따옴표'로), shot, bg, motion{type, action, mood}
 *   type: card2(두 손 카드) | card1(한 손 카드) | board(바닥 거치 보드) | open(소품 없음)
 * 스펙 필드(편): imageCharacter, imagePrefix, sceneBackgrounds{구역: {videoStyle, videoStatics}}
 *
 * 사용:
 *   node scripts/build-video-generation-prompts.mjs --spec-module ./_bull-ep11-assembly-spec.mjs \
 *     --spec-export BULL_EP11_ASSEMBLY_SPEC --tts-summary <…/elevenlabs-scene-paced-tts-summary.json> \
 *     --out _ai/bull-ep11-video-generation-prompts.md [--pilot-dialogue 2,8,12]
 */

import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
function getArg(name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
}
const SPEC_MODULE = getArg("--spec-module");
const SPEC_EXPORT = getArg("--spec-export");
const TTS_SUMMARY = getArg("--tts-summary");
const OUT = getArg("--out");
const PILOT = (getArg("--pilot-dialogue") ?? "").split(",").map((s) => Number.parseInt(s.trim(), 10)).filter(Number.isInteger);
if (!SPEC_MODULE || !SPEC_EXPORT || !TTS_SUMMARY || !OUT) {
  console.error("ABORT: --spec-module --spec-export --tts-summary --out 가 필요합니다.");
  process.exit(2);
}

const spec = (await import(new URL(SPEC_MODULE, import.meta.url).href))[SPEC_EXPORT];
if (!spec?.scenes) {
  console.error(`ABORT: ${SPEC_MODULE}에서 ${SPEC_EXPORT}.scenes를 찾지 못했습니다.`);
  process.exit(2);
}
const summary = JSON.parse(fs.readFileSync(TTS_SUMMARY, "utf8"));
const timingByScene = Object.fromEntries(
  summary.scenes.map((s) => [
    s.sceneNumber,
    {
      raw: s.rawAudioDurationSec,
      speechStart: Math.max(0, s.spokenStartSec - s.startSec),
      speechEnd: s.spokenEndSec - s.startSec,
      used: s.endSec - s.startSec,
    },
  ]),
);

const CHARACTER_NOUN = {
  bull3dv1: "gold bull mascot character",
  owl3dv5: "owl mascot character",
  coin3dv1: "gold coin mascot character",
}[spec.imageCharacter] ?? "mascot character";

const problems = [];
const scenes = spec.scenes.map((scene) => {
  const t = timingByScene[scene.scene];
  if (!t) problems.push(`씬 ${scene.scene}: TTS 요약에 없음`);
  const motion = scene.motion ?? {};
  const type = motion.type ?? (/바닥|이젤/.test(scene.imageBrief) ? "board" : /두 손/.test(scene.imageBrief) ? "card2" : /한 손/.test(scene.imageBrief) ? "card1" : "open");
  const lines = [...String(scene.imageBrief).matchAll(/'([^']+)'/g)].map((m) => m[1]);
  if (type !== "open" && lines.length === 0) problems.push(`씬 ${scene.scene}: imageBrief에 '작은따옴표' 글자가 없음`);
  const bg = spec.sceneBackgrounds?.[scene.bg];
  if (!bg?.videoStyle || !bg?.videoStatics) problems.push(`씬 ${scene.scene}: sceneBackgrounds["${scene.bg}"].videoStyle/videoStatics 없음`);
  if (!motion.action || !motion.mood) problems.push(`씬 ${scene.scene}: motion.action/mood 없음`);
  // 티어: 8초/10초만. 두 손 카드는 8초 끝에서 카드가 사라지는 사고로 항상 10초.
  const raw = t?.raw ?? 0;
  const tier = type === "card2" ? 10 : raw < 8 && 8 - raw >= 1 ? 8 : 10;
  return { scene, t, type, lines, bg, motion, tier };
});
if (problems.length > 0) {
  console.error(`ABORT: 스펙/요약 누락 ${problems.length}건\n  ${problems.join("\n  ")}`);
  process.exit(1);
}

const fmt = (sec) => (Math.round(sec * 10) / 10).toFixed(1);
const ORD = ["first", "second", "third", "fourth"];

function block(item, { dialogue = false } = {}) {
  const { scene, t, type, lines, bg, motion, tier: T } = item;
  const s0 = fmt(t.speechStart);
  const s1 = fmt(t.speechEnd + 0.1);
  const list = lines.map((l, i) => `"${l}" on the ${ORD[i] ?? `${i + 1}th`} line`).join(", ");
  const quoted = lines.map((l) => `"${l}"`).join(", ");
  let s = `Animate this image into ${T === 8 ? "an 8-second" : "a 10-second"} video clip. STYLE CONSISTENCY: keep the
${CHARACTER_NOUN}'s design and the ${bg.videoStyle}
background exactly as shown in the reference image. Do not change any
colors, text, or object positions.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE ${T} seconds — absolutely no zoom in, no zoom out, no dolly,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.
`;
  if (type === "card2" || type === "card1") {
    s += `
PROP LOCK (HIGHEST PRIORITY): the character holds a card with ${lines.length} lines of
large text — ${list} — in ${type === "card2" ? "both hands" : "one hand"} at chest height. The card
holds steadily at this position for the entire clip, from frame 1 to the
very last frame, and does not move, tilt, rotate, or drift at any point.
Treat the card as a frozen photograph layered in front of the character.

MOTION DETAIL: ${motion.action}${type === "card1" ? " The hand holding the card does not move." : ""}
`;
  } else if (type === "board") {
    s += `
PROP LOCK (HIGHEST PRIORITY): a free-standing floor easel board with ${lines.length} lines of
large text — ${list} — stands beside the character on the floor.
The board holds steadily in its exact position on the floor for the entire
clip, from frame 1 to the very last frame — it never falls over, slides,
tilts, rotates, or drifts at any point, including the final 1-2 seconds.
Treat the board as a frozen photograph layered beside the character.

MOTION DETAIL: ${motion.action} The character does not touch or move the board.
`;
  } else {
    s += `
MOTION DETAIL: ${motion.action} No props held.
`;
  }
  s += `
SPEECH TIMING (HIGHEST PRIORITY): the character talks ONLY from ${s0}s to ${s1}s.
During that time the mouth actively opens and closes in a natural speech
rhythm — never closed-mouth talking. At ${s1}s the character finishes the
sentence. From ${s1}s until the end of the clip (${T}s) the mouth stays gently
closed in a soft, natural smile — no talking and no lip movement at all after
${s1}s — while the eyes keep blinking and the head gives a small nod, as if
waiting for the viewer's reaction.
`;
  if (dialogue) {
    s += `
DIALOGUE (lip-sync reference): from ${s0}s to ${s1}s the character says, in Korean,
in a friendly, clear male voice: "${scene.narration}"
The lips follow the syllables of this line. After ${s1}s there is no speech.
`;
  }
  s += `
CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the character stays
visibly alive for the ENTIRE ${T} seconds, including the last 2-3 seconds —
natural eye blinks every 2-3 seconds, subtle breathing and body bounce,
gentle head movement. Only the mouth follows the SPEECH TIMING above. ${
    type === "card2" || type === "card1"
      ? "The hand(s) holding the card stay steady and in place for the full clip."
      : type === "board"
        ? "The board stays completely still."
        : "No portion of the clip should hold a single frozen pose for more than half a second."
  }

STATIC ELEMENTS: ${bg.videoStatics}
must stay completely fixed — no camera pan or zoom, no background object
movement${type === "board" ? ", no board movement, no board falling or sliding" : type !== "open" ? ", no card movement" : ""}.
`;
  if (type !== "open") {
    s += `
CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the ${type === "board" ? "board" : "card"} text (${quoted}) as locked, non-regenerating image layers for the full
${T} seconds, including the very last frame. Render them exactly as pixels
copied from the reference image, unchanged frame to frame, still fully
visible and ${type === "board" ? "standing" : "held"} at the end.
`;
  }
  s += `
NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or
malformed fingers, no warped, blurred, flickering, or misspelled text
anywhere in the frame, no regenerated or reinterpreted signage, no
background changes, no character redesign, no abrupt cut or freeze
mid-motion, no talking or lip movement after ${s1}s, ${
    type === "board"
      ? "NO BOARD FALLING OVER OR SLIDING AT ANY POINT INCLUDING THE LAST SECOND, no board tilt or rotation at any point, "
      : type === "open"
        ? ""
        : "no card tilt or rotation at any point, "
  }no camera zoom, crop, or framing drift at any point.

MOOD: ${motion.mood}.
`;
  return s;
}

const prefix = spec.imagePrefix;
const label = `${spec.characterDisplayName} ${spec.episode}편`;
const rows = scenes
  .map(({ scene, t, tier, type }) =>
    `| s${scene.scene} ${scene.key.replace(/^s\d+_/, "")} | \`${prefix}_s${scene.scene}.png\` | \`${scene.video}\` | ${t.raw.toFixed(2)}초 | **${fmt(t.speechEnd + 0.1)}초** | **${tier}초** | ${(tier - t.raw).toFixed(2)}초 | ${scene.shot ?? "-"} / ${scene.bg ?? "-"} | ${type} |`)
  .join("\n");
const t8 = scenes.filter((s) => s.tier === 8);
const t10 = scenes.filter((s) => s.tier === 10);

let doc = `# ${label} (${spec.title}, ${scenes.length}씬) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: \`C:/tmp/${prefix.replace(/_/g, "-")}-images/\`
영상 저장: **장면 번호로** \`C:/Users/PC/Downloads/1.mp4\` ~ \`${scenes.length}.mp4\` (CURRENT_STANDARDS §A-6, "${label}"이라고 알려주기)

생성기: \`scripts/build-video-generation-prompts.mjs\` (TTS: \`${TTS_SUMMARY.replace(/\\/g, "/")}\`, 타임라인 ${summary.timelineDurationSec}초)

**★ 2026-09-30 변경 — 입 멈춤 시각(SPEECH TIMING):** 씬마다 "몇 초까지만 말하고 그 뒤엔 입을 다문다"를 넣었다
(표의 '입 멈춤'). 받은 영상에서 입이 그 시각 뒤에도 계속 움직이면 검수에서 표시한다. 눈 깜빡임·호흡은 끝까지 유지.

티어는 8초/10초 두 가지뿐. 발화 8초 미만·여유 1초 이상이면 8초, 그 외 10초, 두 손 카드 씬은 항상 10초.
Gemini(Veo)로 배정하는 씬은 발화와 무관하게 항상 10초(입 멈춤 시각은 그대로).

| 씬 | 이미지 | 저장할 영상 파일명 | 발화(raw) | 입 멈춤 | 티어 | 여유 | 샷 / 배경 | 형태 |
|---|---|---|---|---|---|---|---|---|
${rows}

★ 영상 생성 절대규칙(\`_ai/CURRENT_STANDARDS.md\` §0-1): 소품 든 손은 고정·동작은 빈 손에만, 소품은 frozen photograph,
텍스트는 CRITICAL TEXT PRESERVATION, 나레이션 영상이라 "Silent" 금지, "glued" 같은 신체 접착 표현 금지, 바닥 보드 "넘어지지 않음" 이중 명시.

**씬을 몰아서 생성하지 말고 하나씩 즉시 검수** — 시작·중반·끝 프레임의 텍스트·소품·입 멈춤을 확인한다.

`;
if (t8.length) {
  doc += `================================================================================\n# 🟦 8초 티어 (${t8.map((s) => "s" + s.scene.scene).join(", ")})\n================================================================================\n\n`;
  for (const item of t8) doc += `## s${item.scene.scene} — ${item.scene.role} (8초, ${item.type}, 입 멈춤 ${fmt(item.t.speechEnd + 0.1)}초)\n\n\`\`\`\n${block(item)}\`\`\`\n\n---\n\n`;
}
if (t10.length) {
  doc += `================================================================================\n# 🟨 10초 티어 (${t10.map((s) => "s" + s.scene.scene).join(", ")})\n================================================================================\n\n`;
  for (const item of t10) doc += `## s${item.scene.scene} — ${item.scene.role} (10초, ${item.type}, 입 멈춤 ${fmt(item.t.speechEnd + 0.1)}초)\n\n\`\`\`\n${block(item)}\`\`\`\n\n---\n\n`;
}
const pilotItems = scenes.filter((s) => PILOT.includes(s.scene.scene));
if (pilotItems.length) {
  doc += `================================================================================
# 🧪 싱크 파일럿 B안 — 실제 대사를 넣은 프롬프트 (${pilotItems.map((s) => "s" + s.scene.scene).join(", ")})
================================================================================

같은 씬을 위 A안(입 멈춤 시각만)과 아래 B안(한국어 대사까지 입력)으로 **둘 다** 만들어 비교한다.
B안 영상은 \`{씬번호}b.mp4\`(예: \`${pilotItems[0].scene.scene}b.mp4\`)로 저장. 조립 때 오디오는 어느 쪽이든 TTS로 덮는다.
비교 기준: 입 모양이 대사 음절과 맞는지, 입 멈춤 시각을 지키는지, 글자·소품이 흔들리지 않는지.

`;
  for (const item of pilotItems) doc += `## s${item.scene.scene} — B안 (${item.tier}초)\n\n\`\`\`\n${block(item, { dialogue: true })}\`\`\`\n\n---\n\n`;
}
doc += `## 완료 후 절차
1. \`C:/Users/PC/Downloads/1.mp4\`~\`${scenes.length}.mp4\`(파일럿은 \`{n}b.mp4\`)로 저장하고 "${label} 영상 검수해줘"라고 알려주기
2. 검수: 길이·시작/중반/끝 프레임·글자 보존·카메라 + \`scripts/check-clip-speech-timing-once.mjs\`로 입 멈춤 시각 측정
3. 재생성이 필요한 씬은 같은 프롬프트로 다시 뽑는다(프롬프트 강화로 해결 시도 금지)
`;

fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
fs.writeFileSync(OUT, doc, "utf8");
console.log(`written ${OUT} (${doc.length}자, 8초 ${t8.length}개 / 10초 ${t10.length}개${pilotItems.length ? `, 파일럿 B안 ${pilotItems.length}개` : ""})`);
