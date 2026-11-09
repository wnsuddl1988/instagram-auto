import type {
  EvidencePackDraft,
  SelectedAngleDraft,
  SelectedAngleValidationIssue,
  SelectedAngleValidationSummary,
  TopicCandidate,
} from "./contracts";

const UNSAFE_FINANCIAL = /(?:무조건|확실한\s*수익|수익\s*보장|매수|매도|guaranteed\s+return|\bbuy\b|\bsell\b)/iu;
const URL_LITERAL = /https?:\/\/\S+/giu;
const NUMBER_OR_DATE = /\b\d{4}-\d{2}-\d{2}\b|(?<![\p{L}\d])\d+(?:[.,]\d+)?(?![\p{L}\d])/gu;
const INSTITUTION = /[가-힣A-Za-z]+(?:은행|위원회|공사|공단|청|부)\b/gu;

function issue(code: string, fieldPath: string, message: string, blocking = true): SelectedAngleValidationIssue {
  return { code, fieldPath, message, blocking };
}

function allowedLiterals(pack: EvidencePackDraft): Set<string> {
  const values = new Set<string>();
  for (const number of pack.numbers) {
    values.add(String(number.value));
    values.add(number.asOf);
  }
  for (const source of pack.sources) {
    values.add(source.publishedAt.slice(0, 10));
    if (source.eventDate) values.add(source.eventDate);
  }
  values.add(pack.provenance.researchCutoffDate);
  return values;
}

export function createSelectedAngleDraft(candidate: TopicCandidate): SelectedAngleDraft {
  return {
    selectedAngleId: `selected-angle:${candidate.candidateId}`,
    candidateId: candidate.candidateId,
    sourceSignalId: candidate.sourceSignalId,
    workingTitle: candidate.workingTitle,
    hookPromise: candidate.hookPromise,
    angleStatement: candidate.angle,
    viewerQuestion: candidate.viewerQuestion,
    sourceRefs: [...candidate.sourceRefs],
    claimRefs: [...candidate.claimRefs],
    numberRefs: [...candidate.numberRefs],
  };
}

export function validateSelectedAngleDraft(
  draft: SelectedAngleDraft,
  evidencePack: EvidencePackDraft,
): SelectedAngleValidationSummary {
  const issues: SelectedAngleValidationIssue[] = [];
  const sourceIds = new Set(evidencePack.sources.map((source) => source.sourceId));
  const claimIds = new Set(evidencePack.claims.map((claim) => claim.claimId));
  const numberIds = new Set(evidencePack.numbers.map((number) => number.numberId));
  const signalExists = evidencePack.claims.some((claim) => claim.signalId === draft.sourceSignalId);
  if (!signalExists || !draft.candidateId.startsWith(`topic:${draft.sourceSignalId}:`)) {
    issues.push(issue("unknown_candidate", "/candidateId", "Evidence Pack에서 재현할 수 없는 candidate입니다."));
  }
  if (draft.sourceRefs.length === 0) issues.push(issue("source_ref_required", "/sourceRefs", "source ref가 최소 1개 필요합니다."));
  if (draft.claimRefs.length === 0) issues.push(issue("claim_ref_required", "/claimRefs", "claim ref가 최소 1개 필요합니다."));
  for (const reference of draft.sourceRefs) if (!sourceIds.has(reference)) issues.push(issue("unknown_source_ref", "/sourceRefs", reference));
  for (const reference of draft.claimRefs) if (!claimIds.has(reference)) issues.push(issue("unknown_claim_ref", "/claimRefs", reference));
  for (const reference of draft.numberRefs) if (!numberIds.has(reference)) issues.push(issue("unknown_number_ref", "/numberRefs", reference));
  if (!draft.sourceRefs.some((reference) => evidencePack.sources.some(
    (source) => source.sourceId === reference && source.freshness === "fresh",
  ))) issues.push(issue("fresh_source_required", "/sourceRefs", "fresh source가 최소 1개 필요합니다."));
  for (const [fieldPath, value] of [
    ["/workingTitle", draft.workingTitle],
    ["/hookPromise", draft.hookPromise],
    ["/angleStatement", draft.angleStatement],
    ["/viewerQuestion", draft.viewerQuestion],
  ] as const) {
    if (!value.trim()) issues.push(issue("required_text_missing", fieldPath, "필수 문구가 비어 있습니다."));
  }
  const editableText = `${draft.workingTitle} ${draft.hookPromise} ${draft.angleStatement} ${draft.viewerQuestion}`;
  if (UNSAFE_FINANCIAL.test(editableText)) issues.push(issue("unsafe_financial_language", "/", "직접 투자 권유 또는 수익 보장 표현은 허용되지 않습니다."));
  if ((editableText.match(URL_LITERAL) ?? []).length > 0) issues.push(issue("new_url_not_allowed", "/", "선택 angle에 URL을 추가할 수 없습니다."));
  const allowed = allowedLiterals(evidencePack);
  for (const literal of editableText.match(NUMBER_OR_DATE) ?? []) {
    const normalized = literal.replaceAll(",", "");
    if (!allowed.has(literal) && !allowed.has(normalized)) issues.push(issue("unsupported_numeric_or_date_literal", "/", literal));
  }
  const evidenceText = JSON.stringify(evidencePack);
  for (const institution of editableText.match(INSTITUTION) ?? []) {
    if (!evidenceText.includes(institution)) issues.push(issue("unsupported_institution", "/", institution, false));
  }
  if (editableText.trim().length < 40) issues.push(issue("excessive_genericity", "/", "angle 문구가 지나치게 일반적일 수 있습니다.", false));
  const blockingIssueCount = issues.filter((entry) => entry.blocking).length;
  return {
    valid: blockingIssueCount === 0,
    blockingIssueCount,
    warningCount: issues.length - blockingIssueCount,
    issues,
  };
}

export function canApproveSelectedAngle(summary: SelectedAngleValidationSummary | null): boolean {
  return Boolean(summary?.valid && summary.blockingIssueCount === 0);
}
