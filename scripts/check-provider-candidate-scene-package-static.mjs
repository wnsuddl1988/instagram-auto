/**
 * Static guard: SourceProviderCatalog → TopicCandidate → FactCard → ScenePackage → QA pipeline.
 * No network, no DB, no clipboard, no fs writes.
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROVIDER_CANDIDATES_PATH = resolve(
  __dirname,
  "../lib/source-facts/provider-candidates.ts",
);
const INDEX_PATH = resolve(__dirname, "../lib/source-facts/index.ts");

const providerCandidatesSrc = readFileSync(PROVIDER_CANDIDATES_PATH, "utf-8");
const indexSrc = readFileSync(INDEX_PATH, "utf-8");

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
  "\nStatic guard check: provider-candidates pipeline (SourceProvider → TopicCandidate → FactCard → ScenePackage → QA)\n",
);

// ── Types exported ─────────────────────────────────────────────────────────────
console.log("[ Types and interfaces ]");
check(
  "ProviderReadinessStatus type defined",
  providerCandidatesSrc.includes("export type ProviderReadinessStatus"),
);
check(
  "SourceProviderCatalogEntry interface defined",
  providerCandidatesSrc.includes("export interface SourceProviderCatalogEntry"),
);
check(
  "TopicCandidate interface defined",
  providerCandidatesSrc.includes("export interface TopicCandidate"),
);
check(
  "TopicCandidatePipelineResult interface defined",
  providerCandidatesSrc.includes(
    "export interface TopicCandidatePipelineResult",
  ),
);

// ── Functions exported ─────────────────────────────────────────────────────────
console.log("\n[ Functions ]");
check(
  "resolveProviderReadiness function exported",
  providerCandidatesSrc.includes("export function resolveProviderReadiness"),
);
check(
  "createFactCardDraftFromTopicCandidate function exported",
  providerCandidatesSrc.includes(
    "export function createFactCardDraftFromTopicCandidate",
  ),
);
check(
  "runTopicCandidatePipeline function exported",
  providerCandidatesSrc.includes("export function runTopicCandidatePipeline"),
);

// ── Catalog: 3 providers ───────────────────────────────────────────────────────
console.log("\n[ SOURCE_PROVIDER_CATALOG — 3 entries ]");
check(
  "SOURCE_PROVIDER_CATALOG exported",
  providerCandidatesSrc.includes(
    "export const SOURCE_PROVIDER_CATALOG: SourceProviderCatalogEntry[]",
  ),
);
check(
  "catalog includes provider-ecos-mock",
  providerCandidatesSrc.includes('"provider-ecos-mock"'),
);
check(
  "catalog includes provider-kosis-mock",
  providerCandidatesSrc.includes('"provider-kosis-mock"'),
);
check(
  "catalog includes provider-fx-manual-mock",
  providerCandidatesSrc.includes('"provider-fx-manual-mock"'),
);

// ── TopicCandidate fixtures: 3 candidates ─────────────────────────────────────
console.log("\n[ TopicCandidate fixtures — 3 mock candidates ]");
check(
  "ecosBaseRateTopicCandidate exported",
  providerCandidatesSrc.includes("export const ecosBaseRateTopicCandidate"),
);
check(
  "kosisCpiTopicCandidate exported",
  providerCandidatesSrc.includes("export const kosisCpiTopicCandidate"),
);
check(
  "fxUsdKrwTopicCandidate exported",
  providerCandidatesSrc.includes("export const fxUsdKrwTopicCandidate"),
);
check(
  "MOCK_TOPIC_CANDIDATES array exported",
  providerCandidatesSrc.includes(
    "export const MOCK_TOPIC_CANDIDATES: TopicCandidate[]",
  ),
);

// ── Pipeline results fixture ───────────────────────────────────────────────────
console.log("\n[ Pipeline results fixture ]");
check(
  "MOCK_TOPIC_CANDIDATE_PIPELINE_RESULTS exported",
  providerCandidatesSrc.includes(
    "export const MOCK_TOPIC_CANDIDATE_PIPELINE_RESULTS",
  ),
);
check(
  "pipeline results map over MOCK_TOPIC_CANDIDATES",
  providerCandidatesSrc.includes("MOCK_TOPIC_CANDIDATES.map(runTopicCandidatePipeline)"),
);

// ── Pipeline wires through ScenePackage + QA ──────────────────────────────────
console.log("\n[ Pipeline wires: FactCard → ScenePackage → QA ]");
check(
  "imports createMoneyShortsScenePackageFromFactCard",
  providerCandidatesSrc.includes("createMoneyShortsScenePackageFromFactCard"),
);
check(
  "imports buildMoneyShortsScenePackageQaReport",
  providerCandidatesSrc.includes("buildMoneyShortsScenePackageQaReport"),
);
check(
  "imports generateCandidateFromSnapshot",
  providerCandidatesSrc.includes("generateCandidateFromSnapshot"),
);
check(
  "pipeline result has scenePackageId field",
  providerCandidatesSrc.includes("scenePackageId: string | null"),
);
check(
  "pipeline result has qaIsValid field",
  providerCandidatesSrc.includes("qaIsValid: boolean"),
);
check(
  "pipeline result has qaErrorCount field",
  providerCandidatesSrc.includes("qaErrorCount: number"),
);
check(
  "pipeline result has qaWarningCount field",
  providerCandidatesSrc.includes("qaWarningCount: number"),
);

// ── No forbidden patterns ──────────────────────────────────────────────────────
console.log("\n[ Forbidden patterns — safety ]");
check(
  "no new Date() calls",
  !providerCandidatesSrc.includes("new Date()"),
);
check(
  "no live API calls (fetch/axios/http)",
  !providerCandidatesSrc.includes("fetch(") &&
    !providerCandidatesSrc.includes("axios.") &&
    !providerCandidatesSrc.includes("http.get"),
);
check(
  "no clipboard write",
  !providerCandidatesSrc.includes("navigator.clipboard") &&
    !providerCandidatesSrc.includes("writeText"),
);
check(
  "no use client directive",
  !providerCandidatesSrc.includes('"use client"'),
);
check(
  "isMock is always true for mock fixtures",
  providerCandidatesSrc.includes("isMock: true"),
);
check(
  "isPublishable is always false for mock fixtures",
  providerCandidatesSrc.includes("isPublishable: false"),
);

// ── TopicCandidate shape ───────────────────────────────────────────────────────
console.log("\n[ TopicCandidate shape requirements ]");
check(
  "TopicCandidate has id field",
  providerCandidatesSrc.includes("  id: string;") &&
    providerCandidatesSrc.includes("export interface TopicCandidate"),
);
check(
  "TopicCandidate has topicLabel field",
  providerCandidatesSrc.includes("topicLabel: string"),
);
check(
  "TopicCandidate has rawSnapshot field",
  providerCandidatesSrc.includes("rawSnapshot: RawDataSnapshot"),
);
check(
  "TopicCandidate has parser field (RawSnapshotParser)",
  providerCandidatesSrc.includes("parser: RawSnapshotParser"),
);
check(
  "TopicCandidate has providerCatalogEntry field",
  providerCandidatesSrc.includes(
    "providerCatalogEntry: SourceProviderCatalogEntry",
  ),
);

// ── resolveProviderReadiness covers inactive path ─────────────────────────────
console.log("\n[ resolveProviderReadiness logic ]");
check(
  "returns inactive when provider.isActive is false",
  providerCandidatesSrc.includes('"inactive"'),
);
check(
  "returns pending_api_key when requiresApiKey + ready_mock",
  providerCandidatesSrc.includes('"pending_api_key"'),
);
check(
  "returns pending_review when commercialUseStatus needs_review",
  providerCandidatesSrc.includes('"pending_review"'),
);

// ── index.ts export ────────────────────────────────────────────────────────────
console.log("\n[ index.ts re-export ]");
check(
  "index.ts re-exports provider-candidates",
  indexSrc.includes("./provider-candidates"),
);

console.log(
  `\n${passed + failed} checks — ${passed} PASS, ${failed} FAIL\n`,
);

if (failed > 0) {
  process.exit(1);
}
