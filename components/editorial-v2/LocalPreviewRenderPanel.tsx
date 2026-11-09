"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  LocalPreviewPersistedProjectSummary,
  LocalPreviewRenderMetadata,
} from "../../lib/editorial-v2/local-preview-contracts";
import {
  fetchLocalProjectPreviewBlob,
  getLocalProjectPreviewMetadata,
  LocalPreviewApiError,
  requestLocalProjectPreview,
} from "../../lib/editorial-v2/local-preview-api-client";
import styles from "./LocalPreviewRenderPanel.module.css";

type PanelState = "feature_off" | "no_project" | "checkpoint_missing" | "checkpoint_mismatch" | "checking" | "ready" | "rendering" | "completed" | "cache_hit" | "failed";

interface LocalPreviewRenderPanelProps {
  readonly persistenceEnabled: boolean;
  readonly persistedProject: LocalPreviewPersistedProjectSummary | null;
  readonly currentSessionRenderManifestHash: string | null;
}

const STATE_LABEL: Readonly<Record<PanelState, string>> = {
  feature_off: "Feature OFF",
  no_project: "Project 없음",
  checkpoint_missing: "Approved Render checkpoint 없음",
  checkpoint_mismatch: "현재 session / persisted checkpoint 불일치",
  checking: "Checking",
  ready: "Ready for Local Preview",
  rendering: "Rendering",
  completed: "Completed",
  cache_hit: "Cache Hit",
  failed: "Failed",
};

function initialState(
  persistenceEnabled: boolean,
  project: LocalPreviewPersistedProjectSummary | null,
  currentManifestHash: string | null,
): PanelState {
  if (!persistenceEnabled) return "feature_off";
  if (!project) return "no_project";
  if (!project.renderCheckpointHash || !project.renderManifestHash) return "checkpoint_missing";
  if (!currentManifestHash || currentManifestHash !== project.renderManifestHash) return "checkpoint_mismatch";
  return "checking";
}

function messageFrom(error: unknown): string {
  if (error instanceof LocalPreviewApiError) return `${error.code}: ${error.message}`;
  return error instanceof Error ? error.message : "Local preview 오류";
}

