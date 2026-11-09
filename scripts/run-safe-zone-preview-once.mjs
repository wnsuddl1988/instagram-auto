#!/usr/bin/env node
/**
 * 안전선 미리보기 시트 (2026-09-30 품질 개선).
 *
 * 씬 이미지(또는 완성 영상 프레임)를 한 장에 모아 안전선을 겹쳐 그린다. 저와 Owner가 한눈에
 *   - 글자가 폰에서 잘리는 영역에 걸리는지(빨간 세로선: 좌우 10% = 화면비 긴 폰에서 앱이 잘라내는 폭,
 *     주황 세로선: 좌우 12% = 이미지 속 글자 소품 안전선)
 *   - 글자 소품이 세로 22~60% 띠 안에 있는지(하늘색 가로선: 위=제목 띠, 아래=자막 자리)
 *   - 캐릭터 크기가 샷 목표(와이드 35~40% / 미디엄 45~50% / 클로즈 60~70%)에 맞는지(타일 아래 표기)
 * 를 확인한다. 판정은 사람이 하고, 시트는 그 근거를 한 장으로 보여준다.
 *
 * 사용:
 *   이미지: node scripts/run-safe-zone-preview-once.mjs --images-dir C:/tmp/bull-ep11-images \
 *             [--spec-module ./_bull-ep11-assembly-spec.mjs --spec-export BULL_EP11_ASSEMBLY_SPEC] --out C:/tmp/bull-ep11-review/safe-images.png
 *   영상:   node scripts/run-safe-zone-preview-once.mjs --video C:/tmp/bull-ep11-final/owl_episode_final.mp4 --count 12 --out …/safe-video.png
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const argv = process.argv.slice(2);
function getArg(name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
}
const IMAGES_DIR = getArg("--images-dir");
const VIDEO = getArg("--video");
const COUNT = Number(getArg("--count") ?? 12);
const OUT = getArg("--out");
const SPEC_MODULE = getArg("--spec-module");
const SPEC_EXPORT = getArg("--spec-export");
if ((!IMAGES_DIR && !VIDEO) || !OUT) {
  console.error("ABORT: --images-dir 또는 --video, 그리고 --out 이 필요합니다.");
  process.exit(2);
}

const FONT = path.resolve("assets/fonts/BlackHanSans.ttf");
const fontForFilter = (fs.existsSync(FONT) ? FONT : "C:/Windows/Fonts/malgun.ttf").replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");
const TARGET = { wide: "캐릭터 35~40%", medium: "캐릭터 45~50%", close: "캐릭터 60~70%" };
const TILE_W = 270;
const TILE_H = 480;

function ffmpeg(args) {
  const r = spawnSync("ffmpeg", ["-y", "-v", "error", ...args], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffmpeg 실패: ${r.stderr}`);
}
function ffprobeDuration(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" });
  return Number(r.stdout.trim());
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "safe-zone-"));
const sources = [];
if (IMAGES_DIR) {
  let shotByScene = {};
  if (SPEC_MODULE && SPEC_EXPORT) {
    const spec = (await import(new URL(SPEC_MODULE, import.meta.url).href))[SPEC_EXPORT];
    shotByScene = Object.fromEntries(spec.scenes.map((s) => [s.scene, s.shot]));
  }
  const files = fs.readdirSync(IMAGES_DIR)
    .filter((f) => /_s(\d+)\.png$/i.test(f))
    .sort((a, b) => Number(a.match(/_s(\d+)\./)[1]) - Number(b.match(/_s(\d+)\./)[1]));
  for (const f of files) {
    const n = Number(f.match(/_s(\d+)\./)[1]);
    const shot = shotByScene[n];
    sources.push({ input: path.join(IMAGES_DIR, f), label: `s${n}${shot ? ` ${shot} · ${TARGET[shot]}` : ""}`, seek: null });
  }
} else if (getArg("--times")) {
  // --times 16,116 : 리스크 고지(오프닝·마지막 씬)처럼 특정 시점 확인용
  for (const at of getArg("--times").split(",").map(Number).filter(Number.isFinite)) {
    sources.push({ input: VIDEO, label: `${at.toFixed(1)}s`, seek: at });
  }
} else {
  const duration = ffprobeDuration(VIDEO);
  for (let i = 0; i < COUNT; i += 1) {
    const at = (duration * (i + 0.5)) / COUNT;
    sources.push({ input: VIDEO, label: `${at.toFixed(1)}s`, seek: at });
  }
}
if (sources.length === 0) {
  console.error("ABORT: 대상 이미지/프레임이 없습니다.");
  process.exit(1);
}

sources.forEach((src, index) => {
  const x10 = Math.round(TILE_W * 0.1);
  const x12 = Math.round(TILE_W * 0.12);
  const y22 = Math.round(TILE_H * 0.22);
  const y70 = Math.round(TILE_H * 0.6); // 글자 세로 띠 아래 끝(배치 v2: 60%, 그 아래는 자막)
  const vf = [
    `scale=${TILE_W}:${TILE_H}`,
    `drawbox=x=${x10}:y=0:w=2:h=${TILE_H}:color=red@0.9:t=fill`,
    `drawbox=x=${TILE_W - x10 - 2}:y=0:w=2:h=${TILE_H}:color=red@0.9:t=fill`,
    `drawbox=x=${x12}:y=0:w=1:h=${TILE_H}:color=orange@0.9:t=fill`,
    `drawbox=x=${TILE_W - x12 - 1}:y=0:w=1:h=${TILE_H}:color=orange@0.9:t=fill`,
    `drawbox=x=0:y=${y22}:w=${TILE_W}:h=1:color=cyan@0.8:t=fill`,
    `drawbox=x=0:y=${y70}:w=${TILE_W}:h=1:color=cyan@0.8:t=fill`,
    `pad=${TILE_W}:${TILE_H + 30}:0:0:color=black`,
    `drawtext=fontfile='${fontForFilter}':text='${src.label.replace(/[':]/g, " ")}':x=6:y=${TILE_H + 6}:fontsize=17:fontcolor=white`,
  ].join(",");
  const args = src.seek !== null ? ["-ss", src.seek.toFixed(2), "-i", src.input] : ["-i", src.input];
  ffmpeg([...args, "-frames:v", "1", "-vf", vf, path.join(tmp, `${String(index + 1).padStart(3, "0")}.png`)]);
});

const cols = Math.min(6, sources.length);
const rowsCount = Math.ceil(sources.length / cols);
fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
ffmpeg(["-framerate", "1", "-i", path.join(tmp, "%03d.png"), "-vf", `tile=${cols}x${rowsCount}:padding=6:color=0x222222`, "-frames:v", "1", OUT]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`written ${OUT} (${sources.length}장) — 빨강=폰 크롭선(10%), 주황=글자 안전선(12%), 하늘색=글자 세로 띠(22~60%)`);
