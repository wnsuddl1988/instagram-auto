/**
 * YouTube Shorts letterbox render-request preparer from a youtube_letterbox_source_plan_v1 JSON (no-execute).
 *
 * task: youtube-letterbox-render-execution-wiring-no-execute-v1
 *
 * Usage:
 *   node scripts/prepare-youtube-letterbox-render-from-plan.mjs \
 *     --plan <youtube-letterbox-source-plan.json> \
 *     --out-dir <outside-repo path> \
 *     [--dry-run]
 *   node scripts/prepare-youtube-letterbox-render-from-plan.mjs --plan <path> --out-dir <path> --run
 *
 * Reads a youtube-letterbox-source-plan.json (already produced by
 * scripts/plan-youtube-letterbox-source-from-content-unit.mjs) and validates it, then writes a
 * deterministic render-request JSON describing the exact future command that would execute the
 * actual ffmpeg render. This script never runs ffmpeg, never creates media, never calls any
 * external API, and never reads env/secret values — it only reads the plan JSON and writes a
 * request JSON under --out-dir.
 *
 * --run is a future-slice flag but is refused in this slice — it must not execute ffmpeg here.
 * It fails closed with status YOUTUBE_LETTERBOX_RENDER_RUN_DISABLED_THIS_SLICE.
 *
 * Output:
 *   ${outDir}\youtube-letterbox-render-request.json
 *
 * Security constraints:
 * - No process.env access.
 * - No .env/.env.local read.
 * - No fetch/axios/googleapis/@vercel/blob calls of any kind.
 * - No ffmpeg/ffprobe execution, no child_process/spawnSync of any kind in this file.
 * - No shell: true (no subprocess usage at all in this slice).
 * - No file writes other than the request JSON under --out-dir.
 * - out-dir must be outside repo root (fail-closed abort otherwise).
 * - Does not mutate the input plan JSON.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

export const REQUEST_SCHEMA_VERSION = "youtube_letterbox_render_request_v1";
export const EXPECTED_PLAN_SCHEMA_VERSION = "youtube_letterbox_source_plan_v1";
export const RUN_DISABLED_STATUS = "YOUTUBE_LETTERBOX_RENDER_RUN_DISABLED_THIS_SLICE";

// ── CLI args ────────────────────────────────────────────────────────────────────
function getArg(args, name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}
function hasFlag(args, name) {
  return args.includes(name);
}

function printUsage() {
  console.log(
    [
      "Prepare a no-execute YouTube Shorts letterbox render request from a plan JSON.",
      "",
      "Usage:",
      "  node scripts/prepare-youtube-letterbox-render-from-plan.mjs" +
        " --plan <youtube-letterbox-source-plan.json>" +
        " --out-dir <outside-repo path>" +
        " [--dry-run]",
      "  node scripts/prepare-youtube-letterbox-render-from-plan.mjs --plan <path> --out-dir <path> --run",
      "",
      "Reads only the plan JSON already produced by",
      "scripts/plan-youtube-letterbox-source-from-content-unit.mjs. Never invokes ffmpeg/API/network.",
      "--out-dir must be outside the repo root. --run is refused in this slice (fail-closed).",
    ].join("\n"),
  );
}

/**
 * plan JSON(youtube_letterbox_source_plan_v1)을 읽어 계약을 검증한다.
 */
function readAndValidatePlan(planPath) {
  if (!existsSync(planPath)) {
    return { ok: false, reason: "plan_file_not_found", plan: null };
  }
  let plan;
  try {
    plan = JSON.parse(readFileSync(planPath, "utf-8"));
  } catch (e) {
    return { ok: false, reason: `plan_json_parse_failed: ${String(e?.message || e)}`, plan: null };
  }
  if (plan?.schemaVersion !== EXPECTED_PLAN_SCHEMA_VERSION) {
    return { ok: false, reason: `unrecognized_plan_schema_version: ${plan?.schemaVersion}`, plan };
  }
  if (plan?.willExecuteFfmpeg !== false) {
    return { ok: false, reason: "plan_willExecuteFfmpeg_not_false", plan };
  }
  if (typeof plan.instagramSourcePath !== "string" || plan.instagramSourcePath.trim() === "") {
    return { ok: false, reason: "plan_missing_instagramSourcePath", plan };
  }
  if (typeof plan.plannedYoutubeSourcePath !== "string" || plan.plannedYoutubeSourcePath.trim() === "") {
    return { ok: false, reason: "plan_missing_plannedYoutubeSourcePath", plan };
  }
  if (!plan.plannedYoutubeSourcePath.toLowerCase().endsWith(".mp4")) {
    return { ok: false, reason: "plan_plannedYoutubeSourcePath_not_mp4", plan };
  }
  const plannedAbs = resolve(plan.plannedYoutubeSourcePath);
  if (plannedAbs.startsWith(REPO_ROOT + "\\") || plannedAbs.startsWith(REPO_ROOT + "/")) {
    return { ok: false, reason: "plan_plannedYoutubeSourcePath_inside_repo", plan };
  }
  return { ok: true, reason: null, plan };
}

