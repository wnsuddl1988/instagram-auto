#!/usr/bin/env node
/**
 * 이미 생성 중인 Gemini 탭의 영상을 수거 (2026-10-12) — 러너가 끊겼을 때 복구용.
 * 사용: node scripts/gemini-collect-tab.mjs --match "<사용자 프롬프트에 들어 있는 문구>" --out "<저장 mp4>" [--port 9223] [--timeout-min 12]
 */
import fs from "node:fs";
const A = process.argv.slice(2);
const arg = (n, d) => { const i = A.indexOf(n); return i >= 0 ? A[i + 1] : d; };
const MATCH = arg("--match"), OUT = arg("--out"), PORT = arg("--port", "9223"), TMO = Number(arg("--timeout-min", "12"));
if (!MATCH || !OUT) { console.error("--match, --out 필요"); process.exit(2); }
const { chromium } = await import("playwright");
const b = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
const deadline = Date.now() + TMO * 60000;
const DL = 'button[aria-label*="다운로드"], button[aria-label*="Download"], a[download]';
try {
  while (Date.now() < deadline) {
    for (const p of b.contexts()[0].pages()) {
      const txt = await p.evaluate(() => document.body.innerText).catch(() => "");
      if (!txt.includes(MATCH)) continue;
      if (/I can't generate that video|생성할 수 없/.test(txt)) { console.log("거부/한도 문구 탭 건너뜀:", p.url().slice(0, 60)); continue; } // 같은 프롬프트의 이전 거부 탭이 남아 있을 수 있어 계속 탐색
      const btn = p.locator(DL);
      if ((await btn.count()) >= 1) {
        const [d] = await Promise.all([p.waitForEvent("download", { timeout: 60000 }), btn.last().click()]);
        await d.saveAs(OUT + ".part").catch(async () => fs.copyFileSync(await d.path(), OUT + ".part"));
        fs.renameSync(OUT + ".part", OUT);
        console.log("저장 완료", OUT); process.exit(0);
      }
    }
    await new Promise((r) => setTimeout(r, 8000));
  }
  console.log("시간 초과"); process.exit(1);
} finally { await b.close().catch(() => {}); }
