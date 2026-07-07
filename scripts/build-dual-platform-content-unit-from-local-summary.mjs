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
 *     [--youtube-source <mp4 path>] [--youtube-render-result <youtube-letterbox-render-result.json>] \
 *     [--blob-liveness-result <json path>]
 *
 *   (or --pipeline-summary <pipeline-run-summary.local-mock.json> instead of --summary)
 *
 * --youtube-render-result accepts the result JSON produced by
 * scripts/run-youtube-letterbox-render-from-request-once.mjs (task:
 * youtube-letterbox-local-render-execution-once-v1). It is validated fail-closed
 * (schemaVersion/executed/allVerificationsPass/ffmpegConversionCount/side-effect
 * counters/outputPath existence+size) and, if valid, its outputPath is used as
 * youtubeSourcePath — the Owner no longer needs to copy the mp4 path by hand.
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
        " [--youtube-source <mp4 path>] [--youtube-render-result <youtube-letterbox-render-result.json>]" +
        " [--blob-liveness-result <json path>]",
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

// task: content-unit-metadata-optimization-enrichment-no-live-v1
// 부족한 hashtag를 채울 때만 쓰는 고정 안전 기본 태그 pool(플랫폼 일반 태그, 낚시성/유행성 아님).
// 순서대로 채택하며, 이미 존재하는 태그와 중복되면 건너뛴다.
const SAFE_DEFAULT_HASHTAG_POOL = [
  "꿀팁", "정보", "일상", "생활정보", "저장각", "유용한정보", "Shorts", "Reels", "추천", "필수정보",
];

// caption 본문에서 명사형 키워드 후보를 추출하기 위한 최소 stopword(조사/접속사 성격 짧은 토큰 제거용).
const CAPTION_KEYWORD_STOPWORDS = new Set([
  "그리고", "그래서", "하지만", "그런데", "입니다", "합니다", "있습니다", "습니다",
]);

// task: content-unit-metadata-hook-length-guard-fix-v1
// Codex review finding: "Keep hook concise"가 코드/guard로 강제되지 않아 긴 첫 줄 caption이
// 그대로 captionFirstLineHook이 될 수 있었다. Instagram Reels 캡션 첫 줄(피드에 노출되는
// hook)의 가독성을 위해 문자 수 상한을 명시적으로 고정한다.
const INSTAGRAM_HOOK_MAX_CHARS = 48;

/**
 * caption 본문에서 첫 문장(첫 줄, 없으면 첫 마침표/줄바꿈 전까지)을 hook으로 추출한다.
 * 해시태그 라인(#으로 시작)이나 대괄호 안내문("[...]")은 hook 후보에서 제외한다.
 * 새로운 문구를 지어내지 않고 원문에서만 추출한다 — 그래도 유효한 문장이 없으면 null.
 *
 * 길이 상한(INSTAGRAM_HOOK_MAX_CHARS) 적용 순서(모두 원문에서만 자르며, 새 문구를
 * 지어내거나 임의 위치에서 강제로 자르지 않는다):
 *   1) 첫 줄에서 문장 구분자(. ! ?)로 첫 문장만 사용.
 *   2) 그래도 상한을 넘으면 clause 구분자(—, -, ·, ,)로 첫 clause만 사용.
 *   3) 그래도 상한을 넘으면 hook을 만들지 않고 null(fail-closed) — 어색하게 자르지 않는다.
 */
function extractCaptionFirstLineHook(caption) {
  const lines = caption
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("#") && !l.startsWith("[") && !l.startsWith("]"));
  if (lines.length === 0) return { hook: null, reason: "no_candidate_line" };
  let firstLine = lines[0];
  // 문장 구분자(. ! ? 또는 —/-)가 있으면 첫 문장만 사용해 hook을 짧게 유지한다.
  const sentenceMatch = firstLine.match(/^(.*?[.!?])(\s|$)/);
  if (sentenceMatch && sentenceMatch[1].trim().length >= 4) {
    firstLine = sentenceMatch[1].trim();
  }
  firstLine = firstLine.trim();
  if (firstLine.length < 4) return { hook: null, reason: "too_short" };

  if (firstLine.length > INSTAGRAM_HOOK_MAX_CHARS) {
    // 문장이 여전히 길면 clause 구분자로 첫 clause만 재시도한다(원문 내 텍스트만 사용).
    const clauseMatch = firstLine.match(/^(.*?)[—\-·,](\s|$)/);
    if (clauseMatch && clauseMatch[1].trim().length >= 4 && clauseMatch[1].trim().length <= INSTAGRAM_HOOK_MAX_CHARS) {
      firstLine = clauseMatch[1].trim();
    } else {
      // 어색하게 강제로 자르지 않고 fail-closed한다.
      return { hook: null, reason: "too_long" };
    }
  }

  return { hook: firstLine, reason: null };
}

