"use client";

import { useEffect, useReducer, useState } from "react";

import type {
  ApprovedCharacterMotionSessionSnapshot,
  ApprovedScenePlanningSessionSnapshot,
  CharacterMotionIntensity,
  CharacterOriginalityCheckId,
  CharacterRigMotionTag,
} from "../../lib/editorial-v2/contracts";
import { getCharacterMotionDefinition, getCharacterMotionVocabulary } from "../../lib/editorial-v2/character-motion";
import {
  canApproveCharacterDirection,
  createInitialCharacterMotionSession,
  overrideSceneCharacterMotion,
  reduceCharacterMotionSession,
  selectProvisionalCharacterDirection,
  setCharacterComparisonReview,
  setCharacterOriginalityCheck,
} from "../../lib/editorial-v2/character-selection";
import CharacterSvgPreview from "./CharacterSvgPreview";
import styles from "./CharacterMotionWorkbench.module.css";

interface CharacterMotionWorkbenchProps {
  readonly approvedScenePlanningSnapshot: ApprovedScenePlanningSessionSnapshot;
  readonly onApprovedCharacterMotionChange?: (
    snapshot: ApprovedCharacterMotionSessionSnapshot | null,
  ) => void;
}

const PREVIEW_SPEEDS = [0.75, 1, 1.25] as const;
const MOTION_INTENSITIES: readonly CharacterMotionIntensity[] = ["low", "medium", "high"];

const RIGHTS_CHECKS: readonly CharacterOriginalityCheckId[] = [
  "no_external_svg_icon_font",
  "no_third_party_logo",
  "no_real_person_face",
  "internal_svg_rights_provenance",
];

const ACCESSIBILITY_CHECKS: readonly CharacterOriginalityCheckId[] = [
  "screen_occupancy_within_target",
  "no_evidence_obstruction",
  "reduced_motion_supported",
  "no_rapid_flashing",
  "status_not_color_only",
];

function groupFor(checkId: CharacterOriginalityCheckId): "originality" | "rights" | "accessibility" {
  if (RIGHTS_CHECKS.includes(checkId)) return "rights";
  if (ACCESSIBILITY_CHECKS.includes(checkId)) return "accessibility";
  return "originality";
}

