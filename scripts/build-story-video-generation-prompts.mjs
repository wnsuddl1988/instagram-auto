#!/usr/bin/env node
/**
 * 스토리형 영상 생성 프롬프트 문서 생성기 (2026-10-07, 스토리형 B 방식 — 재연 장면).
 *
 * 설명형용 `build-video-generation-prompts.mjs`는 "말하는 캐릭터의 입 멈춤 시각"이 중심이라 말하는 인물이 없는 재연 장면에는 맞지 않는다.
 * 이 생성기는 같은 문서 형식(표 + 8초끼리·10초끼리 묶음 + 영어 블록)을 쓰되:
 *   - 재연 장면(motion.type "scene"): 말·목소리·입 움직임 전부 금지, 카메라 고정, 인물·사물 동작만, 끝까지 살아 있는 움직임.
 *   - 말하는 장면(scene.speaks = true, 부엉박사 18번): 발화 구간(TTS 실측)만 입을 움직이고 그 뒤엔 입을 닫는다(설명형 SPEECH TIMING과 같은 규칙).
 *   - 장면에 글자가 있으면(imageBrief의 '작은따옴표' 글자) CRITICAL TEXT PRESERVATION을 넣는다(11번 달력).
 * 티어: 사용 길이(장면 시작~끝)가 7초 이하면 8초, 넘으면 10초. (Gemini Veo로 배정하는 장면은 항상 10초 — CURRENT_STANDARDS.)
 *
 * 사용:
 *   node scripts/build-story-video-generation-prompts.mjs --spec-module ./_story-ep1-assembly-spec.mjs \
 *     --spec-exports STORY_EP1_ASSEMBLY_SPEC,STORY_EP1_END_SPEC --tts-summary <…tempo….json> --out _ai/story-ep1-video-generation-prompts.md \
 *     [--images-dir C:/tmp/story-ep1-images]
 */

import fs from "node:fs";

