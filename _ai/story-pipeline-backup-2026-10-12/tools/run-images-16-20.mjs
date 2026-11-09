// 16~20편 이미지를 한 번에 하나씩 순차 생성(Chrome 하나, ChatGPT 컨트롤러). 로그 C:/tmp/story-images-run-16-20.log
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const ROOT = "C:/Users/PC/jjy/instagram-auto";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LOG = "C:/tmp/story-images-run-16-20.log";
const log = (m) => { const l = `[${new Date().toLocaleTimeString("sv-SE")}] ${m}\n`; fs.appendFileSync(LOG, l); console.log(l.trim()); };
const only = process.argv.slice(2).map(Number);
const jobs = [];
for (const n of [16, 17, 18, 19, 20]) {
  if (only.length && !only.includes(n)) continue;
  jobs.push([n, "SEMI", "storysemi"], [n, "END", "owl3dv5"]);
}
for (const [n, kind, ch] of jobs) {
  log(`start ep${n} ${kind}`);
  const r = spawnSync(process.execPath, [
    "scripts/probe-character-consistency-chatgpt-v1.mjs", "--character", ch,
    "--scene-spec", `./_story-ep${n}-assembly-spec.mjs`, "--scene-spec-export", `STORY_EP${n}_${kind}_SPEC`,
    "--out-dir", `C:/tmp/story-ep${n}-images`,
  ], { cwd: ROOT, env: { ...process.env, ALLOW_CHATGPT_IMAGE: "1" }, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const tail = (r.stdout ?? "").split("\n").slice(-6).join(" | ");
  log(`done ep${n} ${kind} exit=${r.status} :: ${tail.slice(0, 500)}`);
  if (r.status !== 0) { log(`STOP: ep${n} ${kind} 실패 — 중단`); break; }
  await sleep(20000);
}
log("ALL DONE");
