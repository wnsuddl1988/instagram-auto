import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";

const ROOT = process.cwd();
const OUTPUT = join(ROOT, "output", "shorts-editorial-os-v2", "pa5c-scene01-motion-proof");
const REPORT = join(OUTPUT, "pa5c_report.json");
const EXPECTED_SCENE = "selected-angle:revolving-balance-not-erased:scene:01";
const EXPECTED_ASSETS = ["CHAR_PROP_PHONE_01", "CHAR_EXPR_SURPRISED_01", "CHAR_POSE_OPEN_EXPLAIN_01"];

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function required(value, message) { if (!value) throw new Error(message); }
async function exists(path) { try { await access(path); return true; } catch { return false; } }
function run(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd: ROOT, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolvePromise(Buffer.concat(stdout)) : reject(new Error(`FFPROBE_FAILED:${Buffer.concat(stderr).toString("utf8")}`)));
  });
}

async function main() {
  required(await exists(REPORT), "PA5C_REPORT_MISSING");
  const report = JSON.parse(await readFile(REPORT, "utf8"));
  required(report.classification === "PA5C_SCENE01_ONLY_SILENT_LOCAL_PREVIEW", "PA5C_CLASSIFICATION_INVALID");
  required(report.sceneId === EXPECTED_SCENE, "PA5C_SCENE_SCOPE_INVALID");
  required(report.originalAssetsModified === false && report.externalRequests === 0 && report.ttsRequests === 0, "PA5C_EXTERNAL_BOUNDARY_INVALID");
  required(report.derived?.length === EXPECTED_ASSETS.length, "PA5C_DERIVED_COUNT_INVALID");
  for (const asset of report.derived) {
    required(EXPECTED_ASSETS.includes(asset.id), `PA5C_UNEXPECTED_ASSET:${asset.id}`);
    required(await exists(asset.source) && await exists(asset.target), `PA5C_ASSET_MISSING:${asset.id}`);
    required(sha256(await readFile(asset.source)) === asset.sourceSha256, `PA5C_SOURCE_MUTATION_OR_REPORT_MISMATCH:${asset.id}`);
    required(sha256(await readFile(asset.target)) === asset.outputSha256, `PA5C_DERIVED_HASH_MISMATCH:${asset.id}`);
    required(asset.audit.alphaEdgePass && asset.audit.magentaSpillPass && asset.audit.opaquePixels > 100_000, `PA5C_CHROMA_GATE_FAILED:${asset.id}`);
  }
  required(await exists(report.previewPath), "PA5C_PREVIEW_MISSING");
  required(sha256(await readFile(report.previewPath)) === report.previewSha256, "PA5C_PREVIEW_HASH_MISMATCH");
  const previewFiles = (await readdir(OUTPUT)).filter((entry) => entry.endsWith(".mp4"));
  required(previewFiles.length === 1 && previewFiles[0] === "scene01_motion_proof.mp4", "PA5C_EXACTLY_ONE_PREVIEW_REQUIRED");
  for (const path of report.qaFrames) required(await exists(path), `PA5C_QA_FRAME_MISSING:${path}`);
  const probe = JSON.parse((await run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", report.previewPath])).toString("utf8"));
  const video = probe.streams.find((stream) => stream.codec_type === "video");
  const audio = probe.streams.find((stream) => stream.codec_type === "audio");
  const [numerator, denominator] = String(video?.avg_frame_rate ?? "0/1").split("/").map(Number);
  required(video?.width === 1080 && video?.height === 1920 && Math.abs(numerator / denominator - 30) < .01 && !audio, "PA5C_FFPROBE_CONTRACT_INVALID");
  console.log(JSON.stringify({ checker: "PASS", scene: report.sceneId, derivedAssets: report.derived.length, previewFiles: previewFiles.length, ffprobe: "1080x1920@30fps_silent", externalRequests: report.externalRequests, ttsRequests: report.ttsRequests }, null, 2));
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
