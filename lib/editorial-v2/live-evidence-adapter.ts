import type {
  EvidenceFreshnessClassification,
  EvidencePackDraft,
  EvidenceSourceRecord,
  ResearchWindowPreset,
  TargetDurationSeconds,
  TrendBriefImportCandidate,
  TrendBriefImportSignal,
  TrendBriefImportSource,
} from "./contracts";
import { buildEvidencePackDraft } from "./evidence-pack";
import type { CutlineConfig, EvidenceKind } from "./editorial-cutline";
import { getFreshnessWindowDays } from "./editorial-cutline";
import type { NaverNewsItem } from "../source-facts/naver-news-connector";
import type { FactCard } from "../source-facts/types";

// ── Live evidence adapter ─────────────────────────────────────────────────────
//
// Bridges lib/source-facts (news + statistics) into lib/editorial-v2's
// EvidencePackDraft. These two subsystems previously never imported each other,
// so live data had no path into the prompt layer.
//
// Reuses buildEvidencePackDraft rather than assembling a pack by hand, so id
// generation, coverage counts and warnings stay identical to the import path.

export const LIVE_EVIDENCE_SCHEMA_VERSION = "live-evidence-adapter-v1";

/** Mirrors the source record but carries the kind used to pick a freshness window. */
export type LiveEvidenceKindMap = Readonly<Record<string, EvidenceKind>>;

export type SkippedSource = {
  readonly kind: EvidenceKind;
  readonly label: string;
  readonly reason:
    | "mock_data"
    | "not_publishable"
    | "no_citations"
    | "missing_published_date"
    | "untiered_publisher"
    | "missing_publisher"
    | "duplicate_url"
    | "title_not_relevant";
};

export type AdapterRejectReason =
  | "no_publishable_sources"
  | "no_signals"
  | "invalid_cutoff_date";

export type LiveEvidenceInput = {
  readonly projectId: string;
  readonly newsItems: readonly NaverNewsItem[];
  readonly factCards: readonly FactCard[];
  readonly cutline: CutlineConfig;
  /** YYYY-MM-DD. Anchors every freshness window. */
  readonly researchCutoffDate: string;
  readonly domain: string;
  readonly audience: string;
  readonly targetDurationSeconds: TargetDurationSeconds;
  readonly rawHash: string;
  readonly normalizedHash: string;
  /**
   * Opt-in only. Mock fact cards are otherwise dropped, because a mock figure
   * reaching a published video is the worst failure this pipeline can produce.
   */
  readonly allowMock?: boolean;
  /**
   * Title relevance filter. A live pipeline run surfaced the problem this
   * guards against: Naver's news search matches on body text, not just the
   * title, so a keyword like "대출금리" can return an unrelated politics or
   * bond-market article that merely mentions rates in passing. Without a
   * filter, every collected news item gets attached as a "corroborating"
   * source to every fact-card signal (see buildSignals) — a 47-article batch
   * where only ~5 were actually about the topic all became "evidence" for a
   * base-rate claim.
   *
   * When supplied, a news item is kept only if its title contains at least
   * one of these keywords (substring match, matching the same registry
   * keywords the caller used to search). When omitted, no title filtering is
   * applied — existing callers (tests, the L2-7 rehearsals) keep working
   * unchanged.
   */
  readonly newsRelevanceKeywords?: readonly string[];
};

export type LiveEvidenceResult =
  | {
      readonly ok: true;
      readonly pack: EvidencePackDraft;
      readonly kindMap: LiveEvidenceKindMap;
      readonly skipped: readonly SkippedSource[];
      readonly blockedClaims: readonly string[];
      readonly containsMockData: boolean;
    }
  | {
      readonly ok: false;
      readonly reason: AdapterRejectReason;
      readonly detail: string;
      readonly skipped: readonly SkippedSource[];
    };

