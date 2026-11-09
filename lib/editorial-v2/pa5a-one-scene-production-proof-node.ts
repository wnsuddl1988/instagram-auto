import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { access, copyFile, mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

import { chromium } from "playwright";

import { buildAudioAlignedSubtitleTrack, validateAudioAlignedSubtitleTrack } from "./audio-alignment";
import type { EditorialV2LocalStoreConfiguration } from "./contracts";
import { isEditorialV2PathContained } from "./persistence-data-root";
import { readProject } from "./project-store-node";
import {
  PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE,
  type AudioAlignedSubtitleTrack,
  type VoiceSceneAudioMetadata,
} from "./voice-materialization-contracts";
import { assertPa4lSingleScenePlan, buildVoiceMaterializationPlan } from "./voice-materialization-node";
import {
  readVoiceMaterializationSet,
  readVoiceSceneAudioDescriptor,
  readVoiceSceneAudioMetadata,
} from "./voice-audio-store-node";

export const PA5A_PROOF_CLASSIFICATION = "PA5A_ONE_SCENE_LOCAL_PRODUCTION_PROOF" as const;
export const PA5A_WIDTH = 1080;
export const PA5A_HEIGHT = 1920;
export const PA5A_FPS = 30;
export const PA5A_EXPECTED_SCENE_ORDER = 4;

export interface Pa5aProductionProofMetadata {
  readonly schemaVersion: "pa5a-one-scene-production-proof-v1";
  readonly classification: typeof PA5A_PROOF_CLASSIFICATION;
  readonly projectId: string;
  readonly projectRevision: number;
  readonly renderCheckpointHash: string;
  readonly proofId: string;
  readonly proofInputHash: string;
  readonly sceneId: string;
  readonly sceneOrder: 4;
  readonly narrationHash: string;
  readonly materializationSetId: string;
  readonly sceneAudioIdentity: string;
  readonly audioSha256: string;
  readonly audioDurationMs: number;
  readonly subtitleAuthority: "provider_character_timestamps";
  readonly subtitleCueCount: number;
  readonly width: 1080;
  readonly height: 1920;
  readonly fps: 30;
  readonly outputSha256: string;
  readonly outputBytes: number;
  readonly outputDurationMs: number;
  readonly ffprobe: { readonly video: boolean; readonly audio: boolean; readonly subtitle: boolean; readonly width: number; readonly height: number; readonly fps: number; readonly durationMs: number };
  readonly externalRequestCount: 0;
  readonly productionReady: false;
  readonly publicLaunchReady: false;
  readonly completedAtIso: string;
}

export interface Pa5aProductionProofResult {
  readonly cacheStatus: "miss_rendered" | "hit_reused";
  readonly metadata: Pa5aProductionProofMetadata;
  readonly mediaPath: string;
  readonly qaFramePaths: Readonly<Record<string, string>>;
}

function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stable(record[key])}`).join(",")}}`;
}
function sha256(value: string | Buffer): string { return createHash("sha256").update(value).digest("hex"); }
async function exists(path: string): Promise<boolean> { try { await access(path); return true; } catch { return false; } }

