import type { EcosStatRow, EcosStatSearchRequest } from "./ecos-connector";
import type { ManualFactCardAuthoringResult } from "./manual";
import { ECOS_BASE_RATE_SOURCE_NAME, ECOS_BASE_RATE_SOURCE_PAGE_URL } from "./ecos-latest-period";
import { resolveLatestEcosBaseRatePeriod } from "./ecos-latest-period";
import { normalizeEcosBaseRateRows } from "./ecos-normalizer";
import { generateCandidateFromSnapshot } from "./raw-snapshot-parser";
import { resolveEcosBaseRateSourceDate, BOK_BASE_RATE_DECISIONS } from "./ecos-source-date";
import { ecosBaseRateLiveParser, ECOS_LIVE_PROVIDER_ID } from "./candidates";
import type { BokBaseRateDecision } from "./ecos-source-date";

// ── Latest live ECOS base-rate draft candidate ─────────────────────────────────
//
// Connects the three previously built resolvers into one deterministic path:
//
//   live ECOS rows
//     -> resolveLatestEcosBaseRatePeriod()    (select latest + previous row)
//     -> resolveEcosBaseRateSourceDate()      (verify BOK decision date by value match)
//     -> normalizeEcosBaseRateRows()          (build RawDataSnapshot, provider-ecos-live)
//     -> generateCandidateFromSnapshot()      (parse + validate Fact Card draft)
//
// Source-first guarantees enforced throughout:
// - publishedDate is never derived from the ECOS period (e.g. 202605 ≠ "2026-05-??").
//   It is always the official BOK decision date tied to the current rate value.
// - If source-date cannot be verified, the path returns a blocked result — no candidate.
// - The resulting candidate is draft-only: isMock=false, isPublishable=false.
// - No module-level live network call: this file is deterministic and network-free.
//   Live transport calls happen in the caller (script or API route).

// ── Result types ───────────────────────────────────────────────────────────────

export type EcosLatestDraftCandidateStatus =
  | "blocked_insufficient_rows"
  | "blocked_source_date_unresolved"
  | "blocked_normalize_failed"
  | "blocked_candidate_validation_failed"
  | "draft_ready";

export interface EcosLatestDraftCandidateResult {
  readonly status: EcosLatestDraftCandidateStatus;
  readonly reason: string;
  /** Resolved latest ECOS period (YYYYMM) — present when rows were sufficient. */
  readonly latestPeriod: string | null;
  /** Resolved previous ECOS period (YYYYMM) — present when rows were sufficient. */
  readonly previousPeriod: string | null;
  /** Verified BOK decision date (ISO YYYY-MM-DD) — present when source date resolved. */
  readonly verifiedPublishedDate: string | null;
  /**
   * Full authoring result from generateCandidateFromSnapshot().
   * Present only when status is draft_ready.
   */
  readonly candidateResult: (ManualFactCardAuthoringResult & { parserName: string; snapshotId: string }) | null;
  /** Always false — publishable decision is downstream. */
  readonly publishable: false;
}

// ── Core path ─────────────────────────────────────────────────────────────────

/**
 * Builds a draft Fact Card candidate from a set of current-first ECOS base-rate rows
 * and a verified BOK source-date table.
 *
 * Parameters:
 * - `rows`: ECOS rows already ordered current-first (as returned by EcosLiveTransport).
 * - `fetchedAt`: ISO timestamp of when the rows were fetched (caller-supplied, no Date.now).
 * - `decisions`: BOK decision history to verify the source date (defaults to the official table).
 *
 * Blocked paths:
 * - Fewer than 2 rows → blocked_insufficient_rows
 * - Source date cannot be matched to most-recent official decision → blocked_source_date_unresolved
 * - Normalizer refuses (e.g. internal parse failure) → blocked_normalize_failed
 */
