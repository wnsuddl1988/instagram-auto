#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const ROOT = process.cwd();
const BANK_PATH = path.join(ROOT, "lib", "finance-editorial-topic-bank.ts");
const ENGINE_PATH = path.join(ROOT, "lib", "finance-editorial-script-engine.ts");
const DISCOVERY_PATH = path.join(ROOT, "lib", "platform-discovery-metadata.ts");
const OWNER_PATH = path.join(ROOT, "lib", "owner-web-operator.ts");
const ORCHESTRATOR_PATH = path.join(ROOT, "scripts", "run-dual-platform-final-publish-orchestrator.mjs");
const LIVE_RUNNER_PATH = path.join(ROOT, "scripts", "run-final-e2e-dual-platform-publish-once.mjs");
const ROUTE_PATH = path.join(ROOT, "app", "api", "money-shorts", "operator", "route.ts");
const WIZARD_PATH = path.join(ROOT, "components", "VideoCreationWizard.tsx");

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

function loadTypescriptModule(filePath) {
  const output = ts.transpileModule(readFileSync(filePath, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const sandboxModule = { exports: {} };
  vm.runInNewContext(output, { module: sandboxModule, exports: sandboxModule.exports, console });
  return sandboxModule.exports;
}

const bankModule = loadTypescriptModule(BANK_PATH);
const engineModule = loadTypescriptModule(ENGINE_PATH);
const discoveryModule = loadTypescriptModule(DISCOVERY_PATH);
const bank = bankModule.FINANCE_EDITORIAL_TOPIC_BANK ?? [];
const buildScript = engineModule.buildFinanceEditorialScriptParts;
const buildMetadata = discoveryModule.buildPlatformDiscoveryMetadata;
const evaluateMetadata = discoveryModule.evaluatePlatformDiscoveryMetadata;
const version = discoveryModule.PLATFORM_DISCOVERY_METADATA_VERSION;

const audits = bank.map((topic) => {
  const script = buildScript(topic);
  const result = buildMetadata({
    title: topic.title,
    hook: script.hook,
    consequence: script.consequence,
    action: script.habit,
    category: "finance",
    financeSubtopic: topic.financeSubtopic,
  });
  return { topic, script, ...result };
});

check("discovery engine audits exactly 500 finance titles", audits.length === 500, String(audits.length));
check("all 500 metadata packages pass the common discovery gate", audits.every(({ gate }) => gate.ok),
  String(audits.filter(({ gate }) => !gate.ok).length));
check("all packages use the current discovery contract", audits.every(({ metadata }) => metadata.contractVersion === version));
check("Instagram keeps four to six relevant unique hashtags", audits.every(({ metadata }) =>
  metadata.instagram.hashtags.length >= 4 && metadata.instagram.hashtags.length <= 6 &&
  new Set(metadata.instagram.hashtags).size === metadata.instagram.hashtags.length));
check("Instagram requires recommendation review, original content and feed sharing", audits.every(({ metadata }) =>
  metadata.instagram.recommendationEligibilityReviewRequired && metadata.instagram.originalContent && metadata.instagram.shareToFeed));
check("YouTube title, description and content share the primary keywords", audits.every(({ metadata }) =>
  metadata.primaryKeywords.every((keyword) =>
    `${metadata.youtube.titleBase} ${metadata.youtube.descriptionBase}`.replace(/\s+/g, "").includes(keyword.replace(/\s+/g, "")))));
check("YouTube uses a concise Shorts title and three to eight tags", audits.every(({ metadata }) =>
  metadata.youtube.titleWithShortsSuffix.length <= 100 && metadata.youtube.titleWithShortsSuffix.includes("#Shorts") &&
  metadata.youtube.tags.length >= 3 && metadata.youtube.tags.length <= 8));
check("all generated videos disclose synthetic media to YouTube", audits.every(({ metadata }) => metadata.youtube.containsSyntheticMedia === true));
check("all finance descriptions carry the non-advice context", audits.every(({ metadata }) =>
  metadata.youtube.descriptionBase.includes("투자 권유가 아닌") && metadata.instagram.caption.includes("투자 권유가 아닌")));
check("unrelated trend bait is absent from every platform tag", audits.every(({ metadata }) =>
  [...metadata.instagram.hashtags, ...metadata.youtube.tags].every((tag) => !/(fyp|viral|바이럴|떡상|챌린지)/i.test(tag))));
check("all twelve finance subtopics produce distinct keyword families",
  new Set(audits.map(({ topic, metadata }) => `${topic.financeSubtopic}:${metadata.primaryKeywords.join("|")}`)).size === 12);

const sample = audits[0].metadata;
const trendBait = structuredClone(sample);
trendBait.instagram.hashtags = [...trendBait.instagram.hashtags.slice(0, 4), "fyp"];
check("gate rejects unrelated reach-bait hashtags", !evaluateMetadata(trendBait).ok &&
  evaluateMetadata(trendBait).reasons.includes("unrelated_trend_tag_forbidden"));

const missingDisclosure = structuredClone(sample);
missingDisclosure.youtube.containsSyntheticMedia = false;
check("gate rejects missing YouTube synthetic-media disclosure", !evaluateMetadata(missingDisclosure).ok &&
  evaluateMetadata(missingDisclosure).reasons.includes("youtube_synthetic_media_disclosure_missing"));

const overclaim = structuredClone(sample);
overclaim.youtube.descriptionBase += " 무조건 수익이 오른다.";
check("gate rejects guaranteed-return language", !evaluateMetadata(overclaim).ok &&
  evaluateMetadata(overclaim).reasons.includes("financial_overclaim_forbidden"));

const keywordMismatch = structuredClone(sample);
keywordMismatch.primaryKeywords = ["전혀없는키워드", "또없는키워드"];
check("gate rejects metadata that does not match its video topic", !evaluateMetadata(keywordMismatch).ok &&
  evaluateMetadata(keywordMismatch).reasons.includes("primary_keyword_content_mismatch"));

const ownerSource = readFileSync(OWNER_PATH, "utf8");
const orchestratorSource = readFileSync(ORCHESTRATOR_PATH, "utf8");
const liveRunnerSource = readFileSync(LIVE_RUNNER_PATH, "utf8");
const routeSource = readFileSync(ROUTE_PATH, "utf8");
const wizardSource = readFileSync(WIZARD_PATH, "utf8");
check("wizard content units are built by the common discovery engine and fail closed", /buildPlatformDiscoveryMetadata/.test(ownerSource) &&
  /discovery_metadata_gate_failed/.test(ownerSource) && /discoveryMetadataContractVersion/.test(ownerSource));
check("orchestrator enforces 4-6 Instagram tags, topic match and recommendation flags",
  /hashtag_count_below_min_4/.test(orchestratorSource) && /hashtag_count_above_max_6/.test(orchestratorSource) &&
  /primary_keyword_content_mismatch/.test(orchestratorSource) && /instagram_recommendation_flags_missing/.test(orchestratorSource));
check("actual YouTube upload sends the synthetic-media disclosure", /containsSyntheticMedia:\s*ytMeta\.containsSyntheticMedia === true/.test(liveRunnerSource));
check("actual upload requires the Owner discovery review on both client and server", /confirmDiscoveryReady/.test(wizardSource) &&
  /confirmDiscoveryReady !== true/.test(routeSource) && /Account Status/.test(wizardSource));

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exitCode = 1;
