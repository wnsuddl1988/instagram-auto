/**
 * Bridge: local dry-run pipeline output → dual_platform_content_unit_v1 manifest.
 *
 * task: local-pipeline-content-unit-manifest-bridge-no-live-v1
 *
 * Usage:
 *   node scripts/build-dual-platform-content-unit-from-local-summary.mjs \
 *     --summary <render-manifest-local-run-summary.local-mock.json> \
 *     --out-dir <outside-repo path> \
 *     [--content-id <id>] [--version <version>] \
 *     [--youtube-source <mp4 path>] [--blob-liveness-result <json path>]
 *
 *   (or --pipeline-summary <pipeline-run-summary.local-mock.json> instead of --summary)
 *
 * Reads only local non-secret JSON output already produced by the existing no-live
 * pipeline (render-manifest-local-run-summary / pipeline-run-summary →
 * owner-approved-upload-ready-packet). Never invokes ffmpeg, never calls any
 * external API, never reads env/secret values, never uploads anything.
 *
 * Output:
 *   ${outDir}\dual_platform_content_unit.generated.json   — dual_platform_content_unit_v1 manifest
 *   ${outDir}\content-unit-build-summary.local-mock.json  — readiness booleans + build notes
 *
 * Security constraints:
 * - No process.env access.
 * - No .env/.env.local read.
 * - No fetch/axios/API calls of any kind.
 * - No ffmpeg/media generation — only reads existing JSON files and reports fs.existsSync booleans.
 * - No shell: true (no child_process usage at all in this script).
 * - out-dir must be outside repo root.
 * - blobPublicUrlLivenessEvidence is included only when --blob-liveness-result is explicitly
 *   provided and shape-valid — never fetched/HEAD-checked over the network.
 * - youtubeSourcePath is either the explicit --youtube-source (existence checked, not created)
 *   or a deterministic placeholder path; either way youtubeSourceReady is reported truthfully.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

export const CONTENT_UNIT_MANIFEST_SCHEMA_VERSION = "dual_platform_content_unit_v1";
const BUILD_SUMMARY_SCHEMA_VERSION = "dual_platform_content_unit_build_summary_v1";

// ── CLI args ────────────────────────────────────────────────────────────────────
function getArg(args, name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}

function printUsage() {
  console.log(
    [
      "Build a dual_platform_content_unit_v1 manifest from local dry-run pipeline output (no-live).",
      "",
      "Usage:",
      "  node scripts/build-dual-platform-content-unit-from-local-summary.mjs" +
        " --summary <render-manifest-local-run-summary.local-mock.json>" +
        " --out-dir <outside-repo path>" +
        " [--content-id <id>] [--version <version>]" +
        " [--youtube-source <mp4 path>] [--blob-liveness-result <json path>]",
      "  (or --pipeline-summary <pipeline-run-summary.local-mock.json> instead of --summary)",
      "",
      "Reads only local non-secret JSON already produced by the existing dry-run pipeline.",
      "Never invokes ffmpeg/API/network. --out-dir must be outside the repo root.",
    ].join("\n"),
  );
}

/**
 * summary JSON(둘 중 하나)에서 uploadReadyPacket 경로를 읽는다.
 * - money_shorts_render_manifest_local_run_summary_v1 (top-level, run-local-money-shorts-from-render-manifest.mjs)
 * - money_shorts_local_pipeline_run_summary_v1 (sub-level, run-local-money-shorts-pipeline-dry-run.mjs)
 * 둘 다 artifacts.uploadReadyPacket 필드를 갖는다(schema는 다르지만 shape는 호환).
 */
