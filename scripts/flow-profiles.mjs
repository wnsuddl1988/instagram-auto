#!/usr/bin/env node
/**
 * Flow 영상 생성용 Chrome 프로필 관리 (2026-10-12, Owner 승인: 본계정 1 + 무료계정 9, 프로필 이름 AI-Flow-*).
 *
 * 로그인은 Owner가 직접 한다(자격증명 입력 금지 — 비밀번호·2차 인증·캡차는 사람만). 이 도구는
 *  ① 프로필별로 Chrome을 띄워(--user-data-dir, 원격 디버깅 포트) 로그인 화면을 열고,
 *  ② 로그인 뒤 읽기 전용으로 상태를 확인(계정 표시·크레딧 문구)하고,
 *  ③ 정상 종료(쿠키 저장)시키는 일만 한다. 영상 생성·제출은 하지 않는다.
 *
 * 사용:
 *   node scripts/flow-profiles.mjs list
 *   node scripts/flow-profiles.mjs open <MAIN|1..9>     // Chrome을 띄우고 Flow 화면을 연다
 *   node scripts/flow-profiles.mjs check <MAIN|1..9>    // 읽기 전용 상태 확인(로그인 여부·계정·크레딧)
 *   node scripts/flow-profiles.mjs close <MAIN|1..9>    // Chrome 정상 종료(세션 저장)
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";

const CHROME_EXE = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const USER_DATA_ROOT = "C:/Users/PC/AppData/Local/Google/Chrome/User Data";
// 2026-10-12 확인: 예전 labs.google/fx/ko/tools/flow 는 flow.google.com/about(소개 페이지)로 간다. 앱은 flow.google.com.
const FLOW_URL = "https://flow.google.com/";
const STATE_DIR = "C:/tmp/money-shorts-os/flow-accounts";
const STATE_FILE = path.join(STATE_DIR, "registry.json");

export const FLOW_PROFILES = Object.freeze([
  { name: "MAIN", role: "main", dirName: "AI-Flow-MAIN", cdpPort: 9230, note: "본계정(월 1,000크레딧) — 자동 소진 대상에서 따로 취급" },
  ...Array.from({ length: 9 }, (_, i) => ({ name: String(i + 1), role: "free", dirName: `AI-Flow-${i + 1}`, cdpPort: 9231 + i, note: "무료계정(매일 50크레딧)" })),
]);

const find = (name) => FLOW_PROFILES.find((p) => p.name === String(name).toUpperCase());
const userDataDir = (p) => `${USER_DATA_ROOT}/${p.dirName}`;

async function cdpOpen(port) {
  try {
    const r = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(1500) });
    return r.ok;
  } catch { return false; }
}
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch { return { profiles: {} }; }
}
function saveState(s) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));
}
const mask = (e) => e.replace(/^(.{3}).*(@.*)$/, "$1***$2");

async function cmdList() {
  const st = loadState();
  for (const p of FLOW_PROFILES) {
    const open = await cdpOpen(p.cdpPort);
    const rec = st.profiles[p.name] ?? {};
    const exists = fs.existsSync(userDataDir(p));
    console.log(`${p.name.padEnd(5)} ${p.role.padEnd(5)} ${p.dirName.padEnd(14)} 포트 ${p.cdpPort}  폴더 ${exists ? "있음" : "없음"}  Chrome ${open ? "열림" : "닫힘"}  로그인 ${rec.signedIn === true ? "확인됨" : rec.signedIn === false ? "안 됨" : "미확인"}${rec.accountHint ? "  계정 " + rec.accountHint : ""}${rec.credits !== undefined ? "  크레딧 " + rec.credits : ""}`);
  }
}

async function cmdOpen(name) {
  const p = find(name);
  if (!p) throw new Error(`알 수 없는 프로필: ${name}`);
  if (await cdpOpen(p.cdpPort)) { console.log(`이미 열려 있음(포트 ${p.cdpPort})`); return; }
  fs.mkdirSync(userDataDir(p), { recursive: true });
  const child = spawn(CHROME_EXE, [
    `--remote-debugging-port=${p.cdpPort}`,
    `--user-data-dir=${userDataDir(p)}`,
    "--no-first-run", "--no-default-browser-check", "--new-window",
    FLOW_URL,
  ], { detached: true, stdio: "ignore" });
  child.unref();
  for (let i = 0; i < 40; i += 1) {
    await new Promise((r) => setTimeout(r, 500));
    if (await cdpOpen(p.cdpPort)) { console.log(`프로필 ${p.dirName} Chrome 열림(포트 ${p.cdpPort}). Flow 화면에서 이 계정으로 로그인해 주세요.`); return; }
  }
  throw new Error(`20초 안에 CDP가 열리지 않음(포트 ${p.cdpPort})`);
}

async function cmdCheck(name) {
  const p = find(name);
  if (!p) throw new Error(`알 수 없는 프로필: ${name}`);
  if (!(await cdpOpen(p.cdpPort))) { console.log("Chrome이 닫혀 있음 — 먼저 open"); return; }
  const { chromium } = await import("playwright");
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${p.cdpPort}`);
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  // 확장 프로그램 안내 등 불필요한 탭은 정리하고 Flow 탭 하나만 쓴다.
  let page = pages.find((x) => /flow\.google\.com/.test(x.url())) ?? pages[0];
  for (const x of pages) if (x !== page) await x.close().catch(() => {});
  if (!/flow\.google\.com\/(?!about)/.test(page.url()) || /\/about/.test(page.url())) {
    await page.goto(FLOW_URL, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(5000);
  }
  const url = page.url();
  // 크레딧은 오른쪽 위 '계정 세부정보' 메뉴 안에 "Google Flow 크레딧 N개"로 나온다(읽기만 하고 Esc로 닫는다).
  const menu = page.locator('[aria-label="계정 세부정보"]').first();
  await page.keyboard.press("Escape").catch(() => {}); // 이전에 열린 메뉴·대화상자가 클릭을 가로채지 않게
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(400);
  let text = "";
  if (await menu.count()) {
    await menu.click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1500);
    text = await page.evaluate(() => document.body?.innerText ?? "").catch(() => "");
    await page.keyboard.press("Escape").catch(() => {});
  } else {
    text = await page.evaluate(() => document.body?.innerText ?? "").catch(() => "");
  }
  const email = (text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i) ?? [])[0] ?? "";
  const creditMatch = text.match(/크레딧\s*([\d,]+)\s*개/) ?? text.match(/([\d,]+)\s*(?:credits?)/i);
  // "크레딧은 매일 오전 11:30에 갱신됩니다." 같은 갱신 시각 문구(계정마다 다름, 본계정은 월 단위일 수 있음)
  const refreshText = (text.match(/크레딧[^\n]{0,40}갱신[^\n]{0,30}/) ?? text.match(/[^\n]{0,30}갱신[^\n]{0,40}/) ?? [])[0] ?? "";
  const pro = /PRO/.test(await page.evaluate(() => document.body?.innerText ?? "").catch(() => "")) ? "PRO" : "";
  const needLogin = /accounts\.google\.com/.test(url) || (!email && !menu);
  const st = loadState();
  st.profiles[p.name] = { ...(st.profiles[p.name] ?? {}), role: p.role, dirName: p.dirName, signedIn: !needLogin && !!email, accountHint: email ? mask(email) : "", emailId: email ? createHash("sha1").update(email.toLowerCase()).digest("hex").slice(0, 8) : "", credits: creditMatch ? Number(creditMatch[1].replace(/,/g, "")) : undefined, refreshText: refreshText.trim(), tier: pro, checkedAt: new Date().toISOString() };
  saveState(st);
  console.log(`url: ${url}`);
  console.log(`로그인: ${st.profiles[p.name].signedIn ? "확인됨" : "아직 안 됨"}  계정: ${email ? mask(email) : "(표시 못 찾음)"}(${st.profiles[p.name].emailId})  등급: ${pro || "-"}  크레딧: ${creditMatch ? creditMatch[1] + "개" : "(못 찾음)"}  갱신: ${refreshText.trim() || "(문구 없음)"}`);
  await browser.close().catch(() => {}); // CDP 연결만 끊는다(Chrome은 유지)
}

async function cmdClose(name) {
  const p = find(name);
  if (!p) throw new Error(`알 수 없는 프로필: ${name}`);
  if (!(await cdpOpen(p.cdpPort))) { console.log("이미 닫혀 있음"); return; }
  const { chromium } = await import("playwright");
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${p.cdpPort}`);
  const cdp = await browser.newBrowserCDPSession();
  await cdp.send("Browser.close").catch(() => {});
  console.log(`프로필 ${p.dirName} Chrome 정상 종료 요청`);
}

const [cmd, arg] = process.argv.slice(2);
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` || process.argv[1]?.endsWith("flow-profiles.mjs")) {
  try {
    if (cmd === "list") await cmdList();
    else if (cmd === "open") await cmdOpen(arg);
    else if (cmd === "check") await cmdCheck(arg);
    else if (cmd === "close") await cmdClose(arg);
    else console.log("사용: list | open <MAIN|1..9> | check <MAIN|1..9> | close <MAIN|1..9>");
  } catch (e) { console.error("ERROR:", e.message); process.exit(1); }
}
