// 11~15편 이미지를 한 번에 하나씩 순차 생성(Chrome 하나). ep11 SEMI가 끝나기를 기다린 뒤 시작.
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const ROOT = "C:/Users/PC/jjy/instagram-auto";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (m) => { const l = `[${new Date().toLocaleTimeString("sv-SE")}] ${m}\n`; fs.appendFileSync("C:/tmp/story-images-run.log", l); console.log(l.trim()); };
while (!fs.existsSync("C:/tmp/story-ep11-images/story_ep11_s14.png")) await sleep(15000);
await sleep(60000);
const jobs = [
  [11, "END", "owl3dv5"], [12, "SEMI", "storysemi"], [12, "END", "owl3dv5"],
  [13, "SEMI", "storysemi"], [13, "END", "owl3dv5"], [14, "SEMI", "storysemi"], [14, "END", "owl3dv5"],
  [15, "SEMI", "storysemi"], [15, "END", "owl3dv5"],
];
for (const [n, kind, ch] of jobs) {
  log(`start ep${n} ${kind}`);
  const r = spawnSync(process.execPath, [
    "scripts/probe-character-consistency-chatgpt-v1.mjs", "--character", ch,
    "--scene-spec", `./_story-ep${n}-assembly-spec.mjs`, "--scene-spec-export", `STORY_EP${n}_${kind}_SPEC`,
    "--out-dir", `C:/tmp/story-ep${n}-images`,
  ], { cwd: ROOT, env: { ...process.env, ALLOW_CHATGPT_IMAGE: "1" }, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const tail = (r.stdout ?? "").split("\n").slice(-6).join(" | ");
  log(`done ep${n} ${kind} exit=${r.status} :: ${tail.slice(0, 400)}`);
  if (r.status !== 0) { log(`STOP: ep${n} ${kind} 실패 — 중단`); break; }
  await sleep(20000);
}
log("ALL DONE");
