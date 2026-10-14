#!/usr/bin/env node
/**
 * Flow 화면 읽기 전용 점검 도구 (2026-10-12). 제출·생성·결제 동작은 하지 않는다.
 * 사용: node scripts/flow-probe.mjs <포트> <명령> [인자]
 *   tabs                         열린 탭 URL
 *   goto <url>                   탭 하나를 해당 주소로 이동(GET)
 *   text [글자수]                본문 텍스트 앞부분
 *   labels [개수]                aria-label 목록
 *   find <정규식>                본문에서 정규식 주변 문장
 *   click-label <aria-label>     aria-label이 정확히 일치하는 첫 요소 클릭(메뉴 열기 용도)
 *   shot <파일경로>              스크린샷
 *   close-others                 Flow 탭 하나만 남기고 나머지 탭 닫기
 */
const [portArg, cmd, arg] = process.argv.slice(2);
const { chromium } = await import("playwright");
const browser = await chromium.connectOverCDP(`http://127.0.0.1:${portArg}`);
const ctx = browser.contexts()[0];
const pages = ctx.pages();
const page = pages.find((p) => /flow\.google\.com|labs\.google|gemini\.google\.com|linktr\.ee|stibee\.com/.test(p.url())) ?? pages[0];
try {
  if (cmd === "tabs") for (const [i, p] of pages.entries()) console.log(i, p.url().slice(0, 120));
  else if (cmd === "goto") { await page.goto(arg, { waitUntil: "domcontentloaded", timeout: 30000 }); await page.waitForTimeout(4000); console.log("url", page.url()); }
  else if (cmd === "text") console.log((await page.evaluate(() => document.body.innerText)).slice(0, Number(arg ?? 1500)));
  else if (cmd === "labels") console.log(JSON.stringify(await page.evaluate((n) => [...document.querySelectorAll("[aria-label]")].map((e) => e.getAttribute("aria-label")).filter(Boolean).slice(0, n), Number(arg ?? 60))));
  else if (cmd === "find") {
    const t = await page.evaluate(() => document.body.innerText);
    const re = new RegExp(arg, "gi"); let m, n = 0;
    while ((m = re.exec(t)) && n < 6) { console.log("…" + t.slice(Math.max(0, m.index - 80), m.index + 160).replace(/\n+/g, " | ") + "…"); n += 1; }
    if (!n) console.log("(없음)");
  } else if (cmd === "click-label") { await page.locator(`[aria-label="${arg}"]`).first().click({ timeout: 8000 }); await page.waitForTimeout(1500); console.log("클릭함"); }
  else if (cmd === "click-text") { await page.getByText(arg, { exact: true }).first().click({ timeout: 8000 }); await page.waitForTimeout(2500); console.log("클릭함", arg); }
  else if (cmd === "buttons") {
    const rows = await page.evaluate(() => [...document.querySelectorAll("button,[role=button],[role=tab],[role=combobox],[role=menuitem],[role=option],input,textarea,[contenteditable=true]")]
      .filter((e) => e.offsetParent !== null).map((e) => `${e.tagName.toLowerCase()}${e.getAttribute("role") ? "[" + e.getAttribute("role") + "]" : ""} aria="${e.getAttribute("aria-label") ?? ""}" text="${(e.innerText ?? e.value ?? "").trim().replace(/\s+/g, " ").slice(0, 40)}"`));
    console.log(rows.slice(0, Number(arg ?? 60)).join("\n"));
  }
  else if (cmd === "key") { for (const k of String(arg).split(",")) { await page.keyboard.press(k); await page.waitForTimeout(500); } console.log("키", arg); }
  else if (cmd === "click-vis") { await page.locator(`button:visible, [role=button]:visible, a:visible`).filter({ hasText: arg }).first().click({ timeout: 8000 }); await page.waitForTimeout(2000); console.log("클릭함(보이는 것)", arg); }
  else if (cmd === "fill-vis") { const [label, val] = String(arg).split("|"); const loc = page.getByLabel(label, { exact: false }).locator("visible=true").first(); await loc.fill(val, { timeout: 8000 }); await loc.press("Enter").catch(() => {}); await page.waitForTimeout(1500); console.log("입력함", label); }
  else if (cmd === "inputs") console.log(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("input,textarea")].filter((e) => e.offsetParent !== null).map((e) => ({ type: e.type, aria: e.getAttribute("aria-label"), name: e.name, id: e.id, ph: e.placeholder, val: (e.value || "").slice(0, 40) })))));
  else if (cmd === "click-button") { await page.locator(`button:has-text("${arg}")`).first().click({ timeout: 8000 }); await page.waitForTimeout(2000); console.log("버튼 클릭", arg); }
  else if (cmd === "type") {
    const box = page.locator('[contenteditable="true"]:visible').first();
    const text = String(arg).startsWith("@") ? (await import("node:fs")).readFileSync(String(arg).slice(1), "utf8").trim() : arg;
    await box.click({ timeout: 8000 }); await page.keyboard.insertText(text); await page.waitForTimeout(1000); console.log("입력함", arg.length);
  }
  else if (cmd === "editables") console.log(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('[contenteditable="true"],textarea,[role=textbox]')].map((e) => ({ tag: e.tagName, vis: e.offsetParent !== null, aria: e.getAttribute("aria-label"), ph: e.getAttribute("placeholder") || e.getAttribute("data-placeholder"), text: (e.innerText || "").slice(0, 30) })))));
  else if (cmd === "where") console.log(JSON.stringify(await page.evaluate((t) => [...document.querySelectorAll("*")].filter((e) => e.children.length <= 3 && (e.innerText || "").trim().replace(/^[a-z_]+\s+/, "") === t).map((e) => ({ tag: e.tagName, role: e.getAttribute("role"), cls: (e.className || "").toString().slice(0, 60), vis: e.offsetParent !== null, parent: e.parentElement?.tagName + "." + (e.parentElement?.className || "").toString().slice(0, 40) })), arg)));
  else if (cmd === "click-where") { const loc = page.locator(`:text-is("${arg}")`).locator("visible=true").first(); await loc.click({ timeout: 8000 }); await page.waitForTimeout(2000); console.log("클릭함", arg); }
  else if (cmd === "click-option") { await page.locator(`.option-row:has(.option-label:text-is("${arg}"))`).last().click({ timeout: 8000 }); await page.waitForTimeout(2500); console.log("선택지 클릭", arg); }
  else if (cmd === "download") { // download "<메뉴 글자>" <저장경로> — 열린 다운로드 메뉴에서 항목 클릭 후 파일 저장
    const [label, dest] = String(arg).split("|");
    const [dl] = await Promise.all([
      page.waitForEvent("download", { timeout: 120000 }),
      page.locator(`button[role="menuitem"]:has-text("${label}")`).first().click({ timeout: 8000 }),
    ]);
    await dl.saveAs(dest); console.log("저장", dest, dl.suggestedFilename());
  }
  else if (cmd === "state") console.log(JSON.stringify(await page.evaluate(() => ({
    videos: [...document.querySelectorAll("video")].map((v) => ({ src: (v.currentSrc || v.src || "").slice(0, 100), dur: v.duration })),
    pct: [...document.querySelectorAll("*")].filter((e) => e.children.length === 0 && /^\d{1,3}%$/.test((e.innerText || "").trim())).map((e) => e.innerText.trim()),
    stopBtn: !!document.querySelector('[aria-label="중지"]'),
    tiles: document.querySelectorAll("flow-video-tile, [class*=video-tile], [class*=media-tile]").length,
  }))));
  else if (cmd === "reload") { await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(5000); console.log("새로고침", page.url()); }
  else if (cmd === "shot") { await page.screenshot({ path: arg }); console.log("저장", arg); }
  else if (cmd === "close-others") { for (const p of pages) if (p !== page) await p.close().catch(() => {}); console.log("남은 탭", ctx.pages().length); }
  else console.log("명령: tabs | goto | text | labels | find | click-label | shot | close-others");
} finally { await browser.close().catch(() => {}); }

