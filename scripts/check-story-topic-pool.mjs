#!/usr/bin/env node
/**
 * 스토리형 소재 풀 분류·중복 검사 (lib/source-facts/story-topic-pool.json). 비밀값·네트워크 없음.
 * Owner 2026-10-08: "쓸 수 있는 것과 못 쓰는 것을 구분해 저장해 두면 다음 수집 때 중복이 안 된다."
 *
 * 사용:
 *   node scripts/check-story-topic-pool.mjs                       검사 + 분류 요약
 *   node scripts/check-story-topic-pool.mjs --export <경로>        id | 분류 | 사유 | 제목 목록(수집 에이전트에 넘겨 중복을 막는 용도)
 *   node scripts/check-story-topic-pool.mjs --find <단어>          제목·id에 단어가 들어간 항목의 분류 조회(새 소재를 제안하기 전 확인)
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const POOL = path.join(ROOT, "lib", "source-facts", "story-topic-pool.json");
const pool = JSON.parse(fs.readFileSync(POOL, "utf8"));
const VERDICTS = ["used", "usable", "conditional", "hold", "unusable"];
const REASONS = Object.keys(pool.verdictGuide?.reasons ?? {});
// 못 씀=안 쓰기로 한 것(민감·정치·사실 오류·Owner 폐기·채널 불일치·투자담). 근거·장면·앵글 부족은 보류(hold)다(Owner 2026-10-09).
// 2026-10-10 Owner "보류를 확인하라고 진행하는건데 아직도 보류가 237개나 있어? 이거 해결해" → 추가 조사를 끝내고도 결정 장면(no-scene)·2출처 근거(no-evidence)가
// 없거나 이미 쓴 소재의 변형(duplicate)·설명 없이 이해 불가(complex)인 소재는 못 씀으로 확정(선택지 "못 씀으로 확정"). 새 자료가 생기면 증거 파일을 보고 되살릴 수 있다.
const UNUSABLE_REASONS = ["legal", "political", "investment", "fact-error", "owner-rejected", "off-channel", "no-scene", "no-evidence", "duplicate", "complex"];
const HOLD_REASONS = ["weak-scene", "unverifiable", "duplicate", "complex", "saturated"];
const LABEL = { used: "사용", usable: "쓸 수 있음", conditional: "조건부", hold: "보류", unusable: "못 씀" };

const args = process.argv.slice(2);
const argOf = (flag) => { const k = args.indexOf(flag); return k >= 0 ? args[k + 1] : undefined; };

if (args.includes("--find")) {
  const q = argOf("--find");
  if (!q) { console.error("--find 뒤에 단어를 주세요."); process.exit(2); }
  const hits = pool.items.filter((i) => `${i.id} ${i.title}`.includes(q));
  if (!hits.length) console.log(`'${q}' — 풀에 없음(새 후보).`);
  for (const i of hits) console.log(`${LABEL[i.verdict] ?? "미분류"}${i.verdictReason ? `(${i.verdictReason})` : ""} | ${i.id} | ${i.title} | ${i.verdictNote ?? ""}`);
  process.exit(0);
}

let failed = 0;
const fail = (msg) => { failed += 1; console.log(`  FAIL  ${msg}`); };

const ids = new Map();
const normTitle = (t) => t.replace(/\s+/g, "").replace(/[—\-–:·'"“”‘’()]/g, "").slice(0, 14);
const titles = new Map();
for (const i of pool.items) {
  if (ids.has(i.id)) fail(`id 중복: ${i.id}`);
  ids.set(i.id, i);
  const key = normTitle(i.title);
  if (titles.has(key) && titles.get(key) !== i.id) fail(`제목 앞부분이 같음(같은 소재일 수 있음): ${titles.get(key)} ↔ ${i.id}`);
  titles.set(key, i.id);
  if (!VERDICTS.includes(i.verdict)) fail(`${i.id}: verdict 없음/잘못됨(${i.verdict})`);
  if (i.verdict === "unusable" && !UNUSABLE_REASONS.includes(i.verdictReason)) fail(`${i.id}: 못 씀 사유는 ${UNUSABLE_REASONS.join("·")}만 허용(${i.verdictReason}) — 근거·장면·앵글 부족은 hold(보류)로`);
  if (i.verdict === "hold" && !HOLD_REASONS.includes(i.verdictReason)) fail(`${i.id}: hold인데 사유 코드가 ${HOLD_REASONS.join("·")} 중 하나가 아님(${i.verdictReason})`);
  if ((i.verdict === "unusable" || i.verdict === "hold") && !i.verdictNote) fail(`${i.id}: ${i.verdict}인데 verdictNote(사유 한 줄)가 없음`);
  if (i.verdict === "used" && !i.usedEpisode) fail(`${i.id}: used인데 usedEpisode가 없음`);
  if (i.verdict !== "used" && i.usedEpisode && !/^(discarded|reserved)-/.test(String(i.usedEpisode))) fail(`${i.id}: used가 아닌데 usedEpisode가 있음(${i.usedEpisode})`);
  if ((i.verdict === "usable" || i.verdict === "conditional") && (!Array.isArray(i.storyFit) || i.storyFit.length !== 7)) fail(`${i.id}: 후보인데 storyFit 7칸이 없음`);
  if (i.verdict === "conditional" && !i.verdictNote) fail(`${i.id}: conditional인데 단서(verdictNote)가 없음`);
  if (i.placement && i.placement !== "later") fail(`${i.id}: placement 값은 later만 허용(${i.placement})`);
}

const count = {};
for (const i of pool.items) count[i.verdict] = (count[i.verdict] || 0) + 1;
const reasonCount = {};
for (const i of pool.items) if (i.verdict === "unusable") reasonCount[i.verdictReason] = (reasonCount[i.verdictReason] || 0) + 1;

if (argOf("--export")) {
  const out = argOf("--export");
  const lines = pool.items.map((i) => `${i.id} | ${LABEL[i.verdict]}${i.verdictReason ? `:${i.verdictReason}` : ""}${i.usedEpisode && i.verdict === "used" ? `:${i.usedEpisode}` : ""} | ${i.title}`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, lines.join("\n") + "\n");
  console.log(`내보냄: ${out} (${lines.length}줄)`);
}

console.log(`풀 ${pool.items.length}개 = ${VERDICTS.map((v) => `${LABEL[v]} ${count[v] ?? 0}`).join(" · ")}`);
console.log(`못 쓰는 이유: ${Object.entries(reasonCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
console.log(failed === 0 ? "PASS — 분류·중복 검사 통과" : `\n${failed}건 실패`);
process.exit(failed === 0 ? 0 : 1);
