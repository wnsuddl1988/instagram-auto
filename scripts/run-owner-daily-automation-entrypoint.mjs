/**
 * Owner daily automation entrypoint (no-live usability bridge).
 *
 * task: owner-usable-automation-entrypoint-no-live-v1
 *
 * Single local operator command that ties together:
 *   - the existing local generation dry-run pipeline (render-manifest → mp4 packet),
 *   - dual-platform publish preflight (Instagram + YouTube readiness/gates),
 *   - the armed duplicate-guarded publish status for the current evidence content.
 *
 * This script does NOT publish anything, does NOT call any external API, and does
 * NOT read env/secret values. It only shells out to existing no-live scripts and
 * summarizes their JSON output for the Owner.
 *
 * Modes:
 *   --status                 : no-live readiness summary (source files, evidence refs).
 *   --dry-run                : run the existing render-manifest local dry-run pipeline
 *                               using safe default fixtures (unless --manifest/--out-root given).
 *   --preflight               : run scripts/run-dual-platform-final-publish-orchestrator.mjs --preflight
 *                               and summarize readiness + duplicate-guard status.
 *   --duplicate-guard-check   : only if --preflight confirms BOTH platform keys will be
 *                               duplicate-blocked, run the orchestrator `--live` once and
 *                               report the blocked result as a safety confirmation — never
 *                               as a successful publish. If duplicate block is not confirmed,
 *                               this mode fails closed and does NOT invoke --live.
 *
 * Security constraints:
 * - No process.env access anywhere in this file.
 * - No .env/.env.local read.
 * - No fetch/axios/googleapis/graph API calls.
 * - No Vercel Blob put/list/del/head.
 * - No shell: true — spawnSync(process.execPath, [...], { shell: false }) only.
 * - Never invokes --live/--arm unless --preflight output confirms duplicate block for
 *   BOTH instagram_reels and youtube_shorts keys of the current content.
 * - exit code 3 (BLOCKED_DUPLICATE_ALREADY_PUBLISHED) is treated as an expected safe
 *   block, never reported as "published"/"success".
 */

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const ORCHESTRATOR_SCRIPT = resolve(REPO_ROOT, "scripts/run-dual-platform-final-publish-orchestrator.mjs");
const RENDER_MANIFEST_RUNNER_SCRIPT = resolve(REPO_ROOT, "scripts/run-local-money-shorts-from-render-manifest.mjs");

const DEFAULT_MANIFEST = resolve(REPO_ROOT, "scripts/fixtures/provider-candidate-render-manifest.visual-only.json");
const DEFAULT_DRY_RUN_OUT_ROOT = "C:\\tmp\\money-shorts-os\\owner-daily-automation-entrypoint-v1";

// evidence reference for the current already-published content (secret-free, public only)
const EXISTING_EVIDENCE = {
  contentId: "t1_lifestyle_inflation",
  version: "v3_2",
  instagramMediaId: "17916511431199303",
  youtubeVideoId: "r9jhckdpC9w",
  youtubeVideoUrl: "https://www.youtube.com/shorts/r9jhckdpC9w",
};

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}
function hasFlag(name) {
  return args.includes(name);
}

const MODES = ["--status", "--dry-run", "--preflight", "--duplicate-guard-check"];
const requestedMode = MODES.find((m) => hasFlag(m));

function printUsage() {
  console.log(
    [
      "Owner daily automation entrypoint (no-live)",
      "",
      "Usage:",
      "  node scripts/run-owner-daily-automation-entrypoint.mjs --status",
      "  node scripts/run-owner-daily-automation-entrypoint.mjs --dry-run [--manifest <path>] [--out-root <path>]",
      "  node scripts/run-owner-daily-automation-entrypoint.mjs --preflight",
      "  node scripts/run-owner-daily-automation-entrypoint.mjs --duplicate-guard-check",
      "",
      "Exactly one mode flag is required.",
    ].join("\n"),
  );
}

if (!requestedMode) {
  printUsage();
  process.exit(1);
}

