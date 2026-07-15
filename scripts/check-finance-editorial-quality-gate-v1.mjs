import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const ROOT = process.cwd();
const BANK_PATH = path.join(ROOT, "lib", "finance-editorial-topic-bank.ts");
const ENGINE_PATH = path.join(ROOT, "lib", "finance-editorial-script-engine.ts");
const VISUAL_ENGINE_PATH = path.join(ROOT, "lib", "finance-visual-evidence-engine.ts");
const PLATFORM_DISCOVERY_PATH = path.join(ROOT, "lib", "platform-discovery-metadata.ts");
const CHARACTER_CAST_PATH = path.join(ROOT, "lib", "finance-character-cast.ts");
const CHARACTER_VOICE_CAST_PATH = path.join(ROOT, "lib", "finance-character-voice-cast.ts");
const VEO_SCENE_SELECTOR_PATH = path.join(ROOT, "lib", "veo-scene-selector.ts");
const FLOW_MOTION_JOBS_PATH = path.join(ROOT, "lib", "flow-motion-jobs.ts");
const HELPER_PATH = path.join(ROOT, "lib", "owner-web-operator.ts");
const nodeRequire = createRequire(import.meta.url);

let pass = 0;
let fail = 0;
function check(name, ok, detail = "") {
  if (ok) {
    pass += 1;
    console.log(`PASS  ${name}`);
  } else {
    fail += 1;
    console.error(`FAIL  ${name}${detail ? ` - ${detail}` : ""}`);
  }
}

