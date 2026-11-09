#!/usr/bin/env node
/**
 * 경제번역소 스토리형 소재 러너 (2026-10-06 Owner 지시: "스토리형도 정말 재미있는 주제로만 뽑을 수 있도록 러너를 만들던지",
 * "40~60개로 한정하는 이유가 뭐야? 실시간 찾는 건 어려운 거야?") — 수동 실행용(cron 없음).
 *
 * ★★★★ 2026-10-11 밤 개정(v4, Owner "앞으로 이 구조를 기본 베이스로, '~~편 주제 찾자'면 이 기준으로 셀렉"):
 *   점수 기준 = 기본 베이스 구조(`_ai/templates/story-script-base-structure.md`, 기준 대본 `_ai/story-base-scripts/` 5편, Owner 9원칙).
 *   옛 10박자 storyFit은 참고(×0.5)로만 남기고, 아래를 새 기준으로 쓴다:
 *     ① 증거(증거 파일의 숫자 사실 중 서로 다른 사이트 2곳 출처 수, 경제 숫자, 결정적 장면) — 증거 파일 없음 −8 (숫자 4개 미만 −15는 2026-10-12 Owner 지시로 폐지)
 *     ② 한국·생활 접점 신호(상식 테스트의 자동 대용: 우리 나라·기업·내 돈·일자리·쓰는 물건) — 최종 판정은 Claude가 보고에서 한다
 *     ③ baseFit(선택, 풀 항목에 [상식 테스트, 퍼즐·답, 결정적 장면, 결말 보류·반전, 경제 번역] 각 1~5를 적으면 ×3 반영)
 *   러너는 후보를 뽑을 뿐이다 — 상위 후보는 보고서 "셀렉 점검표"(상식 테스트·퍼즐 한 줄과 답·날짜 3개 이하·경제 번역 지점)를
 *   Claude가 채워 Owner에게 보고하고, 통과한 소재만 설계 줄로 간다. 훅 초안이 결말을 말하면 표시한다(원칙 4).
 *
 * 구조 = 한도 없는 후보 풀 + 실행할 때마다 실시간 검색 4가지:
 *   ① 풀(lib/source-facts/story-topic-pool.json): 결말이 난 실화. 점수 = 위 기본 베이스 기준 + 검증 가능 − 위험.
 *      코인·주식투자·투자 후회담·유튜버형은 풀에서 뺐고(Owner "쓸데없는 유튜버 비트코인 주식투자 이런거 다빼"), 다시 들어와도 아래 EXCLUDE가 막는다.
 *   ② 뉴스 연결: 풀 항목마다 newsKeyword로 네이버 뉴스를 찾아 최근 72시간 기사 수만큼 가점(오늘 뉴스와 이어지는 이야기 먼저).
 *   ③ 기념일: anniversary(MM-DD)가 오늘 ±7일이면 가점("○년 전 오늘").
 *   ④ 최근 결말 사건(inbox): 판결 확정·파산·상장폐지·인수 완료 등 "이야기 모양이 갖춰진" 최근 뉴스 제목을 모아 보고서에 따로 싣는다
 *      → Claude가 읽고 좋은 것을 풀에 추가한다(자동 판정 아님).
 *   ⑤ 수요·포화 확인: 상위 후보마다 유튜브 쇼츠 검색 주소를 뽑아 둔다 — Claude가 보고 전에 열어 같은 이야기의 조회수(수요)와 큰 채널 중복(포화)을 확인.
 *
 * 사용:
 *   node scripts/run-owner-command-with-local-env-no-log.mjs story-topic-scan --arm   (실시간 포함)
 *   node scripts/run-story-topic-scan-once.mjs --offline                              (자격증명 없이 풀 점수·기념일만)
 * 결과: C:/tmp/story-topic-scan/<YYYY-MM-DD>/story-topic-report.md · .json
 */

import fs from "node:fs";
import path from "node:path";
import { runTsProbe } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();
const OFFLINE = process.argv.includes("--offline");
const POOL_PATH = path.join(ROOT, "lib", "source-facts", "story-topic-pool.json");
const pool = JSON.parse(fs.readFileSync(POOL_PATH, "utf8"));