function resolveUploadReadyPacketPathFromSummary(summaryPath) {
  if (!existsSync(summaryPath)) {
    return { ok: false, reason: "summary_file_not_found", uploadReadyPacketPath: null, summary: null };
  }
  let summary;
  try {
    summary = JSON.parse(readFileSync(summaryPath, "utf-8"));
  } catch (e) {
    return { ok: false, reason: `summary_json_parse_failed: ${String(e?.message || e)}`, uploadReadyPacketPath: null, summary: null };
  }
  const KNOWN_SCHEMAS = [
    "money_shorts_render_manifest_local_run_summary_v1",
    "money_shorts_local_pipeline_run_summary_v1",
  ];
  if (!KNOWN_SCHEMAS.includes(summary?.schemaVersion)) {
    return { ok: false, reason: `unrecognized_summary_schema_version: ${summary?.schemaVersion}`, uploadReadyPacketPath: null, summary };
  }
  const uploadReadyPacketPath = summary?.artifacts?.uploadReadyPacket ?? null;
  if (typeof uploadReadyPacketPath !== "string" || uploadReadyPacketPath.trim() === "") {
    return { ok: false, reason: "artifacts.uploadReadyPacket_missing_in_summary", uploadReadyPacketPath: null, summary };
  }
  return { ok: true, reason: null, uploadReadyPacketPath, summary };
}

/**
 * upload-ready packet(local_mock, no-live)을 읽어 sourceVideoPath + platform payloads를 추출한다.
 */
function readUploadReadyPacket(packetPath) {
  if (!existsSync(packetPath)) {
    return { ok: false, reason: "upload_ready_packet_not_found", packet: null };
  }
  let packet;
  try {
    packet = JSON.parse(readFileSync(packetPath, "utf-8"));
  } catch (e) {
    return { ok: false, reason: `upload_ready_packet_json_parse_failed: ${String(e?.message || e)}`, packet: null };
  }
  if (packet?.schemaVersion !== "money_shorts_owner_approved_upload_flow_v1") {
    return { ok: false, reason: `unrecognized_upload_ready_packet_schema_version: ${packet?.schemaVersion}`, packet };
  }
  return { ok: true, reason: null, packet };
}

const DISALLOWED_TREND_TAG_PATTERN = /(챌린지|viral|trend|밈|fyp|fypシ)/i;

/**
 * instagram_reels platformPayload → orchestrator가 기대하는 instagramMetadata 계약으로 변환.
 * 로컬 pipeline의 platformPayload에는 captionFirstLineHook/callToAction이 별도 필드로
 * 없으므로(caption 본문에 섞여 있음), 안전하게 자동 추출하지 않는다 — 대신 무엇이 부족한지
 * reasons로 정확히 보고하고 metadataReady:false로 fail-closed한다.
 */
function deriveInstagramMetadata(igPayload) {
  const reasons = [];
  if (!igPayload || typeof igPayload !== "object") {
    return { metadata: null, ok: false, reasons: ["instagram_platform_payload_missing"] };
  }
  const caption = typeof igPayload.caption === "string" ? igPayload.caption : "";
  const hashtags = Array.isArray(igPayload.hashtags) ? igPayload.hashtags : [];

  // captionFirstLineHook / callToAction은 로컬 pipeline metadata에 별도 필드로 존재하지
  // 않는다. 값을 지어내지 않고, 누락을 정확히 보고한다(fail-closed).
  if (caption.trim() === "") reasons.push("instagram_caption_empty");
  if (hashtags.length < 8) reasons.push(`instagram_hashtag_count_below_min_8(actual ${hashtags.length})`);
  if (hashtags.length > 12) reasons.push(`instagram_hashtag_count_above_max_12(actual ${hashtags.length})`);
  if (hashtags.some((t) => DISALLOWED_TREND_TAG_PATTERN.test(String(t)))) {
    reasons.push("instagram_hashtag_contains_unrelated_trend_tag");
  }
  reasons.push("instagram_captionFirstLineHook_not_derivable_from_local_pipeline_output");
  reasons.push("instagram_callToAction_not_derivable_from_local_pipeline_output");

  const metadata = {
    // captionFirstLineHook/callToAction은 의도적으로 비워둔다(orchestrator gate가
    // 이를 필수로 요구하므로, 값을 지어내지 않고 preflight가 fail-closed로 정확히 보고하게 한다).
    captionFirstLineHook: "",
    caption,
    hashtags,
    callToAction: "",
    forbiddenUnrelatedTrendTags: true,
  };
  return { metadata, ok: reasons.length === 2 /* only the two "not derivable" notes, no data problems */, reasons };
}

