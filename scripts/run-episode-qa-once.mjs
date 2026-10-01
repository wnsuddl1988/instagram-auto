#!/usr/bin/env node
/**
 * 편 단위 자동 검수 (2026-09-30 품질 개선) — Owner 검수 전에 스크립트가 먼저 거른다.
 *
 * 검사 항목
 *   1. 스펙: shot·bg·motion·sceneBackgrounds 필드, 같은 구역 같은 샷 3연속 금지
 *   2. 자막(owl_captions.ass): 줄 폭(안전폭), 읽는 표기 숫자 잔존("삼백육십만"류), 0.6초 미만 블록,
 *      한 어절짜리 블록, 금지 경계("11월 / 2일", "결론이 / 아니라" 등)에서 끊긴 줄
 *   3. 리스크 고지(황소특보): 오프닝·마지막 씬에 riskDisclosure
 *   4. 음량: 완성본 -14 LUFS ±1.5, 피크 -0.5 dBTP 이하(아니면 run-audio-finish-once.mjs)
 *   5. 입 멈춤: 클립별 Veo 음성 끝 vs TTS 발화 끝(check-clip-speech-timing-once.mjs 결과 요약)
 *   6. 안전선 시트 생성(이미지·완성본) — 사람이 마지막으로 눈으로 본다
 *   7. (2026-09-30 밤) 대본 기준 대조(_script-standards.mjs, 규칙 26) — 반드시 수정이면 QA도 막힌다
 *   8. (2026-09-30 밤) 보드·카드 씬 오른쪽 끝 확대 시트 + 판정 기록(edge-review.json) 필수 — 기록이 없거나 초과 씬이 있으면 반드시 수정
 *   9. (2026-10-02) 자막-음성 대조: 완성본 오디오 무음 감지로 "발화가 끝나기 전에 자막이 사라지는 곳"이 있으면 반드시 수정
 *  10. (2026-10-02) 글자 크기·줄 수: 자막 ASS의 실제 글자 크기(새 체계 편 96px 미만 금지)·자막 최대 2줄, 제목 줄별 실제 크기(100px 미만 금지)·제목 최대 3줄
 *  11. (2026-10-02) 자막-카드 겹침: 카드 씬 자막 윗줄이 카드 글자 한계(60%)+여유(5%)보다 위거나 자막 아래 끝이 유튜브 제목 줄(y≈1510)에 닿으면
 *      반드시 수정(자동, _card-caption-overlap.mjs) + qa/caption-card-*.png를 보고 edge-review.json의 captionOverlap에 씬별 ok/over 기록 필수
 * 결과: <final-dir>/qa-report.md + 콘솔 요약. 반드시 고쳐야 하는 항목이 있으면 종료 코드 1.
 *
 * 사용:
 *   node scripts/run-episode-qa-once.mjs --spec-module ./_bull-ep11-assembly-spec.mjs --spec-export BULL_EP11_ASSEMBLY_SPEC \
 *     --tts-summary <…/elevenlabs-scene-paced-tts-summary.json> --assembly-dir C:/tmp/bull-ep11-assembly-v1 \
 *     --final C:/tmp/bull-ep11-final/owl_episode_final.mp4 [--clip-dir C:/tmp/bull-ep11-videos] [--images-dir C:/tmp/bull-ep11-images]
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { splitPenalty, textWidthRatio } from "./_caption-linebreak-ko.mjs";
import { checkHook } from "./_hook-rules.mjs";
import { checkScriptStandards } from "./_script-standards.mjs";
import { readCaptionBlocks, checkCaptionGeometry, captionCardFrames } from "./_card-caption-overlap.mjs";

const argv = process.argv.slice(2);
function getArg(name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
}
const SPEC_MODULE = getArg("--spec-module");
const SPEC_EXPORT = getArg("--spec-export");
const TTS_SUMMARY = getArg("--tts-summary");
const ASSEMBLY_DIR = getArg("--assembly-dir");
const FINAL = getArg("--final");
const CLIP_DIR = getArg("--clip-dir");
const IMAGES_DIR = getArg("--images-dir");
if (!SPEC_MODULE || !SPEC_EXPORT || !TTS_SUMMARY || !ASSEMBLY_DIR || !FINAL) {
  console.error("ABORT: --spec-module --spec-export --tts-summary --assembly-dir --final 이 필요합니다.");
  process.exit(2);
}
const spec = (await import(new URL(SPEC_MODULE, import.meta.url).href))[SPEC_EXPORT];
// 조립기 값과 같아야 한다(run-owl-assemble-shorts-v2.mjs): 새 체계 편 760px, 그 전 편 864px.
const LAYOUT_V2 = Boolean(spec.sceneBackgrounds) || spec.captionLayout === "v2";
const CAPTION_WIDTH = LAYOUT_V2 ? 760 : 864;
// 글자 크기 기준(Owner 2026-10-02 "제목·자막 글자가 작게 느껴진다" → 새 체계 편 제목 108px·자막 96px로 확정).
// 아래 최소값은 그 확정 크기에서 도출한 Claude 설정 수치다(Owner가 숫자를 말한 것은 아님).
const MIN_CAPTION_FONT_V2 = 96;
const MIN_TITLE_PX_V2 = 100;   // 줄별로 실제 그려지는 크기(폭 864에 맞춰 줄어든 뒤)
const TITLE_BASE_PX = LAYOUT_V2 ? 108 : 92;
const TITLE_SAFE_WIDTH = 864;
const MAX_TITLE_LINES = 3;      // Owner 2026-10-02 "제목은 3줄로 만들어도 괜찮아"
const MAX_CAPTION_LINES = 2;    // Owner 2026-10-02 "자막은 2줄까지만"
const mustFix = [];
const warn = [];
const info = [];

// 0) 훅(최우선 규칙 17)
{
  const hook = checkHook(spec);
  mustFix.push(...hook.mustFix);
  warn.push(...hook.warn);
  info.push(...hook.info);
}

// 0-1) 대본 기준 대조(최우선 규칙 26, 2026-09-30 밤 Owner 승인) — TTS 게이트와 같은 규칙. 통과 못 하면 QA도 "반드시 수정".
// 캐릭터는 스펙의 imageCharacter/파일 이름으로 판정(금박사 제외). 규칙 이전에 만든 재고는 스펙의 scriptStandardsException(사유)로만 예외.
{
  const specName = path.basename(SPEC_MODULE);
  const character = /bull/.test(spec.imageCharacter ?? specName) ? "bull" : /owl/.test(spec.imageCharacter ?? specName) ? "owl" : null;
  if (character) {
    const r = checkScriptStandards({ character, scenes: spec.scenes.map((s) => s.narration), hookType: spec.hookType ?? null });
    if (typeof spec.scriptStandardsException === "string" && spec.scriptStandardsException.trim()) {
      info.push(`대본 기준 대조 예외(${spec.scriptStandardsException.trim()}): 반드시 수정 ${r.fix.length}건은 기록만 — ${r.fix.join(" / ") || "없음"}`);
    } else {
      mustFix.push(...r.fix.map((f) => `대본: ${f}`));
      warn.push(...r.warn.map((w) => `대본: ${w}`));
      info.push(`대본 기준 대조(${r.version}): 통과 ${r.ok.length} · 확인 권장 ${r.warn.length} · 반드시 수정 ${r.fix.length}`);
    }
  }
}

// 1) 스펙
const needFields = ["shot", "bg", "motion"];
const missing = spec.scenes.filter((s) => needFields.some((f) => s[f] === undefined)).map((s) => s.scene);
if (!spec.sceneBackgrounds || !spec.imagePrefix || !spec.imageCharacter) warn.push("스펙에 sceneBackgrounds/imagePrefix/imageCharacter가 없음(규칙 15 — 11편 이후 필수)");
if (missing.length) warn.push(`shot·bg·motion 누락 씬: ${missing.join(", ")}`);
for (let i = 2; i < spec.scenes.length; i += 1) {
  const [a, b, c] = [spec.scenes[i - 2], spec.scenes[i - 1], spec.scenes[i]];
  if (a.shot && a.shot === b.shot && b.shot === c.shot && a.bg === b.bg && b.bg === c.bg) {
    warn.push(`같은 구역(${c.bg})·같은 샷(${c.shot}) 3연속: s${a.scene}~s${c.scene} — 점프컷 느낌`);
  }
}
const bgKinds = new Set(spec.scenes.map((s) => s.bg).filter(Boolean));
if (spec.sceneBackgrounds && bgKinds.size < 2) warn.push("배경 구역이 1곳뿐(규칙 14: 2~3곳)");
const propScenes = spec.scenes.filter((s) => ["board", "card1", "card2"].includes(s.motion?.type)).length;
info.push(`보드·카드 씬 ${propScenes}/${spec.scenes.length}`);

// 2) 자막
const assPath = path.join(ASSEMBLY_DIR, "owl_captions.ass");
if (!fs.existsSync(assPath)) {
  mustFix.push(`자막 파일 없음: ${assPath}`);
} else {
  const toSec = (t) => { const [h, m, s] = t.split(":"); return Number(h) * 3600 + Number(m) * 60 + Number(s); };
  const events = new Map();
  for (const line of fs.readFileSync(assPath, "utf8").split(/\r?\n/)) {
    if (!line.startsWith("Dialogue:")) continue;
    const parts = line.split(",");
    const text = line.slice(line.indexOf(",,", line.indexOf("OwlCaption")) + 2).replace(/^0,0,0,,/, "").replace(/\{[^}]*\}/g, "");
    const fs = Number((/\\fs(\d+)/.exec(line) ?? [])[1]) || 84; // ASS에 실제로 기록된 글자 크기
    const key = `${parts[1]}|${parts[2]}`;
    if (!events.has(key)) events.set(key, { start: toSec(parts[1]), end: toSec(parts[2]), lines: [], fs });
    events.get(key).lines.push(text);
  }
  const blocks = [...events.values()].sort((a, b) => a.start - b.start);
  // 폭 한도 안에 도저히 못 넣는 숫자 합산 표기("77조 2천억 원이야" 792px > 760)처럼 불가피한 경계만, 스펙에 사유와 함께
  // 적은 `captionBoundaryExceptions: [{ left, right, reason }]`로 예외 승인한다(경고로 남김, 2026-10-02 황소 14편). 규칙 자체는 그대로.
  const boundaryException = (L, R) => (spec.captionBoundaryExceptions ?? []).find((e) => e.left === L && e.right === R && e.reason);
  let prev = null;
  const smallCaption = new Set();
  for (const b of blocks) {
    if (b.lines.length > MAX_CAPTION_LINES) mustFix.push(`자막 ${b.lines.length}줄(최대 ${MAX_CAPTION_LINES}줄, Owner 지시): "${b.lines.join(" / ")}"`);
    if (LAYOUT_V2 && b.fs < MIN_CAPTION_FONT_V2) smallCaption.add(b.fs);
    for (const l of b.lines) {
      const w = textWidthRatio(l) * b.fs;
      if (w > CAPTION_WIDTH + 1) mustFix.push(`자막 폭 초과 ${Math.round(w)}px(글자 ${b.fs}px): "${l}"`);
      // 앞에 아라비아 숫자가 붙은 "6천만 원"은 정상 표기다(2026-10-02 부엉 19편 오탐 정정) — 한글로 푼 "육천만"·"삼백육십만"만 잡는다.
      if (/(?<![0-9])[일이삼사오육칠팔구십백천](년|월|개월|만|퍼센트)/.test(l)) mustFix.push(`읽는 표기 숫자 잔존: "${l}"`);
    }
    if (b.lines.length === 2) {
      const L = b.lines[0].split(" ").at(-1);
      const R = b.lines[1].split(" ")[0];
      if (!Number.isFinite(splitPenalty(L, R))) {
        const ex = boundaryException(L, R);
        if (ex) warn.push(`금지 경계 줄바꿈(스펙 예외 승인): "${b.lines[0]} / ${b.lines[1]}" — ${ex.reason}`);
        else mustFix.push(`금지 경계 줄바꿈: "${b.lines[0]} / ${b.lines[1]}"`);
      }
    }
    if (prev && b.start - prev.end < 0.2) {
      const L = prev.lines.at(-1).split(" ").at(-1);
      const R = b.lines[0].split(" ")[0];
      if (!Number.isFinite(splitPenalty(L, R))) {
        const ex = boundaryException(L, R);
        if (ex) warn.push(`금지 경계 블록 분할(스펙 예외 승인): "${prev.lines.join(" ")} || ${b.lines.join(" ")}" — ${ex.reason}`);
        else mustFix.push(`금지 경계 블록 분할: "${prev.lines.join(" ")} || ${b.lines.join(" ")}"`);
      }
    }
    if (b.end - b.start < 0.6) warn.push(`0.6초 미만 자막: "${b.lines.join(" ")}" (${(b.end - b.start).toFixed(2)}s)`);
    if (b.lines.join(" ").split(" ").length === 1 && b.lines.join("").length <= 3) warn.push(`한 어절 자막: "${b.lines.join(" ")}"`);
    prev = b;
  }
  if (smallCaption.size) mustFix.push(`자막 글자가 너무 작음(${[...smallCaption].join("·")}px, 새 체계 편 최소 ${MIN_CAPTION_FONT_V2}px) → 조립기 CAPTION_FONT_SIZE 확인 후 재조립`);
  info.push(`자막 ${blocks.length}블록, 글자 ${[...new Set(blocks.map((b) => b.fs))].join("·")}px, 최대 ${Math.max(...blocks.map((b) => b.lines.length))}줄`);

  // 2-1) 제목(headerTitle): 줄별 실제 그려지는 크기 = 기준 크기를 폭 864에 맞춰 줄인 값(조립기와 같은 계산)
  const title = spec.headerTitle ?? [];
  if (title.length > MAX_TITLE_LINES) mustFix.push(`제목 ${title.length}줄(최대 ${MAX_TITLE_LINES}줄, Owner 지시)`);
  const sizes = title.map((l) => {
    const natural = textWidthRatio(l) * TITLE_BASE_PX;
    return natural > TITLE_SAFE_WIDTH ? Math.floor(TITLE_BASE_PX * (TITLE_SAFE_WIDTH / natural)) : TITLE_BASE_PX;
  });
  const smallTitle = title.map((l, i) => ({ l, px: sizes[i] })).filter((x) => LAYOUT_V2 && x.px < MIN_TITLE_PX_V2);
  if (smallTitle.length) mustFix.push(`제목 글자가 너무 작게 그려짐(최소 ${MIN_TITLE_PX_V2}px): ${smallTitle.map((x) => `"${x.l}" ${x.px}px`).join(", ")} → 문구는 그대로 두고 줄을 나눈다(최대 ${MAX_TITLE_LINES}줄, 줄이 길수록 폭에 맞춰 줄어듦)`);
  info.push(`제목 ${title.length}줄, 실제 글자 ${sizes.join("·")}px`);
}

// 3) 리스크 고지(황소특보)
if (spec.imageCharacter === "bull3dv1" || spec.characterDisplayName === "황소특보") {
  const opening = spec.scenes.find((s) => s.role === "opening");
  const last = spec.scenes.at(-1);
  if (!opening?.riskDisclosure) mustFix.push("오프닝 씬에 riskDisclosure 없음");
  if (!last?.riskDisclosure) mustFix.push("마지막 씬에 riskDisclosure 없음");
}

// 4) 음량
{
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", FINAL, "-af", "loudnorm=I=-14:TP=-1:print_format=json", "-vn", "-f", "null", "-"], { encoding: "utf8" });
  const text = `${r.stdout}\n${r.stderr}`;
  try {
    const m = JSON.parse(text.slice(text.lastIndexOf("{"), text.lastIndexOf("}") + 1));
    const lufs = Number(m.input_i);
    const tp = Number(m.input_tp);
    info.push(`음량 ${lufs.toFixed(1)} LUFS / 피크 ${tp.toFixed(1)} dBTP`);
    if (Math.abs(lufs + 14) > 1.5 || tp > -0.5) mustFix.push(`음량 기준 벗어남(${lufs.toFixed(1)} LUFS, 피크 ${tp.toFixed(1)}) → run-audio-finish-once.mjs 적용`);
  } catch {
    warn.push("음량 측정 실패");
  }
}

// 4-0) 씬 전환 싱크 v3(2026-09-30 Owner 지적 — "다음 씬 자막 첫 부분이 이전 씬 끝에서 먼저 나오고 넘어가 뚝뚝 끊긴다")
// 조립기가 남긴 cutSync(절대 프레임 컷·리드·누적 오차)와 자막 ASS를 교차 검사한다.
{
  const manifestPath = path.join(ASSEMBLY_DIR, "assembly-manifest.json");
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : null;
  const cs = manifest?.cutSync;
  if (!cs || cs.version !== "scene_cut_sync_v3") {
    mustFix.push("씬 전환 싱크 v3 정보 없음 — 옛 조립기로 만든 본편(씬마다 화면이 발화보다 누적으로 늦어짐). run-owl-assemble-shorts-v2.mjs로 다시 조립");
  } else {
    const lateCuts = cs.cuts.filter((c) => c.leadSec < -0.02);
    if (cs.maxDriftSec > 0.05) mustFix.push(`씬 컷 누적 오차 ${cs.maxDriftSec}s(1프레임 초과)`);
    if (lateCuts.length) mustFix.push(`화면 컷이 다음 발화보다 늦은 전환 ${lateCuts.length}곳: ${lateCuts.map((c) => `s${c.scene}(${c.leadSec}s)`).join(", ")}`);
    const toSec = (t) => { const [h, mm, s] = t.split(":"); return Number(h) * 3600 + Number(mm) * 60 + Number(s); };
    const assFile = path.join(ASSEMBLY_DIR, "owl_captions.ass");
    if (fs.existsSync(assFile)) {
      const events = fs.readFileSync(assFile, "utf8").split(/\r?\n/).filter((l) => l.startsWith("Dialogue:")).map((l) => {
        const f = l.slice(9).split(",");
        return { start: toSec(f[1].trim()), end: toSec(f[2].trim()) };
      });
      const crossing = cs.cuts.filter((c) => events.some((e) => e.start < c.cutSec - 0.01 && e.end > c.cutSec + 0.01));
      const early = cs.cuts.filter((c) => events.some((e) => e.start >= c.cutSec - 0.3 && e.start < c.cutSec - 0.01));
      if (crossing.length) mustFix.push(`자막이 씬 컷을 가로지름(이전 씬 자막이 새 화면에 남음) ${crossing.length}곳: ${crossing.map((c) => `s${c.scene}`).join(", ")}`);
      if (early.length) mustFix.push(`다음 씬 자막이 컷보다 먼저 뜸 ${early.length}곳: ${early.map((c) => `s${c.scene}`).join(", ")}`);
    }
    const leads = cs.cuts.map((c) => c.leadSec);
    info.push(`씬 전환 싱크: 컷 ${cs.cuts.length}개, 화면이 발화보다 ${Math.min(...leads).toFixed(2)}~${Math.max(...leads).toFixed(2)}초 먼저 넘어감, 누적 오차 ${cs.maxDriftSec}s`);
  }
}

// 4-0b) 자막 vs 실제 음성 대조(2026-10-02 황소 12편 사고 — 연속 TTS의 alignment가 중간부터 0.6~0.9초 밀려 s13~s16에서
// 소리가 끝나기 전에 자막이 사라졌는데, 위 4-0은 조립 내부 정합만 봐서 통과시켰다). 완성본 오디오를 무음 감지해
// 실제 발화 구간의 끝 직전(-0.25초)에 자막이 없으면 반드시 수정. 고정 CTA 구간(마지막 자막 이후)은 제외한다.
// 해결: node scripts/fix-tts-alignment-from-audio-once.mjs 로 alignment를 보정한 요약으로 다시 조립.
{
  const assFile = path.join(ASSEMBLY_DIR, "owl_captions.ass");
  if (fs.existsSync(assFile)) {
    const toSec = (t) => { const [h, mm, s] = t.split(":"); return Number(h) * 3600 + Number(mm) * 60 + Number(s); };
    const caps = fs.readFileSync(assFile, "utf8").split(/\r?\n/).filter((l) => l.startsWith("Dialogue:")).map((l) => {
      const f = l.slice(9).split(",");
      return { s: toSec(f[1].trim()), e: toSec(f[2].trim()) };
    });
    const lastCapEnd = Math.max(...caps.map((c) => c.e));
    // 기준 -32dB: 음량 마감(-14 LUFS) 뒤 말소리는 평균 -14dB·최대 -1dB인데 숨소리·태그 잡음은 최대 -34dB 안팎이라(부엉 17편 실측:
    // 9.6~9.9초 잡음 평균 -45dB) -38dB로는 숨소리를 "발화"로 잡아 오탐이 났다(2026-10-02). 황소 12편 v1의 실제 결함(0.6초 이상 어긋남)은 -32dB에서도 잡힌다.
    const r = spawnSync("ffmpeg", ["-hide_banner", "-i", FINAL, "-af", "silencedetect=noise=-32dB:d=0.18", "-vn", "-f", "null", "-"], { encoding: "utf8" });
    const ss = [...r.stderr.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
    const se = [...r.stderr.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
    const speech = [];
    let cur = 0;
    for (let i = 0; i < ss.length; i += 1) { if (ss[i] - cur > 0.15) speech.push([cur, ss[i]]); cur = se[i] ?? 9999; }
    const covered = (t) => caps.some((c) => t >= c.s - 0.02 && t <= c.e + 0.02);
    const cut = speech.filter(([a, b]) => b - a >= 0.4 && a < lastCapEnd - 0.1 && !covered(b - 0.25));
    if (cut.length) mustFix.push(`음성이 끝나기 전에 자막이 사라지는 발화 ${cut.length}곳(${cut.slice(0, 6).map(([a, b]) => `${a.toFixed(1)}~${b.toFixed(1)}초`).join(", ")}${cut.length > 6 ? " …" : ""}) → TTS alignment 밀림. fix-tts-alignment-from-audio-once.mjs로 보정한 요약·alignment로 다시 조립`);
    else info.push(`자막-음성 대조: 발화 ${speech.filter(([a, b]) => b - a >= 0.4 && a < lastCapEnd - 0.1).length}곳 모두 끝까지 자막 표시`);
  }
}

// 4-1) Veo 워터마크 제거 표식(2026-09-30 Owner 지적 — 하단 채널명 띠를 뺀 뒤로 우하단 워터마크가 드러남)
// run-remove-veo-watermark-once.mjs가 남긴 전역 메타데이터가 최종본에 없으면 배포 금지.
{
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format_tags=comment", "-of", "default=nw=1:nk=1", FINAL], { encoding: "utf8" });
  if (!(r.stdout ?? "").includes("veo_watermark_removed_v1")) {
    mustFix.push("Veo 워터마크 제거 표식 없음 → CTA 결합 직후 run-remove-veo-watermark-once.mjs를 적용한 뒤 오디오 마감(§A-7)");
  } else {
    info.push("Veo 워터마크 제거 표식 확인(veo_watermark_removed_v1)");
  }
}

// 5) 입 멈춤
if (CLIP_DIR) {
  const r = spawnSync("node", [path.join("scripts", "check-clip-speech-timing-once.mjs"), "--spec-module", SPEC_MODULE, "--spec-export", SPEC_EXPORT, "--clip-dir", CLIP_DIR, "--tts-summary", TTS_SUMMARY], { encoding: "utf8" });
  const summaryLine = (r.stdout.match(/\d+개 측정, 경고 \d+개[^\n]*/) ?? [""])[0];
  const flagged = Number((summaryLine.match(/경고 (\d+)개/) ?? [0, 0])[1]);
  info.push(`입 멈춤: ${summaryLine}`);
  if (flagged > 0) warn.push(`입이 대사보다 오래 움직이는 클립 ${flagged}개(프레임 육안 확인)`);
}