// ── helper: run a script no-live via spawnSync (shell:false always) ──────────
function runScript(scriptAbsPath, scriptArgs, { captureOnly } = { captureOnly: false }) {
  const result = spawnSync(process.execPath, [scriptAbsPath, ...scriptArgs], {
    encoding: "utf-8",
    maxBuffer: 20 * 1024 * 1024,
    cwd: REPO_ROOT,
    shell: false,
  });
  if (!captureOnly) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }
  return {
    exitCode: result.status ?? -1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function parseJsonSafe(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

// ── run preflight (read-only, no-live) and extract a secret-free summary ─────
function runPreflightSummary() {
  const { exitCode, stdout } = runScript(ORCHESTRATOR_SCRIPT, ["--preflight"], { captureOnly: true });
  if (exitCode !== 0) {
    return {
      ranSuccessfully: false,
      exitCode,
      preflightOk: false,
      reason: `orchestrator --preflight exited ${exitCode}`,
    };
  }
  const parsed = parseJsonSafe(stdout);
  if (!parsed.ok) {
    return {
      ranSuccessfully: false,
      exitCode,
      preflightOk: false,
      reason: `stdout parse failed: ${parsed.error}`,
    };
  }
  const pf = parsed.value?.preflight ?? {};
  const liveArm = pf?.liveArm ?? {};
  const dupBlock = liveArm?.currentContentDuplicateBlock ?? {};
  const bothWillBeBlocked = dupBlock.instagramWillBeBlocked === true && dupBlock.youtubeWillBeBlocked === true;
  return {
    ranSuccessfully: true,
    exitCode,
    preflightOk: pf?.preflightOk === true,
    metadataOptimizationGateOk: pf?.metadataOptimizationGateOk === true,
    duplicateGuardUsesV3_2: pf?.duplicateGuardUsesV3_2 === true,
    sourceFilesReady: pf?.sourceFilesReady === true,
    armed: liveArm?.armed === true,
    duplicateGuardEvaluatedBeforeCredentialResolution: liveArm?.duplicateGuardEvaluatedBeforeCredentialResolution === true,
    credentialResolutionWiredThisSlice: liveArm?.credentialResolutionWiredThisSlice === true,
    blobPublicUrlLivenessEvidenceOk: liveArm?.blobPublicUrlLivenessEvidence?.ok === true,
    currentContentDuplicateBlock: {
      instagramKey: dupBlock.instagramKey ?? null,
      youtubeKey: dupBlock.youtubeKey ?? null,
      instagramWillBeBlocked: dupBlock.instagramWillBeBlocked === true,
      youtubeWillBeBlocked: dupBlock.youtubeWillBeBlocked === true,
      bothWillBeBlocked,
      expectedLiveStatus: dupBlock.expectedLiveStatus ?? null,
      expectedLiveExitCode: dupBlock.expectedLiveExitCode ?? null,
    },
    raw: parsed.value,
  };
}

// ── mode: --status ────────────────────────────────────────────────────────────
function runStatus() {
  const manifestExists = existsSync(DEFAULT_MANIFEST);
  const orchestratorExists = existsSync(ORCHESTRATOR_SCRIPT);
  const renderManifestRunnerExists = existsSync(RENDER_MANIFEST_RUNNER_SCRIPT);

  const summary = {
    schemaVersion: "owner_daily_automation_entrypoint_status_v1",
    mode: "status",
    noLive: true,
    envSecretValuesAccessedThisRun: false,
    checks: {
      defaultDryRunManifestExists: manifestExists,
      dualPlatformOrchestratorScriptExists: orchestratorExists,
      renderManifestLocalRunnerScriptExists: renderManifestRunnerExists,
    },
    existingEvidence: {
      note: "Already-published content. Reference only — will not be reposted (see duplicate guard).",
      ...EXISTING_EVIDENCE,
    },
    ownerNextSteps: {
      generateLocalDryRunPacket: "node scripts/run-owner-daily-automation-entrypoint.mjs --dry-run",
      checkPublishReadiness: "node scripts/run-owner-daily-automation-entrypoint.mjs --preflight",
      confirmCurrentContentIsSafelyBlocked: "node scripts/run-owner-daily-automation-entrypoint.mjs --duplicate-guard-check",
    },
    whyCurrentContentWillNotRepost:
      "t1_lifestyle_inflation/v3_2 already has completed Instagram (media_id " +
      EXISTING_EVIDENCE.instagramMediaId +
      ") and YouTube (videoId " +
      EXISTING_EVIDENCE.youtubeVideoId +
      ") publish evidence. The dual-platform orchestrator's duplicate publish guard blocks " +
      "this exact (contentId, platform, version) key before any credential resolution or API call.",
    futureLiveRunApprovalNeeded: [
      "New content unit (different contentId/version) with its own metadata + source files.",
      "Explicit Owner approval token for a real end-to-end live run (beyond APPROVE_DUAL_PLATFORM_ARM,",
      "which only arms the gate — it does not bypass the duplicate guard or wire credential resolution).",
      "Credential resolution for Instagram/YouTube is not wired in this slice; a separate approved slice",
      "must add that before any real publish can occur.",
    ],
  };

  console.log(JSON.stringify(summary, null, 2));
  console.log("");
  console.log("── Owner summary ──────────────────────────────────────────────");
  console.log(`  default dry-run manifest exists:      ${manifestExists}`);
  console.log(`  dual-platform orchestrator present:   ${orchestratorExists}`);
  console.log(`  render-manifest local runner present: ${renderManifestRunnerExists}`);
  console.log(`  existing evidence (will NOT repost):  Instagram media_id ${EXISTING_EVIDENCE.instagramMediaId}, YouTube videoId ${EXISTING_EVIDENCE.youtubeVideoId}`);
  console.log("");
  return summary.checks.defaultDryRunManifestExists && summary.checks.dualPlatformOrchestratorScriptExists && summary.checks.renderManifestLocalRunnerScriptExists ? 0 : 1;
}

// ── mode: --dry-run ────────────────────────────────────────────────────────────
function runDryRun() {
  const manifestPath = getArg("--manifest") || DEFAULT_MANIFEST;
  const outRoot = getArg("--out-root") || DEFAULT_DRY_RUN_OUT_ROOT;
  const outRootAbs = resolve(outRoot);

  if (outRootAbs.startsWith(REPO_ROOT + "\\") || outRootAbs.startsWith(REPO_ROOT + "/")) {
    console.error(`ABORT: --out-root must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-root: ${outRootAbs}`);
    return 1;
  }
  if (!existsSync(manifestPath)) {
    console.error(`ABORT: manifest not found: ${manifestPath}`);
    return 1;
  }

  console.log(`[owner-entrypoint] running local render-manifest dry-run pipeline`);
  console.log(`[owner-entrypoint] manifest: ${manifestPath}`);
  console.log(`[owner-entrypoint] out-root: ${outRootAbs}`);
  console.log("");

  const { exitCode } = runScript(RENDER_MANIFEST_RUNNER_SCRIPT, [
    "--manifest", manifestPath,
    "--out-root", outRootAbs,
  ]);

  return exitCode;
}

// ── mode: --preflight ──────────────────────────────────────────────────────────
function runPreflight() {
  console.log(`[owner-entrypoint] running dual-platform publish orchestrator --preflight`);
  console.log("");

  const summary = runPreflightSummary();

  console.log("");
  console.log(JSON.stringify({ schemaVersion: "owner_daily_automation_entrypoint_preflight_summary_v1", mode: "preflight", ...summary, raw: undefined }, null, 2));
  console.log("");
  console.log("── Owner summary ──────────────────────────────────────────────");
  console.log(`  preflightOk:                       ${summary.preflightOk}`);
  console.log(`  metadata optimization gate ok:     ${summary.metadataOptimizationGateOk}`);
  console.log(`  duplicate guard uses v3_2:          ${summary.duplicateGuardUsesV3_2}`);
  console.log(`  source files ready:                 ${summary.sourceFilesReady}`);
  console.log(`  live gate armed:                     ${summary.armed}`);
  console.log(`  current content will be blocked:     ${summary.currentContentDuplicateBlock?.bothWillBeBlocked}`);
  console.log(`  expected --live status if run now:   ${summary.currentContentDuplicateBlock?.expectedLiveStatus}`);
  console.log("");

  return summary.ranSuccessfully && summary.preflightOk ? 0 : 1;
}

// ── mode: --duplicate-guard-check ───────────────────────────────────────────────
function runDuplicateGuardCheck() {
  console.log(`[owner-entrypoint] step 1/2: confirming duplicate-block via --preflight`);
  console.log("");
  const summary = runPreflightSummary();

  if (!summary.ranSuccessfully) {
    console.error(`ABORT: --preflight did not run successfully: ${summary.reason}`);
    return 1;
  }

  const dupBlock = summary.currentContentDuplicateBlock;
  const confirmed =
    dupBlock.bothWillBeBlocked === true &&
    dupBlock.expectedLiveStatus === "BLOCKED_DUPLICATE_ALREADY_PUBLISHED" &&
    summary.duplicateGuardEvaluatedBeforeCredentialResolution === true;

  if (!confirmed) {
    console.error(
      "ABORT: preflight does NOT confirm duplicate block for both platform keys. " +
        "Refusing to invoke --live (safety: this mode never runs --live for non-duplicate/new content).",
    );
    console.log(
      JSON.stringify(
        {
          schemaVersion: "owner_daily_automation_entrypoint_duplicate_guard_check_v1",
          mode: "duplicate-guard-check",
          preflightConfirmedDuplicateBlock: false,
          liveInvoked: false,
          currentContentDuplicateBlock: dupBlock,
        },
        null,
        2,
      ),
    );
    return 1;
  }

  console.log(`[owner-entrypoint] preflight confirms duplicate block for both platform keys.`);
  console.log(`[owner-entrypoint] step 2/2: invoking orchestrator --live (expected: safe block, exit 3)`);
  console.log("");

  const { exitCode, stdout } = runScript(ORCHESTRATOR_SCRIPT, ["--live"], { captureOnly: true });
  const parsed = parseJsonSafe(stdout);
  const liveResult = parsed.ok ? parsed.value : null;

  const isExpectedSafeBlock = exitCode === 3 && liveResult?.status === "BLOCKED_DUPLICATE_ALREADY_PUBLISHED";
  // Never treat exit 0 / any non-blocked status as a "publish success" — this mode only
  // exists to confirm the safety block, and any other outcome is reported as unexpected.
  const isUnexpectedNonBlockResult = exitCode !== 3 || liveResult?.status !== "BLOCKED_DUPLICATE_ALREADY_PUBLISHED";

  const outSummary = {
    schemaVersion: "owner_daily_automation_entrypoint_duplicate_guard_check_v1",
    mode: "duplicate-guard-check",
    preflightConfirmedDuplicateBlock: true,
    liveInvoked: true,
    liveExitCode: exitCode,
    liveStatus: liveResult?.status ?? null,
    isExpectedSafeBlock,
    isUnexpectedNonBlockResult,
    treatedAsPublishSuccess: false,
    sideEffectCountersAllZero: liveResult?.sideEffectCounters
      ? Object.values(liveResult.sideEffectCounters).every((v) => v === 0)
      : null,
    credentialResolutionReached: liveResult?.credentialResolutionReached ?? null,
    actualApiCallReached: liveResult?.actualApiCallReached ?? null,
    existingEvidence: {
      note: "reference only, retryForbidden — not a new publish",
      ...EXISTING_EVIDENCE,
    },
  };

  console.log(JSON.stringify(outSummary, null, 2));
  console.log("");
  console.log("── Owner summary ──────────────────────────────────────────────");
  if (isExpectedSafeBlock) {
    console.log("  RESULT: SAFE BLOCK confirmed. Nothing was published. This is the expected/correct outcome.");
    console.log(`  Instagram/YouTube API calls: 0 (credentialResolutionReached=${outSummary.credentialResolutionReached}, actualApiCallReached=${outSummary.actualApiCallReached})`);
  } else {
    console.log("  RESULT: UNEXPECTED — orchestrator --live did not return the expected duplicate-block status.");
    console.log("  This entrypoint does NOT treat this as a successful publish. Report to Codex/Owner before proceeding.");
  }
  console.log("");

  return isExpectedSafeBlock ? 0 : 1;
}

// ── main ────────────────────────────────────────────────────────────────────────
let exitCode;
switch (requestedMode) {
  case "--status":
    exitCode = runStatus();
    break;
  case "--dry-run":
    exitCode = runDryRun();
    break;
  case "--preflight":
    exitCode = runPreflight();
    break;
  case "--duplicate-guard-check":
    exitCode = runDuplicateGuardCheck();
    break;
  default:
    printUsage();
    exitCode = 1;
}

process.exit(exitCode);