/**
 * caption 본문에 이미 저장/팔로우/댓글 유도 문구가 있으면 그대로 CTA로 채택하고,
 * 없으면 낚시성 주장 없는 고정 안전 기본 CTA를 사용한다(과장/허위 유도 없음).
 */
const CTA_HINT_PATTERN = /(저장|팔로우|댓글|공유|구독)/;
const SAFE_DEFAULT_CTA = "저장하고 다음에 다시 보기 · 팔로우하면 더 많은 정보를 받아보세요";

function deriveCallToAction(caption) {
  const lines = caption
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("#"));
  const ctaLine = lines.find((l) => CTA_HINT_PATTERN.test(l));
  if (ctaLine) return ctaLine;
  return SAFE_DEFAULT_CTA;
}

/**
 * caption 본문(해시태그/안내문 제외)에서 2자 이상 한글/영문 키워드 후보를 순서대로 추출한다.
 * 새 단어를 지어내지 않고 원문 텍스트만 토큰화한다 — hashtag 보강 시 관련성을 유지하기 위함.
 */
function extractCaptionKeywordCandidates(caption) {
  const bodyLines = caption
    .split(/\r?\n/)
    .filter((l) => !l.trim().startsWith("#") && !l.trim().startsWith("["));
  const body = bodyLines.join(" ");
  const tokens = body
    .replace(/[.,!?—\-·"'“”…]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !CAPTION_KEYWORD_STOPWORDS.has(t));
  // 중복 제거(순서 보존).
  return [...new Set(tokens)];
}

/**
 * hashtags를 8-12개, unique, 무관 유행 태그 제외 조건으로 정규화한다.
 * 우선순위: 1) 기존 관련 태그 유지 → 2) caption 본문 키워드로 보강 →
 * 3) 그래도 부족하면 고정 안전 기본 태그 pool에서 보강. 12개 초과 시 앞에서부터 12개로 자른다.
 * 이미 8-12개이고 금지 패턴이 없으면 원본을 그대로 유지한다(불필요한 변형 없음).
 */
function normalizeInstagramHashtags(existingHashtags, caption) {
  const seen = new Set();
  const normalized = [];
  for (const tag of existingHashtags) {
    const t = String(tag).trim();
    if (t === "" || DISALLOWED_TREND_TAG_PATTERN.test(t) || seen.has(t)) continue;
    seen.add(t);
    normalized.push(t);
  }

  if (normalized.length < 8) {
    for (const kw of extractCaptionKeywordCandidates(caption)) {
      if (normalized.length >= 8) break;
      if (seen.has(kw) || DISALLOWED_TREND_TAG_PATTERN.test(kw)) continue;
      seen.add(kw);
      normalized.push(kw);
    }
  }

  if (normalized.length < 8) {
    for (const kw of SAFE_DEFAULT_HASHTAG_POOL) {
      if (normalized.length >= 8) break;
      if (seen.has(kw)) continue;
      seen.add(kw);
      normalized.push(kw);
    }
  }

  return normalized.slice(0, 12);
}

/**
 * instagram_reels platformPayload → orchestrator가 기대하는 instagramMetadata 계약으로 변환.
 * deterministic metadata enrichment(hook/CTA/hashtag)를 적용한다 — 외부 API/네트워크 없이
 * 로컬 caption/hashtag 원문만 사용한다. 그래도 안전한 값을 만들 수 없으면 fail-closed로
 * reasons를 정확히 보고한다(값을 억지로 지어내지 않는다).
 */
function deriveInstagramMetadata(igPayload) {
  const reasons = [];
  if (!igPayload || typeof igPayload !== "object") {
    return { metadata: null, ok: false, reasons: ["instagram_platform_payload_missing"] };
  }
  const caption = typeof igPayload.caption === "string" ? igPayload.caption : "";
  const rawHashtags = Array.isArray(igPayload.hashtags) ? igPayload.hashtags : [];

  if (caption.trim() === "") reasons.push("instagram_caption_empty");

  const hookResult = caption.trim() !== "" ? extractCaptionFirstLineHook(caption) : { hook: null, reason: "caption_empty" };
  const captionFirstLineHook = hookResult.hook;
  if (captionFirstLineHook == null) {
    if (hookResult.reason === "too_long") {
      reasons.push(`instagram_captionFirstLineHook_too_long(max ${INSTAGRAM_HOOK_MAX_CHARS} chars)`);
    } else {
      reasons.push("instagram_captionFirstLineHook_not_derivable_from_caption");
    }
  }

  const callToAction = caption.trim() !== "" ? deriveCallToAction(caption) : null;
  if (callToAction == null) reasons.push("instagram_callToAction_not_derivable_from_caption");

  const hashtags = normalizeInstagramHashtags(rawHashtags, caption);
  if (hashtags.length < 8) {
    reasons.push(`instagram_hashtag_count_below_min_8_after_enrichment(actual ${hashtags.length})`);
  }
  if (hashtags.length > 12) reasons.push(`instagram_hashtag_count_above_max_12(actual ${hashtags.length})`);
  if (hashtags.some((t) => DISALLOWED_TREND_TAG_PATTERN.test(String(t)))) {
    reasons.push("instagram_hashtag_contains_unrelated_trend_tag");
  }

  const metadata = {
    captionFirstLineHook: captionFirstLineHook ?? "",
    caption,
    hashtags,
    callToAction: callToAction ?? "",
    forbiddenUnrelatedTrendTags: true,
  };
  return { metadata, ok: reasons.length === 0, reasons };
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

const RENDER_RESULT_SCHEMA_VERSION = "youtube_letterbox_render_result_v1";

/**
 * --youtube-render-result JSON(scripts/run-youtube-letterbox-render-from-request-once.mjs 산출물)을
 * 읽어 fail-closed로 검증하고, 검증된 outputPath를 반환한다. ffmpeg/ffprobe는 실행하지 않는다 —
 * 이미 생성된 result JSON과 fs.existsSync/statSync만 사용하는 read-only 검증이다.
 */
function readAndValidateYoutubeRenderResult(renderResultPath, { repoRoot }) {
  if (!existsSync(renderResultPath)) {
    return { ok: false, reason: "youtube_render_result_file_not_found", outputPath: null };
  }
  let result;
  try {
    result = JSON.parse(readFileSync(renderResultPath, "utf-8"));
  } catch (e) {
    return { ok: false, reason: `youtube_render_result_json_parse_failed: ${String(e?.message || e)}`, outputPath: null };
  }

  if (result?.schemaVersion !== RENDER_RESULT_SCHEMA_VERSION) {
    return { ok: false, reason: `youtube_render_result_unrecognized_schema_version: ${result?.schemaVersion}`, outputPath: null };
  }
  if (result?.executed !== true) {
    return { ok: false, reason: "youtube_render_result_executed_not_true", outputPath: null };
  }
  if (result?.allVerificationsPass !== true) {
    return { ok: false, reason: "youtube_render_result_allVerificationsPass_not_true", outputPath: null };
  }
  if (result?.ffmpegConversionCount !== 1) {
    return { ok: false, reason: `youtube_render_result_ffmpegConversionCount_not_1: ${result?.ffmpegConversionCount}`, outputPath: null };
  }
  const counters = result?.sideEffectCounters ?? {};
  if (counters.apiCallCount !== 0) {
    return { ok: false, reason: `youtube_render_result_apiCallCount_not_0: ${counters.apiCallCount}`, outputPath: null };
  }
  if (counters.uploadCount !== 0) {
    return { ok: false, reason: `youtube_render_result_uploadCount_not_0: ${counters.uploadCount}`, outputPath: null };
  }
  if (counters.envSecretReadCount !== 0) {
    return { ok: false, reason: `youtube_render_result_envSecretReadCount_not_0: ${counters.envSecretReadCount}`, outputPath: null };
  }
  if (counters.deployCount !== 0) {
    return { ok: false, reason: `youtube_render_result_deployCount_not_0: ${counters.deployCount}`, outputPath: null };
  }

  const outputPath = result?.outputPath;
  if (typeof outputPath !== "string" || outputPath.trim() === "" || !outputPath.toLowerCase().endsWith(".mp4")) {
    return { ok: false, reason: "youtube_render_result_outputPath_missing_or_not_mp4", outputPath: null };
  }
  const outputAbs = resolve(outputPath);
  if (outputAbs.startsWith(repoRoot + "\\") || outputAbs.startsWith(repoRoot + "/")) {
    return { ok: false, reason: "youtube_render_result_outputPath_inside_repo", outputPath: null };
  }
  if (!existsSync(outputAbs)) {
    return { ok: false, reason: "youtube_render_result_outputPath_file_not_found", outputPath: null };
  }
  const outputSize = typeof result?.outputSizeBytes === "number" ? result.outputSizeBytes : null;
  if (outputSize == null || outputSize <= 0) {
    return { ok: false, reason: "youtube_render_result_outputSizeBytes_not_positive", outputPath: null };
  }

  return { ok: true, reason: null, outputPath: outputAbs };
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
  youtubeRenderResultPath,
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

  let youtubeRenderResultOutputPath = null;
  if (youtubeRenderResultPath != null) {
    const renderResultCheck = readAndValidateYoutubeRenderResult(youtubeRenderResultPath, { repoRoot: REPO_ROOT });
    if (!renderResultCheck.ok) {
      return { ok: false, reason: renderResultCheck.reason, manifest: null, buildSummary: null };
    }
    youtubeRenderResultOutputPath = renderResultCheck.outputPath;
  }

  if (youtubeSourcePath != null && youtubeRenderResultOutputPath != null) {
    if (resolve(youtubeSourcePath) !== youtubeRenderResultOutputPath) {
      return { ok: false, reason: "youtube_source_render_result_mismatch", manifest: null, buildSummary: null };
    }
  }

  const youtubeSourceDerivedFromRenderResult = youtubeRenderResultOutputPath != null;
  const explicitYoutubeSourcePath = youtubeSourcePath ?? youtubeRenderResultOutputPath;
  const resolvedYoutubeSourcePath = explicitYoutubeSourcePath ?? deterministicYoutubePlaceholderPath(resolvedContentId, resolvedVersion);
  const youtubeSourceProvided = explicitYoutubeSourcePath != null;
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
    youtubeSourceDerivedFromRenderResult,
    youtubeSourceReady,
    youtubeSourceNote: youtubeSourceDerivedFromRenderResult
      ? "derived from a validated --youtube-render-result outputPath (schemaVersion/executed/allVerificationsPass/ffmpegConversionCount/side-effect counters all checked, output file existence+size checked with fs.existsSync/statSync only; ffmpeg was not re-run by this builder)."
      : youtubeSourceProvided
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
      youtubeSourceDerivedFromRenderResult
        ? "youtubeSourcePath was derived from a validated --youtube-render-result outputPath — no manual mp4 path copy was needed."
        : "youtubeSourcePath is a placeholder until a later approved local media step generates the " +
          "YouTube letterbox render and either passes --youtube-source, --youtube-render-result, or the placeholder path is filled in.",
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
  const youtubeRenderResultPath = getArg(args, "--youtube-render-result");
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
  if ([summaryPath, pipelineSummaryPath, outDirAbs, youtubeSourcePath, youtubeRenderResultPath, blobLivenessResultPath]
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
    youtubeRenderResultPath,
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
  console.log(`  youtubeSourceDerivedFromRenderResult: ${result.buildSummary.youtubeSourceDerivedFromRenderResult}`);
  console.log(`  metadataReady:                   ${result.buildSummary.metadataReady}`);
  console.log(`  blobLivenessEvidenceReady:       ${result.buildSummary.blobLivenessEvidenceReady}`);
  console.log(`  contentUnitPreflightExpectedReady: ${result.buildSummary.contentUnitPreflightExpectedReady}`);
  console.log(`\n  manifest:      ${manifestPath}`);
  console.log(`  build summary: ${buildSummaryPath}`);
  console.log("");

  process.exit(0);
}
