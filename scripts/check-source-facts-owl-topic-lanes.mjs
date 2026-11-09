#!/usr/bin/env node
/**
 * 부엉박사 소재 레인·게시 장부·쏠림 판정 검사 (lib/source-facts/owl-topic-lanes.ts). 비밀값·네트워크 없음.
 * 사용: node scripts/check-source-facts-owl-topic-lanes.mjs
 */

import { runTsProbe } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();
let passed = 0;
let failed = 0;
function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL  ${name}: ${error.message}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const probe = `
import { OWL_TOPIC_LANES, OWL_EPISODE_LEDGER, OWL_UNNUMBERED_STOCK, assessOwlTopicProposal } from "./owl-topic-lanes.js";
const r: Record<string, any> = {};
r.laneIds = OWL_TOPIC_LANES.map((l) => l.id);
r.episodes = OWL_EPISODE_LEDGER.map((e) => e.episode);
r.unpublished = OWL_EPISODE_LEDGER.filter((e) => !e.published).map((e) => e.episode);
r.stock = OWL_UNNUMBERED_STOCK.map((s) => s.summary);
r.ledgerSummaries = OWL_EPISODE_LEDGER.map((e) => e.summary);
// 최근 5편(20~24, 2026-10-06 23·24편 등록 후): other 2(20,24), loans_credit 1(21), jobs_income 1(22), pension 1(23) / fraud_prevention 1(20), money_calc 2(21,24), deadline_benefit 1(22), policy_countdown 1(23) / 제목 모양 직전 24편=contrast
r.clean = assessOwlTopicProposal({ title: "전기요금 4분기 동결, 내 고지서는 그대로일까", lane: "living_costs", domain: "prices_utilities", titleShape: "quote" });
// 쏠림 창 = 최근 4편(21~24) + 이번 제안. 영역은 어느 것도 2편이 아니라 기준을 1편으로 낮춰 같은 경고 경로를 시험한다(레인도 동일).
r.domainHeavy = assessOwlTopicProposal({ title: "청년 지원금 신청", lane: "policy_countdown", domain: "pension", titleShape: "quote" }, undefined, { maxSameDomain: 1 });
r.laneHeavy = assessOwlTopicProposal({ title: "내 대출 이자 계산법", lane: "money_calc", domain: "tax", titleShape: "quote" }, undefined, { maxSameLane: 1 });
r.laneConsec = assessOwlTopicProposal({ title: "카드 소득공제 계산법", lane: "money_calc", domain: "tax", titleShape: "quote" });
r.sameShape = assessOwlTopicProposal({ title: "보이스피싱 신종 수법", lane: "fraud_prevention", domain: "investing_protection", titleShape: "contrast" });
r.banned = assessOwlTopicProposal({ title: "월세가 오르는 진짜 이유", lane: "housing", domain: "housing", titleShape: "why" });
process.stdout.write(JSON.stringify(r));
`;

let r = null;
check("runtime probe executes(typecheck 포함)", () => {
  r = runTsProbe({ root: ROOT, probeDir: "lib/source-facts", probeSource: probe, extraJsFiles: ["owl-topic-lanes.js"] });
});
if (r) {
  check("레인 8개, id 중복 없음", () => {
    assert(r.laneIds.length === 8 && new Set(r.laneIds).size === 8, JSON.stringify(r.laneIds));
  });
  // 2026-10-04 19편(광고 4% 예금 기본금리) 배포 완료 → 미게시는 20~21편(20=은행 정보 유출, 21=대환 금리 역전 등록). 다음 편이 게시될 때마다 이 기대값을 함께 갱신한다.
  // 2026-10-05 22편(근로장려금, 대본 확정 대기) 등록.
  // 2026-10-05 20편(은행 정보 유출) 게시 완료 → 미게시는 21~22편.
  // 2026-10-06 21편(대출 갈아타기 금리 역전) 게시 완료 → 미게시는 22편(근로장려금)만.
  // 2026-10-06 23편(국민연금 크레딧)·24편(아동수당 개편) 등록(대본 확정·TTS 승인 대기) → 미게시는 22~24편.
  // 2026-10-09 23편(국민연금 크레딧) 게시 완료(릴스 DeRZhW4DaW6) → 미게시는 24편(아동수당 개편)만.
  check("장부 1~24편, 16~23편(최저임금·전세사기·청년미래적금 2차·광고 4% 예금·은행 정보 유출·대환 금리 역전·근로장려금·국민연금 크레딧)은 게시 완료, 24편(아동수당 개편)은 게시 예정", () => {
    assert(JSON.stringify(r.episodes) === JSON.stringify(Array.from({ length: 24 }, (_, i) => i + 1)), JSON.stringify(r.episodes));
    assert(JSON.stringify(r.unpublished) === JSON.stringify([24]), JSON.stringify(r.unpublished));
    assert(r.ledgerSummaries[22].includes("크레딧"), r.ledgerSummaries[22]);
    assert(r.ledgerSummaries[23].includes("아동기본수당"), r.ledgerSummaries[23]);
    assert(r.ledgerSummaries[21].includes("근로장려금"), r.ledgerSummaries[21]);
    assert(r.ledgerSummaries[19].includes("정보 유출"), r.ledgerSummaries[19]);
    assert(r.ledgerSummaries[20].includes("갈아타기"), r.ledgerSummaries[20]);
    assert(r.ledgerSummaries[15].includes("최저임금"), r.ledgerSummaries[15]);
    assert(r.ledgerSummaries[16].includes("전세사기"), r.ledgerSummaries[16]);
    assert(r.ledgerSummaries[17].includes("청년미래적금"), r.ledgerSummaries[17]);
    assert(r.ledgerSummaries[18].includes("기본금리"), r.ledgerSummaries[18]);
  });
  check("퇴직연금은 번호 없는 예비 재고로만 있고 편 장부(쏠림 창)에는 없다", () => {
    assert(r.stock.length === 1 && r.stock[0].includes("퇴직연금"), JSON.stringify(r.stock));
    assert(!r.ledgerSummaries.some((s) => s.includes("퇴직연금")), JSON.stringify(r.ledgerSummaries));
  });
  check("쏠림 없는 제안은 경고 없음", () => assert(r.clean.ok, JSON.stringify(r.clean.warnings)));
  check("같은 영역 쏠림이면 경고(savings_deposit, 기준 1편으로 낮춰 시험)", () => assert(r.domainHeavy.warnings.some((w) => w.includes("같은 영역")), JSON.stringify(r.domainHeavy.warnings)));
  check("같은 레인 과다면 경고(money_calc)", () => {
    assert(r.laneHeavy.warnings.some((w) => w.includes("같은 레인(money_calc) 쏠림")), JSON.stringify(r.laneHeavy.warnings));
  });
  check("직전 편과 같은 레인이면 연속 경고(deadline_benefit)", () => {
    assert(r.laneConsec.warnings.some((w) => w.includes("연속")), JSON.stringify(r.laneConsec.warnings));
  });
  check("직전 편과 같은 제목 모양이면 경고", () => assert(r.sameShape.warnings.some((w) => w.includes("제목 모양")), JSON.stringify(r.sameShape.warnings)));
  check("금지 제목 틀('진짜 이유')이면 경고", () => assert(r.banned.warnings.some((w) => w.includes("제목 틀")), JSON.stringify(r.banned.warnings)));
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
