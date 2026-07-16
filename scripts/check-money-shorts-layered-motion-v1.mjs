#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  LAYERED_MOTION_RENDERER_VERSION,
  buildLayeredMotionAudit,
  buildLayeredMotionFilter,
  buildSceneMotionRecipe,
  buildAudioSynchronizedVisualTimeline,
} from "./_money-shorts-layered-motion.mjs";

let passed = 0;
let failed = 0;
function check(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}`);
  }
}

const samples = [
  ["hook", "a brief gaze shift, one small hand decision and a slow lateral camera drift across the foreground", "character"],
  ["problem", "one object completes the cause-to-result transfer while the camera makes a restrained side move through three depth planes", "none"],
  ["situation", "a natural eye movement, one purposeful hand action, a gentle weight shift and nearby-object response", "character"],
  ["consequence", "the changed object state settles while the camera makes a short evidence-focused push", "none"],
  ["psychology", "a restrained eye turn, quiet breathing and a nearly still camera with slight depth parallax", "character"],
  ["mindset", "one calm reordering gesture, a small posture release and a gentle camera move toward the newly opened direction", "character"],
  ["habit", "fingers complete one concrete step while the camera holds a tactile close-action drift", "hands"],
  ["save", "a measured eye turn, one settled story prop and a slow forward camera drift through room depth", "character"],
].map(([stage, motionPlan, presenceMode], index) => buildSceneMotionRecipe({
  stage,
  motionPlan,
  presenceMode,
  sceneIndex: index + 1,
}));

const audit = buildLayeredMotionAudit(samples);
const filters = samples.map((recipe) => buildLayeredMotionFilter({ recipe, frames: 90, durationSec: 3 }));

check("renderer contract is versioned", LAYERED_MOTION_RENDERER_VERSION === "money_shorts_layered_motion_renderer_v3");
check("every semantic motion plan maps to a camera recipe", samples.every((recipe) => recipe.planMapped));
check("motion audit covers at least three distinct camera modes", audit.distinctCameraModeCount >= 3 && audit.distinctCameraModesPass);
check("every scene receives layered foreground parallax", audit.layeredParallaxCoveragePass && filters.every((filter) => /foregroundalpha/.test(filter)));
check("character scenes receive a feathered micro-motion layer", audit.characterMicroMotionCoveragePass && filters.filter((_, index) => samples[index].presenceMode === "character").every((filter) => /characteralpha/.test(filter)));
check("hands-only scenes receive a separate action layer", audit.handActionMicroMotionCoveragePass && filters.filter((_, index) => samples[index].presenceMode === "hands").every((filter) => /handsalpha/.test(filter)));
check("character head and action areas receive independent feathered motion", audit.localizedMotionCoveragePass && filters.filter((_, index) => samples[index].presenceMode === "character").every((filter) => /headalpha/.test(filter) && /actionalpha/.test(filter)));
check("micro-motion amplitude is visible but restrained", audit.visibleMicroMotionAmplitudePass && samples.every((recipe) => recipe.visibleMicroMotionAmplitudePx >= (recipe.presenceMode === "none" ? 3 : 4) && recipe.visibleMicroMotionAmplitudePx <= (recipe.presenceMode === "hands" ? 5 : 4)));
check("masked layers use one eased path with temporal smoothing", audit.smoothMotionPathPass && samples.every((recipe) => recipe.motionPath === "single_eased_drift" && recipe.temporalSmoothing === true) && filters.every((filter) => /tmix=frames=3/.test(filter)));
check("camera recipes include lateral, push, pull, vertical and breathing behavior", ["lateral", "evidence_push", "pull_open", "vertical_reveal", "breathing_hold"].every((mode) => audit.cameraModes.includes(mode)));
check("filter uses eased time-varying motion rather than periodic layer bobbing", filters.every((filter) => /on\//.test(filter) && /3-2\*/.test(filter)) && filters.every((filter) => !/2\*PI\*t/.test(filter)));
check("combined motion audit passes", audit.passed === true);

const closingTimeline = buildAudioSynchronizedVisualTimeline(
  [{ sceneNumber: 1, sceneRole: "habit" }, { sceneNumber: 2, sceneRole: "save" }],
  [
    { startSec: 0, spokenEndSec: 5.12, normalizedDurationSec: 5.319 },
    { startSec: 5.319, spokenEndSec: 13.692, normalizedDurationSec: 8.653 },
  ],
);
check("final bridge keeps source audio timing and plans a 0.45s visual fade",
  closingTimeline.audit.passed === true &&
  closingTimeline.timeline[1].startSec === 5.319 &&
  closingTimeline.timeline[1].durationSec === 8.653 &&
  closingTimeline.audit.audioRetimed === false &&
  closingTimeline.audit.transitionType === "fade" &&
  closingTimeline.audit.transitionDurationSec === 0.45 &&
  closingTimeline.audit.transitionStartsAtSec === 5.319 &&
  closingTimeline.audit.nextSceneFullyVisibleAtSec === 5.769 &&
  closingTimeline.audit.transitionStartsAtAudioBoundary === true &&
  closingTimeline.audit.audioBoundaryAlignmentPass === true &&
  closingTimeline.audit.priorSpeechCompletionPass === true &&
  closingTimeline.audit.earlyVisualTransitionCount === 0 &&
  closingTimeline.audit.totalDurationPreserved === true);

const argv = process.argv.slice(2);
const smokeIndex = argv.indexOf("--render-smoke");
if (smokeIndex >= 0) {
  const input = path.resolve(argv[smokeIndex + 1] ?? "");
  const outIndex = argv.indexOf("--out");
  const output = path.resolve(outIndex >= 0 ? argv[outIndex + 1] ?? "" : "");
  check("smoke input exists", fs.existsSync(input));
  check("smoke output stays under C:\\tmp\\money-shorts-os", /^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i.test(output));
  if (fs.existsSync(input) && /^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i.test(output)) {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    const smokeRecipes = [
      samples.find((recipe) => recipe.presenceMode === "character"),
      samples.find((recipe) => recipe.presenceMode === "hands"),
      samples.find((recipe) => recipe.presenceMode === "none"),
    ].filter(Boolean);
    const parsed = path.parse(output);
    for (const recipe of smokeRecipes) {
      const target = recipe.presenceMode === "character"
        ? output
        : path.join(parsed.dir, `${parsed.name}-${recipe.presenceMode}${parsed.ext || ".mp4"}`);
      const frames = 90;
      const filter = buildLayeredMotionFilter({ recipe, frames, durationSec: 3 });
      const render = spawnSync("ffmpeg", [
        "-y", "-loop", "1", "-framerate", "30", "-i", input,
        "-filter_complex", filter, "-map", "[motionout]", "-frames:v", String(frames),
        "-c:v", "libx264", "-crf", "21", "-preset", "fast", "-an", target,
      ], { shell: false, encoding: "utf8", timeout: 120_000, maxBuffer: 16 * 1024 * 1024 });
      check(`ffmpeg ${recipe.presenceMode} layered-motion smoke render succeeds`, render.status === 0 && fs.existsSync(target) && fs.statSync(target).size > 0);
      if (render.status !== 0) console.error((render.stderr ?? "").slice(-1600));
    }
  }
}

console.log(`\n${passed + failed} checks — ${passed} PASS, ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
