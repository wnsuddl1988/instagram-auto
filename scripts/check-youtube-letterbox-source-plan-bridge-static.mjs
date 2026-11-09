#!/usr/bin/env node
/**
 * check-youtube-letterbox-source-plan-bridge-static.mjs
 *
 * task: owner-youtube-letterbox-source-plan-bridge-no-live-v1
 *
 * scripts/plan-youtube-letterbox-source-from-content-unit.mjs 정적 가드.
 * no-live: 레포 내 fixture JSON + planner 소스 텍스트, 그리고 planner/owner-entrypoint를
 * child_process로 실행한 stdout/생성 파일(JSON)만 읽는다. 네트워크/env/secret 접근 없음,
 * ffmpeg/ffprobe 실행 없음, media 생성 없음, Instagram/YouTube API/Blob 호출 없음.
 *
 * 검증:
 *  1) planner 소스: process.env 미접근, fetch/axios/googleapis/@vercel/blob 없음,
 *     ffmpeg/ffprobe/spawnSync/child_process/shell:true 없음, out-dir repo-root 검증 존재,
 *     .money-shorts-local 차단 존재, RENDER_PROFILE이 실제 renderer PROFILE과 일치.
 *  2) sample content-unit manifest fixture JSON parse.
 *  3) planner를 실제로 실행(체크인된 sample fixture만 사용, out-dir은 repo 밖 OS temp)해
 *     생성된 plan JSON의 계약 필드가 정확한지 확인:
 *     - instagramSourcePath / plannedYoutubeSourcePath 존재
 *     - inputExists:false (sample instagramSourcePath가 의도적으로 미존재)
 *     - outputDirOutsideRepo:true
 *     - willExecuteFfmpeg:false, side-effect counters 전부 0
 *     - renderProfile 요약(1080x1920 canvas, black background, centered content box)
 *     - recommendedNextCommand 존재
 *  4) owner entrypoint --plan-youtube-letterbox 모드가 동일 결과를 산출하는지 확인.
 *  5) mutant 방어: out-dir이 repo 내부면 abort, --content-unit 누락 시 abort.
 *  6) content unit manifest 자체를 mutate하지 않음(실행 전후 원본 fixture 바이트 동일).
 */
import { readFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");

const PLANNER_PATH = path.join(ROOT, "scripts", "plan-youtube-letterbox-source-from-content-unit.mjs");
const RENDERER_PATH = path.join(ROOT, "scripts", "create-youtube-shorts-letterbox-variant.mjs");
const OWNER_ENTRYPOINT_PATH = path.join(ROOT, "scripts", "run-owner-daily-automation-entrypoint.mjs");
const SAMPLE_CONTENT_UNIT_PATH = path.join(ROOT, "scripts", "fixtures", "youtube_letterbox_source_plan_from_content_unit.sample.v1.json");

let passes = 0;
let failures = 0;
function check(name, ok, detail) {
  if (ok) { passes += 1; console.log(`PASS  ${name}`); }
  else { failures += 1; console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
}

function stripCommentsAndStrings(src) {
  if (!src) return "";
  const codeLines = [];
  let inBlock = false;
  for (const raw of src.split("\n")) {
    let line = raw;
    const trimmed = line.trim();
    if (inBlock) {
      const end = line.indexOf("*/");
      if (end === -1) continue;
      line = line.slice(end + 2);
      inBlock = false;
    }
    if (trimmed.startsWith("*") || trimmed.startsWith("//")) continue;
    const blockStart = line.indexOf("/*");
    if (blockStart !== -1) {
      const blockEnd = line.indexOf("*/", blockStart + 2);
      if (blockEnd === -1) {
        line = line.slice(0, blockStart);
        inBlock = true;
      } else {
        line = line.slice(0, blockStart) + line.slice(blockEnd + 2);
      }
    }
    const lineCommentIdx = line.indexOf("//");
    if (lineCommentIdx !== -1) line = line.slice(0, lineCommentIdx);
    line = line.replace(/"(?:[^"\\]|\\.)*"/g, '""');
    line = line.replace(/'(?:[^'\\]|\\.)*'/g, "''");
    line = line.replace(/`(?:[^`\\]|\\.)*`/g, "``");
    codeLines.push(line);
  }
  return codeLines.join("\n");
}

// ── 1) planner 소스 정적 검증 ─────────────────────────────────────────────────
const plannerRawSrc = readFileSync(PLANNER_PATH, "utf8");
const plannerCode = stripCommentsAndStrings(plannerRawSrc);

check("planner: process.env 접근 없음", !/process\.env/.test(plannerCode));
check("planner: fetch/axios/googleapis/@vercel/blob 호출 없음", !/\bfetch\(|axios|googleapis|@vercel\/blob/.test(plannerCode));
check("planner: ffmpeg/ffprobe/spawnSync/child_process 미사용(실행 없음)", !/spawnSync|child_process|ffmpeg\s*\(|ffprobe\s*\(|exec[A-Za-z]*\(/i.test(plannerCode) && !/import[^\n]*child_process/.test(plannerRawSrc));
check("planner: shell:true 없음", !/shell:\s*true/.test(plannerCode));
check("planner: out-dir repo-root 검증 존재", /REPO_ROOT/.test(plannerCode) && /outDirAbs\.startsWith/.test(plannerCode));
check("planner: .money-shorts-local 차단 존재", /\.money-shorts-local/.test(plannerRawSrc));
check("planner: planYoutubeLetterboxSourceFromContentUnit export 존재", /export function planYoutubeLetterboxSourceFromContentUnit/.test(plannerRawSrc));
check("planner: PLAN_SCHEMA_VERSION = youtube_letterbox_source_plan_v1", /PLAN_SCHEMA_VERSION\s*=\s*"youtube_letterbox_source_plan_v1"/.test(plannerRawSrc));
check("planner: willExecuteFfmpeg:false를 명시적으로 산출", /willExecuteFfmpeg:\s*false/.test(plannerRawSrc));
check("planner: content unit manifest에 대해 writeFileSync/mutation 호출 없음(읽기 전용)", !/writeFileSync\([^)]*contentUnitPath/.test(plannerCode));

// planner의 RENDER_PROFILE이 실제 renderer(create-youtube-shorts-letterbox-variant.mjs)의
// PROFILE과 값이 정확히 일치하는지 확인한다(drift 방지 — 계획과 실제 렌더가 어긋나면 안 됨).
const rendererRawSrc = readFileSync(RENDERER_PATH, "utf8");
function extractProfileNumbers(src, constName) {
  const m = src.match(new RegExp(`${constName}\\s*=\\s*\\{[\\s\\S]*?\\n\\};`));
  if (!m) return null;
  return m[0].match(/\d+/g)?.join(",") ?? null;
}
check(
  "planner: RENDER_PROFILE 숫자 값이 renderer PROFILE과 정확히 일치(1080/1920/864/1536/192/108)",
  (() => {
    const plannerNums = extractProfileNumbers(plannerRawSrc, "RENDER_PROFILE");
    const rendererNums = extractProfileNumbers(rendererRawSrc, "PROFILE");
    return plannerNums != null && rendererNums != null && plannerNums === rendererNums;
  })(),
);
check(
  "planner: RENDER_PROFILE.canvas.backgroundColor === renderer PROFILE.canvas.backgroundColor(black)",
  /backgroundColor:\s*"black"/.test(plannerRawSrc) && /backgroundColor:\s*"black"/.test(rendererRawSrc),
);

// ── 2) sample content-unit manifest fixture JSON parse ──────────────────────
let sampleContentUnit;
const sampleRawBefore = readFileSync(SAMPLE_CONTENT_UNIT_PATH, "utf8");
try {
  sampleContentUnit = JSON.parse(sampleRawBefore);
  check("sample content-unit manifest fixture JSON parse 성공", true);
} catch (e) {
  check("sample content-unit manifest fixture JSON parse 성공", false, String(e?.message || e));
}
check(
  "sample content-unit manifest: schemaVersion === dual_platform_content_unit_v1 + instagramSourcePath/contentId/version 존재",
  sampleContentUnit?.schemaVersion === "dual_platform_content_unit_v1" &&
    typeof sampleContentUnit?.instagramSourcePath === "string" &&
    typeof sampleContentUnit?.contentId === "string" &&
    typeof sampleContentUnit?.version === "string",
);
check(
  "sample content-unit manifest: instagramSourcePath가 의도적으로 미존재(inputExists:false 경로 검증용)",
  typeof sampleContentUnit?.instagramSourcePath === "string" && !existsSync(sampleContentUnit.instagramSourcePath),
);
check("sample fixture에 secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(sampleRawBefore));

// ── 3) planner 실행: 체크인 sample fixture만 사용, out-dir은 OS temp(repo 밖) ──
const tmpBase = mkdtempSync(path.join(os.tmpdir(), "youtube-letterbox-plan-guard-"));
try {
  let planOut;
  try {
    planOut = execFileSync(process.execPath, [
      PLANNER_PATH, "--content-unit", SAMPLE_CONTENT_UNIT_PATH, "--out-dir", tmpBase,
    ], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
    check("planner --content-unit 실행 성공(sample fixture)", true);
  } catch (e) {
    check("planner --content-unit 실행 성공(sample fixture)", false, String(e?.message || e));
    planOut = "";
  }

  const generatedPlanPath = path.join(tmpBase, "youtube-letterbox-source-plan.json");
  check("planner: plan JSON 파일 생성됨", existsSync(generatedPlanPath));

  let generatedPlan = null;
  if (existsSync(generatedPlanPath)) {
    try { generatedPlan = JSON.parse(readFileSync(generatedPlanPath, "utf8")); } catch {}
  }

  check(
    "생성 plan: schemaVersion === youtube_letterbox_source_plan_v1 + 필수 필드 존재",
    generatedPlan?.schemaVersion === "youtube_letterbox_source_plan_v1" &&
      typeof generatedPlan?.instagramSourcePath === "string" &&
      typeof generatedPlan?.plannedYoutubeSourcePath === "string" && generatedPlan.plannedYoutubeSourcePath.trim() !== "",
  );
  check(
    "생성 plan: instagramSourcePath === sample content-unit manifest의 instagramSourcePath",
    generatedPlan?.instagramSourcePath === sampleContentUnit?.instagramSourcePath,
  );
  check(
    "생성 plan: plannedYoutubeSourcePath가 deterministic(contentId/version 포함, mp4 확장자)",
    typeof generatedPlan?.plannedYoutubeSourcePath === "string" &&
      generatedPlan.plannedYoutubeSourcePath.includes(sampleContentUnit?.contentId) &&
      generatedPlan.plannedYoutubeSourcePath.includes(sampleContentUnit?.version) &&
      generatedPlan.plannedYoutubeSourcePath.endsWith(".mp4"),
  );
  check(
    "생성 plan: inputExists === false (sample instagramSourcePath 의도적 미존재)",
    generatedPlan?.inputExists === false,
  );
  check(
    "생성 plan: outputDirOutsideRepo === true",
    generatedPlan?.outputDirOutsideRepo === true,
  );
  check(
    "생성 plan: willExecuteFfmpeg === false + noLive === true + envSecretValuesAccessedThisRun === false",
    generatedPlan?.willExecuteFfmpeg === false &&
      generatedPlan?.noLive === true &&
      generatedPlan?.envSecretValuesAccessedThisRun === false,
  );
  check(
    "생성 plan: sideEffectCounters 전부 0(ffmpeg/media/api/env/manifest-mutation)",
    generatedPlan?.sideEffectCounters?.ffmpegExecutionCount === 0 &&
      generatedPlan?.sideEffectCounters?.mediaFilesGeneratedCount === 0 &&
      generatedPlan?.sideEffectCounters?.apiCallCount === 0 &&
      generatedPlan?.sideEffectCounters?.envSecretReadCount === 0 &&
      generatedPlan?.sideEffectCounters?.contentUnitManifestMutationCount === 0,
  );
  check(
    "생성 plan: renderProfile 요약(1080x1920 canvas, black background, 864x1536 contentBox, centered:true)",
    generatedPlan?.renderProfile?.canvas === "1080x1920" &&
      generatedPlan?.renderProfile?.backgroundColor === "black" &&
      generatedPlan?.renderProfile?.contentBox === "864x1536" &&
      generatedPlan?.renderProfile?.centered === true,
  );
  check(
    "생성 plan: recommendedNextCommand이 실제 renderer 스크립트를 --dry-run으로 가리킴(실행 아님)",
    typeof generatedPlan?.recommendedNextCommand === "string" &&
      generatedPlan.recommendedNextCommand.includes("create-youtube-shorts-letterbox-variant.mjs") &&
      generatedPlan.recommendedNextCommand.includes("--dry-run") &&
      !generatedPlan.recommendedNextCommand.includes("--run"),
  );
  check(
    "planner stdout에 secret 값 형태 없음",
    !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(planOut),
  );
} finally {
  try { rmSync(tmpBase, { recursive: true, force: true }); } catch {}
}

// ── 6) sample content-unit manifest가 실행 전후로 mutate되지 않음 확인 ───────
const sampleRawAfter = readFileSync(SAMPLE_CONTENT_UNIT_PATH, "utf8");
check("planner 실행 후에도 sample content-unit manifest 바이트가 동일함(mutate 없음)", sampleRawAfter === sampleRawBefore);

// ── 4) owner entrypoint --plan-youtube-letterbox 모드 확인 ──────────────────
const ownerRawSrc = readFileSync(OWNER_ENTRYPOINT_PATH, "utf8");
check("owner entrypoint: --plan-youtube-letterbox MODES 목록에 존재", /"--plan-youtube-letterbox"/.test(ownerRawSrc));
check("owner entrypoint: planYoutubeLetterboxSourceFromContentUnit import 존재", /import\s*\{\s*planYoutubeLetterboxSourceFromContentUnit\s*\}/.test(ownerRawSrc));
check("owner entrypoint: runPlanYoutubeLetterbox 함수 존재", /function runPlanYoutubeLetterbox/.test(ownerRawSrc));

const tmpBase2 = mkdtempSync(path.join(os.tmpdir(), "youtube-letterbox-plan-guard-owner-"));
try {
  let ownerOut;
  try {
    ownerOut = execFileSync(process.execPath, [
      OWNER_ENTRYPOINT_PATH, "--plan-youtube-letterbox", "--content-unit", SAMPLE_CONTENT_UNIT_PATH, "--out-dir", tmpBase2,
    ], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
    check("owner entrypoint --plan-youtube-letterbox 실행 성공(exit 0)", true);
  } catch (e) {
    check("owner entrypoint --plan-youtube-letterbox 실행 성공(exit 0)", false, String(e?.message || e));
    ownerOut = "";
  }
  const ownerPlanPath = path.join(tmpBase2, "youtube-letterbox-source-plan.json");
  check("owner entrypoint --plan-youtube-letterbox: plan JSON 파일 생성됨", existsSync(ownerPlanPath));
  let ownerPlan = null;
  if (existsSync(ownerPlanPath)) {
    try { ownerPlan = JSON.parse(readFileSync(ownerPlanPath, "utf8")); } catch {}
  }
  check(
    "owner entrypoint --plan-youtube-letterbox: willExecuteFfmpeg === false + inputExists === false",
    ownerPlan?.willExecuteFfmpeg === false && ownerPlan?.inputExists === false,
  );
  check(
    "owner entrypoint --plan-youtube-letterbox: stdout에 secret 값 형태 없음",
    !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(ownerOut),
  );
} finally {
  try { rmSync(tmpBase2, { recursive: true, force: true }); } catch {}
}

// ── 5) mutant 방어: 잘못된 인자/경로는 abort ─────────────────────────────────
{
  let threw = false;
  try {
    execFileSync(process.execPath, [
      PLANNER_PATH, "--content-unit", SAMPLE_CONTENT_UNIT_PATH,
      "--out-dir", path.join(ROOT, "scripts", "fixtures", "should-not-be-created-letterbox-plan"),
    ], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
  } catch (e) {
    threw = (e.status ?? 1) !== 0;
  }
  check("planner: --out-dir이 repo 내부면 exit != 0(out-root repo-outside 강제)", threw);
  check(
    "planner: repo 내부 out-dir 시도가 실제로 디렉터리를 만들지 않음",
    !existsSync(path.join(ROOT, "scripts", "fixtures", "should-not-be-created-letterbox-plan")),
  );
}
{
  let threw = false;
  const tmpBase3 = mkdtempSync(path.join(os.tmpdir(), "youtube-letterbox-plan-guard-noarg-"));
  try {
    try {
      execFileSync(process.execPath, [PLANNER_PATH, "--out-dir", tmpBase3], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
    } catch (e) {
      threw = (e.status ?? 1) !== 0;
    }
    check("planner: --content-unit 누락 시 exit != 0", threw);
  } finally {
    try { rmSync(tmpBase3, { recursive: true, force: true }); } catch {}
  }
}

// ── 결과 ──────────────────────────────────────────────────────────────────
console.log(`\n${passes} PASS / ${failures} FAIL`);
if (failures > 0) process.exit(1);
