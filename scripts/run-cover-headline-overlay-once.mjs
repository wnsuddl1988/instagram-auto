/**
 * 커버·스토리 헤드라인 합성기 (2026-09-30, 황소 11편 교훈).
 *
 * 이미지 모델은 글자 폭·위치 좌표를 지키지 못한다(11편 커버 1차: 문구가 폭 6~94%, 세로 15~28%에 나와 안전영역 이탈).
 * 그래서 모델에게는 글자 없는 배경+캐릭터만 만들게 하고, 헤드라인은 BlackHanSans로 정확한 위치에 얹는다.
 * 줄 폭은 textWidthRatio로 계산해 지정한 최대 폭(%) 안에 맞춘다.
 *
 * 사용:
 *   node scripts/run-cover-headline-overlay-once.mjs --in <textless.png> --out <final.png> \
 *     --line "주가는 반토막 가까이" --line "이익 전망은 올랐다?" \
 *     --center-y-pct 39 --max-width-pct 76 [--line-gap-pct 1.6] [--fill "#FFFFFF"] [--stroke "#0B1026"]
 *
 * 1080x1920(또는 같은 9:16) 전용. 입력 크기가 다르면 ABORT.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { textWidthRatio } from "./_caption-linebreak-ko.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const FONT = path.resolve(here, "../assets/fonts/BlackHanSans.ttf");

function arg(name, def = undefined, multi = false) {
  const vals = [];
  for (let i = 2; i < process.argv.length; i += 1) {
    if (process.argv[i] === `--${name}`) vals.push(process.argv[i + 1]);
  }
  if (multi) return vals;
  return vals.length ? vals.at(-1) : def;
}
function abort(msg) {
  console.error(`ABORT: ${msg}`);
  process.exit(1);
}

const input = arg("in");
const output = arg("out");
const lines = arg("line", [], true);
if (!input || !output || lines.length === 0) abort("--in, --out, --line(1개 이상)이 필요합니다.");
if (!existsSync(input)) abort(`입력 없음: ${input}`);
if (!existsSync(FONT)) abort(`폰트 없음: ${FONT}`);

const centerYPct = Number(arg("center-y-pct", "39"));
const maxWidthPct = Number(arg("max-width-pct", "76"));
const lineGapPct = Number(arg("line-gap-pct", "1.6"));
const fill = arg("fill", "#FFFFFF");
const stroke = arg("stroke", "#0B1026");

const probe = JSON.parse(
  execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", input]).toString(),
);
const { width: W0, height: H0 } = probe.streams[0];
if (Math.abs(W0 / H0 - 9 / 16) > 0.01) abort(`9:16 이미지가 아닙니다: ${W0}x${H0}`);
const W = 1080;
const H = 1920;

// 줄마다 따로 폭을 채우는 크기로 정한다(2026-09-30 Owner 지적: 가장 긴 줄 기준 한 가지 크기로 맞추면
// 10자 문구가 97px로 작아져 그리드에서 안 보였다 — 예전 커버처럼 줄별로 꽉 채운다). 최대 크기 상한으로
// 짧은 줄이 지나치게 커지는 것만 막는다. --colors "#FFFFFF,#FFD54A"로 줄별 색(강조) 지정.
const maxFont = Number(arg("max-font", "230"));
const minFontWarn = Number(arg("min-font-warn", "140"));
const colors = (arg("colors", "") || "").split(",").map((c) => c.trim()).filter(Boolean);
const gap = Math.round(H * (lineGapPct / 100));
const sizes = lines.map((l) => Math.min(maxFont, Math.floor((W * (maxWidthPct / 100) * 0.96) / textWidthRatio(l))));
const blockH = sizes.reduce((s, f) => s + f, 0) + gap * (lines.length - 1);
const top = Math.round(H * (centerYPct / 100) - blockH / 2);

const dir = mkdtempSync(path.join(tmpdir(), "headline-"));
const fontForFilter = FONT.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");
const filters = [`scale=${W}:${H}:flags=lanczos`];
let y = top;
lines.forEach((text, i) => {
  const file = path.join(dir, `line${i}.txt`).replace(/\\/g, "/");
  writeFileSync(file, text, "utf8");
  const fileForFilter = file.replace(/^([A-Za-z]):/, "$1\\:");
  const fontSize = sizes[i];
  const borderW = Math.max(8, Math.round(fontSize * 0.12));
  // 두꺼운 외곽선(+골드 그림자) 후 본문
  filters.push(
    `drawtext=fontfile='${fontForFilter}':textfile='${fileForFilter}':fontsize=${fontSize}:fontcolor=${colors[i] ?? fill}:borderw=${borderW}:bordercolor=${stroke}:shadowcolor=0xFBBF24@0.75:shadowx=0:shadowy=${Math.round(fontSize * 0.07)}:x=(w-text_w)/2:y=${y}`,
  );
  y += fontSize + gap;
});
try {
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", input, "-vf", filters.join(","), "-frames:v", "1", output]);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log(`완료: ${output}`);
console.log(`줄별 글자 크기 ${sizes.join("/")}px, 세로 ${((top / H) * 100).toFixed(1)}~${(((top + blockH) / H) * 100).toFixed(1)}%`);
const small = lines.filter((_, i) => sizes[i] < minFontWarn);
if (small.length) console.log(`⚠ 글자가 ${minFontWarn}px보다 작은 줄: ${small.join(" / ")} — 줄당 8자 이하로 문구를 줄일 것(예전 커버 수준 130~220px)`);
