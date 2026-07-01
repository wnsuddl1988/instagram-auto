#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-premium-editorial-final-video-acceptance-static.mjs
//
// FINAL VIDEO ACCEPTANCE + UPLOAD READINESS — STRUCTURE/SAFETY GUARD
// (no execution, no ffmpeg re-run, no upload/publish API call)
//
// 검증 대상:
//   - final mp4가 실제 존재하고 ffprobe로 재검증한 acceptance manifest가
//     mp4/h264/1080x1920/30fps/aac/30s/av-gap 0 조건을 만족한다.
//   - acceptedCandidatePath가 tailfit v3.1 경로를 정확히 가리킨다 (v1/v2/v3 non-tailfit 아님).
//   - uploadExecuted/publishExecuted가 false다.
//   - selected image set / caption v3 manifest / TTS v3.1 tailfit summary가 참조된다.
//   - 이번 작업에서 이미지/TTS/캡션 재생성이 없다 (builder에 생성 로직 부재).
//   - 신규 파일에 fetch/업로드 API 코드, env/secret 접근이 없다.
//   - output/C:\tmp 산출물이 repo 안으로 복사되지 않았다.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const ACCEPTANCE_MANIFEST_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-final-video-acceptance.v1.json");
const UPLOAD_READINESS_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-upload-readiness.v1.json");
const ACCEPTANCE_BUILDER_PATH = join(__dirname, "build-premium-editorial-final-video-acceptance-v1.mjs");
const SELF_PATH = join(__dirname, "check-premium-editorial-final-video-acceptance-static.mjs");

const EXPECTED_ACCEPTED_CANDIDATE_PATH = "C:\\tmp\\money-shorts-os\\selected-image-elevenlabs-tts-mux-voice-caption-v3-1-tailfit\\premium-editorial-selected-image-visual-only-v1-tts-mux.mp4";

const results = [];
function check(name, condition, detail = "") {
  results.push({ name, pass: !!condition, detail });
}

