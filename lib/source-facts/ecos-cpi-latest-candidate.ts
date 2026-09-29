import type { EcosStatRow, EcosStatSearchRequest } from "./ecos-connector";
import type { ManualFactCardAuthoringResult } from "./manual";
import { ECOS_CPI_SOURCE_NAME, ECOS_CPI_SOURCE_PAGE_URL, resolveLatestEcosCpiPeriod } from "./ecos-cpi-latest-period";
import { normalizeEcosGenericRows } from "./ecos-generic-normalizer";
import { generateCandidateFromSnapshot } from "./raw-snapshot-parser";
import { resolveEcosCpiSourceDate, KOSTAT_CPI_ANNOUNCEMENTS } from "./ecos-cpi-source-date";
import type { KostatCpiAnnouncement } from "./ecos-cpi-source-date";
import { ECOS_LIVE_PROVIDER_ID } from "./candidates";
import { ecosGenericLiveParser } from "./ecos-generic-live-parser";

// ── Latest live ECOS CPI draft candidate ────────────────────────────────────────
//
// Mirrors ecos-latest-candidate.ts (base rate) for the CPI total index. Reuses
// normalizeEcosBaseRateRows() unchanged (indicator-agnostic normalizer) but
// uses ecosGenericLiveParser — NOT ecosBaseRateLiveParser — because the latter
// hardcodes "기준금리를 ... 조정했다" phrasing that is wrong for an index level
// like CPI. Only the period resolver and source-date resolver are CPI-specific.

export type EcosCpiLatestDraftCandidateStatus =
  | "blocked_insufficient_rows"
  | "blocked_source_date_unresolved"
  | "blocked_normalize_failed"
  | "blocked_candidate_validation_failed"
  | "draft_ready";

export interface EcosCpiLatestDraftCandidateResult {
  readonly status: EcosCpiLatestDraftCandidateStatus;
  readonly reason: string;
  readonly latestPeriod: string | null;
  readonly previousPeriod: string | null;
  readonly verifiedPublishedDate: string | null;
  readonly candidateResult: (ManualFactCardAuthoringResult & { parserName: string; snapshotId: string }) | null;
  readonly publishable: false;
}

export function buildEcosCpiLatestDraftCandidate(
  rows: readonly EcosStatRow[],
  fetchedAt: string,
  announcements: readonly KostatCpiAnnouncement[] = KOSTAT_CPI_ANNOUNCEMENTS,
): EcosCpiLatestDraftCandidateResult {
  const periodResolution = resolveLatestEcosCpiPeriod(rows);
  if (!periodResolution.ok) {
    return {
      status: "blocked_insufficient_rows",
      reason: `최신 period 판정에 필요한 row가 부족합니다 (rows=${periodResolution.rowCount}).`,
      latestPeriod: null,
      previousPeriod: null,
      verifiedPublishedDate: null,
      candidateResult: null,
      publishable: false,
    };
  }

  const sourceDateResolution = resolveEcosCpiSourceDate(periodResolution.latestRow, announcements);
  if (!sourceDateResolution.ok) {
    return {
      status: "blocked_source_date_unresolved",
      reason: `최신 ECOS CPI 값(${periodResolution.latestPeriod})에 대한 공식 국가데이터처 발표일을 검증할 수 없습니다 (code=${sourceDateResolution.code}). 날짜를 발명하지 않고 차단합니다.`,
      latestPeriod: periodResolution.latestPeriod,
      previousPeriod: periodResolution.previousPeriod,
      verifiedPublishedDate: null,
      candidateResult: null,
      publishable: false,
    };
  }

  const draftRequest: EcosStatSearchRequest = {
    statCode: periodResolution.latestRow.STAT_CODE,
    cycle: "M",
    startDate: periodResolution.previousPeriod,
    endDate: periodResolution.latestPeriod,
    itemCode1: periodResolution.latestRow.ITEM_CODE1,
    description: `소비자물가지수(총지수) latest live draft (${periodResolution.previousPeriod}~${periodResolution.latestPeriod})`,
    publishedDate: sourceDateResolution.verifiedPublishedDate,
    sourcePageUrl: ECOS_CPI_SOURCE_PAGE_URL,
    sourceName: ECOS_CPI_SOURCE_NAME,
    sourceProviderId: ECOS_LIVE_PROVIDER_ID,
    sourceDateSourceName: sourceDateResolution.sourceName,
    sourceDateSourceUrl: sourceDateResolution.sourceUrl,
  };

  const snapshot = normalizeEcosGenericRows(
    [periodResolution.latestRow, periodResolution.previousRow],
    fetchedAt,
    draftRequest,
  );

  if (snapshot === null) {
    return {
      status: "blocked_normalize_failed",
      reason: `검증된 publishedDate(${sourceDateResolution.verifiedPublishedDate})가 있었지만 정규화에 실패했습니다.`,
      latestPeriod: periodResolution.latestPeriod,
      previousPeriod: periodResolution.previousPeriod,
      verifiedPublishedDate: sourceDateResolution.verifiedPublishedDate,
      candidateResult: null,
      publishable: false,
    };
  }

  const candidateResult = generateCandidateFromSnapshot(ecosGenericLiveParser, snapshot);

  if (!candidateResult.ok || candidateResult.factCard === null) {
    const firstError = candidateResult.validation.errors[0];
    const errorSummary = firstError ? `field=${firstError.field} code=${firstError.code}` : "unknown validation error";
    return {
      status: "blocked_candidate_validation_failed",
      reason: `generateCandidateFromSnapshot 검증 실패 (${errorSummary}).`,
      latestPeriod: periodResolution.latestPeriod,
      previousPeriod: periodResolution.previousPeriod,
      verifiedPublishedDate: sourceDateResolution.verifiedPublishedDate,
      candidateResult,
      publishable: false,
    };
  }

  return {
    status: "draft_ready",
    reason: `최신 period(${periodResolution.latestPeriod}) draft Fact Card candidate 생성 완료.`,
    latestPeriod: periodResolution.latestPeriod,
    previousPeriod: periodResolution.previousPeriod,
    verifiedPublishedDate: sourceDateResolution.verifiedPublishedDate,
    candidateResult,
    publishable: false,
  };
}