/**
 * youtube_shorts platformPayload → orchestrator가 기대하는 youtubeMetadata 계약으로 변환.
 */
function deriveYoutubeMetadata(ytPayload) {
  const reasons = [];
  if (!ytPayload || typeof ytPayload !== "object") {
    return { metadata: null, ok: false, reasons: ["youtube_platform_payload_missing"] };
  }
  const title = typeof ytPayload.title === "string" ? ytPayload.title : "";
  const tags = Array.isArray(ytPayload.hashtags) ? ytPayload.hashtags : [];

  if (title.trim() === "") reasons.push("youtube_title_empty");
  if (tags.length === 0) reasons.push("youtube_tags_empty");
  if (tags.some((t) => DISALLOWED_TREND_TAG_PATTERN.test(String(t)))) {
    reasons.push("youtube_tags_contains_unrelated_trend_tag");
  }

  const metadata = {
    titleBase: title,
    titleWithShortsSuffix: title.includes("#Shorts") ? title : `${title} #Shorts`,
    descriptionBase: typeof ytPayload.description === "string" ? ytPayload.description : "",
    tags,
    categoryId: typeof ytPayload.categoryId === "string" ? ytPayload.categoryId : (ytPayload.categoryId != null ? String(ytPayload.categoryId) : ""),
    defaultLanguage: typeof ytPayload.defaultLanguage === "string" ? ytPayload.defaultLanguage : "ko",
    privacyStatus: "private",
    selfDeclaredMadeForKids: ytPayload.madeForKids === true,
  };
  return { metadata, ok: reasons.length === 0, reasons };
}

/**
 * --blob-liveness-result JSON을 읽어 orchestrator의 evaluateCustomBlobLivenessEvidence
 * shape 계약과 동일한 필드만 통과시킨다(네트워크 HEAD/list/readback 없음, 그대로 read).
 */
function readBlobLivenessResultIfProvided(blobLivenessResultPath) {
  if (!blobLivenessResultPath) {
    return { provided: false, evidence: null, reason: "not_provided" };
  }
  if (!existsSync(blobLivenessResultPath)) {
    return { provided: true, evidence: null, reason: "blob_liveness_result_file_not_found" };
  }
  let raw;
  try {
    raw = JSON.parse(readFileSync(blobLivenessResultPath, "utf-8"));
  } catch (e) {
    return { provided: true, evidence: null, reason: `blob_liveness_result_json_parse_failed: ${String(e?.message || e)}` };
  }
  const evidence = {
    url: typeof raw.url === "string" ? raw.url : null,
    headStatus: typeof raw.headStatus === "number" ? raw.headStatus : null,
    contentType: typeof raw.contentType === "string" ? raw.contentType : null,
    contentLength: typeof raw.contentLength === "number" ? raw.contentLength : null,
  };
  return { provided: true, evidence, reason: null };
}

function deterministicYoutubePlaceholderPath(contentId, version) {
  // out-root 관례와 정합되는 deterministic placeholder. 실제 파일을 생성하지 않는다.
  return `C:\\tmp\\money-shorts-os\\${contentId}\\youtube_shorts_letterbox_1080x1920_${version}.mp4`;
}

/**
 * 순수 빌더: local pipeline output(summary JSON) → dual_platform_content_unit_v1 manifest + 빌드 요약.
 * 파일 IO는 입력 JSON 읽기 + 출력 JSON 쓰기만 수행한다. 네트워크/env/미디어 생성 없음.
 */
