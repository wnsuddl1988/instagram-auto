#!/usr/bin/env node
/**
 * 영상 클립 입 멈춤 시각 측정 (2026-09-30 품질 개선 — 싱크 파일럿·검수용).
 *
 * Veo 클립에는 Veo가 스스로 만든 음성 트랙이 들어 있다(10편 실측: 평균 약 -21dB, 0.4초 이상 무음 없음).
 * 그 음성은 캐릭터 입 움직임과 함께 생성되므로, 음성이 끝나는 시각 ≈ 입이 멈추는 시각으로 본다(추정치 —
 * 최종 판단은 프레임을 눈으로 확인). 이를 TTS 발화 끝(= 영상 프롬프트의 입 멈춤 시각)과 비교해
 * 입이 대사보다 오래 움직이는 클립을 표시한다.
 *
 * 사용:
 *   node scripts/check-clip-speech-timing-once.mjs --spec-module ./_bull-ep11-assembly-spec.mjs \
 *     --spec-export BULL_EP11_ASSEMBLY_SPEC --clip-dir C:/tmp/bull-ep11-videos \
 *     --tts-summary <…/elevenlabs-scene-paced-tts-summary.json> [--extra-suffix b]
 *   --extra-suffix b : 파일럿 B안 클립(bull_ep11_s2_motion_b.mp4 등)이 있으면 함께 측정
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
function getArg(name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
}
const SPEC_MODULE = getArg("--spec-module");
const SPEC_EXPORT = getArg("--spec-export");
const CLIP_DIR = getArg("--clip-dir");
const TTS_SUMMARY = getArg("--tts-summary");
const EXTRA = getArg("--extra-suffix");
const THRESHOLD_SEC = 0.4;
if (!SPEC_MODULE || !SPEC_EXPORT || !CLIP_DIR || !TTS_SUMMARY) {
  console.error("ABORT: --spec-module --spec-export --clip-dir --tts-summary 가 필요합니다.");
  process.exit(2);
}

const spec = (await import(new URL(SPEC_MODULE, import.meta.url).href))[SPEC_EXPORT];
const summary = JSON.parse(fs.readFileSync(TTS_SUMMARY, "utf8"));
const speechEndByScene = Object.fromEntries(summary.scenes.map((s) => [s.sceneNumber, s.spokenEndSec - s.startSec]));

function duration(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" });
  return Number(r.stdout.trim());
}
function hasAudio(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", file], { encoding: "utf8" });
  return r.stdout.trim().length > 0;
}
/** 마지막으로 소리가 끝나는 시각(뒤쪽 무음이 끝까지 이어지는 구간의 시작). 끝까지 소리가 나면 길이 그대로. */
function lastSoundEnd(file, total) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-i", file, "-af", "silencedetect=noise=-38dB:d=0.25", "-vn", "-f", "null", "-"], { encoding: "utf8" });
  const text = `${r.stdout}\n${r.stderr}`;
  const starts = [...text.matchAll(/silence_start: ([0-9.]+)/g)].map((m) => Number(m[1]));
  const ends = [...text.matchAll(/silence_end: ([0-9.]+)/g)].map((m) => Number(m[1]));
  const lastStart = starts.at(-1);
  if (lastStart === undefined) return total;
  const closedAfter = ends.some((e) => e > lastStart && e < total - 0.05);
  return closedAfter ? total : lastStart;
}

const rows = [];
for (const scene of spec.scenes) {
  const candidates = [scene.video];
  if (EXTRA) candidates.push(scene.video.replace(/\.mp4$/, `_${EXTRA}.mp4`));
  for (const name of candidates) {
    const file = path.join(CLIP_DIR, name);
    if (!fs.existsSync(file)) continue;
    const total = duration(file);
    const target = speechEndByScene[scene.scene];
    if (!hasAudio(file)) {
      rows.push({ name, target, soundEnd: null, over: null, note: "오디오 없음(측정 불가)" });
      continue;
    }
    const soundEnd = lastSoundEnd(file, total);
    const over = soundEnd - target;
    rows.push({ name, target, soundEnd, over, note: soundEnd >= total - 0.05 ? "끝까지 소리 남(=끝까지 말함 추정)" : "" });
  }
}

console.log("\n=== 클립별 입 멈춤 추정 (Veo 음성 끝 vs TTS 발화 끝) ===");
console.log("클립                              TTS끝   Veo음성끝  초과    판정");
let flagged = 0;
for (const r of rows) {
  const bad = r.over !== null && r.over > THRESHOLD_SEC;
  if (bad) flagged += 1;
  console.log(
    `${r.name.padEnd(34)}${r.target.toFixed(2).padStart(6)}  ${r.soundEnd === null ? "   -  " : r.soundEnd.toFixed(2).padStart(8)}  ${r.over === null ? "   -  " : (r.over >= 0 ? "+" : "") + r.over.toFixed(2).padStart(5)}  ${bad ? "⚠ 입이 대사보다 오래 움직임" : "OK"} ${r.note}`,
  );
}
console.log(`\n${rows.length}개 측정, 경고 ${flagged}개(기준 +${THRESHOLD_SEC}s). 추정치이므로 경고 클립은 발화 끝 직후 프레임을 눈으로 확인할 것.`);
