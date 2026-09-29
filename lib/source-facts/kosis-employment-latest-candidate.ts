import type { KosisStatRow, KosisStatSearchRequest } from "./kosis-connector";
import type { ManualFactCardAuthoringResult } from "./manual";
import {
  KOSIS_EMPLOYMENT_OBJ_L1,
  KOSIS_EMPLOYMENT_SOURCE_PAGE_URL,
  resolveLatestKosisEmploymentPeriod,
} from "./kosis-employment-latest-period";
import { normalizeKosisGenericRows } from "./kosis-generic-normalizer";
import { generateCandidateFromSnapshot } from "./raw-snapshot-parser";
import {
  resolveKosisEmploymentSourceDate,
  KOSTAT_EMPLOYMENT_ANNOUNCEMENTS,
} from "./kosis-employment-source-date";
import type { KostatEmploymentAnnouncement } from "./kosis-employment-source-date";
import { ECOS_LIVE_PROVIDER_ID } from "./candidates";
import { ecosGenericLiveParser } from "./ecos-generic-live-parser";

// ── Latest live KOSIS 고용률/실업률 draft candidate ─────────────────────────────
// ecos-cpi-latest-candidate.ts와 같은 패턴. ecosGenericLiveParser를 그대로
// 재사용한다 — KOSIS normalizer가 만드는 payload 형태(statCode/indicatorName/
// unit 등)가 ECOS generic payload와 구조적으로 동일하기 때문이다.

export type KosisEmploymentLatestDraftCandidateStatus =
  | "blocked_insufficient_rows"
  | "blocked_source_date_unresolved"
  | "blocked_normalize_failed"
  | "blocked_candidate_validation_failed"
  | "draft_ready";

export interface KosisEmploymentLatestDraftCandidateResult {
  readonly status: KosisEmploymentLatestDraftCandidateStatus;
  readonly reason: string;
  readonly latestPeriod: string | null;
  readonly previousPeriod: string | null;
  readonly verifiedPublishedDate: string | null;
  readonly candidateResult: (ManualFactCardAuthoringResult & { parserName: string; snapshotId: string }) | null;
  readonly publishable: false;
}

export function buildKosisEmploymentLatestDraftCandidate(
  rows: readonly KosisStatRow[],
  fetchedAt: string,
  announcements: readonly KostatEmploymentAnnouncement[] = KOSTAT_EMPLOYMENT_ANNOUNCEMENTS,
  sourceName: string = "국가데이터처/KOSIS — 고용률",
  sourcePageUrl: string = KOSIS_EMPLOYMENT_SOURCE_PAGE_URL,
): KosisEmploymentLatestDraftCandidateResult {
  const periodResolution = resolveLatestKosisEmploymentPeriod(rows);
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

  const sourceDateResolution = resolveKosisEmploymentSourceDate(periodResolution.latestRow, announcements);
  if (!sourceDateResolution.ok) {
    return {
      status: "blocked_source_date_unresolved",
      reason: `최신 KOSIS ${sourceName} 값(${periodResolution.latestPeriod})에 대한 공식 발표일을 검증할 수 없습니다 (code=${sourceDateResolution.code}).`,
      latestPeriod: periodResolution.latestPeriod,
      previousPeriod: periodResolution.previousPeriod,
      verifiedPublishedDate: null,
      candidateResult: null,
      publishable: false,
    };
  }

  const draftRequest: KosisStatSearchRequest = {
    orgId: periodResolution.latestRow.ORG_ID,
    tblId: periodResolution.latestRow.TBL_ID,
    itmId: periodResolution.latestRow.ITM_ID,
    objL1: KOSIS_EMPLOYMENT_OBJ_L1,
    prdSe: "M",
    startPrdDe: periodResolution.previousPeriod,
    endPrdDe: periodResolution.latestPeriod,
    description: `${sourceName} latest live draft (${periodResolution.previousPeriod}~${periodResolution.latestPeriod})`,
    publishedDate: sourceDateResolution.verifiedPublishedDate,
    sourcePageUrl,
    sourceName,
    sourceProviderId: ECOS_LIVE_PROVIDER_ID,
    sourceDateSourceName: sourceDateResolution.sourceName,
    sourceDateSourceUrl: sourceDateResolution.sourceUrl,
  };

  const snapshot = normalizeKosisGenericRows(
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

export const KOSIS_UNEMPLOYMENT_SOURCE_PAGE_URL =
  "https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_1DA7004S&item=T80";

/** 실업률 전용 — 같은 통계표 다른 item이므로 sourcePageUrl을 구분해야 evidence
 * adapter의 URL 중복 제거에서 고용률과 함께 유실되지 않는다(경상수지/무역수지
 * 사례에서 실측된 버그와 동일 원인 — ecos-bop-latest-period.ts 참고). */
export function buildKosisUnemploymentLatestDraftCandidate(
  rows: readonly KosisStatRow[],
  fetchedAt: string,
): KosisEmploymentLatestDraftCandidateResult {
  return buildKosisEmploymentLatestDraftCandidate(
    rows, fetchedAt, KOSTAT_EMPLOYMENT_ANNOUNCEMENTS, "국가데이터처/KOSIS — 실업률", KOSIS_UNEMPLOYMENT_SOURCE_PAGE_URL,
  );
}
