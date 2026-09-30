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

// 가장 긴 줄이 maxWidthPct 안에 들어가도록 글자 크기 결정(외곽선 두께를 감안해 여유 4%)
const widest = Math.max(...lines.map((l) => textWidthRatio(l)));
const fontSize = Math.floor((W * (maxWidthPct / 100) * 0.96) / widest);
const borderW = Math.max(8, Math.round(fontSize * 0.14));
const lineH = fontSize + Math.round(H * (lineGapPct / 100));
const blockH = lineH * lines.length - Math.round(H * (lineGapPct / 100));
const top = Math.round(H * (centerYPct / 100) - blockH / 2);

const dir = mkdtempSync(path.join(tmpdir(), "headline-"));
const fontForFilter = FONT.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");
const filters = [`scale=${W}:${H}:flags=lanczos`];
lines.forEach((text, i) => {
  const file = path.join(dir, `line${i}.txt`).replace(/\\/g, "/");
  writeFileSync(file, text, "utf8");
  const fileForFilter = file.replace(/^([A-Za-z]):/, "$1\\:");
  const y = top + i * lineH;
  // 두꺼운 외곽선(+골드 그림자) 후 본문
  filters.push(
    `drawtext=fontfile='${fontForFilter}':textfile='${fileForFilter}':fontsize=${fontSize}:fontcolor=${fill}:borderw=${borderW}:bordercolor=${stroke}:shadowcolor=0xFBBF24@0.75:shadowx=0:shadowy=${Math.round(fontSize * 0.07)}:x=(w-text_w)/2:y=${y}`,
  );
});
try {
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", input, "-vf", filters.join(","), "-frames:v", "1", output]);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
const estWidthPct = ((widest * fontSize + borderW * 2) / W) * 100;
console.log(`완료: ${output}`);
console.log(`글자 크기 ${fontSize}px, 줄 ${lines.length}개, 세로 ${((top / H) * 100).toFixed(1)}~${(((top + blockH) / H) * 100).toFixed(1)}%, 가장 긴 줄 폭 약 ${estWidthPct.toFixed(1)}% (좌우 여백 약 ${((100 - estWidthPct) / 2).toFixed(1)}%)`);
