#!/usr/bin/env node
/**
 * 배포 전 게이트 (2026-10-01, Owner 지시 "실수 안 하도록 할 수 있는 모든 조치" — 최우선 규칙 27).
 *
 * 배포는 되돌릴 수 없는 외부 게시라, 사람이 기억으로 챙기던 것을 여기서 기계적으로 확인한다. no-log 래퍼의
 * owl-instagram-publish / owl-instagram-story-publish / owl-youtube-publish 가 자격증명을 읽기 전에 이 검사를 돌리고,
 * 실패하면 게시하지 않는다. 비밀값을 읽지 않는다(파일·ffprobe만).
 *
 * 확인 항목(콘텐츠 유닛 기준):
 *   1. 필수 필드: contentId·title·instagramCaption·youtubeTitle·instagramSourcePath·thumbnailImagePath·finalMasteredPath·qaReportPath
 *   2. youtubeTitle에 "#Shorts" 없음(업로드 스크립트가 붙임), 100자 이하 / 캡션 2,200자·해시태그 30개 이하
 *   3. finalMasteredPath: 오디오 마감본(*_mastered.mp4), Veo 워터마크 제거 표식, 1080x1920
 *   4. qaReportPath: "반드시 수정 (0)", 이 완성본보다 나중에 작성(= 이 완성본으로 QA를 돌렸다)
 *   5. instagramSourcePath(압축본): 35MB(36,700,160바이트) 이하, 9:16, 오디오 있음, 완성본보다 나중에 만들어짐, 길이가 완성본과 0.5초 안
 *   6. thumbnailImagePath(커버=썸네일): 9:16, 합성기 기록(<커버>.headline.json)이 있으면 가장 작은 글자 140px 이상 —
 *      기록이 없으면(모델이 글자를 그린 옛 커버) 경고만 남긴다
 * 예외: 콘텐츠 유닛에 preflightException: "<사유>"를 적으면 실패 항목을 경고로 낮춘다(사유는 출력에 남는다) — 수동 우회 배포 등 불가피할 때만.
 *
 * 사용: node scripts/run-deploy-preflight-once.mjs --content-unit <owl-content-unit.json>
 * 종료 코드: 통과 0, 실패 1, 인자 오류 2.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const cuPath = argv.includes("--content-unit") ? argv[argv.indexOf("--content-unit") + 1] : null;
if (!cuPath || !fs.existsSync(cuPath)) {
  console.error(`ABORT: --content-unit 파일이 없습니다: ${cuPath}`);
  process.exit(2);
}
let cu;
try {
  cu = JSON.parse(fs.readFileSync(cuPath, "utf8"));
} catch (e) {
  console.error(`ABORT: 콘텐츠 유닛 JSON을 읽지 못했습니다: ${e.message}`);
  process.exit(2);
}

const fail = [];
const warn = [];
const ok = [];
const MAX_IG_BYTES = 36_700_160;

function probe(file) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "stream=codec_type,width,height:format=duration:format_tags=comment", "-of", "json", file],
    { encoding: "utf8" },
  );
  try {
    const j = JSON.parse(r.stdout);
    const v = j.streams.find((s) => s.codec_type === "video");
    return {
      width: v?.width,
      height: v?.height,
      hasAudio: j.streams.some((s) => s.codec_type === "audio"),
      duration: Number(j.format?.duration),
      comment: j.format?.tags?.comment ?? "",
    };
  } catch {
    return null;
  }
}
const is916 = (p) => p && p.width && p.height && Math.abs(p.width / p.height - 9 / 16) < 0.01;
const mtime = (f) => fs.statSync(f).mtimeMs;

// 1) 필수 필드
const REQUIRED = ["contentId", "title", "instagramCaption", "youtubeTitle", "instagramSourcePath", "thumbnailImagePath", "finalMasteredPath", "qaReportPath"];
const missing = REQUIRED.filter((k) => typeof cu[k] !== "string" || cu[k].trim() === "");
if (missing.length) fail.push(`필수 필드 없음: ${missing.join(", ")}`);
else ok.push("필수 필드 8개");

// 2) 제목·캡션
if (typeof cu.youtubeTitle === "string") {
  if (/#shorts/i.test(cu.youtubeTitle)) fail.push('youtubeTitle에 "#Shorts"가 있음(업로드 스크립트가 붙인다 — §5)');
  else ok.push('youtubeTitle에 "#Shorts" 없음');
  if (cu.youtubeTitle.length > 100) fail.push(`youtubeTitle ${cu.youtubeTitle.length}자(100자 초과)`);
}
if (typeof cu.instagramCaption === "string") {
  if (cu.instagramCaption.length > 2200) fail.push(`인스타 캡션 ${cu.instagramCaption.length}자(2,200자 초과)`);
  const tags = cu.instagramCaption.match(/#[^\s#]+/g) ?? [];
  if (tags.length > 30) fail.push(`인스타 캡션 해시태그 ${tags.length}개(30개 초과)`);
  else ok.push(`캡션 ${cu.instagramCaption.length}자·해시태그 ${tags.length}개`);
}

// 3) 완성본
let finalProbe = null;
if (cu.finalMasteredPath) {
  if (!fs.existsSync(cu.finalMasteredPath)) fail.push(`완성본 없음: ${cu.finalMasteredPath}`);
  else {
    if (!/_mastered\.mp4$/i.test(cu.finalMasteredPath)) fail.push("완성본이 오디오 마감본(*_mastered.mp4)이 아님(§5 1-1)");
    finalProbe = probe(cu.finalMasteredPath);
    if (!finalProbe) fail.push("완성본 ffprobe 실패");
    else {
      if (!finalProbe.comment.includes("veo_watermark_removed_v1")) fail.push("완성본에 Veo 워터마크 제거 표식 없음(규칙 18)");
      if (finalProbe.width !== 1080 || finalProbe.height !== 1920) fail.push(`완성본 해상도 ${finalProbe.width}x${finalProbe.height}(1080x1920 아님)`);
      if (!fail.some((f) => f.startsWith("완성본"))) ok.push(`완성본 ${path.basename(cu.finalMasteredPath)} ${finalProbe.duration.toFixed(1)}초·워터마크 표식`);
    }
  }
}

// 4) QA 리포트
if (cu.qaReportPath) {
  if (!fs.existsSync(cu.qaReportPath)) fail.push(`QA 리포트 없음: ${cu.qaReportPath}`);
  else {
    const qa = fs.readFileSync(cu.qaReportPath, "utf8");
    const m = qa.match(/## 반드시 수정 \((\d+)\)/);
    if (!m) fail.push("QA 리포트 형식을 읽지 못함(## 반드시 수정 (N))");
    else if (Number(m[1]) !== 0) fail.push(`QA 반드시 수정 ${m[1]}건 — 고치고 QA 재실행`);
    else ok.push("QA 반드시 수정 0");
    if (cu.finalMasteredPath && fs.existsSync(cu.finalMasteredPath) && mtime(cu.qaReportPath) < mtime(cu.finalMasteredPath)) {
      fail.push("QA 리포트가 완성본보다 먼저 만들어짐 — 이 완성본으로 QA를 다시 돌릴 것");
    }
  }
}

// 5) 압축본(업로드 원본)
if (cu.instagramSourcePath) {
  if (!fs.existsSync(cu.instagramSourcePath)) fail.push(`업로드 영상(압축본) 없음: ${cu.instagramSourcePath} — §5 2단계로 압축`);
  else {
    const size = fs.statSync(cu.instagramSourcePath).size;
    const p = probe(cu.instagramSourcePath);
    if (size > MAX_IG_BYTES) fail.push(`업로드 영상 ${(size / 1048576).toFixed(1)}MB(35MB 초과) — 비트레이트 낮춰 재압축`);
    if (!is916(p)) fail.push("업로드 영상이 9:16이 아님");
    if (p && !p.hasAudio) fail.push("업로드 영상에 오디오 없음");
    if (cu.finalMasteredPath && fs.existsSync(cu.finalMasteredPath)) {
      if (mtime(cu.instagramSourcePath) < mtime(cu.finalMasteredPath)) fail.push("압축본이 완성본보다 먼저 만들어짐 — 옛 완성본에서 압축했을 수 있음, 현재 완성본에서 다시 압축");
      if (p && finalProbe && Math.abs(p.duration - finalProbe.duration) > 0.5) fail.push(`압축본 길이 ${p.duration.toFixed(1)}초 ≠ 완성본 ${finalProbe.duration.toFixed(1)}초 — 다른 영상에서 압축했을 수 있음`);
    }
    if (!fail.some((f) => f.startsWith("업로드") || f.startsWith("압축본"))) ok.push(`업로드 영상 ${(size / 1048576).toFixed(1)}MB·9:16·오디오`);
  }
}

// 6) 커버(=유튜브 썸네일)
if (cu.thumbnailImagePath) {
  if (!fs.existsSync(cu.thumbnailImagePath)) fail.push(`커버 없음: ${cu.thumbnailImagePath}`);
  else {
    const p = probe(cu.thumbnailImagePath);
    if (!is916(p)) fail.push(`커버가 9:16이 아님(${p?.width}x${p?.height})`);
    const sidecar = `${cu.thumbnailImagePath}.headline.json`;
    if (fs.existsSync(sidecar)) {
      const h = JSON.parse(fs.readFileSync(sidecar, "utf8"));
      if (Number(h.minFont) < 140) fail.push(`커버 헤드라인 가장 작은 글자 ${h.minFont}px(140px 미만 — 줄당 8자 이하로 줄일 것, A-8)`);
      else ok.push(`커버 헤드라인 글자 ${h.sizes?.join("/")}px`);
    } else {
      warn.push("커버 글자 크기 기록(.headline.json) 없음 — 합성기로 만든 커버가 아니면 글자 크기를 눈으로 확인(A-8)");
    }
  }
}

// 예외 처리
const exception = typeof cu.preflightException === "string" && cu.preflightException.trim() ? cu.preflightException.trim() : null;
if (exception && fail.length) {
  warn.push(...fail.map((f) => `(예외로 통과: ${exception}) ${f}`));
  fail.length = 0;
}

console.log(`\n=== 배포 전 게이트 — ${cu.contentId ?? path.basename(cuPath)} ===`);
for (const m of ok) console.log(`  ✅ ${m}`);
for (const m of warn) console.log(`  ⚠  ${m}`);
for (const m of fail) console.log(`  ❌ ${m}`);
console.log(`\n실패 ${fail.length} · 경고 ${warn.length} · 통과 ${ok.length}`);
process.exit(fail.length ? 1 : 0);
