import type { EditorialV2ProjectSnapshot } from "./contracts";
import type {
  CharacterMotionDraftState,
  EditorialIntelligenceDraftState,
  EditorialV2DraftBuildInput,
  EditorialV2DraftHydrationDecision,
  EditorialV2DraftStageId,
  EditorialV2DraftStageStateMap,
  EditorialV2DraftValidationIssue,
  EditorialV2DraftValidationSummary,
  EditorialV2FullDraftSnapshot,
  PublishIntegrationDraftState,
  RenderIntegrationDraftState,
  ResearchImportDraftState,
  SampleRelaunchDraftState,
  ScenePlanningDraftState,
} from "./draft-contracts";
import {
  EDITORIAL_V2_DRAFT_MAX_BYTES,
  EDITORIAL_V2_DRAFT_NAMESPACE,
  EDITORIAL_V2_DRAFT_SCHEMA_VERSION,
  EDITORIAL_V2_DRAFT_STAGE_ORDER,
} from "./draft-contracts";
import { sha256Utf8 } from "./import-session";
import { isEditorialV2ProjectId } from "./project-snapshot";

type JsonPrimitive = string | number | boolean | null;
type CanonicalJson = JsonPrimitive | readonly CanonicalJson[] | { readonly [key: string]: CanonicalJson };

function assertCanonicalJson(value: unknown, path: string, ancestors: Set<object>): asserts value is CanonicalJson {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`JSON_NON_FINITE_NUMBER:${path}`);
    return;
  }
  if (typeof value === "undefined" || typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") {
    throw new Error(`JSON_UNSUPPORTED_VALUE:${path}`);
  }
  if (typeof value !== "object") throw new Error(`JSON_UNSUPPORTED_VALUE:${path}`);
  if (ancestors.has(value)) throw new Error(`JSON_CYCLIC_OBJECT:${path}`);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== Array.prototype && prototype !== null) {
    throw new Error(`JSON_UNSUPPORTED_PROTOTYPE:${path}`);
  }
  ancestors.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertCanonicalJson(entry, `${path}[${index}]`, ancestors));
  } else {
    for (const [key, entry] of Object.entries(value)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") throw new Error(`JSON_PROTOTYPE_KEY_FORBIDDEN:${path}.${key}`);
      assertCanonicalJson(entry, `${path}.${key}`, ancestors);
    }
  }
  ancestors.delete(value);
}

