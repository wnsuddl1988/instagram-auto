#!/usr/bin/env node
/**
 * check-dual-platform-final-publish-orchestrator-static.mjs
 *
 * Dual-platform final publish orchestrator (no-live) 정적 가드.
 * task: dual-platform-final-publish-orchestrator-no-live-v1
 *
 * 이 가드 자체는 no-live다: 레포 내 fixture JSON + docs + runner 소스 텍스트,
 * 그리고 runner를 child_process로 1회 실행한 stdout(JSON)만 읽는다.
 * (network/env/secret 접근 없음, 실제 Instagram/YouTube API 호출 없음)
 *
 * 검증:
 *  1) fixture: noLiveThisSlice=true, expectedPublishJobs 2개(instagram/youtube)가
 *     올바른 provider/variant/deliveryMode를 가짐, sideEffectCounters 전부 0,
 *     liveUploadEvidence에 secret 필드 없음, duplicatePublishGuard 계약 존재,
 *     defaultContentUnit.version === v3_2, existingPublishedKeysExample이 v3_2와 정합,
 *     instagramDefaultMetadata(hashtag 8~12개 포함) + publishMetadataOptimizationGate 존재.
 *  2) runner 소스: Instagram/YouTube API 호출 코드(fetch/axios/googleapis/graph API URL) 없음,
 *     .env.local 직접 참조 없음, Blob put()/list()/del() 호출 없음, v3_2 version 상수 존재,
 *     Instagram metadata/metadata gate 로직 존재.
 *  3) runner 실행 결과(JSON): jobs 2개, instagram_job.provider=vercel_blob,
 *     youtube_job.provider=youtube_data_api, variant/deliveryMode 교차 오염 없음,
 *     metadata.titleBase/tags 비어있지 않음, instagram metadata(hashtag 8~12개)/CTA 존재,
 *     양쪽 metadataOptimizationGate.ok === true, sideEffectCounters 전부 0,
 *     duplicatePublishGuard.key가 v3_2를 사용.
 *  4) docs: no-live/dry-run/중복 게시 방지/향후 게이트/metadata optimization 명시.
 *  5) mutant → 전부 fail(version v1 회귀, Instagram metadata 누락/hashtag 개수 위반 포함).
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");

const FIXTURE_PATH = path.join(ROOT, "scripts", "fixtures", "dual_platform_final_publish_orchestrator.v1.json");
const DOCS_PATH = path.join(ROOT, "docs", "dual-platform-final-publish-orchestrator.md");
const RUNNER_PATH = path.join(ROOT, "scripts", "run-dual-platform-final-publish-orchestrator.mjs");

let passes = 0;
let failures = 0;
function check(name, ok, detail) {
  if (ok) { passes += 1; console.log(`PASS  ${name}`); }
  else { failures += 1; console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
}
const clone = (o) => JSON.parse(JSON.stringify(o));

/** 주석/문자열 리터럴을 제거해 "실제 코드"만 남긴다(false positive 방지). */
function stripCommentsAndStrings(src) {
  if (!src) return "";
  const codeLines = [];
  let inBlock = false;
  for (const raw of src.split("\n")) {
    let line = raw;
    const trimmed = line.trim();
    if (inBlock) {
      const end = line.indexOf("*/");
      if (end === -1) continue;
      line = line.slice(end + 2);
      inBlock = false;
    }
    if (trimmed.startsWith("*") || trimmed.startsWith("//")) continue;
    const blockStart = line.indexOf("/*");
    if (blockStart !== -1) {
      const blockEnd = line.indexOf("*/", blockStart + 2);
      if (blockEnd === -1) {
        line = line.slice(0, blockStart);
        inBlock = true;
      } else {
        line = line.slice(0, blockStart) + line.slice(blockEnd + 2);
      }
    }
    const lineCommentIdx = line.indexOf("//");
    if (lineCommentIdx !== -1) line = line.slice(0, lineCommentIdx);
    line = line.replace(/"(?:[^"\\]|\\.)*"/g, '""');
    line = line.replace(/'(?:[^'\\]|\\.)*'/g, "''");
    line = line.replace(/`(?:[^`\\]|\\.)*`/g, "``");
    codeLines.push(line);
  }
  return codeLines.join("\n");
}

// ── 1) fixture ──────────────────────────────────────────────────────────────

check("fixture 파일 존재", existsSync(FIXTURE_PATH));
const fixtureRaw = existsSync(FIXTURE_PATH) ? readFileSync(FIXTURE_PATH, "utf8") : "{}";
let fixture;
try {
  fixture = JSON.parse(fixtureRaw);
  check("fixture JSON parse", true);
} catch (e) {
  fixture = {};
  check("fixture JSON parse", false, String(e));
}

check("fixture.noLiveThisSlice === true", fixture.noLiveThisSlice === true);
check("fixture.status === NO_LIVE_DRY_RUN_ORCHESTRATOR", fixture.status === "NO_LIVE_DRY_RUN_ORCHESTRATOR");

const jobs = Array.isArray(fixture.expectedPublishJobs) ? fixture.expectedPublishJobs : [];
check("expectedPublishJobs 2개", jobs.length === 2, `count=${jobs.length}`);

const igJob = jobs.find((j) => j && j.id === "instagram_job");
const ytJob = jobs.find((j) => j && j.id === "youtube_job");

check("instagram_job 존재", !!igJob);
check("instagram_job.variantId === instagram_reels_full_frame_1080x1920", igJob?.variantId === "instagram_reels_full_frame_1080x1920");
check("instagram_job.provider === vercel_blob", igJob?.provider === "vercel_blob");
check("instagram_job.requiresPublicBlobUrl === true", igJob?.requiresPublicBlobUrl === true);
check("instagram_job.liveApiCallAllowedThisSlice === false", igJob?.liveApiCallAllowedThisSlice === false);

check("youtube_job 존재", !!ytJob);
check("youtube_job.variantId === youtube_shorts_letterbox_1080x1920", ytJob?.variantId === "youtube_shorts_letterbox_1080x1920");
check("youtube_job.provider === youtube_data_api", ytJob?.provider === "youtube_data_api");
check("youtube_job.requiresPublicBlobUrl === false", ytJob?.requiresPublicBlobUrl === false);
check("youtube_job.liveApiCallAllowedThisSlice === false", ytJob?.liveApiCallAllowedThisSlice === false);

const counters = fixture.sideEffectCounters || {};
const zeroFields = [
  "instagramApiCallCount", "youtubeApiCallCount", "blobUploadCount", "blobListOrDeleteCount",
  "envSecretReadCount", "envSecretWriteCount", "dotEnvLocalDirectAccessCount",
  "newVideoGeneratedCount", "deployCount", "dependencyChangeCount", "commitCount", "pushCount",
  "ledgerMutationCount",
];
for (const f of zeroFields) {
  check(`fixture.sideEffectCounters.${f} === 0`, counters[f] === 0, `value=${JSON.stringify(counters[f])}`);
}

const yt = fixture.youtubeDefaultMetadata || {};
check("youtubeDefaultMetadata.titleBase 비어있지 않음", typeof yt.titleBase === "string" && yt.titleBase.trim().length > 0);
check("youtubeDefaultMetadata.tags 배열 비어있지 않음", Array.isArray(yt.tags) && yt.tags.length > 0);
const disallowedTagPattern = /(챌린지|viral|trend|밈)/i;
check(
  "youtubeDefaultMetadata.tags에 무관 유행 태그 없음",
  Array.isArray(yt.tags) && !yt.tags.some((t) => disallowedTagPattern.test(String(t)))
);

const dupGuard = fixture.duplicatePublishGuard || {};
check("duplicatePublishGuard.keyShape 존재", typeof dupGuard.keyShape === "string" && dupGuard.keyShape.length > 0);
check("duplicatePublishGuard.rule 존재", typeof dupGuard.rule === "string" && dupGuard.rule.length > 0);
check("duplicatePublishGuard.enforcedInLiveModeOnly === true", dupGuard.enforcedInLiveModeOnly === true);
check("duplicatePublishGuard.dryRunLedgerWrites === 0", dupGuard.dryRunLedgerWrites === 0);

const existingKeys = Array.isArray(dupGuard.existingPublishedKeysExample) ? dupGuard.existingPublishedKeysExample : [];
check(
  "duplicatePublishGuard.existingPublishedKeysExample이 v3_2 사용(v1 회귀 아님)",
  existingKeys.length === 2 && existingKeys.every((k) => typeof k === "string" && k.endsWith("/v3_2")),
  `keys=${JSON.stringify(existingKeys)}`
);

// version/key 정합화 (Codex review finding 1)
const contentUnit = fixture.defaultContentUnit || {};
check("defaultContentUnit.version === v3_2 (v1 회귀 아님)", contentUnit.version === "v3_2", `value=${JSON.stringify(contentUnit.version)}`);

// Instagram metadata optimization (Codex review finding 2)
const ig = fixture.instagramDefaultMetadata || {};
check("instagramDefaultMetadata.captionFirstLineHook 비어있지 않음", typeof ig.captionFirstLineHook === "string" && ig.captionFirstLineHook.trim().length > 0);
check("instagramDefaultMetadata.caption 비어있지 않음", typeof ig.caption === "string" && ig.caption.trim().length > 0);
check("instagramDefaultMetadata.callToAction 비어있지 않음", typeof ig.callToAction === "string" && ig.callToAction.trim().length > 0);
const igHashtags = Array.isArray(ig.hashtags) ? ig.hashtags : [];
check("instagramDefaultMetadata.hashtags 8~12개", igHashtags.length >= 8 && igHashtags.length <= 12, `count=${igHashtags.length}`);
const disallowedTagPatternIg = /(챌린지|viral|trend|밈)/i;
check(
  "instagramDefaultMetadata.hashtags에 무관 유행 태그 없음",
  !igHashtags.some((t) => disallowedTagPatternIg.test(String(t)))
);
check("instagramDefaultMetadata.forbiddenUnrelatedTrendTags === true", ig.forbiddenUnrelatedTrendTags === true);

const metaGate = fixture.publishMetadataOptimizationGate || {};
check("publishMetadataOptimizationGate.rule 존재", typeof metaGate.rule === "string" && metaGate.rule.length > 0);
check(
  "publishMetadataOptimizationGate.instagramRequiredFields 4개 필드 포함",
  Array.isArray(metaGate.instagramRequiredFields) &&
    ["captionFirstLineHook", "caption", "hashtags", "callToAction"].every((f) => metaGate.instagramRequiredFields.includes(f))
);
check("publishMetadataOptimizationGate.instagramHashtagCountMin === 8", metaGate.instagramHashtagCountMin === 8);
check("publishMetadataOptimizationGate.instagramHashtagCountMax === 12", metaGate.instagramHashtagCountMax === 12);
check("publishMetadataOptimizationGate.forbiddenUnrelatedTrendTags === true", metaGate.forbiddenUnrelatedTrendTags === true);

const liveEvidence = fixture.liveUploadEvidence || {};
const evidenceStr = JSON.stringify(liveEvidence);
const secretFieldPattern = /(clientSecret|refreshToken|accessToken|apiKey|api_key|client_secret|refresh_token|access_token)/i;

/**
 * secret 값 검사 오탐 제거용 마스킹.
 * - env key '이름'(대문자 SNAKE_CASE, 예: YOUTUBE_REFRESH_TOKEN)은 secret 값이 아니라 계약상 필요한 key 이름이다.
 * - 계약 값 문자열 "derived_in_memory_from_refresh_token"은 credential 발급 방식 설명이지 secret 값이 아니다.
 * 이 둘을 제거한 뒤 secretFieldPattern을 적용하면 실제 camelCase secret 값 필드(accessToken:'...')만 남아 잡힌다.
 */
function maskEnvKeyNamesAndContractValues(s) {
  return String(s)
    .replace(/\b[A-Z][A-Z0-9]*_[A-Z0-9_]*\b/g, "")
    .replace(/derived_in_memory_from_refresh_token/g, "");
}

check("liveUploadEvidence에 secret 필드명 없음", !secretFieldPattern.test(evidenceStr));
check("liveUploadEvidence.instagram.mediaId === 17916511431199303", liveEvidence?.instagram?.mediaId === "17916511431199303");
check("liveUploadEvidence.youtube.videoId === r9jhckdpC9w", liveEvidence?.youtube?.videoId === "r9jhckdpC9w");
check("liveUploadEvidence.instagram.retryForbidden === true", liveEvidence?.instagram?.retryForbidden === true);
check("liveUploadEvidence.youtube.retryForbidden === true", liveEvidence?.youtube?.retryForbidden === true);

// ── 2) runner 소스 정적 검사 ──────────────────────────────────────────────────

check("runner 파일 존재", existsSync(RUNNER_PATH));
const runnerRawSrc = existsSync(RUNNER_PATH) ? readFileSync(RUNNER_PATH, "utf8") : "";
const runnerCode = stripCommentsAndStrings(runnerRawSrc);

const liveApiPatterns = [
  /fetch\s*\(/,
  /axios\s*\./,
  /googleapis/,
  /graph\.facebook\.com/,
  /graph\.instagram\.com/,
  /youtube\s*\.\s*videos\s*\.\s*insert/,
  /\bhttps?\s*\.\s*request\b/,
];
for (const pat of liveApiPatterns) {
  check(`runner 소스에 live API 호출 패턴 없음 (${pat})`, !pat.test(runnerCode));
}

check("runner 소스에 .env.local 직접 참조 없음", !/\.env\.local/.test(runnerCode));
check("runner 소스에 process.env 직접 참조 없음(secret 미접근)", !/process\s*\.\s*env/.test(runnerCode));

const blobMutationPatterns = [/\bput\s*\(/, /@vercel\/blob/, /\bdel\s*\(/, /\.list\s*\(/];
for (const pat of blobMutationPatterns) {
  check(`runner 소스에 Blob mutation 호출 없음 (${pat})`, !pat.test(runnerCode));
}

check(
  "runner 소스에 instagram_reels_full_frame_1080x1920 상수 존재",
  runnerRawSrc.includes("instagram_reels_full_frame_1080x1920")
);
check(
  "runner 소스에 youtube_shorts_letterbox_1080x1920 상수 존재",
  runnerRawSrc.includes("youtube_shorts_letterbox_1080x1920")
);
check("runner 소스에 duplicatePublishGuard 로직 존재", /duplicatePublishGuard|checkDuplicatePublishGuard/.test(runnerRawSrc));
check("runner 소스에 v3_2 version 상수 존재(v1 회귀 아님)", runnerRawSrc.includes('"v3_2"'));
check("runner 소스에 INSTAGRAM_DEFAULT_METADATA 존재", /INSTAGRAM_DEFAULT_METADATA/.test(runnerRawSrc));
check("runner 소스에 hashtags 필드 존재", /hashtags/.test(runnerRawSrc));
check("runner 소스에 callToAction 필드 존재", /callToAction/.test(runnerRawSrc));
check("runner 소스에 metadataOptimizationGate 로직 존재", /metadataOptimizationGate|checkInstagramMetadataGate|checkYoutubeMetadataGate/.test(runnerRawSrc));

// ── 3) runner 실제 실행 (child_process, --dry-run) ───────────────────────────

let execOutput = "";
let execOk = false;
try {
  execOutput = execFileSync(process.execPath, [RUNNER_PATH, "--dry-run"], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 15000,
  });
  execOk = true;
} catch (e) {
  execOutput = String(e?.stdout || e?.message || e);
}
check("runner --dry-run 실행 성공(exit 0)", execOk);

let runResult = null;
try {
  runResult = JSON.parse(execOutput);
  check("runner stdout JSON parse", true);
} catch (e) {
  check("runner stdout JSON parse", false, String(e));
}

const runJobs = Array.isArray(runResult?.plan?.jobs) ? runResult.plan.jobs : [];
check("runner 결과 jobs 2개", runJobs.length === 2, `count=${runJobs.length}`);

const runIg = runJobs.find((j) => j?.id === "instagram_job");
const runYt = runJobs.find((j) => j?.id === "youtube_job");

check("runner 결과 instagram_job.provider === vercel_blob", runIg?.provider === "vercel_blob");
check("runner 결과 instagram_job.variantId === instagram_reels_full_frame_1080x1920", runIg?.variantId === "instagram_reels_full_frame_1080x1920");
check("runner 결과 instagram_job.liveApiCallPerformed === false", runIg?.liveApiCallPerformed === false);
check("runner 결과 instagram_job.blobUploadPerformed === false", runIg?.blobUploadPerformed === false);

check(
  "runner 결과 instagram_job.metadata.captionFirstLineHook 비어있지 않음",
  typeof runIg?.metadata?.captionFirstLineHook === "string" && runIg.metadata.captionFirstLineHook.trim().length > 0
);
check(
  "runner 결과 instagram_job.metadata.callToAction 비어있지 않음",
  typeof runIg?.metadata?.callToAction === "string" && runIg.metadata.callToAction.trim().length > 0
);
const runIgHashtags = Array.isArray(runIg?.metadata?.hashtags) ? runIg.metadata.hashtags : [];
check("runner 결과 instagram_job.metadata.hashtags 8~12개", runIgHashtags.length >= 8 && runIgHashtags.length <= 12, `count=${runIgHashtags.length}`);
check("runner 결과 instagram_job.metadataOptimizationGate.ok === true", runIg?.metadataOptimizationGate?.ok === true, JSON.stringify(runIg?.metadataOptimizationGate));
check(
  "runner 결과 instagram_job.duplicatePublishGuard.key가 v3_2 사용",
  typeof runIg?.duplicatePublishGuard?.key === "string" && runIg.duplicatePublishGuard.key.endsWith("/v3_2")
);

check("runner 결과 youtube_job.provider === youtube_data_api", runYt?.provider === "youtube_data_api");
check("runner 결과 youtube_job.variantId === youtube_shorts_letterbox_1080x1920", runYt?.variantId === "youtube_shorts_letterbox_1080x1920");
check("runner 결과 youtube_job.requiresPublicBlobUrl === false", runYt?.requiresPublicBlobUrl === false);
check("runner 결과 youtube_job.liveApiCallPerformed === false", runYt?.liveApiCallPerformed === false);

check(
  "runner 결과 youtube_job.metadata.titleBase 비어있지 않음",
  typeof runYt?.metadata?.titleBase === "string" && runYt.metadata.titleBase.trim().length > 0
);
check(
  "runner 결과 youtube_job.metadata.tags 비어있지 않음",
  Array.isArray(runYt?.metadata?.tags) && runYt.metadata.tags.length > 0
);
check("runner 결과 youtube_job.metadataOptimizationGate.ok === true", runYt?.metadataOptimizationGate?.ok === true, JSON.stringify(runYt?.metadataOptimizationGate));
check(
  "runner 결과 youtube_job.duplicatePublishGuard.key가 v3_2 사용",
  typeof runYt?.duplicatePublishGuard?.key === "string" && runYt.duplicatePublishGuard.key.endsWith("/v3_2")
);
check("runner 결과 plan.version === v3_2 (v1 회귀 아님)", runResult?.plan?.version === "v3_2", `value=${JSON.stringify(runResult?.plan?.version)}`);

const runCounters = runResult?.plan?.sideEffectCounters || {};
for (const f of zeroFields) {
  check(`runner 결과 sideEffectCounters.${f} === 0`, runCounters[f] === 0, `value=${JSON.stringify(runCounters[f])}`);
}

check("runner 결과 liveMode === false", runResult?.plan?.liveMode === false);
check("runner 결과 mode === dry_run", runResult?.mode === "dry_run");

// variant/provider 교차 오염 방지
check("runner 결과: instagram job이 youtube variant를 쓰지 않음", runIg?.variantId !== YOUTUBE_VARIANT_ID_CONST());
check("runner 결과: youtube job이 instagram variant를 쓰지 않음", runYt?.variantId !== INSTAGRAM_VARIANT_ID_CONST());

function INSTAGRAM_VARIANT_ID_CONST() { return "instagram_reels_full_frame_1080x1920"; }
function YOUTUBE_VARIANT_ID_CONST() { return "youtube_shorts_letterbox_1080x1920"; }

// ── 4) docs ───────────────────────────────────────────────────────────────

check("docs 파일 존재", existsSync(DOCS_PATH));
const docsRaw = existsSync(DOCS_PATH) ? readFileSync(DOCS_PATH, "utf8") : "";
check("docs에 no-live/dry-run 명시", /no-?live/i.test(docsRaw) && /dry-?run/i.test(docsRaw));
check("docs에 중복 게시 방지 언급", /중복\s*게시|duplicate\s*publish/i.test(docsRaw));
check("docs에 향후 게이트 언급", /향후|future.*approval|다음\s*게이트/i.test(docsRaw));
check("docs에 Instagram media_id 기록", docsRaw.includes("17916511431199303"));
check("docs에 YouTube videoId 기록", docsRaw.includes("r9jhckdpC9w"));
// env key '이름'(대문자 SNAKE_CASE, 예: YOUTUBE_REFRESH_TOKEN)과 credential 발급 방식 문자열
// (derived_in_memory_from_refresh_token)은 secret 값이 아니라 계약이므로 제거 후 검사한다.
// 그래도 camelCase secret 값 필드(accessToken:'...' 등)는 여전히 잡힌다.
const docsWithoutEnvKeyNames = maskEnvKeyNamesAndContractValues(docsRaw);
check("docs에 secret 필드명/값 없음(env key 이름/계약 문자열 제외)", !secretFieldPattern.test(docsWithoutEnvKeyNames));
check("docs에 실제 secret 값 형태(EAA/ya29/blob token) 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(docsRaw));
check("docs에 v3_2 version 정합 설명 존재", docsRaw.includes("v3_2"));
check("docs에 metadata optimization/영상만 업로드 금지 규칙 언급", /metadata.*optimization|영상만\s*업로드\s*금지/i.test(docsRaw));

// ── 5) mutant 검증 ────────────────────────────────────────────────────────

function mutantCheck(name, mutatedFixture, expectFail) {
  const before = failures;
  const f = mutatedFixture;
  const jobs2 = Array.isArray(f.expectedPublishJobs) ? f.expectedPublishJobs : [];
  const ig = jobs2.find((j) => j?.id === "instagram_job");
  const yt2 = jobs2.find((j) => j?.id === "youtube_job");
  const c = f.sideEffectCounters || {};
  const igMeta = f.instagramDefaultMetadata || {};
  const igMetaHashtags = Array.isArray(igMeta.hashtags) ? igMeta.hashtags : [];
  const cu = f.defaultContentUnit || {};
  const dg = f.duplicatePublishGuard || {};
  const keysOk = Array.isArray(dg.existingPublishedKeysExample) && dg.existingPublishedKeysExample.every((k) => typeof k === "string" && k.endsWith("/v3_2"));
  const okAll =
    f.noLiveThisSlice === true &&
    jobs2.length === 2 &&
    ig?.variantId === "instagram_reels_full_frame_1080x1920" &&
    ig?.provider === "vercel_blob" &&
    yt2?.variantId === "youtube_shorts_letterbox_1080x1920" &&
    yt2?.provider === "youtube_data_api" &&
    yt2?.requiresPublicBlobUrl === false &&
    zeroFields.every((k) => c[k] === 0) &&
    cu.version === "v3_2" &&
    keysOk &&
    typeof igMeta.captionFirstLineHook === "string" && igMeta.captionFirstLineHook.trim().length > 0 &&
    typeof igMeta.callToAction === "string" && igMeta.callToAction.trim().length > 0 &&
    igMetaHashtags.length >= 8 && igMetaHashtags.length <= 12;
  const mutantOk = expectFail ? !okAll : okAll;
  check(`mutant: ${name}`, mutantOk);
  if (!mutantOk) failures = before + 1;
}

mutantCheck("youtube job이 vercel_blob provider로 오염", (() => {
  const m = clone(fixture);
  const yt2 = m.expectedPublishJobs.find((j) => j.id === "youtube_job");
  yt2.provider = "vercel_blob";
  yt2.requiresPublicBlobUrl = true;
  return m;
})(), true);

mutantCheck("instagram job이 youtube variant를 사용", (() => {
  const m = clone(fixture);
  const ig = m.expectedPublishJobs.find((j) => j.id === "instagram_job");
  ig.variantId = "youtube_shorts_letterbox_1080x1920";
  return m;
})(), true);

mutantCheck("sideEffectCounters 중 하나가 1로 오염", (() => {
  const m = clone(fixture);
  m.sideEffectCounters.blobUploadCount = 1;
  return m;
})(), true);

mutantCheck("noLiveThisSlice가 false로 오염", (() => {
  const m = clone(fixture);
  m.noLiveThisSlice = false;
  return m;
})(), true);

mutantCheck("defaultContentUnit.version이 v1로 회귀", (() => {
  const m = clone(fixture);
  m.defaultContentUnit.version = "v1";
  return m;
})(), true);

mutantCheck("existingPublishedKeysExample이 v1과 불일치(v3_2 아님)", (() => {
  const m = clone(fixture);
  m.duplicatePublishGuard.existingPublishedKeysExample = [
    "t1_lifestyle_inflation/instagram_reels/v1",
    "t1_lifestyle_inflation/youtube_shorts/v1",
  ];
  return m;
})(), true);

mutantCheck("Instagram metadata(callToAction) 누락", (() => {
  const m = clone(fixture);
  delete m.instagramDefaultMetadata.callToAction;
  return m;
})(), true);

mutantCheck("Instagram hashtag가 7개로 최소 미만", (() => {
  const m = clone(fixture);
  m.instagramDefaultMetadata.hashtags = m.instagramDefaultMetadata.hashtags.slice(0, 7);
  return m;
})(), true);

mutantCheck("Instagram hashtag가 13개로 최대 초과", (() => {
  const m = clone(fixture);
  m.instagramDefaultMetadata.hashtags = [...m.instagramDefaultMetadata.hashtags, "추가태그1", "추가태그2", "추가태그3"];
  return m;
})(), true);

mutantCheck("정상 fixture는 통과", fixture, false);

// ── 6) live wiring / preflight 계약 (dual-platform-live-orchestrator-wiring-preflight-no-live-v1) ──

// 6a) fixture: modes + liveExecutionWiring 계약
const modes = fixture.modes || {};
check("fixture.modes.dryRun.liveExecution === false", modes.dryRun?.liveExecution === false);
check("fixture.modes.preflight.liveExecution === false", modes.preflight?.liveExecution === false);
check("fixture.modes.preflight.checksEnvValuePresence === false (env 값 미접근)", modes.preflight?.checksEnvValuePresence === false);
check("fixture.modes.live.liveExecutionEnabledThisSlice === false", modes.live?.liveExecutionEnabledThisSlice === false);
check("fixture.modes.live.failClosedError === LIVE_EXECUTION_DISABLED_THIS_SLICE", modes.live?.failClosedError === "LIVE_EXECUTION_DISABLED_THIS_SLICE");

const wiring = fixture.liveExecutionWiring || {};
check("liveExecutionWiring.liveExecutionEnabledThisSlice === false", wiring.liveExecutionEnabledThisSlice === false);
check("liveExecutionWiring.failClosedError === LIVE_EXECUTION_DISABLED_THIS_SLICE", wiring.failClosedError === "LIVE_EXECUTION_DISABLED_THIS_SLICE");
check(
  "liveExecutionWiring.requiredApprovalTokensToEnable 4개 승인 토큰 포함",
  Array.isArray(wiring.requiredApprovalTokensToEnable) &&
    ["APPROVE_DUAL_PLATFORM_LIVE_ORCHESTRATOR_WIRING", "APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST", "APPROVE_YOUTUBE_LIVE_UPLOAD_WIRING", "APPROVE_DUAL_PLATFORM_ARM"].every((t) => wiring.requiredApprovalTokensToEnable.includes(t))
);
check(
  "liveExecutionWiring.requiredFlagsToAttemptLive에 --live/--arm 포함",
  Array.isArray(wiring.requiredFlagsToAttemptLive) && wiring.requiredFlagsToAttemptLive.includes("--live") && wiring.requiredFlagsToAttemptLive.includes("--arm")
);
check("liveExecutionWiring.metadataOptimizationGateIsMandatoryForLiveAndPreflight === true", wiring.metadataOptimizationGateIsMandatoryForLiveAndPreflight === true);
check("liveExecutionWiring.duplicateGuardIsMandatoryForLiveAndPreflight === true", wiring.duplicateGuardIsMandatoryForLiveAndPreflight === true);

// required env key NAMES: 이름만 있고 실제 값이 없어야 한다.
const envNames = wiring.requiredEnvKeyNames || {};
check(
  "requiredEnvKeyNames.instagram에 IG 계정/토큰 KEY 이름 존재",
  Array.isArray(envNames.instagram) && envNames.instagram.includes("INSTAGRAM_BUSINESS_ACCOUNT_ID") && envNames.instagram.includes("INSTAGRAM_ACCESS_TOKEN")
);
check(
  "requiredEnvKeyNames.youtube에 YT client/refresh-token KEY 이름 존재",
  Array.isArray(envNames.youtube) && envNames.youtube.includes("YOUTUBE_CLIENT_ID") && envNames.youtube.includes("YOUTUBE_CLIENT_SECRET") && envNames.youtube.includes("YOUTUBE_REFRESH_TOKEN")
);
check(
  "requiredEnvKeyNames.youtube에 YOUTUBE_ACCESS_TOKEN 없음(short-lived, 장기 env로 요구하지 않음)",
  Array.isArray(envNames.youtube) && !envNames.youtube.includes("YOUTUBE_ACCESS_TOKEN")
);
check(
  "requiredEnvKeyNames.vercelBlob에 BLOB_READ_WRITE_TOKEN KEY 이름 존재",
  Array.isArray(envNames.vercelBlob) && envNames.vercelBlob.includes("BLOB_READ_WRITE_TOKEN")
);
// 실제 secret 값 노출 회귀: env key 이름 목록에 '=' 값 할당이나 실제 토큰 형태가 없어야 한다.
const wiringStr = JSON.stringify(wiring);
check("liveExecutionWiring에 secret 값 형태(EAA/ya29/토큰 prefix) 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(wiringStr));
// requiredEnvKeyNames는 env key '이름'(SNAKE_CASE)만 담으므로 secretFieldPattern 검사에서 제외한다.
// (예: "YOUTUBE_REFRESH_TOKEN"은 secret 값이 아니라 env key 이름이다.)
const wiringWithoutEnvNames = clone(wiring);
delete wiringWithoutEnvNames.requiredEnvKeyNames;
// wiring.liveExecutionPlan.steps[].requiredEnvKeyNames와 credential 발급 방식 문자열도
// env key 이름/계약 값이므로 마스킹 후 검사한다. 실제 camelCase secret 값 필드는 여전히 잡힌다.
check("liveExecutionWiring(env key 이름 제외)에 secret 값 필드명(camelCase accessToken 등) 없음", !secretFieldPattern.test(maskEnvKeyNamesAndContractValues(JSON.stringify(wiringWithoutEnvNames))));
// env key 이름은 반드시 대문자 SNAKE_CASE만 허용(camelCase 실제 secret 필드명 혼입 방지).
const allEnvNames = [...(envNames.instagram || []), ...(envNames.youtube || []), ...(envNames.vercelBlob || [])];
check("requiredEnvKeyNames는 전부 대문자 SNAKE_CASE env key 이름", allEnvNames.length > 0 && allEnvNames.every((n) => /^[A-Z][A-Z0-9_]*$/.test(String(n))));

const dupLedger = wiring.duplicateLedgerConditionToBlockLive || {};
check("duplicateLedgerConditionToBlockLive.version === v3_2", dupLedger.version === "v3_2");
check(
  "duplicateLedgerConditionToBlockLive.existingPublishedKeysReference가 v3_2 사용",
  Array.isArray(dupLedger.existingPublishedKeysReference) && dupLedger.existingPublishedKeysReference.length === 2 && dupLedger.existingPublishedKeysReference.every((k) => typeof k === "string" && k.endsWith("/v3_2"))
);

// fixture: liveExecutionPlan(no-execute) 계약. runner preflight 출력과 정합해야 한다.
const fixLep = wiring.liveExecutionPlan || {};
check("fixture.liveExecutionWiring.liveExecutionPlan 존재", fixLep && typeof fixLep === "object");
check("fixture liveExecutionPlan.anyStepEnabled/anyStepWillExecute/anySideEffectPerformed 전부 false", fixLep.anyStepEnabled === false && fixLep.anyStepWillExecute === false && fixLep.anySideEffectPerformed === false);
check("fixture liveExecutionPlan.metadataGateIsMandatoryDependency === true", fixLep.metadataGateIsMandatoryDependency === true);
check("fixture liveExecutionPlan.duplicateGuardIsMandatoryDependency === true", fixLep.duplicateGuardIsMandatoryDependency === true);
check(
  "fixture liveExecutionPlan.orderedFlow가 Blob→IG publish→YT upload→ledger 순서",
  Array.isArray(fixLep.orderedFlow) && fixLep.orderedFlow.length === 4 &&
    fixLep.orderedFlow[0] === "instagram_blob_upload" && fixLep.orderedFlow[1] === "instagram_publish_reel" &&
    fixLep.orderedFlow[2] === "youtube_direct_upload" && fixLep.orderedFlow[3] === "publish_ledger_record"
);
const fixLepSteps = Array.isArray(fixLep.steps) ? fixLep.steps : [];
check("fixture liveExecutionPlan.steps 4개 전부 disabled(no-execute)", fixLepSteps.length === 4 && fixLepSteps.every((s) => s.enabled === false && s.willExecute === false && s.sideEffectPerformed === false));
check(
  "fixture liveExecutionPlan step별 requiredApprovalTokens 존재",
  fixLepSteps.length === 4 && fixLepSteps.every((s) => Array.isArray(s.requiredApprovalTokens) && s.requiredApprovalTokens.length >= 1)
);
const fixYtStep = fixLepSteps.find((s) => s.id === "youtube_direct_upload");
check("fixture liveExecutionPlan youtube step requiredEnvKeyNames에 YOUTUBE_ACCESS_TOKEN 없음", Array.isArray(fixYtStep?.requiredEnvKeyNames) && !fixYtStep.requiredEnvKeyNames.includes("YOUTUBE_ACCESS_TOKEN"));
check("fixture liveExecutionPlan에 secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(JSON.stringify(fixLep)));

// 6b) runner 소스: live gate 상수 + fail-closed + env 미접근 회귀
check("runner에 LIVE_EXECUTION_ENABLED_THIS_SLICE = false 존재", /LIVE_EXECUTION_ENABLED_THIS_SLICE\s*=\s*false/.test(runnerRawSrc));
check("runner에 LIVE_EXECUTION_DISABLED_THIS_SLICE 에러 상수 존재", runnerRawSrc.includes("LIVE_EXECUTION_DISABLED_THIS_SLICE"));
check("runner에 --live/--arm fail-closed 처리 존재", /--live/.test(runnerRawSrc) && /--arm/.test(runnerRawSrc) && /live_blocked|LIVE_EXECUTION_DISABLED/.test(runnerRawSrc));
check("runner에 --preflight 모드 처리 존재", /--preflight/.test(runnerRawSrc) && /preflight/.test(runnerRawSrc));
check("runner에 REQUIRED_ENV_KEY_NAMES (key 이름 계약) 존재", /REQUIRED_ENV_KEY_NAMES/.test(runnerRawSrc));
// 가장 중요한 회귀: runner가 process.env 값을 읽지 않는다(코드 기준, 주석/문자열 제외).
check("runner 코드에 process.env 참조 없음 (preflight가 env 값에 접근하지 않음)", !/process\s*\.\s*env/.test(runnerCode));
// live publish 함수를 이 runner가 실제로 import하지 않는다(참조는 문자열 상수로만).
check("runner가 lib live publish 함수를 실제 import하지 않음", !/import\s+[^\n]*uploadInstagramReel/.test(runnerCode) && !/import\s+[^\n]*uploadYouTubeShorts/.test(runnerCode) && !/import\s+[^\n]*uploadInstagramBlob/.test(runnerCode));
// no-execute live execution plan 빌더 존재 + lib import 없음.
check("runner에 buildLiveExecutionPlan(no-execute plan 빌더) 존재", /buildLiveExecutionPlan/.test(runnerRawSrc));
check("runner가 lib 파일에서 실제 import를 전혀 하지 않음(문자열 참조만)", !/import\s+[^\n]*from\s+["']\.\.\/lib\//.test(runnerCode) && !/import\s+[^\n]*from\s+["'][^"']*lib\/(instagram|youtube|instagram-blob)/.test(runnerCode));
// runner 실행 코드(주석/문자열 제외)에 lib live 경로 리터럴이 실제로 실행되지 않는다.
check("runner 코드(주석/문자열 제외)에 youtube.videos.insert 실행 없음", !/youtube\s*\.\s*videos\s*\.\s*insert/.test(runnerCode));

// 6c) runner 실행: --preflight (no-live)
let pfOutput = "";
let pfOk = false;
try {
  pfOutput = execFileSync(process.execPath, [RUNNER_PATH, "--preflight"], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
  pfOk = true;
} catch (e) {
  pfOutput = String(e?.stdout || e?.message || e);
}
check("runner --preflight 실행 성공(exit 0)", pfOk);
let pfResult = null;
try { pfResult = JSON.parse(pfOutput); check("runner --preflight stdout JSON parse", true); }
catch (e) { check("runner --preflight stdout JSON parse", false, String(e)); }

check("preflight 결과 mode === preflight", pfResult?.mode === "preflight");
check("preflight 결과 liveExecutionEnabledThisSlice === false", pfResult?.liveExecutionEnabledThisSlice === false);
check("preflight 결과 preflight.preflightOk === true", pfResult?.preflight?.preflightOk === true);
check("preflight 결과 metadataOptimizationGateOk === true", pfResult?.preflight?.metadataOptimizationGateOk === true);
check("preflight 결과 duplicateGuardUsesV3_2 === true", pfResult?.preflight?.duplicateGuardUsesV3_2 === true);
check("preflight 결과 sourceFilesReady === true (현재 환경에 두 source mp4 존재)", pfResult?.preflight?.sourceFilesReady === true);
check(
  "preflight 결과 sourceFilesReady가 instagramSourceExists && youtubeSourceExists와 일치",
  pfResult?.preflight?.sourceFilesReady === (pfResult?.preflight?.sourceFilePresence?.instagramSourceExists === true && pfResult?.preflight?.sourceFilePresence?.youtubeSourceExists === true)
);
// 회귀: sourceFilesReady가 false이면 preflightOk도 반드시 false여야 한다(source gate 누락 재발 방지).
check(
  "runner 소스: preflightOk 계산식에 sourceFilesReady가 AND로 포함됨(source 파일 gate 누락 회귀 방지)",
  /preflightOk\s*=[\s\S]{0,200}sourceFilesReady/.test(runnerCode)
);
check("preflight 결과 envValuesAccessedThisRun === false (env 값 미접근)", pfResult?.preflight?.requiredEnvKeyNamesPlan?.envValuesAccessedThisRun === false);
check(
  "preflight 결과 requiredEnvKeyNamesPlan에 key 이름만(값 없음)",
  Array.isArray(pfResult?.preflight?.requiredEnvKeyNamesPlan?.instagram) &&
    pfResult.preflight.requiredEnvKeyNamesPlan.instagram.includes("INSTAGRAM_ACCESS_TOKEN")
);
check(
  "preflight 결과 requiredEnvKeyNamesPlan.youtube에 YOUTUBE_REFRESH_TOKEN 존재, YOUTUBE_ACCESS_TOKEN 없음",
  Array.isArray(pfResult?.preflight?.requiredEnvKeyNamesPlan?.youtube) &&
    pfResult.preflight.requiredEnvKeyNamesPlan.youtube.includes("YOUTUBE_REFRESH_TOKEN") &&
    !pfResult.preflight.requiredEnvKeyNamesPlan.youtube.includes("YOUTUBE_ACCESS_TOKEN")
);
// preflight 결과 전체에 실제 secret 값 형태가 없어야 한다.
const pfStr = JSON.stringify(pfResult || {});
check("preflight 결과에 secret 값 형태(EAA/ya29/토큰) 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(pfStr));
check("preflight 결과 sideEffectCounters 전부 0", (() => { const c = pfResult?.plan?.sideEffectCounters || {}; return zeroFields.every((k) => c[k] === 0); })());
check("preflight 결과: 이미 published evidence를 reference로만 취급(retryForbidden)", pfResult?.preflight?.duplicatePublishReference?.retryForbidden === true);
check("preflight 결과: Instagram media_id reference 유지(재시도 대상 아님)", pfResult?.preflight?.duplicatePublishReference?.instagramMediaIdReference === "17916511431199303");
check("preflight 결과: YouTube videoId reference 유지(재시도 대상 아님)", pfResult?.preflight?.duplicatePublishReference?.youtubeVideoIdReference === "r9jhckdpC9w");

// ── 6f) no-execute live execution plan (dual-platform-live-orchestrator-wiring-no-execute-v1) ──
const lep = pfResult?.preflight?.liveExecutionPlan;
check("preflight에 liveExecutionPlan(no-execute) 존재", !!lep && typeof lep === "object");
check("liveExecutionPlan.liveExecutionEnabledThisSlice === false", lep?.liveExecutionEnabledThisSlice === false);
check("liveExecutionPlan.failClosedError === LIVE_EXECUTION_DISABLED_THIS_SLICE", lep?.failClosedError === "LIVE_EXECUTION_DISABLED_THIS_SLICE");
check("liveExecutionPlan.anyStepEnabled === false", lep?.anyStepEnabled === false);
check("liveExecutionPlan.anyStepWillExecute === false", lep?.anyStepWillExecute === false);
check("liveExecutionPlan.anySideEffectPerformed === false", lep?.anySideEffectPerformed === false);
check("liveExecutionPlan.metadataGateIsMandatoryDependency === true", lep?.metadataGateIsMandatoryDependency === true);
check("liveExecutionPlan.duplicateGuardIsMandatoryDependency === true", lep?.duplicateGuardIsMandatoryDependency === true);
check(
  "liveExecutionPlan.orderedFlow가 Instagram Blob→publish, YouTube upload, ledger 순서",
  Array.isArray(lep?.orderedFlow) &&
    lep.orderedFlow.length === 4 &&
    lep.orderedFlow[0] === "instagram_blob_upload" &&
    lep.orderedFlow[1] === "instagram_publish_reel" &&
    lep.orderedFlow[2] === "youtube_direct_upload" &&
    lep.orderedFlow[3] === "publish_ledger_record"
);

const lepSteps = Array.isArray(lep?.steps) ? lep.steps : [];
check("liveExecutionPlan.steps 4개", lepSteps.length === 4);
// 모든 step은 이번 slice에서 실행 불가여야 한다.
check(
  "liveExecutionPlan 모든 step enabled/willExecute/sideEffectPerformed === false",
  lepSteps.length === 4 &&
    lepSteps.every((s) => s.enabled === false && s.willExecute === false && s.sideEffectPerformed === false)
);
// step 순서(order) 정합.
check(
  "liveExecutionPlan steps order 1,2,3,4 순서 정합",
  lepSteps.every((s, i) => s.order === i + 1)
);

const stepById = (id) => lepSteps.find((s) => s.id === id);
const blobStep = stepById("instagram_blob_upload");
const igPubStep = stepById("instagram_publish_reel");
const ytUpStep = stepById("youtube_direct_upload");
const ledgerStep = stepById("publish_ledger_record");

// step 1: Instagram Blob upload → public URL.
check("step instagram_blob_upload: provider vercel_blob + public URL 산출", blobStep?.provider === "vercel_blob" && blobStep?.producesForNextStep === "instagram_public_video_url");
check("step instagram_blob_upload: BLOB_READ_WRITE_TOKEN 승인 토큰 APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST", Array.isArray(blobStep?.requiredApprovalTokens) && blobStep.requiredApprovalTokens.includes("APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST"));

// step 2: Instagram publish — blob URL + metadata gate + duplicate guard 필수 의존.
check("step instagram_publish_reel: blob upload 산출 URL에 의존", Array.isArray(igPubStep?.dependsOn) && igPubStep.dependsOn.includes("instagram_blob_upload"));
const igGateDep = Array.isArray(igPubStep?.dependsOn) ? igPubStep.dependsOn.find((d) => d && d.type === "metadata_optimization_gate") : null;
const igDupDep = Array.isArray(igPubStep?.dependsOn) ? igPubStep.dependsOn.find((d) => d && d.type === "duplicate_publish_guard") : null;
check("step instagram_publish_reel: metadata gate가 필수 의존(mustBeOk, gateOk)", igGateDep?.mustBeOk === true && igGateDep?.gateOk === true);
check("step instagram_publish_reel: duplicate guard가 필수 의존(v3_2 키, retryForbidden)", typeof igDupDep?.key === "string" && igDupDep.key.endsWith("/v3_2") && igDupDep.mustNotBeAlreadyPublished === true && igDupDep.retryForbidden === true);
check("step instagram_publish_reel: 승인 토큰 APPROVE_DUAL_PLATFORM_ARM", Array.isArray(igPubStep?.requiredApprovalTokens) && igPubStep.requiredApprovalTokens.includes("APPROVE_DUAL_PLATFORM_ARM"));
check("step instagram_publish_reel: 이미 완료된 media_id를 reference로만(재시도 금지)", igPubStep?.resultReference?.instagramMediaIdReference === "17916511431199303" && igPubStep?.resultReference?.retryForbidden === true);

// step 3: YouTube direct upload — metadata gate + duplicate guard 필수 의존.
const ytGateDep = Array.isArray(ytUpStep?.dependsOn) ? ytUpStep.dependsOn.find((d) => d && d.type === "metadata_optimization_gate") : null;
const ytDupDep = Array.isArray(ytUpStep?.dependsOn) ? ytUpStep.dependsOn.find((d) => d && d.type === "duplicate_publish_guard") : null;
check("step youtube_direct_upload: direct file upload + youtube_data_api", ytUpStep?.provider === "youtube_data_api");
check("step youtube_direct_upload: metadata gate가 필수 의존(mustBeOk, gateOk)", ytGateDep?.mustBeOk === true && ytGateDep?.gateOk === true);
check("step youtube_direct_upload: duplicate guard가 필수 의존(v3_2 키, retryForbidden)", typeof ytDupDep?.key === "string" && ytDupDep.key.endsWith("/v3_2") && ytDupDep.mustNotBeAlreadyPublished === true && ytDupDep.retryForbidden === true);
check("step youtube_direct_upload: 승인 토큰 YOUTUBE_LIVE_UPLOAD_WIRING + DUAL_PLATFORM_ARM", Array.isArray(ytUpStep?.requiredApprovalTokens) && ytUpStep.requiredApprovalTokens.includes("APPROVE_YOUTUBE_LIVE_UPLOAD_WIRING") && ytUpStep.requiredApprovalTokens.includes("APPROVE_DUAL_PLATFORM_ARM"));
check("step youtube_direct_upload: short-lived credential은 refresh token으로 메모리 발급(장기 env 아님)", ytUpStep?.inputContract?.shortLivedCredentialSource === "derived_in_memory_from_refresh_token");
check("step youtube_direct_upload: requiredEnvKeyNames에 YOUTUBE_ACCESS_TOKEN 없음", Array.isArray(ytUpStep?.requiredEnvKeyNames) && !ytUpStep.requiredEnvKeyNames.includes("YOUTUBE_ACCESS_TOKEN") && ytUpStep.requiredEnvKeyNames.includes("YOUTUBE_REFRESH_TOKEN"));
check("step youtube_direct_upload: 이미 완료된 videoId를 reference로만(재시도 금지)", ytUpStep?.resultReference?.youtubeVideoIdReference === "r9jhckdpC9w" && ytUpStep?.resultReference?.retryForbidden === true);

// step 4: ledger record — 두 publish step에 의존, mutation 없음.
check("step publish_ledger_record: {contentId}/{platform}/{version} keyShape + v3_2 두 키", ledgerStep?.inputContract?.keyShape === "{contentId}/{platform}/{version}" && Array.isArray(ledgerStep?.inputContract?.keys) && ledgerStep.inputContract.keys.length === 2 && ledgerStep.inputContract.keys.every((k) => typeof k === "string" && k.endsWith("/v3_2")));
check("step publish_ledger_record: 두 publish step에 의존", Array.isArray(ledgerStep?.dependsOn) && ledgerStep.dependsOn.includes("instagram_publish_reel") && ledgerStep.dependsOn.includes("youtube_direct_upload"));
check("step publish_ledger_record: ledgerMutationThisSlice === false", ledgerStep?.ledgerMutationThisSlice === false);

// 전체 live execution plan에 secret 값 형태가 없어야 한다.
const lepStr = JSON.stringify(lep || {});
check("liveExecutionPlan에 secret 값 형태(EAA/ya29/blob token) 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(lepStr));
// env key '이름'(SNAKE_CASE, 예: YOUTUBE_REFRESH_TOKEN)과 계약 값 문자열(derived_in_memory_from_refresh_token)은
// secret 값이 아니므로 마스킹 후 검사한다. 그래도 실제 camelCase secret 값 필드(accessToken:'...')는 잡힌다.
const lepMasked = maskEnvKeyNamesAndContractValues(lepStr);
check("liveExecutionPlan에 camelCase secret 값 필드(accessToken:'...' 등) 없음(env key 이름/계약 문자열 제외)", !secretFieldPattern.test(lepMasked));
// preflight 실행 후에도 side effect counters는 전부 0(plan 생성이 부작용을 만들지 않음).
check("liveExecutionPlan 생성 후에도 sideEffectCounters 전부 0", (() => { const c = pfResult?.plan?.sideEffectCounters || {}; return zeroFields.every((k) => c[k] === 0); })());

// 6d) runner 실행: --live (fail-closed, exit 0 아님)
let liveBlocked = false;
let liveStdout = "";
let liveStderr = "";
try {
  liveStdout = execFileSync(process.execPath, [RUNNER_PATH, "--live"], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
  liveBlocked = false; // exit 0이면 fail-closed 실패
} catch (e) {
  liveBlocked = e?.status === 2;
  liveStdout = String(e?.stdout || "");
  liveStderr = String(e?.stderr || "");
}
check("runner --live 는 fail-closed로 exit 2 (실행 불가)", liveBlocked);
check("runner --live stderr에 LIVE_EXECUTION_DISABLED_THIS_SLICE 포함", /LIVE_EXECUTION_DISABLED_THIS_SLICE/.test(liveStderr));
check("runner --live stdout에 publish plan 실행 결과가 나오지 않음(비어있음)", liveStdout.trim() === "");
check("runner --live stderr에 secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(liveStderr));

// 6e) runner 실행: --arm (fail-closed)
let armBlocked = false;
try {
  execFileSync(process.execPath, [RUNNER_PATH, "--arm"], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
  armBlocked = false;
} catch (e) {
  armBlocked = e?.status === 2;
}
check("runner --arm 도 fail-closed로 exit 2 (실행 불가)", armBlocked);

// ── 요약 ────────────────────────────────────────────────────────────────

console.log(`\n${passes} PASS / ${failures} FAIL`);
if (failures > 0) process.exit(1);
