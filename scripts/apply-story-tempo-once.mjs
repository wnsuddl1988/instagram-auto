#!/usr/bin/env node
/**
 * 스토리형 TTS 속도 마감 (2026-10-07, `_ai/story-format-structure-v1.md` §8 — TTS 속도 1.1 + 전체 1.15배).
 *
 * TTS(및 필요하면 alignment 보정) 뒤, 조립 전에 실행한다:
 *   ⓪ (선택) 장면 끝 쉼 상한: --max-scene-gap 0.45 → 장면마다 "말 끝 → 다음 장면 시작" 쉼을 최대 0.45초로 줄인다.
 *      긴장용 쉼은 --keep-gap-scenes 4,11,14 로 그대로 둔다. (금 모으기 1차 TTS에서 장면 끝 쉼이 평균 0.9초·합계 15.8초라
 *      균일 가속만으로는 96.6초 — Owner 기준 60~90초 초과. 말 속도는 건드리지 않고 장면 사이 빈 시간만 줄인다.)
 *   ① 음성 전체를 같은 비율로 빠르게(ffmpeg atempo — 음높이 유지).
 *   ② alignment 글자 시각을 쉼 줄인 만큼 당기고 ÷factor.
 *   ③ 요약의 씬 시각·길이(…Sec 필드)를 같은 방식으로, 오디오·alignment 경로를 새 파일로.
 * 원본은 그대로 두고 <요약 폴더>/tempo-<factor>[-gap<초>]/ 에 새로 쓴다. 조립·CTA 결합·QA에는 새 요약·alignment를 쓴다.
 *
 * 사용: node scripts/apply-story-tempo-once.mjs --tts-summary <…summary(.audio-fixed).json> [--factor 1.15]
 *        [--max-scene-gap 0.45 --keep-gap-scenes 4,11,14]
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const arg = (name, def) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : def;
};
const SUMMARY = arg("--tts-summary");
const FACTOR = Number(arg("--factor", "1.15"));
const MAX_GAP = arg("--max-scene-gap") === undefined ? null : Number(arg("--max-scene-gap"));
const KEEP = new Set(String(arg("--keep-gap-scenes", "")).split(",").filter(Boolean).map(Number));
// --first-start <초>: 첫 장면을 0초가 아니라 이 시각(원본 오디오 기준)부터 자른다. eleven_v3가 맨 앞 오디오 태그("[curious]")를 소리로 읽어
// 한국어 첫 발화(spokenStartSec)가 1초 넘게 밀린 편(스토리 4편, 2026-10-10 Owner "맨 앞에 CURES 같은 영어가 들린다")에서만 쓴다.
// 값 = 한국어 첫 글자 시작 − 0.12(pre-roll). 기본값 없음(기존 편은 그대로 0초부터).
const FIRST_START = arg("--first-start") === undefined ? null : Number(arg("--first-start"));
if (FIRST_START !== null && !(FIRST_START >= 0 && FIRST_START <= 3)) {
  console.error("ABORT: --first-start 는 0~3초");
  process.exit(2);
}
if (!SUMMARY || !fs.existsSync(SUMMARY)) {
  console.error("ABORT: --tts-summary <요약 json> 필요");
  process.exit(2);
}
if (!(FACTOR >= 1 && FACTOR <= 1.3)) {
  console.error("ABORT: --factor 는 1.0~1.3");
  process.exit(2);
}
if (MAX_GAP !== null && !(MAX_GAP >= 0.2 && MAX_GAP <= 1.5)) {
  console.error("ABORT: --max-scene-gap 은 0.2~1.5초");
  process.exit(2);
}

const sum = JSON.parse(fs.readFileSync(SUMMARY, "utf8"));
const tag = `tempo${FACTOR}${MAX_GAP !== null ? `-gap${MAX_GAP}` : ""}${Number(arg("--preroll", "0.12")) > 0 ? "-pre" : ""}${FIRST_START !== null ? `-first${FIRST_START}` : ""}`;
const outDir = path.join(path.dirname(SUMMARY), tag.replace("tempo", "tempo-"));
fs.mkdirSync(outDir, { recursive: true });

// ⓪-0 실제 첫 소리 시각(2026-10-07 Owner "첫 발화가 씹혀서 들린다"): eleven_v3 alignment의 장면 발화 시작은 실제 소리보다 0.06~0.26초 늦다.
//     쉼을 자르는 구간이 alignment 시작(startSec)까지라 다음 장면 첫 소리의 앞부분이 쉼과 함께 잘려 나갔다(스토리 1편 17장면 중 15장면).
//     그래서 장면 경계를 "실제 첫 소리 − PREROLL"로 앞당긴다(앞 장면 말끝 + 0.05초보다는 앞으로 안 당김).
const PREROLL = Number(arg("--preroll", "0.12"));
const onsetBySceneIndex = new Map();
if (PREROLL > 0) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-i", sum.timelineAudioPath, "-af", "silencedetect=noise=-34dB:d=0.1", "-vn", "-f", "null", "-"], { encoding: "utf8" });
  const ends = [...r.stderr.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  sum.scenes.forEach((sc, i) => {
    if (i === 0) return;
    const cand = ends.filter((e) => Math.abs(e - sc.spokenStartSec) < 0.8).sort((a, b) => Math.abs(a - sc.spokenStartSec) - Math.abs(b - sc.spokenStartSec))[0];
    if (cand !== undefined) onsetBySceneIndex.set(i, cand);
  });
}
const startOf = (i) => {
  const sc = sum.scenes[i];
  // 첫 장면은 항상 0초부터 — alignment 보정이 s1 start를 0.27초로 밀어 두면 그만큼 첫 소리("미국")가 잘려 나간다(스토리 6편 사고, 실제 첫 소리는 0.055초).
  if (i === 0) return FIRST_START ?? 0;
  if (PREROLL <= 0) return sc.startSec;
  const onset = Math.min(sc.spokenStartSec, onsetBySceneIndex.get(i) ?? sc.spokenStartSec);
  const prevSpokenEnd = sum.scenes[i - 1].spokenEndSec;
  return Math.min(sc.startSec, Math.max(onset - PREROLL, prevSpokenEnd + 0.05));
};

// ⓪ 남길 구간: 장면마다 [start, keepEnd) — 장면 경계(start)는 실제 첫 소리 기준(위), 마지막 장면 끝은 요약 값
const segs = sum.scenes.map((sc, i) => {
  const isLast = i === sum.scenes.length - 1;
  const start = startOf(i);
  const end = isLast ? sc.endSec : startOf(i + 1);
  const gap = end - sc.spokenEndSec;
  const cut = MAX_GAP !== null && !isLast && !KEEP.has(sc.sceneNumber) && gap > MAX_GAP;
  return { n: sc.sceneNumber, start, end, keepEnd: cut ? Math.min(sc.spokenEndSec + MAX_GAP, end) : end };
});
// 첫 장면 시작이 0이 아니면(alignment 보정으로 s1 start가 0.27초처럼 밀린 경우) 그 앞 구간도 잘려 나가므로 제거량에 넣는다.
// 넣지 않으면 오디오는 앞이 잘려 짧아지는데 요약·alignment 시각은 그만큼 늦게 남아 자막이 음성보다 늦어진다(스토리 6편 사고).
let removedBefore = segs[0]?.start ?? 0;
for (const s of segs) {
  s.shift = removedBefore;
  removedBefore += s.end - s.keepEnd;
}
const removedTotal = removedBefore;
const segOf = (t) => segs.find((s) => t < s.end) ?? segs[segs.length - 1];
// 원래 시각 → 새 시각(쉼 제거 후, 가속 전). 잘린 빈 구간 안의 시각은 남긴 끝으로 붙인다.
const remap = (t) => {
  const s = segOf(t);
  return Math.max(0, Math.min(t, s.keepEnd) - s.shift);
};
const fin = (t) => +(remap(t) / FACTOR).toFixed(3);

// ① 오디오
const audioIn = sum.timelineAudioPath;
const audioOut = path.join(outDir, path.basename(audioIn).replace(/\.\w+$/, `.${tag}.m4a`));
let filter;
if (removedTotal > 0.001) {
  const parts = segs.map((s, i) => `[0:a]atrim=start=${s.start.toFixed(3)}:end=${s.keepEnd.toFixed(3)},asetpts=PTS-STARTPTS[a${i}]`);
  filter = `${parts.join(";")};${segs.map((_, i) => `[a${i}]`).join("")}concat=n=${segs.length}:v=0:a=1[cat];[cat]atempo=${FACTOR}[out]`;
} else {
  filter = `[0:a]atempo=${FACTOR}[out]`;
}
execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", audioIn, "-filter_complex", filter, "-map", "[out]", "-c:a", "aac", "-b:a", "192k", audioOut]);
const probeSec = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", audioOut]).toString().trim());

// ② alignment
const al = JSON.parse(fs.readFileSync(sum.alignmentPath, "utf8"));
const a = al.alignment;
const alOut = path.join(outDir, path.basename(sum.alignmentPath).replace(/\.alignment\.json$/, `.${tag}.alignment.json`));
fs.writeFileSync(alOut, JSON.stringify({
  ...al,
  tempoFactor: FACTOR,
  maxSceneGapSec: MAX_GAP,
  tempoFrom: sum.alignmentPath,
  alignment: {
    ...a,
    character_start_times_seconds: a.character_start_times_seconds.map(fin),
    character_end_times_seconds: a.character_end_times_seconds.map(fin),
  },
}) + "\n");

// ③ 요약 — 씬 시각은 remap 후 ÷factor, 길이 필드는 새 시각에서 다시 계산
const newTotal = +((sum.timelineDurationSec - removedTotal) / FACTOR).toFixed(3);
const scenes = sum.scenes.map((sc, i) => {
  const s = segs[i];
  const startSec = +((s.start - s.shift) / FACTOR).toFixed(3);
  const endSec = +((s.keepEnd - s.shift) / FACTOR).toFixed(3);
  const out = { ...sc };
  for (const [k, v] of Object.entries(sc)) if (typeof v === "number" && /Sec$/.test(k) && !/Duration/.test(k)) out[k] = fin(v);
  out.startSec = startSec;
  out.endSec = i === sum.scenes.length - 1 ? newTotal : endSec;
  const dur = +(out.endSec - out.startSec).toFixed(3);
  for (const k of ["targetDurationSec", "normalizedDurationSec"]) if (typeof sc[k] === "number") out[k] = dur;
  if (typeof sc.rawAudioDurationSec === "number") out.rawAudioDurationSec = +(sc.rawAudioDurationSec / FACTOR).toFixed(3);
  out.audioPath = audioOut;
  out.normalizedAudioPath = audioOut;
  return out;
});
const out = {
  ...sum,
  targetDurationSec: newTotal,
  timelineDurationSec: newTotal,
  timelineAudioPath: audioOut,
  alignmentPath: alOut,
  scenes,
  tempoFactor: FACTOR,
  maxSceneGapSec: MAX_GAP,
  keepGapScenes: [...KEEP],
  removedGapSec: +removedTotal.toFixed(3),
  tempoFrom: SUMMARY,
  tempoAppliedAt: new Date().toISOString(),
};
const sumOut = path.join(outDir, path.basename(SUMMARY).replace(/\.json$/, `.${tag}.json`));
fs.writeFileSync(sumOut, JSON.stringify(out, null, 2) + "\n");

const drift = Math.abs(probeSec - newTotal);
console.log(`=== 스토리형 속도 마감 ×${FACTOR}${MAX_GAP !== null ? ` · 장면 끝 쉼 최대 ${MAX_GAP}초(유지: ${[...KEEP].join(",") || "없음"})` : ""} ===`);
if (MAX_GAP !== null) console.log(`줄인 쉼 합계 ${removedTotal.toFixed(2)}초(가속 전)`);
console.log(`오디오 ${sum.timelineDurationSec}초 → ${probeSec.toFixed(2)}초 (요약 예상 ${newTotal}초, 차이 ${drift.toFixed(3)}초)`);
console.log(`요약: ${sumOut}`);
console.log(`alignment: ${alOut}`);
if (drift > 0.15) {
  console.error("FAIL: 처리 뒤 실제 길이와 요약 길이가 0.15초 넘게 다르다 — 사용하지 말고 원인 확인");
  process.exit(1);
}