function stableSerialize(value: CanonicalJson): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  const record = value as { readonly [key: string]: CanonicalJson };
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(",")}}`;
}

function cloneCanonical<T>(value: T): T {
  assertCanonicalJson(value, "$", new Set());
  return JSON.parse(stableSerialize(value)) as T;
}

function canonicalDraft(snapshot: EditorialV2FullDraftSnapshot): CanonicalJson {
  const canonical = {
    ...snapshot,
    draftHash: "",
    integrity: { ...snapshot.integrity, canonicalHash: "" },
  };
  assertCanonicalJson(canonical, "$", new Set());
  return canonical;
}

function isCanonicalIso(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

function sortedUniqueStageIds(values: readonly EditorialV2DraftStageId[]): readonly EditorialV2DraftStageId[] {
  const unique = [...new Set(values)];
  return EDITORIAL_V2_DRAFT_STAGE_ORDER.filter((stageId) => unique.includes(stageId));
}

function makeIssue(code: string, fieldPath: string, message: string): EditorialV2DraftValidationIssue {
  return { code, fieldPath, message, blocking: true };
}

export function stableStringifyDraft(snapshot: EditorialV2FullDraftSnapshot): string {
  return stableSerialize(canonicalDraft(snapshot));
}

export async function hashEditorialV2Draft(snapshot: EditorialV2FullDraftSnapshot): Promise<string> {
  return sha256Utf8(stableStringifyDraft(snapshot));
}

export function cloneEditorialV2FullDraftSnapshot(snapshot: EditorialV2FullDraftSnapshot): EditorialV2FullDraftSnapshot {
  return cloneCanonical(snapshot);
}

export async function buildEditorialV2FullDraftSnapshot(
  input: EditorialV2DraftBuildInput,
): Promise<EditorialV2FullDraftSnapshot> {
  const base: EditorialV2FullDraftSnapshot = {
    namespace: EDITORIAL_V2_DRAFT_NAMESPACE,
    schemaVersion: "1.0.0",
    draftSchemaVersion: EDITORIAL_V2_DRAFT_SCHEMA_VERSION,
    projectId: input.projectId,
    draftRevision: input.draftRevision,
    baseProjectRevision: input.baseProjectRevision,
    baseApprovedStage: input.baseApprovedStage,
    baseApprovedCheckpointHash: input.baseApprovedCheckpointHash,
    savedAtIso: input.savedAtIso,
    stageStates: cloneCanonical(input.stageStates),
    dirtyStageIds: sortedUniqueStageIds(input.dirtyStageIds),
    draftHash: "",
    integrity: { algorithm: "sha256", canonicalization: "stable-json-v1", canonicalHash: "" },
  };
  const hash = await hashEditorialV2Draft(base);
  const snapshot = { ...base, draftHash: hash, integrity: { ...base.integrity, canonicalHash: hash } };
  const validation = await validateEditorialV2Draft(snapshot);
  if (!validation.valid) throw new Error(validation.issues.map((issue) => issue.code).join(","));
  return cloneEditorialV2FullDraftSnapshot(snapshot);
}

export async function validateEditorialV2Draft(
  snapshot: EditorialV2FullDraftSnapshot,
): Promise<EditorialV2DraftValidationSummary> {
  const issues: EditorialV2DraftValidationIssue[] = [];
  if (snapshot.namespace !== EDITORIAL_V2_DRAFT_NAMESPACE) issues.push(makeIssue("draft_namespace_mismatch", "namespace", "Draft namespace가 올바르지 않습니다."));
  if (snapshot.schemaVersion !== "1.0.0" || snapshot.draftSchemaVersion !== EDITORIAL_V2_DRAFT_SCHEMA_VERSION) issues.push(makeIssue("draft_schema_mismatch", "draftSchemaVersion", "지원하지 않는 draft schema입니다."));
  if (!isEditorialV2ProjectId(snapshot.projectId)) issues.push(makeIssue("draft_project_id_invalid", "projectId", "Project ID가 올바르지 않습니다."));
  if (!Number.isSafeInteger(snapshot.draftRevision) || snapshot.draftRevision < 0) issues.push(makeIssue("draft_revision_invalid", "draftRevision", "Draft revision은 0 이상의 정수여야 합니다."));
  if (!Number.isSafeInteger(snapshot.baseProjectRevision) || snapshot.baseProjectRevision < 0) issues.push(makeIssue("draft_base_revision_invalid", "baseProjectRevision", "Base project revision이 올바르지 않습니다."));
  if (!/^[a-f0-9]{64}$/u.test(snapshot.baseApprovedCheckpointHash)) issues.push(makeIssue("draft_base_checkpoint_hash_invalid", "baseApprovedCheckpointHash", "Base approved checkpoint hash가 올바르지 않습니다."));
  if (!isCanonicalIso(snapshot.savedAtIso)) issues.push(makeIssue("draft_saved_at_invalid", "savedAtIso", "savedAtIso는 canonical ISO여야 합니다."));
  if (!snapshot.stageStates || typeof snapshot.stageStates !== "object" || Array.isArray(snapshot.stageStates)) {
    issues.push(makeIssue("draft_stage_states_invalid", "stageStates", "Stage state map이 올바르지 않습니다."));
  } else {
    for (const [key, state] of Object.entries(snapshot.stageStates)) {
      if (!(EDITORIAL_V2_DRAFT_STAGE_ORDER as readonly string[]).includes(key)) issues.push(makeIssue("draft_stage_key_unsupported", `stageStates.${key}`, "지원하지 않는 stage key입니다."));
      if (!state || typeof state !== "object" || Array.isArray(state) || state.stageId !== key) issues.push(makeIssue("draft_stage_identity_mismatch", `stageStates.${key}`, "Stage key와 state identity가 일치하지 않습니다."));
      if (state?.approvalAuthority !== "non_canonical_draft") issues.push(makeIssue("draft_authority_invalid", `stageStates.${key}.approvalAuthority`, "Draft는 canonical approval 권위를 가질 수 없습니다."));
    }
  }
  if (!Array.isArray(snapshot.dirtyStageIds)
    || snapshot.dirtyStageIds.some((stageId) => !(EDITORIAL_V2_DRAFT_STAGE_ORDER as readonly string[]).includes(stageId))
    || new Set(snapshot.dirtyStageIds).size !== snapshot.dirtyStageIds.length) {
    issues.push(makeIssue("draft_dirty_stage_ids_invalid", "dirtyStageIds", "dirtyStageIds가 올바르지 않습니다."));
  }
  if (snapshot.integrity?.algorithm !== "sha256" || snapshot.integrity?.canonicalization !== "stable-json-v1") issues.push(makeIssue("draft_integrity_contract_invalid", "integrity", "지원하지 않는 integrity contract입니다."));
  try {
    assertCanonicalJson(snapshot, "$", new Set());
    const bytes = new TextEncoder().encode(JSON.stringify(snapshot)).byteLength;
    if (bytes > EDITORIAL_V2_DRAFT_MAX_BYTES) issues.push(makeIssue("draft_size_limit_exceeded", "$", "Draft JSON 크기 제한을 초과했습니다."));
    const calculated = await hashEditorialV2Draft(snapshot);
    if (snapshot.draftHash !== calculated || snapshot.integrity?.canonicalHash !== calculated) issues.push(makeIssue("draft_integrity_mismatch", "integrity.canonicalHash", "Draft integrity hash가 일치하지 않습니다."));
  } catch (error) {
    issues.push(makeIssue("draft_json_unsupported", "$", error instanceof Error ? error.message : "지원하지 않는 JSON 값입니다."));
  }
  return { valid: issues.length === 0, issues };
}

function approvalLikeState(value: string): "not_approved" | "invalidated" | "pending_reconfirmation" {
  return value === "approved" || value === "provisionally_approved" || value === "provisional_approval"
    ? "pending_reconfirmation"
    : value === "invalidated" ? "invalidated" : "not_approved";
}

function sanitizeResearch(state: ResearchImportDraftState): ResearchImportDraftState {
  return { ...state, approvalLikeState: approvalLikeState(state.approvalState), approvalState: state.approvalState === "approved" ? "pending_reconfirmation" : state.approvalState };
}

function sanitizeIntelligence(state: EditorialIntelligenceDraftState): EditorialIntelligenceDraftState {
  const session = cloneCanonical(state.session);
  return {
    ...state,
    approvalLikeState: approvalLikeState(session.scriptApproval),
    session: {
      ...session,
      approvedTrendBrief: null,
      evidenceReview: { ...session.evidenceReview, status: session.evidenceReview.status === "approved" ? "not_reviewed" : session.evidenceReview.status },
      selectedAngleApproval: session.selectedAngleApproval === "approved" ? "invalidated" : session.selectedAngleApproval,
      scriptApproval: session.scriptApproval === "approved" ? "invalidated" : session.scriptApproval,
    },
  };
}

function sanitizeScene(state: ScenePlanningDraftState): ScenePlanningDraftState {
  const session = cloneCanonical(state.session);
  return {
    ...state,
    approvalLikeState: approvalLikeState(session.planningApproval),
    session: {
      ...session,
      approvedScript: null,
      sceneCardApproval: session.sceneCardApproval === "approved" ? "invalidated" : session.sceneCardApproval,
      planningApproval: session.planningApproval === "approved" ? "invalidated" : session.planningApproval,
    },
  };
}

function sanitizeCharacter(state: CharacterMotionDraftState): CharacterMotionDraftState {
  const session = cloneCanonical(state.session);
  return {
    ...state,
    approvalLikeState: session.approvedSnapshot ? "pending_reconfirmation" : state.approvalLikeState,
    session: {
      ...session,
      approvedPlanning: null,
      approvedSnapshot: null,
      selection: session.selection ? {
        ...session.selection,
        approvalState: session.selection.approvalState === "provisionally_approved" ? "invalidated" : session.selection.approvalState,
      } : null,
    },
  };
}

function sanitizeRender(state: RenderIntegrationDraftState): RenderIntegrationDraftState {
  return { ...state, approvalLikeState: state.approvedRenderKey || state.approvedVoiceKey ? "pending_reconfirmation" : state.approvalLikeState, approvedVoiceKey: null, approvedRenderKey: null, lastApprovedManifest: null };
}

function sanitizePublish(state: PublishIntegrationDraftState): PublishIntegrationDraftState {
  return { ...state, approvalLikeState: state.approvedPackageHash ? "pending_reconfirmation" : state.approvalLikeState, approvedPackageHash: null };
}

function sanitizeRelaunch(state: SampleRelaunchDraftState): SampleRelaunchDraftState {
  return {
    ...state,
    approvalLikeState: state.approvedIdentity ? "pending_reconfirmation" : state.approvalLikeState,
    approvedIdentity: null,
    acknowledgementStates: { productionGapsAcknowledged: false, controlTowerApprovalAcknowledged: false },
  };
}

function sanitizeStageStates(stageStates: EditorialV2DraftStageStateMap): EditorialV2DraftStageStateMap {
  return {
    ...(stageStates.trend_brief_import ? { trend_brief_import: sanitizeResearch(stageStates.trend_brief_import) } : {}),
    ...(stageStates.editorial_intelligence ? { editorial_intelligence: sanitizeIntelligence(stageStates.editorial_intelligence) } : {}),
    ...(stageStates.scene_planning ? { scene_planning: sanitizeScene(stageStates.scene_planning) } : {}),
    ...(stageStates.character_motion ? { character_motion: sanitizeCharacter(stageStates.character_motion) } : {}),
    ...(stageStates.render_integration ? { render_integration: sanitizeRender(stageStates.render_integration) } : {}),
    ...(stageStates.publish_integration ? { publish_integration: sanitizePublish(stageStates.publish_integration) } : {}),
    ...(stageStates.relaunch_readiness ? { relaunch_readiness: sanitizeRelaunch(stageStates.relaunch_readiness) } : {}),
  };
}

export async function sanitizeHydratedDraftApprovals(
  snapshot: EditorialV2FullDraftSnapshot,
  approvedProjectSnapshot: EditorialV2ProjectSnapshot,
): Promise<EditorialV2FullDraftSnapshot> {
  if (snapshot.projectId !== approvedProjectSnapshot.projectId) throw new Error("DRAFT_PROJECT_MISMATCH");
  return buildEditorialV2FullDraftSnapshot({
    projectId: snapshot.projectId,
    draftRevision: snapshot.draftRevision,
    baseProjectRevision: snapshot.baseProjectRevision,
    baseApprovedStage: snapshot.baseApprovedStage,
    baseApprovedCheckpointHash: snapshot.baseApprovedCheckpointHash,
    savedAtIso: snapshot.savedAtIso,
    stageStates: sanitizeStageStates(snapshot.stageStates),
    dirtyStageIds: snapshot.dirtyStageIds,
  });
}

export async function decideDraftHydration(
  draft: EditorialV2FullDraftSnapshot,
  projectSnapshot: EditorialV2ProjectSnapshot,
): Promise<EditorialV2DraftHydrationDecision> {
  if (draft.projectId !== projectSnapshot.projectId) return { status: "project_mismatch", safe: false, autoHydrate: false, approvalDowngraded: false, reasons: ["project_id_mismatch"], draft: null };
  if (draft.namespace !== EDITORIAL_V2_DRAFT_NAMESPACE || draft.draftSchemaVersion !== EDITORIAL_V2_DRAFT_SCHEMA_VERSION) return { status: "schema_mismatch", safe: false, autoHydrate: false, approvalDowngraded: false, reasons: ["draft_schema_mismatch"], draft: null };
  const validation = await validateEditorialV2Draft(draft);
  if (!validation.valid) return { status: "corrupted_draft", safe: false, autoHydrate: false, approvalDowngraded: false, reasons: validation.issues.map((issue) => issue.code), draft: null };
  if (draft.baseProjectRevision !== projectSnapshot.revision) return { status: "revision_conflict", safe: false, autoHydrate: false, approvalDowngraded: false, reasons: ["base_project_revision_mismatch"], draft: null };
  if (draft.baseApprovedCheckpointHash !== projectSnapshot.integrity.canonicalHash || draft.baseApprovedStage !== projectSnapshot.lastApprovedStage) return { status: "stale_draft", safe: false, autoHydrate: false, approvalDowngraded: false, reasons: ["base_approved_checkpoint_mismatch"], draft: null };
  const sanitized = await sanitizeHydratedDraftApprovals(draft, projectSnapshot);
  return { status: "safe_to_hydrate", safe: true, autoHydrate: true, approvalDowngraded: true, reasons: ["draft_approval_non_canonical", "canonical_approval_supplied_by_checkpoint_only"], draft: sanitized };
}
