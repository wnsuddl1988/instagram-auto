#!/usr/bin/env node
/**
 * 부엉 통합 52~56편 이미지 연속 생성(2026-10-13) — ChatGPT 웹 자동화는 한 번에 한 편씩이라, 앞 편이 끝난 뒤 다음 편을 이어서 돌린다.
 * 사용: node scripts/owl-batch-1015-images-chain.mjs --eps 30,31,32,33 [--wait-file C:/tmp/owl-ep29-images/owl_ep29_s16.png]
 * 이미 있는 이미지는 건드리지 않는다(없는 씬 번호만 --scene-spec-only로 생성). 실패한 씬은 한 번 더 시도한다.
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const A = process.argv.slice(2);
const arg = (n, d) => { const i = A.indexOf(n); return i >= 0 ? A[i + 1] : d; };
const EPS = (arg("--eps", "") || "").split(",").map(Number).filter(Boolean);
const WAIT = arg("--wait-file", "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);

if (WAIT) { while (!fs.existsSync(WAIT)) await sleep(15000); log(`대기 파일 확인: ${WAIT}`); await sleep(20000); }

for (const ep of EPS) {
  const mod = `./_owl-v2-ep${ep}-assembly-spec.mjs`;
  const specSrc = fs.readFileSync(`scripts/_owl-v2-ep${ep}-assembly-spec.mjs`, "utf8");
  const n = (specSrc.match(/"scene": \d+,/g) || []).length;
  for (let pass = 1; pass <= 2; pass += 1) {
    const missing = [];
    for (let s = 1; s <= n; s += 1) if (!fs.existsSync(`C:/tmp/owl-ep${ep}-images/owl_ep${ep}_s${s}.png`)) missing.push(s);
    if (!missing.length) break;
    log(`ep${ep} 이미지 ${pass}차: 없는 씬 ${missing.join(",")}`);
    const r = spawnSync(process.execPath, ["scripts/probe-character-consistency-chatgpt-v1.mjs", "--character", "owl3dv5", "--scene-spec", mod, "--scene-spec-export", `OWL_EP${ep}_ASSEMBLY_SPEC`, "--out-dir", `C:/tmp/owl-ep${ep}-images`, "--scene-spec-only", missing.join(",")], { env: { ...process.env, ALLOW_CHATGPT_IMAGE: "1" }, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 3 * 60 * 60 * 1000 });
    fs.appendFileSync(`C:/tmp/owl-ep${ep}-images-chain.log`, `${r.stdout ?? ""}\n${r.stderr ?? ""}\n`);
    log(`ep${ep} 이미지 ${pass}차 종료(코드 ${r.status})`);
  }
}
log("이미지 체인 끝");
