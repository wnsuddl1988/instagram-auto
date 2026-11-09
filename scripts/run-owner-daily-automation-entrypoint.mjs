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
 *   --credential-preflight    : run the orchestrator --credential-preflight and report ONLY redacted
 *                               env key NAME presence booleans (no values, no lengths, no prefixes).
 *                               no-live: does not read .env.local, resolve credentials, or call APIs.
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
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildContentUnitFromLocalSummary } from "./build-dual-platform-content-unit-from-local-summary.mjs";
import { planYoutubeLetterboxSourceFromContentUnit } from "./plan-youtube-letterbox-source-from-content-unit.mjs";
import { prepareYoutubeLetterboxRenderFromPlan, RUN_DISABLED_STATUS as LETTERBOX_RENDER_RUN_DISABLED_STATUS } from "./prepare-youtube-letterbox-render-from-plan.mjs";
import { planInstagramBlobUploadFromContentUnit } from "./plan-instagram-blob-upload-from-content-unit.mjs";
import { prepareInstagramBlobUploadFromRequest, RUN_DISABLED_STATUS as INSTAGRAM_BLOB_UPLOAD_RUN_DISABLED_STATUS, isRepoRootOrInside } from "./prepare-instagram-blob-upload-from-request.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const ORCHESTRATOR_SCRIPT = resolve(REPO_ROOT, "scripts/run-dual-platform-final-publish-orchestrator.mjs");
const RENDER_MANIFEST_RUNNER_SCRIPT = resolve(REPO_ROOT, "scripts/run-local-money-shorts-from-render-manifest.mjs");
const YOUTUBE_LETTERBOX_RENDER_ONCE_RUNNER_SCRIPT = resolve(REPO_ROOT, "scripts/run-youtube-letterbox-render-from-request-once.mjs");
const YOUTUBE_LETTERBOX_RENDER_APPROVAL_TOKEN = "APPROVE_YOUTUBE_LETTERBOX_LOCAL_RENDER_EXECUTION_ONCE";

const DEFAULT_MANIFEST = resolve(REPO_ROOT, "scripts/fixtures/provider-candidate-render-manifest.visual-only.json");
const DEFAULT_DRY_RUN_OUT_ROOT = "C:\\tmp\\money-shorts-os\\owner-daily-automation-entrypoint-v1";

// 이미 완료된 golden sample(t1_lifestyle_inflation/v3_2)의 checked-in ready fixture.
// 긴 경로를 직접 타이핑하지 않도록 pnpm owner:ready-preflight / owner:ready-duplicate-guard-check가
// 이 경로를 그대로 참조한다. contentId/version이 EXISTING_EVIDENCE와 같아 default evidence content로
// 취급되며(재게시가 아니라 duplicate-safe block 확인용).
const READY_GOLDEN_SAMPLE_CONTENT_UNIT = resolve(
  REPO_ROOT,
  "scripts/fixtures/dual_platform_content_unit.t1_lifestyle_inflation.v3_2.ready.v1.json",
);

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

const MODES = ["--status", "--dry-run", "--preflight", "--credential-preflight", "--duplicate-guard-check", "--build-content-unit", "--plan-youtube-letterbox", "--prepare-youtube-letterbox-render", "--render-youtube-letterbox-once", "--plan-instagram-blob-upload", "--prepare-instagram-blob-upload"];
const requestedMode = MODES.find((m) => hasFlag(m));

