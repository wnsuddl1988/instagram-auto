import type { SourceProvider, RawDataSnapshot } from "./types";
import type { ManualFactCardDraft } from "./manual";
import type { RawSnapshotParser } from "./raw-snapshot-parser";
import { generateCandidateFromSnapshot } from "./raw-snapshot-parser";
import { createMoneyShortsScenePackageFromFactCard } from "./signal-translation-generator";
import { buildMoneyShortsScenePackageQaReport } from "./signal-translation-package-qa";

// ── Provider Catalog ───────────────────────────────────────────────────────────

/**
 * Named catalog entry: a SourceProvider plus readiness metadata.
 * Readiness describes whether a live data path is available and approved.
 */
export type ProviderReadinessStatus =
  | "ready_mock"       // mock data only; no live path
  | "ready_live"       // live data path confirmed and approved
  | "pending_api_key"  // needs an API key to activate
  | "pending_review"   // license/commercial use under review
  | "inactive";        // not in use

export interface SourceProviderCatalogEntry {
  provider: SourceProvider;
  readinessStatus: ProviderReadinessStatus;
  readinessNote?: string;
}

/**
 * Evaluates the readiness status of a catalog entry.
 * Pure function — no external calls.
 */
export function resolveProviderReadiness(
  entry: SourceProviderCatalogEntry,
): ProviderReadinessStatus {
  const { provider, readinessStatus } = entry;
  if (!provider.isActive) return "inactive";
  if (provider.requiresApiKey && readinessStatus === "ready_mock") {
    return "pending_api_key";
  }
  if (
    provider.commercialUseStatus === "needs_review" &&
    readinessStatus !== "ready_live"
  ) {
    return "pending_review";
  }
  return readinessStatus;
}

export const SOURCE_PROVIDER_CATALOG: SourceProviderCatalogEntry[] = [
  {
    provider: {
      id: "provider-ecos-mock",
      name: "한국은행 ECOS (mock)",
      providerType: "ecos",
      baseUrl: "https://ecos.bok.or.kr",
      licenseNote:
        "Mock fixture only. Live path requires ECOS API key and terms verification.",
      commercialUseStatus: "needs_review",
      requiresApiKey: true,
      isActive: true,
    },
    readinessStatus: "ready_mock",
    readinessNote:
      "기준금리 mock snapshot 사용 가능. 라이브 경로는 ECOS API key 필요.",
  },
  {
    provider: {
      id: "provider-kosis-mock",
      name: "통계청 KOSIS (mock)",
      providerType: "kosis",
      baseUrl: "https://kosis.kr",
      licenseNote:
        "Mock fixture only. Live path requires KOSIS API approval.",
      commercialUseStatus: "needs_review",
      requiresApiKey: false,
      isActive: true,
    },
    readinessStatus: "ready_mock",
    readinessNote:
      "소비자물가 mock snapshot 사용 가능. 라이브 경로는 KOSIS 이용 승인 필요.",
  },
  {
    provider: {
      id: "provider-fx-manual-mock",
      name: "환율 수동입력 (mock)",
      providerType: "manual",
      baseUrl: "https://example.com",
      licenseNote:
        "Mock fixture only. Must replace with a verified official source before publish.",
      commercialUseStatus: "needs_review",
      requiresApiKey: false,
      isActive: true,
    },
    readinessStatus: "ready_mock",
    readinessNote:
      "환율 mock snapshot 사용 가능. 출판 전 공식 출처로 교체 필수.",
  },
];

// ── TopicCandidate ─────────────────────────────────────────────────────────────

/**
 * A specific indicator/topic that an Owner wants to produce content for.
 * Connects a provider, a raw snapshot, and a parser into a single candidate unit.
 * The TopicCandidate itself does not produce a FactCard — call
 * createFactCardDraftFromTopicCandidate() to attempt conversion.
 */
export interface TopicCandidate {
  id: string;
  topicLabel: string;
  providerCatalogEntry: SourceProviderCatalogEntry;
  rawSnapshot: RawDataSnapshot;
  parser: RawSnapshotParser;
  addedAt: string;
}

/**
 * Converts a TopicCandidate into a ManualFactCardDraft via the attached parser.
 * Returns null when the parser cannot handle the snapshot shape.
 * Never calls live APIs or invents field values.
 */
export function createFactCardDraftFromTopicCandidate(
  candidate: TopicCandidate,
): ManualFactCardDraft | null {
  return candidate.parser.parse(candidate.rawSnapshot);
}

// ── Full pipeline: TopicCandidate → FactCard → ScenePackage → QA ──────────────

