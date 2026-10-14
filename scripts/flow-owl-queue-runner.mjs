#!/usr/bin/env node
/**
 * Flow 클립 큐 러너 — 부엉박사 설명형 편 (2026-10-13, flow-queue-runner.mjs 스토리형 러너를 부엉 프롬프트 문서용으로 확장)
 *  - 대상: _ai/owl-ep{N}-video-generation-prompts.md 의 장면(8초 = Veo 3.1 Lite 10크레딧 / 10초 = Omni 1.1 Flash 15크레딧) 중
 *    C:/tmp/owl-ep{N}-videos/<저장 파일명> 이 아직 없는 것. 이미지는 C:/tmp/owl-ep{N}-images/owl_ep{N}_s{장면}.png.
 *  - 로그인은 하지 않는다(Owner가 로그인해 둔 AI-Flow-* 프로필, CDP 포트 9230+번호). 자격증명 입력 없음.
 *  - 설정 화면은 오른쪽 위 "설정" 버튼 중 마지막 것(에이전트 설정, 2026-10-13 UI 변경 반영). 모델은 장면 티어에 맞게 그때그때 바꾼다.
 *  - 승인 대화상자의 크레딧 숫자가 예상 비용(8초 10 / 10초 15)과 다르면 승인하지 않고 그 계정 중단.
 * 사용: node scripts/flow-owl-queue-runner.mjs --eps 29,30 --accounts 9,8,7 --sequential [--tabs 2] [--only 29-1,29-4] [--dry] [--retries 2] [--caps MAIN=50]
 * 중단: C:/tmp/money-shorts-os/flow-queue/STOP 파일을 만든다(진행 중 클립은 끝까지 수거).
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync, spawn } from "node:child_process";

const A = process.argv.slice(2);
const arg = (n, d) => { const i = A.indexOf(n); return i >= 0 ? A[i + 1] : d; };
const EPS = (arg("--eps", "") || "").split(",").map(Number).filter(Boolean);
const ACCTS = (arg("--accounts", "") || "").split(",").filter(Boolean);
const ONLY = new Set((arg("--only", "") || "").split(",").filter(Boolean));
const RETRIES = Number(arg("--retries", "2"));
const TABS = Math.max(1, Number(arg("--tabs", "1")));
const DRY = A.includes("--dry");
const CAPS = Object.fromEntries((arg("--caps", "MAIN=50") || "").split(",").filter(Boolean).map((s) => { const [k, v] = s.split("="); return [k, Number(v)]; }));
const ROOT = "C:/Users/PC/jjy/instagram-auto";
const STATE = "C:/tmp/money-shorts-os/flow-queue";
fs.mkdirSync(STATE, { recursive: true });
const LEDGER = path.join(STATE, "ledger.jsonl");
const ACC_FILE = path.join(STATE, "accounts.json");
const accState = fs.existsSync(ACC_FILE) ? JSON.parse(fs.readFileSync(ACC_FILE, "utf8")) : {};
const saveAcc = () => fs.writeFileSync(ACC_FILE, JSON.stringify(accState, null, 1));
const portOf = (a) => (a === "MAIN" ? 9230 : 9230 + Number(a));
const ts = () => new Date().toISOString().slice(11, 19);
const log = (w, m) => console.log(`[${ts()}][${w}] ${m}`);
const ledger = (o) => fs.appendFileSync(LEDGER, JSON.stringify({ at: new Date().toISOString(), kind: "owl", ...o }) + "\n");
const MODEL = { 8: "Veo 3.1 - Lite", 10: "Omni 1.1 Flash" };
const COST = { 8: 10, 10: 15 };

function parseEpisode(n) {
  const md = `${ROOT}/_ai/owl-ep${n}-video-generation-prompts.md`;
  if (!fs.existsSync(md)) return [];
  const t = fs.readFileSync(md, "utf8");
  const rows = {};
  for (const m of t.matchAll(/^\|\s*s(\d+) [^|]*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|[^|]*\|[^|]*\|\s*\*{0,2}(8|10)초\*{0,2}\s*\|/gm)) rows[m[1]] = { image: m[2], video: m[3], tier: Number(m[4]) };
  const jobs = [];
  for (const m of t.matchAll(/^## s(\d+) [^\n]*\n+```[^\n]*\n([\s\S]*?)\n```/gm)) {
    const row = rows[m[1]];
    if (!row) continue;
    jobs.push({ ep: n, scene: Number(m[1]), tier: row.tier, image: `C:/tmp/owl-ep${n}-images/${row.image}`, prompt: m[2].trim(), out: `C:/tmp/owl-ep${n}-videos/${row.video}` });
  }
  return jobs;
}
// Gemini 감독이 맡은 장면("ep-scene" 줄)은 건너뛴다(같은 장면을 두 도구가 만들지 않게)
const SKIP_FILE = path.join(STATE, "owl-skip.txt");
const SKIP = new Set(fs.existsSync(SKIP_FILE) ? fs.readFileSync(SKIP_FILE, "utf8").split(/\s+/).filter(Boolean) : []);
const queue = [];
for (const n of EPS) for (const j of parseEpisode(n).sort((a, b) => a.scene - b.scene)) {
  if (fs.existsSync(j.out)) continue;
  if (SKIP.has(`${j.ep}-${j.scene}`) && !ONLY.size) continue; // --only로 명시한 장면은 건너뛰기 목록과 상관없이 처리(다른 작업자가 맡은 장면을 감독이 피하게 하려고 목록에 올려 둔 경우)
  if (ONLY.size && !ONLY.has(`${j.ep}-${j.scene}`)) continue;
  if (!fs.existsSync(j.image)) { console.log(`이미지 없음 — 건너뜀: ep${j.ep} s${j.scene} ${j.image}`); continue; }
  queue.push(j);
}
const todo = queue;
console.log(`대상 ${todo.length}개: ` + todo.map((j) => `${j.ep}-${j.scene}(${j.tier}초)`).join(" "));
if (DRY || !ACCTS.length) process.exit(0);

const { chromium } = await import("playwright");
const results = { ok: 0, fail: [] };

async function readCredits(page) {
  await page.keyboard.press("Escape").catch(() => {}); await page.keyboard.press("Escape").catch(() => {});
  await page.locator('[aria-label="계정 세부정보"]').first().click({ timeout: 8000 });
  await page.waitForTimeout(1200);
  const t = await page.evaluate(() => document.body.innerText);
  await page.keyboard.press("Escape"); await page.keyboard.press("Escape"); await page.waitForTimeout(500);
  const m = t.match(/크레딧\s*([\d,]+)\s*개/);
  return m ? Number(m[1].replace(/,/g, "")) : null;
}

/** 에이전트 설정: 동영상 9:16·x1·모델을 계정에 저장한다(모델이 이미 같으면 건드리지 않는다). */
async function ensureModel(page, tier) {
  const want = MODEL[tier];
  await page.locator('[aria-label="설정"]').last().click({ timeout: 8000 }); await page.waitForTimeout(1200);
  const nine = page.locator('button[role="radio"]:has-text("9:16")'), x1 = page.locator('button[role="radio"]:has-text("x1")');
  if ((await nine.count()) < 2 || (await x1.count()) < 2) throw new Error("설정 화면 구조가 예상과 다름");
  await nine.nth(1).click(); await x1.nth(1).click();
  const sel = page.locator('[aria-label="동영상 생성 기본 모델"]').first();
  const cur = (await sel.innerText()).replace(/\s+/g, " ");
  if (!cur.includes(want)) {
    await sel.click({ timeout: 8000 }); await page.waitForTimeout(600);
    await page.locator(`button[role="menuitem"]:has-text("${want}")`).first().click({ timeout: 8000 }); await page.waitForTimeout(600);
    const m = (await sel.innerText()).replace(/\s+/g, " ");
    if (!m.includes(want)) throw new Error(`모델 선택 실패: ${m}`);
  }
  await page.locator('button:has-text("저장")').last().click({ timeout: 8000 }); await page.waitForTimeout(1500);
}