export function buildContentUnitFromLocalSummary({
  summaryPath,
  pipelineSummaryPath,
  contentId,
  version,
  youtubeSourcePath,
  blobLivenessResultPath,
}) {
  const resolvedSummaryPath = summaryPath ?? pipelineSummaryPath;
  const resolution = resolveUploadReadyPacketPathFromSummary(resolvedSummaryPath);
  if (!resolution.ok) {
    return { ok: false, reason: resolution.reason, manifest: null, buildSummary: null };
  }

  const packetResult = readUploadReadyPacket(resolution.uploadReadyPacketPath);
  if (!packetResult.ok) {
    return { ok: false, reason: packetResult.reason, manifest: null, buildSummary: null };
  }
  const packet = packetResult.packet;

  const platformPayloads = Array.isArray(packet.platformPayloads) ? packet.platformPayloads : [];
  const igPayload = platformPayloads.find((p) => p.platform === "instagram_reels") ?? null;
  const ytPayload = platformPayloads.find((p) => p.platform === "youtube_shorts") ?? null;

  const igDerived = deriveInstagramMetadata(igPayload);
  const ytDerived = deriveYoutubeMetadata(ytPayload);

  const resolvedContentId = contentId ?? (packet.sourceManifestId ? `local_${packet.sourceManifestId}` : "local_pipeline_content_unit");
  const resolvedVersion = version ?? "v1_local_draft";

  const instagramSourcePath = typeof packet.sourceVideoPath === "string" ? packet.sourceVideoPath : null;
  const instagramSourceReady = instagramSourcePath != null && existsSync(instagramSourcePath);

  const resolvedYoutubeSourcePath = youtubeSourcePath ?? deterministicYoutubePlaceholderPath(resolvedContentId, resolvedVersion);
  const youtubeSourceProvided = youtubeSourcePath != null;
  const youtubeSourceReady = youtubeSourceProvided && existsSync(resolvedYoutubeSourcePath);

  const blobLivenessResult = readBlobLivenessResultIfProvided(blobLivenessResultPath);
  const blobLivenessEvidenceReady =
    blobLivenessResult.provided &&
    blobLivenessResult.evidence != null &&
    typeof blobLivenessResult.evidence.url === "string" &&
    blobLivenessResult.evidence.headStatus === 200 &&
    blobLivenessResult.evidence.contentType === "video/mp4" &&
    typeof blobLivenessResult.evidence.contentLength === "number" &&
    blobLivenessResult.evidence.contentLength > 0;

  const metadataReady = igDerived.ok && ytDerived.ok;

  const manifest = {
    schemaVersion: CONTENT_UNIT_MANIFEST_SCHEMA_VERSION,
    _note:
      "Generated by scripts/build-dual-platform-content-unit-from-local-summary.mjs from local no-live " +
      "dry-run pipeline output. No external API/network/media-generation was performed to build this file.",
    contentId: resolvedContentId,
    version: resolvedVersion,
    instagramSourcePath: instagramSourcePath ?? "",
    youtubeSourcePath: resolvedYoutubeSourcePath,
    instagramMetadata: igDerived.metadata,
    youtubeMetadata: ytDerived.metadata,
    existingPublishedKeys: [],
  };
  if (blobLivenessEvidenceReady) {
    manifest.blobPublicUrlLivenessEvidence = blobLivenessResult.evidence;
  }

  const contentUnitPreflightExpectedReady =
    instagramSourceReady && youtubeSourceReady && metadataReady && blobLivenessEvidenceReady;

  const buildSummary = {
    schemaVersion: BUILD_SUMMARY_SCHEMA_VERSION,
    mode: "local_mock",
    noLive: true,
    envSecretValuesAccessedThisRun: false,
    sourceSummaryPath: resolve(resolvedSummaryPath),
    uploadReadyPacketPath: resolve(resolution.uploadReadyPacketPath),
    contentId: resolvedContentId,
    version: resolvedVersion,
    instagramSourcePath,
    instagramSourceReady,
    youtubeSourcePath: resolvedYoutubeSourcePath,
    youtubeSourceProvidedByFlag: youtubeSourceProvided,
    youtubeSourceReady,
    youtubeSourceNote: youtubeSourceProvided
      ? "explicit --youtube-source path checked with fs.existsSync only; no file was generated."
      : "deterministic placeholder path — no YouTube letterbox source exists yet; a later approved local media step must generate it.",
    metadataReady,
    instagramMetadataReasons: igDerived.reasons,
    youtubeMetadataReasons: ytDerived.reasons,
    blobLivenessEvidenceProvided: blobLivenessResult.provided,
    blobLivenessEvidenceReady,
    blobLivenessEvidenceReason: blobLivenessResult.reason,
    contentUnitPreflightExpectedReady,
    riskNotes: [
      "no-live: no API call, no upload, no ffmpeg/media generation performed by this builder.",
      "instagramMetadata.captionFirstLineHook / callToAction are intentionally left empty — " +
        "the local pipeline's platform payload does not carry these as separate fields; a later " +
        "approved editorial step must fill them before this content unit can pass the metadata gate.",
      "youtubeSourcePath is a placeholder until a later approved local media step generates the " +
        "YouTube letterbox render and either passes --youtube-source or the placeholder path is filled in.",
      "blobPublicUrlLivenessEvidence is included only if --blob-liveness-result was explicitly provided " +
        "and shape-valid; no network HEAD/list/readback was performed.",
      "nextStep: run scripts/run-dual-platform-final-publish-orchestrator.mjs --preflight --content-unit <this manifest> " +
        "to see the full readiness gate result.",
    ],
  };

  return { ok: true, reason: null, manifest, buildSummary };
}

