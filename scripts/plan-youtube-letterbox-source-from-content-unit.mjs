/**
 * YouTube Shorts letterbox source planner from a dual_platform_content_unit_v1 manifest (no-live).
 *
 * task: owner-youtube-letterbox-source-plan-bridge-no-live-v1
 *
 * Usage:
 *   node scripts/plan-youtube-letterbox-source-from-content-unit.mjs \
 *     --content-unit <dual_platform_content_unit_v1 manifest> \
 *     --out-dir <outside-repo path> \
 *     [--version-suffix <suffix>]
 *
 * Reads a content unit manifest's instagramSourcePath (already-planned Instagram full-frame mp4)
 * and derives a deterministic YouTube Shorts letterbox output path + render profile plan, reusing
 * the same fixed render profile as scripts/create-youtube-shorts-letterbox-variant.mjs. This script
 * never runs ffmpeg, never creates media, never calls any external API, and never reads env/secret
 * values — it only reads the manifest JSON and writes a plan JSON under --out-dir.
 *
 * Output:
 *   ${outDir}\youtube-letterbox-source-plan.json
 *
 * Security constraints:
 * - No process.env access.
 * - No .env/.env.local read.
 * - No fetch/axios/googleapis/@vercel/blob calls of any kind.
 * - No ffmpeg/ffprobe execution, no child_process/spawnSync of any kind in this file.
 * - No shell: true (no subprocess usage at all in this slice).
 * - No file writes other than the plan JSON under --out-dir.
 * - out-dir must be outside repo root (fail-closed abort otherwise).
 * - Does not mutate the input content unit manifest.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

export const PLAN_SCHEMA_VERSION = "youtube_letterbox_source_plan_v1";

// scripts/create-youtube-shorts-letterbox-variant.mjs와 동일한 고정 render profile.
// 두 스크립트가 서로 다른 profile을 갖게 되면(drift) 계획과 실제 렌더가 어긋난다 —
// 이 상수는 반드시 그 파일의 PROFILE과 값이 일치해야 한다.
export const RENDER_PROFILE = {
  canvas: { widthPx: 1080, heightPx: 1920, backgroundColor: "black" },
  contentBox: { widthPx: 864, heightPx: 1536, centered: true },
  margins: { topBottomPx: 192, sidePx: 108 },
  codec: { video: "h264", pixelFormat: "yuv420p", faststart: true, audio: "aac" },
};

// ── CLI args ────────────────────────────────────────────────────────────────────
function getArg(args, name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}

function printUsage() {
  console.log(
    [
      "Plan a YouTube Shorts letterbox source path/render-profile from a content unit manifest (no-live).",
      "",
      "Usage:",
      "  node scripts/plan-youtube-letterbox-source-from-content-unit.mjs" +
        " --content-unit <dual_platform_content_unit_v1 manifest>" +
        " --out-dir <outside-repo path>" +
        " [--version-suffix <suffix>]",
      "",
      "Reads only the content unit manifest JSON already produced by the dual-platform content unit",
      "bridge. Never invokes ffmpeg/API/network. --out-dir must be outside the repo root.",
    ].join("\n"),
  );
}

/**
 * content unit manifest(JSON)를 읽어 instagramSourcePath/contentId/version을 추출한다.
 */
function readContentUnitManifest(contentUnitPath) {
  if (!existsSync(contentUnitPath)) {
    return { ok: false, reason: "content_unit_manifest_not_found", manifest: null };
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(contentUnitPath, "utf-8"));
  } catch (e) {
    return { ok: false, reason: `content_unit_manifest_json_parse_failed: ${String(e?.message || e)}`, manifest: null };
  }
  if (manifest?.schemaVersion !== "dual_platform_content_unit_v1") {
    return { ok: false, reason: `unrecognized_content_unit_schema_version: ${manifest?.schemaVersion}`, manifest };
  }
  if (typeof manifest.instagramSourcePath !== "string" || manifest.instagramSourcePath.trim() === "") {
    return { ok: false, reason: "content_unit_missing_instagramSourcePath", manifest };
  }
  if (typeof manifest.contentId !== "string" || manifest.contentId.trim() === "") {
    return { ok: false, reason: "content_unit_missing_contentId", manifest };
  }
  if (typeof manifest.version !== "string" || manifest.version.trim() === "") {
    return { ok: false, reason: "content_unit_missing_version", manifest };
  }
  return { ok: true, reason: null, manifest };
}

/**
 * 기존 build-dual-platform-content-unit-from-local-summary.mjs의
 * deterministicYoutubePlaceholderPath()와 동일한 명명 관례를 따르는 deterministic 출력 경로.
 * 실제 파일을 생성하지 않는다.
 */
function deterministicYoutubeLetterboxOutputPath(contentId, version, versionSuffix) {
  const versionPart = versionSuffix ? `${version}_${versionSuffix}` : version;
  return `C:\\tmp\\money-shorts-os\\${contentId}\\youtube_shorts_letterbox_1080x1920_${versionPart}.mp4`;
}

/**
 * scripts/create-youtube-shorts-letterbox-variant.mjs와 동일한 deterministic ffmpeg plan을
 * 만든다(계획만, 실행하지 않는다). recommendedNextCommand에 그대로 사용할 수 있는 형태.
 */
