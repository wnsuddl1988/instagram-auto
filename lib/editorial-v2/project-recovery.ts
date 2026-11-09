import { createHash } from "node:crypto";

import type {
  EditorialV2LocalStoreConfiguration,
  EditorialV2ProjectSnapshot,
  EditorialV2RecoveryResult,
} from "./contracts";
import {
  inspectEditorialV2ProjectCandidates,
  restoreEditorialV2ProjectCandidate,
} from "./project-store-node";

export interface EditorialV2RevisionComparison {
  readonly leftRevision: number;
  readonly rightRevision: number;
  readonly sameIntegrityHash: boolean;
  readonly checkpointStageChanges: readonly string[];
  readonly rawArtifactCountDelta: number;
}

export interface EditorialV2RecoveryState {
  readonly projectId: string;
  readonly currentValid: boolean;
  readonly currentCorrupted: boolean;
  readonly lastKnownGoodAvailable: boolean;
  readonly historyCandidateRevisions: readonly number[];
  readonly automaticRecoveryAllowed: false;
  readonly ownerConfirmationRequired: true;
}

export interface EditorialV2RecoveryPlan {
  readonly planId: string;
  readonly projectId: string;
  readonly required: boolean;
  readonly preferredCandidate: "none" | "last_known_good" | "latest_valid_history";
  readonly candidateRevision: number | null;
  readonly preserveCorruptedCurrent: true;
  readonly ownerConfirmationRequired: true;
  readonly automaticExecution: false;
}

export async function inspectProjectRecoveryState(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
): Promise<EditorialV2RecoveryState> {
  const inspection = await inspectEditorialV2ProjectCandidates(configuration, projectId);
  return {
    projectId,
    currentValid: inspection.currentValid,
    currentCorrupted: inspection.currentCorrupted,
    lastKnownGoodAvailable: inspection.lastKnownGood !== null,
    historyCandidateRevisions: inspection.validHistory.map((snapshot) => snapshot.revision),
    automaticRecoveryAllowed: false,
    ownerConfirmationRequired: true,
  };
}

export function compareProjectRevisions(
  left: EditorialV2ProjectSnapshot,
  right: EditorialV2ProjectSnapshot,
): EditorialV2RevisionComparison {
  const leftStages = new Set(left.approvedCheckpoints.map((entry) => entry.stageId));
  const rightStages = new Set(right.approvedCheckpoints.map((entry) => entry.stageId));
  return {
    leftRevision: left.revision,
    rightRevision: right.revision,
    sameIntegrityHash: left.integrity.canonicalHash === right.integrity.canonicalHash,
    checkpointStageChanges: [...new Set([...leftStages, ...rightStages])].filter((stage) => leftStages.has(stage) !== rightStages.has(stage)).sort(),
    rawArtifactCountDelta: right.rawArtifacts.length - left.rawArtifacts.length,
  };
}

export function buildProjectRecoveryPlan(state: EditorialV2RecoveryState): EditorialV2RecoveryPlan {
  const preferredCandidate = state.currentCorrupted && state.lastKnownGoodAvailable
    ? "last_known_good"
    : state.currentCorrupted && state.historyCandidateRevisions.length > 0
      ? "latest_valid_history"
      : "none";
  const candidateRevision = preferredCandidate === "latest_valid_history"
    ? Math.max(...state.historyCandidateRevisions)
    : null;
  const identity = JSON.stringify({ ...state, preferredCandidate, candidateRevision });
  return {
    planId: `recovery-plan-${createHash("sha256").update(identity, "utf8").digest("hex").slice(0, 16)}`,
    projectId: state.projectId,
    required: state.currentCorrupted,
    preferredCandidate,
    candidateRevision,
    preserveCorruptedCurrent: true,
    ownerConfirmationRequired: true,
    automaticExecution: false,
  };
}

export async function recoverFromLastKnownGood(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
  input: {
    readonly ownerConfirmed: boolean;
    readonly candidate: "last_known_good" | "latest_valid_history";
    readonly approvedAtIso: string;
  },
): Promise<EditorialV2RecoveryResult> {
  if (input.ownerConfirmed !== true) return { ok: false, projectId, recoveredRevision: null, source: "none", currentCorruptionPreserved: true, ownerConfirmed: false, status: "validation_error", message: "RECOVERY_OWNER_CONFIRMATION_REQUIRED" };
  const inspection = await inspectEditorialV2ProjectCandidates(configuration, projectId);
  if (inspection.currentValid) return { ok: false, projectId, recoveredRevision: null, source: "none", currentCorruptionPreserved: true, ownerConfirmed: true, status: "validation_error", message: "CURRENT_SNAPSHOT_IS_VALID" };
  const candidate = input.candidate === "last_known_good"
    ? inspection.lastKnownGood
    : inspection.validHistory[0] ?? null;
  if (!candidate) return { ok: false, projectId, recoveredRevision: null, source: "none", currentCorruptionPreserved: true, ownerConfirmed: true, status: "not_found", message: "RECOVERY_CANDIDATE_NOT_FOUND" };
  const write = await restoreEditorialV2ProjectCandidate(configuration, projectId, candidate, input.approvedAtIso);
  return {
    ok: write.ok,
    projectId,
    recoveredRevision: write.revision,
    source: input.candidate === "last_known_good" ? "last_known_good" : "history",
    currentCorruptionPreserved: true,
    ownerConfirmed: true,
    status: write.status,
    message: write.message,
  };
}
