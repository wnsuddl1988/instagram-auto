import type {
  EvidenceClaimRecord,
  EvidenceNumberRecord,
  EvidencePackDraft,
  TopicAngleType,
  TopicCandidate,
} from "./contracts";

const ANGLE_ORDER: readonly TopicAngleType[] = ["number_first", "why_now", "life_impact"];

function candidateFor(
  claim: EvidenceClaimRecord,
  numbers: readonly EvidenceNumberRecord[],
  angleType: TopicAngleType,
  ordinal: number,
): TopicCandidate {
  const firstNumber = numbers[0];
  const numberText = firstNumber
    ? `${firstNumber.value}${firstNumber.unit}${firstNumber.currency ? ` ${firstNumber.currency}` : ""}`
    : "";
  const workingTitle = angleType === "number_first"
    ? `${numberText}, ${claim.headline}`
    : angleType === "why_now"
      ? `${claim.headline}: ${claim.whyNow}`
      : `${claim.headline}, 내 생활에는 ${claim.audienceImpact}`;
  const hookPromise = angleType === "number_first"
    ? `${numberText}가 왜 지금 중요한지 근거로 확인합니다.`
    : angleType === "why_now"
      ? claim.whyNow
      : claim.audienceImpact;
  const angleStatement = angleType === "number_first"
    ? `${claim.claim} ${firstNumber?.context ?? ""}`.trim()
    : angleType === "why_now"
      ? `${claim.claim} ${claim.whyNow}`
      : `${claim.claim} ${claim.audienceImpact}`;
  const candidateId = `topic:${claim.signalId}:${angleType}`;
  return {
    candidateId,
    title: workingTitle,
    angle: angleStatement,
    evidenceRefs: [...claim.sourceRefs, ...claim.numberRefs],
    sourceSignalId: claim.signalId,
    angleType,
    workingTitle,
    hookPromise,
    viewerQuestion: `${claim.headline}이 지금 내 생활에 어떤 의미일까요?`,
    lifeImpact: claim.audienceImpact,
    claimRefs: [claim.claimId],
    sourceRefs: [...claim.sourceRefs],
    numberRefs: angleType === "number_first" ? [...claim.numberRefs] : [],
    generationRationale: `signal ${claim.signalId}의 ${angleType} 근거만 사용한 deterministic 후보`,
    ordinal,
  };
}

export function generateTopicCandidates(evidencePack: EvidencePackDraft): readonly TopicCandidate[] {
  const candidates: TopicCandidate[] = [];
  for (const claim of evidencePack.claims) {
    const numbers = evidencePack.numbers.filter((number) => number.signalId === claim.signalId);
    for (const angleType of ANGLE_ORDER) {
      if (angleType === "number_first" && numbers.length === 0) continue;
      candidates.push(candidateFor(claim, numbers, angleType, candidates.length + 1));
      if (candidates.length === 12) return candidates;
    }
  }
  return candidates;
}