// 6) 안전선 시트
const reviewDir = path.join(path.dirname(FINAL), "qa");
fs.mkdirSync(reviewDir, { recursive: true });
const sheets = [];
if (IMAGES_DIR) {
  spawnSync("node", ["scripts/run-safe-zone-preview-once.mjs", "--images-dir", IMAGES_DIR, "--spec-module", SPEC_MODULE, "--spec-export", SPEC_EXPORT, "--out", path.join(reviewDir, "safe-images.png")], { encoding: "utf8" });
  sheets.push(path.join(reviewDir, "safe-images.png"));
}
spawnSync("node", ["scripts/run-safe-zone-preview-once.mjs", "--video", FINAL, "--count", "8", "--out", path.join(reviewDir, "safe-video.png")], { encoding: "utf8" });
sheets.push(path.join(reviewDir, "safe-video.png"));

// 워터마크 잔여 확인용: 우하단 영역을 영상 전체에서 균등 간격으로 잘라 한 장에 모은다(표식이 있어도 눈으로 한 번 본다).
{
  const durRaw = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", FINAL], { encoding: "utf8" }).stdout.trim();
  const dur = Number(durRaw);
  if (Number.isFinite(dur) && dur > 5) {
    const count = 20;
    const tiles = [];
    for (let i = 0; i < count; i += 1) {
      const t = 1 + ((dur - 2) * i) / (count - 1);
      const out = path.join(reviewDir, `wm_${i}.png`);
      spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", t.toFixed(2), "-i", FINAL, "-frames:v", "1", "-vf", "crop=300:300:780:1620,scale=200:200", out], { encoding: "utf8" });
      if (fs.existsSync(out)) tiles.push(out);
    }
    if (tiles.length > 0) {
      const sheet = path.join(reviewDir, "watermark-check.png");
      const args = ["-v", "error", "-y"];
      tiles.forEach((t) => args.push("-i", t));
      args.push("-filter_complex", `xstack=inputs=${tiles.length}:layout=${tiles.map((_, i) => `${(i % 10) * 200}_${Math.floor(i / 10) * 200}`).join("|")}:fill=black`, sheet);
      spawnSync("ffmpeg", args, { encoding: "utf8" });
      tiles.forEach((t) => fs.rmSync(t, { force: true }));
      sheets.push(sheet);
    }
  }
}

