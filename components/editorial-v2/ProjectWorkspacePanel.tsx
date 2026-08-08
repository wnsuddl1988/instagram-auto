"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  EditorialV2ApprovedStageId,
  EditorialV2ProjectIndexEntry,
  EditorialV2ProjectSnapshot,
} from "../../lib/editorial-v2/contracts";
import type { EditorialV2ApprovedCheckpointOption } from "../../lib/editorial-v2/persistence-contracts";
import { EDITORIAL_V2_APPROVED_STAGE_ORDER } from "../../lib/editorial-v2/persistence-contracts";
import {
  EditorialV2ProjectApiError,
  archiveEditorialV2Project,
  createEditorialV2Project,
  listEditorialV2Projects,
  loadEditorialV2Project,
  requestEditorialV2Recovery,
  saveEditorialV2ApprovedCheckpoint,
} from "../../lib/editorial-v2/project-api-client";
import styles from "./ProjectWorkspacePanel.module.css";

interface ProjectWorkspacePanelProps {
  readonly approvedCheckpoints: readonly EditorialV2ApprovedCheckpointOption[];
  readonly currentSessionStage: EditorialV2ApprovedStageId | null;
}

type FeatureState = "checking" | "enabled" | "disabled" | "error";

function messageFrom(error: unknown): string {
  if (error instanceof EditorialV2ProjectApiError) return `${error.code}: ${error.message}`;
  return error instanceof Error ? error.message : "알 수 없는 로컬 persistence 오류";
}

function stageIndex(stageId: EditorialV2ApprovedStageId | null): number {
  return stageId === null ? -1 : EDITORIAL_V2_APPROVED_STAGE_ORDER.indexOf(stageId);
}

