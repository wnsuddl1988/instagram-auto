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
// env key '이름'(대문자 SNAKE_CASE, 예: YOUTUBE_REFRESH_TOKEN)은 secret 값이 아니라
// live wiring에 필요한 key 이름 계약이므로 제거 후 검사한다. 그래도 camelCase secret
// 필드명(accessToken 등)이나 snake_case 값 노출은 여전히 잡힌다.
const docsWithoutEnvKeyNames = docsRaw.replace(/\b[A-Z][A-Z0-9]*_[A-Z0-9_]*\b/g, "");
check("docs에 secret 필드명/값 없음(env key 이름 제외)", !secretFieldPattern.test(docsWithoutEnvKeyNames));
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
check("liveExecutionWiring(env key 이름 제외)에 secret 값 필드명(camelCase accessToken 등) 없음", !secretFieldPattern.test(JSON.stringify(wiringWithoutEnvNames)));
// env key 이름은 반드시 대문자 SNAKE_CASE만 허용(camelCase 실제 secret 필드명 혼입 방지).
const allEnvNames = [...(envNames.instagram || []), ...(envNames.youtube || []), ...(envNames.vercelBlob || [])];
check("requiredEnvKeyNames는 전부 대문자 SNAKE_CASE env key 이름", allEnvNames.length > 0 && allEnvNames.every((n) => /^[A-Z][A-Z0-9_]*$/.test(String(n))));

const dupLedger = wiring.duplicateLedgerConditionToBlockLive || {};
check("duplicateLedgerConditionToBlockLive.version === v3_2", dupLedger.version === "v3_2");
check(
  "duplicateLedgerConditionToBlockLive.existingPublishedKeysReference가 v3_2 사용",
  Array.isArray(dupLedger.existingPublishedKeysReference) && dupLedger.existingPublishedKeysReference.length === 2 && dupLedger.existingPublishedKeysReference.every((k) => typeof k === "string" && k.endsWith("/v3_2"))
);

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
