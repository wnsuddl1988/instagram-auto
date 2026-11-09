/**
 * QA-13: 마지막 2씬 narration 중복 감지 테스트
 * - QA-13 JSON: 마지막 2씬 중복 fail 기대 → "중복 장면 관리" pass:false 및 grade fail
 * - 정상 케이스: "깨달음 → 현재 행동" 분리된 경우 pass 기대
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// ── Jaccard 유사도 (route.ts 와 동기화) ──────────────────────────────────────
function jaccardSimilarity(a, b) {
  const tokA = a.replace(/[,。.?!？！]/g, "").split(/\s+/).filter(Boolean);
  const tokB = b.replace(/[,。.?!？！]/g, "").split(/\s+/).filter(Boolean);
  const setA = new Set(tokA);
  const setB = new Set(tokB);
  let intersect = 0;
  for (const tok of setA) { if (setB.has(tok)) intersect++; }
  const union = setA.size + setB.size - intersect;
  return union === 0 ? 0 : intersect / union;
}

// ── 마지막 2씬 중복 감지 (route.ts 로직 인라인) ──────────────────────────────
function checkEndingDup(scenes) {
  const warnings = [];
  const lastPairIdx = scenes.length - 1;

  for (let j = 1; j < scenes.length; j++) {
    const prev = scenes[j - 1].narration ?? "";
    const curr = scenes[j].narration ?? "";
    const prevNorm = prev.replace(/\s/g, "");
    const currNorm = curr.replace(/\s/g, "");
    if (prevNorm && currNorm && prevNorm === currNorm) {
      warnings.push({ sceneNumber: j + 1, msg: `narration 완전 중복 — 씬 ${j}↔씬 ${j + 1}` });
      continue;
    }
    const ratio = jaccardSimilarity(prev, curr);
    if (ratio >= 0.72) {
      if (j === lastPairIdx) {
        warnings.push({ sceneNumber: j + 1, msg: `마지막 2씬 유사 반복(${Math.round(ratio * 100)}%) — "깨달음 → 현재 행동"으로 분리 필요`, isLastTwoDup: true });
      } else {
        warnings.push({ sceneNumber: j + 1, msg: `narration 어절 유사 반복(${Math.round(ratio * 100)}%) — 씬 ${j}↔씬 ${j + 1}` });
      }
    }
  }

  // 마지막 2씬 0.55~0.72 구간
  if (scenes.length >= 2) {
    const last = scenes[scenes.length - 1].narration ?? "";
    const secondLast = scenes[scenes.length - 2].narration ?? "";
    const lastNorm = last.replace(/\s/g, "");
    const secondLastNorm = secondLast.replace(/\s/g, "");
    if (lastNorm && secondLastNorm && lastNorm !== secondLastNorm) {
      const lastRatio = jaccardSimilarity(last, secondLast);
      if (lastRatio >= 0.55 && lastRatio < 0.72) {
        warnings.push({ sceneNumber: scenes.length, msg: `마지막 2씬 유사 반복(${Math.round(lastRatio * 100)}%) — Jaccard 0.55~0.72 구간`, isLastTwoDup: true });
      }
      if (lastRatio < 0.72) {
        const ACTION_DUP_RE = /(?:지금도|아직도|여전히|간직하고|넣고\s*다녀요|품고\s*다녀요|지니고\s*다녀요)/;
        if (ACTION_DUP_RE.test(last) && ACTION_DUP_RE.test(secondLast)) {
          warnings.push({ sceneNumber: scenes.length, msg: `마지막 2씬 유사 반복 — 행동어 중복(지금도/넣고 다녀요 등)`, isLastTwoDup: true });
        }
      }
    }
  }

  const hasLastTwoDup = warnings.some((w) => w.isLastTwoDup);
  // 완전 동일 narration도 마지막 pair이면 동일하게 fail 처리
  const hasLastExactDup = warnings.some(
    (w) => w.msg.includes("완전 중복") && w.sceneNumber === scenes.length
  );
  const dupCount = warnings.filter((w) => w.msg.includes("중복") || w.msg.includes("유사 반복")).length;

  return { warnings, hasLastTwoDup: hasLastTwoDup || hasLastExactDup, dupCount };
}

// ── 테스트 ────────────────────────────────────────────────────────────────────
let pass = 0;
let fail = 0;

function test(label, scenes, expectLastTwoDup) {
  const { warnings, hasLastTwoDup, dupCount } = checkEndingDup(scenes);
  const ok = hasLastTwoDup === expectLastTwoDup;
  if (ok) {
    console.log(`  ✅ ${label}`);
    if (warnings.length) console.log(`     warnings: ${warnings.map((w) => w.msg).join(" | ")}`);
    pass++;
  } else {
    console.log(`  ❌ ${label}`);
    console.log(`     기대: hasLastTwoDup=${expectLastTwoDup} / 실제: ${hasLastTwoDup}`);
    console.log(`     warnings: ${warnings.map((w) => w.msg).join(" | ")}`);
    fail++;
  }
}

// ── QA-13 JSON 기반 ───────────────────────────────────────────────────────────
console.log("\n[1] QA-13 JSON 기반");
{
  const raw = readFileSync(resolve("output/v2/paid_qa/gpt4o_mini_render_ready_qa_13.json"), "utf-8");
  const data = JSON.parse(raw);
  const scenes = data.plan.scenes;
  const lastTwo = scenes.slice(-2);
  console.log(`   scene ${lastTwo[0].sceneNumber}: "${lastTwo[0].narration}"`);
  console.log(`   scene ${lastTwo[1].sceneNumber}: "${lastTwo[1].narration}"`);
  const ratio = jaccardSimilarity(lastTwo[0].narration, lastTwo[1].narration);
  console.log(`   Jaccard: ${Math.round(ratio * 100)}%`);

  test("QA-13 마지막 2씬 중복 감지 → fail 기대", scenes, true);
}

// ── 인라인 단위 테스트 ─────────────────────────────────────────────────────────
console.log("\n[2] 인라인 단위 테스트");

function mkScene(n, narration, motion = "slow_zoom_in") {
  return { sceneNumber: n, narration, motion };
}

// ① QA-13 정확 재현 (83% Jaccard)
test(
  "씬 9↔10 행동어 의미 중복 (83% Jaccard) → fail",
  [
    mkScene(1, "아버지 지갑 속에서, 오래된 사진이 나왔어요."),
    mkScene(2, "왜 그 사진을, 매일 꺼내 보셨을까요?"),
    mkScene(3, "사진 속 인물은, 아버지와 함께 찍은 분이었어요."),
    mkScene(4, "왜 그 사진을 매일 보셨는지, 몰랐어요."),
    mkScene(5, "사진 뒷면엔, 작은 글씨로 뭔가 적혀 있었어요."),
    mkScene(6, "아버지는 그날, 그 장소에서 사진을 찍었죠."),
    mkScene(7, "사진 속 날짜는, 내가 태어난 바로 그날이었어요."),
    mkScene(8, "아버지는 내가 태어난 날부터, 그 사진을 지갑에 넣으셨던 거예요.", "character_pulse"),
    mkScene(9, "그래서 나는 지금도, 그 사진을 지갑 안에 넣고 다녀요.", "slow_zoom_out"),
    mkScene(10, "그 사진을, 나는 지금도 지갑 안에 넣고 다녀요.", "slow_zoom_out"),
  ],
  true
);

// ② 정상: 씬 9 깨달음 + 씬 10 현재 행동 분리
test(
  "씬 9 깨달음 + 씬 10 현재 행동 분리 → pass",
  [
    mkScene(1, "아버지 지갑 속에서, 오래된 사진이 나왔어요."),
    mkScene(2, "왜 그 사진을, 매일 꺼내 보셨을까요?"),
    mkScene(3, "사진 속 인물은, 아버지와 함께 찍은 분이었어요."),
    mkScene(4, "왜 그 사진을 매일 보셨는지, 몰랐어요."),
    mkScene(5, "사진 뒷면엔, 작은 글씨로 뭔가 적혀 있었어요."),
    mkScene(6, "아버지는 그날, 그 장소에서 사진을 찍었죠."),
    mkScene(7, "사진 속 날짜는, 내가 태어난 바로 그날이었어요."),
    mkScene(8, "아버지는 내가 태어난 날부터, 그 사진을 지갑에 넣으셨던 거예요.", "character_pulse"),
    mkScene(9, "그제야 아버지의 마음이, 조금은 이해됐어요.", "slow_zoom_out"),
    mkScene(10, "그 사진을, 나는 지금도 지갑 안에 넣고 다녀요.", "slow_zoom_out"),
  ],
  false
);

// ③ 완전 동일 narration → fail
test(
  "씬 9↔10 완전 동일 → fail",
  [
    mkScene(1, "아버지 지갑 속에서, 오래된 사진이 나왔어요."),
    mkScene(2, "왜 매일 꺼내 보셨을까요."),
    mkScene(3, "아버지는 절대 버리지 않으셨죠."),
    mkScene(4, "그땐 몰랐어요."),
    mkScene(5, "가장자리가 닳아 있었어요."),
    mkScene(6, "매일 꺼내 보셨어요."),
    mkScene(7, "사진 속 날짜는, 내가 태어난 그날이었어요."),
    mkScene(8, "아버지는 내가 태어난 날 그 사진을 넣으셨어요.", "character_pulse"),
    mkScene(9, "나는 지금도 그 사진을 지갑에 넣고 다녀요.", "slow_zoom_out"),
    mkScene(10, "나는 지금도 그 사진을 지갑에 넣고 다녀요.", "slow_zoom_out"),
  ],
  true
);

// ④ 행동어 직접 중복 (지금도 + 넣고 다녀요 양쪽) but Jaccard < 0.72
test(
  "씬 9↔10 행동어 직접 중복 (지금도, 넣고 다녀요 양쪽) → fail",
  [
    mkScene(1, "지갑 안에서 낡은 사진이 나왔어요."),
    mkScene(2, "왜 매일 꺼내 보셨을까요."),
    mkScene(3, "아버지는 절대 버리지 않으셨죠."),
    mkScene(4, "그땐 몰랐어요."),
    mkScene(5, "가장자리가 닳아 있었어요."),
    mkScene(6, "매일 꺼내 보셨어요."),
    mkScene(7, "사진 뒷면엔 날짜가 적혀 있었어요."),
    mkScene(8, "그 날짜는 내가 태어난 날이었어요.", "character_pulse"),
    mkScene(9, "나는 아버지의 마음을 지금도 넣고 다녀요.", "slow_zoom_out"),  // 행동어 있음
    mkScene(10, "그 사진을 지금도 지갑에 넣고 다녀요.", "slow_zoom_out"),    // 행동어 있음
  ],
  true
);

// ⑤ 정상: 씬 9 아버지 언급, 씬 10 행동
test(
  "씬 9 감정 해석 + 씬 10 행동 (다른 표현) → pass",
  [
    mkScene(1, "지갑 안에서 낡은 사진이 나왔어요."),
    mkScene(2, "왜 매일 꺼내 보셨을까요."),
    mkScene(3, "아버지는 절대 버리지 않으셨죠."),
    mkScene(4, "그땐 몰랐어요."),
    mkScene(5, "가장자리가 닳아 있었어요."),
    mkScene(6, "매일 꺼내 보셨어요."),
    mkScene(7, "사진 뒷면엔 날짜가 적혀 있었어요."),
    mkScene(8, "그 날짜는 내가 태어난 날이었어요.", "character_pulse"),
    mkScene(9, "아버지는 말로는 한 번도, 사랑한다고 하지 않으셨어요.", "slow_zoom_out"),
    mkScene(10, "그래서 나는 그 사진을, 아직 지갑에 넣고 다녀요.", "slow_zoom_out"),
  ],
  false
);

// ── 결과 요약 ────────────────────────────────────────────────────────────────
console.log(`\n총 ${pass + fail}건 — ✅ ${pass} pass  ❌ ${fail} fail`);
if (fail > 0) process.exit(1);
