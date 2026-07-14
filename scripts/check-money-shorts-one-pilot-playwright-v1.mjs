#!/usr/bin/env node
/** Static fail-closed checks for the one-topic Playwright production runner. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runnerPath = path.join(root, "scripts", "run-money-shorts-one-pilot-playwright.mjs");
const wizardPath = path.join(root, "components", "VideoCreationWizard.tsx");
const routePath = path.join(root, "app", "api", "money-shorts", "operator", "route.ts");
const publishRunnerPath = path.join(root, "scripts", "run-final-e2e-dual-platform-publish-once.mjs");
const runner = fs.readFileSync(runnerPath, "utf8");
const wizard = fs.readFileSync(wizardPath, "utf8");
const route = fs.readFileSync(routePath, "utf8");
const publishRunner = fs.readFileSync(publishRunnerPath, "utf8");
let passed = 0;
let failed = 0;
function check(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}`);
  }
}

check("runner imports Playwright", runner.includes('from "playwright"'));
check("runner accepts fresh or exact-topic generation, image regeneration, caption rerender, review, or publish modes", runner.includes('["generate", "resume-generate", "regenerate-images", "rerender-captions", "review", "publish"].includes(mode)'));
check("exact-topic generation refreshes script and TTS before Playwright images", /mode === "resume-generate"[\s\S]+clickAction\(page, "scriptPreview"[\s\S]+clickAction\(page, "realTtsCreate"[\s\S]+clickAction\(page, "realSceneImagesCreate"/.test(runner));
check("generation has an exact approval token", runner.includes("APPROVE_ONE_PILOT_GENERATION"));
check("image regeneration has a separate exact approval token", runner.includes("APPROVE_ONE_PILOT_IMAGE_REGENERATION"));
check("caption rerender has a separate exact approval token", runner.includes("APPROVE_ONE_PILOT_CAPTION_RERENDER"));
check("publish has a separate exact approval token", runner.includes("APPROVE_ONE_PILOT_DUAL_PUBLISH"));
check("runner is localhost-only", runner.includes("localhost|127\\.0\\.0\\.1"));
check("runner evidence remains under C tmp", runner.includes("MEDIA_ROOT_RE.test(evidenceRoot"));
check("runner selects exactly one sorted topic", runner.includes("chooseOneTopic") && runner.includes(")[0]"));
check("runner never iterates topic production", !/for\s*\([^)]*topics/.test(runner) && !/topics\.forEach/.test(runner));
check("generate sequence uses every required UI action", [
  "topicRecommend",
  "scriptPreview",
  "realTtsCreate",
  "realSceneImagesCreate",
  "finalVideoCreate",
  "wizardPreflight",
].every((action) => runner.includes(`"${action}"`)));
check("publish is performed only by guarded UI action", runner.includes('clickAction(page, "actualUpload", "wizard-action-upload"'));
check("runner contains no direct platform SDK/API", !/graph\.facebook|googleapis|instagram\.com\//.test(runner));
check("runner verifies browser video playback", runner.includes("FINAL_VIDEO_PLAYBACK_FAILED") && runner.includes("currentTime < 0.25"));
check("review mode never enters the publish confirmation branch", runner.includes('if (mode === "review")') && runner.includes("REVIEWED_PREFLIGHT_OK_AWAITING_OWNER_PUBLISH"));
check("image regeneration reuses TTS and rebuilds images plus video", runner.includes("SCRIPT_OR_REAL_TTS_NOT_READY") && runner.includes("REGENERATED_PREFLIGHT_OK_AWAITING_REVIEW"));
check("caption rerender reuses both TTS and images and rebuilds only the video", runner.includes("SCRIPT_TTS_OR_IMAGES_NOT_READY") && runner.includes("CAPTION_RERENDERED_PREFLIGHT_OK_AWAITING_REVIEW"));
check("runner verifies media quality gate", runner.includes("mediaQualityGate?.ok !== true"));
check("publish requires the reviewed MP4 to match", runner.includes("REVIEWED_VIDEO_MISMATCH"));
check("runner records whether live publish was invoked", runner.includes("externalPublishInvoked"));
check("runner stops when any action is not success", runner.includes('payload?.status !== "success"'));
check("wizard exposes stable topic/action selectors", [
  "wizard-topic-card",
  "wizard-topic-make",
  "wizard-action-script",
  "wizard-action-real-tts",
  "wizard-action-real-images",
  "wizard-action-final-video",
  "wizard-action-preview",
  "wizard-action-preflight",
  "wizard-action-upload",
].every((selector) => wizard.includes(selector)) && wizard.includes("wizard-category-${c.id}"));
check("wizard supports safe topic resume", wizard.includes("resumeTopicId") && wizard.includes("^[a-z0-9][a-z0-9_-]{2,180}$"));
check("changing topic resets all three confirmations", [
  "setConfirmReviewed(false)",
  "setConfirmDiscoveryReady(false)",
  "setConfirmPublish(false)",
].every((statement) => wizard.includes(statement)));
check(
  "complete or stale per-part image sets receive a full prompt-revalidation timeout",
  route.includes("const countedRemainingScenes = expectedScenes -") &&
  route.includes("const remainingScenes = countedRemainingScenes <= 0 ? expectedScenes : Math.max(1, countedRemainingScenes)"),
);
check("publish ledger records the actual YouTube source filename", publishRunner.includes("sourceFileName: basename(ytSourcePath)") && !publishRunner.includes('sourceFileName: "golden_sample_t2_salary_3days'));

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
