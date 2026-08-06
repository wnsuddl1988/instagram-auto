"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  ApprovedCharacterMotionSessionSnapshot,
  ApprovedRenderIntegrationSessionSnapshot,
  ApprovedScenePlanningSessionSnapshot,
  RenderProfileId,
  VoiceProviderMode,
} from "../../lib/editorial-v2/contracts";
import { buildRenderManifest, cloneRenderManifest, RENDER_PROFILES } from "../../lib/editorial-v2/render-manifest";
import { buildRenderRecoveryPlan } from "../../lib/editorial-v2/render-recovery";
import { canApproveRenderIntegration, summarizeRenderManifestValidation, validateRenderManifest } from "../../lib/editorial-v2/render-validation";
import { buildRendererBridgePlan, validateRendererBridgePlan } from "../../lib/editorial-v2/renderer-bridge";
import { buildSubtitleTrackPlan, summarizeSubtitleValidation, validateSubtitleTrackPlan } from "../../lib/editorial-v2/subtitle-planning";
import { buildVoiceRequestPlan, canApproveVoicePlan, summarizeVoicePlanValidation, validateVoiceRequestPlan } from "../../lib/editorial-v2/voice-planning";
import styles from "./RenderIntegrationWorkbench.module.css";

interface RenderIntegrationWorkbenchProps {
  readonly approvedScenePlanningSnapshot: ApprovedScenePlanningSessionSnapshot;
  readonly approvedCharacterMotionSnapshot: ApprovedCharacterMotionSessionSnapshot;
  readonly onApprovedRenderIntegrationChange?: (
    snapshot: ApprovedRenderIntegrationSessionSnapshot | null,
  ) => void;
}

const VOICE_MODES: readonly VoiceProviderMode[] = ["plan_only", "existing_external_provider", "manual_audio_future"];

function cloneCharacterSnapshot(
  snapshot: ApprovedCharacterMotionSessionSnapshot,
): ApprovedCharacterMotionSessionSnapshot {
  return {
    ...snapshot,
    sceneMotionAssignments: snapshot.sceneMotionAssignments.map((assignment) => ({
      ...assignment,
      evidenceRefs: [...assignment.evidenceRefs],
      sourceRefs: [...assignment.sourceRefs],
      numberRefs: [...assignment.numberRefs],
    })),
    reducedMotionAssignments: snapshot.reducedMotionAssignments.map((assignment) => ({
      ...assignment,
      evidenceRefs: [...assignment.evidenceRefs],
      sourceRefs: [...assignment.sourceRefs],
      numberRefs: [...assignment.numberRefs],
    })),
    originalityReview: snapshot.originalityReview.map((check) => ({ ...check })),
    rightsReview: { ...snapshot.rightsReview },
    accessibilityReview: { ...snapshot.accessibilityReview },
  };
}

function validationClass(blocking: boolean): string {
  return blocking ? styles.blocking : styles.warning;
}

