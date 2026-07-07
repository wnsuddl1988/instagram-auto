#!/usr/bin/env node
/**
 * run-dual-platform-final-publish-orchestrator.mjs
 *
 * task: dual-platform-arm-wiring-duplicate-guarded-v1
 * (base: dual-platform-live-orchestrator-wiring-preflight-no-live-v1
 *  ← dual-platform-final-publish-orchestrator-no-live-v1)
 *
 * 하나의 콘텐츠 unit으로부터 Instagram job + YouTube job 2개의 publish plan을
 * 생성하는 runner다. 4가지 모드를 지원한다:
 *   --dry-run   : 기존 no-live 동작. publish plan + gate/guard 판정만 계산.
 *   --preflight : 준비 검증. publish plan + 파일경로 + metadata gate + duplicate guard +
 *                 Blob liveness evidence + arm 상태 + required env key NAME 계약(값 미접근).
 *   --credential-preflight : redacted env key presence check(no-live). 승인된 runtime env key
 *                 '이름'의 present boolean만 보고한다(값/길이/prefix/suffix/hash 미노출). status-style
 *                 diagnostic이라 missing key가 있어도 exit 0. credential 값을 resolve하지 않고,
 *                 .env.local/secret 파일을 읽지 않으며, API/upload/Blob 호출도 하지 않는다.
 *   --live/--arm: armed(APPROVE_DUAL_PLATFORM_ARM). LIVE_GATE_ORDER 순서로 fail-closed
 *                 평가하며, default content(t1_lifestyle_inflation/v3_2)는 gate 4
 *                 duplicate publish guard가 BLOCKED_DUPLICATE_ALREADY_PUBLISHED(exit 3)로
 *                 차단한다 — credential resolution(gate 5)/actual API call(gate 6) 미도달.
 *                 custom(non-default) content는 gate 1~4를 통과하면 credential resolution
 *                 stub(gate 5)까지 도달한 뒤 CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE(exit 4)로
 *                 fail-closed된다 — credential 값 미접근, actual API call(gate 6) 미도달.
 *                 실제 publish는 이 slice에서 비활성이다(credential resolution 미wiring).
 *
 * 이 슬라이스에서 절대 하지 않는 것:
 * - Instagram/YouTube API 호출 (fetch/googleapis/axios 등 네트워크 호출 없음)
 * - Vercel Blob put()/list()/del() 등 object mutation
 * - .env.local 또는 다른 secret 파일 직접 read
 * - credential '값' read/출력/저장 및 값에서 파생된 정보(길이/prefix/suffix/hash) 노출.
 *   preflight는 key '이름'만 계약으로 출력하고 process.env를 읽지 않는다. credential-preflight는
 *   승인된 key 이름의 present boolean 판정에만 process.env를 접근하며 값은 노출하지 않는다.
 * - duplicate publish guard(gate 4) 통과 전 credential resolution/actual API call
 * - 새 영상 생성/렌더/ffmpeg/TTS/image/browser
 * - deploy/dependency/commit/push
 *
 * 실행 예: node scripts/run-dual-platform-final-publish-orchestrator.mjs --credential-preflight
 */
import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// ── live execution gate (dual-platform-arm-wiring-duplicate-guarded-v1: 최종 arm) ──
// Owner 승인 APPROVE_DUAL_PLATFORM_ARM로 live gate가 arm 상태다. 단, 실제 live 실행
// 경로는 반드시 LIVE_GATE_ORDER의 fail-closed 순서로 평가되며, current content
// (t1_lifestyle_inflation/v3_2)는 gate 4 duplicate publish guard가 credential
// resolution(gate 5)/actual API call(gate 6) 이전에 반드시 차단한다.
// 이 상수가 false로 회귀하면 --live/--arm은 여전히 LIVE_EXECUTION_DISABLED_THIS_SLICE로
// exit 2 fail-closed된다(방어적 이중 안전장치).
export const LIVE_EXECUTION_ENABLED_THIS_SLICE = true;
export const LIVE_EXECUTION_ARM_APPROVAL_TOKEN = "APPROVE_DUAL_PLATFORM_ARM";
export const LIVE_EXECUTION_DISABLED_ERROR = "LIVE_EXECUTION_DISABLED_THIS_SLICE";
export const DUPLICATE_BLOCKED_STATUS = "BLOCKED_DUPLICATE_ALREADY_PUBLISHED";
export const CREDENTIAL_RESOLUTION_NOT_WIRED_ERROR = "CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE";

/**
 * (deprecated as a live-halt) custom content live 차단 상태 문자열.
 * task: dual-platform-content-unit-manifest-parameterization-no-live-v1
 *       → dual-platform-custom-content-live-credential-gate-no-execute-v1
 * 이전 slice에서는 custom(non-default) content의 --live/--arm이 gate 4와 gate 5 사이의
 * 무조건 halt(옛 gate 4.5)에서 이 상태로 멈췄다. 이제는 gate 1~4를 통과한 custom content가
 * credential resolution stub(gate 5)까지 도달한 뒤 CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE로
 * fail-closed된다(exit 4). 이 상수는 하위 호환/문서 참조용으로만 export되며, 실제 live 실행
 * 경로(executeArmedLiveRun)에서는 더 이상 halt 상태로 사용되지 않는다. custom content 실제
 * publish(API 실행)는 여전히 비활성이다 — credential resolution이 wiring되지 않았기 때문이다.
 */
export const CUSTOM_CONTENT_LIVE_NOT_ENABLED_ERROR = "CUSTOM_CONTENT_LIVE_NOT_ENABLED_THIS_SLICE";

/** content unit manifest 계약 스키마 버전(외부 manifest가 선언해야 하는 값). */
export const CONTENT_UNIT_MANIFEST_SCHEMA_VERSION = "dual_platform_content_unit_v1";

/**
 * 실제 live 실행 경로의 fail-closed gate 평가 순서(핵심 안전 순서 — 순서 변경 금지).
 * duplicate_publish_guard(4)는 credential_presence_resolution(5)보다 반드시 먼저 평가된다.
 * current content는 4에서 차단되므로 5/6에 도달하지 않는다.
 */
export const LIVE_GATE_ORDER = [
  "metadata_optimization_gate",
  "source_file_gate",
  "blob_public_url_liveness_evidence_gate",
  "duplicate_publish_guard",
  "credential_presence_resolution",
  "actual_api_call",
];

/**
 * Instagram Blob public URL liveness 통과 evidence (task: instagram-blob-url-liveness-no-arm-v1).
 * secret이 아닌 public URL/HEAD 결과만 담는다. live 실행 gate 3이 이 evidence를 검증하며,
 * 이 slice에서 네트워크 재검증(HEAD 재요청)은 수행하지 않는다.
 */
export const BLOB_PUBLIC_URL_LIVENESS_EVIDENCE = {
  url: "https://7iq7vppwlaha2vuo.public.blob.vercel-storage.com/instagram/reels/t1_lifestyle_inflation/instagram_reels_full_frame_1080x1920/v3_2/54957450ac10.mp4",
  headStatus: 200,
  contentType: "video/mp4",
  contentLength: 20294549,
  resultPath: "output/instagram-blob-url-liveness-no-arm-v1/result.json",
  sourceTask: "instagram-blob-url-liveness-no-arm-v1",
};

/**
 * live 실행에 필요한 env key '이름'만 나열한다(값 미접근).
 * preflight는 이 목록을 presence PLAN으로 출력할 뿐, process.env를 읽지 않는다.
 * 실제 credential resolution은 향후 live wiring 승인 이후 별도 경로에서만 수행된다.
 *
 * YouTube는 YOUTUBE_ACCESS_TOKEN을 장기 required env key로 요구하지 않는다.
 * short-lived access token은 향후 승인된 live 실행 중 refresh token(YOUTUBE_REFRESH_TOKEN)으로
 * 메모리에서 발급/갱신해 사용하며, env로 별도 저장/요구하지 않는다.
 */
export const REQUIRED_ENV_KEY_NAMES = {
  instagram: ["INSTAGRAM_BUSINESS_ACCOUNT_ID", "INSTAGRAM_ACCESS_TOKEN"],
  youtube: ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"],
  vercelBlob: ["BLOB_READ_WRITE_TOKEN"],
};

/**
 * live 실행 시 호출될 예정인 함수 참조(문자열). 이 runner의 어떤 실행 경로에서도
 * 실제로 import/호출되지 않는다 — 계약 문서화용 참조일 뿐이다.
 */
export const LIVE_PUBLISH_FUNCTION_REFS = {
  // import-safe explicit credential injection 함수를 가리킨다(credential을 인자로만 받음).
  instagram: "lib/instagram.ts#uploadInstagramReelWithCredentials",
  youtube: "lib/youtube.ts#uploadYouTubeShortsWithCredentials",
  instagramBlob: "lib/instagram-blob-media.ts#uploadInstagramBlob",
  instagramBlobPlan: "lib/instagram-blob-media.ts#planInstagramBlobUpload",
  instagramBlobPathname: "lib/instagram-blob-media.ts#buildInstagramBlobPathname",
};

/**
 * Instagram full-frame mp4가 업로드될 Vercel Blob public URL의 결정론적 pathname 템플릿.
 * 실제 값(sha256 등)은 이 slice에서 계산/출력하지 않는다 — 구조만 문서화한다.
 * (lib/instagram-blob-media.ts#buildInstagramBlobPathname 계약과 정합.)
 */
