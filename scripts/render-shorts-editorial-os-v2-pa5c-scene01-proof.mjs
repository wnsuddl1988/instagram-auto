import { createHash } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { spawn } from "node:child_process";

const ROOT = process.cwd();
const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;
const DURATION = 6.4;
const FRAME_COUNT = Math.round(FPS * DURATION);
const CHROMA = "0xf210e5";
const SOURCE_ROOT = join(ROOT, "assets", "editorial-v2", "production-assets", "pa5b4");
const OUTPUT_ROOT = join(ROOT, "output", "shorts-editorial-os-v2", "pa5c-scene01-motion-proof");
const DERIVED_ROOT = join(OUTPUT_ROOT, "derived-transparent");
const QA_ROOT = join(OUTPUT_ROOT, "qa");
const PREVIEW_PATH = join(OUTPUT_ROOT, "scene01_motion_proof.mp4");
const REPORT_PATH = join(OUTPUT_ROOT, "pa5c_report.json");
const FONT = "C\\:/Windows/Fonts/malgunbd.ttf";

const assets = [
  { id: "CHAR_PROP_PHONE_01", file: "CHAR_PROP_PHONE_01.png" },
  { id: "CHAR_EXPR_SURPRISED_01", file: "CHAR_EXPR_SURPRISED_01.png" },
  { id: "CHAR_POSE_OPEN_EXPLAIN_01", file: "CHAR_POSE_OPEN_EXPLAIN_01.png" },
];
const background = join(SOURCE_ROOT, "batch-d", "accepted", "BG_EVENING_DESK_01_replacement_v2.png");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function run(command, args, cwd = ROOT, timeoutMs = 300_000, input) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true, stdio: [input ? "pipe" : "ignore", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    if (input) child.stdin.end(input);
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`${command} failed (${code}): ${Buffer.concat(stderr).toString("utf8").slice(-1200)}`));
      else resolvePromise(Buffer.concat(stdout));
    });
  });
}

async function rgba(path) {
  const raw = await run("ffmpeg", ["-v", "error", "-i", path, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "pipe:1"], ROOT, 60_000);
  const metadata = JSON.parse((await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", path], ROOT, 60_000)).toString("utf8"));
  const stream = metadata.streams?.[0];
  if (!stream?.width || !stream?.height || raw.length !== stream.width * stream.height * 4) throw new Error(`RGBA_DECODE_INVALID:${path}`);
  return { raw, width: stream.width, height: stream.height };
}

async function alphaAudit(path) {
  const image = await rgba(path);
  let opaque = 0;
  let softEdge = 0;
  let visibleMagenta = 0;
  for (let offset = 0; offset < image.raw.length; offset += 4) {
    const r = image.raw[offset];
    const g = image.raw[offset + 1];
    const b = image.raw[offset + 2];
    const a = image.raw[offset + 3];
    if (a > 32) opaque += 1;
    if (a > 0 && a < 255) softEdge += 1;
    if (a > 80 && r > 200 && b > 125 && g < 105 && r - g > 85 && b - g > 50) visibleMagenta += 1;
  }
  return {
    width: image.width,
    height: image.height,
    opaquePixels: opaque,
    softEdgePixels: softEdge,
    visibleMagentaPixels: visibleMagenta,
    alphaEdgePass: softEdge > 200,
    magentaSpillPass: visibleMagenta <= 12,
  };
}

async function extract(asset) {
  const source = join(SOURCE_ROOT, "accepted", "character", asset.file);
  const target = join(DERIVED_ROOT, `${asset.id}_transparent.png`);
  await run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y", "-i", source,
    "-vf", `format=rgba,chromakey=${CHROMA}:0.12:0.25`,
    "-frames:v", "1", "-c:v", "png", target,
  ], ROOT, 120_000);
  const audit = await alphaAudit(target);
  if (!audit.alphaEdgePass || !audit.magentaSpillPass || audit.opaquePixels < 100_000) {
    throw new Error(`CHROMA_AUDIT_FAILED:${asset.id}:${JSON.stringify(audit)}`);
  }
  return { ...asset, source, target, sourceSha256: sha256(await readFile(source)), outputSha256: sha256(await readFile(target)), audit };
}

