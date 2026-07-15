#!/usr/bin/env node
/** No-network integration guard for shared finance production inputs. */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const ROOT = process.cwd();
const TOPIC_ID = "gen-finance-editorial-v2-investing_assets-reversal-01";
const BANK_PATH = path.join(ROOT, "lib", "finance-editorial-topic-bank.ts");
const ENGINE_PATH = path.join(ROOT, "lib", "finance-editorial-script-engine.ts");
const VISUAL_PATH = path.join(ROOT, "lib", "finance-visual-evidence-engine.ts");
const DISCOVERY_PATH = path.join(ROOT, "lib", "platform-discovery-metadata.ts");
const CHARACTER_CAST_PATH = path.join(ROOT, "lib", "finance-character-cast.ts");
const CHARACTER_VOICE_CAST_PATH = path.join(ROOT, "lib", "finance-character-voice-cast.ts");
const VEO_SCENE_SELECTOR_PATH = path.join(ROOT, "lib", "veo-scene-selector.ts");
const FLOW_MOTION_JOBS_PATH = path.join(ROOT, "lib", "flow-motion-jobs.ts");
const HELPER_PATH = path.join(ROOT, "lib", "owner-web-operator.ts");
const nodeRequire = createRequire(import.meta.url);

let passed = 0;
let failed = 0;
function check(label, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${label}${detail ? ` - ${detail}` : ""}`);
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
    process: { cwd: () => ROOT, env: {}, execPath: process.execPath, platform: process.platform },
  }, { filename: filePath });
  return sandboxModule.exports;
}

const bankModule = loadTypescriptModule(BANK_PATH);
const engineModule = loadTypescriptModule(ENGINE_PATH);
const visualModule = loadTypescriptModule(VISUAL_PATH);
const discoveryModule = loadTypescriptModule(DISCOVERY_PATH);
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
  if (specifier === "./finance-visual-evidence-engine") return visualModule;
  if (specifier === "./platform-discovery-metadata") return discoveryModule;
  if (specifier === "./finance-character-cast") return characterCastModule;
  if (specifier === "./finance-character-voice-cast") return characterVoiceCastModule;
  if (specifier === "./veo-scene-selector") return veoSceneSelectorModule;
  if (specifier === "./flow-motion-jobs") return flowMotionJobsModule;
  return nodeRequire(specifier);
});

const preview = helperModule.readScriptPreview(TOPIC_ID);
const bankTopic = bankModule.FINANCE_EDITORIAL_TOPIC_BANK.find((topic) => topic.title === preview?.title);
const pilotParts = bankTopic ? engineModule.buildFinanceEditorialScriptParts(bankTopic) : null;
const pilotDiagnosticText = pilotParts ? [pilotParts.hook, pilotParts.situation, pilotParts.consequence, pilotParts.psychology].join("\n") : "";
const pilotActionText = pilotParts ? [pilotParts.mindset, pilotParts.habit, pilotParts.recommendation].join("\n") : "";
const pilotSemanticLength = `${pilotDiagnosticText}${pilotActionText}`.replace(/\s/gu, "").length;
check("approved two-part pilot resolves through the shared finance engine",
  preview?.videoStrategy?.contractVersion === engineModule.FINANCE_EDITORIAL_VIDEO_STRATEGY_VERSION &&
  preview?.videoStrategy?.mode === "two_part",
  `mode ${preview?.videoStrategy?.mode ?? "missing"}; semantic length ${pilotSemanticLength}`);
if (!preview) {
  console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
  process.exit(1);
}

let fetchCalled = false;
const record = await helperModule.ensureWizardFinalScript(TOPIC_ID, preview, {
  allowPolish: false,
  fetchImpl: async () => {
    fetchCalled = true;
    throw new Error("network_forbidden");
  },
});
check("local finalization performs no Claude call", fetchCalled === false && record.mode === "local_only");
check("finalized script preserves the confirmed title and semantic strategy",
  record.script.title === preview.title && record.script.videoStrategy?.contractVersion === engineModule.FINANCE_EDITORIAL_VIDEO_STRATEGY_VERSION);

const pipeline = helperModule.buildWizardRealPipelineInputs(TOPIC_ID);
check("shared production pipeline input builder succeeds", pipeline?.ok === true,
  pipeline?.ok ? "" : `${String(pipeline?.reason ?? "unknown")} · ${record.polish.note}`);

if (pipeline?.ok) {
  const paths = pipeline.paths;
  const expectedPartCount = preview.videoStrategy?.parts.length ?? 1;
  check("pipeline mode and part count match the semantic strategy",
    paths.mode === preview.videoStrategy.mode && paths.parts.length === expectedPartCount);
  check("production paths are part-isolated and remain under C:\\tmp\\money-shorts-os",
    new Set(paths.parts.map((part) => path.dirname(part.scriptFinalPath))).size === paths.parts.length &&
    paths.parts.every((part) => [part.scriptFinalPath, part.realTtsScriptPath, part.ttsOutDir, part.imagesOutDir, part.videoOutDir]
      .every((value) => /^C:[\\/]tmp[\\/]money-shorts-os[\\/]/i.test(value))));

  const partInputs = paths.parts.map((part) => ({
    part,
    scriptFinal: JSON.parse(readFileSync(part.scriptFinalPath, "utf8")),
    tts: JSON.parse(readFileSync(part.realTtsScriptPath, "utf8")),
  }));
  const semanticText = (value) => String(value ?? "").normalize("NFKC").replace(/[\s"'“”‘’.,!?…，。！？:;；：]+/gu, "").toLowerCase();
  check("every production part carries isolated identity and canonical/platform titles", partInputs.every(({ part, scriptFinal }) =>
    scriptFinal.production?.partId === part.id &&
    scriptFinal.production?.rootTopicId === TOPIC_ID &&
    scriptFinal.production?.canonicalTitle === preview.title &&
    scriptFinal.production?.platformTitle === part.platformTitle));
  check("every generated TTS input has a synchronized three-line staged cover", partInputs.every(({ tts }) => {
    const cover = tts.coverContract;
    const lines = Array.isArray(cover?.lines) ? cover.lines : [];
    const spoken = lines.map((line) => line.spokenText).join("\n");
    const display = lines.map((line) => line.displayText).join("\n");
    return cover?.enabled === true && lines.length === 3 &&
      semanticText(spoken) === semanticText(display) &&
      semanticText(tts.scenes?.[0]?.narration) === semanticText(spoken);
  }));
  check("every Minjae production part keeps opening with body and isolates closing", partInputs.every(({ tts }) =>
    tts.openingVoiceContract?.v3AudioTagPolicy === "match_body_lead" &&
    tts.openingVoiceContract?.speedCap === 1.02 &&
    Number(tts.topicSpeechProfile?.baseSpeed) === 1.02 &&
    tts.voicePhaseContract?.opening?.speed === 1.02 &&
    tts.voicePhaseContract?.body?.speed === 1.02 &&
    tts.voicePhaseContract?.closing?.speed === 1.02 &&
    tts.voicePhaseContract?.body?.selector === "opening_through_preclosing" &&
    tts.voicePhaseContract?.assembly?.mode === "two_aligned_segments" &&
    tts.scenes?.[0]?.speechDirection?.v3AudioTag === tts.scenes?.[1]?.speechDirection?.v3AudioTag &&
    JSON.stringify(tts.scenes?.[0]?.speechDirection?.voiceTuning) === JSON.stringify(tts.scenes?.[1]?.speechDirection?.voiceTuning) &&
    tts.scenes?.at(-1)?.speechDirection?.v3AudioTag === "clear and decisive"));
  check("content-addressed TTS input names are unique per production part",
    new Set(paths.parts.map((part) => part.realTtsScriptPath)).size === paths.parts.length &&
    paths.parts.every((part) => /tts-script\.real-[a-f0-9]{12}\.json$/i.test(part.realTtsScriptPath)));
}

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
