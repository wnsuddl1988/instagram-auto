/**
 * Local Money Shorts pipeline dry-run orchestrator.
 *
 * Usage:
 *   node scripts/run-local-money-shorts-pipeline-dry-run.mjs \
 *     --manifest   scripts\fixtures\provider-candidate-render-manifest.visual-only.json \
 *     --tts-script scripts\fixtures\provider-candidate-tts-script.local-mock.json \
 *     --upload-metadata scripts\fixtures\provider-candidate-upload-metadata.local-mock.json \
 *     --owner-approval  scripts\fixtures\provider-candidate-owner-upload-approval.local-mock.json \
 *     --out-root   C:\tmp\money-shorts-os\local-pipeline-runner-v1
 *
 * Pipeline:
 *   1. visual-only mp4 render
 *   2. local_mock TTS audio mux
 *   3. upload payload build
 *   4. owner-approved upload flow dry-run
 *   5. pipeline run summary
 *
 * Security constraints:
 * - No upload, API call, OAuth, accessToken, refreshToken.
 * - No YouTube/Instagram API. No fetch/axios.
 * - No shell: true. spawnSync(process.execPath, [...]) only.
 * - out-root must be outside repo root.
 * - No .money-shorts-local/ access.
 * - No output artifacts inside repo.
 * - piq_diag_out.txt never touched.
 * - actualUploadPerformed is always false.
 * - notUploaded is always true.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
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

const manifestPath = getArg("--manifest");
const ttsScriptPath = getArg("--tts-script");
const uploadMetadataPath = getArg("--upload-metadata");
const ownerApprovalPath = getArg("--owner-approval");
const outRoot = getArg("--out-root");

if (!manifestPath || !ttsScriptPath || !uploadMetadataPath || !ownerApprovalPath || !outRoot) {
  console.error(
    "Usage: node run-local-money-shorts-pipeline-dry-run.mjs" +
      " --manifest <path>" +
      " --tts-script <path>" +
      " --upload-metadata <path>" +
      " --owner-approval <path>" +
      " --out-root <path>",
  );
  process.exit(1);
}

const outRootAbs = resolve(outRoot);

// Safety: out-root must not be inside repo root
if (outRootAbs.startsWith(REPO_ROOT + "\\") || outRootAbs.startsWith(REPO_ROOT + "/")) {
  console.error(
    `ABORT: --out-root must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-root: ${outRootAbs}`,
  );
  process.exit(1);
}

// Safety: .money-shorts-local forbidden
const inputPaths = [manifestPath, ttsScriptPath, uploadMetadataPath, ownerApprovalPath, outRootAbs];
if (inputPaths.some((p) => p.includes(".money-shorts-local"))) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(1);
}

// ── Step output directories ─────────────────────────────────────────────────────
const visualOnlyDir = join(outRootAbs, "visual-only");
const ttsAudioMuxDir = join(outRootAbs, "tts-audio-mux");
const uploadPayloadDir = join(outRootAbs, "upload-payload");
const ownerApprovedUploadFlowDir = join(outRootAbs, "owner-approved-upload-flow");

mkdirSync(outRootAbs, { recursive: true });

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║   Money Shorts Local Pipeline Dry-Run                        ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");
console.log(`  out-root:       ${outRootAbs}`);
console.log(`  manifest:       ${manifestPath}`);
console.log(`  tts-script:     ${ttsScriptPath}`);
console.log(`  upload-metadata:${uploadMetadataPath}`);
console.log(`  owner-approval: ${ownerApprovalPath}`);
console.log();

// ── Step runner ─────────────────────────────────────────────────────────────────
const startedAt = new Date().toISOString();
const stepResults = [];

function runStep(stepName, scriptRelPath, stepArgs) {
  const scriptAbs = resolve(REPO_ROOT, scriptRelPath);
  const nodeArgs = [scriptAbs, ...stepArgs];

  console.log(`\n${"─".repeat(64)}`);
  console.log(`[pipeline] step: ${stepName}`);
  console.log(`[pipeline] script: ${scriptRelPath}`);
  console.log(`[pipeline] args: ${stepArgs.join(" ")}`);
  console.log();

  const result = spawnSync(process.execPath, nodeArgs, {
    encoding: "utf-8",
    maxBuffer: 20 * 1024 * 1024,
    cwd: REPO_ROOT,
    shell: false,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const exitCode = result.status ?? -1;
  const status = exitCode === 0 ? "pass" : "fail";

  console.log(`\n[pipeline] ${stepName}: ${status.toUpperCase()} (exit ${exitCode})`);

  stepResults.push({ step: stepName, status, exitCode });

  if (exitCode !== 0) {
    console.error(`\nABORT: step "${stepName}" failed with exit code ${exitCode}.`);
    writeSummary("failed", stepResults, {});
    process.exit(1);
  }
}

// ── Step 1: visual-only render ──────────────────────────────────────────────────
runStep("visual_only_render", "scripts/render-visual-only-from-render-manifest.mjs", [
  "--manifest", manifestPath,
  "--out-dir", visualOnlyDir,
]);

// ── Resolve visual-only mp4 path from summary ───────────────────────────────────
const visualOnlySummaryPath = join(visualOnlyDir, "render-summary.json");
let visualOnlyMp4Path;
try {
  const vizSummary = JSON.parse(readFileSync(visualOnlySummaryPath, "utf-8"));
  visualOnlyMp4Path = vizSummary.outputPath;
} catch (e) {
  console.error(`ABORT: Cannot read visual-only render-summary.json: ${e.message}`);
  process.exit(1);
}

if (!visualOnlyMp4Path || !existsSync(visualOnlyMp4Path)) {
  console.error(`ABORT: visual-only mp4 not found at: ${visualOnlyMp4Path}`);
  process.exit(1);
}

console.log(`\n[pipeline] visual-only mp4: ${visualOnlyMp4Path}`);

// ── Step 2: TTS audio mux ───────────────────────────────────────────────────────
runStep("tts_audio_mux", "scripts/mux-local-tts-audio-into-visual-mp4.mjs", [
  "--video", visualOnlyMp4Path,
  "--script", ttsScriptPath,
  "--out-dir", ttsAudioMuxDir,
]);

// ── Resolve TTS mux summary path ────────────────────────────────────────────────
const ttsMuxSummaryPath = join(ttsAudioMuxDir, "tts-mux-summary.json");
if (!existsSync(ttsMuxSummaryPath)) {
  console.error(`ABORT: tts-mux-summary.json not found at: ${ttsMuxSummaryPath}`);
  process.exit(1);
}

let ttsMuxMp4Path;
try {
  const ttsSummary = JSON.parse(readFileSync(ttsMuxSummaryPath, "utf-8"));
  ttsMuxMp4Path = ttsSummary.outputMp4Path;
} catch (e) {
  console.error(`ABORT: Cannot read tts-mux-summary.json: ${e.message}`);
  process.exit(1);
}

console.log(`\n[pipeline] tts-mux mp4: ${ttsMuxMp4Path}`);

// ── Step 3: upload payload ──────────────────────────────────────────────────────
runStep("upload_payload", "scripts/build-upload-payload-from-tts-mux-summary.mjs", [
  "--summary", ttsMuxSummaryPath,
  "--metadata", uploadMetadataPath,
  "--out-dir", uploadPayloadDir,
]);

// ── Resolve upload payload path ─────────────────────────────────────────────────
const uploadPayloadJsonPath = join(uploadPayloadDir, "provider-candidate-upload-payload.local-mock.json");
if (!existsSync(uploadPayloadJsonPath)) {
  console.error(`ABORT: upload payload JSON not found at: ${uploadPayloadJsonPath}`);
  process.exit(1);
}

console.log(`\n[pipeline] upload payload: ${uploadPayloadJsonPath}`);

// ── Step 4: owner-approved upload flow dry-run ──────────────────────────────────
runStep("owner_approved_upload_flow", "scripts/build-owner-approved-upload-flow-dry-run.mjs", [
  "--payload", uploadPayloadJsonPath,
  "--approval", ownerApprovalPath,
  "--out-dir", ownerApprovedUploadFlowDir,
]);

// ── Resolve final artifact paths ────────────────────────────────────────────────
const uploadReadyPacketPath = join(ownerApprovedUploadFlowDir, "owner-approved-upload-ready-packet.local-mock.json");
const dryRunRecordPath = join(ownerApprovedUploadFlowDir, "owner-approved-upload-dry-run-record.local-mock.json");

// ── Build pipeline run summary ──────────────────────────────────────────────────
function writeSummary(flowStatus, steps, artifacts) {
  const finishedAt = new Date().toISOString();
  const summary = {
    schemaVersion: "money_shorts_local_pipeline_run_summary_v1",
    mode: "local_mock",
    flowStatus,
    startedAt,
    finishedAt,
    steps,
    artifacts,
    actualUploadAllowed: false,
    actualUploadPerformed: false,
    notUploaded: true,
    ownerApprovalRequired: true,
    riskNotes: [
      "local_mock dry-run: no actual upload performed.",
      "TTS audio is local_mock (pink noise placeholder). ElevenLabs final-pass required before real upload.",
      "Owner approval gate was validated in step owner_approved_upload_flow.",
      "nextStep: live_upload_requires_explicit_owner_approval_and_credentials",
    ],
  };
  const summaryPath = join(outRootAbs, "pipeline-run-summary.local-mock.json");
  try {
    mkdirSync(outRootAbs, { recursive: true });
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");
    console.log(`\n[pipeline] summary: ${summaryPath}`);
  } catch (e) {
    console.error(`[pipeline] WARNING: Could not write summary: ${e.message}`);
  }
}

const artifacts = {
  visualOnlyMp4: visualOnlyMp4Path ?? null,
  ttsMuxMp4: ttsMuxMp4Path ?? null,
  uploadPayload: uploadPayloadJsonPath,
  uploadReadyPacket: uploadReadyPacketPath,
  dryRunRecord: dryRunRecordPath,
};

writeSummary("completed_dry_run", stepResults, artifacts);

console.log(`\n${"═".repeat(64)}`);
console.log("  PIPELINE COMPLETE — all 4 steps PASS");
console.log(`  flowStatus:           completed_dry_run`);
console.log(`  actualUploadAllowed:  false`);
console.log(`  actualUploadPerformed:false`);
console.log(`  notUploaded:          true`);
console.log(`  uploadReadyPacket:    ${uploadReadyPacketPath}`);
console.log(`${"═".repeat(64)}\n`);
