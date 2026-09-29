#!/usr/bin/env node

/**
 * 고정 CTA 단일 장면만 TTS 입력 JSON으로 만든다.
 *
 * build-owl-tts-script-v1.mjs 와 동일한 스키마(money_shorts_korean_director_v2)를
 * 재사용하되, scenes 배열에 CTA 한 개만 담는다 — 기존 검증된 TTS 러너
 * (build-elevenlabs-korean-director-tts-from-script.mjs)를 그대로 쓰기 위함.
 */

import fs from "node:fs";
import path from "node:path";
import { OWL_ASSEMBLY_SPEC } from "./_owl-assembly-spec.mjs";

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const OUT_PATH = getArg("--out") || "C:/tmp/money-shorts-os/owl-cta-tts/owl-cta-tts-script.json";
if (!/^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i.test(path.resolve(OUT_PATH))) {
  console.error("ABORT: --out 은 C:\\tmp\\money-shorts-os\\ 하위여야 합니다(TTS 러너 경로 가드).");
  process.exit(2);
}

// follow CTA는 재사용 고정 클립이라 편이 바뀌어도 대본이 바뀌지 않는다
// (2편 스펙 s8_closing에서 확정된 문구, 2026-09-17 Owner: "이 문구는 CTA
// 기본으로 고정"). 3편부터 조립 스펙(_owl-assembly-spec.mjs)이 8~11장면
// 구조로 바뀌면서 closing_cta role 자체가 스펙에서 빠졌으므로, 스펙을 보는
// 대신 확정 문구를 여기 직접 둔다(teaser와 동일 패턴, 2026-09-18).
// 2026-09-18 Owner 압축 확정(B안): 음성(8.86s)이 영상(8.0s)보다 길어 마지막
// 프레임을 정지 확장해야 했던 문제 + 리드인 없이 시작해 "어"가 씹혀 들리는
// 문제(둘 다 Owner 지적)를 함께 줄이려고 1차로 "매번 쉽게"를 뺐으나(8.65s)
// 여전히 넘쳐서, "해주는"→"하는", "도 가장"→삭제로 한 번 더 압축했다.
const FOLLOW_NARRATION =
  "어려운 경제 뉴스를 내 지갑 얘기로 번역하는 경제번역소, 팔로우해두면 다음 이야기 먼저 만나볼 수 있어.";
const ctaScene = { key: "owl_cta_bright_follow", role: "closing_cta", narration: FOLLOW_NARRATION };

// TTS 러너가 4~18개 장면을 요구하는 가드가 있어(정상 쇼츠 흐름 보호용, 단일
// 장면으로는 실행 자체가 거부됨), 실제 3편의 앞 3장면을 함께 보내 그 요건을
// 채운다 — 더미 텍스트가 아니라 이미 검증된 실제 콘텐츠라 러너의 다른 검증
// 로직(어절 수 대응 등)에도 안전하다. 최종적으로는 CTA(마지막 장면) 오디오
// 구간만 잘라 쓴다.
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

// build-owl-tts-script-v1.mjs 와 동일한 role → sceneRole/tag 매핑(패딩 장면도
// 정상적인 톤으로 낭독되어야 러너의 다른 검증에 걸리지 않는다).
const ROLE_MAP = {
  hook: { sceneRole: "hook", v3AudioTag: "intriguingly" },
  loss_aversion: { sceneRole: "consequence", v3AudioTag: "seriously" },
  evidence_card: { sceneRole: "situation", v3AudioTag: "clearly" },
  background: { sceneRole: "situation", v3AudioTag: "conversationally" },
  twist: { sceneRole: "psychology", v3AudioTag: "surprised" },
  impact: { sceneRole: "consequence", v3AudioTag: "seriously" },
  action: { sceneRole: "recommendation", v3AudioTag: "calmly" },
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

// 패딩 장면을 앞에 두고 CTA를 마지막에 둔다 — 조립 후 CTA 구간(마지막 장면의
// 오디오 타임코드)만 잘라내면 되므로 위치가 명확한 게 유리하다.
const scenes = [
  ...padScenes.map((s, i) => buildSceneEntry(s, i + 1)),
  buildSceneEntry(ctaScene, padScenes.length + 1),
];

const performanceText = toPerformanceText(ctaScene.narration);

const ttsScript = {
  ttsEngineVersion: "money_shorts_korean_director_v2",
  prosodyPolicy: "korean_native_cadence_v2",
  modelId: "eleven_v3",
  sourceSpecVersion: OWL_ASSEMBLY_SPEC.specVersion,
  sourceCandidate: OWL_ASSEMBLY_SPEC.sourceCandidate,
  title: "고정 CTA (채널 유입용, 재사용 클립) — 패딩 3장면 포함",
  topicSpeechProfile: { globalV3Tag: "confident", baseSpeed: 0.95, baseStability: 0.44 },
  scenes,
};

fs.mkdirSync(path.dirname(path.resolve(OUT_PATH)), { recursive: true });
fs.writeFileSync(path.resolve(OUT_PATH), JSON.stringify(ttsScript, null, 2) + "\n", "utf8");
console.log(`CTA TTS 입력 생성: ${OUT_PATH}`);
console.log(`  낭독: ${performanceText}`);
console.log(`  글자수: ${performanceText.length}자`);
