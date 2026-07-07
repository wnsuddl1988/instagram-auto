#!/usr/bin/env node
/**
 * check-youtube-letterbox-render-execution-wiring-static.mjs
 *
 * task: youtube-letterbox-render-execution-wiring-no-execute-v1
 *
 * scripts/prepare-youtube-letterbox-render-from-plan.mjs 정적 가드.
 * no-live: 레포 내 fixture JSON + preparer 소스 텍스트, 그리고 preparer/owner-entrypoint를
 * child_process로 실행한 stdout/생성 파일(JSON)만 읽는다. 네트워크/env/secret 접근 없음,
 * ffmpeg/ffprobe 실행 없음, media 생성 없음, Instagram/YouTube API/Blob 호출 없음.
 *
 * 검증:
 *  1) preparer 소스: process.env 미접근, fetch/axios/googleapis/@vercel/blob 없음,
 *     ffmpeg/ffprobe/spawnSync/child_process/shell:true 없음, out-dir repo-root 검증 존재,
 *     .money-shorts-local 차단 존재, --run이 실행 전에 항상 abort하는지 소스 레벨로 확인.
 *  2) sample plan JSON fixture parse + 필수 필드/schemaVersion 검증.
 *  3) preparer를 실제로 실행(체크인된 sample fixture만 사용, out-dir은 repo 밖 OS temp)해
 *     생성된 request JSON의 계약 필드가 정확한지 확인.
 *  4) --run 플래그가 preparer/owner entrypoint 모두에서 exit != 0(fail-closed)인지 확인,
 *     이때 request JSON이 생성되지 않았는지도 함께 확인.
 *  5) owner entrypoint --prepare-youtube-letterbox-render 모드가 동일 결과를 산출하는지 확인.
 *  6) mutant 방어: out-dir이 repo 내부면 abort, --plan 누락 시 abort, schemaVersion 불일치 plan은 abort.
 *  7) plan JSON 자체를 mutate하지 않음(실행 전후 원본 fixture 바이트 동일).
 */
