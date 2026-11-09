#!/usr/bin/env node
/**
 * 스토리형 소재 검증(대본 전 게이트) — 2026-10-07 밤, 올림픽 2편 폐기 후 Owner "소재부터 정확히 찾고 대본으로 만들 만한 내용이 있는 걸 하면 될 거 아니야".
 *
 *   node scripts/check-story-topic-vetting.mjs --file C:/tmp/story-topic-vetting/<id>.json            (정적 검사: 숫자 4·결정적 장면·경제 숫자·장면 재료 10·수요·소재 읽기)
 *   node scripts/check-story-topic-vetting.mjs --file <...> --verify --write                          (출처 URL을 실제로 열어 원문 인용이 있는지 자동 대조 → verification 기록)
 *
 * 규칙·필드는 `_ai/story-format-structure-v1.md` §5 0단계. 통과 못 하면 설계·대본을 쓰지 않는다(설계 검사기가 topicVettingPath를 요구).
 * --verify는 공개 웹 페이지 읽기만 한다(외부 쓰기·로그인 없음). 접속 실패(403·시간 초과)는 unreachable로 두고, 사람이 직접 읽어 manualVerified:true를 적은 출처만 인정한다.
 */
import fs from "node:fs";
import { checkStoryTopicVetting, vettingFactsHash } from "./_story-script-standards.mjs";

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = arg("--file");
if (!file || !fs.existsSync(file)) { console.error("사용: --file <검증파일.json> [--verify] [--write]"); process.exit(2); }
const v = JSON.parse(fs.readFileSync(file, "utf8"));

const norm = (t) => String(t).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/[\s"'“”‘’「」『』·,.\-–—…()\[\]]/g, "").toLowerCase();

async function fetchText(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const res = await fetch(url, { signal: ctl.signal, redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (story-vetting)", "accept-language": "ko,en;q=0.8" } });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    return { text: await res.text() };
  } catch (e) { return { error: e.name === "AbortError" ? "시간 초과" : String(e.message ?? e) }; }
  finally { clearTimeout(timer); }
}

if (args.includes("--verify")) {
  const stat = { ok: 0, notFound: 0, unreachable: 0, manual: 0, detail: [] };
  const cache = new Map();
  for (const f of (v.facts ?? []).filter((x) => x.status !== "excluded")) {
    for (const s of f.sources ?? []) {
      if (!s?.url || !s?.quote) continue;
      if (!cache.has(s.url)) cache.set(s.url, await fetchText(s.url));
      const r = cache.get(s.url);
      let res;
      if (r.error) {
        if (s.manualVerified === true) { stat.manual += 1; res = "직접확인"; } else { stat.unreachable += 1; res = `접속불가(${r.error})`; }
        if (s.manualVerified === true) stat.unreachable += 0;
      } else if (norm(r.text).includes(norm(s.quote))) { stat.ok += 1; res = "일치"; }
      else if (s.manualVerified === true) { stat.manual += 1; res = "직접확인(자동 대조 불일치)"; }
      else { stat.notFound += 1; res = "원문에 인용문 없음"; }
      stat.detail.push(`${f.id} | ${s.name} | ${res} | ${s.url}`);
    }
  }
  // 직접 확인한 출처는 unreachable에서 빼서 센다: 위에서 manual로만 올렸으므로 unreachable은 미확인 수
  console.log("=== URL 원문 대조 ===");
  stat.detail.forEach((l) => console.log("  " + l));
  console.log(`일치 ${stat.ok} · 직접확인 ${stat.manual} · 접속불가(미확인) ${stat.unreachable} · 원문에 없음 ${stat.notFound}`);
  if (args.includes("--write")) {
    v.verification = { checkedAt: new Date().toISOString(), ok: stat.ok, manual: stat.manual, unreachable: stat.unreachable, notFound: stat.notFound, factsHash: vettingFactsHash(v) };
    fs.writeFileSync(file, JSON.stringify(v, null, 2));
    console.log("verification 기록 완료");
  }
}

const r = checkStoryTopicVetting(JSON.parse(fs.readFileSync(file, "utf8")));
console.log(`\n=== 소재 검증: ${v.title ?? v.id} ===`);
r.ok.forEach((m) => console.log("  ✅ " + m));
r.warn.forEach((m) => console.log("  ⚠  " + m));
r.fix.forEach((m) => console.log("  ❌ " + m));
console.log(`반드시 수정 ${r.fix.length} · 확인 권장 ${r.warn.length} · 통과 ${r.ok.length}`);
process.exit(r.fix.length ? 1 : 0);
