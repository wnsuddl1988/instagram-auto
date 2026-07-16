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
const financeSceneDiversityVersion = "money_shorts_finance_scene_diversity_v2";
const compositionBlueprintVersion = "money_shorts_positive_composition_blueprint_v1";
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
check("finance scene diversity contract is versioned", imageRunner.includes(financeSceneDiversityVersion));
check("positive composition blueprint contract is versioned", imageRunner.includes(compositionBlueprintVersion));
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
check("repeated hook beats alternate into a non-character mechanism scene",
  imageRunner.includes('if (id === "hook") {') &&
  imageRunner.includes('const modeId = beat % 2 === 1 ? "CHARACTER_EVENT" : "OBJECT_MECHANISM"'));
check("no-person mode has an explicit presence gate", imageRunner.includes("PRESENCE GATE: NO PERSON"));
check("hands-only mode has an explicit presence gate", imageRunner.includes("PRESENCE GATE: HANDS ONLY"));
check("character mode keeps the approved selected-reference continuity contract", imageRunner.includes("ONE RECURRING CHARACTER IS ALLOWED") && imageRunner.includes("CHARACTER_CONTINUITY_INSTRUCTION") && imageRunner.includes("attachRef"));
check("person-free modes explicitly exclude all human silhouettes", imageRunner.includes("no human, head, face, hair, hands, body, silhouette"));
check("mode contract is placed before scene evidence in both prompt paths", (imageRunner.match(/VISUAL MODALITY CONTRACT/g) ?? []).length >= 2);
check("adjacent prompts carry previous/current/next mode ids", imageRunner.includes("MODALITY DIFFERENCE: previous mode"));
check("adjacent prompts prevent repeated finance compositions without banning finance evidence",
  imageRunner.includes("Do not repeat the immediately previous scene's exact combination") &&
  imageRunner.includes("Cash, banknotes, charts, statements and documents are allowed"));
check("manual visual repair rejects decorative excess rather than finance props themselves",
  imageRunner.includes("remain allowed when they physically prove") &&
  imageRunner.includes("never an unmotivated currency stack, coin pile or chart wall"));
check("scene diversity rotates location, camera and finance focus", [
  "FINANCE_SCENE_DIVERSITY_LOCATIONS",
  "FINANCE_SCENE_DIVERSITY_CAMERAS",
  "FINANCE_SCENE_DIVERSITY_FOCI",
  "function sceneDiversityPlan",
].every((token) => imageRunner.includes(token)));
check("positive composition blueprints cover every finance visual mode",
  imageRunner.includes("COMPOSITION_BLUEPRINTS_BY_MODE") &&
  modes.every((mode) => imageRunner.includes(`${mode}: [`)));
check("object mechanism repetitions rotate through localized depth layouts", [
  "single_anchor_near_far_result",
  "l_corner_boundary",
  "two_heights_separate_furniture",
  "doorway_cause_result",
].every((token) => imageRunner.includes(token)));
check("composition blueprint keeps relevant finance evidence localized",
  imageRunner.includes("Finance evidence allowance:") &&
  imageRunner.includes("one compact localized group only when they directly prove the beat") &&
  imageRunner.includes("keep them localized rather than removing relevant finance evidence"));
check("semantic repetition guard blocks linear money and apparatus motifs",
  imageRunner.includes("SEMANTIC REPETITION GUARD:") &&
  imageRunner.includes("line, row, trail, chain, conveyor, connected tube, repeated compartment or display system") &&
  imageRunner.includes("SEMANTIC_LINEAR_MOTIF_PATTERNS"));
check("source motif hazards are translated into separate anchors and open depth",
  imageRunner.includes("function sourceMotifHazards") &&
  imageRunner.includes("sourceMotifNeutralizationRequired") &&
  imageRunner.includes("SOURCE MOTIF TRANSLATION REQUIRED"));
