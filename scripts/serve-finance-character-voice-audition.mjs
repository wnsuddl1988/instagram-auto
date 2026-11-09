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

const port = Number(argValue("--port", "4317"));
const summaryPath = path.resolve(argValue("--summary", "C:\\tmp\\money-shorts-os\\finance-character-voice-audition-v1\\voice-audition-summary.json"));
const imageRoot = path.resolve(argValue("--image-root", "C:\\tmp\\money-shorts-os\\web-wizard-create-v1\\character-cast-v1"));
const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
if (summary.status !== "AUDITION_READY" || !Array.isArray(summary.rows) || summary.rows.length !== 4) {
  throw new Error("AUDITION_READY summary with four rows required.");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]);
}

const cards = summary.rows.map((row) => `
  <article>
    <img src="/image/${encodeURIComponent(row.characterId)}" alt="${escapeHtml(row.characterName)} 후보 2번" />
    <div class="body">
      <p class="eyebrow">${escapeHtml(row.characterLabel)}</p>
      <h2>${escapeHtml(row.characterName)} · ${escapeHtml(row.voiceLabel)}</h2>
      <p>${escapeHtml(row.intent)}</p>
      <p class="settings">속도 ${row.settings.speed} · 안정성 ${row.settings.stability} · 유사도 ${row.settings.similarity_boost} · ${row.durationSec}초</p>
      <audio controls preload="metadata" src="/audio/${encodeURIComponent(row.characterId)}"></audio>
    </div>
  </article>`).join("");

const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Money Shorts 주인공 보이스 오디션</title>
<style>
body{margin:0;background:#f5f7fb;color:#172033;font-family:Arial,"Malgun Gothic",sans-serif}.wrap{max-width:1080px;margin:0 auto;padding:28px 20px 48px}h1{font-size:28px;margin:0 0 8px}.lead{color:#5b6475;margin:0 0 24px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}article{display:grid;grid-template-columns:150px 1fr;background:white;border:1px solid #dfe4ed;border-radius:8px;overflow:hidden}img{width:150px;height:267px;object-fit:cover}.body{padding:18px}h2{font-size:20px;margin:4px 0 10px}.eyebrow{font-weight:700;color:#4f46e5;margin:0}.body>p:not(.eyebrow){line-height:1.55;color:#586174}.settings{font-size:13px}audio{width:100%;margin-top:10px}@media(max-width:760px){.grid{grid-template-columns:1fr}article{grid-template-columns:120px 1fr}img{width:120px;height:214px}.wrap{padding:18px 12px}h1{font-size:23px}}
</style></head><body><main class="wrap"><h1>주인공 보이스 오디션</h1><p class="lead">네 목소리는 같은 한국어 대본을 읽습니다. 아직 제작 엔진에는 확정 적용되지 않았습니다.</p><section class="grid">${cards}</section></main></body></html>`;

const rowById = new Map(summary.rows.map((row) => [row.characterId, row]));
const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
  if (url.pathname === "/") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    response.end(html);
    return;
  }
  const audioMatch = url.pathname.match(/^\/audio\/([a-z0-9_-]+)$/i);
  if (audioMatch) {
    const row = rowById.get(audioMatch[1]);
    if (row && fs.existsSync(row.outputPath)) {
      response.writeHead(200, { "Content-Type": "audio/mpeg", "Content-Length": fs.statSync(row.outputPath).size, "Cache-Control": "no-store" });
      fs.createReadStream(row.outputPath).pipe(response);
      return;
    }
  }
  const imageMatch = url.pathname.match(/^\/image\/([a-z0-9_-]+)$/i);
  if (imageMatch && rowById.has(imageMatch[1])) {
    const imagePath = path.join(imageRoot, imageMatch[1], "candidate-2.png");
    if (fs.existsSync(imagePath)) {
      response.writeHead(200, { "Content-Type": "image/png", "Content-Length": fs.statSync(imagePath).size, "Cache-Control": "no-store" });
      fs.createReadStream(imagePath).pipe(response);
      return;
    }
  }
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Voice audition review: http://localhost:${port}`);
});
