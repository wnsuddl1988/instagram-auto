import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  MONEY_SHORTS_PUBLISH_RECONCILIATION_PACKET_VERSION,
  buildMoneyShortsPublishReconciliationPacket,
} from "../lib/money-shorts-publish-reconciliation-packet.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(
  join(
    ROOT,
    "lib",
    "money-shorts-publish-reconciliation-packet.mjs",
  ),
  "utf8",
);

let passed = 0;
let failed = 0;
function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(
      `FAIL  ${name}${detail ? ` - ${detail}` : ""}`,
    );
  }
}

function recovery(overrides = {}) {
  return {
    state: "ambiguous",
    reason: "youtube_publish_outcome_unknown",
    instagramMediaId: null,
    youtubeVideoId: null,
    ledger: {
      readOk: false,
      instagramAlreadyPublished: false,
      youtubeAlreadyPublished: false,
      instagramPublishedIdReference: null,
      youtubePublishedIdReference: null,
    },
    ...overrides,
  };
}

function attemptEvidence(overrides = {}) {
  return {
    present: true,
    journalValid: true,
    reason: "publish_attempt_manual_review_required",
    claimSha256: "a".repeat(64),
    eventCount: 4,
    latestTransition: "instagram_publish_intent",
    latestRecordedAtIso: "2026-07-18T00:00:00.000Z",
    ...overrides,
  };
}

const completeInput = recovery({
  state: "complete",
  reason: "dual_publish_result_and_ledger_match",
  instagramMediaId: "ig-123",
  youtubeVideoId: "yt-456",
  ledger: {
    readOk: true,
    instagramAlreadyPublished: true,
    youtubeAlreadyPublished: true,
    instagramPublishedIdReference: "ig-123",
    youtubePublishedIdReference: "yt-456",
  },
});
const completeAttempt = attemptEvidence({
  latestTransition: "complete",
});
const completeBefore = JSON.stringify({ completeInput, completeAttempt });
const complete = buildMoneyShortsPublishReconciliationPacket({
  recovery: completeInput,
  attemptEvidence: completeAttempt,
});
check(
  "complete packet keeps both public IDs and readable ledger as confirmed facts",
  complete.schemaVersion ===
    MONEY_SHORTS_PUBLISH_RECONCILIATION_PACKET_VERSION &&
    complete.mode === "read_only_evidence_packet" &&
    complete.confirmedFacts.some(
      (item) => item.id === "instagram_public_id" && item.value === "ig-123",
    ) &&
    complete.confirmedFacts.some(
      (item) => item.id === "youtube_public_id" && item.value === "yt-456",
    ) &&
    complete.confirmedFacts.some(
      (item) => item.id === "publish_ledger_readable",
    ),
);
check(
  "complete packet preserves no-republish Owner guidance and immutable inputs",
  complete.ownerReview.some(
    (item) => item.id === "keep_completed_evidence",
  ) &&
    JSON.stringify({ completeInput, completeAttempt }) === completeBefore,
);

const ambiguous = buildMoneyShortsPublishReconciliationPacket({
  recovery: recovery(),
  attemptEvidence: attemptEvidence({
    journalValid: false,
    reason: "journal_orphan_or_unknown_file_present",
  }),
});
check(
  "ambiguous packet separates unreadable ledger, invalid journal, and recovery uncertainty",
  [
    "publish_ledger_unreadable",
    "publish_attempt_journal_not_valid",
    "recovery_state_not_confirmed",
  ].every((id) => ambiguous.uncertainFacts.some((item) => item.id === id)),
);
check(
  "ambiguous packet asks only for manual verification and a later Owner decision",
  ambiguous.ownerReview.some(
    (item) => item.id === "verify_account_and_ledger_manually",
  ) &&
    ambiguous.ownerReview.some(
      (item) => item.id === "owner_decision_required_before_any_recovery",
    ),
);

const unstarted = buildMoneyShortsPublishReconciliationPacket({
  recovery: recovery({
    state: "not_started",
    reason: "no_armed_result_and_clean_ledger",
    ledger: {
      readOk: true,
      instagramAlreadyPublished: false,
      youtubeAlreadyPublished: false,
      instagramPublishedIdReference: null,
      youtubePublishedIdReference: null,
    },
  }),
  attemptEvidence: attemptEvidence({
    present: false,
    journalValid: true,
    eventCount: 0,
    latestTransition: null,
  }),
});
check(
  "not-started packet requests a fresh preflight rather than a recovery action",
  unstarted.ownerReview.length === 1 &&
    unstarted.ownerReview[0].id ===
      "recheck_preflight_before_new_publish" &&
    unstarted.confirmedFacts.some(
      (item) => item.id === "publish_attempt_evidence_absent",
    ),
);

const unknown = buildMoneyShortsPublishReconciliationPacket({
  recovery: recovery({ state: "unexpected_state", reason: null }),
  attemptEvidence: attemptEvidence(),
});
check(
  "unknown state remains a read-only manual-review packet",
  unknown.conclusion.includes("해석할 수 없습니다") &&
    unknown.ownerReview.some(
      (item) => item.id === "verify_account_and_ledger_manually",
    ),
);

check(
  "packet has no filesystem, process, network, retry, upload, or mutation authority",
  !/node:fs|node:child_process|process\.env|\bfetch\s*\(|writeFile|renameSync|rmSync|unlinkSync|setTimeout|setInterval|actualUpload|youtube\.videos|media_publish|writePublishLedger|recordDualPlatformPublish/u.test(
    source,
  ),
);
check(
  "packet safety flags remain fail-closed for every state",
  [complete, ambiguous, unstarted, unknown].every(
    (packet) =>
      packet.safety.automaticRetryAllowed === false &&
      packet.safety.automaticRecoveryAllowed === false &&
      packet.safety.externalActionCount === 0 &&
      packet.safety.uploadAllowed === false &&
      packet.safety.ledgerMutationAllowed === false,
  ),
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