export const INSTAGRAM_BLOB_PATHNAME_TEMPLATE =
  "instagram/reels/{contentId}/{variantId}/{version}/{sha256_12}.mp4";

// ── 계약 상수 (dual_platform_variant_publish_architecture.v1.json과 정합) ──────

export const INSTAGRAM_VARIANT_ID = "instagram_reels_full_frame_1080x1920";
export const YOUTUBE_VARIANT_ID = "youtube_shorts_letterbox_1080x1920";

export const YOUTUBE_DEFAULT_METADATA = {
  titleBase: "월급 올라도 돈이 안 모이는 이유",
  titleWithShortsSuffix: "월급 올라도 돈이 안 모이는 이유 #Shorts",
  descriptionBase:
    "월급은 올랐는데 통장은 그대로라면, 생활비가 같이 커지는 라이프스타일 인플레이션을 점검해야 합니다.",
  tags: [
    "재테크", "돈관리", "월급관리", "생활비", "라이프스타일인플레이션",
    "저축", "절약", "사회초년생재테크", "돈모으는법", "Shorts",
  ],
  categoryId: "22",
  defaultLanguage: "ko",
  privacyStatus: "public",
  selfDeclaredMadeForKids: false,
};

/**
 * Instagram metadata optimization contract.
 * "영상만 업로드 금지" 규칙 — caption/hashtags/CTA 없이는 publish job이 완전하지 않다.
 */
export const INSTAGRAM_DEFAULT_METADATA = {
  captionFirstLineHook: "월급은 올랐는데 왜 통장은 그대로일까?",
  caption:
    "월급은 올랐는데 통장은 그대로라면, 생활비가 같이 커지는 라이프스타일 인플레이션을 점검해야 합니다.",
  hashtags: [
    "재테크", "돈관리", "월급관리", "생활비절약", "라이프스타일인플레이션",
    "사회초년생재테크", "돈모으는법", "절약습관", "경제공부", "릴스",
  ],
  callToAction: "저장하고 다음에 다시 보기 · 팔로우하면 돈관리 팁 계속 받아보기",
  forbiddenUnrelatedTrendTags: true,
};

/**
 * live evidence(이미 완료, 재시도 금지). secret 값은 담지 않는다.
 */
export const LIVE_UPLOAD_EVIDENCE = {
  instagram: { status: "already_completed", mediaId: "17916511431199303", retryForbidden: true },
  youtube: {
    status: "already_completed",
    videoId: "r9jhckdpC9w",
    videoUrl: "https://www.youtube.com/shorts/r9jhckdpC9w",
    retryForbidden: true,
  },
};

// ── 중복 게시 방지 계약 (dry-run: ledger mutation 없음, in-memory read-only 판정만) ──

/**
 * 이미 published 상태로 간주하는 (contentId/platform/version) 키 목록.
 * 이 slice는 실제 ledger를 쓰거나 읽지 않는다 — dry-run 데모용 in-memory 상수다.
 *
 * version은 publish duplicate key용 "콘텐츠 버전"이며 실제 live upload evidence
 * (Instagram media_id 17916511431199303 / YouTube videoId r9jhckdpC9w)가 사용한
 * source artifact 버전 v3_2와 정합해야 한다. YouTube letterbox render 파일명의
 * `_v1` 접미사는 letterbox render artifact 자체의 버전(렌더 산출물 버전)이며,
 * 이 publish duplicate key의 콘텐츠 version과는 별개 개념이다 — 혼동 금지.
 */
const EXISTING_PUBLISHED_KEYS = new Set([
  "t1_lifestyle_inflation/instagram_reels/v3_2",
  "t1_lifestyle_inflation/youtube_shorts/v3_2",
]);

function publishKey(contentId, platform, version) {
  return `${contentId}/${platform}/${version}`;
}

/**
 * live mode에서만 의미 있는 차단 판정. dry-run에서는 판정 결과만 계산하고
 * 실제로 아무 것도 차단/발행하지 않는다(ledger mutation 0).
 */
function checkDuplicatePublishGuard(contentId, platform, version, liveMode) {
  const key = publishKey(contentId, platform, version);
  const alreadyPublished = EXISTING_PUBLISHED_KEYS.has(key);
  return {
    key,
    alreadyPublished,
    blockedThisRun: liveMode === true && alreadyPublished,
  };
}

// ── job builders ──────────────────────────────────────────────────────────

function buildInstagramJob(unit) {
  const guard = checkDuplicatePublishGuardForUnit(unit, "instagram_reels", false);
  // custom content unit이 자체 instagramMetadata를 제공하면 그것을 쓰고,
  // 없으면 default evidence content의 metadata를 사용한다(하위 호환).
  const metadata = unit.instagramMetadata ?? INSTAGRAM_DEFAULT_METADATA;
  return {
    id: "instagram_job",
    platform: "instagram_reels",
    variantId: INSTAGRAM_VARIANT_ID,
    sourcePath: unit.instagramSourcePath,
    deliveryMode: "public_unauthenticated_https_video_url",
    provider: "vercel_blob",
    requiresPublicBlobUrl: true,
    liveApiCallPerformed: false,
    blobUploadPerformed: false,
    metadata,
    duplicatePublishGuard: guard,
  };
}

function buildYoutubeJob(unit) {
  const guard = checkDuplicatePublishGuardForUnit(unit, "youtube_shorts", false);
  const metadata = unit.youtubeMetadata ?? YOUTUBE_DEFAULT_METADATA;
  return {
    id: "youtube_job",
    platform: "youtube_shorts",
    variantId: YOUTUBE_VARIANT_ID,
    sourcePath: unit.youtubeSourcePath,
    deliveryMode: "direct_media_file_upload",
    provider: "youtube_data_api",
    requiresPublicBlobUrl: false,
    liveApiCallPerformed: false,
    metadata,
    duplicatePublishGuard: guard,
  };
}

// ── metadata optimization gate ───────────────────────────────────────────────

/**
 * "영상만 업로드 금지" 규칙: 플랫폼별 metadata가 최소 요건을 만족하지 않으면
 * publish job을 metadata-incomplete로 표시한다. live mode 이전에 반드시
 * 통과해야 하는 gate이며, 이 slice에서는 판정만 하고 발행을 막지는 않는다
 * (no-live이므로 애초에 발행 자체가 없음).
 */
const DISALLOWED_TREND_TAG_PATTERN = /(챌린지|viral|trend|밈|fyp|fypシ)/i;

function checkInstagramMetadataGate(metadata) {
  const reasons = [];
  if (!metadata) {
    reasons.push("metadata_missing");
    return { ok: false, reasons };
  }
  if (typeof metadata.captionFirstLineHook !== "string" || metadata.captionFirstLineHook.trim() === "") {
    reasons.push("first_line_hook_missing");
  }
  const hashtags = Array.isArray(metadata.hashtags) ? metadata.hashtags : [];
  if (hashtags.length < 8) reasons.push("hashtag_count_below_min_8");
  if (hashtags.length > 12) reasons.push("hashtag_count_above_max_12");
  if (hashtags.some((t) => DISALLOWED_TREND_TAG_PATTERN.test(String(t)))) {
    reasons.push("hashtag_contains_unrelated_trend_tag");
  }
  if (typeof metadata.callToAction !== "string" || metadata.callToAction.trim() === "") {
    reasons.push("call_to_action_missing");
  }
  return { ok: reasons.length === 0, reasons };
}

function checkYoutubeMetadataGate(metadata) {
  const reasons = [];
  if (!metadata) {
    reasons.push("metadata_missing");
    return { ok: false, reasons };
  }
  if (typeof metadata.titleBase !== "string" || metadata.titleBase.trim() === "") {
    reasons.push("title_missing");
  }
  const tags = Array.isArray(metadata.tags) ? metadata.tags : [];
  if (tags.length === 0) reasons.push("tags_missing");
  if (tags.some((t) => DISALLOWED_TREND_TAG_PATTERN.test(String(t)))) {
    reasons.push("tags_contains_unrelated_trend_tag");
  }
  return { ok: reasons.length === 0, reasons };
}

/**
 * 콘텐츠 unit 1개 → publish plan(Instagram job + YouTube job) 생성.
 * 순수 함수: 네트워크/파일IO/env 접근 없음.
 */
export function buildDualPlatformPublishPlan(unit) {
  const instagramJob = buildInstagramJob(unit);
  const youtubeJob = buildYoutubeJob(unit);
  instagramJob.metadataOptimizationGate = checkInstagramMetadataGate(instagramJob.metadata);
  youtubeJob.metadataOptimizationGate = checkYoutubeMetadataGate(youtubeJob.metadata);

  return {
    contentId: unit.contentId,
    version: unit.version,
    liveMode: false,
    generatedAt: null,
    jobs: [instagramJob, youtubeJob],
    sideEffectCounters: {
      instagramApiCallCount: 0,
      youtubeApiCallCount: 0,
      blobUploadCount: 0,
      blobListOrDeleteCount: 0,
      envSecretReadCount: 0,
      envSecretWriteCount: 0,
      dotEnvLocalDirectAccessCount: 0,
      newVideoGeneratedCount: 0,
      deployCount: 0,
      dependencyChangeCount: 0,
      commitCount: 0,
      pushCount: 0,
      ledgerMutationCount: 0,
    },
  };
}

