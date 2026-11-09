import { createHash } from "node:crypto";
import { readFileSync, rmSync, statSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

const EXPECTED_SUCCESS = "SHORTS_EDITORIAL_OS_V2_SLICE6_SYNTHETIC_RENDER_PROOF_PASS";
const SCENES = [
  ["14213D", "SYNTHETIC 01"],
  ["1B4965", "SYNTHETIC 02"],
  ["2A6F97", "SYNTHETIC 03"],
  ["2C7DA0", "SYNTHETIC 04"],
  ["468FAF", "SYNTHETIC 05"],
  ["61A5C2", "SYNTHETIC 06"],
  ["89C2D9", "SYNTHETIC 07"],
  ["A9D6E5", "SYNTHETIC 08"],
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    const detail = [result.error?.message, result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${command} failed (${result.status ?? "spawn"}): ${detail}`);
  }
  return result.stdout.trim();
}

function statusSnapshot(repoRoot) {
  return run("git", ["status", "--porcelain=v1", "-z"], { cwd: repoRoot });
}

function secondsToSrt(value) {
  const milliseconds = Math.round(value * 1000);
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const seconds = Math.floor((milliseconds % 60_000) / 1000);
  const millis = milliseconds % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

function buildSrt() {
  return `${SCENES.map((scene, index) => {
    const start = index * 0.5;
    const end = start + 0.5;
    return `${index + 1}\n${secondsToSrt(start)} --> ${secondsToSrt(end)}\n${scene[1]} · SYNTHETIC_SAFE_AREA_GUIDE\n`;
  }).join("\n")}\n`;
}

function assertSafeTemporaryDirectory(candidate, systemTemporaryRoot) {
  const resolvedCandidate = resolve(candidate);
  const resolvedRoot = resolve(systemTemporaryRoot);
  if (!isAbsolute(resolvedCandidate) || resolvedCandidate === resolvedRoot || !resolvedCandidate.startsWith(`${resolvedRoot}${sep}`)) {
    throw new Error(`unsafe temporary directory: ${resolvedCandidate}`);
  }
  if (!resolvedCandidate.includes("shorts-editorial-v2-slice6-")) {
    throw new Error(`unexpected temporary directory prefix: ${resolvedCandidate}`);
  }
}

let temporaryDirectory = null;
let repositoryRoot = null;
let statusBefore = null;
let proofSummary = null;

try {
  const currentDirectory = resolve(process.cwd());
  repositoryRoot = resolve(run("git", ["rev-parse", "--show-toplevel"], { cwd: currentDirectory }));
  if (repositoryRoot !== currentDirectory) throw new Error(`run from repository root: expected=${repositoryRoot} actual=${currentDirectory}`);
  run("ffmpeg", ["-version"], { cwd: repositoryRoot });
  run("ffprobe", ["-version"], { cwd: repositoryRoot });
  statusBefore = statusSnapshot(repositoryRoot);

  const systemTemporaryRoot = resolve(tmpdir());
  temporaryDirectory = mkdtempSync(join(systemTemporaryRoot, "shorts-editorial-v2-slice6-"));
  assertSafeTemporaryDirectory(temporaryDirectory, systemTemporaryRoot);
  const videoPath = join(temporaryDirectory, "synthetic-scenes.mp4");
  const audioPath = join(temporaryDirectory, "synthetic-audio.m4a");
  const subtitlePath = join(temporaryDirectory, "synthetic-subtitles.srt");
  const outputPath = join(temporaryDirectory, "synthetic-preview-540x960.mp4");

  const colorInputs = SCENES.flatMap(([color]) => ["-f", "lavfi", "-i", `color=c=0x${color}:s=540x960:r=30:d=0.5`]);
  const drawFilters = SCENES.map((_, index) => `[${index}:v]drawbox=x=28:y=48:w=484:h=824:color=white@0.42:t=3,drawbox=x=48:y=690:w=444:h=190:color=yellow@0.35:t=2[v${index}]`);
  const concatInputs = SCENES.map((_, index) => `[v${index}]`).join("");
  const filterComplex = `${drawFilters.join(";")};${concatInputs}concat=n=8:v=1:a=0[outv]`;
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...colorInputs, "-filter_complex", filterComplex, "-map", "[outv]", "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-r", "30", videoPath], { cwd: temporaryDirectory });
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "sine=frequency=880:sample_rate=48000:duration=4", "-c:a", "aac", "-b:a", "96k", audioPath], { cwd: temporaryDirectory });
  writeFileSync(subtitlePath, buildSrt(), { encoding: "utf8", flag: "wx" });
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", videoPath, "-i", audioPath, "-i", subtitlePath, "-map", "0:v:0", "-map", "1:a:0", "-map", "2:s:0", "-c:v", "copy", "-c:a", "copy", "-c:s", "mov_text", "-metadata", "comment=SLICE6_SYNTHETIC_FIXTURE_ONLY", "-shortest", outputPath], { cwd: temporaryDirectory });

  const probe = JSON.parse(run("ffprobe", ["-v", "error", "-show_entries", "stream=index,codec_type,width,height:format=duration,size", "-of", "json", outputPath], { cwd: temporaryDirectory }));
  const video = probe.streams.find((stream) => stream.codec_type === "video");
  const audio = probe.streams.find((stream) => stream.codec_type === "audio");
  const subtitle = probe.streams.find((stream) => stream.codec_type === "subtitle");
  const durationSeconds = Number(probe.format?.duration);
  const fileSize = statSync(outputPath).size;
  if (!video || video.width !== 540 || video.height !== 960) throw new Error("ffprobe video profile mismatch");
  if (!audio) throw new Error("ffprobe audio stream missing");
  if (!subtitle) throw new Error("ffprobe subtitle stream missing");
  if (!Number.isFinite(durationSeconds) || durationSeconds < 3.8 || durationSeconds > 4.2) throw new Error(`ffprobe duration mismatch: ${durationSeconds}`);
  if (fileSize <= 0) throw new Error("synthetic output is empty");
  const outputSha256 = createHash("sha256").update(readFileSync(outputPath)).digest("hex");
  proofSummary = {
    profileId: "preview_540x960",
    sceneCount: 8,
    width: video.width,
    height: video.height,
    videoStreamPresent: true,
    audioStreamPresent: true,
    subtitleStreamPresent: true,
    durationSeconds,
    outputSha256,
    nonEmptyOutput: true,
    syntheticOnly: true,
  };
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  if (temporaryDirectory) {
    const systemTemporaryRoot = resolve(tmpdir());
    assertSafeTemporaryDirectory(temporaryDirectory, systemTemporaryRoot);
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
  if (repositoryRoot && statusBefore !== null) {
    const statusAfter = statusSnapshot(repositoryRoot);
    if (statusAfter !== statusBefore) {
      console.error("repository status changed during synthetic render proof");
      process.exitCode = 1;
    } else if (proofSummary && process.exitCode !== 1) {
      console.log(JSON.stringify({ ...proofSummary, repositoryStatusUnchanged: true }));
      console.log(EXPECTED_SUCCESS);
    }
  }
}
