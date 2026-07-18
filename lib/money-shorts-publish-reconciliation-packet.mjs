export const MONEY_SHORTS_PUBLISH_RECONCILIATION_PACKET_VERSION =
  "money_shorts_publish_reconciliation_packet_v1";

const STATE_CONCLUSION = {
  not_started: "게시 시도 증거가 없습니다. 새 게시 전 점검부터 다시 확인해야 합니다.",
  complete: "양쪽 게시와 원장 기록이 일치합니다. 추가 게시 동작은 필요하지 않습니다.",
  no_external_failed: "외부 요청 전 실패 기록입니다. 자동 재시도 없이 차단 원인을 수동으로 확인해야 합니다.",
  instagram_only: "Instagram 게시 증거만 확인됩니다. YouTube에는 어떤 자동 동작도 하지 않습니다.",
  both_published_ledger_missing: "양쪽 공개 ID는 있으나 게시 원장 기록이 완전하지 않습니다. 원장 사실을 수동 대조해야 합니다.",
  ambiguous: "게시 결과를 확정할 수 없습니다. 계정과 원장을 수동으로 대조해야 합니다.",
  invalid_evidence: "게시 증거 형식 또는 현재 산출물 결속이 맞지 않습니다. 어떤 재게시도 하면 안 됩니다.",
};

function text(value) {
  return typeof value === "string" ? value : "";
}

function hasPublicId(value) {
  return text(value).length > 0;
}

function fact(id, label, value = null) {
  return { id, label, value };
}

function review(id, label) {
  return { id, label };
}

/**
 * Recovery classification and durable claim/journal summary -> Owner-facing,
 * read-only reconciliation packet. No filesystem, network, retry, upload,
 * ledger mutation, account operation, timer, or environment access is allowed.
 */
export function buildMoneyShortsPublishReconciliationPacket({
  recovery,
  attemptEvidence,
}) {
  const state = text(recovery?.state);
  const ledger = recovery?.ledger ?? {};
  const attempt = attemptEvidence ?? recovery?.attemptEvidence ?? {};
  const confirmedFacts = [];
  const uncertainFacts = [];
  const ownerReview = [];

  if (attempt?.present === true) {
    confirmedFacts.push(
      fact(
        "publish_attempt_evidence_present",
        attempt?.journalValid === true
          ? "게시 시도 기록 체인이 무결성 검사를 통과했습니다."
          : "게시 시도 기록이 남아 있습니다.",
      ),
    );
    if (text(attempt?.latestTransition)) {
      confirmedFacts.push(
        fact(
          "publish_attempt_latest_transition",
          "마지막 기록 단계",
          text(attempt.latestTransition),
        ),
      );
    }
    if (attempt?.journalValid !== true) {
      uncertainFacts.push(
        fact(
          "publish_attempt_journal_not_valid",
          "게시 시도 기록 체인의 무결성을 자동으로 확정할 수 없습니다.",
          text(attempt?.reason) || null,
        ),
      );
    }
  } else {
    confirmedFacts.push(
      fact(
        "publish_attempt_evidence_absent",
        "현재 경로에서 게시 시도 claim 또는 journal을 찾지 못했습니다.",
      ),
    );
  }

  if (hasPublicId(recovery?.instagramMediaId)) {
    confirmedFacts.push(
      fact(
        "instagram_public_id",
        "Instagram 공개 ID",
        recovery.instagramMediaId,
      ),
    );
  }
  if (hasPublicId(recovery?.youtubeVideoId)) {
    confirmedFacts.push(
      fact(
        "youtube_public_id",
        "YouTube 공개 ID",
        recovery.youtubeVideoId,
      ),
    );
  }
  if (ledger?.readOk === true) {
    confirmedFacts.push(
      fact(
        "publish_ledger_readable",
        "게시 원장을 읽을 수 있습니다.",
      ),
    );
    if (ledger?.instagramAlreadyPublished === true) {
      confirmedFacts.push(
        fact(
          "ledger_instagram_record",
          "원장에 Instagram 게시 기록이 있습니다.",
          text(ledger?.instagramPublishedIdReference) || null,
        ),
      );
    }
    if (ledger?.youtubeAlreadyPublished === true) {
      confirmedFacts.push(
        fact(
          "ledger_youtube_record",
          "원장에 YouTube 게시 기록이 있습니다.",
          text(ledger?.youtubePublishedIdReference) || null,
        ),
      );
    }
  } else {
    uncertainFacts.push(
      fact(
        "publish_ledger_unreadable",
        "게시 원장을 읽을 수 없어 원장 기록 여부를 확정할 수 없습니다.",
      ),
    );
  }

  if (state === "ambiguous" || state === "invalid_evidence") {
    uncertainFacts.push(
      fact(
        "recovery_state_not_confirmed",
        "현재 게시 결과를 안전하게 확정할 수 없습니다.",
        text(recovery?.reason) || null,
      ),
    );
  }

  if (state === "not_started") {
    ownerReview.push(
      review(
        "recheck_preflight_before_new_publish",
        "실제 게시를 새로 검토하려면 최신 산출물 결속과 게시 전 점검을 다시 확인하세요.",
      ),
    );
  } else if (state === "complete") {
    ownerReview.push(
      review(
        "keep_completed_evidence",
        "완료 증거를 보존하고 재게시·재업로드는 하지 마세요.",
      ),
    );
  } else {
    ownerReview.push(
      review(
        "verify_account_and_ledger_manually",
        "각 플랫폼 계정의 공개 ID와 게시 원장을 수동으로 대조하세요.",
      ),
    );
    ownerReview.push(
      review(
        "owner_decision_required_before_any_recovery",
        "재게시·원장 수정·플랫폼별 복구는 별도 Owner 승인 전까지 실행하지 마세요.",
      ),
    );
  }

  return {
    schemaVersion:
      MONEY_SHORTS_PUBLISH_RECONCILIATION_PACKET_VERSION,
    mode: "read_only_evidence_packet",
    state,
    reason: text(recovery?.reason) || null,
    conclusion:
      STATE_CONCLUSION[state] ??
      "게시 증거 상태를 해석할 수 없습니다. 수동 확인이 필요합니다.",
    confirmedFacts,
    uncertainFacts,
    ownerReview,
    safety: {
      automaticRetryAllowed: false,
      automaticRecoveryAllowed: false,
      externalActionCount: 0,
      uploadAllowed: false,
      ledgerMutationAllowed: false,
    },
  };
}
