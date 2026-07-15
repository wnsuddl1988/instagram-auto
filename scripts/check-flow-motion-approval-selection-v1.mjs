#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  isApprovalAcknowledged,
  selectCurrentApprovalCandidate,
} from "./_flow-motion-approval-selection.mjs";

const current = { index: 2, inViewport: true, creditPromptMatches: true, promptMatches: true, acknowledged: false };
assert.deepEqual(selectCurrentApprovalCandidate([
  { index: 0, inViewport: false, creditPromptMatches: true, promptMatches: true, acknowledged: true },
  { index: 1, inViewport: false, creditPromptMatches: true, promptMatches: true, acknowledged: true },
  current,
]), current);
assert.throws(
  () => selectCurrentApprovalCandidate([{ index: 0, inViewport: false, creditPromptMatches: true, promptMatches: true }]),
  /active_approval_ambiguous:0/,
);
assert.throws(
  () => selectCurrentApprovalCandidate([current, { ...current, index: 3 }]),
  /active_approval_ambiguous:2/,
);
assert.throws(
  () => selectCurrentApprovalCandidate([{ ...current, acknowledged: true }]),
  /active_approval_ambiguous:0/,
);
assert.equal(isApprovalAcknowledged(1, 2), true);
assert.equal(isApprovalAcknowledged(1, 1), false);
assert.equal(isApprovalAcknowledged(1, 3), false);

console.log("Flow motion approval selection: 7/7 PASS");
