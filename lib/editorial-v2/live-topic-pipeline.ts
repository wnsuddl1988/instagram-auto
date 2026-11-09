import type { CutlineConfig } from "./editorial-cutline";
import type { SourceRegistry, TopicDomainEntry } from "./economic-source-registry";
import { getTopicDomain } from "./economic-source-registry";
import type { LiveEvidenceResult } from "./live-evidence-adapter";
import { buildEvidencePackFromLiveSources } from "./live-evidence-adapter";
import type { PromptPackage, TargetDurationSeconds } from "./contracts";
import { buildLiveTopicPrompt } from "./live-topic-prompt";
import type { LiveTopicResponseInput, ResponseVerdict } from "./live-topic-cutline-check";
import { verifyResponse } from "./live-topic-cutline-check";
import type { CandidateScore } from "./live-topic-score";
import { scoreAndRankCandidates } from "./live-topic-score";
import type { IndicatorId, OrchestratorResult } from "../source-facts/indicator-orchestrator";
import { collectIndicators } from "../source-facts/indicator-orchestrator";
import type { EcosAsyncTransport } from "../source-facts/ecos-connector";
import type { KosisAsyncTransport } from "../source-facts/kosis-connector";
import type { NaverNewsTransport } from "../source-facts/naver-news-connector";
import { collectNaverNewsForKeywords, mergeNaverNewsResults } from "../source-facts/naver-news-connector";

// ── Live topic pipeline: single entry point over L2-1..L3 ─────────────────────
//
// This module does not introduce new logic — it sequences the already-built
// and separately-verified L2/L3 modules so a caller (a CLI script) does not
// have to re-derive the wiring order:
//
//   generateTopicPrompt:  indicators + news -> evidence pack -> LLM prompt
//   verifyLlmResponse:    LLM response JSON -> hard-cut verdicts + ranked scores
//
// Network calls (ECOS, Naver) only happen inside generateTopicPrompt, and only
// when the caller supplies live transports — this module never constructs a
// live transport itself, so a script cannot accidentally call out to the
// network without the caller explicitly wiring credentials in. verifyLlmResponse
// performs no I/O at all.
//
// One draft-vs-publishable note carried over from L2-5/L2-4: fact cards
// collected here are drafts (isPublishable: false) by construction, and the
// evidence adapter will reject them accordingly (no_publishable_sources) unless
// the caller explicitly promotes them. This module does not promote anything —
// that stays a deliberate, visible decision at the call site.

export type GenerateStageFailure =
  | { readonly stage: "indicators"; readonly failed: OrchestratorResult["failed"] }
  | { readonly stage: "news"; readonly failed: readonly { keyword: string; reason: string }[] }
  | { readonly stage: "evidence"; readonly result: Extract<LiveEvidenceResult, { ok: false }> };

export type GenerateTopicPromptInput = {
  readonly projectId: string;
  readonly topicDomainId: string;
  readonly registry: SourceRegistry;
  readonly cutline: CutlineConfig;
  readonly researchCutoffDate: string;
  readonly audience: string;
  readonly targetDurationSeconds: TargetDurationSeconds;
  readonly candidateCount: number;
  readonly rawHash: string;
  readonly normalizedHash: string;
  readonly ecosTransport: EcosAsyncTransport;
  /**
   * Either a single YYYYMM string applied to every indicator (fine while all
   * indicators are monthly — base_rate, cpi_total), or a per-indicator map
   * (required once a daily indicator like fx_usd_krw, which needs YYYYMMDD, is
   * included — see collectIndicators()).
   */
  readonly ecosEndPeriod: string | Readonly<Partial<Record<IndicatorId, string>>>;
  readonly ecosIndicatorIds: readonly IndicatorId[];
  /** Required only when ecosIndicatorIds includes a KOSIS indicator (employment_rate/unemployment_rate). */
  readonly kosisTransport?: KosisAsyncTransport;
  readonly naverTransport: NaverNewsTransport;
  readonly newsDisplay?: number;
  /**
   * Explicit opt-in to promote collected fact cards to isPublishable before
   * building the evidence pack. Off by default: a draft fact card reaching
   * the prompt (and eventually a published video) unreviewed is exactly the
   * failure live-evidence-adapter.ts is built to prevent. Set true only when
   * the caller has a reason to trust these drafts (e.g. a rehearsal run).
   */
  readonly promoteFactCardsToPublishable?: boolean;
};

export type GenerateTopicPromptResult =
  | {
      readonly ok: true;
      readonly promptPackage: PromptPackage;
      readonly newsCollected: number;
      readonly newsUntiered: number;
      readonly indicatorsCollected: number;
      readonly indicatorFailures: OrchestratorResult["failed"];
      readonly newsFailures: readonly { keyword: string; reason: string }[];
      readonly evidenceSkipped: LiveEvidenceResult extends { skipped: infer S } ? S : never;
    }
  | { readonly ok: false; readonly reason: GenerateStageFailure };

