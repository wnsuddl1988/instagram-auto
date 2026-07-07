#!/usr/bin/env node
/**
 * run-dual-platform-final-publish-orchestrator.mjs
 *
 * task: dual-platform-live-orchestrator-wiring-preflight-no-live-v1
 * (base: dual-platform-final-publish-orchestrator-no-live-v1)
 *
 * 하나의 콘텐츠 unit으로부터 Instagram job + YouTube job 2개의 publish plan을
 * 생성하는 runner다. 3가지 모드를 지원한다:
 *   --dry-run   : 기존 no-live 동작. publish plan + gate/guard 판정만 계산.
 *   --preflight : no-live 준비 검증. publish plan + 파일경로 + metadata gate +
 *                 duplicate guard + required env key NAME presence PLAN(값 미접근).
 *   --live/--arm: 실제 publish. 이 slice에서는 LIVE_EXECUTION_DISABLED_THIS_SLICE로 fail-closed.
 *
 * 이 슬라이스에서 절대 하지 않는 것:
 * - Instagram/YouTube API 호출 (fetch/googleapis/axios 등 네트워크 호출 없음)
 * - Vercel Blob put()/list()/del() 등 object mutation
 * - .env.local 또는 다른 secret 파일 직접 read
 * - process.env 값 read/출력 (preflight는 key '이름'만 계약으로 출력, 값은 미접근)
 * - 새 영상 생성/렌더/ffmpeg/TTS/image/browser
 * - deploy/dependency/commit/push
 *
 * 실행 예: node scripts/run-dual-platform-final-publish-orchestrator.mjs --preflight
 */
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// ── live execution gate (이 slice에서는 항상 비활성) ─────────────────────────
// 향후 live wiring 승인 slice에서만 true가 될 수 있다. 지금은 --live/--arm이
// 들어와도 이 상수 때문에 LIVE_EXECUTION_DISABLED_THIS_SLICE로 fail-closed된다.
export const LIVE_EXECUTION_ENABLED_THIS_SLICE = false;
export const LIVE_EXECUTION_DISABLED_ERROR = "LIVE_EXECUTION_DISABLED_THIS_SLICE";

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
  instagram: "lib/instagram.ts#uploadInstagramReel",
  youtube: "lib/youtube.ts#uploadYouTubeShorts",
  instagramBlob: "lib/instagram-blob-media.ts#uploadInstagramBlob",
};

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
  const guard = checkDuplicatePublishGuard(unit.contentId, "instagram_reels", unit.version, false);
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
    metadata: INSTAGRAM_DEFAULT_METADATA,
    duplicatePublishGuard: guard,
  };
}

function buildYoutubeJob(unit) {
  const guard = checkDuplicatePublishGuard(unit.contentId, "youtube_shorts", unit.version, false);
  return {
    id: "youtube_job",
    platform: "youtube_shorts",
    variantId: YOUTUBE_VARIANT_ID,
    sourcePath: unit.youtubeSourcePath,
    deliveryMode: "direct_media_file_upload",
    provider: "youtube_data_api",
    requiresPublicBlobUrl: false,
    liveApiCallPerformed: false,
    metadata: YOUTUBE_DEFAULT_METADATA,
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
function buildPreflight(unit) {
  const plan = buildDualPlatformPublishPlan(unit);
  const igJob = plan.jobs.find((j) => j.id === "instagram_job");
  const ytJob = plan.jobs.find((j) => j.id === "youtube_job");

  // 파일 경로 presence: 존재 여부(boolean)만 확인한다. 파일 내용은 읽지 않는다.
  const instagramSourceExists = typeof unit.instagramSourcePath === "string" && existsSync(unit.instagramSourcePath);
  const youtubeSourceExists = typeof unit.youtubeSourcePath === "string" && existsSync(unit.youtubeSourcePath);

  const metadataGateOk = igJob?.metadataOptimizationGate?.ok === true && ytJob?.metadataOptimizationGate?.ok === true;
  const duplicateGuardUsesV3_2 =
    typeof igJob?.duplicatePublishGuard?.key === "string" && igJob.duplicatePublishGuard.key.endsWith("/v3_2") &&
    typeof ytJob?.duplicatePublishGuard?.key === "string" && ytJob.duplicatePublishGuard.key.endsWith("/v3_2");

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

  const preflightOk =
    plan.jobs.length === 2 && metadataGateOk && duplicateGuardUsesV3_2 && sourceFilesReady;

  return {
    preflightOk,
    liveExecutionEnabledThisSlice: LIVE_EXECUTION_ENABLED_THIS_SLICE,
    publishJobCount: plan.jobs.length,
    metadataOptimizationGateOk: metadataGateOk,
    duplicateGuardUsesV3_2,
    sourceFilesReady,
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

const SELF = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(SELF);

/** CLI args에서 mode를 판정한다. --live/--arm은 fail-closed 대상이다. */
function resolveMode(argv) {
  if (argv.includes("--live") || argv.includes("--arm")) return "live_requested";
  if (argv.includes("--preflight")) return "preflight";
  return "dry_run";
}

function main() {
  const argv = process.argv.slice(2);
  const mode = resolveMode(argv);

  // ── live/arm: 이 slice에서는 코드 구조만 준비하고 실행은 fail-closed ──────────
  if (mode === "live_requested") {
    if (!LIVE_EXECUTION_ENABLED_THIS_SLICE) {
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
        note: "이 slice에서는 실제 Instagram/YouTube/Blob publish가 코드 경로상 실행되지 않는다. live 실행은 향후 승인 slice에서만 활성화된다.",
      };
      console.error(JSON.stringify(output, null, 2));
      process.exit(2);
      return;
    }
    // 도달 불가(LIVE_EXECUTION_ENABLED_THIS_SLICE=false). 방어적 fail-closed.
    console.error(JSON.stringify({ error: LIVE_EXECUTION_DISABLED_ERROR }, null, 2));
    process.exit(2);
    return;
  }

  // ── preflight: no-live 준비 검증 ────────────────────────────────────────────
  if (mode === "preflight") {
    const plan = buildDualPlatformPublishPlan(DEFAULT_CONTENT_UNIT);
    const preflight = buildPreflight(DEFAULT_CONTENT_UNIT);
    const output = {
      schemaVersion: "dual_platform_final_publish_orchestrator_v1",
      mode: "preflight",
      liveExecutionEnabledThisSlice: LIVE_EXECUTION_ENABLED_THIS_SLICE,
      preflight,
      plan,
      liveUploadEvidence: LIVE_UPLOAD_EVIDENCE,
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // ── dry-run: 기존 no-live 동작(불변) ────────────────────────────────────────
  const plan = buildDualPlatformPublishPlan(DEFAULT_CONTENT_UNIT);
  const output = {
    schemaVersion: "dual_platform_final_publish_orchestrator_v1",
    mode: "dry_run",
    plan,
    liveUploadEvidence: LIVE_UPLOAD_EVIDENCE,
  };
  console.log(JSON.stringify(output, null, 2));
}

if (isMainModule) {
  main();
}
