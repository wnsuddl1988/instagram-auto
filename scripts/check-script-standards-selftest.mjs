#!/usr/bin/env node
/**
 * 대본 기준 검사기(_script-standards.mjs) 회귀 테스트 (2026-09-30 밤, 최우선 규칙 26).
 * 기준이 바뀌어 검사기를 고칠 때마다 실행한다. 실제 사례(부엉 18편 초안·수정본, 황소 11편 배포본)를 고정 사례로 쓴다.
 * 사용: node scripts/check-script-standards-selftest.mjs
 */
import { checkScriptStandards } from "./_script-standards.mjs";
import { BULL_EP11_ASSEMBLY_SPEC } from "./_bull-ep11-assembly-spec.mjs";

let passed = 0;
let failed = 0;
const check = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL  ${name}: ${e.message}`);
  }
};
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const hasFix = (r, re) => r.fix.some((f) => re.test(f));

// 1) 부엉 18편 최종 수정본 — 반드시 수정 0이어야 한다
const OWL18_GOOD = [
  "이번에 바뀐 청년미래적금, 적금 없는 만 34세 이하는 알고 있었어? 열흘 안에 신청 못 하면 정부 돈을 놓쳐.",
  "안녕, 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야.",
  "청년미래적금은 청년이 넣은 돈에 정부가 기여금을 얹어주고, 이자엔 세금도 안 붙는 3년짜리 적금이거든.",
  "금융위원회가 2차 신청을 10월 7일부터 16일까지 받는다고 발표했어, 은행 앱에서 하면 돼.",
  "1차 때 심사 오류가 있어서, 이번부터는 일반소득자, 중소기업 재직자, 소상공인 중에서 유형을 직접 골라.",
  "그럼 나는 어떻게 해야 할까? 답부터 말하면, 내 소득 구간과 가구 소득부터 알고 유형을 고르면 돼.",
  "첫째, 대상이야. 만 19세 이상 청년에 총급여 7,500만 원 이하, 쉽게 풀면 대학생부터 직장인까지 다 들어와.",
  "둘째, 얹어주는 돈이야. 일반형은 낸 돈의 6퍼센트를, 중소기업 재직자 같은 우대형은 12퍼센트를 줘.",
  "월 50만 원씩 만기까지 채우면 1,800만 원이고, 쉽게 풀면 일반형 108만 원, 우대형 216만 원을 더 받아.",
  "셋째, 방법이야. 첫 이틀은 출생연도 끝자리 홀짝제로 받아, 쉽게 풀면 이틀만 줄을 나눠 세우는 거지.",
  "그렇다고 무작정 골라서 넣으면 안 돼, 총급여가 6천만 원을 넘으면 가입은 돼도 기여금이 사라지거든.",
  "콕 집어 정리하면, 소득 구간마다 정부가 얹어주는 돈이 달라져. 먼저 확인할 건 두 가지야, 내 총급여 구간이랑 내가 고를 유형이야.",
  "이 두 가지는 저장해 두고, 신청하기 전에 다시 확인해. 궁금한 제도는 댓글로 남겨줘.",
];
check("부엉 18편 수정본: 반드시 수정 0", () => {
  const r = checkScriptStandards({ character: "owl", scenes: OWL18_GOOD, hookType: "T3" });
  assert(r.fix.length === 0, JSON.stringify(r.fix));
});

// 2) 부엉 18편 첫 초안(요약 메모리로 쓴 것) — Owner가 지적한 위반을 잡아야 한다
const OWL18_FIRST_DRAFT = [
  "적금 없는 만 34세 이하, 이번에 바뀐 청년미래적금을 열흘 안에 신청해야 한다는 거 알고 있었어?",
  "안녕, 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야.",
  "청년미래적금은 청년이 넣은 돈에 정부가 기여금을 얹어주고, 이자엔 세금도 안 붙는 3년짜리 적금이야.",
  "2차 신청은 10월 7일부터 16일까지고, 7일과 8일은 출생연도 끝자리 홀짝제로 받아.",
  "그럼 누가 얼마나 받을까? 답부터 말하면, 기여금 비율이 소득에 따라 6퍼센트나 12퍼센트야.",
  "첫째, 대상이야. 만 19세부터 34세인데 군 복무는 최대 6년 빼주고, 총급여 7,500만 원 이하야.",
  "둘째, 얹어주는 돈이야. 일반형은 낸 돈의 6퍼센트, 소득 낮은 중소기업 재직자 같은 우대형은 12퍼센트야.",
  "월 50만 원을 꽉 채워 3년이면 1,800만 원, 기여금은 일반형 108만 원, 우대형 216만 원이야.",
  "셋째, 이번엔 유형을 직접 골라야 해, 1차 때 심사 오류 때문이야. 일반소득자, 중소기업 재직자, 소상공인 중에서야.",
  "그렇다고 다 받는 건 아니야, 총급여가 6천만 원을 넘으면 가입은 돼도 기여금은 없고, 가구 소득 기준도 있거든.",
  "그리고 청년도약계좌를 갖고 있다면 갈아탈 수 있어, 새 계좌를 만든 다음에 기존 계좌를 특별중도해지하는 순서야.",
  "콕 집어 정리하면, 신청은 10월 7일부터 열흘이고, 먼저 확인할 건 내 총급여 구간이랑 고를 유형 두 가지야.",
  "이 두 가지는 저장해 두고, 신청하기 전에 다시 확인해. 궁금한 제도는 댓글로 남겨줘.",
];
check("부엉 18편 첫 초안: 핵심 질문 C/D형 누락을 잡는다", () => {
  const r = checkScriptStandards({ character: "owl", scenes: OWL18_FIRST_DRAFT, hookType: "T3" });
  assert(hasFix(r, /핵심 질문/), JSON.stringify(r.fix));
});
check("부엉 18편 첫 초안: 항목별 '쉽게 풀면' 누락을 잡는다", () => {
  const r = checkScriptStandards({ character: "owl", scenes: OWL18_FIRST_DRAFT, hookType: "T3" });
  assert(hasFix(r, /쉽게 풀면/), JSON.stringify(r.fix));
});
check("부엉 18편 첫 초안: 같은 수치 중복(6퍼센트·12퍼센트)을 잡는다", () => {
  const r = checkScriptStandards({ character: "owl", scenes: OWL18_FIRST_DRAFT, hookType: "T3" });
  assert(hasFix(r, /같은 수치 중복/), JSON.stringify(r.fix));
});
check("부엉 18편 첫 초안: 연속 '~야' 어미를 잡는다", () => {
  const r = checkScriptStandards({ character: "owl", scenes: OWL18_FIRST_DRAFT, hookType: "T3" });
  assert(hasFix(r, /연속 씬 같은 어미/), JSON.stringify(r.fix));
});
check("부엉 18편 첫 초안: 상황의 기관 발표 누락을 잡는다", () => {
  const r = checkScriptStandards({ character: "owl", scenes: OWL18_FIRST_DRAFT, hookType: "T3" });
  assert(hasFix(r, /기관/), JSON.stringify(r.fix));
});

// 3) 황소 11편 배포본 — 알려진 위반(1,350원 두 번, 연속 '~야')을 잡고 구조 문구는 통과
const bullScenes = BULL_EP11_ASSEMBLY_SPEC.scenes.map((s) => s.narration);
check("황소 11편: '1,350원' 중복을 잡는다", () => {
  const r = checkScriptStandards({ character: "bull", scenes: bullScenes, hookType: "T1" });
  assert(hasFix(r, /1,350원/), JSON.stringify(r.fix));
});
check("황소 11편: 구조 문구(다들·숫자부터·한마디로·첫째둘째·물론·한 줄로·챙겨가·들고 올게)는 누락 없음", () => {
  const r = checkScriptStandards({ character: "bull", scenes: bullScenes, hookType: "T1" });
  assert(!r.fix.some((f) => f.startsWith("누락:")), JSON.stringify(r.fix));
});

// 4) 오탐 방지
check("황소: '사라지다'를 매수 암시로 잡지 않는다", () => {
  const scenes = [...bullScenes];
  scenes[5] = "그 차익이 사라지는 구조라서 이익이 줄 수 있어.";
  const r = checkScriptStandards({ character: "bull", scenes, hookType: "T1" });
  assert(!r.fix.some((f) => /매수 암시/.test(f)), JSON.stringify(r.fix));
});
check("황소: '미리 주워'는 매수 암시로 잡는다", () => {
  const scenes = [...bullScenes];
  scenes[5] = "지금 미리 주워 두면 좋아.";
  const r = checkScriptStandards({ character: "bull", scenes, hookType: "T1" });
  assert(r.fix.some((f) => /매수 암시/.test(f)), JSON.stringify(r.fix));
});
check("부엉: 금박사 언급·황소 문구('다들,')를 잡는다", () => {
  const scenes = [...OWL18_GOOD];
  scenes[12] = "다들, 금박사가 이어서 풀어줄게. 궁금한 제도는 댓글로 남겨줘, 저장해 둬.";
  const r = checkScriptStandards({ character: "owl", scenes, hookType: "T3" });
  assert(r.fix.some((f) => /금박사/.test(f)) && r.fix.some((f) => /황소특보 고유/.test(f)), JSON.stringify(r.fix));
});
check("오프닝이 첫 씬이면 잡는다(훅 뒤로)", () => {
  const scenes = [OWL18_GOOD[1], OWL18_GOOD[0], ...OWL18_GOOD.slice(2)];
  const r = checkScriptStandards({ character: "owl", scenes, hookType: "T3" });
  assert(r.fix.some((f) => /오프닝|자기소개/.test(f)), JSON.stringify(r.fix));
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