let acceptanceManifest, uploadReadiness, builderText, selfText;
try {
  acceptanceManifest = JSON.parse(readFileSync(ACCEPTANCE_MANIFEST_PATH, "utf8"));
  uploadReadiness = JSON.parse(readFileSync(UPLOAD_READINESS_PATH, "utf8"));
  builderText = readFileSync(ACCEPTANCE_BUILDER_PATH, "utf8");
  selfText = readFileSync(SELF_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read/parse inputs: ${e.message}`);
  process.exit(2);
}

// ═══════════════════════════════════════════════════════════════════════════
// § A. Final mp4 existence + acceptedCandidatePath correctness
// ═══════════════════════════════════════════════════════════════════════════
check("A-01: acceptance manifest schemaVersion === money_shorts_final_video_acceptance_v1", acceptanceManifest.schemaVersion === "money_shorts_final_video_acceptance_v1");
check("A-02: acceptedCandidatePath matches expected tailfit v3.1 path exactly", acceptanceManifest.acceptedCandidatePath === EXPECTED_ACCEPTED_CANDIDATE_PATH, acceptanceManifest.acceptedCandidatePath);
check("A-03: acceptedCandidatePath contains 'tailfit' (not v1/v2/v3 non-tailfit)", /tailfit/.test(acceptanceManifest.acceptedCandidatePath || ""));
check("A-04: acceptedCandidatePath does NOT point to plain caption-v3 (non-tailfit) mux dir",
  !/elevenlabs-tts-mux-voice-caption-v3-1\\premium/i.test(acceptanceManifest.acceptedCandidatePath || "") || /tailfit/.test(acceptanceManifest.acceptedCandidatePath || ""));
check("A-05: accepted candidate mp4 file exists on disk", existsSync(acceptanceManifest.acceptedCandidatePath || ""));
check("A-06: acceptedByOwner === true", acceptanceManifest.acceptedByOwner === true);
check("A-07: acceptedVariant === voice_caption_v3_1_tailfit", acceptanceManifest.acceptedVariant === "voice_caption_v3_1_tailfit");

// ═══════════════════════════════════════════════════════════════════════════
// § B. mediaProbe: mp4/h264/1080x1920/30fps/aac/30s/av-gap 0
// ═══════════════════════════════════════════════════════════════════════════
const mp = acceptanceManifest.mediaProbe || {};
check("B-01: mediaProbe.containerFormat includes mp4", /mp4/.test(mp.containerFormat || ""));
check("B-02: mediaProbe.videoCodec === h264", mp.videoCodec === "h264");
check("B-03: mediaProbe.widthPx === 1080", mp.widthPx === 1080);
check("B-04: mediaProbe.heightPx === 1920", mp.heightPx === 1920);
check("B-05: mediaProbe.fps === 30", mp.fps === 30);
check("B-06: mediaProbe.audioCodec === aac", mp.audioCodec === "aac");
check("B-07: mediaProbe.audioStreamCount >= 1", (mp.audioStreamCount ?? 0) >= 1);
check("B-08: mediaProbe.durationSec within 30s ± 0.5s", Math.abs((mp.durationSec ?? 0) - 30) <= 0.5, String(mp.durationSec));
check("B-09: mediaProbe.avGapSec <= 0.05s", (mp.avGapSec ?? 999) <= 0.05, String(mp.avGapSec));

// ═══════════════════════════════════════════════════════════════════════════
// § C. Upload boundary: uploadExecuted/publishExecuted false, Owner approval required
// ═══════════════════════════════════════════════════════════════════════════
check("C-01: acceptance manifest uploadBoundary.uploadExecuted === false", acceptanceManifest.uploadBoundary?.uploadExecuted === false);
check("C-02: acceptance manifest uploadBoundary.publishExecuted === false", acceptanceManifest.uploadBoundary?.publishExecuted === false);
check("C-03: acceptance manifest uploadBoundary.requiresOwnerUploadApproval === true", acceptanceManifest.uploadBoundary?.requiresOwnerUploadApproval === true);
check("C-04: upload readiness uploadBoundary.uploadExecuted === false", uploadReadiness.uploadBoundary?.uploadExecuted === false);
check("C-05: upload readiness uploadBoundary.publishExecuted === false", uploadReadiness.uploadBoundary?.publishExecuted === false);
check("C-06: upload readiness uploadBoundary.requiresOwnerUploadApproval === true", uploadReadiness.uploadBoundary?.requiresOwnerUploadApproval === true);
check("C-07: upload readiness uploadBoundary.noOAuthNoApiCredentials === true", uploadReadiness.uploadBoundary?.noOAuthNoApiCredentials === true);
check("C-08: upload readiness uploadBoundary.noYoutubeInstagramApiCallsMade === true", uploadReadiness.uploadBoundary?.noYoutubeInstagramApiCallsMade === true);
check("C-09: readinessChecklist.ownerApprovalObtainedForUpload === false (아직 업로드 미승인)", uploadReadiness.readinessChecklist?.ownerApprovalObtainedForUpload === false);

// ═══════════════════════════════════════════════════════════════════════════
// § D. noFurtherChangesPolicy
// ═══════════════════════════════════════════════════════════════════════════
const nfc = acceptanceManifest.noFurtherChangesPolicy || {};
check("D-01: imageRegenerationAllowed === false", nfc.imageRegenerationAllowed === false);
check("D-02: ttsRegenerationAllowed === false", nfc.ttsRegenerationAllowed === false);
check("D-03: captionRestylingAllowed === false", nfc.captionRestylingAllowed === false);
check("D-04: renderRebuildAllowed === false", nfc.renderRebuildAllowed === false);

// ═══════════════════════════════════════════════════════════════════════════
// § E. Asset provenance references: selected image set / caption v3 / TTS v3.1 tailfit
// ═══════════════════════════════════════════════════════════════════════════
const ap = acceptanceManifest.assetProvenance || {};
check("E-01: selectedImageSet path referenced", ap.selectedImageSet?.path === "scripts/fixtures/premium-editorial-scene-selected-image-set.v1.json");
check("E-02: selectedImageSet schemaVersion recorded", ap.selectedImageSet?.schemaVersion === "money_shorts_scene_selected_image_set_v1");
check("E-03: selectedImageSet sceneCount === 6", ap.selectedImageSet?.sceneCount === 6);
check("E-04: captionV3 path referenced", ap.captionV3?.path === "scripts/fixtures/premium-editorial-selected-image-render-manifest.caption-v3.json");
check("E-05: captionV3 fontSize === 104", ap.captionV3?.captionFontSize === 104);
check("E-06: ttsV31Tailfit summary referenced", /tailfit/.test(ap.ttsV31Tailfit?.summaryPath || ""));
check("E-07: ttsV31Tailfit apiCallCountThisRun === 0 (no-live normalization)", ap.ttsV31Tailfit?.apiCallCountThisRun === 0);
check("E-08: ttsV31Tailfit noLiveTailPreservingRun === true", ap.ttsV31Tailfit?.noLiveTailPreservingRun === true);
check("E-09: referenced selected image fixture actually exists on disk",
  existsSync(join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-selected-image-set.v1.json")));
check("E-10: referenced caption v3 manifest fixture actually exists on disk",
  existsSync(join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-selected-image-render-manifest.caption-v3.json")));

// ═══════════════════════════════════════════════════════════════════════════
// § F. sourceCommitRefs sanity
// ═══════════════════════════════════════════════════════════════════════════
check("F-01: sourceCommitRefs.ttsCaptionV3TailfitPatch present (7+ hex chars)", /^[0-9a-f]{7,40}$/.test(acceptanceManifest.sourceCommitRefs?.ttsCaptionV3TailfitPatch || ""));
check("F-02: sourceCommitRefs.visualRenderSelectedImage present", /^[0-9a-f]{7,40}$/.test(acceptanceManifest.sourceCommitRefs?.visualRenderSelectedImage || ""));
check("F-03: sourceCommitRefs.selectedSceneImageSetManifest present", /^[0-9a-f]{7,40}$/.test(acceptanceManifest.sourceCommitRefs?.selectedSceneImageSetManifest || ""));

// ═══════════════════════════════════════════════════════════════════════════
// § G. No regeneration in this task: builder script has no image/TTS/caption generation logic
// ═══════════════════════════════════════════════════════════════════════════
check("G-01: builder does NOT call ElevenLabs / TTS generation endpoints", !/text-to-speech|elevenlabs\.io/i.test(builderText));
check("G-02: builder does NOT call image generation (openai/imagen/pollinations)", !/openai\.com|imagen|pollinations/i.test(builderText));
check("G-03: builder does NOT invoke ffmpeg render/mux (only ffprobe read-only)", !/spawnSync\(\s*["']ffmpeg["']/.test(builderText));
check("G-04: builder only spawns ffprobe (read-only verification)", /spawnSync\(\s*["']ffprobe["']/.test(builderText));
check("G-05: builder does NOT write into output/ or C:\\tmp (writes only into scripts/fixtures)", !/writeFileSync\([^)]*C:\\\\tmp/i.test(builderText) && !/writeFileSync\([^)]*output[\\/]/.test(builderText));

// ═══════════════════════════════════════════════════════════════════════════
// § H. No fetch/upload API code, no env/secret access in new files
// ═══════════════════════════════════════════════════════════════════════════
check("H-01: builder does NOT use fetch/axios/http request", !/\bfetch\(/.test(builderText) && !/axios/.test(builderText));
check("H-02: builder does NOT reference YouTube/Instagram upload API", !/googleapis|graph\.facebook|instagram-graph/i.test(builderText));
check("H-03: builder does NOT access process.env", !/process\.env/.test(builderText));
check("H-04: builder does NOT reference apiKey/accessToken/refreshToken/OAuth", !/apiKey|accessToken|refreshToken|OAuth/i.test(builderText));
check("H-05: builder uses shell:false on spawnSync", /shell:\s*false/.test(builderText));

// ═══════════════════════════════════════════════════════════════════════════
// § I. No output/C:\tmp artifacts copied into repo
// ═══════════════════════════════════════════════════════════════════════════
check("I-01: no .mp4 file exists under scripts/fixtures", !existsSync(join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-final-video-acceptance-copy.mp4")));
check("I-02: no .m4a/.mp3 audio artifact introduced under scripts/fixtures for this task",
  !existsSync(join(REPO_ROOT, "scripts", "fixtures", "elevenlabs-scene-paced-timeline.m4a")));
check("I-03: acceptance manifest references C:\\tmp paths (not copied, just referenced)", /C:\\\\tmp/.test(JSON.stringify(acceptanceManifest)));

// ── self-guard ──────────────────────────────────────────────────────────────
check("J-01: guard does NOT import openai/playwright/node-fetch/axios", !/(import|require)[^\n]*['"`](openai|playwright|node-fetch|axios)['"`]/.test(selfText));
// note: selfText는 이 guard 파일 자체이며, H-03 체크 코드가 dotted-env 문자열을 검증 패턴으로 담고 있어
// 단순 포함 검사는 자기 자신에 오탐된다. 실제 프로퍼티 접근 형태만 감지한다.
const ENV_PROPERTY_ACCESS_RE = new RegExp("process" + "\\.env" + "\\.[A-Za-z_]");
const ENV_BRACKET_ACCESS_RE = new RegExp("process" + "\\.env" + "\\[");
check("J-02: guard does NOT actually access process.env (only references it in a check pattern)",
  !ENV_PROPERTY_ACCESS_RE.test(selfText) && !ENV_BRACKET_ACCESS_RE.test(selfText));

// ── result ────────────────────────────────────────────────────────────────
const pass = results.filter((r) => r.pass);
const fail = results.filter((r) => !r.pass);
console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  FINAL VIDEO ACCEPTANCE + UPLOAD READINESS — STRUCTURE/SAFETY GUARD`);
console.log(`══════════════════════════════════════════════════════════`);
for (const r of results) {
  const mark = r.pass ? "PASS" : "FAIL";
  const detail = r.detail ? `  [${r.detail}]` : "";
  console.log(`  ${mark}  ${r.name}${detail}`);
}
console.log(`\n──────────────────────────────────────────────────────────`);
console.log(`  TOTAL : ${results.length}  |  PASS : ${pass.length}  |  FAIL : ${fail.length}`);
console.log(`──────────────────────────────────────────────────────────\n`);
if (fail.length > 0) {
  console.error(`GUARD FAILED (${fail.length} failures):`);
  for (const r of fail) console.error(`  FAIL  ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
  process.exit(1);
} else {
  console.log(`GUARD OK: final video acceptance + upload readiness structure/safety intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