const DEFAULT_CONTENT_UNIT = {
  contentId: "t1_lifestyle_inflation",
  // 콘텐츠 publish version. 실제 live evidence(Instagram media_id 17916511431199303 /
  // YouTube videoId r9jhckdpC9w)가 사용한 source artifact 버전 v3_2와 정합.
  // (YouTube letterbox render 파일명의 _v1은 별개인 "render artifact 버전".)
  version: "v3_2",
  instagramSourcePath:
    "C:\\tmp\\money-shorts-os\\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4",
  youtubeSourcePath:
    "C:\\Users\\PC\\jjy\\instagram-auto\\output\\youtube-shorts-letterbox-render-test-v1\\golden_sample_t1_lifestyle_inflation_youtube_letterbox_v1.mp4",
};

/**
 * unit이 default evidence content(t1_lifestyle_inflation/v3_2)인지 판정한다.
 * 판정은 contentId + version로만 한다(source path/metadata는 무관).
 */
export function isDefaultContentUnit(unit) {
  return (
    unit != null &&
    unit.contentId === DEFAULT_CONTENT_UNIT.contentId &&
    unit.version === DEFAULT_CONTENT_UNIT.version
  );
}

/**
 * content unit manifest 파일(JSON)을 읽어 unit 객체로 변환한다.
 * task: dual-platform-content-unit-manifest-parameterization-no-live-v1
 *
 * - JSON.parse만 수행한다. 미디어/네트워크/env 접근 없음.
 * - schemaVersion / contentId / version / instagramSourcePath / youtubeSourcePath는 필수.
 * - optional: instagramMetadata / youtubeMetadata / blobPublicUrlLivenessEvidence /
 *   existingPublishedKeys.
 * - 파싱 실패/필수 필드 누락 시 { ok:false, reasons:[...] }를 반환한다(throw 없음).
 */
export function loadContentUnitFromManifest(manifestPath) {
  const reasons = [];
  if (typeof manifestPath !== "string" || manifestPath.trim() === "") {
    return { ok: false, reasons: ["manifest_path_missing"], unit: null };
  }
  if (!existsSync(manifestPath)) {
    return { ok: false, reasons: ["manifest_file_not_found"], unit: null, manifestPath };
  }
  let raw;
  try {
    raw = JSON.parse(readFileSync(manifestPath, "utf-8"));
  } catch (e) {
    return { ok: false, reasons: [`manifest_json_parse_failed: ${String(e?.message || e)}`], unit: null, manifestPath };
  }

  if (raw?.schemaVersion !== CONTENT_UNIT_MANIFEST_SCHEMA_VERSION) {
    reasons.push(`schema_version_mismatch(expected ${CONTENT_UNIT_MANIFEST_SCHEMA_VERSION})`);
  }
  for (const field of ["contentId", "version", "instagramSourcePath", "youtubeSourcePath"]) {
    if (typeof raw?.[field] !== "string" || raw[field].trim() === "") {
      reasons.push(`required_field_missing_or_empty: ${field}`);
    }
  }

  if (reasons.length > 0) {
    return { ok: false, reasons, unit: null, manifestPath };
  }

  const unit = {
    contentId: raw.contentId,
    version: raw.version,
    instagramSourcePath: raw.instagramSourcePath,
    youtubeSourcePath: raw.youtubeSourcePath,
  };
  // optional fields — 있을 때만 전달한다.
  if (raw.instagramMetadata != null) unit.instagramMetadata = raw.instagramMetadata;
  if (raw.youtubeMetadata != null) unit.youtubeMetadata = raw.youtubeMetadata;
  if (raw.blobPublicUrlLivenessEvidence != null) unit.blobPublicUrlLivenessEvidence = raw.blobPublicUrlLivenessEvidence;
  if (Array.isArray(raw.existingPublishedKeys)) unit.existingPublishedKeys = raw.existingPublishedKeys;

  return { ok: true, reasons: [], unit, manifestPath };
}

/**
 * unit별 duplicate publish key 판정(default이 아닌 custom content도 지원).
 * default content는 전역 EXISTING_PUBLISHED_KEYS를, custom content는 manifest의
 * existingPublishedKeys(있으면)를 참조한다. liveMode에서만 실제 차단 의미를 갖는다.
 */
function checkDuplicatePublishGuardForUnit(unit, platform, liveMode) {
  const key = publishKey(unit.contentId, platform, unit.version);
  const customKeys = Array.isArray(unit.existingPublishedKeys) ? new Set(unit.existingPublishedKeys) : null;
  const alreadyPublished = isDefaultContentUnit(unit)
    ? EXISTING_PUBLISHED_KEYS.has(key)
    : customKeys != null && customKeys.has(key);
  return { key, alreadyPublished, blockedThisRun: liveMode === true && alreadyPublished };
}

/**
 * custom content unit용 Blob liveness evidence 평가(gate 3).
 * default content는 전역 BLOB_PUBLIC_URL_LIVENESS_EVIDENCE 상수(evaluateBlobLivenessEvidenceGate)를
 * 사용하고, custom content는 manifest가 제공한 blobPublicUrlLivenessEvidence를 계약 수준으로만 검증한다.
 * 네트워크 HEAD/list/readback을 절대 수행하지 않는다 — manifest evidence 필드의 형태만 확인한다.
 * evidence가 없거나 부정확하면 ok:false(fail-closed).
 */
function evaluateCustomBlobLivenessEvidence(unit) {
  const ev = unit.blobPublicUrlLivenessEvidence;
  if (ev == null || typeof ev !== "object") {
    return { ok: false, provided: false, reasons: ["blob_liveness_evidence_missing"] };
  }
  const reasons = [];
  const urlMatchesContentPath =
    typeof ev.url === "string" &&
    ev.url.includes(`/${unit.contentId}/`) &&
    ev.url.includes(`/${INSTAGRAM_VARIANT_ID}/`) &&
    ev.url.includes(`/${unit.version}/`);
  if (typeof ev.url !== "string" || !ev.url.startsWith("https://")) reasons.push("url_not_https");
  if (typeof ev.url === "string" && !ev.url.includes(".public.blob.vercel-storage.com/")) reasons.push("url_not_vercel_blob_public");
  if (typeof ev.url === "string" && !ev.url.endsWith(".mp4")) reasons.push("url_not_mp4");
  if (ev.headStatus !== 200) reasons.push("head_status_not_200");
  if (ev.contentType !== "video/mp4") reasons.push("content_type_not_video_mp4");
  if (typeof ev.contentLength !== "number" || ev.contentLength <= 0) reasons.push("content_length_invalid");
  if (!urlMatchesContentPath) reasons.push("url_does_not_match_content_path");
  const ok = reasons.length === 0;
  return {
    provided: true,
    url: typeof ev.url === "string" ? ev.url : null,
    headStatus: ev.headStatus ?? null,
    contentType: ev.contentType ?? null,
    contentLength: typeof ev.contentLength === "number" ? ev.contentLength : null,
    urlMatchesContentPath,
    reasons,
    ok,
    networkRevalidationPerformed: false,
  };
}

/**
 * preflight 준비 검증(no-live). 실제 upload/API/Blob/env-value 접근 없이,
 * live 실행에 필요한 준비 상태를 계약 수준에서 검증한다.
 *
 * 검증 항목:
 *  - publish plan 2개 job 존재 + 양쪽 metadataOptimizationGate.ok
 *  - source 파일 경로 존재 여부(fs.existsSync — read 아님, boolean만)
 *  - duplicate publish guard가 v3_2 키를 사용 + 이미 published인지(reference)
 *  - required env key NAME presence PLAN — key 이름만 나열, process.env 미접근
 *
 * env 값/존재여부/길이/hash/prefix를 절대 출력하지 않는다.
 */
/**
 * no-execute live execution plan.
 *
 * 실제 Instagram=Vercel Blob public URL → Instagram publish, YouTube=direct file
 * upload publish 흐름을 "코드 구조상" 순서대로 명문화한다. 단, 이번 slice에서는
 * 모든 step이 enabled:false / willExecute:false / sideEffectPerformed:false다.
 *
 * 이 함수는 순수 데이터 빌더다: 네트워크/파일IO/env 접근/실제 lib import가 전혀 없다.
 * functionRef는 문자열 참조일 뿐이며, 실제 호출은 향후 별도 승인 slice에서만 처리된다.
 * secret 값/토큰/credential value/URL query token은 이 plan에 담기지 않는다.
 */
