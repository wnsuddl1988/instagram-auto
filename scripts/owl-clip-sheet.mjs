#!/usr/bin/env node
/** 클립 검수용 시트: 장면마다 시작·중간·끝 프레임(3장)을 한 줄로 이어 붙이고, 8줄씩 한 장으로 만든다. 사용: node scripts/owl-clip-sheet.mjs --ep 29 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const A = process.argv.slice(2);
const ep = Number(A[A.indexOf("--ep") + 1]);
const dir = `C:/tmp/owl-ep${ep}-videos`;
const md = fs.readFileSync(`_ai/owl-ep${ep}-video-generation-prompts.md`, "utf8");
const rows = [...md.matchAll(/^\|\s*s(\d+) [^|]*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|[^|]*\|[^|]*\|\s*\*{0,2}(8|10)초/gm)].map((m) => ({ s: Number(m[1]), vid: m[3] }));
const out = `${dir}/sheets`;
fs.mkdirSync(out, { recursive: true });
const lines = [];
for (const r of rows) {
  const f = `${dir}/${r.vid}`;
  if (!fs.existsSync(f)) continue;
  const d = Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }).stdout.trim());
  const ts = [0.6, d / 2, d - 0.5];
  const pngs = ts.map((t, i) => {
    const p = `${out}/s${r.s}_${i}.png`;
    spawnSync("ffmpeg", ["-y", "-v", "error", "-ss", String(t), "-i", f, "-frames:v", "1", "-vf", "scale=240:-1", p]);
    return p;
  });
  const row = `${out}/row_${String(r.s).padStart(2, "0")}.png`;
  spawnSync("ffmpeg", ["-y", "-v", "error", "-i", pngs[0], "-i", pngs[1], "-i", pngs[2], "-filter_complex", `[0][1][2]hstack=inputs=3,drawtext=text='s${r.s}':x=6:y=6:fontsize=28:fontcolor=yellow:box=1:boxcolor=black@0.6`, "-frames:v", "1", row]);
  lines.push(row);
}
for (let k = 0; k * 6 < lines.length; k += 1) {
  const part = lines.slice(k * 6, k * 6 + 6);
  const inputs = part.flatMap((p) => ["-i", p]);
  spawnSync("ffmpeg", ["-y", "-v", "error", ...inputs, "-filter_complex", `${part.map((_, i) => `[${i}]`).join("")}vstack=inputs=${part.length}`, "-frames:v", "1", `${out}/sheet_${k + 1}.png`]);
}
console.log(`시트: ${out}/sheet_*.png (${lines.length}개 장면)`);
