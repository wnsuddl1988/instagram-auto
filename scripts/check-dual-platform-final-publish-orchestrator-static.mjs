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

// ── sanitized child env for credential-preflight present-probe ──────────────
// task: dual-platform-credential-preflight-review-fix-v1 (Codex finding B)
// present-probe는 parent env 전체를 복사하지 않는다(`{ ...process.env }` broad spread 금지 —
// 우발적 secret 상속을 막는다). child node 실행에 필요한 최소 non-secret OS 변수만 명시적
// 화이트리스트로 개별 상속하고, 그 위에 승인된 credential dummy key 6개만 얹는다.
// `.env`/`.env.local`/dotenv/secret 파일은 읽지 않는다.
const SAFE_CHILD_OS_ENV_KEYS = [
  // Windows에서 node.exe가 로드/실행되려면 필요한 non-secret OS 변수(값은 secret 아님).
  "SystemRoot", "windir", "SystemDrive", "PATH", "Path", "PATHEXT", "COMSPEC",
  "TEMP", "TMP", "NUMBER_OF_PROCESSORS", "PROCESSOR_ARCHITECTURE",
];
/**
 * present-probe용 sanitized child env를 만든다. parent env를 spread하지 않고, 화이트리스트된
 * non-secret OS 변수만 개별 상속한 뒤 승인된 dummy credential key만 추가한다.
 * @param {string[]} dummyKeyNames 승인된 credential env key 이름들
 * @param {string} dummyValue 각 key에 넣을 non-secret dummy 값
 */
