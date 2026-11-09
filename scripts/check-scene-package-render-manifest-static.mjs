/**
 * Static guard: MoneyShortsScenePackage → RenderManifest adapter pipeline.
 * No network, no DB, no clipboard, no fs writes, no ffmpeg execution.
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ADAPTER_PATH = resolve(__dirname, "../lib/render-plan/scene-package-adapter.ts");
const FIXTURES_PATH = resolve(__dirname, "../lib/render-plan/fixtures.ts");
const INDEX_PATH = resolve(__dirname, "../lib/render-plan/index.ts");
const SOURCE_FACTS_INDEX_PATH = resolve(__dirname, "../lib/source-facts/index.ts");

const adapterSrc = readFileSync(ADAPTER_PATH, "utf-8");
const fixturesSrc = readFileSync(FIXTURES_PATH, "utf-8");
const indexSrc = readFileSync(INDEX_PATH, "utf-8");
const sourceFatsIndexSrc = readFileSync(SOURCE_FACTS_INDEX_PATH, "utf-8");

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    failed++;
  }
}

console.log(
  "\nStatic guard check: ScenePackage → RenderManifest adapter pipeline\n",
);

// ── Adapter: types and exports ─────────────────────────────────────────────────
console.log("[ scene-package-adapter.ts — types and exports ]");
check(
  "ScenePackageAdapterOptions interface exported",
  adapterSrc.includes("export interface ScenePackageAdapterOptions"),
);
check(
  "ScenePackageRenderManifestResult interface exported",
  adapterSrc.includes("export interface ScenePackageRenderManifestResult"),
);
check(
  "buildRenderManifestFromScenePackage function exported",
  adapterSrc.includes("export function buildRenderManifestFromScenePackage"),
);
check(
  "adapter imports MoneyShortsScenePackage from source-facts",
  adapterSrc.includes("MoneyShortsScenePackage") &&
    adapterSrc.includes("signal-translation-generator"),
);
check(
  "adapter imports validateRenderManifest",
  adapterSrc.includes("validateRenderManifest"),
);

// ── Adapter: RenderManifest field mapping ──────────────────────────────────────
console.log("\n[ scene-package-adapter.ts — RenderManifest field mapping ]");
check(
  "sourceType is script_package",
  adapterSrc.includes('"script_package"'),
);
check(
  "factCardIds set from scenePackage.factCardId",
  adapterSrc.includes("scenePackage.factCardId"),
);
check(
  "sourceCitationIds deduped from brief + sceneCards",
  adapterSrc.includes("brief.sourceCitationIds") &&
    adapterSrc.includes("sc.sourceCitationIds"),
);
check(
  "timelineId uses deterministic placeholder",
  adapterSrc.includes("`timeline-${sourceId}`"),
);
check(
  "ttsPackageId uses deterministic placeholder",
  adapterSrc.includes("`tts-${sourceId}`"),
);
check(
  "riskLevel is unchecked (existing convention, no new meaning string)",
  adapterSrc.includes('"unchecked"'),
);
check(
  "outputSpec dimensions is DEFAULT_RENDER_DIMENSIONS (1080×1920)",
  adapterSrc.includes("DEFAULT_RENDER_DIMENSIONS"),
);
check(
  "plannedOutputPath is relative placeholder",
  adapterSrc.includes("output/planned") &&
    !adapterSrc.includes("output/v2") &&
    !adapterSrc.includes("C:\\\\"),
);
check(
  "imageInputs has one entry per sceneCard (6 sceneCards)",
  adapterSrc.includes("scenePackage.sceneCards.map"),
);
check(
  "captionOverlays use captionBlocks absolute timeline (startSec/endSec)",
  adapterSrc.includes("block.startSec") && adapterSrc.includes("block.endSec"),
);
check(
  "captionOverlays captionText is block.text (no new text invented)",
  adapterSrc.includes("captionText: block.text"),
);
check(
  "audioInput is placeholder (no real TTS call)",
  adapterSrc.includes("openai_tts") && adapterSrc.includes(".mp3"),
);
check(
  "ffmpegPlan is data-only string (never executed)",
  adapterSrc.includes("PlannedFfmpegCommand"),
);
check(
  "validateRenderManifest called and result returned",
  adapterSrc.includes("validateRenderManifest(renderManifest)") &&
    adapterSrc.includes("return { renderManifest, validation }"),
);

// ── Adapter: forbidden patterns ───────────────────────────────────────────────
console.log("\n[ scene-package-adapter.ts — forbidden patterns ]");
check(
  "no child_process",
  !adapterSrc.includes("child_process"),
);
check(
  "no exec( outside comments",
  !adapterSrc
    .split("\n")
    .filter((l) => !/^\s*(\/\/|\*)/.test(l))
    .join("\n")
    .includes("exec("),
);
check(
  "no spawn(",
  !adapterSrc.includes("spawn("),
);
check(
  "no fetch(",
  !adapterSrc.includes("fetch("),
);
check(
  "no clipboard write",
  !adapterSrc.includes("navigator.clipboard") && !adapterSrc.includes("writeText"),
);
check(
  "no .money-shorts-local reference",
  !adapterSrc.includes(".money-shorts-local"),
);
check(
  "no use client directive",
  !adapterSrc.includes('"use client"'),
);
check(
  "no new Date() calls",
  !adapterSrc.includes("new Date()"),
);
check(
  "assetSourceType is placeholder (no real image generation)",
  adapterSrc.includes('"placeholder"'),
);

// ── Output spec: 1080×1920 / 30fps ───────────────────────────────────────────
console.log("\n[ scene-package-adapter.ts — output spec invariants ]");
check(
  "codec h264",
  adapterSrc.includes('"h264"'),
);
check(
  "audioCodec aac",
  adapterSrc.includes('"aac"'),
);
check(
  "container mp4",
  adapterSrc.includes('"mp4"'),
);
check(
  "fps default 30",
  adapterSrc.includes("fps ?? 30"),
);
check(
  "6 imageInputs (one per sceneCard)",
  adapterSrc.includes("scenePackage.sceneCards.map((sc) => ({"),
);

// ── Fixtures: provider-driven pipeline ───────────────────────────────────────
console.log("\n[ lib/render-plan/fixtures.ts — provider-driven fixture ]");
check(
  "fixtures imports providerCandidateGeneratedSignalTranslationPackage",
  fixturesSrc.includes("providerCandidateGeneratedSignalTranslationPackage"),
);
check(
  "fixtures imports buildRenderManifestFromScenePackage",
  fixturesSrc.includes("buildRenderManifestFromScenePackage"),
);
check(
  "providerCandidateRenderManifestResult exported",
  fixturesSrc.includes("export const providerCandidateRenderManifestResult"),
);
check(
  "providerCandidateRenderManifest exported",
  fixturesSrc.includes("export const providerCandidateRenderManifest"),
);
check(
  "fixture uses provider-candidates import (render-plan → source-facts direction)",
  fixturesSrc.includes("source-facts/provider-candidates"),
);

// ── index.ts re-exports ────────────────────────────────────────────────────────
console.log("\n[ lib/render-plan/index.ts — exports ]");
check(
  "index re-exports buildRenderManifestFromScenePackage",
  indexSrc.includes("buildRenderManifestFromScenePackage"),
);
check(
  "index re-exports ScenePackageRenderManifestResult type",
  indexSrc.includes("ScenePackageRenderManifestResult"),
);
check(
  "index re-exports providerCandidateRenderManifestResult",
  indexSrc.includes("providerCandidateRenderManifestResult"),
);
check(
  "index re-exports providerCandidateRenderManifest",
  indexSrc.includes("providerCandidateRenderManifest"),
);

// ── Circular import guard ─────────────────────────────────────────────────────
console.log("\n[ Circular import safety ]");
check(
  "source-facts/index.ts does NOT import from render-plan",
  !sourceFatsIndexSrc.includes("render-plan"),
);
check(
  "adapter imports source-facts (render-plan → source-facts, single direction)",
  adapterSrc.includes("@/lib/source-facts"),
);
check(
  "fixtures imports source-facts/provider-candidates (render-plan → source-facts, single direction)",
  fixturesSrc.includes("@/lib/source-facts/provider-candidates"),
);

console.log(`\n${passed + failed} checks — ${passed} PASS, ${failed} FAIL\n`);

if (failed > 0) {
  process.exit(1);
}
