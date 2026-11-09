#!/usr/bin/env node
/**
 * 부엉 통합 52~56편 Flow 클립 감독(2026-10-13) — 이미지가 생기는 대로 flow-owl-queue-runner.mjs를 반복 실행한다.
 *  - 계정 우선순위대로 돌리고, 크레딧이 10 미만으로 확인된 계정은 3시간 쉰다(무료 계정은 매일 갱신).
 *  - 모든 대상 클립이 생기면 끝낸다. 중단: C:/tmp/money-shorts-os/flow-queue/STOP 파일.
 * 사용: node scripts/owl-batch-1015-clips-supervisor.mjs --eps 29,30,31,32,33 --accounts 8,7,6,1,2,4,5,3,9 [--tabs 2]
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const A = process.argv.slice(2);
const arg = (n, d) => { const i = A.indexOf(n); return i >= 0 ? A[i + 1] : d; };
const EPS = (arg("--eps", "") || "").split(",").map(Number).filter(Boolean);
const ACCTS = (arg("--accounts", "") || "").split(",").filter(Boolean);
const TABS = arg("--tabs", "2");
const STOP = "C:/tmp/money-shorts-os/flow-queue/STOP";
const LOG = "C:/tmp/money-shorts-os/flow-queue/owl-supervisor.log";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (m) => { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + "\n"); };
const exhaustedUntil = {};
// 무료 계정은 매일 정해진 시각(한국 시간)에 크레딧이 갱신된다(flow-profiles check 10/13 확인). 소진된 계정은 다음 갱신 시각까지 열지 않는다(창이 계속 뜨는 것 방지).
const REFRESH_KST = { 9: "07:48", 4: "08:46", 5: "09:28", 6: "11:22", 1: "11:30", 7: "13:10", 8: "13:19", 2: "23:57", 3: "00:07" };
function nextRefreshMs(a) {
  const hm = REFRESH_KST[a];
  if (!hm) return Date.now() + 3 * 3600 * 1000;
  const [h, m] = hm.split(":").map(Number);
  const now = new Date();
  const t = new Date(now.getTime() + 9 * 3600 * 1000); // KST로 옮긴 시각(UTC 필드로 읽는다)
  t.setUTCHours(h, m + 3, 0, 0); // 갱신 3분 뒤
  let ms = t.getTime() - 9 * 3600 * 1000;
  if (ms <= now.getTime()) ms += 24 * 3600 * 1000;
  return ms;
}
const assumeArg = arg("--assume-exhausted", "");
for (const a of assumeArg.split(",").filter(Boolean)) exhaustedUntil[a] = nextRefreshMs(a);

function pendingJobs() {
  let n = 0, noImage = 0, skipped = 0;
  const SKIP = new Set(fs.existsSync("C:/tmp/money-shorts-os/flow-queue/owl-skip.txt") ? fs.readFileSync("C:/tmp/money-shorts-os/flow-queue/owl-skip.txt", "utf8").split(/\s+/).filter(Boolean) : []);
  for (const ep of EPS) {
    const md = `_ai/owl-ep${ep}-video-generation-prompts.md`;
    if (!fs.existsSync(md)) continue;
    const t = fs.readFileSync(md, "utf8");
    for (const m of t.matchAll(/^\|\s*s(\d+) [^|]*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/gm)) {
      if (fs.existsSync(`C:/tmp/owl-ep${ep}-videos/${m[3]}`)) continue;
      n += 1;
      if (SKIP.has(`${ep}-${m[1]}`)) { skipped += 1; continue; }
      if (!fs.existsSync(`C:/tmp/owl-ep${ep}-images/${m[2]}`)) noImage += 1;
    }
  }
  return { n, noImage, ready: n - noImage - skipped };
}

while (!fs.existsSync(STOP)) {
  const p = pendingJobs();
  if (p.n === 0) { log("모든 대상 클립 완료"); break; }
  const usable = ACCTS.filter((a) => (exhaustedUntil[a] ?? 0) < Date.now());
  if (p.ready === 0 || usable.length === 0) { log(`대기 — 남은 ${p.n}개(이미지 없음 ${p.noImage}), 사용 가능 계정 ${usable.length}`); await sleep(90000); continue; }
  log(`실행 — 준비된 ${p.ready}개 / 남은 ${p.n}개 / 계정 ${usable.join(",")}`);
  const r = spawnSync(process.execPath, ["scripts/flow-owl-queue-runner.mjs", "--eps", EPS.join(","), "--accounts", usable.join(","), "--sequential", "--tabs", TABS], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 2 * 60 * 60 * 1000 });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  fs.appendFileSync(LOG, out + "\n");
  for (const m of out.matchAll(/\[계정(\w+)\] 크레딧 (\d+|null)/g)) if (m[2] !== "null" && Number(m[2]) < 10) exhaustedUntil[m[1]] = nextRefreshMs(m[1]);
  for (const m of out.matchAll(/\[계정(\w+)(?:-탭\d)?\] (크레딧 부족 — 퇴장)/g)) exhaustedUntil[m[1]] = nextRefreshMs(m[1]);
  const q = pendingJobs();
  if (q.n === p.n) await sleep(120000); // 진행이 없으면 잠시 쉰다
}
log("감독 종료");
