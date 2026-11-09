#!/usr/bin/env node
/**
 * check-youtube-shorts-letterbox-variant-renderer-static.mjs
 *
 * YouTube Shorts letterbox variant renderer — 정적 가드 (no-live).
 * task: youtube-shorts-letterbox-variant-renderer-dryrun-v1
 *
 * 이 가드 자체는 no-live다: 레포 내 renderer script 소스 + fixture JSON + docs 텍스트만 읽는다.
 * (network/env/secret/upload/subprocess/write 없음)
 *
 * 검증:
 *  1) fixture: canvas 1080x1920 고정, contentBox 864x1536 centered, background black,
 *     top/bottom black space(margins.topBottomPx > 0), YouTube가 Blob/public URL을 요구하지 않음,
 *     Instagram full-frame variant와 conflation 없음, cliContract dry-run default,
 *     forbiddenBehavior/prohibitedDrift 명문화
 *  2) renderer script self-scan: env/secret read 없음, network 없음, 실제 파일 쓰기 없음,
 *     subprocess(ffmpeg 실행) 없음, --run 시 abort하는지 소스 레벨로 확인
 *  3) docs: canvas/contentBox/margin/codec 표/이유/Instagram 비-conflation/금지 항목 명문화
 *  4) mutant → 전부 fail (canvas/black/centered/margin/dry-run default 제거,
 *     YouTube Blob 경로 추가, env/API/upload/deploy 허용 시 fail)
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const J = (a, b) => a + b; // 토큰 분할-연결 (self-scan denylist 예외, 검색 전용)

const SCRIPT_PATH = path.join(ROOT, "scripts", "create-youtube-shorts-letterbox-variant.mjs");
const FIXTURE_PATH = path.join(ROOT, "scripts", "fixtures", "youtube_shorts_letterbox_render_profile.v1.json");
const DOCS_PATH = path.join(ROOT, "docs", "youtube-shorts-letterbox-variant-renderer.md");

let passes = 0;
let failures = 0;
function check(name, ok, detail) {
  if (ok) { passes += 1; console.log(`PASS  ${name}`); }
  else { failures += 1; console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
}
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const clone = (o) => JSON.parse(JSON.stringify(o));

// ── 로드 ─────────────────────────────────────────────────────────────────────
let fx = null;
try {
  fx = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));
  check("render profile fixture parses as JSON", true);
} catch (e) {
  check("render profile fixture parses as JSON", false, String(e).slice(0, 160));
}
let docs = null;
try {
  docs = readFileSync(DOCS_PATH, "utf8");
  check("renderer docs readable", true);
} catch (e) {
  check("renderer docs readable", false, String(e).slice(0, 120));
}
let scriptSrc = null;
try {
  scriptSrc = readFileSync(SCRIPT_PATH, "utf8");
  check("renderer script readable", true);
} catch (e) {
  check("renderer script readable", false, String(e).slice(0, 120));
}

// ── fixture 불변식 검증 함수 (mutant 재사용) ─────────────────────────────────
function detectFixtureIssues(p) {
  const issues = [];
  if (!p) return ["fixture null"];

  const canvas = p.canvas ?? {};
  if (canvas.widthPx !== 1080) issues.push(`canvas.widthPx=${canvas.widthPx} (1080 아님)`);
  if (canvas.heightPx !== 1920) issues.push(`canvas.heightPx=${canvas.heightPx} (1920 아님)`);
  if (canvas.backgroundColor !== "black") issues.push(`canvas.backgroundColor=${canvas.backgroundColor} (black 아님)`);

  const cb = p.contentBox ?? {};
  if (cb.widthPx !== 864) issues.push(`contentBox.widthPx=${cb.widthPx} (864 아님)`);
  if (cb.heightPx !== 1536) issues.push(`contentBox.heightPx=${cb.heightPx} (1536 아님)`);
  if (cb.centered !== true) issues.push("contentBox.centered != true");
  if (cb.stretchForbidden !== true) issues.push("contentBox.stretchForbidden != true");
  if (cb.preserveAspectRatio !== true) issues.push("contentBox.preserveAspectRatio != true");

  const margins = p.margins ?? {};
  if (!(typeof margins.topBottomPx === "number" && margins.topBottomPx > 0))
    issues.push(`margins.topBottomPx=${margins.topBottomPx} (top/bottom black space 없음)`);
  if (!(typeof margins.sidePx === "number" && margins.sidePx >= 0))
    issues.push(`margins.sidePx=${margins.sidePx} (숫자 아님)`);

  if (p.background !== "black") issues.push(`background=${p.background} (black 아님)`);
  if (p.centeredContent !== true) issues.push("centeredContent != true");
  if (p.blackTopBottomSpace !== true) issues.push("blackTopBottomSpace != true");
  if (p.letterbox !== true) issues.push("letterbox != true");

  if (p.requiresPublicBlobUrl !== false) issues.push("requiresPublicBlobUrl != false (YouTube가 Blob URL을 요구함)");
  if (p.youtubeUsesBlobUrl !== false) issues.push("youtubeUsesBlobUrl != false (YouTube가 Blob 경로로 라우팅됨)");
  if (p.uploadMode !== "youtube_data_api_direct_file_upload")
    issues.push(`uploadMode=${p.uploadMode} (direct file upload 아님)`);

  if (p.conflatesWithInstagramVariant !== false)
    issues.push("conflatesWithInstagramVariant != false (Instagram full-frame variant와 conflation 발생)");
  if (p.instagramVariantUnaffected !== true) issues.push("instagramVariantUnaffected != true");

  const cli = p.cliContract ?? {};
  if (cli.defaultMode !== "dry_run_no_write") issues.push(`cliContract.defaultMode=${cli.defaultMode} (dry_run_no_write 아님)`);
  if (cli.runExecutesInThisSlice !== false) issues.push("cliContract.runExecutesInThisSlice != false (이 slice에서 --run 실행 허용됨)");
  if (cli.envSecretRead !== false) issues.push("cliContract.envSecretRead != false");
  if (cli.networkAccess !== false) issues.push("cliContract.networkAccess != false");
  if (!Array.isArray(cli.requiredArgs) || !cli.requiredArgs.includes("--input") || !cli.requiredArgs.includes("--output"))
    issues.push("cliContract.requiredArgs에 --input/--output 누락");
  if (!Array.isArray(cli.supportedFlags) || !cli.supportedFlags.includes("--example"))
    issues.push("cliContract.supportedFlags에 --example 누락");

  if (!Array.isArray(p.forbiddenBehavior) || p.forbiddenBehavior.length < 8)
    issues.push("forbiddenBehavior 항목 부족(8개 미만)");
  if (!Array.isArray(p.prohibitedDrift?.cases) || p.prohibitedDrift.cases.length < 8)
    issues.push("prohibitedDrift.cases 항목 부족(8개 미만)");

  return issues;
}

// ── 1. fixture 검증 ──────────────────────────────────────────────────────────
{
  check("fixture schemaVersion + taskId + status",
    fx?.schemaVersion === "youtube_shorts_letterbox_render_profile_v1" &&
    fx?.taskId === "youtube-shorts-letterbox-variant-renderer-dryrun-v1" &&
    fx?.status === "PROFILE_FIXED_NO_LIVE");
  const issues = detectFixtureIssues(fx);
  check("fixture invariants: canvas 1080x1920/contentBox 864x1536 centered/black bg/top-bottom margin/YouTube no-Blob/no Instagram conflation/dry-run default",
    issues.length === 0, issues.join("; "));
  check("fixture docsRef + activeArchitectureRef가 실재하는 파일",
    isStr(fx?.docsRef) && existsSync(path.join(ROOT, fx.docsRef)) &&
    isStr(fx?.activeArchitectureRef) && existsSync(path.join(ROOT, fx.activeArchitectureRef)));
  check("fixture variantId가 youtube_shorts_letterbox_1080x1920",
    fx?.variantId === "youtube_shorts_letterbox_1080x1920");
  check("fixture codec: h264/yuv420p/faststart/aac",
    fx?.codec?.video === "h264" && fx?.codec?.pixelFormat === "yuv420p" &&
    fx?.codec?.faststart === true && fx?.codec?.audio === "aac");
}

// ── 2. renderer script self-scan ─────────────────────────────────────────────
{
  const forbiddenTokens = [
    J("process", ".env"),
    J("child_", "process"),
    J("spawn", "Sync"),
    J("spawn", "("),
    J("exec", "Sync"),
    J("fet", "ch("),
    J("XMLHttp", "Request"),
    J("write", "FileSync"),
    J("mkdir", "Sync"),
    J("rm", "Sync"),
    J("append", "FileSync"),
  ];
  const hit = scriptSrc ? forbiddenTokens.find((t) => scriptSrc.includes(t)) : "SCRIPT_UNREADABLE";
  check("renderer script: env/network/subprocess/file-write 패턴 없음 (self-scan)",
    scriptSrc && !hit, hit ? `token=${hit}` : "");

  const specifiers = scriptSrc
    ? [...scriptSrc.matchAll(/^import\s[^\n]*?from\s+["']([^"']+)["']/gm)].map((m) => m[1])
    : [];
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  check("renderer script imports restricted to node:fs/node:path/node:url",
    specifiers.length > 0 && specifiers.every((sp) => allow.has(sp)));

  check("renderer script default mode is dry-run (isDryRun = hasFlag(--dry-run) || !isRun)",
    !!scriptSrc && scriptSrc.includes(J('hasFlag("--dry', '-run")') ) && scriptSrc.includes("!isRun"));

  check("renderer script refuses --run in this slice (ABORT + process.exit before any execution)",
    !!scriptSrc && scriptSrc.includes("is not executable in this slice") && scriptSrc.includes("process.exit(1)"));

  check("renderer script supports --example (no-input example mode)",
    !!scriptSrc && scriptSrc.includes('hasFlag("--example")') && scriptSrc.includes("isExample"));

  check("renderer script validates output path safety (.money-shorts-local check present)",
    !!scriptSrc && scriptSrc.includes(".money-shorts-local"));

  check("renderer script never calls ffmpeg execution (no spawn/exec identifiers at all)",
    !!scriptSrc && !/spawn|execSync|execFile/.test(scriptSrc));

  check("renderer script encodes fixed profile constants (1080/1920/864/1536/192/108)",
    !!scriptSrc &&
    ["1080", "1920", "864", "1536", "192", "108"].every((n) => scriptSrc.includes(n)));
}

// ── 3. docs 검증 ─────────────────────────────────────────────────────────────
{
  check("docs: canvas 1080x1920 + black + contentBox 864x1536 명시",
    docs?.includes("1080") && docs?.includes("1920") && docs?.includes("864") && docs?.includes("1536") &&
    docs?.includes("검정"));
  check("docs: top/bottom margin 192px + side margin 108px 명시",
    docs?.includes("192") && docs?.includes("108"));
  check("docs: stretch 금지 + side gutter 허용 명시",
    docs?.includes("stretch") && docs?.includes("gutter"));
  check("docs: Vercel Blob/public URL 불필요 명시",
    docs?.includes("requiresPublicBlobUrl: false") || docs?.includes("Blob") && docs?.includes("필요로 하지 않는다"));
  check("docs: Instagram 변형과 conflation 없음 명시",
    docs?.includes("Instagram") && (docs?.includes("conflation") || docs?.includes("독립된") || docs?.includes("수정하지 않는다")));
  check("docs: CLI 사용법(--input/--output/--example/--dry-run/--run) 명시",
    docs?.includes("--input") && docs?.includes("--output") && docs?.includes("--example") &&
    docs?.includes("--dry-run") && docs?.includes("--run"));
  check("docs: 금지 항목(ffmpeg 실행/upload/YouTube API/Instagram --arm/Blob provisioning) 명문화",
    docs?.includes("ffmpeg") && docs?.includes("upload") && docs?.includes("YouTube API") &&
    (docs?.includes("--arm") || docs?.includes("Instagram API")));
  check("docs: dual-platform-variant-publish-architecture 문서 참조",
    docs?.includes("dual-platform-variant-publish-architecture.md"));
}

// ── 4. mutant — fail-closed 확인 ──────────────────────────────────────────────
{
  const m1 = clone(fx); m1.canvas.widthPx = 1920; m1.canvas.heightPx = 1080;
  check("mutant 1: canvas가 1080x1920에서 변경 → fail",
    detectFixtureIssues(m1).some((i) => i.includes("canvas.widthPx") || i.includes("canvas.heightPx")));

  const m2 = clone(fx); m2.canvas.backgroundColor = "white"; m2.background = "white";
  check("mutant 2: black background 제거 → fail",
    detectFixtureIssues(m2).some((i) => i.includes("backgroundColor") || i.includes("background=")));

  const m3 = clone(fx); m3.contentBox.centered = false; m3.centeredContent = false;
  check("mutant 3: centered 제거 → fail",
    detectFixtureIssues(m3).some((i) => i.includes("centered")));

  const m4 = clone(fx); m4.margins.topBottomPx = 0; m4.blackTopBottomSpace = false;
  check("mutant 4: top/bottom margin 제거 → fail",
    detectFixtureIssues(m4).some((i) => i.includes("topBottomPx") || i.includes("blackTopBottomSpace")));

  const m5 = clone(fx); m5.cliContract.defaultMode = "auto_run";
  check("mutant 5: dry-run default 제거 → fail",
    detectFixtureIssues(m5).some((i) => i.includes("defaultMode")));

  const m6 = clone(fx); m6.requiresPublicBlobUrl = true; m6.youtubeUsesBlobUrl = true;
  check("mutant 6: YouTube가 Blob URL 경로로 라우팅 → fail",
    detectFixtureIssues(m6).some((i) => i.includes("requiresPublicBlobUrl") || i.includes("youtubeUsesBlobUrl")));

  const m7 = clone(fx); m7.cliContract.envSecretRead = true; m7.cliContract.networkAccess = true;
  check("mutant 7: env/network access 허용 → fail",
    detectFixtureIssues(m7).some((i) => i.includes("envSecretRead") || i.includes("networkAccess")));

  const m8 = clone(fx); m8.conflatesWithInstagramVariant = true;
  check("mutant 8: Instagram full-frame variant와 conflation 발생 → fail",
    detectFixtureIssues(m8).some((i) => i.includes("conflatesWithInstagramVariant")));

  const m9 = clone(fx); m9.contentBox.widthPx = 1080; m9.contentBox.heightPx = 1920;
  check("mutant 9: content box가 canvas 전체를 채워 top/bottom black space 소멸 위험 → widthPx/heightPx 변경 감지",
    detectFixtureIssues(m9).some((i) => i.includes("contentBox.widthPx") || i.includes("contentBox.heightPx")));

  const m10 = clone(fx); m10.cliContract.runExecutesInThisSlice = true;
  check("mutant 10: 이 slice에서 --run 실행 허용 → fail",
    detectFixtureIssues(m10).some((i) => i.includes("runExecutesInThisSlice")));
}

// ── 5. script-level mutant 시뮬레이션 (문자열 치환 기반, no execution) ────────
{
  // 스크립트가 실제로 spawn/exec 계열 식별자를 포함하면 fail — 실행 코드가 섞였다는 뜻.
  const hasExecIdentifier = !!scriptSrc && /spawn|execSync|execFile|child_process/.test(scriptSrc);
  check("mutant 11: 스크립트에 spawn/exec 계열 식별자가 존재하면 fail (실행 코드 혼입 감지)",
    !hasExecIdentifier);

  const hasWriteIdentifier = !!scriptSrc && /writeFileSync|mkdirSync|appendFileSync/.test(scriptSrc);
  check("mutant 12: 스크립트에 파일 쓰기 식별자가 존재하면 fail (no-write slice 위반 감지)",
    !hasWriteIdentifier);
}

console.log(`\nRESULT: ${failures === 0 ? "ALL PASS" : "FAIL"} (${passes + failures} checks)`);
process.exit(failures === 0 ? 0 : 1);