function childEnvironment(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { NODE_ENV: process.env.NODE_ENV ?? "production" };
  for (const key of ["PATH", "Path", "PATHEXT", "SystemRoot", "SYSTEMROOT", "WINDIR", "COMSPEC", "TMP", "TEMP"]) if (process.env[key]) env[key] = process.env[key];
  return env;
}
async function run(executable: "ffmpeg" | "ffprobe", args: readonly string[], cwd: string, timeoutMs: number): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(executable, args, { cwd, shell: false, windowsHide: true, env: childEnvironment(), stdio: ["ignore", "pipe", "pipe"] });
    let stdout = ""; let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => { stdout = `${stdout}${chunk.toString("utf8")}`.slice(-1_000_000); });
    child.stderr.on("data", (chunk: Buffer) => { stderr = `${stderr}${chunk.toString("utf8")}`.slice(-1_000_000); });
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error(`${executable.toUpperCase()}_TIMEOUT`)); }, timeoutMs);
    child.once("error", (error) => { clearTimeout(timer); reject(new Error(`${executable.toUpperCase()}_UNAVAILABLE:${error.message}`)); });
    child.once("close", (code) => { clearTimeout(timer); code === 0 ? resolvePromise(stdout) : reject(new Error(`${executable.toUpperCase()}_FAILED:${stderr.slice(-2_000)}`)); });
  });
}
function srtTime(seconds: number): string {
  const milliseconds = Math.max(0, Math.round(seconds * 1_000));
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor(milliseconds % 3_600_000 / 60_000);
  const secs = Math.floor(milliseconds % 60_000 / 1_000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(milliseconds % 1_000).padStart(3, "0")}`;
}
function safeText(value: string): string { return value.replace(/[\r\n]+/gu, " ").trim(); }
function srt(track: AudioAlignedSubtitleTrack): string {
  return `${track.cues.map((cue, index) => `${index + 1}\n${srtTime(cue.startSeconds)} --> ${srtTime(cue.endSeconds)}\n${safeText(cue.text)}\n`).join("\n")}\n`;
}
function parseRate(value: unknown): number {
  if (typeof value !== "string") return 0;
  const [a, b] = value.split("/").map(Number);
  return Number.isFinite(a) && Number.isFinite(b) && b !== 0 ? a / b : 0;
}
async function probe(path: string, cwd: string): Promise<Pa5aProductionProofMetadata["ffprobe"]> {
  const raw = await run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", path], cwd, 30_000);
  const parsed = JSON.parse(raw) as { streams?: Array<Record<string, unknown>>; format?: Record<string, unknown> };
  const streams = parsed.streams ?? [];
  const video = streams.find((entry) => entry.codec_type === "video");
  const duration = Number(parsed.format?.duration ?? video?.duration ?? 0);
  return { video: Boolean(video), audio: streams.some((entry) => entry.codec_type === "audio"), subtitle: streams.some((entry) => entry.codec_type === "subtitle"), width: Number(video?.width ?? 0), height: Number(video?.height ?? 0), fps: parseRate(video?.avg_frame_rate ?? video?.r_frame_rate), durationMs: Number.isFinite(duration) ? Math.round(duration * 1_000) : 0 };
}

function visualState(progress: number) {
  if (progress < .17) return { kicker: "카드값", main: "100만 원", detail: "이번 달 명세", accent: "#9BE7FF", step: 1 };
  if (progress < .34) return { kicker: "약정결제비율", main: "20%", detail: "결제 구조를 먼저 확인", accent: "#FFE08A", step: 2 };
  if (progress < .51) return { kicker: "이번 달 결제", main: "20만 원", detail: "100만 원 중", accent: "#87F2B3", step: 3 };
  if (progress < .68) return { kicker: "다음 달로 이월", main: "80만 원", detail: "남은 카드값", accent: "#FF9EB5", step: 4 };
  if (progress < .84) return { kicker: "겹칠 수 있는 구조", main: "새 사용액 + 수수료", detail: "이월분 위에 추가", accent: "#C4AAFF", step: 5 };
  return { kicker: "핵심", main: "구조를 먼저 확인", detail: "이월과 새 사용액의 겹침", accent: "#9BE7FF", step: 6 };
}
function markup(progress: number, subtitle: string): string {
  const state = visualState(progress);
  const completed = Array.from({ length: 6 }, (_, index) => `<span class="dot ${index + 1 <= state.step ? "on" : ""}"></span>`).join("");
  const stack = state.step >= 5 ? `<div class="stack fee">이월 수수료</div><div class="stack new">새 사용액</div><div class="stack carry">이월 80만 원</div>` : `<div class="card primary"><b>100만 원</b><span>카드값</span></div><div class="arrow">↓</div><div class="card secondary"><b>${state.step >= 3 ? "20만 원" : "20%"}</b><span>${state.step >= 3 ? "이번 달 결제" : "약정결제비율"}</span></div>`;
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#07111f;color:#f8fbff;font-family:Arial,'Malgun Gothic',sans-serif}.shell{width:1080px;height:1920px;padding:110px 86px;display:flex;flex-direction:column;background:radial-gradient(circle at 80% 12%,#153b59 0,#07111f 42%,#050a12 100%);transform:scale(.5);transform-origin:top left}.eyebrow{font-size:30px;letter-spacing:5px;color:#9ab3c8;font-weight:700}.title{margin-top:36px;font-size:44px;line-height:1.35;color:#d7e4ef}.main{margin-top:52px;font-size:${state.main.length > 10 ? 94 : 176}px;line-height:1.05;font-weight:900;letter-spacing:-6px;color:${state.accent};word-break:keep-all}.detail{margin-top:24px;font-size:39px;color:#c7d7e6}.board{margin-top:78px;height:610px;border:2px solid #2d4a63;border-radius:42px;padding:68px;background:linear-gradient(145deg,#10283c,#0c1725);display:flex;align-items:center;justify-content:center;flex-direction:column}.card{width:610px;border-radius:34px;padding:40px 48px;display:flex;justify-content:space-between;align-items:center}.card b{font-size:70px}.card span{font-size:28px;color:#c5d3e0}.primary{background:#163a56;border:2px solid #4d9ac5}.secondary{background:#173f36;border:2px solid #55c99b}.arrow{font-size:70px;color:#9be7ff;margin:22px}.stack{width:620px;border-radius:30px;padding:42px;font-size:54px;font-weight:800;box-shadow:0 18px 0 #050a12}.carry{background:#7a3046}.new{background:#35487f;transform:translateY(-14px)}.fee{background:#514070;transform:translateY(-28px)}.timeline{margin-top:auto;display:flex;gap:18px;align-items:center}.dot{height:12px;flex:1;border-radius:99px;background:#294254}.dot.on{background:${state.accent}}.sub{margin-top:48px;min-height:180px;border-radius:30px;background:rgba(0,0,0,.72);padding:30px 38px;font-size:48px;font-weight:800;line-height:1.35;text-align:center;word-break:keep-all;display:flex;align-items:center;justify-content:center}.foot{margin-top:22px;text-align:center;font-size:24px;color:#a6bbcc}</style></head><body><main class="shell"><div class="eyebrow">CARD PAYMENT STRUCTURE</div><div class="title">${state.kicker}</div><div class="main">${state.main}</div><div class="detail">${state.detail}</div><section class="board">${stack}</section><div class="timeline">${completed}</div><div class="sub">${safeText(subtitle)}</div><div class="foot">예시 구조 설명 · 실제 청구 조건은 카드사 약관 확인</div></main></body></html>`;
}