// 제외 소재(Owner 2026-10-07): 풀 항목·최근 결말 사건 모두 이 기준에 걸리면 후보에서 뺀다.
const EXCLUDE_CATEGORY = /투자열풍|투자사고|투자후회|코인|가상자산/;
const EXCLUDE_TEXT = /코인|비트코인|가상자산|암호화폐|주가|증시|코스피|코스닥|공모주|상장폐지|상폐|개미|유튜버|유튜브 수익|인터넷 논객/;
const isExcluded = (text, category = "") => EXCLUDE_CATEGORY.test(category) || EXCLUDE_TEXT.test(text);
// 분류(verdict, 2026-10-08 Owner "쓸 수 있는 것과 못 쓰는 것 구분해서 저장"): 분류 안 된 항목이 있으면 멈춘다.
// 후보 = usable·conditional만. used(이미 만든 편)·unusable(채널 기준 미달, 재수집 방지용 보관)은 순위에서 뺀다.
const unclassified = pool.items.filter((i) => !["used", "usable", "conditional", "hold", "unusable"].includes(i.verdict));
if (unclassified.length) {
  console.error(`ABORT: verdict 없는 풀 항목 — ${unclassified.map((i) => i.id).join(", ")} (node scripts/check-story-topic-pool.mjs 로 확인)`);
  process.exit(1);
}
const isActive = (i) => i.verdict === "usable" || i.verdict === "conditional";
const blocked = pool.items.filter((i) => isActive(i) && isExcluded(`${i.title} ${i.hook}`, i.category));
// v4: storyFit(옛 10박자 7칸)은 참고용이라 없어도 멈추지 않는다(0점 처리). baseFit(5칸)은 선택.
const missingFit = pool.items.filter((i) => isActive(i) && (!Array.isArray(i.storyFit) || i.storyFit.length !== 7));
if (missingFit.length) console.warn(`WARN: storyFit(7칸, 옛 기준 참고용) 없는 풀 항목 ${missingFit.length}개 — 0점 처리`);

// ── 증거 파일에서 기본 베이스 기준 신호 뽑기(숫자 사실 중 서로 다른 사이트 2곳, 경제 숫자, 결정적 장면) ──
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^(www|m|mobile|news)\./, ""); } catch { return ""; } };
function evidenceSignals(item) {
  if (!item.evidenceFile) return { has: false, numeric: 0, econ: 0, decisive: false };
  const p = path.join(ROOT, item.evidenceFile);
  if (!fs.existsSync(p)) return { has: false, numeric: 0, econ: 0, decisive: false };
  let r;
  try { r = JSON.parse(fs.readFileSync(p, "utf8")); } catch { return { has: false, numeric: 0, econ: 0, decisive: false }; }
  const good = (f) => new Set((f.sources ?? []).filter((s) => s?.url && s?.quote).map((s) => hostOf(s.url)).filter(Boolean)).size >= 2;
  const facts = (r.facts ?? []).filter(good);
  return {
    has: true,
    numeric: facts.filter((f) => f.numeric === true).length,
    econ: facts.filter((f) => f.numeric === true && f.economy === true).length,
    decisive: !!r.decisiveFact && facts.some((f) => f.id === r.decisiveFact),
  };
}
// 상식 테스트의 자동 대용 신호(최종 판정은 Claude가 보고에서): 우리 나라·기업 / 내 돈·일자리·쓰는 물건
const KR_RE = /(한국|국민|우리나라|삼성|현대|LG|엘지|SK|포스코|쿠쿠|대우|롯데|농심|오리온|네이버|카카오|IMF|외환위기|한진)/;
const LIFE_RE = /(예금|통장|월급|일자리|해고|물가|세금|대출|카드|연금|집값|전세|월세|보험|밥솥|라면|과자|폰|휴대폰|자동차|동전|지폐|은행|환율|금리|배달|쿠팡)/;
// 훅 초안이 결말을 말하는가(Owner 9원칙 4)
const RESULT_RE = /(흑자|1위|성공|해냈|이겼|살렸|들어섰|올랐|돌아섰|우승|대박|세계적)/;

