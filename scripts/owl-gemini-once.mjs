#!/usr/bin/env node
/**
 * Gemini(Veo 10초) 한 번만 실행(2026-10-14, Owner "제미나이는 왜 안 쓰노 자꾸") — 반복·재시도 루프 없음.
 *  - 지정한 편의 10초 티어 장면 중 이미지가 있고 클립이 없는 것을 최대 N개(기본 4, 동시 2×2) 맡긴다.
 *  - 맡긴 장면은 owl-skip.txt에 올려 Flow 러너가 건너뛰게 하고, 끝나면 내린다(결과물이 있으면 Flow가 알아서 건너뜀).
 *  - 한 장면도 못 받으면 한도로 보고 그대로 끝낸다(다시 시도하지 않는다 — 다시 켜는 건 Owner가 한도 해제를 알려 줄 때만).
 * 사용: node scripts/owl-gemini-once.mjs --ep 32 [--count 4] [--scenes 1,3,4,5]
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const A = process.argv.slice(2);
const arg = (n, d) => { const i = A.indexOf(n); return i >= 0 ? A[i + 1] : d; };
const EP = Number(arg("--ep", "0"));
const COUNT = Number(arg("--count", "4"));
const ONLY = (arg("--scenes", "") || "").split(",").map(Number).filter(Boolean);
if (!EP) { console.error("ABORT: --ep 필요"); process.exit(2); }
const STATE = "C:/tmp/money-shorts-os/flow-queue";
const SKIP_FILE = `${STATE}/owl-skip.txt`;
const LOG = `${STATE}/owl-gemini-once.log`;
const log = (m) => { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + "\n"); };
const readSkip = () => new Set(fs.existsSync(SKIP_FILE) ? fs.readFileSync(SKIP_FILE, "utf8").split(/\s+/).filter(Boolean) : []);
const writeSkip = (set) => fs.writeFileSync(SKIP_FILE, [...set].join("\n") + (set.size ? "\n" : ""));

function candidates() {
  const t = fs.readFileSync(`_ai/owl-ep${EP}-video-generation-prompts.md`, "utf8");
  const skip = readSkip();
  const out = [];
  for (const m of t.matchAll(/^\|\s*s(\d+) [^|]*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|[^|]*\|[^|]*\|\s*\*{0,2}(8|10)초\*{0,2}\s*\|/gm)) {
    if (Number(m[4]) !== 10) continue;
    if (fs.existsSync(`C:/tmp/owl-ep${EP}-videos/${m[3]}`)) continue;
    if (!fs.existsSync(`C:/tmp/owl-ep${EP}-images/${m[2]}`)) continue;
    if (skip.has(`${EP}-${m[1]}`)) continue;
    if (ONLY.length && !ONLY.includes(Number(m[1]))) continue;
    out.push(Number(m[1]));
  }
  return out;
}

const scenes = candidates().slice(0, COUNT);
if (!scenes.length) { log(`ep${EP}: Gemini가 맡을 10초 장면 없음 — 종료`); process.exit(0); }
const claims = scenes.map((s) => `${EP}-${s}`);
const skip = readSkip(); claims.forEach((c) => skip.add(c)); writeSkip(skip);
log(`Gemini 1회 실행 — ep${EP} 장면 ${scenes.join(",")}`);
let r;
try {
  r = spawnSync(process.execPath, ["scripts/run-owl-veo-motion-submit-then-collect-v1.mjs", "--scenes", scenes.map((s) => `s${s}`).join(","), "--scene-prompts", "scripts/_owl-gemini-scenes.mjs:OWL_GEMINI_SCENES", "--out-dir", `C:/tmp/owl-ep${EP}-videos`, "--owner-approved-once", "--collect-timeout-min", "12"], {
    env: { ...process.env, ALLOW_GEMINI_VEO: "1", OWL_EP: String(EP) }, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 90 * 60 * 1000,
  });
} finally {
  const s2 = readSkip(); claims.forEach((c) => s2.delete(c)); writeSkip(s2); // 반납
}
fs.appendFileSync(LOG, `${r.stdout ?? ""}${r.stderr ?? ""}`.split("\n").slice(-40).join("\n") + "\n");
const got = scenes.filter((s) => !candidates().includes(s)).length; // 이번에 받은 수(반납 후 후보에서 빠진 것 = 클립이 생김)
log(`Gemini 종료 — 코드 ${r.status}, 받은 장면 ${got}/${scenes.length}${got === 0 ? " — 한 장면도 못 받음(한도로 판단, 다시 시도하지 않음)" : ""}`);
