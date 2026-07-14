export const VEO_SCENE_SELECTION_CONTRACT_VERSION = "money_shorts_veo_scene_selection_v1" as const;

export type SceneMediaStrategy = "still" | "veo_motion";
export type SceneMediaStrategyOverride = "auto" | SceneMediaStrategy;
export type SceneMediaStrategySource = "automatic" | "manual_override" | "budget_cap";

export type VeoSceneSelectionInput = {
  sceneNumber: number;
  sceneRole: string;
  narration: string;
  visualCue?: string;
  visibleAction?: string;
  motionPlan?: string;
  override?: SceneMediaStrategyOverride;
};

export type VeoSceneSelectionDecision = {
  sceneNumber: number;
  mediaStrategy: SceneMediaStrategy;
  source: SceneMediaStrategySource;
  score: number;
  reasonCodes: string[];
};

export type VeoSceneSelectionPlan = {
  contractVersion: typeof VEO_SCENE_SELECTION_CONTRACT_VERSION;
  totalDurationSec: number;
  maxVeoMotionScenes: number;
  selectedVeoMotionSceneNumbers: number[];
  decisions: VeoSceneSelectionDecision[];
};

const MIN_VEO_CANDIDATE_SCORE = 44;

const ROLE_SCORE: Readonly<Record<string, number>> = {
  habit: 46,
  situation: 38,
  psychology: 36,
  hook: 32,
  problem: 28,
  recommendation: 24,
  mindset: 20,
  consequence: 12,
  save: 8,
};

const HAND_ACTION_RE = /\b(?:hand|hands|finger|grip|write|writing|open|close|move|remove|place|pick|lift|put|turn|check|compare|separate|pause|hold|tap|walk|step|sit|stand|look|gaze|nod|shift)\b|손|손가락|잡|쓰|적|열|닫|옮|빼|놓|들|돌|확인|비교|분리|멈|누르|걷|앉|서|바라|시선|고개/iu;
const CHARACTER_MOTION_RE = /\b(?:character|person|adult|face|eye|eyes|hair|fabric|shoulder|body|weight shift|micro-acting)\b|인물|사람|성인|얼굴|눈|머리|옷|어깨|몸|표정|행동/iu;
const OBJECT_CHANGE_RE = /\b(?:change|changing|changed|transfer|flow|enter|leave|shrink|grow|fill|empty|complete|resulting|respond)\b|변화|바뀌|이동|흐르|들어|나가|줄|늘|채우|비우|완료|결과/iu;
const STATIC_INFORMATION_RE = /\b(?:chart|graph|number|numeric|comparison|before-and-after|split composition|statement|calendar|organized system|still life)\b|차트|그래프|숫자|수치|비교표|전후 비교|분할 구도|명세서|달력|정리된 기준|정물/iu;

function normalizedText(scene: VeoSceneSelectionInput): string {
  return [
    scene.narration,
    scene.visualCue,
    scene.visibleAction,
    scene.motionPlan,
  ].filter(Boolean).join(" ");
}

function scoreScene(scene: VeoSceneSelectionInput): { score: number; reasonCodes: string[] } {
  const text = normalizedText(scene);
  let score = ROLE_SCORE[scene.sceneRole] ?? 16;
  const reasonCodes = [`role_${scene.sceneRole || "unknown"}`];

  if (HAND_ACTION_RE.test(text)) {
    score += 24;
    reasonCodes.push("observable_hand_or_gaze_action");
  }
  if (CHARACTER_MOTION_RE.test(text)) {
    score += 14;
    reasonCodes.push("character_micro_action");
  }
  if (OBJECT_CHANGE_RE.test(text)) {
    score += 12;
    reasonCodes.push("object_state_change");
  }
  if (STATIC_INFORMATION_RE.test(text)) {
    score -= 26;
    reasonCodes.push("static_information_penalty");
  }

  return { score, reasonCodes };
}

export function getVeoMotionSceneLimit(totalDurationSec: number): number {
  if (!Number.isFinite(totalDurationSec) || totalDurationSec <= 0) {
    throw new Error("veo_scene_selection_duration_invalid");
  }
  return totalDurationSec <= 30 ? 1 : 2;
}

export function selectVeoMotionScenes(
  scenes: readonly VeoSceneSelectionInput[],
  totalDurationSec: number,
): VeoSceneSelectionPlan {
  if (scenes.length === 0) throw new Error("veo_scene_selection_scenes_empty");
  const sceneNumbers = scenes.map((scene) => scene.sceneNumber);
  if (new Set(sceneNumbers).size !== scenes.length || sceneNumbers.some((value) => !Number.isInteger(value) || value < 1)) {
    throw new Error("veo_scene_selection_scene_numbers_invalid");
  }

  const maxVeoMotionScenes = getVeoMotionSceneLimit(totalDurationSec);
  const scored = scenes.map((scene) => ({
    scene,
    ...scoreScene(scene),
  }));
  const forcedMotion = scored.filter(({ scene }) => scene.override === "veo_motion");
  if (forcedMotion.length > maxVeoMotionScenes) {
    throw new Error("veo_scene_selection_manual_override_exceeds_budget");
  }

  const selected = new Set<number>(forcedMotion.map(({ scene }) => scene.sceneNumber));
  const automaticSlots = maxVeoMotionScenes - selected.size;
  const automaticCandidates = scored
    .filter(({ scene, score }) =>
      scene.override !== "still" &&
      scene.override !== "veo_motion" &&
      score >= MIN_VEO_CANDIDATE_SCORE)
    .sort((a, b) => b.score - a.score || a.scene.sceneNumber - b.scene.sceneNumber)
    .slice(0, automaticSlots);
  for (const candidate of automaticCandidates) selected.add(candidate.scene.sceneNumber);

  const decisions = scored
    .sort((a, b) => a.scene.sceneNumber - b.scene.sceneNumber)
    .map(({ scene, score, reasonCodes }): VeoSceneSelectionDecision => {
      if (scene.override === "still") {
        return {
          sceneNumber: scene.sceneNumber,
          mediaStrategy: "still",
          source: "manual_override",
          score,
          reasonCodes: [...reasonCodes, "manual_override_still"],
        };
      }
      if (scene.override === "veo_motion") {
        return {
          sceneNumber: scene.sceneNumber,
          mediaStrategy: "veo_motion",
          source: "manual_override",
          score,
          reasonCodes: [...reasonCodes, "manual_override_veo_motion"],
        };
      }
      if (selected.has(scene.sceneNumber)) {
        return {
          sceneNumber: scene.sceneNumber,
          mediaStrategy: "veo_motion",
          source: "automatic",
          score,
          reasonCodes: [...reasonCodes, "selected_within_veo_budget"],
        };
      }
      const budgetLimited = score >= MIN_VEO_CANDIDATE_SCORE && selected.size >= maxVeoMotionScenes;
      return {
        sceneNumber: scene.sceneNumber,
        mediaStrategy: "still",
        source: budgetLimited ? "budget_cap" : "automatic",
        score,
        reasonCodes: [...reasonCodes, budgetLimited ? "veo_budget_cap_applied" : "still_is_sufficient"],
      };
    });

  return {
    contractVersion: VEO_SCENE_SELECTION_CONTRACT_VERSION,
    totalDurationSec,
    maxVeoMotionScenes,
    selectedVeoMotionSceneNumbers: decisions
      .filter((decision) => decision.mediaStrategy === "veo_motion")
      .map((decision) => decision.sceneNumber),
    decisions,
  };
}
