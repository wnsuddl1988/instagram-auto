#!/usr/bin/env node

import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const args = process.argv.slice(2);
function argValue(name, fallback) {
  const exact = args.find((arg) => arg.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const port = Number(argValue("--port", "4318"));
const summaryPath = path.resolve(argValue(
  "--summary",
  "C:\\tmp\\money-shorts-os\\harin-voice-recast-preview-v1\\harin-voice-recast-preview-summary.json",
));
const imagePath = path.resolve(argValue(
  "--image",
  "C:\\tmp\\money-shorts-os\\web-wizard-create-v1\\character-cast-v1\\harin_daily\\candidate-2.png",
));
const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
const readyRows = summary.rows.filter((row) => row.status === "PREVIEW_READY");
if (readyRows.length < 3) throw new Error("At least three PREVIEW_READY rows are required.");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
  })[char]);
}

const cards = readyRows.map((row) => `
  <article data-candidate-id="${escapeHtml(row.candidateId)}">
    <div class="rank">${row.rank}</div>
    <div class="content">
      <p class="badge">${escapeHtml(row.statusLabel)}</p>
      <h2>${escapeHtml(row.voiceLabel)}</h2>
      <p>${escapeHtml(row.rationale)}</p>
      <p class="meta">공개 샘플 ${row.durationSec}초 · ${escapeHtml(row.codec)} · Voice ID ${escapeHtml(row.voiceId)}</p>
      <audio controls preload="metadata" src="/audio/${encodeURIComponent(row.candidateId)}"></audio>
    </div>
  </article>`).join("");

const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>하린 보이스 재캐스팅</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f4f6fa;color:#18202f;font-family:Arial,"Malgun Gothic",sans-serif}.wrap{max-width:1040px;margin:0 auto;padding:28px 20px 52px}.intro{display:grid;grid-template-columns:220px 1fr;gap:28px;align-items:center;margin-bottom:24px}.portrait{width:220px;aspect-ratio:9/16;object-fit:cover;border-radius:8px}.eyebrow{margin:0 0 8px;color:#d94d42;font-weight:800}.intro h1{margin:0 0 12px;font-size:32px}.intro p{line-height:1.65;color:#4f5b6e}.notice{padding:13px 15px;border-left:4px solid #d94d42;background:#fff4f2;color:#7b302a}.list{display:grid;gap:12px}article{display:grid;grid-template-columns:54px 1fr;background:#fff;border:1px solid #dfe4ed;border-radius:8px;overflow:hidden}.rank{display:flex;align-items:center;justify-content:center;background:#202a3a;color:#fff;font-size:22px;font-weight:800}.content{padding:17px 20px}.badge{display:inline-block;margin:0 0 5px;color:#c8463c;font-size:13px;font-weight:800}.content h2{margin:0 0 8px;font-size:20px}.content>p:not(.badge){margin:6px 0;line-height:1.5;color:#566174}.meta{font-size:12px}audio{display:block;width:100%;margin-top:11px}@media(max-width:700px){.wrap{padding:18px 12px 38px}.intro{grid-template-columns:105px 1fr;gap:16px;align-items:start}.portrait{width:105px}.intro h1{font-size:24px}.intro p{font-size:14px;margin-top:6px}.notice{grid-column:1/-1}.content{padding:14px}.content h2{font-size:17px}article{grid-template-columns:42px 1fr}}
</style></head><body><main class="wrap">
<section class="intro"><img class="portrait" src="/image" alt="하린 후보 2번"><div><p class="eyebrow">하린 · 생활경제</p><h1>보이스 재캐스팅</h1><p>기준은 친근함만이 아니라 한국어 자연스러움, 첫 문장 속도감, 금융 콘텐츠 신뢰감입니다.</p><p class="notice">현재 파일은 무료 공개 미리듣기입니다. 최종 선택 뒤에만 동일 대본 유료 오디션 1회를 별도 승인받아 진행합니다.</p></div></section>
<section class="list">${cards}</section></main></body></html>`;

const rowById = new Map(readyRows.map((row) => [row.candidateId, row]));
const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
  if (url.pathname === "/") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    response.end(html);
    return;
  }
  if (url.pathname === "/image" && fs.existsSync(imagePath)) {
    response.writeHead(200, { "Content-Type": "image/png", "Content-Length": fs.statSync(imagePath).size, "Cache-Control": "no-store" });
    fs.createReadStream(imagePath).pipe(response);
    return;
  }
  const audioMatch = url.pathname.match(/^\/audio\/([a-z0-9-]+)$/i);
  const row = audioMatch ? rowById.get(audioMatch[1]) : null;
  if (row && fs.existsSync(row.outputPath)) {
    response.writeHead(200, { "Content-Type": "audio/mpeg", "Content-Length": fs.statSync(row.outputPath).size, "Cache-Control": "no-store" });
    fs.createReadStream(row.outputPath).pipe(response);
    return;
  }
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Harin voice recast review: http://localhost:${port}`);
});
