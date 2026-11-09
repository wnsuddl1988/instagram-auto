#!/usr/bin/env node

/**
 * 부엉이 쇼츠 조립기 — 8개 클립 + (선택) TTS 음성 + 숫자 오버레이 → 최종 1본.
 *
 * 처리 순서(장면마다):
 *   1. 소스 클립을 1080x1920으로 업스케일 (소스는 720x1280)
 *   2. TTS 음성이 있으면 그 길이로 영상을 자른다 — 말과 화면을 맞추기 위함.
 *      음성이 영상보다 길면 마지막 프레임을 정지 상태로 늘린다(tpad).
 *   3. 숫자 오버레이를 drawtext로 얹는다 (HC-10: 이미지에 굽지 않고 여기서 합성)
 *   4. 장면별 mp4로 인코딩
 * 마지막에 concat demuxer로 8개를 이어 최종 1본을 만든다.
 *
 * TTS 음성이 없으면 --no-audio 모드로 동작한다. 영상 흐름만 먼저 확인하거나,
 * 음성을 나중에 붙일 때 쓴다.
 *
 * TTS 오디오 입력은 두 형태를 지원한다:
 *   (a) --audio-dir : owl_s1_hook.mp3 … owl_s8_closing.mp3 형식의 장면별 개별 파일
 *   (b) --audio-summary : run-owner-command-with-local-env-no-log.mjs owl-tts 가
 *       내놓는 elevenlabs-scene-paced-tts-summary.json. 8장면이 하나의 연속
 *       mp3/m4a로 생성되고 scenes[].startSec/endSec 으로 문자 정렬 기반 씬 경계만
 *       제공되므로, 여기서 그 구간을 ffmpeg -ss/-to 로 잘라 장면별 오디오를 만든다.
 *
 * 사용:
 *   node scripts/run-owl-assemble-shorts-v1.mjs --no-audio
 *   node scripts/run-owl-assemble-shorts-v1.mjs --audio-dir C:/tmp/owl-tts
 *   node scripts/run-owl-assemble-shorts-v1.mjs --audio-summary C:/tmp/money-shorts-os/owl-tts/out/elevenlabs-scene-paced-tts-summary.json
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { OWL_ASSEMBLY_SPEC } from "./_owl-assembly-spec.mjs";

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const CLIP_DIR = getArg("--clip-dir") || "C:/tmp/owl-motion-final";
const AUDIO_DIR = getArg("--audio-dir");
const AUDIO_SUMMARY = getArg("--audio-summary");
const OUT_DIR = getArg("--out-dir") || "C:/tmp/owl-assembly";
const NO_AUDIO = process.argv.includes("--no-audio");
// 한글 렌더 가능한 폰트. drawtext는 드라이브 콜론을 이스케이프해야 한다.
const FONT_PATH = getArg("--font") || "C:/Windows/Fonts/malgunbd.ttf";

if (!NO_AUDIO && !AUDIO_DIR && !AUDIO_SUMMARY) {
  console.error("ABORT: --audio-dir, --audio-summary 중 하나를 주거나 --no-audio 를 명시하세요.");
  process.exit(2);
}
if (AUDIO_DIR && AUDIO_SUMMARY) {
  console.error("ABORT: --audio-dir 와 --audio-summary 는 동시에 줄 수 없습니다.");
  process.exit(2);
}
if (!fs.existsSync(FONT_PATH)) {
  console.error(`ABORT: 폰트를 찾을 수 없습니다: ${FONT_PATH}`);
  process.exit(2);
}

// --audio-summary: 연속 TTS 오디오를 scenes[].startSec/endSec 구간으로 잘라
// C:/tmp/owl-assembly/tts-scenes/ 아래에 owl_<key>.m4a 로 떨어뜨린다. 그 뒤로는
// --audio-dir 경로와 동일하게 취급한다(둘 다 owl_<key>.<ext> 규약).
let sceneAudioDir = AUDIO_DIR;
if (AUDIO_SUMMARY) {
  if (!fs.existsSync(AUDIO_SUMMARY)) {
    console.error(`ABORT: summary 파일을 찾을 수 없습니다: ${AUDIO_SUMMARY}`);
    process.exit(1);
  }
  const summary = JSON.parse(fs.readFileSync(AUDIO_SUMMARY, "utf8"));
  if (!Array.isArray(summary.scenes) || summary.scenes.length === 0) {
    console.error(`ABORT: summary에 scenes 배열이 없습니다: ${AUDIO_SUMMARY}`);
    process.exit(1);
  }
  const timelineAudioPath = summary.timelineAudioPath;
  if (!timelineAudioPath || !fs.existsSync(timelineAudioPath)) {
    console.error(`ABORT: timelineAudioPath 를 찾을 수 없습니다: ${timelineAudioPath}`);
    process.exit(1);
  }

  sceneAudioDir = path.join(OUT_DIR, "tts-scenes");
  fs.mkdirSync(sceneAudioDir, { recursive: true });

  for (const s of summary.scenes) {
    const spec = OWL_ASSEMBLY_SPEC.scenes.find((sp) => sp.scene === s.sceneNumber);
    if (!spec) {
      console.error(`ABORT: summary sceneNumber ${s.sceneNumber} 에 대응하는 스펙이 없습니다.`);
      process.exit(1);
    }
    const startSec = Number(s.startSec);
    const endSec = Number(s.endSec);
    if (!Number.isFinite(startSec) || !Number.isFinite(endSec) || endSec <= startSec) {
      console.error(`ABORT: summary scene ${s.sceneNumber} 의 startSec/endSec 이 올바르지 않습니다.`);
      process.exit(1);
    }
    const outAudio = path.join(sceneAudioDir, `owl_${spec.key}.m4a`);
    const r = spawnSync("ffmpeg", [
      "-y", "-i", timelineAudioPath,
      "-ss", startSec.toFixed(3), "-to", endSec.toFixed(3),
      "-c:a", "aac", "-b:a", "192k",
      outAudio,
    ], { encoding: "utf8" });
    if (r.status !== 0) {
      console.error(`FAILED: ffmpeg scene-cut ${spec.key}`);
      console.error((r.stderr || "").slice(-1000));
      process.exit(1);
    }
  }
  console.log(`[assemble] --audio-summary 로 씬 경계 분리 완료 → ${sceneAudioDir}`);
}

const { render, scenes } = OWL_ASSEMBLY_SPEC;
const SCENE_DIR = path.join(OUT_DIR, "scenes");
fs.mkdirSync(SCENE_DIR, { recursive: true });

function log(m) {
  console.log(`[${new Date().toISOString().slice(11, 19)}][assemble] ${m}`);
}

function run(bin, args) {
  const r = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 32 });
  if (r.status !== 0) {
    console.error(`FAILED: ${bin} ${args.slice(0, 6).join(" ")} …`);
    console.error((r.stderr || "").slice(-1500));
    process.exit(1);
  }
  return r.stdout ?? "";
}

function probeDuration(file) {
  const out = run("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", file,
  ]);
  const d = Number.parseFloat(out.trim());
  if (!Number.isFinite(d)) {
    console.error(`ABORT: duration을 읽지 못했습니다: ${file}`);
    process.exit(1);
  }
  return d;
}

// drawtext는 콜론·따옴표·백슬래시를 이스케이프해야 한다. 폰트 경로의 드라이브
// 콜론도 마찬가지다(C:/... → C\:/...).
function escapeDrawtextValue(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'").replace(/%/g, "\\%");
}
const FONT_FOR_FILTER = FONT_PATH.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");

const OVERLAY_STYLE = {
  label: { color: "white", box: 1, boxcolor: "black@0.55", boxborderw: 14 },
  value: { color: "white", box: 1, boxcolor: "black@0.65", boxborderw: 16 },
  accent: { color: "#FFC400", box: 1, boxcolor: "black@0.65", boxborderw: 16 },
};

function buildOverlayFilters(overlays) {
  return overlays.map((o) => {
    const style = OVERLAY_STYLE[o.kind] ?? OVERLAY_STYLE.label;
    const parts = [
      `fontfile='${FONT_FOR_FILTER}'`,
      `text='${escapeDrawtextValue(o.text)}'`,
      `x=${Math.round(o.x)}`,
      `y=${Math.round(o.y)}`,
      `fontsize=${Math.round(o.size)}`,
      `fontcolor=${style.color}`,
      `box=${style.box}`,
      `boxcolor=${style.boxcolor}`,
      `boxborderw=${style.boxborderw}`,
      "expansion=none",
    ];
    return `drawtext=${parts.join(":")}`;
  });
}

const sceneOutputs = [];
const timeline = [];
let cursor = 0;

for (const scene of scenes) {
  const clip = path.join(CLIP_DIR, scene.video);
  if (!fs.existsSync(clip)) {
    console.error(`ABORT: 클립이 없습니다: ${clip}`);
    process.exit(1);
  }

  const clipDuration = probeDuration(clip);
  let audioFile = null;
  let targetDuration = clipDuration;

  if (!NO_AUDIO) {
    // 여러 확장자를 허용한다 — TTS 단계가 mp3/m4a/wav 중 무엇을 내든 받아들인다.
    for (const ext of [".mp3", ".m4a", ".wav"]) {
      const candidate = path.join(sceneAudioDir, `owl_${scene.key}${ext}`);
      if (fs.existsSync(candidate)) { audioFile = candidate; break; }
    }
    if (!audioFile) {
      console.error(`ABORT: ${scene.key} 의 음성 파일을 ${sceneAudioDir} 에서 찾지 못했습니다.`);
      process.exit(1);
    }
    // 말 끝나고 화면이 바로 끊기면 급해 보인다. 0.4초 여유를 둔다.
    targetDuration = probeDuration(audioFile) + 0.4;
  }

  const vFilters = [
    `scale=${render.width}:${render.height}:flags=lanczos`,
    `setsar=1`,
  ];
  // 음성이 영상보다 길면 마지막 프레임을 정지로 늘려 길이를 맞춘다.
  if (targetDuration > clipDuration + 0.05) {
    vFilters.push(`tpad=stop_mode=clone:stop_duration=${(targetDuration - clipDuration).toFixed(3)}`);
  }
  vFilters.push(...buildOverlayFilters(scene.overlays));

  const outFile = path.join(SCENE_DIR, `scene_${String(scene.scene).padStart(2, "0")}.mp4`);
  const args = ["-y", "-i", clip];
  if (audioFile) args.push("-i", audioFile);

  args.push(
    "-filter_complex",
    audioFile
      ? `[0:v]${vFilters.join(",")}[v];[1:a]aresample=${render.audioSampleRate},apad[a]`
      : `[0:v]${vFilters.join(",")}[v];anullsrc=channel_layout=mono:sample_rate=${render.audioSampleRate}[a]`,
    "-map", "[v]", "-map", "[a]",
    "-t", targetDuration.toFixed(3),
    "-r", String(render.fps),
    "-c:v", render.videoCodec, "-preset", "medium", "-crf", String(render.crf),
    "-pix_fmt", render.pixFmt,
    "-c:a", render.audioCodec, "-b:a", render.audioBitrate,
    "-ar", String(render.audioSampleRate), "-ac", String(render.audioChannels),
    "-movflags", "+faststart",
    outFile,
  );

  log(`scene ${scene.scene} (${scene.key}): clip=${clipDuration.toFixed(2)}s → out=${targetDuration.toFixed(2)}s${audioFile ? " +audio" : ""}${scene.overlays.length ? ` +overlay×${scene.overlays.length}` : ""}`);
  run("ffmpeg", args);

  sceneOutputs.push(outFile);
  timeline.push({ scene: scene.scene, key: scene.key, start: Number(cursor.toFixed(3)), duration: Number(targetDuration.toFixed(3)) });
  cursor += targetDuration;
}

// concat demuxer는 경로 구분자로 슬래시를 쓰고 작은따옴표로 감싼다.
const concatList = path.join(OUT_DIR, "concat.txt");
fs.writeFileSync(
  concatList,
  sceneOutputs.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n") + "\n",
  "utf8",
);

const finalOut = path.join(OUT_DIR, "owl_shorts_final.mp4");
log(`concat → ${finalOut}`);
run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatList, "-c", "copy", "-movflags", "+faststart", finalOut]);

const finalDuration = probeDuration(finalOut);
const manifest = {
  schemaVersion: "owl_assembly_manifest_v1",
  specVersion: OWL_ASSEMBLY_SPEC.specVersion,
  title: OWL_ASSEMBLY_SPEC.title,
  audioMode: NO_AUDIO ? "silent" : "tts",
  audioDir: sceneAudioDir ?? null,
  audioSource: AUDIO_SUMMARY ? "audio-summary" : AUDIO_DIR ? "audio-dir" : null,
  render,
  totalDurationSec: Number(finalDuration.toFixed(3)),
  timeline,
  output: finalOut,
  finishedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(OUT_DIR, "assembly-manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

log("─".repeat(50));
for (const t of timeline) log(`  ${t.key}: ${t.start.toFixed(1)}s ~ ${(t.start + t.duration).toFixed(1)}s`);
log(`최종 ${finalDuration.toFixed(1)}초 → ${finalOut}`);
