#!/usr/bin/env node

/**
 * 부엉이 8장면 대본 → ElevenLabs TTS 입력 JSON 생성기.
 *
 * 기존 build-elevenlabs-korean-director-tts-from-script.mjs 가 요구하는 스펙
 * (money_shorts_korean_director_v2)에 맞춰 입력 파일을 만든다. 그 러너는
 * --tts-script / --out-dir 가 반드시 C:\tmp\money-shorts-os\ 하위여야 하므로
 * 출력 기본 경로도 거기에 둔다 — 러너의 경로 가드를 고치는 대신 규약을 따른다.
 *
 * narration 표기 처리:
 *   대본 원문은 "2.75연%"처럼 ECOS 단위(연%)를 그대로 쓴다. 이건 화면 표기용
 *   원문이고 음성으로는 "연 이점칠오 퍼센트"로 읽혀야 자연스럽다. performanceText
 *   에서만 읽기 쉬운 형태로 바꾸고, narration 원문은 그대로 보존해 대본-음성의
 *   대응 관계를 잃지 않는다.
 *
 * 사용:
 *   node scripts/build-owl-tts-script-v1.mjs
 *   node scripts/build-owl-tts-script-v1.mjs --out C:/tmp/money-shorts-os/owl-tts/tts-script.json
 */

import fs from "node:fs";
import path from "node:path";
import { OWL_ASSEMBLY_SPEC } from "./_owl-assembly-spec.mjs";

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const OUT_PATH = getArg("--out") || "C:/tmp/money-shorts-os/owl-tts/owl-tts-script.json";

// TTS 러너의 경로 가드와 동일한 조건. 여기서 미리 막아 러너 실행 전에 알린다.
if (!/^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i.test(path.resolve(OUT_PATH))) {
  console.error("ABORT: --out 은 C:\\tmp\\money-shorts-os\\ 하위여야 합니다(TTS 러너 경로 가드).");
  process.exit(2);
}

/**
 * 화면(자막)과 음성(TTS)의 숫자 표기는 달라야 한다.
 *
 *   자막: "0.25%p"   — 숫자 그대로. 한글로 풀어 쓰면 읽는 속도가 느려지고
 *                      벤치마킹 채널(숫자를 크게 강조)과도 어긋난다.
 *   음성: "영점이오 퍼센트포인트" — TTS가 "0.25"를 어색하게 읽는 사례가 있어
 *                      낭독 형태를 명시한다.
 *
 * 두 텍스트는 **어절 수가 같아야 한다.** 자막 모듈이 TTS alignment(문자 타임스탬프)로
 * 어절별 시각을 잡고, 그 자리에 자막 어절을 얹기 때문이다. 그래서 치환은 항상
 * "한 어절 → 한 어절"로 한다. 예: "0.25%p" 한 덩어리 → "영점이오퍼센트포인트"
 * 한 덩어리(공백 없이). 공백을 넣으면 어절 수가 어긋나 자막이 밀린다.
 */
const SPOKEN_NUMBER_MAP = {
  "2.75": "이점칠오",
  "0.25": "영점이오",
  "3": "삼",
  "20": "이십",
  "1000": "천",
  "8": "팔",
  "27": "이십칠",
  "34": "삼십사",
  "1": "일",
  "6": "육",
  // 5편(한국은행 11월 추가 인상) 신규 수치
  "3.00": "삼점영영",
  "3.5": "삼점오",
  "4.063": "사점영육삼",
  "1380.3": "천삼백팔십점삼",
};

function spokenNumber(num) {
  return SPOKEN_NUMBER_MAP[num] ?? num;
}