export interface TopicCandidatePipelineResult {
  topicCandidateId: string;
  topicLabel: string;
  providerReadiness: ProviderReadinessStatus;
  draftOk: boolean;
  factCardId: string | null;
  scenePackageId: string | null;
  qaIsValid: boolean;
  qaErrorCount: number;
  qaWarningCount: number;
  pipelineError?: string;
}

/**
 * Runs a single TopicCandidate through the full pipeline:
 * TopicCandidate → draft → FactCard → ScenePackage → QA report.
 * Returns a structured result; never throws.
 */
export function runTopicCandidatePipeline(
  candidate: TopicCandidate,
): TopicCandidatePipelineResult {
  const providerReadiness = resolveProviderReadiness(
    candidate.providerCatalogEntry,
  );

  let factCardId: string | null = null;
  let scenePackageId: string | null = null;
  let qaIsValid = false;
  let qaErrorCount = 0;
  let qaWarningCount = 0;
  let pipelineError: string | undefined;

  try {
    const authoringResult = generateCandidateFromSnapshot(
      candidate.parser,
      candidate.rawSnapshot,
    );

    if (!authoringResult.ok || authoringResult.factCard === null) {
      pipelineError = `draft failed: ${authoringResult.validation.errors.map((e) => e.code).join(", ")}`;
      return {
        topicCandidateId: candidate.id,
        topicLabel: candidate.topicLabel,
        providerReadiness,
        draftOk: false,
        factCardId: null,
        scenePackageId: null,
        qaIsValid: false,
        qaErrorCount: authoringResult.validation.errors.length,
        qaWarningCount: 0,
        pipelineError,
      };
    }

    const factCard = authoringResult.factCard;
    factCardId = factCard.id;

    const scenePackage = createMoneyShortsScenePackageFromFactCard(factCard);
    scenePackageId = scenePackage.id;

    const qaReport = buildMoneyShortsScenePackageQaReport(scenePackage);
    qaIsValid = qaReport.isValid;
    qaErrorCount = qaReport.errors.length;
    qaWarningCount = qaReport.warnings.length;
  } catch (err) {
    pipelineError = err instanceof Error ? err.message : String(err);
  }

  return {
    topicCandidateId: candidate.id,
    topicLabel: candidate.topicLabel,
    providerReadiness,
    draftOk: factCardId !== null,
    factCardId,
    scenePackageId,
    qaIsValid,
    qaErrorCount,
    qaWarningCount,
    pipelineError,
  };
}

// ── Mock snapshots for TopicCandidate fixtures ─────────────────────────────────

const mockEcosBaseRateSnapshotForCandidate: RawDataSnapshot = {
  id: "raw-ecos-base-rate-candidate-2025-01",
  sourceProviderId: "provider-ecos-mock",
  sourceName: "한국은행 ECOS — 기준금리",
  sourceUrl: "https://ecos.bok.or.kr/api/StatisticSearch/",
  fetchedAt: "2026-06-25T00:00:00+09:00",
  publishedDate: "2025-01-16",
  dataPeriod: "2025년 1월",
  collectionMethod: "api",
  rawPayload: {
    statCode: "722Y001",
    itemCode: "0101000",
    indicatorName: "기준금리",
    unit: "%",
    currentValue: 3.0,
    previousValue: 3.25,
    changeValue: -0.25,
    currentValueText: "3.0%",
    previousValueText: "3.25%",
    changeValueText: "-0.25%p",
    dataPeriod: "2025년 1월",
    publishedDate: "2025-01-16",
    sourceUrl: "https://ecos.bok.or.kr/#/Short/722Y001",
    citationLabel: "한국은행 ECOS — 기준금리 통계 2025.01",
  },
};

const mockKosisCpiSnapshotForCandidate: RawDataSnapshot = {
  id: "raw-kosis-cpi-candidate-2026-05",
  sourceProviderId: "provider-kosis-mock",
  sourceName: "통계청/KOSIS — 소비자물가지수",
  sourceUrl: "https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_1J22001",
  fetchedAt: "2026-06-01T09:00:00+09:00",
  publishedDate: "2026-06-03",
  dataPeriod: "2026년 5월",
  collectionMethod: "api",
  rawPayload: {
    indicatorName: "소비자물가지수(CPI)",
    unit: "전년동월대비 %",
    currentValue: 2.7,
    previousValue: 2.9,
    changeValue: -0.2,
    currentValueText: "2.7%",
    previousValueText: "2.9%",
    changeValueText: "-0.2%p",
    dataPeriod: "2026년 5월",
    publishedDate: "2026-06-03",
    sourceUrl:
      "https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_1J22001",
    citationLabel: "통계청 KOSIS — 소비자물가지수 2026.05",
  },
};

