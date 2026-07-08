#!/usr/bin/env node
/**
 * run-owner-real-video-from-wizard-assets-once.mjs
 * task: owner-web-real-script-voice-visual-generation-pipeline-v1
 *
 * 웹 위저드 최종 영상 합성: 실제 ElevenLabs TTS(timeline mp3) + 실제 장면 이미지 6장 +
 * ASS 자막 + slow-zoom 모션 → 1080x1920 mp4. 로컬 ffmpeg/ffprobe만 사용한다.
 *
 * 입력 계약(fail-closed — 전부 만족해야 렌더 시작):
 *   --script        script-final.json (wizard_script_final_v1)
 *   --tts-script    tts-script.real.json (scene durationSec = 영상 scene 경계의 단일 소스)
 *   --audio-summary elevenlabs-scene-paced-tts-summary.json (provider=elevenlabs, liveApiCallPerformed=true)
 *   --images-dir    scene-01..06.png + scene-images-summary.json (allReady=true)
 *   --out-dir       repo 밖 C:\tmp 하위
 *
 * 산출: final-<slug>.mp4 + real-video-summary.json (ffprobe 검증값 + media quality gate).
 * 검증: 1080x1920 · duration 15~60s · audio+video stream · size>0 · scene 6.
 *
 * 보안: 외부 API/업로드/DB/OAuth/secret 접근 없음. spawnSync shell:false only.
 * exit codes: 0 = RENDER_MUX_OK · 1 = 렌더/검증 실패 · 2 = usage 오류 · 3 = 입력 미준비 차단
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}
const scriptArg = getArg("--script");
const ttsScriptArg = getArg("--tts-script");
const audioSummaryArg = getArg("--audio-summary");
const imagesDirArg = getArg("--images-dir");
const outDirArg = getArg("--out-dir");
if (!scriptArg || !ttsScriptArg || !audioSummaryArg || !imagesDirArg || !outDirArg) {
  console.error(
    "Usage: node run-owner-real-video-from-wizard-assets-once.mjs --script <script-final.json> --tts-script <tts-script.real.json> --audio-summary <summary.json> --images-dir <dir> --out-dir <dir>",
  );
  process.exit(2);
}
const OUT_DIR = path.resolve(outDirArg);

// 입력/출력 전부 C:\tmp\money-shorts-os\ 하위만 허용(fail-closed). ffmpeg/ffprobe 이전에 검사한다.
const MEDIA_ROOT_RE = /^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i;
const PATH_INPUTS = [
  ["--script", path.resolve(scriptArg)],
  ["--tts-script", path.resolve(ttsScriptArg)],
  ["--audio-summary", path.resolve(audioSummaryArg)],
  ["--images-dir", path.resolve(imagesDirArg)],
  ["--out-dir", OUT_DIR],
];
for (const [flag, abs] of PATH_INPUTS) {
  if (!MEDIA_ROOT_RE.test(abs + path.sep)) {
    console.error(`ABORT: ${flag} must be under C:\\tmp\\money-shorts-os\\. path: ${abs}`);
    process.exit(2);
  }
}
if (OUT_DIR.startsWith(REPO_ROOT + "\\") || OUT_DIR.startsWith(REPO_ROOT + "/")) {
  console.error("ABORT: --out-dir must be outside repo root.");
  process.exit(2);
}
if ([scriptArg, ttsScriptArg, audioSummaryArg, imagesDirArg, OUT_DIR].some((p) => String(p).includes(".money-shorts-local"))) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(2);
}

function log(m) { console.log(`[wizard-final-video] ${m}`); }
function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}
fs.mkdirSync(OUT_DIR, { recursive: true });
const SUMMARY_PATH = path.join(OUT_DIR, "real-video-summary.json");
function abortBlocked(code, note) {
  fs.writeFileSync(
    SUMMARY_PATH,
    JSON.stringify(
      { schemaVersion: "wizard_real_video_summary_v1", status: code, note, notUploaded: true, uploadReady: false },
      null,
      2,
    ),
    "utf8",
  );
  console.error(`ABORT(${code}): ${note}`);
  process.exit(3);
}

// ── 입력 검증 (fail-closed) ───────────────────────────────────────────────────
const record = readJson(path.resolve(scriptArg));
if (!record || record.schemaVersion !== "wizard_script_final_v1" || !Array.isArray(record.script?.scenes) || record.script.scenes.length !== 6) {
  abortBlocked("SCRIPT_FINAL_INVALID", "script-final.json(wizard_script_final_v1, scenes 6) 필요");
}
const ttsScript = readJson(path.resolve(ttsScriptArg));
if (!ttsScript || ttsScript.ttsProvider !== "elevenlabs" || !Array.isArray(ttsScript.scenes) || ttsScript.scenes.length !== 6) {
  abortBlocked("TTS_SCRIPT_INVALID", "tts-script.real.json(elevenlabs, scenes 6) 필요");
}
const audioSummary = readJson(path.resolve(audioSummaryArg));
if (
  !audioSummary ||
  audioSummary.provider !== "elevenlabs" ||
  audioSummary.liveApiCallPerformed !== true ||
  audioSummary.readinessFailure === true ||
  typeof audioSummary.timelineAudioPath !== "string"
) {
  abortBlocked("REAL_TTS_REQUIRED", "실제 ElevenLabs TTS summary(liveApiCallPerformed=true) 필요 — 테스트 소리 사용 불가");
}
const AUDIO_PATH = path.resolve(audioSummary.timelineAudioPath);
if (!fs.existsSync(AUDIO_PATH)) abortBlocked("REAL_TTS_REQUIRED", `timeline 오디오 파일 없음: ${AUDIO_PATH}`);

const IMAGES_DIR = path.resolve(imagesDirArg);
const imagesSummary = readJson(path.join(IMAGES_DIR, "scene-images-summary.json"));
if (!imagesSummary || imagesSummary.mode !== "chatgpt_playwright" || imagesSummary.allReady !== true) {
  abortBlocked("REAL_SCENE_IMAGES_REQUIRED", "실제 장면 이미지 summary(allReady=true) 필요 — placeholder/색상 카드 사용 불가");
}
const imageFiles = [];
for (let i = 1; i <= 6; i++) {
  const f = path.join(IMAGES_DIR, `scene-${String(i).padStart(2, "0")}.png`);
  if (!fs.existsSync(f)) abortBlocked("REAL_SCENE_IMAGES_REQUIRED", `scene 이미지 없음: ${f}`);
  imageFiles.push(f);
}

const scenes = ttsScript.scenes.slice().sort((a, b) => a.sceneNumber - b.sceneNumber);
const durations = scenes.map((s) => Number(s.durationSec));
if (durations.some((d) => !Number.isFinite(d) || d < 2 || d > 12)) {
  abortBlocked("TTS_SCRIPT_INVALID", "scene durationSec(2~12s) 형식 오류");
}
const totalSec = durations.reduce((a, b) => a + b, 0);
const safeSlug = String(record.topicId ?? "topic").replace(/[^a-z0-9-]/gi, "-").toLowerCase().slice(0, 60);

// ── ffmpeg/ffprobe helpers (shell:false) ─────────────────────────────────────
function runFfmpeg(ffArgs, label) {
  const r = spawnSync("ffmpeg", ffArgs, { shell: false, encoding: "utf8", timeout: 300000, maxBuffer: 32 * 1024 * 1024 });
  if (r.status !== 0) {
    console.error(`ABORT: ffmpeg ${label} failed (exit ${r.status}):\n${(r.stderr || "").slice(-1200)}`);
    process.exit(1);
  }
}
function ffprobeJson(target) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_streams", "-show_format", "-of", "json", target],
    { shell: false, encoding: "utf8", timeout: 60000 },
  );
  if (r.status !== 0) return null;
  try { return JSON.parse(r.stdout); } catch { return null; }
}

// ── step 1: 장면별 slow-zoom 세그먼트 (실제 이미지 → 1080x1920 cover + zoompan) ──
log(`scene segments: 6개, 총 ${totalSec}s (오디오 timeline ${audioSummary.timelineDurationSec ?? "?"}s)`);
const segFiles = [];
for (let i = 0; i < 6; i++) {
  const dur = durations[i];
  const frames = Math.round(dur * 30);
  const seg = path.join(OUT_DIR, `seg-${String(i + 1).padStart(2, "0")}.mp4`);
  segFiles.push(seg);
  // cover-crop을 1.5배 캔버스에서 수행한 뒤 zoompan으로 미세 zoom-in(±6%) — 정지 이미지 티를 없앤다.
  const vf =
    "scale=1620:2880:force_original_aspect_ratio=increase,crop=1620:2880," +
    `zoompan=z='min(1.0+0.0008*on,1.12)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=${frames}:s=1080x1920:fps=30,` +
    "format=yuv420p";
  runFfmpeg(
    ["-y", "-loop", "1", "-framerate", "30", "-i", imageFiles[i], "-vf", vf, "-frames:v", String(frames),
      "-c:v", "libx264", "-crf", "21", "-preset", "fast", "-an", seg],
    `segment scene-${i + 1}`,
  );
  log(`  seg-${i + 1}: ${dur}s (${frames}f)`);
}

// ── step 2: 세그먼트 concat (재인코딩 없음) ───────────────────────────────────
const concatList = path.join(OUT_DIR, "concat.txt");
fs.writeFileSync(concatList, segFiles.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n") + "\n", "utf8");
const silentPath = path.join(OUT_DIR, "silent-concat.mp4");
runFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", concatList, "-c", "copy", silentPath], "concat");

// ── step 3: ASS 자막 (기존 renderer의 검증된 스타일 — 한국어는 Malgun Gothic) ──
function secToAssTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.round((sec - Math.floor(sec)) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}
const assLines = [
  "[Script Info]",
  "ScriptType: v4.00+",
  "PlayResX: 1080",
  "PlayResY: 1920",
  "ScaledBorderAndShadow: yes",
  "",
  "[V4+ Styles]",
  "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
  "Style: Caption,Malgun Gothic,72,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,4,2,2,60,60,140,1",
  "",
  "[Events]",
  "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
];
let cursor = 0;
for (let i = 0; i < 6; i++) {
  const start = cursor;
  const end = cursor + durations[i] - 0.05;
  cursor += durations[i];
  const text = String(scenes[i].captionText ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}");
  assLines.push(`Dialogue: 0,${secToAssTime(start)},${secToAssTime(end)},Caption,,0,0,0,,${text}`);
}
const assPath = path.join(OUT_DIR, "captions.ass");
fs.writeFileSync(assPath, assLines.join("\n") + "\n", "utf8");

// ── step 4: 자막 burn + 실제 음성 mux → 최종 mp4 ─────────────────────────────
const finalPath = path.join(OUT_DIR, `final-${safeSlug}.mp4`);
const assFilter = `ass='${assPath.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:")}'`;
runFfmpeg(
  ["-y", "-i", silentPath, "-i", AUDIO_PATH,
    "-vf", assFilter,
    "-map", "0:v:0", "-map", "1:a:0",
    "-c:v", "libx264", "-crf", "21", "-preset", "fast", "-pix_fmt", "yuv420p", "-r", "30",
    "-c:a", "aac", "-b:a", "128k",
    "-t", String(totalSec), "-shortest",
    finalPath],
  "final mux",
);

// ── step 5: ffprobe 검증 + summary ───────────────────────────────────────────
const probe = ffprobeJson(finalPath);
const vStream = probe?.streams?.find((s) => s.codec_type === "video") ?? null;
const aStream = probe?.streams?.find((s) => s.codec_type === "audio") ?? null;
const durationSec = probe?.format?.duration ? Math.round(parseFloat(probe.format.duration) * 100) / 100 : null;
const sizeBytes = fs.existsSync(finalPath) ? fs.statSync(finalPath).size : 0;

const checks = {
  width1080: vStream?.width === 1080,
  height1920: vStream?.height === 1920,
  duration15to60: typeof durationSec === "number" && durationSec >= 15 && durationSec <= 60,
  hasVideoStream: vStream != null,
  hasAudioStream: aStream != null,
  fileSizePositive: sizeBytes > 0,
  sceneCount6: true,
};
const ok = Object.values(checks).every(Boolean);

const summary = {
  schemaVersion: "wizard_real_video_summary_v1",
  status: ok ? "RENDER_MUX_OK" : "RENDER_VALIDATION_FAILED",
  topicId: record.topicId ?? null,
  scriptMode: record.mode ?? null,
  finalMp4Path: finalPath,
  durationSec,
  width: vStream?.width ?? null,
  height: vStream?.height ?? null,
  hasVideoStream: vStream != null,
  hasAudioStream: aStream != null,
  videoCodec: vStream?.codec_name ?? null,
  audioCodec: aStream?.codec_name ?? null,
  sizeBytes,
  sceneCount: 6,
  audioProvider: "elevenlabs",
  imageMode: "chatgpt_playwright",
  sceneTimeline: scenes.map((s, i) => ({ sceneNumber: i + 1, startSec: s.startSec, endSec: s.endSec, durationSec: s.durationSec })),
  validation: checks,
  notUploaded: true,
  uploadReady: false, // 업로드 가능 여부는 서버 media quality gate + preflight + Owner 확인 게이트가 판정한다.
  generatedAt: new Date().toISOString(),
};
fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), "utf8");
log(`final mp4: ${finalPath}`);
log(`검증: ${JSON.stringify(checks)}`);
log(`summary: ${SUMMARY_PATH} (status=${summary.status})`);
process.exit(ok ? 0 : 1);
