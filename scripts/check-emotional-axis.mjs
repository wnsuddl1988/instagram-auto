/**
 * QA-11: 감정축 drift 감지 테스트
 * - QA-10 JSON: 감정축 pass 기대
 * - QA-11 JSON: 감정축 drift fail 기대
 *
 * route.ts의 감정축 검사 로직을 인라인 복사해서 검증
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// ── 감정축 drift 검사 (route.ts 와 동기화 유지) ─────────────────────────────
function checkEmotionalAxisDrift(plan) {
  const referenceStyle = plan._referenceStyle;
  const storySeedTopic = plan._storySeedTopic ?? plan._meta?.storySeedTopic ?? "";
  const scenes = plan.scenes ?? [];
  const total = scenes.length;

  if (referenceStyle !== "emotional_story" || total < 7) return { drift: false, reason: "skip" };

  const isParentChildTopic =
    plan._meta?.subTopicId === "parents-children" ||
    /아버지|어머니|엄마|아빠|부모|할머니|할아버지/.test(storySeedTopic ?? "");

  if (!isParentChildTopic) return { drift: false, reason: "not parent-child topic" };

  // character_pulse 씬 (반전 씬) narration
  const twistScenes = scenes.filter((s) => s.motion === "character_pulse");
  const twistPulseText = twistScenes.map((s) => s.narration ?? "").join(" ");

  // scenes 7~9 (인덱스 6~8) narration 합산
  const twistRangeText = scenes
    .slice(6, Math.min(9, total))
    .map((s) => s.narration ?? "")
    .join(" ");

  // 제3자가 반전 핵심인 강한 패턴
  const THIRD_PARTY_TWIST_RE =
    /(?:세상을\s*떠난\s*(?:친구|동료|지인|동창)|(?:친구|동창|동료|지인)[와과][의]?\s*마지막|(?:친구|동창|동료|지인)[을를]\s*그리워|(?:친구|동창|동료|지인)에게\s*(?:보낸|전한|남긴|쓴)|옛\s*(?:친구|연인|사랑|동창)[이가와]\s*(?:떠났|세상|사진|보낸)|이웃[이가]\s*(?:중심|반전|핵심|주인공)|낯선\s*(?:사람이|누군가가)\s*(?:나타났|등장))/;

  // 친구/제3자 단순 등장 패턴
  const THIRD_PARTY_RE =
    /(?:친구[가는이와을에게를]|동창[이가를]|동료[가는이를]|지인[이가를])/;

  // 자녀/나 가 반전 핵심 수신자인 신호
  const CHILD_AXIS_RE =
    /(?:나[는가]|나에게|나한테|내가|내게|딸[이가]|아들[이가]|자녀[가에게]|우리[에게]|자식[이가]|나를|내[가의])/;

  // 검사 1: 반전 씬에 강한 제3자 drift 패턴
  const pulseDrift = THIRD_PARTY_TWIST_RE.test(twistPulseText);

  // 검사 2: 반전 씬에 친구 등장 + 자녀/나 부재
  const pulseHasThirdParty = THIRD_PARTY_RE.test(twistPulseText);
  const pulseHasChildAxis = CHILD_AXIS_RE.test(twistPulseText);
  const pulseMissingChild = pulseHasThirdParty && !pulseHasChildAxis && twistPulseText.length > 0;

  // 검사 3: scenes 7~9 합산에서 친구 등장 + 자녀/나 부재 (기존 로직)
  const rangeHasThirdParty = THIRD_PARTY_RE.test(twistRangeText);
  const rangeHasChildAxis = CHILD_AXIS_RE.test(twistRangeText);
  const rangeDrift = rangeHasThirdParty && !rangeHasChildAxis;

  // 검사 4: scenes 7~9 개별 씬 검사 (강한 패턴이 한 씬에만 있어도 fail)
  const twistRangeScenes = scenes.slice(6, Math.min(9, total));
  const perSceneDriftIdx = twistRangeScenes.findIndex((s) => THIRD_PARTY_TWIST_RE.test(s.narration ?? ""));
  const perSceneDrift = perSceneDriftIdx >= 0;
  const perSceneDriftSceneNum = perSceneDrift ? 7 + perSceneDriftIdx : -1;

  const isDrift = pulseDrift || pulseMissingChild || rangeDrift || perSceneDrift;

  const cause = pulseDrift
    ? `반전 씬에 '세상을 떠난 친구 / 친구와 마지막' 등 제3자 중심 반전 패턴 감지 (pulse: "${twistPulseText}")`
    : pulseMissingChild
    ? `반전 씬(character_pulse)에 친구/제3자 등장 + 자녀 없음 (pulse: "${twistPulseText}")`
    : perSceneDrift
    ? `scene ${perSceneDriftSceneNum} 제3자 중심 반전 패턴: "${twistRangeScenes[perSceneDriftIdx]?.narration}"`
    : rangeDrift
    ? `scenes 7~9에 친구/제3자가 등장하고 자녀(나/딸/아들) 언급이 없음`
    : "pass";

  return { drift: isDrift, reason: cause, twistPulseText, twistRangeText };
}

// ── 테스트 실행 ──────────────────────────────────────────────────────────────
let pass = 0;
let fail = 0;

function test(label, jsonPath, expectDrift) {
  const raw = readFileSync(resolve(jsonPath), "utf-8");
  const data = JSON.parse(raw);
  const plan = data.plan ?? data;
  const result = checkEmotionalAxisDrift(plan);

  const ok = result.drift === expectDrift;
  if (ok) {
    console.log(`  ✅ ${label}`);
    console.log(`     drift=${result.drift} / ${result.reason.slice(0, 80)}`);
    pass++;
  } else {
    console.log(`  ❌ ${label}`);
    console.log(`     기대: drift=${expectDrift} / 실제: drift=${result.drift}`);
    console.log(`     이유: ${result.reason}`);
    if (result.twistPulseText) console.log(`     pulse 씬 narration: "${result.twistPulseText}"`);
    if (result.twistRangeText) console.log(`     scenes7~9 text: "${result.twistRangeText}"`);
    fail++;
  }
}

console.log("\n[감정축 drift 검사]");
test(
  "QA-10 (감정축 pass 기대)",
  "output/v2/paid_qa/gpt4o_mini_emotional_axis_qa_10.json",
  false
);
test(
  "QA-11 (제3자 친구 drift — fail 기대)",
  "output/v2/paid_qa/gpt4o_mini_image_prompt_qa_11.json",
  true
);

// ── 추가: 인라인 단위 테스트 ─────────────────────────────────────────────────
console.log("\n[인라인 단위 테스트]");

function inlineTest(label, scenes, expectDrift) {
  const plan = {
    _referenceStyle: "emotional_story",
    _storySeedTopic: "아버지 지갑 속 오래된 사진",
    _meta: { subTopicId: "parents-children" },
    scenes,
  };
  const result = checkEmotionalAxisDrift(plan);
  const ok = result.drift === expectDrift;
  if (ok) {
    console.log(`  ✅ ${label}`);
    pass++;
  } else {
    console.log(`  ❌ ${label}`);
    console.log(`     기대: drift=${expectDrift} / 실제: drift=${result.drift}`);
    console.log(`     이유: ${result.reason}`);
    fail++;
  }
}

// 더미 씬 생성 헬퍼
function mkScene(n, narration, motion = "slow_zoom_in") {
  return { sceneNumber: n, narration, motion, caption: "테스트", emphasis: "테스트", durationSec: 5, imagePrompt: "test" };
}

// ① 친구와 마지막 사진 — pulse 씬에 등장, 자녀 없음 → drift
inlineTest(
  "친구와 마지막 사진 (pulse 씬, 자녀 없음) → drift",
  [
    mkScene(1, "지갑 안에서 낡은 사진이 나왔어요."),
    mkScene(2, "왜 매일 꺼내 보셨을까요."),
    mkScene(3, "아버지는 절대 버리지 않으셨죠."),
    mkScene(4, "몰랐어요."),
    mkScene(5, "가장자리가 닳아 있었어요."),
    mkScene(6, "매일 꺼내 보셨어요."),
    mkScene(7, "사진 뒷면엔 날짜가 적혀 있었어요."),
    mkScene(8, "그 사진은, 아버지가 세상을 떠난 친구와 마지막으로 찍은 사진이었어요.", "character_pulse"),
    mkScene(9, "아버지는 그 날부터 그 사진을 지갑에 넣으셨던 거예요."),
    mkScene(10, "그 사진을 나는 지금도 간직하고 있어요.", "slow_zoom_out"),
  ],
  true
);

// ② 친구와 마지막 사진 — pulse 씬에 등장, 같은 씬에 내가 있음 → drift (친구 중심이라 drift)
inlineTest(
  "친구와 마지막 사진 (pulse 씬, 같은 씬에 내가 없음) → drift",
  [
    mkScene(1, "지갑 안에서 낡은 사진이 나왔어요."),
    mkScene(2, "왜 매일 꺼내 보셨을까요."),
    mkScene(3, "아버지는 절대 버리지 않으셨죠."),
    mkScene(4, "몰랐어요."),
    mkScene(5, "가장자리가 닳아 있었어요."),
    mkScene(6, "매일 꺼내 보셨어요."),
    mkScene(7, "사진 뒷면엔 날짜가 적혀 있었어요."),
    mkScene(8, "그 사진은, 아버지가 세상을 떠난 친구와 마지막으로 찍은 사진이었어요.", "character_pulse"),
    mkScene(9, "아버지는 내가 태어난 날부터, 그 사진을 지갑에 넣으셨던 거예요."),  // scene 9에 내가
    mkScene(10, "그 사진을 나는 지금도 간직하고 있어요.", "slow_zoom_out"),
  ],
  true  // pulse 씬 자체가 친구 중심이므로 여전히 drift
);

// ③ 정상 — pulse 씬이 자녀 중심 → pass
inlineTest(
  "pulse 씬이 자녀 중심 (내가 태어난 날) → pass",
  [
    mkScene(1, "지갑 안에서 낡은 사진이 나왔어요."),
    mkScene(2, "왜 매일 꺼내 보셨을까요."),
    mkScene(3, "아버지는 절대 버리지 않으셨죠."),
    mkScene(4, "몰랐어요."),
    mkScene(5, "가장자리가 닳아 있었어요."),
    mkScene(6, "매일 꺼내 보셨어요."),
    mkScene(7, "사진 뒷면엔 날짜가 적혀 있었어요."),
    mkScene(8, "그 날짜는, 내가 태어난 바로 그날이었어요.", "character_pulse"),
    mkScene(9, "아버지는 내가 태어난 날부터, 그 사진을 지갑에 넣으셨던 거예요."),
    mkScene(10, "그 사진을 나는 지금도 지갑 안에 넣고 다녀요.", "slow_zoom_out"),
  ],
  false
);

// ④ 정상 — pulse 씬 없이 scenes 7~9에 친구 + 자녀 없음 → drift
inlineTest(
  "scenes7~9 친구만 있고 자녀 없음 → drift",
  [
    mkScene(1, "지갑 안에서 낡은 사진이 나왔어요."),
    mkScene(2, "왜 매일 꺼내 보셨을까요."),
    mkScene(3, "아버지는 절대 버리지 않으셨죠."),
    mkScene(4, "몰랐어요."),
    mkScene(5, "가장자리가 닳아 있었어요."),
    mkScene(6, "매일 꺼내 보셨어요."),
    mkScene(7, "친구와 함께 찍은 사진이었어요."),
    mkScene(8, "그 친구와의 마지막 여행이었죠.", "character_nod"),  // pulse 아님
    mkScene(9, "아버지는 친구를 그리워하셨어요."),
    mkScene(10, "그 사진이 남겨졌어요.", "slow_zoom_out"),
  ],
  true
);

// ⑤ 정상 — scenes 7~9에 친구 + 자녀 모두 있음 (친구가 배경) → pass
inlineTest(
  "scenes7~9 친구 배경 + 자녀 중심 → pass",
  [
    mkScene(1, "지갑 안에서 낡은 사진이 나왔어요."),
    mkScene(2, "왜 매일 꺼내 보셨을까요."),
    mkScene(3, "아버지는 절대 버리지 않으셨죠."),
    mkScene(4, "몰랐어요."),
    mkScene(5, "가장자리가 닳아 있었어요."),
    mkScene(6, "매일 꺼내 보셨어요."),
    mkScene(7, "친구가 찍어준 사진이었어요."),
    mkScene(8, "그 날이 바로 내가 태어난 날이었어요.", "character_pulse"),
    mkScene(9, "아버지는 내가 태어난 날부터 그 사진을 넣으셨어요."),
    mkScene(10, "나는 지금도 그 사진을 간직해요.", "slow_zoom_out"),
  ],
  false
);

// ── 결과 요약 ────────────────────────────────────────────────────────────────
console.log(`\n총 ${pass + fail}건 — ✅ ${pass} pass  ❌ ${fail} fail`);
if (fail > 0) process.exit(1);