export function buildEcosLatestDraftCandidate(
  rows: readonly EcosStatRow[],
  fetchedAt: string,
  decisions: readonly BokBaseRateDecision[] = BOK_BASE_RATE_DECISIONS,
): EcosLatestDraftCandidateResult {
  // Step 1: select latest + nearest previous row.
  const periodResolution = resolveLatestEcosBaseRatePeriod(rows);
  if (!periodResolution.ok) {
    return {
      status: "blocked_insufficient_rows",
      reason: `최신 period 판정에 필요한 row가 부족합니다 (rows=${periodResolution.rowCount}). Jan2025 fixture로 fallback하지 않습니다.`,
      latestPeriod: null,
      previousPeriod: null,
      verifiedPublishedDate: null,
      candidateResult: null,
      publishable: false,
    };
  }

  // Step 2: verify the BOK source date by value matching.
  // The published date is the official BOK decision date for the current value,
  // NOT the ECOS period.
  const sourceDateResolution = resolveEcosBaseRateSourceDate(
    periodResolution.latestRow,
    decisions,
  );
  if (!sourceDateResolution.ok) {
    return {
      status: "blocked_source_date_unresolved",
      reason: `최신 ECOS 값에 대한 공식 BOK 발표일을 검증할 수 없습니다 (code=${sourceDateResolution.code}). 날짜를 발명하지 않고 차단합니다.`,
      latestPeriod: periodResolution.latestPeriod,
      previousPeriod: periodResolution.previousPeriod,
      verifiedPublishedDate: null,
      candidateResult: null,
      publishable: false,
    };
  }

  // Step 3: normalize into a RawDataSnapshot.
  // provider-ecos-live distinguishes this from the mock scaffold.
  // publishedDate = official BOK decision date (never derived from ECOS period).
  const draftRequest: EcosStatSearchRequest = {
    statCode: periodResolution.latestRow.STAT_CODE,
    cycle: "M",
    startDate: periodResolution.previousPeriod,
    endDate: periodResolution.latestPeriod,
    itemCode1: periodResolution.latestRow.ITEM_CODE1,
    description: `한국은행 기준금리 latest live draft (${periodResolution.previousPeriod}~${periodResolution.latestPeriod})`,
    publishedDate: sourceDateResolution.verifiedPublishedDate,
    sourcePageUrl: ECOS_BASE_RATE_SOURCE_PAGE_URL,
    sourceName: ECOS_BASE_RATE_SOURCE_NAME,
    sourceProviderId: ECOS_LIVE_PROVIDER_ID,
    // Source-date provenance: forwarded from the resolver so the normalizer can
    // preserve it in rawPayload. Proves publishedDate = official BOK decision date.
    sourceDateSourceName: sourceDateResolution.sourceName,
    sourceDateSourceUrl: sourceDateResolution.sourceUrl,
    sourceDateMatchedValue: sourceDateResolution.matchedValue,
  };

  const snapshot = normalizeEcosBaseRateRows(
    [periodResolution.latestRow, periodResolution.previousRow],
    fetchedAt,
    draftRequest,
  );

  if (snapshot === null) {
    return {
      status: "blocked_normalize_failed",
      reason: `검증된 publishedDate(${sourceDateResolution.verifiedPublishedDate})가 있었지만 정규화에 실패했습니다 (DATA_VALUE 파싱 불가 등).`,
      latestPeriod: periodResolution.latestPeriod,
      previousPeriod: periodResolution.previousPeriod,
      verifiedPublishedDate: sourceDateResolution.verifiedPublishedDate,
      candidateResult: null,
      publishable: false,
    };
  }

  // Step 4: parse + validate into a draft Fact Card candidate.
  const candidateResult = generateCandidateFromSnapshot(ecosBaseRateLiveParser, snapshot);

  // Validation guard: draft_ready requires a non-null factCard and ok=true.
  // Any parser rejection or FactCard validation failure blocks the candidate.
  if (!candidateResult.ok || candidateResult.factCard === null) {
    const firstError = candidateResult.validation.errors[0];
    const errorSummary = firstError
      ? `field=${firstError.field} code=${firstError.code}`
      : "unknown validation error";
    return {
      status: "blocked_candidate_validation_failed",
      reason: `generateCandidateFromSnapshot 검증 실패 — draft_ready를 반환하지 않습니다 (${errorSummary}). candidateResult를 검토하세요.`,
      latestPeriod: periodResolution.latestPeriod,
      previousPeriod: periodResolution.previousPeriod,
      verifiedPublishedDate: sourceDateResolution.verifiedPublishedDate,
      candidateResult,
      publishable: false,
    };
  }

  return {
    status: "draft_ready",
    reason: `최신 period(${periodResolution.latestPeriod}) draft Fact Card candidate 생성 완료. publishable 여부는 downstream에서 결정합니다.`,
    latestPeriod: periodResolution.latestPeriod,
    previousPeriod: periodResolution.previousPeriod,
    verifiedPublishedDate: sourceDateResolution.verifiedPublishedDate,
    candidateResult,
    publishable: false,
  };
}
