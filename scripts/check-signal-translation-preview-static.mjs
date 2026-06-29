/**
 * Static guard check for SignalTranslationPreviewPanel display-only integration.
 * No dependencies, no network, no fs writes, no clipboard.
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PAGE_PATH    = resolve(__dirname, "../app/fact-cards/manual/package-preview/page.tsx");
const PANEL_PATH   = resolve(__dirname, "../app/fact-cards/manual/package-preview/SignalTranslationPreviewPanel.tsx");
const FIXTURES_PATH = resolve(__dirname, "../lib/source-facts/signal-translation-fixtures.ts");
const PAYLOAD_PATH  = resolve(__dirname, "../lib/source-facts/signal-translation-copy-payload.ts");
const QA_HELPER_PATH = resolve(__dirname, "../lib/source-facts/signal-translation-package-qa.ts");

const pageSrc    = readFileSync(PAGE_PATH, "utf-8");
const panelSrc   = readFileSync(PANEL_PATH, "utf-8");
const fixturesSrc = readFileSync(FIXTURES_PATH, "utf-8");
const payloadSrc  = readFileSync(PAYLOAD_PATH, "utf-8");
const qaHelperSrc = readFileSync(QA_HELPER_PATH, "utf-8");

// Non-comment lines helper (strip lines that start with optional whitespace + // or *)
function nonCommentLines(src) {
  return src.split("\n").filter((l) => !/^\s*(\/\/|\*)/.test(l)).join("\n");
}

const panelNonComment   = nonCommentLines(panelSrc);
const payloadNonComment = nonCommentLines(payloadSrc);

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

console.log(`\nStatic guard check: SignalTranslationPreviewPanel display-only integration\n`);

// ── page.tsx integration checks ───────────────────────────────────────────────
console.log("[ page.tsx integration — imports & panel reference ]");
check(
  "page.tsx imports SignalTranslationPreviewPanel",
  pageSrc.includes("SignalTranslationPreviewPanel"),
);
check(
  "page.tsx imports exchangeRateGeneratedSignalTranslationPackage",
  pageSrc.includes("exchangeRateGeneratedSignalTranslationPackage"),
);
check(
  "page.tsx imports interestRateGeneratedSignalTranslationPackage",
  pageSrc.includes("interestRateGeneratedSignalTranslationPackage"),
);
check(
  "page.tsx imports inflationGeneratedSignalTranslationPackage",
  pageSrc.includes("inflationGeneratedSignalTranslationPackage"),
);
check(
  "page.tsx passes packages={[...]} with all three packages to SignalTranslationPreviewPanel",
  pageSrc.includes("exchangeRateGeneratedSignalTranslationPackage") &&
    pageSrc.includes("interestRateGeneratedSignalTranslationPackage") &&
    pageSrc.includes("inflationGeneratedSignalTranslationPackage") &&
    // all three appear between <SignalTranslationPreviewPanel and closing />
    (() => {
      const panelStart = pageSrc.indexOf("<SignalTranslationPreviewPanel");
      const panelEnd   = pageSrc.indexOf("/>", panelStart);
      if (panelStart < 0 || panelEnd < 0) return false;
      const panelBlock = pageSrc.slice(panelStart, panelEnd);
      return (
        panelBlock.includes("exchangeRateGeneratedSignalTranslationPackage") &&
        panelBlock.includes("interestRateGeneratedSignalTranslationPackage") &&
        panelBlock.includes("inflationGeneratedSignalTranslationPackage")
      );
    })(),
);

// ── SignalTranslationPreviewPanel display-only checks ─────────────────────────
console.log("\n[ SignalTranslationPreviewPanel — forbidden patterns (non-comment lines) ]");
check("no 'use client' directive",      !panelSrc.includes("'use client'") && !panelSrc.includes('"use client"'));
check("no 'use server' directive",      !panelSrc.includes("'use server'") && !panelSrc.includes('"use server"'));
check("no useState",                    !panelNonComment.includes("useState"));
check("no useEffect",                   !panelNonComment.includes("useEffect"));
check("no fetch( call",                 !panelNonComment.includes("fetch("));
check("no navigator.clipboard",         !panelSrc.includes("navigator.clipboard"));
check("no localStorage",                !panelSrc.includes("localStorage"));
check("no sessionStorage",              !panelSrc.includes("sessionStorage"));
check("no formAction",                  !panelNonComment.includes("formAction"));
check("no action= (server action)",     !panelNonComment.includes("action="));

console.log("\n[ SignalTranslationPreviewPanel — required display-only indicators ]");
check("panel references 'display-only'",          panelSrc.includes("display-only"));
check("panel references 'readOnly'",              panelSrc.includes("readOnly"));
check("panel references imagePrompt",             panelSrc.includes("imagePrompt"));
check("panel references voiceTiming",             panelSrc.includes("voiceTiming"));
check("panel references layoutSafeZone",          panelSrc.includes("layoutSafeZone"));
check("panel references GeneratedCopyPayloadPreview", panelSrc.includes("GeneratedCopyPayloadPreview"));
check("panel references Caption / Scene QA Coverage", panelSrc.includes("Caption / Scene QA Coverage") || panelSrc.includes("CaptionSceneQA") || panelSrc.includes("Caption/Scene"));

// ── fixture/export checks ─────────────────────────────────────────────────────
console.log("\n[ signal-translation-fixtures.ts — required exports ]");
check(
  "fixtures exports exchangeRateGeneratedSignalTranslationPackage",
  fixturesSrc.includes("export const exchangeRateGeneratedSignalTranslationPackage"),
);
check(
  "fixtures exports interestRateGeneratedSignalTranslationPackage",
  fixturesSrc.includes("export const interestRateGeneratedSignalTranslationPackage"),
);
check(
  "fixtures exports inflationGeneratedSignalTranslationPackage",
  fixturesSrc.includes("export const inflationGeneratedSignalTranslationPackage"),
);
check(
  "fixtures imports inflationFactCard",
  fixturesSrc.includes("inflationFactCard"),
);

// ── copy payload checks ───────────────────────────────────────────────────────
console.log("\n[ signal-translation-copy-payload.ts — required symbols ]");
check(
  "MONEY_SHORTS_GENERATED_COPY_PAYLOAD_SCHEMA_VERSION exported",
  payloadSrc.includes("export const MONEY_SHORTS_GENERATED_COPY_PAYLOAD_SCHEMA_VERSION"),
);
check(
  "buildMoneyShortsGeneratedCopyPayload exported",
  payloadSrc.includes("buildMoneyShortsGeneratedCopyPayload"),
);
check(
  "stringifyMoneyShortsGeneratedCopyPayload exported",
  payloadSrc.includes("stringifyMoneyShortsGeneratedCopyPayload"),
);
check("imageTextPolicy referenced",  payloadSrc.includes("imageTextPolicy"));
check("layoutSafeZone referenced",   payloadSrc.includes("layoutSafeZone"));
check(
  "copy payload imports buildMoneyShortsScenePackageQaReport",
  payloadSrc.includes("buildMoneyShortsScenePackageQaReport"),
);
check(
  "copy payload includes scenePackageQaReport field",
  payloadSrc.includes("scenePackageQaReport"),
);

console.log("\n[ signal-translation-copy-payload.ts — forbidden patterns (non-comment lines) ]");
check("no navigator.clipboard",  !payloadSrc.includes("navigator.clipboard"));
check("no fetch( call",          !payloadNonComment.includes("fetch("));
check("no localStorage",         !payloadSrc.includes("localStorage"));
check("no sessionStorage",       !payloadSrc.includes("sessionStorage"));

// ── QA report panel integration checks ───────────────────────────────────────
console.log("\n[ SignalTranslationPreviewPanel — ScenePackageQaReportPanel integration ]");
check(
  "panel defines ScenePackageQaReportPanel component",
  panelSrc.includes("ScenePackageQaReportPanel"),
);
check(
  "panel imports buildMoneyShortsScenePackageQaReport",
  panelSrc.includes("buildMoneyShortsScenePackageQaReport"),
);
check(
  "panel imports MoneyShortsScenePackageQaReport type",
  panelSrc.includes("MoneyShortsScenePackageQaReport"),
);
check(
  "panel renders ScenePackageQaReportPanel with report prop",
  panelSrc.includes("<ScenePackageQaReportPanel") && panelSrc.includes("report="),
);
check(
  "panel calls buildMoneyShortsScenePackageQaReport inline",
  panelSrc.includes("buildMoneyShortsScenePackageQaReport(scenePackage)"),
);
check(
  "ScenePackageQaReportPanel uses <details> (default closed)",
  (() => {
    const start = panelSrc.indexOf("function ScenePackageQaReportPanel");
    if (start < 0) return false;
    // find the next function definition after ScenePackageQaReportPanel to bound the search
    const nextFn = panelSrc.indexOf("\nfunction ", start + 1);
    const block = nextFn > 0 ? panelSrc.slice(start, nextFn) : panelSrc.slice(start);
    return block.includes("<details");
  })(),
);
check(
  "ScenePackageQaReportPanel references 'not a publication gate'",
  panelSrc.includes("not a publication gate"),
);

console.log("\n[ signal-translation-package-qa.ts — required exports ]");
check(
  "qa helper exports buildMoneyShortsScenePackageQaReport",
  qaHelperSrc.includes("export function buildMoneyShortsScenePackageQaReport"),
);
check(
  "qa helper exports MoneyShortsScenePackageQaReport interface",
  qaHelperSrc.includes("export interface MoneyShortsScenePackageQaReport"),
);
check(
  "qa helper exports MoneyShortsScenePackageQaIssue interface",
  qaHelperSrc.includes("export interface MoneyShortsScenePackageQaIssue"),
);

console.log("\n[ signal-translation-fixtures.ts — QA report fixture exports ]");
check(
  "fixtures exports exchangeRateGeneratedSignalTranslationPackageQaReport",
  fixturesSrc.includes("export const exchangeRateGeneratedSignalTranslationPackageQaReport"),
);
check(
  "fixtures exports interestRateGeneratedSignalTranslationPackageQaReport",
  fixturesSrc.includes("export const interestRateGeneratedSignalTranslationPackageQaReport"),
);
check(
  "fixtures exports inflationGeneratedSignalTranslationPackageQaReport",
  fixturesSrc.includes("export const inflationGeneratedSignalTranslationPackageQaReport"),
);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n──────────────────────────────────────`);
console.log(`Result: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.error(`\nFAIL — ${failed} invariant(s) violated`);
  process.exit(1);
} else {
  console.log(`\nPASS — all invariants satisfied`);
}
