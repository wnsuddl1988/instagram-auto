#!/usr/bin/env node
/**
 * 황소특보 이벤트 D-N 레인(소재 발굴 레인 ③) — 다가오는 일정 목록 출력.
 *
 * 비밀값·네트워크 없음: lib/source-facts/bull-event-calendar.ts의 손으로 관리하는 일정
 * 목록만 읽는다. 그래서 no-log 래퍼 없이 바로 실행한다.
 *
 * 사용:
 *   node scripts/run-bull-topic-calendar-once.mjs [--days 14] [--today 2026-09-30]
 *
 * --today 를 생략하면 한국 시간(UTC+9) 기준 오늘을 쓴다. 지난 일정은 표시하지 않는다.
 * status=tentative 인 일정은 "[미확정]"으로 표시한다(공식 공지 재확인 필요).
 */

import { runTsProbe } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();

function parseArgs(argv) {
  const out = { days: 14, today: null };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const value = argv[i + 1];
    if (token === "--days" && /^\d{1,3}$/.test(value ?? "")) {
      out.days = Number(value);
      i += 1;
    } else if (token === "--today" && /^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) {
      out.today = value;
      i += 1;
    } else {
      console.error(`ABORT: 알 수 없는 인자 또는 값 형식 오류: ${token} ${value ?? ""}`);
      process.exit(2);
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const todayIso = args.today ?? new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

const probe = `
import { findUpcomingBullEvents } from "./bull-event-calendar.js";
const events = findUpcomingBullEvents({ todayIso: ${JSON.stringify(todayIso)}, withinDays: ${args.days} });
process.stdout.write(JSON.stringify({ status: "OK", events }));
`;

let result;
try {
  result = runTsProbe({
    root: ROOT,
    probeDir: "lib/source-facts",
    probeSource: probe,
    extraJsFiles: ["bull-event-calendar.js"],
  });
} catch (error) {
  console.error(`ABORT: ${error.message}`);
  process.exit(1);
}

console.log("");
console.log(`=== 황소특보 이벤트 D-N (기준일 ${todayIso}, ${args.days}일 이내) ===`);
console.log("레인 ③ 이벤트 D-N 소재 후보. 날짜는 손으로 관리하는 일정표 기준이며 [미확정]은 공식 공지 재확인이 필요합니다.");
console.log("");

if (result.events.length === 0) {
  console.log("해당 기간에 등록된 일정이 없습니다. (일정표에 없다는 뜻이지 이벤트가 없다는 뜻은 아닙니다.)");
} else {
  for (const event of result.events) {
    const tag = event.status === "tentative" ? "[미확정]" : "[확정]";
    const dLabel = event.daysUntil === 0 ? "D-day" : `D-${event.daysUntil}`;
    console.log(`${dLabel}  ${event.dateIso}  ${tag} ${event.displayName}`);
    console.log(`        근거: ${event.sourceNote}`);
    console.log("");
  }
}
