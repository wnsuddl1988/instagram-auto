import type {
  ApprovedTrendBriefSessionSnapshot,
  DetailedScriptPackage,
  DetailedScriptValidationSummary,
  EditorialIntelligenceSessionState,
  EvidencePackDraft,
  EvidenceReviewState,
  PromptPackage,
  SelectedAngleDraft,
  TopicCandidate,
  TopicEvaluationResult,
} from "./contracts";

export type EditorialIntelligenceSessionEvent =
  | { readonly type: "approved_trend_brief_changed"; readonly snapshot: ApprovedTrendBriefSessionSnapshot | null }
  | { readonly type: "evidence_changed"; readonly evidencePack: EvidencePackDraft; readonly review: EvidenceReviewState }
  | { readonly type: "evidence_review_changed"; readonly review: EvidenceReviewState }
  | { readonly type: "candidates_regenerated"; readonly candidates: readonly TopicCandidate[]; readonly evaluations: readonly TopicEvaluationResult[] }
  | { readonly type: "selected_candidate_changed"; readonly selectedAngle: SelectedAngleDraft | null }
  | { readonly type: "selected_angle_text_changed"; readonly selectedAngle: SelectedAngleDraft }
  | { readonly type: "selected_angle_approved" }
  | { readonly type: "script_prompt_generated"; readonly prompt: PromptPackage }
  | { readonly type: "script_raw_changed"; readonly rawText: string }
  | { readonly type: "script_preview_changed"; readonly scriptPackage: DetailedScriptPackage | null; readonly validation: DetailedScriptValidationSummary | null }
  | { readonly type: "script_repair_response_changed"; readonly repairText: string }
  | { readonly type: "script_repair_applied"; readonly scriptPackage: DetailedScriptPackage | null; readonly validation: DetailedScriptValidationSummary }
  | { readonly type: "script_approved" }
  | { readonly type: "reset" };

export function createInitialEditorialIntelligenceSession(
  approvedTrendBrief: ApprovedTrendBriefSessionSnapshot | null = null,
): EditorialIntelligenceSessionState {
  return {
    approvedTrendBrief,
    evidencePack: null,
    evidenceReview: { status: "not_reviewed", blockingIssues: [], warnings: [] },
    topicCandidates: [],
    topicEvaluations: [],
    selectedAngle: null,
    selectedAngleApproval: "not_approved",
    scriptPrompt: null,
    scriptRawText: "",
    scriptPackage: null,
    scriptValidation: null,
    scriptRepairText: "",
    scriptApproval: "not_approved",
  };
}

function clearAfterEvidence(state: EditorialIntelligenceSessionState): EditorialIntelligenceSessionState {
  return {
    ...state,
    topicCandidates: [],
    topicEvaluations: [],
    selectedAngle: null,
    selectedAngleApproval: "not_approved",
    scriptPrompt: null,
    scriptRawText: "",
    scriptPackage: null,
    scriptValidation: null,
    scriptRepairText: "",
    scriptApproval: "not_approved",
  };
}

function clearAfterCandidates(state: EditorialIntelligenceSessionState): EditorialIntelligenceSessionState {
  return {
    ...state,
    selectedAngle: null,
    selectedAngleApproval: "not_approved",
    scriptPrompt: null,
    scriptRawText: "",
    scriptPackage: null,
    scriptValidation: null,
    scriptRepairText: "",
    scriptApproval: "not_approved",
  };
}

function clearScript(state: EditorialIntelligenceSessionState): EditorialIntelligenceSessionState {
  return {
    ...state,
    scriptPrompt: null,
    scriptRawText: "",
    scriptPackage: null,
    scriptValidation: null,
    scriptRepairText: "",
    scriptApproval: "not_approved",
  };
}

export function reduceEditorialIntelligenceSession(
  state: EditorialIntelligenceSessionState,
  event: EditorialIntelligenceSessionEvent,
): EditorialIntelligenceSessionState {
  switch (event.type) {
    case "approved_trend_brief_changed":
      return createInitialEditorialIntelligenceSession(event.snapshot);
    case "evidence_changed":
      return clearAfterEvidence({ ...state, evidencePack: event.evidencePack, evidenceReview: event.review });
    case "evidence_review_changed":
      return clearAfterEvidence({ ...state, evidenceReview: event.review });
    case "candidates_regenerated":
      return clearAfterCandidates({ ...state, topicCandidates: [...event.candidates], topicEvaluations: [...event.evaluations] });
    case "selected_candidate_changed":
      return clearScript({ ...state, selectedAngle: event.selectedAngle, selectedAngleApproval: "not_approved" });
    case "selected_angle_text_changed":
      return clearScript({ ...state, selectedAngle: { ...event.selectedAngle }, selectedAngleApproval: "invalidated" });
    case "selected_angle_approved":
      return { ...state, selectedAngleApproval: "approved" };
    case "script_prompt_generated":
      return { ...state, scriptPrompt: event.prompt, scriptRawText: "", scriptPackage: null, scriptValidation: null, scriptRepairText: "", scriptApproval: "not_approved" };
    case "script_raw_changed":
      return { ...state, scriptRawText: event.rawText, scriptPackage: null, scriptValidation: null, scriptRepairText: "", scriptApproval: state.scriptApproval === "approved" ? "invalidated" : "not_approved" };
    case "script_preview_changed":
      return { ...state, scriptPackage: event.scriptPackage, scriptValidation: event.validation, scriptRepairText: "", scriptApproval: state.scriptApproval === "approved" ? "invalidated" : "not_approved" };
    case "script_repair_response_changed":
      return { ...state, scriptRepairText: event.repairText, scriptApproval: state.scriptApproval === "approved" ? "invalidated" : "not_approved" };
    case "script_repair_applied":
      return { ...state, scriptPackage: event.scriptPackage, scriptValidation: event.validation, scriptApproval: "invalidated" };
    case "script_approved":
      return { ...state, scriptApproval: "approved" };
    case "reset":
      return createInitialEditorialIntelligenceSession(null);
  }
}