// ── CLI entrypoint (skipped when imported for tests) ────────────────────────────
const isMainModule = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMainModule) {
  const args = process.argv.slice(2);
  const summaryPath = getArg(args, "--summary");
  const pipelineSummaryPath = getArg(args, "--pipeline-summary");
  const outDir = getArg(args, "--out-dir");
  const contentId = getArg(args, "--content-id");
  const version = getArg(args, "--version");
  const youtubeSourcePath = getArg(args, "--youtube-source");
  const blobLivenessResultPath = getArg(args, "--blob-liveness-result");

  if ((!summaryPath && !pipelineSummaryPath) || !outDir) {
    printUsage();
    process.exit(1);
  }
  if (summaryPath && pipelineSummaryPath) {
    console.error("ABORT: provide only one of --summary or --pipeline-summary, not both.");
    process.exit(1);
  }

  const outDirAbs = resolve(outDir);
  if (outDirAbs.startsWith(REPO_ROOT + "\\") || outDirAbs.startsWith(REPO_ROOT + "/")) {
    console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
    process.exit(1);
  }
  if ([summaryPath, pipelineSummaryPath, outDirAbs, youtubeSourcePath, blobLivenessResultPath]
    .some((p) => typeof p === "string" && p.includes(".money-shorts-local"))) {
    console.error("ABORT: .money-shorts-local access forbidden.");
    process.exit(1);
  }

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║   Build Dual-Platform Content Unit From Local Summary         ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const result = buildContentUnitFromLocalSummary({
    summaryPath,
    pipelineSummaryPath,
    contentId,
    version,
    youtubeSourcePath,
    blobLivenessResultPath,
  });

  if (!result.ok) {
    console.error(`ABORT: ${result.reason}`);
    process.exit(1);
  }

  mkdirSync(outDirAbs, { recursive: true });
  const manifestPath = join(outDirAbs, "dual_platform_content_unit.generated.json");
  const buildSummaryPath = join(outDirAbs, "content-unit-build-summary.local-mock.json");
  writeFileSync(manifestPath, JSON.stringify(result.manifest, null, 2), "utf-8");
  writeFileSync(buildSummaryPath, JSON.stringify(result.buildSummary, null, 2), "utf-8");

  console.log(`  contentId:                       ${result.manifest.contentId}`);
  console.log(`  version:                         ${result.manifest.version}`);
  console.log(`  instagramSourceReady:            ${result.buildSummary.instagramSourceReady}`);
  console.log(`  youtubeSourceReady:              ${result.buildSummary.youtubeSourceReady}`);
  console.log(`  metadataReady:                   ${result.buildSummary.metadataReady}`);
  console.log(`  blobLivenessEvidenceReady:       ${result.buildSummary.blobLivenessEvidenceReady}`);
  console.log(`  contentUnitPreflightExpectedReady: ${result.buildSummary.contentUnitPreflightExpectedReady}`);
  console.log(`\n  manifest:      ${manifestPath}`);
  console.log(`  build summary: ${buildSummaryPath}`);
  console.log("");

  process.exit(0);
}
