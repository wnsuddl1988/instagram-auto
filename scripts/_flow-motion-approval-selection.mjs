export function selectCurrentApprovalCandidate(candidates) {
  const active = candidates.filter((candidate) =>
    candidate?.inViewport === true &&
    candidate?.creditPromptMatches === true &&
    candidate?.promptMatches === true &&
    candidate?.acknowledged === false,
  );
  if (active.length !== 1) {
    throw new Error(`active_approval_ambiguous:${active.length}`);
  }
  return active[0];
}

export function isApprovalAcknowledged(beforeCount, afterCount) {
  return Number.isInteger(beforeCount) &&
    Number.isInteger(afterCount) &&
    afterCount === beforeCount + 1;
}
