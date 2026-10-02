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
// 최근 5편(15~19, 2026-10-01 19편 등록 후): jobs_income 2(15,16), housing 1(17), savings_deposit 2(18,19) / policy_countdown 2(15,17), income_jobs 1(16), deadline_benefit 1(18), money_calc 1(19) / 제목 모양 직전 19편=contrast
r.clean = assessOwlTopicProposal({ title: "전기요금 4분기 동결, 내 고지서는 그대로일까", lane: "living_costs", domain: "prices_utilities", titleShape: "quote" });
// 쏠림 창 = 최근 4편(16~19) + 이번 제안. 영역은 savings_deposit이 18·19로 2편이라 3편째가 되고, 레인은 어느 것도 2편이 아니라 기준을 1편으로 낮춰 같은 경고 경로를 시험한다.
r.domainHeavy = assessOwlTopicProposal({ title: "청년 지원금 신청", lane: "deadline_benefit", domain: "savings_deposit", titleShape: "quote" });
r.laneHeavy = assessOwlTopicProposal({ title: "다음 달부터 바뀌는 제도", lane: "policy_countdown", domain: "tax", titleShape: "quote" }, undefined, { maxSameLane: 1 });
r.laneConsec = assessOwlTopicProposal({ title: "청년 월세 지원 신청", lane: "money_calc", domain: "housing", titleShape: "quote" });
r.sameShape = assessOwlTopicProposal({ title: "보이스피싱 신종 수법", lane: "fraud_prevention", domain: "other", titleShape: "contrast" });
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
  // 2026-10-02 17편(전세사기) 배포 완료 → 미게시는 18·19편. 다음 편이 게시될 때마다 이 기대값을 함께 갱신한다.
  check("장부 1~19편, 16편(최저임금)·17편(전세사기)은 게시 완료, 18·19편은 게시 예정(18=청년미래적금 2차, 19=광고 4% 예금 기본금리)", () => {
    assert(JSON.stringify(r.episodes) === JSON.stringify(Array.from({ length: 19 }, (_, i) => i + 1)), JSON.stringify(r.episodes));
    assert(JSON.stringify(r.unpublished) === JSON.stringify([18, 19]), JSON.stringify(r.unpublished));
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
  check("같은 영역 3편째면 경고(savings_deposit)", () => assert(r.domainHeavy.warnings.some((w) => w.includes("같은 영역")), JSON.stringify(r.domainHeavy.warnings)));
  check("같은 레인 과다면 경고(policy_countdown)", () => {
    assert(r.laneHeavy.warnings.some((w) => w.includes("같은 레인(policy_countdown) 쏠림")), JSON.stringify(r.laneHeavy.warnings));
  });
  check("직전 편과 같은 레인이면 연속 경고(deadline_benefit)", () => {
    assert(r.laneConsec.warnings.some((w) => w.includes("연속")), JSON.stringify(r.laneConsec.warnings));
  });
  check("직전 편과 같은 제목 모양이면 경고", () => assert(r.sameShape.warnings.some((w) => w.includes("제목 모양")), JSON.stringify(r.sameShape.warnings)));
  check("금지 제목 틀('진짜 이유')이면 경고", () => assert(r.banned.warnings.some((w) => w.includes("제목 틀")), JSON.stringify(r.banned.warnings)));
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
