#!/usr/bin/env node
/**
 * 부엉 통합 52~56편 조립 한 번에(2026-10-13) — CURRENT_STANDARDS §A-7 순서 그대로:
 * TTS alignment 보정 → 본편 조립 → CTA 결합 → 워터마크 제거 → 오디오 마감 → 편 QA.
 * 사용: node scripts/owl-batch-1015-assemble.mjs --ep 29 [--from fix|assemble|cta|nowm|master|qa] [--clip-dir C:/tmp/owl-ep29-videos]
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const A = process.argv.slice(2);
const arg = (n, d) => { const i = A.indexOf(n); return i >= 0 ? A[i + 1] : d; };
const EP = Number(arg("--ep", "0"));
if (!EP) { console.error("ABORT: --ep 필요"); process.exit(2); }
const FROM = arg("--from", "fix");
const ORDER = ["fix", "assemble", "cta", "nowm", "master", "qa"];
const start = ORDER.indexOf(FROM);
const TTS_DIR = `C:/tmp/money-shorts-os/owl-ep${EP}-tts`;
const OUT1 = `${TTS_DIR}/output-v1`;
const SUMMARY = `${OUT1}/elevenlabs-scene-paced-tts-summary.json`;
const TTS_SCRIPT = `${TTS_DIR}/owl-ep${EP}-tts-script.json`;
const CLIPS = arg("--clip-dir", `C:/tmp/owl-ep${EP}-videos`);
const ASM = `C:/tmp/owl-ep${EP}-assembly-v1`;
const FINAL_DIR = `C:/tmp/owl-ep${EP}-final`;
const SPEC_MOD = `./_owl-v2-ep${EP}-assembly-spec.mjs`;
const SPEC_EXP = `OWL_EP${EP}_ASSEMBLY_SPEC`;
const CTA = "C:/tmp/owl-cta-fixed-v3/owl_cta_fixed_v3_final_layout_v2.mp4";
const log = (m) => console.log(`[ep${EP}] ${m}`);
const run = (label, args) => {
  log(`▶ ${label}`);
  const r = spawnSync(process.execPath, args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  fs.mkdirSync(FINAL_DIR, { recursive: true });
  fs.appendFileSync(`${FINAL_DIR}/pipeline.log`, `\n===== ${label} =====\n${out}\n`);
  console.log(out.split("\n").slice(-14).join("\n"));
  return { status: r.status, out };
};
const need = (r, label) => { if (r.status !== 0) { console.error(`ABORT: ${label} 실패(코드 ${r.status})`); process.exit(1); } };
const stepOn = (s) => ORDER.indexOf(s) >= start;

let summary = SUMMARY;
if (stepOn("fix")) {
  // 기준 0.1초(2026-10-14 55편: 장면마다 0.1~0.26초씩 늦게 기록돼 기본 0.3초로는 안 잡히고 첫 단어 자막이 늦게 떴다 → 스토리 편에서 검증한 0.1초). 끝 글자 붕괴는 스크립트가 따로 자동 보정.
  const r = run("TTS alignment 보정", ["scripts/fix-tts-alignment-from-audio-once.mjs", "--tts-summary", SUMMARY, "--tts-script", TTS_SCRIPT, "--threshold", "0.1"]);
  need(r, "alignment 보정");
}
const fixed = SUMMARY.replace(/\.json$/, ".audio-fixed.json");
if (fs.existsSync(fixed)) summary = fixed;
log(`사용 요약: ${summary}`);

// alignment 파일
const alignDir = OUT1;
const aligns = fs.readdirSync(alignDir).filter((f) => /\.alignment\.json$/.test(f));
const alignment = path.join(alignDir, aligns.find((f) => /audio-fixed/.test(f)) ?? aligns[0]).replace(/\\/g, "/");
log(`alignment: ${alignment}`);

if (stepOn("assemble")) {
  need(run("본편 조립", ["scripts/run-owl-assemble-shorts-v2.mjs", "--spec-module", SPEC_MOD, "--spec-export", SPEC_EXP, "--clip-dir", CLIPS, "--audio-summary", summary, "--tts-script", TTS_SCRIPT, "--out-dir", ASM]), "본편 조립");
}
const asmVideo = `${ASM}/owl_shorts_final.mp4`;
const probe = spawnSync("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=duration", "-of", "default=nw=1:nk=1", asmVideo], { encoding: "utf8" });
const mainAudioSec = Number(probe.stdout.trim());
log(`본편 오디오 ${mainAudioSec}초`);

if (stepOn("cta")) {
  need(run("CTA 결합", ["scripts/run-owl-episode-with-fixed-cta-once.mjs", "--spec-module", SPEC_MOD, "--spec-export", SPEC_EXP, "--assembled", asmVideo, "--scene8-start", String(mainAudioSec), "--cta-clip", CTA, "--alignment", alignment, "--out-dir", FINAL_DIR]), "CTA 결합");
}
if (stepOn("nowm")) {
  need(run("워터마크 제거", ["scripts/run-remove-veo-watermark-once.mjs", "--in", `${FINAL_DIR}/owl_episode_final.mp4`, "--out", `${FINAL_DIR}/owl_episode_final_nowm.mp4`]), "워터마크 제거");
}
if (stepOn("master")) {
  need(run("오디오 마감", ["scripts/run-audio-finish-once.mjs", "--in", `${FINAL_DIR}/owl_episode_final_nowm.mp4`, "--out", `${FINAL_DIR}/owl_episode_final_mastered.mp4`]), "오디오 마감");
}
if (stepOn("qa")) {
  const r = run("편 QA", ["scripts/run-episode-qa-once.mjs", "--spec-module", SPEC_MOD, "--spec-export", SPEC_EXP, "--tts-summary", summary, "--assembly-dir", ASM, "--final", `${FINAL_DIR}/owl_episode_final_mastered.mp4`, "--clip-dir", CLIPS, "--images-dir", `C:/tmp/owl-ep${EP}-images`]);
  log(`QA 종료 코드 ${r.status} — 보고서 ${FINAL_DIR}/qa-report.md`);
}
log("끝");
