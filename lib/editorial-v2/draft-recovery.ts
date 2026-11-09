import { createHash } from "node:crypto";

import type { EditorialV2LocalStoreConfiguration } from "./contracts";
import type {
  EditorialV2DraftRecoveryRequest,
  EditorialV2DraftRecoveryState,
  EditorialV2DraftSaveResult,
} from "./draft-contracts";
import {
  inspectProjectDraft,
  recoverProjectDraftFromLastKnownGood,
} from "./draft-store-node";

export interface EditorialV2DraftRecoveryPlan {
  readonly planId: string;
  readonly projectId: string;
  readonly required: boolean;
  readonly candidate: "last_known_good" | "none";
  readonly candidateDraftRevision: number | null;
  readonly ownerConfirmationRequired: true;
  readonly automaticRecovery: false;
  readonly automaticMerge: false;
  readonly corruptedCurrentMustBePreserved: true;
  readonly approvedSnapshotMustRemainUnchanged: true;
  readonly message: string;
}

export interface EditorialV2DraftRecoveryResult extends EditorialV2DraftSaveResult {
  readonly planId: string | null;
  readonly ownerConfirmed: boolean;
  readonly corruptedCurrentPreserved: boolean;
  readonly approvedSnapshotUnchanged: boolean;
}

export async function inspectDraftRecoveryState(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
): Promise<EditorialV2DraftRecoveryState> {
  return (await inspectProjectDraft(configuration, projectId)).state;
}

export function buildDraftRecoveryPlan(
  state: EditorialV2DraftRecoveryState,
): EditorialV2DraftRecoveryPlan {
  const required = state.currentExists && !state.currentValid && state.lastKnownGoodValid;
  const identity = [
    state.projectId,
    state.currentExists,
    state.currentValid,
    state.currentDraftRevision ?? "none",
    state.lastKnownGoodValid,
    state.lastKnownGoodDraftRevision ?? "none",
  ].join(":");
  return {
    planId: `draft-recovery-plan-${createHash("sha256").update(identity, "utf8").digest("hex").slice(0, 16)}`,
    projectId: state.projectId,
    required,
    candidate: required ? "last_known_good" : "none",
    candidateDraftRevision: required ? state.lastKnownGoodDraftRevision : null,
    ownerConfirmationRequired: true,
    automaticRecovery: false,
    automaticMerge: false,
    corruptedCurrentMustBePreserved: true,
    approvedSnapshotMustRemainUnchanged: true,
    message: required ? "DRAFT_RECOVERY_REQUIRES_EXPLICIT_OWNER_CONFIRMATION" : "DRAFT_RECOVERY_NOT_REQUIRED_OR_UNAVAILABLE",
  };
}

export async function recoverDraftFromLastKnownGood(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
  request: EditorialV2DraftRecoveryRequest,
): Promise<EditorialV2DraftRecoveryResult> {
  const state = await inspectDraftRecoveryState(configuration, projectId);
  const plan = buildDraftRecoveryPlan(state);
  if (!plan.required || request.ownerConfirmed !== true) {
    return {
      ok: false,
      status: "validation_error",
      projectId,
      draftRevision: null,
      draftHash: null,
      message: request.ownerConfirmed === true ? "DRAFT_RECOVERY_NOT_REQUIRED_OR_UNAVAILABLE" : "DRAFT_RECOVERY_OWNER_CONFIRMATION_REQUIRED",
      conflict: null,
      planId: plan.planId,
      ownerConfirmed: request.ownerConfirmed,
      corruptedCurrentPreserved: state.corruptionPreserved,
      approvedSnapshotUnchanged: true,
    };
  }
  const result = await recoverProjectDraftFromLastKnownGood(configuration, projectId, request);
  return { ...result, planId: plan.planId, ownerConfirmed: true };
}
