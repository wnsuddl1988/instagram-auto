#!/usr/bin/env node
/**
 * 부엉박사 통합 52~56편(파일 ep29~33) 스펙·TTS 스크립트 생성기 (2026-10-13).
 * 입력: scripts/_owl-batch-1015-defs.mjs(연출·캡션) + _ai/owl-batch-1015/scenes-*.json(검사기 통과 대본).
 * 출력: scripts/_owl-v2-ep{N}-assembly-spec.mjs, C:/tmp/money-shorts-os/owl-ep{N}-tts/owl-ep{N}-tts-script.json
 * 사용: node scripts/build-owl-batch-1015.mjs [--only 29,30]
 */
import fs from "node:fs";
import path from "node:path";
import { OWL_BATCH_1015, OWL_BATCH_1015_COVERS } from "./_owl-batch-1015-defs.mjs";

const ROOT = process.cwd();
const argv = process.argv.slice(2);
const onlyArg = argv.indexOf("--only") >= 0 ? argv[argv.indexOf("--only") + 1] : null;
const only = onlyArg ? onlyArg.split(",").map(Number) : null;

// ── 숫자 읽기(자막 어절 수를 그대로 유지) ────────────────────────────────────────────────
const D = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
const small = (n) => {
  let s = "";
  for (const [p, w] of [[1000, "천"], [100, "백"], [10, "십"]]) {
    const d = Math.floor(n / p) % 10;
    if (d) s += (d === 1 ? "" : D[d]) + w;
  }
  return s + (n % 10 ? D[n % 10] : "");
};
const readInt = (n) => {
  if (n === 0) return "영";
  const jo = Math.floor(n / 1e12);
  const eok = Math.floor((n % 1e12) / 1e8);
  const man = Math.floor((n % 1e8) / 1e4);
  const rest = n % 1e4;
  return (jo ? small(jo) + "조" : "") + (eok ? small(eok) + "억" : "") + (man ? (man === 1 ? "" : small(man)) + "만" : "") + (rest ? small(rest) : "");
};
function readNumbers(text) {
  let t = text.replace(/\d[\d,]*(?:\.\d+)?/g, (m, offset, whole) => {
    const next = whole[offset + m.length] ?? "";
    if (m.includes(".")) {
      const [a, b] = m.replace(/,/g, "").split(".");
      return readInt(Number(a)) + "점" + [...b].map((c) => D[Number(c)] || "영").join("");
    }
    const v = Number(m.replace(/,/g, ""));
    if (m === "112") return "일일이";
    if (next === "월" && v === 6) return "유";
    if (next === "월" && v === 10) return "시";
    if (v === 1 && "천백십".includes(next) && next) return "";
    if (v === 1 && next === "만") return "";
    return readInt(v);
  });
  t = t.replace(/%/g, "퍼센트").replace(/IRP/g, "아이알피").replace(/\bIP\b/g, "아이피").replace(/\bAI\b/g, "에이아이").replace(/The/g, "더");
  return t;
}

// ── TTS 스크립트 ─────────────────────────────────────────────────────────────────────────
const roleTag = (role, key) => {
  if (role === "hook") return "curious";
  if (role === "opening" || role === "core_question") return "confident";
  if (role === "condition") return "seriously";
  if (role === "save") return "warm";
  if (role === "action") return /summary/.test(key) ? "confident" : "clearly";
  return "clearly";
};
function segmentsOf(perf, isLastScene) {
  const clauses = perf.match(/[^,.?!]+[,.?!]?/g).map((s) => s.trim()).filter(Boolean);
  const out = [];
  clauses.forEach((c, ci) => {
    const words = c.split(/\s+/);
    const parts = Math.max(1, Math.ceil(words.length / 7));
    const size = Math.ceil(words.length / parts);
    for (let p = 0; p < parts; p += 1) {
      const text = words.slice(p * size, (p + 1) * size).join(" ");
      if (!text) continue;
      const lastPartOfClause = p === parts - 1;
      const lastClause = ci === clauses.length - 1;
      let pause = 150;
      if (lastPartOfClause && /[.?!]$/.test(text)) pause = lastClause ? 420 : 300;
      else if (lastPartOfClause && lastClause) pause = 420;
      out.push({ text, pauseAfterMs: pause });
    }
  });
  return out;
}
function buildTts(def, narrations, sceneDefs) {
  return {
    ttsEngineVersion: "money_shorts_korean_director_v2",
    prosodyPolicy: "korean_native_cadence_v2",
    modelId: "eleven_v3",
    sourceSpecVersion: "owl_assembly_spec_v1",
    sourceCandidate: def.candidate,
    title: def.title,
    hookType: def.hookType,
    topicSpeechProfile: { globalV3Tag: "confident", baseSpeed: 1, baseStability: 0.44 },
    scenes: sceneDefs.map((s, i) => {
      const perf = readNumbers(narrations[i]);
      return {
        sceneNumber: i + 1,
        sceneKey: s[3],
        sceneRole: s[2],
        narration: narrations[i],
        captionDisplayText: narrations[i],
        speechDirection: {
          engineVersion: "money_shorts_speech_direction_v2",
          performanceText: perf,
          v3AudioTag: roleTag(s[2], s[3]),
          segments: segmentsOf(perf, i === sceneDefs.length - 1),
        },
      };
    }),
  };
}

