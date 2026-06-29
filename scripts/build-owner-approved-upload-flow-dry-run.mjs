/**
 * Owner-approved upload flow dry-run builder.
 *
 * Usage:
 *   node scripts/build-owner-approved-upload-flow-dry-run.mjs \
 *     --payload  <upload payload json> \
 *     --approval <owner approval json> \
 *     --out-dir  <output directory (must be outside repo)>
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
 * Validates Owner approval fixture then ffprobe-verifies the artifact mp4.
 * Produces upload-ready dry-run packet and execution record.
 * Actual upload is never performed — actualUploadAllowed and actualUploadPerformed are always false.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
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

const payloadPath = getArg("--payload");
const approvalPath = getArg("--approval");
const outDir = getArg("--out-dir");

if (!payloadPath || !approvalPath || !outDir) {
  console.error(
    "Usage: node build-owner-approved-upload-flow-dry-run.mjs --payload <path> --approval <path> --out-dir <path>",
  );
  process.exit(1);
}

const payloadAbsPath = resolve(payloadPath);
const approvalAbsPath = resolve(REPO_ROOT, approvalPath);
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
  [payloadAbsPath, approvalAbsPath, outDirAbs].some((p) =>
    p.includes(".money-shorts-local"),
  )
) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(1);
}

console.log(`\n[owner-approved-flow] payload:  ${payloadAbsPath}`);
console.log(`[owner-approved-flow] approval: ${approvalAbsPath}`);
console.log(`[owner-approved-flow] out-dir:  ${outDirAbs}\n`);

// ── Load inputs ─────────────────────────────────────────────────────────────────
let uploadPayload;
try {
  uploadPayload = JSON.parse(readFileSync(payloadAbsPath, "utf-8"));
} catch (e) {
  console.error(`ABORT: Cannot read upload payload: ${e.message}`);
  process.exit(1);
}

let ownerApproval;
try {
  ownerApproval = JSON.parse(readFileSync(approvalAbsPath, "utf-8"));
} catch (e) {
  console.error(`ABORT: Cannot read owner approval: ${e.message}`);
  process.exit(1);
}

// ── Approval gate ───────────────────────────────────────────────────────────────
console.log("[step 1/3] Validating Owner approval gate...");

const gateChecks = [];

function gate(label, condition, fatal = true) {
  const ok = Boolean(condition);
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
  gateChecks.push({ label, ok });
  if (!ok && fatal) {
    console.error(`\nABORT: Approval gate FAILED — ${label}`);
    process.exit(1);
  }
}

gate(
  "approval schemaVersion is money_shorts_owner_upload_approval_v1",
  ownerApproval.schemaVersion === "money_shorts_owner_upload_approval_v1",
);
gate(
  "approvalStatus is approved",
  ownerApproval.approvalStatus === "approved",
);
gate(
  "approvedFor is dry_run_upload_ready_packet_only",
  ownerApproval.approvedFor === "dry_run_upload_ready_packet_only",
);
gate(
  "actualUploadAllowed is false",
  ownerApproval.actualUploadAllowed === false,
);
gate(
  "actualUploadPerformed is false",
  ownerApproval.actualUploadPerformed === false,
);
gate(
  "uploadPayloadId matches payload",
  ownerApproval.uploadPayloadId === uploadPayload.uploadPayloadId,
);
gate(
  "sourceManifestId matches payload",
  ownerApproval.sourceManifestId === uploadPayload.sourceManifestId,
);

// approvedPlatforms must be a subset of payload platform IDs
const payloadPlatformIds = (uploadPayload.platformPayloads ?? []).map((p) => p.platform);
const approvedPlatforms = ownerApproval.approvedPlatforms ?? [];
gate(
  "approvedPlatforms is non-empty",
  approvedPlatforms.length > 0,
);
gate(
  "approvedPlatforms is subset of payload platforms",
  approvedPlatforms.every((p) => payloadPlatformIds.includes(p)),
);

gate(
  "payload.ownerApprovalRequired is true",
  uploadPayload.ownerApprovalRequired === true,
);
gate(
  "payload.notUploaded is true",
  uploadPayload.notUploaded === true,
);

console.log(`\n  approval gate: ${gateChecks.filter((c) => c.ok).length}/${gateChecks.length} PASS\n`);

// ── ffprobe artifact validation ─────────────────────────────────────────────────
console.log("[step 2/3] Re-validating source mp4 artifact with ffprobe...");

const sourceVideoPath = uploadPayload.sourceVideoPath;
if (!sourceVideoPath) {
  console.error("ABORT: upload payload missing sourceVideoPath.");
  process.exit(1);
}

// Confirm file exists before probing
try {
  statSync(sourceVideoPath);
} catch {
  console.error(`ABORT: source mp4 not found: ${sourceVideoPath}`);
  process.exit(1);
}

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
    `ABORT: ffprobe failed (exit ${probeResult.status}) on: ${sourceVideoPath}`,
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

const TARGET_DURATION_SEC = 30;
const durationLo = TARGET_DURATION_SEC - 0.5;
const durationHi = TARGET_DURATION_SEC + 0.5;

const artifactChecks = [
  ["format is mp4", fmt?.format_name?.includes("mp4")],
  ["video codec h264", probedVideoCodec === "h264"],
  ["width 1080", probedWidth === 1080],
  ["height 1920", probedHeight === 1920],
  [`duration ${TARGET_DURATION_SEC}s ± 0.5s`, probedDurationSec >= durationLo && probedDurationSec <= durationHi],
  ["audio stream count >= 1", probedAudioStreamCount >= 1],
  ["audio codec aac", probedAudioCodec === "aac"],
];

console.log();
let allArtifactPass = true;
for (const [label, ok] of artifactChecks) {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) allArtifactPass = false;
}

if (!allArtifactPass) {
  console.error("\nABORT: artifact ffprobe validation FAILED — cannot produce upload-ready packet.");
  process.exit(1);
}
console.log();

// ── Build output packet ─────────────────────────────────────────────────────────
console.log("[step 3/3] Building upload-ready dry-run packet...");

mkdirSync(outDirAbs, { recursive: true });

const builtAt = new Date().toISOString();

const riskNotes = [
  ...(ownerApproval.riskNotes ?? []),
  ...(uploadPayload.riskNotes ?? []),
  "owner-approved-upload-flow: no actual upload performed.",
  "nextStep: live_upload_requires_explicit_owner_approval_and_credentials",
];

// Deduplicate while preserving order
const dedupedRiskNotes = [...new Set(riskNotes)];

// Supported platforms (static reference for static guard)
const SUPPORTED_PLATFORMS = ["youtube_shorts", "instagram_reels"];

// Filter platformPayloads to approved platforms only
const filteredPlatformPayloads = (uploadPayload.platformPayloads ?? []).filter(
  (p) => approvedPlatforms.includes(p.platform) && SUPPORTED_PLATFORMS.includes(p.platform),
);

const uploadReadyPacket = {
  schemaVersion: "money_shorts_owner_approved_upload_flow_v1",
  mode: "local_mock",
  flowStatus: "upload_ready_dry_run",
  actualUploadAllowed: false,
  actualUploadPerformed: false,
  notUploaded: true,
  ownerApprovalRequired: true,
  approval: {
    approvalId: ownerApproval.approvalId,
    approvalStatus: ownerApproval.approvalStatus,
    approvedFor: ownerApproval.approvedFor,
    approvedPlatforms,
    approvalTimestamp: ownerApproval.approvalTimestamp ?? null,
  },
  uploadPayloadId: uploadPayload.uploadPayloadId,
  sourceManifestId: uploadPayload.sourceManifestId,
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
  platformPayloads: filteredPlatformPayloads,
  nextStep: "live_upload_requires_explicit_owner_approval_and_credentials",
  builtAt,
  riskNotes: dedupedRiskNotes,
};

const packetPath = join(outDirAbs, "owner-approved-upload-ready-packet.local-mock.json");
writeFileSync(packetPath, JSON.stringify(uploadReadyPacket, null, 2), "utf-8");

const dryRunRecord = {
  schemaVersion: "money_shorts_owner_approved_upload_flow_v1",
  mode: "local_mock",
  recordType: "dry_run_execution_record",
  flowStatus: "upload_ready_dry_run",
  actualUploadAllowed: false,
  actualUploadPerformed: false,
  notUploaded: true,
  ownerApprovalRequired: true,
  approvalId: ownerApproval.approvalId,
  uploadPayloadId: uploadPayload.uploadPayloadId,
  sourceManifestId: uploadPayload.sourceManifestId,
  gateCheckResults: gateChecks,
  artifactCheckResults: artifactChecks.map(([label, ok]) => ({ label, ok })),
  allGatesPassed: gateChecks.every((c) => c.ok),
  allArtifactChecksPassed: allArtifactPass,
  uploadReadyPacketPath: packetPath,
  payloadPath: payloadAbsPath,
  approvalPath: approvalAbsPath,
  executedAt: builtAt,
  riskNotes: [
    "dry_run_execution_record: documents what was checked, not what was uploaded.",
    "actualUploadPerformed=false — no upload occurred during this execution.",
  ],
};

const recordPath = join(outDirAbs, "owner-approved-upload-dry-run-record.local-mock.json");
writeFileSync(recordPath, JSON.stringify(dryRunRecord, null, 2), "utf-8");

console.log(`\n[done] upload-ready packet: ${packetPath}`);
console.log(`[done] dry-run record:      ${recordPath}`);
console.log(`[done] flowStatus:          upload_ready_dry_run`);
console.log(`[done] actualUploadAllowed: false`);
console.log(`[done] actualUploadPerformed: false`);
console.log(`[done] notUploaded:         true`);
console.log(`[done] approvedPlatforms:   ${approvedPlatforms.join(", ")}`);
console.log(`[done] ALL PASS\n`);
