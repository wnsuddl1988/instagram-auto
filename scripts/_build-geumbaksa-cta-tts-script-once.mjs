#!/usr/bin/env node

/**
 * 금박사 고정 CTA 단일 장면만 TTS 입력 JSON으로 만든다.
 *
 * _build-owl-cta-tts-script-once.mjs와 동일한 패턴(패딩 3장면 + CTA 1장면)을
 * 그대로 재사용하되, topicSpeechProfile만 금박사 설정(baseSpeed 1.04)으로
 * 바꾼다. 패딩 장면은 TTS 러너의 "4~18개 장면 필요" 가드를 채우기 위한
 * 용도일 뿐 최종적으로 버려지므로, 이미 검증된 부엉박사 앞 3장면을 그대로
 * 재사용해도 무방하다(role 매핑이 이미 맞음 — 금박사 스펙은 role 체계가 달라
 * 새로 매핑을 만들어야 하는 번거로움을 피한다).
 *
 * 배경(2026-09-21): 기존 금박사 CTA(geumbaksa_cta_clean_final.mp4)의 오디오가
 * 리드인 없이 시작해 "몰"이 씹혀 들린다는 Owner 지적. 원본 TTS 소스는 유실됨.
 * 영상(배경·모션·자막 카드)은 재사용하고 오디오만 새로 생성해 교체하는
 * 목적으로 이 스크립트를 만든다. 부엉박사 CTA에서 동일 문제를 겪었을 때와
 * 같은 해법(오디오 태그 마커 구간까지 넉넉히 자른 뒤 silenceremove로 무음만
 * 자동 트림, _ai/CURRENT_STANDARDS.md §0)을 그대로 적용한다.
 */

import fs from "node:fs";
import path from "node:path";
import { OWL_ASSEMBLY_SPEC } from "./_owl-assembly-spec.mjs";

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const OUT_PATH = getArg("--out") || "C:/tmp/money-shorts-os/geumbaksa-cta-tts-v2/geumbaksa-cta-tts-script.json";
if (!/^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i.test(path.resolve(OUT_PATH))) {
  console.error("ABORT: --out 은 C:\\tmp\\money-shorts-os\\ 하위여야 합니다(TTS 러너 경로 가드).");
  process.exit(2);
}

// 금박사 고정 CTA 나레이션(_ai/CURRENT_STANDARDS.md §2 확정 문구, 변경 없음).
const CTA_NARRATION =
  "몰랐던 돈 얘기, 금박사가 하나씩 쉽게 풀어줄게. 아는 만큼 챙길 수 있는 게 많아지니까, 팔로우 눌러두고 계속 같이 알아가자.";
const ctaScene = { key: "geumbaksa_cta_follow", role: "closing_cta", narration: CTA_NARRATION };

// 패딩용(부엉박사 앞 3장면 재사용, 최종적으로 버려짐 — 위 주석 참고).
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
  opening: { sceneRole: "hook", v3AudioTag: "confident" },
  closing_cta: { sceneRole: "save", v3AudioTag: "excited" },
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

const scenes = [
  ...padScenes.map((s, i) => buildSceneEntry(s, i + 1)),
  buildSceneEntry(ctaScene, padScenes.length + 1),
];

const performanceText = toPerformanceText(ctaScene.narration);

const ttsScript = {
  ttsEngineVersion: "money_shorts_korean_director_v2",
  prosodyPolicy: "korean_native_cadence_v2",
  modelId: "eleven_v3",
  sourceSpecVersion: "geumbaksa_cta_assembly_spec_v1",
  sourceCandidate: "geumbaksa-fixed-cta-follow-v2-leadin",
  title: "금박사 고정 CTA (채널 유입용, 재사용 클립) — 패딩 3장면 포함",
  // 금박사 전용 baseSpeed(1.04, 부엉박사 0.95보다 빠름 — CURRENT_STANDARDS.md §2)
  // 를 반영한다. stability는 두 캐릭터 공통(0.44).
  topicSpeechProfile: { globalV3Tag: "confident", baseSpeed: 1.04, baseStability: 0.44 },
  scenes,
};

fs.mkdirSync(path.dirname(path.resolve(OUT_PATH)), { recursive: true });
fs.writeFileSync(path.resolve(OUT_PATH), JSON.stringify(ttsScript, null, 2) + "\n", "utf8");
console.log(`금박사 CTA TTS 입력 생성: ${OUT_PATH}`);
console.log(`  낭독: ${performanceText}`);
console.log(`  글자수: ${performanceText.length}자`);
