#!/usr/bin/env node
/**
 * 부엉박사 소재 탐색 — 정해진 러너를 "전부" 한 번에 실행하고 체크리스트를 남긴다. (2026-09-30 밤)
 *
 * 배경: Owner 지적 — "황소특보처럼 활용 못 한 러너가 있다면 다시 체크해서 활용하고 앞으로도 무조건 사용해.
 * 처음 시작할 때 엄청 다양한 방면을 요청했었다." 부엉 소재 탐색이 레인 뉴스 32개 키워드 하나만 돌고 있었고,
 * 처음 만든 공식 지표(ECOS·KOSIS) 파이프라인과 성과 데이터는 쓰지 않았다. 황소 오케스트레이터
 * (run-bull-topic-full-scan-once.mjs)와 같은 방식으로 사람이 단계를 골라 건너뛸 여지를 없앤다.
 *
 * 실행 단계(순서 고정):
 *   1 레인 8 + 영역 16 뉴스            owl-topic-lane-news-search --arm             (네이버)
 *   2 인스타 성과(읽기 전용)           instagram-insights-collect --arm → 조회·저장 상위 요약
 *   3 유튜브 성과(읽기 전용)           youtube-analytics-collect --arm
 *   4 게시 장부·쏠림 기준 표          run-owl-topic-lane-mix-check-once.mjs(기준 확인용 제안)
 *   5 공식 지표 ECOS·KOSIS            owl-indicator-snapshot --arm (2026-09-30 밤 Owner 승인으로 래퍼 등록)
 *                                     (옛 run-editorial-v2-live-topic-pipeline.mjs는 .env.local을 직접 읽어 규칙상 실행 금지 —
 *                                      그래서 래퍼 주입만 쓰는 run-owl-indicator-snapshot-once.mjs를 새로 만들었다.)
 *   6 제도 시행·신청·통계 발표 D-N    run-owl-topic-calendar-once.mjs --days 60 (2026-10-01 신설, 비밀값 없음)
 *   7 황소 풀스캔(투자자 각도 이관용)  run-bull-topic-full-scan-once.mjs --no-cross (2026-10-01 추가, 규칙 22 — 끄려면 --no-cross)
 *   8 웹 보강(Claude가 수행)          정책브리핑·언론 "이달/다음 달 달라지는 제도", 후보별 공식 운영 여부 — 체크리스트 ⬜로 남김
 * 끝에 뉴스 결과 전체를 날짜순으로 정리한 CANDIDATE_POOL_*.md를 자동 생성한다(2026-10-01, 후보 누락 방지 — 보고는 이 풀 전체를 읽고 쓴다).
 * 자격증명은 no-log 래퍼로만 주입된다(값 읽기 없음).
 *
 * 사용: node scripts/run-owl-topic-full-scan-once.mjs [--out-dir C:/tmp/owl-topic-scan-YYYY-MM-DD]
 * 결과: <out-dir>/01-…05-*.txt, 02-top-reels.txt, SCAN_CHECKLIST.md. 보고에는 체크리스트를 그대로 붙인다.
 * 종료 코드: 실패 있으면 1, 전부 통과면 0(6단계 웹 보강은 Claude가 채운다).
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { writeCandidatePool } from "./_topic-pool.mjs";

const argv = process.argv.slice(2);
// 황소 풀스캔이 이 스캔을 다시 부를 때(교차 실행) 무한 재귀를 막는 플래그.
const NO_CROSS = argv.includes("--no-cross");
const outArg = argv.indexOf("--out-dir") >= 0 ? argv[argv.indexOf("--out-dir") + 1] : null;
const today = new Date().toISOString().slice(0, 10);
const OUT_DIR = outArg || `C:/tmp/owl-topic-scan-${today}`;
fs.mkdirSync(OUT_DIR, { recursive: true });

const WRAPPER = "scripts/run-owner-command-with-local-env-no-log.mjs";
const STEPS = [
  { n: 1, name: "레인 8 + 영역 16 뉴스", file: "01-lane-domain-news.txt", args: [WRAPPER, "owl-topic-lane-news-search", "--arm"] },
  { n: 2, name: "인스타 성과(읽기 전용)", file: "02-instagram-insights.txt", args: [WRAPPER, "instagram-insights-collect", "--arm"] },
  { n: 3, name: "유튜브 성과(읽기 전용)", file: "03-youtube-analytics.txt", args: [WRAPPER, "youtube-analytics-collect", "--arm"] },
  {
    n: 4,
    name: "게시 장부·쏠림 기준 표",
    file: "04-ledger.txt",
    args: ["scripts/run-owl-topic-lane-mix-check-once.mjs", "--title", "(기준 확인용)", "--lane", "indicator", "--domain", "other"],
  },
  // 2026-09-30 밤 Owner 승인으로 래퍼에 ECOS·KOSIS 키 등록 → 차단 해제. 기준금리·물가·환율·국고채·코스피·경상·상품수지(ECOS)
  // + 고용률·실업률(KOSIS). KOSIS 키가 무효면 그 2개만 실패로 표시된다(키 재발급은 Owner).
  { n: 5, name: "공식 지표 ECOS·KOSIS", file: "05-indicators.txt", args: [WRAPPER, "owl-indicator-snapshot", "--arm"] },
  // 2026-10-01 신설(Owner "러너 보강"): 부엉용 제도 시행·신청 마감·통계 발표 D-N. 황소의 일정 러너에 해당.
  { n: 6, name: "제도 시행·신청·통계 발표 D-N", file: "06-calendar.txt", args: ["scripts/run-owl-topic-calendar-once.mjs", "--days", "60"], plain: true },
  // 2026-10-01 추가(규칙 22): 부엉 탐색에서도 투자자 각도(종목·섹터·시황·투자 일정)는 황소 후보로 이관해야 하므로
  // 황소 풀스캔(일정·지수·공시 API·섹터·위험 뉴스·지표·성과)을 같이 돌린다. --no-cross로 끌 수 있다.
  ...(NO_CROSS
    ? []
    : [
        {
          n: 7,
          name: "황소 풀스캔(투자자 각도 이관용)",
          file: "07-bull-cross.log",
          args: ["scripts/run-bull-topic-full-scan-once.mjs", "--out-dir", path.join(OUT_DIR, "bull-cross"), "--no-cross"],
          plain: true,
          timeoutMs: 30 * 60 * 1000,
        },
      ]),
];

const rows = [];
for (const step of STEPS) {
  process.stdout.write(`[${step.n}/${STEPS.length}] ${step.name} … `);
  const r = spawnSync(process.execPath, step.args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: step.timeoutMs ?? 10 * 60 * 1000 });
  const out = `${r.stdout ?? ""}${r.stderr ? `\n[stderr]\n${r.stderr}` : ""}`;
  fs.writeFileSync(path.join(OUT_DIR, step.file), out, "utf8");
  const ok = r.status === 0 && !/ABORT/.test(out);
  let note = "";
  if (step.n === 1) {
    const warn = (out.match(/^⚠ .*$/gm) ?? []).map((l) => l.replace(/^⚠\s*/, ""));
    const failedKw = /키워드 검색 실패: (\d+)건/.exec(out)?.[1];
    note = `${warn.length ? `0건 그룹: ${warn.join(", ")}` : "0건 그룹 없음"}${failedKw ? ` / 키워드 실패 ${failedKw}건` : ""}`;
  }
  if (step.n === 2 && ok) note = summarizeInsights();
  if (step.n === 5) {
    const got = /지표 (\d+)개 조회 성공/.exec(out)?.[1];
    const fail = /조회 실패 (\d+)건/.exec(out)?.[1];
    const kosisBad = /KOSIS API error 11/.test(out);
    note = `성공 ${got ?? 0}개${fail ? ` · 실패 ${fail}건` : ""}${kosisBad ? " (KOSIS 키 무효 — Owner 재발급 필요, 고용률·실업률은 웹으로 대조)" : ""}`;
  }
  if (step.n === 6) note = `${/일정 (\d+)건/.exec(out)?.[0] ?? "일정 건수 확인 필요"} (D-N, [미확정]은 공식 재확인)`;
  if (step.n === 7) {
    const bullFailed = /★ 실패 (\d+)건/.exec(out)?.[0];
    note = bullFailed ? `황소 스캔 ${bullFailed}` : `황소 스캔 전 단계 실행 → ${path.join(OUT_DIR, "bull-cross")} (투자자 각도 이관 후보)`;
  }
  rows.push({ ...step, status: ok ? "✅" : "❌", note: note || (ok ? "" : `exit ${r.status}`) });
  console.log(ok ? "OK" : "FAIL");
}

