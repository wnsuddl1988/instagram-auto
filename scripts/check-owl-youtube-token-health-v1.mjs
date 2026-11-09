#!/usr/bin/env node

/**
 * YouTube 토큰 건강 검진 — 읽기 전용, 업로드 없음.
 *
 * 게시 직전에 토큰이 살아있는지 확인한다. 이 검사가 없으면 33MB 영상을 읽어
 * 업로드를 시작한 뒤에야 invalid_grant 를 만난다(2026-09-16에 실제로 겪음).
 *
 * 확인 항목:
 *   1. 리프레시 토큰으로 액세스 토큰을 받을 수 있는가
 *   2. 어떤 권한 범위를 갖고 있는가
 *   3. 업로드에 필요한 youtube.upload 가 있는가
 *
 * 안전:
 * - 토큰 교환(POST)과 tokeninfo 조회(GET)만 한다. 업로드·수정·삭제 없음.
 * - 토큰 값은 절대 출력하지 않는다.
 *
 * 사용(no-log 래퍼 경유):
 *   node scripts/run-owner-command-with-local-env-no-log.mjs owl-youtube-token-health --arm
 */

const REQUIRED_SCOPE = "https://www.googleapis.com/auth/youtube.upload";

const clientId = process.env.YOUTUBE_CLIENT_ID;
const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

if (!clientId || !clientSecret || !refreshToken) {
  console.error("ABORT: 자격증명이 주입되지 않았습니다(no-log 래퍼로 실행하세요).");
  process.exit(2);
}

function sanitize(text) {
  return String(text ?? "")
    .replace(/ya29\.[A-Za-z0-9._-]+/g, "REDACTED")
    .replace(/1\/\/[A-Za-z0-9._-]+/g, "REDACTED")
    .replace(/client_secret=[^&\s"]+/gi, "client_secret=REDACTED")
    .slice(0, 300);
}

const findings = [];
let exitCode = 0;

// ── 1. 리프레시 토큰으로 액세스 토큰 교환 ───────────────────────────────────
// 이게 통과하면 토큰이 살아있다는 뜻이다. invalid_grant 는 여기서 잡힌다.
let accessToken = null;
try {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.access_token) {
    const reason = data?.error ?? `HTTP ${response.status}`;
    findings.push(["토큰 유효", `실패 — ${sanitize(reason)}`]);
    if (String(reason) === "invalid_grant") {
      findings.push([
        "원인 추정",
        "토큰 만료·취소. OAuth 동의 화면이 '테스트' 상태면 7일마다 만료됩니다.",
      ]);
    }
    exitCode = 1;
  } else {
    accessToken = data.access_token;
    findings.push(["토큰 유효", "OK (액세스 토큰 발급 성공)"]);
  }
} catch (error) {
  findings.push(["토큰 유효", `요청 실패 — ${sanitize(error?.message)}`]);
  exitCode = 1;
}

// ── 2. 권한 범위 확인 ────────────────────────────────────────────────────────
if (accessToken) {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
      { signal: AbortSignal.timeout(30_000) },
    );
    const info = await response.json().catch(() => null);
    const scopes = String(info?.scope ?? "").split(/\s+/).filter(Boolean);
    if (scopes.includes(REQUIRED_SCOPE)) {
      findings.push(["업로드 권한", "있음"]);
    } else {
      findings.push(["업로드 권한", `없음 — 보유: ${scopes.join(", ") || "(없음)"}`]);
      exitCode = 1;
    }
    // 읽기 권한이 있는지도 알려준다. 없어도 업로드는 되지만, 채널 사전 확인은 못 한다.
    const hasReadonly = scopes.some((s) => /youtube(\.readonly)?$/.test(s));
    findings.push([
      "채널 조회",
      hasReadonly ? "가능" : "불가(업로드 전용 토큰) — 채널은 업로드 후 확인됩니다",
    ]);
    if (info?.expires_in) {
      findings.push(["액세스 토큰", `${info.expires_in}초 후 만료(자동 갱신됨)`]);
    }
  } catch (error) {
    findings.push(["권한 범위", `조회 실패 — ${sanitize(error?.message)}`]);
  }
}

// ── 출력 ─────────────────────────────────────────────────────────────────────
console.log("");
console.log("─".repeat(56));
console.log("  YouTube 토큰 건강 검진");
console.log("─".repeat(56));
for (const [label, value] of findings) {
  console.log(`  ${label.padEnd(10)} ${value}`);
}
console.log("─".repeat(56));
if (exitCode === 0) {
  console.log("  결과: 업로드 가능");
} else {
  console.log("  결과: 업로드 불가");
  console.log("");
  console.log("  해결: node scripts/get-youtube-refresh-token-once.mjs 로 재발급");
  console.log("        (OAuth 동의 화면이 '프로덕션'인지 먼저 확인)");
}
console.log("");
process.exit(exitCode);