// ── 스펙 ─────────────────────────────────────────────────────────────────────────────────
const CARD_COMPOSITION =
  "구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패).";
const ADJ = { hook: "놀라고 궁금한", friendly: "또렷하고 친근한", report: "진지하고 또렷한", reveal: "또렷하고 반가운", confident: "확신에 찬", serious: "신중하고 단호한" };
const MOTION = {
  hook: ["wide-eyed and curious, eyebrows raised, as if revealing a surprising turn", "posing a surprising question to the viewer"],
  friendly: ["clear and friendly with slight nods, as if explaining this point", "clearly explaining this point"],
  report: ["serious and clear with slight nods, as if reporting these facts", "seriously reporting the facts"],
  reveal: ["clear and pleasantly surprised with slight nods, as if revealing the amount", "clearly revealing the amount"],
  confident: ["confident and knowing with slight nods", "confidently delivering the key point"],
  serious: ["serious and careful with slight nods, as if warning about this point", "seriously cautioning about this point"],
};
const OPEN = {
  greet: {
    brief: "부엉이가 정면을 보며 한쪽 날개를 살짝 들어 인사하고 다른 날개는 자연스럽게 내린 채 담담하게 미소 짓는 포즈, 소품 없음.",
    type: "open",
    action: "the character raises one wing slightly in a friendly greeting while the other wing hangs naturally, smiling calmly and warmly at the viewer; no props are held.",
    mood: "warmly greeting the viewer",
  },
  coreq: {
    brief: "부엉이가 갸웃하다 확신에 찬 표정으로 한쪽 날개를 들어 손짓하며 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
    type: "open",
    action: "the character's expression starts curious with a slight head tilt and turns confident while one wing lifts in an explaining gesture and the other hangs naturally; no props are held.",
    mood: "confidently giving the key answer",
  },
  caution: {
    brief: "부엉이가 신중하고 단호한 표정으로 한쪽 날개를 들어 잠깐 멈추라는 듯 손짓하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
    type: "open",
    action: "the character's expression is careful and firm, eyebrows slightly furrowed, while one wing lifts in a hold-on gesture as if warning the viewer and the other hangs naturally; no props are held.",
    mood: "firmly cautioning the viewer",
  },
  tick: {
    brief: "부엉이가 한쪽 날개를 들어 두 가지를 하나씩 짚어 가듯 또렷하고 친근하게 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
    type: "open",
    action: "the character lifts one wing and ticks off two points one after the other with a clear, friendly explanatory expression while the other wing hangs naturally; no props are held.",
    mood: "clearly pointing out the two things to check",
  },
  wave: {
    brief: "부엉이가 밝은 미소로 한쪽 날개를 가볍게 흔들고 다른 날개는 자연스럽게 내린 마무리 포즈, 소품 없이 빈 날개.",
    type: "open",
    action: "the character smiles brightly and waves one wing lightly in a friendly goodbye while the other wing hangs naturally relaxed; no props are held.",
    mood: "warmly saying goodbye and inviting comments",
  },
};

function cardBrief(a, b, tone) {
  const long2 = [...b].length >= 8;
  const big = [...a].length >= 9 || [...b].length >= 9;
  return (
    `부엉이가 ${ADJ[tone]} 표정으로 '${a}'와 '${b}'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. ${CARD_COMPOSITION} ` +
    `카드 글자는 굵고 크게 두 줄${long2 ? "(둘째 줄이 길어도 카드 밖으로 넘치지 않게)" : ""}, 카드에 그림·화살표 없이 글자만.` +
    (big ? " 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게)." : "")
  );
}