export default function RenderIntegrationWorkbench({
  approvedScenePlanningSnapshot,
  approvedCharacterMotionSnapshot,
  onApprovedRenderIntegrationChange,
}: RenderIntegrationWorkbenchProps) {
  const [voiceMode, setVoiceMode] = useState<VoiceProviderMode>("plan_only");
  const [locale, setLocale] = useState("ko-KR");
  const [voiceIdentity, setVoiceIdentity] = useState("session-voice-unassigned");
  const [providerId, setProviderId] = useState("");
  const [providerLabel, setProviderLabel] = useState("");
  const [manualCostBasisLabel, setManualCostBasisLabel] = useState("");
  const [ownerExternalApprovalConfirmed, setOwnerExternalApprovalConfirmed] = useState(false);
  const [targetDurationSeconds, setTargetDurationSeconds] = useState(45);
  const [selectedProfileId, setSelectedProfileId] = useState<RenderProfileId>("preview_540x960");
  const [approvedVoiceKey, setApprovedVoiceKey] = useState<string | null>(null);
  const [approvedRenderKey, setApprovedRenderKey] = useState<string | null>(null);
  const [lastApprovedManifest, setLastApprovedManifest] = useState<ReturnType<typeof buildRenderManifest> | null>(null);

  const voicePlan = useMemo(() => buildVoiceRequestPlan(approvedScenePlanningSnapshot, {
    mode: voiceMode,
    locale,
    voiceIdentity,
    providerId,
    providerLabel,
    targetDurationSeconds,
    manualCostBasisLabel,
    ownerExternalApprovalConfirmed,
  }), [approvedScenePlanningSnapshot, locale, manualCostBasisLabel, ownerExternalApprovalConfirmed, providerId, providerLabel, targetDurationSeconds, voiceIdentity, voiceMode]);
  const voiceValidation = useMemo(
    () => summarizeVoicePlanValidation(validateVoiceRequestPlan(voicePlan)),
    [voicePlan],
  );
  const voiceKey = useMemo(() => JSON.stringify(voicePlan), [voicePlan]);
  const voiceApprovalState = approvedVoiceKey === voiceKey ? "approved" : approvedVoiceKey ? "invalidated" : "not_approved";
  const subtitleTrack = useMemo(
    () => buildSubtitleTrackPlan(approvedScenePlanningSnapshot, targetDurationSeconds, locale),
    [approvedScenePlanningSnapshot, locale, targetDurationSeconds],
  );
  const subtitleValidation = useMemo(
    () => summarizeSubtitleValidation(validateSubtitleTrackPlan(subtitleTrack, approvedScenePlanningSnapshot)),
    [approvedScenePlanningSnapshot, subtitleTrack],
  );
  const manifest = useMemo(() => buildRenderManifest({
    approvedPlanning: approvedScenePlanningSnapshot,
    approvedCharacterMotion: approvedCharacterMotionSnapshot,
    voicePlan,
    subtitleTrack,
    profileId: selectedProfileId,
    previousManifest: lastApprovedManifest,
  }), [approvedCharacterMotionSnapshot, approvedScenePlanningSnapshot, lastApprovedManifest, selectedProfileId, subtitleTrack, voicePlan]);
  const renderValidation = useMemo(
    () => summarizeRenderManifestValidation(validateRenderManifest(manifest, {
      approvedPlanning: approvedScenePlanningSnapshot,
      approvedCharacterMotion: approvedCharacterMotionSnapshot,
      voiceValidation,
      subtitleValidation,
    })),
    [approvedCharacterMotionSnapshot, approvedScenePlanningSnapshot, manifest, subtitleValidation, voiceValidation],
  );
  const recoveryPlan = useMemo(
    () => buildRenderRecoveryPlan(lastApprovedManifest, manifest),
    [lastApprovedManifest, manifest],
  );
  const bridgePlan = useMemo(() => buildRendererBridgePlan(manifest), [manifest]);
  const bridgeIssues = useMemo(() => validateRendererBridgePlan(bridgePlan, manifest), [bridgePlan, manifest]);
  const renderApprovalState = approvedRenderKey === manifest.manifestHash ? "approved" : approvedRenderKey ? "invalidated" : "not_approved";
  const approvable = voiceApprovalState === "approved" && bridgeIssues.filter((issue) => issue.blocking).length === 0 && canApproveRenderIntegration(manifest, renderValidation, voiceValidation, subtitleValidation);

  useEffect(() => {
    if (!onApprovedRenderIntegrationChange) return;
    if (renderApprovalState !== "approved" || !approvable) {
      onApprovedRenderIntegrationChange(null);
      return;
    }
    onApprovedRenderIntegrationChange({
      sourceCharacterSnapshot: cloneCharacterSnapshot(approvedCharacterMotionSnapshot),
      voicePlan: { ...voicePlan, provider: voicePlan.provider ? { ...voicePlan.provider } : null, scenes: voicePlan.scenes.map((scene) => ({ ...scene })), usage: { ...voicePlan.usage } },
      subtitleTrack: { ...subtitleTrack, scenePlans: subtitleTrack.scenePlans.map((scene) => ({ ...scene, cues: scene.cues.map((cue) => ({ ...cue })) })), cues: subtitleTrack.cues.map((cue) => ({ ...cue })) },
      renderManifest: cloneRenderManifest(manifest),
      validation: { ...renderValidation, issues: renderValidation.issues.map((issue) => ({ ...issue })) },
      bridgePlan: { ...bridgePlan, capabilities: bridgePlan.capabilities.map((capability) => ({ ...capability })), sceneLogicalUris: [...bridgePlan.sceneLogicalUris], missingRequirements: [...bridgePlan.missingRequirements] },
      approvalState: "approved",
      sessionOnly: true,
      ttsConnected: false,
      audioCreated: false,
      renderExecuted: false,
      productionReady: false,
    });
    return () => onApprovedRenderIntegrationChange(null);
  }, [approvedCharacterMotionSnapshot, approvable, bridgePlan, manifest, onApprovedRenderIntegrationChange, renderApprovalState, renderValidation, subtitleTrack, voicePlan]);

  function approveRenderIntegration(): void {
    if (!approvable) return;
    setLastApprovedManifest(cloneRenderManifest(manifest));
    setApprovedRenderKey(manifest.manifestHash);
  }

  function resetSliceSix(): void {
    setVoiceMode("plan_only");
    setLocale("ko-KR");
    setVoiceIdentity("session-voice-unassigned");
    setProviderId("");
    setProviderLabel("");
    setManualCostBasisLabel("");
    setOwnerExternalApprovalConfirmed(false);
    setTargetDurationSeconds(45);
    setSelectedProfileId("preview_540x960");
    setApprovedVoiceKey(null);
    setApprovedRenderKey(null);
    setLastApprovedManifest(null);
  }

  return (
    <main className={styles.shell}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Shorts Editorial OS V2 · Slice 6</p>
        <h1>Voice · Subtitle · Render Integration</h1>
        <p>승인된 Character Motion snapshot을 결정론적 integration package로 변환합니다. 실제 TTS, audio, asset, user-content render, final render, 저장, network는 실행하지 않습니다.</p>
      </header>

      <section className={styles.step} aria-labelledby="render-voice-plan">
        <h2 id="render-voice-plan"><span>1</span> Voice Request Plan</h2>
        <div className={styles.formGrid}>
          <label>Provider mode<select value={voiceMode} onChange={(event) => setVoiceMode(event.target.value as VoiceProviderMode)}>{VOICE_MODES.map((mode) => <option key={mode}>{mode}</option>)}</select></label>
          <label>Locale<input value={locale} onChange={(event) => setLocale(event.target.value)} /></label>
          <label>Voice identity<input value={voiceIdentity} onChange={(event) => setVoiceIdentity(event.target.value)} /></label>
          <label>Target seconds<input type="number" min="12" max="60" value={targetDurationSeconds} onChange={(event) => setTargetDurationSeconds(Number(event.target.value))} /></label>
          <label>Provider ID<input value={providerId} onChange={(event) => setProviderId(event.target.value)} disabled={voiceMode === "plan_only"} /></label>
          <label>Provider label<input value={providerLabel} onChange={(event) => setProviderLabel(event.target.value)} disabled={voiceMode === "plan_only"} /></label>
          <label>Manual cost basis label<input value={manualCostBasisLabel} onChange={(event) => setManualCostBasisLabel(event.target.value)} placeholder="수치 없는 수동 근거만" /></label>
          <label className={styles.checkbox}><input type="checkbox" checked={ownerExternalApprovalConfirmed} onChange={(event) => setOwnerExternalApprovalConfirmed(event.target.checked)} disabled={voiceMode !== "existing_external_provider"} /> 외부 provider 계획 Owner 확인</label>
        </div>
        <div className={styles.summaryGrid}>
          <article><h3>Usage estimate</h3><strong>{voicePlan.usage.totalCharacters} chars</strong><p>{voicePlan.usage.totalEstimatedDurationSeconds}s 예상 / {voicePlan.usage.targetDurationSeconds}s 목표</p></article>
          <article><h3>Cost class</h3><strong>{voicePlan.costEstimateClass}</strong><p>실제 가격 조회·주장 없음</p></article>
          <article><h3>Execution</h3><strong>NOT_EXECUTED</strong><p>TTS connected: false · audio created: false</p></article>
        </div>
        <ul className={styles.issues}>{voiceValidation.issues.map((issue, index) => <li key={`${issue.code}:${index}`} className={validationClass(issue.blocking)}>{issue.blocking ? "차단" : "경고"} · {issue.message}</li>)}</ul>
        <div className={styles.actions}><button type="button" disabled={!canApproveVoicePlan(voiceValidation)} onClick={() => setApprovedVoiceKey(voiceKey)}>Voice plan 세션 승인</button><button type="button" className={styles.secondary} disabled={!approvedVoiceKey} onClick={() => setApprovedVoiceKey(null)}>Voice 승인 취소</button><strong>{voiceApprovalState}</strong></div>
      </section>

      <section className={styles.step} aria-labelledby="render-subtitles">
        <h2 id="render-subtitles"><span>2</span> Subtitle Timing Plan</h2>
        <p className={styles.notice}><strong>ESTIMATED_NOT_AUDIO_ALIGNED</strong> · narration 글자 수에 따른 추정 배분이며 audio alignment를 수행하지 않았습니다.</p>
        <div className={styles.tableWrap}><table><thead><tr><th>Scene</th><th>Window</th><th>Cues</th><th>Key caption</th><th>Safe zone</th></tr></thead><tbody>{subtitleTrack.scenePlans.map((scene) => <tr key={scene.sceneId}><td>{scene.sceneOrder}</td><td>{scene.startSeconds.toFixed(3)}–{scene.endSeconds.toFixed(3)}s</td><td>{scene.cues.length}</td><td>{scene.keyCaption}</td><td>lower_safe_caption_zone</td></tr>)}</tbody></table></div>
        <p>Blocking {subtitleValidation.blockingIssueCount} · Warning {subtitleValidation.warningCount} · Total {subtitleTrack.targetDurationSeconds}s</p>
      </section>

      <section className={styles.step} aria-labelledby="render-manifest">
        <h2 id="render-manifest"><span>3</span> Render Manifest</h2>
        <div className={styles.profileGrid}>{RENDER_PROFILES.map((profile) => <label key={profile.profileId} className={styles.profileCard} data-selected={selectedProfileId === profile.profileId}><input type="radio" name="render-profile" checked={selectedProfileId === profile.profileId} onChange={() => setSelectedProfileId(profile.profileId)} /><strong>{profile.label}</strong><span>{profile.width}×{profile.height} · {profile.framesPerSecond}fps</span><small>{profile.preview ? "preview intent" : "FINAL EXECUTION FORBIDDEN"}</small></label>)}</div>
        <p className={styles.notice}>Level: <strong>INTEGRATION_PRECHECK_ONLY</strong> · STRUCTURAL_SAFE_AREA_PRECHECK · pixel/frame validated 아님 · final execution 금지.</p>
        <div className={styles.tableWrap}><table><thead><tr><th>Scene</th><th>Duration</th><th>Primary</th><th>Layers</th><th>Character</th><th>Rights / Cost</th><th>Unresolved</th><th>Fingerprint</th></tr></thead><tbody>{manifest.scenes.map((scene) => {
          const visual = approvedScenePlanningSnapshot.visualPlan.find((entry) => entry.sceneId === scene.sceneId);
          return <tr key={scene.sceneId}><td>{scene.sceneOrder}</td><td>{scene.durationSeconds}s</td><td>{scene.primaryVisualStrategy}</td><td>{scene.layers.length}</td><td>{scene.characterAssignment?.motionTag ?? "off"} · {scene.characterOccupancyPercent}%/{scene.characterOccupancyTargetPercent}%</td><td>{visual?.rightsReviewState ?? "unknown"} / {visual?.costClass ?? "unknown"}</td><td>{scene.unresolvedRequirements.join(" · ") || "none"}</td><td><code>{scene.fingerprint.fingerprint.slice(0, 12)}</code></td></tr>;
        })}</tbody></table></div>
        <p>Manifest hash <code>{manifest.manifestHash}</code> · enabled {manifest.enabledSceneCount} · {manifest.totalDurationSeconds}s · renderExecuted false</p>
      </section>

      <section className={styles.step} aria-labelledby="render-recovery">
        <h2 id="render-recovery"><span>4</span> Recovery Plan</h2>
        <div className={styles.summaryGrid}>
          <article><h3>Global invalidation</h3><strong>{String(recoveryPlan.globalInvalidation)}</strong><p>{recoveryPlan.globalReasons.join(" · ") || "none"}</p></article>
          <article><h3>Reusable scenes</h3><strong>{recoveryPlan.reusableSceneIds.length}</strong><p>{recoveryPlan.reusableSceneIds.join(", ") || "none"}</p></article>
          <article><h3>Scene-local retry</h3><strong>{recoveryPlan.retryableSceneIds.length}</strong><p>previous MP4 assumed: false · persistence: false</p></article>
        </div>
      </section>

      <section className={styles.step} aria-labelledby="render-validation">
        <h2 id="render-validation"><span>5</span> Validation · Renderer Bridge</h2>
        <div className={styles.summaryGrid}>
          <article><h3>Manifest validation</h3><strong>{renderValidation.blockingIssueCount} blocking</strong><p>{renderValidation.warningCount} warnings · {renderValidation.verificationLevel}</p></article>
          <article><h3>Bridge</h3><strong>executionReady: false</strong><p>{bridgePlan.capabilities.length} planned capabilities · implemented false</p></article>
          <article><h3>Synthetic proof</h3><strong>CLI_ONLY</strong><p>Checker PASS 후 540×960 fixture 1회 · production proof 아님</p></article>
        </div>
        <ul className={styles.issues}>{renderValidation.issues.map((issue, index) => <li key={`${issue.code}:${issue.sceneId}:${index}`} className={validationClass(issue.blocking)}>{issue.blocking ? "차단" : "경고"} · {issue.sceneId ?? "전체"} · {issue.message}</li>)}{bridgeIssues.map((issue, index) => <li key={`${issue.code}:${index}`} className={validationClass(issue.blocking)}>{issue.blocking ? "차단" : "경고"} · {issue.message}</li>)}</ul>
      </section>

      <section className={styles.step} aria-labelledby="render-approval">
        <h2 id="render-approval"><span>6</span> Session Approval</h2>
        <p className={styles.notice}>승인은 Voice Request Plan + estimated Subtitle Plan + Render Manifest + Recovery/Bridge Plan의 session-only package에만 적용됩니다. TTS/audio/asset/render/publish/deploy 권한이 아닙니다.</p>
        <div className={styles.actions}><button type="button" disabled={!approvable} onClick={approveRenderIntegration}>Render Integration Package 세션 승인</button><button type="button" className={styles.secondary} disabled={!approvedRenderKey} onClick={() => setApprovedRenderKey(null)}>승인 취소</button><button type="button" className={styles.secondary} onClick={resetSliceSix}>Slice 6 reset</button><strong>{renderApprovalState}</strong></div>
        <p className={renderApprovalState === "approved" ? styles.success : styles.muted} role="status">{renderApprovalState === "approved" ? "Session-only Render Integration Package 승인됨 · 저장/실행 없음" : renderApprovalState === "invalidated" ? "Upstream 또는 plan 변경으로 승인이 무효화됐습니다." : "승인되지 않음"}</p>
      </section>
    </main>
  );
}
