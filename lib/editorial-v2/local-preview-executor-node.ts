import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

import { chromium } from "playwright";

import type { EditorialV2LocalStoreConfiguration } from "./contracts";
import type {
  LocalPreviewExecutionResult,
  LocalPreviewProbeStreamSummary,
  LocalPreviewRenderInput,
  LocalPreviewRenderMetadata,
  LocalPreviewSceneFrame,
} from "./local-preview-contracts";
import { LOCAL_PREVIEW_MAX_SCENE_FRAMES } from "./local-preview-contracts";
import { buildLocalPreviewRenderIdentity } from "./local-preview-input";
import { buildLocalPreviewSceneMarkup } from "./local-preview-scene";
import {
  cleanupLocalPreviewWorkspace,
  commitLocalPreviewOutput,
  createLocalPreviewWorkspace,
  inspectLocalPreviewCache,
} from "./local-preview-store-node";
import { summarizeLocalPreviewValidation, validateLocalPreviewInput } from "./local-preview-validation";

const FFMPEG_EXECUTABLE = "ffmpeg";
const FFPROBE_EXECUTABLE = "ffprobe";
const PHASES = [0, 0.5, 1] as const;
const activeRenders = new Map<string, Promise<LocalPreviewExecutionResult>>();

function childEnvironment(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: process.env.NODE_ENV ?? "production",
    PATH: process.env.PATH,
    Path: process.env.Path,
    PATHEXT: process.env.PATHEXT,
    SystemRoot: process.env.SystemRoot,
    WINDIR: process.env.WINDIR,
    TEMP: process.env.TEMP,
    TMP: process.env.TMP,
  };
}

async function runFixedExecutable(executable: "ffmpeg" | "ffprobe", args: readonly string[], cwd: string, timeoutMs: number): Promise<{ readonly stdout: string; readonly stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, [...args], {
      cwd,
      shell: false,
      windowsHide: true,
      env: childEnvironment(),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const append = (current: string, chunk: Buffer): string => `${current}${chunk.toString("utf8")}`.slice(-1_048_576);
    child.stdout.on("data", (chunk: Buffer) => { stdout = append(stdout, chunk); });
    child.stderr.on("data", (chunk: Buffer) => { stderr = append(stderr, chunk); });
    const timeout = globalThis.setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`${executable.toUpperCase()}_TIMEOUT`));
    }, timeoutMs);
    child.once("error", (error) => {
      globalThis.clearTimeout(timeout);
      reject(new Error(`${executable.toUpperCase()}_UNAVAILABLE:${error.message}`));
    });
    child.once("close", (code) => {
      globalThis.clearTimeout(timeout);
      if (code !== 0) reject(new Error(`${executable.toUpperCase()}_FAILED:${stderr.slice(-2_000)}`));
      else resolve({ stdout, stderr });
    });
  });
}

function safeSrtText(value: string): string {
  return value.replace(/[\r\n]+/gu, " ").replaceAll("<", "&lt;").replaceAll(">", "&gt;").trim();
}