async function runJob(page, job, W) {
  const cost = COST[job.tier];
  await page.goto("https://flow.google.com/", { waitUntil: "domcontentloaded", timeout: 30000 }); await page.waitForTimeout(4500);
  await page.locator('button:has-text("나중에")').first().click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(500);
  await page.locator('button:has-text("새 프로젝트")').first().click({ timeout: 10000 });
  await page.waitForURL(/\/project\//, { timeout: 30000 }); await page.waitForTimeout(4000);
  await ensureModel(page, job.tier);
  await page.locator('[aria-label="새로운 세션 시작"]').first().click({ timeout: 6000 }).catch(() => {}); await page.waitForTimeout(2000);
  const EDIT = '[aria-label="편집기에서 동영상 열기"]';
  const editBase = await page.locator(EDIT).count();
  await page.locator('[aria-label="프롬프트 상자에 소재 추가"]').first().click({ timeout: 8000 }); await page.waitForTimeout(1000);
  await page.locator('mat-list-item:has-text("업로드")').first().click({ timeout: 8000 }).catch(() => {}); await page.waitForTimeout(800);
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser", { timeout: 10000 }),
    page.locator('button:has-text("미디어 업로드")').first().click({ timeout: 8000 }),
  ]);
  await chooser.setFiles(job.image); await page.waitForTimeout(7000);
  await page.locator('button:has-text("프롬프트에 추가")').first().click({ timeout: 10000 }); await page.waitForTimeout(1500);
  const box = page.locator('[contenteditable="true"]:visible').first();
  await box.click({ timeout: 8000 });
  const MODEL_HINT = `Use the ${MODEL[job.tier]} model.`;
  await page.keyboard.insertText(`${MODEL_HINT} ${job.prompt}`); await page.waitForTimeout(1200);
  const base = path.basename(job.image);
  const attached = await page.evaluate((b) => { let e = document.querySelector('[contenteditable="true"]'); for (let i = 0; i < 6 && e; i++) e = e.parentElement; return e ? (e.innerText + " " + [...e.querySelectorAll("[aria-label],img[alt]")].map((x) => x.getAttribute("aria-label") || x.getAttribute("alt")).join(" ")).includes(b) : false; }, base);
  log(W, `첨부 확인 ${base}: ${attached}`);
  await page.locator('[aria-label="생성 시작"]').first().click({ timeout: 8000 });
  let seen = null;
  const approve = page.locator('.option-row:not(.read-only):visible:has(.option-label:text-is("승인"))');
  for (let i = 0; i < 120; i += 1) {
    await page.waitForTimeout(3000);
    if ((await approve.count()) > 0) {
      const t = await page.evaluate(() => document.body.innerText).catch(() => "");
      const all = [...t.matchAll(/(\d+)\s*크레딧을 사용하여 1개 동영상 생성을 시작/g)];
      if (all.length) { seen = Number(all[all.length - 1][1]); break; }
    }
    const t2 = await page.evaluate(() => document.body.innerText).catch(() => "");
    if (/에이전트에 현재 수요가 많습니다|오류가 발생|다시 시도해/.test(t2.slice(-1200)) && i > 3 && (await approve.count()) === 0) { log(W, "에이전트 오류 문구 감지"); break; }
  }
  if (seen === null) throw new Error("확인 대화상자 없음");
  if (seen !== cost) { const e = new Error(`ABORT 비용 불일치 ${seen} != ${cost} (모델 ${MODEL[job.tier]})`); e.fatal = true; throw e; }
  await approve.last().click({ timeout: 8000 }); await page.waitForTimeout(2500);
  log(W, `승인(${seen}) — 생성 대기`);
  await page.waitForFunction(([s, n]) => document.querySelectorAll(s).length > n, [EDIT, editBase], { timeout: 420000 });
  await page.locator(EDIT).last().click({ timeout: 8000 }); await page.waitForTimeout(3000);
  let ready = false;
  for (let i = 0; i < 110 && !ready; i += 1) {
    if ((await page.locator('[aria-label="미디어 다운로드"]:not([disabled])').count()) > 0) { ready = true; break; }
    const t = await page.evaluate(() => document.body.innerText).catch(() => "");
    if (/실패/.test(t) && /(생성할 수 없|refunded|환불)/.test(t)) throw new Error("Flow 생성 실패(환불 예정): " + ((t.match(/[^\n]*생성할 수 없[^\n]*/) || [""])[0]).slice(0, 80));
    await page.waitForTimeout(6000);
  }
  if (!ready) throw new Error("다운로드 버튼 활성화 시간 초과");
  await page.locator('[aria-label="미디어 다운로드"]').first().click({ timeout: 10000 }); await page.waitForTimeout(1200);
  const tmp = path.join(STATE, `tmp_owl_${job.ep}_${job.scene}.mp4`);
  const [dl] = await Promise.all([
    page.waitForEvent("download", { timeout: 120000 }),
    page.locator('button[role="menuitem"]:has-text("720p")').first().click({ timeout: 8000 }),
  ]);
  await dl.saveAs(tmp);
  const pr = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", tmp], { encoding: "utf8" });
  const dur = Number(pr.stdout.trim());
  const [lo, hi] = job.tier === 8 ? [7.5, 8.6] : [9.4, 10.7];
  if (!(dur > lo && dur < hi)) throw new Error(`길이 이상 ${dur} (요청 ${job.tier}초)`);
  fs.mkdirSync(path.dirname(job.out), { recursive: true });
  fs.renameSync(tmp, job.out);
  return { dur, cost: seen };
}

