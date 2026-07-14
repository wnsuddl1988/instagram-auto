#!/usr/bin/env node
/**
 * Converts the approved two-part prehook pilot into two fail-closed
 * dual_platform_content_unit_v1 manifests. No network or publish call occurs here.
 */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const REPO_ROOT = process.cwd();
const PILOT_ROOT = "C:\\tmp\\money-shorts-os\\two-part-prehook-pilot-v1";
const SPEC_PATH = path.join(PILOT_ROOT, "pilot-spec.json");
const INDEX_PATH = path.join(PILOT_ROOT, "pilot-render-index.json");
const OUT_ROOT = path.join(PILOT_ROOT, "publish");
const DISCOVERY_PATH = path.join(REPO_ROOT, "lib", "platform-discovery-metadata.ts");

const PART_PUBLISH_INPUTS = Object.freeze({
  "part-1": {
    contentId: "pilot_stock_drop_buying_check_part_1",
    version: "v1",
    title: "주가 하락, 지금 사면 진짜 이득일까? 1편",
    hook: "주가가 싸졌다는 이유만으로 지금 사면 정말 이득일까요?",
    consequence: "사업과 재무가 달라졌는데 가격만 보면 깨진 투자 이유에 돈이 계속 묶일 수 있습니다.",
    action: "가격보다 하락 원인을 먼저 확인하세요. 2편에서 매수 전 확인할 세 가지를 바로 이어서 봅니다.",
    instagramCallToAction: "2편에서 매수 전 확인할 세 가지를 바로 이어서 보고, 다시 볼 수 있게 저장하세요.",
  },
  "part-2": {
    contentId: "pilot_stock_drop_buying_check_part_2",
    version: "v1",
    title: "이 3개 통과 못하면 매수 멈추세요 2편",
    hook: "2편입니다. 이 세 가지를 설명하지 못하면 매수를 멈추세요.",
    consequence: "하락 원인, 처음 매수한 이유, 틀렸을 때의 손실 한계가 비어 있으면 싼 가격은 기회가 아니라 함정일 수 있습니다.",
    action: "세 가지를 한 줄씩 확인한 뒤 결정하고, 급락한 종목이 싸 보일 때 다시 꺼내 보세요.",
    instagramCallToAction: "1편의 하락 원인 점검부터 이어서 보고, 매수 전에 다시 볼 수 있게 저장하세요.",
  },
});

