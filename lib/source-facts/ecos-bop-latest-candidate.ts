import type { EcosStatRow, EcosStatSearchRequest } from "./ecos-connector";
import type { ManualFactCardAuthoringResult } from "./manual";
import {
  ECOS_BOP_SOURCE_NAME,
  ECOS_BOP_SOURCE_PAGE_URL,
  ECOS_TRADE_BALANCE_SOURCE_NAME,
  ECOS_TRADE_BALANCE_SOURCE_PAGE_URL,
  resolveLatestEcosBopPeriod,
} from "./ecos-bop-latest-period";
import { normalizeEcosGenericRows } from "./ecos-generic-normalizer";
import { generateCandidateFromSnapshot } from "./raw-snapshot-parser";
import { resolveEcosBopSourceDate, BOK_BOP_ANNOUNCEMENTS } from "./ecos-bop-source-date";
import type { BokBopAnnouncement } from "./ecos-bop-source-date";
import { ECOS_LIVE_PROVIDER_ID } from "./candidates";
import { ecosGenericLiveParser } from "./ecos-generic-live-parser";

// ── Latest live ECOS 경상수지 draft candidate — mirrors ecos-cpi-latest-candidate.ts ──

export type EcosBopLatestDraftCandidateStatus =
  | "blocked_insufficient_rows"
  | "blocked_source_date_unresolved"
  | "blocked_normalize_failed"
  | "blocked_candidate_validation_failed"
  | "draft_ready";

export interface EcosBopLatestDraftCandidateResult {
  readonly status: EcosBopLatestDraftCandidateStatus;
  readonly reason: string;
  readonly latestPeriod: string | null;
  readonly previousPeriod: string | null;
  readonly verifiedPublishedDate: string | null;
  readonly candidateResult: (ManualFactCardAuthoringResult & { parserName: string; snapshotId: string }) | null;
  readonly publishable: false;
}

export function buildEcosBopLatestDraftCandidate(
  rows: readonly EcosStatRow[],
  fetchedAt: string,
  announcements: readonly BokBopAnnouncement[] = BOK_BOP_ANNOUNCEMENTS,
  sourceName: string = ECOS_BOP_SOURCE_NAME,
  sourcePageUrl: string = ECOS_BOP_SOURCE_PAGE_URL,
): EcosBopLatestDraftCandidateResult {
  const periodResolution = resolveLatestEcosBopPeriod(rows);
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

  const sourceDateResolution = resolveEcosBopSourceDate(periodResolution.latestRow, announcements);
  if (!sourceDateResolution.ok) {
    return {
      status: "blocked_source_date_unresolved",
      reason: `최신 ECOS ${sourceName} 값(${periodResolution.latestPeriod})에 대한 공식 발표일을 검증할 수 없습니다 (code=${sourceDateResolution.code}).`,
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
    description: `${sourceName} latest live draft (${periodResolution.previousPeriod}~${periodResolution.latestPeriod})`,
    publishedDate: sourceDateResolution.verifiedPublishedDate,
    sourcePageUrl,
    sourceName,
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

/** 상품수지(무역수지) 전용 — 같은 보도자료의 다른 item이므로 발표일 이력을 그대로 재사용. */
export function buildEcosTradeBalanceLatestDraftCandidate(
  rows: readonly EcosStatRow[],
  fetchedAt: string,
): EcosBopLatestDraftCandidateResult {
  return buildEcosBopLatestDraftCandidate(
    rows, fetchedAt, BOK_BOP_ANNOUNCEMENTS, ECOS_TRADE_BALANCE_SOURCE_NAME, ECOS_TRADE_BALANCE_SOURCE_PAGE_URL,
  );
}
