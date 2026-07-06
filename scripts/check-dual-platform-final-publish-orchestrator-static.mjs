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
check("docs에 secret 필드명 없음", !secretFieldPattern.test(docsRaw));
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

// ── 요약 ────────────────────────────────────────────────────────────────

console.log(`\n${passes} PASS / ${failures} FAIL`);
if (failures > 0) process.exit(1);