function buildLiveExecutionPlan(unit, igJob, ytJob) {
  const igGate = igJob?.metadataOptimizationGate ?? { ok: false, reasons: ["gate_not_computed"] };
  const ytGate = ytJob?.metadataOptimizationGate ?? { ok: false, reasons: ["gate_not_computed"] };
  const igGuard = igJob?.duplicatePublishGuard ?? null;
  const ytGuard = ytJob?.duplicatePublishGuard ?? null;

  // task: dual-platform-content-unit-manifest-block-reason-fix-v1
  //       + dual-platform-custom-content-live-credential-gate-no-execute-v1
  // 실제 blocked 사유는 콘텐츠 종류에 따라 다르다:
  //  - default evidence content(v3_2) + 양쪽 already published → duplicate_publish_guard가 차단(exit 3).
  //  - custom(non-default) content → 옛 gate 4.5 무조건 halt는 제거됐다. gate 1~4를 통과하면
  //    credential resolution stub(gate 5)까지 도달한 뒤 CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE로
  //    fail-closed된다(exit 4). duplicate가 아닌 새 콘텐츠를 "중복이라 막힌 것"으로 오인하게 하는
  //    하드코딩을 쓰지 않는다.
  const isDefault = isDefaultContentUnit(unit);
  const bothAlreadyPublished = igGuard?.alreadyPublished === true && ytGuard?.alreadyPublished === true;
  const currentContentDuplicateBlocked = isDefault && bothAlreadyPublished;
  const willExecuteBlockedReason = currentContentDuplicateBlocked
    ? "duplicate_publish_guard_blocks_current_content"
    : "credential_resolution_not_wired_this_slice";

  // 모든 step 공통: arm 상태(enabled)지만 실제로 실행되는 step은 없다(willExecute:false,
  // side effect 0). blocked 사유는 위에서 콘텐츠 종류에 따라 정확히 판정한 값을 사용한다.
  const armedStepFlags = {
    enabled: LIVE_EXECUTION_ENABLED_THIS_SLICE,
    willExecute: false,
    willExecuteBlockedReason,
    sideEffectPerformed: false,
    liveExecutionEnabledThisSlice: LIVE_EXECUTION_ENABLED_THIS_SLICE,
  };

  const steps = [
    {
      order: 1,
      id: "instagram_blob_upload",
      description: "Instagram full-frame mp4 → Vercel Blob public URL(공개 비인증 https 비디오 URL)로 업로드.",
      platform: "instagram_reels",
      provider: "vercel_blob",
      ...armedStepFlags,
      functionRef: LIVE_PUBLISH_FUNCTION_REFS.instagramBlob,
      planFunctionRef: LIVE_PUBLISH_FUNCTION_REFS.instagramBlobPlan,
      // input 계약: 값이 아니라 "무엇이 필요한지"의 필드 이름만.
      inputContract: {
        sourceVariantId: INSTAGRAM_VARIANT_ID,
        sourceFileField: "instagramSourcePath",
        blobPathnameTemplate: INSTAGRAM_BLOB_PATHNAME_TEMPLATE,
        blobPutOptions: { access: "public", addRandomSuffix: false, allowOverwrite: false, multipart: true },
        producesPublicVideoUrl: true,
      },
      requiredApprovalTokens: ["APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST"],
      requiredEnvKeyNames: REQUIRED_ENV_KEY_NAMES.vercelBlob,
      dependsOn: [],
      producesForNextStep: "instagram_public_video_url",
    },
    {
      order: 2,
      id: "instagram_publish_reel",
      description: "Blob public video URL + optimized caption/hashtags/CTA → Instagram Reels publish.",
      platform: "instagram_reels",
      provider: "instagram_graph_api",
      ...armedStepFlags,
      functionRef: LIVE_PUBLISH_FUNCTION_REFS.instagram,
      inputContract: {
        // uploadInstagramReelWithCredentials({ videoUrl, caption, credentials }) 계약과 정합.
        videoUrlFrom: "instagram_blob_upload.instagram_public_video_url",
        captionFields: ["captionFirstLineHook", "caption", "hashtags", "callToAction"],
      },
      requiredApprovalTokens: ["APPROVE_DUAL_PLATFORM_ARM"],
      requiredEnvKeyNames: REQUIRED_ENV_KEY_NAMES.instagram,
      dependsOn: [
        "instagram_blob_upload",
        {
          type: "metadata_optimization_gate",
          platform: "instagram_reels",
          mustBeOk: true,
          gateOk: igGate.ok === true,
          gateReasons: igGate.reasons ?? [],
          rules: [
            "first_line_hook", "caption", "call_to_action",
            "hashtags_8_to_12", "no_unrelated_trend_tags",
          ],
        },
        {
          type: "duplicate_publish_guard",
          key: igGuard?.key ?? null,
          version: unit.version,
          alreadyPublished: igGuard?.alreadyPublished === true,
          mustNotBeAlreadyPublished: true,
          retryForbidden: true,
        },
      ],
      producesForNextStep: null,
      resultReference: {
        note: "이미 완료된 evidence. 재시도 금지.",
        instagramMediaIdReference: LIVE_UPLOAD_EVIDENCE.instagram.mediaId,
        retryForbidden: true,
      },
    },
    {
      order: 3,
      id: "youtube_direct_upload",
      description: "YouTube letterbox mp4 + optimized title/description/tags → YouTube Shorts direct file upload.",
      platform: "youtube_shorts",
      provider: "youtube_data_api",
      ...armedStepFlags,
      functionRef: LIVE_PUBLISH_FUNCTION_REFS.youtube,
      inputContract: {
        // uploadYouTubeShortsWithCredentials 계약과 정합: video 파일 + 최적화 메타데이터 + OAuth credential.
        // short-lived credential은 refresh token으로 메모리에서 발급 — 장기 env로 요구하지 않는다.
        videoPathField: "youtubeSourcePath",
        metadataFields: ["titleWithShortsSuffix", "descriptionBase", "tags", "categoryId", "defaultLanguage"],
        shortLivedCredentialSource: "derived_in_memory_from_refresh_token",
      },
      requiredApprovalTokens: ["APPROVE_YOUTUBE_LIVE_UPLOAD_WIRING", "APPROVE_DUAL_PLATFORM_ARM"],
      requiredEnvKeyNames: REQUIRED_ENV_KEY_NAMES.youtube,
      dependsOn: [
        {
          type: "metadata_optimization_gate",
          platform: "youtube_shorts",
          mustBeOk: true,
          gateOk: ytGate.ok === true,
          gateReasons: ytGate.reasons ?? [],
          rules: [
            "title", "description", "tags",
            "category_id", "language", "shorts_suitability",
          ],
        },
        {
          type: "duplicate_publish_guard",
          key: ytGuard?.key ?? null,
          version: unit.version,
          alreadyPublished: ytGuard?.alreadyPublished === true,
          mustNotBeAlreadyPublished: true,
          retryForbidden: true,
        },
      ],
      producesForNextStep: null,
      resultReference: {
        note: "이미 완료된 evidence. 재시도 금지.",
        youtubeVideoIdReference: LIVE_UPLOAD_EVIDENCE.youtube.videoId,
        retryForbidden: true,
      },
    },
    {
      order: 4,
      id: "publish_ledger_record",
      description: "{contentId}/{platform}/{version} duplicate ledger에 publish 기록. 이후 동일 키 재발행 차단.",
      platform: "both",
      provider: "publish_ledger",
      ...armedStepFlags,
      inputContract: {
        keyShape: "{contentId}/{platform}/{version}",
        version: unit.version,
        keys: [igGuard?.key ?? null, ytGuard?.key ?? null],
      },
      requiredApprovalTokens: ["APPROVE_DUAL_PLATFORM_ARM"],
      requiredEnvKeyNames: [],
      dependsOn: ["instagram_publish_reel", "youtube_direct_upload"],
      ledgerMutationThisSlice: false,
      producesForNextStep: null,
    },
  ];

  return {
    note: isDefault
      ? "armed live wiring plan. 실제 Instagram(Vercel Blob→Graph API) / YouTube(direct upload) publish 흐름을 " +
        "코드 구조상 순서대로 연결한다. live gate는 arm 상태지만 current content(v3_2)는 duplicate publish guard가 " +
        "차단하므로 이번 run에서 실행되는 step은 없다(side effect 0). secret 값/토큰/credential은 담지 않는다."
      : "armed live wiring plan(custom content). 이 콘텐츠는 default evidence content가 아니다. gate 1~4" +
        "(metadata/source/blob/duplicate)를 통과하면 credential resolution stub(gate 5)까지 도달한 뒤 " +
        "CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE로 fail-closed된다 — 이 slice에서 credential resolution/" +
        "actual API call은 wiring되지 않았다. 이번 run에서 실행되는 step은 없다(side effect 0, 실제 publish 비활성).",
    liveExecutionEnabledThisSlice: LIVE_EXECUTION_ENABLED_THIS_SLICE,
    failClosedError: LIVE_EXECUTION_DISABLED_ERROR,
    anyStepEnabled: LIVE_EXECUTION_ENABLED_THIS_SLICE,
    anyStepWillExecute: false,
    anySideEffectPerformed: false,
    isDefaultContentUnit: isDefault,
    currentContentDuplicateBlocked,
    // custom content live publish(실제 API 실행)는 여전히 비활성이다. 다만 옛 무조건 halt와 달리
    // gate 1~4 통과 시 credential resolution stub까지 도달한 뒤 CREDENTIAL_RESOLUTION_NOT_WIRED로 멈춘다.
    customContentLiveEnabledThisSlice: false,
    customContentLiveHaltError: isDefault ? null : CREDENTIAL_RESOLUTION_NOT_WIRED_ERROR,
    willExecuteBlockedReason,
    duplicateBlockedStatus: DUPLICATE_BLOCKED_STATUS,
    orderedFlow: [
      "instagram_blob_upload",
      "instagram_publish_reel",
      "youtube_direct_upload",
      "publish_ledger_record",
    ],
    metadataGateIsMandatoryDependency: true,
    duplicateGuardIsMandatoryDependency: true,
    steps,
  };
}

