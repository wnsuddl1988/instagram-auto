#!/usr/bin/env node
/**
 * 부엉박사 소재 제안 쏠림 점검 — 제안을 게시 장부(OWL_EPISODE_LEDGER, 게시 예정 재고 포함)와 비교해
 * 영역·레인·제목 모양 쏠림 경고를 출력한다. 비밀값·네트워크 없음. (2026-09-30, 최우선 규칙 13)
 *
 * 사용(장부만 보기):
 *   node scripts/run-owl-topic-lane-mix-check-once.mjs
 * 제안 점검:
 *   node scripts/run-owl-topic-lane-mix-check-once.mjs --title "제목" --lane housing --domain housing [--shape question]
 */

import { runTsProbe } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();
const LANES = ["policy_countdown", "money_calc", "housing", "income_jobs", "living_costs", "indicator", "fraud_prevention", "deadline_benefit"];
const DOMAINS = ["loans_credit", "housing", "pension", "jobs_income", "tax", "prices_utilities", "investing_protection", "savings_deposit", "indicators", "other"];
const SHAPES = ["contrast", "quote", "countdown", "question", "declaration", "metaphor", "number", "why"];

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i];
  const value = process.argv[i + 1];
  if (!key?.startsWith("--") || value === undefined) {
    console.error(`ABORT: 인자 형식 오류: ${key ?? ""}`);
    process.exit(2);
  }
  args[key.slice(2)] = value;
}
const hasProposal = Object.keys(args).length > 0;
if (hasProposal) {
  const errors = [];
  if (!args.title) errors.push("--title 필요");
  if (!LANES.includes(args.lane)) errors.push(`--lane 은 ${LANES.join("|")}`);
  if (!DOMAINS.includes(args.domain)) errors.push(`--domain 은 ${DOMAINS.join("|")}`);
  if (args.shape !== undefined && !SHAPES.includes(args.shape)) errors.push(`--shape 는 ${SHAPES.join("|")}`);
  if (errors.length > 0) {
    console.error(`ABORT: ${errors.join("; ")}`);
    process.exit(2);
  }
}
const proposal = hasProposal ? { title: args.title, lane: args.lane, domain: args.domain, titleShape: args.shape } : null;

const probe = `
import { OWL_EPISODE_LEDGER, assessOwlTopicProposal } from "./owl-topic-lanes.js";
import type { OwlTopicProposal } from "./owl-topic-lanes.js";
const proposal = ${JSON.stringify(proposal)} as OwlTopicProposal | null;
const assessment = proposal ? assessOwlTopicProposal(proposal) : null;
process.stdout.write(JSON.stringify({ ledger: OWL_EPISODE_LEDGER, assessment }));
`;

let result;
try {
  result = runTsProbe({ root: ROOT, probeDir: "lib/source-facts", probeSource: probe, extraJsFiles: ["owl-topic-lanes.js"] });
} catch (error) {
  console.error(`ABORT: ${error.message}`);
  process.exit(1);
}

console.log("\n=== 부엉박사 게시 장부 (편 / 레인 / 영역 / 게시) ===");
for (const e of result.ledger) {
  console.log(`${String(e.episode).padStart(2)}편  ${e.lane.padEnd(17)} ${e.domain.padEnd(21)} ${e.published ? "게시" : "예정"}  ${e.summary}`);
}
if (result.assessment) {
  const a = result.assessment;
  console.log(`\n=== 제안 점검: "${proposal.title}" ===`);
  console.log(`창 ${a.windowSize}편 기준 — 같은 영역 ${a.sameDomainCount}편, 같은 레인 ${a.sameLaneCount}편 (이번 제안 포함, 게시 예정 재고 포함)`);
  if (a.ok) console.log("쏠림 기준에 걸리지 않습니다. (좋은 소재라는 뜻이 아니라 쏠림 경고가 없다는 뜻입니다.)");
  else for (const w of a.warnings) console.log(`경고: ${w}`);
  console.log("※ 정부 제도명은 현재 운영 여부를 공식 사이트로, 전망치는 같은 가정끼리인지 원문으로 확인할 것(자동 판정 불가).");
}
