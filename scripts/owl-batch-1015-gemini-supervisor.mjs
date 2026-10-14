#!/usr/bin/env node
/**
 * 부엉 통합 52~56편 Gemini(Veo 10초) 감독(2026-10-13, Owner "영상생성할 때 gemini도 활용해").
 *  - Flow(크레딧 한도)와 병행: 이미지가 있는 10초 티어 장면을 한 번에 최대 4개(동시 2×2) Gemini에 맡긴다.
 *  - 맡긴 장면은 C:/tmp/money-shorts-os/flow-queue/owl-skip.txt 에 올려 Flow 러너가 건너뛰게 하고, 끝나면 내린다.
 *  - 한도(5시간 창·주간)에 걸리면 1시간 쉬었다 다시 시도한다. 중단: C:/tmp/money-shorts-os/flow-queue/STOP 파일.
 * 사용: node scripts/owl-batch-1015-gemini-supervisor.mjs --eps 29,30,31,32,33 [--per-run 4]
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const A = process.argv.slice(2);
const arg = (n, d) => { const i = A.indexOf(n); return i >= 0 ? A[i + 1] : d; };
const EPS = (arg("--eps", "") || "").split(",").map(Number).filter(Boolean);
const PER = Number(arg("--per-run", "4"));
const STATE = "C:/tmp/money-shorts-os/flow-queue";
const STOP = `${STATE}/STOP`;
const SKIP_FILE = `${STATE}/owl-skip.txt`;
const LOG = `${STATE}/owl-gemini-supervisor.log`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (m) => { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + "\n"); };
const readSkip = () => new Set(fs.existsSync(SKIP_FILE) ? fs.readFileSync(SKIP_FILE, "utf8").split(/\s+/).filter(Boolean) : []);
const writeSkip = (set) => fs.writeFileSync(SKIP_FILE, [...set].join("\n") + "\n");

function candidates(ep) {
  const md = `_ai/owl-ep${ep}-video-generation-prompts.md`;
  if (!fs.existsSync(md)) return [];
  const t = fs.readFileSync(md, "utf8");
  const skip = readSkip();
  const out = [];
  for (const m of t.matchAll(/^\|\s*s(\d+) [^|]*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|[^|]*\|[^|]*\|\s*\*{0,2}(8|10)초\*{0,2}\s*\|/gm)) {
    if (Number(m[4]) !== 10) continue; // Gemini는 10초 고정 — 카드 씬(10초 티어)만 맡긴다
    if (fs.existsSync(`C:/tmp/owl-ep${ep}-videos/${m[3]}`)) continue;
    if (!fs.existsSync(`C:/tmp/owl-ep${ep}-images/${m[2]}`)) continue;
    if (skip.has(`${ep}-${m[1]}`)) continue;
    out.push(Number(m[1]));
  }
  return out;
}
function allDone() {
  for (const ep of EPS) {
    const md = `_ai/owl-ep${ep}-video-generation-prompts.md`;
    if (!fs.existsSync(md)) return false;
    const t = fs.readFileSync(md, "utf8");
    for (const m of t.matchAll(/^\|\s*s(\d+) [^|]*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/gm)) if (!fs.existsSync(`C:/tmp/owl-ep${ep}-videos/${m[3]}`)) return false;
  }
  return true;
}

let failStreak = 0;
while (!fs.existsSync(STOP)) {
  if (allDone()) { log("모든 대상 클립 완료"); break; }
  let ep = null, scenes = [];
  for (const e of EPS) { const c = candidates(e); if (c.length) { ep = e; scenes = c.slice(0, PER); break; } }
  if (!ep) { log("Gemini가 맡을 준비된 10초 장면 없음 — 대기"); await sleep(120000); continue; }
  const claims = scenes.map((s) => `${ep}-${s}`);
  const skip = readSkip(); claims.forEach((c) => skip.add(c)); writeSkip(skip);
  log(`Gemini 실행 — ep${ep} 장면 ${scenes.join(",")}`);
  const r = spawnSync(process.execPath, ["scripts/run-owl-veo-motion-submit-then-collect-v1.mjs", "--scenes", scenes.map((s) => `s${s}`).join(","), "--scene-prompts", "scripts/_owl-gemini-scenes.mjs:OWL_GEMINI_SCENES", "--out-dir", `C:/tmp/owl-ep${ep}-videos`, "--owner-approved-once", "--collect-timeout-min", "12"], {
    env: { ...process.env, ALLOW_GEMINI_VEO: "1", OWL_EP: String(ep) }, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 90 * 60 * 1000,
  });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  fs.appendFileSync(LOG, out.split("\n").slice(-40).join("\n") + "\n");
  const done = candidates(ep); // 아직 없는 것(맡기지 않은 것 포함)
  const got = scenes.filter((s) => !done.includes(s) && fs.existsSync(`C:/tmp/owl-ep${ep}-videos/`)).length; // 근사
  const skip2 = readSkip(); claims.forEach((c) => skip2.delete(c)); writeSkip(skip2); // 반납(결과물이 있으면 러너가 알아서 건너뜀)
  // 한도 소진 감지(2026-10-13 Owner "제미나이는 한도 소진됐는데 왜 자꾸 키냐" — 한도 문구가 아닌 "Veo compositor not entered"(영상 화면 진입 불가)로 나타나 재시도를 반복했다):
  // 이번 회차에 한 장면도 못 받았으면 한도로 본다. 한 번 그러면 한 번 더 쉰 뒤 시도하고, 두 번 연속이면 감독을 끝낸다(다시 켜는 건 Owner가 한도 해제를 알려 줄 때만).
  const none = scenes.every((s) => done.includes(s));
  failStreak = none ? failStreak + 1 : 0;
  log(`Gemini 종료 — 코드 ${r.status}, 이번 회차 결과 약 ${got}/${scenes.length}${none ? ` — 한 장면도 못 받음(한도로 판단, 연속 ${failStreak}회)` : ""}`);
  if (failStreak >= 2) { log("연속 실패 — Gemini 한도 소진으로 보고 감독을 끝냅니다(Owner 안내 전에는 다시 켜지 않음)"); break; }
  await sleep(none ? 60 * 60 * 1000 : 30000);
}
log("Gemini 감독 종료");