function printUsage() {
  console.log(
    [
      "Owner daily automation entrypoint (no-live)",
      "",
      "Usage:",
      "  node scripts/run-owner-daily-automation-entrypoint.mjs --status",
      "  node scripts/run-owner-daily-automation-entrypoint.mjs --dry-run [--manifest <path>] [--out-root <path>]",
      "  node scripts/run-owner-daily-automation-entrypoint.mjs --preflight [--content-unit <path>] [--publish-ledger <path>]",
      "  node scripts/run-owner-daily-automation-entrypoint.mjs --credential-preflight [--content-unit <path>]",
      "  node scripts/run-owner-daily-automation-entrypoint.mjs --duplicate-guard-check [--content-unit <path>] [--publish-ledger <path>]",
      "  node scripts/run-owner-daily-automation-entrypoint.mjs --build-content-unit" +
        " (--summary <path> | --pipeline-summary <path>) --out-dir <path>" +
        " [--content-id <id>] [--version <version>]" +
        " [--youtube-source <path> | --youtube-render-result <youtube-letterbox-render-result.json>]" +
        " [--blob-liveness-result <path>]",
      "  node scripts/run-owner-daily-automation-entrypoint.mjs --plan-youtube-letterbox" +
        " --content-unit <path> --out-dir <path> [--version-suffix <suffix>]",
      "  node scripts/run-owner-daily-automation-entrypoint.mjs --prepare-youtube-letterbox-render" +
        " --plan <youtube-letterbox-source-plan.json> --out-dir <path> [--dry-run | --run]",
      "  node scripts/run-owner-daily-automation-entrypoint.mjs --render-youtube-letterbox-once" +
        " --approval " + YOUTUBE_LETTERBOX_RENDER_APPROVAL_TOKEN +
        " [--request <youtube-letterbox-render-request.json>] [--source <mp4>] [--output <mp4>] [--out-dir <path>]",
      "  node scripts/run-owner-daily-automation-entrypoint.mjs --plan-instagram-blob-upload" +
        " --content-unit <path> --out-dir <path>",
      "  node scripts/run-owner-daily-automation-entrypoint.mjs --prepare-instagram-blob-upload" +
        " --request <instagram-blob-upload-request.json> --out-dir <path> [--dry-run | --run]",
      "",
      "  --content-unit <path>  future new video content unit manifest (dual_platform_content_unit_v1).",
      "                         omit for the default already-published evidence content.",
      "",
      "  --publish-ledger <path>  read-only durable publish ledger (publish_ledger_v1) used as an",
      "                         ADDITIVE duplicate-guard input. READ-ONLY / NO-WRITE: the orchestrator",
      "                         only reads this JSON, never writes it. Missing file = empty ledger (ok).",
      "                         Invalid/corrupt/wrong-schema/duplicate-key = fail-closed BEFORE credential",
      "                         resolution (BLOCKED_PUBLISH_LEDGER_READ_FAILED). Omit to disable the bridge.",
      "",
      "  --build-content-unit builds a dual_platform_content_unit_v1 manifest from an existing local",
      "                        dry-run pipeline summary (--dry-run output). Pass the resulting manifest",
      "                        path to --preflight --content-unit <manifest> to check readiness.",
      "                        Prefer --youtube-render-result <youtube-letterbox-render-result.json> (from",
      "                        --render-youtube-letterbox-once) over --youtube-source: it is validated",
      "                        fail-closed and youtubeSourcePath is derived automatically — no manual mp4",
      "                        path copy needed. Providing both requires them to resolve to the same path.",
      "",
      "  --plan-youtube-letterbox plans a deterministic YouTube Shorts letterbox source path + render",
      "                        profile from a content unit manifest's instagramSourcePath. No ffmpeg is",
      "                        run and no media is created — it only writes a plan JSON under --out-dir.",
      "",
      "  --prepare-youtube-letterbox-render validates a youtube-letterbox-source-plan.json and writes a",
      "                        no-execute render request JSON with the exact future approved command.",
      "                        --run is refused in this slice (fail-closed, status " +
        LETTERBOX_RENDER_RUN_DISABLED_STATUS + ").",
      "",
      "  --render-youtube-letterbox-once runs the approval-gated one-shot local ffmpeg render exactly once",
      "                        from the approved source mp4. Requires the exact --approval token; refuses to",
      "                        run without it and never overwrites an existing output mp4. read-only ffprobe",
      "                        verifies the output. No API/upload/env/deploy side effects.",
      "",
      "  --plan-instagram-blob-upload reads a content unit manifest's instagramSourcePath, hashes it",
      "                        read-only (SHA-256), and writes a deterministic Vercel Blob upload request",
      "                        JSON (pathname + put() option plan). No @vercel/blob call, no upload, no",
      "                        network/env access. Actual upload still requires a separate approved step",
      "                        with approval token APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST.",
      "",
      "  --prepare-instagram-blob-upload consumes an instagram-blob-upload-request.json and re-verifies the",
      "                        source mp4 still matches the recorded size + SHA-256 + deterministic pathname",
      "                        + put() option plan, then writes a no-execute instagram-blob-upload-preflight.json",
      "                        proving readiness. No @vercel/blob call, no upload, no liveness/HEAD, no network/env.",
      "                        --run is refused in this slice (fail-closed, status " +
        INSTAGRAM_BLOB_UPLOAD_RUN_DISABLED_STATUS + "); actual upload requires a separate approved slice.",
      "",
      "Exactly one mode flag is required.",
      "",
      "  Existing golden sample (t1_lifestyle_inflation/v3_2) readiness shortcuts (no-live, no repost):",
      "    pnpm owner:ready-preflight",
      "    pnpm owner:ready-duplicate-guard-check",
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
// contentUnitPath가 주어지면 orchestrator --preflight --content-unit <path>로 전달한다.
// 없으면 default evidence content preflight(기존 동작 불변).
// publishLedgerPath가 주어지면 --publish-ledger <path>를 read-only로 passthrough한다(write 없음).
function runPreflightSummary(contentUnitPath, publishLedgerPath = null) {
  const preflightArgs = ["--preflight"];
  if (contentUnitPath) preflightArgs.push("--content-unit", contentUnitPath);
  if (publishLedgerPath) preflightArgs.push("--publish-ledger", publishLedgerPath);
  const { exitCode, stdout } = runScript(ORCHESTRATOR_SCRIPT, preflightArgs, { captureOnly: true });
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
  const isDefaultContentUnit = parsed.value?.isDefaultContentUnit === true;
  return {
    ranSuccessfully: true,
    exitCode,
    contentUnitManifestPath: parsed.value?.contentUnitManifestPath ?? null,
    isDefaultContentUnit,
    contentUnitKind: pf?.contentUnit?.kind ?? null,
    customContentLiveEnabledThisSlice: pf?.contentUnit?.customContentLiveEnabledThisSlice === true,
    customContentLiveHaltError: pf?.contentUnit?.customContentLiveHaltError ?? null,
    preflightOk: pf?.preflightOk === true,
    metadataOptimizationGateOk: pf?.metadataOptimizationGateOk === true,
    duplicateGuardUsesV3_2: pf?.duplicateGuardUsesV3_2 === true,
    duplicateGuardKeyFormatOk: pf?.duplicateGuardKeyFormatOk === true,
    sourceFilesReady: pf?.sourceFilesReady === true,
    blobLivenessEvidenceOk: pf?.blobPublicUrlLivenessEvidence?.ok === true,
    // read-only publish ledger bridge readiness(non-secret). ledger read 실패가 readiness를 막았는지 표면화.
    publishLedgerPathProvided: pf?.publishLedgerPathProvided === true,
    publishLedgerReadOk: pf?.publishLedgerReadOk !== false, // 미제공/read ok면 true, 실패면 false
    publishLedgerReadFailureBlocksReadiness: pf?.publishLedgerReadFailureBlocksReadiness === true,
    publishLedgerReadFailReason: pf?.publishLedgerReadFailReason ?? null,
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
    // read-only publish ledger bridge 요약(orchestrator preflight가 실은 non-secret boolean/count만).
    publishLedgerBridge: parsed.value?.publishLedgerBridge ?? null,
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
    readyGoldenSampleContentUnit: {
      note:
        "Existing checked-in fixture for the already-published golden sample. Checking it is a " +
        "no-live readiness / duplicate-safe block confirmation only — it never reposts.",
      path: READY_GOLDEN_SAMPLE_CONTENT_UNIT,
      preflightCommand: "pnpm owner:ready-preflight",
      duplicateGuardCheckCommand: "pnpm owner:ready-duplicate-guard-check",
    },
    ownerNextSteps: {
      generateLocalDryRunPacket: "node scripts/run-owner-daily-automation-entrypoint.mjs --dry-run",
      buildContentUnitFromDryRunSummary:
        "node scripts/run-owner-daily-automation-entrypoint.mjs --build-content-unit --summary <generated summary.json> --out-dir <outside-repo path>",
      attachYoutubeSourceFromRenderResult:
        "node scripts/run-owner-daily-automation-entrypoint.mjs --build-content-unit --summary <generated summary.json> --youtube-render-result <youtube-letterbox-render-result.json> --out-dir <outside-repo path>",
      planYoutubeLetterboxSource:
        "node scripts/run-owner-daily-automation-entrypoint.mjs --plan-youtube-letterbox --content-unit <manifest.json> --out-dir <outside-repo path>",
      prepareYoutubeLetterboxRender:
        "node scripts/run-owner-daily-automation-entrypoint.mjs --prepare-youtube-letterbox-render --plan <youtube-letterbox-source-plan.json> --out-dir <outside-repo path>",
      planInstagramBlobUpload:
        "node scripts/run-owner-daily-automation-entrypoint.mjs --plan-instagram-blob-upload --content-unit <manifest.json> --out-dir <outside-repo path>",
      prepareInstagramBlobUpload:
        "node scripts/run-owner-daily-automation-entrypoint.mjs --prepare-instagram-blob-upload --request <instagram-blob-upload-request.json> --out-dir <outside-repo path>",
      checkPublishReadiness: "node scripts/run-owner-daily-automation-entrypoint.mjs --preflight",
      checkCredentialKeyPresence:
        "node scripts/run-owner-daily-automation-entrypoint.mjs --credential-preflight " +
        "(redacted: reports only whether required runtime env key NAMES are present as booleans; " +
        "never reads local secret files, never prints values/lengths/prefixes, never calls APIs).",
      confirmCurrentContentIsSafelyBlocked: "node scripts/run-owner-daily-automation-entrypoint.mjs --duplicate-guard-check",
      checkFutureNewVideoReadiness:
        "node scripts/run-owner-daily-automation-entrypoint.mjs --preflight --content-unit <manifest.json>",
    },
    futureNewVideoContentUnit: {
      note:
        "A future new video is expressed as a content unit manifest (schemaVersion dual_platform_content_unit_v1) " +
        "and passed via --content-unit. Without --content-unit, all modes operate on the default already-published " +
        "evidence content. Custom (non-default) content --live is NOT enabled for actual publish in this slice: " +
        "gate 1-4 (metadata/source/blob/duplicate) fail-closed before credential resolution as usual; if gate 1-4 " +
        "pass, gate 5 credential resolution runs (no-execute) and halts with ACTUAL_API_CALL_NOT_ENABLED_THIS_SLICE " +
        "when all 6 required env keys are present, or CREDENTIAL_KEYS_MISSING_THIS_SLICE when any are missing. " +
        "Gate 6 (actual API call) is never reached.",
      manifestSchemaVersion: "dual_platform_content_unit_v1",
      sampleManifest: "scripts/fixtures/dual_platform_content_unit.sample.v1.json",
      buildFromLocalPipelineOutput:
        "--build-content-unit derives a manifest from an existing --dry-run summary (no-live; no new media/API " +
        "calls). YouTube letterbox source and Blob liveness evidence are reported not-ready until a later approved " +
        "step supplies --youtube-source / --youtube-render-result / --blob-liveness-result.",
      attachYoutubeSourceFromRenderResult:
        "--youtube-render-result <youtube-letterbox-render-result.json> is the preferred way to attach the " +
        "YouTube letterbox source: it validates the render result fail-closed (schemaVersion/executed/" +
        "allVerificationsPass/ffmpegConversionCount/side-effect counters/output existence+size) and derives " +
        "youtubeSourcePath automatically. If --youtube-source is also given, both must resolve to the same path " +
        "or the build aborts with youtube_source_render_result_mismatch. No ffmpeg/ffprobe is run by this step.",
      planYoutubeLetterboxSource:
        "--plan-youtube-letterbox reads a content unit manifest's instagramSourcePath and writes a deterministic " +
        "YouTube letterbox source plan JSON (planned output path + render profile + recommended next command). " +
        "No ffmpeg is run and no media is created; the content unit manifest itself is never mutated.",
      prepareYoutubeLetterboxRender:
        "--prepare-youtube-letterbox-render validates a youtube-letterbox-source-plan.json and writes a no-execute " +
        "render request JSON with the exact future approved command. --run is refused in this slice (fail-closed, " +
        `status ${LETTERBOX_RENDER_RUN_DISABLED_STATUS}); actual ffmpeg execution requires a separate approved slice.`,
      planInstagramBlobUpload:
        "--plan-instagram-blob-upload reads a content unit manifest's instagramSourcePath, hashes it read-only " +
        "(SHA-256), and writes a deterministic instagram-blob-upload-request.json (pathname + put() option plan) " +
        "under --out-dir. No @vercel/blob call, no upload, no network/env access; the content unit manifest is " +
        "never mutated. Actual upload still requires a separate approved step with approval token " +
        "APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST.",
      prepareInstagramBlobUpload:
        "--prepare-instagram-blob-upload consumes the instagram-blob-upload-request.json and re-verifies that " +
        "the source mp4 still matches the recorded size + SHA-256 + deterministic pathname + put() option plan, " +
        "then writes a no-execute instagram-blob-upload-preflight.json (readyForFutureApprovedUpload:true only " +
        "when every check passes). No @vercel/blob call, no upload, no public-URL liveness/HEAD, no network/env " +
        `access; the request JSON is never mutated. --run is refused this slice (fail-closed, status ${INSTAGRAM_BLOB_UPLOAD_RUN_DISABLED_STATUS}).`,
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
  console.log(`  ready golden sample fixture:          ${READY_GOLDEN_SAMPLE_CONTENT_UNIT}`);
  console.log(`  ready preflight (no-live):            pnpm owner:ready-preflight`);
  console.log(`  ready duplicate-guard check (no-live, no repost): pnpm owner:ready-duplicate-guard-check`);
  console.log("");
  return summary.checks.defaultDryRunManifestExists && summary.checks.dualPlatformOrchestratorScriptExists && summary.checks.renderManifestLocalRunnerScriptExists ? 0 : 1;
}

// ── mode: --dry-run ────────────────────────────────────────────────────────────
function runDryRun() {
  const manifestPath = getArg("--manifest") || DEFAULT_MANIFEST;
  const outRoot = getArg("--out-root") || DEFAULT_DRY_RUN_OUT_ROOT;
  const outRootAbs = resolve(outRoot);

  if (isRepoRootOrInside(outRootAbs, REPO_ROOT)) {
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

  // 생성된 top-level summary path를 surface한다(파일명은 render-manifest 러너와 고정 계약).
  // 이 summary는 --build-content-unit --summary <path>의 입력으로 바로 쓸 수 있다.
  const generatedSummaryPath = join(outRootAbs, "render-manifest-local-run-summary.local-mock.json");
  if (exitCode === 0 && existsSync(generatedSummaryPath)) {
    console.log("");
    console.log(`[owner-entrypoint] generated summary: ${generatedSummaryPath}`);
    console.log(
      `[owner-entrypoint] next: node scripts/run-owner-daily-automation-entrypoint.mjs --build-content-unit ` +
        `--summary "${generatedSummaryPath}" --out-dir <outside-repo path>`,
    );
    console.log("");
  }

  return exitCode;
}

// ── mode: --build-content-unit ───────────────────────────────────────────────────
function runBuildContentUnit() {
  const summaryPath = getArg("--summary");
  const pipelineSummaryPath = getArg("--pipeline-summary");
  const outDir = getArg("--out-dir");
  const contentId = getArg("--content-id");
  const version = getArg("--version");
  const youtubeSourcePath = getArg("--youtube-source");
  const youtubeRenderResultPath = getArg("--youtube-render-result");
  const blobLivenessResultPath = getArg("--blob-liveness-result");

  if ((!summaryPath && !pipelineSummaryPath) || !outDir) {
    console.error(
      "ABORT: --build-content-unit requires (--summary <path> | --pipeline-summary <path>) and --out-dir <path>.",
    );
    return 1;
  }
  if (summaryPath && pipelineSummaryPath) {
    console.error("ABORT: provide only one of --summary or --pipeline-summary, not both.");
    return 1;
  }

  const outDirAbs = resolve(outDir);
  if (isRepoRootOrInside(outDirAbs, REPO_ROOT)) {
    console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
    return 1;
  }

  console.log(`[owner-entrypoint] building content unit manifest from local pipeline summary (no-live)`);
  console.log(`[owner-entrypoint] source summary: ${summaryPath ?? pipelineSummaryPath}`);
  console.log(`[owner-entrypoint] out-dir: ${outDirAbs}`);
  console.log("");

  const result = buildContentUnitFromLocalSummary({
    summaryPath,
    pipelineSummaryPath,
    contentId,
    version,
    youtubeSourcePath,
    youtubeRenderResultPath,
    blobLivenessResultPath,
  });

  if (!result.ok) {
    console.error(`ABORT: ${result.reason}`);
    return 1;
  }

  mkdirSync(outDirAbs, { recursive: true });
  const manifestPath = join(outDirAbs, "dual_platform_content_unit.generated.json");
  const buildSummaryPath = join(outDirAbs, "content-unit-build-summary.local-mock.json");
  writeFileSync(manifestPath, JSON.stringify(result.manifest, null, 2), "utf-8");
  writeFileSync(buildSummaryPath, JSON.stringify(result.buildSummary, null, 2), "utf-8");

  console.log(JSON.stringify({ schemaVersion: "owner_daily_automation_entrypoint_build_content_unit_v1", mode: "build-content-unit", manifestPath, buildSummaryPath, buildSummary: result.buildSummary }, null, 2));
  console.log("");
  console.log("── Owner summary ──────────────────────────────────────────────");
  console.log(`  contentId:                          ${result.manifest.contentId}`);
  console.log(`  version:                            ${result.manifest.version}`);
  console.log(`  instagramSourceReady:                ${result.buildSummary.instagramSourceReady}`);
  console.log(`  youtubeSourceReady:                  ${result.buildSummary.youtubeSourceReady}`);
  console.log(`  youtubeSourceDerivedFromRenderResult: ${result.buildSummary.youtubeSourceDerivedFromRenderResult}`);
  console.log(`  metadataReady:                       ${result.buildSummary.metadataReady}`);
  console.log(`  blobLivenessEvidenceReady:            ${result.buildSummary.blobLivenessEvidenceReady}`);
  console.log(`  contentUnitPreflightExpectedReady:    ${result.buildSummary.contentUnitPreflightExpectedReady}`);
  console.log("");
  console.log(`  manifest:      ${manifestPath}`);
  console.log(`  next:          node scripts/run-owner-daily-automation-entrypoint.mjs --preflight --content-unit "${manifestPath}"`);
  console.log("");

  return 0;
}

// ── mode: --plan-youtube-letterbox ───────────────────────────────────────────────
// content unit manifest → deterministic YouTube letterbox source plan(JSON only).
// ffmpeg를 실행하지 않고, content unit manifest를 mutate하지 않는다(읽기 전용).
function runPlanYoutubeLetterbox() {
  const contentUnitPath = getArg("--content-unit");
  const outDir = getArg("--out-dir");
  const versionSuffix = getArg("--version-suffix");

  if (!contentUnitPath || !outDir) {
    console.error("ABORT: --plan-youtube-letterbox requires --content-unit <path> and --out-dir <path>.");
    return 1;
  }

  const outDirAbs = resolve(outDir);
  if (isRepoRootOrInside(outDirAbs, REPO_ROOT)) {
    console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
    return 1;
  }

  console.log(`[owner-entrypoint] planning YouTube letterbox source from content unit manifest (no-live, no ffmpeg)`);
  console.log(`[owner-entrypoint] content-unit: ${contentUnitPath}`);
  console.log(`[owner-entrypoint] out-dir: ${outDirAbs}`);
  console.log("");

  const result = planYoutubeLetterboxSourceFromContentUnit({ contentUnitPath, versionSuffix });

  if (!result.ok) {
    console.error(`ABORT: ${result.reason}`);
    return 1;
  }

  mkdirSync(outDirAbs, { recursive: true });
  const planPath = join(outDirAbs, "youtube-letterbox-source-plan.json");
  writeFileSync(planPath, JSON.stringify(result.plan, null, 2), "utf-8");

  console.log(JSON.stringify({ schemaVersion: "owner_daily_automation_entrypoint_plan_youtube_letterbox_v1", mode: "plan-youtube-letterbox", planPath, plan: result.plan }, null, 2));
  console.log("");
  console.log("── Owner summary ──────────────────────────────────────────────");
  console.log(`  contentId:                ${result.plan.contentId}`);
  console.log(`  version:                  ${result.plan.version}`);
  console.log(`  instagramSourcePath:      ${result.plan.instagramSourcePath}`);
  console.log(`  plannedYoutubeSourcePath: ${result.plan.plannedYoutubeSourcePath}`);
  console.log(`  inputExists:              ${result.plan.inputExists}`);
  console.log(`  willExecuteFfmpeg:        ${result.plan.willExecuteFfmpeg}`);
  console.log("");
  console.log(`  plan: ${planPath}`);
  console.log(`  next: ${result.plan.recommendedNextCommand}`);
  console.log("");

  return 0;
}

// ── mode: --prepare-youtube-letterbox-render ─────────────────────────────────────
// youtube-letterbox-source-plan.json → 실행 직전 render request(JSON only, no-execute).
// --run은 이 slice에서 항상 fail-closed. plan을 mutate하지 않는다(읽기 전용).
function runPrepareYoutubeLetterboxRender() {
  const planPath = getArg("--plan");
  const outDir = getArg("--out-dir");
  const isRun = hasFlag("--run");

  if (!planPath || !outDir) {
    console.error("ABORT: --prepare-youtube-letterbox-render requires --plan <path> and --out-dir <path>.");
    return 1;
  }

  const outDirAbs = resolve(outDir);
  if (isRepoRootOrInside(outDirAbs, REPO_ROOT)) {
    console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
    return 1;
  }

  if (isRun) {
    console.error(
      `ABORT: --run is not executable in this slice. status: ${LETTERBOX_RENDER_RUN_DISABLED_STATUS}\n` +
        "Actual ffmpeg execution requires a separate approved slice.",
    );
    return 1;
  }

  console.log(`[owner-entrypoint] preparing YouTube letterbox render request from plan (no-execute)`);
  console.log(`[owner-entrypoint] plan: ${planPath}`);
  console.log(`[owner-entrypoint] out-dir: ${outDirAbs}`);
  console.log("");

  const result = prepareYoutubeLetterboxRenderFromPlan({ planPath });

  if (!result.ok) {
    console.error(`ABORT: ${result.reason}`);
    return 1;
  }

  mkdirSync(outDirAbs, { recursive: true });
  const requestPath = join(outDirAbs, "youtube-letterbox-render-request.json");
  writeFileSync(requestPath, JSON.stringify(result.request, null, 2), "utf-8");

  console.log(JSON.stringify({ schemaVersion: "owner_daily_automation_entrypoint_prepare_youtube_letterbox_render_v1", mode: "prepare-youtube-letterbox-render", requestPath, request: result.request }, null, 2));
  console.log("");
  console.log("── Owner summary ──────────────────────────────────────────────");
  console.log(`  contentId:                ${result.request.contentId}`);
  console.log(`  version:                  ${result.request.version}`);
  console.log(`  instagramSourcePath:      ${result.request.instagramSourcePath}`);
  console.log(`  plannedYoutubeSourcePath: ${result.request.plannedYoutubeSourcePath}`);
  console.log(`  inputExists:              ${result.request.inputExists}`);
  console.log(`  willExecuteFfmpeg:        ${result.request.willExecuteFfmpeg}`);
  console.log("");
  console.log(`  request: ${requestPath}`);
  console.log(`  future approved command: ${result.request.futureApprovedCommand}`);
  console.log("");

  return 0;
}

// ── mode: --render-youtube-letterbox-once ────────────────────────────────────────
// approval-gated one-shot 로컬 ffmpeg 렌더를 하위 runner로 위임 실행한다.
// approval token이 없으면 하위 runner에 도달하기 전에 fail-closed. 하위 runner는
// output overwrite/second-run을 자체적으로 차단한다(이 entrypoint는 그 계약을 신뢰하되
// approval token을 여기서도 먼저 확인한다).
function runRenderYoutubeLetterboxOnce() {
  const approval = getArg("--approval");
  const requestPath = getArg("--request");
  const source = getArg("--source");
  const output = getArg("--output");
  const outDir = getArg("--out-dir");

  if (approval !== YOUTUBE_LETTERBOX_RENDER_APPROVAL_TOKEN) {
    console.error(
      `ABORT: --render-youtube-letterbox-once requires the exact --approval ${YOUTUBE_LETTERBOX_RENDER_APPROVAL_TOKEN}.`,
    );
    return 1;
  }

  const runnerArgs = ["--approval", approval];
  if (requestPath) runnerArgs.push("--request", requestPath);
  if (source) runnerArgs.push("--source", source);
  if (output) runnerArgs.push("--output", output);
  if (outDir) runnerArgs.push("--out-dir", outDir);

  console.log(`[owner-entrypoint] running approval-gated one-shot YouTube letterbox local render`);
  console.log(`[owner-entrypoint] delegating to run-youtube-letterbox-render-from-request-once.mjs`);
  console.log("");

  const { exitCode } = runScript(YOUTUBE_LETTERBOX_RENDER_ONCE_RUNNER_SCRIPT, runnerArgs);
  return exitCode;
}

// ── mode: --plan-instagram-blob-upload ───────────────────────────────────────────
// content unit manifest → deterministic Instagram Vercel Blob upload request(JSON only, no-upload).
// @vercel/blob를 호출하지 않고, content unit manifest를 mutate하지 않는다(읽기 전용).
function runPlanInstagramBlobUpload() {
  const contentUnitPath = getArg("--content-unit");
  const outDir = getArg("--out-dir");

  if (!contentUnitPath || !outDir) {
    console.error("ABORT: --plan-instagram-blob-upload requires --content-unit <path> and --out-dir <path>.");
    return 1;
  }

  const outDirAbs = resolve(outDir);
  if (isRepoRootOrInside(outDirAbs, REPO_ROOT)) {
    console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
    return 1;
  }

  console.log(`[owner-entrypoint] planning Instagram Vercel Blob upload request from content unit manifest (no-upload)`);
  console.log(`[owner-entrypoint] content-unit: ${contentUnitPath}`);
  console.log(`[owner-entrypoint] out-dir: ${outDirAbs}`);
  console.log("");

  const result = planInstagramBlobUploadFromContentUnit({ contentUnitPath });

  if (!result.ok) {
    console.error(`ABORT: ${result.reason}`);
    return 1;
  }

  mkdirSync(outDirAbs, { recursive: true });
  const requestPath = join(outDirAbs, "instagram-blob-upload-request.json");
  writeFileSync(requestPath, JSON.stringify(result.request, null, 2), "utf-8");

  console.log(JSON.stringify({ schemaVersion: "owner_daily_automation_entrypoint_plan_instagram_blob_upload_v1", mode: "plan-instagram-blob-upload", requestPath, request: result.request }, null, 2));
  console.log("");
  console.log("── Owner summary ──────────────────────────────────────────────");
  console.log(`  contentId:        ${result.request.contentId}`);
  console.log(`  version:          ${result.request.version}`);
  console.log(`  sourcePath:       ${result.request.sourcePath}`);
  console.log(`  sourceSizeBytes:  ${result.request.sourceSizeBytes}`);
  console.log(`  sha256_12:        ${result.request.sha256_12}`);
  console.log(`  pathname:         ${result.request.pathname}`);
  console.log(`  uploadPerformed:  ${result.request.uploadPerformed}`);
  console.log("");
  console.log(`  request: ${requestPath}`);
  console.log("");

  return 0;
}

// ── mode: --prepare-instagram-blob-upload ────────────────────────────────────────
// instagram-blob-upload-request.json → no-execute upload readiness/preflight JSON.
// @vercel/blob를 호출하지 않고, request JSON/source mp4를 mutate하지 않는다(읽기 전용).
// --run은 이 slice에서 항상 fail-closed(request 검증/출력 이전에 abort, 부작용 0).
function runPrepareInstagramBlobUpload() {
  const requestPath = getArg("--request");
  const outDir = getArg("--out-dir");
  const isRun = hasFlag("--run");

  // --run은 request 검증/출력 이전에 fail-closed로 막는다(부작용 0, Blob SDK/env 접근 없음).
  if (isRun) {
    console.error(
      `ABORT: --run is not executable in this slice. status: ${INSTAGRAM_BLOB_UPLOAD_RUN_DISABLED_STATUS}\n` +
        "Actual Vercel Blob upload requires a separate approved slice.",
    );
    return 1;
  }

  if (!requestPath || !outDir) {
    console.error("ABORT: --prepare-instagram-blob-upload requires --request <path> and --out-dir <path>.");
    return 1;
  }

  const outDirAbs = resolve(outDir);
  if (isRepoRootOrInside(outDirAbs, REPO_ROOT)) {
    console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
    return 1;
  }
  if ([requestPath, outDirAbs].some((p) => typeof p === "string" && p.includes(".money-shorts-local"))) {
    console.error("ABORT: .money-shorts-local access forbidden.");
    return 1;
  }

  console.log(`[owner-entrypoint] preparing Instagram Vercel Blob upload readiness from request (no-execute)`);
  console.log(`[owner-entrypoint] request: ${requestPath}`);
  console.log(`[owner-entrypoint] out-dir: ${outDirAbs}`);
  console.log("");

  const result = prepareInstagramBlobUploadFromRequest({ requestPath });

  if (!result.ok) {
    console.error(`ABORT: ${result.reason}`);
    return 1;
  }

  mkdirSync(outDirAbs, { recursive: true });
  const preflightPath = join(outDirAbs, "instagram-blob-upload-preflight.json");
  writeFileSync(preflightPath, JSON.stringify(result.preflight, null, 2), "utf-8");

  console.log(JSON.stringify({ schemaVersion: "owner_daily_automation_entrypoint_prepare_instagram_blob_upload_v1", mode: "prepare-instagram-blob-upload", preflightPath, preflight: result.preflight }, null, 2));
  console.log("");
  console.log("── Owner summary ──────────────────────────────────────────────");
  console.log(`  contentId:                       ${result.preflight.contentId}`);
  console.log(`  version:                         ${result.preflight.version}`);
  console.log(`  sourcePath:                      ${result.preflight.sourcePath}`);
  console.log(`  sourceSizeMatches:               ${result.preflight.sourceSizeMatches}`);
  console.log(`  sha256Matches:                   ${result.preflight.sha256Matches}`);
  console.log(`  putOptionsMatchApprovedContract: ${result.preflight.putOptionsMatchApprovedContract}`);
  console.log(`  readyForFutureApprovedUpload:    ${result.preflight.readyForFutureApprovedUpload}`);
  console.log(`  runStatus:                       ${result.preflight.runStatus}`);
  console.log("");
  console.log(`  preflight: ${preflightPath}`);
  console.log(`  future approved command: ${result.preflight.futureApprovedCommand}`);
  console.log("");

  return 0;
}

// ── mode: --preflight ──────────────────────────────────────────────────────────
function runPreflight() {
  const contentUnitPath = getArg("--content-unit");
  if (contentUnitPath && !existsSync(contentUnitPath)) {
    console.error(`ABORT: --content-unit manifest not found: ${contentUnitPath}`);
    return 1;
  }
  // read-only publish ledger bridge 경로(옵션). 존재 검증만 하고 값을 읽지 않는다(read는 orchestrator가 수행).
  const publishLedgerPath = getArg("--publish-ledger");
  console.log(
    contentUnitPath
      ? `[owner-entrypoint] running dual-platform publish orchestrator --preflight --content-unit ${contentUnitPath}`
      : `[owner-entrypoint] running dual-platform publish orchestrator --preflight (default evidence content)`,
  );
  if (publishLedgerPath) console.log(`[owner-entrypoint] read-only publish ledger bridge: --publish-ledger ${publishLedgerPath} (read-only, no write)`);
  console.log("");

  const summary = runPreflightSummary(contentUnitPath, publishLedgerPath);

  console.log("");
  console.log(JSON.stringify({ schemaVersion: "owner_daily_automation_entrypoint_preflight_summary_v1", mode: "preflight", ...summary, raw: undefined }, null, 2));
  console.log("");
  console.log("── Owner summary ──────────────────────────────────────────────");
  console.log(`  content unit:                        ${summary.contentUnitKind ?? "default_evidence_content"}${summary.isDefaultContentUnit ? "" : " (custom manifest)"}`);
  console.log(`  preflightOk:                       ${summary.preflightOk}`);
  console.log(`  metadata optimization gate ok:     ${summary.metadataOptimizationGateOk}`);
  console.log(`  duplicate guard key format ok:      ${summary.duplicateGuardKeyFormatOk}`);
  console.log(`  source files ready:                 ${summary.sourceFilesReady}`);
  console.log(`  blob liveness evidence ok:          ${summary.blobLivenessEvidenceOk}`);
  if (summary.publishLedgerPathProvided) {
    console.log(`  publish ledger read ok:             ${summary.publishLedgerReadOk}${summary.publishLedgerReadFailureBlocksReadiness ? `  (read FAILED: ${summary.publishLedgerReadFailReason} — blocks readiness)` : ""}`);
  }
  console.log(`  live gate armed:                     ${summary.armed}`);
  if (summary.isDefaultContentUnit) {
    console.log(`  current content will be blocked:     ${summary.currentContentDuplicateBlock?.bothWillBeBlocked}`);
  } else {
    console.log(`  custom content live enabled:         ${summary.customContentLiveEnabledThisSlice} (halt: ${summary.customContentLiveHaltError})`);
  }
  console.log(`  expected --live status if run now:   ${summary.currentContentDuplicateBlock?.expectedLiveStatus}`);
  console.log("");

  return summary.ranSuccessfully && summary.preflightOk ? 0 : 1;
}

// ── mode: --credential-preflight ────────────────────────────────────────────────
// task: dual-platform-credential-preflight-redacted-no-live-v1
// orchestrator --credential-preflight로 위임한다. 이 entrypoint 자체는 process.env를 읽지 않고
// (기존 보안 계약 유지), orchestrator가 계산한 redacted presence 결과(key 이름 + present boolean)만
// 통과/요약한다. .env.local read 없음, credential 값/길이/prefix 출력 없음, API/upload/Blob 호출 없음.
function runCredentialPreflight() {
  const contentUnitPath = getArg("--content-unit");
  if (contentUnitPath && !existsSync(contentUnitPath)) {
    console.error(`ABORT: --content-unit manifest not found: ${contentUnitPath}`);
    return 1;
  }
  console.log(
    contentUnitPath
      ? `[owner-entrypoint] running dual-platform publish orchestrator --credential-preflight --content-unit ${contentUnitPath}`
      : `[owner-entrypoint] running dual-platform publish orchestrator --credential-preflight (default evidence content)`,
  );
  console.log("[owner-entrypoint] redacted presence check only — env key NAMES + present booleans, no values.");
  console.log("");

  const cpArgs = contentUnitPath
    ? ["--credential-preflight", "--content-unit", contentUnitPath]
    : ["--credential-preflight"];
  const { exitCode, stdout } = runScript(ORCHESTRATOR_SCRIPT, cpArgs, { captureOnly: true });
  if (exitCode !== 0) {
    console.error(`ABORT: orchestrator --credential-preflight exited ${exitCode}`);
    return 1;
  }
  const parsed = parseJsonSafe(stdout);
  if (!parsed.ok) {
    console.error(`ABORT: --credential-preflight stdout parse failed: ${parsed.error}`);
    return 1;
  }
  const cp = parsed.value ?? {};
  const platforms = cp.platforms ?? {};

  // secret-free owner summary. orchestrator가 보증한 redacted 필드를 그대로 통과한다.
  const summary = {
    schemaVersion: "owner_daily_automation_entrypoint_credential_preflight_summary_v1",
    mode: "credential_preflight",
    noLive: true,
    // orchestrator가 보고한 안전 assertion(모두 상수). 값/길이/prefix/hash 미노출.
    credentialValuesAccessed: cp.credentialValuesAccessed === true,
    credentialValuesPrinted: cp.credentialValuesPrinted === true,
    dotEnvLocalDirectAccess: cp.dotEnvLocalDirectAccess === true,
    externalApiCallPerformed: cp.externalApiCallPerformed === true,
    contentUnitManifestPath: cp.contentUnitManifestPath ?? null,
    isDefaultContentUnit: cp.isDefaultContentUnit === true,
    requiredEnvKeyNames: cp.requiredEnvKeyNames ?? null,
    platforms: {
      instagram: { allPresent: platforms.instagram?.allPresent === true, keys: platforms.instagram?.keys ?? [] },
      youtube: { allPresent: platforms.youtube?.allPresent === true, keys: platforms.youtube?.keys ?? [] },
      vercelBlob: { allPresent: platforms.vercelBlob?.allPresent === true, keys: platforms.vercelBlob?.keys ?? [] },
    },
    allRequiredKeysPresent: cp.allRequiredKeysPresent === true,
    readyForCredentialResolution: cp.readyForCredentialResolution === true,
    // task: dual-platform-credential-resolution-wiring-no-execute-v1
    // credential resolution 코드 경로는 wiring됐지만(true), 이 preflight 모드는 값 미접근이고 actual API
    // 실행/live publish는 비활성이다 — 아래 두 필드로 명시해 publish 활성화로 오인되지 않게 한다.
    credentialResolutionWiredThisSlice: cp.credentialResolutionWiredThisSlice === true,
    credentialValuesAccessedInThisMode: cp.credentialValuesAccessedInThisMode === true,
    actualApiExecutionEnabledThisSlice: cp.actualApiExecutionEnabledThisSlice === true,
  };

  console.log(JSON.stringify(summary, null, 2));
  console.log("");
  console.log("── Owner credential presence (redacted, no values) ────────────");
  const line = (label, obj) => console.log(`  ${label.padEnd(24)} allPresent=${obj.allPresent}  [${obj.keys.map((k) => `${k.name}:${k.present}`).join(", ")}]`);
  line("instagram:", summary.platforms.instagram);
  line("youtube:", summary.platforms.youtube);
  line("vercelBlob:", summary.platforms.vercelBlob);
  console.log(`  allRequiredKeysPresent:  ${summary.allRequiredKeysPresent}`);
  console.log(`  readyForCredentialResolution: ${summary.readyForCredentialResolution}  (presence signal only — live publish still disabled)`);
  console.log(`  credentialResolutionWiredThisSlice: ${summary.credentialResolutionWiredThisSlice}  (code path wired; this mode does NOT access values; actual API execution disabled)`);
  console.log("");

  // status-style diagnostic: env key가 없어도 실행 자체는 성공(exit 0). 정보는 위 boolean으로 표현.
  return 0;
}

// ── mode: --duplicate-guard-check ───────────────────────────────────────────────
function runDuplicateGuardCheck() {
  const contentUnitPath = getArg("--content-unit");
  if (contentUnitPath && !existsSync(contentUnitPath)) {
    console.error(`ABORT: --content-unit manifest not found: ${contentUnitPath}`);
    return 1;
  }
  // read-only publish ledger bridge 경로(옵션). preflight/--live 양쪽에 read-only로 passthrough한다.
  const publishLedgerPath = getArg("--publish-ledger");
  console.log(`[owner-entrypoint] step 1/2: confirming duplicate-block via --preflight`);
  if (publishLedgerPath) console.log(`[owner-entrypoint] read-only publish ledger bridge: --publish-ledger ${publishLedgerPath} (read-only, no write)`);
  console.log("");
  const summary = runPreflightSummary(contentUnitPath, publishLedgerPath);

  if (!summary.ranSuccessfully) {
    console.error(`ABORT: --preflight did not run successfully: ${summary.reason}`);
    return 1;
  }

  const dupBlock = summary.currentContentDuplicateBlock;
  // custom(non-default) manifest는 이 모드에서 --live를 호출하지 않는다. 새 콘텐츠는
  // duplicate가 아니므로 이 모드의 안전 전제(양쪽 플랫폼 duplicate block 확정)를 만족하지 않는다.
  // 설령 custom manifest가 existingPublishedKeys로 duplicate를 주장하더라도, custom content의
  // live 실행 자체가 이 slice에서 비활성(fail-closed)이므로 --live를 호출하지 않는다.
  const isDefault = summary.isDefaultContentUnit === true;
  const confirmed =
    isDefault &&
    dupBlock.bothWillBeBlocked === true &&
    dupBlock.expectedLiveStatus === "BLOCKED_DUPLICATE_ALREADY_PUBLISHED" &&
    summary.duplicateGuardEvaluatedBeforeCredentialResolution === true;

  if (!confirmed) {
    console.error(
      isDefault
        ? "ABORT: preflight does NOT confirm duplicate block for both platform keys. " +
            "Refusing to invoke --live (safety: this mode never runs --live for non-duplicate/new content)."
        : "ABORT: custom (non-default) content manifest. This mode never invokes --live for custom content " +
            "in this slice (custom content live execution is not enabled — fail-closed).",
    );
    console.log(
      JSON.stringify(
        {
          schemaVersion: "owner_daily_automation_entrypoint_duplicate_guard_check_v1",
          mode: "duplicate-guard-check",
          isDefaultContentUnit: isDefault,
          contentUnitManifestPath: summary.contentUnitManifestPath,
          customContentLiveHaltError: summary.customContentLiveHaltError,
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

  // read-only publish ledger bridge를 --live에도 passthrough한다(read-only, write 없음). default content는
  // reference로 이미 duplicate block이므로 ledger가 있어도 additive로 BLOCKED_DUPLICATE가 유지된다.
  const liveArgs = publishLedgerPath ? ["--live", "--publish-ledger", publishLedgerPath] : ["--live"];
  const { exitCode, stdout } = runScript(ORCHESTRATOR_SCRIPT, liveArgs, { captureOnly: true });
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
  case "--credential-preflight":
    exitCode = runCredentialPreflight();
    break;
  case "--duplicate-guard-check":
    exitCode = runDuplicateGuardCheck();
    break;
  case "--build-content-unit":
    exitCode = runBuildContentUnit();
    break;
  case "--plan-youtube-letterbox":
    exitCode = runPlanYoutubeLetterbox();
    break;
  case "--prepare-youtube-letterbox-render":
    exitCode = runPrepareYoutubeLetterboxRender();
    break;
  case "--render-youtube-letterbox-once":
    exitCode = runRenderYoutubeLetterboxOnce();
    break;
  case "--plan-instagram-blob-upload":
    exitCode = runPlanInstagramBlobUpload();
    break;
  case "--prepare-instagram-blob-upload":
    exitCode = runPrepareInstagramBlobUpload();
    break;
  default:
    printUsage();
    exitCode = 1;
}

process.exit(exitCode);
