/**
 * Builds a data-only upload payload JSON from a TTS mux summary + upload metadata fixture.
 *
 * Usage:
 *   node scripts/build-upload-payload-from-tts-mux-summary.mjs \
 *     --summary  C:\tmp\money-shorts-os\tts-audio-mux-v1\tts-mux-summary.json \
 *     --metadata scripts\fixtures\provider-candidate-upload-metadata.local-mock.json \
 *     --out-dir  C:\tmp\money-shorts-os\upload-payload-v1
 *
 * Security constraints:
 * - No upload, API call, OAuth, accessToken, refreshToken.
 * - No YouTube/Instagram API. No fetch/axios.
 * - No shell: true. spawnSync args array only.
 * - out-dir must be outside repo root.
 * - No .money-shorts-local/ access.
 * - No output artifacts inside repo.
 * - piq_diag_out.txt never touched.
 *
 * This script validates the mp4 artifact with ffprobe, then assembles a
 * data-only upload payload JSON. No upload occurs.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

// ── CLI args ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}

const summaryPath = getArg("--summary");
const metadataPath = getArg("--metadata");
const outDir = getArg("--out-dir");

if (!summaryPath || !metadataPath || !outDir) {
  console.error(
    "Usage: node build-upload-payload-from-tts-mux-summary.mjs --summary <path> --metadata <path> --out-dir <path>",
  );
  process.exit(1);
}

const summaryAbsPath = resolve(summaryPath);
const metadataAbsPath = resolve(REPO_ROOT, metadataPath);
const outDirAbs = resolve(outDir);

// Safety: out-dir must not be inside repo root
if (outDirAbs.startsWith(REPO_ROOT + "\\") || outDirAbs.startsWith(REPO_ROOT + "/")) {
  console.error(
    `ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`,
  );
  process.exit(1);
}

// Safety: .money-shorts-local forbidden
if (
  [summaryAbsPath, metadataAbsPath, outDirAbs].some((p) =>
    p.includes(".money-shorts-local"),
  )
) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(1);
}

console.log(`\n[upload-payload] summary:  ${summaryAbsPath}`);
console.log(`[upload-payload] metadata: ${metadataAbsPath}`);
console.log(`[upload-payload] out-dir:  ${outDirAbs}\n`);

// ── Load inputs ─────────────────────────────────────────────────────────────────
let ttsMuxSummary;
try {
  ttsMuxSummary = JSON.parse(readFileSync(summaryAbsPath, "utf-8"));
} catch (e) {
  console.error(`ABORT: Cannot read TTS mux summary: ${e.message}`);
  process.exit(1);
}

let uploadMetadata;
try {
  uploadMetadata = JSON.parse(readFileSync(metadataAbsPath, "utf-8"));
} catch (e) {
  console.error(`ABORT: Cannot read upload metadata: ${e.message}`);
  process.exit(1);
}

const sourceVideoPath = ttsMuxSummary.outputMp4Path;
if (!sourceVideoPath) {
  console.error("ABORT: tts-mux-summary.json missing outputMp4Path.");
  process.exit(1);
}

console.log(`  sourceVideoPath: ${sourceVideoPath}`);
console.log(`  manifestId:      ${ttsMuxSummary.manifestId}`);
console.log(`  mode:            ${ttsMuxSummary.mode}`);
console.log();

// ── ffprobe validation ─────────────────────────────────────────────────────────
console.log("[step 1/3] Validating source video with ffprobe...");

const probeArgs = [
  "-v", "quiet",
  "-print_format", "json",
  "-show_format",
  "-show_streams",
  sourceVideoPath,
];

const probeResult = spawnSync("ffprobe", probeArgs, {
  encoding: "utf-8",
  maxBuffer: 2 * 1024 * 1024,
});

if (probeResult.status !== 0) {
  console.error(
    `ABORT: ffprobe failed (exit ${probeResult.status}) — cannot build upload payload without verified artifact.`,
  );
  if (probeResult.stderr) console.error(probeResult.stderr.slice(-300));
  process.exit(1);
}

let probe;
try {
  probe = JSON.parse(probeResult.stdout);
} catch {
  console.error("ABORT: Cannot parse ffprobe output.");
  process.exit(1);
}

const fmt = probe.format;
const streams = probe.streams ?? [];
const videoStream = streams.find((s) => s.codec_type === "video");
const audioStreams = streams.filter((s) => s.codec_type === "audio");

const probedDurationSec = parseFloat(fmt?.duration ?? "0");
const probedFileSizeBytes = parseInt(fmt?.size ?? "0", 10);
const probedVideoCodec = videoStream?.codec_name ?? "unknown";
const probedAudioCodec = audioStreams[0]?.codec_name ?? "none";
const probedWidth = videoStream?.width ?? 0;
const probedHeight = videoStream?.height ?? 0;
const probedAudioStreamCount = audioStreams.length;

console.log(`  duration:      ${probedDurationSec}s`);
console.log(`  resolution:    ${probedWidth}x${probedHeight}`);
console.log(`  video codec:   ${probedVideoCodec}`);
console.log(`  audio codec:   ${probedAudioCodec}`);
console.log(`  audio streams: ${probedAudioStreamCount}`);
console.log(`  file size:     ${Math.round(probedFileSizeBytes / 1024)}KB`);

// Validation checks
const targetDur = uploadMetadata.targetDurationSec ?? ttsMuxSummary.targetDurationSec ?? 30;
const durationLo = targetDur - 0.5;
const durationHi = targetDur + 0.5;

const checks = [
  ["format is mp4", fmt?.format_name?.includes("mp4")],
  ["video codec h264", probedVideoCodec === "h264"],
  ["width 1080", probedWidth === 1080],
  ["height 1920", probedHeight === 1920],
  [`duration ${targetDur}s ± 0.5s`, probedDurationSec >= durationLo && probedDurationSec <= durationHi],
  ["audio stream count >= 1", probedAudioStreamCount >= 1],
  ["audio codec aac", probedAudioCodec === "aac"],
];

console.log();
let allPass = true;
for (const [label, ok] of checks) {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) allPass = false;
}

if (!allPass) {
  console.error("\nABORT: ffprobe validation FAILED — cannot build upload payload.");
  process.exit(1);
}
console.log();

// ── Build platform payloads ────────────────────────────────────────────────────
console.log("[step 2/3] Building platform payloads...");

const yt = uploadMetadata.youtube_shorts ?? {};
const ig = uploadMetadata.instagram_reels ?? {};

const platformPayloads = [
  {
    platform: "youtube_shorts",
    title: yt.title ?? "",
    description: yt.description ?? "",
    hashtags: yt.hashtags ?? [],
    visibilityPlan: yt.visibilityPlan ?? "owner_review_first",
    categoryId: yt.categoryId ?? null,
    defaultLanguage: yt.defaultLanguage ?? "ko",
    madeForKids: yt.madeForKids ?? false,
    notUploaded: true,
    ownerApprovalRequired: true,
  },
  {
    platform: "instagram_reels",
    caption: ig.caption ?? "",
    hashtags: ig.hashtags ?? [],
    visibilityPlan: ig.visibilityPlan ?? "owner_review_first",
    notUploaded: true,
    ownerApprovalRequired: true,
  },
];

console.log(`  platforms: ${platformPayloads.map((p) => p.platform).join(", ")}`);
console.log();

// ── Assemble upload payload ────────────────────────────────────────────────────
console.log("[step 3/3] Assembling upload payload...");

const riskNotes = [
  ...(uploadMetadata.riskNotes ?? []),
  ...(ttsMuxSummary.riskNotes ?? []),
];

const uploadPayload = {
  schemaVersion: "money_shorts_upload_payload_v1",
  mode: "local_mock",
  uploadPayloadId: `upload-payload-${ttsMuxSummary.manifestId}-local-mock`,
  sourceManifestId: ttsMuxSummary.manifestId,
  sourceVideoPath,
  artifact: {
    durationSec: probedDurationSec,
    widthPx: probedWidth,
    heightPx: probedHeight,
    videoCodec: probedVideoCodec,
    audioCodec: probedAudioCodec,
    audioStreamCount: probedAudioStreamCount,
    fileSizeBytes: probedFileSizeBytes,
    ffprobeVerified: true,
  },
  platformPayloads,
  ownerApprovalRequired: true,
  notUploaded: true,
  metadataFixturePath: metadataAbsPath,
  ttsMuxSummaryPath: summaryAbsPath,
  builtAt: new Date().toISOString(),
  riskNotes,
};

// ── Write payload ──────────────────────────────────────────────────────────────
mkdirSync(outDirAbs, { recursive: true });

const payloadFileName = `provider-candidate-upload-payload.local-mock.json`;
const payloadPath = join(outDirAbs, payloadFileName);
writeFileSync(payloadPath, JSON.stringify(uploadPayload, null, 2), "utf-8");

console.log(`\n[done] upload payload: ${payloadPath}`);
console.log(`[done] artifact:       ${probedDurationSec}s, ${Math.round(probedFileSizeBytes / 1024)}KB, ${probedVideoCodec}+${probedAudioCodec}, ${probedWidth}x${probedHeight}`);
console.log(`[done] platforms:      ${platformPayloads.map((p) => p.platform).join(", ")}`);
console.log(`[done] notUploaded:    true  ownerApprovalRequired: true`);
console.log(`[done] ALL PASS\n`);
