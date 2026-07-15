#!/usr/bin/env node
/** Static contract checks for cross-scene visual modality diversity. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imageRunner = fs.readFileSync(path.join(root, "scripts", "run-owner-real-scene-images-from-wizard-script-once.mjs"), "utf8");
const videoRunner = fs.readFileSync(path.join(root, "scripts", "run-owner-real-video-from-wizard-assets-once.mjs"), "utf8");
const helper = fs.readFileSync(path.join(root, "lib", "owner-web-operator.ts"), "utf8");
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

const modalityVersion = "money_shorts_visual_modality_sequence_v1";
const controllerVersion = "chatgpt_picture_v2_character_reference_v8";
const modes = [
  "CHARACTER_EVENT",
  "ENVIRONMENTAL_CHARACTER",
  "OBJECT_MECHANISM",
  "ARCHITECTURAL_CROSS_SECTION",
  "SPLIT_EVIDENCE",
  "SYMBOLIC_CHARACTER",
  "HANDS_ACTION",
  "OBJECT_CHECKLIST",
  "FUTURE_CHARACTER",
  "OBJECT_RESOLUTION",
];

check("image controller contract is bumped to selected-reference v8", imageRunner.includes(controllerVersion));
check("visual modality contract is versioned", imageRunner.includes(modalityVersion));
for (const mode of modes) check(`visual mode exists: ${mode}`, imageRunner.includes(`${mode}: {`));
check("scene role mapper handles shared finance flow roles", [
  'id === "hook"',
  'id === "situation"',
  'id === "consequence"',
  'id === "psychology"',
  'id === "mindset"',
  'id === "habit"',
  'id === "save"',
].every((token) => imageRunner.includes(token)));
check("no-person mode has an explicit presence gate", imageRunner.includes("PRESENCE GATE: NO PERSON"));
check("hands-only mode has an explicit presence gate", imageRunner.includes("PRESENCE GATE: HANDS ONLY"));
check("character mode keeps the approved selected-reference continuity contract", imageRunner.includes("ONE RECURRING CHARACTER IS ALLOWED") && imageRunner.includes("CHARACTER_CONTINUITY_INSTRUCTION") && imageRunner.includes("attachRef"));
check("person-free modes explicitly exclude all human silhouettes", imageRunner.includes("no human, head, face, hair, hands, body, silhouette"));
check("mode contract is placed before scene evidence in both prompt paths", (imageRunner.match(/VISUAL MODALITY CONTRACT/g) ?? []).length >= 2);
check("adjacent prompts carry previous/current/next mode ids", imageRunner.includes("MODALITY DIFFERENCE: previous mode"));
check("every scene state records mode and presence", imageRunner.includes("visualModeId: sceneVisualModes[index].id") && imageRunner.includes("presenceMode: sceneVisualModes[index].presence"));
check("old summaries cannot be reused without modality version", imageRunner.includes("previousSummary?.visualModalityVersion === VISUAL_MODALITY_VERSION"));
check("character scenes are capped to 45 percent", imageRunner.includes("Math.ceil(sceneCount * 0.45)"));
check("at least 55 percent are non-character modes", imageRunner.includes("Math.floor(sceneCount * 0.55)"));
check("modality audit requires several distinct modes", imageRunner.includes("requiredDistinctModes") && imageRunner.includes("distinctModeCount >= requiredDistinctModes"));
check("manual visual review remains required", imageRunner.includes("manualVisualReviewRequired: true"));
check("saved and final summaries include modality audit", (imageRunner.match(/visualModalityAudit: buildVisualModalityAudit/g) ?? []).length >= 2);
check("prompt audit mode runs before Playwright import", imageRunner.includes("promptAuditOnly") && imageRunner.indexOf("if (promptAuditOnly)") < imageRunner.indexOf('await import("playwright")'));
check("prompt audit detects legacy positive person instructions", imageRunner.includes("legacyPresenceConflictPatterns") && imageRunner.includes("legacyPresenceConflicts"));
check("prompt audit records that no external action occurred", imageRunner.includes("externalActionPerformed: false"));
check("prompt audit fails closed on the same sequence-level modality audit as the live summary",
  imageRunner.includes("const promptVisualModalityAudit = buildVisualModalityAudit(rows)") &&
  imageRunner.includes("visualModalityAudit: promptVisualModalityAudit") &&
  imageRunner.includes("promptVisualModalityAudit.passed"));
check("topic-scoped mode override is packet-bound and prompt-audit-only",
  imageRunner.includes("--mode-override-packet") &&
  imageRunner.includes("MODE_OVERRIDE_PACKET_ABS && !promptAuditOnly") &&
  imageRunner.includes("money_shorts_scene_mode_correction_packet_v1") &&
  imageRunner.includes("defaultSharedModeMapperMustRemainUnchanged") &&
  imageRunner.includes("topicScopedModeOverride"));
check("approved override mode is threaded through the scene prompt and adjacent-mode contract",
  imageRunner.includes("function scenePrompt(scene, sceneIndex, totalScenes, resolvedVisualModes = null)") &&
  imageRunner.includes("scenePrompt(scene, index, sceneCount, sceneVisualModes)") &&
  imageRunner.includes("resolvedVisualModes?.[sceneIndex - 1]") &&
  imageRunner.includes("resolvedVisualModes?.[sceneIndex + 1]"));
check("video runner requires selected-reference v8 controller", videoRunner.includes(controllerVersion));
check("video runner rejects missing modality audit", videoRunner.includes("visualModalityAudit?.version !== VISUAL_MODALITY_VERSION") && videoRunner.includes("visualModalityAudit?.passed !== true"));
check("video runner requires per-scene mode metadata", videoRunner.includes('typeof scene?.visualModeId === "string"') && videoRunner.includes('typeof scene?.presenceMode === "string"'));
check("web helper requires selected-reference v8 controller", helper.includes(`WIZARD_IMAGE_CONTROLLER_VERSION = "${controllerVersion}"`));
check("web helper requires modality summary and audit", helper.includes("imagesSummary.visualModalityVersion === WIZARD_VISUAL_MODALITY_VERSION") && helper.includes("imagesSummary.visualModalityAudit?.passed === true"));
check("shared style still forbids photography", imageRunner.includes("no photography, no live action"));
check("all presence modes share the bright integrated family-quality 3D style", (imageRunner.match(/Money Shorts original bright family-feature-quality cinematic 3D animation/g) ?? []).length >= 3);
check("laboratory, vault, factory, machine-room and gloomy finance environments are rejected",
  /No (?:laboratory, vault, factory|vault, factory, laboratory), machine room/.test(imageRunner) &&
  imageRunner.includes("black-metal architecture") &&
  imageRunner.includes("gloomy finance world"));
check("mode directions preserve topic-specific settings", imageRunner.includes("function topicSpecificSetting") && imageRunner.includes("topicSpecificSetting(evidence, mode)"));
check("image runner still cannot publish", !/actualUpload|instagramMediaId|youtubeVideoId/.test(imageRunner));

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
