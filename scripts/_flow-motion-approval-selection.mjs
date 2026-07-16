function escapedInteger(value) {
  if (!Number.isInteger(value) || value < 1) throw new Error("positive_integer_required");
  return `(?<!\\d)${value}(?!\\d)`;
}

export function hasRequiredGenerationFacts(text, expectedCredits = 20, expectedOutputCount = 1) {
  const normalized = String(text ?? "").replace(/\s+/g, " ").trim();
  const credits = escapedInteger(expectedCredits);
  const outputs = escapedInteger(expectedOutputCount);
  const creditToken = new RegExp(
    `(?:크레딧\\s*${credits}\\s*개|${credits}\\s*개(?:의)?\\s*크레딧|${credits}\\s*(?:Google\\s*Flow\\s*)?credits?|credits?\\s*${credits})`,
    "i",
  );
  const outputToken = new RegExp(
    `(?:${outputs}\\s*개(?:의)?\\s*동영상|동영상\\s*${outputs}\\s*개|${outputs}\\s*videos?|videos?\\s*${outputs})`,
    "i",
  );
  const actionToken = /(?:사용|소모|생성|시작|use|spend|generate|create|start)/i;
  return creditToken.test(normalized) && outputToken.test(normalized) && actionToken.test(normalized);
}

export function selectCurrentApprovalCandidate(candidates, options = {}) {
  const freshAfterIndex = Number.isInteger(options.freshAfterIndex) ? options.freshAfterIndex : null;
  const active = candidates.filter((candidate) =>
    Number.isInteger(candidate?.index) &&
    candidate?.creditPromptMatches === true &&
    candidate?.acknowledged === false &&
    candidate?.interactive === true &&
    candidate?.enabled !== false &&
    (freshAfterIndex === null
      ? candidate?.promptMatches === true
      : candidate.index >= freshAfterIndex),
  );
  if (active.length === 0 || new Set(active.map((candidate) => candidate.index)).size !== active.length) {
    throw new Error(`active_approval_ambiguous:${active.length}`);
  }

  const cardKeys = [...new Set(active.map((candidate) => candidate.cardKey))];
  if (cardKeys.length !== 1 || cardKeys[0] === null || cardKeys[0] === undefined) {
    throw new Error(`active_approval_card_ambiguous:${cardKeys.length}`);
  }
  const sameCard = active.filter((candidate) => candidate.cardKey === cardKeys[0]);
  const inViewport = sameCard.filter((candidate) => candidate?.inViewport === true);
  const visibleOrSameCard = inViewport.length > 0 ? inViewport : sameCard;
  const outermost = visibleOrSameCard.filter((candidate) => candidate?.outermost === true);
  const preferred = outermost.length > 0 ? outermost : visibleOrSameCard;
  if (preferred.length !== 1) throw new Error(`active_approval_control_ambiguous:${preferred.length}`);
  return preferred[0];
}

export function isApprovalAcknowledged(beforeCount, afterCount) {
  return Number.isInteger(beforeCount) &&
    Number.isInteger(afterCount) &&
    afterCount === beforeCount + 1;
}