function buildPreflight(unit) {
  const isDefault = isDefaultContentUnit(unit);
  const plan = buildDualPlatformPublishPlan(unit);
  const igJob = plan.jobs.find((j) => j.id === "instagram_job");
  const ytJob = plan.jobs.find((j) => j.id === "youtube_job");

  // 파일 경로 presence: 존재 여부(boolean)만 확인한다. 파일 내용은 읽지 않는다.
  const instagramSourceExists = typeof unit.instagramSourcePath === "string" && existsSync(unit.instagramSourcePath);
  const youtubeSourceExists = typeof unit.youtubeSourcePath === "string" && existsSync(unit.youtubeSourcePath);

  const metadataGateOk = igJob?.metadataOptimizationGate?.ok === true && ytJob?.metadataOptimizationGate?.ok === true;
  // default content는 publish version이 v3_2로 고정이다. custom content는 자체 version을 쓰므로
  // duplicate guard key가 unit.version과 정합하는지(형태)만 확인한다.
  const duplicateGuardUsesV3_2 =
    typeof igJob?.duplicatePublishGuard?.key === "string" && igJob.duplicatePublishGuard.key.endsWith("/v3_2") &&
    typeof ytJob?.duplicatePublishGuard?.key === "string" && ytJob.duplicatePublishGuard.key.endsWith("/v3_2");
  const versionSuffix = `/${unit.version}`;
  const duplicateGuardUsesUnitVersion =
    typeof igJob?.duplicatePublishGuard?.key === "string" && igJob.duplicatePublishGuard.key.endsWith(versionSuffix) &&
    typeof ytJob?.duplicatePublishGuard?.key === "string" && ytJob.duplicatePublishGuard.key.endsWith(versionSuffix);

  // required env key NAME presence PLAN — 이름만. process.env는 읽지 않는다.
  const requiredEnvKeyNamesPlan = {
    note: "아래는 live 실행에 필요한 env key '이름' 계약이다. 값/존재여부/길이는 확인하지도 출력하지도 않는다.",
    instagram: REQUIRED_ENV_KEY_NAMES.instagram,
    youtube: REQUIRED_ENV_KEY_NAMES.youtube,
    vercelBlob: REQUIRED_ENV_KEY_NAMES.vercelBlob,
    envValuesAccessedThisRun: false,
  };

  // 이미 published인 evidence는 reference로만 취급하고 새 실행으로 다루지 않는다.
  const igAlreadyPublished = igJob?.duplicatePublishGuard?.alreadyPublished === true;
  const ytAlreadyPublished = ytJob?.duplicatePublishGuard?.alreadyPublished === true;

  // 두 source mp4가 모두 존재해야 preflight가 ready 상태다. 하나라도 없으면
  // metadata/duplicate guard가 통과해도 preflightOk는 false여야 한다.
  const sourceFilesReady = instagramSourceExists && youtubeSourceExists;

  // Blob public URL liveness evidence(gate 3) — arm 이후 preflightOk의 필수 조건.
  // default content는 전역 evidence 상수를, custom content는 manifest가 제공한
  // blobPublicUrlLivenessEvidence를 계약 수준으로 검증한다(네트워크 재검증 없음).
  const blobLivenessEvidence = isDefault
    ? evaluateBlobLivenessEvidenceGate(unit)
    : evaluateCustomBlobLivenessEvidence(unit);

  // duplicate guard 형태 정합은 default=v3_2 고정, custom=unit.version 기준으로 판정한다.
  const duplicateGuardKeyFormatOk = isDefault ? duplicateGuardUsesV3_2 : duplicateGuardUsesUnitVersion;

  const preflightOk =
    plan.jobs.length === 2 && metadataGateOk && duplicateGuardKeyFormatOk && sourceFilesReady &&
    blobLivenessEvidence.ok === true;

  // no-execute live wiring plan(Instagram Blob→publish, YouTube direct upload, ledger).
  const liveExecutionPlan = buildLiveExecutionPlan(unit, igJob, ytJob);

  // ── YouTube live upload wiring readiness (secret-free) ──────────────────────
  // task: youtube-live-upload-wiring-no-execute-v1
  // YouTube direct upload live 경로의 준비 상태를 계약 수준에서만 요약한다.
  // functionRef는 explicit credential injection 함수(uploadYouTubeShortsWithCredentials)이며,
  // YOUTUBE_ACCESS_TOKEN은 required env가 아니다(short-lived token은 refresh token으로 메모리 발급).
  // 이 블록은 어떤 env 값도 읽지 않고, 실제 upload 함수를 호출하지도 않는다.
  const ytGate = ytJob?.metadataOptimizationGate ?? { ok: false, reasons: ["gate_not_computed"] };
  const ytGuard = ytJob?.duplicatePublishGuard ?? null;
  const youtubeLiveUploadWiring = {
    note:
      "YouTube Shorts direct file upload live wiring readiness. no-execute 계약만 담는다. " +
      "secret 값/토큰/credential은 담지 않는다. actual upload call은 이 slice에서 0이다.",
    expectedFunctionRef: LIVE_PUBLISH_FUNCTION_REFS.youtube, // lib/youtube.ts#uploadYouTubeShortsWithCredentials
    credentialInjection: "explicit", // credential은 인자로만 주입, import 시점 env read 없음
    requiredEnvKeyNames: REQUIRED_ENV_KEY_NAMES.youtube, // CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN
    youtubeAccessTokenIsRequiredEnv: false, // 장기 required env 아님
    shortLivedCredentialSource: "derived_in_memory_from_refresh_token",
    sourceFileField: "youtubeSourcePath",
    sourceVariantId: YOUTUBE_VARIANT_ID,
    sourceFileExists: youtubeSourceExists, // boolean only(내용 미read)
    metadataOptimizationGateOk: ytGate.ok === true,
    metadataOptimizationGateReasons: ytGate.reasons ?? [],
    duplicatePublishGuard: {
      key: ytGuard?.key ?? null, // t1_lifestyle_inflation/youtube_shorts/v3_2
      usesV3_2: typeof ytGuard?.key === "string" && ytGuard.key.endsWith("/v3_2"),
      alreadyPublished: ytGuard?.alreadyPublished === true,
      mustNotBeAlreadyPublished: true,
      retryForbidden: true,
    },
    existingVideoEvidence: {
      note: "이미 완료된 YouTube upload evidence. 재업로드 금지 — reference로만 유지.",
      videoId: LIVE_UPLOAD_EVIDENCE.youtube.videoId, // r9jhckdpC9w
      videoUrl: LIVE_UPLOAD_EVIDENCE.youtube.videoUrl,
      retryForbidden: true,
    },
    liveExecutionEnabledThisSlice: LIVE_EXECUTION_ENABLED_THIS_SLICE, // true (armed) — 단 current content는 duplicate guard가 차단
    liveExecutionDisabledError: LIVE_EXECUTION_DISABLED_ERROR,
    actualUploadCallPerformed: false, // 실제 YouTube upload 호출 0 (duplicate blocked)
    requiredApprovalTokens: ["APPROVE_YOUTUBE_LIVE_UPLOAD_WIRING", "APPROVE_DUAL_PLATFORM_ARM"],
  };

  // ── 최종 arm 상태 + current content duplicate block 계약 (secret-free) ───────
  // task: dual-platform-arm-wiring-duplicate-guarded-v1
  // live gate는 APPROVE_DUAL_PLATFORM_ARM로 arm됐지만, current content(v3_2)는
  // gate 4 duplicate publish guard가 credential resolution(gate 5) 이전에 차단한다.
  // 이 블록은 env/secret 값을 읽지 않으며 실제 API 호출도 수행하지 않는다.
  const liveArm = {
    note:
      "최종 arm 상태 요약. --live/--arm은 LIVE_GATE_ORDER 순서로 fail-closed 평가되며, current content는 " +
      "duplicate publish guard(gate 4)가 credential resolution(gate 5)/actual API call(gate 6) 이전에 차단한다.",
    armed: LIVE_EXECUTION_ENABLED_THIS_SLICE,
    liveExecutionEnabledThisSlice: LIVE_EXECUTION_ENABLED_THIS_SLICE,
    armApprovalToken: LIVE_EXECUTION_ARM_APPROVAL_TOKEN,
    failClosedGateOrder: LIVE_GATE_ORDER,
    duplicateGuardEvaluatedBeforeCredentialResolution: true,
    credentialResolutionWiredThisSlice: false,
    credentialResolutionHaltError: CREDENTIAL_RESOLUTION_NOT_WIRED_ERROR,
    metadataOptimizationGateOk: metadataGateOk,
    sourceFilesReady,
    blobPublicUrlLivenessEvidence: blobLivenessEvidence,
    currentContentDuplicateBlock: {
      instagramKey: igJob?.duplicatePublishGuard?.key ?? null,
      youtubeKey: ytJob?.duplicatePublishGuard?.key ?? null,
      instagramWillBeBlocked: igAlreadyPublished,
      youtubeWillBeBlocked: ytAlreadyPublished,
      // default duplicate content는 gate 4 duplicate block(exit 3, credential 미도달). custom
      // non-default content는 duplicate가 아니라면 gate 4를 통과하고 gate 5 credential resolution
      // stub까지 도달한 뒤 CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE(exit 4)로 fail-closed된다.
      expectedLiveStatus: isDefault
        ? DUPLICATE_BLOCKED_STATUS
        : igAlreadyPublished && ytAlreadyPublished
          ? DUPLICATE_BLOCKED_STATUS
          : CREDENTIAL_RESOLUTION_NOT_WIRED_ERROR,
      expectedLiveExitCode: isDefault
        ? 3
        : igAlreadyPublished && ytAlreadyPublished
          ? 3
          : 4,
      // duplicate content(default 및 이미 게시된 custom)는 gate 4에서 credential 이전에 차단된다.
      // 비중복 custom content는 credential stub까지 도달하지만 credential 값은 읽지 않는다.
      duplicateBlockHappensBeforeCredentialResolution: isDefault || (igAlreadyPublished && ytAlreadyPublished),
      credentialResolutionWouldBeReached: !isDefault && !(igAlreadyPublished && ytAlreadyPublished),
      credentialValuesWouldBeAccessed: false,
      actualApiCallWouldRun: false,
      retryForbidden: true,
    },
    customContentLiveEnabledThisSlice: false,
    credentialValuesAccessedThisRun: false,
    actualApiCallPerformedThisRun: false,
  };

  // ── custom content unit preflight 계약 (secret-free) ─────────────────────────
  // task: dual-platform-content-unit-manifest-parameterization-no-live-v1
  //       + dual-platform-custom-content-live-credential-gate-no-execute-v1
  // custom(non-default) content의 실제 live publish(API 실행)는 여전히 비활성이다. 다만 옛
  // 무조건 custom halt(gate 4.5)는 제거됐다: gate 1~4를 통과한 custom content의 --live/--arm은
  // credential resolution stub(gate 5)까지 도달한 뒤 CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE로
  // fail-closed된다(exit 4, credential 값 미접근, actual API call 미도달).
  const bothAlreadyPublished = igAlreadyPublished && ytAlreadyPublished;
  const contentUnit = {
    note:
      "content unit 종류와 live 실행 가능 여부. default evidence content(t1_lifestyle_inflation/v3_2)는 " +
      "gate 4 duplicate guard가 차단한다(exit 3). custom content의 실제 publish는 비활성이며, gate 1~4를 " +
      "통과하면 credential resolution stub(gate 5)까지 도달한 뒤 CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE로 " +
      "fail-closed된다(exit 4).",
    kind: isDefault ? "default_evidence_content" : "custom_manifest_content",
    isDefaultContentUnit: isDefault,
    contentId: unit.contentId,
    version: unit.version,
    duplicateGuardKeyFormatOk,
    duplicateGuardUsesUnitVersion,
    // 실제 live publish(API 실행)는 이 slice에서 비활성이다(credential resolution 미wiring).
    customContentLiveEnabledThisSlice: false,
    customContentLiveHaltError: isDefault ? null : CREDENTIAL_RESOLUTION_NOT_WIRED_ERROR,
    customContentReachesCredentialGate: isDefault ? false : !bothAlreadyPublished,
    bothPlatformsAlreadyPublished: bothAlreadyPublished,
    blobLivenessEvidenceProvided: isDefault ? true : blobLivenessEvidence.provided === true,
    blobLivenessEvidenceOk: blobLivenessEvidence.ok === true,
  };

  return {
    preflightOk,
    liveArm,
    contentUnit,
    liveExecutionEnabledThisSlice: LIVE_EXECUTION_ENABLED_THIS_SLICE,
    publishJobCount: plan.jobs.length,
    metadataOptimizationGateOk: metadataGateOk,
    duplicateGuardUsesV3_2,
    duplicateGuardKeyFormatOk,
    isDefaultContentUnit: isDefault,
    sourceFilesReady,
    blobPublicUrlLivenessEvidence: blobLivenessEvidence,
    liveExecutionPlan,
    youtubeLiveUploadWiring,
    sourceFilePresence: {
      note: "존재 여부(boolean)만 확인. 파일 내용은 읽지 않는다. sourceFilesReady는 preflightOk의 필수 조건이다.",
      instagramSourceExists,
      youtubeSourceExists,
    },
    requiredEnvKeyNamesPlan,
    duplicatePublishReference: {
      note: "이미 완료된 live evidence에 대응하는 reference. 새 실행/재시도 대상이 아니다. live wiring 시 duplicate guard가 이 키를 차단해야 한다.",
      instagramAlreadyPublished: igAlreadyPublished,
      youtubeAlreadyPublished: ytAlreadyPublished,
      instagramMediaIdReference: LIVE_UPLOAD_EVIDENCE.instagram.mediaId,
      youtubeVideoIdReference: LIVE_UPLOAD_EVIDENCE.youtube.videoId,
      retryForbidden: true,
    },
  };
}