// ── Source conversion ─────────────────────────────────────────────────────────

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function toIsoInstant(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const candidate = ISO_DATE.test(trimmed) ? `${trimmed}T00:00:00.000Z` : trimmed;
  const parsed = Date.parse(candidate);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function sanitizeIdPart(value: string, fallback: string): string {
  const cleaned = value.replace(/[^A-Za-z0-9가-힣]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned === "" ? fallback : cleaned.slice(0, 40);
}

type ConvertedSource = {
  readonly source: TrendBriefImportSource;
  readonly kind: EvidenceKind;
  /** Set for statistics so signals can be tied back to their fact card. */
  readonly factCard?: FactCard;
};

function convertNewsItems(
  items: readonly NaverNewsItem[],
  skipped: SkippedSource[],
  seenUrls: Set<string>,
  relevanceKeywords: readonly string[] | undefined,
): ConvertedSource[] {
  const converted: ConvertedSource[] = [];
  items.forEach((item, index) => {
    // T3 is a topic hint, never evidence — the connector already separates it,
    // but a caller could hand us a mixed list.
    if (item.publisherTier === "T3") {
      skipped.push({ kind: "news", label: item.title, reason: "untiered_publisher" });
      return;
    }
    if (!item.publisherName) {
      skipped.push({ kind: "news", label: item.title, reason: "missing_publisher" });
      return;
    }
    if (
      relevanceKeywords !== undefined &&
      relevanceKeywords.length > 0 &&
      !relevanceKeywords.some((keyword) => item.title.includes(keyword))
    ) {
      skipped.push({ kind: "news", label: item.title, reason: "title_not_relevant" });
      return;
    }
    const publishedAt = toIsoInstant(item.publishedAt);
    if (!publishedAt) {
      skipped.push({ kind: "news", label: item.title, reason: "missing_published_date" });
      return;
    }
    if (seenUrls.has(item.canonicalUrl)) {
      skipped.push({ kind: "news", label: item.title, reason: "duplicate_url" });
      return;
    }
    seenUrls.add(item.canonicalUrl);

    converted.push({
      kind: "news",
      source: {
        sourceId: `news-${index + 1}-${sanitizeIdPart(item.publisherName, "src")}`,
        publisher: item.publisherName,
        title: item.title,
        url: item.originallink.trim() || item.link,
        publishedAt,
        eventDate: null,
        // Naver's search API description (article lead/snippet). Lets narration
        // cite a number that appears only in the article body, not the title —
        // still traceable to real text, not an invented figure (see
        // TrendBriefImportSource.description).
        ...(item.description.trim() !== "" && { description: item.description.trim() }),
      },
    });
  });
  return converted;
}

function convertFactCards(
  cards: readonly FactCard[],
  allowMock: boolean,
  skipped: SkippedSource[],
  seenUrls: Set<string>,
): ConvertedSource[] {
  const converted: ConvertedSource[] = [];
  cards.forEach((card, index) => {
    if (card.isMock && !allowMock) {
      skipped.push({ kind: "statistic", label: card.indicatorName, reason: "mock_data" });
      return;
    }
    if (!card.isPublishable) {
      skipped.push({
        kind: "statistic",
        label: card.indicatorName,
        reason: "not_publishable",
      });
      return;
    }
    if (card.citations.length === 0) {
      skipped.push({
        kind: "statistic",
        label: card.indicatorName,
        reason: "no_citations",
      });
      return;
    }
    const publishedAt = toIsoInstant(card.publishedDate);
    if (!publishedAt) {
      skipped.push({
        kind: "statistic",
        label: card.indicatorName,
        reason: "missing_published_date",
      });
      return;
    }
    const url = card.sourceUrl.trim() || card.citations[0].sourceUrl.trim();
    if (seenUrls.has(url)) {
      skipped.push({
        kind: "statistic",
        label: card.indicatorName,
        reason: "duplicate_url",
      });
      return;
    }
    seenUrls.add(url);

    converted.push({
      kind: "statistic",
      factCard: card,
      source: {
        sourceId: `stat-${index + 1}-${sanitizeIdPart(card.indicatorName, "ind")}`,
        publisher: card.sourceName,
        title: `${card.indicatorName} (${card.dataPeriod})`,
        url,
        publishedAt,
        eventDate: null,
      },
    });
  });
  return converted;
}

// ── Signal construction ───────────────────────────────────────────────────────

/**
 * One signal per fact card, carrying its numeric values plus every news source
 * as corroboration. Fact cards without any numeric value still produce a
 * signal — the pack records a coverage warning rather than dropping the
 * statistic.
 *
 * Emits current/previous/change as separate number records (when present)
 * rather than only the current value. An L2-8 rehearsal showed the LLM
 * correctly flagging HC-08 as unresolved when asked to state a comparison
 * ("2.75%에서 3.00%로") whose "2.75%" existed only inside the free-text claim,
 * not as a citable numbers[] entry — narration citing it had nothing to point
 * at. Comparison narration is exactly what the cutline's scene structure asks
 * for (twist: "통념과 실제의 차이"), so the previous/change values need their
 * own number records too.
 */
function buildSignals(
  statSources: readonly ConvertedSource[],
  newsSourceIds: readonly string[],
): TrendBriefImportSignal[] {
  return statSources.flatMap((entry, index) => {
    const card = entry.factCard;
    if (!card) return [];

    const numberEntries: { label: string; value: number }[] = [];
    if (typeof card.currentNumericValue === "number") {
      numberEntries.push({ label: "current", value: card.currentNumericValue });
    }
    if (typeof card.previousNumericValue === "number") {
      numberEntries.push({ label: "previous", value: card.previousNumericValue });
    }
    if (typeof card.changeNumericValue === "number") {
      numberEntries.push({ label: "change", value: card.changeNumericValue });
    }

    const numbers = numberEntries.map(({ label, value }) => ({
      value,
      unit: card.unit,
      currency: null,
      asOf: card.dataPeriod,
      context: `${card.interpretation} (${label})`,
    }));

    return [
      {
        signalId: `signal-${index + 1}-${sanitizeIdPart(card.id, "stat")}`,
        headline: card.indicatorName,
        claim: card.interpretation,
        whyNow: card.cautionNote,
        audienceImpact: card.allowedClaims.join(" / "),
        sourceRefs: [entry.source.sourceId, ...newsSourceIds],
        numbers,
      },
    ];
  });
}

// ── Freshness re-classification ───────────────────────────────────────────────

const DAY_MS = 86_400_000;

/**
 * buildEvidencePackDraft applies one window (24h/7d/30d) to every source, which
 * would mark monthly statistics stale and block their claims. The cutline wants
 * per-kind windows, so freshness is recomputed here after the pack is built.
 */
function reclassifyFreshness(
  sources: readonly EvidenceSourceRecord[],
  kindMap: LiveEvidenceKindMap,
  cutline: CutlineConfig,
  cutoffDate: string,
): EvidenceSourceRecord[] {
  const cutoffStart = Date.parse(`${cutoffDate}T00:00:00.000Z`);
  const cutoffEnd = cutoffStart + DAY_MS - 1;

  return sources.map((source) => {
    const kind = kindMap[source.sourceId] ?? "news";
    const windowDays = getFreshnessWindowDays(cutline, kind);
    const published = Date.parse(source.publishedAt);

    let freshness: EvidenceFreshnessClassification;
    if (!Number.isFinite(published) || !Number.isFinite(cutoffStart)) {
      freshness = "unknown";
    } else if (windowDays === null) {
      // background: not subject to freshness, and never counts as fresh on its own.
      freshness = "unknown";
    } else {
      const start = cutoffStart - (windowDays - 1) * DAY_MS;
      freshness = published >= start && published <= cutoffEnd ? "fresh" : "stale";
    }
    return { ...source, freshness };
  });
}

function recomputeCoverage(
  pack: EvidencePackDraft,
  sources: readonly EvidenceSourceRecord[],
): EvidencePackDraft["coverage"] {
  const freshIds = new Set(
    sources.filter((source) => source.freshness === "fresh").map((s) => s.sourceId),
  );
  const signalCoverage = pack.coverage.signalCoverage.map((entry) => {
    const claim = pack.claims.find((c) => c.signalId === entry.signalId);
    const freshSourceCount = claim
      ? claim.sourceRefs.filter((ref) => freshIds.has(ref)).length
      : 0;
    return { ...entry, freshSourceCount };
  });
  return {
    ...pack.coverage,
    freshSourceCount: freshIds.size,
    signalCoverage,
  };
}

// ── Entry point ───────────────────────────────────────────────────────────────

export function buildEvidencePackFromLiveSources(
  input: LiveEvidenceInput,
): LiveEvidenceResult {
  const skipped: SkippedSource[] = [];

  if (!ISO_DATE.test(input.researchCutoffDate)) {
    return {
      ok: false,
      reason: "invalid_cutoff_date",
      detail: `researchCutoffDate must be YYYY-MM-DD, got "${input.researchCutoffDate}"`,
      skipped,
    };
  }

  const seenUrls = new Set<string>();
  const newsSources = convertNewsItems(
    input.newsItems,
    skipped,
    seenUrls,
    input.newsRelevanceKeywords,
  );
  const statSources = convertFactCards(
    input.factCards,
    input.allowMock === true,
    skipped,
    seenUrls,
  );

  const allSources = [...statSources, ...newsSources];
  if (allSources.length === 0) {
    return {
      ok: false,
      reason: "no_publishable_sources",
      detail: "every source was skipped before pack assembly",
      skipped,
    };
  }

  const signals = buildSignals(
    statSources,
    newsSources.map((entry) => entry.source.sourceId),
  );
  if (signals.length === 0) {
    return {
      ok: false,
      reason: "no_signals",
      detail: "no publishable fact card produced a signal",
      skipped,
    };
  }

  const kindMap: Record<string, EvidenceKind> = {};
  for (const entry of allSources) kindMap[entry.source.sourceId] = entry.kind;

  const candidate: TrendBriefImportCandidate = {
    schemaVersion: LIVE_EVIDENCE_SCHEMA_VERSION,
    researchCutoffDate: input.researchCutoffDate,
    // Widest preset available; per-kind windows are applied in reclassifyFreshness.
    researchWindow: "30d" as ResearchWindowPreset,
    domain: input.domain,
    audience: input.audience,
    targetDurationSeconds: input.targetDurationSeconds,
    briefTitle: `${input.domain} 실시간 근거 묶음`,
    executiveSummary: `뉴스 ${newsSources.length}건, 통계 ${statSources.length}건으로 구성된 라이브 근거 묶음.`,
    sources: allSources.map((entry) => entry.source),
    signals,
  };

  const basePack = buildEvidencePackDraft({
    candidate,
    rawHash: input.rawHash,
    normalizedHash: input.normalizedHash,
    expectedInput: {
      projectId: input.projectId,
      researchCutoffDate: input.researchCutoffDate,
      researchWindow: "30d" as ResearchWindowPreset,
      domain: input.domain,
      audience: input.audience,
      targetDurationSeconds: input.targetDurationSeconds,
    },
    validationSummary: {
      valid: true,
      issues: [],
      validatedAt: input.researchCutoffDate,
      blockingIssueCount: 0,
      warningCount: 0,
    },
    approvalState: "approved",
  });

  const sources = reclassifyFreshness(
    basePack.sources,
    kindMap,
    input.cutline,
    input.researchCutoffDate,
  );
  const pack: EvidencePackDraft = {
    ...basePack,
    sources,
    coverage: recomputeCoverage(basePack, sources),
  };

  const usedCards = statSources
    .map((entry) => entry.factCard)
    .filter((card): card is FactCard => card !== undefined);
  const blockedClaims = [...new Set(usedCards.flatMap((card) => card.blockedClaims))];
  const containsMockData = usedCards.some((card) => card.isMock);

  return { ok: true, pack, kindMap, skipped, blockedClaims, containsMockData };
}