import { readFileSync, existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");

const PREPARER_PATH = path.join(ROOT, "scripts", "prepare-youtube-letterbox-render-from-plan.mjs");
const RENDERER_PATH = path.join(ROOT, "scripts", "create-youtube-shorts-letterbox-variant.mjs");
const OWNER_ENTRYPOINT_PATH = path.join(ROOT, "scripts", "run-owner-daily-automation-entrypoint.mjs");
const SAMPLE_PLAN_PATH = path.join(ROOT, "scripts", "fixtures", "youtube_letterbox_render_request_from_plan.sample.v1.json");

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

// ── 1) preparer 소스 정적 검증 ─────────────────────────────────────────────────
const preparerRawSrc = readFileSync(PREPARER_PATH, "utf8");
const preparerCode = stripCommentsAndStrings(preparerRawSrc);

check("preparer: process.env 접근 없음", !/process\.env/.test(preparerCode));
check("preparer: fetch/axios/googleapis/@vercel/blob 호출 없음", !/\bfetch\(|axios|googleapis|@vercel\/blob/.test(preparerCode));
check("preparer: ffmpeg/ffprobe/spawnSync/child_process 미사용(실행 없음)", !/spawnSync|child_process|ffmpeg\s*\(|ffprobe\s*\(|exec[A-Za-z]*\(/i.test(preparerCode) && !/import[^\n]*child_process/.test(preparerRawSrc));
check("preparer: shell:true 없음", !/shell:\s*true/.test(preparerCode));
check("preparer: out-dir repo-root 검증 존재", /REPO_ROOT/.test(preparerCode) && /outDirAbs\.startsWith/.test(preparerCode));
check("preparer: .money-shorts-local 차단 존재", /\.money-shorts-local/.test(preparerRawSrc));
check("preparer: prepareYoutubeLetterboxRenderFromPlan export 존재", /export function prepareYoutubeLetterboxRenderFromPlan/.test(preparerRawSrc));
check("preparer: REQUEST_SCHEMA_VERSION = youtube_letterbox_render_request_v1", /REQUEST_SCHEMA_VERSION\s*=\s*"youtube_letterbox_render_request_v1"/.test(preparerRawSrc));
check("preparer: EXPECTED_PLAN_SCHEMA_VERSION = youtube_letterbox_source_plan_v1", /EXPECTED_PLAN_SCHEMA_VERSION\s*=\s*"youtube_letterbox_source_plan_v1"/.test(preparerRawSrc));
check("preparer: RUN_DISABLED_STATUS export 존재 = YOUTUBE_LETTERBOX_RENDER_RUN_DISABLED_THIS_SLICE", /export const RUN_DISABLED_STATUS\s*=\s*"YOUTUBE_LETTERBOX_RENDER_RUN_DISABLED_THIS_SLICE"/.test(preparerRawSrc));
check("preparer: willExecuteFfmpeg:false를 명시적으로 산출", /willExecuteFfmpeg:\s*false/.test(preparerRawSrc));
check("preparer: plan JSON에 대해 writeFileSync/mutation 호출 없음(읽기 전용)", !/writeFileSync\([^)]*planPath/.test(preparerCode));
check(
  "preparer: --run 플래그는 CLI 진입점에서 request 생성 전에 즉시 abort(exit 1) — isRun 체크가 prepareYoutubeLetterboxRenderFromPlan 호출보다 먼저",
  (() => {
    const isRunAbortIdx = preparerRawSrc.indexOf("ABORT: --run is not executable");
    const callIdx = preparerRawSrc.indexOf("prepareYoutubeLetterboxRenderFromPlan({ planPath })", preparerRawSrc.indexOf("isMainModule"));
    return isRunAbortIdx !== -1 && callIdx !== -1 && isRunAbortIdx < callIdx;
  })(),
);
check("preparer: plan willExecuteFfmpeg !== false면 거부하는 검증 존재", /plan_willExecuteFfmpeg_not_false/.test(preparerRawSrc));
check("preparer: plannedYoutubeSourcePath repo 내부면 거부하는 검증 존재", /plan_plannedYoutubeSourcePath_inside_repo/.test(preparerRawSrc));
check("preparer: plannedYoutubeSourcePath가 .mp4로 끝나지 않으면 거부하는 검증 존재", /plan_plannedYoutubeSourcePath_not_mp4/.test(preparerRawSrc));

// 기존 renderer(create-youtube-shorts-letterbox-variant.mjs)를 이 slice에서 실행 가능하게
// 바꾸지 않았는지 확인 — HANDOFF 명시 금지 사항.
const rendererRawSrc = readFileSync(RENDERER_PATH, "utf8");
check(
  "renderer: 이 slice에서 --run이 여전히 fail-closed(ABORT 메시지 유지)",
  /ABORT: --run is not executable in this slice/.test(rendererRawSrc),
);
check(
  "renderer: preparer가 renderer의 --dry-run 형태를 정확히 참조(futureApprovedCommand에 --run 없음)",
  /--dry-run/.test(preparerRawSrc) && !/futureApprovedCommand[\s\S]{0,200}--run"/.test(preparerRawSrc),
);

// ── 2) sample plan JSON fixture parse ────────────────────────────────────────
let samplePlan;
const sampleRawBefore = readFileSync(SAMPLE_PLAN_PATH, "utf8");
try {
  samplePlan = JSON.parse(sampleRawBefore);
  check("sample plan JSON fixture parse 성공", true);
} catch (e) {
  check("sample plan JSON fixture parse 성공", false, String(e?.message || e));
}
check(
  "sample plan JSON: schemaVersion === youtube_letterbox_source_plan_v1 + willExecuteFfmpeg === false",
  samplePlan?.schemaVersion === "youtube_letterbox_source_plan_v1" && samplePlan?.willExecuteFfmpeg === false,
);
check(
  "sample plan JSON: instagramSourcePath/plannedYoutubeSourcePath 존재 + mp4 확장자",
  typeof samplePlan?.instagramSourcePath === "string" &&
    typeof samplePlan?.plannedYoutubeSourcePath === "string" &&
    samplePlan.plannedYoutubeSourcePath.toLowerCase().endsWith(".mp4"),
);
check(
  "sample plan JSON: instagramSourcePath가 의도적으로 미존재(inputExists:false 경로 검증용)",
  typeof samplePlan?.instagramSourcePath === "string" && !existsSync(samplePlan.instagramSourcePath),
);
check("sample fixture에 secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(sampleRawBefore));

// ── 3) preparer 실행: 체크인 sample fixture만 사용, out-dir은 OS temp(repo 밖) ──
const tmpBase = mkdtempSync(path.join(os.tmpdir(), "youtube-letterbox-render-wiring-guard-"));
try {
  let prepOut;
  try {
    prepOut = execFileSync(process.execPath, [
      PREPARER_PATH, "--plan", SAMPLE_PLAN_PATH, "--out-dir", tmpBase,
    ], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
    check("preparer --plan 실행 성공(sample fixture)", true);
  } catch (e) {
    check("preparer --plan 실행 성공(sample fixture)", false, String(e?.message || e));
    prepOut = "";
  }

  const generatedRequestPath = path.join(tmpBase, "youtube-letterbox-render-request.json");
  check("preparer: request JSON 파일 생성됨", existsSync(generatedRequestPath));

  let generatedRequest = null;
  if (existsSync(generatedRequestPath)) {
    try { generatedRequest = JSON.parse(readFileSync(generatedRequestPath, "utf8")); } catch {}
  }

  check(
    "생성 request: schemaVersion === youtube_letterbox_render_request_v1 + 필수 필드 존재",
    generatedRequest?.schemaVersion === "youtube_letterbox_render_request_v1" &&
      typeof generatedRequest?.instagramSourcePath === "string" &&
      typeof generatedRequest?.plannedYoutubeSourcePath === "string" && generatedRequest.plannedYoutubeSourcePath.trim() !== "",
  );
  check(
    "생성 request: instagramSourcePath / plannedYoutubeSourcePath === sample plan의 값과 동일",
    generatedRequest?.instagramSourcePath === samplePlan?.instagramSourcePath &&
      generatedRequest?.plannedYoutubeSourcePath === samplePlan?.plannedYoutubeSourcePath,
  );
  check(
    "생성 request: inputExists === false (sample instagramSourcePath 의도적 미존재)",
    generatedRequest?.inputExists === false,
  );
  check(
    "생성 request: willExecuteFfmpeg === false + executed === false + noLive === true + envSecretValuesAccessedThisRun === false",
    generatedRequest?.willExecuteFfmpeg === false &&
      generatedRequest?.executed === false &&
      generatedRequest?.noLive === true &&
      generatedRequest?.envSecretValuesAccessedThisRun === false,
  );
  check(
    "생성 request: runStatus === YOUTUBE_LETTERBOX_RENDER_RUN_DISABLED_THIS_SLICE",
    generatedRequest?.runStatus === "YOUTUBE_LETTERBOX_RENDER_RUN_DISABLED_THIS_SLICE",
  );
  check(
    "생성 request: sideEffectCounters 전부 0(ffmpeg/media/api/env/plan-mutation)",
    generatedRequest?.sideEffectCounters?.ffmpegExecutionCount === 0 &&
      generatedRequest?.sideEffectCounters?.mediaFilesGeneratedCount === 0 &&
      generatedRequest?.sideEffectCounters?.apiCallCount === 0 &&
      generatedRequest?.sideEffectCounters?.envSecretReadCount === 0 &&
      generatedRequest?.sideEffectCounters?.planMutationCount === 0,
  );
  check(
    "생성 request: futureApprovedCommand이 exact expected 명령과 일치(--input/--output/--dry-run, --run 아님)",
    generatedRequest?.futureApprovedCommand ===
      `node scripts/create-youtube-shorts-letterbox-variant.mjs --input "${samplePlan?.instagramSourcePath}" --output "${samplePlan?.plannedYoutubeSourcePath}" --dry-run`,
  );
  check(
    "preparer stdout에 secret 값 형태 없음",
    !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(prepOut),
  );
} finally {
  try { rmSync(tmpBase, { recursive: true, force: true }); } catch {}
}

// ── 4) --run 플래그는 preparer/owner entrypoint 모두에서 fail-closed ──────────
{
  const tmpRunDir = mkdtempSync(path.join(os.tmpdir(), "youtube-letterbox-render-wiring-guard-run-"));
  try {
    let threw = false;
    try {
      execFileSync(process.execPath, [PREPARER_PATH, "--plan", SAMPLE_PLAN_PATH, "--out-dir", tmpRunDir, "--run"], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
    } catch (e) {
      threw = (e.status ?? 1) !== 0;
    }
    check("preparer: --run 플래그는 exit != 0(fail-closed)", threw);
    check(
      "preparer: --run 시도 시 request JSON이 생성되지 않음",
      !existsSync(path.join(tmpRunDir, "youtube-letterbox-render-request.json")),
    );
  } finally {
    try { rmSync(tmpRunDir, { recursive: true, force: true }); } catch {}
  }
}

// ── 6) sample plan JSON이 실행 전후로 mutate되지 않음 확인 ───────────────────
const sampleRawAfter = readFileSync(SAMPLE_PLAN_PATH, "utf8");
check("preparer 실행 후에도 sample plan JSON 바이트가 동일함(mutate 없음)", sampleRawAfter === sampleRawBefore);

// ── 5) owner entrypoint --prepare-youtube-letterbox-render 모드 확인 ────────
const ownerRawSrc = readFileSync(OWNER_ENTRYPOINT_PATH, "utf8");
check("owner entrypoint: --prepare-youtube-letterbox-render MODES 목록에 존재", /"--prepare-youtube-letterbox-render"/.test(ownerRawSrc));
check("owner entrypoint: prepareYoutubeLetterboxRenderFromPlan import 존재", /import\s*\{\s*prepareYoutubeLetterboxRenderFromPlan/.test(ownerRawSrc));
check("owner entrypoint: runPrepareYoutubeLetterboxRender 함수 존재", /function runPrepareYoutubeLetterboxRender/.test(ownerRawSrc));
check(
  "owner entrypoint: runPrepareYoutubeLetterboxRender에서 --run이 preparer 호출 전에 즉시 abort",
  (() => {
    const fnStart = ownerRawSrc.indexOf("function runPrepareYoutubeLetterboxRender");
    const fnEnd = ownerRawSrc.indexOf("\n}\n", fnStart);
    const fnBody = ownerRawSrc.slice(fnStart, fnEnd === -1 ? undefined : fnEnd);
    const abortIdx = fnBody.indexOf("ABORT: --run is not executable");
    const callIdx = fnBody.indexOf("prepareYoutubeLetterboxRenderFromPlan({ planPath })");
    return abortIdx !== -1 && callIdx !== -1 && abortIdx < callIdx;
  })(),
);

const tmpBase2 = mkdtempSync(path.join(os.tmpdir(), "youtube-letterbox-render-wiring-guard-owner-"));
try {
  let ownerOut;
  try {
    ownerOut = execFileSync(process.execPath, [
      OWNER_ENTRYPOINT_PATH, "--prepare-youtube-letterbox-render", "--plan", SAMPLE_PLAN_PATH, "--out-dir", tmpBase2,
    ], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
    check("owner entrypoint --prepare-youtube-letterbox-render 실행 성공(exit 0)", true);
  } catch (e) {
    check("owner entrypoint --prepare-youtube-letterbox-render 실행 성공(exit 0)", false, String(e?.message || e));
    ownerOut = "";
  }
  const ownerRequestPath = path.join(tmpBase2, "youtube-letterbox-render-request.json");
  check("owner entrypoint --prepare-youtube-letterbox-render: request JSON 파일 생성됨", existsSync(ownerRequestPath));
  let ownerRequest = null;
  if (existsSync(ownerRequestPath)) {
    try { ownerRequest = JSON.parse(readFileSync(ownerRequestPath, "utf8")); } catch {}
  }
  check(
    "owner entrypoint --prepare-youtube-letterbox-render: willExecuteFfmpeg === false + inputExists === false",
    ownerRequest?.willExecuteFfmpeg === false && ownerRequest?.inputExists === false,
  );
  check(
    "owner entrypoint --prepare-youtube-letterbox-render: stdout에 secret 값 형태 없음",
    !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(ownerOut),
  );

  // owner entrypoint에서도 --run 플래그가 fail-closed인지 확인.
  const tmpRunDir2 = mkdtempSync(path.join(os.tmpdir(), "youtube-letterbox-render-wiring-guard-owner-run-"));
  try {
    let ownerRunThrew = false;
    try {
      execFileSync(process.execPath, [
        OWNER_ENTRYPOINT_PATH, "--prepare-youtube-letterbox-render", "--plan", SAMPLE_PLAN_PATH, "--out-dir", tmpRunDir2, "--run",
      ], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
    } catch (e) {
      ownerRunThrew = (e.status ?? 1) !== 0;
    }
    check("owner entrypoint --prepare-youtube-letterbox-render --run: exit != 0(fail-closed)", ownerRunThrew);
    check(
      "owner entrypoint --prepare-youtube-letterbox-render --run: request JSON이 생성되지 않음",
      !existsSync(path.join(tmpRunDir2, "youtube-letterbox-render-request.json")),
    );
  } finally {
    try { rmSync(tmpRunDir2, { recursive: true, force: true }); } catch {}
  }
} finally {
  try { rmSync(tmpBase2, { recursive: true, force: true }); } catch {}
}

// ── 6) mutant 방어: 잘못된 인자/경로/schemaVersion은 abort ───────────────────
{
  let threw = false;
  try {
    execFileSync(process.execPath, [
      PREPARER_PATH, "--plan", SAMPLE_PLAN_PATH,
      "--out-dir", path.join(ROOT, "scripts", "fixtures", "should-not-be-created-render-request"),
    ], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
  } catch (e) {
    threw = (e.status ?? 1) !== 0;
  }
  check("preparer: --out-dir이 repo 내부면 exit != 0(out-root repo-outside 강제)", threw);
  check(
    "preparer: repo 내부 out-dir 시도가 실제로 디렉터리를 만들지 않음",
    !existsSync(path.join(ROOT, "scripts", "fixtures", "should-not-be-created-render-request")),
  );
}
{
  let threw = false;
  const tmpBase3 = mkdtempSync(path.join(os.tmpdir(), "youtube-letterbox-render-wiring-guard-noarg-"));
  try {
    try {
      execFileSync(process.execPath, [PREPARER_PATH, "--out-dir", tmpBase3], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
    } catch (e) {
      threw = (e.status ?? 1) !== 0;
    }
    check("preparer: --plan 누락 시 exit != 0", threw);
  } finally {
    try { rmSync(tmpBase3, { recursive: true, force: true }); } catch {}
  }
}
{
  // schemaVersion이 잘못된 plan JSON은 preparer가 거부해야 한다(guard-internal temp fixture만 사용, 체크인 없음).
  const tmpBadPlanDir = mkdtempSync(path.join(os.tmpdir(), "youtube-letterbox-render-wiring-guard-badplan-"));
  const tmpOutDir = mkdtempSync(path.join(os.tmpdir(), "youtube-letterbox-render-wiring-guard-badplan-out-"));
  try {
    const badPlan = { ...samplePlan, schemaVersion: "unexpected_schema_v0" };
    const badPlanPath = path.join(tmpBadPlanDir, "bad-plan.json");
    writeFileSync(badPlanPath, JSON.stringify(badPlan, null, 2), "utf-8");
    let threw = false;
    try {
      execFileSync(process.execPath, [PREPARER_PATH, "--plan", badPlanPath, "--out-dir", tmpOutDir], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
    } catch (e) {
      threw = (e.status ?? 1) !== 0;
    }
    check("preparer: schemaVersion 불일치 plan은 exit != 0(fail-closed)", threw);
    check(
      "preparer: schemaVersion 불일치 plan 시도 시 request JSON이 생성되지 않음",
      !existsSync(path.join(tmpOutDir, "youtube-letterbox-render-request.json")),
    );
  } finally {
    try { rmSync(tmpBadPlanDir, { recursive: true, force: true }); } catch {}
    try { rmSync(tmpOutDir, { recursive: true, force: true }); } catch {}
  }
}

// ── 결과 ──────────────────────────────────────────────────────────────────
console.log(`\n${passes} PASS / ${failures} FAIL`);
if (failures > 0) process.exit(1);
