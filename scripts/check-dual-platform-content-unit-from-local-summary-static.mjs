#!/usr/bin/env node
/**
 * check-dual-platform-content-unit-from-local-summary-static.mjs
 *
 * task: local-pipeline-content-unit-manifest-bridge-no-live-v1
 *
 * scripts/build-dual-platform-content-unit-from-local-summary.mjs 정적 가드.
 * no-live: 레포 내 fixture JSON + builder 소스 텍스트, 그리고 builder/owner-entrypoint를
 * child_process로 실행한 stdout/생성 파일(JSON)만 읽는다. 네트워크/env/secret 접근 없음,
 * ffmpeg/media 생성 없음, Instagram/YouTube API/Blob 호출 없음.
 *
 * 검증:
 *  1) builder 소스: process.env 미접근, fetch/axios/googleapis 없음, ffmpeg/spawnSync 없음,
 *     shell:true 없음, out-dir repo-root 검증 존재, .money-shorts-local 차단 존재.
 *  2) sample fixture(summary + upload-ready-packet + blob-liveness-result) JSON parse.
 *  3) builder를 실제로 실행(체크인된 sample fixture만 사용, out-dir은 repo 밖 OS temp)해
 *     생성된 manifest/build-summary의 readiness booleans가 정확한지 확인:
 *     - instagramSourceReady:false (sample sourceVideoPath가 의도적으로 미존재)
 *     - youtubeSourceReady:false (--youtube-source 미지정 시 placeholder)
 *     - metadataReady:false (hashtag 4개 < 8, captionFirstLineHook/callToAction 없음)
 *     - blobLivenessEvidenceReady:false (--blob-liveness-result 미지정)
 *     - contentUnitPreflightExpectedReady:false
 *  4) --blob-liveness-result를 지정하면 blobLivenessEvidenceReady:true로 전환됨을 확인.
 *  5) 생성된 manifest를 dual-platform orchestrator --preflight --content-unit에 그대로
 *     전달해 isDefaultContentUnit:false + preflightOk:false(예상된 fail-closed)로 파싱됨을 확인.
 *  6) owner entrypoint --build-content-unit 모드가 동일 결과를 산출하는지 확인.
 *  7) mutant 방어: --summary/--pipeline-summary 동시 지정 시 abort, out-dir이 repo 내부면 abort.
 */
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");

const BUILDER_PATH = path.join(ROOT, "scripts", "build-dual-platform-content-unit-from-local-summary.mjs");
const OWNER_ENTRYPOINT_PATH = path.join(ROOT, "scripts", "run-owner-daily-automation-entrypoint.mjs");
const ORCHESTRATOR_PATH = path.join(ROOT, "scripts", "run-dual-platform-final-publish-orchestrator.mjs");
const SAMPLE_SUMMARY_PATH = path.join(ROOT, "scripts", "fixtures", "dual_platform_content_unit_from_local_summary.sample.v1.json");
const SAMPLE_PACKET_PATH = path.join(ROOT, "scripts", "fixtures", "dual_platform_content_unit_from_local_summary.sample.v1.owner_approved_upload_ready_packet.json");
const SAMPLE_BLOB_LIVENESS_PATH = path.join(ROOT, "scripts", "fixtures", "dual_platform_content_unit_from_local_summary.sample.v1.blob_liveness_result.json");
const SAMPLE_RENDER_RESULT_PATH = path.join(ROOT, "scripts", "fixtures", "youtube_letterbox_render_result_attach.sample.v1.json");

