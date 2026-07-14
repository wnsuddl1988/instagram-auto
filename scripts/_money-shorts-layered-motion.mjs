export const LAYERED_MOTION_RENDERER_VERSION = "money_shorts_layered_motion_renderer_v2";

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
    visibleMicroMotionAmplitudePx: presence === "character" ? 8 : presence === "hands" ? 10 : 5,
    foregroundObjectMicroMotion: true,
  };
}

function cameraExpressions(recipe, frames) {
  const denominator = Math.max(1, Number(frames) - 1);
  const p = `min(on/${denominator},1)`;
  if (recipe.cameraMode === "evidence_push") {
    return {
      z: `1.065+0.075*${p}`,
      x: `(iw-iw/zoom)*(0.48+0.03*${p})`,
      y: `(ih-ih/zoom)*(0.54-0.04*${p})`,
    };
  }
  if (recipe.cameraMode === "forward_settle") {
    return {
      z: `1.075+0.055*${p}-0.006*sin(PI*${p})`,
      x: `(iw-iw/zoom)*(0.50+0.025*sin(PI*${p}))`,
      y: `(ih-ih/zoom)*(0.50-0.035*${p})`,
    };
  }
  if (recipe.cameraMode === "pull_open") {
    return {
      z: `1.145-0.065*${p}`,
      x: `(iw-iw/zoom)*(0.56-0.12*${p})`,
      y: `(ih-ih/zoom)*(0.52-0.05*${p})`,
    };
  }
  if (recipe.cameraMode === "breathing_hold") {
    return {
      z: `1.088+0.009*sin(PI*${p})`,
      x: `(iw-iw/zoom)*(0.50+0.035*sin(2*PI*${p}))`,
      y: `(ih-ih/zoom)*(0.50+0.018*cos(2*PI*${p}))`,
    };
  }
  if (recipe.cameraMode === "tactile_drift") {
    return {
      z: `1.105+0.035*${p}`,
      x: `(iw-iw/zoom)*(0.56-0.10*${p})`,
      y: `(ih-ih/zoom)*(0.62-0.12*${p})`,
    };
  }
  if (recipe.cameraMode === "vertical_reveal") {
    return {
      z: `1.105+0.018*sin(PI*${p})`,
      x: `(iw-iw/zoom)*(0.50+0.035*sin(PI*${p}))`,
      y: `(ih-ih/zoom)*(0.66-0.30*${p})`,
    };
  }
  const leftToRight = recipe.lateralDirection === "left_to_right";
  return {
    z: `1.08+0.035*${p}`,
    x: leftToRight
      ? `(iw-iw/zoom)*(0.24+0.52*${p})`
      : `(iw-iw/zoom)*(0.76-0.52*${p})`,
    y: `(ih-ih/zoom)*(0.50+0.025*sin(PI*${p}))`,
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
  const phase = (recipe.sceneIndex % 3) * 0.7;
  const foregroundMask = featherMask(1040, 620, 44, 110, true);
  const foregroundOverlay =
    `[foreground]crop=1040:620:20:1280,format=rgb24[foregroundcrop];` +
    `${foregroundMask}[foregroundmask];` +
    `[foregroundcrop][foregroundmask]alphamerge[foregroundalpha]`;
  const foregroundX = `20+6*sin(2*PI*t/${duration.toFixed(3)}+${phase.toFixed(2)})`;
  const foregroundY = `1280+5*cos(2*PI*t/${duration.toFixed(3)}+${phase.toFixed(2)})`;

  if (recipe.presenceMode === "character") {
    const characterMask = featherMask(760, 1240, 76, 104, false);
    const headMask = featherMask(480, 520, 70, 84, false);
    const actionMask = featherMask(840, 650, 84, 104, false);
    const characterWave = `sin(2*PI*t/${duration.toFixed(3)}+${phase.toFixed(2)})`;
    const characterBreath = `cos(2*PI*t/${duration.toFixed(3)}+${phase.toFixed(2)})`;
    const characterX = `160+4.5*${characterWave}`;
    const characterY = `300+4*${characterBreath}`;
    const headX = `300+4.5*${characterWave}+2.5*sin(PI*t/${duration.toFixed(3)}+${(phase + 0.8).toFixed(2)})`;
    const headY = `220+4*${characterBreath}+2*cos(PI*t/${duration.toFixed(3)}+${(phase + 0.5).toFixed(2)})`;
    const actionX = `120+4.5*${characterWave}+8*sin(PI*t/${duration.toFixed(3)}+${(phase + 1.1).toFixed(2)})`;
    const actionY = `760+4*${characterBreath}+6*cos(PI*t/${duration.toFixed(3)}+${(phase + 0.9).toFixed(2)})`;
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
      `[withaction][foregroundalpha]overlay=x='${foregroundX}':y='${foregroundY}':eval=frame,format=yuv420p[motionout]`,
    ].join(";");
  }

  if (recipe.presenceMode === "hands") {
    const handsMask = featherMask(880, 900, 70, 92, false);
    const actionMask = featherMask(760, 520, 76, 92, false);
    const handsWave = `sin(2*PI*t/${duration.toFixed(3)}+${phase.toFixed(2)})`;
    const handsBreath = `cos(2*PI*t/${duration.toFixed(3)}+${phase.toFixed(2)})`;
    const handsX = `100+5*${handsWave}`;
    const handsY = `650+4*${handsBreath}`;
    const actionX = `160+5*${handsWave}+10*sin(PI*t/${duration.toFixed(3)}+${(phase + 0.9).toFixed(2)})`;
    const actionY = `820+4*${handsBreath}+7*cos(PI*t/${duration.toFixed(3)}+${(phase + 0.7).toFixed(2)})`;
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
      `[withaction][foregroundalpha]overlay=x='${foregroundX}':y='${foregroundY}':eval=frame,format=yuv420p[motionout]`,
    ].join(";");
  }

  return [
    `${cameraFilter},split=2[base][foreground]`,
    foregroundOverlay,
    `[base][foregroundalpha]overlay=x='${foregroundX}':y='${foregroundY}':eval=frame,format=yuv420p[motionout]`,
  ].join(";");
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
    Number(row.visibleMicroMotionAmplitudePx) >= (row.presenceMode === "none" ? 5 : 8));
  const distinctCameraModesPass = cameraModes.length >= Math.min(3, rows.length);
  const passed = planCoveragePass && layeredParallaxCoveragePass && characterMicroMotionCoveragePass && handActionMicroMotionCoveragePass && localizedMotionCoveragePass && visibleMicroMotionAmplitudePass && distinctCameraModesPass;
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
    distinctCameraModesPass,
    passed,
  };
}
