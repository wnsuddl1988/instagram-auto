/**
 * Single-entrypoint local dry-run runner: RenderManifest → complete pipeline.
 *
 * Usage:
 *   node scripts/run-local-money-shorts-from-render-manifest.mjs \
 *     --manifest  scripts\fixtures\provider-candidate-render-manifest.visual-only.json \
 *     --out-root  C:\tmp\money-shorts-os\render-manifest-local-runner-v1
 *
 * Internally runs two steps in sequence:
 *   1. build-local-pipeline-inputs-from-render-manifest.mjs  → ${outRoot}\inputs
 *   2. run-local-money-shorts-pipeline-dry-run.mjs           → ${outRoot}\run
 *
 * Outputs:
 *   ${outRoot}\inputs\  — generated TTS script, upload metadata, owner approval
 *   ${outRoot}\run\     — visual-only mp4, TTS mux mp4, upload payload, dry-run packet
 *   ${outRoot}\render-manifest-local-run-summary.local-mock.json
 *
 * Security constraints:
 * - No upload, API call, OAuth, accessToken, refreshToken.
 * - No YouTube/Instagram API. No fetch/axios.
 * - No shell: true. spawnSync(process.execPath, [...]) only.
 * - out-root must be outside repo root.
 * - No .money-shorts-local/ access.
 * - No output artifacts inside repo.
 * - piq_diag_out.txt never touched.
 * - actualUploadAllowed is always false.
 * - actualUploadPerformed is always false.
 * - notUploaded is always true.
 */

import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
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
const outRoot = getArg("--out-root");

if (!manifestPath || !outRoot) {
  console.error(
    "Usage: node run-local-money-shorts-from-render-manifest.mjs --manifest <path> --out-root <path>",
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
if ([manifestPath, outRootAbs].some((p) => p.includes(".money-shorts-local"))) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(1);
}

const inputsDir = join(outRootAbs, "inputs");
const runDir = join(outRootAbs, "run");

mkdirSync(outRootAbs, { recursive: true });

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║   Money Shorts — Render Manifest Local Runner                ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");
console.log(`  manifest:  ${manifestPath}`);
console.log(`  out-root:  ${outRootAbs}`);
console.log(`  inputs:    ${inputsDir}`);
console.log(`  run:       ${runDir}`);
console.log();

const startedAt = new Date().toISOString();
const stepResults = [];

function runStep(stepName, scriptRelPath, stepArgs) {
  const scriptAbs = resolve(REPO_ROOT, scriptRelPath);
  const nodeArgs = [scriptAbs, ...stepArgs];

  console.log(`\n${"─".repeat(64)}`);
  console.log(`[runner] step: ${stepName}`);
  console.log(`[runner] script: ${scriptRelPath}`);
  console.log(`[runner] args: ${stepArgs.join(" ")}`);
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

  console.log(`\n[runner] ${stepName}: ${status.toUpperCase()} (exit ${exitCode})`);

  stepResults.push({ step: stepName, status, exitCode });

  if (exitCode !== 0) {
    console.error(`\nABORT: step "${stepName}" failed with exit code ${exitCode}.`);
    writeSummary("failed", stepResults, {});
    process.exit(1);
  }
}

function writeSummary(flowStatus, steps, artifacts) {
  const finishedAt = new Date().toISOString();
  const summary = {
    schemaVersion: "money_shorts_render_manifest_local_run_summary_v1",
    mode: "local_mock",
    flowStatus,
    startedAt,
    finishedAt,
    manifestPath: resolve(REPO_ROOT, manifestPath),
    steps,
    artifacts,
    actualUploadAllowed: false,
    actualUploadPerformed: false,
    notUploaded: true,
    ownerApprovalRequired: true,
    riskNotes: [
      "local_mock dry-run: no actual upload performed.",
      "TTS audio is local_mock (pink noise placeholder). Real TTS required before public upload.",
      "Generated inputs are derived from RenderManifest caption overlays only — no new claims added.",
      "nextStep: live_upload_requires_explicit_owner_approval_and_credentials",
    ],
  };
  const summaryPath = join(outRootAbs, "render-manifest-local-run-summary.local-mock.json");
  try {
    mkdirSync(outRootAbs, { recursive: true });
    writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");
    console.log(`\n[runner] top-level summary: ${summaryPath}`);
  } catch (e) {
    console.error(`[runner] WARNING: Could not write summary: ${e.message}`);
  }
  return summaryPath;
}

// ── Step 1: build local pipeline inputs ────────────────────────────────────────
runStep("build_local_pipeline_inputs", "scripts/build-local-pipeline-inputs-from-render-manifest.mjs", [
  "--manifest", manifestPath,
  "--out-dir", inputsDir,
]);

// ── Resolve generated input paths ───────────────────────────────────────────────
const generatedTtsScript = join(inputsDir, "generated-tts-script.local-mock.json");
const generatedUploadMetadata = join(inputsDir, "generated-upload-metadata.local-mock.json");
const generatedOwnerApproval = join(inputsDir, "generated-owner-upload-approval.local-mock.json");

for (const p of [generatedTtsScript, generatedUploadMetadata, generatedOwnerApproval]) {
  if (!existsSync(p)) {
    console.error(`ABORT: expected generated input not found: ${p}`);
    writeSummary("failed", stepResults, {});
    process.exit(1);
  }
}

console.log(`\n[runner] generated inputs verified:`);
console.log(`  tts-script:     ${generatedTtsScript}`);
console.log(`  upload-metadata:${generatedUploadMetadata}`);
console.log(`  owner-approval: ${generatedOwnerApproval}`);

// ── Step 2: run local pipeline with generated inputs ───────────────────────────
runStep("run_local_pipeline", "scripts/run-local-money-shorts-pipeline-dry-run.mjs", [
  "--manifest", manifestPath,
  "--tts-script", generatedTtsScript,
  "--upload-metadata", generatedUploadMetadata,
  "--owner-approval", generatedOwnerApproval,
  "--out-root", runDir,
]);

// ── Build artifacts map ─────────────────────────────────────────────────────────
const pipelineRunSummary = join(runDir, "pipeline-run-summary.local-mock.json");
const uploadReadyPacket = join(runDir, "owner-approved-upload-flow", "owner-approved-upload-ready-packet.local-mock.json");

const artifacts = {
  generatedTtsScript,
  generatedUploadMetadata,
  generatedOwnerApproval,
  pipelineRunSummary,
  uploadReadyPacket,
};

const summaryPath = writeSummary("completed_dry_run", stepResults, artifacts);

console.log(`\n${"═".repeat(64)}`);
console.log("  RENDER MANIFEST LOCAL RUN COMPLETE");
console.log(`  flowStatus:            completed_dry_run`);
console.log(`  actualUploadAllowed:   false`);
console.log(`  actualUploadPerformed: false`);
console.log(`  notUploaded:           true`);
console.log(`  top-level summary:     ${summaryPath}`);
console.log(`  uploadReadyPacket:     ${uploadReadyPacket}`);
console.log(`${"═".repeat(64)}\n`);
