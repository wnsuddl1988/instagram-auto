export const LAYERED_MOTION_RENDERER_VERSION = "money_shorts_static_still_renderer_v4";
export const NATURAL_CLOSING_VISUAL_TRANSITION_SEC = 0.45;

const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1920;

function normalizedPresence(value) {
  return value === "character" || value === "hands" ? value : "none";
}

/**
 * 일반 이미지에는 카메라/레이어/패럴랙스 움직임을 절대 적용하지 않는다.
 * 실제 움직임은 Flow 검수를 통과한 Veo MP4 분기에서만 유지한다.
 */
export function buildSceneMotionRecipe({ stage, motionPlan, presenceMode, sceneIndex }) {
  return {
    sceneIndex: Number(sceneIndex),
    stage: String(stage ?? "").toLowerCase() || "unknown",
    presenceMode: normalizedPresence(presenceMode),
    cameraMode: "static_hold",
    sourceMotionPlanPresent: String(motionPlan ?? "").trim().length > 0,
    staticStill: true,
    imageMotionDisabled: true,
  };
}

/**
 * 시간 의존 필터 없이 한 장의 이미지를 화면에 맞춰 고정한다.
 * scale/crop은 프레임 맞춤일 뿐 zoompan, pan, overlay, tmix가 아니다.
 */
export function buildLayeredMotionFilter({ recipe }) {
  if (recipe?.staticStill !== true || recipe.imageMotionDisabled !== true) {
    throw new Error("static still recipe required");
  }
  return `[0:v]scale=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:force_original_aspect_ratio=increase,crop=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT},setsar=1,format=yuv420p[motionout]`;
}

export function buildAudioSynchronizedVisualTimeline(plannedScenes, audioScenes) {
  const scenes = Array.isArray(plannedScenes) ? plannedScenes : [];
  const measured = Array.isArray(audioScenes) ? audioScenes : [];
  const durations = measured.map((scene) => Number(scene?.normalizedDurationSec ?? scene?.durationSec));
  if (scenes.length !== durations.length || durations.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error("visual timeline requires matching positive audio scene durations");
  }
  const finalIndex = scenes.length - 1;
  const finalRole = String(scenes[finalIndex]?.sceneRole ?? scenes[finalIndex]?.id ?? "").toLowerCase();
  const applicable = finalIndex > 0 && finalRole === "save";
  let cursor = 0;
  const timeline = scenes.map((scene, index) => {
    const startSec = cursor;
    cursor += durations[index];
    return {
      sceneNumber: Number(scene?.sceneNumber ?? index + 1),
      startSec: Number(startSec.toFixed(3)),
      endSec: Number(cursor.toFixed(3)),
      durationSec: Number(durations[index].toFixed(3)),
    };
  });
  const sourceTotal = durations.reduce((sum, value) => sum + value, 0);
  const outputTotal = timeline.reduce((sum, value) => sum + value.durationSec, 0);
  const audioBoundaryAlignmentPass = timeline.every((scene, index) => {
    const audioStartSec = Number(measured[index]?.startSec);
    return Number.isFinite(audioStartSec) && Math.abs(scene.startSec - audioStartSec) <= 0.002;
  });
  const priorSpeechCompletionPass = timeline.every((scene, index) => {
    if (index === 0) return scene.startSec === 0;
    const priorSpeechEnd = Number(measured[index - 1]?.spokenEndSec);
    return Number.isFinite(priorSpeechEnd) && scene.startSec + 0.001 >= priorSpeechEnd;
  });
  const earlyVisualTransitionCount = timeline.filter((scene, index) => {
    if (index === 0) return false;
    const priorSpeechEnd = Number(measured[index - 1]?.spokenEndSec);
    return Number.isFinite(priorSpeechEnd) && scene.startSec + 0.001 < priorSpeechEnd;
  }).length;
  const transitionStartsAtSec = applicable ? timeline[finalIndex].startSec : null;
  const transitionDurationSec = applicable ? NATURAL_CLOSING_VISUAL_TRANSITION_SEC : 0;
  const nextSceneFullyVisibleAtSec = applicable
    ? Number((transitionStartsAtSec + transitionDurationSec).toFixed(3))
    : null;
  return {
    durations: durations.map((value) => Number(value.toFixed(3))),
    timeline,
    audit: {
      version: "money_shorts_natural_closing_visual_transition_v1",
      applicable,
      audioRetimed: false,
      transitionType: applicable ? "fade" : null,
      transitionDurationSec,
      transitionStartsAtSec,
      nextSceneFullyVisibleAtSec,
      transitionStartsAtAudioBoundary: !applicable ||
        Math.abs(transitionStartsAtSec - Number(measured[finalIndex]?.startSec)) <= 0.002,
      audioBoundaryAlignmentPass,
      priorSpeechCompletionPass,
      earlyVisualTransitionCount,
      totalDurationPreserved: Math.abs(outputTotal - sourceTotal) < 0.001,
      minimumSceneDurationPass: durations.every((value) => value >= 1),
      passed: audioBoundaryAlignmentPass && priorSpeechCompletionPass && earlyVisualTransitionCount === 0 &&
        Math.abs(outputTotal - sourceTotal) < 0.001 &&
        (!applicable || transitionDurationSec === NATURAL_CLOSING_VISUAL_TRANSITION_SEC),
    },
  };
}

export function buildLayeredMotionAudit(segments) {
  const rows = Array.isArray(segments) ? segments : [];
  const sourceMotionPlanCoveragePass = rows.length > 0 && rows.every((row) => row.sourceMotionPlanPresent === true);
  const staticStillCoveragePass = rows.length > 0 && rows.every((row) => row.staticStill === true);
  const imageMotionDisabledCoveragePass = rows.length > 0 && rows.every((row) =>
    row.imageMotionDisabled === true && row.cameraMode === "static_hold");
  const passed = sourceMotionPlanCoveragePass && staticStillCoveragePass && imageMotionDisabledCoveragePass;
  return {
    version: LAYERED_MOTION_RENDERER_VERSION,
    sceneCount: rows.length,
    cameraModes: [...new Set(rows.map((row) => row.cameraMode).filter(Boolean))],
    staticStillSceneCount: rows.filter((row) => row.staticStill === true).length,
    sourceMotionPlanCoveragePass,
    staticStillCoveragePass,
    imageMotionDisabledCoveragePass,
    passed,
  };
}
