const RESUMABLE_STATUSES = new Set([
  "SUBMITTED_PENDING_RESULT",
  "SUBMITTED_RESULT_RECOVERY_REQUIRED",
]);

function blocked(reason) {
  return { action: "block", reason, submissionCount: null, approvalClickAttemptCount: null };
}

export function classifyPriorFlowMotionGenerationSummary(summary, expectedCredits = 20) {
  if (summary == null) {
    return { action: "none", reason: null, submissionCount: 0, approvalClickAttemptCount: 0 };
  }
  if (typeof summary !== "object" || Array.isArray(summary)) return blocked("prior_summary_not_object");
  if (typeof summary.status !== "string" || !summary.status) return blocked("prior_summary_status_invalid");
  if (!Number.isInteger(summary.submissionCount) || ![0, 1].includes(summary.submissionCount)) {
    return blocked("prior_summary_submission_count_invalid");
  }

  const legacyAttempt = summary.approvalClickAttemptCount === undefined;
  const attemptCount = legacyAttempt
    ? (summary.submissionCount === 1 ? 1 : 0)
    : summary.approvalClickAttemptCount;
  if (!Number.isInteger(attemptCount) || ![0, 1].includes(attemptCount)) {
    return blocked("prior_summary_approval_click_attempt_count_invalid");
  }

  const dispatchObserved = summary.submitEvidence?.clickDispatched === true;
  const intentArmed = summary.approvalClickIntent?.clickIntentArmed === true;
  if (dispatchObserved && summary.submissionCount !== 1) return blocked("prior_summary_dispatch_count_mismatch");
  if (intentArmed && attemptCount !== 1) return blocked("prior_summary_intent_attempt_mismatch");
  if (attemptCount > 0 && summary.submissionCount === 0) return blocked("prior_summary_click_outcome_requires_manual_review");
  if (summary.status === "APPROVAL_CLICK_OUTCOME_UNKNOWN") return blocked("prior_summary_click_outcome_requires_manual_review");

  if (summary.submissionCount === 1) {
    if (!RESUMABLE_STATUSES.has(summary.status)) return blocked("prior_summary_submitted_status_invalid");
    if (summary.expectedCreditsSpent !== expectedCredits) return blocked("prior_summary_submitted_credit_mismatch");
    return {
      action: "resume_submitted_result",
      reason: null,
      submissionCount: 1,
      approvalClickAttemptCount: attemptCount,
    };
  }

  if (summary.status !== "FAILED_NO_AUTOMATIC_RETRY") return blocked("prior_summary_zero_submission_status_invalid");
  if (summary.expectedCreditsSpent !== 0) return blocked("prior_summary_zero_submission_credit_mismatch");
  return {
    action: "safe_new_attempt",
    reason: null,
    submissionCount: 0,
    approvalClickAttemptCount: 0,
  };
}