let passes = 0;
let failures = 0;
function check(name, ok, detail) {
  if (ok) { passes += 1; console.log(`PASS  ${name}`); }
  else { failures += 1; console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
}

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

// ── 1) builder 소스 정적 검증 ────────────────────────────────────────────────
const builderRawSrc = readFileSync(BUILDER_PATH, "utf8");
const builderCode = stripCommentsAndStrings(builderRawSrc);

check("builder: process.env 접근 없음", !/process\.env/.test(builderCode));
check("builder: fetch/axios/googleapis/@vercel/blob 호출 없음", !/\bfetch\(|axios|googleapis|@vercel\/blob/.test(builderCode));
check(
  "builder: ffmpeg/spawnSync/child_process 미사용(media 생성 없음)",
  // ffmpegConversionCount처럼 render-result JSON 필드명을 읽기만 하는 코드는 media 생성이 아니므로
  // 제외한다 — 실제 프로세스 실행/호출 형태(spawnSync(, child_process, ffmpeg()만 차단한다.
  !/spawnSync|child_process|\bffmpeg\s*\(/i.test(builderCode.replace(/\.\s*ffmpeg[A-Za-z]*/gi, "")),
);
check("builder: shell:true 없음", !/shell:\s*true/.test(builderCode));
check("builder: out-dir repo-root 검증 존재", /REPO_ROOT/.test(builderCode) && /outDirAbs\.startsWith/.test(builderCode));
check("builder: .money-shorts-local 차단 존재", /\.money-shorts-local/.test(builderRawSrc));
check("builder: buildContentUnitFromLocalSummary export 존재", /export function buildContentUnitFromLocalSummary/.test(builderRawSrc));
check("builder: CONTENT_UNIT_MANIFEST_SCHEMA_VERSION = dual_platform_content_unit_v1", /CONTENT_UNIT_MANIFEST_SCHEMA_VERSION\s*=\s*"dual_platform_content_unit_v1"/.test(builderRawSrc));
check("builder: --blob-liveness-result 없으면 evidence 필드 생략(네트워크 재검증 없음)", /networkRevalidat|blobLivenessEvidenceReady/.test(builderRawSrc) && !/\bfetch\(/.test(builderCode));
check("builder: readiness booleans 5종 모두 산출", [
  "instagramSourceReady", "youtubeSourceReady", "metadataReady", "blobLivenessEvidenceReady", "contentUnitPreflightExpectedReady",
].every((f) => builderRawSrc.includes(f)));
check("builder: --summary/--pipeline-summary 동시 지정 시 abort", /provide only one of --summary or --pipeline-summary/.test(builderRawSrc));

// task: content-unit-youtube-render-result-attach-preflight-no-live-v1
check("builder: readAndValidateYoutubeRenderResult 함수 존재", /function readAndValidateYoutubeRenderResult/.test(builderRawSrc));
check("builder: RENDER_RESULT_SCHEMA_VERSION = youtube_letterbox_render_result_v1", /RENDER_RESULT_SCHEMA_VERSION\s*=\s*"youtube_letterbox_render_result_v1"/.test(builderRawSrc));
check(
  "builder: render result 검증이 executed/allVerificationsPass/ffmpegConversionCount를 모두 확인",
  /result\?\.executed !== true/.test(builderCode) &&
    /result\?\.allVerificationsPass !== true/.test(builderCode) &&
    /result\?\.ffmpegConversionCount !== 1/.test(builderCode),
);
check(
  "builder: render result 검증이 side-effect counters(api/upload/env/deploy) 4종을 모두 확인",
  ["apiCallCount", "uploadCount", "envSecretReadCount", "deployCount"].every((f) => builderRawSrc.includes(`counters.${f} !== 0`)),
);
check(
  "builder: render result outputPath가 repo 내부면 fail-closed",
  /youtube_render_result_outputPath_inside_repo/.test(builderRawSrc) && /outputAbs\.startsWith\(repoRoot/.test(builderCode),
);
check(
  "builder: render result outputPath 미존재/size<=0이면 fail-closed",
  /youtube_render_result_outputPath_file_not_found/.test(builderRawSrc) && /youtube_render_result_outputSizeBytes_not_positive/.test(builderRawSrc),
);
check(
  "builder: --youtube-source + --youtube-render-result 경로 불일치 시 youtube_source_render_result_mismatch로 fail-closed",
  /youtube_source_render_result_mismatch/.test(builderRawSrc),
);
check(
  "builder: youtubeSourceDerivedFromRenderResult 필드가 buildSummary에 존재",
  /youtubeSourceDerivedFromRenderResult/.test(builderRawSrc),
);
check(
  "builder: ffmpeg/ffprobe/spawnSync를 render-result 처리 경로에서도 호출하지 않음(read-only 검증만)",
  !/spawnSync|ffprobe/i.test(builderCode),
);

// task: local-pipeline-content-unit-preflight-readiness-fix-v1
// Codex review finding: contentUnitPreflightExpectedReady가 blobLivenessEvidenceReady를
// 빠뜨리면 Blob evidence 없이도 "preflight 통과 기대"로 오인될 수 있다. 계산식에
// blobLivenessEvidenceReady가 실제로 AND 조건으로 포함되는지 소스 레벨로 확인한다.
check(
  "builder: contentUnitPreflightExpectedReady 계산식이 blobLivenessEvidenceReady를 포함(AND 조건)",
  /const\s+contentUnitPreflightExpectedReady\s*=\s*\n?\s*instagramSourceReady\s*&&\s*youtubeSourceReady\s*&&\s*metadataReady\s*&&\s*blobLivenessEvidenceReady\s*;/.test(builderCode),
);

// task: content-unit-metadata-optimization-enrichment-no-live-v1
// deterministic metadata enrichment(hook/CTA 추출 + hashtag 8-12 정규화) 함수가 실제로
// 존재하고, 외부 API 없이 원문 caption/hashtag 텍스트만 사용하는지 소스 레벨로 확인한다.
check("builder: extractCaptionFirstLineHook 함수 존재(원문 caption에서만 추출, 새 문구 생성 없음)", /function extractCaptionFirstLineHook/.test(builderRawSrc));
check("builder: deriveCallToAction 함수 존재 + 안전 기본 CTA 상수 존재", /function deriveCallToAction/.test(builderRawSrc) && /SAFE_DEFAULT_CTA/.test(builderRawSrc));
check("builder: normalizeInstagramHashtags 함수 존재(8-12 정규화)", /function normalizeInstagramHashtags/.test(builderRawSrc));
check("builder: hashtag 보강 시 기존 태그를 우선 보존(existingHashtags를 먼저 순회)", /for \(const tag of existingHashtags\)/.test(builderCode));
check("builder: SAFE_DEFAULT_HASHTAG_POOL에 챌린지/viral/trend/밈/fyp 패턴 태그 없음", (() => {
  const m = builderRawSrc.match(/SAFE_DEFAULT_HASHTAG_POOL\s*=\s*\[([\s\S]*?)\];/);
  if (!m) return false;
  return !/(챌린지|viral|trend|밈|fyp|fypシ)/i.test(m[1]);
})());
check(
  "builder: deriveInstagramMetadata가 caption 원문 없이는 hook/CTA를 생성하지 않음(caption 비면 여전히 fail-closed)",
  /if \(caption\.trim\(\) === ""\) reasons\.push\("instagram_caption_empty"\);/.test(builderRawSrc),
);

// task: content-unit-metadata-hook-length-guard-fix-v1
// Codex review finding: hook 길이 상한이 코드/guard로 강제되지 않아 긴 첫 줄 caption이 그대로
// captionFirstLineHook이 될 수 있었다. 상한 상수 존재 + 새 문구를 지어내지 않고 fail-closed하는
// 로직(clause 재시도 후에도 길면 too_long reason)을 소스 레벨로 확인한다.
check(
  "builder: INSTAGRAM_HOOK_MAX_CHARS 상수 존재(40-56 범위)",
  (() => {
    const m = builderRawSrc.match(/INSTAGRAM_HOOK_MAX_CHARS\s*=\s*(\d+)\s*;/);
    if (!m) return false;
    const n = Number(m[1]);
    return n >= 40 && n <= 56;
  })(),
);
check(
  "builder: hook이 상한 초과 시 clause 재시도 후에도 길면 강제로 자르지 않고 fail-closed(too_long) 반환",
  /firstLine\.length > INSTAGRAM_HOOK_MAX_CHARS/.test(builderCode) &&
    /return \{ hook: null, reason: "too_long" \};/.test(builderRawSrc),
);
check(
  "builder: instagram_captionFirstLineHook_too_long reason이 실제로 산출됨(HANDOFF 예시 reason과 일치)",
  /instagram_captionFirstLineHook_too_long/.test(builderRawSrc),
);

// ── 2) sample fixture JSON parse ────────────────────────────────────────────
let sampleSummary, samplePacket, sampleBlobLiveness;
try {
  sampleSummary = JSON.parse(readFileSync(SAMPLE_SUMMARY_PATH, "utf8"));
  check("sample summary fixture JSON parse 성공", true);
} catch (e) {
  check("sample summary fixture JSON parse 성공", false, String(e?.message || e));
}
try {
  samplePacket = JSON.parse(readFileSync(SAMPLE_PACKET_PATH, "utf8"));
  check("sample upload-ready-packet fixture JSON parse 성공", true);
} catch (e) {
  check("sample upload-ready-packet fixture JSON parse 성공", false, String(e?.message || e));
}
try {
  sampleBlobLiveness = JSON.parse(readFileSync(SAMPLE_BLOB_LIVENESS_PATH, "utf8"));
  check("sample blob-liveness-result fixture JSON parse 성공", true);
} catch (e) {
  check("sample blob-liveness-result fixture JSON parse 성공", false, String(e?.message || e));
}

check(
  "sample summary: schemaVersion + artifacts.uploadReadyPacket 계약 정합",
  sampleSummary?.schemaVersion === "money_shorts_render_manifest_local_run_summary_v1" &&
    typeof sampleSummary?.artifacts?.uploadReadyPacket === "string",
);
check(
  "sample packet: schemaVersion + platformPayloads(youtube_shorts/instagram_reels) 존재",
  samplePacket?.schemaVersion === "money_shorts_owner_approved_upload_flow_v1" &&
    Array.isArray(samplePacket?.platformPayloads) &&
    samplePacket.platformPayloads.some((p) => p.platform === "youtube_shorts") &&
    samplePacket.platformPayloads.some((p) => p.platform === "instagram_reels"),
);
check(
  "sample packet: sourceVideoPath가 의도적으로 미존재(instagramSourceReady:false 경로 검증용)",
  typeof samplePacket?.sourceVideoPath === "string" && !existsSync(samplePacket.sourceVideoPath),
);
check(
  "sample blob-liveness-result: shape-valid(url/headStatus 200/contentType video-mp4/contentLength>0)",
  typeof sampleBlobLiveness?.url === "string" &&
    sampleBlobLiveness?.headStatus === 200 &&
    sampleBlobLiveness?.contentType === "video/mp4" &&
    typeof sampleBlobLiveness?.contentLength === "number" && sampleBlobLiveness.contentLength > 0,
);
check("sample fixture 어디에도 secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(
  JSON.stringify({ sampleSummary, samplePacket, sampleBlobLiveness }),
));

// task: content-unit-youtube-render-result-attach-preflight-no-live-v1
let sampleRenderResult;
try {
  sampleRenderResult = JSON.parse(readFileSync(SAMPLE_RENDER_RESULT_PATH, "utf8"));
  check("sample youtube-render-result-attach fixture JSON parse 성공", true);
} catch (e) {
  check("sample youtube-render-result-attach fixture JSON parse 성공", false, String(e?.message || e));
}
check(
  "sample render-result fixture: schemaVersion/executed/allVerificationsPass/ffmpegConversionCount 계약 충족",
  sampleRenderResult?.schemaVersion === "youtube_letterbox_render_result_v1" &&
    sampleRenderResult?.executed === true &&
    sampleRenderResult?.allVerificationsPass === true &&
    sampleRenderResult?.ffmpegConversionCount === 1,
);
check(
  "sample render-result fixture: side-effect counters(api/upload/env/deploy) 전부 0",
  sampleRenderResult?.sideEffectCounters?.apiCallCount === 0 &&
    sampleRenderResult?.sideEffectCounters?.uploadCount === 0 &&
    sampleRenderResult?.sideEffectCounters?.envSecretReadCount === 0 &&
    sampleRenderResult?.sideEffectCounters?.deployCount === 0,
);
check(
  "sample render-result fixture: outputPath가 레포 밖 + .mp4 + 실제 존재 + size>0(read-only stat)",
  typeof sampleRenderResult?.outputPath === "string" &&
    sampleRenderResult.outputPath.toLowerCase().endsWith(".mp4") &&
    !path.resolve(sampleRenderResult.outputPath).startsWith(ROOT + path.sep) &&
    existsSync(sampleRenderResult.outputPath),
);
check("sample render-result fixture 어디에도 secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(
  JSON.stringify(sampleRenderResult),
));

// ── 3) builder 실행: 체크인 sample fixture만 사용, out-dir은 OS temp(repo 밖) ──
const tmpBase = mkdtempSync(path.join(os.tmpdir(), "dual-platform-content-unit-guard-"));
try {
  let buildOut;
  try {
    buildOut = execFileSync(process.execPath, [
      BUILDER_PATH, "--summary", SAMPLE_SUMMARY_PATH, "--out-dir", tmpBase,
    ], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
    check("builder --summary 실행 성공(sample fixture)", true);
  } catch (e) {
    check("builder --summary 실행 성공(sample fixture)", false, String(e?.message || e));
    buildOut = "";
  }

  const generatedManifestPath = path.join(tmpBase, "dual_platform_content_unit.generated.json");
  const generatedBuildSummaryPath = path.join(tmpBase, "content-unit-build-summary.local-mock.json");
  check("builder: manifest 파일 생성됨", existsSync(generatedManifestPath));
  check("builder: build-summary 파일 생성됨", existsSync(generatedBuildSummaryPath));

  let generatedManifest = null, generatedBuildSummary = null;
  if (existsSync(generatedManifestPath)) {
    try { generatedManifest = JSON.parse(readFileSync(generatedManifestPath, "utf8")); } catch {}
  }
  if (existsSync(generatedBuildSummaryPath)) {
    try { generatedBuildSummary = JSON.parse(readFileSync(generatedBuildSummaryPath, "utf8")); } catch {}
  }

  check(
    "생성 manifest: schemaVersion === dual_platform_content_unit_v1 + 필수 필드 존재",
    generatedManifest?.schemaVersion === "dual_platform_content_unit_v1" &&
      typeof generatedManifest?.contentId === "string" && generatedManifest.contentId.trim() !== "" &&
      typeof generatedManifest?.version === "string" && generatedManifest.version.trim() !== "" &&
      typeof generatedManifest?.instagramSourcePath === "string" &&
      typeof generatedManifest?.youtubeSourcePath === "string" && generatedManifest.youtubeSourcePath.trim() !== "",
  );
  check(
    "생성 manifest: blobPublicUrlLivenessEvidence 필드 없음(--blob-liveness-result 미지정)",
    generatedManifest?.blobPublicUrlLivenessEvidence === undefined,
  );
  check(
    "빌드 요약: instagramSourceReady === false (sample sourceVideoPath 의도적 미존재)",
    generatedBuildSummary?.instagramSourceReady === false,
  );
  check(
    "빌드 요약: youtubeSourceReady === false (--youtube-source 미지정 → placeholder)",
    generatedBuildSummary?.youtubeSourceReady === false && generatedBuildSummary?.youtubeSourceProvidedByFlag === false,
  );
  // task: content-unit-metadata-optimization-enrichment-no-live-v1
  // deterministic enrichment(hook/CTA 추출 + hashtag 8-12 정규화) 적용 이후에는
  // sample fixture(caption/hashtag 4개 존재)만으로 metadataReady:true가 되어야 한다.
  check(
    "빌드 요약: metadataReady === true (deterministic enrichment로 hook/CTA/hashtag 8-12 충족)",
    generatedBuildSummary?.metadataReady === true &&
      Array.isArray(generatedBuildSummary?.instagramMetadataReasons) &&
      generatedBuildSummary.instagramMetadataReasons.length === 0 &&
      Array.isArray(generatedBuildSummary?.youtubeMetadataReasons) &&
      generatedBuildSummary.youtubeMetadataReasons.length === 0,
  );
  check(
    "생성 manifest: instagramMetadata.captionFirstLineHook non-empty(원문 caption에서 추출, 지어내지 않음)",
    typeof generatedManifest?.instagramMetadata?.captionFirstLineHook === "string" &&
      generatedManifest.instagramMetadata.captionFirstLineHook.trim() !== "" &&
      sampleSummary != null &&
      typeof generatedManifest.instagramMetadata.caption === "string" &&
      generatedManifest.instagramMetadata.caption.includes(generatedManifest.instagramMetadata.captionFirstLineHook),
  );
  check(
    "생성 manifest: instagramMetadata.callToAction non-empty",
    typeof generatedManifest?.instagramMetadata?.callToAction === "string" &&
      generatedManifest.instagramMetadata.callToAction.trim() !== "",
  );
  // task: content-unit-metadata-hook-length-guard-fix-v1
  // sample fixture로 생성된 hook이 실제로 builder 소스의 INSTAGRAM_HOOK_MAX_CHARS 이하인지
  // 확인한다(하드코딩된 숫자가 아니라 소스에서 파싱한 값과 비교해 상수 변경 시에도 정합 유지).
  check(
    "생성 manifest: instagramMetadata.captionFirstLineHook.length <= INSTAGRAM_HOOK_MAX_CHARS",
    (() => {
      const m = builderRawSrc.match(/INSTAGRAM_HOOK_MAX_CHARS\s*=\s*(\d+)\s*;/);
      const maxChars = m ? Number(m[1]) : null;
      return (
        maxChars != null &&
        typeof generatedManifest?.instagramMetadata?.captionFirstLineHook === "string" &&
        generatedManifest.instagramMetadata.captionFirstLineHook.length <= maxChars
      );
    })(),
  );
  check(
    "생성 manifest: instagramMetadata.hashtags 8-12개, unique, 무관 유행 태그 없음",
    Array.isArray(generatedManifest?.instagramMetadata?.hashtags) &&
      generatedManifest.instagramMetadata.hashtags.length >= 8 &&
      generatedManifest.instagramMetadata.hashtags.length <= 12 &&
      new Set(generatedManifest.instagramMetadata.hashtags).size === generatedManifest.instagramMetadata.hashtags.length &&
      !generatedManifest.instagramMetadata.hashtags.some((t) => /(챌린지|viral|trend|밈|fyp|fypシ)/i.test(String(t))),
  );
  check(
    "생성 manifest: 보강된 hashtags가 원본 sample hashtags(샘플/브릿지테스트/가드검증/Shorts)를 모두 보존",
    Array.isArray(generatedManifest?.instagramMetadata?.hashtags) &&
      ["샘플", "브릿지테스트", "가드검증", "Shorts"].every((t) => generatedManifest.instagramMetadata.hashtags.includes(t)),
  );
  check(
    "생성 manifest: youtubeMetadata.titleBase/tags 보존(기존 로컬 pipeline 값 그대로 유지)",
    typeof generatedManifest?.youtubeMetadata?.titleBase === "string" &&
      generatedManifest.youtubeMetadata.titleBase.trim() !== "" &&
      Array.isArray(generatedManifest?.youtubeMetadata?.tags) &&
      generatedManifest.youtubeMetadata.tags.length > 0,
  );
  check(
    "빌드 요약: blobLivenessEvidenceReady === false (--blob-liveness-result 미지정)",
    generatedBuildSummary?.blobLivenessEvidenceReady === false && generatedBuildSummary?.blobLivenessEvidenceProvided === false,
  );
  check(
    "빌드 요약: contentUnitPreflightExpectedReady === false",
    generatedBuildSummary?.contentUnitPreflightExpectedReady === false,
  );
  check(
    "빌드 요약: noLive === true + envSecretValuesAccessedThisRun === false",
    generatedBuildSummary?.noLive === true && generatedBuildSummary?.envSecretValuesAccessedThisRun === false,
  );

  // ── 4) --blob-liveness-result 지정 시 blobLivenessEvidenceReady:true 전환 확인 ──
  const tmpBase2 = mkdtempSync(path.join(os.tmpdir(), "dual-platform-content-unit-guard-blob-"));
  try {
    execFileSync(process.execPath, [
      BUILDER_PATH,
      "--summary", SAMPLE_SUMMARY_PATH,
      "--out-dir", tmpBase2,
      "--blob-liveness-result", SAMPLE_BLOB_LIVENESS_PATH,
    ], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
    const blobBuildSummary = JSON.parse(readFileSync(path.join(tmpBase2, "content-unit-build-summary.local-mock.json"), "utf8"));
    const blobManifest = JSON.parse(readFileSync(path.join(tmpBase2, "dual_platform_content_unit.generated.json"), "utf8"));
    check(
      "--blob-liveness-result 지정 시 blobLivenessEvidenceReady === true",
      blobBuildSummary?.blobLivenessEvidenceReady === true,
    );
    check(
      "--blob-liveness-result 지정 시 manifest에 blobPublicUrlLivenessEvidence 포함(shape-valid)",
      blobManifest?.blobPublicUrlLivenessEvidence?.headStatus === 200 &&
        blobManifest?.blobPublicUrlLivenessEvidence?.contentType === "video/mp4",
    );
    // task: local-pipeline-content-unit-preflight-readiness-fix-v1
    // Codex review finding 회귀 검증: sample fixture는 instagramSourceReady/youtubeSourceReady/
    // metadataReady가 전부 false이므로, blobLivenessEvidenceReady:true를 줘도
    // contentUnitPreflightExpectedReady는 여전히 false여야 한다(blob evidence 단독으로
    // "전체 readiness true"를 만들 수 없음을 확인).
    check(
      "--blob-liveness-result 지정해도 source/metadata 미완성이면 contentUnitPreflightExpectedReady === false",
      blobBuildSummary?.blobLivenessEvidenceReady === true &&
        blobBuildSummary?.instagramSourceReady === false &&
        blobBuildSummary?.contentUnitPreflightExpectedReady === false,
    );
  } catch (e) {
    check("--blob-liveness-result 지정 시 blobLivenessEvidenceReady === true", false, String(e?.message || e));
    check("--blob-liveness-result 지정 시 manifest에 blobPublicUrlLivenessEvidence 포함(shape-valid)", false, String(e?.message || e));
    check("--blob-liveness-result 지정해도 source/metadata 미완성이면 contentUnitPreflightExpectedReady === false", false, String(e?.message || e));
  } finally {
    try { rmSync(tmpBase2, { recursive: true, force: true }); } catch {}
  }

  // ── 4.5) --youtube-render-result 지정 시 youtubeSourcePath 자동 유도 확인 ──
  // task: content-unit-youtube-render-result-attach-preflight-no-live-v1
  const tmpBaseRR = mkdtempSync(path.join(os.tmpdir(), "dual-platform-content-unit-guard-render-result-"));
  try {
    execFileSync(process.execPath, [
      BUILDER_PATH,
      "--summary", SAMPLE_SUMMARY_PATH,
      "--out-dir", tmpBaseRR,
      "--youtube-render-result", SAMPLE_RENDER_RESULT_PATH,
    ], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
    const rrBuildSummary = JSON.parse(readFileSync(path.join(tmpBaseRR, "content-unit-build-summary.local-mock.json"), "utf8"));
    const rrManifest = JSON.parse(readFileSync(path.join(tmpBaseRR, "dual_platform_content_unit.generated.json"), "utf8"));
    check(
      "--youtube-render-result 지정 시 youtubeSourceReady === true + youtubeSourceDerivedFromRenderResult === true",
      rrBuildSummary?.youtubeSourceReady === true && rrBuildSummary?.youtubeSourceDerivedFromRenderResult === true,
    );
    check(
      "--youtube-render-result 지정 시 manifest.youtubeSourcePath === render result outputPath(수동 복사 없이 자동 유도)",
      rrManifest?.youtubeSourcePath === path.resolve(sampleRenderResult.outputPath),
    );
    check(
      "--youtube-render-result 단독 지정해도 instagram/metadata/blob 미완성이면 contentUnitPreflightExpectedReady === false",
      rrBuildSummary?.youtubeSourceReady === true &&
        rrBuildSummary?.instagramSourceReady === false &&
        rrBuildSummary?.contentUnitPreflightExpectedReady === false,
    );
  } catch (e) {
    check("--youtube-render-result 지정 시 youtubeSourceReady === true + youtubeSourceDerivedFromRenderResult === true", false, String(e?.message || e));
    check("--youtube-render-result 지정 시 manifest.youtubeSourcePath === render result outputPath(수동 복사 없이 자동 유도)", false, String(e?.message || e));
    check("--youtube-render-result 단독 지정해도 instagram/metadata/blob 미완성이면 contentUnitPreflightExpectedReady === false", false, String(e?.message || e));
  } finally {
    try { rmSync(tmpBaseRR, { recursive: true, force: true }); } catch {}
  }

  // --youtube-source와 --youtube-render-result가 다른 경로면 fail-closed(mismatch).
  {
    let threw = false;
    let out = "";
    try {
      out = execFileSync(process.execPath, [
        BUILDER_PATH,
        "--summary", SAMPLE_SUMMARY_PATH,
        "--out-dir", path.join(os.tmpdir(), "should-not-be-created-mismatch"),
        "--youtube-source", "C:\\tmp\\money-shorts-os\\some-other-unrelated-path.mp4",
        "--youtube-render-result", SAMPLE_RENDER_RESULT_PATH,
      ], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
    } catch (e) {
      threw = (e.status ?? 1) !== 0;
      out = String(e?.stdout || "") + String(e?.stderr || "");
    }
    check("--youtube-source와 --youtube-render-result 경로 불일치 → exit != 0(youtube_source_render_result_mismatch)", threw && /youtube_source_render_result_mismatch/.test(out));
  }
  // --youtube-source와 --youtube-render-result가 같은 경로로 resolve되면 허용.
  {
    const tmpBaseSame = mkdtempSync(path.join(os.tmpdir(), "dual-platform-content-unit-guard-same-path-"));
    try {
      execFileSync(process.execPath, [
        BUILDER_PATH,
        "--summary", SAMPLE_SUMMARY_PATH,
        "--out-dir", tmpBaseSame,
        "--youtube-source", sampleRenderResult.outputPath,
        "--youtube-render-result", SAMPLE_RENDER_RESULT_PATH,
      ], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
      const sameManifest = JSON.parse(readFileSync(path.join(tmpBaseSame, "dual_platform_content_unit.generated.json"), "utf8"));
      check(
        "--youtube-source와 --youtube-render-result가 같은 경로로 resolve되면 정상 생성됨(exit 0)",
        sameManifest?.youtubeSourcePath === path.resolve(sampleRenderResult.outputPath),
      );
    } catch (e) {
      check("--youtube-source와 --youtube-render-result가 같은 경로로 resolve되면 정상 생성됨(exit 0)", false, String(e?.message || e));
    } finally {
      try { rmSync(tmpBaseSame, { recursive: true, force: true }); } catch {}
    }
  }
  // schemaVersion 불일치/allVerificationsPass:false render result는 fail-closed.
  {
    const tmpBaseBad = mkdtempSync(path.join(os.tmpdir(), "dual-platform-content-unit-guard-bad-render-result-"));
    try {
      const badRenderResultPath = path.join(tmpBaseBad, "bad-render-result.json");
      writeFileSync(
        badRenderResultPath,
        JSON.stringify({
          schemaVersion: "youtube_letterbox_render_result_v1",
          executed: true,
          allVerificationsPass: false,
          ffmpegConversionCount: 1,
          outputPath: sampleRenderResult.outputPath,
          outputSizeBytes: sampleRenderResult.outputSizeBytes,
          sideEffectCounters: { apiCallCount: 0, uploadCount: 0, envSecretReadCount: 0, deployCount: 0 },
        }, null, 2),
        "utf8",
      );
      let threw = false;
      let out = "";
      try {
        out = execFileSync(process.execPath, [
          BUILDER_PATH, "--summary", SAMPLE_SUMMARY_PATH, "--out-dir", path.join(tmpBaseBad, "out"),
          "--youtube-render-result", badRenderResultPath,
        ], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
      } catch (e) {
        threw = (e.status ?? 1) !== 0;
        out = String(e?.stdout || "") + String(e?.stderr || "");
      }
      check("render result allVerificationsPass:false → exit != 0(fail-closed)", threw && /youtube_render_result_allVerificationsPass_not_true/.test(out));
    } finally {
      try { rmSync(tmpBaseBad, { recursive: true, force: true }); } catch {}
    }
  }

  // ── 5) 생성 manifest → orchestrator --preflight --content-unit 연결 확인 ──
  if (generatedManifestPath && existsSync(generatedManifestPath)) {
    let pfOut;
    try {
      pfOut = execFileSync(process.execPath, [ORCHESTRATOR_PATH, "--preflight", "--content-unit", generatedManifestPath], {
        cwd: ROOT, encoding: "utf8", timeout: 15000,
      });
      check("orchestrator --preflight --content-unit <생성 manifest> 실행 성공(exit 0)", true);
    } catch (e) {
      // preflightOk:false는 exit 0 유지(orchestrator --preflight는 항상 exit 0 — no-live 판정 출력).
      check("orchestrator --preflight --content-unit <생성 manifest> 실행 성공(exit 0)", false, String(e?.message || e));
      pfOut = e?.stdout ?? "";
    }
    let pfParsed = null;
    try { pfParsed = JSON.parse(pfOut); } catch {}
    check(
      "orchestrator preflight: isDefaultContentUnit === false (bridge로 만든 content는 custom)",
      pfParsed?.isDefaultContentUnit === false,
    );
    check(
      "orchestrator preflight: metadataOptimizationGateOk === true (deterministic enrichment로 실제 metadata gate 통과)",
      pfParsed?.preflight?.metadataOptimizationGateOk === true,
    );
    check(
      "orchestrator preflight: preflightOk === false (source/Blob evidence 미완성 → 예상된 fail-closed, metadata는 이미 통과)",
      pfParsed?.preflight?.preflightOk === false,
    );
    check(
      "orchestrator preflight: sourceFilesReady === false (instagram+youtube source 모두 미완성)",
      pfParsed?.preflight?.sourceFilesReady === false,
    );
  } else {
    check("orchestrator --preflight --content-unit <생성 manifest> 실행 성공(exit 0)", false, "generated manifest missing");
    check("orchestrator preflight: isDefaultContentUnit === false (bridge로 만든 content는 custom)", false, "generated manifest missing");
    check("orchestrator preflight: metadataOptimizationGateOk === true (deterministic enrichment로 실제 metadata gate 통과)", false, "generated manifest missing");
    check("orchestrator preflight: preflightOk === false (source/Blob evidence 미완성 → 예상된 fail-closed, metadata는 이미 통과)", false, "generated manifest missing");
    check("orchestrator preflight: sourceFilesReady === false (instagram+youtube source 모두 미완성)", false, "generated manifest missing");
  }
} finally {
  try { rmSync(tmpBase, { recursive: true, force: true }); } catch {}
}

// task: content-unit-metadata-hook-length-guard-fix-v1
// ── 5.5) 긴 첫 줄 caption fixture: hook 상한을 넘는 hook을 그대로 통과시키지 않음을 확인 ──
// guard 내부에서만 쓰는 임시 fixture(체크인되지 않음, OS temp에만 생성)로 재현한다.
{
  const longHookTmpBase = mkdtempSync(path.join(os.tmpdir(), "dual-platform-content-unit-guard-long-hook-"));
  try {
    const longCaptionPacketPath = path.join(longHookTmpBase, "packet.json");
    const longCaptionSummaryPath = path.join(longHookTmpBase, "summary.json");
    const longFirstLine =
      "이것은 정말로 매우 길고 장황한 첫 문장으로 48자를 훨씬 초과하는 caption 첫 줄 테스트용 문구입니다.";
    writeFileSync(
      longCaptionPacketPath,
      JSON.stringify(
        {
          schemaVersion: "money_shorts_owner_approved_upload_flow_v1",
          mode: "local_mock",
          flowStatus: "upload_ready_dry_run",
          actualUploadAllowed: false,
          actualUploadPerformed: false,
          notUploaded: true,
          ownerApprovalRequired: true,
          sourceManifestId: "long-hook-guard-test",
          sourceVideoPath: path.join(longHookTmpBase, "nonexistent.mp4"),
          platformPayloads: [
            {
              platform: "instagram_reels",
              caption: `${longFirstLine}\n\n#샘플 #브릿지테스트 #가드검증 #테스트`,
              hashtags: ["샘플", "브릿지테스트", "가드검증", "테스트", "긴문장", "훅테스트", "정보", "일상"],
              visibilityPlan: "owner_review_first",
              notUploaded: true,
              ownerApprovalRequired: true,
            },
            {
              platform: "youtube_shorts",
              title: "긴 훅 테스트 제목",
              description: "테스트용 description",
              hashtags: ["테스트"],
              categoryId: "27",
              defaultLanguage: "ko",
              madeForKids: false,
            },
          ],
          nextStep: "live_upload_requires_explicit_owner_approval_and_credentials",
          builtAt: "2026-01-01T00:00:00.000Z",
        },
        null,
        2,
      ),
      "utf8",
    );
    writeFileSync(
      longCaptionSummaryPath,
      JSON.stringify(
        {
          schemaVersion: "money_shorts_render_manifest_local_run_summary_v1",
          mode: "local_mock",
          flowStatus: "completed_dry_run",
          startedAt: "2026-01-01T00:00:00.000Z",
          finishedAt: "2026-01-01T00:00:10.000Z",
          manifestPath: "scripts/fixtures/provider-candidate-render-manifest.visual-only.json",
          steps: [],
          artifacts: { uploadReadyPacket: longCaptionPacketPath },
          actualUploadAllowed: false,
          actualUploadPerformed: false,
          notUploaded: true,
          ownerApprovalRequired: true,
        },
        null,
        2,
      ),
      "utf8",
    );

    const longHookOutDir = path.join(longHookTmpBase, "out");
    let longHookBuildSummary = null;
    try {
      execFileSync(process.execPath, [
        BUILDER_PATH, "--summary", longCaptionSummaryPath, "--out-dir", longHookOutDir,
      ], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
      longHookBuildSummary = JSON.parse(readFileSync(path.join(longHookOutDir, "content-unit-build-summary.local-mock.json"), "utf8"));
      check("긴 첫 줄 caption: builder 실행 성공(exit 0, metadataReady:false는 정상 결과)", true);
    } catch (e) {
      check("긴 첫 줄 caption: builder 실행 성공(exit 0, metadataReady:false는 정상 결과)", false, String(e?.message || e));
    }
    check(
      "긴 첫 줄 caption: metadataReady === false (hook 상한 초과로 fail-closed)",
      longHookBuildSummary?.metadataReady === false,
    );
    check(
      "긴 첫 줄 caption: instagramMetadataReasons에 instagram_captionFirstLineHook_too_long 포함",
      Array.isArray(longHookBuildSummary?.instagramMetadataReasons) &&
        longHookBuildSummary.instagramMetadataReasons.some((r) => r.includes("instagram_captionFirstLineHook_too_long")),
    );
    const longHookManifestPath = path.join(longHookOutDir, "dual_platform_content_unit.generated.json");
    let longHookManifest = null;
    if (existsSync(longHookManifestPath)) {
      try { longHookManifest = JSON.parse(readFileSync(longHookManifestPath, "utf8")); } catch {}
    }
    check(
      "긴 첫 줄 caption: 생성 manifest의 captionFirstLineHook은 빈 문자열(원본 긴 문장을 그대로 통과시키지 않음)",
      longHookManifest?.instagramMetadata?.captionFirstLineHook === "",
    );
  } finally {
    try { rmSync(longHookTmpBase, { recursive: true, force: true }); } catch {}
  }
}

// ── 6) owner entrypoint --build-content-unit 모드 확인 ──────────────────────
const ownerRawSrc = readFileSync(OWNER_ENTRYPOINT_PATH, "utf8");
check("owner entrypoint: --build-content-unit MODES 목록에 존재", /"--build-content-unit"/.test(ownerRawSrc));
check("owner entrypoint: buildContentUnitFromLocalSummary import 존재", /import\s*\{\s*buildContentUnitFromLocalSummary\s*\}/.test(ownerRawSrc));
check("owner entrypoint: runBuildContentUnit 함수 존재", /function runBuildContentUnit/.test(ownerRawSrc));
check("owner entrypoint: --youtube-render-result를 builder로 forwarding", /getArg\("--youtube-render-result"\)/.test(ownerRawSrc) && /youtubeRenderResultPath/.test(ownerRawSrc));

const tmpBase3 = mkdtempSync(path.join(os.tmpdir(), "dual-platform-content-unit-guard-owner-"));
try {
  let ownerOut;
  try {
    ownerOut = execFileSync(process.execPath, [
      OWNER_ENTRYPOINT_PATH, "--build-content-unit", "--summary", SAMPLE_SUMMARY_PATH, "--out-dir", tmpBase3,
    ], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
    check("owner entrypoint --build-content-unit 실행 성공(exit 0)", true);
  } catch (e) {
    check("owner entrypoint --build-content-unit 실행 성공(exit 0)", false, String(e?.message || e));
    ownerOut = "";
  }
  const ownerManifestPath = path.join(tmpBase3, "dual_platform_content_unit.generated.json");
  check("owner entrypoint --build-content-unit: manifest 파일 생성됨", existsSync(ownerManifestPath));
  check(
    "owner entrypoint --build-content-unit: stdout에 secret 값 형태 없음",
    !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(ownerOut),
  );
} finally {
  try { rmSync(tmpBase3, { recursive: true, force: true }); } catch {}
}

// task: content-unit-youtube-render-result-attach-preflight-no-live-v1
const tmpBase4 = mkdtempSync(path.join(os.tmpdir(), "dual-platform-content-unit-guard-owner-rr-"));
try {
  execFileSync(process.execPath, [
    OWNER_ENTRYPOINT_PATH, "--build-content-unit", "--summary", SAMPLE_SUMMARY_PATH, "--out-dir", tmpBase4,
    "--youtube-render-result", SAMPLE_RENDER_RESULT_PATH,
  ], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
  const ownerRRManifest = JSON.parse(readFileSync(path.join(tmpBase4, "dual_platform_content_unit.generated.json"), "utf8"));
  const ownerRRBuildSummary = JSON.parse(readFileSync(path.join(tmpBase4, "content-unit-build-summary.local-mock.json"), "utf8"));
  check(
    "owner entrypoint --build-content-unit --youtube-render-result: youtubeSourcePath가 render result outputPath와 일치",
    ownerRRManifest?.youtubeSourcePath === path.resolve(sampleRenderResult.outputPath),
  );
  check(
    "owner entrypoint --build-content-unit --youtube-render-result: youtubeSourceDerivedFromRenderResult === true",
    ownerRRBuildSummary?.youtubeSourceDerivedFromRenderResult === true,
  );
} catch (e) {
  check("owner entrypoint --build-content-unit --youtube-render-result: youtubeSourcePath가 render result outputPath와 일치", false, String(e?.message || e));
  check("owner entrypoint --build-content-unit --youtube-render-result: youtubeSourceDerivedFromRenderResult === true", false, String(e?.message || e));
} finally {
  try { rmSync(tmpBase4, { recursive: true, force: true }); } catch {}
}

// ── 7) mutant 방어: 잘못된 인자 조합은 abort ────────────────────────────────
{
  let threw = false;
  try {
    execFileSync(process.execPath, [
      BUILDER_PATH, "--summary", SAMPLE_SUMMARY_PATH, "--pipeline-summary", SAMPLE_SUMMARY_PATH, "--out-dir", tmpBase,
    ], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
  } catch (e) {
    threw = (e.status ?? 1) !== 0;
  }
  check("builder: --summary + --pipeline-summary 동시 지정 시 exit != 0", threw);
}
{
  let threw = false;
  try {
    execFileSync(process.execPath, [
      BUILDER_PATH, "--summary", SAMPLE_SUMMARY_PATH, "--out-dir", path.join(ROOT, "scripts", "fixtures", "should-not-be-created"),
    ], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
  } catch (e) {
    threw = (e.status ?? 1) !== 0;
  }
  check("builder: --out-dir이 repo 내부면 exit != 0(out-root repo-outside 강제)", threw);
  check(
    "builder: repo 내부 out-dir 시도가 실제로 디렉터리를 만들지 않음",
    !existsSync(path.join(ROOT, "scripts", "fixtures", "should-not-be-created")),
  );
}

// ── 결과 ──────────────────────────────────────────────────────────────────
console.log(`\n${passes} PASS / ${failures} FAIL`);
if (failures > 0) process.exit(1);