function srtTimestamp(seconds: number): string {
  const totalMilliseconds = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(totalMilliseconds / 3_600_000);
  const minutes = Math.floor(totalMilliseconds % 3_600_000 / 60_000);
  const secs = Math.floor(totalMilliseconds % 60_000 / 1000);
  const milliseconds = totalMilliseconds % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(milliseconds).padStart(3, "0")}`;
}

function buildEstimatedSrt(input: LocalPreviewRenderInput): string {
  const cues = input.scenes.flatMap((scene) => scene.estimatedSubtitleCues).slice().sort((left, right) => left.startSeconds - right.startSeconds || left.cueOrder - right.cueOrder);
  return `${cues.map((cue, index) => `${index + 1}\n${srtTimestamp(cue.startSeconds)} --> ${srtTimestamp(cue.endSeconds)}\n${safeSrtText(cue.text)}\n`).join("\n")}\n`;
}

async function renderSceneFrames(input: LocalPreviewRenderInput, frameDirectory: string): Promise<readonly LocalPreviewSceneFrame[]> {
  const browser = await chromium.launch({ headless: true, args: ["--disable-background-networking", "--disable-component-update", "--disable-default-apps", "--disable-sync"] });
  const context = await browser.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 1, locale: "ko-KR", colorScheme: "dark" });
  const page = await context.newPage();
  let externalRequestCount = 0;
  page.on("request", (request) => {
    const url = request.url();
    if (!url.startsWith("about:") && !url.startsWith("data:") && !url.startsWith("blob:")) externalRequestCount += 1;
  });
  await page.route("**/*", async (route) => { await route.abort("blockedbyclient"); });
  const frames: LocalPreviewSceneFrame[] = [];
  try {
    for (const scene of input.scenes) {
      for (const phase of PHASES) {
        if (frames.length >= LOCAL_PREVIEW_MAX_SCENE_FRAMES) throw new Error("LOCAL_PREVIEW_FRAME_LIMIT_EXCEEDED");
        const fileName = `scene-${String(scene.order).padStart(2, "0")}-phase-${String(phase).replace(".", "-")}.png`;
        const markup = buildLocalPreviewSceneMarkup(scene, { phase, frameLabel: `frame ${frames.length + 1}` });
        await page.setContent(markup, { waitUntil: "domcontentloaded", timeout: 10_000 });
        await page.screenshot({ path: join(frameDirectory, fileName), type: "png", animations: "disabled" });
        frames.push({ sceneId: scene.sceneId, sceneOrder: scene.order, phase, durationMs: scene.durationMs / PHASES.length, fileName });
      }
    }
    if (externalRequestCount !== 0) throw new Error(`LOCAL_PREVIEW_EXTERNAL_REQUEST_DETECTED:${externalRequestCount}`);
    return frames;
  } finally {
    await page.close().catch(() => undefined);
    await context.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }
}

function buildConcatFile(frames: readonly LocalPreviewSceneFrame[]): string {
  const lines = ["ffconcat version 1.0"];
  for (const frame of frames) {
    lines.push(`file 'frames/${basename(frame.fileName)}'`);
    lines.push(`duration ${(frame.durationMs / 1000).toFixed(6)}`);
  }
  if (frames.length > 0) lines.push(`file 'frames/${basename(frames[frames.length - 1].fileName)}'`);
  return `${lines.join("\n")}\n`;
}

function parseRate(value: unknown): number {
  if (typeof value !== "string") return 0;
  const [left, right] = value.split("/").map(Number);
  return Number.isFinite(left) && Number.isFinite(right) && right !== 0 ? left / right : 0;
}

async function probeMedia(mediaPath: string, cwd: string): Promise<LocalPreviewProbeStreamSummary> {
  const { stdout } = await runFixedExecutable(FFPROBE_EXECUTABLE, ["-v", "error", "-show_streams", "-show_format", "-of", "json", mediaPath], cwd, 30_000);
  let parsed: unknown;
  try { parsed = JSON.parse(stdout); } catch { throw new Error("FFPROBE_JSON_INVALID"); }
  const record = parsed as { readonly streams?: readonly Readonly<Record<string, unknown>>[]; readonly format?: Readonly<Record<string, unknown>> };
  const streams = Array.isArray(record.streams) ? record.streams : [];
  const video = streams.find((stream) => stream.codec_type === "video");
  const audio = streams.some((stream) => stream.codec_type === "audio");
  const subtitle = streams.some((stream) => stream.codec_type === "subtitle");
  const durationSeconds = Number(record.format?.duration ?? video?.duration ?? 0);
  return {
    video: Boolean(video),
    audio,
    subtitle,
    width: Number(video?.width ?? 0),
    height: Number(video?.height ?? 0),
    fps: parseRate(video?.avg_frame_rate ?? video?.r_frame_rate),
    durationMs: Number.isFinite(durationSeconds) ? Math.round(durationSeconds * 1000) : 0,
    formatName: typeof record.format?.format_name === "string" ? record.format.format_name : "unknown",
  };
}

async function executeRender(configuration: EditorialV2LocalStoreConfiguration, input: LocalPreviewRenderInput): Promise<LocalPreviewExecutionResult> {
  const validation = summarizeLocalPreviewValidation(validateLocalPreviewInput(input));
  if (!validation.valid) return { ok: false, status: "failed", identity: null, metadata: null, cacheStatus: "not_applicable", ffmpegExecuted: false, message: validation.issues.filter((entry) => entry.blocking).map((entry) => entry.code).join(",") };
  const identity = buildLocalPreviewRenderIdentity(input);
  const cached = await inspectLocalPreviewCache(configuration, identity);
  if (cached.hit && cached.metadata) return { ok: true, status: "cache_hit", identity, metadata: cached.metadata, cacheStatus: "hit_reused", ffmpegExecuted: false, message: "LOCAL_PREVIEW_CACHE_HIT" };
  const workspace = await createLocalPreviewWorkspace(configuration, identity);
  try {
    const frames = await renderSceneFrames(input, workspace.frameDirectory);
    await writeFile(workspace.concatPath, buildConcatFile(frames), "utf8");
    await writeFile(workspace.subtitlePath, buildEstimatedSrt(input), "utf8");
    const durationSeconds = (input.durationMs / 1000).toFixed(3);
    await runFixedExecutable(FFMPEG_EXECUTABLE, [
      "-hide_banner", "-loglevel", "error", "-y",
      "-f", "concat", "-safe", "1", "-i", basename(workspace.concatPath),
      "-f", "lavfi", "-t", durationSeconds, "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
      "-i", basename(workspace.subtitlePath),
      "-map", "0:v:0", "-map", "1:a:0", "-map", "2:0",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "27", "-pix_fmt", "yuv420p", "-r", "30",
      "-c:a", "aac", "-b:a", "96k", "-c:s", "mov_text",
      "-t", durationSeconds, "-movflags", "+faststart", workspace.mediaTemporaryPath,
    ], workspace.workDirectory, 120_000);
    const probe = await probeMedia(workspace.mediaTemporaryPath, workspace.workDirectory);
    const placeholderSceneIds = input.scenes.filter((scene) => scene.unresolvedAssets.length > 0).map((scene) => scene.sceneId);
    const metadataWithoutOutput: Omit<LocalPreviewRenderMetadata, "outputSha256" | "outputBytes"> = {
      schemaVersion: "local-preview-metadata-v1",
      status: "completed",
      renderId: identity.renderId,
      projectId: input.projectId,
      projectRevision: input.projectRevision,
      renderInputHash: identity.renderInputHash,
      sourceCheckpointHashes: { ...input.sourceCheckpointHashes },
      renderCheckpointHash: input.renderCheckpointHash,
      profile: "preview_540x960",
      sceneCount: input.sceneCount,
      durationMs: input.durationMs,
      width: 540,
      height: 960,
      fps: 30,
      audioMode: "silent_placeholder",
      subtitleAlignment: "estimated_not_audio_aligned",
      unresolvedAssetCount: input.scenes.reduce((total, scene) => total + scene.unresolvedAssets.length, 0),
      placeholderSceneIds,
      characterDirection: input.selectedCharacterDirection,
      characterMotionProxy: true,
      productionAnimation: false,
      productionReady: false,
      completedAtIso: new Date().toISOString(),
      probe,
      warnings: [...new Set([...input.warnings, ...validation.issues.filter((entry) => !entry.blocking).map((entry) => entry.code)])].sort(),
    };
    const metadata = await commitLocalPreviewOutput(configuration, identity, workspace, metadataWithoutOutput);
    return { ok: true, status: "completed", identity, metadata, cacheStatus: "miss_rendered", ffmpegExecuted: true, message: "LOCAL_PREVIEW_RENDER_COMPLETED" };
  } finally {
    await cleanupLocalPreviewWorkspace(workspace).catch(() => undefined);
  }
}

export async function renderLocalProjectPreview(
  configuration: EditorialV2LocalStoreConfiguration,
  input: LocalPreviewRenderInput,
): Promise<LocalPreviewExecutionResult> {
  const identity = buildLocalPreviewRenderIdentity(input);
  const key = `${identity.projectId}:${identity.renderId}`;
  const existing = activeRenders.get(key);
  if (existing) {
    const result = await existing;
    return result.ok ? { ...result, status: "in_flight", cacheStatus: "in_flight_reused", ffmpegExecuted: false, message: "LOCAL_PREVIEW_IN_FLIGHT_REUSED" } : result;
  }
  const task = executeRender(configuration, input);
  activeRenders.set(key, task);
  try { return await task; } finally { if (activeRenders.get(key) === task) activeRenders.delete(key); }
}

export async function readLocalPreviewBytes(path: string): Promise<Buffer> {
  return readFile(path);
}