function transpile(filePath) {
  return ts.transpileModule(readFileSync(filePath, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

function loadTypescriptModule(filePath, requireFromModule = nodeRequire) {
  const sandboxModule = { exports: {} };
  vm.runInNewContext(transpile(filePath), {
    module: sandboxModule,
    exports: sandboxModule.exports,
    require: requireFromModule,
    console,
    Buffer,
    URL,
    TextEncoder,
    TextDecoder,
    structuredClone,
    setTimeout,
    clearTimeout,
    process: { cwd: () => ROOT, env: {} },
  }, { filename: filePath });
  return sandboxModule.exports;
}

const bankModule = loadTypescriptModule(BANK_PATH);
const engineModule = loadTypescriptModule(ENGINE_PATH);
const visualEngineModule = loadTypescriptModule(VISUAL_ENGINE_PATH);
const platformDiscoveryModule = loadTypescriptModule(PLATFORM_DISCOVERY_PATH);
const characterCastData = JSON.parse(readFileSync(path.join(ROOT, "lib", "finance-character-cast-data.json"), "utf8"));
const characterCastModule = loadTypescriptModule(CHARACTER_CAST_PATH, (specifier) => {
  if (specifier === "./finance-character-cast-data.json") return { default: characterCastData };
  if (specifier === "./finance-editorial-topic-bank") return bankModule;
  return nodeRequire(specifier);
});
const characterVoiceCastData = JSON.parse(readFileSync(path.join(ROOT, "lib", "finance-character-voice-cast-data.json"), "utf8"));
const characterVoiceCastModule = loadTypescriptModule(CHARACTER_VOICE_CAST_PATH, (specifier) => {
  if (specifier === "./finance-character-voice-cast-data.json") return { default: characterVoiceCastData };
  if (specifier === "./finance-character-cast") return characterCastModule;
  if (specifier === "./finance-editorial-topic-bank") return bankModule;
  return nodeRequire(specifier);
});
const veoSceneSelectorModule = loadTypescriptModule(VEO_SCENE_SELECTOR_PATH);
const flowMotionJobsModule = loadTypescriptModule(FLOW_MOTION_JOBS_PATH, (specifier) => {
  if (specifier === "./veo-scene-selector") return veoSceneSelectorModule;
  return nodeRequire(specifier);
});
const helperModule = loadTypescriptModule(HELPER_PATH, (specifier) => {
  if (specifier === "./finance-editorial-topic-bank") return bankModule;
  if (specifier === "./finance-editorial-script-engine") return engineModule;
  if (specifier === "./finance-visual-evidence-engine") return visualEngineModule;
  if (specifier === "./platform-discovery-metadata") return platformDiscoveryModule;
  if (specifier === "./finance-character-cast") return characterCastModule;
  if (specifier === "./finance-character-voice-cast") return characterVoiceCastModule;
  if (specifier === "./veo-scene-selector") return veoSceneSelectorModule;
  if (specifier === "./flow-motion-jobs") return flowMotionJobsModule;
  return nodeRequire(specifier);
});

const buildSeeds = helperModule.buildFinanceEditorialTopicSeeds;
const buildScript = helperModule.buildScriptFromGeneratedTopic;
const buildProductionParts = helperModule.buildWizardProductionScriptParts;
const getGate = helperModule.getWizardScriptQualityGate;
const floor = helperModule.WIZARD_FINANCE_SCRIPT_QUALITY_FLOOR;
const strategyVersion = engineModule.FINANCE_EDITORIAL_VIDEO_STRATEGY_VERSION;
const buildDiscoveryMetadata = platformDiscoveryModule.buildPlatformDiscoveryMetadata;
const visualVersion = visualEngineModule.FINANCE_VISUAL_EVIDENCE_VERSION;
const visualStyle = visualEngineModule.FINANCE_VISUAL_STYLE_CONTRACT;
const characterVersion = visualEngineModule.FINANCE_VISUAL_CHARACTER_CONTINUITY_VERSION;
const characterContinuity = visualEngineModule.FINANCE_VISUAL_CHARACTER_CONTINUITY;
const evidenceToCue = visualEngineModule.financeVisualEvidenceToCue;
const sequencePass = visualEngineModule.financeVisualSequencePass;

check("production quality-gate functions load",
  typeof buildSeeds === "function" && typeof buildScript === "function" &&
  typeof buildProductionParts === "function" && typeof getGate === "function" &&
  typeof buildDiscoveryMetadata === "function");
check("finance script quality floor is 86", floor === 86, `received ${floor}`);

const seeds = buildSeeds();
check("editorial seed builder returns exactly 500 topics", seeds.length === 500, `received ${seeds.length}`);

const audits = seeds.map((seed) => {
  const topicId = `gen-finance-${seed.slug}`;
  const script = buildScript({
    ...seed,
    topicId,
    category: "finance",
    source: "editorial_bank",
  });
  const gate = getGate(topicId, script);
  return { seed, script, gate };
});

check("every audit uses the required finance gate", audits.every(({ gate }) => gate.required && gate.minimumScore === floor));
check("every audit produces a scored script", audits.every(({ script }) =>
  typeof script.quality?.overallScore === "number" && script.quality.overallScore >= 0 && script.quality.overallScore <= 100));
check("displayed script score matches the recomputed production gate", audits.every(({ script, gate }) =>
  script.quality.passed && script.quality.rejectReasons.length === 0 && script.quality.overallScore === gate.overallScore));
check("selected candidate score matches the displayed confirmed-script score", audits.every(({ script }) =>
  script.candidateScores.find((candidate) => candidate.selected)?.overallScore === script.quality.overallScore));

const plannedScenes = audits.flatMap(({ seed, script }) => script.scenes.map((scene) => ({ seed, scene })));
const sceneCounts = audits.map(({ script }) => script.scenes.length);
const allVisualEvidence = plannedScenes.map(({ scene }) => scene.visualEvidence);
check("all 500 production scripts use dynamic scene counts within the 4-18 contract", audits.every(({ script }) =>
  script.scenes.length >= 4 && script.scenes.length <= 18),
  `range ${Math.min(...sceneCounts)}-${Math.max(...sceneCounts)}`);
check("all 500 production scripts keep the denser 10-13 visual-event rhythm", audits.every(({ script }) =>
  script.scenes.length >= 10 && script.scenes.length <= 13),
  `range ${Math.min(...sceneCounts)}-${Math.max(...sceneCounts)}`);
check("production scene planning is not fixed to eight scenes", new Set(sceneCounts).size > 1,
  `counts ${[...new Set(sceneCounts)].sort((a, b) => a - b).join(",")}`);
check("all 500 production scene plans use 3D editorial sequence v9", plannedScenes.every(({ scene }) =>
  scene.visualEvidence?.version === visualVersion && scene.visualEvidence?.visualStyle === visualStyle));
check("production scene evidence preserves the exact scene narration", plannedScenes.every(({ scene }) =>
  scene.visualEvidence?.claim === String(scene.narration ?? "").replace(/\s+/g, " ").trim().slice(0, 320)));
check("all actual production scenes carry concrete setting, subject, action and causal evidence", allVisualEvidence.every((evidence) =>
  evidence && evidence.sceneSetting.length >= 24 && evidence.heroSubject.length >= 20 &&
  evidence.visibleAction.length >= 12 && evidence.causalComposition.length >= 24 &&
  evidence.sceneSpecificSignal.length >= 24 && evidence.continuityState.length >= 24));
check("all actual production scenes reject live action, generic visuals and adjacent reuse", allVisualEvidence.every((evidence) =>
  evidence && /photography, live action, documentary realism/.test(evidence.mustNotShow) &&
  /generic stairs or forked paths/.test(evidence.mustNotShow) &&
  /previous or next scene/.test(evidence.mustNotShow)));
check("all actual production scenes enforce the selected character identity without gender-specific fallback hair", allVisualEvidence.every((evidence) =>
  evidence && /differs from the selected character reference/.test(evidence.mustNotShow)) &&
  characterVersion === "money_shorts_selected_character_reference_v1" &&
  /match the selected character reference exactly/.test(characterContinuity));
check("every production video passes the actual dynamic visual sequence contract", audits.every(({ script }) =>
  sequencePass(script.scenes.map((scene) => scene.visualEvidence))));
check("every actual production scene serializes its exact evidence and character contract into the image cue",
  allVisualEvidence.every((evidence) => {
    if (!evidence) return false;
    const cue = evidenceToCue(evidence);
    return cue.includes(evidence.sceneIdentity) && cue.includes(evidence.claim) &&
      cue.includes(evidence.sceneSetting) && cue.includes(evidence.visibleAction) &&
      cue.includes(evidence.mustNotShow) && cue.includes(characterVersion);
  }));
check("every production video has unique scene identities and at least four adjacent visual differences", audits.every(({ script }) => {
  const identities = script.scenes.map((scene) => scene.visualEvidence?.sceneIdentity);
  const fields = ["sceneSetting", "visualForm", "cameraPlan", "lightingPlan", "heroSubject", "visibleAction", "causalComposition"];
  return new Set(identities).size === script.scenes.length && script.scenes.every((scene, index) => {
    if (index === 0) return true;
    const previous = script.scenes[index - 1].visualEvidence;
    const current = scene.visualEvidence;
    return previous && current && fields.filter((field) => previous[field] !== current[field]).length >= 4;
  });
}));

const productionAudits = audits.flatMap(({ seed, script }) => {
  const topic = {
    ...seed,
    topicId: script.topicId,
    category: "finance",
    source: "editorial_bank",
  };
  return buildProductionParts(topic, script).map((part) => ({ seed, baseScript: script, part }));
});
const twoPartTopics = audits.filter(({ script }) => script.videoStrategy?.mode === "two_part");
const productionSceneCounts = productionAudits.map(({ part }) => part.script.scenes.length);
const normalizeCoverText = (value) => String(value ?? "").replace(/[^0-9A-Za-z가-힣]/gu, "");
const coverPunctuationCount = (value) => (String(value ?? "").match(/[!?…]|\.{2,}/gu) ?? []).length;

check("all 500 topics receive the shared semantic prehook strategy", audits.every(({ script }) =>
  script.videoStrategy?.contractVersion === strategyVersion &&
  script.videoStrategy.splitAudit.timeOnlyDecisionForbidden === true &&
  script.videoStrategy.openingVoice.v3AudioTag === "confidently" &&
  script.videoStrategy.openingVoice.speedCap === 0.98));
check("semantic split calibration yields 74 two-part topics and 426 single topics",
  twoPartTopics.length === 74 && audits.length - twoPartTopics.length === 426,
  `two-part ${twoPartTopics.length}, single ${audits.length - twoPartTopics.length}`);
check("500 topics expand to exactly 574 on-demand production videos", productionAudits.length === 574,
  `received ${productionAudits.length}`);
check("every split is decided by all seven semantic gates, never by duration", audits.every(({ script }) => {
  const strategy = script.videoStrategy;
  if (!strategy) return false;
  return strategy.mode === "two_part"
    ? strategy.splitAudit.passed && strategy.splitAudit.passedCount === strategy.splitAudit.requiredCount
    : !strategy.splitAudit.passed && strategy.splitAudit.passedCount < strategy.splitAudit.requiredCount;
}));
check("confirmed canonical titles remain unchanged while only platform titles add part markers", productionAudits.every(({ baseScript, part }) =>
  part.canonicalTitle === baseScript.title &&
  (part.totalParts === 1 ? part.platformTitle === baseScript.title : part.platformTitle === `${baseScript.title} ${part.partNumber}편`)));
check("every production video starts with exactly three staged cover lines", productionAudits.every(({ part }) =>
  part.coverLines.length === 3 &&
  part.script.scenes[0]?.narration === part.coverLines.map((line) => line.spokenText).join("\n")));
const coverContractFailures = productionAudits.flatMap(({ seed, part }) => part.coverLines
  .filter((line) =>
    normalizeCoverText(line.spokenText) !== normalizeCoverText(line.displayText) ||
    coverPunctuationCount(line.displayText) <= coverPunctuationCount(line.spokenText))
  .map((line) => ({ title: seed.title, partId: part.id, spoken: line.spokenText, display: line.displayText })));
check("cover punctuation is visual-only and spoken/display semantics remain identical", coverContractFailures.length === 0,
  JSON.stringify(coverContractFailures[0] ?? null));
check("two-part videos expose an explicit 1-to-2 bridge and a visible part-2 marker", twoPartTopics.every(({ script }) => {
  const [partOne, partTwo] = script.videoStrategy.parts;
  return partOne?.id === "part-1" && partOne.explicitPartMarker && partOne.explicitContinuationCue &&
    /2편/u.test(partOne.bridgeNarration ?? "") && /이어/u.test(partOne.bridgeNarration ?? "") &&
    partTwo?.id === "part-2" && partTwo.explicitPartMarker && /이 편/u.test(partTwo.coverLines[0]?.displayText ?? "") &&
    /1편/u.test(partTwo.recapNarration ?? "");
}));
check("all 574 production videos stay within the supported 4-18 scene contract", productionAudits.every(({ part }) =>
  part.script.scenes.length >= 4 && part.script.scenes.length <= 18),
  `range ${Math.min(...productionSceneCounts)}-${Math.max(...productionSceneCounts)}`);
check("all 574 production videos pass the rebuilt visual-sequence contract", productionAudits.every(({ part }) =>
  sequencePass(part.script.scenes.map((scene) => scene.visualEvidence))));
check("all 574 production videos pass Instagram and YouTube discovery metadata gates", productionAudits.every(({ seed, part }) => {
  const consequence = part.script.scenes.find((scene) => scene.id === "consequence")?.narration ?? part.script.fullVoiceover;
  const action = [...part.script.scenes].reverse().find((scene) => ["habit", "recommendation", "save"].includes(scene.id))?.narration ?? part.script.action;
  return buildDiscoveryMetadata({
    title: part.platformTitle,
    hook: part.script.hook,
    consequence,
    action,
    category: "finance",
    financeSubtopic: seed.financeSubtopic,
  }).gate.ok;
}));

const forgedQuality = {
  retentionScore: 100,
  selfRecognitionScore: 100,
  clarityScore: 100,
  visualizabilityScore: 100,
  antiAiToneScore: 100,
  specificityScore: 100,
  overallScore: 100,
  rejectReasons: [],
  rewriteReasons: [],
  passed: true,
};
const sample = audits[0];
const missingAction = {
  ...sample.script,
  scenes: sample.script.scenes.filter((scene) => scene.id !== "habit"),
  captionLines: sample.script.scenes.filter((scene) => scene.id !== "habit").map((scene) => scene.captionText),
  quality: forgedQuality,
};
const missingActionGate = getGate(sample.script.topicId, missingAction);
check("gate re-reads actual scenes instead of trusting a forged 100 score",
  !missingActionGate.passed && missingActionGate.reasons.some((reason) => reason.includes("구체 행동")));

const weakClosingScenes = sample.script.scenes.map((scene) => scene.id === "save"
  ? { ...scene, narration: "좋은 기준을 기억해", captionText: "좋은 기준을 기억해" }
  : scene);
const weakClosing = {
  ...sample.script,
  scenes: weakClosingScenes,
  captionLines: weakClosingScenes.map((scene) => scene.captionText),
  quality: forgedQuality,
};
const weakClosingGate = getGate(sample.script.topicId, weakClosing);
check("gate blocks a script missing contextual rewatch-save-follow closing",
  !weakClosingGate.passed && weakClosingGate.reasons.some((reason) => reason.includes("다시 보기")));

const missingResultScenes = sample.script.scenes.map((scene) => scene.id === "consequence"
  ? { ...scene, narration: "선택이 달라지면 다음 판단도 달라져", captionText: "다음 판단도 달라져" }
  : scene);
const missingResultGate = getGate(sample.script.topicId, {
  ...sample.script,
  scenes: missingResultScenes,
  captionLines: missingResultScenes.map((scene) => scene.captionText),
  quality: forgedQuality,
});
check("gate blocks a consequence scene without a concrete financial result",
  !missingResultGate.passed && missingResultGate.reasons.some((reason) => reason.includes("경제 결과")));

const replacedHookScenes = sample.script.scenes.map((scene) => scene.id === "hook" || scene.id === "problem"
  ? { ...scene, narration: "첫 훅에서 다른 말을 시작해", captionText: "다른 말로 시작" }
  : scene);
const replacedHookGate = getGate(sample.script.topicId, {
  ...sample.script,
  hook: "첫 훅에서 다른 말을 시작해",
  hookLine: "첫 훅에서 다른 말을 시작해",
  scenes: replacedHookScenes,
  captionLines: replacedHookScenes.map((scene) => scene.captionText),
  quality: forgedQuality,
});
check("gate blocks a script that drops the confirmed title from the opening hook",
  !replacedHookGate.passed && replacedHookGate.reasons.some((reason) => reason.includes("확정 제목")));

const politeHabitScenes = sample.script.scenes.map((scene) => scene.id === "habit"
  ? { ...scene, narration: "오늘 앱을 열고 반드시 확인해야 합니다", captionText: "오늘 앱을 열고 확인" }
  : scene);
const politeHabitGate = getGate(sample.script.topicId, {
  ...sample.script,
  scenes: politeHabitScenes,
  captionLines: politeHabitScenes.map((scene) => scene.captionText),
  quality: forgedQuality,
});
check("gate blocks explanatory polite tone even when the action is concrete",
  !politeHabitGate.passed && politeHabitGate.reasons.some((reason) => reason.includes("설명체")));

const blocked = audits.filter(({ gate }) => !gate.passed);
const countBy = (items, key) => {
  const counts = new Map();
  for (const item of items) {
    const value = key(item);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"));
};
const bySubtopic = countBy(blocked, ({ seed }) => seed.financeSubtopic);
const byLane = countBy(blocked, ({ seed }) => seed.editorialLane);
const byReason = countBy(blocked.flatMap(({ gate }) => gate.reasons.map((reason) => ({ reason }))), ({ reason }) => reason);

console.log(`\nquality floor: ${floor}`);
const qualityScores = audits.map(({ gate }) => gate.overallScore);
console.log(`score range: ${Math.min(...qualityScores)}~${Math.max(...qualityScores)}`);
console.log(`production scenes audited: ${plannedScenes.length}`);
console.log(`dynamic scene-count range: ${Math.min(...sceneCounts)}~${Math.max(...sceneCounts)}`);
console.log(`visual contract: ${visualVersion} / ${characterVersion}`);
console.log(`gate result: ${audits.length - blocked.length}/${audits.length} passed, ${blocked.length} blocked`);
console.log(`blocked by subtopic: ${bySubtopic.map(([key, count]) => `${key}=${count}`).join(", ") || "none"}`);
console.log(`blocked by lane: ${byLane.map(([key, count]) => `${key}=${count}`).join(", ") || "none"}`);
console.log("top block reasons:");
for (const [reason, count] of byReason.slice(0, 8)) console.log(`  ${count} - ${reason}`);
if (blocked.length > 0) {
  console.log("blocked representatives:");
  const seenRepresentatives = new Set();
  let representativeCount = 0;
  for (const { seed, script, gate } of blocked) {
    const primaryReason = gate.reasons.find((reason) => !reason.startsWith("첫 3초")) ?? gate.reasons[0] ?? "unknown";
    const key = `${seed.financeSubtopic}:${primaryReason}`;
    if (seenRepresentatives.has(key)) continue;
    seenRepresentatives.add(key);
    const roleText = (id) => script.scenes.filter((scene) => scene.id === id).map((scene) => scene.narration).join(" / ");
    console.log(`  [${seed.financeSubtopic}/${seed.editorialLane}] ${seed.title} (${gate.overallScore}/${floor})`);
    console.log(`    reason: ${primaryReason}`);
    if (primaryReason.includes("경제 결과")) console.log(`    consequence: ${roleText("consequence")}`);
    if (primaryReason.includes("심리 장면")) console.log(`    psychology: ${roleText("psychology")}`);
    if (primaryReason.includes("성공 기준")) console.log(`    mindset: ${roleText("mindset")}`);
    if (primaryReason.includes("구체 행동")) console.log(`    habit: ${roleText("habit")}`);
    representativeCount += 1;
    if (representativeCount >= 24) break;
  }
}

check("all 500 finance scripts pass the production quality gate", blocked.length === 0, `${blocked.length} blocked`);
console.log(`\n${pass + fail} checks - ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exitCode = 1;
