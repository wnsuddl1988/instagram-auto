#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-money-shorts-automation-orchestrator-static.mjs
//
// AUTOMATION ORCHESTRATOR v1 — STRUCTURE/SAFETY GUARD (data-only, no execution)
//
// 검증 대상:
//   - scripts/fixtures/money-shorts-automation-job.base-rate-202605.v1.json  (job manifest)
//   - scripts/run-money-shorts-automation-orchestrator-v1.mjs                (runner)
//   - self                                                                   (this guard)
//
// 핵심: no-live 자동화 골격이 코드/데이터 수준에서 안전한지.
//   - job manifest schema/jobId/published URL/render profile policy 정합
//   - runner가 env/secret 직접 읽지 않음, live 옵션 ABORT, upload/deploy/generate 미실행
//   - runner가 guard를 read-only spawn 하되 dependency install 없음
//   - fixture/guard에 token/credential 없음, 금지 파일 미참조
//
// 이 guard는 렌더/업로드/외부 호출을 절대 하지 않는다. 순수 정적 검사.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const JOB_PATH = join(__dirname, "fixtures", "money-shorts-automation-job.base-rate-202605.v1.json");
const RUNNER_PATH = join(__dirname, "run-money-shorts-automation-orchestrator-v1.mjs");
const SELF_PATH = join(__dirname, "check-money-shorts-automation-orchestrator-static.mjs");

const results = [];
function check(name, condition, detail = "") {
  results.push({ name, pass: !!condition, detail });
}
function isStr(v) {
  return typeof v === "string" && v.length > 0;
}

// forbidden tokens built by concatenation so this guard doesn't match itself on self-read
const CTX_TRANSFER_TOKEN = "CONTEXT" + "_TRANSFER_" + "CODEX";
const PIQ_TOKEN = "piq" + "_diag_" + "out";