// ── redacted credential preflight (dual-platform-credential-preflight-redacted-no-live-v1) ──
// Owner가 실제 live publish 직전에 "필요한 runtime env key '이름'이 present인지"만 값 없이 확인할 수
// 있게 한다. 이 경로는 no-live이며 credential 값을 resolve하거나 API/upload를 실행하지 않는다.
//
// 보안 계약(엄격):
// - process.env는 승인된 key 이름의 presence boolean 판정에만 접근한다.
// - 값을 변수에 바인딩하거나, 출력하거나, 길이/prefix/suffix/hash/sample/token type을 계산/노출하지 않는다.
// - `.env`/`.env.local`/secret 파일을 읽지 않는다(dotenv/파일 read 없음).
// - Instagram/YouTube/Blob API, OAuth, upload, HEAD, ffmpeg, deploy를 호출하지 않는다.

/**
 * 승인된 env key 이름 하나의 presence를 boolean으로만 반환한다.
 * Boolean(process.env[keyName])는 값을 지역 변수에 담지 않고 truthiness만 판정한다:
 * 미설정(undefined)/빈 문자열("")은 false, 비어있지 않은 값은 true. 값 자체는 반환/저장/출력하지 않는다.
 * 길이/prefix/suffix/hash 등 값에서 파생된 어떤 정보도 계산하지 않는다.
 */
function isEnvKeyPresentRedacted(keyName) {
  return Boolean(process.env[keyName]);
}

/** 한 플랫폼의 승인된 key 이름 목록에 대해 { name, present } 배열 + allPresent를 만든다(값 미노출). */
function buildPlatformKeyPresence(keyNames) {
  const keys = keyNames.map((name) => ({ name, present: isEnvKeyPresentRedacted(name) }));
  return { keys, allPresent: keys.every((k) => k.present === true) };
}

/**
 * redacted credential preflight 결과를 만든다. key 이름 + present boolean + platform/전체 readiness만
 * 포함한다. credential 값/길이/prefix/hash는 어디에도 담기지 않으며, API 호출/파일 read도 하지 않는다.
 * content unit은 context 필드(contentId/version/isDefaultContentUnit)에만 쓰이고 env presence 로직에는
 * 영향을 주지 않는다.
 */
function buildCredentialPreflight(unit, isDefault) {
  const instagram = buildPlatformKeyPresence(REQUIRED_ENV_KEY_NAMES.instagram);
  const youtube = buildPlatformKeyPresence(REQUIRED_ENV_KEY_NAMES.youtube);
  const vercelBlob = buildPlatformKeyPresence(REQUIRED_ENV_KEY_NAMES.vercelBlob);
  const allRequiredKeysPresent =
    instagram.allPresent === true && youtube.allPresent === true && vercelBlob.allPresent === true;
  return {
    schemaVersion: "dual_platform_final_publish_orchestrator_v1",
    mode: "credential_preflight",
    note:
      "redacted credential presence check(no-live). 승인된 runtime env key '이름'의 present boolean만 보고한다. " +
      "credential 값/길이/prefix/suffix/hash는 읽거나 출력하지 않으며, .env.local/secret 파일을 읽지 않고, " +
      "실제 credential resolution이나 Instagram/YouTube/Blob API 호출도 수행하지 않는다. present:true는 실제 " +
      "publish 가능 상태가 아니라 '해당 env key 이름이 이 프로세스 env에 비어있지 않게 존재함'만을 의미한다.",
    contentId: unit.contentId,
    version: unit.version,
    isDefaultContentUnit: isDefault === true,
    // 안전 assertion 필드(모두 상수 false/true) — guard가 계약 위반을 fail-closed로 잡는다.
    credentialValuesAccessed: false,
    credentialValuesResolved: false,
    credentialValuesPrinted: false,
    dotEnvLocalDirectAccess: false,
    externalApiCallPerformed: false,
    presenceCheckMethod: "non_empty_env_key_presence_boolean_only",
    requiredEnvKeyNames: {
      instagram: REQUIRED_ENV_KEY_NAMES.instagram,
      youtube: REQUIRED_ENV_KEY_NAMES.youtube,
      vercelBlob: REQUIRED_ENV_KEY_NAMES.vercelBlob,
    },
    platforms: { instagram, youtube, vercelBlob },
    allRequiredKeysPresent,
    // present여도 이 slice에서 실제 credential resolution/publish는 여전히 wiring되지 않았다.
    // readyForCredentialResolution은 "env key 이름이 모두 present"라는 presence 신호일 뿐,
    // live publish 활성화 신호가 아니다.
    readyForCredentialResolution: allRequiredKeysPresent,
    credentialResolutionWiredThisSlice: false,
    liveExecutionEnabledThisSlice: LIVE_EXECUTION_ENABLED_THIS_SLICE,
  };
}

