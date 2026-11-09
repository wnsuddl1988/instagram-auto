"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  ApprovedCharacterMotionSessionSnapshot,
  ApprovedDetailedScriptSessionSnapshot,
  ApprovedPublishIntegrationSessionSnapshot,
  ApprovedRelaunchReadinessSessionSnapshot,
  ApprovedRenderIntegrationSessionSnapshot,
  ApprovedScenePlanningSessionSnapshot,
  ApprovedTrendBriefSessionSnapshot,
  EditorialV2ApprovedStageId,
  EditorialV2JsonValue,
  EditorialV2ProjectSnapshot,
} from "../../lib/editorial-v2/contracts";
import type {
  CharacterMotionDraftState,
  EditorialIntelligenceDraftState,
  EditorialV2DraftAutosaveStatus,
  EditorialV2DraftHydrationStatus,
  EditorialV2DraftStageId,
  EditorialV2DraftStageStateMap,
  EditorialV2FullDraftSnapshot,
  PublishIntegrationDraftState,
  RenderIntegrationDraftState,
  ResearchImportDraftState,
  SampleRelaunchDraftState,
  ScenePlanningDraftState,
} from "../../lib/editorial-v2/draft-contracts";
import { EDITORIAL_V2_DRAFT_AUTOSAVE_DEBOUNCE_MS } from "../../lib/editorial-v2/draft-contracts";
import type { EditorialV2ApprovedCheckpointOption } from "../../lib/editorial-v2/persistence-contracts";
import type { LocalPreviewPersistedProjectSummary } from "../../lib/editorial-v2/local-preview-contracts";
import { EditorialV2DraftApiError, loadEditorialV2Draft, saveEditorialV2Draft } from "../../lib/editorial-v2/draft-api-client";
import { buildEditorialV2FullDraftSnapshot, decideDraftHydration, sanitizeHydratedDraftApprovals } from "../../lib/editorial-v2/draft-snapshot";
import CharacterMotionWorkbench from "./CharacterMotionWorkbench";
import DraftAutosaveStatus from "./DraftAutosaveStatus";
import EditorialIntelligenceWorkbench from "./EditorialIntelligenceWorkbench";
import ResearchImportWorkbench from "./ResearchImportWorkbench";
import PublishIntegrationWorkbench from "./PublishIntegrationWorkbench";
import ProjectWorkspacePanel from "./ProjectWorkspacePanel";
import LocalPreviewRenderPanel from "./LocalPreviewRenderPanel";
import RenderIntegrationWorkbench from "./RenderIntegrationWorkbench";
import SampleRelaunchWorkbench from "./SampleRelaunchWorkbench";
import ScenePlanningWorkbench from "./ScenePlanningWorkbench";
import VoiceMaterializationPanel from "./VoiceMaterializationPanel";

type DraftHydrationPresentation = EditorialV2DraftHydrationStatus | "not_loaded" | "loading";
type WorkspaceFeatureState = "checking" | "enabled" | "disabled" | "error";

interface ApprovedStageSnapshots {
  readonly trendBrief: ApprovedTrendBriefSessionSnapshot | null;
  readonly script: ApprovedDetailedScriptSessionSnapshot | null;
  readonly planning: ApprovedScenePlanningSessionSnapshot | null;
  readonly character: ApprovedCharacterMotionSessionSnapshot | null;
  readonly render: ApprovedRenderIntegrationSessionSnapshot | null;
  readonly publish: ApprovedPublishIntegrationSessionSnapshot | null;
  readonly relaunch: ApprovedRelaunchReadinessSessionSnapshot | null;
}

function draftFingerprint(stageStates: EditorialV2DraftStageStateMap): string {
  return JSON.stringify(stageStates);
}

function checkpointPayload<T>(snapshot: EditorialV2ProjectSnapshot, stageId: EditorialV2ApprovedStageId): T | null {
  const checkpoint = snapshot.approvedCheckpoints.find((entry) => entry.stageId === stageId);
  return checkpoint ? JSON.parse(JSON.stringify(checkpoint.payload)) as T : null;
}

function approvedStageSnapshots(snapshot: EditorialV2ProjectSnapshot | null): ApprovedStageSnapshots {
  if (!snapshot) return { trendBrief: null, script: null, planning: null, character: null, render: null, publish: null, relaunch: null };
  return {
    trendBrief: checkpointPayload<ApprovedTrendBriefSessionSnapshot>(snapshot, "trend_brief_import"),
    script: checkpointPayload<ApprovedDetailedScriptSessionSnapshot>(snapshot, "editorial_intelligence"),
    planning: checkpointPayload<ApprovedScenePlanningSessionSnapshot>(snapshot, "scene_planning"),
    character: checkpointPayload<ApprovedCharacterMotionSessionSnapshot>(snapshot, "character_motion"),
    render: checkpointPayload<ApprovedRenderIntegrationSessionSnapshot>(snapshot, "render_integration"),
    publish: checkpointPayload<ApprovedPublishIntegrationSessionSnapshot>(snapshot, "publish_integration"),
    relaunch: checkpointPayload<ApprovedRelaunchReadinessSessionSnapshot>(snapshot, "relaunch_readiness"),
  };
}