let jobRaw, job, runnerText, selfText;
try {
  jobRaw = readFileSync(JOB_PATH, "utf8");
  job = JSON.parse(jobRaw);
  runnerText = readFileSync(RUNNER_PATH, "utf8");
  selfText = readFileSync(SELF_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read/parse inputs: ${e.message}`);
  process.exit(2);
}

const ppp = job.platformPublishPolicy ?? {};
const sep = job.sideEffectPolicy ?? {};
const pr = job.publishRecords ?? {};

// runnerCode = runner source with full-line `//` comments stripped, so "must-not-appear-in-code"
// checks don't false-positive on the runner's own safety-declaration comments (which SHOULD
// document that it never reads .env, never deploys, etc.). Block comments aren't used here.
const runnerCode = runnerText
  .split(/\r?\n/)
  .filter((ln) => !/^\s*\/\//.test(ln))
  .join("\n");

// ── § A. job manifest schema / identity ──────────────────────────────────────
check("A-01: schemaVersion === money_shorts_automation_job_v1", job.schemaVersion === "money_shorts_automation_job_v1");
check("A-02: jobId present", isStr(job.jobId));
check("A-03: jobId references base-rate-202605", /base-rate-202605/.test(job.jobId ?? ""));
check("A-04: category === money_shorts", job.category === "money_shorts");
check("A-05: status marks data_only", isStr(job.status) && job.status.includes("data_only"));
check("A-06: title present", isStr(job.title));
check("A-07: purpose present", isStr(job.purpose));
check("A-08: sourceFactRef present", typeof job.sourceFactRef === "object" && job.sourceFactRef !== null);
check("A-09: sourceFactRef.latestPeriod === 202605", job.sourceFactRef?.latestPeriod === "202605");
check("A-10: sourceFactRef.currentValueText present", isStr(job.sourceFactRef?.currentValueText));
check("A-11: sourceFactRef.changeDirection is unchanged_month_over_month", job.sourceFactRef?.changeDirection === "unchanged_month_over_month");

// ── § B. accepted video + public URL + published URLs ────────────────────────
check("B-01: acceptedFinalVideoPath present", isStr(job.acceptedFinalVideoPath));
check("B-02: acceptedFinalVideoPath under C:\\tmp\\money-shorts-os", /^C:\\+tmp\\+money-shorts-os\\+/i.test(job.acceptedFinalVideoPath ?? ""));
check("B-03: acceptedFinalVideoPath is an mp4", /\.mp4$/i.test(job.acceptedFinalVideoPath ?? ""));
check("B-04: acceptedVariant present", isStr(job.acceptedVariant));
check("B-05: publicVideoUrl is the buildgongjakso money-shorts mp4", job.publicVideoUrl === "https://www.buildgongjakso.com/videos/money-shorts/base-rate-202605-final.mp4");
check("B-06: publicVideoUrl is https", /^https:\/\//.test(job.publicVideoUrl ?? ""));
check("B-07: youtubeShortsUrl present", isStr(job.youtubeShortsUrl));
check("B-08: youtubeShortsUrl is a youtube shorts url", /^https:\/\/www\.youtube\.com\/shorts\//.test(job.youtubeShortsUrl ?? ""));
check("B-09: youtubeShortsUrl has the known videoId", /eX622q9dNOI/.test(job.youtubeShortsUrl ?? ""));
check("B-10: instagramReelsUrl present", isStr(job.instagramReelsUrl));
check("B-11: instagramReelsUrl is an instagram reel url", /^https:\/\/www\.instagram\.com\/reel\//.test(job.instagramReelsUrl ?? ""));
check("B-12: instagramReelsUrl has the known mediaId", /17910778836241106/.test(job.instagramReelsUrl ?? ""));

// ── § C. referenced manifests present ────────────────────────────────────────
check("C-01: selectedImageSetManifest.path present", isStr(job.selectedImageSetManifest?.path));
check("C-02: finalVideoAcceptanceManifest.path present", isStr(job.finalVideoAcceptanceManifest?.path));
check("C-03: uploadReadinessManifest.path present", isStr(job.uploadReadinessManifest?.path));
check("C-04: platformRenderProfilesManifest.path present", isStr(job.platformRenderProfilesManifest?.path));
check("C-05: platformRenderProfilesManifest references premium-editorial-platform-render-profiles.v1.json", /premium-editorial-platform-render-profiles\.v1\.json$/.test(job.platformRenderProfilesManifest?.path ?? ""));
check("C-06: finalVideoAcceptanceManifest references acceptance fixture", /premium-editorial-final-video-acceptance\.v1\.json$/.test(job.finalVideoAcceptanceManifest?.path ?? ""));
check("C-07: uploadReadinessManifest references readiness fixture", /premium-editorial-upload-readiness\.v1\.json$/.test(job.uploadReadinessManifest?.path ?? ""));
check("C-08: uploadMetadataManifest references local-mock metadata", /provider-candidate-upload-metadata\.local-mock\.json$/.test(job.uploadMetadataManifest?.path ?? ""));

// ── § D. publish records (paths outside repo, expected ids) ──────────────────
check("D-01: publishRecords.youtube_shorts.recordPath present", isStr(pr.youtube_shorts?.recordPath));
check("D-02: yt recordPath under C:\\tmp\\money-shorts-os", /^C:\\+tmp\\+money-shorts-os\\+/i.test(pr.youtube_shorts?.recordPath ?? ""));
check("D-03: yt recordPath is a json record", /live-upload-first-run-record\.json$/.test(pr.youtube_shorts?.recordPath ?? ""));
check("D-04: yt expectedVideoId matches known id", pr.youtube_shorts?.expectedVideoId === "eX622q9dNOI");
check("D-05: publishRecords.instagram_reels.recordPath present", isStr(pr.instagram_reels?.recordPath));
check("D-06: ig recordPath under C:\\tmp\\money-shorts-os", /^C:\\+tmp\\+money-shorts-os\\+/i.test(pr.instagram_reels?.recordPath ?? ""));
check("D-07: ig recordPath is a json record", /live-upload-first-run-record\.json$/.test(pr.instagram_reels?.recordPath ?? ""));
check("D-08: ig expectedMediaId matches known id", pr.instagram_reels?.expectedMediaId === "17910778836241106");

// ── § E. required static guards list ─────────────────────────────────────────
const rsg = Array.isArray(job.requiredStaticGuards) ? job.requiredStaticGuards : [];
check("E-01: requiredStaticGuards is a non-empty array", rsg.length >= 4);
check("E-02: includes platform-render-profiles guard", rsg.some((g) => /check-premium-editorial-platform-render-profiles-static\.mjs$/.test(g)));
check("E-03: includes final-video-acceptance guard", rsg.some((g) => /check-premium-editorial-final-video-acceptance-static\.mjs$/.test(g)));
check("E-04: includes live-upload-first-run guard", rsg.some((g) => /check-premium-editorial-live-upload-first-run-static\.mjs$/.test(g)));
check("E-05: includes upload-payload guard", rsg.some((g) => /check-upload-payload-static\.mjs$/.test(g)));
check("E-06: includes this orchestrator guard", rsg.some((g) => /check-money-shorts-automation-orchestrator-static\.mjs$/.test(g)));

// ── § F. pipeline stages ─────────────────────────────────────────────────────
const stages = Array.isArray(job.pipelineStages) ? job.pipelineStages : [];
const stageIds = stages.map((s) => s.stage);
check("F-01: pipelineStages is a non-empty array", stages.length >= 6);
check("F-02: stage source_facts present", stageIds.includes("source_facts"));
check("F-03: stage visual_set present", stageIds.includes("visual_set"));
check("F-04: stage platform_render_profiles present", stageIds.includes("platform_render_profiles"));
check("F-05: stage final_video_accepted present", stageIds.includes("final_video_accepted"));
check("F-06: stage public_bridge present", stageIds.includes("public_bridge"));
check("F-07: stage youtube_published present", stageIds.includes("youtube_published"));
check("F-08: stage instagram_published present", stageIds.includes("instagram_published"));
check("F-09: every stage has a readyCriterion", stages.every((s) => isStr(s.readyCriterion)));
check("F-10: every stage has a boolean completed flag", stages.every((s) => typeof s.completed === "boolean"));

// ── § G. platform publish policy (render profile enforcement) ────────────────
check("G-01: youtube requiredRenderProfileId === youtube_shorts_safe_frame_v1", ppp.youtube_shorts?.requiredRenderProfileId === "youtube_shorts_safe_frame_v1");
check("G-02: youtube renderProfileId === youtube_shorts_safe_frame_v1", ppp.youtube_shorts?.renderProfileId === "youtube_shorts_safe_frame_v1");
check("G-03: youtube categoryId === '27'", ppp.youtube_shorts?.categoryId === "27");
check("G-04: instagram requiredRenderProfileId === instagram_reels_full_vertical_v1", ppp.instagram_reels?.requiredRenderProfileId === "instagram_reels_full_vertical_v1");
check("G-05: instagram renderProfileId === instagram_reels_full_vertical_v1", ppp.instagram_reels?.renderProfileId === "instagram_reels_full_vertical_v1");
check("G-06: instagram requires public https video url", ppp.instagram_reels?.requiresPublicHttpsVideoUrl === true);
check("G-07: futureRenderMustSelectPlatformProfile === true", ppp.futureRenderMustSelectPlatformProfile === true);
check("G-08: youtube_shorts published flag true", ppp.youtube_shorts?.published === true);
check("G-09: instagram_reels published flag true", ppp.instagram_reels?.published === true);

// ── § H. side-effect policy (no-live default) ────────────────────────────────
check("H-01: sideEffectPolicy.mode === no_live", sep.mode === "no_live");
check("H-02: liveImageGenerationAllowed === false", sep.liveImageGenerationAllowed === false);
check("H-03: liveTtsAllowed === false", sep.liveTtsAllowed === false);
check("H-04: liveRenderMuxAllowed === false", sep.liveRenderMuxAllowed === false);
check("H-05: liveUploadAllowed === false", sep.liveUploadAllowed === false);
check("H-06: liveDeployAllowed === false", sep.liveDeployAllowed === false);
check("H-07: liveSourceRequeryAllowed === false", sep.liveSourceRequeryAllowed === false);
check("H-08: orchestratorMayRunStaticGuardsReadOnly === true", sep.orchestratorMayRunStaticGuardsReadOnly === true);
check("H-09: orchestrator public URL check preflight-only", sep.orchestratorMayCheckPublicUrlInPreflightOnly === true);

// ── § I. owner approval + boundary ───────────────────────────────────────────
check("I-01: ownerApprovalState present", typeof job.ownerApprovalState === "object" && job.ownerApprovalState !== null);
check("I-02: finalVideoAcceptedByOwner === true", job.ownerApprovalState?.finalVideoAcceptedByOwner === true);
check("I-03: uploadFirstRunApprovedByOwner === true", job.ownerApprovalState?.uploadFirstRunApprovedByOwner === true);
check("I-04: nextJobAutomationApprovedByOwner === false (not auto-approved)", job.ownerApprovalState?.nextJobAutomationApprovedByOwner === false);
check("I-05: boundary.noUploadOrPublish === true", job.boundary?.noUploadOrPublish === true);
check("I-06: boundary.noDeploy === true", job.boundary?.noDeploy === true);
check("I-07: boundary.noEnvOrSecretAccess === true", job.boundary?.noEnvOrSecretAccess === true);
check("I-08: boundary.dataOnly === true", job.boundary?.dataOnly === true);

// ── § J. runner safety (no-live, env-free, live-abort) ───────────────────────
check("J-01: runner declares NO-LIVE in header", /NO-LIVE/.test(runnerText));
check("J-02: runner recognizes --mode status|preflight", /--mode/.test(runnerText) && /["']status["']/.test(runnerText) && /["']preflight["']/.test(runnerText));
check("J-03: runner recognizes --job", /getArg\(["']--job["']\)/.test(runnerText));
check("J-04: runner supports --json", /--json/.test(runnerText));
check("J-05: runner supports --out-dir", /--out-dir/.test(runnerText));
check("J-06: runner ABORTs on --arm", /FORBIDDEN_LIVE_FLAGS/.test(runnerText) && /--arm/.test(runnerText));
check("J-07: runner ABORTs on --publish/--upload/--deploy", /--publish/.test(runnerText) && /--upload/.test(runnerText) && /--deploy/.test(runnerText));
check("J-08: runner exits non-zero on live flag (ABORT path)", /ABORT: Automation Orchestrator v1 is NO-LIVE/.test(runnerText));
check("J-09: runner does NOT read process.env for secrets", !/process\.env\./.test(runnerCode));
// match a .env FILE reference (.env, .env.local, ".env", '.env"'), not the substring
// inside identifiers like `envOrNetworkFailure`. Requires a non-identifier char before ".env".
check("J-10: runner does NOT read a .env file", !/(^|[^A-Za-z0-9_])\.env(\.[A-Za-z]+)?(["'`\s)]|$)/m.test(runnerCode));

// runner does not perform live generation/upload/deploy/render (code-only, comments excluded)
check("J-11: runner has no youtube upload API call", !/videos\.insert|youtube\.upload/i.test(runnerCode));
check("J-12: runner has no instagram publish API call", !/media_publish|graph\.facebook\.com/i.test(runnerCode));
check("J-13: runner has no vercel deploy call", !/vercel\s+(deploy|--prod)|vercel deploy/i.test(runnerCode));
check("J-14: runner does not spawn ffmpeg/ffprobe (no render/mux)", !/spawnSync\(["'](ffmpeg|ffprobe)["']/.test(runnerCode));
check("J-15: runner does not import googleapis/openai/playwright/elevenlabs", !/(import|require)[^\n]*['"`](googleapis|openai|playwright|elevenlabs)['"`]/i.test(runnerCode));
check("J-16: runner does not call OpenAI/ElevenLabs/ECOS endpoints", !/api\.openai\.com|api\.elevenlabs\.io|ecos\.bok\.or\.kr/i.test(runnerCode));

// runner spawns guards read-only, no install
check("J-17: runner spawns node on guard scripts (read-only guard run)", /spawnSync\(process\.execPath/.test(runnerText));
check("J-18: runner spawnSync uses shell:false", /shell:\s*false/.test(runnerText));
check("J-19: runner does NOT run npm/pnpm/yarn install", !/(npm|pnpm|yarn)\s+(install|add|i)\b/.test(runnerCode) && !/["'](install|add)["']/.test(runnerCode));
check("J-20: runner guards write only into out-dir outside repo", /must be OUTSIDE repo root/.test(runnerText) && /startsWith\(REPO_ROOT/.test(runnerText));
check("J-21: runner writes record file name automation-status.json", /automation-status\.json/.test(runnerText));
check("J-22: runner marks liveExecuted false in output", /liveExecuted:\s*false/.test(runnerText));

// status vs preflight network discipline
check("J-23: runner checks public URL reachability only in preflight branch", /mode === ["']preflight["']/.test(runnerText) && /checkPublicUrlReachable/.test(runnerText));
check("J-24: runner classifies env_network_failure separately", /env_network_failure/.test(runnerText));
check("J-25: runner does not escalate net failure to upload/deploy", !/if\s*\(\s*.*env_network_failure[\s\S]{0,80}(upload|deploy|publish)/i.test(runnerText));

// rollup decisions present
check("J-26: rollup exposes nextJobCanStart", /nextJobCanStart/.test(runnerText));
check("J-27: rollup exposes rerunRequired", /rerunRequired/.test(runnerText));
check("J-28: rollup exposes youtubePublished/instagramPublished", /youtubePublished/.test(runnerText) && /instagramPublished/.test(runnerText));
check("J-29: rollup exposes platformRenderProfilesReady", /platformRenderProfilesReady/.test(runnerText));

// ── § K. no credential / forbidden-file references ───────────────────────────
check("K-01: job fixture has no access_token/accessToken", !/access_?token/i.test(jobRaw));
check("K-02: job fixture has no refresh_token", !/refresh_?token/i.test(jobRaw));
check("K-03: job fixture has no client_secret/api_key", !/client_?secret|api_?key/i.test(jobRaw));
check("K-04: job fixture has no OAuth code field", !/oauth[_-]?code|["']code["']\s*:/i.test(jobRaw));
check("K-05: job fixture has no EAA/IGA token-looking string", !/\b(EAA|IGA)[A-Za-z0-9]{20,}/.test(jobRaw));
check("K-06: job fixture does not reference the codex transfer doc", !jobRaw.includes(CTX_TRANSFER_TOKEN));
check("K-07: job fixture does not reference the diag output file", !jobRaw.includes(PIQ_TOKEN));
check("K-08: runner does not reference the codex transfer doc", !runnerText.includes(CTX_TRANSFER_TOKEN));
check("K-09: runner does not reference the diag output file", !runnerText.includes(PIQ_TOKEN));
check("K-10: guard does not reference the codex transfer doc", !selfText.includes(CTX_TRANSFER_TOKEN));
check("K-11: guard does not reference the diag output file", !selfText.includes(PIQ_TOKEN));
check("K-12: guard does not import googleapis/openai/playwright/elevenlabs", !/(import|require)[^\n]*['"`](googleapis|openai|playwright|elevenlabs)['"`]/i.test(selfText));
check("K-13: guard does not spawn/exec child processes (pure static)", !new RegExp("spawn" + "Sync?\\(|" + "exec" + "(Sync)?\\(").test(selfText));

// ── § L. dual-platform publish CONTRACT bridge (shared, job-agnostic, no-live) ──
// Naming/meaning fix: this is a SHARED, job-agnostic contract reference — NOT
// this job's own publish plan. Old field/output names (…PublishPlanManifest,
// …PublishPlan) must NOT reappear (cross-content confusion regression guard).
const dpcm = job.dualPlatformPublishContractManifest ?? {};

check("L-00a: old field name dualPlatformPublishPlanManifest is NOT present on job (renamed to Contract)", !("dualPlatformPublishPlanManifest" in job));
check("L-00b: runner does NOT reference old field name dualPlatformPublishPlanManifest", !/dualPlatformPublishPlanManifest/.test(runnerText));
check("L-00c: runner does NOT expose old output name dualPlatformPublishPlan: (old rollup var)", !/dualPlatformPublishPlan:\s*dualPlatformPublishPlanRollup/.test(runnerText));
check("L-00d: job fixture JSON text does NOT contain old field name string", !jobRaw.includes("dualPlatformPublishPlanManifest"));

check("L-01: dualPlatformPublishContractManifest.path present", isStr(dpcm.path));
check("L-02: dualPlatformPublishContractManifest references dual_platform_final_publish_orchestrator.v1.json", /dual_platform_final_publish_orchestrator\.v1\.json$/.test(dpcm.path ?? ""));
check("L-03: dualPlatformPublishContractManifest.schemaVersion === dual_platform_final_publish_orchestrator_v1", dpcm.schemaVersion === "dual_platform_final_publish_orchestrator_v1");
check("L-04: dualPlatformPublishContractManifest.runnerPath references the dry-run runner", /run-dual-platform-final-publish-orchestrator\.mjs$/.test(dpcm.runnerPath ?? ""));
check("L-05: dualPlatformPublishContractManifest.staticGuardPath references its own guard", /check-dual-platform-final-publish-orchestrator-static\.mjs$/.test(dpcm.staticGuardPath ?? ""));
check("L-06: dualPlatformPublishContractManifest.runnerAllowedFlags is exactly ['--dry-run']", Array.isArray(dpcm.runnerAllowedFlags) && dpcm.runnerAllowedFlags.length === 1 && dpcm.runnerAllowedFlags[0] === "--dry-run");
check("L-07: requiredStaticGuards does NOT duplicate the dual-platform contract guard (avoids double-spawn)", !rsg.some((g) => /check-dual-platform-final-publish-orchestrator-static\.mjs$/.test(g)));
check("L-07a: dualPlatformPublishContractManifest.isJobAgnosticSharedContract === true", dpcm.isJobAgnosticSharedContract === true);

// cross-content separation: reference evidence must be clearly distinct from this job's own publishRecords
const cre = dpcm.contractReferenceEvidence ?? {};
check("L-07b: contractReferenceEvidence.contentId is a DIFFERENT content unit than this job's jobId", isStr(cre.contentId) && !(job.jobId ?? "").includes(cre.contentId));
check("L-07c: contractReferenceEvidence.instagramMediaId differs from this job's own expectedMediaId (no cross-content substitution)", cre.instagramMediaId !== pr.instagram_reels?.expectedMediaId);
check("L-07d: contractReferenceEvidence.youtubeVideoId differs from this job's own expectedVideoId (no cross-content substitution)", cre.youtubeVideoId !== pr.youtube_shorts?.expectedVideoId);
check("L-07e: manifest note explicitly states it does not replace/override this job's publishRecords", /publishRecords/.test(dpcm.note ?? "") && /(대체|덮어쓰지)/.test(dpcm.note ?? ""));

// runner: contract bridge is read-only reference + read-only guard spawn only, never live-runs the publish runner
check("L-08: runner reads dualPlatformPublishContractManifest block", /dualPlatformPublishContractManifest/.test(runnerText));
check("L-09: runner checks noLiveThisSlice on the fixture", /noLiveThisSlice/.test(runnerText));
check("L-10: runner checks Instagram + YouTube jobs present", /instagram_job/.test(runnerText) && /youtube_job/.test(runnerText));
check("L-11: runner checks metadataOptimizationGate presence", /publishMetadataOptimizationGate/.test(runnerText));
check("L-12: runner checks duplicatePublishGuard uses v3_2", /duplicatePublishGuard/.test(runnerText) && /v3_2/.test(runnerText));
check("L-13: runner checks reference evidence matches known mediaId/videoId", /17916511431199303/.test(runnerText) && /r9jhckdpC9w/.test(runnerText));
check("L-14: runner exposes dualPlatformPublishContract in output (backward-compatible null)", /dualPlatformPublishContract:\s*dualPlatformPublishContractRollup/.test(runnerText));
check("L-14a: runner's contract rollup field is named dualPlatformPublishContractReady (not …PublishPlanReady)", /dualPlatformPublishContractReady/.test(runnerText) && !/dualPlatformPublishPlanReady/.test(runnerText));
check("L-14b: runner comments/rollup clarify contract readiness is not this job's completion", /(shared contract|job-agnostic)/i.test(runnerText) && /(대체하지 않는다|does not substitute|never substitutes)/i.test(runnerText));
check("L-15: runner does NOT invoke the publish runner script path directly (bridge is read-only + guard-spawn only)", !new RegExp("spawn" + "Sync\\([^)]*run-dual-platform-final-publish-orchestrator").test(runnerCode));
check("L-16: runner's contract guard spawn is gated to preflight mode only", /mode === ["']preflight["'][\s\S]{0,400}dpcm\.staticGuardPath/.test(runnerText));
check("L-17: runner's contract guard spawn uses shell:false (same as other guards)", /dpcm\.staticGuardPath[\s\S]{0,400}shell:\s*false/.test(runnerText));

// ── result ────────────────────────────────────────────────────────────────────
const pass = results.filter((r) => r.pass);
const fail = results.filter((r) => !r.pass);
console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  AUTOMATION ORCHESTRATOR v1 — STRUCTURE/SAFETY GUARD`);
console.log(`══════════════════════════════════════════════════════════`);
for (const r of results) {
  console.log(`  ${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
}
console.log(`\n──────────────────────────────────────────────────────────`);
console.log(`  TOTAL : ${results.length}  |  PASS : ${pass.length}  |  FAIL : ${fail.length}`);
console.log(`──────────────────────────────────────────────────────────\n`);
if (fail.length > 0) {
  console.error(`GUARD FAILED (${fail.length} failures):`);
  for (const r of fail) console.error(`  FAIL  ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
  process.exit(1);
} else {
  console.log(`GUARD OK: automation orchestrator structure/safety intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