const mockFxSnapshotForCandidate: RawDataSnapshot = {
  id: "raw-fx-usd-krw-candidate-2026-06",
  sourceProviderId: "provider-fx-manual-mock",
  sourceName: "수동 입력 — 원/달러 환율",
  sourceUrl: "https://example.com/fx-mock",
  fetchedAt: "2026-06-30T09:00:00+09:00",
  publishedDate: "2026-06-30",
  dataPeriod: "2026년 6월 30일",
  collectionMethod: "manual",
  rawPayload: {
    indicatorName: "원/달러 환율",
    unit: "원",
    currentValue: 1385,
    previousValue: 1372,
    changeValue: 13,
    currentValueText: "1,385원",
    previousValueText: "1,372원",
    changeValueText: "+13원",
    dataPeriod: "2026년 6월 30일",
    publishedDate: "2026-06-30",
    sourceUrl: "https://example.com/fx-mock",
    citationLabel: "수동 입력 — 원/달러 환율 예시 2026.06.30",
  },
};

// ── ECOS base rate parser (scoped to this module's candidate snapshot) ─────────

interface EcosBaseRateCandidatePayload {
  indicatorName: string;
  unit: string;
  currentValue: number;
  previousValue: number;
  changeValue: number;
  currentValueText: string;
  previousValueText: string;
  changeValueText: string;
  dataPeriod: string;
  publishedDate: string;
  sourceUrl: string;
  citationLabel: string;
}

function isEcosBaseRateCandidatePayload(
  raw: unknown,
): raw is EcosBaseRateCandidatePayload {
  if (typeof raw !== "object" || raw === null) return false;
  const r = raw as Record<string, unknown>;
  return (
    typeof r.indicatorName === "string" &&
    typeof r.unit === "string" &&
    typeof r.currentValue === "number" &&
    typeof r.previousValue === "number" &&
    typeof r.changeValue === "number" &&
    typeof r.currentValueText === "string" &&
    typeof r.previousValueText === "string" &&
    typeof r.changeValueText === "string" &&
    typeof r.dataPeriod === "string" &&
    typeof r.publishedDate === "string" &&
    typeof r.sourceUrl === "string" &&
    typeof r.citationLabel === "string"
  );
}

function buildDraftFromCandidatePayload(
  snapshot: RawDataSnapshot,
  p: EcosBaseRateCandidatePayload,
): ManualFactCardDraft {
  const chgRate =
    p.previousValue !== 0 ? p.changeValue / p.previousValue : 0;
  const changeRateSign = chgRate > 0 ? "+" : "";
  return {
    id: `fact-card-candidate-${snapshot.id}`,
    primarySourceProviderId: snapshot.sourceProviderId,
    sourceName: snapshot.sourceName,
    sourceUrl: snapshot.sourceUrl,
    publishedDate: snapshot.publishedDate,
    dataPeriod: p.dataPeriod,
    indicatorName: p.indicatorName,
    currentValue: p.currentValueText,
    previousValue: p.previousValueText,
    changeValue: p.changeValueText,
    changeRate: `${changeRateSign}${(chgRate * 100).toFixed(2)}%`,
    unit: p.unit,
    currentNumericValue: p.currentValue,
    previousNumericValue: p.previousValue,
    changeNumericValue: p.changeValue,
    changeRateNumericValue: parseFloat((chgRate * 100).toFixed(4)),
    comparisonType: "previous_release",
    interpretation: `${p.dataPeriod} ${p.indicatorName}은(는) ${p.currentValueText}다. 직전 대비 ${p.changeValueText} 변동됐다.`,
    cautionNote:
      "이 수치는 발표 시점 기준이며 향후 추가 변동 가능성은 포함하지 않는다.",
    allowedClaims: [
      `${p.dataPeriod} ${p.indicatorName}은(는) ${p.currentValueText}다.`,
      `직전 대비 ${p.changeValueText} 변동됐다.`,
    ],
    blockedClaims: ["폭등", "폭락", "급등락", "투자 권고"],
    contentCategory: "source_based_finance",
    citations: [
      {
        id: `citation-candidate-${snapshot.id}`,
        sourceProviderId: snapshot.sourceProviderId,
        sourceName: snapshot.sourceName,
        sourceUrl: p.sourceUrl,
        publishedDate: snapshot.publishedDate,
        dataPeriod: p.dataPeriod,
        citationLabel: p.citationLabel,
        commercialUseStatus: "allowed",
      },
    ],
    isMock: true,
    isPublishable: false,
  };
}