export async function renderPa5aOneSceneProductionProof(configuration: EditorialV2LocalStoreConfiguration, projectId: string): Promise<Pa5aProductionProofResult> {
  if (!configuration.enabled || !configuration.localOnly || configuration.exposeDataRoot) throw new Error("PA5A_LOCAL_STORE_CONFIGURATION_INVALID");
  const projectResult = await readProject(configuration, projectId);
  if (!projectResult.ok || !projectResult.snapshot) throw new Error(`PA5A_PROJECT_NOT_AVAILABLE:${projectResult.status}`);
  const project = projectResult.snapshot;
  const latestSet = await readVoiceMaterializationSet(configuration, projectId, "voice-set-ea6195e9f8890c6cd0221a5ceb434ab7664a5f9ad8f5ae4d91c84488f4d11dba");
  if (!latestSet || latestSet.projectRevision !== 6 || latestSet.failedSceneIds.length !== 0 || latestSet.pendingSceneIds.length !== 0 || latestSet.completeSceneIds.length !== 1) throw new Error("PA5A_VOICE_SET_INVALID");
  const plan = buildVoiceMaterializationPlan(project, { voiceId: latestSet.voiceId, modelId: latestSet.modelId, executionMode: PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE });
  const scene = assertPa4lSingleScenePlan(plan);
  if (scene.sceneOrder !== PA5A_EXPECTED_SCENE_ORDER || plan.materializationSetId !== latestSet.materializationSetId || plan.planHash !== latestSet.planHash) throw new Error("PA5A_CANONICAL_SCENE_OR_PLAN_MISMATCH");
  const entry = latestSet.sceneEntries[0];
  if (!entry || entry.sceneId !== scene.sceneId || entry.sceneAudioIdentity !== scene.sceneAudioIdentity || entry.status === "failed") throw new Error("PA5A_VOICE_ENTRY_INVALID");
  const descriptor = await readVoiceSceneAudioDescriptor(configuration, projectId, scene.sceneAudioIdentity);
  const audio = await readVoiceSceneAudioMetadata(configuration, projectId, scene.sceneAudioIdentity);
  if (!audio || audio.sceneId !== scene.sceneId || audio.audioSha256 !== descriptor.audioSha256 || audio.alignmentStatus !== "provider_character_timestamps_aligned" || !audio.audioAlignmentUsable) throw new Error("PA5A_AUTHORITATIVE_AUDIO_INVALID");
  const track = buildAudioAlignedSubtitleTrack(plan.sourceRenderCheckpointHash, latestSet.materializationSetId, [{ sceneId: scene.sceneId, sceneOrder: scene.sceneOrder, narration: scene.narration, keyCaption: scene.keyCaption, audioDurationMs: audio.durationMs, alignment: audio.alignment }]);
  if (validateAudioAlignedSubtitleTrack(track).length !== 0 || track.cues.length === 0 || track.cues.at(0)?.startSeconds !== 0 || (track.cues.at(-1)?.endSeconds ?? 0) * 1_000 > audio.durationMs + 1) throw new Error("PA5A_PROVIDER_TIMESTAMP_SUBTITLE_INVALID");
  const input = { rendererVersion: 3, classification: PA5A_PROOF_CLASSIFICATION, projectId, revision: project.revision, checkpoint: plan.sourceRenderCheckpointHash, set: latestSet.materializationSetId, scene: scene.sceneId, audio: descriptor.audioSha256, alignment: audio.alignmentHash, durationMs: audio.durationMs, cues: track.cues.map((cue) => [cue.startSeconds, cue.endSeconds, cue.text]), width: PA5A_WIDTH, height: PA5A_HEIGHT, fps: PA5A_FPS };
  const proofInputHash = sha256(stable(input));
  const proofId = `pa5a-${proofInputHash.slice(0, 40)}`;
  const proofRoot = resolve(configuration.dataRoot, "projects", projectId, "renders", "pa5a-one-scene-production-proof", proofId);
  if (!isEditorialV2PathContained(resolve(configuration.dataRoot, "projects", projectId), proofRoot)) throw new Error("PA5A_OUTPUT_PATH_ESCAPE_BLOCKED");
  const mediaPath = join(proofRoot, "proof.mp4"); const metadataPath = join(proofRoot, "metadata.json");
  if (await exists(metadataPath) && await exists(mediaPath)) {
    try {
      const cached = JSON.parse(await readFile(metadataPath, "utf8")) as Pa5aProductionProofMetadata;
      if (cached.proofInputHash === proofInputHash && cached.outputSha256 === sha256(await readFile(mediaPath)) && cached.audioSha256 === descriptor.audioSha256 && cached.productionReady === false && cached.publicLaunchReady === false) return { cacheStatus: "hit_reused", metadata: cached, mediaPath, qaFramePaths: {} };
    } catch { /* invalid cache is replaced by a fresh local proof */ }
  }
  const work = join(proofRoot, `.work-${process.pid}-${Date.now()}`); const frames = join(work, "frames"); const qa = join(proofRoot, "qa");
  await mkdir(frames, { recursive: true }); await mkdir(qa, { recursive: true });
  const cueTimes = track.cues.flatMap((cue) => [cue.startSeconds, cue.endSeconds]);
  const visualTimes = [0, .17, .34, .51, .68, .84, 1].map((fraction) => audio.durationMs / 1_000 * fraction);
  const times = [...new Set([...cueTimes, ...visualTimes, audio.durationMs / 1_000].map((value) => Math.max(0, Math.min(audio.durationMs / 1_000, value)).toFixed(3)))].map(Number).sort((a, b) => a - b);
  if (times.length < 2 || times[0] !== 0) throw new Error("PA5A_TIMELINE_INVALID");
  const browser = await chromium.launch({ headless: true, args: ["--disable-background-networking", "--disable-component-update", "--disable-default-apps", "--disable-sync"] });
  const context = await browser.newContext({ viewport: { width: PA5A_WIDTH / 2, height: PA5A_HEIGHT / 2 }, deviceScaleFactor: 1, locale: "ko-KR", colorScheme: "dark" });
  const page = await context.newPage(); let externalRequestCount = 0;
  page.on("request", (request) => { if (!request.url().startsWith("about:")) externalRequestCount += 1; });
  await page.route("**/*", async (route) => route.abort("blockedbyclient"));
  const frameNames: string[] = [];
  try {
    for (let index = 0; index < times.length - 1; index += 1) {
      const at = times[index]!; const cue = track.cues.find((entry) => at >= entry.startSeconds && at < entry.endSeconds) ?? track.cues.at(-1)!;
      const name = `frame-${String(index).padStart(3, "0")}.png`; frameNames.push(name);
      await page.setContent(markup(at / (audio.durationMs / 1_000), cue.text), { waitUntil: "domcontentloaded", timeout: 10_000 });
      await page.screenshot({ path: join(frames, name), type: "png", animations: "disabled" });
    }
    if (externalRequestCount !== 0) throw new Error(`PA5A_EXTERNAL_BROWSER_REQUEST_DETECTED:${externalRequestCount}`);
  } finally { await page.close().catch(() => undefined); await context.close().catch(() => undefined); await browser.close().catch(() => undefined); }
  const concat = ["ffconcat version 1.0", ...frameNames.flatMap((name, index) => [`file 'frames/${name}'`, `duration ${(times[index + 1]! - times[index]!).toFixed(3)}`]), `file 'frames/${frameNames.at(-1)!}'`].join("\n");
  await writeFile(join(work, "frames.ffconcat"), `${concat}\n`, "utf8"); await writeFile(join(work, "subtitles.srt"), srt(track), "utf8"); await copyFile(descriptor.mediaPath, join(work, "scene04.mp3"));
  const temporaryMedia = join(work, "proof.mp4"); const duration = (audio.durationMs / 1_000).toFixed(3);
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "1", "-i", "frames.ffconcat", "-i", "scene04.mp3", "-i", "subtitles.srt", "-map", "0:v:0", "-map", "1:a:0", "-map", "2:0", "-vf", "scale=1080:1920:flags=lanczos", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30", "-g", "1", "-keyint_min", "1", "-sc_threshold", "0", "-c:a", "aac", "-b:a", "128k", "-c:s", "mov_text", "-t", duration, "-movflags", "+faststart", temporaryMedia], work, 180_000);
  const ffprobe = await probe(temporaryMedia, work);
  if (!ffprobe.video || !ffprobe.audio || !ffprobe.subtitle || ffprobe.width !== PA5A_WIDTH || ffprobe.height !== PA5A_HEIGHT || Math.abs(ffprobe.fps - PA5A_FPS) > .01 || Math.abs(ffprobe.durationMs - audio.durationMs) > 180) throw new Error("PA5A_FFPROBE_VALIDATION_FAILED");
  const qaFramePaths: Record<string, string> = {};
  for (const [label, fraction] of Object.entries({ opening: 0, early: .2, payment: .4, carryover: .6, overlap: .75, closing: .92 })) {
    const target = join(qa, `${label}.png`); await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", temporaryMedia, "-ss", (audio.durationMs / 1_000 * fraction).toFixed(3), "-frames:v", "1", target], work, 60_000); qaFramePaths[label] = target;
  }
  await mkdir(proofRoot, { recursive: true }); await rename(temporaryMedia, mediaPath);
  const output = await stat(mediaPath); const outputSha256 = sha256(await readFile(mediaPath));
  const metadata: Pa5aProductionProofMetadata = { schemaVersion: "pa5a-one-scene-production-proof-v1", classification: PA5A_PROOF_CLASSIFICATION, projectId, projectRevision: project.revision, renderCheckpointHash: plan.sourceRenderCheckpointHash, proofId, proofInputHash, sceneId: scene.sceneId, sceneOrder: 4, narrationHash: scene.narrationHash, materializationSetId: latestSet.materializationSetId, sceneAudioIdentity: scene.sceneAudioIdentity, audioSha256: descriptor.audioSha256, audioDurationMs: audio.durationMs, subtitleAuthority: "provider_character_timestamps", subtitleCueCount: track.cues.length, width: PA5A_WIDTH, height: PA5A_HEIGHT, fps: PA5A_FPS, outputSha256, outputBytes: output.size, outputDurationMs: ffprobe.durationMs, ffprobe, externalRequestCount: 0, productionReady: false, publicLaunchReady: false, completedAtIso: new Date().toISOString() };
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  return { cacheStatus: "miss_rendered", metadata, mediaPath, qaFramePaths };
}
