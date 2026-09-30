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
const CAPTION_FONT = 84;
const CAPTION_WIDTH = spec.sceneBackgrounds || spec.captionLayout === "v2" ? 760 : 864;
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
    const key = `${parts[1]}|${parts[2]}`;
    if (!events.has(key)) events.set(key, { start: toSec(parts[1]), end: toSec(parts[2]), lines: [] });
    events.get(key).lines.push(text);
  }
  const blocks = [...events.values()].sort((a, b) => a.start - b.start);
  let prev = null;
  for (const b of blocks) {
    for (const l of b.lines) {
      const w = textWidthRatio(l) * CAPTION_FONT;
      if (w > CAPTION_WIDTH + 1) mustFix.push(`자막 폭 초과 ${Math.round(w)}px: "${l}"`);
      if (/[일이삼사오육칠팔구십백천](년|월|개월|만|퍼센트)/.test(l)) mustFix.push(`읽는 표기 숫자 잔존: "${l}"`);
    }
    if (b.lines.length === 2) {
      const L = b.lines[0].split(" ").at(-1);
      const R = b.lines[1].split(" ")[0];
      if (!Number.isFinite(splitPenalty(L, R))) mustFix.push(`금지 경계 줄바꿈: "${b.lines[0]} / ${b.lines[1]}"`);
    }
    if (prev && b.start - prev.end < 0.2) {
      const L = prev.lines.at(-1).split(" ").at(-1);
      const R = b.lines[0].split(" ")[0];
      if (!Number.isFinite(splitPenalty(L, R))) mustFix.push(`금지 경계 블록 분할: "${prev.lines.join(" ")} || ${b.lines.join(" ")}"`);
    }
    if (b.end - b.start < 0.6) warn.push(`0.6초 미만 자막: "${b.lines.join(" ")}" (${(b.end - b.start).toFixed(2)}s)`);
    if (b.lines.join(" ").split(" ").length === 1 && b.lines.join("").length <= 3) warn.push(`한 어절 자막: "${b.lines.join(" ")}"`);
    prev = b;
  }
  info.push(`자막 ${blocks.length}블록`);
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