function buildFfmpegPlanString(inputPath, outputPath) {
  const { canvas, contentBox, codec } = RENDER_PROFILE;
  const scaleFilter =
    `scale=w=${contentBox.widthPx}:h=${contentBox.heightPx}:force_original_aspect_ratio=decrease,` +
    `pad=w=${canvas.widthPx}:h=${canvas.heightPx}:x=(ow-iw)/2:y=(oh-ih)/2:color=${canvas.backgroundColor}`;
  const ffmpegArgs = [
    "-y",
    "-i", inputPath,
    "-vf", scaleFilter,
    "-c:v", codec.video,
    "-pix_fmt", codec.pixelFormat,
    ...(codec.faststart ? ["-movflags", "+faststart"] : []),
    "-c:a", codec.audio,
    "-map", "0:v:0",
    "-map", "0:a:0?",
    outputPath,
  ];
  return ["ffmpeg", ...ffmpegArgs.map((a) => (a.includes(" ") ? `"${a}"` : a))].join(" ");
}

/**
 * 순수 플래너: content unit manifest → YouTube letterbox source plan.
 * 파일 IO는 입력 manifest 읽기 + 출력 plan JSON 쓰기만 수행한다. ffmpeg/네트워크/env 접근 없음.
 * content unit manifest 자체는 절대 mutate하지 않는다(읽기 전용).
 */
export function planYoutubeLetterboxSourceFromContentUnit({ contentUnitPath, versionSuffix }) {
  const resolution = readContentUnitManifest(contentUnitPath);
  if (!resolution.ok) {
    return { ok: false, reason: resolution.reason, plan: null };
  }
  const manifest = resolution.manifest;

  const instagramSourcePath = manifest.instagramSourcePath;
  const inputExists = existsSync(instagramSourcePath);
  const plannedYoutubeSourcePath = deterministicYoutubeLetterboxOutputPath(
    manifest.contentId,
    manifest.version,
    versionSuffix,
  );

  const recommendedNextCommand =
    `node scripts/create-youtube-shorts-letterbox-variant.mjs --input "${instagramSourcePath}"` +
    ` --output "${plannedYoutubeSourcePath}" --dry-run`;

  const plan = {
    schemaVersion: PLAN_SCHEMA_VERSION,
    mode: "local_mock",
    noLive: true,
    envSecretValuesAccessedThisRun: false,
    willExecuteFfmpeg: false,
    sourceContentUnitManifestPath: resolve(contentUnitPath),
    contentId: manifest.contentId,
    version: manifest.version,
    instagramSourcePath,
    plannedYoutubeSourcePath,
    inputExists,
    outputDirOutsideRepo: true,
    renderProfile: {
      canvas: `${RENDER_PROFILE.canvas.widthPx}x${RENDER_PROFILE.canvas.heightPx}`,
      backgroundColor: RENDER_PROFILE.canvas.backgroundColor,
      contentBox: `${RENDER_PROFILE.contentBox.widthPx}x${RENDER_PROFILE.contentBox.heightPx}`,
      centered: RENDER_PROFILE.contentBox.centered,
      margins: { topBottomPx: RENDER_PROFILE.margins.topBottomPx, sidePx: RENDER_PROFILE.margins.sidePx },
      codec: RENDER_PROFILE.codec,
      note:
        "Matches scripts/create-youtube-shorts-letterbox-variant.mjs PROFILE exactly — scale to fit content box, " +
        "pad to full 1080x1920 canvas with black background, centered.",
    },
    ffmpegPlanCommandString: buildFfmpegPlanString(instagramSourcePath, plannedYoutubeSourcePath),
    recommendedNextCommand,
    sideEffectCounters: {
      ffmpegExecutionCount: 0,
      mediaFilesGeneratedCount: 0,
      apiCallCount: 0,
      envSecretReadCount: 0,
      contentUnitManifestMutationCount: 0,
    },
    riskNotes: [
      "no-live: no ffmpeg execution, no media generation, no API/network/env access performed by this planner.",
      "The content unit manifest passed via --content-unit was read-only; this planner never mutates it.",
      "plannedYoutubeSourcePath is a deterministic placeholder path — no file exists there until a later approved " +
        "local media step actually runs scripts/create-youtube-shorts-letterbox-variant.mjs (or an equivalent) with --run.",
      "nextStep: after the planned mp4 exists at plannedYoutubeSourcePath, rebuild/attach the content unit with " +
        "--youtube-source \"" + plannedYoutubeSourcePath + "\" and re-run --preflight --content-unit <manifest>.",
    ],
  };

  return { ok: true, reason: null, plan };
}

// ── CLI entrypoint (skipped when imported for tests) ────────────────────────────
const isMainModule = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMainModule) {
  const args = process.argv.slice(2);
  const contentUnitPath = getArg(args, "--content-unit");
  const outDir = getArg(args, "--out-dir");
  const versionSuffix = getArg(args, "--version-suffix");

  if (!contentUnitPath || !outDir) {
    printUsage();
    process.exit(1);
  }

  const outDirAbs = resolve(outDir);
  if (outDirAbs.startsWith(REPO_ROOT + "\\") || outDirAbs.startsWith(REPO_ROOT + "/")) {
    console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
    process.exit(1);
  }
  if ([contentUnitPath, outDirAbs].some((p) => typeof p === "string" && p.includes(".money-shorts-local"))) {
    console.error("ABORT: .money-shorts-local access forbidden.");
    process.exit(1);
  }

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║   Plan YouTube Letterbox Source From Content Unit              ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const result = planYoutubeLetterboxSourceFromContentUnit({ contentUnitPath, versionSuffix });

  if (!result.ok) {
    console.error(`ABORT: ${result.reason}`);
    process.exit(1);
  }

  mkdirSync(outDirAbs, { recursive: true });
  const planPath = join(outDirAbs, "youtube-letterbox-source-plan.json");
  writeFileSync(planPath, JSON.stringify(result.plan, null, 2), "utf-8");

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

  process.exit(0);
}
