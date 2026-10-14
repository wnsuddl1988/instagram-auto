#!/usr/bin/env node
/** 부엉 통합 52~56편 커버 생성·합성(2026-10-13): 글자 없는 배경(ChatGPT) → 제목 그대로 헤드라인 합성(규칙 30). 사용: node scripts/owl-batch-1015-covers.mjs --eps 29,30,31,32,33 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { OWL_BATCH_1015 } from "./_owl-batch-1015-defs.mjs";

const A = process.argv.slice(2);
const EPS = (A[A.indexOf("--eps") + 1] || "").split(",").map(Number).filter(Boolean);
const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);
for (const ep of EPS) {
  const d = OWL_BATCH_1015.find((x) => x.ep === ep);
  const raw = `C:/tmp/owl-cover-ep${ep}-raw`;
  const outDir = `C:/tmp/owl-cover-ep${ep}`;
  const rawPng = `${raw}/00_owl_ep${ep}_cover_thumb.png`;
  if (!fs.existsSync(rawPng)) {
    log(`ep${ep} 커버 배경 생성`);
    const r = spawnSync(process.execPath, ["scripts/run-owl-cardnews-chatgpt-v1.mjs", "--spec-module", `./_owl-cover-ep${ep}-spec.mjs`, "--out-dir", raw], { env: { ...process.env, ALLOW_CHATGPT_IMAGE: "1" }, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 30 * 60 * 1000 });
    log(`ep${ep} 배경 종료 코드 ${r.status}`);
    if (!fs.existsSync(rawPng)) { log(`ep${ep} 배경 생성 실패`); continue; }
  }
  fs.mkdirSync(outDir, { recursive: true });
  const lines = d.coverLines ?? d.headerTitle; // 문구는 영상 제목 그대로, 140px 게이트를 지키려고 줄바꿈만 다르게(규칙 30)
  const n = lines.length;
  const colors = lines.map((_, i) => (i >= n - (n >= 4 ? 2 : 1) ? "#FFD54A" : "#FFFFFF")).join(",");
  // 편별 덮어쓰기(coverCenterYPct·coverMaxWidthPct·coverMaxFont): 배경의 캐릭터 머리 위치가 편마다 달라 기본값으로는 겹칠 때(55편 5줄 → 4줄·폭 94%)
  const centerY = d.coverCenterYPct ?? (n >= 5 ? 32 : n === 4 ? 31 : 29);
  const maxWidth = d.coverMaxWidthPct ?? (n >= 5 ? 90 : n === 4 ? 88 : 84);
  const maxFont = d.coverMaxFont ?? (n >= 5 ? 145 : n === 4 ? 150 : null);
  const args = ["scripts/run-cover-headline-overlay-once.mjs", "--in", rawPng, "--out", `${outDir}/00_owl_ep${ep}_cover_thumb.png`, ...lines.flatMap((l) => ["--line", l]), "--center-y-pct", String(centerY), "--max-width-pct", String(maxWidth), "--colors", colors];
  if (maxFont) args.push("--max-font", String(maxFont));
  const r2 = spawnSync(process.execPath, args, { encoding: "utf8" });
  log(`ep${ep} 합성 종료 코드 ${r2.status} ${(r2.stdout ?? "").split("\n").slice(-3).join(" | ")}${(r2.stderr ?? "").slice(-200)}`);
}
log("커버 끝");
