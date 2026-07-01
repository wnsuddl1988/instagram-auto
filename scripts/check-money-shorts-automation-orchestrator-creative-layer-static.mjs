#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-money-shorts-automation-orchestrator-creative-layer-static.mjs
//
// ORCHESTRATOR CREATIVE LAYER INTEGRATION — STRUCTURE/SAFETY GUARD (no execution)
//
// 검증 대상:
//   - Creative Layer job manifest (money-shorts-automation-job.creative-layer-*.v1.json)
//   - orchestrator (run-money-shorts-automation-orchestrator-v1.mjs)
//   - Phase 1~5 fixtures (schemaVersion 정합)
//   - self
//
// 핵심: orchestrator가 Creative Layer Phase 1~5를 no-live 상태로 연결하고,
//   - Creative stage들이 status output에 존재
//   - requiredFinalArtifacts 9개가 contract와 일치
//   - quality scorer selected candidate == orchestrator selected candidate
//   - preview는 dev-only이고 operational gate가 아님
//   - hard fail이 있으면 render/render_best_candidate ready 처리 금지
//   - renderer registry unsupported count 0
//   - YouTube safe-frame profile 참조 유지
//   - no-live boundary 유지 (upload/publish/deploy/render/image/TTS/API/env 금지)
//   - 기존 published YouTube/Instagram 상태 미변경
//
// Node built-in only. 외부 네트워크/렌더 실행 없음. 순수 정적 검사.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const F = (n) => join(__dirname, "fixtures", n);
const JOB_PATH = F("money-shorts-automation-job.creative-layer-base-rate-202605.v1.json");
const ORCH_PATH = join(__dirname, "run-money-shorts-automation-orchestrator-v1.mjs");
const CONTRACT_PATH = F("money-shorts-creative-quality-contract.v1.json");
const SCRIPT_PATH = F("money-shorts-retention-script-compiler.output.v1.json");
const PLANNER_PATH = F("money-shorts-scene-event-planner.output.v1.json");
const SCORER_PATH = F("money-shorts-quality-scorer.output.v1.json");
const PREVIEW_PATH = F("money-shorts-creative-preview-render-manifest.v1.json");
const SELF_PATH = join(__dirname, "check-money-shorts-automation-orchestrator-creative-layer-static.mjs");

const results = [];
function check(name, condition, detail = "") { results.push({ name, pass: !!condition, detail }); }
function isStr(v) { return typeof v === "string" && v.length > 0; }
function isArr(v) { return Array.isArray(v); }

const CTX_TRANSFER_TOKEN = "CONTEXT" + "_TRANSFER_" + "CODEX";
const PIQ_TOKEN = "piq" + "_diag_" + "out";

