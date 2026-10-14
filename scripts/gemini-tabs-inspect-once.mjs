#!/usr/bin/env node
/**
 * Gemini 크롬(AI-Gemini-1, CDP 9223) 탭 상태 보기·완성 영상 수거·창 닫기 (2026-10-14, Owner "탭 4개 중 2개 오류 — 4개 맞춰 생성, 다 쓰면 크롬 닫아").
 *  node scripts/gemini-tabs-inspect-once.mjs                 → 탭마다 주소·마지막 응답 상태(완성/생성 중/거부/한도)만 출력(아무것도 누르지 않음)
 *  node scripts/gemini-tabs-inspect-once.mjs --collect <탭번호> --out <파일.mp4>  → 그 탭의 완성 영상을 내려받아 저장
 *  node scripts/gemini-tabs-inspect-once.mjs --close-browser → Gemini 전용 크롬 창을 닫음(다른 크롬은 건드리지 않음)
 */
import fs from "node:fs";
import { chromium } from "playwright";

const A = process.argv.slice(2);
const arg = (n) => { const i = A.indexOf(n); return i >= 0 ? A[i + 1] : null; };
const PORT = 9223;
let browser;
try { browser = await chromium.connectOverCDP(`http://localhost:${PORT}`); }
catch { console.log("Gemini 크롬이 꺼져 있음(포트 9223 응답 없음)"); process.exit(0); }
const ctx = browser.contexts()[0];

if (A.includes("--close-browser")) {
  const s = await browser.newBrowserCDPSession();
  await s.send("Browser.close").catch(() => {});
  console.log("Gemini 전용 크롬 닫음");
  process.exit(0);
}

const pages = ctx.pages().filter((p) => /gemini\.google\.com/.test(p.url()));
const status = async (p) => {
  const text = await p.locator("main").first().innerText().catch(() => "");
  const tail = text.slice(-600).replace(/\s+/g, " ");
  const dl = await p.locator('button[aria-label*="다운로드"], button[aria-label*="Download"], a[download]').count();
  const vid = await p.locator("main video").count();
  const busy = await p.locator('button[aria-label*="중지"], button[aria-label*="Stop"]').count();
  let kind = "알 수 없음";
  if (/can't generate|생성할 수 없|Try describing another/i.test(tail)) kind = "거부";
  else if (/limit|한도|한계|try again later|나중에 다시/i.test(tail)) kind = "한도/오류";
  else if (dl || vid) kind = "완성(영상 있음)";
  else if (busy) kind = "생성 중";
  else if (/something went wrong|문제가 발생|오류/i.test(tail)) kind = "오류";
  return { kind, dl, vid, busy, tail: tail.slice(-220) };
};

if (A.includes("--collect")) {
  const idx = Number(arg("--collect")), out = arg("--out");
  const p = pages[idx];
  if (!p || !out) { console.log("ABORT: --collect <탭번호> --out <파일> 필요"); process.exit(2); }
  await p.bringToFront();
  const vids = p.locator("main video");
  if (!(await vids.count())) { console.log("영상 없음"); process.exit(1); }
  await vids.last().hover().catch(() => {});
  const btn = p.locator('button[aria-label*="다운로드"], button[aria-label*="Download"]').last();
  const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 60000 }), btn.click()]);
  await dl.saveAs(out);
  console.log(`저장 ${out} (${fs.statSync(out).size} bytes)`);
  process.exit(0);
}

console.log(`Gemini 탭 ${pages.length}개 (전체 탭 ${ctx.pages().length})`);
for (const [i, p] of pages.entries()) {
  const s = await status(p);
  const q = await p.locator("main user-query, main [data-test-id*='user-query'], main .query-text").first().innerText().catch(() => "");
  const box = await p.locator('rich-textarea, [contenteditable="true"]').first().innerText().catch(() => "");
  const card = (q || box).match(/(?:reads?|written|text)[^"“]*["“]([^"”]{2,40})["”]/i)?.[1] ?? "";
  console.log(`[${i}] ${s.kind} | 다운로드 버튼 ${s.dl} · 영상 ${s.vid} · 생성중 ${s.busy} | ${p.url()}\n     보낸 프롬프트 ${q ? "있음" : "없음"} · 입력창 ${box.trim() ? `남아 있음(${box.trim().length}자)` : "비어 있음"} · 카드 문구 "${card}"\n     프롬프트 앞: ${(q || box).replace(/\s+/g, " ").slice(0, 160)}\n     …${s.tail}`);
}
process.exit(0);
