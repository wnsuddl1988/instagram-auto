import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

const SUCCESS = "SHORTS_EDITORIAL_OS_V2_SLICE8_SYNTHETIC_REPRESENTATIVE_SAMPLE_PASS";
const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const SCENE_SECONDS = 3;
const SCENE_COUNT = 8;
const COLORS = [
  [8, 31, 52], [10, 49, 78], [13, 66, 92], [17, 82, 104],
  [23, 97, 110], [34, 111, 114], [49, 123, 116], [69, 134, 117],
];

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
  if (result.error || result.status !== 0) {
    const detail = [result.error?.message, result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${command} failed (${result.status ?? "spawn"}): ${detail}`);
  }
  return result.stdout.trim();
}

function repositoryStatus(root) {
  return run("git", ["status", "--porcelain=v1", "-z"], root);
}

function assertSafeTemporaryDirectory(candidate, systemRoot) {
  const resolvedCandidate = resolve(candidate);
  const resolvedRoot = resolve(systemRoot);
  if (!isAbsolute(resolvedCandidate) || resolvedCandidate === resolvedRoot || !resolvedCandidate.startsWith(`${resolvedRoot}${sep}`)) throw new Error(`unsafe temporary directory: ${resolvedCandidate}`);
  if (!resolvedCandidate.includes("shorts-editorial-v2-slice8-")) throw new Error(`unexpected temporary directory prefix: ${resolvedCandidate}`);
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
  const cues = Array.from({ length: SCENE_COUNT }, (_, index) => {
    const start = index * SCENE_SECONDS;
    const end = start + SCENE_SECONDS;
    return `${index + 1}\n${secondsToSrt(start)} --> ${secondsToSrt(end)}\nSYNTHETIC SCENE ${String(index + 1).padStart(2, "0")} · SOURCE FIRST · PUBLIC READY FALSE\n`;
  });
  return `${cues.join("\n")}\n`;
}

function inRect(x, y, left, top, width, height) {
  return x >= left && x < left + width && y >= top && y < top + height;
}

function buildScenePpm(index) {
  const header = Buffer.from(`P6\n${WIDTH} ${HEIGHT}\n255\n`, "ascii");
  const pixels = Buffer.allocUnsafe(WIDTH * HEIGHT * 3);
  const base = COLORS[index];
  const lineY = 920 - index * 32;
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const offset = (y * WIDTH + x) * 3;
      const gradient = Math.floor((y / HEIGHT) * 24);
      let red = Math.min(255, base[0] + gradient);
      let green = Math.min(255, base[1] + gradient);
      let blue = Math.min(255, base[2] + gradient);

      const safeGuide = (x === 60 || x === WIDTH - 61) && y >= 80 && y <= HEIGHT - 80
        || (y === 80 || y === HEIGHT - 81) && x >= 60 && x <= WIDTH - 60;
      const sourceBadge = inRect(x, y, 90, 130, 360, 92);
      const evidenceCard = inRect(x, y, 90, 330, 900, 420);
      const numberBar = inRect(x, y, 140, 825, 110 + index * 82, 70);
      const comparisonBar = inRect(x, y, 140, 955, 680 - index * 34, 54);
      const lineGraph = x >= 140 && x < 910 && Math.abs(y - (lineY + Math.round(Math.sin((x + index * 47) / 115) * 95))) <= 5;
      const subtitleZone = inRect(x, y, 100, 1500, 880, 220);
      const characterMarker = Math.abs(x - 900) + Math.abs(y - (1180 + index * 18)) < 74;

      if (safeGuide) [red, green, blue] = [145, 181, 197];
      if (sourceBadge) [red, green, blue] = [86, 214, 201];
      if (evidenceCard) [red, green, blue] = [235, 244, 247];
      if (numberBar) [red, green, blue] = [255, 209, 102];
      if (comparisonBar) [red, green, blue] = [113, 188, 180];
      if (lineGraph) [red, green, blue] = [255, 209, 102];
      if (subtitleZone) [red, green, blue] = [9, 24, 40];
      if (characterMarker) [red, green, blue] = [86, 214, 201];

      pixels[offset] = red;
      pixels[offset + 1] = green;
      pixels[offset + 2] = blue;
    }
  }
  return Buffer.concat([header, pixels]);
}

let repositoryRoot = null;
let statusBefore = null;
let temporaryDirectory = null;
let proof = null;

try {
  const currentDirectory = resolve(process.cwd());
  repositoryRoot = resolve(run("git", ["rev-parse", "--show-toplevel"], currentDirectory));
  if (repositoryRoot !== currentDirectory) throw new Error(`run from repository root: expected=${repositoryRoot} actual=${currentDirectory}`);
  run("ffmpeg", ["-version"], repositoryRoot);
  run("ffprobe", ["-version"], repositoryRoot);
  statusBefore = repositoryStatus(repositoryRoot);

  const systemTemporaryRoot = resolve(tmpdir());
  temporaryDirectory = mkdtempSync(join(systemTemporaryRoot, "shorts-editorial-v2-slice8-"));
  assertSafeTemporaryDirectory(temporaryDirectory, systemTemporaryRoot);

  const sceneFiles = [];
  for (let index = 0; index < SCENE_COUNT; index += 1) {
    const filename = `scene-${String(index + 1).padStart(2, "0")}.ppm`;
    writeFileSync(join(temporaryDirectory, filename), buildScenePpm(index), { flag: "wx" });
    sceneFiles.push(filename);
  }
  const concatPath = join(temporaryDirectory, "frames.ffconcat");
  const concatBody = [
    "ffconcat version 1.0",
    ...sceneFiles.flatMap((filename) => [`file '${filename}'`, `duration ${SCENE_SECONDS}`]),
    `file '${sceneFiles[sceneFiles.length - 1]}'`,
  ].join("\n");
  writeFileSync(concatPath, `${concatBody}\n`, { encoding: "utf8", flag: "wx" });

  const videoPath = join(temporaryDirectory, "synthetic-representative-video.mp4");
  const audioPath = join(temporaryDirectory, "synthetic-tone.m4a");
  const subtitlePath = join(temporaryDirectory, "synthetic-subtitles.srt");
  const outputPath = join(temporaryDirectory, "synthetic-representative-1080x1920.mp4");
  writeFileSync(subtitlePath, buildSrt(), { encoding: "utf8", flag: "wx" });

  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", concatPath, "-vf", `fps=${FPS}`, "-t", "24", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-r", String(FPS), videoPath], temporaryDirectory);
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "sine=frequency=660:sample_rate=48000:duration=24", "-c:a", "aac", "-b:a", "96k", audioPath], temporaryDirectory);
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", videoPath, "-i", audioPath, "-i", subtitlePath, "-map", "0:v:0", "-map", "1:a:0", "-map", "2:s:0", "-c:v", "copy", "-c:a", "copy", "-c:s", "mov_text", "-metadata", "comment=SLICE8_SYNTHETIC_ONLY_PUBLIC_READY_FALSE", "-shortest", outputPath], temporaryDirectory);

  const result = JSON.parse(run("ffprobe", ["-v", "error", "-show_entries", "stream=index,codec_type,width,height,r_frame_rate:format=duration,size", "-of", "json", outputPath], temporaryDirectory));
  const video = result.streams.find((stream) => stream.codec_type === "video");
  const audio = result.streams.find((stream) => stream.codec_type === "audio");
  const subtitle = result.streams.find((stream) => stream.codec_type === "subtitle");
  const durationSeconds = Number(result.format?.duration);
  const fileSize = statSync(outputPath).size;
  if (!video || video.width !== WIDTH || video.height !== HEIGHT || video.r_frame_rate !== "30/1") throw new Error("ffprobe video profile mismatch");
  if (!audio) throw new Error("ffprobe audio stream missing");
  if (!subtitle) throw new Error("ffprobe subtitle stream missing");
  if (!Number.isFinite(durationSeconds) || durationSeconds < 23.5 || durationSeconds > 24.5) throw new Error(`ffprobe duration mismatch: ${durationSeconds}`);
  if (fileSize <= 0) throw new Error("synthetic output is empty");
  proof = {
    sceneCount: SCENE_COUNT,
    width: video.width,
    height: video.height,
    framesPerSecond: FPS,
    durationSeconds,
    videoStreamPresent: true,
    audioStreamPresent: true,
    subtitleStreamPresent: true,
    outputSha256: createHash("sha256").update(readFileSync(outputPath)).digest("hex"),
    nonEmptyOutput: true,
    publicReady: false,
    syntheticOnly: true,
  };
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  let temporaryDirectoryRemoved = true;
  if (temporaryDirectory) {
    const systemTemporaryRoot = resolve(tmpdir());
    assertSafeTemporaryDirectory(temporaryDirectory, systemTemporaryRoot);
    rmSync(temporaryDirectory, { recursive: true, force: true });
    temporaryDirectoryRemoved = !existsSync(temporaryDirectory);
  }
  if (repositoryRoot && statusBefore !== null) {
    const statusAfter = repositoryStatus(repositoryRoot);
    if (statusAfter !== statusBefore) {
      console.error("repository status changed during synthetic representative sample proof");
      process.exitCode = 1;
    } else if (proof && temporaryDirectoryRemoved && process.exitCode !== 1) {
      console.log(JSON.stringify({ ...proof, temporaryDirectoryRemoved, repositoryStatusUnchanged: true }));
      console.log(SUCCESS);
    } else if (!temporaryDirectoryRemoved) {
      console.error("temporary directory cleanup failed");
      process.exitCode = 1;
    }
  }
}