function fail(message) {
  console.error(`ABORT: ${message}`);
  process.exit(1);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(`cannot read JSON ${file}: ${error?.message ?? error}`);
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function loadDiscoveryModule() {
  const output = ts.transpileModule(fs.readFileSync(DISCOVERY_PATH, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const sandboxModule = { exports: {} };
  vm.runInNewContext(output, { module: sandboxModule, exports: sandboxModule.exports, console });
  return sandboxModule.exports;
}

function assertPilotReady(spec, index) {
  if (spec?.schemaVersion !== "money_shorts_two_part_prehook_pilot_v1") fail("pilot spec schema mismatch");
  if (spec?.semanticSplitAudit?.passed !== true || spec?.semanticSplitAudit?.passedCount !== 7) {
    fail("semantic split audit is not fully approved");
  }
  if (index?.schemaVersion !== "money_shorts_two_part_prehook_pilot_index_v1" || index?.status !== "RENDER_MUX_OK") {
    fail("pilot render index is not ready");
  }
  if (!Array.isArray(index.parts) || index.parts.length !== 2) fail("exactly two rendered parts are required");
  for (const part of index.parts) {
    if (!(part.id in PART_PUBLISH_INPUTS)) fail(`unexpected pilot part: ${part.id}`);
    if (!fs.existsSync(part.path) || fs.statSync(part.path).size <= 0) fail(`rendered video missing: ${part.path}`);
    if (!part.validation || !Object.values(part.validation).every(Boolean)) fail(`${part.id} render validation failed`);
    if (!(Number(part.durationSec) >= 15 && Number(part.durationSec) <= 60)) {
      fail(`${part.id} duration must be 15-60 seconds for publish: ${part.durationSec}`);
    }
  }
}

function toManifestMetadata(discovery, customCallToAction) {
  return {
    instagramMetadata: {
      discoveryContractVersion: discovery.contractVersion,
      primaryKeywords: discovery.primaryKeywords,
      captionFirstLineHook: discovery.instagram.captionFirstLineHook,
      caption: discovery.instagram.caption,
      hashtags: discovery.instagram.hashtags,
      callToAction: customCallToAction,
      forbiddenUnrelatedTrendTags: true,
      recommendationEligibilityReviewRequired: discovery.instagram.recommendationEligibilityReviewRequired,
      originalContent: discovery.instagram.originalContent,
      shareToFeed: discovery.instagram.shareToFeed,
    },
    youtubeMetadata: {
      discoveryContractVersion: discovery.contractVersion,
      primaryKeywords: discovery.primaryKeywords,
      titleBase: discovery.youtube.titleBase,
      titleWithShortsSuffix: discovery.youtube.titleWithShortsSuffix,
      descriptionBase: discovery.youtube.descriptionBase,
      tags: discovery.youtube.tags,
      categoryId: discovery.youtube.categoryId,
      defaultLanguage: discovery.youtube.defaultLanguage,
      privacyStatus: discovery.youtube.privacyStatus,
      selfDeclaredMadeForKids: discovery.youtube.selfDeclaredMadeForKids,
      containsSyntheticMedia: discovery.youtube.containsSyntheticMedia,
    },
  };
}

const spec = readJson(SPEC_PATH);
const index = readJson(INDEX_PATH);
assertPilotReady(spec, index);

const discoveryModule = loadDiscoveryModule();
const buildMetadata = discoveryModule.buildPlatformDiscoveryMetadata;
const evaluateMetadata = discoveryModule.evaluatePlatformDiscoveryMetadata;
if (typeof buildMetadata !== "function" || typeof evaluateMetadata !== "function") fail("discovery metadata engine unavailable");

const manifests = [];
for (const rendered of index.parts) {
  const input = PART_PUBLISH_INPUTS[rendered.id];
  const built = buildMetadata({
    title: input.title,
    hook: input.hook,
    consequence: input.consequence,
    action: input.action,
    category: "finance",
    financeSubtopic: "investing_assets",
  });
  if (built?.gate?.ok !== true) fail(`${rendered.id} discovery build gate failed: ${built?.gate?.reasons?.join(", ")}`);
  const reevaluated = evaluateMetadata(built.metadata);
  if (reevaluated?.ok !== true) fail(`${rendered.id} discovery re-evaluation failed: ${reevaluated?.reasons?.join(", ")}`);

  const manifestMetadata = toManifestMetadata(built.metadata, input.instagramCallToAction);
  const manifest = {
    schemaVersion: "dual_platform_content_unit_v1",
    contentId: input.contentId,
    version: input.version,
    instagramSourcePath: path.resolve(rendered.path),
    youtubeSourcePath: path.resolve(rendered.path),
    ...manifestMetadata,
    existingPublishedKeys: [],
    seriesContinuity: {
      schemaVersion: "money_shorts_two_part_series_v1",
      parentTopic: spec.parentTopic,
      partId: rendered.id,
      partNumber: rendered.id === "part-1" ? 1 : 2,
      totalParts: 2,
      explicitContinuationCue: rendered.id === "part-1",
      explicitPartMarker: true,
    },
  };
  const manifestPath = path.join(OUT_ROOT, rendered.id, "dual-platform-content-unit.json");
  writeJson(manifestPath, manifest);
  manifests.push({
    id: rendered.id,
    contentId: input.contentId,
    version: input.version,
    manifestPath,
    sourcePath: path.resolve(rendered.path),
    durationSec: rendered.durationSec,
    discoveryGate: built.gate,
  });
}

writeJson(path.join(OUT_ROOT, "publish-manifest-index.json"), {
  schemaVersion: "money_shorts_two_part_publish_manifest_index_v1",
  status: "PREFLIGHT_INPUT_READY",
  externalPublishPerformed: false,
  manifests,
  generatedAt: new Date().toISOString(),
});

console.log(`[two-part-publish-manifests] ready: ${OUT_ROOT}`);
for (const manifest of manifests) console.log(`  ${manifest.id}: ${manifest.manifestPath}`);
