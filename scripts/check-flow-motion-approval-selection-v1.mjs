#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  hasRequiredGenerationFacts,
  isApprovalAcknowledged,
  selectCurrentApprovalCandidate,
} from "./_flow-motion-approval-selection.mjs";

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log(`  PASS ${name}`);
}

check("Korean current confirmation facts", () => {
  assert.equal(hasRequiredGenerationFacts("크레딧 20개를 사용하여 1개 동영상 생성을 시작할까요?"), true);
});
check("Korean reversed-order confirmation facts", () => {
  assert.equal(hasRequiredGenerationFacts("20개의 크레딧을 사용해 동영상 1개를 생성할까요?"), true);
});
check("English generate-first confirmation facts", () => {
  assert.equal(hasRequiredGenerationFacts("Generate 1 video using 20 credits?"), true);
});
check("English spend-first confirmation facts", () => {
  assert.equal(hasRequiredGenerationFacts("Use 20 credits to create 1 video?"), true);
});
check("wrong credit cost is rejected", () => {
  assert.equal(hasRequiredGenerationFacts("크레딧 200개를 사용하여 1개 동영상 생성을 시작할까요?"), false);
});
check("wrong output count is rejected", () => {
  assert.equal(hasRequiredGenerationFacts("크레딧 20개를 사용하여 2개 동영상 생성을 시작할까요?"), false);
});
check("partial output-number match is rejected", () => {
  assert.equal(hasRequiredGenerationFacts("Use 20 credits to create 10 videos?"), false);
});

const currentOuter = {
  index: 8,
  cardKey: "current-card",
  inViewport: true,
  creditPromptMatches: true,
  promptMatches: true,
  acknowledged: false,
  interactive: true,
  enabled: true,
  outermost: true,
};
const currentInner = { ...currentOuter, index: 9, outermost: false };

check("nested controls resolve to the outer one-time control", () => {
  assert.deepEqual(selectCurrentApprovalCandidate([currentOuter, currentInner]), currentOuter);
});
check("fresh card may use temporal delta without prompt ancestry", () => {
  const outer = { ...currentOuter, promptMatches: false };
  const inner = { ...currentInner, promptMatches: false };
  assert.deepEqual(selectCurrentApprovalCandidate([outer, inner], { freshAfterIndex: 8 }), outer);
});
check("stale pending card is excluded from fresh delta", () => {
  const stale = { ...currentOuter, index: 4, cardKey: "stale-card", promptMatches: false };
  assert.deepEqual(selectCurrentApprovalCandidate([
    stale,
    { ...currentOuter, promptMatches: false },
    { ...currentInner, promptMatches: false },
  ], { freshAfterIndex: 8 }), { ...currentOuter, promptMatches: false });
});
check("acknowledged card is excluded", () => {
  assert.throws(
    () => selectCurrentApprovalCandidate([{ ...currentOuter, acknowledged: true }]),
    /active_approval_ambiguous:0/,
  );
});
check("disabled card is excluded", () => {
  assert.throws(
    () => selectCurrentApprovalCandidate([{ ...currentOuter, enabled: false }]),
    /active_approval_ambiguous:0/,
  );
});
check("noninteractive text response is excluded", () => {
  assert.throws(
    () => selectCurrentApprovalCandidate([{ ...currentOuter, interactive: false }]),
    /active_approval_ambiguous:0/,
  );
});
check("two distinct pending cards fail closed", () => {
  assert.throws(
    () => selectCurrentApprovalCandidate([
      currentOuter,
      { ...currentOuter, index: 10, cardKey: "other-card" },
    ]),
    /active_approval_card_ambiguous:2/,
  );
});
check("duplicate candidate index fails closed", () => {
  assert.throws(
    () => selectCurrentApprovalCandidate([currentOuter, { ...currentInner, index: currentOuter.index }]),
    /active_approval_ambiguous:2/,
  );
});
check("ambiguous same-card controls fail closed", () => {
  assert.throws(
    () => selectCurrentApprovalCandidate([currentOuter, { ...currentOuter, index: 9 }]),
    /active_approval_control_ambiguous:2/,
  );
});
check("approval acknowledgement increments exactly once", () => {
  assert.equal(isApprovalAcknowledged(1, 2), true);
});
check("unchanged acknowledgement count is rejected", () => {
  assert.equal(isApprovalAcknowledged(1, 1), false);
});
check("two acknowledgement increments are rejected", () => {
  assert.equal(isApprovalAcknowledged(1, 3), false);
});

console.log(`Flow motion approval selection: ${passed}/${passed} PASS`);
