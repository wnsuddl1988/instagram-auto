#!/usr/bin/env node
/**
 * Flow 클립 큐 러너 (2026-10-12) — 스토리형 영상프롬프트.md → 계정 여러 개가 병렬로 8초 클립(Veo 3.1 Lite, 10크레딧)을 생성·다운로드.
 * 로그인은 하지 않는다(Owner가 로그인해 둔 AI-Flow-* 프로필, CDP 포트 9230+번호). 자격증명 입력 없음.
 *
 * 사용: node scripts/flow-queue-runner.mjs --eps 13,14,15 --accounts 6,7,8 [--max 6] [--dry] [--tier8] [--retries 2]
 *  - 대상: Downloads\스토리 N편\스토리N편_영상프롬프트.md 의 장면 중 "8초 티어"이고 Downloads\스토리 N편\<장면번호>.mp4 가 아직 없는 것(편 번호·장면 번호 순).
 *  - 10초 티어(Gemini 몫)는 건드리지 않는다(--omni10 을 주면 Omni 1.1 Flash 15크레딧으로 Flow에서도 생성하지만 기본 꺼짐).
 *  - 계정 크레딧이 비용보다 적으면 그 계정은 그날 퇴장. 실패는 같은 프롬프트로 --retries 회 재시도 후 "검토 필요"로 기록.
 *  - 원장: C:/tmp/money-shorts-os/flow-queue/ledger.jsonl , 계정별 프로젝트 주소: accounts.json
 * 안전: 승인 버튼은 "승인"만(항상 승인 금지), 대화상자 크레딧 숫자가 예상 비용과 다르면 승인하지 않고 그 계정 중단.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync, spawn } from "node:child_process";

const A = process.argv.slice(2);
const arg = (n, d) => { const i = A.indexOf(n); return i >= 0 ? A[i + 1] : d; };
const EPS = (arg("--eps", "") || "").split(",").map(Number).filter(Boolean);
const ACCTS = (arg("--accounts", "") || "").split(",").filter(Boolean); // "MAIN" 또는 1~9
const MAX = Number(arg("--max", "0")) || Infinity;
const RETRIES = Number(arg("--retries", "2"));
const TABS = Math.max(1, Number(arg("--tabs", "1"))); // 계정(=Chrome 창) 하나당 병렬 탭 수. 중단하려면 C:/tmp/money-shorts-os/flow-queue/STOP 파일을 만든다(진행 중 클립은 끝까지 수거).
const DRY = A.includes("--dry");
const MODEL_HINT = arg("--model-hint", ""); // 예: --model-hint "Use the Veo 3.1 Lite model." (Pro 계정에서 에이전트가 Omni를 고르는 문제 대응)
const CAPS = Object.fromEntries((arg("--caps", "MAIN=50") || "").split(",").filter(Boolean).map((s) => { const [k, v] = s.split("="); return [k, Number(v)]; })); // 계정별 사용 크레딧 상한(기본 MAIN=50)
const SKIP = new Set((arg("--skip", "") || "").split(",").filter(Boolean)); // 예: --skip 14-3,15-2 (다른 러너가 처리 중인 장면)
const OMNI10 = A.includes("--omni10");
const DL = "C:/Users/PC/Downloads";
const STATE = "C:/tmp/money-shorts-os/flow-queue";
fs.mkdirSync(STATE, { recursive: true });
const LEDGER = path.join(STATE, "ledger.jsonl");
const ACC_FILE = path.join(STATE, "accounts.json");
const accState = fs.existsSync(ACC_FILE) ? JSON.parse(fs.readFileSync(ACC_FILE, "utf8")) : {};
const saveAcc = () => fs.writeFileSync(ACC_FILE, JSON.stringify(accState, null, 1));
const portOf = (a) => (a === "MAIN" ? 9230 : 9230 + Number(a));
const ts = () => new Date().toISOString().slice(11, 19);
const log = (w, m) => console.log(`[${ts()}][${w}] ${m}`);
const ledger = (o) => fs.appendFileSync(LEDGER, JSON.stringify({ at: new Date().toISOString(), ...o }) + "\n");

// ── 작업 목록 만들기 ──────────────────────────────────────────────
function parseEpisode(n) {
  // Owner가 Downloads를 매일 지운다(10/13) → 프롬프트 문서는 저장소 _ai/, 클립 저장은 C:/tmp 백업 폴더가 기본 위치
  const dir = `C:/tmp/money-shorts-os/story-clips-backup/ep${n}`;
  const dlDir = `${DL}/스토리 ${n}편`; // Owner가 직접 넣은 클립이 있으면 건너뛰기 위해서만 확인
  const md = `C:/Users/PC/jjy/instagram-auto/_ai/story-ep${n}-video-generation-prompts.md`;
  if (!fs.existsSync(md)) return [];
  const t = fs.readFileSync(md, "utf8");
  const rows = {};
  for (const m of t.matchAll(/^\|\s*(s(\d+)) [^|]*\|\s*`([^`]+)`\s*\|[^|]*\|[^|]*\|\s*\*{0,2}(8|10)초\*{0,2}\s*\|/gm)) rows[m[2]] = { image: m[3], tier: Number(m[4]) };
  const jobs = [];
  for (const m of t.matchAll(/^## s(\d+) [^\n]*\n+```[^\n]*\n([\s\S]*?)\n```/gm)) {
    const row = rows[m[1]];
    if (!row) continue;
    jobs.push({ ep: n, scene: Number(m[1]), tier: row.tier, image: `C:/tmp/story-ep${n}-images/${row.image}`, prompt: m[2].trim(), out: `${dir}/${m[1]}.mp4`, alt: `${dlDir}/${m[1]}.mp4` });
  }
  return jobs;
}
const queue = [];
for (const n of EPS) for (const j of parseEpisode(n).sort((a, b) => a.scene - b.scene)) {
  if (fs.existsSync(j.out) || fs.existsSync(j.alt) || SKIP.has(`${j.ep}-${j.scene}`)) continue;
  if (j.tier === 10 && !OMNI10) continue;
  if (!fs.existsSync(j.image)) { console.log(`이미지 없음 — 건너뜀: ep${j.ep} s${j.scene} ${j.image}`); continue; }
  queue.push(j);
}
const todo = queue.slice(0, MAX === Infinity ? undefined : MAX);
console.log(`대상 ${todo.length}개: ` + todo.map((j) => `${j.ep}-${j.scene}`).join(" "));
if (DRY || !ACCTS.length) process.exit(0);

// ── 계정 작업자 ──────────────────────────────────────────────────
const { chromium } = await import("playwright");
const results = { ok: 0, fail: [] };
const failedJobs = [];

async function readCredits(page) {
  await page.keyboard.press("Escape").catch(() => {}); await page.keyboard.press("Escape").catch(() => {});
  await page.locator('[aria-label="계정 세부정보"]').first().click({ timeout: 8000 });
  await page.waitForTimeout(1200);
  const t = await page.evaluate(() => document.body.innerText);
  await page.keyboard.press("Escape"); await page.keyboard.press("Escape"); await page.waitForTimeout(500);
  const m = t.match(/크레딧\s*([\d,]+)\s*개/);
  return m ? Number(m[1].replace(/,/g, "")) : null;
}

async function setup(page, a, W) {
  let proj = accState[a]?.project;
  await page.goto(proj ?? "https://flow.google.com/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(5000);
  await page.locator('button:has-text("나중에")').first().click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(500);
  if (!/\/project\//.test(page.url())) {
    // 프로젝트가 없으면 새 프로젝트 생성(홈의 "새 프로젝트" 버튼)
    await page.locator('button:has-text("새 프로젝트")').first().click({ timeout: 10000 });
    await page.waitForURL(/\/project\//, { timeout: 30000 }); await page.waitForTimeout(4000);
    proj = page.url().split("?")[0]; accState[a] = { ...(accState[a] ?? {}), project: proj }; saveAcc();
    log(W, `새 프로젝트 ${proj}`);
  } else if (!proj) { proj = page.url().split("?")[0]; accState[a] = { ...(accState[a] ?? {}), project: proj }; saveAcc(); }
  // 설정: 동영상 9:16 · x1 · 모델(Lite 또는 Omni)
  await page.locator('[aria-label="설정"]').first().click({ timeout: 8000 }); await page.waitForTimeout(1200);
  const nine = page.locator('button[role="radio"]:has-text("9:16")'), x1 = page.locator('button[role="radio"]:has-text("x1")');
  if ((await nine.count()) < 2 || (await x1.count()) < 2) throw new Error("설정 화면 구조가 예상과 다름");
  await nine.nth(1).click(); await x1.nth(1).click();
  await page.locator('[aria-label="동영상 생성 기본 모델"]').first().click({ timeout: 8000 }); await page.waitForTimeout(600);
  await page.locator('button[role="menuitem"]:has-text("Veo 3.1 - Lite")').first().click({ timeout: 8000 }); await page.waitForTimeout(600);
  const m = (await page.locator('[aria-label="동영상 생성 기본 모델"]').first().innerText()).replace(/\s+/g, " ");
  if (!m.includes("Veo 3.1 - Lite")) throw new Error(`모델 선택 실패: ${m}`);
  await page.locator('button:has-text("저장")').last().click({ timeout: 8000 }); await page.waitForTimeout(1500);
  return proj;
}

async function runJob(page, proj, job, W) {
  const COST = 10;
  // 클립마다 홈에서 새 프로젝트로 시작(Owner 수동 방식 — 이전 세션 찌꺼기 없음)
  await page.goto("https://flow.google.com/", { waitUntil: "domcontentloaded", timeout: 30000 }); await page.waitForTimeout(4500);
  await page.locator('button:has-text("나중에")').first().click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(500);
  await page.locator('button:has-text("새 프로젝트")').first().click({ timeout: 10000 });
  await page.waitForURL(/\/project\//, { timeout: 30000 }); await page.waitForTimeout(4000);
  // 새 세션(이전 대화·클립과 섞이지 않게)
  await page.locator('[aria-label="새로운 세션 시작"]').first().click({ timeout: 6000 }).catch(() => {}); await page.waitForTimeout(2000);
  const EDIT = '[aria-label="편집기에서 동영상 열기"]';
  const editBase = await page.locator(EDIT).count(); // 이전 세션 요소가 DOM에 남아 있어 개수 증가로 새 클립을 식별
  // 소재 업로드 → 프롬프트에 추가
  await page.locator('[aria-label="프롬프트 상자에 소재 추가"]').first().click({ timeout: 8000 }); await page.waitForTimeout(1000);
  await page.locator('mat-list-item:has-text("업로드")').first().click({ timeout: 8000 }).catch(() => {}); await page.waitForTimeout(800);
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser", { timeout: 10000 }),
    page.locator('button:has-text("미디어 업로드")').first().click({ timeout: 8000 }),
  ]);
  await chooser.setFiles(job.image); await page.waitForTimeout(7000);
  await page.locator('button:has-text("프롬프트에 추가")').first().click({ timeout: 10000 }); await page.waitForTimeout(1500);
  const box = page.locator('[contenteditable="true"]:visible').first();
  await box.click({ timeout: 8000 }); const AUDIO_SAFE = " AUDIO: only soft, quiet ambient room tone; no dialogue, no narration, no singing, no music, no sudden loud sounds.";
  await page.keyboard.insertText((MODEL_HINT ? `${MODEL_HINT} ` : "") + job.prompt + (job.audioSafe ? AUDIO_SAFE : "")); await page.waitForTimeout(1200);
  // 첨부 확인: 입력창 근처에 이미지 파일명이 보여야 한다
  const base = path.basename(job.image);
  const attached = await page.evaluate((b) => { let e = document.querySelector('[contenteditable="true"]'); for (let i = 0; i < 6 && e; i++) e = e.parentElement; return e ? (e.innerText + " " + [...e.querySelectorAll("[aria-label],img[alt]")].map((x) => x.getAttribute("aria-label") || x.getAttribute("alt")).join(" ")).includes(b) : false; }, base);
  log(W, `첨부 확인 ${base}: ${attached}`);
  await page.locator('[aria-label="생성 시작"]').first().click({ timeout: 8000 });
  // 확인 대화상자 대기(최대 6분)
  let cost = null;
  const approve = page.locator('.option-row:not(.read-only):visible:has(.option-label:text-is("승인"))');
  for (let i = 0; i < 120; i += 1) {
    await page.waitForTimeout(3000);
    if ((await approve.count()) > 0) {
      const t = await page.evaluate(() => document.body.innerText).catch(() => "");
      const all = [...t.matchAll(/(\d+)\s*크레딧을 사용하여 1개 동영상 생성을 시작/g)];
      if (all.length) { cost = Number(all[all.length - 1][1]); break; }
    }
    const t2 = await page.evaluate(() => document.body.innerText).catch(() => "");
    if (/에이전트에 현재 수요가 많습니다|오류가 발생|다시 시도해/.test(t2.slice(-1200)) && i > 3 && (await approve.count()) === 0) { log(W, "에이전트 오류 문구 감지"); break; }
  }
  if (cost === null) throw new Error("확인 대화상자 없음");
  if (cost !== COST) { const e = new Error(`ABORT 비용 불일치 ${cost} != ${COST}`); e.fatal = true; throw e; }
  await approve.last().click({ timeout: 8000 }); await page.waitForTimeout(2500);
  log(W, `승인(${cost}) — 생성 대기`);
  // 세션에 "편집기에서 동영상 열기"가 뜨면(생성 중에도 뜸) 편집기를 열고 다운로드 버튼이 활성화될 때까지 대기(최대 10분)
  await page.waitForFunction(([s, n]) => document.querySelectorAll(s).length > n, [EDIT, editBase], { timeout: 300000 });
  await page.locator(EDIT).last().click({ timeout: 8000 }); await page.waitForTimeout(3000);
  // 활성화 대기 중 "실패"(예: 오디오를 생성할 수 없습니다, 환불 예정)가 뜨면 바로 실패 처리 → 재시도
  let ready = false;
  for (let i = 0; i < 100 && !ready; i += 1) {
    if ((await page.locator('[aria-label="미디어 다운로드"]:not([disabled])').count()) > 0) { ready = true; break; }
    const t = await page.evaluate(() => document.body.innerText).catch(() => "");
    if (/실패/.test(t) && /(생성할 수 없|refunded|환불)/.test(t)) throw new Error("Flow 생성 실패(환불 예정): " + ((t.match(/[^\n]*생성할 수 없[^\n]*/) || [""])[0]).slice(0, 80));
    await page.waitForTimeout(6000);
  }
  if (!ready) throw new Error("다운로드 버튼 활성화 시간 초과");
  await page.locator('[aria-label="미디어 다운로드"]').first().click({ timeout: 10000 }); await page.waitForTimeout(1200);
  const tmp = path.join(STATE, `tmp_${job.ep}_${job.scene}.mp4`);
  const [dl] = await Promise.all([
    page.waitForEvent("download", { timeout: 120000 }),
    page.locator('button[role="menuitem"]:has-text("720p")').first().click({ timeout: 8000 }),
  ]);
  await dl.saveAs(tmp);
  const pr = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", tmp], { encoding: "utf8" });
  const dur = Number(pr.stdout.trim());
  if (!(dur > 7.5 && dur < 8.6)) throw new Error(`길이 이상 ${dur}`);
  fs.mkdirSync(path.dirname(job.out), { recursive: true });
  fs.renameSync(tmp, job.out);
  return { dur, cost };
}

