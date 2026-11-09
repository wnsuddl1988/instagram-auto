import type {
  EvidencePackDraft,
  TopicCandidate,
  TopicEvaluationMetric,
  TopicEvaluationMetricName,
  TopicEvaluationResult,
} from "./contracts";

const WEIGHTS: Readonly<Record<TopicEvaluationMetricName, number>> = {
  watch_reason: 18,
  freshness: 15,
  evidence: 15,
  specificity: 12,
  visual_proof: 10,
  audience_relevance: 12,
  retention_potential: 10,
  financial_safety: 8,
};

const LABELS: Readonly<Record<TopicEvaluationMetricName, string>> = {
  watch_reason: "Watch Reason",
  freshness: "Freshness",
  evidence: "Evidence",
  specificity: "Specificity",
  visual_proof: "Visual Proof",
  audience_relevance: "Audience Relevance",
  retention_potential: "Retention Potential",
  financial_safety: "Financial Safety",
};

const UNSAFE_FINANCIAL = /(?:무조건|확실한\s*수익|수익\s*보장|매수|매도|guaranteed\s+return|\bbuy\b|\bsell\b)/iu;

function metric(
  name: TopicEvaluationMetricName,
  score: number,
  reasons: readonly string[],
  evidenceReferences: readonly string[],
): TopicEvaluationMetric {
  const bounded = Math.max(0, Math.min(100, Math.round(score)));
  const weight = WEIGHTS[name];
  return {
    name,
    label: LABELS[name],
    score: bounded,
    weight,
    weightedScore: Number(((bounded * weight) / 100).toFixed(2)),
    reasons: [...reasons],
    evidenceReferences: [...evidenceReferences],
  };
}

export function evaluateTopicCandidate(
  candidate: TopicCandidate,
  evidencePack: EvidencePackDraft,
): TopicEvaluationResult {
  const claimIds = new Set(evidencePack.claims.map((claim) => claim.claimId));
  const sourceMap = new Map(evidencePack.sources.map((source) => [source.sourceId, source] as const));
  const numberIds = new Set(evidencePack.numbers.map((number) => number.numberId));
  const blockingIssues: string[] = [];
  const warnings: string[] = [];
  const unknownClaims = candidate.claimRefs.filter((reference) => !claimIds.has(reference));
  const unknownSources = candidate.sourceRefs.filter((reference) => !sourceMap.has(reference));
  const unknownNumbers = candidate.numberRefs.filter((reference) => !numberIds.has(reference));
  if (candidate.sourceRefs.length === 0) blockingIssues.push("source_ref_zero");
  if (candidate.claimRefs.length === 0) blockingIssues.push("claim_ref_zero");
  if (unknownClaims.length || unknownSources.length || unknownNumbers.length) blockingIssues.push("unsupported_reference");
  if (!candidate.sourceRefs.some((reference) => sourceMap.get(reference)?.freshness === "fresh")) {
    blockingIssues.push("fresh_source_coverage_zero");
  }
  if (!candidate.lifeImpact.trim()) blockingIssues.push("audience_impact_missing");
  if (UNSAFE_FINANCIAL.test(`${candidate.workingTitle} ${candidate.hookPromise} ${candidate.angle}`)) {
    blockingIssues.push("unsafe_financial_language");
  }
  if (candidate.numberRefs.length === 0) warnings.push("visual_number_reference_missing");

  const freshCount = candidate.sourceRefs.filter((reference) => sourceMap.get(reference)?.freshness === "fresh").length;
  const scoreBreakdown = [
    metric("watch_reason", candidate.hookPromise.length >= 12 ? 90 : 55, ["hook promise의 구체성"], candidate.claimRefs),
    metric("freshness", freshCount > 0 ? 100 : 0, [`fresh source ${freshCount}개`], candidate.sourceRefs),
    metric("evidence", unknownClaims.length + unknownSources.length === 0 ? 100 : 0, ["claim/source reference 연결"], [...candidate.claimRefs, ...candidate.sourceRefs]),
    metric("specificity", candidate.numberRefs.length > 0 ? 100 : candidate.workingTitle.length >= 20 ? 75 : 45, ["숫자 또는 구체적 제목"], candidate.numberRefs),
    metric("visual_proof", candidate.numberRefs.length > 0 ? 90 : 55, ["number reference 기반 시각화 가능성"], candidate.numberRefs),
    metric("audience_relevance", candidate.lifeImpact.trim() ? 95 : 0, ["audience impact 연결"], candidate.claimRefs),
    metric("retention_potential", candidate.viewerQuestion.includes("?") ? 90 : 60, ["viewer question 존재"], candidate.claimRefs),
    metric("financial_safety", UNSAFE_FINANCIAL.test(`${candidate.workingTitle} ${candidate.hookPromise} ${candidate.angle}`) ? 0 : 100, ["직접 투자 권유 표현 검사"], candidate.claimRefs),
  ];
  return {
    candidateId: candidate.candidateId,
    totalScore: Number(scoreBreakdown.reduce((sum, entry) => sum + entry.weightedScore, 0).toFixed(2)),
    blockingIssues,
    warnings,
    scoreBreakdown,
    rank: 0,
    tieBreakKey: `${String(candidate.ordinal).padStart(3, "0")}:${candidate.candidateId}`,
    scoreMeaning: "heuristic_pre_score_not_quality_gate",
  };
}

export function rankTopicCandidates(
  candidates: readonly TopicCandidate[],
  evidencePack: EvidencePackDraft,
): readonly TopicEvaluationResult[] {
  return candidates
    .map((candidate) => evaluateTopicCandidate(candidate, evidencePack))
    .sort((left, right) => {
      const blockOrder = Number(left.blockingIssues.length > 0) - Number(right.blockingIssues.length > 0);
      if (blockOrder !== 0) return blockOrder;
      if (right.totalScore !== left.totalScore) return right.totalScore - left.totalScore;
      return left.tieBreakKey.localeCompare(right.tieBreakKey);
    })
    .map((result, index) => ({ ...result, rank: index + 1 }));
}

export function topicEvaluationWeightsTotal(): number {
  return Object.values(WEIGHTS).reduce((sum, weight) => sum + weight, 0);
}
