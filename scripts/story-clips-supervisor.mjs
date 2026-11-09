#!/usr/bin/env node
/**
 * 스토리형 17~25편 Flow 클립 감독(2026-10-14, Owner "부엉박사 56편까지 다 만들고 나면 다시 스토리형 25편까지 완성하자").
 *  - 순서 고정: --after-owl 로 준 부엉박사 편의 클립이 전부 생기고 그 러너가 끝난 뒤에야 시작한다(같은 계정·브라우저를 두 러너가 동시에 쓰지 않게).
 *  - flow-queue-runner.mjs(스토리 8초 티어=Veo 3.1 Lite 10크레딧)를 계정 갱신 시각에 맞춰 반복 실행한다. 10초 티어는 건드리지 않는다
 *    (Gemini 몫 — Owner가 쓰라고 할 때만, scripts/owl-gemini-once.mjs 형식). 본계정(MAIN)은 쓰지 않는다.
 *  - 시작할 때 장부(ledger.jsonl)로 계정별 사용량을 계산해 소진된 계정은 다음 갱신까지 열지 않는다(재부팅 뒤 이어 붙일 때도 안전).
 *  - 중단: C:/tmp/money-shorts-os/flow-queue/STOP 파일(부엉박사 감독과 공용).
 * 사용: node scripts/story-clips-supervisor.mjs --eps 17,18,19,20,21,22,23,24,25 --accounts 8,7,6,1,2,4,5,3,9 [--tabs 2] [--after-owl 29,30,31,32,33]
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const A = process.argv.slice(2);
const arg = (n, d) => { const i = A.indexOf(n); return i >= 0 ? A[i + 1] : d; };
const EPS = (arg("--eps", "") || "").split(",").map(Number).filter(Boolean);
const ACCTS = (arg("--accounts", "") || "").split(",").filter(Boolean);
const TABS = arg("--tabs", "2");
const AFTER_OWL = (arg("--after-owl", "") || "").split(",").map(Number).filter(Boolean);
const STATE = "C:/tmp/money-shorts-os/flow-queue";
const STOP = `${STATE}/STOP`;
const LOG = `${STATE}/story-supervisor.log`;
const LEDGER = `${STATE}/ledger.jsonl`;
const ROOT = "C:/Users/PC/jjy/instagram-auto";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (m) => { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + "\n"); };

// 무료 계정은 매일 정해진 시각(한국 시간)에 50크레딧으로 갱신된다. 쓰지 않은 크레딧은 이월되지 않으니(24시간 안에 쓰면 손실 없음) 갱신 뒤 바로 쓴다.
const REFRESH_KST = { 9: "07:48", 4: "08:46", 5: "09:28", 6: "11:22", 1: "11:30", 7: "13:10", 8: "13:19", 2: "23:57", 3: "00:07" };
const kstTimeMs = (hm, dayOffset = 0) => { // 오늘(KST) hm 시각의 절대 시각(ms)
  const [h, m] = hm.split(":").map(Number);
  const t = new Date(Date.now() + 9 * 3600e3);
  t.setUTCHours(h, m, 0, 0);
  return t.getTime() - 9 * 3600e3 + dayOffset * 24 * 3600e3;
};
const lastRefreshMs = (a) => { let t = kstTimeMs(REFRESH_KST[a]); if (t > Date.now()) t -= 24 * 3600e3; return t; };
const nextRefreshMs = (a) => (REFRESH_KST[a] ? lastRefreshMs(a) + 24 * 3600e3 + 3 * 60e3 : Date.now() + 3 * 3600e3);

const exhaustedUntil = {};
function initFromLedger() {
  if (!fs.existsSync(LEDGER)) return;
  const rows = fs.readFileSync(LEDGER, "utf8").trim().split("\n").map((x) => { try { return JSON.parse(x); } catch { return null; } }).filter(Boolean);
  for (const a of ACCTS) {
    if (!REFRESH_KST[a]) continue;
    const from = lastRefreshMs(a);
    const used = rows.filter((r) => String(r.acct) === a && r.status === "ok" && Date.parse(r.at) >= from).reduce((s, r) => s + (r.cost || 0), 0);
    if (used > 40) { exhaustedUntil[a] = nextRefreshMs(a); log(`계정${a}: 마지막 갱신 이후 ${used}/50 사용 → 다음 갱신(${new Date(exhaustedUntil[a] + 9 * 3600e3).toISOString().slice(5, 16).replace("T", " ")} KST)까지 쉼`); }
  }
}

function promptRows(prefix, n) {
  const md = `${ROOT}/_ai/${prefix}-ep${n}-video-generation-prompts.md`;
  if (!fs.existsSync(md)) return [];
  const t = fs.readFileSync(md, "utf8");
  const rows = [];
  // 표: | 장면 | `이미지` | `영상 파일명` | 사용 길이 | **8초** | … (flow-queue-runner.mjs와 같은 규칙)
  for (const m of t.matchAll(/^\|\s*s(\d+) [^|]*\|\s*`([^`]+)`\s*\|[^|]*\|[^|]*\|\s*\*{0,2}(8|10)초\*{0,2}\s*\|/gm)) rows.push({ scene: Number(m[1]), tier: Number(m[3]), image: m[2] });
  return rows;
}
const owlPending = () => { // 부엉박사 대상 편의 남은 클립 수(파일명은 프롬프트 표의 영상 파일명 칸)
  let n = 0;
  for (const ep of AFTER_OWL) {
    const md = `${ROOT}/_ai/owl-ep${ep}-video-generation-prompts.md`;
    if (!fs.existsSync(md)) continue;
    for (const m of fs.readFileSync(md, "utf8").matchAll(/^\|\s*s(\d+) [^|]*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/gm)) if (!fs.existsSync(`C:/tmp/owl-ep${ep}-videos/${m[3]}`)) n += 1;
  }
  return n;
};
const owlRunnerActive = () => {
  const r = spawnSync("powershell", ["-NoProfile", "-Command", "(Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -match 'flow-owl-queue-runner' } | Measure-Object).Count"], { encoding: "utf8" });
  return Number((r.stdout || "0").trim()) > 0;
};
function pendingJobs() {
  let n = 0, noImage = 0;
  for (const ep of EPS) {
    for (const r of promptRows("story", ep)) {
      if (r.tier !== 8) continue; // 10초는 Gemini 몫
      if (fs.existsSync(`C:/tmp/money-shorts-os/story-clips-backup/ep${ep}/${r.scene}.mp4`) || fs.existsSync(`C:/Users/PC/Downloads/스토리 ${ep}편/${r.scene}.mp4`)) continue;
      n += 1;
      if (!fs.existsSync(`C:/tmp/story-ep${ep}-images/${r.image}`)) noImage += 1;
    }
  }
  return { n, noImage, ready: n - noImage };
}

initFromLedger();
let announcedWait = false;
while (!fs.existsSync(STOP)) {
  if (AFTER_OWL.length) {
    const op = owlPending();
    if (op > 0 || owlRunnerActive()) { if (!announcedWait) { log(`부엉박사 클립 대기 중(남은 ${op}개) — 끝나면 스토리 클립을 시작합니다`); announcedWait = true; } await sleep(120000); continue; }
    if (announcedWait) { log("부엉박사 클립 완료 — 스토리 클립 시작"); announcedWait = false; }
  }
  const p = pendingJobs();
  if (p.n === 0) { log("모든 스토리 8초 클립 완료(10초 장면은 Gemini 몫)"); break; }
  const usable = ACCTS.filter((a) => (exhaustedUntil[a] ?? 0) < Date.now());
  if (p.ready === 0 || usable.length === 0) { log(`대기 — 남은 ${p.n}개(이미지 없음 ${p.noImage}), 사용 가능 계정 ${usable.length}`); await sleep(5 * 60 * 1000); continue; }
  log(`실행 — 준비된 ${p.ready}개 / 남은 ${p.n}개 / 계정 ${usable.join(",")}`);
  const r = spawnSync(process.execPath, ["scripts/flow-queue-runner.mjs", "--eps", EPS.join(","), "--accounts", usable.join(","), "--sequential", "--tabs", TABS], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 2 * 60 * 60 * 1000 });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  fs.appendFileSync(LOG, out + "\n");
  for (const m of out.matchAll(/\[계정(\w+)\] 크레딧 (\d+|null)/g)) if (m[2] !== "null" && Number(m[2]) < 10) exhaustedUntil[m[1]] = nextRefreshMs(m[1]);
  for (const m of out.matchAll(/\[계정(\w+)(?:-탭\d)?\] (크레딧 부족 — 퇴장)/g)) exhaustedUntil[m[1]] = nextRefreshMs(m[1]);
  const q = pendingJobs();
  if (q.n === p.n) await sleep(120000); // 진행이 없으면 잠시 쉰다
}
log("스토리 감독 종료");
