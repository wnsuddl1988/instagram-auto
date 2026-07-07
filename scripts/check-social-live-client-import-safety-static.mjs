#!/usr/bin/env node
/**
 * check-social-live-client-import-safety-static.mjs
 *
 * social live client(import-safe + explicit credential injection) 정적 가드.
 * task: social-live-client-credential-injection-no-execute-v1
 *
 * 이 가드는 no-live/no-execute다: 레포 내 소스 텍스트만 읽는다.
 * (network/env/secret 접근 없음, Instagram/YouTube/OAuth/upload 호출 없음)
 *
 * 검증 대상:
 *  - lib/instagram.ts, lib/youtube.ts에 top-level(module-scope) process.env read가 없다.
 *    (process.env 사용은 함수 body 내부, 즉 brace depth > 0에서만 허용.)
 *  - explicit credential injection 함수 export가 존재한다:
 *    uploadInstagramReelWithCredentials / uploadYouTubeShortsWithCredentials.
 *  - 기존 호환 wrapper export가 유지된다:
 *    uploadInstagramReel / uploadYouTubeShorts / getYouTubeAuthUrl.
 *  - YouTube가 YOUTUBE_ACCESS_TOKEN을 required env로 되살리지 않는다.
 *  - top-level OAuth client(new google.auth.OAuth2(...))를 module scope에서 생성하지 않는다.
 *  - secret 값 형태(EAA/ya29/토큰 prefix)나 .env.local 직접 접근 문자열이 없다.
 *  - dual-platform runner가 새 explicit credential 함수 ref를 가리킨다.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");

const IG_PATH = path.join(ROOT, "lib", "instagram.ts");
const YT_PATH = path.join(ROOT, "lib", "youtube.ts");
const RUNNER_PATH = path.join(ROOT, "scripts", "run-dual-platform-final-publish-orchestrator.mjs");

let passes = 0;
let failures = 0;
function check(name, ok, detail) {
  if (ok) { passes += 1; console.log(`PASS  ${name}`); }
  else { failures += 1; console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
}

const igSrc = existsSync(IG_PATH) ? readFileSync(IG_PATH, "utf8") : "";
const ytSrc = existsSync(YT_PATH) ? readFileSync(YT_PATH, "utf8") : "";
const runnerSrc = existsSync(RUNNER_PATH) ? readFileSync(RUNNER_PATH, "utf8") : "";

check("lib/instagram.ts 존재", igSrc.length > 0);
check("lib/youtube.ts 존재", ytSrc.length > 0);

/**
 * 소스에서 주석/문자열 리터럴을 제거한 "코드 문자열"을 만들되, 각 코드 문자마다
 * 그 지점의 brace depth를 함께 기록한다(문자 단위). 한 줄에 여는 brace와
 * 그 안의 코드가 같이 있어도 정확히 판별하기 위해 라인 단위가 아니라 문자 단위로 추적한다.
 *
 * 반환: { code: string, depthAt: number[] } — code[k]의 depth는 depthAt[k].
 * depth는 "해당 문자가 놓인 시점"의 depth이며, 여는 `{`는 그 뒤 코드부터 depth를 올린다.
 */
function analyzeSource(src) {
  let depth = 0;
  let inLineComment = false;
  let inBlockComment = false;
  let strCh = null; // ' " `
  let code = "";
  const depthAt = [];

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1];

    if (inLineComment) { if (ch === "\n") inLineComment = false; continue; }
    if (inBlockComment) { if (ch === "*" && next === "/") { inBlockComment = false; i++; } continue; }
    if (strCh) {
      if (ch === "\\") { i++; continue; }
      if (ch === strCh) strCh = null;
      continue; // 문자열 내부 문자는 코드로 취급하지 않는다.
    }

    if (ch === "/" && next === "/") { inLineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { inBlockComment = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { strCh = ch; continue; }

    if (ch === "{") { depth++; continue; }
    if (ch === "}") { depth = Math.max(0, depth - 1); continue; }

    if (!/\s/.test(ch)) { code += ch; depthAt.push(depth); }
  }

  return { code, depthAt };
}

/**
 * top-level(module scope, brace depth 0)에서 needle(코드) 문자열이 등장하는지 검사.
 * 주석/문자열 리터럴은 제거된 상태에서, needle의 첫 문자가 depth 0에 있는 경우만 top-level로 본다.
 */
function hasTopLevelCode(src, needle) {
  const { code, depthAt } = analyzeSource(src);
  const target = needle.replace(/\s+/g, "");
  let from = 0;
  for (;;) {
    const idx = code.indexOf(target, from);
    if (idx === -1) return false;
    if (depthAt[idx] === 0) return true; // needle 시작 문자가 module scope
    from = idx + 1;
  }
}

// ── 1) top-level process.env read 없음 ────────────────────────────────────────
check(
  "lib/instagram.ts: top-level(module scope)에 process.env read 없음(import-safe)",
  !hasTopLevelCode(igSrc, "process.env"),
);
check(
  "lib/youtube.ts: top-level(module scope)에 process.env read 없음(import-safe)",
  !hasTopLevelCode(ytSrc, "process.env"),
);