/** 어절 하나를 낭독형으로 바꾼다. 공백을 만들지 않는 것이 규칙이다. */
function toSpokenWord(word) {
  return word
    // "HUG"(주택도시보증공사 상품명)를 영문 그대로 두면 TTS가 "휴즈"로 읽는다
    // (Owner 2026-09-18 지적). 실제 발음인 "허그"로 치환 — 화면 표시(overlay,
    // 자막의 displayText)는 toDisplayText가 별도로 처리하므로 HUG 그대로 유지된다.
    .replace(/HUG/g, "허그")
    .replace(/([0-9]+(?:\.[0-9]+)?)%p/g, (_, n) => `${spokenNumber(n)}퍼센트포인트`)
    .replace(/([0-9]+(?:\.[0-9]+)?)%/g, (_, n) => `${spokenNumber(n)}퍼센트`)
    .replace(/([0-9]+(?:\.[0-9]+)?)원/g, (_, n) => `${spokenNumber(n)}원`)
    .replace(/([0-9]+)만원/g, (_, n) => `${spokenNumber(n)}만원`)
    .replace(/([0-9]+)월/g, (_, n) => `${spokenNumber(n)}월`)
    .replace(/([0-9]+)일/g, (_, n) => `${spokenNumber(n)}일`)
    .replace(/([0-9]+)개월/g, (_, n) => `${spokenNumber(n)}개월`)
    .replace(/([0-9]+)조원/g, (_, n) => `${spokenNumber(n)}조원`)
    .replace(/([0-9]+)분/g, (_, n) => `${spokenNumber(n)}분`)
    .replace(/([0-9]+)만/g, (_, n) => `${spokenNumber(n)}만`);
}

function toPerformanceText(narration) {
  return narration
    .replace(/^※\s*/, "")
    .split(/\s+/)
    .map(toSpokenWord)
    .join(" ")
    .trim();
}

/** 자막에 쓸 표시 텍스트. 숫자를 그대로 두고 ※ 같은 기호만 정리한다. */
function toDisplayText(narration) {
  return narration.replace(/^※\s*/, "").trim();
}

// 장면 역할 → 러너가 아는 sceneRole + 낭독 톤. 부엉이 캐릭터는 "날카롭고 냉철한"
// 톤이 기본이지만, 모바일 검수(2026-09-17)에서 "강약 대비가 더 필요하다"는
// 지적을 받아 장면마다 톤 차이를 더 크게 벌린다. 특히 마지막 CTA는 "너무
// 침착해서 사로잡는 느낌이 없다"는 지적대로 warm(잔잔함) 대신 밝고 에너지
// 있는 톤으로 바꾼다 — 시청자가 팔로우를 누르고 싶어지는 순간이어야 한다.
const ROLE_MAP = {
  // 8편부터 신설된 오프닝 씬(인사+주제 예고). 부엉이 기본 톤인 확신에 찬
  // 느낌을 그대로 쓰되, sceneRole은 러너가 아는 값 중 인사·소개에 가장
  // 가까운 "hook"으로 재사용한다(러너가 opening이라는 sceneRole 자체를
  // 모르므로 별도 신설하지 않고 기존 값을 씀 — 자막·타이밍 로직에 영향 없음).
  opening: { sceneRole: "hook", v3AudioTag: "confident" },
  hook: { sceneRole: "hook", v3AudioTag: "intriguingly" },
  loss_aversion: { sceneRole: "consequence", v3AudioTag: "seriously" },
  evidence_card: { sceneRole: "situation", v3AudioTag: "clearly" },
  background: { sceneRole: "situation", v3AudioTag: "conversationally" },
  twist: { sceneRole: "psychology", v3AudioTag: "surprised" },
  impact: { sceneRole: "consequence", v3AudioTag: "seriously" },
  action: { sceneRole: "recommendation", v3AudioTag: "calmly" },
  closing_cta: { sceneRole: "save", v3AudioTag: "excited" },
};

/**
 * performanceText 를 호흡 단위 세그먼트로 나눈다.
 *
 * 두 가지를 동시에 만족해야 한다:
 *  - TTS: 세그먼트 사이 pause 로 읽히므로 자연스러운 호흡 지점이어야 한다.
 *  - 자막: _money-shorts-dynamic-captions.mjs 가 이 세그먼트를 블록 분할의
 *    1차 경계로 쓴다. 장면 전체를 세그먼트 하나로 두면 15어절짜리 블록이 나와
 *    계약(1~5어절·34자)을 위반한다.
 *
 * 세그먼트를 이어붙인 결과가 performanceText 와 정확히 일치해야 하므로
 * (자막 모듈이 indexOf 로 위치를 찾는다) 구두점 뒤 공백에서만 자른다.
 *
 * 쉼표뿐 아니라 마침표·물음표에서도 자른다. 벤치마킹 채널은 한 문장도 여러 번
 * 나눠 띄우는데, 자막이 짧을수록 글자를 크게 키울 수 있기 때문이다.
 */
