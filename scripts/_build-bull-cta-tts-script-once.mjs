#!/usr/bin/env node

/**
 * 황소특보(bull3dv1) 고정 CTA 단일 클립 TTS 입력 JSON.
 *
 * _build-owl-cta-tts-script-once.mjs와 동일 패턴: 러너
 * (build-elevenlabs-korean-director-tts-from-script.mjs)의 "4~18 장면" 가드를
 * 채우기 위해 실제 검증된 기존 대본에서 3장면을 패딩으로 앞에 붙이고, 확정된
 * 황소특보 CTA 나레이션을 마지막 장면으로 둔다. 패딩 장면은 최종 산출물에
 * 전혀 쓰이지 않고 버려진다(오디오 트림 단계에서 마지막 장면 구간만 취함).
 *
 * 부엉박사는 follow+teaser 2클립 구조이지만, 황소특보는 Owner 확정으로
 * 단일 클립(follow+teaser 통합)이라 CTA 장면은 하나뿐이다.
 */

import fs from "node:fs";
import path from "node:path";
import { OWL_ASSEMBLY_SPEC } from "./_owl-assembly-spec.mjs";

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const OUT_PATH = getArg("--out") || "C:/tmp/money-shorts-os/bull-cta-tts/bull-cta-tts-script.json";
if (!/^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i.test(path.resolve(OUT_PATH))) {
  console.error("ABORT: --out 은 C:\\tmp\\money-shorts-os\\ 하위여야 합니다(TTS 러너 경로 가드).");
  process.exit(2);
}

// 황소특보 CTA 확정 나레이션(Owner 승인 완료, 절대 임의 수정 금지).
// v1 문구("실시간 시황, 놓치면 손해야... 장 열리자마자 가장 먼저")는 "실시간"/
// "장 열리자마자"가 실제 캐릭터 속성(1~2일 내 시황·섹터·종목 소식 전달, 장
// 개장과 동시가 아님)과 맞지 않아 Owner 지적으로 폐기(2026-09-23). 여러 차례
// 재작성 시도 끝에, "팔로우하면 구체적으로 뭘 얻는지"를 명확히 말하는 구조로
// 확정 — 막연한 "놓치면 손해" 위협 문구 대신 실질적 효용(핵심만 정리해서
// 가장 먼저 전달)을 명시.
// 리스크 고지 문구는 이 CTA에 넣지 않는다 — 리스크 고지는 본편 오프닝/클로징
// 전용이며 CTA와는 완전히 분리된 개념(Owner 확정).
const CTA_NARRATION =
  "새로운 투자 소식 나올 때마다, 핵심만 정리해서 가장 먼저 알려줄게. 팔로우해두면 놓치는 일 없어. 황소특보였어.";
const ctaScene = { key: "bull_cta_fixed_follow_teaser", role: "closing_cta", narration: CTA_NARRATION };

// 패딩용 실제 콘텐츠 3장면: 기존 검증된 부엉박사 10편 스펙(OWL_ASSEMBLY_SPEC)의
// 앞 3장면을 그대로 재사용한다(더미 텍스트 금지 원칙, _build-owl-cta-tts-script-once.mjs와 동일 근거).
// 최종 산출물에는 쓰이지 않고 버려진다.
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

// build-owl-tts-script-v1.mjs / _build-owl-cta-tts-script-once.mjs와 동일한
// role → sceneRole/tag 매핑(패딩 장면도 정상적인 톤으로 낭독되어야 러너의
// 다른 검증에 걸리지 않는다).
const ROLE_MAP = {
  opening: { sceneRole: "hook", v3AudioTag: "confident" },
  hook: { sceneRole: "hook", v3AudioTag: "intriguingly" },
  loss_aversion: { sceneRole: "consequence", v3AudioTag: "seriously" },
  evidence_card: { sceneRole: "situation", v3AudioTag: "clearly" },
  background: { sceneRole: "situation", v3AudioTag: "conversationally" },
  why: { sceneRole: "situation", v3AudioTag: "conversationally" },
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
  sourceSpecVersion: "bull_cta_fixed_v1",
  sourceCandidate: "bull3dv1-fixed-cta",
  title: "황소특보 고정 CTA(단일 클립, follow+teaser 통합) — 패딩 3장면 포함",
  topicSpeechProfile: { globalV3Tag: "confident", baseSpeed: 1.0, baseStability: 0.44 },
  scenes,
};

fs.mkdirSync(path.dirname(path.resolve(OUT_PATH)), { recursive: true });
fs.writeFileSync(path.resolve(OUT_PATH), JSON.stringify(ttsScript, null, 2) + "\n", "utf8");
console.log(`황소특보 CTA TTS 입력 생성: ${OUT_PATH}`);
console.log(`  낭독: ${performanceText}`);
console.log(`  글자수: ${performanceText.length}자`);
