#!/usr/bin/env node
/**
 * 오디오 마감 (2026-09-30 품질 개선) — CTA 결합이 끝난 완성본에 적용한다. 화면은 그대로 복사(재인코딩 없음).
 *
 * 1) 음량 맞춤(항상): 2패스 loudnorm으로 -14 LUFS, 피크 -1 dBTP.
 *    실측(2026-09-30): 부엉박사 -22 LUFS(황소·금박사보다 약 7dB 작음), 황소 8·9편은 피크 +1.1~+3.1 dBTP(찢어짐 위험).
 * 2) 배경음(선택, --bgm <음원>): 나레이션이 나올 때 자동으로 작아지는 더킹(sidechaincompress) + 앞뒤 페이드.
 *    음원은 저작권이 확인된 것만 쓴다(Owner가 고른 파일). 음원 파일을 이 스크립트가 받아오지 않는다.
 * 3) 전환 효과음(선택, --sfx-cuts-from <tts-summary.json>): 씬 전환 지점마다 아주 작은 "휙" 소리.
 *    ffmpeg로 합성한 소리라 저작권 문제가 없다.
 *
 * 사용:
 *   node scripts/run-audio-finish-once.mjs --in C:/tmp/bull-ep11-final/owl_episode_final.mp4 \
 *     --out C:/tmp/bull-ep11-final/owl_episode_final_mastered.mp4 \
 *     [--bgm <음원.mp3> --bgm-db -26] [--sfx-cuts-from <…/elevenlabs-scene-paced-tts-summary.json> --sfx-db -24]
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";

const argv = process.argv.slice(2);
function getArg(name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
}
const IN = getArg("--in");
const OUT = getArg("--out");
const BGM = getArg("--bgm");
const BGM_DB = Number(getArg("--bgm-db") ?? -26);
const SFX_FROM = getArg("--sfx-cuts-from");
const SFX_DB = Number(getArg("--sfx-db") ?? -24);
const TARGET_LUFS = -14;
const TARGET_TP = -1;
if (!IN || !OUT) {
  console.error("ABORT: --in, --out 이 필요합니다.");
  process.exit(2);
}
if (BGM && !fs.existsSync(BGM)) {
  console.error(`ABORT: 배경음 파일이 없습니다: ${BGM}`);
  process.exit(2);
}

function run(args) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`ffmpeg 실패: ${r.stderr.slice(-800)}`);
  return `${r.stdout}\n${r.stderr}`;
}
const duration = Number(
  spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", IN], { encoding: "utf8" }).stdout.trim(),
);

// ── 믹스 그래프(배경음·효과음) ──
const inputs = ["-i", IN];
const parts = [];
let voice = "[0:a]";
let inputIndex = 1;
if (BGM) {
  inputs.push("-stream_loop", "-1", "-i", BGM);
  const b = inputIndex++;
  parts.push(
    `[${b}:a]atrim=0:${duration.toFixed(3)},asetpts=N/SR/TB,aformat=sample_rates=48000:channel_layouts=mono,volume=${BGM_DB}dB,` +
      `afade=t=in:d=1.2,afade=t=out:st=${Math.max(0, duration - 1.5).toFixed(3)}:d=1.5[bgm]`,
    `[0:a]asplit=2[vo][sc]`,
    `[bgm][sc]sidechaincompress=threshold=0.03:ratio=8:attack=15:release=350[bgmduck]`,
    `[vo][bgmduck]amix=inputs=2:normalize=0:duration=first[mix1]`,
  );
  voice = "[mix1]";
}
let cutTimes = [];
if (SFX_FROM) {
  const summary = JSON.parse(fs.readFileSync(SFX_FROM, "utf8"));
  cutTimes = summary.scenes.map((s) => s.startSec).filter((t) => t > 0.5 && t < duration - 0.5);
  cutTimes.forEach((t, i) => {
    parts.push(
      `anoisesrc=d=0.32:c=pink:a=0.5:r=48000,highpass=f=700,lowpass=f=5000,aformat=channel_layouts=mono,` +
        `afade=t=in:d=0.1,afade=t=out:st=0.12:d=0.2,volume=${SFX_DB}dB,adelay=${Math.round(Math.max(0, t - 0.16) * 1000)}[s${i}]`,
    );
  });
  if (cutTimes.length > 0) {
    parts.push(`${voice}${cutTimes.map((_, i) => `[s${i}]`).join("")}amix=inputs=${cutTimes.length + 1}:normalize=0:duration=first[mix2]`);
    voice = "[mix2]";
  }
}

// ── 1패스: 음량 측정 ──
const measureGraph = parts.length > 0 ? `${parts.join(";")};${voice}loudnorm=I=${TARGET_LUFS}:TP=${TARGET_TP}:LRA=11:print_format=json[m]` : null;
const measureText = measureGraph
  ? run([...inputs, "-filter_complex", measureGraph, "-map", "[m]", "-f", "null", "-"])
  : run(["-i", IN, "-af", `loudnorm=I=${TARGET_LUFS}:TP=${TARGET_TP}:LRA=11:print_format=json`, "-vn", "-f", "null", "-"]);
const m = JSON.parse(measureText.slice(measureText.lastIndexOf("{"), measureText.lastIndexOf("}") + 1));

// ── 2패스: 측정값으로 선형 보정 ──
const ln =
  `loudnorm=I=${TARGET_LUFS}:TP=${TARGET_TP}:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:` +
  `measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`;
const finalGraph = parts.length > 0 ? `${parts.join(";")};${voice}${ln}[out]` : `[0:a]${ln}[out]`;
run([...inputs, "-filter_complex", finalGraph, "-map", "0:v", "-map", "[out]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ac", "1", "-movflags", "+faststart", "-y", OUT]);

const check = run(["-i", OUT, "-af", `loudnorm=I=${TARGET_LUFS}:TP=${TARGET_TP}:print_format=json`, "-vn", "-f", "null", "-"]);
const after = JSON.parse(check.slice(check.lastIndexOf("{"), check.lastIndexOf("}") + 1));
console.log(`입력 ${Number(m.input_i).toFixed(1)} LUFS / 피크 ${Number(m.input_tp).toFixed(1)} dBTP → 결과 ${Number(after.input_i).toFixed(1)} LUFS / 피크 ${Number(after.input_tp).toFixed(1)} dBTP`);
console.log(`배경음: ${BGM ? `${BGM} (${BGM_DB}dB, 나레이션 더킹)` : "없음"} · 전환 효과음: ${cutTimes.length ? `${cutTimes.length}곳 (${SFX_DB}dB)` : "없음"}`);
console.log(`→ ${OUT}`);