// 뉴스 결과 전체를 날짜순 표로 정리한다(후보 누락 방지, 2026-10-01). 보고 전에 이 풀을 처음부터 끝까지 읽는다.
const owlPool = writeCandidatePool({
  files: [{ path: path.join(OUT_DIR, "01-lane-domain-news.txt"), label: "부엉 뉴스" }],
  outPath: path.join(OUT_DIR, "CANDIDATE_POOL_owl.md"),
  title: `부엉박사 소재 후보 풀 — 뉴스 전체(${today})`,
});
let bullPool = null;
if (!NO_CROSS) {
  const b = path.join(OUT_DIR, "bull-cross");
  bullPool = writeCandidatePool({
    files: [
      { path: path.join(b, "03-lane-news.txt"), label: "황소 레인·영역 뉴스" },
      { path: path.join(b, "04-stock-news.txt"), label: "황소 종목·계약 뉴스" },
      { path: path.join(b, "06-sector.txt"), label: "황소 섹터 뉴스" },
      { path: path.join(b, "07-risk.txt"), label: "황소 위험·수급 뉴스" },
    ],
    outPath: path.join(OUT_DIR, "CANDIDATE_POOL_bull-cross.md"),
    title: `황소특보 이관용 후보 풀 — 투자자 각도 뉴스 전체(${today})`,
  });
}

