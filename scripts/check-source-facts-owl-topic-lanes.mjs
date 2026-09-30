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
// 최근 4편(14~17, 2026-09-30 재배치 후): jobs_income 2(15,16), pension 1(14), housing 1(17) / policy_countdown 3(14,15,17), income_jobs 1(16)
r.clean = assessOwlTopicProposal({ title: "전기요금 4분기 동결, 내 고지서는 그대로일까", lane: "living_costs", domain: "prices_utilities", titleShape: "contrast" });
r.domainHeavy = assessOwlTopicProposal({ title: "청년 지원금 신청", lane: "deadline_benefit", domain: "jobs_income", titleShape: "contrast" });
r.laneHeavy = assessOwlTopicProposal({ title: "다음 달부터 바뀌는 제도", lane: "policy_countdown", domain: "tax", titleShape: "contrast" });
r.sameShape = assessOwlTopicProposal({ title: "보이스피싱 신종 수법", lane: "fraud_prevention", domain: "other", titleShape: "declaration" });
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
  check("장부 1~17편, 16~17편은 게시 예정(2026-09-30 재배치: 16=최저임금, 17=전세사기)", () => {
    assert(JSON.stringify(r.episodes) === JSON.stringify(Array.from({ length: 17 }, (_, i) => i + 1)), JSON.stringify(r.episodes));
    assert(JSON.stringify(r.unpublished) === JSON.stringify([16, 17]), JSON.stringify(r.unpublished));
    assert(r.ledgerSummaries[15].includes("최저임금"), r.ledgerSummaries[15]);
    assert(r.ledgerSummaries[16].includes("전세사기"), r.ledgerSummaries[16]);
  });
  check("퇴직연금은 번호 없는 예비 재고로만 있고 편 장부(쏠림 창)에는 없다", () => {
    assert(r.stock.length === 1 && r.stock[0].includes("퇴직연금"), JSON.stringify(r.stock));
    assert(!r.ledgerSummaries.some((s) => s.includes("퇴직연금")), JSON.stringify(r.ledgerSummaries));
  });
  check("쏠림 없는 제안은 경고 없음", () => assert(r.clean.ok, JSON.stringify(r.clean.warnings)));
  check("같은 영역 3편째면 경고(jobs_income)", () => assert(r.domainHeavy.warnings.some((w) => w.includes("같은 영역")), JSON.stringify(r.domainHeavy.warnings)));
  check("같은 레인 과다·직전 편 연속이면 경고(policy_countdown)", () => {
    assert(r.laneHeavy.warnings.some((w) => w.includes("같은 레인(policy_countdown) 쏠림")), JSON.stringify(r.laneHeavy.warnings));
    assert(r.laneHeavy.warnings.some((w) => w.includes("연속")), JSON.stringify(r.laneHeavy.warnings));
  });
  check("직전 편과 같은 제목 모양이면 경고", () => assert(r.sameShape.warnings.some((w) => w.includes("제목 모양")), JSON.stringify(r.sameShape.warnings)));
  check("금지 제목 틀('진짜 이유')이면 경고", () => assert(r.banned.warnings.some((w) => w.includes("제목 틀")), JSON.stringify(r.banned.warnings)));
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
