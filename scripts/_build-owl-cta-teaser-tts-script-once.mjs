#!/usr/bin/env node

/**
 * 밝은 톤 teaser CTA(3편부터 follow 뒤에 이어붙이는 8초 예고 클립, 2026-09-18
 * Owner 확정) 전용 TTS 입력 JSON을 만든다.
 *
 * _build-owl-cta-tts-script-once.mjs(follow CTA용)와 동일한 패턴 —
 * TTS 러너(build-elevenlabs-korean-director-tts-from-script.mjs)가 4~18개
 * 장면을 요구하는 가드가 있어, 실제 3편 앞 3장면을 패딩으로 붙이고 teaser를
 * 마지막 장면으로 둔다. 최종적으로는 teaser(마지막 장면) 오디오 구간만
 * 잘라 쓴다.
 */

import fs from "node:fs";
import path from "node:path";
import { OWL_ASSEMBLY_SPEC } from "./_owl-assembly-spec.mjs";
import { OWL_CTA_VEO_SCENE } from "./_owl-cta-veo-scene-prompt.mjs";

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const OUT_PATH = getArg("--out") || "C:/tmp/money-shorts-os/owl-cta-teaser-tts/owl-cta-teaser-tts-script.json";
if (!/^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i.test(path.resolve(OUT_PATH))) {
  console.error("ABORT: --out 은 C:\\tmp\\money-shorts-os\\ 하위여야 합니다(TTS 러너 경로 가드).");
  process.exit(2);
}

// teaser 대본은 조립 스펙이 아니라 CTA 모션 프롬프트 모듈에만 있다(_owl-cta-
// veo-scene-prompt.mjs owl_cta_bright_teaser는 영상 프롬프트만 갖고 있으므로,
// 나레이션 원문은 Owner 확정 대본을 여기 직접 둔다).
const TEASER_NARRATION = "다음 편엔 우리 지갑을 또 뭐가 건드릴지, 알짜만 골라올게. 경제번역소였어.";
if (!OWL_CTA_VEO_SCENE.owl_cta_bright_teaser) {
  console.error("ABORT: owl_cta_bright_teaser 씬을 _owl-cta-veo-scene-prompt.mjs 에서 찾을 수 없습니다.");
  process.exit(2);
}

const padScenes = OWL_ASSEMBLY_SPEC.scenes.slice(0, 3);
if (padScenes.length < 3) {
  console.error("ABORT: 패딩용 장면이 부족합니다(3개 필요).");
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

const ROLE_MAP = {
  hook: { sceneRole: "hook", v3AudioTag: "intriguingly" },
  loss_aversion: { sceneRole: "consequence", v3AudioTag: "seriously" },
  evidence_card: { sceneRole: "situation", v3AudioTag: "clearly" },
  background: { sceneRole: "situation", v3AudioTag: "conversationally" },
  twist: { sceneRole: "psychology", v3AudioTag: "surprised" },
  impact: { sceneRole: "consequence", v3AudioTag: "seriously" },
  action: { sceneRole: "recommendation", v3AudioTag: "calmly" },
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

function buildTeaserSceneEntry(sceneNumber) {
  const performanceText = toPerformanceText(TEASER_NARRATION);
  const displayText = toDisplayText(TEASER_NARRATION);
  return {
    sceneNumber,
    sceneKey: "owl_cta_bright_teaser",
    sceneRole: "save",
    narration: TEASER_NARRATION,
    captionDisplayText: displayText,
    speechDirection: {
      engineVersion: "money_shorts_speech_direction_v2",
      performanceText,
      v3AudioTag: "warm",
      segments: toSegments(performanceText).map((text) => ({
        text,
        pauseAfterMs: /[.?!]$/.test(text) ? 520 : 300,
      })),
    },
  };
}

const scenes = [
  ...padScenes.map((s, i) => buildSceneEntry(s, i + 1)),
  buildTeaserSceneEntry(padScenes.length + 1),
];

const performanceText = toPerformanceText(TEASER_NARRATION);

const ttsScript = {
  ttsEngineVersion: "money_shorts_korean_director_v2",
  prosodyPolicy: "korean_native_cadence_v2",
  modelId: "eleven_v3",
  sourceSpecVersion: OWL_ASSEMBLY_SPEC.specVersion,
  sourceCandidate: OWL_ASSEMBLY_SPEC.sourceCandidate,
  title: "밝은 톤 teaser CTA(채널 유입용, 재사용 클립) — 패딩 3장면 포함",
  topicSpeechProfile: { globalV3Tag: "confident", baseSpeed: 0.95, baseStability: 0.44 },
  scenes,
};

fs.mkdirSync(path.dirname(path.resolve(OUT_PATH)), { recursive: true });
fs.writeFileSync(path.resolve(OUT_PATH), JSON.stringify(ttsScript, null, 2) + "\n", "utf8");
console.log(`teaser CTA TTS 입력 생성: ${OUT_PATH}`);
console.log(`  낭독: ${performanceText}`);
console.log(`  글자수: ${performanceText.length}자`);