check("every scene state records mode and presence", imageRunner.includes("visualModeId: sceneVisualModes[index].id") && imageRunner.includes("presenceMode: sceneVisualModes[index].presence"));
check("old summaries cannot be reused without modality version", imageRunner.includes("previousSummary?.visualModalityVersion === VISUAL_MODALITY_VERSION"));
check("existing approved images are retained when a newer prompt contract is introduced",
  imageRunner.includes("const verifiedExistingOutput =") &&
  imageRunner.includes("previousSummary?.allReady === true") &&
  imageRunner.includes("promptMatches || verifiedExistingOutput"));
check("character scenes are capped to 45 percent", imageRunner.includes("Math.ceil(sceneCount * 0.45)"));
check("at least 55 percent are non-character modes", imageRunner.includes("Math.floor(sceneCount * 0.55)"));
check("modality audit requires several distinct modes", imageRunner.includes("requiredDistinctModes") && imageRunner.includes("distinctModeCount >= requiredDistinctModes"));
check("manual visual review remains required", imageRunner.includes("manualVisualReviewRequired: true"));
check("saved and final summaries include modality audit", (imageRunner.match(/visualModalityAudit: buildVisualModalityAudit/g) ?? []).length >= 2);
check("saved and final summaries include finance diversity audit", (imageRunner.match(/financeSceneDiversityAudit: buildFinanceSceneDiversityAudit/g) ?? []).length >= 2);
check("prompt audit mode runs before Playwright import", imageRunner.includes("promptAuditOnly") && imageRunner.indexOf("if (promptAuditOnly)") < imageRunner.indexOf('await import("playwright")'));
check("prompt audit detects legacy positive person instructions", imageRunner.includes("legacyPresenceConflictPatterns") && imageRunner.includes("legacyPresenceConflicts"));
check("prompt audit records that no external action occurred", imageRunner.includes("externalActionPerformed: false"));
check("prompt audit can write a separate evidence file without overwriting execution binding",
  imageRunner.includes("--prompt-audit-out") &&
  imageRunner.includes("PROMPT_AUDIT_OUT_ABS ?? path.join(OUT_DIR, \"prompt-audit.json\")"));
check("prompt audit enforces a bounded compact prompt after adding composition contracts",
  imageRunner.includes("PROMPT_HARD_MAX_CHARS = 6200") &&
  imageRunner.includes("promptLengthPassed") &&
  imageRunner.includes("promptLengthAudit.passed"));
check("prompt audit fails closed on the same sequence-level modality audit as the live summary",
  imageRunner.includes("const promptVisualModalityAudit = buildVisualModalityAudit(rows)") &&
  imageRunner.includes("visualModalityAudit: promptVisualModalityAudit") &&
  imageRunner.includes("promptVisualModalityAudit.passed"));
check("prompt audit fails closed on the same finance diversity contract as live summaries",
  imageRunner.includes("const promptFinanceSceneDiversityAudit = buildFinanceSceneDiversityAudit(rows)") &&
  imageRunner.includes("financeSceneDiversityAudit: promptFinanceSceneDiversityAudit") &&
  imageRunner.includes("promptFinanceSceneDiversityAudit.passed"));
check("finance diversity audit rejects repeated semantic composition signatures",
  imageRunner.includes("adjacentSemanticRepeatFailures") &&
  imageRunner.includes("distinctCompositionCount") &&
  imageRunner.includes("semanticMotifGuardPassed"));
check("topic-scoped mode override is packet-bound and prompt-audit-only",
  imageRunner.includes("--mode-override-packet") &&
  imageRunner.includes("MODE_OVERRIDE_PACKET_ABS && !promptAuditOnly") &&
  imageRunner.includes("money_shorts_scene_mode_correction_packet_v1") &&
  imageRunner.includes("defaultSharedModeMapperMustRemainUnchanged") &&
  imageRunner.includes("topicScopedModeOverride"));