// ④ 최근 결말 사건 키워드(코드에 고정 — 래퍼가 임의 키워드를 주입할 통로를 만들지 않는다).
const CONCLUDED_KEYWORDS = Object.freeze([
  "세계 최초 성공 한국", "역대 최대 수주", "유네스코 등재", "기네스 기록 한국", "세계 1위 탈환",
  "몇 년 만에 흑자전환", "파산 선고 기업", "회생절차 종결", "인수 완료 매각 마무리", "역대 최대 과징금",
  "환불 대란", "폰지 사기 판결", "뱅크런", "기업 몰락", "보상 결정 피해자",
]);

const today = new Date();
const ymd = today.toLocaleDateString("sv-SE"); // 로컬(한국) 날짜 — toISOString은 UTC라 오전 9시 전엔 하루 전 날짜가 됐다
const outDir = `C:/tmp/story-topic-scan/${ymd}`;

// ── 실시간 검색(네이버 뉴스) ──
let news = { status: "OFFLINE", items: [], failed: [] };
if (!OFFLINE) {
  if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
    console.error("ABORT: 네이버 뉴스 자격증명이 없습니다. no-log 래퍼로 실행하거나 --offline으로 실행하세요.");
    process.exit(2);
  }
  const keywords = [...new Set([...pool.items.filter((i) => isActive(i) && !i.usedEpisode && !blocked.includes(i)).map((i) => i.newsKeyword).filter(Boolean), ...CONCLUDED_KEYWORDS])];
  const probe = `
import { collectNaverNewsForKeywords } from "./naver-news-connector.js";
import { createNaverNewsLiveTransport, resolveNaverCredentials } from "./naver-news-live-transport.js";
import { loadSourceRegistry } from "../editorial-v2/economic-source-registry.js";
const keywords = ${JSON.stringify(keywords)};
const credentials = resolveNaverCredentials();
if (!credentials) { process.stdout.write(JSON.stringify({ status: "BLOCKED", reason: "missing_naver_credentials" })); process.exit(0); }
const transport = createNaverNewsLiveTransport({ credentials });
const registry = loadSourceRegistry();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const results: any[] = []; const failed: { keyword: string; reason: string }[] = [];
for (const keyword of keywords) {
  let lastReason = ""; let done = false;
  for (let attempt = 0; attempt < 3 && !done; attempt += 1) {
    if (attempt > 0) await sleep(2500 * attempt);
    const one = await collectNaverNewsForKeywords([keyword], transport, registry, { display: 10 });
    if (one.results.length > 0) { results.push(...one.results); done = true; }
    else { lastReason = one.failed[0]?.reason ?? "no result"; if (!/rate limited/.test(lastReason)) break; }
  }
  if (!done) failed.push({ keyword, reason: lastReason });
  await sleep(700);
}
const items = results.flatMap((r: any) => r.items.map((item: any) => ({ keyword: r.keyword, title: item.title, publishedAt: item.publishedAt, publisherName: item.publisherName, link: item.originallink || item.link })));
process.stdout.write(JSON.stringify({ status: "OK", items, failed }));
`;
  try {
    news = runTsProbe({ root: ROOT, probeDir: "lib/source-facts", probeSource: probe, extraJsFiles: ["naver-news-connector.js", "naver-news-live-transport.js"] });
  } catch (error) {
    console.error(`ABORT: ${error.message}`);
    process.exit(1);
  }
  if (news.status === "BLOCKED") { console.error(`ABORT: ${news.reason}`); process.exit(2); }
}

const hoursAgo = (iso) => (today.getTime() - new Date(iso).getTime()) / 3600000;
const recentByKeyword = new Map();
for (const it of news.items) {
  if (!it.publishedAt || hoursAgo(it.publishedAt) > 72) continue;
  if (!recentByKeyword.has(it.keyword)) recentByKeyword.set(it.keyword, []);
  recentByKeyword.get(it.keyword).push(it);
}