function toSegments(performanceText) {
  const parts = [];
  let rest = performanceText;
  while (rest.length > 0) {
    const match = rest.match(/[,.?!] /);
    if (!match) {
      parts.push(rest);
      break;
    }
    const cut = match.index + 1;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut + 1);
  }
  return parts.map((text) => text.trim()).filter(Boolean);
}

const scenes = OWL_ASSEMBLY_SPEC.scenes.map((s) => {
  const mapped = ROLE_MAP[s.role];
  if (!mapped) {
    console.error(`ABORT: 알 수 없는 role: ${s.role}`);
    process.exit(2);
  }
  const performanceText = toPerformanceText(s.narration);
  const displayText = toDisplayText(s.narration);

  // 낭독형과 표시형의 어절 수가 어긋나면 자막이 음성과 밀린다. 조립 단계까지
  // 끌고 가지 말고 여기서 막는다.
  const spokenWords = performanceText.split(/\s+/).length;
  const displayWords = displayText.split(/\s+/).length;
  if (spokenWords !== displayWords) {
    console.error(`ABORT: scene ${s.scene} 어절 수 불일치 (낭독 ${spokenWords} / 자막 ${displayWords})`);
    console.error(`  낭독: ${performanceText}`);
    console.error(`  자막: ${displayText}`);
    process.exit(2);
  }

  return {
    sceneNumber: s.scene,
    sceneKey: s.key,
    sceneRole: mapped.sceneRole,
    narration: s.narration,
    // 자막 렌더러가 쓰는 화면 표기(숫자 그대로). 낭독형과 어절 단위로 대응한다.
    captionDisplayText: displayText,
    speechDirection: {
      engineVersion: "money_shorts_speech_direction_v2",
      performanceText,
      v3AudioTag: mapped.v3AudioTag,
      // 문장 끝은 더 길게 쉰다. 쉼표 뒤 짧은 호흡과 구분해야 급하게 들리지 않는다.
      segments: toSegments(performanceText).map((text) => ({
        text,
        pauseAfterMs: /[.?!]$/.test(text) ? 520 : 300,
      })),
    },
  };
});

const ttsScript = {
  ttsEngineVersion: "money_shorts_korean_director_v2",
  prosodyPolicy: "korean_native_cadence_v2",
  modelId: "eleven_v3",
  sourceSpecVersion: OWL_ASSEMBLY_SPEC.specVersion,
  sourceCandidate: OWL_ASSEMBLY_SPEC.sourceCandidate,
  title: OWL_ASSEMBLY_SPEC.title,
  // baseSpeed 0.95 = 러너가 허용하는 가장 느린 속도(기본 모드 하한).
  // 정보 밀도가 높은 내용이라 조금 천천히 읽어야 따라온다(Owner 지적).
  // baseStability 를 클램프 하한(0.42)에 가깝게 낮춰 장면별 audio tag가 만드는
  // 감정 대비(강약)가 더 뚜렷하게 드러나게 한다(모바일 검수 2026-09-17: "강약
  // 조절을 더 해달라").
  topicSpeechProfile: { globalV3Tag: "confident", baseSpeed: 0.95, baseStability: 0.44 },
  scenes,
};

fs.mkdirSync(path.dirname(path.resolve(OUT_PATH)), { recursive: true });
fs.writeFileSync(path.resolve(OUT_PATH), JSON.stringify(ttsScript, null, 2) + "\n", "utf8");

console.log(`TTS 입력 생성: ${path.resolve(OUT_PATH)}`);
console.log("");
for (const s of scenes) {
  console.log(`[${s.sceneNumber}] ${s.sceneRole} (${s.speechDirection.v3AudioTag})`);
  if (s.narration !== s.speechDirection.performanceText) {
    console.log(`    원문: ${s.narration}`);
    console.log(`    낭독: ${s.speechDirection.performanceText}`);
  } else {
    console.log(`    ${s.narration}`);
  }
}
