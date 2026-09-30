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
 *   6 웹 보강(Claude가 수행)          정책브리핑·언론 "이달/다음 달 달라지는 제도", 후보별 공식 운영 여부 — 체크리스트 ⬜로 남김
 * 자격증명은 no-log 래퍼로만 주입된다(값 읽기 없음).
 *
 * 사용: node scripts/run-owl-topic-full-scan-once.mjs [--out-dir C:/tmp/owl-topic-scan-YYYY-MM-DD]
 * 결과: <out-dir>/01-…05-*.txt, 02-top-reels.txt, SCAN_CHECKLIST.md. 보고에는 체크리스트를 그대로 붙인다.
 * 종료 코드: 실패 있으면 1, 전부 통과면 0(6단계 웹 보강은 Claude가 채운다).
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
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
];

const rows = [];
for (const step of STEPS) {
  process.stdout.write(`[${step.n}/6] ${step.name} … `);
  const r = spawnSync(process.execPath, step.args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
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
  rows.push({ ...step, status: ok ? "✅" : "❌", note: note || (ok ? "" : `exit ${r.status}`) });
  console.log(ok ? "OK" : "FAIL");
}

rows.push({
  n: 6,
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
].join("\n");
fs.writeFileSync(path.join(OUT_DIR, "SCAN_CHECKLIST.md"), md, "utf8");
console.log(`\n${md}`);
console.log(`→ ${OUT_DIR}`);
process.exit(failed > 0 ? 1 : blocked > 0 ? 3 : 0);