function overlayChain() {
  const phone = "scale=640:-2,format=rgba,fade=t=in:st=0:d=0.18:alpha=1,fade=t=out:st=2.05:d=0.18:alpha=1[phone]";
  const surprise = "scale=670:-2,format=rgba,fade=t=in:st=2.0:d=0.18:alpha=1,fade=t=out:st=4.25:d=0.18:alpha=1[surprise]";
  const explain = "scale=760:-2,format=rgba,fade=t=in:st=4.15:d=0.18:alpha=1,fade=t=out:st=6.2:d=0.18:alpha=1[explain]";
  const title = `drawtext=fontfile='${FONT}':text='카드값 일부만 냈는데, 끝난 걸까?':fontcolor=white:fontsize=42:x=72:y=98:alpha='if(lt(t,0.35),0,t/0.35)'`;
  const source = `drawbox=x=72:y=175:w=340:h=48:color=0x111827@0.72:t=fill,drawtext=fontfile='${FONT}':text='금융위원회 안내 · 구조 설명':fontcolor=0xdbeafe:fontsize=23:x=92:y=188`;
  const hook = `drawbox=x=64:y=340:w=514:h=108:color=0x11233b@0.84:t=fill:enable='between(t,0.65,6.4)',drawtext=fontfile='${FONT}':text='연체 아님':fontcolor=0x8ee8ff:fontsize=60:x=92:y=362:enable='between(t,0.75,6.4)',drawtext=fontfile='${FONT}':text='≠':fontcolor=white:fontsize=62:x=604:y=362:enable='between(t,1.35,6.4)',drawbox=x=692:y=340:w=318:h=108:color=0x66234f@0.84:t=fill:enable='between(t,1.55,6.4)',drawtext=fontfile='${FONT}':text='잔액 없음':fontcolor=0xffd2e9:fontsize=48:x=720:y=372:enable='between(t,1.72,6.4)'`;
  const carry = `drawbox=x=588:y=620:w='min(352,max(0,(t-2.7)*235))':h=12:color=0xffd46b@0.95:t=fill:enable='between(t,2.7,6.4)',drawbox=x=928:y=583:w=92:h=86:color=0xffd46b@0.95:t=fill:enable='between(t,4.05,6.4)',drawtext=fontfile='${FONT}':text='다음 달':fontcolor=0x182033:fontsize=25:x=940:y=610:enable='between(t,4.05,6.4)',drawtext=fontfile='${FONT}':text='남은 금액은\n다음 달로 넘어갈 수 있어요':fontcolor=0xffe2a3:fontsize=30:line_spacing=10:x=630:y=700:enable='between(t,3.15,6.4)'`;
  const caption = `drawbox=x=48:y=1645:w=984:h=190:color=black@0.78:t=fill,drawtext=fontfile='${FONT}':text='끝난 게 아니라, 다음 달로 넘어간\n이월잔액부터 확인해야 합니다.':fontcolor=white:fontsize=45:line_spacing=14:x=(w-text_w)/2:y=1685:enable='between(t,1.9,6.4)'`;
  return [
    `[0:v]scale=1150:2044,crop=${WIDTH}:${HEIGHT}:35:62,format=rgba[bg]`,
    `[1:v]${phone}`,
    `[2:v]${surprise}`,
    `[3:v]${explain}`,
    `[bg][phone]overlay=x='18+22*sin(2*PI*t/1.4)':y='625+10*sin(2*PI*t/0.7)':eval=frame:enable='between(t,0,2.25)'[a]`,
    `[a][surprise]overlay=x='22+18*sin(2*PI*t/1.1)':y='500+8*sin(2*PI*t/0.65)':eval=frame:enable='between(t,1.95,4.35)'[b]`,
    `[b][explain]overlay=x='4+18*sin(2*PI*t/1.2)':y='625+8*sin(2*PI*t/0.72)':eval=frame:enable='between(t,4.1,6.4)'[c]`,
    `[c]${title},${source},${hook},${carry},${caption},format=yuv420p[v]`,
  ].join(";");
}

async function renderPreview(derived) {
  await run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-loop", "1", "-framerate", String(FPS), "-i", background,
    "-loop", "1", "-framerate", String(FPS), "-i", derived[0].target,
    "-loop", "1", "-framerate", String(FPS), "-i", derived[1].target,
    "-loop", "1", "-framerate", String(FPS), "-i", derived[2].target,
    "-filter_complex", overlayChain(), "-map", "[v]", "-t", String(DURATION),
    "-r", String(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart", PREVIEW_PATH,
  ], ROOT, 300_000);
}

