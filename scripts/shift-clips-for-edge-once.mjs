#!/usr/bin/env node
/**
 * 글자 안전선 교정 — 클립을 좌/우로 옮겨 카드·보드 글자가 폰 크롭선·안전선(좌 12%·우 88%) 안에 들게 한다 (2026-10-02, 부엉 17편).
 *
 * 쓰임: QA의 edge-review 시트에서 "over"로 판정한 씬(글자가 안전선 밖)을 그 씬 클립만 교정한다(CURRENT_STANDARDS A-6).
 * 처리(씬마다): ① 원본 720x1280 → 1080x1920 확대 ② Veo 워터마크 제거(★이동하면 워터마크 위치가 같이 밀리므로 이동 전에)
 *   ③ 지정한 px만큼 이동 + 비는 가장자리 mirror 채움(smear는 줄무늬 글리치가 보여 mirror가 낫다). 오디오는 그대로 복사.
 *   교정하지 않는 씬 클립은 원본을 그대로 복사한다 → 결과 폴더를 조립기 --clip-dir로 쓴다.
 *
 * 사용:
 *   node scripts/shift-clips-for-edge-once.mjs --spec-module ./_owl-v2-ep18-assembly-spec.mjs --spec-export OWL_ASSEMBLY_SPEC \
 *     --clip-dir C:/tmp/owl-v2-ep18-videos --out-dir C:/tmp/owl-v2-ep18-videos-edgefix --shift "2:48,4:25,5:27" [--direction right|left]
 *   --shift "씬번호:px,..."  (1080 기준 px). --direction right(기본): 글자가 왼쪽 안전선 밖이라 오른쪽으로 옮김 / left: 오른쪽 밖이라 왼쪽으로 옮김.
 *   px 계산: (목표 가장자리 % × 1080) − (현재 글자 끝 px) + 3px 여유. 목표는 왼쪽 약 12.6%·오른쪽 약 87.4%.
 * 주의: 옮긴 만큼 반대쪽 끝이 잘리므로(소품·글자가 없는 쪽인지) 교정 후 QA 시트를 다시 봐야 한다.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const argv = process.argv.slice(2);
const arg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const SPEC_MODULE = arg("--spec-module"), SPEC_EXPORT = arg("--spec-export");
const CLIP_DIR = arg("--clip-dir"), OUT_DIR = arg("--out-dir");
const SHIFT = arg("--shift");
const DIRECTION = arg("--direction") ?? "right";
if (!SPEC_MODULE || !SPEC_EXPORT || !CLIP_DIR || !OUT_DIR || !SHIFT || !["right", "left"].includes(DIRECTION)) {
  console.error('ABORT: --spec-module --spec-export --clip-dir --out-dir --shift "씬:px,..." [--direction right|left] 가 필요합니다.');
  process.exit(2);
}
const spec = (await import(new URL(SPEC_MODULE, import.meta.url).href))[SPEC_EXPORT];
const shifts = new Map(SHIFT.split(",").map((s) => s.trim().split(":").map(Number)).filter(([a, b]) => Number.isInteger(a) && Number.isFinite(b) && b > 0 && b <= 120));
if (!shifts.size) { console.error("ABORT: --shift 값이 올바르지 않습니다(씬:px, px는 1~120)."); process.exit(2); }
fs.mkdirSync(OUT_DIR, { recursive: true });
const tmp = path.join(OUT_DIR, "_tmp");
fs.mkdirSync(tmp, { recursive: true });
const run = (cmd, args) => { const r = spawnSync(cmd, args, { encoding: "utf8" }); if (r.status !== 0) { console.error(`ABORT: ${cmd} 실패\n${(r.stderr ?? "").slice(-600)}`); process.exit(1); } return r; };

for (const s of spec.scenes) {
  const src = path.join(CLIP_DIR, s.video);
  const dst = path.join(OUT_DIR, s.video);
  if (!fs.existsSync(src)) { console.error(`ABORT: 클립 없음 ${src}`); process.exit(1); }
  const n = shifts.get(s.scene);
  if (!n) { fs.copyFileSync(src, dst); continue; }
  const up = path.join(tmp, `s${s.scene}_up.mp4`);
  const clean = path.join(tmp, `s${s.scene}_clean.mp4`);
  // ① 확대(오디오 복사)
  run("ffmpeg", ["-v", "error", "-y", "-i", src, "-vf", "scale=1080:1920:flags=lanczos", "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-pix_fmt", "yuv420p", "-c:a", "copy", up]);
  // ② 워터마크 제거(이동 전)
  run("node", ["scripts/run-remove-veo-watermark-once.mjs", "--in", up, "--out", clean]);
  // ③ 이동 + mirror 채움
  const vf = DIRECTION === "right"
    ? `crop=iw-${n}:ih:0:0,pad=iw+${n}:ih:${n}:0:black,fillborders=left=${n}:mode=mirror`
    : `crop=iw-${n}:ih:${n}:0,pad=iw+${n}:ih:0:0:black,fillborders=right=${n}:mode=mirror`;
  run("ffmpeg", ["-v", "error", "-y", "-i", clean, "-vf", vf, "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-pix_fmt", "yuv420p", "-c:a", "copy", dst]);
  console.log(`s${s.scene}: ${DIRECTION} ${n}px 이동 → ${dst}`);
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`완료: 교정 ${shifts.size}개 씬, 나머지는 원본 복사 → ${OUT_DIR} (조립기 --clip-dir로 사용, 이후 QA 시트를 다시 볼 것)`);