function mountedDraftStageIds(snapshot: EditorialV2ProjectSnapshot | null): readonly EditorialV2DraftStageId[] {
  const checkpointStages = new Set(snapshot?.approvedCheckpoints.map((entry) => entry.stageId) ?? []);
  const stages: EditorialV2DraftStageId[] = ["trend_brief_import"];
  if (checkpointStages.has("trend_brief_import")) stages.push("editorial_intelligence");
  if (checkpointStages.has("editorial_intelligence")) stages.push("scene_planning");
  if (checkpointStages.has("scene_planning")) stages.push("character_motion");
  if (checkpointStages.has("editorial_intelligence") && checkpointStages.has("scene_planning") && checkpointStages.has("character_motion")) stages.push("render_integration");
  if (checkpointStages.has("render_integration")) stages.push("publish_integration");
  if (checkpointStages.has("publish_integration")) stages.push("relaunch_readiness");
  return stages;
}

function draftErrorMessage(error: unknown): string {
  if (error instanceof EditorialV2DraftApiError) return `${error.code}: ${error.message}`;
  return error instanceof Error ? error.message : "알 수 없는 local draft 오류";
}

export default function EditorialV2Workbench() {
  const [approvedSnapshot, setApprovedSnapshot] = useState<ApprovedTrendBriefSessionSnapshot | null>(null);
  const [approvedScriptSnapshot, setApprovedScriptSnapshot] = useState<ApprovedDetailedScriptSessionSnapshot | null>(null);
  const [approvedPlanningSnapshot, setApprovedPlanningSnapshot] = useState<ApprovedScenePlanningSessionSnapshot | null>(null);
  const [approvedCharacterSnapshot, setApprovedCharacterSnapshot] = useState<ApprovedCharacterMotionSessionSnapshot | null>(null);
  const [approvedRenderSnapshot, setApprovedRenderSnapshot] = useState<ApprovedRenderIntegrationSessionSnapshot | null>(null);
  const [approvedPublishSnapshot, setApprovedPublishSnapshot] = useState<ApprovedPublishIntegrationSessionSnapshot | null>(null);
  const [approvedRelaunchSnapshot, setApprovedRelaunchSnapshot] = useState<ApprovedRelaunchReadinessSessionSnapshot | null>(null);

  const [workspaceFeatureState, setWorkspaceFeatureState] = useState<WorkspaceFeatureState>("checking");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loadedApprovedSnapshot, setLoadedApprovedSnapshot] = useState<EditorialV2ProjectSnapshot | null>(null);
  const [persistedPreviewSummary, setPersistedPreviewSummary] = useState<LocalPreviewPersistedProjectSummary | null>(null);
  const [loadedDraft, setLoadedDraft] = useState<EditorialV2FullDraftSnapshot | null>(null);
  const [hydratedDraft, setHydratedDraft] = useState<EditorialV2FullDraftSnapshot | null>(null);
  const [stageDraftStates, setStageDraftStates] = useState<EditorialV2DraftStageStateMap>({});
  const [draftRevision, setDraftRevision] = useState<number | null>(null);
  const [draftHash, setDraftHash] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [hydrationStatus, setHydrationStatus] = useState<DraftHydrationPresentation>("not_loaded");
  const [autosaveStatus, setAutosaveStatus] = useState<EditorialV2DraftAutosaveStatus>("no_project");
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftHydrationEpoch, setDraftHydrationEpoch] = useState(0);

  const loadedApprovedSnapshotRef = useRef<EditorialV2ProjectSnapshot | null>(null);
  const stageDraftStatesRef = useRef<EditorialV2DraftStageStateMap>({});
  const draftRevisionRef = useRef(0);
  const autosaveStatusRef = useRef<EditorialV2DraftAutosaveStatus>("no_project");
  const lastPersistedFingerprintRef = useRef(draftFingerprint({}));
  const dirtyStageIdsRef = useRef(new Set<EditorialV2DraftStageId>());
  const hydrationGuardRef = useRef(false);
  const pendingHydrationStageIdsRef = useRef(new Set<EditorialV2DraftStageId>());
  const hydrationGenerationRef = useRef(0);
  const loadSequenceRef = useRef(0);
  const saveSequenceRef = useRef(0);

  const updateAutosaveStatus = useCallback((status: EditorialV2DraftAutosaveStatus): void => {
    autosaveStatusRef.current = status;
    setAutosaveStatus(status);
  }, []);

  const armHydrationGuard = useCallback((project: EditorialV2ProjectSnapshot | null): void => {
    hydrationGenerationRef.current += 1;
    hydrationGuardRef.current = true;
    pendingHydrationStageIdsRef.current = new Set(mountedDraftStageIds(project));
  }, []);

  useEffect(() => () => {
    hydrationGenerationRef.current += 1;
    pendingHydrationStageIdsRef.current.clear();
    loadSequenceRef.current += 1;
    saveSequenceRef.current += 1;
  }, []);

  const setStageStatesWithoutDirty = useCallback((stageStates: EditorialV2DraftStageStateMap): void => {
    stageDraftStatesRef.current = stageStates;
    setStageDraftStates(stageStates);
    dirtyStageIdsRef.current.clear();
    lastPersistedFingerprintRef.current = draftFingerprint(stageStates);
  }, []);

  const clearDraftPresentation = useCallback((status: EditorialV2DraftAutosaveStatus): void => {
    setLoadedDraft(null);
    setHydratedDraft(null);
    setStageStatesWithoutDirty({});
    draftRevisionRef.current = 0;
    setDraftRevision(null);
    setDraftHash(null);
    setLastSavedAt(null);
    setHydrationStatus("not_loaded");
    setConflictMessage(null);
    setDraftError(null);
    updateAutosaveStatus(status);
    setDraftHydrationEpoch((value) => value + 1);
  }, [setStageStatesWithoutDirty, updateAutosaveStatus]);

  const loadDraftForProject = useCallback(async (project: EditorialV2ProjectSnapshot): Promise<void> => {
    const sequence = ++loadSequenceRef.current;
    saveSequenceRef.current += 1;
    armHydrationGuard(project);
    setHydrationStatus("loading");
    setConflictMessage(null);
    setDraftError(null);
    updateAutosaveStatus("loading");
    try {
      const result = await loadEditorialV2Draft(project.projectId);
      if (sequence !== loadSequenceRef.current || loadedApprovedSnapshotRef.current?.projectId !== project.projectId) return;
      if (!result.draft) {
        armHydrationGuard(project);
        setLoadedDraft(null);
        setHydratedDraft(null);
        setStageStatesWithoutDirty({});
        draftRevisionRef.current = 0;
        setDraftRevision(null);
        setDraftHash(null);
        setLastSavedAt(null);
        setHydrationStatus("not_loaded");
        updateAutosaveStatus("hydrating");
        setDraftHydrationEpoch((value) => value + 1);
        return;
      }
      setLoadedDraft(result.draft);
      const decision = await decideDraftHydration(result.draft, project);
      if (sequence !== loadSequenceRef.current || loadedApprovedSnapshotRef.current?.projectId !== project.projectId) return;
      setHydrationStatus(decision.status);
      draftRevisionRef.current = result.draft.draftRevision;
      setDraftRevision(result.draft.draftRevision);
      setDraftHash(result.draft.draftHash);
      setLastSavedAt(result.draft.savedAtIso);
      if (!decision.safe || !decision.autoHydrate || !decision.draft) {
        armHydrationGuard(project);
        setHydratedDraft(null);
        setStageStatesWithoutDirty({});
        setConflictMessage(decision.reasons.join(", "));
        updateAutosaveStatus(decision.status === "corrupted_draft" ? "corrupted" : "conflict");
        setDraftHydrationEpoch((value) => value + 1);
        return;
      }
      armHydrationGuard(project);
      setHydratedDraft(decision.draft);
      setStageStatesWithoutDirty(decision.draft.stageStates);
      updateAutosaveStatus("hydrating");
      setDraftHydrationEpoch((value) => value + 1);
    } catch (error) {
      if (sequence !== loadSequenceRef.current) return;
      const code = error instanceof EditorialV2DraftApiError ? error.code : "DRAFT_LOAD_FAILED";
      setLoadedDraft(null);
      setHydratedDraft(null);
      setStageStatesWithoutDirty({});
      setDraftError(draftErrorMessage(error));
      if (code === "LOCAL_PERSISTENCE_DISABLED") {
        setHydrationStatus("not_loaded");
        updateAutosaveStatus("disabled");
      } else if (code === "DRAFT_CORRUPTED" || code === "integrity_conflict") {
        setHydrationStatus("corrupted_draft");
        setConflictMessage("손상된 current draft는 자동 복구·덮어쓰기하지 않습니다.");
        updateAutosaveStatus("corrupted");
      } else {
        setHydrationStatus("not_loaded");
        updateAutosaveStatus("error");
      }
      setDraftHydrationEpoch((value) => value + 1);
    }
  }, [armHydrationGuard, setStageStatesWithoutDirty, updateAutosaveStatus]);

  const applyApprovedProject = useCallback((snapshot: EditorialV2ProjectSnapshot | null): void => {
    armHydrationGuard(snapshot);
    loadSequenceRef.current += 1;
    saveSequenceRef.current += 1;
    loadedApprovedSnapshotRef.current = snapshot;
    setLoadedApprovedSnapshot(snapshot);
    if (snapshot) setSelectedProjectId(snapshot.projectId);
    const canonical = approvedStageSnapshots(snapshot);
    setApprovedSnapshot(canonical.trendBrief);
    setApprovedScriptSnapshot(canonical.script);
    setApprovedPlanningSnapshot(canonical.planning);
    setApprovedCharacterSnapshot(canonical.character);
    setApprovedRenderSnapshot(canonical.render);
    setApprovedPublishSnapshot(canonical.publish);
    setApprovedRelaunchSnapshot(canonical.relaunch);
    if (!snapshot) clearDraftPresentation(selectedProjectId ? "no_project" : "no_project");
  }, [armHydrationGuard, clearDraftPresentation, selectedProjectId]);

  useEffect(() => {
    if (!loadedApprovedSnapshot) return;
    void loadDraftForProject(loadedApprovedSnapshot);
  }, [loadDraftForProject, loadedApprovedSnapshot]);

  const recordDraftStage = useCallback(<K extends keyof EditorialV2DraftStageStateMap>(stageId: K, state: NonNullable<EditorialV2DraftStageStateMap[K]>): void => {
    const current = stageDraftStatesRef.current;
    const unchanged = JSON.stringify(current[stageId]) === JSON.stringify(state);
    if (!unchanged) {
      const next = { ...current, [stageId]: state };
      stageDraftStatesRef.current = next;
      setStageDraftStates(next);
    }
    if (hydrationGuardRef.current) {
      pendingHydrationStageIdsRef.current.delete(stageId as EditorialV2DraftStageId);
      if (pendingHydrationStageIdsRef.current.size === 0) {
        const generation = hydrationGenerationRef.current;
        globalThis.queueMicrotask(() => {
          if (generation !== hydrationGenerationRef.current || pendingHydrationStageIdsRef.current.size !== 0) return;
          hydrationGuardRef.current = false;
          dirtyStageIdsRef.current.clear();
          lastPersistedFingerprintRef.current = draftFingerprint(stageDraftStatesRef.current);
          if (autosaveStatusRef.current === "hydrating") updateAutosaveStatus("clean");
        });
      }
      return;
    }
    if (unchanged) return;
    dirtyStageIdsRef.current.add(stageId as EditorialV2DraftStageId);
    const status = autosaveStatusRef.current;
    if (loadedApprovedSnapshotRef.current && !["disabled", "loading", "hydrating", "saving", "conflict", "corrupted"].includes(status)) {
      updateAutosaveStatus("unsaved_changes");
      setDraftError(null);
    }
  }, [updateAutosaveStatus]);

  const handleResearchDraft = useCallback((state: ResearchImportDraftState) => recordDraftStage("trend_brief_import", state), [recordDraftStage]);
  const handleIntelligenceDraft = useCallback((state: EditorialIntelligenceDraftState) => recordDraftStage("editorial_intelligence", state), [recordDraftStage]);
  const handleSceneDraft = useCallback((state: ScenePlanningDraftState) => recordDraftStage("scene_planning", state), [recordDraftStage]);
  const handleCharacterDraft = useCallback((state: CharacterMotionDraftState) => recordDraftStage("character_motion", state), [recordDraftStage]);
  const handleRenderDraft = useCallback((state: RenderIntegrationDraftState) => recordDraftStage("render_integration", state), [recordDraftStage]);
  const handlePublishDraft = useCallback((state: PublishIntegrationDraftState) => recordDraftStage("publish_integration", state), [recordDraftStage]);
  const handleRelaunchDraft = useCallback((state: SampleRelaunchDraftState) => recordDraftStage("relaunch_readiness", state), [recordDraftStage]);

  const saveCurrentDraft = useCallback(async (): Promise<void> => {
    const project = loadedApprovedSnapshotRef.current;
    const status = autosaveStatusRef.current;
    if (!project || workspaceFeatureState !== "enabled" || ["disabled", "no_project", "loading", "hydrating", "saving", "conflict", "corrupted"].includes(status)) return;
    const snapshotStates = stageDraftStatesRef.current;
    const fingerprint = draftFingerprint(snapshotStates);
    if (fingerprint === lastPersistedFingerprintRef.current && dirtyStageIdsRef.current.size === 0) {
      updateAutosaveStatus("clean");
      return;
    }
    const sequence = ++saveSequenceRef.current;
    const expectedRevision = draftRevisionRef.current;
    const savedAtIso = new Date().toISOString();
    updateAutosaveStatus("saving");
    setConflictMessage(null);
    setDraftError(null);
    try {
      const requestedDraft = await buildEditorialV2FullDraftSnapshot({
        projectId: project.projectId,
        draftRevision: expectedRevision,
        baseProjectRevision: project.revision,
        baseApprovedStage: project.lastApprovedStage,
        baseApprovedCheckpointHash: project.integrity.canonicalHash,
        savedAtIso,
        stageStates: snapshotStates,
        dirtyStageIds: [...dirtyStageIdsRef.current],
      });
      const nonCanonicalDraft = await sanitizeHydratedDraftApprovals(requestedDraft, project);
      const result = await saveEditorialV2Draft(project.projectId, {
        projectId: project.projectId,
        expectedDraftRevision: expectedRevision,
        expectedBaseProjectRevision: project.revision,
        draft: nonCanonicalDraft,
      });
      if (sequence !== saveSequenceRef.current || loadedApprovedSnapshotRef.current?.projectId !== project.projectId) return;
      if (!result.ok || result.draftRevision === null || !result.draftHash) throw new Error(result.message);
      draftRevisionRef.current = result.draftRevision;
      setDraftRevision(result.draftRevision);
      setDraftHash(result.draftHash);
      setLastSavedAt(savedAtIso);
      lastPersistedFingerprintRef.current = fingerprint;
      if (draftFingerprint(stageDraftStatesRef.current) === fingerprint) {
        dirtyStageIdsRef.current.clear();
        updateAutosaveStatus("saved");
      } else {
        updateAutosaveStatus("unsaved_changes");
      }
    } catch (error) {
      if (sequence !== saveSequenceRef.current) return;
      const apiError = error instanceof EditorialV2DraftApiError ? error : null;
      if (apiError && (apiError.code === "draft_revision_conflict" || apiError.code === "base_project_conflict" || apiError.status === 409)) {
        const conflict = apiError.details.conflict;
        setConflictMessage(conflict && typeof conflict === "object" ? JSON.stringify(conflict) : apiError.message);
        updateAutosaveStatus(apiError.code === "integrity_conflict" ? "corrupted" : "conflict");
      } else {
        setDraftError(draftErrorMessage(error));
        updateAutosaveStatus("error");
      }
    }
  }, [updateAutosaveStatus, workspaceFeatureState]);

  useEffect(() => {
    if (!loadedApprovedSnapshot || workspaceFeatureState !== "enabled" || autosaveStatus !== "unsaved_changes" || hydrationGuardRef.current) return;
    const timer = globalThis.setTimeout(() => void saveCurrentDraft(), EDITORIAL_V2_DRAFT_AUTOSAVE_DEBOUNCE_MS);
    return () => globalThis.clearTimeout(timer);
  }, [autosaveStatus, loadedApprovedSnapshot, saveCurrentDraft, stageDraftStates, workspaceFeatureState]);

  const reloadSavedDraft = useCallback((): void => {
    const project = loadedApprovedSnapshotRef.current;
    if (project) void loadDraftForProject(project);
  }, [loadDraftForProject]);

  const startFromApprovedCheckpoint = useCallback((): void => {
    const project = loadedApprovedSnapshotRef.current;
    if (!project) return;
    armHydrationGuard(project);
    setHydratedDraft(null);
    setStageStatesWithoutDirty({});
    setHydrationStatus("not_loaded");
    setConflictMessage(null);
    setDraftError(null);
    updateAutosaveStatus("hydrating");
    setDraftHydrationEpoch((value) => value + 1);
  }, [armHydrationGuard, setStageStatesWithoutDirty, updateAutosaveStatus]);

  const approvedCheckpointOptions = useMemo((): readonly EditorialV2ApprovedCheckpointOption[] => {
    const options: EditorialV2ApprovedCheckpointOption[] = [];
    const payload = (value: unknown): EditorialV2JsonValue => JSON.parse(JSON.stringify(value)) as EditorialV2JsonValue;
    if (approvedSnapshot) options.push({ stageId: "trend_brief_import", label: "Trend Brief Import", sourceIdentity: `${approvedSnapshot.rawHash}:${approvedSnapshot.normalizedHash}`, payload: payload(approvedSnapshot) });
    if (approvedScriptSnapshot) options.push({ stageId: "editorial_intelligence", label: "Editorial Intelligence / Script", sourceIdentity: `${approvedScriptSnapshot.scriptNormalizedHash}:${approvedScriptSnapshot.evidenceIdentity}`, payload: payload(approvedScriptSnapshot) });
    if (approvedPlanningSnapshot) options.push({ stageId: "scene_planning", label: "Scene Planning", sourceIdentity: `${approvedPlanningSnapshot.approvedScriptNormalizedHash}:${approvedPlanningSnapshot.selectedAngleId}`, payload: payload(approvedPlanningSnapshot) });
    if (approvedCharacterSnapshot) options.push({ stageId: "character_motion", label: "Character Motion", sourceIdentity: `${approvedCharacterSnapshot.sourcePlanningIdentity}:${approvedCharacterSnapshot.selectedDirectionId}`, payload: payload(approvedCharacterSnapshot) });
    if (approvedRenderSnapshot) options.push({ stageId: "render_integration", label: "Render Integration", sourceIdentity: `${approvedRenderSnapshot.renderManifest.manifestHash}:${approvedRenderSnapshot.bridgePlan.manifestHash}`, payload: payload(approvedRenderSnapshot) });
    if (approvedPublishSnapshot) options.push({ stageId: "publish_integration", label: "Publish Integration", sourceIdentity: `${approvedPublishSnapshot.publishPackage.packageId}:${approvedPublishSnapshot.publishPackage.renderManifestHash}`, payload: payload(approvedPublishSnapshot) });
    if (approvedRelaunchSnapshot) options.push({ stageId: "relaunch_readiness", label: "Relaunch Readiness", sourceIdentity: `${approvedRelaunchSnapshot.sourcePublishIntegrationIdentity}:${approvedRelaunchSnapshot.relaunchPackage.packageId}`, payload: payload(approvedRelaunchSnapshot) });
    return options;
  }, [approvedCharacterSnapshot, approvedPlanningSnapshot, approvedPublishSnapshot, approvedRelaunchSnapshot, approvedRenderSnapshot, approvedScriptSnapshot, approvedSnapshot]);
  const currentSessionStage = (approvedCheckpointOptions.at(-1)?.stageId ?? null) as EditorialV2ApprovedStageId | null;
  const draftHydrationKey = `${selectedProjectId ?? "no-project"}:${draftHydrationEpoch}`;

  const handleApprovedTrendBriefChange = useCallback((snapshot: ApprovedTrendBriefSessionSnapshot | null): void => {
    if (hydrationGuardRef.current) return;
    setApprovedSnapshot(snapshot); setApprovedScriptSnapshot(null); setApprovedPlanningSnapshot(null); setApprovedCharacterSnapshot(null); setApprovedRenderSnapshot(null); setApprovedPublishSnapshot(null); setApprovedRelaunchSnapshot(null);
  }, []);
  const handleApprovedScriptChange = useCallback((snapshot: ApprovedDetailedScriptSessionSnapshot | null): void => {
    if (hydrationGuardRef.current) return;
    setApprovedScriptSnapshot(snapshot); setApprovedPlanningSnapshot(null); setApprovedCharacterSnapshot(null); setApprovedRenderSnapshot(null); setApprovedPublishSnapshot(null); setApprovedRelaunchSnapshot(null);
  }, []);
  const handleApprovedPlanningChange = useCallback((snapshot: ApprovedScenePlanningSessionSnapshot | null): void => {
    if (hydrationGuardRef.current) return;
    setApprovedPlanningSnapshot(snapshot); setApprovedCharacterSnapshot(null); setApprovedRenderSnapshot(null); setApprovedPublishSnapshot(null); setApprovedRelaunchSnapshot(null);
  }, []);
  const handleApprovedCharacterChange = useCallback((snapshot: ApprovedCharacterMotionSessionSnapshot | null): void => {
    if (hydrationGuardRef.current) return;
    setApprovedCharacterSnapshot(snapshot); setApprovedRenderSnapshot(null); setApprovedPublishSnapshot(null); setApprovedRelaunchSnapshot(null);
  }, []);
  const handleApprovedRenderChange = useCallback((snapshot: ApprovedRenderIntegrationSessionSnapshot | null): void => {
    if (hydrationGuardRef.current) return;
    setApprovedRenderSnapshot(snapshot); setApprovedPublishSnapshot(null); setApprovedRelaunchSnapshot(null);
  }, []);
  const handleApprovedPublishChange = useCallback((snapshot: ApprovedPublishIntegrationSessionSnapshot | null): void => {
    if (hydrationGuardRef.current) return;
    setApprovedPublishSnapshot(snapshot); setApprovedRelaunchSnapshot(null);
  }, []);
  const handleApprovedRelaunchChange = useCallback((snapshot: ApprovedRelaunchReadinessSessionSnapshot | null): void => {
    if (!hydrationGuardRef.current) setApprovedRelaunchSnapshot(snapshot);
  }, []);

  const intelligenceKey = `${approvedSnapshot ? `${approvedSnapshot.rawHash}:${approvedSnapshot.normalizedHash}` : "locked"}:${draftHydrationKey}`;
  const planningKey = `${approvedScriptSnapshot ? `${approvedScriptSnapshot.scriptNormalizedHash}:${approvedScriptSnapshot.evidenceIdentity}` : "locked"}:${draftHydrationKey}`;
  const characterKey = `${approvedPlanningSnapshot ? `${approvedPlanningSnapshot.approvedScriptNormalizedHash}:${approvedPlanningSnapshot.selectedAngleId}` : "locked"}:${draftHydrationKey}`;
  const renderKey = `${approvedCharacterSnapshot ? `${approvedCharacterSnapshot.sourcePlanningIdentity}:${approvedCharacterSnapshot.selectedDirectionId}` : "locked"}:${draftHydrationKey}`;
  const publishKey = `${approvedRenderSnapshot ? `${approvedRenderSnapshot.renderManifest.manifestHash}:${approvedRenderSnapshot.bridgePlan.manifestHash}` : "locked"}:${draftHydrationKey}`;
  const sampleRelaunchKey = `${approvedPublishSnapshot ? `${approvedPublishSnapshot.publishPackage.packageId}:${approvedPublishSnapshot.publishPackage.renderManifestHash}` : "locked"}:${draftHydrationKey}`;

  return (
    <div>
      <ProjectWorkspacePanel
        approvedCheckpoints={approvedCheckpointOptions}
        currentSessionStage={currentSessionStage}
        draftSummary={{ status: autosaveStatus, draftRevision, draftHash, lastSavedAt, hydrationStatus }}
        onFeatureStateChange={(state) => { setWorkspaceFeatureState(state); if (state === "disabled") updateAutosaveStatus("disabled"); }}
        onProjectSelectionChange={setSelectedProjectId}
        onApprovedProjectLoaded={applyApprovedProject}
        onPersistedPreviewSummaryChange={setPersistedPreviewSummary}
      />
      <DraftAutosaveStatus
        status={autosaveStatus}
        draftRevision={draftRevision}
        draftHash={draftHash}
        lastSavedAt={lastSavedAt}
        hydrationStatus={hydrationStatus}
        conflictMessage={conflictMessage}
        errorMessage={draftError}
        canSaveNow={Boolean(loadedApprovedSnapshot) && workspaceFeatureState === "enabled" && ["unsaved_changes", "error"].includes(autosaveStatus)}
        canReload={Boolean(loadedApprovedSnapshot) && !["loading", "hydrating", "saving"].includes(autosaveStatus)}
        canStartFromApproved={Boolean(loadedApprovedSnapshot) && !["loading", "saving"].includes(autosaveStatus)}
        onSaveNow={() => void saveCurrentDraft()}
        onReload={reloadSavedDraft}
        onStartFromApproved={startFromApprovedCheckpoint}
      />
      <LocalPreviewRenderPanel
        persistenceEnabled={workspaceFeatureState === "enabled"}
        persistedProject={persistedPreviewSummary}
        currentSessionRenderManifestHash={approvedRenderSnapshot?.renderManifest.manifestHash ?? null}
      />
      <VoiceMaterializationPanel
        persistenceEnabled={workspaceFeatureState === "enabled"}
        persistedProject={persistedPreviewSummary}
        currentSessionRenderManifestHash={approvedRenderSnapshot?.renderManifest.manifestHash ?? null}
      />
      <ResearchImportWorkbench key={`research:${draftHydrationKey}`} onApprovedImportChange={handleApprovedTrendBriefChange} initialDraftState={hydratedDraft?.stageStates.trend_brief_import ?? null} draftHydrationKey={draftHydrationKey} onDraftStateChange={handleResearchDraft} />
      <aside aria-live="polite" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px" }}>
        <strong>승인 권위 연결:</strong> {approvedSnapshot ? "승인 checkpoint의 Trend Brief가 Intelligence 단계를 엽니다." : "승인된 Trend Brief가 없어 Intelligence 단계가 잠겨 있습니다."}
        <p>Draft는 편집값만 복원하며 승인 단계나 downstream 접근 권한을 만들지 않습니다.</p>
      </aside>
      {approvedSnapshot && <EditorialIntelligenceWorkbench key={intelligenceKey} approvedSnapshot={approvedSnapshot} onApprovedScriptChange={handleApprovedScriptChange} initialDraftState={hydratedDraft?.stageStates.editorial_intelligence ?? null} draftHydrationKey={draftHydrationKey} onDraftStateChange={handleIntelligenceDraft} />}
      <aside aria-live="polite" style={{ maxWidth: 1180, margin: "24px auto 0", padding: "0 24px" }}><strong>Scene Planning 승인 연결:</strong> {approvedScriptSnapshot ? "승인 checkpoint의 Detailed Script가 전달됐습니다." : "승인된 Detailed Script Package가 없어 잠겨 있습니다."}<p>Draft hydration 후 approval 재확인이 필요합니다.</p></aside>
      {approvedScriptSnapshot && <ScenePlanningWorkbench key={planningKey} approvedScriptSnapshot={approvedScriptSnapshot} onApprovedScenePlanningChange={handleApprovedPlanningChange} initialDraftState={hydratedDraft?.stageStates.scene_planning ?? null} draftHydrationKey={draftHydrationKey} onDraftStateChange={handleSceneDraft} />}
      <aside aria-live="polite" style={{ maxWidth: 1180, margin: "24px auto 0", padding: "0 24px" }}><strong>Character Motion 승인 연결:</strong> {approvedPlanningSnapshot ? "승인 checkpoint의 Scene Planning snapshot이 전달됐습니다." : "승인된 Scene Planning이 없어 잠겨 있습니다."}<p>브라우저 내 SVG prototype이며 network·asset export·render는 없습니다.</p></aside>
      {approvedPlanningSnapshot && <CharacterMotionWorkbench key={characterKey} approvedScenePlanningSnapshot={approvedPlanningSnapshot} onApprovedCharacterMotionChange={handleApprovedCharacterChange} initialDraftState={hydratedDraft?.stageStates.character_motion ?? null} draftHydrationKey={draftHydrationKey} onDraftStateChange={handleCharacterDraft} />}
      <aside aria-live="polite" style={{ maxWidth: 1180, margin: "24px auto 0", padding: "0 24px" }}><strong>Render Integration 승인 연결:</strong> {approvedCharacterSnapshot ? "승인 checkpoint의 Character Motion snapshot이 전달됐습니다." : "승인된 Character Motion Package가 없어 잠겨 있습니다."}<p>External TTS·실제 render·network는 없습니다. 현재 approval: {approvedRenderSnapshot ? "APPROVED_CHECKPOINT_OR_CURRENT_SESSION" : "NOT_APPROVED"}</p></aside>
      {approvedScriptSnapshot && approvedPlanningSnapshot && approvedCharacterSnapshot && <RenderIntegrationWorkbench key={renderKey} approvedDetailedScriptSnapshot={approvedScriptSnapshot} approvedScenePlanningSnapshot={approvedPlanningSnapshot} approvedCharacterMotionSnapshot={approvedCharacterSnapshot} onApprovedRenderIntegrationChange={handleApprovedRenderChange} initialDraftState={hydratedDraft?.stageStates.render_integration ?? null} draftHydrationKey={draftHydrationKey} onDraftStateChange={handleRenderDraft} />}
      <aside aria-live="polite" style={{ maxWidth: 1180, margin: "24px auto 0", padding: "0 24px" }}><strong>Publish Integration 승인 연결:</strong> {approvedRenderSnapshot ? "승인 checkpoint의 Render Integration snapshot이 전달됐습니다." : "승인된 Render Integration Package가 없어 잠겨 있습니다."}<p>실제 계정 API·upload·publish·schedule·network는 없습니다. 현재 approval: {approvedPublishSnapshot ? "APPROVED_CHECKPOINT_OR_CURRENT_SESSION" : "NOT_APPROVED"}</p></aside>
      {approvedRenderSnapshot && <PublishIntegrationWorkbench key={publishKey} approvedRenderIntegrationSnapshot={approvedRenderSnapshot} onApprovedPublishIntegrationChange={handleApprovedPublishChange} initialDraftState={hydratedDraft?.stageStates.publish_integration ?? null} draftHydrationKey={draftHydrationKey} onDraftStateChange={handlePublishDraft} />}
      <aside aria-live="polite" style={{ maxWidth: 1180, margin: "24px auto 0", padding: "0 24px" }}><strong>Relaunch 승인 연결:</strong> {approvedPublishSnapshot ? "승인 checkpoint의 Publish Integration snapshot이 전달됐습니다." : "승인된 Publish Integration Package가 없어 잠겨 있습니다."}<p>Synthetic local proof only · 실제 publish 없음 · Production Activation은 ChatGPT Control Tower 승인 대상입니다. 현재 approval: {approvedRelaunchSnapshot ? "PROVISIONALLY_APPROVED_CHECKPOINT_OR_SESSION" : "NOT_APPROVED"}</p></aside>
      {approvedPublishSnapshot && <SampleRelaunchWorkbench key={sampleRelaunchKey} approvedPublishIntegrationSnapshot={approvedPublishSnapshot} onApprovedRelaunchReadinessChange={handleApprovedRelaunchChange} initialDraftState={hydratedDraft?.stageStates.relaunch_readiness ?? null} draftHydrationKey={draftHydrationKey} onDraftStateChange={handleRelaunchDraft} />}
      <span hidden data-pa2-loaded-draft={loadedDraft ? "yes" : "no"} data-pa2-stage-count={Object.keys(stageDraftStates).length} />
    </div>
  );
}
