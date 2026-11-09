const RESUMABLE_STATUSES = new Set([
  "SUBMITTED_PENDING_RESULT",
  "SUBMITTED_RESULT_BOUND_PENDING_DOWNLOAD",
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

  const attemptCount = summary.approvalClickAttemptCount;
  if (!Number.isInteger(attemptCount) || ![0, 1].includes(attemptCount)) {
    return blocked("prior_summary_approval_click_attempt_count_invalid");
  }
  const makeAttemptCount = summary.makeClickAttemptCount;
  if (!Number.isInteger(makeAttemptCount) || ![0, 1].includes(makeAttemptCount)) {
    return blocked("prior_summary_make_click_attempt_count_invalid");
  }
  const makeConfirmedNoSubmission = makeAttemptCount === 1 &&
    summary.makeClickIntent?.clickIntentArmed === true &&
    summary.makeClickIntent?.outcomeConfirmedNoSubmission === true &&
    attemptCount === 0;
  const uncertainMakeResult = summary.status === "MAKE_CLICK_OUTCOME_UNKNOWN" &&
    summary.submissionCount === 0 &&
    summary.expectedCreditsSpent === null &&
    makeAttemptCount === 1 &&
    summary.makeClickIntent?.clickIntentArmed === true &&
    attemptCount === 0;
  const uncertainApprovalResult = summary.status === "APPROVAL_CLICK_OUTCOME_UNKNOWN" &&
    summary.submissionCount === 0 &&
    summary.expectedCreditsSpent === null &&
    makeAttemptCount === 1 &&
    summary.makeClickIntent?.clickIntentArmed === true &&
    attemptCount === 1 &&
    summary.approvalClickIntent?.clickIntentArmed === true;

  const exactResultObserved =
    summary.submitEvidence?.clickDispatched === false &&
    [
      "exact_attempt_result_recovered_after_uncertain_click",
      "exact_attempt_result_after_make_no_confirmation",
    ].includes(summary.submitEvidence?.observedBy) &&
    summary.resultBinding?.schemaVersion === "money_shorts_flow_motion_result_binding_v1" &&
    summary.resultBinding?.attemptId === summary.attemptId &&
    summary.resultBinding?.jobId === summary.jobId &&
    summary.resultBinding?.referenceSha256 === summary.referenceSha256 &&
    summary.resultBinding?.promptSha256 === summary.promptSha256 &&
    summary.resultBinding?.providerPromptSha256 === summary.providerPromptSha256;
  const dispatchObserved = (summary.submitEvidence?.clickDispatched === true &&
    summary.submitEvidence?.observedBy !== "new_flow_edit_result_after_make_without_confirmation") ||
    exactResultObserved;
  const ownerSubmissionObserved = Number.isInteger(summary.ownerObservedSubmissionCount) &&
    summary.ownerObservedSubmissionCount >= 1 &&
    Number.isFinite(summary.ownerObservedCreditsSpent) &&
    summary.ownerObservedCreditsSpent >= expectedCredits;
  const ownerObservationPositive =
    (Number.isInteger(summary.ownerObservedSubmissionCount) && summary.ownerObservedSubmissionCount > 0) ||
    (Number.isFinite(summary.ownerObservedCreditsSpent) && summary.ownerObservedCreditsSpent > 0);
  const intentArmed = summary.approvalClickIntent?.clickIntentArmed === true;
  if (dispatchObserved && summary.submissionCount !== 1) return blocked("prior_summary_dispatch_count_mismatch");
  if (intentArmed && attemptCount !== 1) return blocked("prior_summary_intent_attempt_mismatch");
  if (typeof summary.failure === "string" &&
      summary.failure.startsWith("required_generation_confirmation_dialog_missing") &&
      !makeConfirmedNoSubmission &&
      !uncertainMakeResult) {
    return blocked("prior_summary_make_click_outcome_requires_manual_review");
  }
  if (uncertainMakeResult || uncertainApprovalResult) {
    return {
      action: "reconcile_uncertain_result",
      reason: null,
      submissionCount: 0,
      approvalClickAttemptCount: attemptCount,
    };
  }
  if (summary.submissionCount === 0 && ownerObservationPositive) {
    return blocked("prior_summary_owner_observation_count_mismatch");
  }
  if (attemptCount > 0 && summary.submissionCount === 0) return blocked("prior_summary_click_outcome_requires_manual_review");
  if (summary.status === "MAKE_CLICK_OUTCOME_UNKNOWN") {
    return blocked("prior_summary_make_click_outcome_requires_manual_review");
  }
  if (summary.status === "APPROVAL_CLICK_OUTCOME_UNKNOWN") return blocked("prior_summary_click_outcome_requires_manual_review");
  if (summary.submissionCount === 0 && makeAttemptCount === 1 && !makeConfirmedNoSubmission) {
    return blocked("prior_summary_make_click_outcome_requires_manual_review");
  }

  if (summary.submissionCount === 1) {
    if (!RESUMABLE_STATUSES.has(summary.status)) return blocked("prior_summary_submitted_status_invalid");
    if (summary.expectedCreditsSpent !== expectedCredits) return blocked("prior_summary_submitted_credit_mismatch");
    if (!dispatchObserved && !ownerSubmissionObserved) {
      return blocked("prior_summary_submission_evidence_unreliable");
    }
    return {
      action: "resume_submitted_result",
      reason: null,
      submissionCount: 1,
      approvalClickAttemptCount: attemptCount,
    };
  }

  if (!["FAILED_NO_AUTOMATIC_RETRY", "CONFIRMATION_PENDING_NO_SUBMISSION"].includes(summary.status)) {
    return blocked("prior_summary_zero_submission_status_invalid");
  }
  if (summary.status === "CONFIRMATION_PENDING_NO_SUBMISSION" && !makeConfirmedNoSubmission) {
    return blocked("prior_summary_confirmed_zero_evidence_missing");
  }
  if (summary.expectedCreditsSpent !== 0) return blocked("prior_summary_zero_submission_credit_mismatch");
  return {
    action: "safe_new_attempt",
    reason: null,
    submissionCount: 0,
    approvalClickAttemptCount: 0,
  };
}
