#!/usr/bin/env node
/**
 * check-dual-platform-final-publish-orchestrator-static.mjs
 *
 * Dual-platform final publish orchestrator 정적 가드.
 * task: dual-platform-arm-wiring-duplicate-guarded-v1
 * (base: dual-platform-final-publish-orchestrator-no-live-v1)
 *
 * 이 가드 자체는 no-live다: 레포 내 fixture JSON + docs + runner 소스 텍스트,
 * 그리고 runner를 child_process로 실행한 stdout(JSON)만 읽는다.
 * (network/env/secret 접근 없음, 실제 Instagram/YouTube API 호출 없음)
 * arm 계약: --live/--arm은 preflight에서 current content duplicate block이 확정된
 * 경우에만 실행하며, 결과는 BLOCKED_DUPLICATE_ALREADY_PUBLISHED(exit 3) + 모든
 * side-effect counter 0이어야 한다. duplicate block 미확정이면 live 실행을 skip하고 FAIL.
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
import { readFileSync, existsSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");

const FIXTURE_PATH = path.join(ROOT, "scripts", "fixtures", "dual_platform_final_publish_orchestrator.v1.json");
const DOCS_PATH = path.join(ROOT, "docs", "dual-platform-final-publish-orchestrator.md");
const RUNNER_PATH = path.join(ROOT, "scripts", "run-dual-platform-final-publish-orchestrator.mjs");
const CONTENT_UNIT_SAMPLE_PATH = path.join(ROOT, "scripts", "fixtures", "dual_platform_content_unit.sample.v1.json");

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

check("fixture.noLiveThisSlice === true (arm이지만 current content duplicate blocked → 실제 live side effect 0)", fixture.noLiveThisSlice === true);
check("fixture.status === ARMED_DUPLICATE_GUARDED_ORCHESTRATOR", fixture.status === "ARMED_DUPLICATE_GUARDED_ORCHESTRATOR");

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
// env key '이름'(대문자 SNAKE_CASE)과 credential 발급 방식 문자열은 secret 값이 아니라 계약이므로 제거.
// 또한 credential 함수의 파라미터 필드 '이름'(예: `{ businessAccountId, accessToken }` 타입 시그니처)은
// secret 값 노출이 아니므로, 실제 "값이 할당된" 형태(accessToken: "값" / accessToken=값)만 secret 노출로 본다.
const docsWithoutEnvKeyNames = maskEnvKeyNamesAndContractValues(docsRaw);
const secretValueAssignmentPattern = /(clientSecret|refreshToken|accessToken|apiKey|api_key|client_secret|refresh_token|access_token)\s*[:=]\s*["'][^"']+["']/i;
check("docs에 secret 값 할당 형태(accessToken:'값' 등) 없음(필드 이름 시그니처는 허용)", !secretValueAssignmentPattern.test(docsWithoutEnvKeyNames));
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
check("fixture.modes.live.liveExecutionEnabledThisSlice === true (armed)", modes.live?.liveExecutionEnabledThisSlice === true);
check("fixture.modes.live.armed === true + armApprovalToken === APPROVE_DUAL_PLATFORM_ARM", modes.live?.armed === true && modes.live?.armApprovalToken === "APPROVE_DUAL_PLATFORM_ARM");
check("fixture.modes.live.failClosedError === LIVE_EXECUTION_DISABLED_THIS_SLICE (disarm 회귀 방어)", modes.live?.failClosedError === "LIVE_EXECUTION_DISABLED_THIS_SLICE");
check(
  "fixture.modes.live.currentContentExpected: BLOCKED_DUPLICATE_ALREADY_PUBLISHED + exit 3 + credential/API 미도달",
  modes.live?.currentContentExpected?.status === "BLOCKED_DUPLICATE_ALREADY_PUBLISHED" &&
    modes.live?.currentContentExpected?.exitCode === 3 &&
    modes.live?.currentContentExpected?.credentialResolutionReached === false &&
    modes.live?.currentContentExpected?.actualApiCallReached === false
);

const wiring = fixture.liveExecutionWiring || {};
check("liveExecutionWiring.liveExecutionEnabledThisSlice === true (armed)", wiring.liveExecutionEnabledThisSlice === true);
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
check(
  "fixture liveExecutionPlan: anyStepEnabled true(armed) + anyStepWillExecute/anySideEffectPerformed false + currentContentDuplicateBlocked true",
  fixLep.anyStepEnabled === true && fixLep.anyStepWillExecute === false && fixLep.anySideEffectPerformed === false &&
    fixLep.currentContentDuplicateBlocked === true && fixLep.duplicateBlockedStatus === "BLOCKED_DUPLICATE_ALREADY_PUBLISHED"
);
check("fixture liveExecutionPlan.metadataGateIsMandatoryDependency === true", fixLep.metadataGateIsMandatoryDependency === true);
check("fixture liveExecutionPlan.duplicateGuardIsMandatoryDependency === true", fixLep.duplicateGuardIsMandatoryDependency === true);
check(
  "fixture liveExecutionPlan.orderedFlow가 Blob→IG publish→YT upload→ledger 순서",
  Array.isArray(fixLep.orderedFlow) && fixLep.orderedFlow.length === 4 &&
    fixLep.orderedFlow[0] === "instagram_blob_upload" && fixLep.orderedFlow[1] === "instagram_publish_reel" &&
    fixLep.orderedFlow[2] === "youtube_direct_upload" && fixLep.orderedFlow[3] === "publish_ledger_record"
);
const fixLepSteps = Array.isArray(fixLep.steps) ? fixLep.steps : [];
check(
  "fixture liveExecutionPlan.steps 4개 전부 enabled(armed) + willExecute false(duplicate blocked) + sideEffect 0",
  fixLepSteps.length === 4 && fixLepSteps.every((s) => s.enabled === true && s.willExecute === false && s.sideEffectPerformed === false)
);
check(
  "fixture liveExecutionPlan step별 requiredApprovalTokens 존재",
  fixLepSteps.length === 4 && fixLepSteps.every((s) => Array.isArray(s.requiredApprovalTokens) && s.requiredApprovalTokens.length >= 1)
);
const fixYtStep = fixLepSteps.find((s) => s.id === "youtube_direct_upload");
check("fixture liveExecutionPlan youtube step requiredEnvKeyNames에 YOUTUBE_ACCESS_TOKEN 없음", Array.isArray(fixYtStep?.requiredEnvKeyNames) && !fixYtStep.requiredEnvKeyNames.includes("YOUTUBE_ACCESS_TOKEN"));
check("fixture liveExecutionPlan에 secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(JSON.stringify(fixLep)));

// fixture: livePublishFunctionRefs가 explicit credential 함수를 가리켜야 한다(wrapper-only 회귀 방지).
// (social-live-client-credential-injection-no-execute-v1 이후 runner가 explicit credential 함수로
// 전환됐는데 fixture가 예전 wrapper 이름을 계속 가리키던 mismatch를 여기서 강제한다.)
check(
  "fixture livePublishFunctionRefs.instagram === uploadInstagramReelWithCredentials",
  wiring.livePublishFunctionRefs?.instagram === "lib/instagram.ts#uploadInstagramReelWithCredentials"
);
check(
  "fixture livePublishFunctionRefs.youtube === uploadYouTubeShortsWithCredentials",
  wiring.livePublishFunctionRefs?.youtube === "lib/youtube.ts#uploadYouTubeShortsWithCredentials"
);
check(
  "fixture livePublishFunctionRefs가 wrapper-only(uploadInstagramReel/uploadYouTubeShorts, WithCredentials 접미사 없음)로 회귀하지 않음",
  wiring.livePublishFunctionRefs?.instagram !== "lib/instagram.ts#uploadInstagramReel" &&
    wiring.livePublishFunctionRefs?.youtube !== "lib/youtube.ts#uploadYouTubeShorts"
);

const fixIgPubStep = fixLepSteps.find((s) => s.id === "instagram_publish_reel");
const fixYtUpStep = fixLepSteps.find((s) => s.id === "youtube_direct_upload");
check(
  "fixture liveExecutionPlan step instagram_publish_reel.functionRef === uploadInstagramReelWithCredentials",
  fixIgPubStep?.functionRef === "lib/instagram.ts#uploadInstagramReelWithCredentials"
);
check(
  "fixture liveExecutionPlan step youtube_direct_upload.functionRef === uploadYouTubeShortsWithCredentials",
  fixYtUpStep?.functionRef === "lib/youtube.ts#uploadYouTubeShortsWithCredentials"
);

// 6b) runner 소스: live gate 상수(armed) + fail-closed + env 미접근 회귀
check("runner에 LIVE_EXECUTION_ENABLED_THIS_SLICE = true 존재(armed)", /LIVE_EXECUTION_ENABLED_THIS_SLICE\s*=\s*true/.test(runnerRawSrc));
check("runner에 LIVE_EXECUTION_ENABLED_THIS_SLICE = false 회귀 없음", !/LIVE_EXECUTION_ENABLED_THIS_SLICE\s*=\s*false/.test(runnerRawSrc));
check("runner에 LIVE_EXECUTION_ARM_APPROVAL_TOKEN = APPROVE_DUAL_PLATFORM_ARM 존재", /LIVE_EXECUTION_ARM_APPROVAL_TOKEN\s*=\s*"APPROVE_DUAL_PLATFORM_ARM"/.test(runnerRawSrc));
check("runner에 LIVE_EXECUTION_DISABLED_THIS_SLICE 에러 상수 존재(disarm 회귀 방어)", runnerRawSrc.includes("LIVE_EXECUTION_DISABLED_THIS_SLICE"));
check("runner에 --live/--arm 처리 + disarm 방어 fail-closed 분기 존재", /--live/.test(runnerRawSrc) && /--arm/.test(runnerRawSrc) && /live_blocked|LIVE_EXECUTION_DISABLED/.test(runnerRawSrc));
check("runner에 LIVE_GATE_ORDER(6단계 안전 순서) 존재", /LIVE_GATE_ORDER/.test(runnerRawSrc) && runnerRawSrc.includes('"duplicate_publish_guard"') && runnerRawSrc.includes('"credential_presence_resolution"'));
check("runner에 BLOCKED_DUPLICATE_ALREADY_PUBLISHED 상태 상수 존재", runnerRawSrc.includes("BLOCKED_DUPLICATE_ALREADY_PUBLISHED"));
check("runner에 executeArmedLiveRun(armed live 실행 경로) 존재", /function\s+executeArmedLiveRun/.test(runnerRawSrc));

// 핵심 안전 순서(소스 레벨): executeArmedLiveRun 내부에서 duplicate guard(gate 4) 평가가
// credential resolution(gate 5) 평가보다 반드시 먼저 와야 한다. 순서가 뒤집히면 fail.
const armExecStart = runnerRawSrc.indexOf("function executeArmedLiveRun");
const armExecEnd = runnerRawSrc.indexOf("function main", armExecStart);
const armExecSrc = armExecStart !== -1 && armExecEnd !== -1 ? runnerRawSrc.slice(armExecStart, armExecEnd) : "";
const dupCallIdx = armExecSrc.indexOf("evaluateDuplicatePublishGuardGate(");
const credCallIdx = armExecSrc.indexOf("credentialPresenceResolutionGate(");
check(
  "runner 소스: executeArmedLiveRun에서 duplicate guard(gate 4)가 credential resolution(gate 5)보다 먼저 평가됨",
  armExecSrc.length > 0 && dupCallIdx !== -1 && credCallIdx !== -1 && dupCallIdx < credCallIdx,
  `dupIdx=${dupCallIdx}, credIdx=${credCallIdx}`
);
// blob liveness evidence gate(gate 3)도 duplicate guard(gate 4)보다 먼저 평가되어야 한다.
const livenessCallIdx = armExecSrc.indexOf("evaluateBlobLivenessEvidenceGate(");
check(
  "runner 소스: executeArmedLiveRun에서 blob liveness evidence(gate 3)가 duplicate guard(gate 4)보다 먼저 평가됨",
  livenessCallIdx !== -1 && dupCallIdx !== -1 && livenessCallIdx < dupCallIdx
);
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
check("preflight 결과 liveExecutionEnabledThisSlice === true (armed)", pfResult?.liveExecutionEnabledThisSlice === true);
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
check("preflight에 liveExecutionPlan 존재", !!lep && typeof lep === "object");
check("liveExecutionPlan.liveExecutionEnabledThisSlice === true (armed)", lep?.liveExecutionEnabledThisSlice === true);
check("liveExecutionPlan.failClosedError === LIVE_EXECUTION_DISABLED_THIS_SLICE (disarm 회귀 방어)", lep?.failClosedError === "LIVE_EXECUTION_DISABLED_THIS_SLICE");
check("liveExecutionPlan.anyStepEnabled === true (armed)", lep?.anyStepEnabled === true);
check("liveExecutionPlan.anyStepWillExecute === false (current content duplicate blocked)", lep?.anyStepWillExecute === false);
check("liveExecutionPlan.anySideEffectPerformed === false", lep?.anySideEffectPerformed === false);
check(
  "liveExecutionPlan.currentContentDuplicateBlocked === true + duplicateBlockedStatus === BLOCKED_DUPLICATE_ALREADY_PUBLISHED",
  lep?.currentContentDuplicateBlocked === true && lep?.duplicateBlockedStatus === "BLOCKED_DUPLICATE_ALREADY_PUBLISHED"
);
check(
  "default: liveExecutionPlan.willExecuteBlockedReason === duplicate_publish_guard_blocks_current_content (모든 step 동일)",
  lep?.willExecuteBlockedReason === "duplicate_publish_guard_blocks_current_content" &&
    Array.isArray(lep?.steps) && lep.steps.length > 0 &&
    lep.steps.every((s) => s.willExecuteBlockedReason === "duplicate_publish_guard_blocks_current_content"),
);
check("default: liveExecutionPlan.isDefaultContentUnit === true", lep?.isDefaultContentUnit === true);
check("default: liveExecutionPlan.customContentLiveHaltError === null", lep?.customContentLiveHaltError === null);
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
// 모든 step은 armed(enabled)지만 current content에서는 실행되지 않아야 한다.
check(
  "liveExecutionPlan 모든 step enabled === true(armed) + willExecute/sideEffectPerformed === false",
  lepSteps.length === 4 &&
    lepSteps.every((s) => s.enabled === true && s.willExecute === false && s.sideEffectPerformed === false)
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
check(
  "preflight 실행 결과 step instagram_publish_reel.functionRef === uploadInstagramReelWithCredentials(explicit credential, wrapper-only 회귀 아님)",
  igPubStep?.functionRef === "lib/instagram.ts#uploadInstagramReelWithCredentials"
);

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
check(
  "preflight 실행 결과 step youtube_direct_upload.functionRef === uploadYouTubeShortsWithCredentials(explicit credential, wrapper-only 회귀 아님)",
  ytUpStep?.functionRef === "lib/youtube.ts#uploadYouTubeShortsWithCredentials"
);

// ── 6f-2) preflight.youtubeLiveUploadWiring (youtube-live-upload-wiring-no-execute-v1) ──
// YouTube direct upload live wiring readiness 요약 블록(secret-free)을 검증한다.
const yw = pfResult?.preflight?.youtubeLiveUploadWiring;
check("preflight에 youtubeLiveUploadWiring 블록 존재", !!yw && typeof yw === "object");
check(
  "youtubeLiveUploadWiring.expectedFunctionRef === uploadYouTubeShortsWithCredentials(explicit, wrapper-only 아님)",
  yw?.expectedFunctionRef === "lib/youtube.ts#uploadYouTubeShortsWithCredentials"
);
check(
  "youtubeLiveUploadWiring.youtubeAccessTokenIsRequiredEnv === false (YOUTUBE_ACCESS_TOKEN required 회귀 아님)",
  yw?.youtubeAccessTokenIsRequiredEnv === false
);
check(
  "youtubeLiveUploadWiring.requiredEnvKeyNames에 CLIENT_ID/SECRET/REFRESH_TOKEN, ACCESS_TOKEN 없음",
  Array.isArray(yw?.requiredEnvKeyNames) &&
    yw.requiredEnvKeyNames.includes("YOUTUBE_CLIENT_ID") &&
    yw.requiredEnvKeyNames.includes("YOUTUBE_CLIENT_SECRET") &&
    yw.requiredEnvKeyNames.includes("YOUTUBE_REFRESH_TOKEN") &&
    !yw.requiredEnvKeyNames.includes("YOUTUBE_ACCESS_TOKEN")
);
check(
  "youtubeLiveUploadWiring.shortLivedCredentialSource === derived_in_memory_from_refresh_token",
  yw?.shortLivedCredentialSource === "derived_in_memory_from_refresh_token"
);
check("youtubeLiveUploadWiring.sourceFileExists === true (letterbox mp4 존재, boolean만)", yw?.sourceFileExists === true);
check("youtubeLiveUploadWiring.metadataOptimizationGateOk === true", yw?.metadataOptimizationGateOk === true);
check(
  "youtubeLiveUploadWiring.duplicatePublishGuard가 v3_2 키 + retryForbidden",
  typeof yw?.duplicatePublishGuard?.key === "string" &&
    yw.duplicatePublishGuard.key.endsWith("/v3_2") &&
    yw.duplicatePublishGuard.usesV3_2 === true &&
    yw.duplicatePublishGuard.mustNotBeAlreadyPublished === true &&
    yw.duplicatePublishGuard.retryForbidden === true
);
check(
  "youtubeLiveUploadWiring.existingVideoEvidence가 r9jhckdpC9w를 retryForbidden reference로 유지",
  yw?.existingVideoEvidence?.videoId === "r9jhckdpC9w" && yw?.existingVideoEvidence?.retryForbidden === true
);
check("youtubeLiveUploadWiring.liveExecutionEnabledThisSlice === true (armed, current content는 duplicate blocked)", yw?.liveExecutionEnabledThisSlice === true);
check("youtubeLiveUploadWiring.actualUploadCallPerformed === false (실제 YouTube upload 호출 0)", yw?.actualUploadCallPerformed === false);
check(
  "youtubeLiveUploadWiring.requiredApprovalTokens에 YOUTUBE_LIVE_UPLOAD_WIRING + DUAL_PLATFORM_ARM",
  Array.isArray(yw?.requiredApprovalTokens) &&
    yw.requiredApprovalTokens.includes("APPROVE_YOUTUBE_LIVE_UPLOAD_WIRING") &&
    yw.requiredApprovalTokens.includes("APPROVE_DUAL_PLATFORM_ARM")
);
// secret 값 형태가 이 블록에 없어야 한다.
check(
  "youtubeLiveUploadWiring에 secret 값 형태(EAA/ya29/blob token) 없음",
  !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(JSON.stringify(yw || {}))
);

// fixture 측 youtubeLiveUploadWiring 계약도 preflight와 정합해야 한다.
const fyw = fixture?.youtubeLiveUploadWiring;
check("fixture.youtubeLiveUploadWiring 존재", !!fyw && typeof fyw === "object");
check(
  "fixture.youtubeLiveUploadWiring.expectedFunctionRef === uploadYouTubeShortsWithCredentials",
  fyw?.expectedFunctionRef === "lib/youtube.ts#uploadYouTubeShortsWithCredentials"
);
check("fixture.youtubeLiveUploadWiring.youtubeAccessTokenIsRequiredEnv === false", fyw?.youtubeAccessTokenIsRequiredEnv === false);
check("fixture.youtubeLiveUploadWiring.existingVideoEvidence.videoId === r9jhckdpC9w (retryForbidden)", fyw?.existingVideoEvidence?.videoId === "r9jhckdpC9w" && fyw?.existingVideoEvidence?.retryForbidden === true);
check("fixture.youtubeLiveUploadWiring.actualUploadCallPerformed === false", fyw?.actualUploadCallPerformed === false);

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

// ── 6g) 최종 arm 계약 (dual-platform-arm-wiring-duplicate-guarded-v1) ─────────

const EXPECTED_GATE_ORDER = [
  "metadata_optimization_gate",
  "source_file_gate",
  "blob_public_url_liveness_evidence_gate",
  "duplicate_publish_guard",
  "credential_presence_resolution",
  "actual_api_call",
];
const EXPECTED_BLOB_LIVENESS = {
  url: "https://7iq7vppwlaha2vuo.public.blob.vercel-storage.com/instagram/reels/t1_lifestyle_inflation/instagram_reels_full_frame_1080x1920/v3_2/54957450ac10.mp4",
  headStatus: 200,
  contentType: "video/mp4",
  contentLength: 20294549,
  resultPath: "output/instagram-blob-url-liveness-no-arm-v1/result.json",
};
const ARM_ZERO_COUNTERS = [
  "instagramApiCallCount", "youtubeApiCallCount", "youtubeOauthTokenRequestCount", "youtubeUploadCallCount",
  "blobMutationCount", "credentialValuesAccessedCount", "credentialValuesResolvedCount",
  "dotEnvLocalDirectAccessCount", "envSecretValuePrintCount", "ledgerMutationCount", "newVideoGeneratedCount",
];

// 6g-1) fixture.liveArm 계약
const fArm = fixture.liveArm || {};
check("fixture.liveArm.armed === true + armApprovalToken === APPROVE_DUAL_PLATFORM_ARM", fArm.armed === true && fArm.armApprovalToken === "APPROVE_DUAL_PLATFORM_ARM");
check(
  "fixture.liveArm.failClosedGateOrder가 6단계 안전 순서와 정확히 일치",
  Array.isArray(fArm.failClosedGateOrder) && fArm.failClosedGateOrder.length === 6 &&
    fArm.failClosedGateOrder.every((g, i) => g === EXPECTED_GATE_ORDER[i])
);
check("fixture.liveArm.duplicateGuardEvaluatedBeforeCredentialResolution === true", fArm.duplicateGuardEvaluatedBeforeCredentialResolution === true);
check("fixture.liveArm.credentialResolutionWiredThisSlice === false (credential 단계는 fail-closed stub)", fArm.credentialResolutionWiredThisSlice === false);
const fArmBlock = fArm.currentContentDuplicateBlock || {};
check(
  "fixture.liveArm.currentContentDuplicateBlock: 양 플랫폼 v3_2 키가 blocked + retryForbidden",
  fArmBlock.instagramKey === "t1_lifestyle_inflation/instagram_reels/v3_2" &&
    fArmBlock.youtubeKey === "t1_lifestyle_inflation/youtube_shorts/v3_2" &&
    fArmBlock.instagramWillBeBlocked === true && fArmBlock.youtubeWillBeBlocked === true &&
    fArmBlock.retryForbidden === true
);
check(
  "fixture.liveArm.currentContentDuplicateBlock: expectedLiveStatus BLOCKED_DUPLICATE_ALREADY_PUBLISHED + exit 3",
  fArmBlock.expectedLiveStatus === "BLOCKED_DUPLICATE_ALREADY_PUBLISHED" && fArmBlock.expectedLiveExitCode === 3
);
check(
  "fixture.liveArm.currentContentDuplicateBlock: duplicate block이 credential resolution 이전 + credential/API 미도달",
  fArmBlock.duplicateBlockHappensBeforeCredentialResolution === true &&
    fArmBlock.credentialResolutionWouldBeReached === false && fArmBlock.actualApiCallWouldRun === false
);
const fArmEv = fArm.blobPublicUrlLivenessEvidence || {};
check(
  "fixture.liveArm.blobPublicUrlLivenessEvidence가 통과 evidence(url/200/video/mp4/20294549/resultPath)와 정확히 일치",
  fArmEv.url === EXPECTED_BLOB_LIVENESS.url && fArmEv.headStatus === EXPECTED_BLOB_LIVENESS.headStatus &&
    fArmEv.contentType === EXPECTED_BLOB_LIVENESS.contentType && fArmEv.contentLength === EXPECTED_BLOB_LIVENESS.contentLength &&
    fArmEv.resultPath === EXPECTED_BLOB_LIVENESS.resultPath
);
check(
  "fixture.liveArm.zeroCountersForDuplicateBlockedRun에 API/OAuth/upload/blob/credential/.env.local/ledger counter 전부 포함",
  Array.isArray(fArm.zeroCountersForDuplicateBlockedRun) && ARM_ZERO_COUNTERS.every((c) => fArm.zeroCountersForDuplicateBlockedRun.includes(c))
);
check("fixture.liveArm에 secret 값 형태(EAA/ya29/blob token) 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(JSON.stringify(fArm)));

// 6g-2) preflight.liveArm 계약(runner 실행 결과)
const pArm = pfResult?.preflight?.liveArm;
check("preflight에 liveArm 블록 존재", !!pArm && typeof pArm === "object");
check("preflight liveArm.armed === true + armApprovalToken === APPROVE_DUAL_PLATFORM_ARM", pArm?.armed === true && pArm?.armApprovalToken === "APPROVE_DUAL_PLATFORM_ARM");
check(
  "preflight liveArm.failClosedGateOrder가 6단계 안전 순서와 정확히 일치",
  Array.isArray(pArm?.failClosedGateOrder) && pArm.failClosedGateOrder.length === 6 &&
    pArm.failClosedGateOrder.every((g, i) => g === EXPECTED_GATE_ORDER[i])
);
check("preflight liveArm.duplicateGuardEvaluatedBeforeCredentialResolution === true", pArm?.duplicateGuardEvaluatedBeforeCredentialResolution === true);
check("preflight liveArm.credentialResolutionWiredThisSlice === false", pArm?.credentialResolutionWiredThisSlice === false);
check("preflight liveArm.metadataOptimizationGateOk === true", pArm?.metadataOptimizationGateOk === true);
check("preflight liveArm.sourceFilesReady === true", pArm?.sourceFilesReady === true);
const pArmEv = pArm?.blobPublicUrlLivenessEvidence || {};
check(
  "preflight liveArm.blobPublicUrlLivenessEvidence가 fixture/통과 evidence와 정확히 일치(url/200/video/mp4/20294549)",
  pArmEv.url === EXPECTED_BLOB_LIVENESS.url && pArmEv.headStatus === EXPECTED_BLOB_LIVENESS.headStatus &&
    pArmEv.contentType === EXPECTED_BLOB_LIVENESS.contentType && pArmEv.contentLength === EXPECTED_BLOB_LIVENESS.contentLength &&
    pArmEv.resultPath === EXPECTED_BLOB_LIVENESS.resultPath
);
check("preflight liveArm.blobPublicUrlLivenessEvidence.ok === true (evidence gate 통과)", pArmEv.ok === true && pArmEv.resultFileExists === true && pArmEv.urlMatchesCurrentContentPath === true);
const pArmBlock = pArm?.currentContentDuplicateBlock || {};
check(
  "preflight liveArm.currentContentDuplicateBlock: 양 플랫폼 v3_2 키가 blocked 예정 + retryForbidden",
  typeof pArmBlock.instagramKey === "string" && pArmBlock.instagramKey.endsWith("/v3_2") &&
    typeof pArmBlock.youtubeKey === "string" && pArmBlock.youtubeKey.endsWith("/v3_2") &&
    pArmBlock.instagramWillBeBlocked === true && pArmBlock.youtubeWillBeBlocked === true &&
    pArmBlock.retryForbidden === true
);
check(
  "preflight liveArm.currentContentDuplicateBlock: expectedLiveStatus BLOCKED_DUPLICATE_ALREADY_PUBLISHED + exit 3 + credential/API 미도달",
  pArmBlock.expectedLiveStatus === "BLOCKED_DUPLICATE_ALREADY_PUBLISHED" && pArmBlock.expectedLiveExitCode === 3 &&
    pArmBlock.duplicateBlockHappensBeforeCredentialResolution === true &&
    pArmBlock.credentialResolutionWouldBeReached === false && pArmBlock.actualApiCallWouldRun === false
);
check("preflight liveArm.credentialValuesAccessedThisRun === false", pArm?.credentialValuesAccessedThisRun === false);
check("preflight liveArm.actualApiCallPerformedThisRun === false", pArm?.actualApiCallPerformedThisRun === false);

// 6g-3) docs: arm 계약 + blob liveness evidence 정합
check("docs에 BLOCKED_DUPLICATE_ALREADY_PUBLISHED 명시", docsRaw.includes("BLOCKED_DUPLICATE_ALREADY_PUBLISHED"));
check("docs에 blob liveness evidence URL 기록", docsRaw.includes(EXPECTED_BLOB_LIVENESS.url));
check("docs에 blob liveness evidence contentLength(20294549) 기록", docsRaw.includes("20294549"));
check("docs에 blob liveness evidence contentType(video/mp4) 기록", docsRaw.includes("video/mp4"));
check("docs에 6단계 gate 순서(duplicate guard가 credential 이전) 설명", docsRaw.includes("credential_presence_resolution") && docsRaw.includes("duplicate_publish_guard"));

// 6g-4) runner 실행: --live/--arm — preflight에서 duplicate block이 확정된 경우에만 1회 실행.
// (duplicate block 미확정 상태에서 live 실행은 credential/API 단계 진입 위험이 있으므로 금지 — skip + FAIL)
const dupBlockConfirmed =
  pArmBlock.instagramWillBeBlocked === true &&
  pArmBlock.youtubeWillBeBlocked === true &&
  pArmBlock.expectedLiveStatus === "BLOCKED_DUPLICATE_ALREADY_PUBLISHED" &&
  pArm?.duplicateGuardEvaluatedBeforeCredentialResolution === true;
check("preflight: current content duplicate block 확정(--live 실행 전제조건)", dupBlockConfirmed);

function runArmedLive(flag) {
  let exitCode = null; let stdout = ""; let stderr = "";
  try {
    stdout = execFileSync(process.execPath, [RUNNER_PATH, flag], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
    exitCode = 0;
  } catch (e) {
    exitCode = typeof e?.status === "number" ? e.status : null;
    stdout = String(e?.stdout || "");
    stderr = String(e?.stderr || "");
  }
  return { exitCode, stdout, stderr };
}

if (dupBlockConfirmed) {
  const live = runArmedLive("--live");
  check("--live: duplicate blocked exit 3 (publish 미수행 신호, exit 0 아님)", live.exitCode === 3, `exit=${live.exitCode}`);
  let liveRes = null;
  try { liveRes = JSON.parse(live.stdout); check("--live stdout JSON parse", true); }
  catch (e) { check("--live stdout JSON parse", false, String(e)); }
  check("--live mode === live_armed + armed === true", liveRes?.mode === "live_armed" && liveRes?.armed === true);
  check("--live status === BLOCKED_DUPLICATE_ALREADY_PUBLISHED", liveRes?.status === "BLOCKED_DUPLICATE_ALREADY_PUBLISHED", `status=${liveRes?.status}`);
  const liveCounters = liveRes?.sideEffectCounters || {};
  for (const f of ARM_ZERO_COUNTERS) {
    check(`--live sideEffectCounters.${f} === 0`, liveCounters[f] === 0, `value=${JSON.stringify(liveCounters[f])}`);
  }
  check("--live credentialResolutionReached === false (duplicate block이 credential 이전)", liveRes?.credentialResolutionReached === false);
  check("--live credentialValuesAccessed === false + credentialValuesResolved === false", liveRes?.credentialValuesAccessed === false && liveRes?.credentialValuesResolved === false);
  check("--live actualApiCallReached === false", liveRes?.actualApiCallReached === false);
  check("--live dotEnvLocalDirectAccess === false", liveRes?.dotEnvLocalDirectAccess === false);
  const trace = Array.isArray(liveRes?.gateTrace) ? liveRes.gateTrace : [];
  const t4 = trace.find((g) => g?.order === 4);
  const t5 = trace.find((g) => g?.order === 5);
  const t6 = trace.find((g) => g?.order === 6);
  check("--live gateTrace: gate 4 duplicate_publish_guard evaluated + blocked", t4?.gate === "duplicate_publish_guard" && t4?.evaluated === true && t4?.blocked === true);
  check("--live gateTrace: gate 5 credential_presence_resolution 미평가/미도달", t5?.gate === "credential_presence_resolution" && t5?.evaluated === false && t5?.reached === false);
  check("--live gateTrace: gate 6 actual_api_call 미평가/미도달", t6?.gate === "actual_api_call" && t6?.evaluated === false && t6?.reached === false);
  check(
    "--live duplicateBlock: 양 플랫폼 v3_2 키 + blockedBeforeCredentialResolution + retryForbidden",
    typeof liveRes?.duplicateBlock?.instagramKey === "string" && liveRes.duplicateBlock.instagramKey.endsWith("/v3_2") &&
      typeof liveRes?.duplicateBlock?.youtubeKey === "string" && liveRes.duplicateBlock.youtubeKey.endsWith("/v3_2") &&
      liveRes?.duplicateBlock?.blockedBeforeCredentialResolution === true &&
      liveRes?.duplicateBlock?.blockedBeforeActualApiCall === true &&
      liveRes?.duplicateBlock?.retryForbidden === true
  );
  check(
    "--live existingEvidenceReference: media_id/videoId reference로만 + retryForbidden",
    liveRes?.existingEvidenceReference?.instagramMediaIdReference === "17916511431199303" &&
      liveRes?.existingEvidenceReference?.youtubeVideoIdReference === "r9jhckdpC9w" &&
      liveRes?.existingEvidenceReference?.retryForbidden === true
  );
  check(
    "--live wouldHaveCalledFunctionRefs가 explicit credential 함수(wrapper-only 회귀 아님)",
    liveRes?.wouldHaveCalledFunctionRefs?.instagram === "lib/instagram.ts#uploadInstagramReelWithCredentials" &&
      liveRes?.wouldHaveCalledFunctionRefs?.youtube === "lib/youtube.ts#uploadYouTubeShortsWithCredentials"
  );
  check(
    "--live blobPublicUrlLivenessEvidence가 통과 evidence와 정합(url/200/video/mp4/20294549)",
    liveRes?.blobPublicUrlLivenessEvidence?.url === EXPECTED_BLOB_LIVENESS.url &&
      liveRes?.blobPublicUrlLivenessEvidence?.headStatus === 200 &&
      liveRes?.blobPublicUrlLivenessEvidence?.contentType === "video/mp4" &&
      liveRes?.blobPublicUrlLivenessEvidence?.contentLength === 20294549
  );
  check("--live stdout에 secret 값 형태(EAA/ya29/blob token) 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(live.stdout));
  check("--live stderr 비어있음(에러/secret 출력 없음)", live.stderr.trim() === "");

  const arm = runArmedLive("--arm");
  check("--arm: 동일하게 duplicate blocked exit 3", arm.exitCode === 3, `exit=${arm.exitCode}`);
  let armRes = null;
  try { armRes = JSON.parse(arm.stdout); } catch { armRes = null; }
  check("--arm status === BLOCKED_DUPLICATE_ALREADY_PUBLISHED + credential/API 미도달", armRes?.status === "BLOCKED_DUPLICATE_ALREADY_PUBLISHED" && armRes?.credentialResolutionReached === false && armRes?.actualApiCallReached === false);
} else {
  check("--live/--arm 실행 skip — preflight duplicate block 미확정이므로 안전상 live 실행 금지", false, "duplicate guard가 current content를 차단하지 않는 상태에서는 live 실행을 시도하지 않는다");
}

// ── 7) content unit manifest parameterization (no-live) ──────────────────────
// task: dual-platform-content-unit-manifest-parameterization-no-live-v1
// 외부 content unit manifest 기반 dry-run/preflight + custom content live fail-closed 검증.

// 7a) runner 소스: manifest 로더/판정/custom fail-closed 계약이 코드에 존재
check("runner: loadContentUnitFromManifest export 존재", /export function loadContentUnitFromManifest/.test(runnerRawSrc));
check("runner: isDefaultContentUnit export 존재", /export function isDefaultContentUnit/.test(runnerRawSrc));
check("runner: CONTENT_UNIT_MANIFEST_SCHEMA_VERSION = dual_platform_content_unit_v1", /CONTENT_UNIT_MANIFEST_SCHEMA_VERSION\s*=\s*"dual_platform_content_unit_v1"/.test(runnerRawSrc));
check("runner: CREDENTIAL_RESOLUTION_NOT_WIRED_ERROR 상수 존재", /CREDENTIAL_RESOLUTION_NOT_WIRED_ERROR\s*=\s*"CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE"/.test(runnerRawSrc));
check("runner: --content-unit CLI arg 파싱 존재", /--content-unit/.test(runnerRawSrc) && /resolveContentUnitArg|resolveActiveContentUnit/.test(runnerCode));

// task: dual-platform-custom-content-live-credential-gate-no-execute-v1
// 옛 gate 4.5 무조건 custom halt는 제거됐다. custom content는 gate 1~4를 통과하면 credential
// resolution stub(gate 5)까지 도달한 뒤 exit 4로 fail-closed된다. 실행 경로(executeArmedLiveRun)에
// 무조건 custom halt(exitCode:5, custom_content_live_not_enabled)가 남아 있으면 안 된다.
check(
  "runner: executeArmedLiveRun에 옛 무조건 custom halt(exitCode:5)가 남아 있지 않음",
  !/exitCode:\s*5/.test(runnerCode) && !/blockedBy:\s*"custom_content_live_not_enabled"/.test(runnerRawSrc),
);
check(
  "runner: custom credential-gate fail-closed(exit 4, CREDENTIAL_RESOLUTION_NOT_WIRED) 존재",
  /exitCode:\s*4/.test(runnerCode) &&
    /status:\s*credentialGate\.haltError/.test(runnerCode),
);
check(
  "runner: 핵심 안전 순서 — duplicate publish guard(gate 4)가 credential resolution(gate 5) 호출 이전에 평가됨",
  (() => {
    // executeArmedLiveRun 내부에서 gate 4 duplicate block return(DUPLICATE_BLOCKED_STATUS)이
    // gate 5 credential resolution 호출(credentialPresenceResolutionGate())보다 앞서야 한다.
    const dupGateCall = runnerRawSrc.indexOf("const duplicateGate = evaluateDuplicatePublishGuardGate(unit);");
    const credCall = runnerRawSrc.indexOf("const credentialGate = credentialPresenceResolutionGate();");
    return dupGateCall !== -1 && credCall !== -1 && dupGateCall < credCall;
  })(),
);
check(
  "runner: gate 5 credential stub은 process.env/secret/credential 값을 읽지 않고 어떤 lib도 import/호출하지 않음",
  (() => {
    const fnStart = runnerRawSrc.indexOf("function credentialPresenceResolutionGate()");
    const fnEnd = runnerRawSrc.indexOf("\n}", fnStart);
    const fnBody = fnStart !== -1 ? runnerRawSrc.slice(fnStart, fnEnd === -1 ? undefined : fnEnd) : "";
    return fnBody !== "" &&
      !/process\.env/.test(fnBody) &&
      /credentialValuesAccessed:\s*false/.test(fnBody) &&
      /credentialValuesResolved:\s*false/.test(fnBody);
  })(),
);

// task: dual-platform-content-unit-manifest-block-reason-fix-v1
//       + dual-platform-custom-content-live-credential-gate-no-execute-v1
// buildLiveExecutionPlan의 blocked reason이 콘텐츠 종류에 따라 분기되어야 한다(하드코딩 금지).
// custom content의 blocked reason은 이제 credential_resolution_not_wired_this_slice다.
check(
  "runner: buildLiveExecutionPlan이 willExecuteBlockedReason을 콘텐츠 종류별로 분기(하드코딩 아님)",
  runnerRawSrc.includes('"credential_resolution_not_wired_this_slice"') &&
    /const\s+willExecuteBlockedReason\s*=\s*currentContentDuplicateBlocked/.test(runnerCode),
);
check(
  "runner: currentContentDuplicateBlocked이 isDefault && bothAlreadyPublished 기준으로 계산됨(default 여부 무시하고 duplicate만 보지 않음)",
  /const\s+currentContentDuplicateBlocked\s*=\s*isDefault\s*&&\s*bothAlreadyPublished/.test(runnerCode),
);

// 7b) sample fixture 계약
check("content unit sample fixture 존재", existsSync(CONTENT_UNIT_SAMPLE_PATH));
let sampleUnit = null;
if (existsSync(CONTENT_UNIT_SAMPLE_PATH)) {
  try { sampleUnit = JSON.parse(readFileSync(CONTENT_UNIT_SAMPLE_PATH, "utf8")); check("content unit sample fixture JSON parse", true); }
  catch (e) { check("content unit sample fixture JSON parse", false, String(e)); }
}
if (sampleUnit) {
  check("sample: schemaVersion === dual_platform_content_unit_v1", sampleUnit.schemaVersion === "dual_platform_content_unit_v1");
  check("sample: 필수 필드(contentId/version/instagramSourcePath/youtubeSourcePath) 존재",
    typeof sampleUnit.contentId === "string" && typeof sampleUnit.version === "string" &&
    typeof sampleUnit.instagramSourcePath === "string" && typeof sampleUnit.youtubeSourcePath === "string");
  check("sample: default evidence content이 아님(신규 콘텐츠 템플릿)", sampleUnit.contentId !== "t1_lifestyle_inflation");
  check("sample: secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(JSON.stringify(sampleUnit)));
}

// 7c) 실행: custom manifest --preflight (source 파일 없음 → preflightOk:false, live 미활성)
let cpf = null;
try {
  const out = execFileSync(process.execPath, [RUNNER_PATH, "--preflight", "--content-unit", CONTENT_UNIT_SAMPLE_PATH], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
  cpf = JSON.parse(out);
  check("custom --preflight 실행 성공 + JSON parse", true);
} catch (e) {
  check("custom --preflight 실행 성공 + JSON parse", false, String(e?.message || e));
}
if (cpf) {
  check("custom --preflight: isDefaultContentUnit === false", cpf.isDefaultContentUnit === false);
  check("custom --preflight: contentUnitManifestPath 설정됨", typeof cpf.contentUnitManifestPath === "string");
  check("custom --preflight: contentUnit.kind === custom_manifest_content", cpf.preflight?.contentUnit?.kind === "custom_manifest_content");
  check("custom --preflight: customContentLiveHaltError === CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE", cpf.preflight?.contentUnit?.customContentLiveHaltError === "CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE");
  check("custom --preflight: customContentLiveEnabledThisSlice === false (실제 publish는 여전히 비활성)", cpf.preflight?.contentUnit?.customContentLiveEnabledThisSlice === false);
  check("custom --preflight: duplicateGuardUsesV3_2 === false(신규 version)", cpf.preflight?.duplicateGuardUsesV3_2 === false);
  check("custom --preflight: duplicateGuardKeyFormatOk === true(unit.version 정합)", cpf.preflight?.duplicateGuardKeyFormatOk === true);
  check("custom --preflight: preflightOk === false(sample source 파일 미존재 → fail-closed)", cpf.preflight?.preflightOk === false);
  const igKey = cpf.preflight?.liveArm?.currentContentDuplicateBlock?.instagramKey;
  check("custom --preflight: duplicate key가 sample contentId/version 사용", typeof igKey === "string" && igKey.startsWith(`${sampleUnit?.contentId}/`) && igKey.endsWith(`/${sampleUnit?.version}`));
  check("custom --preflight: stdout에 secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(JSON.stringify(cpf)));

  // task: dual-platform-content-unit-manifest-block-reason-fix-v1
  //       + dual-platform-custom-content-live-credential-gate-no-execute-v1
  // custom content의 step blocked reason이 "duplicate" 계열이 아니라 이제 credential-gate 계열이어야 한다.
  // Codex 리뷰 발견: 이전에는 이 값이 항상 duplicate_publish_guard_blocks_current_content로 하드코딩되어
  // Owner가 새(비중복) 콘텐츠를 "중복이라 막힌 것"으로 오인할 수 있었다. 옛 gate 4.5 무조건 halt가
  // 제거되면서 custom content의 실제 최종 halt는 credential_resolution_not_wired_this_slice가 됐다.
  const cLep = cpf.preflight?.liveExecutionPlan;
  check(
    "custom --preflight: liveExecutionPlan.willExecuteBlockedReason === credential_resolution_not_wired_this_slice (duplicate 사유 아님)",
    cLep?.willExecuteBlockedReason === "credential_resolution_not_wired_this_slice",
  );
  check(
    "custom --preflight: 모든 step.willExecuteBlockedReason이 credential_resolution_not_wired_this_slice(duplicate 사유 없음)",
    Array.isArray(cLep?.steps) && cLep.steps.length > 0 &&
      cLep.steps.every((s) => s.willExecuteBlockedReason === "credential_resolution_not_wired_this_slice"),
  );
  check("custom --preflight: liveExecutionPlan.currentContentDuplicateBlocked === false(duplicate 아님)", cLep?.currentContentDuplicateBlocked === false);
  check("custom --preflight: liveExecutionPlan.isDefaultContentUnit === false", cLep?.isDefaultContentUnit === false);
  check("custom --preflight: liveExecutionPlan.customContentLiveHaltError === CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE", cLep?.customContentLiveHaltError === "CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE");
}

// 7d) 실행: default 동작 불변(--preflight/--live 회귀 방지 재확인)
let defPf = null;
try {
  const out = execFileSync(process.execPath, [RUNNER_PATH, "--preflight"], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
  defPf = JSON.parse(out);
} catch { defPf = null; }
check("default --preflight: isDefaultContentUnit === true(하위 호환)", defPf?.isDefaultContentUnit === true);
check("default --preflight: duplicateGuardUsesV3_2 === true 유지", defPf?.preflight?.duplicateGuardUsesV3_2 === true);
check("default --preflight: contentUnit.kind === default_evidence_content", defPf?.preflight?.contentUnit?.kind === "default_evidence_content");

// 7e) 실행: custom content --live 시나리오.
// task: dual-platform-custom-content-live-credential-gate-no-execute-v1
// (A) ready-probe: gate 1~4를 모두 통과하는 custom content가 credential resolution stub(gate 5)까지
//     도달한 뒤 CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE(exit 4)로 fail-closed되는지 검증.
// (B) missing-blob probe: source는 있지만 blob evidence가 없는 custom content가 gate 3(blob)에서
//     credential 이전에 fail-closed(exit 3)되는지 검증.
// 두 probe manifest는 모두 OS temp 디렉터리에 만들었다가 검증 후 정리한다(레포 밖, secret 없음).
// default content의 source 경로를 재사용해 gate 1~4를 실제로 통과시킨다(실제 존재하는 source가 있을 때만).
const igSrc = defPf?.plan?.jobs?.find?.((j) => j.id === "instagram_job")?.sourcePath;
const ytSrc = defPf?.plan?.jobs?.find?.((j) => j.id === "youtube_job")?.sourcePath;
if (typeof igSrc === "string" && typeof ytSrc === "string" && existsSync(igSrc) && existsSync(ytSrc) && sampleUnit) {
  const probeTmpDir = mkdtempSync(path.join(os.tmpdir(), "dual-platform-cred-gate-probe-"));
  try {
    // ── (A) ready-probe: gate 1~4 통과 → credential stub(gate 5) 도달, exit 4 ──
    const readyProbe = {
      schemaVersion: "dual_platform_content_unit_v1",
      contentId: "t_probe_credgate_ready_static",
      version: "vprobe",
      instagramSourcePath: igSrc,
      youtubeSourcePath: ytSrc,
      instagramMetadata: sampleUnit.instagramMetadata,
      youtubeMetadata: sampleUnit.youtubeMetadata,
      // shape-valid, no-network blob evidence — URL이 probe contentId/version 경로와 정합해야 gate 3 통과.
      blobPublicUrlLivenessEvidence: {
        url: `https://7iq7vppwlaha2vuo.public.blob.vercel-storage.com/instagram/reels/t_probe_credgate_ready_static/instagram_reels_full_frame_1080x1920/vprobe/probe.mp4`,
        headStatus: 200,
        contentType: "video/mp4",
        contentLength: 123,
      },
      existingPublishedKeys: [],
    };
    const readyProbePath = path.join(probeTmpDir, "ready_probe.json");
    writeFileSync(readyProbePath, JSON.stringify(readyProbe, null, 2), "utf8");
    let readyLive = null;
    let readyExit = null;
    try {
      const out = execFileSync(process.execPath, [RUNNER_PATH, "--live", "--content-unit", readyProbePath], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
      readyExit = 0;
      readyLive = JSON.parse(out);
    } catch (e) {
      readyExit = typeof e?.status === "number" ? e.status : null;
      try { readyLive = JSON.parse(e?.stdout || ""); } catch { readyLive = null; }
    }
    check("custom ready-probe --live: exit 4 (credential resolution stub 도달 후 fail-closed)", readyExit === 4, `exit=${readyExit}`);
    check("custom ready-probe --live: status === CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE", readyLive?.status === "CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE");
    check("custom ready-probe --live: credentialResolutionReached === true", readyLive?.credentialResolutionReached === true);
    check("custom ready-probe --live: credentialValuesAccessed === false", readyLive?.credentialValuesAccessed === false);
    check("custom ready-probe --live: credentialValuesResolved === false", readyLive?.credentialValuesResolved === false);
    check("custom ready-probe --live: actualApiCallReached === false", readyLive?.actualApiCallReached === false);
    const rpc = readyLive?.sideEffectCounters ?? {};
    check("custom ready-probe --live: 모든 side-effect counter 0", Object.keys(rpc).length > 0 && Object.values(rpc).every((v) => v === 0));
    // gate trace: 1(metadata) → 2(source) → 3(blob) → 4(duplicate, 미차단) → 5(credential 도달) → 6(actual api 미도달)
    const rpt = Array.isArray(readyLive?.gateTrace) ? readyLive.gateTrace : [];
    const g1 = rpt.find((g) => g.order === 1), g2 = rpt.find((g) => g.order === 2), g3 = rpt.find((g) => g.order === 3);
    const g4 = rpt.find((g) => g.order === 4), g5 = rpt.find((g) => g.order === 5), g6 = rpt.find((g) => g.order === 6);
    check("custom ready-probe: gate trace가 metadata→source→blob→duplicate→credential→actual_api 순서", (() => {
      const orders = rpt.map((g) => g.order);
      const idx1 = orders.indexOf(1), idx2 = orders.indexOf(2), idx3 = orders.indexOf(3), idx4 = orders.indexOf(4), idx5 = orders.indexOf(5), idx6 = orders.indexOf(6);
      return idx1 !== -1 && idx2 !== -1 && idx3 !== -1 && idx4 !== -1 && idx5 !== -1 && idx6 !== -1 &&
        idx1 < idx2 && idx2 < idx3 && idx3 < idx4 && idx4 < idx5 && idx5 < idx6;
    })());
    check("custom ready-probe: gate 1 metadata / gate 2 source / gate 3 blob 모두 evaluated & ok", g1?.evaluated === true && g1?.ok === true && g2?.evaluated === true && g2?.ok === true && g3?.evaluated === true && g3?.ok === true);
    check("custom ready-probe: gate 4 duplicate guard가 credential 이전에 evaluated & 미차단", g4?.gate === "duplicate_publish_guard" && g4?.evaluated === true && g4?.blocked === false);
    check("custom ready-probe: gate 5 credential_presence_resolution evaluated & reached (wiredThisSlice false)", g5?.gate === "credential_presence_resolution" && g5?.evaluated === true && g5?.reached === true && g5?.wiredThisSlice === false);
    check("custom ready-probe: gate 6 actual_api_call 미평가/미도달 (blockedBy credential_resolution_not_wired)", g6?.gate === "actual_api_call" && g6?.evaluated === false && g6?.reached === false && g6?.blockedBy === "credential_resolution_not_wired");
    check("custom ready-probe: stdout에 secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(JSON.stringify(readyLive)));

    // ── (B) missing-blob probe: source OK지만 blob evidence 부재 → gate 3에서 credential 이전 fail-closed ──
    const noBlobProbe = {
      schemaVersion: "dual_platform_content_unit_v1",
      contentId: "t_probe_credgate_noblob_static",
      version: "vprobe",
      instagramSourcePath: igSrc,
      youtubeSourcePath: ytSrc,
      instagramMetadata: sampleUnit.instagramMetadata,
      youtubeMetadata: sampleUnit.youtubeMetadata,
      // blobPublicUrlLivenessEvidence 의도적 누락 → gate 3 fail-closed.
      existingPublishedKeys: [],
    };
    const noBlobProbePath = path.join(probeTmpDir, "no_blob_probe.json");
    writeFileSync(noBlobProbePath, JSON.stringify(noBlobProbe, null, 2), "utf8");
    let noBlobLive = null;
    let noBlobExit = null;
    try {
      const out = execFileSync(process.execPath, [RUNNER_PATH, "--live", "--content-unit", noBlobProbePath], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
      noBlobExit = 0;
      noBlobLive = JSON.parse(out);
    } catch (e) {
      noBlobExit = typeof e?.status === "number" ? e.status : null;
      try { noBlobLive = JSON.parse(e?.stdout || ""); } catch { noBlobLive = null; }
    }
    check("custom missing-blob probe --live: exit 3 (gate 3 blob evidence fail-closed, credential 이전)", noBlobExit === 3, `exit=${noBlobExit}`);
    check("custom missing-blob probe --live: status === BLOCKED_BLOB_LIVENESS_EVIDENCE", noBlobLive?.status === "BLOCKED_BLOB_LIVENESS_EVIDENCE");
    check("custom missing-blob probe --live: credentialResolutionReached === false (credential 미도달)", noBlobLive?.credentialResolutionReached === false);
    check("custom missing-blob probe --live: actualApiCallReached === false", noBlobLive?.actualApiCallReached === false);
    const nbt = Array.isArray(noBlobLive?.gateTrace) ? noBlobLive.gateTrace : [];
    check("custom missing-blob probe: gate 5 credential이 gate trace에 없음(미도달)", !nbt.find((g) => g.order === 5));
    const nbc = noBlobLive?.sideEffectCounters ?? {};
    check("custom missing-blob probe --live: 모든 side-effect counter 0", Object.keys(nbc).length > 0 && Object.values(nbc).every((v) => v === 0));
  } finally {
    try { rmSync(probeTmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
} else {
  // source 파일이 환경에 없으면 credential gate 런타임 도달은 검증 불가 — 소스 정적 계약으로만 커버함을 명시.
  check("custom --live credential-gate 런타임 검증 skip(default source 파일 미존재) — 소스 정적 계약(7a)로 커버", true, "환경상 default source mp4 부재");
}

// ── 요약 ────────────────────────────────────────────────────────────────

console.log(`\n${passes} PASS / ${failures} FAIL`);
if (failures > 0) process.exit(1);