function buildSpec(def, narrations) {
  const N = def.ep;
  const scenes = def.scenes.map((s, i) => {
    const [kind, bgId, role, key, a, b, tone] = s;
    const base = { scene: i + 1, key, role, video: `owl_v2_ep${N}_${key}_motion.mp4`, narration: narrations[i] };
    if (kind === "card") {
      const [act, mood] = MOTION[tone];
      return {
        ...base,
        imageBrief: cardBrief(a, b, tone),
        overlays: [],
        shot: "medium",
        bg: bgId,
        motion: { type: "card2", action: `${act}; only the face and body move while the wings holding the card stay still.`, mood },
      };
    }
    const o = OPEN[a];
    return { ...base, imageBrief: o.brief, overlays: [], shot: "wide", bg: bgId, motion: { type: o.type, action: o.action, mood: o.mood } };
  });
  const timeline = def.scenes.map((s, i) => `s${i + 1} ${s[3].replace(/^s\d+_/, "")}`).join(" / ");
  return {
    specVersion: "owl_assembly_spec_v1",
    scriptStructureVersion: "owl_script_structure_v2",
    episode: N,
    displayEpisode: def.display,
    scriptType: def.ep === 30 ? "C_what_changes" : "D_what_to_do",
    geumbaksaHandoffTerm: null,
    sourceCandidate: def.candidate,
    title: def.title,
    channelName: "경제번역소",
    characterDisplayName: "부엉박사",
    headerTitle: def.headerTitle,
    hookType: def.hookType,
    openingMotion: def.openingMotion,
    imageCharacter: "owl3dv5",
    imagePrefix: `owl_ep${N}`,
    sceneBackgrounds: def.backgrounds,
    scenesTimeline: timeline,
    instagramCaptionHook: def.captionHook,
    instagramCaptionPoints: def.captionPoints,
    instagramPriorityTags: def.tags,
    emphasisTerms: def.emphasis,
    captionBoundaryExceptions: def.captionBoundaryExceptions ?? [],
    captionWidthExceptions: def.captionWidthExceptions ?? [],
    captionDwellExceptions: def.captionDwellExceptions ?? [],
    captionGapBridgeSec: 0.3,
    render: {
      width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
      audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
    },
    scenes,
  };
}

function specModuleText(def, spec) {
  const N = def.ep;
  return `/**
 * 통합 ${def.integrated}편(부엉 표시${def.display}, 파일 ep${N}) — ${def.title}. 레인 ${def.lane}. 훅 ${def.hookType}.
 * 대본: ${def.scenesFile} (검사기 반드시 수정 0). 출처: ${def.sources}.
 * 생성: scripts/build-owl-batch-1015.mjs (연출 정의 scripts/_owl-batch-1015-defs.mjs). 통합 번호는 최우선 규칙 33(_ai/episode-numbering-unified.md).
 * 연출 필드는 규칙 14(배경 2~3구역)·15(품질 체계 v2)·17(훅)·26~30. 배경·카드에 글자는 카드 문구만(배경 글자 없음).
 */

export const OWL_EP${N}_ASSEMBLY_SPEC = Object.freeze(${JSON.stringify(spec, null, 2)});

/** 장면 키로 스펙을 찾는다. */
export function findOWLEP${N}Scene(key) {
  return OWL_EP${N}_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
`;
}

