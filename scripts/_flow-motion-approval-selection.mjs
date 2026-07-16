export function selectCurrentApprovalCandidate(candidates) {
  const active = candidates.filter((candidate) =>
    candidate?.creditPromptMatches === true &&
    candidate?.promptMatches === true &&
    candidate?.acknowledged === false,
  );
  if (active.length === 0 ||
      active.some((candidate) => !Number.isInteger(candidate?.index)) ||
      new Set(active.map((candidate) => candidate.index)).size !== active.length) {
    throw new Error(`active_approval_ambiguous:${active.length}`);
  }
  const visible = active.filter((candidate) => candidate?.inViewport === true);
  const visibleOrActive = visible.length > 0 ? visible : active;
  const interactive = visibleOrActive.filter((candidate) => candidate?.interactive === true);
  const preferred = interactive.length > 0 ? interactive : visibleOrActive;
  return preferred.reduce((latest, candidate) => candidate.index > latest.index ? candidate : latest);
}

export function isApprovalAcknowledged(beforeCount, afterCount) {
  return Number.isInteger(beforeCount) &&
    Number.isInteger(afterCount) &&
    afterCount === beforeCount + 1;
}