async function worker(a) {
  const W = `계정${a}`;
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${portOf(a)}`).catch(() => null);
  if (!browser) { log(W, "CDP 연결 실패(프로필 미실행) — 퇴장"); return; }
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find((p) => /flow\.google\.com/.test(p.url())) ?? ctx.pages()[0];
  for (const p of ctx.pages()) if (p !== page) await p.close().catch(() => {});
  try {
    const proj = await setup(page, a, W);
    // 한 Chrome 창 안에서 탭 TABS개가 병렬로 돈다(Owner: 창 여러 개 말고 한 창에 탭). 크레딧은 계정 단위라 예약 방식으로 공유.
    const rawCredits = await readCredits(page);
    const cap = CAPS[a]; // 예: --caps MAIN=50 — 본계정은 하루 무료 50만(Owner 10/13)
    const acct = { left: rawCredits === null ? null : Math.min(rawCredits, cap ?? Infinity) };
    log(W, `크레딧 ${acct.left}, 탭 ${TABS}개`);
    const lane = async (li) => {
      const pg = li === 0 ? page : await ctx.newPage();
      const L = `${W}-탭${li + 1}`;
      await new Promise((r) => setTimeout(r, li * 15000));
      while (todo.length && !fs.existsSync(path.join(STATE, "STOP"))) {
        if (acct.left !== null && acct.left < 10) { log(L, "크레딧 부족 — 퇴장"); break; }
        const job = todo.shift();
        if (!job) break;
        if (acct.left !== null) acct.left -= 10; // 예약
        let ok = false, lastErr = "";
        for (let tryN = 0; tryN <= RETRIES && !ok; tryN += 1) {
          try {
            log(L, `ep${job.ep} s${job.scene} 시도 ${tryN + 1}`);
            const r = await runJob(pg, proj, job, L);
            ledger({ acct: a, ep: job.ep, scene: job.scene, status: "ok", tries: tryN + 1, cost: r.cost, dur: r.dur });
            results.ok += 1; ok = true; log(L, `✔ ep${job.ep} s${job.scene} ${r.dur}s → ${job.out}`);
          } catch (e) {
            lastErr = e.message; log(L, `✘ ${e.message}`);
            if (/오디오/.test(e.message) && !job.audioSafe) { job.audioSafe = true; log(L, "오디오 실패 → 다음 시도는 오디오 안전 문구를 붙여 재시도"); }
            await pg.screenshot({ path: path.join(STATE, `err_${a}_${job.ep}_${job.scene}_${tryN}.png`) }).catch(() => {});
            if (e.fatal) { todo.unshift(job); ledger({ acct: a, ep: job.ep, scene: job.scene, status: "fatal", err: e.message }); return; }
          }
        }
        if (!ok) { results.fail.push(`${job.ep}-${job.scene}`); failedJobs.push(job); ledger({ acct: a, ep: job.ep, scene: job.scene, status: "needs_review", err: lastErr }); acct.left = await readCredits(pg).catch(() => acct.left); }
      }
      if (li > 0) await pg.close().catch(() => {});
    };
    await Promise.all(Array.from({ length: TABS }, (_, li) => lane(li)));
  } catch (e) { log(W, `작업자 중단: ${e.message}`); }
  finally { await browser.close().catch(() => {}); }
}

if (A.includes("--sequential")) {
  // 창 하나씩: 계정 프로필 Chrome을 띄우고 → 탭 병렬로 처리 → 끝나면 그 창을 닫고 다음 계정(Owner 10/13 "크롬창 여러 개 말고 새 탭으로")
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



