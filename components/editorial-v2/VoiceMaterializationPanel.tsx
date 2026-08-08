"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { LocalPreviewPersistedProjectSummary } from "../../lib/editorial-v2/local-preview-contracts";
import type {
  VoiceMaterializationPlanPreview,
  VoiceMaterializationRecoveryPlan,
  VoiceMaterializationSet,
} from "../../lib/editorial-v2/voice-materialization-contracts";
import {
  PA4L_MAX_EXTERNAL_GENERATION_REQUESTS,
  PA4L_MAX_NARRATION_CHARACTERS,
  PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE,
} from "../../lib/editorial-v2/voice-materialization-contracts";
import {
  fetchMaterializedSceneAudio,
  getVoiceMaterializationStatus,
  previewVoiceMaterializationPlan,
  requestPa4lSingleSceneMaterialization,
  VoiceMaterializationApiError,
} from "../../lib/editorial-v2/voice-materialization-api-client";
import styles from "./VoiceMaterializationPanel.module.css";

interface VoiceMaterializationPanelProps {
  readonly persistenceEnabled: boolean;
  readonly persistedProject: LocalPreviewPersistedProjectSummary | null;
  readonly currentSessionRenderManifestHash: string | null;
}

type PanelPhase = "not_ready" | "configuration" | "previewing" | "plan_ready" | "materializing" | "partial_failure" | "approved" | "failed";

function messageFrom(error: unknown): string {
  if (error instanceof VoiceMaterializationApiError) return `${error.code}: ${error.message}`;
  return error instanceof Error ? error.message : "Voice materialization 오류";
}

