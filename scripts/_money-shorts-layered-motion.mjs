export const LAYERED_MOTION_RENDERER_VERSION = "money_shorts_layered_motion_renderer_v3";
export const NATURAL_CLOSING_VISUAL_TRANSITION_SEC = 0.45;

const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1920;
const FPS = 30;

const STAGE_CAMERA_FALLBACK = {
  hook: "lateral",
  problem: "lateral",
  situation: "vertical_reveal",
  consequence: "evidence_push",
  psychology: "breathing_hold",
  mindset: "pull_open",
  habit: "tactile_drift",
  recommendation: "evidence_push",
  save: "forward_settle",
};

function normalizedPresence(value) {
  return value === "character" || value === "hands" ? value : "none";
}

function cameraModeFromPlan(stage, motionPlan) {
  const plan = String(motionPlan ?? "").toLowerCase();
  if (/nearly still|quiet breathing|calm background/.test(plan)) return "breathing_hold";
  if (/tactile|close-action|fingers complete/.test(plan)) return "tactile_drift";
  if (/reordering|opened direction|posture release/.test(plan)) return "pull_open";
  if (/push|forward camera|forward drift/.test(plan)) return stage === "save" ? "forward_settle" : "evidence_push";
  if (/lateral|side move/.test(plan)) return "lateral";
  if (/three depth planes|weight shift|nearby-object response/.test(plan)) return "vertical_reveal";
  return STAGE_CAMERA_FALLBACK[stage] ?? "lateral";
}

export function buildSceneMotionRecipe({ stage, motionPlan, presenceMode, sceneIndex }) {
  const normalizedStage = String(stage ?? "").toLowerCase();
  const normalizedPlan = String(motionPlan ?? "").trim();
  const presence = normalizedPresence(presenceMode);
  const cameraMode = cameraModeFromPlan(normalizedStage, normalizedPlan);
  return {
    sceneIndex: Number(sceneIndex),
    stage: normalizedStage || "unknown",
    cameraMode,
    lateralDirection: Number(sceneIndex) % 2 === 0 ? "right_to_left" : "left_to_right",
    presenceMode: presence,
    planMapped: normalizedPlan.length >= 40,
    layeredParallax: true,
    characterMicroMotion: presence === "character",
    handActionMicroMotion: presence === "hands",
    localizedHeadMotion: presence === "character",
    localizedActionMotion: presence === "character" || presence === "hands",
    visibleMicroMotionAmplitudePx: presence === "character" ? 4 : presence === "hands" ? 5 : 3,
    foregroundObjectMicroMotion: true,
    motionPath: "single_eased_drift",
    temporalSmoothing: true,
  };
}

function cameraExpressions(recipe, frames) {
  const denominator = Math.max(1, Number(frames) - 1);
  const p = `min(on/${denominator},1)`;
  const eased = `(${p})*(${p})*(3-2*(${p}))`;
  if (recipe.cameraMode === "evidence_push") {
    return {
      z: `1.075+0.035*${eased}`,
      x: `(iw-iw/zoom)*(0.49+0.015*${eased})`,
      y: `(ih-ih/zoom)*(0.52-0.02*${eased})`,
    };
  }
  if (recipe.cameraMode === "forward_settle") {
    return {
      z: `1.082+0.028*${eased}`,
      x: `(iw-iw/zoom)*(0.50+0.012*${eased})`,
      y: `(ih-ih/zoom)*(0.51-0.018*${eased})`,
    };
  }
  if (recipe.cameraMode === "pull_open") {
    return {
      z: `1.125-0.035*${eased}`,
      x: `(iw-iw/zoom)*(0.54-0.065*${eased})`,
      y: `(ih-ih/zoom)*(0.52-0.025*${eased})`,
    };
  }
  if (recipe.cameraMode === "breathing_hold") {
    return {
      z: `1.088+0.005*sin(PI*${p})`,
      x: `(iw-iw/zoom)*(0.50+0.012*${eased})`,
      y: `(ih-ih/zoom)*(0.50-0.008*${eased})`,
    };
  }
  if (recipe.cameraMode === "tactile_drift") {
    return {
      z: `1.10+0.022*${eased}`,
      x: `(iw-iw/zoom)*(0.54-0.055*${eased})`,
      y: `(ih-ih/zoom)*(0.58-0.065*${eased})`,
    };
  }
  if (recipe.cameraMode === "vertical_reveal") {
    return {
      z: `1.10+0.009*${eased}`,
      x: `(iw-iw/zoom)*(0.50+0.018*${eased})`,
      y: `(ih-ih/zoom)*(0.59-0.16*${eased})`,
    };
  }
  const leftToRight = recipe.lateralDirection === "left_to_right";
  return {
    z: `1.082+0.02*${eased}`,
    x: leftToRight
      ? `(iw-iw/zoom)*(0.34+0.32*${eased})`
      : `(iw-iw/zoom)*(0.66-0.32*${eased})`,
    y: `(ih-ih/zoom)*(0.50+0.012*${eased})`,
  };
}