export default function ProjectWorkspacePanel({
  approvedCheckpoints,
  currentSessionStage,
}: ProjectWorkspacePanelProps) {
  const [featureState, setFeatureState] = useState<FeatureState>("checking");
  const [projects, setProjects] = useState<readonly EditorialV2ProjectIndexEntry[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loadedSnapshot, setLoadedSnapshot] = useState<EditorialV2ProjectSnapshot | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [creationTimestampIso, setCreationTimestampIso] = useState(() => new Date().toISOString());
  const [selectedStageId, setSelectedStageId] = useState<EditorialV2ApprovedStageId | "">("");
  const [saveConfirmed, setSaveConfirmed] = useState(false);
  const [archiveConfirmed, setArchiveConfirmed] = useState(false);
  const [recoveryConfirmed, setRecoveryConfirmed] = useState(false);
  const [recoveryCandidate, setRecoveryCandidate] = useState<"last_known_good" | "latest_valid_history">("last_known_good");
  const [recoveryRequired, setRecoveryRequired] = useState(false);
  const [recoveryPlanMessage, setRecoveryPlanMessage] = useState("정상 snapshot이면 복구가 필요하지 않습니다.");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Local persistence feature 상태를 확인하고 있습니다.");

  const activeProjects = projects.filter((project) => project.status === "active");
  const archivedProjects = projects.filter((project) => project.status === "archived");
  const loadedStageIndex = stageIndex(loadedSnapshot?.lastApprovedStage ?? null);
  const savableCheckpoints = useMemo(
    () => approvedCheckpoints.filter((candidate) => {
      const index = stageIndex(candidate.stageId);
      return index === loadedStageIndex || index === loadedStageIndex + 1;
    }),
    [approvedCheckpoints, loadedStageIndex],
  );
  const selectedCheckpoint = savableCheckpoints.find((candidate) => candidate.stageId === selectedStageId) ?? null;
  const currentLoadedComparison = loadedSnapshot
    ? stageIndex(currentSessionStage) === stageIndex(loadedSnapshot.lastApprovedStage)
      ? "현재 세션 승인 단계와 저장된 마지막 승인 단계가 같습니다."
      : "현재 세션과 저장된 checkpoint 단계가 다릅니다. 자동 hydration은 수행하지 않습니다."
    : "불러온 checkpoint가 없습니다.";

  async function refreshProjects(preferredProjectId?: string): Promise<void> {
    try {
      const next = await listEditorialV2Projects();
      setProjects(next);
      setFeatureState("enabled");
      setMessage("Local-only approved-checkpoint persistence가 활성화됐습니다.");
      if (preferredProjectId) setSelectedProjectId(preferredProjectId);
    } catch (error) {
      if (error instanceof EditorialV2ProjectApiError && error.code === "LOCAL_PERSISTENCE_DISABLED") {
        setFeatureState("disabled");
        setMessage("Feature flag가 OFF입니다. 승인 checkpoint는 저장되지 않습니다.");
      } else {
        setFeatureState("error");
        setMessage(messageFrom(error));
      }
    }
  }

  useEffect(() => {
    void refreshProjects();
  }, []);

  useEffect(() => {
    if (savableCheckpoints.length === 0) {
      setSelectedStageId("");
      return;
    }
    if (!savableCheckpoints.some((candidate) => candidate.stageId === selectedStageId)) setSelectedStageId(savableCheckpoints[0].stageId);
  }, [savableCheckpoints, selectedStageId]);

  async function createProject(): Promise<void> {
    setBusy(true);
    try {
      const result = await createEditorialV2Project({ displayName, creationTimestampIso });
      if (!result.ok || !result.projectId) throw new Error(result.message);
      await refreshProjects(result.projectId);
      const snapshot = await loadEditorialV2Project(result.projectId);
      setLoadedSnapshot(snapshot);
      setDisplayName("");
      setCreationTimestampIso(new Date().toISOString());
      setMessage(`프로젝트를 생성했습니다. revision ${snapshot.revision}`);
    } catch (error) {
      setMessage(messageFrom(error));
    } finally {
      setBusy(false);
    }
  }

  async function loadProject(): Promise<void> {
    if (!selectedProjectId) return;
    setBusy(true);
    try {
      const snapshot = await loadEditorialV2Project(selectedProjectId);
      setLoadedSnapshot(snapshot);
      setRecoveryRequired(false);
      setRecoveryPlanMessage("현재 snapshot integrity가 정상입니다. 복구는 실행하지 않습니다.");
      setMessage(`프로젝트를 불러왔습니다. revision ${snapshot.revision}`);
    } catch (error) {
      setLoadedSnapshot(null);
      if (error instanceof EditorialV2ProjectApiError && error.code === "integrity_conflict") {
        const plan = error.details.recoveryPlan;
        const state = error.details.recoveryState;
        if (plan && typeof plan === "object" && state && typeof state === "object") {
          const planRecord = plan as Readonly<Record<string, unknown>>;
          const stateRecord = state as Readonly<Record<string, unknown>>;
          const preferred = planRecord.preferredCandidate === "last_known_good" ? "last_known_good" : "latest_valid_history";
          setRecoveryCandidate(preferred);
          setRecoveryRequired(planRecord.required === true);
          setRecoveryPlanMessage(`Recovery plan ${String(planRecord.planId)} · preferred ${String(planRecord.preferredCandidate)} · last-known-good ${stateRecord.lastKnownGoodAvailable === true ? "AVAILABLE" : "UNAVAILABLE"} · history revisions ${Array.isArray(stateRecord.historyCandidateRevisions) ? stateRecord.historyCandidateRevisions.join(", ") || "none" : "unknown"} · 자동 실행 없음`);
        } else {
          setRecoveryRequired(true);
          setRecoveryPlanMessage("현재 snapshot corruption이 감지됐습니다. last-known-good 또는 valid history 후보와 Owner 확인이 필요합니다.");
        }
      } else {
        setRecoveryRequired(false);
      }
      setMessage(messageFrom(error));
    } finally {
      setBusy(false);
    }
  }

  async function saveCheckpoint(): Promise<void> {
    if (!selectedProjectId || !selectedCheckpoint) return;
    setBusy(true);
    try {
      const result = await saveEditorialV2ApprovedCheckpoint(selectedProjectId, {
        ownerConfirmed: saveConfirmed,
        checkpoint: {
          stageId: selectedCheckpoint.stageId,
          approvedAtIso: new Date().toISOString(),
          sourceIdentity: selectedCheckpoint.sourceIdentity,
          payload: selectedCheckpoint.payload,
        },
        rawArtifacts: [],
      });
      if (!result.ok) throw new Error(result.message);
      const snapshot = await loadEditorialV2Project(selectedProjectId);
      setLoadedSnapshot(snapshot);
      setSaveConfirmed(false);
      await refreshProjects(selectedProjectId);
      setMessage(`승인 checkpoint 저장 완료 · revision ${result.revision} · integrity ${result.integrityHash?.slice(0, 12)}`);
    } catch (error) {
      setMessage(messageFrom(error));
    } finally {
      setBusy(false);
    }
  }

  async function archiveProject(): Promise<void> {
    if (!selectedProjectId) return;
    setBusy(true);
    try {
      const result = await archiveEditorialV2Project(selectedProjectId, { action: "archive", ownerConfirmed: archiveConfirmed, archivedAtIso: new Date().toISOString() });
      if (!result.ok) throw new Error(result.message);
      setArchiveConfirmed(false);
      setLoadedSnapshot(null);
      await refreshProjects();
      setMessage("프로젝트를 삭제하지 않고 archived 상태로 전환했습니다.");
    } catch (error) {
      setMessage(messageFrom(error));
    } finally {
      setBusy(false);
    }
  }

  async function recoverProject(): Promise<void> {
    if (!selectedProjectId) return;
    setBusy(true);
    try {
      const result = await requestEditorialV2Recovery(selectedProjectId, { action: "recover", ownerConfirmed: recoveryConfirmed, candidate: recoveryCandidate, approvedAtIso: new Date().toISOString() });
      if (!result.ok) throw new Error(result.message);
      const snapshot = await loadEditorialV2Project(selectedProjectId);
      setLoadedSnapshot(snapshot);
      setRecoveryConfirmed(false);
      setRecoveryRequired(false);
      setRecoveryPlanMessage(`복구 완료 · source ${result.source} · corrupted current 보존 ${result.currentCorruptionPreserved ? "YES" : "NO"}`);
      await refreshProjects(selectedProjectId);
    } catch (error) {
      setMessage(messageFrom(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="project-workspace-title">
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>Production Activation PA-1 · Local only</p><h2 id="project-workspace-title">Project Workspace</h2></div>
        <span className={styles.status} data-state={featureState}>{featureState}</span>
      </header>
      <div className={styles.boundary}>
        <strong>승인 checkpoint 저장·복구만 지원</strong>
        <span>Full draft autosave: NOT IMPLEMENTED</span>
        <span>Workbench form hydration: NOT IMPLEMENTED</span>
        <span>V1 data: ISOLATED · data root path: HIDDEN</span>
      </div>
      <p role="status" aria-live="polite" className={styles.message}>{message}</p>

      <div className={styles.grid}>
        <article className={styles.card}>
          <h3>프로젝트 생성</h3>
          <label>프로젝트 이름<input value={displayName} maxLength={120} disabled={busy || featureState !== "enabled"} onChange={(event) => setDisplayName(event.target.value)} /></label>
          <label>Creation timestamp (canonical ISO)<input value={creationTimestampIso} disabled={busy || featureState !== "enabled"} onChange={(event) => setCreationTimestampIso(event.target.value)} /></label>
          <button type="button" disabled={busy || featureState !== "enabled" || !displayName.trim() || !creationTimestampIso.trim()} onClick={() => void createProject()}>Create local V2 project</button>
          <small>동일 이름과 동일 timestamp는 동일 deterministic ID를 만들며 duplicate 생성이 차단됩니다.</small>
        </article>

        <article className={styles.card}>
          <h3>프로젝트 목록·불러오기</h3>
          <label>Project<select value={selectedProjectId} disabled={busy || projects.length === 0} onChange={(event) => setSelectedProjectId(event.target.value)}><option value="">선택</option><optgroup label="Active">{activeProjects.map((project) => <option key={project.projectId} value={project.projectId}>{project.displayName} · r{project.revision} · {project.lastApprovedStage ?? "no checkpoint"}</option>)}</optgroup><optgroup label="Archived">{archivedProjects.map((project) => <option key={project.projectId} value={project.projectId}>{project.displayName} · archived</option>)}</optgroup></select></label>
          <button type="button" disabled={busy || !selectedProjectId} onClick={() => void loadProject()}>Load approved checkpoint summary</button>
          <small>불러오기는 snapshot 요약과 승인 단계만 표시합니다. 편집 중 draft를 UI에 자동 주입하지 않습니다.</small>
        </article>

        <article className={styles.card}>
          <h3>승인 checkpoint 저장</h3>
          <label>현재 저장 가능 stage<select value={selectedStageId} disabled={busy || !loadedSnapshot || savableCheckpoints.length === 0} onChange={(event) => setSelectedStageId(event.target.value as EditorialV2ApprovedStageId)}><option value="">선택</option>{savableCheckpoints.map((checkpoint) => <option key={checkpoint.stageId} value={checkpoint.stageId}>{checkpoint.label}</option>)}</select></label>
          <p>Checkpoint summary: {selectedCheckpoint?.sourceIdentity ?? "현재 순서에서 저장 가능한 승인 snapshot 없음"}</p>
          <p>Raw artifact count: 0 · 현재 callback은 raw text 본문을 노출하지 않으므로 hash만 포함된 snapshot과 별개입니다.</p>
          <label className={styles.confirm}><input type="checkbox" checked={saveConfirmed} disabled={busy} onChange={(event) => setSaveConfirmed(event.target.checked)} /> Owner가 이 승인 checkpoint 저장을 확인했습니다.</label>
          <button type="button" disabled={busy || !selectedProjectId || !selectedCheckpoint || !saveConfirmed} onClick={() => void saveCheckpoint()}>Save Approved Checkpoint</button>
        </article>

        <article className={styles.card}>
          <h3>불러온 snapshot·resume 안내</h3>
          {loadedSnapshot ? <dl className={styles.summary}><dt>Project ID</dt><dd>{loadedSnapshot.projectId}</dd><dt>Status</dt><dd>{loadedSnapshot.metadata.status}</dd><dt>Revision</dt><dd>{loadedSnapshot.revision}</dd><dt>Current stage</dt><dd>{loadedSnapshot.currentStage ?? "none"}</dd><dt>Last approved</dt><dd>{loadedSnapshot.lastApprovedStage ?? "none"}</dd><dt>Integrity</dt><dd>verified · {loadedSnapshot.integrity.canonicalHash.slice(0, 12)}</dd><dt>Approved stages</dt><dd>{loadedSnapshot.approvedCheckpoints.map((checkpoint) => checkpoint.stageId).join(" → ") || "none"}</dd></dl> : <p>불러온 프로젝트가 없습니다.</p>}
          <p>{currentLoadedComparison}</p>
          <strong>Resume from approved checkpoint:</strong><p>저장된 단계 요약을 기준으로 새 세션을 다시 시작할 수 있습니다. 전체 Workbench 상태가 복원됐다는 뜻은 아닙니다.</p>
        </article>

        <article className={styles.card}>
          <h3>무결성·복구 계획</h3>
          <p>{recoveryPlanMessage}</p>
          <label>Recovery candidate<select value={recoveryCandidate} disabled={busy} onChange={(event) => setRecoveryCandidate(event.target.value as "last_known_good" | "latest_valid_history")}><option value="last_known_good">Last-known-good</option><option value="latest_valid_history">Latest valid history</option></select></label>
          <label className={styles.confirm}><input type="checkbox" checked={recoveryConfirmed} disabled={busy} onChange={(event) => setRecoveryConfirmed(event.target.checked)} /> Owner가 corruption 복구 실행을 명시적으로 확인했습니다.</label>
          <button type="button" disabled={busy || !selectedProjectId || !recoveryConfirmed || !recoveryRequired} onClick={() => void recoverProject()}>Run approved recovery</button>
          <small>자동 복구·corrupted current 삭제는 하지 않습니다.</small>
        </article>

        <article className={styles.card}>
          <h3>Archive</h3>
          <p>Hard delete가 아닙니다. 프로젝트 directory와 revision history를 보존하고 상태만 archived로 바꿉니다.</p>
          <label className={styles.confirm}><input type="checkbox" checked={archiveConfirmed} disabled={busy} onChange={(event) => setArchiveConfirmed(event.target.checked)} /> Owner가 archive를 확인했습니다.</label>
          <button type="button" className={styles.secondary} disabled={busy || !selectedProjectId || !archiveConfirmed} onClick={() => void archiveProject()}>Archive without delete</button>
        </article>
      </div>
    </section>
  );
}