function cloneApprovedCharacterMotionSnapshot(
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

export default function CharacterMotionWorkbench({
  approvedScenePlanningSnapshot,
  onApprovedCharacterMotionChange,
}: CharacterMotionWorkbenchProps) {
  const [session, dispatch] = useReducer(
    reduceCharacterMotionSession,
    approvedScenePlanningSnapshot,
    createInitialCharacterMotionSession,
  );
  const [comparisonMotionTag, setComparisonMotionTag] = useState<CharacterRigMotionTag>(
    session.representativeScene?.semanticMotionTag ?? "idle_scan",
  );
  const selection = session.selection;
  const vocabulary = getCharacterMotionVocabulary();
  const comparisonMotion = getCharacterMotionDefinition(comparisonMotionTag);

  useEffect(() => {
    if (!onApprovedCharacterMotionChange) return;
    onApprovedCharacterMotionChange(
      session.approvedSnapshot
        ? cloneApprovedCharacterMotionSnapshot(session.approvedSnapshot)
        : null,
    );
    return () => onApprovedCharacterMotionChange(null);
  }, [onApprovedCharacterMotionChange, session.approvedSnapshot]);

  function updateSelection(nextSelection: NonNullable<typeof selection>): void {
    dispatch({ type: "selection_changed", selection: nextSelection });
  }

  if (!selection || !session.representativeScene) {
    return (
      <section className={styles.shell} aria-live="polite">
        <h2>Character Motion Workbench 잠김</h2>
        <p>승인된 Scene Planning snapshot이 필요합니다.</p>
      </section>
    );
  }

  const comparison = selection.comparisonResult;
  const standardReviewed = comparison?.standardMotionReviewed ?? false;
  const reducedReviewed = comparison?.reducedMotionReviewed ?? false;
  const mappingPlan = selection.motionPlans[0];

  return (
    <main className={styles.shell}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Shorts Editorial OS V2 · Slice 5</p>
        <h1>Character Direction · Rig · Motion System</h1>
        <p>세 방향을 동일 장면에서 비교하는 session-only SVG prototype입니다. production asset, 최종 이름·팔레트, Lottie/WebM, renderer output이 아닙니다.</p>
      </header>

      <section className={styles.step} aria-labelledby="character-directions">
        <h2 id="character-directions"><span>1</span> 방향 개요</h2>
        <p className={styles.notice}>세 방향은 모두 <strong>comparison_only</strong>이며 최종 캐릭터·브랜드 결정이 아닙니다.</p>
        <div className={styles.directionGrid}>
          {selection.directions.map((direction) => (
            <article className={styles.directionCard} key={direction.directionId}>
              <p className={styles.statusTag}>{direction.status}</p>
              <h3>{direction.temporaryDisplayName}</h3>
              <p>{direction.silhouetteDescription}</p>
              <dl>
                <div><dt>정보 역할</dt><dd>{direction.visualRoles.join(", ")}</dd></div>
                <div><dt>장점</dt><dd>{direction.personality}</dd></div>
                <div><dt>위험</dt><dd>{direction.similarityRisks.join(" · ")}</dd></div>
                <div><dt>구현 / 유지보수</dt><dd>{direction.implementationComplexity} / {direction.maintenanceComplexity}</dd></div>
                <div><dt>Occupancy</dt><dd>≤ {direction.screenOccupancyTargetPercent}%</dd></div>
                <div><dt>Reduced motion</dt><dd>{direction.reducedMotionBehavior}</dd></div>
              </dl>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="provisional-direction"
                  checked={selection.selectedDirectionId === direction.directionId}
                  onChange={() => updateSelection(selectProvisionalCharacterDirection(selection, direction.directionId))}
                />
                이 비교 방향을 provisional 선택
              </label>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.step} aria-labelledby="same-scene-comparison">
        <h2 id="same-scene-comparison"><span>2</span> 동일 장면 비교</h2>
        <div className={styles.sceneContext}>
          <strong>Scene {session.representativeScene.sceneOrder} · {session.representativeScene.primaryVisualStrategy}</strong>
          <p>{session.representativeScene.narration}</p>
          <p>Caption: {session.representativeScene.keyCaption}</p>
          <small>Evidence {session.representativeScene.evidenceRefs.join(", ") || "없음"} · Source {session.representativeScene.sourceRefs.join(", ") || "없음"} · Number {session.representativeScene.numberRefs.join(", ") || "없음"}</small>
        </div>
        <div className={styles.toolbar}>
          <button type="button" onClick={() => dispatch({ type: "playback_changed", playbackState: session.playbackState === "playing" ? "paused" : "playing" })}>{session.playbackState === "playing" ? "Pause" : "Play"}</button>
          <label>Preview speed<select value={session.previewSpeed} onChange={(event) => dispatch({ type: "preview_speed_changed", previewSpeed: Number(event.target.value) as 0.75 | 1 | 1.25 })}>{PREVIEW_SPEEDS.map((speed) => <option key={speed} value={speed}>{speed}x</option>)}</select></label>
          <label>Temporary motion<select value={comparisonMotionTag} onChange={(event) => setComparisonMotionTag(event.target.value as CharacterRigMotionTag)}>{vocabulary.map((motion) => <option key={motion.motionTag}>{motion.motionTag}</option>)}</select></label>
          <label className={styles.inlineCheck}><input type="checkbox" checked={session.reducedMotion} onChange={(event) => dispatch({ type: "reduced_motion_changed", reducedMotion: event.target.checked })} /> Reduced-motion preview</label>
        </div>
        <div className={styles.previewGrid}>
          {selection.directions.map((direction) => {
            const rig = selection.rigs.find((entry) => entry.directionId === direction.directionId);
            if (!rig) return null;
            return <CharacterSvgPreview key={direction.directionId} rig={rig} motionDefinition={comparisonMotion} direction={direction} playbackState={session.playbackState} reducedMotion={session.reducedMotion} previewScale={session.previewSpeed} sameSceneContextLabels={[`Scene ${session.representativeScene?.sceneOrder}`, session.representativeScene?.primaryVisualStrategy ?? "", comparisonMotionTag]} />;
          })}
        </div>
        <div className={styles.reviewRow}>
          <label className={styles.inlineCheck}><input type="checkbox" checked={standardReviewed} onChange={(event) => updateSelection(setCharacterComparisonReview(selection, event.target.checked, reducedReviewed))} /> 동일 장면 standard motion 비교 완료</label>
          <label className={styles.inlineCheck}><input type="checkbox" checked={reducedReviewed} onChange={(event) => updateSelection(setCharacterComparisonReview(selection, standardReviewed, event.target.checked))} /> reduced-motion 비교 완료</label>
        </div>
      </section>

      <section className={styles.step} aria-labelledby="motion-vocabulary">
        <h2 id="motion-vocabulary"><span>3</span> Motion vocabulary</h2>
        <div className={styles.motionGrid}>
          {vocabulary.map((motion) => (
            <article key={motion.motionTag}>
              <h3>{motion.motionTag}</h3>
              <p>{motion.semanticPurpose}</p>
              <small>{motion.timing.durationMs}ms · {motion.timing.loopPolicy}</small>
              <p><strong>Reduced:</strong> {motion.reducedMotionAlternative}</p>
              <p><strong>Obstruction:</strong> {motion.evidenceObstructionPolicy}</p>
              <button type="button" className={styles.secondary} onClick={() => setComparisonMotionTag(motion.motionTag)}>동일 장면에서 임시 preview</button>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.step} aria-labelledby="scene-motion-mapping">
        <h2 id="scene-motion-mapping"><span>4</span> Scene Motion Mapping</h2>
        <p className={styles.notice}>Scene identity, narration, evidence/source/claim/number refs, primary visual strategy와 visual proof class는 읽기 전용입니다.</p>
        <div className={styles.mappingGrid}>
          {mappingPlan?.assignments.map((assignment) => {
            const scene = approvedScenePlanningSnapshot.sceneCards.find((entry) => entry.sceneId === assignment.sceneId);
            return (
              <article key={assignment.sceneId}>
                <p className={styles.statusTag}>Scene {assignment.sceneOrder} · {scene?.provenance.beatType}</p>
                <h3>{assignment.primaryVisualStrategy}</h3>
                <label>Motion tag<select value={assignment.motionTag} onChange={(event) => updateSelection(overrideSceneCharacterMotion(selection, assignment.sceneId, event.target.value as CharacterRigMotionTag, assignment.intensity, assignment.enabled))}>{vocabulary.map((motion) => <option key={motion.motionTag}>{motion.motionTag}</option>)}</select></label>
                <label>Intensity<select value={assignment.intensity} onChange={(event) => updateSelection(overrideSceneCharacterMotion(selection, assignment.sceneId, assignment.motionTag, event.target.value as CharacterMotionIntensity, assignment.enabled))}>{MOTION_INTENSITIES.map((intensity) => <option key={intensity}>{intensity}</option>)}</select></label>
                <label className={styles.inlineCheck}><input type="checkbox" checked={assignment.enabled} onChange={(event) => updateSelection(overrideSceneCharacterMotion(selection, assignment.sceneId, assignment.motionTag, assignment.intensity, event.target.checked))} /> Character enabled</label>
                <dl><div><dt>Role</dt><dd>{assignment.characterRole}</dd></div><div><dt>Reduced</dt><dd>{assignment.reducedMotionAlternative}</dd></div><div><dt>Occupancy</dt><dd>{assignment.screenOccupancyClass}</dd></div><div><dt>Obstruction</dt><dd>{assignment.obstructionWarning ?? "none"}</dd></div></dl>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.step} aria-labelledby="character-review">
        <h2 id="character-review"><span>5</span> Originality · Rights · Accessibility</h2>
        <div className={styles.reviewGrid}>
          {(["originality", "rights", "accessibility"] as const).map((group) => (
            <fieldset key={group}>
              <legend>{group}</legend>
              {selection.originalityChecks.filter((check) => groupFor(check.checkId) === group).map((check) => (
                <label className={styles.checkItem} key={check.checkId} data-confirmed={check.confirmed}>
                  <input type="checkbox" checked={check.confirmed} onChange={(event) => updateSelection(setCharacterOriginalityCheck(selection, check.checkId, event.target.checked))} />
                  <span>{check.label}</span>
                </label>
              ))}
            </fieldset>
          ))}
        </div>
        <p className={styles.notice}>Rights provenance: {selection.rightsReview.provenance} · Source status: {selection.rightsReview.sourceStatus}. 외부 SVG·아이콘·폰트·로고·실제 인물은 사용하지 않습니다.</p>
      </section>

      <section className={styles.step} aria-labelledby="character-approval">
        <h2 id="character-approval"><span>6</span> Provisional Direction Approval</h2>
        <div className={styles.summaryGrid}>
          <article><h3>Direction</h3><strong>{selection.selectedDirectionId ?? "미선택"}</strong><p>final name/palette 아님</p></article>
          <article><h3>Comparison</h3><strong>{standardReviewed && reducedReviewed ? "reviewed" : "pending"}</strong><p>same scene · same semantic tag</p></article>
          <article><h3>Validation</h3><strong>{session.validation?.blockingIssueCount ?? "-"} blocking</strong><p>{selection.approvalState}</p></article>
        </div>
        {session.validation && <ul className={styles.issues}>{session.validation.issues.map((issue, index) => <li key={`${issue.code}:${index}`} data-kind={issue.blocking ? "error" : "warning"}>{issue.blocking ? "차단" : "경고"} · {issue.message}</li>)}</ul>}
        <div className={styles.toolbar}>
          <button type="button" disabled={!canApproveCharacterDirection(session.validation)} onClick={() => dispatch({ type: "provisional_approval_requested" })}>Provisional direction 사용자 승인</button>
          <button type="button" className={styles.secondary} disabled={!session.approvedSnapshot} onClick={() => dispatch({ type: "approval_cancelled" })}>승인 취소</button>
          <button type="button" className={styles.secondary} onClick={() => dispatch({ type: "reset" })}>Slice 5 reset</button>
        </div>
        <p className={session.approvedSnapshot ? styles.success : styles.muted} role="status">{session.approvedSnapshot ? "Provisional Character Motion Package 승인됨 · session-only · 저장되지 않음" : "승인되지 않음"}</p>
        <p className={styles.notice}>Production asset 아님 · 최종 캐릭터명/팔레트 아님 · Lottie/WebM export 없음 · downstream render integration은 별도 session 승인 필요 · network/persistence 없음.</p>
      </section>
    </main>
  );
}
