#!/usr/bin/env node
/**
 * Veo(제미나이) 워터마크 제거 (2026-09-30, Owner: "채널명 띠를 안 넣으면 제미나이 워터마크가 보인다").
 *
 * 하단 채널명 띠가 있을 때는 우하단 워터마크가 띠에 가려졌다. 띠를 뺀 화면 배치 v2부터는 그대로 드러난다.
 * 워터마크는 클립마다 두 종류가 섞여 나온다(1080x1920 기준, 2026-09-30 부엉 15편 실측):
 *   ① ✦ 모양 — 중심 (900, 1740), 약 72x80px
 *   ② "Veo" 글자 — x1024~1058, y1881~1899
 * 둘 다 항상 같은 자리라 두 영역을 항상 지운다(있든 없든 바닥의 매끈한 반사 면이라 티가 안 난다).
 * ffmpeg delogo(주변 픽셀 보간)로 화면만 재인코딩(crf 18), 오디오는 그대로 복사한다.
 *
 * 순서: CTA 결합 → 이 스크립트 → run-audio-finish-once.mjs → run-episode-qa-once.mjs
 *   (오디오 마감은 화면을 복사만 하므로 어느 쪽이 먼저여도 되지만, 재인코딩을 한 번만 하려면 마감 전에 한다.)
 *
 * 사용:
 *   node scripts/run-remove-veo-watermark-once.mjs --in <final.mp4> --out <final_nowm.mp4>
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";

const argv = process.argv.slice(2);
function getArg(name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
}
const IN = getArg("--in");
const OUT = getArg("--out");
if (!IN || !OUT || !fs.existsSync(IN)) {
  console.error("ABORT: 존재하는 --in 과 --out 이 필요합니다.");
  process.exit(2);
}

export const WATERMARK_TAG = "veo_watermark_removed_v1";

// x, y, w, h (delogo는 영역이 화면 안쪽 1px 이상 떨어져야 한다)
export const VEO_WATERMARK_REGIONS = Object.freeze([
  { name: "sparkle", x: 856, y: 1692, w: 88, h: 96 },
  { name: "veo_text", x: 1016, y: 1874, w: 50, h: 30 },
]);

const size = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", IN], { encoding: "utf8" })
  .stdout.trim().split(",").map(Number);
if (size[0] !== 1080 || size[1] !== 1920) {
  console.error(`ABORT: 1080x1920 영상이 아닙니다(${size.join("x")}) — 워터마크 좌표가 맞지 않습니다.`);
  process.exit(2);
}

const vf = VEO_WATERMARK_REGIONS.map((r) => `delogo=x=${r.x}:y=${r.y}:w=${r.w}:h=${r.h}`).join(",");
const r = spawnSync(
  "ffmpeg",
  ["-hide_banner", "-nostats", "-y", "-i", IN, "-vf", vf, "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "copy",
    // run-episode-qa-once.mjs가 이 표식을 읽어, 없으면 "반드시 수정"으로 막는다(오디오 마감·압축을 거쳐도 전역 메타데이터로 이어짐).
    "-metadata", `comment=${WATERMARK_TAG}`,
    "-movflags", "+faststart", OUT],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);
if (r.status !== 0) {
  console.error(`ABORT: ffmpeg 실패\n${r.stderr.slice(-800)}`);
  process.exit(1);
}
console.log(`워터마크 영역 ${VEO_WATERMARK_REGIONS.length}곳 제거: ${VEO_WATERMARK_REGIONS.map((x) => x.name).join(", ")}`);
console.log(`→ ${OUT}`);