const argv = process.argv.slice(2);
const getArg = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
};
const SPEC_MODULE = getArg("--spec-module");
const SPEC_EXPORTS = (getArg("--spec-exports") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const TTS_SUMMARY = getArg("--tts-summary");
const OUT = getArg("--out");
const IMAGES_DIR = (getArg("--images-dir") ?? "").replace(/\\/g, "/").replace(/\/?$/, "/");
if (!SPEC_MODULE || !SPEC_EXPORTS.length || !TTS_SUMMARY || !OUT) {
  console.error("ABORT: --spec-module --spec-exports(쉼표) --tts-summary --out 가 필요합니다.");
  process.exit(2);
}

const mod = await import(new URL(SPEC_MODULE, import.meta.url).href);
const specs = SPEC_EXPORTS.map((name) => {
  const spec = mod[name];
  if (!spec?.scenes) {
    console.error(`ABORT: ${SPEC_MODULE}에서 ${name}.scenes를 찾지 못했습니다.`);
    process.exit(2);
  }
  return spec;
});
const main = specs[0];
const summary = JSON.parse(fs.readFileSync(TTS_SUMMARY, "utf8"));
const timingByScene = Object.fromEntries(
  summary.scenes.map((s) => [
    s.sceneNumber,
    { start: s.startSec, used: s.endSec - s.startSec, speechStart: Math.max(0, s.spokenStartSec - s.startSec), speechEnd: s.spokenEndSec - s.startSec },
  ]),
);

const problems = [];
const items = specs
  .flatMap((spec) => spec.scenes.map((scene) => ({ spec, scene })))
  .sort((a, b) => a.scene.scene - b.scene.scene)
  .map(({ spec, scene }) => {
    const t = timingByScene[scene.scene];
    if (!t) problems.push(`장면 ${scene.scene}: TTS 요약에 없음`);
    const bg = spec.sceneBackgrounds?.[scene.bg];
    if (!bg?.videoStyle || !bg?.videoStatics) problems.push(`장면 ${scene.scene}: sceneBackgrounds["${scene.bg}"].videoStyle/videoStatics 없음`);
    if (!scene.motion?.action || !scene.motion?.mood) problems.push(`장면 ${scene.scene}: motion.action/mood 없음`);
    const lines = [...String(scene.imageBrief).matchAll(/'([^']+)'/g)].map((m) => m[1]);
    const speaks = scene.speaks === true;
    const tier = (t?.used ?? 0) <= 7 ? 8 : 10;
    return { spec, scene, t, bg, lines, speaks, tier, owl: spec.imageCharacter === "owl3dv5", semi: spec.imageCharacter === "storysemi" };
  });
const have = new Set(items.map((i) => i.scene.scene));
for (let n = 1; n <= summary.scenes.length; n += 1) if (!have.has(n)) problems.push(`장면 ${n}: 스펙에 없음`);
if (problems.length) {
  console.error(`ABORT: 스펙/요약 누락 ${problems.length}건\n  ${problems.join("\n  ")}`);
  process.exit(1);
}

const fmt = (sec) => (Math.round(sec * 10) / 10).toFixed(1);

function block(item) {
  const { scene, t, bg, lines, speaks, tier: T, owl, semi } = item;
  const subject = owl ? "owl character's design" : semi ? "people, objects and realistic cinematic 3D CG look (natural proportions, smooth CG textures, soft cinematic lighting)" : "people, objects and Pixar-style 3D look";
  const quoted = lines.map((l) => `"${l}"`).join(", ");
  let s = `Animate this image into ${T === 8 ? "an 8-second" : "a 10-second"} video clip. STYLE CONSISTENCY: keep the
${subject} and the ${bg.videoStyle}
setting exactly as shown in the reference image. Do not change any colors, shapes, text,
or object positions except for the motion described below.

CAMERA LOCK (HIGHEST PRIORITY): the camera is completely static and locked
for the ENTIRE ${T} seconds — absolutely no zoom in, no zoom out, no dolly, no pan,
no framing drift, not even a slow or subtle one, including the final 1-2
seconds. The framing at frame 1 and the framing at the very last frame must
be pixel-for-pixel identical in scale and crop.

MOTION DETAIL: ${scene.motion.action}${owl ? " No props held." : ""}
`;
  if (speaks) {
    const s0 = fmt(t.speechStart);
    const s1 = fmt(t.speechEnd + 0.1);
    s += `
SPEECH TIMING (HIGHEST PRIORITY — this overrides every other instruction about the mouth and the voice):
PHASE 1, from ${s0}s to ${s1}s: the character speaks. The mouth actively opens and
closes in a natural speech rhythm — never closed-mouth talking.
PHASE 2, from ${s1}s to the very last frame (${fmt(T - Number(s1))} seconds): the character is LISTENING, not speaking.
The lips are fully closed and gently pressed together in a soft closed-mouth smile,
and the jaw does not move at all. NO speech, NO syllables, NO mumbling, NO humming,
NO vocal sounds, NO lip movement and NO mouth shapes of any kind. The audio track
after ${s1}s contains only faint room ambience — no voice at all. The eyes keep
blinking and the head gives slow, small nods, as if waiting for the viewer's reaction.
Even if the character seems to be in the middle of a word at ${s1}s, finish that word
and close the mouth immediately. Hold PHASE 2 until the very last frame.
`;
  } else {
    s += `
NO SPEECH (HIGHEST PRIORITY): nobody in this clip speaks. Every mouth stays closed or
in a natural unspoken expression — no talking, no mouthing words, no singing, no humming, no
lip movement of any kind. The audio track carries only faint natural ambience for the
setting — no voice, no music.
`;
  }
  s += `
CONTINUOUS MOTION FOR THE FULL CLIP (HIGHEST PRIORITY): the scene stays visibly alive for the ENTIRE ${T}
seconds, including the last 2-3 seconds — the described motion keeps going or settles
gently, with natural blinking, breathing, drifting light or dust where relevant. No portion
of the clip should hold a single frozen pose for more than half a second.

STATIC ELEMENTS: ${bg.videoStatics}
must stay completely fixed — no camera pan or zoom, no background object movement,
no props appearing, disappearing, or changing shape.
${scene.lock ? `\nSCENE LOCK (HIGHEST PRIORITY): ${scene.lock}\n` : ""}`;
  if (lines.length) {
    s += `
CRITICAL TEXT PRESERVATION (HIGHEST PRIORITY): treat the text (${quoted}) as locked, non-regenerating image layers for the full
${T} seconds, including the very last frame. Render it exactly as pixels copied from the
reference image, unchanged frame to frame. The text must be exactly as dark, sharp and fully
readable in the LAST frame as in the FIRST frame. NO fade-out, NO dissolve, NO cross-fade,
NO washing-out, NO blurring and NO disappearing at any moment — especially in the final 2 seconds.
`;
  }
  s += `
NEGATIVE PROMPT: no face distortion, no proportion drift, no extra or malformed fingers or hands,
no warped, blurred, flickering, or invented text anywhere in the frame (no new signs, labels, numbers or
logos appearing), no regenerated or reinterpreted signage, no background changes, no character or
person redesign, no abrupt cut or freeze mid-motion, no new people entering or leaving unless described${
    speaks ? `, no talking, voice or lip movement after ${fmt(t.speechEnd + 0.1)}s` : ", no talking or lip movement"
  }, no camera zoom, crop, or framing drift at any point.

MOOD: ${scene.motion.mood}.
`;
  return s;
}

const rows = items
  .map(({ scene, t, tier, speaks }) =>
    `| s${scene.scene} ${scene.key.replace(/^s\d+_/, "")} | \`${main.imagePrefix}_s${scene.scene}.png\` | \`${scene.video}\` | ${t.used.toFixed(2)}초 | **${tier}초** | ${scene.shot} / ${scene.bg} | ${speaks ? "말함(부엉박사)" : "재연(말 없음)"} |`)
  .join("\n");
const speakNums = items.filter((i) => i.speaks).map((i) => i.scene.scene).join(", ");
const textNums = items.filter((i) => i.lines.length).map((i) => i.scene.scene).join(", ");
const t8 = items.filter((i) => i.tier === 8);
const t10 = items.filter((i) => i.tier === 10);

let doc = `# 스토리형 ${main.episode}편 (${main.title}, ${items.length}장면) 영상 생성 프롬프트 — 수동 진행용

이미지 소스 폴더: \`${IMAGES_DIR || `C:/tmp/${main.imagePrefix.replace(/_/g, "-")}-images/`}\`
영상 저장: **장면 번호로** \`C:/Users/PC/Downloads/1.mp4\` ~ \`${items.length}.mp4\` (스토리형 ${main.episode}편이라고 알려주기)

생성기: \`scripts/build-story-video-generation-prompts.mjs\` (TTS: \`${TTS_SUMMARY.replace(/\\/g, "/")}\`, 최종 타임라인 ${summary.timelineDurationSec}초 — 편마다 확정한 템포 기준)

**스토리형 재연 장면 규칙:** ${speakNums ? `${speakNums}번 외에는` : "모든 장면에"} 말하는 인물이 없다(말·입 움직임 전부 금지, 카메라 고정, 인물·사물 동작만). 사용 길이가 7초 이하면 8초 클립, 넘으면 10초 클립(조립 때 장면 길이에 맞춰 자른다). Gemini(Veo)로 배정하는 장면은 길이와 무관하게 항상 10초.
${textNums ? `**${textNums}번**만 이미지에 글자가 있어 TEXT PRESERVATION이 들어 있다 — 끝 프레임까지 글자 선명한지 검수. 나머지는 글자가 없어야 하며` : "**이 편은 모든 장면에서 화면에 글자·숫자·로고가 없어야 한다**"}, **영상에 새 간판·숫자·로고가 생기면 반려**.
**얼굴 안전 구간(Owner 2026-10-07):** 영상 위 제목이 세로 18~37%에 계속 떠 있으므로, 영상 생성 결과에서도 인물 얼굴이 위쪽(세로 40% 위)으로 올라오거나 카메라가 움직여 얼굴이 위로 이동하면 반려한다(이미지 구도 그대로 유지).

| 장면 | 이미지 | 저장할 영상 파일명 | 사용 길이 | 티어 | 샷 / 배경 | 형태 |
|---|---|---|---|---|---|---|
${rows}

★ 영상 생성 절대규칙(\`_ai/CURRENT_STANDARDS.md\` §0-1): 나레이션 영상이라 "Silent" 단어 금지, "glued" 같은 신체 접착 표현 금지. **장면을 몰아서 생성하지 말고 하나씩 즉시 검수** — 시작·중반·끝 프레임의 인물·소품·글자를 확인한다.

`;
if (t8.length) {
  doc += `================================================================================\n# 🟦 8초 티어 (${t8.map((i) => "s" + i.scene.scene).join(", ")})\n================================================================================\n\n`;
  for (const item of t8) doc += `## s${item.scene.scene} — ${item.scene.role} (8초, ${item.speaks ? "말함" : "재연"}, 사용 ${item.t.used.toFixed(1)}초)\n\n\`\`\`\n${block(item)}\`\`\`\n\n---\n\n`;
}
if (t10.length) {
  doc += `================================================================================\n# 🟨 10초 티어 (${t10.map((i) => "s" + i.scene.scene).join(", ")})\n================================================================================\n\n`;
  for (const item of t10) doc += `## s${item.scene.scene} — ${item.scene.role} (10초, ${item.speaks ? "말함" : "재연"}, 사용 ${item.t.used.toFixed(1)}초)\n\n\`\`\`\n${block(item)}\`\`\`\n\n---\n\n`;
}
fs.writeFileSync(OUT, doc);
console.log(`OK ${items.length}장면 → ${OUT} (8초 ${t8.length}개 · 10초 ${t10.length}개)`);