// ── 점수 ──
// 10박자 적합 = storyFit 7칸 합 ×2 (최대 70) + 검증 가능(scores[5], 최대 5) − 위험×3 − 포화 3
// 미달: 위기(0)·통념 뒤집힘(1)·결과(3) 중 하나라도 2 이하이면 10박자가 안 채워진다 → 표시하고 아래로.
// 실시간 가점: 뉴스(최근 72시간 기사 수, 최대 +8) + 기념일(±7일 +5)
const dayOfYear = (mmdd, year) => { const [m, d] = mmdd.split("-").map(Number); return new Date(year, m - 1, d); };
const anniversaryDelta = (mmdd) => {
  if (!mmdd) return null;
  const y = today.getFullYear();
  const deltas = [y - 1, y, y + 1].map((yy) => Math.round((dayOfYear(mmdd, yy) - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000));
  return deltas.reduce((a, b) => (Math.abs(b) < Math.abs(a) ? b : a));
};
const rows = pool.items.filter((i) => isActive(i) && !i.usedEpisode && !blocked.includes(i)).map((i) => {
  const ver = i.scores?.[5] ?? 3;
  const ev = evidenceSignals(i);
  const evidenceScore = Math.min(ev.numeric, 6) * 3 + (ev.econ >= 1 ? 6 : 0) + (ev.decisive ? 4 : 0);
  const text = `${i.title} ${i.hook ?? ""} ${i.pitch ?? ""} ${i.resolvedMessage ?? ""}`;
  const kr = KR_RE.test(text);
  const life = LIFE_RE.test(text);
  const contactScore = (kr ? 6 : 0) + (life ? 4 : 0);
  const baseFit = Array.isArray(i.baseFit) && i.baseFit.length === 5 ? i.baseFit : null;
  const baseFitScore = baseFit ? baseFit.reduce((a, b) => a + b, 0) * 3 : 0;
  const legacy = Array.isArray(i.storyFit) && i.storyFit.length === 7 ? i.storyFit.reduce((a, b) => a + b, 0) * 0.5 : 0;
  const fun = Math.round((evidenceScore + contactScore + baseFitScore + legacy + ver) * 10) / 10;
  const gates = [];
  if (!ev.has) gates.push([8, "증거 파일 없음 — 대본 전에 2출처 조사"]);
  // 2026-10-12 Owner: 숫자 4개 하한은 내가 만든 값이었다 → 개수 감점 폐지(쓰는 숫자만 2출처 확인). 숫자 많음은 위 증거 점수에서 가점만.
  if (ev.has && ev.econ < 1) gates.push([5, "경제 숫자 근거 없음(출처 2곳)"]);
  const weak = gates.map(([, m]) => m);
  const gatePenalty = gates.reduce((a, [p]) => a + p, 0);
  const recent = recentByKeyword.get(i.newsKeyword) ?? [];
  const newsBonus = Math.min(8, recent.length);
  const ann = anniversaryDelta(i.anniversary);
  const annBonus = ann !== null && Math.abs(ann) <= 7 ? 5 : 0;
  const penalty = i.risk * 3 + (i.saturated ? 3 : 0);
  const total = Math.round((fun + newsBonus + annBonus - penalty - gatePenalty) * 10) / 10;
  const flags = [];
  for (const m of weak) flags.push(`✗ ${m}`);
  flags.push(ev.has ? `증거: 숫자 ${ev.numeric}·경제 ${ev.econ}${ev.decisive ? "·결정적 장면 O" : ""}` : "증거 없음");
  if (!kr && !life) flags.push("? 한국·생활 접점 신호 없음 — 상식 테스트 먼저(걸린 것이 있는가)");
  if (RESULT_RE.test(i.hook ?? "")) flags.push("⚠ 훅 초안이 결말을 말함 — 사건 장면으로 다시(원칙 4)");
  if (!baseFit) flags.push("baseFit 미평가");
  if (newsBonus) flags.push(`📰 오늘 뉴스 연결 ${recent.length}건`);
  if (annBonus) flags.push(`📅 기념일 ${ann === 0 ? "오늘" : ann > 0 ? `${ann}일 뒤` : `${-ann}일 전`}(${i.anniversary}, ${today.getFullYear() - i.year}주년 근처)`);
  if (i.risk >= 2) flags.push(`⚠ 위험 ${i.risk}(사망·소송·진행 중 재판 등 표현 주의)`);
  if (i.saturated) flags.push(`⚠ 포화: ${i.saturated}`);
  if (i.placement === "later") flags.push("⏳ 초반 편은 피하고 후반 배치(포화·모방 우려)");
  if (i.verdict === "conditional") flags.push(`△ 조건부: ${i.verdictNote ?? "단서 있음"}`);
  else if (i.verdictNote) flags.push(`ℹ ${i.verdictNote}`);
  if (i.status !== "verified") flags.push("미검증");
  return { ...i, fun, newsBonus, annBonus, penalty, total, flags, recentNews: recent.slice(0, 3), signals: { ...ev, kr, life } };
}).sort((a, b) => b.total - a.total || b.fun - a.fun);

const concluded = news.items
  .filter((it) => CONCLUDED_KEYWORDS.includes(it.keyword) && it.publishedAt && hoursAgo(it.publishedAt) <= 24 * 14 && !isExcluded(it.title))
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
const seen = new Set();
const concludedUnique = concluded.filter((it) => (seen.has(it.link) ? false : (seen.add(it.link), true)));

// ── 보고서 ──
const ytSearch = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q + " 쇼츠")}`;
const lines = [];
lines.push(`# 스토리형 소재 스캔 ${ymd}${OFFLINE ? " (오프라인 — 실시간 검색 없음)" : ""}`);
lines.push("");
const verdictCount = pool.items.reduce((m, i) => ((m[i.verdict] = (m[i.verdict] || 0) + 1), m), {});
lines.push(`풀 ${pool.items.length}개 = 사용 ${verdictCount.used ?? 0} · 쓸 수 있음 ${verdictCount.usable ?? 0} · 조건부 ${verdictCount.conditional ?? 0} · 보류 ${verdictCount.hold ?? 0} · 못 씀 ${verdictCount.unusable ?? 0} (후보 ${rows.length}개, 제외 기준에 걸린 후보 ${blocked.length}개) · 실시간 뉴스 ${news.items.length}건 · 검색 실패 ${news.failed.length}건`);
lines.push("점수(v4 기본 베이스) = 증거(2출처 숫자 사실 수×3, 최대 18 + 경제 숫자 +6 + 결정적 장면 +4) + 한국·생활 접점 신호(우리 나라·기업 +6, 내 돈·일자리·쓰는 물건 +4) + baseFit(있으면 5칸 합×3) + 옛 10박자 storyFit×0.5(참고) + 검증 가능(최대 5) + 뉴스 연결(최대 +8) + 기념일(+5) − 위험×3 − 포화 3 − 증거 부족(증거 없음 −8 · 경제 숫자 없음 −5)");
lines.push("작성 기준 = **기본 베이스 구조**(`_ai/templates/story-script-base-structure.md`, 기준 대본 `_ai/story-base-scripts/` 5편, Owner 9원칙). 코인·주식투자·투자 후회담·유튜버형은 후보에 올리지 않는다(Owner 2026-10-07).");
lines.push("★ 러너 점수는 후보를 뽑는 용도일 뿐이다. 상위 후보는 아래 **셀렉 점검표**(상식 테스트·퍼즐과 답·날짜 3개 이하·경제 번역 지점)를 Claude가 채워 Owner에게 보고하고, 통과한 소재만 설계 줄로 간다. 고르면 원문 2곳 이상(숫자마다 같은 값)으로 사실 확인.");
lines.push("");
lines.push("## 1. 전체 후보(점수 순)");
lines.push("");
lines.push("| 순위 | 점수 | 기준점수 | 실시간 | 목소리 | 소재 | 훅 초안 | 표시 |");
lines.push("|---|---|---|---|---|---|---|---|");
rows.forEach((r, idx) => {
  lines.push(`| ${idx + 1} | ${r.total} | ${r.fun} | ${r.newsBonus + r.annBonus ? `+${r.newsBonus + r.annBonus}` : ""} | ${r.character === "owl" ? "부엉" : "황소"} | ${r.title} (${r.year}) | ${r.hook} | ${r.flags.join(" · ")} |`);
});
lines.push("");
lines.push("## 셀렉 점검표 템플릿(상위 10개, Claude가 채워 보고 — 비어 있으면 후보로 쓰지 않는다)");
lines.push("");
for (const r of rows.slice(0, 10)) {
  lines.push(`### ${r.title} (${r.year})`);
  lines.push("- 상식 테스트: 처음 듣는 한국 사람이 \"그게 나랑 무슨 상관?\" 대신 \"왜?!\"라고 묻는가 — 걸린 것(내 돈·일자리·쓰는 물건·우리 나라/기업) = ______ / 손실·위기·무시 = ______");
  lines.push("- 퍼즐 한 줄 = ______ / 그 답(서로 다른 사이트 2곳) = ______");
  lines.push("- 결정적 장면 = ______ / 대본에 쓸 숫자(숫자마다 서로 다른 사이트 2곳 같은 값, 개수 하한 없음) = ______");
  lines.push("- 날짜(연도) 3개 이하로 쓸 수 있는가 = ______ / 경제 번역 지점 2~4곳 = ______");
  lines.push("- 결말이 처음 드러날 장면(끝에 가깝게) = ______ / 훅 후보 2~3개 = ______");
  lines.push("");
}
lines.push("");
lines.push("## 2. 오늘 뉴스와 이어지는 후보(근거 기사)");
lines.push("");
const linked = rows.filter((r) => r.recentNews.length);
if (!linked.length) lines.push(OFFLINE ? "(오프라인 실행)" : "(없음)");
for (const r of linked) {
  lines.push(`- **${r.title}** — 키워드 "${r.newsKeyword}" 최근 72시간 ${recentByKeyword.get(r.newsKeyword).length}건`);
  for (const n of r.recentNews) lines.push(`  - ${n.title} (${n.publisherName ?? "출처 미상"}, ${n.publishedAt}) ${n.link}`);
}
lines.push("");
lines.push("## 3. 최근 결말이 난 사건(최근 14일, Claude가 읽고 좋은 것을 풀에 추가)");
lines.push("");
if (!concludedUnique.length) lines.push(OFFLINE ? "(오프라인 실행)" : "(없음)");
for (const it of concludedUnique.slice(0, 60)) lines.push(`- [${it.keyword}] ${it.title} (${it.publisherName ?? "출처 미상"}, ${it.publishedAt}) ${it.link}`);
lines.push("");
lines.push("## 4. 상위 15개 수요·포화 확인용 유튜브 검색");
lines.push("");
for (const r of rows.slice(0, 15)) lines.push(`- ${r.title}: ${ytSearch(r.title.split(" — ")[0])}`);
if (news.failed.length) {
  lines.push("");
  lines.push("## 검색 실패");
  for (const f of news.failed) lines.push(`- ${f.keyword}: ${f.reason}`);
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "story-topic-report.md"), lines.join("\n") + "\n");
fs.writeFileSync(path.join(outDir, "story-topic-report.json"), JSON.stringify({ generatedAt: today.toISOString(), offline: OFFLINE, rows, concluded: concludedUnique, failed: news.failed }, null, 2) + "\n");
console.log(`=== 스토리형 소재 스캔 ${ymd} ===`);
console.log(`풀 ${pool.items.length}개(미사용 ${rows.length}) · 실시간 뉴스 ${news.items.length}건 · 뉴스 연결 후보 ${linked.length}개 · 최근 결말 사건 ${concludedUnique.length}건 · 검색 실패 ${news.failed.length}건`);
console.log("상위 10:");
rows.slice(0, 10).forEach((r, i) => console.log(`  ${i + 1}. [${r.total}] ${r.title} ${r.flags.filter((f) => f !== "미검증").join(" · ")}`));
console.log(`보고서: ${outDir}/story-topic-report.md`);