async function ffprobe() {
  const parsed = JSON.parse((await run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", PREVIEW_PATH], ROOT, 60_000)).toString("utf8"));
  const video = parsed.streams.find((stream) => stream.codec_type === "video");
  const audio = parsed.streams.find((stream) => stream.codec_type === "audio");
  const fps = video?.avg_frame_rate?.split("/");
  const value = fps?.length === 2 ? Number(fps[0]) / Number(fps[1]) : 0;
  const durationMs = Math.round(Number(parsed.format?.duration ?? 0) * 1000);
  const result = { width: Number(video?.width), height: Number(video?.height), fps: value, durationMs, hasAudio: Boolean(audio), expectedFrames: FRAME_COUNT };
  if (result.width !== WIDTH || result.height !== HEIGHT || Math.abs(result.fps - FPS) > 0.01 || result.hasAudio || Math.abs(result.durationMs - Math.round(DURATION * 1000)) > 150) throw new Error(`FFPROBE_FAILED:${JSON.stringify(result)}`);
  return result;
}

async function qaFrames() {
  const frames = [
    ["opening-relief", null, "1.0"],
    ["alpha-on-white", "white", "2.1"],
    ["alpha-on-dark", "0x111827", "2.1"],
    ["actual-scene", null, "3.2"],
    ["reaction-state", null, "5.2"],
  ];
  for (const [name, color, at] of frames) {
    const target = join(QA_ROOT, `${name}.png`);
    if (color) {
      await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", `color=c=${color}:s=${WIDTH}x${HEIGHT}:d=1`, "-i", join(DERIVED_ROOT, "CHAR_EXPR_SURPRISED_01_transparent.png"), "-filter_complex", "[1:v]scale=720:-2[char];[0:v][char]overlay=(W-w)/2:(H-h)/2", "-frames:v", "1", target], ROOT, 60_000);
    } else {
      await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-ss", at, "-i", PREVIEW_PATH, "-frames:v", "1", target], ROOT, 60_000);
    }
  }
}

async function main() {
  await rm(OUTPUT_ROOT, { recursive: true, force: true });
  await Promise.all([mkdir(DERIVED_ROOT, { recursive: true }), mkdir(QA_ROOT, { recursive: true })]);
  const derived = [];
  for (const asset of assets) derived.push(await extract(asset));
  await renderPreview(derived);
  const previewStat = await stat(PREVIEW_PATH);
  const probe = await ffprobe();
  await qaFrames();
  const report = {
    schemaVersion: "shorts_editorial_os_v2_pa5c_scene01_motion_proof_v1",
    classification: "PA5C_SCENE01_ONLY_SILENT_LOCAL_PREVIEW",
    sceneId: "selected-angle:revolving-balance-not-erased:scene:01",
    sourceBackground: background,
    sourceBackgroundSha256: sha256(await readFile(background)),
    originalAssetsModified: false,
    externalRequests: 0,
    ttsRequests: 0,
    previewPath: PREVIEW_PATH,
    previewSha256: sha256(await readFile(PREVIEW_PATH)),
    previewBytes: previewStat.size,
    ffprobe: probe,
    gates: {
      chromaExtraction: "PASS",
      alphaEdge: "PASS",
      magentaSpill: "NONE_VISIBLE_BY_PIXEL_AUDIT",
      bodyDamage: "VISUAL_QA_REQUIRED",
      faceDamage: "VISUAL_QA_REQUIRED",
      characterPerformance: "THREE_STATE_TIMELINE_RENDERED",
      noCardSlideFeel: "CHARACTER_STATE_CHANGE_AND_CAUSAL_CARRY_LINE",
    },
    derived,
    qaFrames: ["opening-relief.png", "alpha-on-white.png", "alpha-on-dark.png", "actual-scene.png", "reaction-state.png"].map((file) => join(QA_ROOT, file)),
  };
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ preview: PREVIEW_PATH, report: REPORT_PATH, ffprobe: probe, chroma: derived.map(({ id, audit }) => ({ id, audit })) }, null, 2));
}

main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