check("approved override mode is threaded through the scene prompt and adjacent-mode contract",
  imageRunner.includes("function scenePrompt(scene, sceneIndex, totalScenes, resolvedVisualModes = null, resolvedDiversityPlans = null)") &&
  imageRunner.includes("scenePrompt(scene, index, sceneCount, sceneVisualModes, sceneDiversityPlans)") &&
  imageRunner.includes("resolvedVisualModes?.[sceneIndex - 1]") &&
  imageRunner.includes("resolvedVisualModes?.[sceneIndex + 1]"));
check("approved override execution is exact-approval, single-scene and one-submission only",
  imageRunner.includes("--execute-approved-mode-override") &&
  imageRunner.includes("ownerApprovalArg !== requiredOwnerApprovalWording") &&
  imageRunner.includes("targetedRegenerationSceneIndexes.size !== 1") &&
  imageRunner.includes("pendingSceneIndexes.length !== 1") &&
  imageRunner.includes("const retryDisabled = topicScopedModeOverride?.executionApproved || topicScopedSceneRepairs?.executionApproved || topicScopedPositiveCompositionCanary?.executionApproved || noRetry") &&
  imageRunner.includes("ROUTING_RECOVERY_LIMIT_PER_SCENE = retryDisabled ? 0 : 1") &&
  imageRunner.includes("? 1\n  : topicScopedSceneRepairs?.executionApproved"));
check("full-scene approval can enforce no retry and stop on first failure",
  imageRunner.includes('const noRetry = args.includes("--no-retry")') &&
  imageRunner.includes("const retryDisabled = topicScopedModeOverride?.executionApproved || topicScopedSceneRepairs?.executionApproved || topicScopedPositiveCompositionCanary?.executionApproved || noRetry") &&
  imageRunner.includes("ROUTING_RECOVERY_LIMIT_PER_SCENE > 0") &&
  imageRunner.includes('if (st.status === "BLOCKED_IMAGE_TOOL" || noRetry) break;') &&
  imageRunner.includes("if (noRetry && !audit?.accepted) break;") &&
  imageRunner.includes("if (noRetry) break;"));
check("override audit binds the exact regeneration-scene prompt fingerprint",
  imageRunner.includes("a mode override audit or execution requires the single approved regeneration scene") &&
  imageRunner.includes("targetRequirement?.promptFingerprint !== topicScopedModeOverride.promptFingerprint") &&
  imageRunner.includes("mode override packet prompt fingerprint does not match the exact regeneration prompt"));
check("topic-scoped override can inject a packet-bound visual repair and recheck same-mode output",
  imageRunner.includes("scenePromptAppend") &&
  imageRunner.includes("scenePromptAppend.trim().length >= 80") &&
  imageRunner.includes("priorTarget?.promptFingerprint !== targetRequirement?.promptFingerprint"));
check("approved override execution binds the prior audit and preserves the replaced image",
  imageRunner.includes("priorPromptAudit?.topicScopedModeOverride?.packetSha256") &&
  imageRunner.includes("priorTarget?.imageSha256 === topicScopedModeOverride.currentImageSha256") &&
  imageRunner.includes("superseded-v1") &&
  imageRunner.includes("fs.copyFileSync(targetFile, backupFile)"));
check("multi-scene repair packet binds topic scripts QA and the selected character",
  imageRunner.includes("money_shorts_targeted_scene_image_repair_packet_v1") &&
  imageRunner.includes("sourceScriptSha256 === scriptSha256") &&
  imageRunner.includes("packet?.sourceBindings?.visualQaSha256 === qaSha256") &&
  imageRunner.includes("packet?.characterReferenceSha256 === CHARACTER_REFERENCE_SHA256"));
check("multi-scene repair execution requires exact targets approval and no-retry",
  imageRunner.includes("--execute-approved-scene-repairs requires one repair packet, --no-retry") &&
  imageRunner.includes("requestedTargets.some((sceneIndex, index) => sceneIndex !== packetTargetIndexes[index])") &&
  imageRunner.includes("ownerApprovalArg !== requiredOwnerApprovalWording"));
