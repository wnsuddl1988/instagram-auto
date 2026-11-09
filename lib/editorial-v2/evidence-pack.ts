import type {
  ApprovedTrendBriefSessionSnapshot,
  EvidenceClaimRecord,
  EvidenceNumberRecord,
  EvidencePackDraft,
  EvidenceReviewState,
  EvidenceSourceRecord,
  ResearchWindowPreset,
} from "./contracts";

const DAY_MS = 86_400_000;

function cutoffBounds(cutoffDate: string, window: ResearchWindowPreset): readonly [number, number] {
  const cutoffStart = Date.parse(`${cutoffDate}T00:00:00.000Z`);
  const cutoffEnd = cutoffStart + DAY_MS - 1;
  const days = window === "24h" ? 1 : window === "7d" ? 7 : 30;
  return [cutoffStart - (days - 1) * DAY_MS, cutoffEnd];
}

function classifyFreshness(
  publishedAt: string,
  cutoffDate: string,
  window: ResearchWindowPreset,
): "fresh" | "stale" | "unknown" {
  const published = Date.parse(publishedAt);
  const [start, end] = cutoffBounds(cutoffDate, window);
  if (!Number.isFinite(published) || !Number.isFinite(start)) return "unknown";
  return published >= start && published <= end ? "fresh" : "stale";
}

export function buildEvidencePackDraft(
  approvedSnapshot: ApprovedTrendBriefSessionSnapshot,
): EvidencePackDraft {
  const input = approvedSnapshot.candidate;
  const sources: EvidenceSourceRecord[] = input.sources.map((source, originalIndex) => ({
    sourceId: source.sourceId,
    publisher: source.publisher,
    title: source.title,
    url: source.url,
    publishedAt: source.publishedAt,
    eventDate: source.eventDate,
    freshness: classifyFreshness(source.publishedAt, input.researchCutoffDate, input.researchWindow),
    originalIndex,
    ...(source.description !== undefined && { description: source.description }),
  }));
  const claims: EvidenceClaimRecord[] = input.signals.map((signal) => ({
    claimId: `claim:${signal.signalId}`,
    signalId: signal.signalId,
    headline: signal.headline,
    claim: signal.claim,
    whyNow: signal.whyNow,
    audienceImpact: signal.audienceImpact,
    sourceRefs: [...signal.sourceRefs],
    numberRefs: signal.numbers.map((_, index) => `number:${signal.signalId}:${index + 1}`),
  }));
  const numbers: EvidenceNumberRecord[] = input.signals.flatMap((signal) =>
    signal.numbers.map((number, index) => ({
      numberId: `number:${signal.signalId}:${index + 1}`,
      signalId: signal.signalId,
      value: number.value,
      unit: number.unit,
      currency: number.currency,
      asOf: number.asOf,
      context: number.context,
      sourceRefs: [...signal.sourceRefs],
    })),
  );
  const sourceMap = new Map(sources.map((source) => [source.sourceId, source] as const));
  const signalCoverage = claims.map((claim) => ({
    signalId: claim.signalId,
    sourceCount: claim.sourceRefs.length,
    numberCount: claim.numberRefs.length,
    freshSourceCount: claim.sourceRefs.filter((reference) => sourceMap.get(reference)?.freshness === "fresh").length,
  }));
  const warnings = signalCoverage
    .filter((coverage) => coverage.numberCount === 0)
    .map((coverage) => `${coverage.signalId}: 연결된 number record가 없습니다.`);
  return {
    verificationLevel: "structural_only",
    provenance: {
      rawHash: approvedSnapshot.rawHash,
      normalizedHash: approvedSnapshot.normalizedHash,
      researchCutoffDate: input.researchCutoffDate,
      researchWindow: input.researchWindow,
      domain: input.domain,
      audience: input.audience,
      targetDurationSeconds: input.targetDurationSeconds,
      sourceImportSchemaVersion: input.schemaVersion,
    },
    sources,
    claims,
    numbers,
    coverage: {
      sourceCount: sources.length,
      signalCount: claims.length,
      numberCount: numbers.length,
      freshSourceCount: sources.filter((source) => source.freshness === "fresh").length,
      signalCoverage,
      warnings,
    },
  };
}

export function validateEvidencePackDraft(
  pack: EvidencePackDraft,
  expectedNormalizedHash = pack.provenance.normalizedHash,
): EvidenceReviewState {
  const blockingIssues: string[] = [];
  const warnings = [...pack.coverage.warnings];
  const sourceIds = new Set<string>();
  const claimIds = new Set<string>();
  const numberIds = new Set<string>();

  for (const source of pack.sources) {
    if (sourceIds.has(source.sourceId)) blockingIssues.push(`duplicate_source_id:${source.sourceId}`);
    sourceIds.add(source.sourceId);
    if (!source.sourceId || !source.publisher || !source.title || !source.url || !source.publishedAt) {
      blockingIssues.push(`missing_required_source_field:${source.sourceId || source.originalIndex}`);
    }
  }
  for (const number of pack.numbers) {
    if (numberIds.has(number.numberId)) blockingIssues.push(`duplicate_number_id:${number.numberId}`);
    numberIds.add(number.numberId);
    if (number.sourceRefs.length === 0) blockingIssues.push(`number_without_provenance:${number.numberId}`);
    for (const reference of number.sourceRefs) {
      if (!sourceIds.has(reference)) blockingIssues.push(`dangling_number_source_ref:${number.numberId}:${reference}`);
    }
  }
  for (const claim of pack.claims) {
    if (claimIds.has(claim.claimId)) blockingIssues.push(`duplicate_claim_id:${claim.claimId}`);
    claimIds.add(claim.claimId);
    if (claim.sourceRefs.length === 0) blockingIssues.push(`claim_without_source:${claim.claimId}`);
    for (const reference of claim.sourceRefs) {
      if (!sourceIds.has(reference)) blockingIssues.push(`dangling_claim_source_ref:${claim.claimId}:${reference}`);
    }
    for (const reference of claim.numberRefs) {
      if (!numberIds.has(reference)) blockingIssues.push(`dangling_claim_number_ref:${claim.claimId}:${reference}`);
    }
    if (!claim.sourceRefs.some((reference) => pack.sources.some(
      (source) => source.sourceId === reference && source.freshness === "fresh",
    ))) blockingIssues.push(`claim_without_fresh_source:${claim.claimId}`);
  }
  if (pack.provenance.normalizedHash !== expectedNormalizedHash) {
    blockingIssues.push("normalized_hash_mismatch");
  }
  if (pack.verificationLevel !== "structural_only") blockingIssues.push("verification_level_not_structural_only");
  return { status: "not_reviewed", blockingIssues, warnings };
}
