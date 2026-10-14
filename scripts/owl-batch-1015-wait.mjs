#!/usr/bin/env node
/** 진행 확인용 대기기: 지정한 편의 클립이 전부 생기거나 제한 시간이 지나면 현황을 출력하고 끝난다. 사용: node scripts/owl-batch-1015-wait.mjs --ep 29 [--minutes 9] */
import fs from "node:fs";
const A = process.argv.slice(2);
const arg = (n, d) => { const i = A.indexOf(n); return i >= 0 ? A[i + 1] : d; };
const EP = Number(arg("--ep", "29"));
const MIN = Number(arg("--minutes", "9"));
const md = fs.readFileSync(`_ai/owl-ep${EP}-video-generation-prompts.md`, "utf8");
const rows = [...md.matchAll(/^\|\s*s(\d+) [^|]*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|[^|]*\|[^|]*\|\s*\*{0,2}(8|10)초/gm)].map((m) => ({ s: Number(m[1]), img: m[2], vid: m[3], tier: Number(m[4]) }));
const status = () => {
  const images = rows.filter((r) => fs.existsSync(`C:/tmp/owl-ep${EP}-images/${r.img}`)).length;
  const clips = rows.filter((r) => fs.existsSync(`C:/tmp/owl-ep${EP}-videos/${r.vid}`)).length;
  return { images, clips, total: rows.length };
};
const t0 = Date.now();
let s = status();
while (s.clips < s.total && Date.now() - t0 < MIN * 60000) { await new Promise((r) => setTimeout(r, 20000)); s = status(); }
console.log(`ep${EP}: 이미지 ${s.images}/${s.total} · 클립 ${s.clips}/${s.total}`);
const miss = rows.filter((r) => !fs.existsSync(`C:/tmp/owl-ep${EP}-videos/${r.vid}`)).map((r) => `s${r.s}${fs.existsSync(`C:/tmp/owl-ep${EP}-images/${r.img}`) ? "" : "(이미지 없음)"}`);
console.log(`없는 클립: ${miss.join(" ") || "없음"}`);
