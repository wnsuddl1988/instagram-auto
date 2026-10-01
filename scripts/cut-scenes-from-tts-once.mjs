#!/usr/bin/env node
/**
 * 연속 TTS(m4a 1개)에서 연속한 씬 구간을 삭제하고 오디오·alignment·summary·tts-script를 한 번에 새로 만든다.
 * 절차 원문: 메모리 feedback_scene_deletion_requires_audio_alignment_rebuild (황소 7편 s12 삭제에서 검증).
 * 비밀값·네트워크·유료 API 없음(ffmpeg만 사용). 입력 폴더는 수정하지 않고 --out-dir 에 새로 쓴다.
 *
 * 사용:
 *   node scripts/cut-scenes-from-tts-once.mjs --dir <output-v1> --tts-script <tts-script.json> --out-dir <output-v2> \
 *     --delete 12,13 --audio-cut-start 79.60 --audio-cut-end 95.00
 *
 * --audio-cut-start / --audio-cut-end 는 반드시 "삭제 씬 앞 말소리가 끝난 뒤의 무음" / "다음 씬 말소리 시작 전의 무음" 안에 둔다
 *   (ffmpeg silencedetect로 직접 확인. 이 스크립트도 이음매 소리 크기를 측정해 보고한다).
 * 삭제 후 남은 씬은 1부터 다시 번호를 매기고(summary·tts-script의 sceneNumber, sceneKey 접두 sN_), 스펙도 같은 번호로 맞춰야 한다.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

const dir = arg("dir");
const ttsScriptPath = arg("tts-script");
const outDir = arg("out-dir");
const del = (arg("delete") || "").split(",").map(Number).filter(Boolean);
const cutA = Number(arg("audio-cut-start"));
const cutB = Number(arg("audio-cut-end"));
if (!dir || !ttsScriptPath || !outDir || !del.length || !(cutA > 0) || !(cutB > cutA)) {
  fail("필수 인자: --dir --tts-script --out-dir --delete 12,13 --audio-cut-start S --audio-cut-end E");
}
for (let i = 1; i < del.length; i++) if (del[i] !== del[i - 1] + 1) fail("삭제 씬은 연속 번호여야 한다");

const summaryPath = path.join(dir, "elevenlabs-scene-paced-tts-summary.json");
const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
const scenes = summary.scenes;
const first = scenes.findIndex((s) => s.sceneNumber === del[0]);
const last = scenes.findIndex((s) => s.sceneNumber === del[del.length - 1]);
if (first < 0 || last < 0 || last - first + 1 !== del.length) fail("삭제 씬 번호가 summary에 없다");
const nextScene = scenes[last + 1];
if (!nextScene) fail("마지막 씬 삭제는 지원하지 않는다(뒤 씬이 있어야 함)");
if (cutA < scenes[first - 1].spokenEndSec) fail(`audio-cut-start(${cutA})가 앞 씬 말소리 끝(${scenes[first - 1].spokenEndSec}) 앞이다`);
if (cutB > nextScene.spokenStartSec) fail(`audio-cut-end(${cutB})가 다음 씬 말소리 시작(${nextScene.spokenStartSec}) 뒤다`);

const audioIn = summary.timelineAudioPath;
const alignIn = summary.alignmentPath;
const baseName = path.basename(audioIn, path.extname(audioIn));
fs.mkdirSync(outDir, { recursive: true });
const audioOut = path.join(outDir, `${baseName}-cut${scenes.length - del.length}.m4a`);
const alignOut = path.join(outDir, `${baseName}-cut${scenes.length - del.length}.alignment.json`);
const summaryOut = path.join(outDir, "elevenlabs-scene-paced-tts-summary.json");

// 1) 오디오: [0,A] + [B,끝] 재인코딩 이어붙이기
const ff = spawnSync(
  "ffmpeg",
  [
    "-y", "-v", "error", "-i", audioIn,
    "-filter_complex",
    `[0:a]atrim=0:${cutA},asetpts=PTS-STARTPTS[a];[0:a]atrim=start=${cutB},asetpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=0:a=1[o]`,
    "-map", "[o]", "-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-ac", "1", audioOut,
  ],
  { encoding: "utf8" },
);
if (ff.status !== 0) fail(`ffmpeg 실패: ${ff.stderr}`);
const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", audioOut], { encoding: "utf8" });
const newDuration = Number(probe.stdout.trim());
const delta = cutB - cutA;
const oldDuration = summary.timelineDurationSec;
if (Math.abs(newDuration - (oldDuration - delta)) > 0.1) fail(`새 오디오 길이 ${newDuration} ≠ 기대 ${(oldDuration - delta).toFixed(3)}`);

// 이음매 소리 크기(±0.15초) — 무음이어야 한다
const seam = spawnSync("ffmpeg", ["-v", "info", "-ss", String(Math.max(0, cutA - 0.15)), "-t", "0.3", "-i", audioOut, "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf8" });
const maxVol = /max_volume:\s*(-?[\d.]+) dB/.exec(seam.stderr)?.[1];

// 2) alignment: 시작 시각이 [A, nextBlockStart) 인 글자 제거, 그 뒤는 delta 만큼 당김
const alignJson = JSON.parse(fs.readFileSync(alignIn, "utf8"));
const al = alignJson.alignment;
const nextBlockStart = nextScene.startSec - 0.4; // 다음 씬 "[tag]\n" 글자 시작 이전(태그는 씬 첫 글자보다 0.3~0.4초 앞) — 아래에서 태그 시작을 직접 찾는다
let tagStartIdx = -1;
for (let i = 0; i < al.characters.length; i++) {
  if (al.character_start_times_seconds[i] >= nextBlockStart && al.characters[i] === "[") { tagStartIdx = i; break; }
}
const removeToTime = tagStartIdx >= 0 ? al.character_start_times_seconds[tagStartIdx] : nextScene.startSec;
const chars = [], st = [], en = [];
let removed = 0;
for (let i = 0; i < al.characters.length; i++) {
  const s = al.character_start_times_seconds[i];
  if (s >= cutA && s < removeToTime) { removed++; continue; }
  const shift = s >= removeToTime ? delta : 0;
  chars.push(al.characters[i]);
  st.push(Number((s - shift).toFixed(3)));
  en.push(Number((al.character_end_times_seconds[i] - shift).toFixed(3)));
}
alignJson.alignment = { characters: chars, character_start_times_seconds: st, character_end_times_seconds: en };
fs.writeFileSync(alignOut, JSON.stringify(alignJson));

// 3) summary
const shifted = (v) => Number((v - delta).toFixed(3));
const kept = scenes.filter((s) => !del.includes(s.sceneNumber));
const prevIdx = first - 1;
kept.forEach((s, i) => {
  if (i > prevIdx) {
    for (const k of ["startSec", "endSec", "spokenStartSec", "spokenEndSec"]) s[k] = shifted(s[k]);
  }
});
kept[prevIdx].endSec = kept[prevIdx + 1].startSec; // 삭제 구간 앞 씬의 끝 = 다음 씬 시작(공백 없이 이어짐)
kept.forEach((s, i) => {
  s.sceneNumber = i + 1;
  s.audioPath = audioOut;
  s.normalizedAudioPath = audioOut;
});
summary.scenes = kept;
summary.sceneCount = kept.length;
summary.timelineAudioPath = audioOut;
summary.alignmentPath = alignOut;
summary.timelineDurationSec = Number(newDuration.toFixed(2));
summary.targetDurationSec = Number(newDuration.toFixed(2));
summary.cutAudit = { deletedScenes: del, audioCutStartSec: cutA, audioCutEndSec: cutB, removedSec: Number(delta.toFixed(3)), sourceSummary: summaryPath };
fs.writeFileSync(summaryOut, JSON.stringify(summary, null, 2));

// 4) tts-script: 삭제 씬 제거 + 번호 재부여
const tts = JSON.parse(fs.readFileSync(ttsScriptPath, "utf8"));
const ttsOutPath = path.join(outDir, path.basename(ttsScriptPath));
const ttsKept = tts.scenes.filter((s) => !del.includes(s.sceneNumber));
ttsKept.forEach((s, i) => {
  const n = i + 1;
  if (typeof s.sceneKey === "string") s.sceneKey = s.sceneKey.replace(/^s\d+_/, `s${n}_`);
  s.sceneNumber = n;
});
tts.scenes = ttsKept;
fs.writeFileSync(ttsOutPath, JSON.stringify(tts, null, 2));

// 5) 검증: 남은 씬 첫 글자 시각이 새 startSec 과 맞는지(오디오와 어긋나면 여기서 드러난다)
console.log(`삭제 씬 ${del.join(",")} · 오디오 컷 ${cutA}~${cutB}s(${delta.toFixed(3)}초 제거)`);
console.log(`오디오 ${oldDuration}s → ${newDuration.toFixed(3)}s · 이음매 ±0.15s 최대 볼륨 ${maxVol ?? "?"} dB(−30 이하면 무음)`);
console.log(`alignment 글자 ${al.characters.length} → ${chars.length}(제거 ${removed})`);
console.log(`summary 씬 ${scenes.length} → ${kept.length}, tts-script 씬 ${tts.scenes.length}`);
console.log(`출력: ${outDir}`);
let bad = 0;
const lastEnd = kept[kept.length - 1].endSec;
if (Math.abs(lastEnd - newDuration) > 0.1) { bad++; console.log(`✖ 마지막 씬 끝 ${lastEnd} ≠ 오디오 길이 ${newDuration.toFixed(3)}`); }
for (let i = 1; i < kept.length; i++) {
  if (Math.abs(kept[i].startSec - kept[i - 1].endSec) > 0.02) { bad++; console.log(`✖ 씬 ${i} 끝 ${kept[i - 1].endSec} ≠ 씬 ${i + 1} 시작 ${kept[i].startSec}`); }
  const j = st.findIndex((t, idx) => t >= kept[i].startSec - 0.02 && !/[\s\[\]]/.test(chars[idx]) && /[가-힣0-9A-Za-z]/.test(chars[idx]));
  if (j < 0 || Math.abs(st[j] - kept[i].startSec) > 0.1) { bad++; console.log(`✖ 씬 ${i + 1} 첫 글자 시각(${st[j]}) ≠ startSec ${kept[i].startSec}`); }
}
console.log(bad ? `검증 실패 ${bad}건` : "검증 통과: 씬 경계 연속·마지막 씬 끝=오디오 길이·씬 첫 글자 시각 일치");
process.exit(bad ? 1 : 0);