function buildSanitizedProbeEnv(dummyKeyNames, dummyValue) {
  const env = Object.create(null);
  for (const name of SAFE_CHILD_OS_ENV_KEYS) {
    const v = process.env[name];
    if (typeof v === "string") env[name] = v; // non-secret OS 변수만, 개별 상속(broad spread 아님)
  }
  for (const name of dummyKeyNames) env[name] = dummyValue;
  return env;
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

// task: dual-platform-actual-api-call-no-execute-stale-contract-fix-v1
// 파일 최상단 mode 설명 JSDoc(첫 "/** ... */" 블록)에 옛 gate 5 stub 계약(CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE가
// custom live의 현재 halt)이 active로 남으면 안 된다. gate 6이 wiring된 지금은 이 문자열이 헤더에 없어야 하고,
// 대신 gate 6 no-execute plan 도달을 설명하는 최신 상태 이름이 있어야 한다.
const fileHeaderEnd = runnerRawSrc.indexOf("*/");
const fileHeaderSrc = fileHeaderEnd !== -1 ? runnerRawSrc.slice(0, fileHeaderEnd) : "";
check(
  "runner 파일 헤더 mode 설명에 옛 stub 상태(CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE) active 서술 없음",
  fileHeaderSrc !== "" && !fileHeaderSrc.includes("CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE"),
);
check(
  "runner 파일 헤더 mode 설명이 gate 6 no-execute plan 도달 + 최신 halt 상태(ACTUAL_API_CALL_NOT_ENABLED_THIS_SLICE / CREDENTIAL_KEYS_MISSING_THIS_SLICE)를 설명",
  fileHeaderSrc.includes("ACTUAL_API_CALL_NOT_ENABLED_THIS_SLICE") &&
    fileHeaderSrc.includes("CREDENTIAL_KEYS_MISSING_THIS_SLICE") &&
    /gate\s*6/.test(fileHeaderSrc),
);

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
// task: dual-platform-credential-preflight-redacted-no-live-v1
//       + dual-platform-credential-resolution-wiring-no-execute-v1
// process.env 접근은 오직 두 가지 승인된 형태만 허용된다:
//   (a) Boolean(process.env[keyName]) — redacted presence 판정 전용(값 미바인딩).
//   (b) resolveExplicitCredentialsFromRuntimeEnv() 내부의 승인된 6개 key 직접 read
//       (process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID 등) — in-memory credential 조립 전용.
// 그 외 어떤 process.env 참조(임의 key read/순회/할당/파생)도 금지한다.
const APPROVED_CRED_ENV_KEYS = [
  "INSTAGRAM_BUSINESS_ACCOUNT_ID", "INSTAGRAM_ACCESS_TOKEN",
  "YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN",
  "BLOB_READ_WRITE_TOKEN",
];
check(
  "runner 소스에 process.env 참조가 승인된 형태만 존재((a) Boolean(process.env[...]) presence + (b) 승인 6 key 직접 read)",
  (() => {
    const matches = runnerCode.match(/process\s*\.\s*env/g) ?? [];
    const presence = runnerCode.match(/Boolean\(process\.env\[/g) ?? [];
    // 승인된 6개 key 직접 read: process.env.<APPROVED_KEY> 형태만 카운트.
    const directReadRe = new RegExp(`process\\.env\\.(?:${APPROVED_CRED_ENV_KEYS.join("|")})\\b`, "g");
    const directReads = runnerCode.match(directReadRe) ?? [];
    // 모든 process.env 참조 = presence 패턴 + 승인 key 직접 read 로만 구성되어야 한다.
    return matches.length === presence.length + directReads.length;
  })(),
);
// resolver가 승인되지 않은 임의 key를 읽지 않음: process.env[<변수>] 인덱스 접근은 Boolean() presence 판정
// 안에서만 허용되며, 그 밖의 process.env[...] 동적 인덱스 read(값 바인딩)는 없어야 한다.
check(
  "runner 소스에 승인되지 않은 동적 process.env[...] 값 read 없음(Boolean presence 판정 외 인덱스 접근 금지)",
  (() => {
    // Boolean(process.env[...]) 를 지운 뒤 남은 process.env[ 인덱스 접근이 있으면 위반.
    const withoutPresence = runnerCode.replace(/Boolean\(process\.env\[[^\]]*\]\)/g, "");
    return !/process\.env\[/.test(withoutPresence);
  })(),
);

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

// task: dual-platform-actual-api-call-no-execute-stale-contract-fix-v1
// docs mode table의 live 행에 stale 계약("어느 경로든 actual API call 미도달")이 남으면 안 된다 —
// 지금은 custom ready + credential 전부 present가 gate 6 no-execute plan에 도달한다(actualApiCallReached:true).
check(
  "docs: mode table live 행에 stale 문구(\"어느 경로든 actual API call 미도달\") 없음",
  !docsRaw.includes("어느 경로든 actual API call 미도달"),
);
// docs가 gate 6 no-execute plan 도달과 실제 실행 비활성을 3개 필드로 명확히 구분해 설명해야 한다.
check(
  "docs: mode table live 행이 actualApiCallReached/actualApiCallExecutionEnabledThisSlice/actualApiCallPerformed를 구분 설명",
  docsRaw.includes("actualApiCallReached:true") &&
    docsRaw.includes("actualApiCallExecutionEnabledThisSlice:false") &&
    docsRaw.includes("actualApiCallPerformed:false"),
);
// docs에 옛 credential resolution stub 계약(CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE)이 active로 남으면 안 된다.
check(
  "docs에 옛 stub 상태(CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE) active 언급 없음",
  !docsRaw.includes("CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE"),
);

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
// task: dual-platform-credential-resolution-wiring-no-execute-v1
// 실행 경로의 gate 5는 이제 resolveExplicitCredentialsFromRuntimeEnv()를 호출한다(stub 아님).
const credCallIdx = armExecSrc.indexOf("resolveExplicitCredentialsFromRuntimeEnv(");
check(
  "runner 소스: executeArmedLiveRun에서 duplicate guard(gate 4)가 credential resolution(gate 5)보다 먼저 평가됨",
  armExecSrc.length > 0 && dupCallIdx !== -1 && credCallIdx !== -1 && dupCallIdx < credCallIdx,
  `dupIdx=${dupCallIdx}, credIdx=${credCallIdx}`
);

// task: dual-platform-actual-api-call-no-execute-stale-contract-fix-v1
// executeArmedLiveRun 함수 본문(+ main()의 --live/--arm 진입 주석 직전까지)에는 옛 gate 5 stub 계약
// (CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE가 custom live의 "현재 halt"인 것처럼 서술)이 active로
// 남으면 안 된다. gate 6이 wiring된 지금은 이 문자열이 이 범위(active 실행 경로/진입 주석)에 없어야 한다.
check(
  "runner 소스: executeArmedLiveRun 실행 경로(및 --live/--arm 진입 주석)에 옛 stub 상태(CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE) active 서술 없음",
  armExecSrc.length > 0 && !armExecSrc.includes("CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE"),
);
// gate 6이 wiring됐으므로 실행 경로 안에는 실제로 gate 6 plan builder 호출과 새 halt 상태가 있어야 한다.
check(
  "runner 소스: executeArmedLiveRun이 buildActualApiCallPlanNoExecute를 호출하고 ACTUAL_API_CALL_NOT_ENABLED_ERROR로 fail-closed",
  armExecSrc.includes("buildActualApiCallPlanNoExecute(") && armExecSrc.includes("ACTUAL_API_CALL_NOT_ENABLED_ERROR"),
);
// blob liveness evidence gate(gate 3)도 duplicate guard(gate 4)보다 먼저 평가되어야 한다.
const livenessCallIdx = armExecSrc.indexOf("evaluateBlobLivenessEvidenceGate(");
check(
  "runner 소스: executeArmedLiveRun에서 blob liveness evidence(gate 3)가 duplicate guard(gate 4)보다 먼저 평가됨",
  livenessCallIdx !== -1 && dupCallIdx !== -1 && livenessCallIdx < dupCallIdx
);
check("runner에 --preflight 모드 처리 존재", /--preflight/.test(runnerRawSrc) && /preflight/.test(runnerRawSrc));
check("runner에 REQUIRED_ENV_KEY_NAMES (key 이름 계약) 존재", /REQUIRED_ENV_KEY_NAMES/.test(runnerRawSrc));
// 가장 중요한 회귀: runner가 credential '값'을 승인된 경로 밖에서 읽지 않는다(코드 기준, 주석/문자열 제외).
// task: dual-platform-credential-resolution-wiring-no-execute-v1
// process.env 접근은 (a) Boolean(process.env[keyName]) presence 판정, 또는 (b) resolver의 승인된 6개 key
// 직접 read(process.env.<APPROVED_KEY>)만 허용된다. preflight는 값 미접근(presence 전용)이고, 값 read는
// credential resolution(gate 5) 경로의 승인 6 key로만 국한된다.
check(
  "runner 코드의 process.env 접근이 승인된 형태만((a) Boolean presence + (b) resolver 승인 6 key 직접 read)",
  (() => {
    const matches = runnerCode.match(/process\s*\.\s*env/g) ?? [];
    const presence = runnerCode.match(/Boolean\(process\.env\[/g) ?? [];
    const directReadRe = new RegExp(`process\\.env\\.(?:${APPROVED_CRED_ENV_KEYS.join("|")})\\b`, "g");
    const directReads = runnerCode.match(directReadRe) ?? [];
    return matches.length === presence.length + directReads.length;
  })(),
);
// resolver의 승인 6 key 직접 read가 실제로 존재한다(wiring 됐다는 positive 확인).
check(
  "runner 코드에 resolveExplicitCredentialsFromRuntimeEnv의 승인 6 key 직접 read가 존재(credential resolution wiring됨)",
  (() => {
    const directReadRe = new RegExp(`process\\.env\\.(?:${APPROVED_CRED_ENV_KEYS.join("|")})\\b`, "g");
    const directReads = runnerCode.match(directReadRe) ?? [];
    return directReads.length === APPROVED_CRED_ENV_KEYS.length;
  })(),
);
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
check("fixture.liveArm.credentialResolutionWiredThisSlice === true (credential resolution wiring됨)", fArm.credentialResolutionWiredThisSlice === true);
check("fixture.liveArm.credentialResolutionHaltError === ACTUAL_API_CALL_NOT_ENABLED_THIS_SLICE", fArm.credentialResolutionHaltError === "ACTUAL_API_CALL_NOT_ENABLED_THIS_SLICE");
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
check("preflight liveArm.credentialResolutionWiredThisSlice === true (credential resolution wiring됨)", pArm?.credentialResolutionWiredThisSlice === true);
check("preflight liveArm.credentialResolutionHaltError === ACTUAL_API_CALL_NOT_ENABLED_THIS_SLICE", pArm?.credentialResolutionHaltError === "ACTUAL_API_CALL_NOT_ENABLED_THIS_SLICE");
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
  // task: dual-platform-actual-api-executor-wiring-no-run-v1 — default duplicate block은 executor 이전 차단.
  check("--live actualApiExecutor 미구성 + actualApiExecutorReached !== true (gate 4 duplicate block이 executor 이전)",
    liveRes?.actualApiExecutor == null && liveRes?.actualApiExecutorReached !== true);
  // task: dual-platform-executor-execution-wiring-no-run-to-arm-ready-v1 — default duplicate block은 dispatcher 이전 차단.
  check("--live actualApiDispatcher 미구성 + actualApiDispatcherReached !== true (gate 4 duplicate block이 dispatcher 이전)",
    liveRes?.actualApiDispatcher == null && liveRes?.actualApiDispatcherReached !== true);
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
check("runner: CREDENTIAL_RESOLUTION_NOT_WIRED_ERROR 상수 존재(하위 호환 참조)", /CREDENTIAL_RESOLUTION_NOT_WIRED_ERROR\s*=\s*"CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE"/.test(runnerRawSrc));
check("runner: --content-unit CLI arg 파싱 존재", /--content-unit/.test(runnerRawSrc) && /resolveContentUnitArg|resolveActiveContentUnit/.test(runnerCode));

// task: dual-platform-credential-resolution-wiring-no-execute-v1
// credential resolution(gate 5)이 wiring됐다: 새 상수 + resolver + 새 halt 상태가 존재해야 한다.
check("runner: CREDENTIAL_RESOLUTION_WIRED_THIS_SLICE === true 상수 존재", /CREDENTIAL_RESOLUTION_WIRED_THIS_SLICE\s*=\s*true/.test(runnerRawSrc));
check("runner: ACTUAL_API_CALL_NOT_ENABLED_ERROR 상수 존재", /ACTUAL_API_CALL_NOT_ENABLED_ERROR\s*=\s*"ACTUAL_API_CALL_NOT_ENABLED_THIS_SLICE"/.test(runnerRawSrc));
check("runner: CREDENTIAL_KEYS_MISSING_ERROR 상수 존재", /CREDENTIAL_KEYS_MISSING_ERROR\s*=\s*"CREDENTIAL_KEYS_MISSING_THIS_SLICE"/.test(runnerRawSrc));
check("runner: resolveExplicitCredentialsFromRuntimeEnv 함수 존재", /function\s+resolveExplicitCredentialsFromRuntimeEnv\s*\(/.test(runnerRawSrc));

// task: dual-platform-custom-content-live-credential-gate-no-execute-v1
// 옛 gate 4.5 무조건 custom halt는 제거됐다. 실행 경로(executeArmedLiveRun)에 무조건 custom halt
// (exitCode:5, custom_content_live_not_enabled)가 남아 있으면 안 된다.
check(
  "runner: executeArmedLiveRun에 옛 무조건 custom halt(exitCode:5)가 남아 있지 않음",
  !/exitCode:\s*5/.test(runnerCode) && !/blockedBy:\s*"custom_content_live_not_enabled"/.test(runnerRawSrc),
);
// custom ready content는 credential resolution(gate 5) 도달 후 exit 4로 fail-closed된다.
// resolved면 ACTUAL_API_CALL_NOT_ENABLED, credential 누락이면 CREDENTIAL_KEYS_MISSING.
check(
  "runner: custom credential-gate fail-closed(exit 4) + 새 halt 상태(ACTUAL_API_CALL_NOT_ENABLED / CREDENTIAL_KEYS_MISSING) 존재",
  /exitCode:\s*4/.test(runnerCode) &&
    /status:\s*ACTUAL_API_CALL_NOT_ENABLED_ERROR/.test(runnerCode) &&
    /status:\s*CREDENTIAL_KEYS_MISSING_ERROR/.test(runnerCode),
);
check(
  "runner: 핵심 안전 순서 — duplicate publish guard(gate 4)가 credential resolution(gate 5) 호출 이전에 평가됨",
  (() => {
    // executeArmedLiveRun 내부에서 gate 4 duplicate block return(DUPLICATE_BLOCKED_STATUS)이
    // gate 5 credential resolution 호출(resolveExplicitCredentialsFromRuntimeEnv())보다 앞서야 한다.
    const dupGateCall = runnerRawSrc.indexOf("const duplicateGate = evaluateDuplicatePublishGuardGate(unit);");
    const credCall = runnerRawSrc.indexOf("const resolution = resolveExplicitCredentialsFromRuntimeEnv();");
    return dupGateCall !== -1 && credCall !== -1 && dupGateCall < credCall;
  })(),
);
// resolver는 승인된 6개 key 값을 in-memory 지역 객체에만 담고, 반환/gate trace에 값을 넣지 않는다.
// (값을 밖으로 내보내는 필드가 없어야 한다: accessToken/refreshToken/readWriteToken 등이 반환 summary에 없음.)
check(
  "runner: resolveExplicitCredentialsFromRuntimeEnv의 summary 반환에 credential 값 필드가 노출되지 않음",
  (() => {
    const fnStart = runnerRawSrc.indexOf("function resolveExplicitCredentialsFromRuntimeEnv");
    const fnEnd = runnerRawSrc.indexOf("\n}\n", fnStart);
    const fnBody = fnStart !== -1 ? runnerRawSrc.slice(fnStart, fnEnd === -1 ? undefined : fnEnd) : "";
    if (fnBody === "") return false;
    // summary 객체({ ... }) 안에 값 필드(accessToken/refreshToken/clientSecret/readWriteToken/businessAccountId/clientId)가
    // 없어야 한다. inMemory 객체에는 있어도 되지만 summary/gate trace로는 새어나가면 안 된다.
    const summaryStart = fnBody.indexOf("summary: {");
    const summaryEnd = fnBody.indexOf("inMemory:", summaryStart);
    const summarySrc = summaryStart !== -1 && summaryEnd !== -1 ? fnBody.slice(summaryStart, summaryEnd) : "";
    return summarySrc !== "" &&
      !/accessToken|refreshToken|clientSecret|readWriteToken|businessAccountId|clientId/.test(summarySrc);
  })(),
);
check(
  "runner: gate 5 credential stub(하위호환)은 여전히 process.env/credential 값을 읽지 않음",
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

// task: dual-platform-actual-api-call-wiring-no-execute-v1
// gate 6 actual_api_call은 no-execute plan builder(buildActualApiCallPlanNoExecute)로 wiring됐다.
// 이 함수는 (a) 존재하고, (b) credential 값을 인자로 받지 않으며(gate 5 presence summary만), (c) process.env를
// 읽지 않고, (d) 반환 plan에 credential 값 필드를 넣지 않으며, (e) live lib import/실제 호출/network를 하지 않는다.
check("runner: buildActualApiCallPlanNoExecute 함수 존재", /function\s+buildActualApiCallPlanNoExecute\s*\(/.test(runnerRawSrc));
{
  const fnStart = runnerRawSrc.indexOf("function buildActualApiCallPlanNoExecute");
  // 다음 정의(PUBLISH_LEDGER_RECORD_FUNCTION_REF 상수 또는 buildActualApiExecutorNoRun) 시작 전까지를 함수 본문으로 본다.
  const nextDefIdx = runnerRawSrc.indexOf("export const PUBLISH_LEDGER_RECORD_FUNCTION_REF", fnStart);
  const fnEnd = nextDefIdx !== -1 ? nextDefIdx : runnerRawSrc.indexOf("function zeroLiveSideEffectCounters", fnStart);
  const fnBody = fnStart !== -1 ? runnerRawSrc.slice(fnStart, fnEnd === -1 ? undefined : fnEnd) : "";
  // 실행 코드만(주석/문자열 리터럴 잡음 최소화) — dropComment 계열이 이 파일에 있으면 그것을 쓰고, 없으면 원문 사용.
  check(
    "runner: buildActualApiCallPlanNoExecute가 process.env를 읽지 않음(credential 값 미접근)",
    fnBody !== "" && !/process\.env/.test(fnBody),
  );
  check(
    "runner: buildActualApiCallPlanNoExecute 반환 plan에 credential 값 필드가 없음(accessToken/refreshToken 등)",
    fnBody !== "" && !/accessToken|refreshToken|clientSecret|readWriteToken|businessAccountId|clientId/.test(fnBody),
  );
  check(
    "runner: buildActualApiCallPlanNoExecute가 live lib import/실제 호출/network를 하지 않음",
    fnBody !== "" &&
      !/\bimport\s*\(/.test(fnBody) &&
      !/\bfetch\s*\(/.test(fnBody) &&
      !/googleapis|youtube\.videos\.insert|graph\.facebook\.com/.test(fnBody) &&
      !/@vercel\/blob|\bput\s*\(|\bhead\s*\(|\bdel\s*\(|\.list\s*\(|\.copy\s*\(/.test(fnBody) &&
      !/oauth2|getToken|refreshAccessToken/i.test(fnBody),
  );
  check(
    "runner: buildActualApiCallPlanNoExecute가 executionEnabled:false + actualCallPerformed:false로 fail-closed",
    fnBody !== "" &&
      /executionEnabledThisSlice:\s*false/.test(fnBody) &&
      /actualApiCallPerformedThisRun:\s*false/.test(fnBody) &&
      /executionEnabled:\s*false/.test(fnBody) &&
      /actualCallPerformed:\s*false/.test(fnBody),
  );
  // gate 6 plan은 credential 값 객체(resolution.inMemory)를 인자로 받지 않는다 — signature는 credSummary(값 없음)만.
  check(
    "runner: 실행 경로가 gate 6 plan에 credential 값 객체(inMemory)를 넘기지 않음(credSummary presence만)",
    /buildActualApiCallPlanNoExecute\(unit,\s*igJob,\s*ytJob,\s*livenessGate,\s*credSummary\)/.test(runnerRawSrc),
  );
}

// task: dual-platform-actual-api-executor-wiring-no-run-v1
// gate 6 no-run executor(buildActualApiExecutorNoRun)로 wiring됐다. 이 함수는 (a) 존재하고,
// (b) plan(값 없음)만 인자로 받으며(credential 값 객체/summary 미수신), (c) process.env를 읽지 않고,
// (d) 반환 executor에 credential 값 필드를 넣지 않으며, (e) live lib/ledger import·호출·network·mutation을
// 하지 않고, (f) executionEnabled/willRun/performed를 false로 fail-closed한다.
check("runner: buildActualApiExecutorNoRun 함수 존재", /function\s+buildActualApiExecutorNoRun\s*\(/.test(runnerRawSrc));
check("runner: PUBLISH_LEDGER_RECORD_FUNCTION_REF 상수(string-ref only) 존재", /PUBLISH_LEDGER_RECORD_FUNCTION_REF\s*=\s*"lib\/publish-ledger\.ts#recordDualPlatformPublish"/.test(runnerRawSrc));
{
  const fnStart = runnerRawSrc.indexOf("function buildActualApiExecutorNoRun");
  // executor 함수 본문 경계: 다음 정의(EXPECTED_DISPATCH_STEP_ORDER 상수 또는 dispatcher 함수) 시작 전까지.
  const fnEnd = runnerRawSrc.indexOf("const EXPECTED_DISPATCH_STEP_ORDER", fnStart);
  const fnBody = fnStart !== -1 ? runnerRawSrc.slice(fnStart, fnEnd === -1 ? undefined : fnEnd) : "";
  check(
    "runner: buildActualApiExecutorNoRun이 process.env를 읽지 않음(credential 값 미접근)",
    fnBody !== "" && !/process\.env/.test(fnBody),
  );
  check(
    "runner: buildActualApiExecutorNoRun 반환 executor에 credential 값 필드가 없음(accessToken/refreshToken 등)",
    fnBody !== "" && !/accessToken|refreshToken|clientSecret|readWriteToken|businessAccountId|clientId/.test(fnBody),
  );
  check(
    "runner: buildActualApiExecutorNoRun이 live lib/ledger import·실제 호출·network·mutation을 하지 않음",
    fnBody !== "" &&
      !/\bimport\s*\(/.test(fnBody) &&
      !/\bfetch\s*\(/.test(fnBody) &&
      !/googleapis|youtube\.videos\.insert|graph\.facebook\.com/.test(fnBody) &&
      !/@vercel\/blob|\bput\s*\(|\bhead\s*\(|\bdel\s*\(|\.list\s*\(|\.copy\s*\(/.test(fnBody) &&
      !/oauth2|getToken|refreshAccessToken/i.test(fnBody) &&
      !/writeFileSync|appendFileSync|\.insert\s*\(|\.upsert\s*\(/.test(fnBody),
  );
  check(
    "runner: buildActualApiExecutorNoRun이 executor/step 실행 플래그를 false로 fail-closed(executorWillRun/executorPerformed + step executionEnabled/willRun/performed)",
    fnBody !== "" &&
      /executionEnabledThisSlice:\s*false/.test(fnBody) &&
      /executorWillRun:\s*false/.test(fnBody) &&
      /executorPerformed:\s*false/.test(fnBody) &&
      /executionEnabled:\s*false/.test(fnBody) &&
      /willRun:\s*false/.test(fnBody) &&
      /performed:\s*false/.test(fnBody) &&
      /actualExecutorRunThisRun:\s*false/.test(fnBody),
  );
  // executor는 credential 값 객체가 아니라 plan(값 없음)만 인자로 받는다 — signature는 plan 하나만.
  check(
    "runner: 실행 경로가 executor에 plan(값 없음)만 넘기고 credential 값 객체를 넘기지 않음",
    /buildActualApiExecutorNoRun\(actualApiCallPlan\)/.test(runnerRawSrc),
  );
  // executor는 gate 6 plan builder 호출 직후(credential resolve 이후)에만 구성된다.
  check(
    "runner: 실행 경로에서 executor 구성이 gate 6 plan 구성 직후에 위치(plan → executor 순서)",
    (() => {
      const planIdx = runnerRawSrc.indexOf("buildActualApiCallPlanNoExecute(unit,");
      const execIdx = runnerRawSrc.indexOf("buildActualApiExecutorNoRun(actualApiCallPlan)");
      return planIdx !== -1 && execIdx !== -1 && planIdx < execIdx;
    })(),
  );
}

// task: dual-platform-executor-execution-wiring-no-run-to-arm-ready-v1
// gate 6 arm-ready no-run dispatcher(buildActualApiDispatcherNoRun)로 wiring됐다. 이 함수는 (a) 존재하고,
// (b) executor(값 없음)만 인자로 받으며(credential 값 객체/summary/env 미수신), (c) process.env를 읽지 않고,
// (d) 반환 dispatcher에 credential 값 필드를 넣지 않으며, (e) live lib/ledger import·호출·network·mutation을
// 하지 않고, (f) dispatch 전역/step 실행 플래그를 false로 fail-closed한다.
check("runner: buildActualApiDispatcherNoRun 함수 존재", /function\s+buildActualApiDispatcherNoRun\s*\(/.test(runnerRawSrc));
check("runner: EXPECTED_DISPATCH_STEP_ORDER 상수(정확한 4-step 순서) 존재", /const\s+EXPECTED_DISPATCH_STEP_ORDER\s*=\s*Object\.freeze/.test(runnerRawSrc));
{
  const fnStart = runnerRawSrc.indexOf("function buildActualApiDispatcherNoRun");
  // dispatcher 함수 본문 경계: 다음 정의(zeroLiveSideEffectCounters) 시작 전까지.
  const fnEnd = runnerRawSrc.indexOf("function zeroLiveSideEffectCounters", fnStart);
  const fnBody = fnStart !== -1 ? runnerRawSrc.slice(fnStart, fnEnd === -1 ? undefined : fnEnd) : "";
  check(
    "runner: buildActualApiDispatcherNoRun이 process.env를 읽지 않음(credential 값 미접근)",
    fnBody !== "" && !/process\.env/.test(fnBody),
  );
  check(
    "runner: buildActualApiDispatcherNoRun 반환 dispatcher에 credential 값 필드가 없음(accessToken/refreshToken 등)",
    fnBody !== "" && !/accessToken|refreshToken|clientSecret|readWriteToken|businessAccountId|clientId/.test(fnBody),
  );
  check(
    "runner: buildActualApiDispatcherNoRun이 live lib/ledger import·실제 호출·network·mutation을 하지 않음",
    fnBody !== "" &&
      !/\bimport\s*\(/.test(fnBody) &&
      !/\bfetch\s*\(/.test(fnBody) &&
      !/googleapis|youtube\.videos\.insert|graph\.facebook\.com/.test(fnBody) &&
      !/@vercel\/blob|\bput\s*\(|\bhead\s*\(|\bdel\s*\(|\.list\s*\(|\.copy\s*\(/.test(fnBody) &&
      !/oauth2|getToken|refreshAccessToken/i.test(fnBody) &&
      !/writeFileSync|appendFileSync|\.insert\s*\(|\.upsert\s*\(/.test(fnBody),
  );
  check(
    "runner: buildActualApiDispatcherNoRun이 dispatcher/step dispatch 플래그를 false로 fail-closed(dispatchEnabledThisSlice/dispatcherWillRun/dispatcherPerformed + step dispatchEnabled/willDispatch/dispatched/performed)",
    fnBody !== "" &&
      /dispatchEnabledThisSlice:\s*false/.test(fnBody) &&
      /dispatcherWillRun:\s*false/.test(fnBody) &&
      /dispatcherPerformed:\s*false/.test(fnBody) &&
      /dispatchEnabled:\s*false/.test(fnBody) &&
      /willDispatch:\s*false/.test(fnBody) &&
      /dispatched:\s*false/.test(fnBody) &&
      /performed:\s*false/.test(fnBody) &&
      /actualDispatcherRunThisRun:\s*false/.test(fnBody),
  );
  // dispatcher는 credential 값 객체가 아니라 executor(값 없음)만 인자로 받는다.
  check(
    "runner: 실행 경로가 dispatcher에 executor(값 없음)만 넘기고 credential 값 객체를 넘기지 않음",
    /buildActualApiDispatcherNoRun\(actualApiExecutor\)/.test(runnerRawSrc),
  );
  // dispatcher는 executor 구성 직후(plan → executor → dispatcher 순서)에만 구성된다.
  check(
    "runner: 실행 경로에서 dispatcher 구성이 executor 구성 직후에 위치(plan → executor → dispatcher 순서)",
    (() => {
      const planIdx = runnerRawSrc.indexOf("buildActualApiCallPlanNoExecute(unit,");
      const execIdx = runnerRawSrc.indexOf("buildActualApiExecutorNoRun(actualApiCallPlan)");
      const dispIdx = runnerRawSrc.indexOf("buildActualApiDispatcherNoRun(actualApiExecutor)");
      return planIdx !== -1 && execIdx !== -1 && dispIdx !== -1 && planIdx < execIdx && execIdx < dispIdx;
    })(),
  );
}

// task: dual-platform-content-unit-manifest-block-reason-fix-v1
//       + dual-platform-custom-content-live-credential-gate-no-execute-v1
//       + dual-platform-credential-resolution-wiring-no-execute-v1
// buildLiveExecutionPlan의 blocked reason이 콘텐츠 종류에 따라 분기되어야 한다(하드코딩 금지).
// credential resolution이 wiring되면서 custom content의 blocked reason은 이제
// actual_api_call_not_enabled_this_slice다(더 이상 credential_resolution_not_wired가 아님).
check(
  "runner: buildLiveExecutionPlan이 willExecuteBlockedReason을 콘텐츠 종류별로 분기(하드코딩 아님)",
  runnerRawSrc.includes('"actual_api_call_not_enabled_this_slice"') &&
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
  check("custom --preflight: customContentLiveHaltError === ACTUAL_API_CALL_NOT_ENABLED_THIS_SLICE", cpf.preflight?.contentUnit?.customContentLiveHaltError === "ACTUAL_API_CALL_NOT_ENABLED_THIS_SLICE");
  check("custom --preflight: customContentCredentialResolutionWiredThisSlice === true (credential resolution wiring됨)", cpf.preflight?.contentUnit?.customContentCredentialResolutionWiredThisSlice === true);
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
    "custom --preflight: liveExecutionPlan.willExecuteBlockedReason === actual_api_call_not_enabled_this_slice (duplicate 사유 아님)",
    cLep?.willExecuteBlockedReason === "actual_api_call_not_enabled_this_slice",
  );
  check(
    "custom --preflight: 모든 step.willExecuteBlockedReason이 actual_api_call_not_enabled_this_slice(duplicate 사유 없음)",
    Array.isArray(cLep?.steps) && cLep.steps.length > 0 &&
      cLep.steps.every((s) => s.willExecuteBlockedReason === "actual_api_call_not_enabled_this_slice"),
  );
  check("custom --preflight: liveExecutionPlan.currentContentDuplicateBlocked === false(duplicate 아님)", cLep?.currentContentDuplicateBlocked === false);
  check("custom --preflight: liveExecutionPlan.isDefaultContentUnit === false", cLep?.isDefaultContentUnit === false);
  check("custom --preflight: liveExecutionPlan.customContentLiveHaltError === ACTUAL_API_CALL_NOT_ENABLED_THIS_SLICE", cLep?.customContentLiveHaltError === "ACTUAL_API_CALL_NOT_ENABLED_THIS_SLICE");
  check("custom --preflight: liveExecutionPlan.customContentCredentialResolutionWiredThisSlice === true", cLep?.customContentCredentialResolutionWiredThisSlice === true);
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
// task: dual-platform-credential-resolution-wiring-no-execute-v1
// (A) dummy-env ready-probe: gate 1~4를 통과하는 custom content가 DUMMY env로 credential resolution(gate 5)에
//     도달해 값을 in-memory로 조립(resolved=true)한 뒤, actual API 실행이 비활성이라
//     ACTUAL_API_CALL_NOT_ENABLED_THIS_SLICE(exit 4)로 fail-closed되는지 검증. DUMMY 값이 출력에 없어야 한다.
// (A2) no-env ready-probe: 같은 content를 env 없이 실행하면 credential 누락으로
//      CREDENTIAL_KEYS_MISSING_THIS_SLICE(exit 4)로 fail-closed되고 '누락 key 이름'만 출력되는지 검증.
// (B) missing-blob probe: source는 있지만 blob evidence가 없는 custom content가 gate 3(blob)에서
//     credential 이전에 fail-closed(exit 3)되는지 검증.
// 모든 probe manifest는 OS temp에 만들었다가 검증 후 정리한다(레포 밖). 실제 .env.local은 절대 읽지 않고
// DUMMY 값만 child env로 주입한다(값 노출 금지). default content source 경로를 재사용해 gate 1~4를 통과시킨다.
const igSrc = defPf?.plan?.jobs?.find?.((j) => j.id === "instagram_job")?.sourcePath;
const ytSrc = defPf?.plan?.jobs?.find?.((j) => j.id === "youtube_job")?.sourcePath;
// DUMMY credential env(child로만 주입, 실제 .env.local 미read). 화이트리스트 OS 변수 + DUMMY 6 key.
const PROBE_SAFE_OS_KEYS = ["SystemRoot","windir","SystemDrive","PATH","Path","PATHEXT","COMSPEC","TEMP","TMP","NUMBER_OF_PROCESSORS","PROCESSOR_ARCHITECTURE"];
const PROBE_DUMMY_VALUE = "credwireguard_dummy_zzz";
function buildProbeBaseEnv() {
  const e = Object.create(null);
  for (const k of PROBE_SAFE_OS_KEYS) if (typeof process.env[k] === "string") e[k] = process.env[k];
  return e;
}
function buildProbeDummyCredEnv() {
  const e = buildProbeBaseEnv();
  for (const k of APPROVED_CRED_ENV_KEYS) e[k] = PROBE_DUMMY_VALUE;
  return e;
}
if (typeof igSrc === "string" && typeof ytSrc === "string" && existsSync(igSrc) && existsSync(ytSrc) && sampleUnit) {
  const probeTmpDir = mkdtempSync(path.join(os.tmpdir(), "dual-platform-cred-gate-probe-"));
  try {
    // ── (A) dummy-env ready-probe: gate 1~4 통과 → credential resolution(gate 5) resolved, exit 4 ──
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
    let readyRawOut = "";
    try {
      const out = execFileSync(process.execPath, [RUNNER_PATH, "--live", "--content-unit", readyProbePath], { cwd: ROOT, encoding: "utf8", timeout: 15000, env: buildProbeDummyCredEnv() });
      readyExit = 0;
      readyRawOut = out;
      readyLive = JSON.parse(out);
    } catch (e) {
      readyExit = typeof e?.status === "number" ? e.status : null;
      readyRawOut = String(e?.stdout || "");
      try { readyLive = JSON.parse(e?.stdout || ""); } catch { readyLive = null; }
    }
    check("custom dummy-env ready-probe --live: exit 4 (credential resolved → actual API not enabled)", readyExit === 4, `exit=${readyExit}`);
    check("custom dummy-env ready-probe --live: status === ACTUAL_API_CALL_NOT_ENABLED_THIS_SLICE", readyLive?.status === "ACTUAL_API_CALL_NOT_ENABLED_THIS_SLICE");
    check("custom dummy-env ready-probe --live: credentialResolutionReached === true", readyLive?.credentialResolutionReached === true);
    check("custom dummy-env ready-probe --live: credentialValuesAccessed === true (gate 5 실제 도달)", readyLive?.credentialValuesAccessed === true);
    check("custom dummy-env ready-probe --live: credentialValuesResolved === true (dummy 6 key 모두 present)", readyLive?.credentialValuesResolved === true);
    // task: dual-platform-actual-api-call-wiring-no-execute-v1
    // gate 6이 no-execute planning gate로 wiring됐다: credential resolve 시 gate 6 plan에 "도달"하지만
    // (actualApiCallReached === true) 실제 API 실행은 비활성(actualApiCallExecutionEnabledThisSlice === false,
    // actualApiCallPerformed === false)이다.
    check("custom dummy-env ready-probe --live: actualApiCallReached === true (gate 6 no-execute plan 도달)", readyLive?.actualApiCallReached === true);
    check("custom dummy-env ready-probe --live: actualApiCallExecutionEnabledThisSlice === false (실제 실행 비활성)", readyLive?.actualApiCallExecutionEnabledThisSlice === false);
    check("custom dummy-env ready-probe --live: actualApiCallPerformed === false (실제 호출 0)", readyLive?.actualApiCallPerformed === false);
    check("custom dummy-env ready-probe --live: credentialResolution.missingCredentialKeyNames === [] (누락 없음)", Array.isArray(readyLive?.credentialResolution?.missingCredentialKeyNames) && readyLive.credentialResolution.missingCredentialKeyNames.length === 0);
    // gate 6 no-execute call plan 구조 검증: 3개 call spec + 실행 비활성 + 실제 호출 0 + credential 값 미포함.
    const apiPlan = readyLive?.actualApiCallPlan;
    check("custom dummy-env ready-probe --live: actualApiCallPlan 존재 + executionEnabledThisSlice === false", apiPlan != null && apiPlan.executionEnabledThisSlice === false && apiPlan.actualApiCallPerformedThisRun === false);
    check("custom dummy-env ready-probe --live: actualApiCallPlan.calls가 3개(blob/instagram/youtube) 모두 executionEnabled false + actualCallPerformed false",
      Array.isArray(apiPlan?.calls) && apiPlan.calls.length === 3 &&
      apiPlan.calls.every((c) => c.executionEnabled === false && c.actualCallPerformed === false && typeof c.functionRef === "string"));
    check("custom dummy-env ready-probe --live: actualApiCallPlan.calls가 explicit credential injection 함수 참조를 담음",
      apiPlan?.calls?.some((c) => c.functionRef === "lib/instagram.ts#uploadInstagramReelWithCredentials") &&
      apiPlan?.calls?.some((c) => c.functionRef === "lib/youtube.ts#uploadYouTubeShortsWithCredentials"));
    check("custom dummy-env ready-probe --live: actualApiCallPlan.calls[*].inputReadiness.credentialsPresent가 presence boolean(값 아님)",
      apiPlan?.calls?.every((c) => typeof c.inputReadiness?.credentialsPresent === "boolean"));
    // 핵심: gate 6 plan에도 DUMMY credential 값이 절대 없다(값 미노출).
    check("custom dummy-env ready-probe --live: actualApiCallPlan에 DUMMY credential 값 없음(값 미노출)",
      apiPlan != null && !JSON.stringify(apiPlan).includes(PROBE_DUMMY_VALUE));

    // ── task: dual-platform-actual-api-executor-wiring-no-run-v1 ──
    // gate 6 plan에서 no-run executor 구조가 구성됐는지 검증한다.
    check("custom dummy-env ready-probe --live: actualApiExecutorReached === true (gate 6 no-run executor 도달)", readyLive?.actualApiExecutorReached === true);
    check("custom dummy-env ready-probe --live: actualApiExecutorExecutionEnabledThisSlice === false + actualApiExecutorPerformed === false",
      readyLive?.actualApiExecutorExecutionEnabledThisSlice === false && readyLive?.actualApiExecutorPerformed === false);
    const executor = readyLive?.actualApiExecutor;
    check("custom dummy-env ready-probe --live: actualApiExecutor 존재 + executorWillRun/executorPerformed === false",
      executor != null && executor.executionEnabledThisSlice === false && executor.executorWillRun === false && executor.executorPerformed === false && executor.actualExecutorRunThisRun === false);
    // executor는 정확히 4개 ordered step(blob → instagram publish → youtube → ledger)이어야 한다.
    const EXPECTED_STEP_IDS = ["instagram_blob_upload", "instagram_publish_reel", "youtube_direct_upload", "publish_ledger_record"];
    check("custom dummy-env ready-probe --live: actualApiExecutor.steps가 정확히 4개이고 order 1~4 순서 정합",
      Array.isArray(executor?.steps) && executor.steps.length === 4 &&
      executor.steps.every((s, i) => s.order === i + 1 && s.id === EXPECTED_STEP_IDS[i]));
    check("custom dummy-env ready-probe --live: actualApiExecutor.orderedStepIds가 기대 순서와 일치",
      Array.isArray(executor?.orderedStepIds) && executor.orderedStepIds.length === 4 &&
      EXPECTED_STEP_IDS.every((id, i) => executor.orderedStepIds[i] === id));
    // 모든 step은 executionEnabled/willRun/performed === false.
    check("custom dummy-env ready-probe --live: actualApiExecutor 모든 step이 executionEnabled/willRun/performed === false",
      executor?.steps?.every((s) => s.executionEnabled === false && s.willRun === false && s.performed === false));
    // 각 step은 functionRef 또는 executorRef 문자열을 담는다(ledger는 executorRef).
    check("custom dummy-env ready-probe --live: actualApiExecutor step들이 functionRef/executorRef 문자열을 담음(ledger는 executorRef)",
      executor?.steps?.every((s) => typeof s.functionRef === "string" || typeof s.executorRef === "string") &&
      executor?.steps?.find((s) => s.id === "publish_ledger_record")?.executorRef === "lib/publish-ledger.ts#recordDualPlatformPublish");
    // dependsOn 관계: instagram publish는 blob upload에, ledger는 instagram publish + youtube upload에 의존.
    const stepById = (id) => executor?.steps?.find((s) => s.id === id) ?? null;
    check("custom dummy-env ready-probe --live: instagram_publish_reel이 instagram_blob_upload에 의존",
      Array.isArray(stepById("instagram_publish_reel")?.dependsOn) && stepById("instagram_publish_reel").dependsOn.includes("instagram_blob_upload"));
    check("custom dummy-env ready-probe --live: publish_ledger_record가 instagram_publish_reel + youtube_direct_upload에 의존",
      Array.isArray(stepById("publish_ledger_record")?.dependsOn) &&
      stepById("publish_ledger_record").dependsOn.includes("instagram_publish_reel") &&
      stepById("publish_ledger_record").dependsOn.includes("youtube_direct_upload"));
    check("custom dummy-env ready-probe --live: instagram_blob_upload와 youtube_direct_upload는 dependsOn 없음(독립)",
      Array.isArray(stepById("instagram_blob_upload")?.dependsOn) && stepById("instagram_blob_upload").dependsOn.length === 0 &&
      Array.isArray(stepById("youtube_direct_upload")?.dependsOn) && stepById("youtube_direct_upload").dependsOn.length === 0);
    // ledger step은 no-mutation임을 명시(ledgerMutationThisSlice === false).
    check("custom dummy-env ready-probe --live: publish_ledger_record가 no-mutation(ledgerMutationThisSlice === false)",
      stepById("publish_ledger_record")?.inputReadiness?.ledgerMutationThisSlice === false);
    // step credentialsPresent는 presence boolean(값 아님).
    check("custom dummy-env ready-probe --live: executor step inputReadiness.credentialsPresent가 presence boolean(값 아님)",
      executor?.steps?.filter((s) => "credentialsPresent" in (s.inputReadiness ?? {})).every((s) => typeof s.inputReadiness.credentialsPresent === "boolean"));
    // 핵심: executor에도 DUMMY credential 값이 절대 없다(값 미노출).
    check("custom dummy-env ready-probe --live: actualApiExecutor에 DUMMY credential 값 없음(값 미노출)",
      executor != null && !JSON.stringify(executor).includes(PROBE_DUMMY_VALUE));

    // ── task: dual-platform-executor-execution-wiring-no-run-to-arm-ready-v1 ──
    // gate 6 executor에서 arm-ready no-run dispatcher 구조가 구성됐는지 검증한다.
    check("custom dummy-env ready-probe --live: actualApiDispatcherReached === true (gate 6 arm-ready dispatcher 도달)", readyLive?.actualApiDispatcherReached === true);
    check("custom dummy-env ready-probe --live: actualApiDispatcherEnabledThisSlice === false + actualApiDispatcherPerformed === false",
      readyLive?.actualApiDispatcherEnabledThisSlice === false && readyLive?.actualApiDispatcherPerformed === false);
    const dispatcher = readyLive?.actualApiDispatcher;
    check("custom dummy-env ready-probe --live: actualApiDispatcher 존재 + dispatchEnabled/willRun/performed === false",
      dispatcher != null && dispatcher.dispatchEnabledThisSlice === false && dispatcher.dispatcherWillRun === false && dispatcher.dispatcherPerformed === false && dispatcher.actualDispatcherRunThisRun === false);
    check("custom dummy-env ready-probe --live: actualApiDispatcher.executorAccepted === true (기대 4-step disabled 구조 수용)", dispatcher?.executorAccepted === true);
    check("custom dummy-env ready-probe --live: actualApiDispatcher.dispatcherDisabledReason === actual_api_dispatcher_execution_disabled_this_slice",
      dispatcher?.dispatcherDisabledReason === "actual_api_dispatcher_execution_disabled_this_slice");
    // dispatcher는 정확히 4개 ordered dispatch step(blob → instagram publish → youtube → ledger)이어야 한다.
    check("custom dummy-env ready-probe --live: actualApiDispatcher.dispatchSteps가 정확히 4개이고 order 1~4 순서 정합",
      Array.isArray(dispatcher?.dispatchSteps) && dispatcher.dispatchSteps.length === 4 &&
      dispatcher.dispatchSteps.every((s, i) => s.order === i + 1 && s.id === EXPECTED_STEP_IDS[i]));
    check("custom dummy-env ready-probe --live: actualApiDispatcher.orderedStepIds가 기대 순서와 일치",
      Array.isArray(dispatcher?.orderedStepIds) && dispatcher.orderedStepIds.length === 4 &&
      EXPECTED_STEP_IDS.every((id, i) => dispatcher.orderedStepIds[i] === id));
    // 모든 dispatch step은 dispatchEnabled/willDispatch/dispatched/performed === false.
    check("custom dummy-env ready-probe --live: actualApiDispatcher 모든 step이 dispatchEnabled/willDispatch/dispatched/performed === false",
      dispatcher?.dispatchSteps?.every((s) => s.dispatchEnabled === false && s.willDispatch === false && s.dispatched === false && s.performed === false));
    // 각 dispatch step은 adapterTarget 문자열 메타데이터를 담는다(ledger 포함 — string-only).
    check("custom dummy-env ready-probe --live: actualApiDispatcher step들이 adapterTarget 문자열을 담음(ledger는 ledger ref)",
      dispatcher?.dispatchSteps?.every((s) => typeof s.adapterTarget === "string") &&
      dispatcher?.dispatchSteps?.find((s) => s.id === "publish_ledger_record")?.adapterTarget === "lib/publish-ledger.ts#recordDualPlatformPublish");
    // dispatcher dependsOn 관계: instagram publish는 blob upload에, ledger는 instagram publish + youtube upload에 의존.
    const dispStepById = (id) => dispatcher?.dispatchSteps?.find((s) => s.id === id) ?? null;
    check("custom dummy-env ready-probe --live: dispatcher instagram_publish_reel이 instagram_blob_upload에 의존",
      Array.isArray(dispStepById("instagram_publish_reel")?.dependsOn) && dispStepById("instagram_publish_reel").dependsOn.includes("instagram_blob_upload"));
    check("custom dummy-env ready-probe --live: dispatcher publish_ledger_record가 instagram_publish_reel + youtube_direct_upload에 의존",
      Array.isArray(dispStepById("publish_ledger_record")?.dependsOn) &&
      dispStepById("publish_ledger_record").dependsOn.includes("instagram_publish_reel") &&
      dispStepById("publish_ledger_record").dependsOn.includes("youtube_direct_upload"));
    check("custom dummy-env ready-probe --live: dispatcher instagram_blob_upload와 youtube_direct_upload는 dependsOn 없음(독립)",
      Array.isArray(dispStepById("instagram_blob_upload")?.dependsOn) && dispStepById("instagram_blob_upload").dependsOn.length === 0 &&
      Array.isArray(dispStepById("youtube_direct_upload")?.dependsOn) && dispStepById("youtube_direct_upload").dependsOn.length === 0);
    // dispatcher dependencySatisfiedInStructure는 boolean(구조 존재성만, 값 아님).
    check("custom dummy-env ready-probe --live: dispatcher step dependencySatisfiedInStructure가 boolean(구조 존재성만)",
      dispatcher?.dispatchSteps?.every((s) => typeof s.dependencySatisfiedInStructure === "boolean"));
    // 핵심: dispatcher에도 DUMMY credential 값이 절대 없다(값 미노출).
    check("custom dummy-env ready-probe --live: actualApiDispatcher에 DUMMY credential 값 없음(값 미노출)",
      dispatcher != null && !JSON.stringify(dispatcher).includes(PROBE_DUMMY_VALUE));

    // 핵심: DUMMY credential 값이 출력 어디에도 나타나지 않는다(값 미노출).
    check("custom dummy-env ready-probe --live: DUMMY credential 값이 출력에 없음(값 미노출)", readyRawOut !== "" && !readyRawOut.includes(PROBE_DUMMY_VALUE));
    // value length/hash/prefix/suffix/masked/token type 파생 필드가 출력에 없다.
    check("custom dummy-env ready-probe --live: value 파생 필드(length/hash/prefix/suffix/masked/tokenType) 없음",
      !/"(valueLength|length|hash|prefix|suffix|sample|masked|redactedValue|firstChars|lastChars|tokenType)"\s*:/.test(readyRawOut));
    const rpc = readyLive?.sideEffectCounters ?? {};
    // credential access/resolve counter는 1일 수 있으나 API/upload/blob/ledger/video counter는 반드시 0.
    check("custom dummy-env ready-probe --live: actual API/upload/blob/ledger/video counter 모두 0",
      rpc.instagramApiCallCount === 0 && rpc.youtubeApiCallCount === 0 && rpc.youtubeOauthTokenRequestCount === 0 &&
      rpc.youtubeUploadCallCount === 0 && rpc.blobMutationCount === 0 && rpc.ledgerMutationCount === 0 &&
      rpc.newVideoGeneratedCount === 0 && rpc.dotEnvLocalDirectAccessCount === 0 && rpc.envSecretValuePrintCount === 0);
    check("custom dummy-env ready-probe --live: credentialValuesAccessedCount === 1, credentialValuesResolvedCount === 1", rpc.credentialValuesAccessedCount === 1 && rpc.credentialValuesResolvedCount === 1);

    // ── (A2) no-env ready-probe: credential 누락 → CREDENTIAL_KEYS_MISSING, 누락 이름만 ──
    let missLive = null;
    let missExit = null;
    let missRawOut = "";
    try {
      const out = execFileSync(process.execPath, [RUNNER_PATH, "--live", "--content-unit", readyProbePath], { cwd: ROOT, encoding: "utf8", timeout: 15000, env: buildProbeBaseEnv() });
      missExit = 0;
      missRawOut = out;
      missLive = JSON.parse(out);
    } catch (e) {
      missExit = typeof e?.status === "number" ? e.status : null;
      missRawOut = String(e?.stdout || "");
      try { missLive = JSON.parse(e?.stdout || ""); } catch { missLive = null; }
    }
    check("custom no-env ready-probe --live: exit 4 (credential 누락 fail-closed)", missExit === 4, `exit=${missExit}`);
    check("custom no-env ready-probe --live: status === CREDENTIAL_KEYS_MISSING_THIS_SLICE", missLive?.status === "CREDENTIAL_KEYS_MISSING_THIS_SLICE");
    check("custom no-env ready-probe --live: credentialResolutionReached === true", missLive?.credentialResolutionReached === true);
    check("custom no-env ready-probe --live: credentialValuesResolved === false", missLive?.credentialValuesResolved === false);
    check("custom no-env ready-probe --live: actualApiCallReached === false", missLive?.actualApiCallReached === false);
    // task: dual-platform-actual-api-executor-wiring-no-run-v1 — credential 누락이면 executor도 구성되지 않는다.
    check("custom no-env ready-probe --live: actualApiExecutor 미구성 + actualApiExecutorReached !== true (gate 5에서 executor 이전 차단)",
      missLive?.actualApiExecutor == null && missLive?.actualApiExecutorReached !== true);
    // task: dual-platform-executor-execution-wiring-no-run-to-arm-ready-v1 — credential 누락이면 dispatcher도 구성되지 않는다.
    check("custom no-env ready-probe --live: actualApiDispatcher 미구성 + actualApiDispatcherReached !== true (gate 5에서 dispatcher 이전 차단)",
      missLive?.actualApiDispatcher == null && missLive?.actualApiDispatcherReached !== true);
    check("custom no-env ready-probe --live: missingCredentialKeyNames가 승인 6 key 이름을 담음(값 아님)",
      Array.isArray(missLive?.credentialResolution?.missingCredentialKeyNames) &&
      APPROVED_CRED_ENV_KEYS.every((k) => missLive.credentialResolution.missingCredentialKeyNames.includes(k)));
    check("custom no-env ready-probe --live: 출력에 secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(missRawOut));
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
    check("custom dummy-env ready-probe: gate 5 credential_presence_resolution evaluated & reached (wiredThisSlice true, resolved true)", g5?.gate === "credential_presence_resolution" && g5?.evaluated === true && g5?.reached === true && g5?.wiredThisSlice === true && g5?.credentialValuesResolved === true);
    check("custom dummy-env ready-probe: gate 5 gate trace에 credential 값이 없음(missingCredentialKeyNames 이름만)", (() => {
      const j = JSON.stringify(g5 ?? {});
      return !j.includes(PROBE_DUMMY_VALUE) && Array.isArray(g5?.missingCredentialKeyNames);
    })());
    // task: dual-platform-actual-api-call-wiring-no-execute-v1
    // gate 6은 이제 no-execute planning gate로 evaluated & reached true지만 실행은 비활성(executionEnabledThisSlice
    // false, actualCallPerformed false)이고 blockedBy는 여전히 actual_api_call_not_enabled_this_slice다.
    check("custom dummy-env ready-probe: gate 6 actual_api_call evaluated & reached (no-execute plan), 실행 비활성 & 실제 호출 0",
      g6?.gate === "actual_api_call" && g6?.evaluated === true && g6?.reached === true &&
      g6?.executionEnabledThisSlice === false && g6?.actualCallPerformed === false &&
      g6?.blockedBy === "actual_api_call_not_enabled_this_slice");
    // task: dual-platform-actual-api-executor-wiring-no-run-v1 — gate 6 trace에 executor 실행 비활성 플래그 명시.
    check("custom dummy-env ready-probe: gate 6 trace가 executorWillRun/executorPerformed === false를 명시",
      g6?.executorWillRun === false && g6?.executorPerformed === false);
    // task: dual-platform-executor-execution-wiring-no-run-to-arm-ready-v1 — gate 6 trace에 dispatcher 실행 비활성 플래그 명시.
    check("custom dummy-env ready-probe: gate 6 trace가 dispatchEnabledThisSlice/dispatcherWillRun/dispatcherPerformed === false를 명시",
      g6?.dispatchEnabledThisSlice === false && g6?.dispatcherWillRun === false && g6?.dispatcherPerformed === false);
    check("custom dummy-env ready-probe: stdout에 secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(JSON.stringify(readyLive)));

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
      // dummy credential env를 주입해도 gate 3(blob)에서 credential 이전에 막혀야 한다(순서 검증).
      const out = execFileSync(process.execPath, [RUNNER_PATH, "--live", "--content-unit", noBlobProbePath], { cwd: ROOT, encoding: "utf8", timeout: 15000, env: buildProbeDummyCredEnv() });
      noBlobExit = 0;
      noBlobLive = JSON.parse(out);
    } catch (e) {
      noBlobExit = typeof e?.status === "number" ? e.status : null;
      try { noBlobLive = JSON.parse(e?.stdout || ""); } catch { noBlobLive = null; }
    }
    check("custom missing-blob probe --live: exit 3 (gate 3 blob evidence fail-closed, credential 이전)", noBlobExit === 3, `exit=${noBlobExit}`);
    check("custom missing-blob probe --live: status === BLOCKED_BLOB_LIVENESS_EVIDENCE", noBlobLive?.status === "BLOCKED_BLOB_LIVENESS_EVIDENCE");
    check("custom missing-blob probe --live: credentialResolutionReached === false (credential 미도달)", noBlobLive?.credentialResolutionReached === false);
    check("custom missing-blob probe --live: credentialValuesAccessed === false (gate 3 block이 credential 이전)", noBlobLive?.credentialValuesAccessed === false);
    check("custom missing-blob probe --live: actualApiCallReached === false", noBlobLive?.actualApiCallReached === false);
    const nbt = Array.isArray(noBlobLive?.gateTrace) ? noBlobLive.gateTrace : [];
    check("custom missing-blob probe: gate 5 credential이 gate trace에 없음(미도달)", !nbt.find((g) => g.order === 5));
    const nbc = noBlobLive?.sideEffectCounters ?? {};
    check("custom missing-blob probe --live: 모든 side-effect counter 0(credential access 포함)", Object.keys(nbc).length > 0 && Object.values(nbc).every((v) => v === 0));
  } finally {
    try { rmSync(probeTmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
} else {
  // source 파일이 환경에 없으면 credential gate 런타임 도달은 검증 불가 — 소스 정적 계약으로만 커버함을 명시.
  check("custom --live credential-gate 런타임 검증 skip(default source 파일 미존재) — 소스 정적 계약(7a)로 커버", true, "환경상 default source mp4 부재");
}

// ── 8) redacted credential preflight (dual-platform-credential-preflight-redacted-no-live-v1) ──
// key 이름 + present boolean만 보고하고 credential 값/길이/prefix/hash를 노출하지 않는 no-live mode.

console.log("\n[ credential preflight: --credential-preflight (redacted presence, no values) ]");

// 8a) runner 소스: mode 판정 + redacted presence helper 계약이 코드에 존재
check("runner: resolveMode가 --credential-preflight를 credential_preflight로 판정", /--credential-preflight/.test(runnerRawSrc) && /"credential_preflight"/.test(runnerRawSrc));
check("runner: buildCredentialPreflight 함수 존재", /function buildCredentialPreflight\(/.test(runnerRawSrc));
check("runner: isEnvKeyPresentRedacted가 Boolean(process.env[...])로 presence만 판정(값 미바인딩)", /function isEnvKeyPresentRedacted\([\s\S]{0,120}Boolean\(process\.env\[/.test(runnerRawSrc));
check(
  "runner: credential preflight가 env 값에서 파생 정보를 추출하지 않음(process.env[...] 뒤 length/slice/substring 등 연산 없음, crypto/hash 없음)",
  (() => {
    // 실제 코드 연산만 검사한다(runnerCode = 주석/문자열 제거). 값 파생 접근 패턴이 없어야 한다.
    // Boolean(process.env[...]) presence 판정만 허용되며, 값을 .length/.slice 등으로 파생하면 위반.
    return !/process\.env\[[^\]]*\]\s*\.\s*(length|slice|substring|substr|charAt|indexOf|split|replace|match|toString|padStart|padEnd|normalize|codePointAt)/.test(runnerCode) &&
      !/process\.env\.[A-Za-z_][A-Za-z0-9_]*\s*\.\s*(length|slice|substring)/.test(runnerCode) &&
      !/createHash|createHmac|\.digest\s*\(/.test(runnerCode);
  })(),
);

// 8b) 실행: default --credential-preflight → exit 0 + redacted 계약
let cpDefault = null;
let cpDefaultExit = null;
try {
  const out = execFileSync(process.execPath, [RUNNER_PATH, "--credential-preflight"], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
  cpDefaultExit = 0;
  cpDefault = JSON.parse(out);
} catch (e) {
  cpDefaultExit = typeof e?.status === "number" ? e.status : null;
  try { cpDefault = JSON.parse(e?.stdout || ""); } catch { cpDefault = null; }
}
check("credential-preflight default: exit 0 (status-style diagnostic)", cpDefaultExit === 0, `exit=${cpDefaultExit}`);
check("credential-preflight default: mode === credential_preflight", cpDefault?.mode === "credential_preflight");
check("credential-preflight default: isDefaultContentUnit === true", cpDefault?.isDefaultContentUnit === true);
check("credential-preflight default: credentialValuesAccessed === false", cpDefault?.credentialValuesAccessed === false);
check("credential-preflight default: credentialValuesResolved === false", cpDefault?.credentialValuesResolved === false);
check("credential-preflight default: credentialValuesPrinted === false", cpDefault?.credentialValuesPrinted === false);
check("credential-preflight default: dotEnvLocalDirectAccess === false", cpDefault?.dotEnvLocalDirectAccess === false);
check("credential-preflight default: externalApiCallPerformed === false", cpDefault?.externalApiCallPerformed === false);
// task: dual-platform-credential-resolution-wiring-no-execute-v1
// credential resolution 코드 경로는 wiring됐지만(true), 이 preflight 모드는 값 미접근이고 actual API 실행/
// live publish는 비활성이다 — publish 활성화로 오인되면 안 된다(아래 두 필드로 명시).
check("credential-preflight default: credentialResolutionWiredThisSlice === true (코드 경로 wiring됨)", cpDefault?.credentialResolutionWiredThisSlice === true);
check("credential-preflight default: credentialValuesAccessedInThisMode === false (preflight 모드는 값 미접근)", cpDefault?.credentialValuesAccessedInThisMode === false);
check("credential-preflight default: actualApiExecutionEnabledThisSlice === false (실제 publish 비활성)", cpDefault?.actualApiExecutionEnabledThisSlice === false);

// requiredEnvKeyNames가 승인된 6개 key와 정확히 일치
const cpKeyNames = cpDefault?.requiredEnvKeyNames ?? {};
check(
  "credential-preflight: requiredEnvKeyNames가 승인된 6개 key와 정확히 일치",
  JSON.stringify(cpKeyNames.instagram) === JSON.stringify(["INSTAGRAM_BUSINESS_ACCOUNT_ID", "INSTAGRAM_ACCESS_TOKEN"]) &&
    JSON.stringify(cpKeyNames.youtube) === JSON.stringify(["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"]) &&
    JSON.stringify(cpKeyNames.vercelBlob) === JSON.stringify(["BLOB_READ_WRITE_TOKEN"]),
);

// platforms.*.keys가 { name, present } 형태만 가짐(값/길이/hash 필드 없음)
const cpAllKeyEntries = [
  ...(cpDefault?.platforms?.instagram?.keys ?? []),
  ...(cpDefault?.platforms?.youtube?.keys ?? []),
  ...(cpDefault?.platforms?.vercelBlob?.keys ?? []),
];
check("credential-preflight: 각 key 엔트리는 name(string)+present(boolean) 필드만 가짐(값/길이/hash 필드 없음)",
  cpAllKeyEntries.length === 6 &&
    cpAllKeyEntries.every((k) => {
      const fields = Object.keys(k).sort();
      return JSON.stringify(fields) === JSON.stringify(["name", "present"]) &&
        typeof k.name === "string" && typeof k.present === "boolean";
    }),
);
check("credential-preflight default: env 미설정 시 present 전부 false + allRequiredKeysPresent false", cpAllKeyEntries.every((k) => k.present === false) && cpDefault?.allRequiredKeysPresent === false && cpDefault?.readyForCredentialResolution === false);

// 출력 전체에 value length/hash/prefix/suffix/sample 파생 필드 이름이 없어야 함
const cpDefaultStr = JSON.stringify(cpDefault ?? {});
check("credential-preflight: 출력에 value length/hash/prefix/suffix/sample 필드 없음",
  !/"(valueLength|length|hash|prefix|suffix|sample|charCount|byteLength|masked|redactedValue|firstChars|lastChars|tokenType)"\s*:/.test(cpDefaultStr));
check("credential-preflight: 출력에 secret-shaped value 없음(EAA/ya29/vercel_blob_rw_)",
  !/(EAA[A-Za-z0-9]{10}|ya29\.[A-Za-z0-9_-]{10}|vercel_blob_rw_[A-Za-z0-9]{6})/.test(cpDefaultStr));

// 8c) 실행: 모든 6개 key를 더미값으로 설정 → present:true지만 값은 출력에 절대 나타나지 않음.
// sanitized child env를 쓴다(parent env 전체 spread 금지 — 우발적 secret 상속 방지).
const DUMMY = "guardprobe_dummy_value_zzz";
const cpEnv = buildSanitizedProbeEnv(
  [...(cpKeyNames.instagram ?? []), ...(cpKeyNames.youtube ?? []), ...(cpKeyNames.vercelBlob ?? [])],
  DUMMY,
);
let cpPresent = null;
let cpPresentExit = null;
let cpPresentRaw = "";
try {
  cpPresentRaw = execFileSync(process.execPath, [RUNNER_PATH, "--credential-preflight"], { cwd: ROOT, encoding: "utf8", timeout: 15000, env: cpEnv });
  cpPresentExit = 0;
  cpPresent = JSON.parse(cpPresentRaw);
} catch (e) {
  cpPresentExit = typeof e?.status === "number" ? e.status : null;
  cpPresentRaw = e?.stdout || "";
  try { cpPresent = JSON.parse(cpPresentRaw); } catch { cpPresent = null; }
}
check("credential-preflight present-probe: exit 0", cpPresentExit === 0, `exit=${cpPresentExit}`);
check("credential-preflight present-probe: 모든 key present === true + allRequiredKeysPresent true + readyForCredentialResolution true",
  (() => {
    const all = [
      ...(cpPresent?.platforms?.instagram?.keys ?? []),
      ...(cpPresent?.platforms?.youtube?.keys ?? []),
      ...(cpPresent?.platforms?.vercelBlob?.keys ?? []),
    ];
    return all.length === 6 && all.every((k) => k.present === true) &&
      cpPresent?.allRequiredKeysPresent === true && cpPresent?.readyForCredentialResolution === true;
  })(),
);
check("credential-preflight present-probe: 더미 credential 값이 출력에 절대 나타나지 않음(값 미노출)", cpPresentRaw !== "" && !cpPresentRaw.includes(DUMMY));
// task: dual-platform-credential-resolution-wiring-no-execute-v1
// present:true + credentialResolutionWiredThisSlice:true여도 이 preflight 모드는 값 미접근이고 actual API
// 실행이 비활성이다 — publish 활성화로 오인되면 안 된다.
check("credential-preflight present-probe: present:true & credentialResolutionWiredThisSlice === true (코드 경로 wiring됨)", cpPresent?.credentialResolutionWiredThisSlice === true);
check("credential-preflight present-probe: present:true여도 credentialValuesAccessedInThisMode === false(preflight 값 미접근)", cpPresent?.credentialValuesAccessedInThisMode === false);
check("credential-preflight present-probe: present:true여도 actualApiExecutionEnabledThisSlice === false(실제 publish 비활성)", cpPresent?.actualApiExecutionEnabledThisSlice === false);

// 8d) runner 소스: credential-preflight 경로가 .env.local/secret 파일 read 또는 external live 호출을 추가하지 않음
check("runner: 소스에 .env.local / .env 파일 read 실행 코드 없음(주석/문자열 제외)",
  !/\.env\.local/.test(runnerCode) && !/readFileSync\([^)]*\.env/.test(runnerCode) && !/require\(["']dotenv["']\)|from ["']dotenv["']/.test(runnerRawSrc));
check("runner: credential-preflight가 fetch/googleapis/@vercel\\/blob/ffmpeg/deploy 실행 패턴을 추가하지 않음",
  !/\bfetch\s*\(/.test(runnerCode) && !/googleapis/.test(runnerCode) && !/@vercel\/blob/.test(runnerCode) &&
    !/child_process|execSync|spawnSync/.test(runnerCode) && !/ffmpeg|ffprobe/.test(runnerCode));

// 8e) live behavior 회귀: default --live 여전히 exit 3 (credential-preflight 추가가 live 동작을 바꾸지 않음)
let liveRegExit = null;
try {
  execFileSync(process.execPath, [RUNNER_PATH, "--live"], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
  liveRegExit = 0;
} catch (e) { liveRegExit = typeof e?.status === "number" ? e.status : null; }
check("live behavior 불변: default --live 여전히 exit 3 (BLOCKED_DUPLICATE_ALREADY_PUBLISHED)", liveRegExit === 3, `exit=${liveRegExit}`);

// 8f) self-regression: 두 guard 소스가 parent env 전체 spread(`{ ...process.env }`)를 쓰지 않음.
// 실제 spread 문법(여는 괄호/중괄호/대괄호/콤마 뒤의 ...process.env)만 매치한다 — 주석/문자열/정규식
// 리터럴 안의 단독 "...process.env" 텍스트는 매치하지 않으므로 이 검증 자신을 오탐하지 않는다.
// (strip 함수는 정규식 리터럴을 처리하지 못하므로 strip에 의존하지 않고 spread 문법 자체를 좁혀 검사.)
const OWNER_GUARD_PATH = path.join(ROOT, "scripts", "check-owner-daily-automation-entrypoint-static.mjs");
// 주석 라인(//, *로 시작)만 제거한 뒤, 실제 spread 문법을 검사한다.
const dropCommentLines = (s) => s.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
const spreadSyntaxRe = /[{[(,]\s*\.\.\.\s*process\s*\.\s*env\b/; // 실제 spread 표현식만
{
  const selfCode = dropCommentLines(existsSync(SELF) ? readFileSync(SELF, "utf8") : "");
  const ownerCode = dropCommentLines(existsSync(OWNER_GUARD_PATH) ? readFileSync(OWNER_GUARD_PATH, "utf8") : "");
  check("self-regression: orchestrator guard 소스에 parent env 전체 spread 표현식 없음(sanitized child env만 사용)", !spreadSyntaxRe.test(selfCode));
  check("self-regression: owner guard 소스에 parent env 전체 spread 표현식 없음(sanitized child env만 사용)", ownerCode !== "" && !spreadSyntaxRe.test(ownerCode));
  // present-probe helper가 승인된 non-secret OS whitelist + dummy key만 상속하는지(소스 계약).
  check("self-regression: present-probe가 sanitized child env helper(buildSanitizedProbeEnv)를 사용", selfCode.includes("buildSanitizedProbeEnv"));
  check("self-regression: sanitized child env가 화이트리스트(SAFE_CHILD_OS_ENV_KEYS) 기반", selfCode.includes("SAFE_CHILD_OS_ENV_KEYS"));
}
// task: dual-platform-credential-resolution-wiring-no-execute-v1
// approved runner env 접근은 (a) Boolean(process.env[keyName]) presence + (b) resolver의 승인 6 key
// 직접 read(process.env.<APPROVED_KEY>)만임을 재확인(회귀 방지 — 임의 key read/순회 유입 차단).
check("self-regression: runner의 env 접근이 승인된 두 형태((a) Boolean presence + (b) 승인 6 key 직접 read)만 사용",
  (() => {
    const all = runnerCode.match(/process\s*\.\s*env/g) ?? [];
    const presence = runnerCode.match(/Boolean\(process\.env\[/g) ?? [];
    const directReadRe = new RegExp(`process\\.env\\.(?:${APPROVED_CRED_ENV_KEYS.join("|")})\\b`, "g");
    const directReads = runnerCode.match(directReadRe) ?? [];
    return all.length === presence.length + directReads.length;
  })());
// guard 자신이 secret-shaped value를 출력하지 않는지(수집된 stdout 검증 대상 전체).
check("self-regression: guard가 다룬 출력에 secret-shaped value 없음(EAA/ya29/vercel_blob_rw_)",
  [cpDefaultStr, cpPresentRaw ?? ""].every((s) => !/(EAA[A-Za-z0-9]{10}|ya29\.[A-Za-z0-9_-]{10}|vercel_blob_rw_[A-Za-z0-9]{6})/.test(s)));

// ── 요약 ────────────────────────────────────────────────────────────────

console.log(`\n${passes} PASS / ${failures} FAIL`);
if (failures > 0) process.exit(1);
