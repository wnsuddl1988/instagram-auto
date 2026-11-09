// 스토리형 11~15편 재연 장면 스펙(.mjs) 생성기: node C:/tmp/story-spec-gen.mjs <data.mjs>
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const d = (await import(pathToFileURL(path.resolve(process.argv[2])).href)).default;
const scenesText = JSON.parse(fs.readFileSync(`${d.dir}/${d.scenesFile}`, "utf8"));
if (scenesText.length !== d.scenes.length) throw new Error(`scenes ${scenesText.length} ≠ data ${d.scenes.length}`);
const N = d.n;
const last = d.scenes.length;
const codes = "ABCDEFGHIJKLMNOQRSTUVWXYZ".split("");
const J = (v) => JSON.stringify(v);

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).";
const FACE_SAFE = " 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.";

const semi = d.scenes.slice(0, last - 1);
const bgBlocks = semi.map((s, i) => {
  const code = codes[i];
  return `    ${code}: { label: ${J(s.label)}, image: ${J(s.ko)}, videoStyle: ${J(s.en)}, videoStatics: ${J(s.statics)} },`;
});
const sceneBlocks = semi.map((s, i) => {
  const no = i + 1;
  const code = codes[i];
  const brief = s.ko + " " + NO_TEXT + (s.faces ? FACE_SAFE : "");
  return `    { scene: ${no}, key: ${J(`s${no}_${d.scenes[i].key}`)}, role: ${J(s.role ?? (no === 1 ? "hook" : "evidence"))}, video: ${J(`story_ep${N}_s${no}_${d.scenes[i].key}_motion.mp4`)},
      narration: ${J(scenesText[i])},
      imageBrief: ${J(brief)},
      shot: ${J(s.shot)}, bg: ${J(code)},
      lock: ${J(s.lock)},
      motion: motion(${J(s.action)}, ${J(s.mood)}) },`;
});
const e = d.scenes[last - 1];
const out = `/**
 * 스토리형 ${N}편 — ${d.title} 재연 장면 스펙 (2026-10-11, 기본 베이스 구조).
 *
 * 기준: \`_ai/story-script-rules.md\` + 확정 대본 \`${d.dir}/${d.scenesFile}\`. 설계 \`${d.dir}/story-design.json\`.
 * TTS \`C:/tmp/money-shorts-os/story-ep${N}-tts/output-v1/tempo-1.2-gap0.25-pre/…tempo1.2-gap0.25-pre.json\`.
 * 화풍: 반사실 3D(storysemi). 1~${last - 1}번 재연 장면 + ${last}번 부엉박사 진행자 컷.
 * 이미지 규칙(스토리형): 화면에 글자·숫자·로고·브랜드·회사 이름을 넣지 않는다(숫자는 자막이 맡는다). 실존 인물을 닮게 그리지 않는다
 * (얼굴이 크게 보이는 구도 금지, 뒷모습·멀리 있는 작은 모습·손과 소품). 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지.
 * 저작권 캐릭터·로고(미키·디즈니 성·마리오 등)는 그리지 않는다.
 *
 * 이미지 생성: ① 1~${last - 1}번 \`ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep${N}-assembly-spec.mjs --scene-spec-export STORY_EP${N}_SEMI_SPEC --out-dir C:/tmp/story-ep${N}-images\`
 *            ② ${last}번(부엉박사) \`… --character owl3dv5 --scene-spec ./_story-ep${N}-assembly-spec.mjs --scene-spec-export STORY_EP${N}_END_SPEC --out-dir C:/tmp/story-ep${N}-images\`
 */

const NO_TEXT = ${J(NO_TEXT)};
const motion = (action, mood) => ({ type: "scene", action, mood });

export const STORY_EP${N}_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: ${N},
  displayEpisode: ${N},
  sourceCandidate: ${J(d.slug)},
  title: ${J(d.title)},
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: ${J(`story_ep${N}`)},
  storyStyleOnlyIdentity:
    ${J(`${d.setting} 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, 피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. 장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.`)},
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. 장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
${bgBlocks.join("\n")}
  }),

  scenes: Object.freeze([
${sceneBlocks.join("\n")}
  ]),
});

// ── ${last}번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성 ──
export const STORY_EP${N}_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: ${N},
  imageCharacter: "owl3dv5",
  imagePrefix: ${J(`story_ep${N}`)},
  sceneBackgrounds: Object.freeze({
    P: { label: ${J(e.label)}, image: ${J(e.ko)}, videoStyle: ${J(e.en)}, videoStatics: ${J(e.statics)} },
  }),
  scenes: Object.freeze([
    {
      scene: ${last}, key: ${J(`s${last}_${d.scenes[last - 1].key}`)}, role: "save", video: ${J(`story_ep${N}_s${last}_${d.scenes[last - 1].key}_motion.mp4`)},
      narration: ${J(scenesText[last - 1])},
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 건물·하늘·조명 같은 배경만 보이게 해.",
      shot: "medium", bg: "P",
      lock: ${J(e.lock)},
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 조립 스펙(run-owl-assemble-shorts-v2.mjs) — 제목은 ★임시안(Owner 확정 필요) ──
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep${N}-assembly-spec.mjs --spec-export STORY_EP${N}_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep${N}-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep${N}-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep${N}-tts/story-ep${N}-tts-script.json --out-dir C:/tmp/story-ep${N}-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP${N}_FULL_SPEC = Object.freeze({
  ...STORY_EP${N}_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP${N}_SEMI_SPEC.sceneBackgrounds, ...STORY_EP${N}_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP${N}_SEMI_SPEC.scenes, ...STORY_EP${N}_END_SPEC.scenes]),
});

export const STORY_EP${N}_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP${N}_FULL_SPEC,
  headerTitle: Object.freeze(${J(d.headerTitle)}),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(${J(d.emphasisTerms)}),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+%","[0-9]+배","[0-9]+명","[0-9,.]+억","[0-9,.]+만"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP${N}_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
`;
const outPath = `C:/Users/PC/jjy/instagram-auto/scripts/_story-ep${N}-assembly-spec.mjs`;
fs.writeFileSync(outPath, out);
console.log("wrote", outPath, "scenes", d.scenes.length);
