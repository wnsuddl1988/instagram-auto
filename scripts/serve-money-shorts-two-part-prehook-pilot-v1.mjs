#!/usr/bin/env node
/** Localhost-only Range-capable preview server for the two-part pilot. */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const ROOT = "C:\\tmp\\money-shorts-os\\two-part-prehook-pilot-v1";
const PORT = Number(process.argv[2] ?? 3011);
if (!Number.isInteger(PORT) || PORT < 1024 || PORT > 65535) {
  console.error("Usage: node serve-money-shorts-two-part-prehook-pilot-v1.mjs [port]");
  process.exit(2);
}
const files = new Map([
  ["/part-1.mp4", path.join(ROOT, "part-1", "render", "part-1-final.mp4")],
  ["/part-2.mp4", path.join(ROOT, "part-2", "render", "part-2-final.mp4")],
]);
for (const file of files.values()) {
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) {
    console.error(`ABORT: pilot video missing: ${file}`);
    process.exit(2);
  }
}
const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Money Shorts 파일럿</title><style>body{margin:0;background:#090b10;color:#f5f5f2;font-family:Arial,sans-serif}main{max-width:980px;margin:auto;padding:24px}p{color:#aeb5c2}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}section{min-width:0}video{display:block;width:100%;max-height:78vh;background:#000;border-radius:6px}@media(max-width:760px){.grid{grid-template-columns:1fr}}</style><main><h1>Money Shorts 2편 프리훅 파일럿</h1><p>로컬 검수 전용 · 업로드되지 않음</p><div class="grid"><section><h2>1편</h2><video controls playsinline preload="metadata" src="/part-1.mp4"></video></section><section><h2>2편</h2><video controls playsinline preload="metadata" src="/part-2.mp4"></video></section></div></main></html>`;

function stream(request, response, file) {
  const size = fs.statSync(file).size;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(request.headers.range ?? "");
  if (!match) {
    response.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": size, "Accept-Ranges": "bytes", "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(response);
    return;
  }
  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= size) {
    response.writeHead(416, { "Content-Range": `bytes */${size}` });
    response.end();
    return;
  }
  response.writeHead(206, {
    "Content-Type": "video/mp4",
    "Content-Length": end - start + 1,
    "Content-Range": `bytes ${start}-${end}/${size}`,
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(file, { start, end }).pipe(response);
}

http.createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  if (pathname === "/") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    response.end(html);
    return;
  }
  const file = files.get(pathname);
  if (file) return stream(request, response, file);
  response.writeHead(404);
  response.end("not found");
}).listen(PORT, "127.0.0.1", () => {
  console.log(`[pilot-preview] http://127.0.0.1:${PORT}`);
});
