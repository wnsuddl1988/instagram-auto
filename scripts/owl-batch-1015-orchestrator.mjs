#!/usr/bin/env node
/**
 * 부엉 통합 52~56편 순서대로 조립·커버 자동 진행(2026-10-13, Owner "각 편마다 완성되면 네가 알아서 순서대로 조립 진행해").
 *  - 편 순서(29→30→31→32→33)대로, 그 편 클립이 전부 생기면 owl-batch-1015-assemble.mjs(TTS 보정→조립→CTA→워터마크 제거→오디오 마감→QA)를 돌린다.
 *  - 조립이 끝난 편의 커버는 ChatGPT 이미지 체인이 끝난 뒤 생성(같은 브라우저를 같이 쓰지 않게)하고 제목 그대로 합성한다.
 *  - 편 QA가 "반드시 수정"을 내면 멈추지 않고 기록만 하고 다음 편으로 간다(사람이 edge-review를 보고 처리).
 * 상태: C:/tmp/owl-batch-1015-status.json , 로그: C:/tmp/owl-batch-1015-orchestrator.log
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { OWL_BATCH_1015 } from "./_owl-batch-1015-defs.mjs";

const A = process.argv.slice(2);
const arg = (n, d) => { const i = A.indexOf(n); return i >= 0 ? A[i + 1] : d; };
const EPS = (arg("--eps", "29,30,31,32,33") || "").split(",").map(Number).filter(Boolean);
const STATUS = "C:/tmp/owl-batch-1015-status.json";
const LOG = "C:/tmp/owl-batch-1015-orchestrator.log";
const STOP = "C:/tmp/money-shorts-os/flow-queue/STOP";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (m) => { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + "\n"); };
const status = fs.existsSync(STATUS) ? JSON.parse(fs.readFileSync(STATUS, "utf8")) : {};
const save = () => fs.writeFileSync(STATUS, JSON.stringify(status, null, 1));
const defOf = (ep) => OWL_BATCH_1015.find((d) => d.ep === ep);

function clipsDone(ep) {
  const md = fs.readFileSync(`_ai/owl-ep${ep}-video-generation-prompts.md`, "utf8");
  const rows = [...md.matchAll(/^\|\s*s(\d+) [^|]*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/gm)];
  const have = rows.filter((m) => fs.existsSync(`C:/tmp/owl-ep${ep}-videos/${m[3]}`)).length;
  return { have, total: rows.length };
}
const chainDone = () => fs.existsSync("C:/tmp/owl-batch-1015-images-chain.log") && /이미지 체인 끝/.test(fs.readFileSync("C:/tmp/owl-batch-1015-images-chain.log", "utf8"));

function makeCover(ep) {
  const d = defOf(ep);
  const raw = `C:/tmp/owl-cover-ep${ep}-raw`;
  const outDir = `C:/tmp/owl-cover-ep${ep}`;
  const rawPng = `${raw}/00_owl_ep${ep}_cover_thumb.png`;
  if (fs.existsSync(`${outDir}/00_owl_ep${ep}_cover_thumb.png`) && !fs.existsSync(`${outDir}/00_owl_ep${ep}_cover_thumb.png.headline.json.failed`)) { status[ep] = { ...(status[ep] ?? {}), cover: `이미 있음 ${outDir}` }; save(); return true; } // covers 스크립트가 만든 커버는 덮어쓰지 않는다
  if (!fs.existsSync(rawPng)) {
    log(`ep${ep} 커버 배경 생성`);
    const r = spawnSync(process.execPath, ["scripts/run-owl-cardnews-chatgpt-v1.mjs", "--spec-module", `./_owl-cover-ep${ep}-spec.mjs`, "--out-dir", raw], { env: { ...process.env, ALLOW_CHATGPT_IMAGE: "1" }, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 30 * 60 * 1000 });
    fs.appendFileSync(LOG, `${(r.stdout ?? "").split("\n").slice(-12).join("\n")}\n${r.stderr ?? ""}\n`);
    if (!fs.existsSync(rawPng)) { status[ep] = { ...(status[ep] ?? {}), cover: "배경 생성 실패" }; save(); return false; }
  }
  fs.mkdirSync(outDir, { recursive: true });
  const four = d.headerTitle.length >= 4;
  const colors = d.headerTitle.map((_, i) => (i >= d.headerTitle.length - (four ? 2 : 1) ? "#FFD54A" : "#FFFFFF")).join(",");
  const args = ["scripts/run-cover-headline-overlay-once.mjs", "--in", rawPng, "--out", `${outDir}/00_owl_ep${ep}_cover_thumb.png`, ...d.headerTitle.flatMap((l) => ["--line", l]), "--center-y-pct", four ? "31" : "29", "--max-width-pct", "84", "--colors", colors];
  if (four) args.push("--max-font", "150");
  const r2 = spawnSync(process.execPath, args, { encoding: "utf8" });
  fs.appendFileSync(LOG, `${r2.stdout ?? ""}${r2.stderr ?? ""}\n`);
  status[ep] = { ...(status[ep] ?? {}), cover: r2.status === 0 ? `완료 ${outDir}/00_owl_ep${ep}_cover_thumb.png` : `합성 실패(코드 ${r2.status}) — 줄 폭 140px 미만 가능` };
  save();
  return r2.status === 0;
}

const coverQueue = [];
for (const ep of EPS) {
  if (fs.existsSync(STOP)) break;
  let waited = 0;
  for (;;) {
    const c = clipsDone(ep);
    if (c.have === c.total) break;
    if (waited % 600 === 0) log(`ep${ep} 클립 대기 ${c.have}/${c.total}`);
    status[ep] = { ...(status[ep] ?? {}), clips: `${c.have}/${c.total}` }; save();
    if (fs.existsSync(STOP)) break;
    await sleep(60000); waited += 60;
  }
  if (fs.existsSync(STOP)) break;
  if (status[ep]?.assembly !== "완료") {
    log(`ep${ep} 클립 완비 — 조립 시작`);
    const r = spawnSync(process.execPath, ["scripts/owl-batch-1015-assemble.mjs", "--ep", String(ep)], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
    const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
    fs.appendFileSync(LOG, out.split("\n").slice(-30).join("\n") + "\n");
    status[ep] = { ...(status[ep] ?? {}), assembly: r.status === 0 ? "완료" : `중단(코드 ${r.status})`, qa: /QA 종료 코드 0/.test(out) ? "통과" : "확인 필요(qa-report.md)" };
    save();
    log(`ep${ep} 조립 결과: ${status[ep].assembly} / QA ${status[ep].qa}`);
  }
  coverQueue.push(ep);
  if (chainDone()) while (coverQueue.length) makeCover(coverQueue.shift());
}
while (coverQueue.length && !fs.existsSync(STOP)) {
  if (!chainDone()) { await sleep(60000); continue; }
  makeCover(coverQueue.shift());
}
log("오케스트레이터 종료");