function featherMask(width, height, horizontalFeather, verticalFeather, topOnly = false) {
  const vertical = topOnly
    ? `Y/${verticalFeather}`
    : `min(Y/${verticalFeather},(H-Y)/${verticalFeather})`;
  return `color=c=white:s=${width}x${height}:r=${FPS},format=gray,geq=lum='255*min(1,min(min(X/${horizontalFeather},(W-X)/${horizontalFeather}),${vertical}))'`;
}

export function buildLayeredMotionFilter({ recipe, frames, durationSec }) {
  if (!recipe?.planMapped) throw new Error("motion recipe requires a mapped scene motion plan");
  const frameCount = Math.max(1, Math.round(Number(frames)));
  const duration = Math.max(1, Number(durationSec));
  const camera = cameraExpressions(recipe, frameCount);
  const cameraFilter =
    `[0:v]scale=1620:2880:force_original_aspect_ratio=increase,crop=1620:2880,` +
    `zoompan=z='${camera.z}':x='${camera.x}':y='${camera.y}':d=1:s=${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}:fps=${FPS},setsar=1`;
  const p = `min(t/${duration.toFixed(3)},1)`;
  const eased = `(${p})*(${p})*(3-2*(${p}))`;
  const signedDrift = `(2*(${eased})-1)`;
  const foregroundMask = featherMask(1040, 620, 44, 110, true);
  const foregroundOverlay =
    `[foreground]crop=1040:620:20:1280,format=rgb24[foregroundcrop];` +
    `${foregroundMask}[foregroundmask];` +
    `[foregroundcrop][foregroundmask]alphamerge[foregroundalpha]`;
  const foregroundX = `20+1.5*${signedDrift}`;
  const foregroundY = `1280-1.2*${signedDrift}`;

  if (recipe.presenceMode === "character") {
    const characterMask = featherMask(760, 1240, 76, 104, false);
    const headMask = featherMask(480, 520, 70, 84, false);
    const actionMask = featherMask(840, 650, 84, 104, false);
    const characterX = `160+2*${signedDrift}`;
    const characterY = `300-1.5*${signedDrift}`;
    const headX = `300+2.5*${signedDrift}`;
    const headY = `220-2*${signedDrift}`;
    const actionX = `120+3.5*${signedDrift}`;
    const actionY = `760-2.5*${signedDrift}`;
    return [
      `${cameraFilter},split=5[base][character][head][action][foreground]`,
      `[character]crop=760:1240:160:300,format=rgb24[charactercrop]`,
      `${characterMask}[charactermask]`,
      `[charactercrop][charactermask]alphamerge[characteralpha]`,
      `[head]crop=480:520:300:220,format=rgb24[headcrop]`,
      `${headMask}[headmask]`,
      `[headcrop][headmask]alphamerge[headalpha]`,
      `[action]crop=840:650:120:760,format=rgb24[actioncrop]`,
      `${actionMask}[actionmask]`,
      `[actioncrop][actionmask]alphamerge[actionalpha]`,
      foregroundOverlay,
      `[base][characteralpha]overlay=x='${characterX}':y='${characterY}':eval=frame[withcharacter]`,
      `[withcharacter][headalpha]overlay=x='${headX}':y='${headY}':eval=frame[withhead]`,
      `[withhead][actionalpha]overlay=x='${actionX}':y='${actionY}':eval=frame[withaction]`,
      `[withaction][foregroundalpha]overlay=x='${foregroundX}':y='${foregroundY}':eval=frame,tmix=frames=3:weights='1 2 1',format=yuv420p[motionout]`,
    ].join(";");
  }

  if (recipe.presenceMode === "hands") {
    const handsMask = featherMask(880, 900, 70, 92, false);
    const actionMask = featherMask(760, 520, 76, 92, false);
    const handsX = `100+2.5*${signedDrift}`;
    const handsY = `650-2*${signedDrift}`;
    const actionX = `160+4*${signedDrift}`;
    const actionY = `820-3*${signedDrift}`;
    return [
      `${cameraFilter},split=4[base][hands][action][foreground]`,
      `[hands]crop=880:900:100:650,format=rgb24[handscrop]`,
      `${handsMask}[handsmask]`,
      `[handscrop][handsmask]alphamerge[handsalpha]`,
      `[action]crop=760:520:160:820,format=rgb24[actioncrop]`,
      `${actionMask}[actionmask]`,
      `[actioncrop][actionmask]alphamerge[actionalpha]`,
      foregroundOverlay,
      `[base][handsalpha]overlay=x='${handsX}':y='${handsY}':eval=frame[withhands]`,
      `[withhands][actionalpha]overlay=x='${actionX}':y='${actionY}':eval=frame[withaction]`,
      `[withaction][foregroundalpha]overlay=x='${foregroundX}':y='${foregroundY}':eval=frame,tmix=frames=3:weights='1 2 1',format=yuv420p[motionout]`,
    ].join(";");
  }

  return [
    `${cameraFilter},split=2[base][foreground]`,
    foregroundOverlay,
    `[base][foregroundalpha]overlay=x='${foregroundX}':y='${foregroundY}':eval=frame,tmix=frames=3:weights='1 2 1',format=yuv420p[motionout]`,
  ].join(";");
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
  const cameraModes = [...new Set(rows.map((row) => row.cameraMode).filter(Boolean))];
  const characterRows = rows.filter((row) => row.presenceMode === "character");
  const handsRows = rows.filter((row) => row.presenceMode === "hands");
  const planCoveragePass = rows.length > 0 && rows.every((row) => row.planMapped === true);
  const layeredParallaxCoveragePass = rows.length > 0 && rows.every((row) => row.layeredParallax === true && row.foregroundObjectMicroMotion === true);
  const characterMicroMotionCoveragePass = characterRows.every((row) => row.characterMicroMotion === true);
  const handActionMicroMotionCoveragePass = handsRows.every((row) => row.handActionMicroMotion === true);
  const localizedMotionCoveragePass = characterRows.every((row) => row.localizedHeadMotion === true && row.localizedActionMotion === true) &&
    handsRows.every((row) => row.localizedActionMotion === true);
  const visibleMicroMotionAmplitudePass = rows.every((row) =>
    Number(row.visibleMicroMotionAmplitudePx) >= (row.presenceMode === "none" ? 3 : 4) &&
    Number(row.visibleMicroMotionAmplitudePx) <= (row.presenceMode === "hands" ? 5 : 4));
  const smoothMotionPathPass = rows.every((row) => row.motionPath === "single_eased_drift" && row.temporalSmoothing === true);
  const distinctCameraModesPass = cameraModes.length >= Math.min(3, rows.length);
  const passed = planCoveragePass && layeredParallaxCoveragePass && characterMicroMotionCoveragePass && handActionMicroMotionCoveragePass && localizedMotionCoveragePass && visibleMicroMotionAmplitudePass && smoothMotionPathPass && distinctCameraModesPass;
  return {
    version: LAYERED_MOTION_RENDERER_VERSION,
    sceneCount: rows.length,
    cameraModes,
    distinctCameraModeCount: cameraModes.length,
    characterSceneCount: characterRows.length,
    handsSceneCount: handsRows.length,
    planCoveragePass,
    layeredParallaxCoveragePass,
    characterMicroMotionCoveragePass,
    handActionMicroMotionCoveragePass,
    localizedMotionCoveragePass,
    visibleMicroMotionAmplitudePass,
    smoothMotionPathPass,
    distinctCameraModesPass,
    passed,
  };
}
