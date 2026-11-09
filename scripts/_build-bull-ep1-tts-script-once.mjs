#!/usr/bin/env node

/**
 * 황소특보 1편 9씬 대본 → ElevenLabs TTS 입력 JSON 생성기.
 *
 * _build-bull-cta-tts-script-once.mjs와 동일한 스키마(money_shorts_korean_
 * director_v2)를 쓰되, 패딩 없이 실제 본편 9씬 전체를 그대로 담는다(CTA는
 * 별도 고정 클립이라 여기 포함하지 않음).
 *
 * 사용:
 *   node scripts/_build-bull-ep1-tts-script-once.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { BULL_EP1_ASSEMBLY_SPEC } from "./_bull-ep1-assembly-spec.mjs";

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const OUT_PATH = getArg("--out") || "C:/tmp/money-shorts-os/bull-ep1-tts/bull-ep1-tts-script.json";
if (!/^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i.test(path.resolve(OUT_PATH))) {
  console.error("ABORT: --out 은 C:\\tmp\\money-shorts-os\\ 하위여야 합니다(TTS 러너 경로 가드).");
  process.exit(2);
}

function toPerformanceText(narration) {
  return narration.replace(/^※\s*/, "").trim();
}
function toDisplayText(narration) {
  return narration.replace(/^※\s*/, "").trim();
}
function toSegments(text) {
  const parts = text.split(/(?<![0-9])([,.!?]\s*)/u).reduce((acc, cur, idx, arr) => {
    if (idx % 2 === 0) {
      const sep = arr[idx + 1] || "";
      acc.push((cur + sep).trim());
    }
    return acc;
  }, []);
  return parts.map((t) => t.trim()).filter(Boolean);
}

// _build-bull-cta-tts-script-once.mjs / build-owl-tts-script-v1.mjs와 동일한
// role → sceneRole/tag 매핑.
const ROLE_MAP = {
  opening: { sceneRole: "hook", v3AudioTag: "confident" },
  hook: { sceneRole: "hook", v3AudioTag: "intriguingly" },
  loss_aversion: { sceneRole: "consequence", v3AudioTag: "seriously" },
  evidence_card: { sceneRole: "situation", v3AudioTag: "clearly" },
  background: { sceneRole: "situation", v3AudioTag: "conversationally" },
  why: { sceneRole: "situation", v3AudioTag: "conversationally" },
  twist: { sceneRole: "psychology", v3AudioTag: "surprised" },
  impact: { sceneRole: "consequence", v3AudioTag: "seriously" },
  recommendation: { sceneRole: "recommendation", v3AudioTag: "calmly" },
  action: { sceneRole: "recommendation", v3AudioTag: "calmly" },
  save: { sceneRole: "save", v3AudioTag: "warm" },
};

function buildSceneEntry(specScene, sceneNumber) {
  const mapped = ROLE_MAP[specScene.role];
  if (!mapped) {
    console.error(`ABORT: 알 수 없는 role: ${specScene.role}`);
    process.exit(2);
  }
  const performanceText = toPerformanceText(specScene.narration);
  const displayText = toDisplayText(specScene.narration);
  return {
    sceneNumber,
    sceneKey: specScene.key,
    sceneRole: mapped.sceneRole,
    narration: specScene.narration,
    captionDisplayText: displayText,
    speechDirection: {
      engineVersion: "money_shorts_speech_direction_v2",
      performanceText,
      v3AudioTag: mapped.v3AudioTag,
      segments: toSegments(performanceText).map((text) => ({
        text,
        pauseAfterMs: /[.?!]$/.test(text) ? 520 : 300,
      })),
    },
  };
}

const scenes = BULL_EP1_ASSEMBLY_SPEC.scenes.map((s, i) => buildSceneEntry(s, i + 1));

const ttsScript = {
  ttsEngineVersion: "money_shorts_korean_director_v2",
  prosodyPolicy: "korean_native_cadence_v2",
  modelId: "eleven_v3",
  sourceSpecVersion: BULL_EP1_ASSEMBLY_SPEC.specVersion,
  sourceCandidate: BULL_EP1_ASSEMBLY_SPEC.sourceCandidate,
  title: BULL_EP1_ASSEMBLY_SPEC.title,
  topicSpeechProfile: { globalV3Tag: "confident", baseSpeed: 1.0, baseStability: 0.44 },
  scenes,
};

fs.mkdirSync(path.dirname(path.resolve(OUT_PATH)), { recursive: true });
fs.writeFileSync(path.resolve(OUT_PATH), JSON.stringify(ttsScript, null, 2) + "\n", "utf8");
console.log(`황소특보 1편 TTS 입력 생성: ${OUT_PATH}`);
console.log(`  씬 개수: ${scenes.length}`);
for (const s of scenes) {
  console.log(`  [${s.sceneNumber}] ${s.sceneKey}: ${s.narration.length}자`);
}
