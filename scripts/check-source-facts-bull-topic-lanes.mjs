// 황소특보 소재 발굴 레인 + 쏠림 판정 + 확장 캘린더 검증 (네트워크 없음, 순수 함수)
//
// 검증 항목
//   1. tsc strict 타입체크(bull-topic-lanes.ts, bull-event-calendar.ts)
//   2. 레인 10개, id 중복 없음
//   3. 게시 장부: 1~9편, 편 번호 중복 없음
//   4. assessBullTopicProposal: 반도체/사건형/레인 연속/제목 모양 연속/금지 제목 틀 경고
//   5. 쏠림 경고가 없는 정상 제안은 ok=true
//   6. 캘린더: 신규 일정(마이크론·수출입동향·테슬라) 등록, 날짜 형식, findUpcoming D-N

import { existsSync } from "node:fs";
import path from "node:path";
import { runTsProbe, typecheck } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();
const failures = [];
const passes = [];

function check(label, fn) {
  try {
    fn();
    passes.push(label);
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const LANES_FILE = "lib/source-facts/bull-topic-lanes.ts";
const CAL_FILE = "lib/source-facts/bull-event-calendar.ts";

check("target files exist", () => {
  assert(existsSync(path.join(ROOT, LANES_FILE)), `missing ${LANES_FILE}`);
  assert(existsSync(path.join(ROOT, CAL_FILE)), `missing ${CAL_FILE}`);
});

check("typecheck passes", () => {
  typecheck(ROOT, [LANES_FILE, CAL_FILE]);
});

const probe = `
import {
  BULL_TOPIC_LANES,
  BULL_EPISODE_LEDGER,
  assessBullTopicProposal,
} from "./bull-topic-lanes.js";
import type { BullEpisodeTopicRecord, BullTopicProposal } from "./bull-topic-lanes.js";
import { BULL_SCHEDULED_EVENTS, findUpcomingBullEvents } from "./bull-event-calendar.js";

const results: Record<string, any> = {};

results.laneIds = BULL_TOPIC_LANES.map((l) => l.id);
results.ledgerEpisodes = BULL_EPISODE_LEDGER.map((e) => e.episode);
results.ledgerSemis = BULL_EPISODE_LEDGER.filter((e) => e.semiconductorRelated).length;
// 가상 시나리오 시험은 11편까지의 고정 장부로 한다(실제 장부에 12편 이후가 추가돼도 시험이 흔들리지 않게).
const LEDGER_1_11 = BULL_EPISODE_LEDGER.filter((e) => e.episode <= 11);

const clean: BullTopicProposal = {
  title: "코스피는 63% 올랐는데, 외국인은 170조를 팔았다",
  lane: "decoupling_flows",
  kind: "structure",
  domain: "flows_structure",
  semiconductorRelated: false,
  titleShape: "number",
};
results.clean = assessBullTopicProposal(clean, LEDGER_1_11);
// 실제 장부(13편 등록 후): 13편과 같은 레인(decoupling_flows)·같은 제목 모양(question)이면 경고
results.realLaneConsec = assessBullTopicProposal({ ...clean, titleShape: "question" });

// 사건형 → 장부에 가상 12·13편(사건형)을 더하면 최근 4편(10~13)에 사건형 2편 + 이번 = 3편이 되어 경고
const ledgerEventHeavy: BullEpisodeTopicRecord[] = [
  ...LEDGER_1_11,
  { episode: 12, summary: "가상 12편", lane: "cause_explainer", kind: "event", domain: "energy", semiconductorRelated: false, titleShape: "question" },
  { episode: 13, summary: "가상 13편", lane: "policy_change", kind: "event", domain: "bio", semiconductorRelated: false, titleShape: "why" },
];
results.eventHeavy = assessBullTopicProposal({ ...clean, kind: "event", lane: "decoupling_flows", titleShape: "declaration" }, ledgerEventHeavy);

// 반도체 계열을 한 번 더 하면 (9편 포함 2편) 허용, 장부에 반도체 편이 더 있으면 경고(가상 12편)
const ledgerWithSemi12: BullEpisodeTopicRecord[] = [
  ...LEDGER_1_11,
  { episode: 12, summary: "가상 12편", lane: "cause_explainer", kind: "concept", domain: "semiconductor", semiconductorRelated: true, titleShape: "declaration" },
];
results.semiOnceMore = assessBullTopicProposal({ ...clean, semiconductorRelated: true }, LEDGER_1_11); // 8~11 중 9편 반도체 → 총 2
results.semiTwiceMore = assessBullTopicProposal({ ...clean, semiconductorRelated: true }, ledgerWithSemi12); // 9~12 중 9,12 + 이번 → 3

// 직전 11편과 같은 레인·같은 제목 모양
results.sameLaneShape = assessBullTopicProposal({ ...clean, lane: "cause_explainer", titleShape: "contrast" }, LEDGER_1_11);

// 금지 제목 틀
results.bannedWhy = assessBullTopicProposal({ ...clean, title: "현대차 주가가 빠지는 진짜 이유" });
results.bannedIdentity = assessBullTopicProposal({ ...clean, title: "다음 수혜주 정체" });

// 캘린더
results.eventIds = BULL_SCHEDULED_EVENTS.map((e) => e.id);
results.dateFormatOk = BULL_SCHEDULED_EVENTS.every((e) => /^\\d{4}-\\d{2}-\\d{2}$/.test(e.dateIso) && Number.isFinite(Date.parse(e.dateIso + "T00:00:00Z")));
results.tradeStatus = BULL_SCHEDULED_EVENTS.find((e) => e.id === "kr-trade-2026-09")?.status ?? null;
results.micronStatus = BULL_SCHEDULED_EVENTS.find((e) => e.id === "micron-fy2026-q4")?.status ?? null;
results.upcoming = findUpcomingBullEvents({ todayIso: "2026-09-30", withinDays: 3 }).map((e) => ({ id: e.id, d: e.daysUntil }));

process.stdout.write(JSON.stringify(results));
`;

let r = null;
check("runtime probe executes", () => {
  r = runTsProbe({
    root: ROOT,
    probeDir: "lib/source-facts",
    probeSource: probe,
    extraJsFiles: ["bull-topic-lanes.js", "bull-event-calendar.js"],
  });
});

if (r) {
  check("8 lanes with unique ids", () => {
    assert(r.laneIds.length === 10, `lane count ${r.laneIds.length}`);
    assert(new Set(r.laneIds).size === 10, "duplicate lane ids");
  });

  check("ledger covers episodes 1-13 without duplicates; 7 of 13 are semiconductor-related", () => {
    assert(JSON.stringify(r.ledgerEpisodes) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]), JSON.stringify(r.ledgerEpisodes));
    assert(r.ledgerSemis === 7, `ledgerSemis ${r.ledgerSemis}`);
  });

  check("real ledger: same lane and title shape as episode 13 are flagged", () => {
    assert(r.realLaneConsec.warnings.some((w) => w.includes("직전 13편") && w.includes("같은 레인")), JSON.stringify(r.realLaneConsec.warnings));
    assert(r.realLaneConsec.warnings.some((w) => w.includes("같은 제목 모양")), JSON.stringify(r.realLaneConsec.warnings));
  });

  check("clean proposal has no warnings and counts are reported", () => {
    assert(r.clean.ok === true, `warnings ${JSON.stringify(r.clean.warnings)}`);
    assert(r.clean.semiconductorCount === 1, `semis ${r.clean.semiconductorCount}`);
    assert(r.clean.eventCount === 1, `events ${r.clean.eventCount}`);
  });

  check("event-kind proposal trips the event-share warning", () => {
    assert(r.eventHeavy.ok === false, "should warn");
    assert(r.eventHeavy.warnings.some((w) => w.includes("사건형 쏠림")), JSON.stringify(r.eventHeavy.warnings));
  });

  check("one more semiconductor episode is allowed, a third in the window is not", () => {
    assert(!r.semiOnceMore.warnings.some((w) => w.includes("반도체 계열 쏠림")), JSON.stringify(r.semiOnceMore.warnings));
    assert(r.semiTwiceMore.warnings.some((w) => w.includes("반도체 계열 쏠림")), JSON.stringify(r.semiTwiceMore.warnings));
  });

  check("same lane and same title shape as the previous episode are flagged", () => {
    assert(r.sameLaneShape.warnings.some((w) => w.includes("같은 레인")), JSON.stringify(r.sameLaneShape.warnings));
    assert(r.sameLaneShape.warnings.some((w) => w.includes("같은 제목 모양")), JSON.stringify(r.sameLaneShape.warnings));
  });

  check("benchmark-channel title frames ('진짜 이유', '정체') are flagged", () => {
    assert(r.bannedWhy.warnings.some((w) => w.includes("제목 틀")), JSON.stringify(r.bannedWhy.warnings));
    assert(r.bannedIdentity.warnings.some((w) => w.includes("제목 틀")), JSON.stringify(r.bannedIdentity.warnings));
  });

  check("calendar has the new events with valid dates and tentative status where unconfirmed", () => {
    for (const id of ["micron-fy2026-q4", "kr-trade-2026-09", "tesla-2026-q3-deliveries"]) {
      assert(r.eventIds.includes(id), `missing ${id}`);
    }
    assert(r.dateFormatOk === true, "date format");
    assert(r.tradeStatus === "tentative", `tradeStatus ${r.tradeStatus}`);
    assert(r.micronStatus === null, `micronStatus ${r.micronStatus}`);
  });

  check("findUpcoming on 2026-09-30 (3 days) returns the D-1/D-1/D-2 events in order", () => {
    const ids = r.upcoming.map((e) => e.id);
    assert(ids.includes("micron-fy2026-q4") && ids.includes("kr-trade-2026-09") && ids.includes("tesla-2026-q3-deliveries"), JSON.stringify(ids));
    const tesla = r.upcoming.find((e) => e.id === "tesla-2026-q3-deliveries");
    assert(tesla.d === 2, `tesla D-${tesla.d}`);
    const days = r.upcoming.map((e) => e.d);
    assert(JSON.stringify(days) === JSON.stringify([...days].sort((a, b) => a - b)), `not sorted ${JSON.stringify(days)}`);
    assert(!ids.includes("bok-2026-10"), "bok 10/22 should be outside a 3-day window");
  });
}

console.log("=== Bull topic lanes check ===\n");
for (const label of passes) console.log(`  PASS  ${label}`);
for (const failure of failures) console.log(`  FAIL  ${failure}`);
console.log(`\n${passes.length} passed, ${failures.length} failed`);
process.exit(failures.length === 0 ? 0 : 1);