rows.push({
  n: 8,
  name: "웹 보강(Claude 수행)",
  file: "-",
  status: "⬜",
  note: "정책브리핑·언론 '이달/다음 달 달라지는 제도' 검색, 후보별 공식 사이트 운영 여부·수치 대조 — 보고 전에 ✅로 바꿀 것",
});

function summarizeInsights() {
  try {
    const dir = "C:/tmp/money-shorts-os/insights";
    const file = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith("instagram-insights-") && f.endsWith(".json"))
      .sort()
      .at(-1);
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    const reels = data.rows.filter((x) => x.type === "REELS").sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    const lines = reels
      .slice(0, 10)
      .map(
        (x, i) =>
          `${i + 1}. 조회 ${x.views} · 저장 ${x.saved ?? 0} · 평균 ${((x.ig_reels_avg_watch_time ?? 0) / 1000).toFixed(1)}초 · ${x.timestamp.slice(0, 10)} · ${String(x.title).slice(0, 50)}`,
      );
    fs.writeFileSync(path.join(OUT_DIR, "02-top-reels.txt"), `인스타 릴스 조회 상위 10(${file})\n${lines.join("\n")}\n`, "utf8");
    return `상위 10 릴스 → 02-top-reels.txt (1위 조회 ${reels[0]?.views})`;
  } catch (error) {
    return `성과 요약 실패: ${error.message}`;
  }
}

const failed = rows.filter((r) => r.status === "❌").length;
const blocked = rows.filter((r) => r.status === "⛔").length;
const md = [
  `# 부엉박사 소재 탐색 체크리스트 (${today})`,
  "",
  "순위 기준(규칙 13): **대상 폭·체감 크기 최우선** > 시청자 행동·자산 영향 > 팩트 안정성 > 신선도. 쏠림 경고는 표시만.",
  "",
  "| 단계 | 러너 | 상태 | 결과 파일 | 비고 |",
  "|---|---|---|---|---|",
  ...rows.map((r) => `| ${r.n} | ${r.name} | ${r.status} | ${r.file} | ${r.note} |`),
  "",
  `실패 ${failed} · 차단 ${blocked}`,
  "",
  "## 후보 풀(자동 생성) — 보고 전에 반드시 처음부터 끝까지 읽는다",
  `- 부엉 뉴스: \`CANDIDATE_POOL_owl.md\` — 기사 ${owlPool.count}건(중복 제외, 원자료 ${owlPool.rawCount}건)`,
  bullPool ? `- 황소 이관용: \`CANDIDATE_POOL_bull-cross.md\` — 기사 ${bullPool.count}건(중복 제외)` : "- 황소 이관용: (--no-cross로 생략)",
  "",
  "## 보고 규칙(CURRENT_STANDARDS 규칙 13, Owner 2026-10-01)",
  "1. 후보는 개수 제한 없이 신선한 것 전부(40개 안팎). 몇 개만 골라 올리지 않는다. 표의 번호 = 추천순위, 표도 그 순서로 쓴다.",
  "2. 열: 새 정보(시청자가 몰랐을 것) · 체감 · **소식 최초일** · 이전 편 겹침 · 약점 · 확인 상태(원문/복수 매체/제목 수준).",
  "3. 소식이 처음 나온 날이 오래된 후보(예: 2개월 전 발표)는 올리지 않는다. 기사 날짜가 아니라 최초 발표일로 판단한다.",
  "4. 06 일정(D-N)의 [미확정]은 공식 재확인 전에 확정처럼 쓰지 않는다. 황소 이관 표를 따로 둔다(규칙 22).",
  "5. 러너에 안 잡힌 소식을 수동 검색으로 찾았다면 보고에 적고 키워드를 추가한다(규칙 25).",
  "",
].join("\n");
fs.writeFileSync(path.join(OUT_DIR, "SCAN_CHECKLIST.md"), md, "utf8");
console.log(`\n${md}`);
console.log(`→ ${OUT_DIR}`);
process.exit(failed > 0 ? 1 : blocked > 0 ? 3 : 0);