/**
 * 순수 preparer: plan JSON → render request(JSON, 실행 없음).
 * 파일 IO는 입력 plan 읽기 + 출력 request JSON 쓰기만 수행한다. ffmpeg/네트워크/env 접근 없음.
 * plan JSON 자체는 절대 mutate하지 않는다(읽기 전용).
 */
export function prepareYoutubeLetterboxRenderFromPlan({ planPath }) {
  const validation = readAndValidatePlan(planPath);
  if (!validation.ok) {
    return { ok: false, reason: validation.reason, request: null };
  }
  const plan = validation.plan;

  const instagramSourcePath = plan.instagramSourcePath;
  const plannedYoutubeSourcePath = plan.plannedYoutubeSourcePath;
  const inputExists = existsSync(instagramSourcePath);

  const futureApprovedCommand =
    `node scripts/create-youtube-shorts-letterbox-variant.mjs --input "${instagramSourcePath}"` +
    ` --output "${plannedYoutubeSourcePath}" --dry-run`;

  const request = {
    schemaVersion: REQUEST_SCHEMA_VERSION,
    mode: "local_mock",
    noLive: true,
    envSecretValuesAccessedThisRun: false,
    willExecuteFfmpeg: false,
    executed: false,
    runStatus: RUN_DISABLED_STATUS,
    sourcePlanPath: resolve(planPath),
    sourcePlanSchemaVersion: plan.schemaVersion,
    contentId: plan.contentId ?? null,
    version: plan.version ?? null,
    instagramSourcePath,
    plannedYoutubeSourcePath,
    inputExists,
    plannedYoutubeSourcePathOutsideRepo: true,
    plannedYoutubeSourcePathIsMp4: true,
    renderProfile: plan.renderProfile ?? null,
    futureApprovedCommand,
    sideEffectCounters: {
      ffmpegExecutionCount: 0,
      mediaFilesGeneratedCount: 0,
      apiCallCount: 0,
      envSecretReadCount: 0,
      planMutationCount: 0,
    },
    riskNotes: [
      "no-execute: this preparer never runs ffmpeg, never creates media, never accesses API/network/env.",
      "The plan JSON passed via --plan was read-only; this preparer never mutates it.",
      "--run is disabled in this slice — actual ffmpeg execution requires a separate approved slice that " +
        "enables scripts/create-youtube-shorts-letterbox-variant.mjs --run.",
      "futureApprovedCommand is the exact command a later approved slice would run in --dry-run form first; " +
        "no mp4 exists at plannedYoutubeSourcePath until that later step actually executes with --run.",
    ],
  };

  return { ok: true, reason: null, request };
}

// ── CLI entrypoint (skipped when imported for tests) ────────────────────────────
const isMainModule = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMainModule) {
  const args = process.argv.slice(2);
  const planPath = getArg(args, "--plan");
  const outDir = getArg(args, "--out-dir");
  const isRun = hasFlag(args, "--run");

  if (!planPath || !outDir) {
    printUsage();
    process.exit(1);
  }

  const outDirAbs = resolve(outDir);
  if (outDirAbs.startsWith(REPO_ROOT + "\\") || outDirAbs.startsWith(REPO_ROOT + "/")) {
    console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
    process.exit(1);
  }
  if ([planPath, outDirAbs].some((p) => typeof p === "string" && p.includes(".money-shorts-local"))) {
    console.error("ABORT: .money-shorts-local access forbidden.");
    process.exit(1);
  }

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║   Prepare YouTube Letterbox Render Request From Plan (no-execute) ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  if (isRun) {
    console.error(
      `ABORT: --run is not executable in this slice. status: ${RUN_DISABLED_STATUS}\n` +
        "Actual ffmpeg execution requires a separate approved slice.",
    );
    process.exit(1);
  }

  const result = prepareYoutubeLetterboxRenderFromPlan({ planPath });

  if (!result.ok) {
    console.error(`ABORT: ${result.reason}`);
    process.exit(1);
  }

  mkdirSync(outDirAbs, { recursive: true });
  const requestPath = join(outDirAbs, "youtube-letterbox-render-request.json");
  writeFileSync(requestPath, JSON.stringify(result.request, null, 2), "utf-8");

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

  process.exit(0);
}