// ── 커버 스펙(글자 없는 배경+캐릭터, 헤드라인은 합성기가 제목 그대로 얹음) ──────────────────
function coverModuleText(def, c) {
  const eyes = c.emptyTopPct + 10;
  const lines = def.headerTitle.length;
  const prompt =
    `Create a vertical 1080x1920px thumbnail/cover background image for a Korean finance ` +
    `Shorts video, designed to feel intriguing even when shrunk down to a tiny square grid ` +
    `thumbnail. Include the same 3D-rendered owl mascot character from the attached reference image exactly as shown — same owl body proportions, charcoal vest, white shirt, burgundy tie, sunglasses pushed up on the forehead. Do not change its core design, but EXAGGERATE its expression far beyond the reference image: ${c.expression}. Dramatic, attention-grabbing — think viral thumbnail energy, not the usual calm analytical look. The wings hold no object and no card.\n\n` +
    `CRITICAL LAYOUT (a ${lines}-line headline will be added later by software, so leave a LOT of room for it): the ` +
    `upper ${c.emptyTopPct}% of the frame must contain NO character and NO text — only the decorative ` +
    `background (glow, light ribbons, a few small shapes). The character's ear tufts ` +
    `start at about ${c.emptyTopPct}% of the frame height, its eyes and mouth sit near ${eyes}% of the frame ` +
    `height, and its body continues down to the bottom edge (legs and feet may be cropped). ` +
    `The character is centered horizontally and its full width stays within the central 70% of ` +
    `the frame (nothing closer than 15% to the left or right edge). Do NOT write any headline, title, caption, numbers, badge, logo or any other text anywhere in the image — there must be NO text at all; the headline area is intentionally left empty.\n\n` +
    `Background: a bold, vivid, high-contrast background — NOT a blurry photographic scene. ` +
    `Use a dramatic gradient from ${c.top} at the top to ${c.bottom} radiating from behind the character at the bottom (${c.noTint}). ` +
    `Behind the character: ${c.decor}, placed mostly in the lower half so the upper half stays empty, ` +
    `and a few small plain glowing light streaks sweeping across the lower background. A few small plain discs float ` +
    `in the lower background, kept abstract and dark enough at the top that white text placed over the upper half stays highly legible. ` +
    `High energy. No buildings, landmarks, flags, globes, cars, charts, real products or real organization marks.\n\n` +
    `Style: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft 3D ` +
    `animated-film style matching the character.`;
  const spec = {
    specVersion: "owl_cover_thumbnail_spec_v1",
    episode: def.ep,
    character: "owl",
    title: def.title,
    slides: [{ id: "cover_thumb", file: `00_owl_ep${def.ep}_cover_thumb.png`, withCharacter: true, prompt }],
  };
  return `/**
 * 부엉박사 파일 ep${def.ep}(통합 ${def.integrated}편) 릴스 커버 = 유튜브 썸네일 = 인스타 스토리 통합 스펙(규칙 7).
 * ★ 헤드라인은 영상 제목을 줄이지 않고 그대로 얹는다(규칙 30): "${def.title}" — 줄바꿈: ${def.headerTitle.join(" / ")}.
 * 글자는 합성기(run-cover-headline-overlay-once.mjs)가 얹으므로 글자·배지 없는 배경+캐릭터만 생성. 윗 ${c.emptyTopPct}%를 비운다.
 * 생성: scripts/build-owl-batch-1015.mjs (연출 정의 _owl-batch-1015-defs.mjs OWL_BATCH_1015_COVERS).
 */

export const CARDNEWS_SPEC = Object.freeze(${JSON.stringify(spec, null, 2)});
`;
}

for (const def of OWL_BATCH_1015) {
  if (only && !only.includes(def.ep)) continue;
  fs.writeFileSync(path.join(ROOT, "scripts", `_owl-cover-ep${def.ep}-spec.mjs`), coverModuleText(def, OWL_BATCH_1015_COVERS[def.ep]), "utf8");
  const narrations = JSON.parse(fs.readFileSync(path.join(ROOT, def.scenesFile), "utf8"));
  if (narrations.length !== def.scenes.length) throw new Error(`ep${def.ep}: 대본 ${narrations.length}씬 ≠ 연출 ${def.scenes.length}씬`);
  const spec = buildSpec(def, narrations);
  const specPath = path.join(ROOT, "scripts", `_owl-v2-ep${def.ep}-assembly-spec.mjs`);
  fs.writeFileSync(specPath, specModuleText(def, spec), "utf8");
  const ttsDir = `C:/tmp/money-shorts-os/owl-ep${def.ep}-tts`;
  fs.mkdirSync(ttsDir, { recursive: true });
  const tts = buildTts(def, narrations, def.scenes);
  fs.writeFileSync(path.join(ttsDir, `owl-ep${def.ep}-tts-script.json`), JSON.stringify(tts, null, 2), "utf8");
  console.log(`ep${def.ep} (통합 ${def.integrated}): 스펙 ${path.relative(ROOT, specPath)} · TTS ${ttsDir}/owl-ep${def.ep}-tts-script.json · ${narrations.length}씬`);
}