function resolveTopicDomain(
  registry: SourceRegistry,
  topicDomainId: string,
): { ok: true; domain: TopicDomainEntry } | { ok: false; reason: string } {
  const domain = getTopicDomain(registry, topicDomainId);
  if (!domain) return { ok: false, reason: `unknown topicDomainId "${topicDomainId}"` };
  if (!domain.enabled) {
    return {
      ok: false,
      reason: `topicDomain "${topicDomainId}" is disabled (${domain.blockedReason ?? "no reason given"})`,
    };
  }
  return { ok: true, domain };
}

/**
 * Stage 1 of the pipeline: fetch indicators + news for a topic domain, build
 * an evidence pack, and assemble the L2-7 prompt. Fails closed at any stage —
 * no fixture fallback, no partial evidence pack silently continuing.
 */
export async function generateTopicPrompt(
  input: GenerateTopicPromptInput,
): Promise<GenerateTopicPromptResult> {
  const domainResolution = resolveTopicDomain(input.registry, input.topicDomainId);
  if (!domainResolution.ok) {
    return {
      ok: false,
      reason: { stage: "evidence", result: { ok: false, reason: "no_signals", detail: domainResolution.reason, skipped: [] } },
    };
  }
  const domain = domainResolution.domain;

  const [indicatorResult, newsResults] = await Promise.all([
    collectIndicators(input.ecosIndicatorIds, input.ecosEndPeriod, input.ecosTransport, `${input.researchCutoffDate}T00:00:00.000Z`, {
      kosisTransport: input.kosisTransport,
    }),
    collectNaverNewsForKeywords(domain.newsKeywords, input.naverTransport, input.registry, {
      display: input.newsDisplay,
    }),
  ]);

  if (indicatorResult.collected.length === 0) {
    return { ok: false, reason: { stage: "indicators", failed: indicatorResult.failed } };
  }

  // No hard failure here even if every keyword failed: buildEvidencePackFromLiveSources
  // still accepts a statistic-only pack (capped at S-05<=1 by scoring), so the
  // caller sees the total loss via newsFailures/newsCollected===0 rather than
  // this stage aborting the whole prompt generation.
  const merged = mergeNaverNewsResults(newsResults.results);

  const factCards = input.promoteFactCardsToPublishable
    ? indicatorResult.collected.map((card) => ({ ...card, isPublishable: true }))
    : indicatorResult.collected;

  const evidenceResult = buildEvidencePackFromLiveSources({
    projectId: input.projectId,
    newsItems: merged.items,
    factCards,
    cutline: input.cutline,
    researchCutoffDate: input.researchCutoffDate,
    domain: domain.label,
    audience: input.audience,
    targetDurationSeconds: input.targetDurationSeconds,
    rawHash: input.rawHash,
    normalizedHash: input.normalizedHash,
    // A live rehearsal (2026-09-16) showed Naver's body-text search returning
    // articles unrelated to the topic (a cabinet-nominee controversy, US bond
    // yields) that got attached as "corroborating" sources to every fact-card
    // signal. Filtering by the same keywords used to search keeps only news
    // whose title actually mentions the topic.
    newsRelevanceKeywords: domain.newsKeywords,
  });

  if (!evidenceResult.ok) {
    return { ok: false, reason: { stage: "evidence", result: evidenceResult } };
  }

  const promptPackage = buildLiveTopicPrompt({
    projectId: input.projectId,
    evidencePack: evidenceResult.pack,
    cutline: input.cutline,
    blockedClaims: evidenceResult.blockedClaims,
    candidateCount: input.candidateCount,
    audience: input.audience,
  });

  return {
    ok: true,
    promptPackage,
    newsCollected: merged.items.length,
    newsUntiered: merged.untieredItems.length,
    indicatorsCollected: indicatorResult.collected.length,
    indicatorFailures: indicatorResult.failed,
    newsFailures: newsResults.failed,
    evidenceSkipped: evidenceResult.skipped,
  };
}

// ── Stage 2: verify + rank an LLM response ─────────────────────────────────────

export type VerifyLlmResponseResult = {
  readonly verdict: ResponseVerdict;
  /** Scores computed for every candidate regardless of hard-cut outcome, so a
   *  caller can see why a failing candidate would have ranked if it hadn't
   *  been rejected. Ranking/publication decisions must still gate on verdict.passed. */
  readonly scores: readonly CandidateScore[];
  /** Convenience view: candidates that both passed the hard cuts and cleared
   *  the score threshold, ordered by score descending. */
  readonly recommended: readonly { readonly candidateId: string; readonly score: CandidateScore }[];
};

export function verifyLlmResponse(
  response: LiveTopicResponseInput,
  pack: Parameters<typeof verifyResponse>[1],
  cutline: CutlineConfig,
  registry: SourceRegistry,
): VerifyLlmResponseResult {
  const verdict = verifyResponse(response, pack, cutline, registry);
  const scores = scoreAndRankCandidates(response.candidates, pack, cutline, registry);

  const passedIds = new Set(verdict.verdicts.filter((v) => v.passed).map((v) => v.candidateId));
  const recommended = scores
    .filter((s) => passedIds.has(s.candidateId) && s.passesThreshold)
    .map((score) => ({ candidateId: score.candidateId, score }));

  return { verdict, scores, recommended };
}