const SELF = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(SELF), "..");
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(SELF);

/** CLI args에서 mode를 판정한다. --live/--arm은 armed gate 순서 평가 대상이다. */
function resolveMode(argv) {
  if (argv.includes("--live") || argv.includes("--arm")) return "live_requested";
  // --credential-preflight는 --preflight보다 먼저 판정한다(별도 redacted presence-only 모드).
  if (argv.includes("--credential-preflight")) return "credential_preflight";
  if (argv.includes("--preflight")) return "preflight";
  return "dry_run";
}

// ── 최종 arm live 실행 경로 (dual-platform-arm-wiring-duplicate-guarded-v1) ────
// LIVE_GATE_ORDER 순서의 fail-closed 평가. current content(v3_2)는 gate 4
// duplicate publish guard에서 반드시 차단되어 gate 5/6에 도달하지 않는다.

/** gate 3: Blob public URL liveness evidence 검증. 로컬 evidence 상수 + 파일 존재 boolean만 — 네트워크/파일내용 read 0. */
function evaluateBlobLivenessEvidenceGate(unit) {
  const ev = BLOB_PUBLIC_URL_LIVENESS_EVIDENCE;
  // evidence 결과 파일은 존재 여부(boolean)만 확인한다 — 내용은 읽지 않는다.
  const resultFileExists = existsSync(path.join(REPO_ROOT, ev.resultPath));
  const urlMatchesCurrentContentPath =
    typeof ev.url === "string" &&
    ev.url.includes(`/${unit.contentId}/`) &&
    ev.url.includes(`/${INSTAGRAM_VARIANT_ID}/`) &&
    ev.url.includes(`/${unit.version}/`);
  const ok =
    typeof ev.url === "string" &&
    ev.url.startsWith("https://") &&
    ev.url.includes(".public.blob.vercel-storage.com/") &&
    ev.url.endsWith(".mp4") &&
    ev.headStatus === 200 &&
    ev.contentType === "video/mp4" &&
    typeof ev.contentLength === "number" &&
    ev.contentLength > 0 &&
    urlMatchesCurrentContentPath &&
    resultFileExists;
  return { ...ev, resultFileExists, urlMatchesCurrentContentPath, ok };
}

/** gate 4: duplicate publish guard(liveMode). credential resolution(gate 5)보다 반드시 먼저 평가된다. */
function evaluateDuplicatePublishGuardGate(unit) {
  const instagram = checkDuplicatePublishGuard(unit.contentId, "instagram_reels", unit.version, true);
  const youtube = checkDuplicatePublishGuard(unit.contentId, "youtube_shorts", unit.version, true);
  return {
    instagram,
    youtube,
    blocked: instagram.blockedThisRun === true || youtube.blockedThisRun === true,
    retryForbidden: true,
  };
}

/**
 * gate 5: credential presence/resolution — 이 slice에서는 wiring되지 않은 fail-closed stub.
 * process.env/secret/credential 값을 절대 읽지 않고, 어떤 lib도 import하지 않는다.
 * current content는 gate 4에서 차단되므로 이 함수에 도달하지 않는다.
 */
function credentialPresenceResolutionGate() {
  return {
    wiredThisSlice: false,
    credentialValuesAccessed: false,
    credentialValuesResolved: false,
    haltError: CREDENTIAL_RESOLUTION_NOT_WIRED_ERROR,
  };
}

/** 이 run에서 전부 0이어야 하는 live side-effect counter 초기값(어떤 코드 경로도 증가시키지 않는다). */
function zeroLiveSideEffectCounters() {
  return {
    instagramApiCallCount: 0,
    youtubeApiCallCount: 0,
    youtubeOauthTokenRequestCount: 0,
    youtubeUploadCallCount: 0,
    blobMutationCount: 0,
    credentialValuesAccessedCount: 0,
    credentialValuesResolvedCount: 0,
    dotEnvLocalDirectAccessCount: 0,
    envSecretValuePrintCount: 0,
    ledgerMutationCount: 0,
    newVideoGeneratedCount: 0,
  };
}

/**
 * --live/--arm 실행 경로(armed). LIVE_GATE_ORDER 순서로 fail-closed 평가한다.
 * current content(t1_lifestyle_inflation/v3_2)는 gate 4 duplicate publish guard가
 * BLOCKED_DUPLICATE_ALREADY_PUBLISHED(exit 3)로 차단한다 — gate 5/6 미도달.
 */
function executeArmedLiveRun(unit) {
  const sideEffectCounters = zeroLiveSideEffectCounters();
  const gateTrace = [];
  const base = {
    schemaVersion: "dual_platform_final_publish_orchestrator_v1",
    mode: "live_armed",
    armed: LIVE_EXECUTION_ENABLED_THIS_SLICE,
    liveExecutionEnabledThisSlice: LIVE_EXECUTION_ENABLED_THIS_SLICE,
    armApprovalToken: LIVE_EXECUTION_ARM_APPROVAL_TOKEN,
    contentId: unit.contentId,
    version: unit.version,
    gateOrder: LIVE_GATE_ORDER,
  };

  const plan = buildDualPlatformPublishPlan(unit);
  const igJob = plan.jobs.find((j) => j.id === "instagram_job");
  const ytJob = plan.jobs.find((j) => j.id === "youtube_job");

  // ── gate 1: metadata_optimization_gate ────────────────────────────────────
  const metadataGateOk =
    igJob?.metadataOptimizationGate?.ok === true && ytJob?.metadataOptimizationGate?.ok === true;
  gateTrace.push({ order: 1, gate: "metadata_optimization_gate", evaluated: true, ok: metadataGateOk });
  if (!metadataGateOk) {
    return {
      exitCode: 3,
      result: {
        ...base,
        status: "BLOCKED_METADATA_OPTIMIZATION_GATE",
        gateTrace,
        sideEffectCounters,
        credentialResolutionReached: false,
        credentialValuesAccessed: false,
        actualApiCallReached: false,
      },
    };
  }

  // ── gate 2: source_file_gate ──────────────────────────────────────────────
  const instagramSourceExists = typeof unit.instagramSourcePath === "string" && existsSync(unit.instagramSourcePath);
  const youtubeSourceExists = typeof unit.youtubeSourcePath === "string" && existsSync(unit.youtubeSourcePath);
  const sourceFilesReady = instagramSourceExists && youtubeSourceExists;
  gateTrace.push({
    order: 2, gate: "source_file_gate", evaluated: true, ok: sourceFilesReady,
    instagramSourceExists, youtubeSourceExists,
  });
  if (!sourceFilesReady) {
    return {
      exitCode: 3,
      result: {
        ...base,
        status: "BLOCKED_SOURCE_FILE_MISSING",
        gateTrace,
        sideEffectCounters,
        credentialResolutionReached: false,
        credentialValuesAccessed: false,
        actualApiCallReached: false,
      },
    };
  }

  // ── gate 3: blob_public_url_liveness_evidence_gate ────────────────────────
  // default content는 전역 evidence 상수를, custom content는 manifest가 제공한
  // blobPublicUrlLivenessEvidence를 계약 수준으로 검증한다(네트워크 재검증 없음).
  const livenessGate = isDefaultContentUnit(unit)
    ? evaluateBlobLivenessEvidenceGate(unit)
    : evaluateCustomBlobLivenessEvidence(unit);
  gateTrace.push({ order: 3, gate: "blob_public_url_liveness_evidence_gate", evaluated: true, ok: livenessGate.ok });
  if (!livenessGate.ok) {
    return {
      exitCode: 3,
      result: {
        ...base,
        status: "BLOCKED_BLOB_LIVENESS_EVIDENCE",
        gateTrace,
        blobPublicUrlLivenessEvidence: livenessGate,
        sideEffectCounters,
        credentialResolutionReached: false,
        credentialValuesAccessed: false,
        actualApiCallReached: false,
      },
    };
  }

  // ── gate 4: duplicate_publish_guard — credential resolution(gate 5)보다 반드시 먼저 ──
  const duplicateGate = evaluateDuplicatePublishGuardGate(unit);
  gateTrace.push({
    order: 4, gate: "duplicate_publish_guard", evaluated: true,
    blocked: duplicateGate.blocked,
    instagramKey: duplicateGate.instagram.key,
    youtubeKey: duplicateGate.youtube.key,
    instagramAlreadyPublished: duplicateGate.instagram.alreadyPublished === true,
    youtubeAlreadyPublished: duplicateGate.youtube.alreadyPublished === true,
  });
  if (duplicateGate.blocked) {
    gateTrace.push({ order: 5, gate: "credential_presence_resolution", evaluated: false, reached: false, blockedBy: "duplicate_publish_guard" });
    gateTrace.push({ order: 6, gate: "actual_api_call", evaluated: false, reached: false, blockedBy: "duplicate_publish_guard" });
    return {
      exitCode: 3,
      result: {
        ...base,
        status: DUPLICATE_BLOCKED_STATUS,
        gateTrace,
        duplicateBlock: {
          instagramKey: duplicateGate.instagram.key,
          youtubeKey: duplicateGate.youtube.key,
          instagramAlreadyPublished: duplicateGate.instagram.alreadyPublished === true,
          youtubeAlreadyPublished: duplicateGate.youtube.alreadyPublished === true,
          blockedBeforeCredentialResolution: true,
          blockedBeforeActualApiCall: true,
          retryForbidden: true,
        },
        existingEvidenceReference: {
          note: "이미 완료된 live evidence. reference로만 출력 — 재시도/재업로드 금지.",
          instagramMediaIdReference: LIVE_UPLOAD_EVIDENCE.instagram.mediaId,
          youtubeVideoIdReference: LIVE_UPLOAD_EVIDENCE.youtube.videoId,
          youtubeVideoUrlReference: LIVE_UPLOAD_EVIDENCE.youtube.videoUrl,
          retryForbidden: true,
        },
        wouldHaveCalledFunctionRefs: {
          note: "duplicate block이 없었다면 호출됐을 explicit credential injection 함수 참조(문자열). 이번 run 호출 0.",
          instagram: LIVE_PUBLISH_FUNCTION_REFS.instagram,
          youtube: LIVE_PUBLISH_FUNCTION_REFS.youtube,
        },
        blobPublicUrlLivenessEvidence: livenessGate,
        sideEffectCounters,
        credentialResolutionReached: false,
        credentialValuesAccessed: false,
        credentialValuesResolved: false,
        actualApiCallReached: false,
        dotEnvLocalDirectAccess: false,
      },
    };
  }

  // ── gate 5: credential_presence_resolution — 이 slice에서는 fail-closed stub ──
  // task: dual-platform-custom-content-live-credential-gate-no-execute-v1
  // default content는 gate 4 duplicate publish guard에서 이미 차단되어(exit 3) 여기 도달하지
  // 않는다. custom(non-default) content가 gate 1~4(metadata/source/blob/duplicate)를 모두
  // 통과하면 더 이상 무조건적인 custom-content halt(옛 gate 4.5)에서 멈추지 않고 이 credential
  // stub까지 도달한다. 단, 이 slice에서 credential resolution은 wiring되지 않았으므로 여기서
  // fail-closed로 멈춘다(exit 4). credential 값은 절대 읽지 않으며(process.env/secret 미접근),
  // 어떤 lib도 import/호출하지 않고, actual API call(gate 6)에도 도달하지 않는다.
  const isDefault = isDefaultContentUnit(unit);
  const credentialGate = credentialPresenceResolutionGate();
  gateTrace.push({ order: 5, gate: "credential_presence_resolution", evaluated: true, reached: true, wiredThisSlice: false, credentialValuesAccessed: false, credentialValuesResolved: false });
  gateTrace.push({ order: 6, gate: "actual_api_call", evaluated: false, reached: false, blockedBy: "credential_resolution_not_wired" });
  return {
    exitCode: 4,
    result: {
      ...base,
      status: credentialGate.haltError,
      gateTrace,
      contentUnit: {
        note:
          "gate 1~4를 통과한 content가 credential resolution stub까지 도달했다. 이 slice에서 credential " +
          "resolution/actual API call은 wiring되지 않았으므로 여기서 fail-closed로 멈춘다(실제 publish 비활성). " +
          "default evidence content는 gate 4 duplicate guard가 앞서 차단하므로 이 지점에 도달하지 않는다.",
        isDefaultContentUnit: isDefault,
        kind: isDefault ? "default_evidence_content" : "custom_manifest_content",
        contentId: unit.contentId,
        version: unit.version,
        reachedCredentialGate: true,
        credentialResolutionWiredThisSlice: false,
        haltedBeforeActualApiCall: true,
      },
      sideEffectCounters,
      credentialResolutionReached: true,
      credentialValuesAccessed: false,
      credentialValuesResolved: false,
      actualApiCallReached: false,
    },
  };
}

