import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const ROOT = process.cwd();
const BANK_PATH = path.join(ROOT, "lib", "finance-editorial-topic-bank.ts");
const SCRIPT_ENGINE_PATH = path.join(ROOT, "lib", "finance-editorial-script-engine.ts");
const VISUAL_ENGINE_PATH = path.join(ROOT, "lib", "finance-visual-evidence-engine.ts");
const OWNER_HELPER_PATH = path.join(ROOT, "lib", "owner-web-operator.ts");
const IMAGE_RUNNER_PATH = path.join(ROOT, "scripts", "run-owner-real-scene-images-from-wizard-script-once.mjs");
const VIDEO_RUNNER_PATH = path.join(ROOT, "scripts", "run-owner-real-video-from-wizard-assets-once.mjs");
const require = createRequire(import.meta.url);

let pass = 0;
let fail = 0;
function check(name, ok, detail = "") {
  if (ok) {
    pass += 1;
    console.log(`PASS  ${name}`);
  } else {
    fail += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function loadTypescriptModule(filePath) {
  const source = readFileSync(filePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const sandboxModule = { exports: {} };
  vm.runInNewContext(output, {
    module: sandboxModule,
    exports: sandboxModule.exports,
    console,
    require,
  });
  return { source, exports: sandboxModule.exports };
}

function compact(value, max = 320) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}...`;
}

function recommendationBeats(value) {
  const lines = String(value ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const splitAt = Math.max(1, lines.length - 1);
  return [lines.slice(0, splitAt).join("\n"), lines.slice(splitAt).join("\n")];
}

const bankModule = loadTypescriptModule(BANK_PATH).exports;
const scriptModule = loadTypescriptModule(SCRIPT_ENGINE_PATH).exports;
const visualModule = loadTypescriptModule(VISUAL_ENGINE_PATH).exports;
const bank = bankModule.FINANCE_EDITORIAL_TOPIC_BANK ?? [];
const buildScript = scriptModule.buildFinanceEditorialScriptParts;
const buildEvidence = visualModule.buildFinanceVisualEvidence;
const evidenceToCue = visualModule.financeVisualEvidenceToCue;
const version = visualModule.FINANCE_VISUAL_EVIDENCE_VERSION;
const visualStyle = visualModule.FINANCE_VISUAL_STYLE_CONTRACT;
const characterVersion = visualModule.FINANCE_VISUAL_CHARACTER_CONTINUITY_VERSION;
const characterContinuity = visualModule.FINANCE_VISUAL_CHARACTER_CONTINUITY;
const sceneIntegrationContract = visualModule.FINANCE_VISUAL_SCENE_INTEGRATION_CONTRACT;
const motionVersion = visualModule.FINANCE_VISUAL_MOTION_CONTRACT_VERSION;
const motionContract = visualModule.FINANCE_VISUAL_MOTION_CONTRACT;
const sequencePass = visualModule.financeVisualSequencePass;

const allVideos = bank.map((topic) => {
  const parts = buildScript(topic);
  const [saveA, saveB] = recommendationBeats(parts.recommendation);
  const sceneInputs = [
    ["hook", parts.hook, 0, 1],
    ["situation", parts.situation, 0, 1],
    ["consequence", parts.consequence, 0, 1],
    ["psychology", parts.psychology, 0, 1],
    ["mindset", parts.mindset, 0, 1],
    ["habit", parts.habit, 0, 1],
    ["save", saveA, 0, 2],
    ["save", saveB, 1, 2],
  ];
  const evidence = sceneInputs.map(([stage, narration, partIndex, partCount]) => buildEvidence({
    title: topic.title,
    narration,
    stage,
    financeSubtopic: topic.financeSubtopic,
    editorialLane: topic.lane,
    partIndex,
    partCount,
    problemStatement: topic.problemStatement,
    twist: topic.twist,
    takeawayAction: topic.takeawayAction,
  }));
  return { topic, parts, evidence };
});

const allEvidence = allVideos.flatMap((video) => video.evidence);
const failures = (predicate) => allVideos.filter((video) => !predicate(video));
const previouslyWeakSample = allVideos.find(({ topic }) => topic.title === "돈 공부 많이 해도 자산이 안 늘어나는 진짜 이유");
const subscriptionSample = allVideos.find(({ topic }) => topic.title === "구독을 방치하면 월급보다 고정비가 먼저 커진다");
const investingFalsePositiveCases = [
  ["mindset", "과거 결과보다 다음 선택의 순서를 바꾸는 게 먼저야"],
  ["save", "계좌가 흔들려 계획을 바꾸고 싶을 때\n주문 전에 이 영상을 다시 봐"],
  ["save", "다음 선택 전에 바로 꺼내 볼 수 있게 저장해 둬"],
].map(([stage, narration], index) => buildEvidence({
  title: "계좌가 흔들릴 때 수익보다 먼저 되찾을 것",
  narration,
  stage,
  financeSubtopic: "investing_assets",
  editorialLane: "recovery",
  partIndex: index === 2 ? 1 : 0,
  partCount: stage === "save" ? 2 : 1,
}));

check("visual evidence engine covers exactly 500 finance videos", allVideos.length === 500, String(allVideos.length));
check("eight representative semantic beats are audited for every video", allEvidence.length === 4000, String(allEvidence.length));
check("every scene uses bright integrated motion-ready family 3D sequence v11", allEvidence.every((item) =>
  item.version === "money_shorts_finance_3d_editorial_sequence_v11" && item.visualStyle === "money_shorts_bright_integrated_motion_ready_family_3d_v3"));
check("all 4000 scene identities are globally unique", new Set(allEvidence.map((item) => item.sceneIdentity)).size === 4000);
check("every scene preserves its exact narration claim", allVideos.every(({ parts, evidence }) => {
  const [saveA, saveB] = recommendationBeats(parts.recommendation);
  const narrations = [parts.hook, parts.situation, parts.consequence, parts.psychology, parts.mindset, parts.habit, saveA, saveB];
  return evidence.every((item, index) => item.claim === compact(narrations[index]));
}));
check("every scene defines concrete must-show evidence and visible action", allEvidence.every((item) =>
  item.mustShow.length >= 24 && item.visibleAction.length >= 12 && item.heroSubject.length >= 20));
check("every scene carries a lane-specific editorial proof", allEvidence.every((item) => item.editorialProof.length >= 24));
check("every scene carries claim-specific objects, a real setting and causal composition", allEvidence.every((item) =>
  item.sceneSpecificSignal.length >= 24 && item.sceneSetting.length >= 24 && item.causalComposition.length >= 24));
check("every scene carries one-shot integration and a concrete later-video motion plan", allEvidence.every((item) =>
  item.sceneIntegrationPlan === sceneIntegrationContract && item.motionPlan.length >= 180 && item.motionPlan.includes(motionContract)) &&
  motionVersion === "money_shorts_scene_motion_plan_v1");
check("all positive scene directions use lived-in spaces without lab, vault or machine-finance staging", allEvidence.every((item) =>
  !/laboratory|vault|factory|machine room|black-metal|decision chamber|account-control station|gateway|payday hall/i.test(
    `${item.sceneSetting} ${item.visualForm} ${item.cameraPlan} ${item.lightingPlan} ${item.visibleAction}`,
  )));
check("all scene directions keep bright open lighting and reject theatrical action", allEvidence.every((item) =>
  /bright|daylight|warm|clear|open shadows/i.test(item.lightingPlan) &&
  !/lunge|reach toward the camera|superhero|dynamic low/i.test(`${item.visibleAction} ${item.cameraPlan}`)));
check("every scene advances the topic continuity marker instead of repeating a static prop", allEvidence.every((item) =>
  item.continuityState.length >= 24));
check("all twelve finance subtopics are covered", new Set(allEvidence.map((item) => item.financeSubtopic)).size === 12);
check("all nine editorial lanes are covered", new Set(allEvidence.map((item) => item.editorialLane)).size === 9);
check("adjacent scenes never reuse the same hero subject", failures(({ evidence }) =>
  evidence.every((item, index) => index === 0 || item.heroSubject !== evidence[index - 1].heroSubject)).length === 0);
check("all 500 videos pass the four-dimension adjacent visual sequence contract", allVideos.every(({ evidence }) => sequencePass(evidence)));
check("all 500 videos change the physical setting at every adjacent semantic beat", failures(({ evidence }) =>
  evidence.every((item, index) => index === 0 || item.sceneSetting !== evidence[index - 1].sceneSetting)).length === 0);
check("each video has eight distinct scene contracts", failures(({ evidence }) =>
  new Set(evidence.map((item) => `${item.heroSubject}|${item.mustShow}|${item.visibleAction}`)).size === evidence.length).length === 0);
check("previously weak psychology scene now shows the goal illusion and ignored condition", Boolean(previouslyWeakSample) &&
  /goal marker|emotional trigger/.test(previouslyWeakSample.evidence[3].sceneSpecificSignal) &&
  /ignored behind/.test(previouslyWeakSample.evidence[3].continuityState));
check("previously generic turning point now rearranges the payment order in a real setting", Boolean(previouslyWeakSample) &&
  /physically rearranged/.test(previouslyWeakSample.evidence[4].causalComposition) &&
  /payday|checkout|payment order/.test(`${previouslyWeakSample.evidence[4].sceneSpecificSignal} ${previouslyWeakSample.evidence[4].sceneSetting}`));
check("previously generic action and closing now show transfer execution and continued result", Boolean(previouslyWeakSample) &&
  /scheduled transfer|moves the protected transfer/.test(`${previouslyWeakSample.evidence[5].sceneSpecificSignal} ${previouslyWeakSample.evidence[5].visibleAction}`) &&
  /repeats forward/.test(previouslyWeakSample.evidence[7].continuityState));
check("generic stairs and forked paths are explicitly rejected", allEvidence.every((item) =>
  /generic stairs or forked paths/.test(item.mustNotShow)));
check("adjacent-reusable images are explicitly rejected", allEvidence.every((item) =>
  /previous or next scene/.test(item.mustNotShow)));
check("photography and miniature scene grammars are explicitly rejected", allEvidence.every((item) =>
  /photography, live action, documentary realism/.test(item.mustNotShow) &&
  /miniature, dollhouse, diorama/.test(item.mustNotShow)));
check("all 500 videos require the selected character identity without a male-hair fallback", allEvidence.every((item) =>
  /differs from the selected character reference/.test(item.mustNotShow)) &&
  characterVersion === "money_shorts_selected_character_reference_v1" &&
  /match the selected character reference exactly/.test(characterContinuity));
check("subscription titles use renewal-specific settings instead of generic shopping scenes", Boolean(subscriptionSample) &&
  subscriptionSample.evidence.every((item) =>
    /renewal|subscription|recurring|service|payday|calendar/.test(`${item.sceneSetting} ${item.heroSubject} ${item.visibleAction}`) &&
    !/shopping parcels|store checkout|grocery basket/.test(item.sceneSetting)));
check("subscription sequence maps consequence, psychology, action and closing to their exact stage spaces", Boolean(subscriptionSample) &&
  /sunny payday breakfast table/.test(subscriptionSample.evidence[2].sceneSetting) &&
  /calm living-room review moment/.test(subscriptionSample.evidence[3].sceneSetting) &&
  /compact home-office desk/.test(subscriptionSample.evidence[5].sceneSetting) &&
  /bright entry console/.test(subscriptionSample.evidence[6].sceneSetting) &&
  /resolved payday kitchen table/.test(subscriptionSample.evidence[7].sceneSetting) &&
  !/moves the protected transfer token/.test(subscriptionSample.evidence[4].visibleAction));
check("investment narration cannot be misrouted to food-order, payday-order or subscription visuals", investingFalsePositiveCases.every((item) =>
  /portfolio|order ticket|loss boundary|household-cash buffer|financial record/.test(`${item.titleSpecificSignal} ${item.sceneSpecificSignal}`) &&
  !/food order|meal budget|recurring charge|payment order|payday cycle|checkout path/.test(`${item.titleSpecificSignal} ${item.sceneSpecificSignal} ${item.visibleAction}`)));
check("serialized cue preserves evidence id, claim, setting, action, continuity, proof and rejection", allEvidence.every((item) => {
  const cue = evidenceToCue(item);
  return cue.includes(item.sceneIdentity) && cue.includes(item.claim) && cue.includes(item.visibleAction) &&
    cue.includes(item.sceneSpecificSignal) && cue.includes(item.sceneSetting) && cue.includes(item.continuityState) &&
    cue.includes(item.editorialProof) && cue.includes(item.sceneIntegrationPlan) && cue.includes(item.motionPlan) &&
    cue.includes(item.mustNotShow) && cue.includes(characterVersion) && cue.includes(motionVersion);
}));

const owner = readFileSync(OWNER_HELPER_PATH, "utf8");
const imageRunner = readFileSync(IMAGE_RUNNER_PATH, "utf8");
const videoRunner = readFileSync(VIDEO_RUNNER_PATH, "utf8");
check("owner scene planner attaches evidence to every finance scene", /visualEvidence = a\.financeSubtopic && resolvedEditorialLane/.test(owner) &&
  /visualEvidence,/.test(owner) && /financeVisualEvidenceToCue\(visualEvidence\)/.test(owner));
check("future finance titles infer a lane before visual evidence generation", /const resolvedEditorialLane = a\.editorialLane \?\?/.test(owner) &&
  /inferFinanceEditorialLane\(a\.title \?\? a\.hook/.test(owner));
check("finance quality gate requires v4 evidence instead of accepting legacy cues", /const expectsStructuredVisualEvidence = true/.test(owner) &&
  /FINANCE_VISUAL_EVIDENCE_VERSION/.test(owner));
check("Claude-polished finance scenes rebuild local evidence instead of trusting model art direction", /const localFinanceEvidence = local\.scenes\.find/.test(owner) &&
  /const polishedPartCounts = new Map/.test(owner) && /exact local visual evidence takes priority/.test(owner));
check("image runner makes must-show, must-not-show and adjacent difference first-class prompt constraints",
  /MUST SHOW this exact economic event:/.test(imageRunner) &&
  /MUST NOT SHOW:/.test(imageRunner) &&
  /ADJACENT DIFFERENCE:/.test(imageRunner) &&
  /no photography, no live action, no documentary realism/.test(imageRunner));
check("image runner makes scene integration and motion plans first-class prompt constraints",
  /SCENE INTEGRATION:/.test(imageRunner) &&
  /MOTION PLAN for later video:/.test(imageRunner) &&
  /CHARACTER MOTION PROFILE/.test(imageRunner) &&
  /pauses in the middle of one small decision/.test(imageRunner) &&
  /candid eye-level three-quarter medium-wide view/.test(imageRunner));
check("image reuse requires evidence id or an exact packet-bound semantic rebind and retains prompt checks", /scene\.visualEvidenceId === requirement\?\.visualEvidenceId/.test(imageRunner) &&
  /semanticRebindTarget\?\.previousVisualEvidenceId === scene\.visualEvidenceId/.test(imageRunner) &&
  /semanticRebindTarget\?\.currentVisualEvidenceId === requirement\?\.visualEvidenceId/.test(imageRunner) &&
  /semanticRebindTarget\?\.imageSha256 === scene\.imageSha256/.test(imageRunner) &&
  /const promptMatches = scene\.promptFingerprint === requirement\?\.promptFingerprint/.test(imageRunner) &&
  /targetedRegenerationSceneIndexes\.has\(scene\.sceneIndex\)/.test(imageRunner));
check("image runner hashes every saved asset and rejects exact cross-scene duplicates", /function imageSha256\(file\)/.test(imageRunner) &&
  /REJECTED_DUPLICATE_IMAGE/.test(imageRunner) && /DUPLICATE_SCENE_IMAGE/.test(imageRunner));
check("owner and final renderer require evidence id, prompt fingerprint and unique image hashes", /const imageAssetContractReady/.test(owner) &&
  /new Set\(sceneRows\.map\(\(scene\) => scene\.imageSha256\)\)/.test(owner) &&
  /createHash\("sha256"\)\.update\(fs\.readFileSync\(file\)\)/.test(videoRunner));
check("owner and video readiness gates require the exact scene integration and motion plan contract",
  owner.includes("imagesSummary.motionPlanAudit?.version === FINANCE_VISUAL_MOTION_CONTRACT_VERSION") &&
  owner.includes("imagesSummary.motionPlanAudit?.passed === true") &&
  videoRunner.includes("scene?.sceneIntegrationPlan === expectedSceneIntegrationPlan") &&
  videoRunner.includes("scene?.motionPlan === expectedMotionPlan") &&
  videoRunner.includes("imagesSummary.motionPlanAudit?.version !== MOTION_PLAN_VERSION") &&
  videoRunner.includes("imagesSummary.motionPlanAudit?.passed !== true"));
check("image prompts and both readiness gates enforce the selected character reference contract",
  /CHARACTER CONTINUITY CONTRACT/.test(imageRunner) &&
  /attached .* identity board/.test(imageRunner) &&
  /referenceAttachmentPassed/.test(imageRunner) &&
  /characterContinuityAudit\?\.passed === true/.test(owner) &&
  /imagesSummary\.characterContinuityAudit\?\.passed !== true/.test(videoRunner));
check("targeted regeneration replaces only failed character scenes and records the audit",
  /--regenerate-scenes 4,5/.test(imageRunner) &&
  /targetedRegenerationScenes/.test(imageRunner) &&
  /CHARACTER QUALITY REGENERATION REQUIRED/.test(imageRunner) &&
  /manualVisualReviewRequired: true/.test(imageRunner));
check("old scripts and old image summaries fail closed before generation/render", /VISUAL_EVIDENCE_V11_REQUIRED/.test(imageRunner) &&
  /imagesSummary\.visualEngineVersion !== expectedVisualEngineVersion/.test(videoRunner));
check("visual evidence engine version and style are shared across planner and both runners", version === "money_shorts_finance_3d_editorial_sequence_v11" &&
  visualStyle === "money_shorts_bright_integrated_motion_ready_family_3d_v3" &&
  [owner, imageRunner, videoRunner].every((source) => source.includes(version)));
check("owner visual DNA no longer positively directs dark dioramas, tunnels or faceless symbolic people",
  /Bright integrated family-feature-quality cinematic 3D animation/.test(owner) &&
  /one Korean adult naturally using the relevant object/.test(owner) &&
  !/low-angle 3D object diorama shot|boxed-in tunnel composition|dark metal weight|faceless stylized person|cool analytical side light|subdued reflective light/.test(owner));

console.log(`distinct scene-specific signals: ${new Set(allEvidence.map((item) => item.sceneSpecificSignal)).size}`);
console.log(`distinct setting/signal/stage combinations: ${new Set(allEvidence.map((item) => `${item.stage}|${item.sceneSetting}|${item.sceneSpecificSignal}`)).size}`);

console.log(`\n${pass + fail} checks — ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exitCode = 1;
