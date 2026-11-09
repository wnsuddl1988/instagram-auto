#!/usr/bin/env node
/**
 * 부엉박사 제도 시행·통계 발표 일정표 검사 (lib/source-facts/owl-policy-calendar.ts). 비밀값·네트워크 없음.
 * 사용: node scripts/check-source-facts-owl-policy-calendar.mjs
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
import { OWL_SCHEDULED_EVENTS, findUpcomingOwlEvents } from "./owl-policy-calendar.js";
const r: Record<string, any> = {};
r.ids = OWL_SCHEDULED_EVENTS.map((e) => e.id);
r.dateOk = OWL_SCHEDULED_EVENTS.every((e) => /^\\d{4}-\\d{2}-\\d{2}$/.test(e.dateIso) && Number.isFinite(Date.parse(e.dateIso + "T00:00:00Z")));
r.noteOk = OWL_SCHEDULED_EVENTS.every((e) => e.sourceNote.trim().length >= 10);
r.status = Object.fromEntries(OWL_SCHEDULED_EVENTS.map((e) => [e.id, e.status ?? "confirmed"]));
r.up60 = findUpcomingOwlEvents({ todayIso: "2026-10-01", withinDays: 60 }).map((e) => ({ id: e.id, d: e.daysUntil }));
r.up3 = findUpcomingOwlEvents({ todayIso: "2026-10-01", withinDays: 3 }).map((e) => e.id);
r.past = findUpcomingOwlEvents({ todayIso: "2026-10-03", withinDays: 3 }).map((e) => e.id);
r.bad = findUpcomingOwlEvents({ todayIso: "not-a-date" }).length;
process.stdout.write(JSON.stringify(r));
`;

let r = null;
check("runtime probe executes(typecheck 포함)", () => {
  r = runTsProbe({ root: ROOT, probeDir: "lib/source-facts", probeSource: probe, extraJsFiles: ["owl-policy-calendar.js"] });
});
if (r) {
  check("id 중복 없음, 날짜 형식·근거 메모(10자 이상) 모두 유효", () => {
    assert(new Set(r.ids).size === r.ids.length, "duplicate ids");
    assert(r.dateOk, "bad date");
    assert(r.noteOk, "note too short");
  });
  check("한국은행 공표일정으로 확인한 일정(10/22 금통위·10/27 GDP·10/29 가중평균금리)이 확정으로 등록돼 있다", () => {
    for (const id of ["bok-2026-10", "bok-gdp-2026-q3", "bok-wavg-rate-2026-09"]) {
      assert(r.ids.includes(id), `missing ${id}`);
      assert(r.status[id] === "confirmed", `${id} status ${r.status[id]}`);
    }
  });
  check("관행·검색 요약으로만 아는 날짜(소비자물가 10/2, 코픽스 10/15, 세제개편 확정 12/2)는 미확정(tentative)", () => {
    for (const id of ["cpi-2026-09", "cofix-2026-09", "tax-reform-2026-final"]) {
      assert(r.status[id] === "tentative", `${id} status ${r.status[id]}`);
    }
  });
  check("2026-10-01 기준 60일 창: 가까운 순 정렬, 10/2(D-1)부터 12/2(D-62 제외 → 60일 밖)", () => {
    const days = r.up60.map((e) => e.d);
    assert(JSON.stringify(days) === JSON.stringify([...days].sort((a, b) => a - b)), JSON.stringify(days));
    assert(r.up60[0].id === "cpi-2026-09" && r.up60[0].d === 1, JSON.stringify(r.up60[0]));
    assert(!r.up60.some((e) => e.id === "tax-reform-2026-final"), "12/2는 D-62라 60일 창 밖이어야 함");
  });
  check("3일 창은 10/2 소비자물가만, 지난 일정은 나오지 않고, 잘못된 날짜는 빈 배열", () => {
    assert(JSON.stringify(r.up3) === JSON.stringify(["cpi-2026-09"]), JSON.stringify(r.up3));
    assert(r.past.length === 0, JSON.stringify(r.past));
    assert(r.bad === 0, `bad ${r.bad}`);
  });
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
