#!/usr/bin/env node

import fs from "node:fs";

const cast = JSON.parse(fs.readFileSync("lib/finance-character-cast-data.json", "utf8"));
const castModule = fs.readFileSync("lib/finance-character-cast.ts", "utf8");
const helper = fs.readFileSync("lib/owner-web-operator.ts", "utf8");
const route = fs.readFileSync("app/api/money-shorts/operator/route.ts", "utf8");
const wizard = fs.readFileSync("components/VideoCreationWizard.tsx", "utf8");
const runner = fs.readFileSync("scripts/run-owner-finance-character-cast-audition.mjs", "utf8");
const imageCore = fs.readFileSync("scripts/_chatgpt-image-core.mjs", "utf8");
const playwrightRunner = fs.readFileSync("scripts/run-money-shorts-character-cast-generation-playwright-v1.mjs", "utf8");

const expectedSubtopics = [
  "economy_literacy",
  "inflation_living_cost",
  "interest_debt",
  "consumption_psychology",
  "sns_comparison",
  "labor_income",
  "investing_assets",
  "housing_asset_gap",
  "anxiety_avoidance",
  "success_habits",
  "crisis_risk",
  "time_retirement",
];

const results = [];
function check(name, passed) {
  results.push({ name, passed: Boolean(passed) });
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
}

const characters = Array.isArray(cast.characters) ? cast.characters : [];
const assignedSubtopics = characters.flatMap((character) => character.subtopics ?? []);
check("cast has exactly four recurring protagonists", characters.length === 4 && new Set(characters.map((character) => character.id)).size === 4);
check("each protagonist owns exactly three subtopics", characters.every((character) => character.subtopics?.length === 3));
check("all twelve finance subtopics are assigned exactly once", assignedSubtopics.length === 12 && new Set(assignedSubtopics).size === 12 && expectedSubtopics.every((subtopic) => assignedSubtopics.includes(subtopic)));
check("each protagonist has two audition directions", cast.candidateCount === 2 && characters.every((character) => character.candidateDirections?.length === 2));
check("Owner-approved candidate 2 is fixed for all four protagonists", cast.selectionStatus === "owner_approved_candidate_2_fixed_v1" && characters.every((character) => character.selectedCandidateNumber === 2));
check("operator resolves fixed candidate 2 without recreating deleted audition candidate 1",
  /FINANCE_CHARACTER_SELECTION_STATUS !== "owner_approved_candidate_2_fixed_v1"/.test(helper) &&
  /character\.selectedCandidateNumber !== 2/.test(helper) &&
  /fixed\.width < 900/.test(helper) &&
  /fixed\.height < 1600/.test(helper) &&
  /fileSha256\(expectedPath\) !== fixed\.imageSha256/.test(helper));
check("appearance and wardrobe locks exist for every protagonist", characters.every((character) => character.appearance?.length > 80 && character.wardrobe?.includes("keep the same silhouette and color family")));
check("style is original bright family-feature-quality 3D without studio imitation", /bright family-feature-quality cinematic 3D animation/i.test(cast.sharedStyle) && /without copying any studio, franchise, film or known character/i.test(cast.sharedStyle) && !/Disney/i.test(cast.sharedStyle));
check("cast defines one-shot scene integration and motion-ready contracts", /one authored shot/i.test(cast.sceneIntegrationContract) && /contact shadows/i.test(cast.sceneIntegrationContract) && /foreground, character and background depth/i.test(cast.motionReadyContract));
check("every protagonist has a restrained character-specific motion profile", characters.every((character) =>
  character.motionProfile?.length > 120 &&
  /gaze|glance|head and eye|eye turn/i.test(character.motionProfile) &&
  /never/i.test(character.motionProfile)
));
check("cast explicitly rejects laboratory, vault and machine-finance visuals", /No laboratory, vault, factory, machine room, black-metal architecture/i.test(cast.forbiddenVisualContract));
check("typed subtopic-to-character map is derived from the canonical cast", /FINANCE_SUBTOPIC_CHARACTER_MAP/.test(castModule) && /character\.subtopics\.map/.test(castModule));
check("operator exposes status, create and select actions", ["characterCastStatus", "characterCastCreate", "characterCastSelect"].every((action) => helper.includes(`"${action}"`) && route.includes(`action === "${action}"`)));
check("candidate generation is owner-triggered and no-live", /ALLOW_CHATGPT_IMAGE/.test(route) && /notUploaded:\s*true/.test(runner) && !/instagram|youtube|actualUpload/i.test(runner));
check("candidate runner supports prompt-only audit and safe resume", /--prompt-audit-only/.test(runner) && /existing_file_skip/.test(runner) && /promptFingerprint/.test(runner));
check("candidate rerun is explicit while normal runs preserve ready files", /--regenerate-candidates/.test(runner) && /regenerateCandidates\.has/.test(runner) && /--regenerate/.test(playwrightRunner));
check("image generation forces Chat mode and preserves non-automation drafts", /ensureChatMode/.test(imageCore) && /Chat mode active \(Work mode off\)/.test(imageCore) && /IMAGE_TOOL_OWNER_DRAFT_PRESENT/.test(imageCore) && /CHATGPT_IMAGE_AUTOMATION_PROMPT_PREFIX/.test(imageCore));
check("stale automation drafts have a bounded verified clear fallback", /remainingAutomationText/.test(imageCore) && /Control\+A/.test(imageCore) && /IMAGE_TOOL_AUTOMATION_DRAFT_CLEAR_FAILED/.test(imageCore));
check("candidate image serving is fixed-id and local-only", /searchParams\.get\("image"\) === "character"/.test(route) && /readWizardFinanceCharacterImageBytes/.test(route) && /isLocalDevRuntime/.test(route));
check("wizard shows four cast cards and eight selection slots", /주인공 이미지 검수/.test(wizard) && /characterCast\.characters\.map/.test(wizard) && /character\.candidates\.map/.test(wizard));
check("scene generation opens only after the selected-reference engine is ready",
  /characterReferenceEngineReady\s*=\s*characterCastReady/.test(wizard) &&
  /resolveWizardFinanceCharacterVisual/.test(helper) &&
  /--character-reference/.test(helper) &&
  /--character-reference-sha256/.test(helper));
const sceneImageRunner = fs.readFileSync("scripts/run-owner-real-scene-images-from-wizard-script-once.mjs", "utf8");
check("actual character and hands scenes attach the selected image while person-free scenes stay clean",
  /attachRef/.test(sceneImageRunner) && /sceneVisualModes\[sceneIdx\]\.presence !== "none"/.test(sceneImageRunner));
check("actual character scenes accept only fixed candidate 2 and consume the motion profile",
  /candidate-2\\\.png/.test(sceneImageRunner) && /CHARACTER_MOTION_PROFILE/.test(sceneImageRunner) && /owner_approved_candidate_2_fixed_v1/.test(sceneImageRunner));

const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({ passed: failed.length === 0, passedCount: results.length - failed.length, totalCount: results.length, failed }, null, 2));
process.exit(failed.length === 0 ? 0 : 1);