const candidatePayloadParser: RawSnapshotParser = {
  sourceProviderId: "provider-ecos-mock",
  parserName: "EcosBaseRateCandidateParser",
  parse(snapshot: RawDataSnapshot): ManualFactCardDraft | null {
    if (!isEcosBaseRateCandidatePayload(snapshot.rawPayload)) return null;
    return buildDraftFromCandidatePayload(snapshot, snapshot.rawPayload);
  },
};

const kosisCandidateParser: RawSnapshotParser = {
  sourceProviderId: "provider-kosis-mock",
  parserName: "KosisCpiCandidateParser",
  parse(snapshot: RawDataSnapshot): ManualFactCardDraft | null {
    if (snapshot.sourceProviderId !== this.sourceProviderId) return null;
    if (!isEcosBaseRateCandidatePayload(snapshot.rawPayload)) return null;
    return buildDraftFromCandidatePayload(snapshot, snapshot.rawPayload);
  },
};

const fxCandidateParser: RawSnapshotParser = {
  sourceProviderId: "provider-fx-manual-mock",
  parserName: "FxManualCandidateParser",
  parse(snapshot: RawDataSnapshot): ManualFactCardDraft | null {
    if (snapshot.sourceProviderId !== this.sourceProviderId) return null;
    if (!isEcosBaseRateCandidatePayload(snapshot.rawPayload)) return null;
    return buildDraftFromCandidatePayload(snapshot, snapshot.rawPayload);
  },
};

// ── Mock TopicCandidate fixtures ───────────────────────────────────────────────

export const ecosBaseRateTopicCandidate: TopicCandidate = {
  id: "topic-candidate-ecos-base-rate-2025-01",
  topicLabel: "기준금리 (ECOS mock)",
  providerCatalogEntry: SOURCE_PROVIDER_CATALOG[0],
  rawSnapshot: mockEcosBaseRateSnapshotForCandidate,
  parser: candidatePayloadParser,
  addedAt: "2026-06-30T00:00:00+09:00",
};

export const kosisCpiTopicCandidate: TopicCandidate = {
  id: "topic-candidate-kosis-cpi-2026-05",
  topicLabel: "소비자물가 (KOSIS mock)",
  providerCatalogEntry: SOURCE_PROVIDER_CATALOG[1],
  rawSnapshot: mockKosisCpiSnapshotForCandidate,
  parser: kosisCandidateParser,
  addedAt: "2026-06-30T00:00:00+09:00",
};

export const fxUsdKrwTopicCandidate: TopicCandidate = {
  id: "topic-candidate-fx-usd-krw-2026-06",
  topicLabel: "원/달러 환율 (수동입력 mock)",
  providerCatalogEntry: SOURCE_PROVIDER_CATALOG[2],
  rawSnapshot: mockFxSnapshotForCandidate,
  parser: fxCandidateParser,
  addedAt: "2026-06-30T00:00:00+09:00",
};

export const MOCK_TOPIC_CANDIDATES: TopicCandidate[] = [
  ecosBaseRateTopicCandidate,
  kosisCpiTopicCandidate,
  fxUsdKrwTopicCandidate,
];

// ── Pipeline results for all 3 candidates ────────────────────────────────────

export const MOCK_TOPIC_CANDIDATE_PIPELINE_RESULTS: TopicCandidatePipelineResult[] =
  MOCK_TOPIC_CANDIDATES.map(runTopicCandidatePipeline);

// ── Provider-driven preview fixture (for SignalTranslationPreviewPanel) ────────

/**
 * A deterministic MoneyShortsScenePackage derived from ecosBaseRateTopicCandidate.
 * Used as the 4th sample in package-preview/page.tsx to prove provider-driven
 * candidates connect to the existing Signal Translation preview path.
 *
 * Never null — ecosBaseRateTopicCandidate uses a parser that always succeeds on
 * mockEcosBaseRateSnapshotForCandidate (same payload shape, validated above).
 * If the pipeline ever fails, this throws early at module load time, not at render.
 */
function buildProviderDrivenPreviewPackage(): import("./signal-translation-generator").MoneyShortsScenePackage {
  const result = generateCandidateFromSnapshot(
    ecosBaseRateTopicCandidate.parser,
    ecosBaseRateTopicCandidate.rawSnapshot,
  );
  if (!result.ok || result.factCard === null) {
    throw new Error(
      `provider-candidates: ecosBaseRateTopicCandidate pipeline failed — ${result.validation.errors.map((e) => e.code).join(", ")}`,
    );
  }
  return createMoneyShortsScenePackageFromFactCard(result.factCard);
}

export const providerCandidateGeneratedSignalTranslationPackage =
  buildProviderDrivenPreviewPackage();