let jobRaw, job, orchText, contract, script, planner, scorer, preview, selfText;
try {
  jobRaw = readFileSync(JOB_PATH, "utf8");
  job = JSON.parse(jobRaw);
  orchText = readFileSync(ORCH_PATH, "utf8");
  contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));
  script = JSON.parse(readFileSync(SCRIPT_PATH, "utf8"));
  planner = JSON.parse(readFileSync(PLANNER_PATH, "utf8"));
  scorer = JSON.parse(readFileSync(SCORER_PATH, "utf8"));
  preview = JSON.parse(readFileSync(PREVIEW_PATH, "utf8"));
  selfText = readFileSync(SELF_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read/parse inputs: ${e.message}`);
  process.exit(2);
}

const cl = job.creativeLayer ?? {};
const orchCode = orchText.split(/\r?\n/).filter((ln) => !/^\s*\/\//.test(ln)).join("\n");

// ── § A. job manifest + creativeLayer block ──────────────────────────────────
check("A-01: job schemaVersion === money_shorts_automation_job_v1", job.schemaVersion === "money_shorts_automation_job_v1");
check("A-02: job jobId references creative-layer", /creative-layer/.test(job.jobId ?? ""));
check("A-03: job category === money_shorts", job.category === "money_shorts");
check("A-04: job has creativeLayer block", typeof job.creativeLayer === "object" && job.creativeLayer !== null);
check("A-05: creativeLayer isPartOfProductionPipeline === true", cl.isPartOfProductionPipeline === true);
check("A-06: creativeLayer isSeparateExperiment === false", cl.isSeparateExperiment === false);
check("A-07: creativeLayer has phases object", typeof cl.phases === "object" && cl.phases !== null);
check("A-08: creativeLayer creativeSelectedTopicId present", isStr(cl.creativeSelectedTopicId));
check("A-09: creativeLayer creativeSelectedCandidateId present", isStr(cl.creativeSelectedCandidateId));

// ── § B. Phase 1~5 fixture refs + schemaVersion ──────────────────────────────
const PHASES = [
  ["creativeQualityContract", "money-shorts-creative-quality-contract.v1.json", "money_shorts_creative_quality_contract_v1"],
  ["retentionScriptCompilerOutput", "money-shorts-retention-script-compiler.output.v1.json", "money_shorts_retention_script_compiler_output_v1"],
  ["sceneEventPlannerOutput", "money-shorts-scene-event-planner.output.v1.json", "money_shorts_scene_event_planner_output_v1"],
  ["qualityScorerOutput", "money-shorts-quality-scorer.output.v1.json", "money_shorts_quality_scorer_output_v1"],
  ["creativePreviewRenderManifest", "money-shorts-creative-preview-render-manifest.v1.json", "money_shorts_creative_preview_render_manifest_v1"],
];
PHASES.forEach(([key, fname, schema], i) => {
  const ph = cl.phases?.[key] ?? {};
  check(`B-${i + 1}-01: phase ${key} path references ${fname}`, new RegExp(fname.replace(/\./g, "\\.") + "$").test(ph.path ?? ""));
  check(`B-${i + 1}-02: phase ${key} declared schemaVersion === ${schema}`, ph.schemaVersion === schema);
  const abs = ph.path ? join(__dirname, "..", ph.path) : null;
  check(`B-${i + 1}-03: phase ${key} fixture file exists`, abs && existsSync(abs));
});
// actual fixture schemaVersions match
check("B-06: contract fixture schemaVersion matches", contract.schemaVersion === "money_shorts_creative_quality_contract_v1");
check("B-07: script fixture schemaVersion matches", script.schemaVersion === "money_shorts_retention_script_compiler_output_v1");
check("B-08: planner fixture schemaVersion matches", planner.schemaVersion === "money_shorts_scene_event_planner_output_v1");
check("B-09: scorer fixture schemaVersion matches", scorer.schemaVersion === "money_shorts_quality_scorer_output_v1");
check("B-10: preview fixture schemaVersion matches", preview.schemaVersion === "money_shorts_creative_preview_render_manifest_v1");

// ── § C. required final artifacts (9 files) match contract ───────────────────
const EXPECTED_ARTIFACTS = ["script.json", "hook_candidates.json", "scene_plan.json", "caption_plan.json", "sound_plan.json", "quality_report.json", "selected_candidate.json", "platform_metadata.json", "final_video.mp4"];
const finalArtifacts = contract.productionGoal?.requiredFinalArtifacts ?? [];
check("C-01: contract requiredFinalArtifacts has exactly 9", finalArtifacts.length === 9);
check("C-02: contract requiredFinalArtifacts match the 9 expected file names", EXPECTED_ARTIFACTS.every((a) => finalArtifacts.includes(a)));
EXPECTED_ARTIFACTS.forEach((a, i) => check(`C-03-${i + 1}: contract has ${a}`, finalArtifacts.includes(a)));

// ── § D. creative stages present in orchestrator ─────────────────────────────
const CREATIVE_STAGE_IDS = [
  "creative_quality_contract", "creative_final_artifacts", "retention_script_compiler",
  "scene_event_planner", "quality_scorer", "selected_creative_candidate", "render_decision",
  "creative_preview_dev_only", "creative_youtube_safe_frame", "analytics_feedback_loop_roadmap_only",
];
CREATIVE_STAGE_IDS.forEach((id, i) => {
  check(`D-${i + 1}: orchestrator records stage '${id}'`, orchText.includes(`"${id}"`));
});
// orchestrator only runs creative block when job.creativeLayer present (backward compatible)
check("D-11: orchestrator gates creative block on job.creativeLayer", /const cl = job\.creativeLayer/.test(orchText) && /if \(cl\)/.test(orchText));
check("D-12: orchestrator emits creativeLayer rollup key", /creativeLayer: creativeRollup/.test(orchText));

// ── § E. rollup keys required by integration spec ────────────────────────────
const REQUIRED_ROLLUP_KEYS = [
  "creativeQualityContractReady", "retentionScriptCompilerReady", "sceneEventPlannerReady",
  "qualityScorerReady", "creativePreviewDevOnlyReady", "creativeLayerReady",
  "selectedCreativeCandidateReady", "renderDecisionReady", "analyticsFeedbackLoopRoadmapOnly",
];
REQUIRED_ROLLUP_KEYS.forEach((k, i) => {
  check(`E-${i + 1}: orchestrator creativeRollup has '${k}'`, orchText.includes(`${k}:`) || orchText.includes(`${k} `));
});

// ── § F. quality scorer selected candidate == orchestrator selected candidate ─
const scorerTopic = scorer.topics.find((t) => t.topicId === cl.creativeSelectedTopicId) ?? scorer.topics[0];
const scorerSelectedId = scorerTopic?.selectedCandidate?.candidateId;
check("F-01: quality scorer selected candidate exists", isStr(scorerSelectedId));
check("F-02: job creativeSelectedCandidateId matches quality scorer selected candidate", cl.creativeSelectedCandidateId === scorerSelectedId);
check("F-03: quality scorer decision is render (passing sample)", scorerTopic?.qualityReport?.final_decision === "render");
check("F-04: quality scorer selected topic hard_fail_reasons empty", (scorerTopic?.qualityReport?.hard_fail_reasons?.length ?? 1) === 0);
check("F-05: orchestrator ties selected candidate ready to scorer selected candidate", /scorerSelectedId === cl\.creativeSelectedCandidateId/.test(orchText));

// ── § G. render decision + hard fail policy ──────────────────────────────────
check("G-01: orchestrator allows render only for render|render_best_candidate", /decision === ["']render["'] \|\| decision === ["']render_best_candidate["']/.test(orchText));
check("G-02: orchestrator requires hardFailCount === 0 for selected candidate ready", /hardFailCount === 0/.test(orchText));
check("G-03: orchestrator requires hardFailCount === 0 for render decision ready", /renderDecisionReady = .*hardFailCount === 0/.test(orchText));
check("G-04: job renderDecisionPolicy hardFailForbidsRenderBestCandidate === true", cl.renderDecisionPolicy?.hardFailForbidsRenderBestCandidate === true);
check("G-05: job renderDecisionPolicy readyOnlyWhenDecisionRenderOrBest === true", cl.renderDecisionPolicy?.creativeSelectedCandidateReadyOnlyWhenDecisionIsRenderOrRenderBestCandidate === true);

// ── § H. preview is dev-only, NOT operational gate ───────────────────────────
check("H-01: preview manifest previewIsDevelopmentOnly === true", preview.previewIsDevelopmentOnly === true);
check("H-02: preview manifest operationalRequiredReview === false", preview.operationalRequiredReview === false);
check("H-03: job previewPolicy previewIsDevelopmentOnly === true", cl.previewPolicy?.previewIsDevelopmentOnly === true);
check("H-04: job previewPolicy operationalRequiredReview === false", cl.previewPolicy?.operationalRequiredReview === false);
check("H-05: orchestrator checks previewIsDevelopmentOnly true", /previewIsDevelopmentOnly === true/.test(orchText));
check("H-06: orchestrator checks operationalRequiredReview false", /operationalRequiredReview === false/.test(orchText));
check("H-07: orchestrator flags creativePreviewIsOperationalGate (must be false)", /creativePreviewIsOperationalGate/.test(orchText));

// ── § I. renderer template registry unsupported == 0 ─────────────────────────
const plannerTopic = planner.topics.find((t) => t.topicId === cl.creativeSelectedTopicId) ?? planner.topics[0];
check("I-01: planner selected topic has 24+ visual events", (plannerTopic?.scenePlan?.totalVisualEvents ?? 0) >= 24);
check("I-02: planner selected topic unsupported template count === 0", (plannerTopic?.templateRegistryAudit?.unsupportedTemplateUsedCount ?? 1) === 0);
check("I-03: orchestrator requires unsupported template count 0 for planner ready", /plannerUnsupported === 0/.test(orchText));
check("I-04: job renderDecisionPolicy unsupportedMustBeZero === true", cl.renderDecisionPolicy?.rendererUnsupportedTemplateUsedCountMustBeZero === true);

// ── § J. YouTube safe-frame profile reference preserved ──────────────────────
check("J-01: preview manifest targets youtube_shorts_safe_frame_v1", preview.targetPlatformProfile === "youtube_shorts_safe_frame_v1");
check("J-02: job renderDecisionPolicy youtubeSafeFrameProfileId === youtube_shorts_safe_frame_v1", cl.renderDecisionPolicy?.youtubeSafeFrameProfileId === "youtube_shorts_safe_frame_v1");
check("J-03: orchestrator records creative_youtube_safe_frame stage", orchText.includes("creative_youtube_safe_frame"));
check("J-04: platformPublishPolicy youtube requires safe-frame profile", job.platformPublishPolicy?.youtube_shorts?.requiredRenderProfileId === "youtube_shorts_safe_frame_v1");

// ── § K. analytics feedback loop roadmap-only ────────────────────────────────
check("K-01: job analyticsFeedbackLoop status roadmap_not_implemented_v1", cl.analyticsFeedbackLoop?.status === "roadmap_not_implemented_v1");
check("K-02: job analyticsFeedbackLoop phase === 8", cl.analyticsFeedbackLoop?.phase === 8);
check("K-03: orchestrator marks analytics roadmap-only", /analytics_feedback_loop_roadmap_only/.test(orchText) && /roadmap_not_implemented_v1/.test(orchText));

// ── § L. published state preserved (not modified) ────────────────────────────
check("L-01: job youtubeShortsUrl unchanged (eX622q9dNOI)", /eX622q9dNOI/.test(job.youtubeShortsUrl ?? ""));
check("L-02: job instagramReelsUrl unchanged (17910778836241106)", /17910778836241106/.test(job.instagramReelsUrl ?? ""));
check("L-03: job publishRecords youtube expectedVideoId eX622q9dNOI", job.publishRecords?.youtube_shorts?.expectedVideoId === "eX622q9dNOI");
check("L-04: job publishRecords instagram expectedMediaId 17910778836241106", job.publishRecords?.instagram_reels?.expectedMediaId === "17910778836241106");
check("L-05: orchestrator does not mutate publish records (read-only readJsonSafe)", /readJsonSafe\(p\)/.test(orchText) && !/writeFileSync\([^)]*live-upload-first-run-record/.test(orchText));

// ── § M. no-live boundary in orchestrator ────────────────────────────────────
check("M-01: orchestrator declares NO-LIVE", /NO-LIVE/.test(orchText));
check("M-02: orchestrator ABORTs on --arm/--publish/--upload/--deploy", /FORBIDDEN_LIVE_FLAGS/.test(orchText) && /--arm/.test(orchText) && /--publish/.test(orchText) && /--upload/.test(orchText) && /--deploy/.test(orchText));
check("M-03: orchestrator has no youtube upload API call", !/videos\.insert|youtube\.upload/i.test(orchCode));
check("M-04: orchestrator has no instagram publish API call", !/media_publish|graph\.facebook\.com/i.test(orchCode));
check("M-05: orchestrator has no vercel deploy", !/vercel\s+(deploy|--prod)/i.test(orchCode));
check("M-06: orchestrator does not spawn ffmpeg/ffprobe (no render)", !/spawnSync\(["'](ffmpeg|ffprobe)["']/.test(orchCode));
check("M-07: orchestrator does not import openai/googleapis/playwright/elevenlabs", !/(import|require)[^\n]*['"`](openai|googleapis|playwright|elevenlabs)['"`]/i.test(orchCode));
check("M-08: orchestrator does not read process.env for secrets", !/process\.env\./.test(orchCode));
check("M-09: orchestrator does not read a .env file", !/(^|[^A-Za-z0-9_])\.env(\.[A-Za-z]+)?(["'`\s)]|$)/m.test(orchCode));
check("M-10: orchestrator does not call openai/elevenlabs/ecos endpoints", !/api\.openai\.com|api\.elevenlabs\.io|ecos\.bok\.or\.kr/i.test(orchCode));
check("M-11: job sideEffectPolicy.mode === no_live", job.sideEffectPolicy?.mode === "no_live");
check("M-12: job boundary noUploadOrPublish/noRenderMuxFfmpeg/noEnvOrSecretAccess true", job.boundary?.noUploadOrPublish === true && job.boundary?.noRenderMuxFfmpeg === true && job.boundary?.noEnvOrSecretAccess === true);
check("M-13: orchestrator only spawns node on guard scripts (preflight read-only)", /spawnSync\(process\.execPath/.test(orchText) && /shell:\s*false/.test(orchText));

// ── § N. requiredStaticGuards includes creative + integration guards ─────────
const rsg = isArr(job.requiredStaticGuards) ? job.requiredStaticGuards : [];
["check-money-shorts-creative-quality-contract-static.mjs", "check-money-shorts-retention-script-compiler-static.mjs", "check-money-shorts-scene-event-planner-static.mjs", "check-money-shorts-quality-scorer-static.mjs", "check-money-shorts-creative-preview-render-static.mjs", "check-money-shorts-automation-orchestrator-creative-layer-static.mjs"].forEach((g, i) => {
  check(`N-${i + 1}: requiredStaticGuards includes ${g}`, rsg.some((x) => x.endsWith(g)));
});

// ── § O. no credential / forbidden-file refs ─────────────────────────────────
for (const [label, raw] of [["job", jobRaw], ["orchestrator", orchText]]) {
  check(`O-01:${label}: no access_token`, !/access_?token/i.test(raw));
  check(`O-02:${label}: no refresh_token`, !/refresh_?token/i.test(raw));
  check(`O-03:${label}: no client_secret/api_key`, !/client_?secret|api_?key/i.test(raw));
  check(`O-04:${label}: no OAuth code`, !/oauth[_-]?code/i.test(raw));
  check(`O-05:${label}: no EAA/IGA token-looking string`, !/\b(EAA|IGA)[A-Za-z0-9]{20,}/.test(raw));
  check(`O-06:${label}: no codex transfer doc ref`, !raw.includes(CTX_TRANSFER_TOKEN));
  check(`O-07:${label}: no diag output file ref`, !raw.includes(PIQ_TOKEN));
}
check("O-08: guard does not reference the codex transfer doc", !selfText.includes(CTX_TRANSFER_TOKEN));
check("O-09: guard does not reference the diag output file", !selfText.includes(PIQ_TOKEN));
const guardImports = (selfText.match(/^import\s+.*?from\s+["']([^"']+)["']/gm) || []).map((l) => (l.match(/from\s+["']([^"']+)["']/) || [])[1]);
const ALLOWED = new Set(["node:fs", "node:url", "node:path"]);
check("O-10: guard imports only node:fs/url/path", guardImports.length > 0 && guardImports.every((m) => ALLOWED.has(m)), `imports=${guardImports.join(",")}`);

// ── result ────────────────────────────────────────────────────────────────────
const pass = results.filter((r) => r.pass);
const fail = results.filter((r) => !r.pass);
console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  ORCHESTRATOR CREATIVE LAYER INTEGRATION — STRUCTURE/SAFETY GUARD`);
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
  console.log(`GUARD OK: orchestrator creative layer integration intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