export default function VoiceMaterializationPanel({
  persistenceEnabled,
  persistedProject,
  currentSessionRenderManifestHash,
}: VoiceMaterializationPanelProps) {
  const [voiceId, setVoiceId] = useState("");
  const [modelId, setModelId] = useState("");
  const [phase, setPhase] = useState<PanelPhase>("configuration");
  const [preview, setPreview] = useState<VoiceMaterializationPlanPreview | null>(null);
  const [set, setSet] = useState<VoiceMaterializationSet | null>(null);
  const [recovery, setRecovery] = useState<VoiceMaterializationRecoveryPlan | null>(null);
  const [paidConfirmed, setPaidConfirmed] = useState(false);
  const [message, setMessage] = useState("Voice ID와 model ID를 입력한 뒤 비용 발생 전 plan을 먼저 확인하세요.");
  const [audioUrls, setAudioUrls] = useState<Readonly<Record<string, string>>>({});
  const objectUrlsRef = useRef(new Map<string, string>());
  const sequenceRef = useRef(0);

  const canonicalMatch = Boolean(
    persistedProject?.renderCheckpointHash
    && persistedProject.renderManifestHash
    && currentSessionRenderManifestHash
    && persistedProject.renderManifestHash === currentSessionRenderManifestHash,
  );

  const revokeAudioUrls = useCallback(() => {
    for (const url of objectUrlsRef.current.values()) URL.revokeObjectURL(url);
    objectUrlsRef.current.clear();
    setAudioUrls({});
  }, []);

  useEffect(() => () => {
    sequenceRef.current += 1;
    for (const url of objectUrlsRef.current.values()) URL.revokeObjectURL(url);
    objectUrlsRef.current.clear();
  }, []);

  useEffect(() => {
    sequenceRef.current += 1;
    setPreview(null);
    setSet(null);
    setRecovery(null);
    setPaidConfirmed(false);
    revokeAudioUrls();
    const ready = persistenceEnabled && persistedProject?.projectStatus === "active" && canonicalMatch;
    setPhase(ready ? "configuration" : "not_ready");
    setMessage(ready ? "Provider configuration을 입력하고 external TTS plan을 preview하세요." : "Active persisted project와 현재 session의 canonical Render checkpoint 일치가 필요합니다.");
  }, [canonicalMatch, persistedProject?.projectId, persistedProject?.projectRevision, persistedProject?.projectStatus, persistenceEnabled, revokeAudioUrls]);

  const invalidatePlan = useCallback((setter: (value: string) => void, value: string) => {
    setter(value);
    sequenceRef.current += 1;
    setPreview(null);
    setSet(null);
    setRecovery(null);
    setPaidConfirmed(false);
    revokeAudioUrls();
    setPhase("configuration");
    setMessage("Provider configuration이 변경되어 이전 plan과 유료 확인을 무효화했습니다.");
  }, [revokeAudioUrls]);

  const loadAudio = useCallback(async (projectId: string, materializationSet: VoiceMaterializationSet, sequence: number): Promise<void> => {
    revokeAudioUrls();
    const next: Record<string, string> = {};
    for (const scene of materializationSet.sceneEntries) {
      if (scene.status !== "cache_hit" && scene.status !== "generated") continue;
      const blob = await fetchMaterializedSceneAudio(projectId, materializationSet.materializationSetId, scene.sceneId, { timeoutMs: 30_000 });
      if (sequence !== sequenceRef.current) return;
      const url = URL.createObjectURL(blob);
      objectUrlsRef.current.set(scene.sceneId, url);
      next[scene.sceneId] = url;
    }
    if (sequence === sequenceRef.current) setAudioUrls(next);
  }, [revokeAudioUrls]);

  const refreshStatus = useCallback(async (projectId: string, materializationSetId: string, sequence: number): Promise<void> => {
    const status = await getVoiceMaterializationStatus(projectId, materializationSetId, { timeoutMs: 15_000 });
    if (sequence !== sequenceRef.current) return;
    setSet(status.set);
    setRecovery(status.recovery);
    await loadAudio(projectId, status.set, sequence);
    if (sequence !== sequenceRef.current) return;
    setPhase(status.set.approvalState === "approved" ? "approved" : status.set.failedSceneIds.length > 0 ? "partial_failure" : "plan_ready");
  }, [loadAudio]);

  async function previewPlan(): Promise<void> {
    if (!persistedProject || !canonicalMatch || !voiceId || !modelId) return;
    const sequence = ++sequenceRef.current;
    setPhase("previewing");
    setMessage("Canonical persisted Render checkpoint에서 narration plan을 계산합니다. External network는 호출하지 않습니다.");
    setPaidConfirmed(false);
    try {
      const found = await previewVoiceMaterializationPlan(persistedProject.projectId, voiceId, modelId, { timeoutMs: 15_000 });
      if (sequence !== sequenceRef.current) return;
      setPreview(found);
      setPhase("plan_ready");
      setMessage(`PA-4L plan ready · canonical 1 scene · 최대 ${found.maximumExternalRequests} external request · 실제 가격 UNKNOWN`);
      try {
        await refreshStatus(persistedProject.projectId, found.plan.materializationSetId, sequence);
      } catch (error) {
        if (!(error instanceof VoiceMaterializationApiError && error.code === "VOICE_MATERIALIZATION_SET_NOT_FOUND")) throw error;
      }
    } catch (error) {
      if (sequence !== sequenceRef.current) return;
      setPhase("failed");
      setMessage(messageFrom(error));
    }
  }

  async function materialize(): Promise<void> {
    if (!persistedProject?.renderCheckpointHash || !preview || !paidConfirmed) return;
    const selectedScene = preview.plan.scenes[0];
    if (!selectedScene) return;
    const sequence = ++sequenceRef.current;
    setPhase("materializing");
    setMessage("PA-4L canonical 1 Scene만 요청합니다. 첫 시도 후 성공·실패와 관계없이 추가 request와 retry는 없습니다.");
    try {
      const result = await requestPa4lSingleSceneMaterialization(persistedProject.projectId, {
        expectedProjectRevision: persistedProject.projectRevision,
        expectedRenderCheckpointHash: persistedProject.renderCheckpointHash,
        voiceId: preview.plan.voiceId,
        modelId: preview.plan.modelId,
        expectedPlanHash: preview.plan.planHash,
        ownerPaidExternalTtsConfirmation: true,
        requestedSceneIds: [selectedScene.sceneId],
      });
      if (sequence !== sequenceRef.current) return;
      setPaidConfirmed(false);
      setSet(result.set);
      await refreshStatus(persistedProject.projectId, result.set.materializationSetId, sequence);
      if (sequence !== sequenceRef.current) return;
      setMessage(result.stoppedOnFirstFailure ? "첫 외부 실패에서 중단했습니다. PA-4L에서는 재시도하지 않습니다." : "PA-4L single-scene technical package 조건을 계산했습니다.");
    } catch (error) {
      if (sequence !== sequenceRef.current) return;
      setPaidConfirmed(false);
      setPhase("failed");
      setMessage(messageFrom(error));
    }
  }

  const canPreview = persistenceEnabled && canonicalMatch && persistedProject?.projectStatus === "active" && voiceId.length > 0 && modelId.length > 0 && phase !== "previewing" && phase !== "materializing";
  const canMaterialize = Boolean(preview?.featureEnabled
    && preview.credentialConfigured
    && preview.plan.executionMode === PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE
    && preview.plan.scenes.length === 1
    && preview.plan.scenes[0]!.characterCount <= PA4L_MAX_NARRATION_CHARACTERS
    && preview.maximumExternalRequests === PA4L_MAX_EXTERNAL_GENERATION_REQUESTS
    && paidConfirmed
    && phase !== "materializing");
  const completeCount = set?.completeSceneIds.length ?? preview?.cacheHitSceneIds.length ?? 0;
  const statusRows = useMemo(() => set?.sceneEntries ?? preview?.plan.scenes.map((scene) => ({ ...scene, status: preview.cacheHitSceneIds.includes(scene.sceneId) ? "cache_hit" : "pending", durationMs: null, alignmentStatus: "not_available", audioSha256: null, subtitleCueCount: 0, retryable: false })) ?? [], [preview, set]);

  return (
    <section className={styles.panel} aria-labelledby="voice-materialization-title" data-pa4-phase={phase} data-pa4l-mode={PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE} data-pa4-plan-hash={preview?.plan.planHash ?? "none"}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>PA-4L Live Smoke Mode · Paid external-call gate</p><h2 id="voice-materialization-title">Single-Scene External Voice Materialization</h2></div>
        <span className={styles.phase}>{phase.replaceAll("_", " ")}</span>
      </header>

      <div className={styles.silentBoundary} data-pa4-pa3-silent-boundary="true">
        <strong>PA-3 Preview 경계</strong>
        <span>현재 Local Preview는 PA-3의 silent placeholder audio를 사용합니다. 실제 생성 음성의 Preview 합성은 다음 Production Activation 범위입니다.</span>
      </div>
      <div className={styles.silentBoundary} data-pa4l-single-scene-boundary="true">
        <strong>PA-4L Single-Scene Guard</strong>
        <span>최초 live verification은 canonical Scene 1개, narration 최대 180자, provider generation request 최대 1회, 자동 retry 0입니다. Full-scene TTS는 아직 승인되지 않았습니다.</span>
      </div>
      <p className={styles.message} role="status" aria-live="polite">{message}</p>

      <div className={styles.steps}>
        <article className={styles.step} data-step="1">
          <h3><span>1</span> Provider Configuration</h3>
          <dl><dt>Provider</dt><dd>ElevenLabs TTS with timestamps</dd><dt>Output</dt><dd>mp3_44100_128</dd><dt>External feature</dt><dd>{preview ? (preview.featureEnabled ? "ON" : "OFF") : "plan preview 후 확인"}</dd><dt>Credential configured</dt><dd data-pa4-credential-configured={preview?.credentialConfigured ? "yes" : "no"}>{preview ? (preview.credentialConfigured ? "yes" : "no") : "unknown"}</dd></dl>
          <label>Voice ID<input value={voiceId} maxLength={128} autoComplete="off" placeholder="voice_id" onChange={(event) => invalidatePlan(setVoiceId, event.target.value.trim())} /></label>
          <label>Model ID<input value={modelId} maxLength={128} autoComplete="off" placeholder="model_id" onChange={(event) => invalidatePlan(setModelId, event.target.value.trim())} /></label>
          <small>API key 입력란은 없습니다. Credential은 server-side configured yes/no로만 표시됩니다.</small>
        </article>

        <article className={styles.step} data-step="2">
          <h3><span>2</span> Plan Preview</h3>
          <button type="button" disabled={!canPreview} onClick={() => void previewPlan()}>Preview 1-Scene Live Smoke Plan</button>
          <dl><dt>Canonical checkpoint</dt><dd>{persistedProject?.renderCheckpointHash ? `${persistedProject.renderCheckpointHash.slice(0, 12)}…` : "none"}</dd><dt>Session match</dt><dd>{canonicalMatch ? "MATCH" : "MISMATCH"}</dd><dt>Selected Scene ID</dt><dd>{preview?.plan.scenes[0]?.sceneId ?? "none"}</dd><dt>Scene order</dt><dd>{preview?.plan.scenes[0]?.sceneOrder ?? "—"}</dd><dt>Canonical narration</dt><dd>{preview?.plan.scenes[0]?.narration ?? "none"}</dd><dt>Characters</dt><dd>{preview?.plan.scenes[0]?.characterCount ?? 0}</dd><dt>Narration hash</dt><dd>{preview ? `${preview.plan.scenes[0]!.narrationHash.slice(0, 12)}…` : "none"}</dd><dt>Voice ID</dt><dd>{preview?.plan.voiceId ?? "none"}</dd><dt>Model ID</dt><dd>{preview?.plan.modelId ?? "none"}</dd><dt>Cache status</dt><dd>{preview ? (preview.cacheHitSceneIds.length === 1 ? "HIT" : "MISS") : "unknown"}</dd><dt>Expected provider requests</dt><dd>{preview?.maximumExternalRequests ?? 0}</dd><dt>Max requests</dt><dd>1</dd><dt>Actual price</dt><dd className={styles.unknown}>UNKNOWN</dd><dt>Plan hash</dt><dd>{preview ? `${preview.plan.planHash.slice(0, 16)}…` : "none"}</dd></dl>
          <p>실제 Provider 가격을 이 프로그램이 검증한 것이 아닙니다.</p>
          {preview && <ol className={styles.sceneCounts}>{preview.plan.scenes.map((scene) => <li key={scene.sceneId}><span>{scene.sceneId}</span><strong>{scene.characterCount} chars</strong></li>)}</ol>}
        </article>

        <article className={styles.step} data-step="3">
          <h3><span>3</span> Paid Call Confirmation</h3>
          <label className={styles.confirm}><input type="checkbox" checked={paidConfirmed} disabled={!preview || phase === "materializing"} onChange={(event) => setPaidConfirmed(event.target.checked)} /> 이 작업은 외부 유료 TTS 요청을 발생시킬 수 있음을 확인했습니다.</label>
          <p>현재 표시되는 것은 문자 수이며 실제 청구 금액을 프로그램이 검증한 것이 아닙니다.</p>
          <strong>Plan/configuration 변경 또는 retry preview 시 다시 확인해야 합니다.</strong>
        </article>

        <article className={styles.step} data-step="4">
          <h3><span>4</span> Materialization</h3>
          <button type="button" disabled={!canMaterialize} onClick={() => void materialize()}>Generate Selected 1-Scene Audio</button>
          <dl><dt>Status</dt><dd>{phase}</dd><dt>External requests</dt><dd>{set?.externalRequestCount ?? 0}</dd><dt>Completed</dt><dd>{set?.completeSceneIds.length ?? 0}</dd><dt>Failed</dt><dd>{set?.failedSceneIds.length ?? 0}</dd><dt>Pending</dt><dd>{set?.pendingSceneIds.length ?? preview?.missingSceneIds.length ?? 0}</dd></dl>
          <strong>MAX_REQUESTS=1 · STOP_AFTER_FIRST_ATTEMPT · automatic retry=0 · fallback=0</strong>
        </article>

        <article className={`${styles.step} ${styles.audioReview}`} data-step="5">
          <h3><span>5</span> Audio Review</h3>
          {statusRows.length === 0 ? <p>Plan preview 후 scene 상태가 표시됩니다.</p> : statusRows.map((scene) => (
            <section className={styles.scene} key={scene.sceneId} data-pa4-scene-status={scene.status}>
              <header><strong>{scene.sceneId}</strong><span>{scene.status}</span></header>
              <p>{scene.narration}</p>
              <dl><dt>Characters</dt><dd>{scene.characterCount}</dd><dt>Duration</dt><dd>{scene.durationMs === null ? "—" : `${scene.durationMs}ms`}</dd><dt>Alignment</dt><dd>{scene.alignmentStatus}</dd><dt>Audio SHA</dt><dd>{scene.audioSha256 ? `${scene.audioSha256.slice(0, 12)}…` : "—"}</dd><dt>Subtitle cues</dt><dd>{scene.subtitleCueCount}</dd></dl>
              {audioUrls[scene.sceneId] ? <audio controls preload="metadata" src={audioUrls[scene.sceneId]} data-pa4-audio-ready="true" /> : <small>완료·검증된 audio 없음</small>}
            </section>
          ))}
        </article>

        <article className={styles.step} data-step="6">
          <h3><span>6</span> Failure Recovery</h3>
          <dl><dt>Failed</dt><dd>{recovery?.failedSceneIds.join(", ") || "none"}</dd><dt>Pending</dt><dd>{recovery?.pendingSceneIds.join(", ") || "none"}</dd><dt>Retryable</dt><dd>{recovery?.retryableSceneIds.join(", ") || "none"}</dd><dt>Reusable cache</dt><dd>{recovery?.reusableSceneIds.join(", ") || "none"}</dd><dt>Stale</dt><dd>{recovery?.stale ? "YES" : "NO"}</dd></dl>
          <div className={styles.actions}><button type="button" disabled>Retry unavailable in PA-4L</button></div>
          <p>PA-4L은 첫 provider attempt 이후 자동·수동 retry와 fallback을 모두 금지합니다. 실패 결과는 Control Tower에 전달합니다.</p>
        </article>

        <article className={`${styles.step} ${styles.approval}`} data-step="7" data-pa4-approval-state={set?.approvalState ?? "pending"}>
          <h3><span>7</span> Approval</h3>
          <strong>{set?.approvalState === "approved" ? "Audio Materialization Package · APPROVED" : "Audio Materialization Package · NOT READY"}</strong>
          <ul><li>All enabled scene audio: {set?.approvalBoundary.allEnabledScenesMaterialized ? "PASS" : "WAIT"}</li><li>Audio integrity: {set?.approvalBoundary.allAudioIntegrityValid ? "PASS" : "WAIT"}</li><li>Provider alignment usable: {set?.approvalBoundary.allProviderAlignmentsUsable ? "PASS" : "WAIT"}</li><li>Audio-aligned subtitle valid: {set?.approvalBoundary.allAudioAlignedSubtitlePlansValid ? "PASS" : "WAIT"}</li><li>Checkpoint current: {set?.approvalBoundary.checkpointIdentityCurrent ? "PASS" : "WAIT"}</li></ul>
          <p><strong>Production voice quality: NOT_APPROVED</strong> · Final render: NOT_CREATED · Actual visual assets: NOT_CREATED</p>
        </article>
      </div>
    </section>
  );
}