// ── 2) top-level OAuth client 생성 없음 (youtube) ─────────────────────────────
check(
  "lib/youtube.ts: top-level에 new google.auth.OAuth2( 생성 없음",
  !hasTopLevelCode(ytSrc, "newgoogle.auth.OAuth2("),
);

// ── 3) explicit credential injection 함수 export 존재 ─────────────────────────
check(
  "lib/instagram.ts: uploadInstagramReelWithCredentials export 존재",
  /export\s+(async\s+)?function\s+uploadInstagramReelWithCredentials\b/.test(igSrc),
);
check(
  "lib/youtube.ts: uploadYouTubeShortsWithCredentials export 존재",
  /export\s+(async\s+)?function\s+uploadYouTubeShortsWithCredentials\b/.test(ytSrc),
);
check(
  "lib/instagram.ts: resolveInstagramCredentialsFromEnv(호출 시점 env resolution) export 존재",
  /export\s+function\s+resolveInstagramCredentialsFromEnv\b/.test(igSrc),
);
check(
  "lib/youtube.ts: createYouTubeOAuthClient(팩토리) export 존재",
  /export\s+function\s+createYouTubeOAuthClient\b/.test(ytSrc),
);

// ── 4) 기존 호환 wrapper export 유지 ──────────────────────────────────────────
check(
  "lib/instagram.ts: 기존 uploadInstagramReel export 유지(호환성)",
  /export\s+(async\s+)?function\s+uploadInstagramReel\b/.test(igSrc),
);
check(
  "lib/youtube.ts: 기존 uploadYouTubeShorts export 유지(호환성)",
  /export\s+(async\s+)?function\s+uploadYouTubeShorts\b/.test(ytSrc),
);
check(
  "lib/youtube.ts: 기존 getYouTubeAuthUrl export 유지(호환성)",
  /export\s+function\s+getYouTubeAuthUrl\b/.test(ytSrc),
);

// ── 5) YOUTUBE_ACCESS_TOKEN을 required env로 되살리지 않음 ─────────────────────
// resolveYouTubeOAuthCredentialsFromEnv가 CLIENT_ID/CLIENT_SECRET만 읽어야 한다.
check(
  "lib/youtube.ts: YOUTUBE_ACCESS_TOKEN을 process.env로 읽지 않음(required env 아님)",
  !/process\.env\.YOUTUBE_ACCESS_TOKEN/.test(ytSrc),
);
check(
  "lib/youtube.ts: YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET을 호출 시점 env로 읽음",
  /process\.env\.YOUTUBE_CLIENT_ID/.test(ytSrc) && /process\.env\.YOUTUBE_CLIENT_SECRET/.test(ytSrc),
);
check(
  "lib/instagram.ts: INSTAGRAM_BUSINESS_ACCOUNT_ID / INSTAGRAM_ACCESS_TOKEN을 호출 시점 env로 읽음",
  /process\.env\.INSTAGRAM_BUSINESS_ACCOUNT_ID/.test(igSrc) && /process\.env\.INSTAGRAM_ACCESS_TOKEN/.test(igSrc),
);

// ── 6) secret 값 형태 / .env.local 직접 접근 없음 ─────────────────────────────
const secretValuePattern = /(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/;
check("lib/instagram.ts: secret 값 형태(EAA/ya29/blob token) 없음", !secretValuePattern.test(igSrc));
check("lib/youtube.ts: secret 값 형태(EAA/ya29/blob token) 없음", !secretValuePattern.test(ytSrc));
check("lib/instagram.ts: .env.local 직접 접근 문자열 없음", !/\.env\.local/.test(igSrc));
check("lib/youtube.ts: .env.local 직접 접근 문자열 없음", !/\.env\.local/.test(ytSrc));

// ── 7) 에러 메시지에 access token을 URL query로 노출하지 않음 (instagram) ──────
// 폴링 URL에 access_token=${...} 쿼리를 넣지 않고 Authorization 헤더를 쓴다.
check(
  "lib/instagram.ts: 폴링 URL query에 access_token=${...} 노출 없음(헤더 사용)",
  !/access_token=\$\{/.test(igSrc),
);
check(
  "lib/instagram.ts: Authorization Bearer 헤더로 token 전달",
  /Authorization[^\n]*Bearer/.test(igSrc),
);

// ── 8) dual-platform runner가 새 explicit credential 함수 ref를 가리킴 ─────────
check(
  "runner LIVE_PUBLISH_FUNCTION_REFS가 uploadInstagramReelWithCredentials를 가리킴",
  runnerSrc.includes("uploadInstagramReelWithCredentials"),
);
check(
  "runner LIVE_PUBLISH_FUNCTION_REFS가 uploadYouTubeShortsWithCredentials를 가리킴",
  runnerSrc.includes("uploadYouTubeShortsWithCredentials"),
);

// ── 요약 ──────────────────────────────────────────────────────────────────────
console.log(`\n${passes} PASS / ${failures} FAIL`);
if (failures > 0) process.exit(1);