/** argv에서 --content-unit <path> 값을 뽑는다. 없으면 null(=default evidence content). */
function resolveContentUnitArg(argv) {
  const idx = argv.indexOf("--content-unit");
  if (idx !== -1 && typeof argv[idx + 1] === "string" && argv[idx + 1].trim() !== "") {
    return argv[idx + 1];
  }
  return null;
}

/**
 * content unit을 결정한다.
 * --content-unit이 없으면 default evidence content(하위 호환, 기존 동작 완전 유지).
 * 있으면 manifest를 로드한다. 로드 실패 시 { error } 반환(호출부가 exit 1 처리).
 */
function resolveActiveContentUnit(argv) {
  const manifestPath = resolveContentUnitArg(argv);
  if (manifestPath == null) {
    return { unit: DEFAULT_CONTENT_UNIT, isDefault: true, manifestPath: null };
  }
  const loaded = loadContentUnitFromManifest(manifestPath);
  if (!loaded.ok) {
    return { error: { manifestPath, reasons: loaded.reasons } };
  }
  return { unit: loaded.unit, isDefault: isDefaultContentUnit(loaded.unit), manifestPath };
}

function main() {
  const argv = process.argv.slice(2);
  const mode = resolveMode(argv);

  const resolved = resolveActiveContentUnit(argv);
  if (resolved.error) {
    console.error(
      JSON.stringify(
        {
          schemaVersion: "dual_platform_final_publish_orchestrator_v1",
          mode: "content_unit_manifest_error",
          error: "CONTENT_UNIT_MANIFEST_INVALID",
          manifestPath: resolved.error.manifestPath,
          reasons: resolved.error.reasons,
        },
        null,
        2,
      ),
    );
    process.exit(1);
    return;
  }
  const activeUnit = resolved.unit;

  // ── live/arm: armed. LIVE_GATE_ORDER 순서로 fail-closed 평가 ────────────────
  if (mode === "live_requested") {
    if (!LIVE_EXECUTION_ENABLED_THIS_SLICE) {
      // 방어적 이중 안전장치: arm 상수가 false로 회귀하면 여전히 exit 2 fail-closed.
      const output = {
        schemaVersion: "dual_platform_final_publish_orchestrator_v1",
        mode: "live_blocked",
        error: LIVE_EXECUTION_DISABLED_ERROR,
        liveExecutionEnabledThisSlice: false,
        requiredApprovalTokensToEnable: [
          "APPROVE_DUAL_PLATFORM_LIVE_ORCHESTRATOR_WIRING",
          "APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST",
          "APPROVE_YOUTUBE_LIVE_UPLOAD_WIRING",
          "APPROVE_DUAL_PLATFORM_ARM",
        ],
        note: "arm 상수가 비활성 상태다. live 실행은 arm 승인 상태에서만 gate 순서 평가로 진행된다.",
      };
      console.error(JSON.stringify(output, null, 2));
      process.exit(2);
      return;
    }
    // armed: default content(v3_2)는 gate 4 duplicate publish guard가 차단한다(exit 3, credential 미도달).
    // custom(non-default) content는 gate 1~4 통과 시 credential resolution stub(gate 5)까지 도달한 뒤
    // CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE로 fail-closed(exit 4). 어느 경로든 credential 값 미접근,
    // actual API call 미도달, 모든 side-effect counter 0. 실제 publish는 이 slice에서 비활성이다.
    const { result, exitCode } = executeArmedLiveRun(activeUnit);
    console.log(JSON.stringify(result, null, 2));
    process.exit(exitCode);
    return;
  }

  // ── credential-preflight: redacted env key presence check(no-live, 값 미노출) ──
  // 승인된 runtime env key 이름의 present boolean만 보고한다. credential 값/길이/prefix/hash를
  // 읽거나 출력하지 않고, .env.local/secret 파일을 읽지 않으며, API/upload/Blob 호출도 하지 않는다.
  // status-style diagnostic이므로 missing key가 있어도 exit 0(정보는 JSON boolean으로 표현).
  if (mode === "credential_preflight") {
    const output = buildCredentialPreflight(activeUnit, resolved.isDefault);
    console.log(JSON.stringify({ ...output, contentUnitManifestPath: resolved.manifestPath }, null, 2));
    return;
  }

  // ── preflight: no-live 준비 검증 ────────────────────────────────────────────
  if (mode === "preflight") {
    const plan = buildDualPlatformPublishPlan(activeUnit);
    const preflight = buildPreflight(activeUnit);
    const output = {
      schemaVersion: "dual_platform_final_publish_orchestrator_v1",
      mode: "preflight",
      liveExecutionEnabledThisSlice: LIVE_EXECUTION_ENABLED_THIS_SLICE,
      contentUnitManifestPath: resolved.manifestPath,
      isDefaultContentUnit: resolved.isDefault,
      preflight,
      plan,
      liveUploadEvidence: LIVE_UPLOAD_EVIDENCE,
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // ── dry-run: no-live publish plan. default content는 기존 동작 불변 ─────────
  const plan = buildDualPlatformPublishPlan(activeUnit);
  const output = {
    schemaVersion: "dual_platform_final_publish_orchestrator_v1",
    mode: "dry_run",
    contentUnitManifestPath: resolved.manifestPath,
    isDefaultContentUnit: resolved.isDefault,
    plan,
    liveUploadEvidence: LIVE_UPLOAD_EVIDENCE,
  };
  console.log(JSON.stringify(output, null, 2));
}

if (isMainModule) {
  main();
}