async function worker(a) {
  const W = `계정${a}`;
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${portOf(a)}`).catch(() => null);
  if (!browser) { log(W, "CDP 연결 실패(프로필 미실행) — 퇴장"); return; }
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find((p) => /flow\.google\.com/.test(p.url())) ?? ctx.pages()[0];
  for (const p of ctx.pages()) if (p !== page) await p.close().catch(() => {});
  try {
    await page.goto("https://flow.google.com/", { waitUntil: "domcontentloaded", timeout: 30000 }); await page.waitForTimeout(4000);
    const rawCredits = await readCredits(page);
    const cap = CAPS[a];
    const acct = { left: rawCredits === null ? null : Math.min(rawCredits, cap ?? Infinity) };
    log(W, `크레딧 ${acct.left}, 탭 ${TABS}개`);
    const lane = async (li) => {
      const pg = li === 0 ? page : await ctx.newPage();
      const L = `${W}-탭${li + 1}`;
      await new Promise((r) => setTimeout(r, li * 15000));
      while (todo.length && !fs.existsSync(path.join(STATE, "STOP"))) {
        // 남은 크레딧에 들어가는 가장 앞선 장면을 고른다(10초 15·8초 10)
        const idx = todo.findIndex((j) => acct.left === null || acct.left >= COST[j.tier]);
        if (idx < 0) { log(L, "크레딧 부족 — 퇴장"); break; }
        const job = todo.splice(idx, 1)[0];
        if (acct.left !== null) acct.left -= COST[job.tier];
        let ok = false, lastErr = "";
        for (let tryN = 0; tryN <= RETRIES && !ok; tryN += 1) {
          try {
            log(L, `ep${job.ep} s${job.scene}(${job.tier}초) 시도 ${tryN + 1}`);
            const r = await runJob(pg, job, L);
            ledger({ acct: a, ep: job.ep, scene: job.scene, tier: job.tier, status: "ok", tries: tryN + 1, cost: r.cost, dur: r.dur });
            results.ok += 1; ok = true; log(L, `✔ ep${job.ep} s${job.scene} ${r.dur}s → ${job.out}`);
          } catch (e) {
            lastErr = e.message; log(L, `✘ ${e.message}`);
            await pg.screenshot({ path: path.join(STATE, `err_owl_${a}_${job.ep}_${job.scene}_${tryN}.png`) }).catch(() => {});
            if (e.fatal) { todo.unshift(job); ledger({ acct: a, ep: job.ep, scene: job.scene, status: "fatal", err: e.message }); return; }
          }
        }
        if (!ok) { results.fail.push(`${job.ep}-${job.scene}`); ledger({ acct: a, ep: job.ep, scene: job.scene, status: "needs_review", err: lastErr }); acct.left = await readCredits(pg).catch(() => acct.left); }
      }
      if (li > 0) await pg.close().catch(() => {});
    };
    await Promise.all(Array.from({ length: TABS }, (_, li) => lane(li)));
  } catch (e) { log(W, `작업자 중단: ${e.message}`); }
  finally { await browser.close().catch(() => {}); }
}

if (A.includes("--sequential")) {
  for (const a of ACCTS) {
    if (!todo.length) break;
    const port = portOf(a);
    const open = async () => { try { return (await fetch(`http://127.0.0.1:${port}/json/version`)).ok; } catch { return false; } };
    if (!(await open())) {
      const child = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", [`--remote-debugging-port=${port}`, `--user-data-dir=C:/Users/PC/AppData/Local/Google/Chrome/User Data/AI-Flow-${a}`, "--no-first-run", "--no-default-browser-check", "--new-window", "https://flow.google.com/"], { detached: true, stdio: "ignore" });
      child.unref();
      for (let i = 0; i < 40 && !(await open()); i += 1) await new Promise((r) => setTimeout(r, 500));
    }
    await new Promise((r) => setTimeout(r, 4000));
    await worker(a);
    try { const b = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { timeout: 3000 }); const s = await b.newBrowserCDPSession(); await s.send("Browser.close"); log(`계정${a}`, "창 닫음"); } catch { /* 이미 닫힘 */ }
  }
} else {
  await Promise.all(ACCTS.map((a, i) => new Promise((r) => setTimeout(r, i * 20000)).then(() => worker(a))));
}
console.log(`\n완료 ${results.ok}개 / 검토 필요 ${results.fail.length}개 ${results.fail.join(" ")} / 남은 대기 ${todo.length}개`);
