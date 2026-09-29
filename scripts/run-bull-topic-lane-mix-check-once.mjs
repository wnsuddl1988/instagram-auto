#!/usr/bin/env node
/**
 * 황소특보 소재 제안 쏠림 점검 — 제안을 게시 장부(BULL_EPISODE_LEDGER)와 비교해
 * 반도체·사건형·레인·제목 모양 쏠림 경고를 출력한다. 비밀값·네트워크 없음.
 *
 * 사용(장부만 보기):
 *   node scripts/run-bull-topic-lane-mix-check-once.mjs
 * 제안 점검:
 *   node scripts/run-bull-topic-lane-mix-check-once.mjs --title "제목" --lane decoupling_flows \
 *     --kind structure --domain flows_structure --semi no [--shape contrast]
 */

import { runTsProbe } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();

const LANES = ["cause_explainer", "figure_statement", "event_countdown", "policy_change", "new_theme", "macro_translation", "decoupling_flows", "weekly_checkpoint"];
const KINDS = ["event", "schedule", "structure", "concept"];
const DOMAINS = ["semiconductor", "flows_structure", "dividend_policy", "bio", "energy", "macro", "mobility", "theme_new", "platform_consumer", "other"];
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
  if (!KINDS.includes(args.kind)) errors.push(`--kind 는 ${KINDS.join("|")}`);
  if (!DOMAINS.includes(args.domain)) errors.push(`--domain 은 ${DOMAINS.join("|")}`);
  if (!["yes", "no"].includes(args.semi)) errors.push("--semi 는 yes|no");
  if (args.shape !== undefined && !SHAPES.includes(args.shape)) errors.push(`--shape 는 ${SHAPES.join("|")}`);
  if (errors.length > 0) {
    console.error(`ABORT: ${errors.join("; ")}`);
    process.exit(2);
  }
}

const proposal = hasProposal
  ? {
      title: args.title,
      lane: args.lane,
      kind: args.kind,
      domain: args.domain,
      semiconductorRelated: args.semi === "yes",
      titleShape: args.shape,
    }
  : null;

const probe = `
import { BULL_EPISODE_LEDGER, assessBullTopicProposal } from "./bull-topic-lanes.js";
import type { BullTopicProposal } from "./bull-topic-lanes.js";
const proposal = ${JSON.stringify(proposal)} as BullTopicProposal | null;
const assessment = proposal ? assessBullTopicProposal(proposal) : null;
process.stdout.write(JSON.stringify({ ledger: BULL_EPISODE_LEDGER, assessment }));
`;

let result;
try {
  result = runTsProbe({
    root: ROOT,
    probeDir: "lib/source-facts",
    probeSource: probe,
    extraJsFiles: ["bull-topic-lanes.js"],
  });
} catch (error) {
  console.error(`ABORT: ${error.message}`);
  process.exit(1);
}

console.log("");
console.log("=== 황소특보 게시 장부 (편 / 레인 / 유형 / 영역 / 반도체) ===");
for (const e of result.ledger) {
  console.log(`${String(e.episode).padStart(2)}편  ${e.lane.padEnd(18)} ${e.kind.padEnd(9)} ${e.domain.padEnd(16)} ${e.semiconductorRelated ? "반도체" : "-     "}  ${e.summary}`);
}
const semis = result.ledger.filter((e) => e.semiconductorRelated).length;
console.log(`\n반도체 계열 ${semis}/${result.ledger.length}편, 사건형 ${result.ledger.filter((e) => e.kind === "event").length}편`);

if (result.assessment) {
  const a = result.assessment;
  console.log("");
  console.log(`=== 제안 점검: "${proposal.title}" ===`);
  console.log(`창 ${a.windowSize}편 기준 — 반도체 계열 ${a.semiconductorCount}편, 사건형 ${a.eventCount}편 (이번 제안 포함)`);
  if (a.ok) {
    console.log("쏠림 기준에 걸리지 않습니다. (좋은 소재라는 뜻이 아니라 쏠림 경고가 없다는 뜻입니다.)");
  } else {
    for (const w of a.warnings) console.log(`경고: ${w}`);
  }
}
