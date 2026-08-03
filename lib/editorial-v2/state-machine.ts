import type {
  ArtifactApprovalStatus,
  ArtifactValidationStatus,
  EditorialV2ArtifactKind,
} from "./contracts";
import { EDITORIAL_V2_NAMESPACE } from "./schema-version";

export const EDITORIAL_V2_LIFECYCLE_STATES = [
  "draft",
  "normalized",
  "validated",
  "approval_pending",
  "approved",
  "invalidated",
] as const;

export type EditorialV2LifecycleState = (typeof EDITORIAL_V2_LIFECYCLE_STATES)[number];

export const EDITORIAL_V2_ALLOWED_TRANSITIONS = [
  ["draft", "normalized"],
  ["normalized", "validated"],
  ["normalized", "invalidated"],
  ["validated", "approval_pending"],
  ["validated", "invalidated"],
  ["approval_pending", "approved"],
  ["approval_pending", "invalidated"],
  ["approved", "invalidated"],
  ["invalidated", "draft"],
] as const satisfies readonly (readonly [EditorialV2LifecycleState, EditorialV2LifecycleState])[];

export function canTransition(
  from: EditorialV2LifecycleState,
  to: EditorialV2LifecycleState,
): boolean {
  return EDITORIAL_V2_ALLOWED_TRANSITIONS.some(
    ([allowedFrom, allowedTo]) => allowedFrom === from && allowedTo === to,
  );
}

export interface ArtifactTransitionInput {
  readonly from: EditorialV2LifecycleState;
  readonly to: EditorialV2LifecycleState;
  readonly validationStatus: ArtifactValidationStatus;
  readonly currentApprovalStatus: ArtifactApprovalStatus;
  readonly nextApprovalStatus: ArtifactApprovalStatus;
  readonly contentChanged: boolean;
  readonly upstreamContentHashChanged: boolean;
}

export interface ArtifactTransitionDecision {
  readonly allowed: boolean;
  readonly code:
    | "transition_allowed"
    | "transition_not_allowed"
    | "validation_required"
    | "approval_required"
    | "rejected_cannot_directly_approve"
    | "invalidation_required";
  readonly requiresInvalidation: boolean;
}

export function requiresInvalidationForApprovedChange(
  input: Pick<
    ArtifactTransitionInput,
    "from" | "contentChanged" | "upstreamContentHashChanged"
  >,
): boolean {
  return input.from === "approved" && (input.contentChanged || input.upstreamContentHashChanged);
}

export function evaluateArtifactTransition(
  input: ArtifactTransitionInput,
): ArtifactTransitionDecision {
  const requiresInvalidation = requiresInvalidationForApprovedChange(input);

  if (requiresInvalidation && input.to !== "invalidated") {
    return { allowed: false, code: "invalidation_required", requiresInvalidation: true };
  }

  if (input.currentApprovalStatus === "rejected" && input.to === "approved") {
    return {
      allowed: false,
      code: "rejected_cannot_directly_approve",
      requiresInvalidation: false,
    };
  }

  if (!canTransition(input.from, input.to)) {
    return { allowed: false, code: "transition_not_allowed", requiresInvalidation: false };
  }

  if (input.to === "approval_pending" && input.validationStatus !== "pass") {
    return { allowed: false, code: "validation_required", requiresInvalidation: false };
  }

  if (input.to === "approved" && input.nextApprovalStatus !== "approved") {
    return { allowed: false, code: "approval_required", requiresInvalidation: false };
  }

  return { allowed: true, code: "transition_allowed", requiresInvalidation };
}

export interface ArtifactDependencyIdentity {
  readonly artifactId: string;
  readonly contentHash: string;
}

export interface DownstreamArtifactIdInput {
  readonly projectId: string;
  readonly kind: EditorialV2ArtifactKind;
  readonly dependencies: readonly ArtifactDependencyIdentity[];
}

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function calculateDownstreamArtifactId(input: DownstreamArtifactIdInput): string {
  const dependencyIdentity = [...input.dependencies]
    .sort((left, right) => left.artifactId.localeCompare(right.artifactId))
    .map(({ artifactId, contentHash }) => `${artifactId}@${contentHash}`)
    .join("|");
  const digest = stableHash(
    `${EDITORIAL_V2_NAMESPACE}|${input.projectId}|${input.kind}|${dependencyIdentity}`,
  );
  return `${EDITORIAL_V2_NAMESPACE}:${input.projectId}:${input.kind}:${digest}`;
}

export function upstreamContentHashChanged(
  previous: readonly ArtifactDependencyIdentity[],
  current: readonly ArtifactDependencyIdentity[],
): boolean {
  const canonicalize = (items: readonly ArtifactDependencyIdentity[]) =>
    [...items]
      .sort((left, right) => left.artifactId.localeCompare(right.artifactId))
      .map(({ artifactId, contentHash }) => `${artifactId}@${contentHash}`)
      .join("|");

  return canonicalize(previous) !== canonicalize(current);
}