check("each targeted repair binds the current image prompt fingerprint and visual mode",
  imageRunner.includes("previousScene?.promptFingerprint === target.currentPromptFingerprint") &&
  imageRunner.includes("previousScene?.imageSha256 === target.currentImageSha256") &&
  imageRunner.includes("target.currentVisualMode === expectedMode?.id"));
check("targeted repair direction overrides generic manual regeneration examples only on targets",
  imageRunner.includes("OWNER-APPROVED TARGETED SCENE REPAIR") &&
  imageRunner.includes("This repair direction overrides any generic manual-regeneration example") &&
  imageRunner.includes("if (targetedSceneRepair || targetedPositiveCompositionCanary) return basePrompt;"));
check("approved repairs bind the prior no-submit audit and preserve every replaced original",
  imageRunner.includes("priorPromptAudit?.topicScopedSceneRepairs?.packetSha256") &&
  imageRunner.includes("superseded-targeted-repair-v1") &&
  imageRunner.includes("scene-images-summary-before-") &&
  imageRunner.includes("imageSha256(backupFile) !== target.currentImageSha256"));
check("approved repair submission hard cap equals the current part target count",
  imageRunner.includes("? topicScopedSceneRepairs.targets.length") &&
  imageRunner.includes("approved targeted repair execution must have only the exact packet targets pending"));
check("positive-composition canary is packet-bound and limited to no-submit audit or its separate execution flag",
  imageRunner.includes("--positive-composition-canary-packet") &&
  imageRunner.includes("--execute-approved-positive-composition-canary") &&
  imageRunner.includes("--positive-composition-canary-packet requires --prompt-audit-only") &&
  imageRunner.includes("only one packet type may be combined with an image runner invocation"));
check("positive-composition canary binds the locked script prior prompt audit original image and blueprint",
  imageRunner.includes("money_shorts_positive_composition_canary_packet_v1") &&
  imageRunner.includes("packet?.sourceBindings?.promptAuditSha256 === promptAuditSha256") &&
  imageRunner.includes("previousTarget?.imageSha256 === packet.targetScene.currentImageSha256") &&
  imageRunner.includes("auditedBlueprint?.id === positiveComposition?.id") &&
  imageRunner.includes("positiveComposition.requiredIncomeCues.length === 3"));
check("positive-composition canary preserves its exact audited shared-engine prompt",
  imageRunner.includes("targetedPositiveCompositionCanary") &&
  imageRunner.includes("if (targetedSceneRepair || targetedPositiveCompositionCanary) return basePrompt;") &&
  imageRunner.includes("positive composition canary does not match the exact audited shared-engine prompt"));
check("positive-composition canary execution needs exact approval one target no retry and a one-submit cap",
  imageRunner.includes("ownerApprovalArg !== requiredOwnerApprovalWording") &&
  imageRunner.includes("--execute-approved-positive-composition-canary requires one canary packet, --no-retry") &&
  imageRunner.includes("approved positive composition canary execution must have exactly its one packet target pending") &&
  imageRunner.includes("topicScopedPositiveCompositionCanary?.executionApproved") &&
  imageRunner.includes(": topicScopedPositiveCompositionCanary?.executionApproved\n    ? 1"));
check("positive-composition canary preserves the original before any approved replacement",
  imageRunner.includes("superseded-positive-composition-canary-v1") &&
  imageRunner.includes("positive composition canary original image backup hash mismatch") &&
  imageRunner.includes("scene-images-summary-before-${topicScopedPositiveCompositionCanary.productionPartId}"));
check("positive-composition canary is recorded in no-submit and final execution summaries",
  (imageRunner.match(/positiveCompositionCanary: topicScopedPositiveCompositionCanary/g) ?? []).length >= 2 &&
  imageRunner.includes("topicScopedPositiveCompositionCanary,"));
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