// 8) 보드·카드 글자 좌우 끝 확대 시트 + 판정 기록 필수(2026-09-30 밤, 황소 11편 사고 — 이미지 시트에서 "안전폭 안"이라 본 보드
// 7개가 완성본에서 크롭선(90%) 밖이었다). OCR이 없어 자동 판정은 못 하므로, 씬마다 좌우 22%를 확대하고 크롭선(빨강 10%·90%)과
// 글자 안전선(주황 12%·88%)을 그어 한 장에 모은다. 그리고 사람이 씬마다 판정한 기록 qa/edge-review.json이 **이 완성본보다 나중에**
// 저장돼 있어야 통과한다({"final":"<파일명>","scenes":{"3":"ok","6":"over",...},"note":"..."} — "over"가 하나라도 있으면 반드시 수정).
{
  const manifestPath = path.join(ASSEMBLY_DIR, "assembly-manifest.json");
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : null;
  // 옛 스펙(motion 필드가 하나도 없음)은 어느 씬에 글자가 있는지 알 수 없어 검사가 통째로 건너뛰어지던 구멍(2026-10-01 부엉 16편 재고에서 발견)
  // → motion이 전혀 없으면 전 씬을 검사 대상으로 한다(판정 기록 필수).
  const hasMotionInfo = spec.scenes.some((s) => s.motion?.type);
  const textScenes = (hasMotionInfo ? spec.scenes.filter((s) => ["board", "card1", "card2"].includes(s.motion?.type)) : spec.scenes).map((s) => s.scene);
  if (textScenes.length && manifest?.timeline) {
    const tiles = [];
    for (const n of textScenes) {
      const t = manifest.timeline.find((x) => x.scene === n);
      if (!t) continue;
      const at = (t.start + t.duration * 0.45).toFixed(2);
      const out = path.join(reviewDir, `edge_${n}.png`);
      const lines = "drawbox=x=108:y=0:w=3:h=ih:color=red@0.9:t=fill,drawbox=x=969:y=0:w=3:h=ih:color=red@0.9:t=fill,drawbox=x=130:y=0:w=3:h=ih:color=orange@0.9:t=fill,drawbox=x=947:y=0:w=3:h=ih:color=orange@0.9:t=fill";
      const label = `drawtext=fontfile=assets/fonts/BlackHanSans.ttf:text='s${n}':fontsize=40:fontcolor=white:borderw=4:bordercolor=black:x=8:y=8`;
      spawnSync(
        "ffmpeg",
        ["-v", "error", "-y", "-ss", at, "-i", FINAL, "-frames:v", "1", "-filter_complex",
          `[0]${lines},split[a][b];[a]crop=240:1100:0:270[l];[b]crop=240:1100:840:270[r];[l][r]hstack=inputs=2,pad=iw+12:ih:0:0:black,${label}`, out],
        { encoding: "utf8" },
      );
      if (fs.existsSync(out)) tiles.push(out);
    }
    // 원본 1:1 크기(축소하면 글자가 선에 닿는지 판단이 흐려진다 — 2026-09-30 시험에서 확인). 시트 한 장에 4씬씩.
    fs.readdirSync(reviewDir).filter((f) => /^edge-review(-\d+)?\.png$/.test(f)).forEach((f) => fs.rmSync(path.join(reviewDir, f), { force: true }));
    const perSheet = 4;
    for (let k = 0; k * perSheet < tiles.length; k += 1) {
      const chunk = tiles.slice(k * perSheet, (k + 1) * perSheet);
      const sheet = path.join(reviewDir, `edge-review-${k + 1}.png`);
      const args = ["-v", "error", "-y"];
      chunk.forEach((t) => args.push("-i", t));
      if (chunk.length === 1) args.push(sheet);
      else args.push("-filter_complex", `hstack=inputs=${chunk.length}`, sheet);
      spawnSync("ffmpeg", args, { encoding: "utf8" });
      if (fs.existsSync(sheet)) sheets.push(sheet);
    }
    tiles.forEach((t) => fs.rmSync(t, { force: true }));
    const reviewFile = path.join(reviewDir, "edge-review.json");
    if (!fs.existsSync(reviewFile)) {
      mustFix.push(`보드·카드 씬 ${textScenes.length}개(s${textScenes.join(",s")})의 글자 좌우 끝 판정 기록 없음 → qa/edge-review-*.png(원본 1:1, 한 장에 4씬)를 보고 qa/edge-review.json에 씬마다 ok(주황 안전선 안)/over(넘음)를 적은 뒤 QA 재실행`);
    } else {
      const review = JSON.parse(fs.readFileSync(reviewFile, "utf8"));
      const stale = fs.statSync(reviewFile).mtimeMs < fs.statSync(FINAL).mtimeMs || review.final !== path.basename(FINAL);
      const missingScenes = textScenes.filter((n) => !["ok", "over"].includes(review.scenes?.[String(n)]));
      const over = textScenes.filter((n) => review.scenes?.[String(n)] === "over");
      if (stale) mustFix.push("edge-review.json이 이 완성본보다 먼저 저장됐거나 다른 파일 기준 — 새 완성본으로 다시 판정");
      else if (missingScenes.length) mustFix.push(`edge-review.json에 판정 없는 씬: s${missingScenes.join(",s")}`);
      else if (over.length) mustFix.push(`글자가 안전선(좌 12%·우 88%)을 넘은 씬(판정 over): s${over.join(",s")} → 클립 이동 교정(A-6) 후 재조립`);
      else info.push(`보드·카드 글자 좌우 끝 판정 기록 확인(${textScenes.length}씬 모두 ok${review.note ? ` — ${review.note}` : ""})`);
    }

    // 8-2) 자막-카드 겹침(2026-10-02 부엉 19편 Owner "자막이 카드 문구를 가린다") — 자세한 배경은 _card-caption-overlap.mjs 머리말.
    // ① 자동(기하): 카드 씬 자막 윗줄이 카드 글자 한계(60%)+여유(5%)보다 위면, 아래 끝이 유튜브 제목 줄(y≈1510)에 닿으면 반드시 수정.
    // ② 사람 확인: qa/caption-card-*.png(카드 씬마다 두 줄 자막이 뜬 순간)를 보고 edge-review.json의 captionOverlap에 씬별 ok/over 기록.
    {
      const assFile = path.join(ASSEMBLY_DIR, "owl_captions.ass");
      if (fs.existsSync(assFile)) {
        const blocks = readCaptionBlocks(assFile);
        const cardScenes = textScenes.map((n) => manifest.timeline.find((x) => x.scene === n)).filter(Boolean)
          .map((t) => ({ scene: t.scene, start: t.start, end: t.start + t.duration }));
        const geo = checkCaptionGeometry(blocks, cardScenes, { layoutV2: LAYOUT_V2 });
        mustFix.push(...geo.mustFix);
        warn.push(...(geo.warn ?? []));
        fs.readdirSync(reviewDir).filter((f) => /^caption-card(-\d+)?\.png$/.test(f)).forEach((f) => fs.rmSync(path.join(reviewDir, f), { force: true }));
        const frames = captionCardFrames({ video: FINAL, blocks, cardScenes, outPrefix: path.join(reviewDir, "caption-card") });
        frames.sheets.forEach((s) => { if (fs.existsSync(s)) sheets.push(s); });
        info.push(`자막-카드 간격(자동): 카드 씬 자막 윗줄 최소 y=${geo.minTopPx === null ? "-" : Math.round(geo.minTopPx)}px, 모든 자막 아래 끝 최대 y=${Math.round(geo.maxBottomPx)}px`);
        const reviewFile = path.join(reviewDir, "edge-review.json");
        if (LAYOUT_V2 && cardScenes.length && fs.existsSync(reviewFile)) {
          const review = JSON.parse(fs.readFileSync(reviewFile, "utf8"));
          const ids = cardScenes.map((c) => c.scene);
          const rec = review.captionOverlap ?? {};
          const missing = ids.filter((n) => !["ok", "over"].includes(rec[String(n)]));
          const over = ids.filter((n) => rec[String(n)] === "over");
          if (missing.length) mustFix.push(`자막-카드 겹침 판정 기록 없음(s${missing.join(",s")}) → qa/caption-card-*.png(카드 씬마다 두 줄 자막이 뜬 순간)를 보고 qa/edge-review.json의 captionOverlap에 씬마다 ok(자막이 카드 글자를 가리지 않고 간격 있음)/over(가리거나 카드 아래 모서리에 붙음)를 적은 뒤 QA 재실행`);
          else if (over.length) mustFix.push(`자막이 카드 문구를 가리거나 붙은 씬(판정 over): s${over.join(",s")} → 자막 위치(조립기 CAPTION_FIXED_Y) 조정 후 재조립`);
          else info.push(`자막-카드 겹침 판정 기록 확인(${ids.length}씬 모두 ok)`);
        }
      }
    }
  }
}

const report = [
  `# 자동 검수 — ${spec.characterDisplayName} ${spec.episode}편`,
  "",
  `## 반드시 수정 (${mustFix.length})`,
  ...(mustFix.length ? mustFix.map((x) => `- ${x}`) : ["- 없음"]),
  "",
  `## 확인 권장 (${warn.length})`,
  ...(warn.length ? warn.map((x) => `- ${x}`) : ["- 없음"]),
  "",
  "## 정보",
  ...info.map((x) => `- ${x}`),
  "",
  "## 안전선 시트(눈으로 확인)",
  ...sheets.map((x) => `- ${x.replace(/\\/g, "/")}`),
  "",
].join("\n");
const reportPath = path.join(path.dirname(FINAL), "qa-report.md");
fs.writeFileSync(reportPath, report, "utf8");
console.log(report);
console.log(`저장: ${reportPath}`);
process.exit(mustFix.length ? 1 : 0);
