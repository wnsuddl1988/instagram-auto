#!/usr/bin/env node
/**
 * 황소특보 소재 탐색 — 정해진 러너를 "전부" 한 번에 실행하고 체크리스트를 남긴다. (2026-09-30)
 *
 * 배경: Owner 지적 — "러너가 있는데 왜 안 돌리냐, 정해진 규칙은 누락하지 말고 다 진행하라." 규칙 11 ⓒ의
 * "기존 러너는 필요할 때만"이라는 문구를 핑계로 공시·섹터·종목뉴스·지수 스캔을 건너뛰었다. 이 스크립트는
 * 사람이 단계를 골라 돌리는 여지를 없앤다: 8개 전부 실행하고(2026-09-30 밤 공식 지표 추가), 하나라도 실패·누락이면 비정상 종료한다.
 *
 * 실행 단계(순서 고정):
 *   1 일정(D-N)            run-bull-topic-calendar-once.mjs --days 14        (비밀값 없음)
 *   2 지수·대형주 임계치    bull-topic-scan --arm                              (KIS/AlphaVantage)
 *   3 레인 뉴스 + 영역 보강 bull-topic-lane-news-search --arm                  (네이버, 레인+영역 요약 — 미국주식·원자재·코인 포함)
 *   4 중소형주·계약 뉴스    bull-topic-news-search --arm                       (네이버)
 *   5 공급계약·수주 공시    bull-topic-dart-scan --arm                         (DART)
 *   6 섹터·전망 뉴스        bull-topic-sector-news-search --arm                (네이버)
 *   7 위험고지·투자심리·수급 bull-topic-risk-awareness-news-search --arm      (네이버)
 *   8 공식 지표            owl-indicator-snapshot --arm                       (ECOS·KOSIS, 2026-09-30 밤 추가)
 *   9 인스타 성과          instagram-insights-collect --arm                   (읽기 전용, 2026-10-01 추가)
 *  10 유튜브 성과          youtube-analytics-collect --arm                    (읽기 전용, 2026-10-01 추가)
 * 자격증명은 no-log 래퍼(run-owner-command-with-local-env-no-log.mjs)로만 주입된다(값 읽기 없음).
 *
 * 사용: node scripts/run-bull-topic-full-scan-once.mjs [--out-dir C:/tmp/bull-topic-scan-YYYY-MM-DD]
 * 결과: <out-dir>/01-…07-*.txt 와 SCAN_CHECKLIST.md. 보고에는 이 체크리스트를 그대로 붙인다.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const outArg = argv.indexOf("--out-dir") >= 0 ? argv[argv.indexOf("--out-dir") + 1] : null;
const today = new Date().toISOString().slice(0, 10);
const OUT_DIR = outArg || `C:/tmp/bull-topic-scan-${today}`;
fs.mkdirSync(OUT_DIR, { recursive: true });

const WRAPPER = "scripts/run-owner-command-with-local-env-no-log.mjs";
const STEPS = [
  { n: 1, name: "일정(D-N)", file: "01-calendar.txt", args: ["scripts/run-bull-topic-calendar-once.mjs", "--days", "14"] },
  { n: 2, name: "지수·대형주 임계치", file: "02-scan.txt", args: [WRAPPER, "bull-topic-scan", "--arm"] },
  { n: 3, name: "레인 뉴스 + 영역 보강", file: "03-lane-news.txt", args: [WRAPPER, "bull-topic-lane-news-search", "--arm"] },
  { n: 4, name: "중소형주·계약 뉴스", file: "04-stock-news.txt", args: [WRAPPER, "bull-topic-news-search", "--arm"] },
  { n: 5, name: "공급계약·수주 공시", file: "05-dart.txt", args: [WRAPPER, "bull-topic-dart-scan", "--arm"] },
  { n: 6, name: "섹터·전망 뉴스", file: "06-sector.txt", args: [WRAPPER, "bull-topic-sector-news-search", "--arm"] },
  { n: 7, name: "위험고지·투자심리·수급", file: "07-risk.txt", args: [WRAPPER, "bull-topic-risk-awareness-news-search", "--arm"] },
  // 2026-09-30 밤 추가: 공식 지표(ECOS 기준금리·물가·환율·국고채3년·코스피·경상·상품수지 + KOSIS 고용률·실업률).
  // 부엉과 같은 러너를 쓴다 — 매크로 번역·환율 소재의 숫자를 기사 대신 공식 발표값으로 대조한다.
  { n: 8, name: "공식 지표 ECOS·KOSIS", file: "08-indicators.txt", args: [WRAPPER, "owl-indicator-snapshot", "--arm"] },
  // 2026-10-01 추가(Owner 지적 "러너 다 돌린 거 맞아?"): 황소 오케스트레이터에 성과 단계가 없어 12편 소재 선정 때 빠졌다.
  // 어떤 소재·훅이 실제로 먹혔는지(조회·평균 시청·저장)를 순위에 반영하도록 읽기 전용 수집 2개를 포함한다(부엉 오케스트레이터와 동일).
  { n: 9, name: "인스타 성과(읽기 전용)", file: "09-instagram-insights.txt", args: [WRAPPER, "instagram-insights-collect", "--arm"] },
  { n: 10, name: "유튜브 성과(읽기 전용)", file: "10-youtube-analytics.txt", args: [WRAPPER, "youtube-analytics-collect", "--arm"] },
];

const rows = [];
for (const step of STEPS) {
  const started = Date.now();
  process.stdout.write(`[${step.n}/${STEPS.length}] ${step.name} … `);
  const r = spawnSync("node", step.args, { cwd: process.cwd(), encoding: "utf8", maxBuffer: 128 * 1024 * 1024, timeout: 10 * 60 * 1000 });
  const text = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  fs.writeFileSync(path.join(OUT_DIR, step.file), text, "utf8");
  const lines = text.split(/\r?\n/).length;
  const ok = r.status === 0 && !/^ABORT:|^FATAL:/m.test(text);
  rows.push({ ...step, ok, lines, sec: Math.round((Date.now() - started) / 1000) });
  console.log(ok ? `완료(${lines}줄, ${Math.round((Date.now() - started) / 1000)}초)` : `★실패★ (exit ${r.status})`);
}

// 3단계 끝의 "원재료 개수 요약"을 체크리스트에 그대로 싣는다(0건 그룹이 보이게).
const laneText = fs.readFileSync(path.join(OUT_DIR, "03-lane-news.txt"), "utf8");
const summaryStart = laneText.indexOf("원재료 개수 요약");
const laneSummary = summaryStart >= 0 ? laneText.slice(summaryStart).split("\n").filter((l) => /건$/.test(l.trim())).join("\n") : "(요약을 찾지 못함 — 3단계 출력 확인)";

const failed = rows.filter((x) => !x.ok);
const md = [
  `# 황소특보 소재 탐색 실행 체크리스트 — ${today}`,
  "",
  "| 단계 | 러너 | 결과 | 출력 |",
  "|---|---|---|---|",
  ...rows.map((x) => `| ${x.n} | ${x.name} | ${x.ok ? "✅ 실행" : "❌ 실패"} | ${x.file} (${x.lines}줄) |`),
  "",
  "## 레인·영역별 원재료 개수 (⚠ = 0건)",
  "```",
  laneSummary,
  "```",
  "",
  failed.length ? `★ 실패 ${failed.length}건: ${failed.map((x) => x.name).join(", ")} — 원인을 고치고 다시 실행하기 전에는 소재를 제안하지 않는다.` : "전 단계 실행 완료. 다음: 09·10번 성과(편별 조회·평균 시청)를 읽고 \"황소에서 실제로 먹힌 소재·훅\"을 순위에 반영 → 후보마다 run-bull-topic-lane-mix-check-once.mjs(쏠림) + 원문 팩트 확인 + 담당 캐릭터·특보 근접도 판정.",
  "",
].join("\n");
fs.writeFileSync(path.join(OUT_DIR, "SCAN_CHECKLIST.md"), md, "utf8");
console.log("\n" + md);
process.exit(failed.length ? 1 : 0);
