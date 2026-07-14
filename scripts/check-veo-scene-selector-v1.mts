import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// @ts-expect-error Node strip-types 실행은 로컬 TypeScript 파일 확장자를 명시해야 한다.
import { VEO_SCENE_SELECTION_CONTRACT_VERSION, getVeoMotionSceneLimit, selectVeoMotionScenes, type VeoSceneSelectionInput } from "../lib/veo-scene-selector.ts";

let passed = 0;
function check(name: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
}

const baseScenes: VeoSceneSelectionInput[] = [
  {
    sceneNumber: 1,
    sceneRole: "consequence",
    narration: "두 금액을 비교한다",
    visualCue: "static chart and numeric comparison",
    visibleAction: "show the changed total",
  },
  {
    sceneNumber: 2,
    sceneRole: "situation",
    narration: "민재가 고지서를 확인한다",
    visualCue: "one Korean adult in a lived-in room",
    visibleAction: "a gaze shift and one hand opens the statement",
  },
  {
    sceneNumber: 3,
    sceneRole: "habit",
    narration: "자동이체 순서를 먼저 옮긴다",
    visualCue: "hands move the protected token ahead of spending",
    visibleAction: "a hand completes the transfer",
  },
  {
    sceneNumber: 4,
    sceneRole: "save",
    narration: "기준을 저장해 둔다",
    visualCue: "calm resolved final still",
  },
];

check("contract version is stable", () => {
  assert.equal(VEO_SCENE_SELECTION_CONTRACT_VERSION, "money_shorts_veo_scene_selection_v1");
});

check("up to 30 seconds allows one Veo scene", () => {
  assert.equal(getVeoMotionSceneLimit(30), 1);
});

check("31 to 60 seconds allows two Veo scenes", () => {
  assert.equal(getVeoMotionSceneLimit(31), 2);
  assert.equal(getVeoMotionSceneLimit(60), 2);
});

check("short plan selects only the strongest action scene", () => {
  const plan = selectVeoMotionScenes(baseScenes, 28);
  assert.deepEqual(plan.selectedVeoMotionSceneNumbers, [3]);
  assert.equal(plan.decisions.filter((decision) => decision.mediaStrategy === "veo_motion").length, 1);
});

check("long plan keeps the Veo count under two", () => {
  const plan = selectVeoMotionScenes(baseScenes, 45);
  assert.deepEqual(plan.selectedVeoMotionSceneNumbers, [2, 3]);
  assert.equal(plan.maxVeoMotionScenes, 2);
});

check("static information scene remains still", () => {
  const plan = selectVeoMotionScenes(baseScenes, 45);
  assert.equal(plan.decisions[0].mediaStrategy, "still");
});

check("manual still override is respected", () => {
  const scenes = baseScenes.map((scene) => scene.sceneNumber === 3 ? { ...scene, override: "still" as const } : scene);
  const plan = selectVeoMotionScenes(scenes, 28);
  assert.equal(plan.decisions[2].mediaStrategy, "still");
  assert.equal(plan.decisions[2].source, "manual_override");
});

check("manual Veo override is prioritized", () => {
  const scenes = baseScenes.map((scene) => scene.sceneNumber === 2 ? { ...scene, override: "veo_motion" as const } : scene);
  const plan = selectVeoMotionScenes(scenes, 28);
  assert.deepEqual(plan.selectedVeoMotionSceneNumbers, [2]);
  assert.equal(plan.decisions[1].source, "manual_override");
});

check("manual overrides cannot silently exceed the credit budget", () => {
  const scenes = baseScenes.map((scene) => scene.sceneNumber <= 2 ? { ...scene, override: "veo_motion" as const } : scene);
  assert.throws(
    () => selectVeoMotionScenes(scenes, 28),
    /manual_override_exceeds_budget/,
  );
});

check("selection is deterministic", () => {
  assert.deepEqual(
    selectVeoMotionScenes(baseScenes, 45),
    selectVeoMotionScenes(baseScenes, 45),
  );
});

const ownerOperatorSource = readFileSync(new URL("../lib/owner-web-operator.ts", import.meta.url), "utf8");
const wizardSource = readFileSync(new URL("../components/VideoCreationWizard.tsx", import.meta.url), "utf8");
const selectorSource = readFileSync(new URL("../lib/veo-scene-selector.ts", import.meta.url), "utf8");

check("wizard scenes persist the selector decision contract", () => {
  assert.match(ownerOperatorSource, /mediaStrategyContractVersion:\s*plan\.contractVersion/);
  assert.match(ownerOperatorSource, /mediaStrategy:\s*decision\.mediaStrategy/);
  assert.match(ownerOperatorSource, /wizardSceneMediaStrategiesAreValid/);
  assert.match(ownerOperatorSource, /m:\s*preview\.scenes\.map/);
  assert.match(ownerOperatorSource, /override:\s*scene\.mediaStrategyOverride/);
});

check("render and TTS inputs carry the same media decision", () => {
  assert.ok((ownerOperatorSource.match(/mediaStrategy:\s*(?:sourceScenes\[i\]|scene)\.mediaStrategy/g) ?? []).length >= 2);
  assert.ok((ownerOperatorSource.match(/mediaStrategyReasonCodes:/g) ?? []).length >= 3);
});

check("operator UI labels Flow candidates without claiming generation", () => {
  assert.match(wizardSource, /Flow 모션 후보/);
  assert.match(wizardSource, /실제 생성은 Owner 확인 후 진행/);
  assert.match(wizardSource, /모든 이미지를 영상화하지 않습니다/);
});

check("selector has no external execution path", () => {
  assert.doesNotMatch(selectorSource, /fetch\s*\(|spawn|playwright|credit|ALLOW_/i);
});

console.log(`\nVeo scene selector: ${passed}/${passed} PASS`);