export default function LocalPreviewRenderPanel({
  persistenceEnabled,
  persistedProject,
  currentSessionRenderManifestHash,
}: LocalPreviewRenderPanelProps) {
  const [state, setState] = useState<PanelState>(() => initialState(persistenceEnabled, persistedProject, currentSessionRenderManifestHash));
  const [confirmed, setConfirmed] = useState(false);
  const [metadata, setMetadata] = useState<LocalPreviewRenderMetadata | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("Canonical checkpoint와 preview feature를 확인합니다.");
  const objectUrlRef = useRef<string | null>(null);
  const requestSequenceRef = useRef(0);

  const canonicalMatch = Boolean(
    persistedProject?.renderCheckpointHash
    && persistedProject.renderManifestHash
    && currentSessionRenderManifestHash
    && persistedProject.renderManifestHash === currentSessionRenderManifestHash,
  );

  const replaceMediaUrl = useCallback((blob: Blob | null): void => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = blob ? URL.createObjectURL(blob) : null;
    setMediaUrl(objectUrlRef.current);
  }, []);

  useEffect(() => () => {
    requestSequenceRef.current += 1;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const loadMedia = useCallback(async (projectId: string, renderId: string): Promise<void> => {
    const blob = await fetchLocalProjectPreviewBlob(projectId, renderId, { timeoutMs: 30_000 });
    replaceMediaUrl(blob);
  }, [replaceMediaUrl]);

  useEffect(() => {
    const next = initialState(persistenceEnabled, persistedProject, currentSessionRenderManifestHash);
    setConfirmed(false);
    setMetadata(null);
    replaceMediaUrl(null);
    if (next !== "checking" || !persistedProject) {
      setState(next);
      setMessage(next === "checkpoint_mismatch" ? "현재 승인 상태를 Approved Checkpoint로 저장한 뒤 Preview를 생성하세요." : STATE_LABEL[next]);
      return;
    }
    const sequence = ++requestSequenceRef.current;
    setState("checking");
    setMessage("저장된 local preview metadata를 확인합니다.");
    void getLocalProjectPreviewMetadata(persistedProject.projectId, undefined, { timeoutMs: 8_000 }).then(async (found) => {
      if (sequence !== requestSequenceRef.current) return;
      setMetadata(found);
      await loadMedia(persistedProject.projectId, found.renderId);
      if (sequence !== requestSequenceRef.current) return;
      setState("completed");
      setMessage("저장된 local preview를 불러왔습니다.");
    }).catch((error: unknown) => {
      if (sequence !== requestSequenceRef.current) return;
      if (error instanceof LocalPreviewApiError && error.code === "LOCAL_PREVIEW_NOT_FOUND") {
        setState("ready");
        setMessage("Ready for Local Preview · 실제 외부 asset/TTS 없이 로컬 preview를 생성합니다.");
      } else if (error instanceof LocalPreviewApiError && ["LOCAL_PREVIEW_RENDER_DISABLED", "LOCAL_PERSISTENCE_DISABLED", "EDITORIAL_V2_DISABLED"].includes(error.code)) {
        setState("feature_off");
        setMessage(messageFrom(error));
      } else {
        setState("failed");
        setMessage(messageFrom(error));
      }
    });
  }, [currentSessionRenderManifestHash, loadMedia, persistedProject, persistenceEnabled, replaceMediaUrl]);

  const canRender = persistenceEnabled
    && canonicalMatch
    && persistedProject?.projectStatus === "active"
    && confirmed
    && (["ready", "completed", "cache_hit"] as readonly PanelState[]).includes(state);

  async function generatePreview(): Promise<void> {
    if (!persistedProject?.renderCheckpointHash || !canRender) return;
    const sequence = ++requestSequenceRef.current;
    setState("rendering");
    setMessage("Canonical approved checkpoints로 local preview를 생성합니다.");
    try {
      const result = await requestLocalProjectPreview(persistedProject.projectId, {
        expectedProjectRevision: persistedProject.projectRevision,
        expectedRenderCheckpointHash: persistedProject.renderCheckpointHash,
        profile: "preview_540x960",
        ownerLocalPreviewConfirmation: true,
      });
      if (sequence !== requestSequenceRef.current || !result.metadata || !result.identity) return;
      setMetadata(result.metadata);
      await loadMedia(persistedProject.projectId, result.identity.renderId);
      if (sequence !== requestSequenceRef.current) return;
      setState(result.cacheStatus === "hit_reused" || result.cacheStatus === "in_flight_reused" ? "cache_hit" : "completed");
      setMessage(result.cacheStatus === "hit_reused" ? "동일 canonical render input의 검증된 cache를 재사용했습니다." : "Local preview 생성이 완료됐습니다.");
    } catch (error) {
      if (sequence !== requestSequenceRef.current) return;
      setState("failed");
      setMessage(messageFrom(error));
    }
  }

  const warnings = useMemo(() => metadata?.warnings ?? ["실제 TTS 없음", "실제 외부 asset 없음", "Estimated subtitle", "Final render 아님", "Public-ready 아님"], [metadata]);

  return (
    <section className={styles.panel} aria-labelledby="local-preview-title" data-pa3-preview-state={state} data-pa3-render-id={metadata?.renderId ?? "none"}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>Production Activation PA-3 · Local only</p><h2 id="local-preview-title">Local User-Content Preview</h2></div>
        <span className={styles.badge} data-state={state}>{STATE_LABEL[state]}</span>
      </header>

      <div className={styles.boundary}>
        <strong>Persisted Approved Checkpoint → 540×960 Preview MP4</strong>
        <span>Canonical source only · client content payload 거부</span>
        <span>Silent placeholder audio · estimated subtitles</span>
        <span>Character motion proxy · productionReady=false</span>
      </div>

      <p role="status" aria-live="polite" className={styles.message}>{message}</p>

      <div className={styles.grid}>
        <article className={styles.card}>
          <h3>Canonical readiness</h3>
          <dl className={styles.summary}>
            <dt>Project revision</dt><dd>{persistedProject?.projectRevision ?? "none"}</dd>
            <dt>Render checkpoint</dt><dd>{persistedProject?.renderCheckpointHash ? `${persistedProject.renderCheckpointHash.slice(0, 12)}…` : "none"}</dd>
            <dt>Session match</dt><dd data-pa3-checkpoint-match={canonicalMatch ? "yes" : "no"}>{canonicalMatch ? "MATCH" : "MISMATCH"}</dd>
            <dt>Scenes</dt><dd>{metadata?.sceneCount ?? persistedProject?.sceneCount ?? 0}</dd>
            <dt>Duration</dt><dd>{Math.round((metadata?.durationMs ?? persistedProject?.durationMs ?? 0) / 1000)}s</dd>
            <dt>Profile</dt><dd>540×960 · 30fps</dd>
            <dt>Unresolved assets</dt><dd>{metadata?.unresolvedAssetCount ?? persistedProject?.unresolvedAssetCount ?? 0}</dd>
            <dt>Character</dt><dd>{metadata?.characterDirection ?? persistedProject?.characterDirection ?? "none"}</dd>
          </dl>
          {!canonicalMatch && persistedProject && <p className={styles.alert}>현재 승인 상태를 Approved Checkpoint로 저장한 뒤 Preview를 생성하세요.</p>}
        </article>

        <article className={styles.card}>
          <h3>Generate Local Preview</h3>
          <label className={styles.confirm}><input type="checkbox" checked={confirmed} disabled={!canonicalMatch || !["ready", "completed", "cache_hit"].includes(state)} onChange={(event) => setConfirmed(event.target.checked)} /> 이 렌더는 로컬 Preview이며 최종 영상·게시용이 아님을 확인했습니다.</label>
          <button type="button" disabled={!canRender} onClick={() => void generatePreview()}>Generate Local Preview</button>
          <small>동일 project revision + Render checkpoint + canonical input은 같은 render ID를 사용하며 valid cache만 재사용합니다.</small>
        </article>

        <article className={`${styles.card} ${styles.preview}`}>
          <h3>Preview result</h3>
          {mediaUrl ? <video controls preload="metadata" src={mediaUrl} data-pa3-preview-video="ready" /> : <div className={styles.empty}>생성되거나 검증된 local preview가 없습니다.</div>}
          {metadata && <dl className={styles.summary}><dt>Render ID</dt><dd>{metadata.renderId}</dd><dt>Output size</dt><dd>{metadata.outputBytes.toLocaleString()} bytes</dd><dt>Output SHA</dt><dd>{metadata.outputSha256.slice(0, 16)}…</dd><dt>Audio</dt><dd>{metadata.audioMode}</dd><dt>Subtitle</dt><dd>{metadata.subtitleAlignment}</dd><dt>Production ready</dt><dd data-pa3-production-ready={String(metadata.productionReady)}>false</dd></dl>}
        </article>

        <article className={styles.card}>
          <h3>Preview-only warnings</h3>
          <ul className={styles.warnings}>{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
          <strong>NOT_PRODUCTION_READY</strong>
          <p>실제 TTS·실제 외부 asset·audio-aligned subtitle·production animation·1080×1920 결과가 아닙니다.</p>
        </article>
      </div>
    </section>
  );
}
