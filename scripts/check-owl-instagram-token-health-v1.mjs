#!/usr/bin/env node

/**
 * Instagram 토큰 건강 검진 — 읽기 전용, 게시 없음.
 *
 * 게시 직전에 토큰이 살아있는지 확인한다. 이 검사가 없으면 Blob 업로드까지 마친
 * 뒤에야 만료를 알게 된다(2026-09-16에 실제로 그랬다).
 *
 * 확인 항목:
 *   1. 토큰이 유효한가
 *   2. 언제 만료되는가 (남은 일수)
 *   3. 게시에 필요한 권한이 붙어 있는가
 *   4. 연결된 Instagram 계정이 조회되는가
 *
 * 안전:
 * - GET 요청만 한다. 게시·수정·삭제 없음.
 * - 토큰 값은 절대 출력하지 않는다. 계정 ID도 뒤 4자리만 표시한다.
 *
 * 사용(no-log 래퍼 경유):
 *   node scripts/run-owner-command-with-local-env-no-log.mjs owl-instagram-token-health --arm
 */

const GRAPH_BASE = "https://graph.facebook.com/v25.0";
const REQUIRED_SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "pages_show_list",
];

const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

if (!accountId || !accessToken) {
  console.error("ABORT: 자격증명이 주입되지 않았습니다(no-log 래퍼로 실행하세요).");
  process.exit(2);
}

function sanitize(text) {
  return String(text ?? "")
    .replace(/access_token=[^&\s"]+/gi, "access_token=REDACTED")
    .replace(/EAA[A-Za-z0-9]+/g, "REDACTED")
    .slice(0, 300);
}

async function getJson(url) {
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(30_000) });
  let data = null;
  try { data = await response.json(); } catch { /* 본문 없음 */ }
  return { ok: response.ok, status: response.status, data };
}

let exitCode = 0;
const findings = [];

// ── 1. 토큰 자체 검사 ────────────────────────────────────────────────────────
// input_token 과 access_token 에 같은 토큰을 넣으면 자기 자신을 검사할 수 있다.
const debug = await getJson(
  `${GRAPH_BASE}/debug_token?input_token=${encodeURIComponent(accessToken)}` +
  `&access_token=${encodeURIComponent(accessToken)}`,
);

const info = debug.data?.data;
if (!debug.ok || !info) {
  console.error(`토큰 검사 실패: HTTP ${debug.status} ${sanitize(JSON.stringify(debug.data))}`);
  process.exit(1);
}

const isValid = info.is_valid === true;
findings.push(["토큰 유효", isValid ? "OK" : "만료 또는 무효"]);
if (!isValid) exitCode = 1;

// expires_at 이 0 이면 만료 없음(영구 토큰)
const expiresAt = Number(info.expires_at ?? 0);
let daysLeft = null;
if (expiresAt > 0) {
  daysLeft = Math.floor((expiresAt * 1000 - Date.now()) / 86_400_000);
  const when = new Date(expiresAt * 1000).toISOString().slice(0, 10);
  findings.push(["만료일", `${when} (${daysLeft}일 남음)`]);
  if (daysLeft < 0) exitCode = 1;
  else if (daysLeft <= 7) exitCode = Math.max(exitCode, 0); // 경고만
} else {
  findings.push(["만료일", "없음(장기 토큰)"]);
}

// ── 2. 권한 확인 ─────────────────────────────────────────────────────────────
const scopes = Array.isArray(info.scopes) ? info.scopes : [];
const missing = REQUIRED_SCOPES.filter((scope) => !scopes.includes(scope));
findings.push(["필수 권한", missing.length === 0 ? "모두 있음" : `누락: ${missing.join(", ")}`]);
if (missing.length > 0) exitCode = 1;

// ── 3. 계정 조회 (프로필 정비 점검용 필드 포함, 2026-09-18) ──────────────────
const account = await getJson(
  `${GRAPH_BASE}/${encodeURIComponent(accountId)}?fields=id,username,name,biography,website,followers_count,follows_count,media_count` +
  `&access_token=${encodeURIComponent(accessToken)}`,
);
if (account.ok && account.data?.id) {
  findings.push(["연결 계정", `@${account.data.username ?? "?"} (***${String(accountId).slice(-4)})`]);
  findings.push(["표시 이름", account.data.name ?? "(없음)"]);
  findings.push(["소개글", account.data.biography ?? "(없음)"]);
  findings.push(["웹사이트", account.data.website ?? "(없음)"]);
  findings.push(["팔로워/팔로잉/게시물", `${account.data.followers_count ?? "?"} / ${account.data.follows_count ?? "?"} / ${account.data.media_count ?? "?"}`]);
} else {
  findings.push(["연결 계정", `조회 실패: HTTP ${account.status} ${sanitize(JSON.stringify(account.data?.error))}`]);
  exitCode = 1;
}

// ── 4. 최근 미디어 목록(진단용, 2026-09-18: Owner가 프로필 화면에서 게시물
// 수가 실제 게시된 편수와 안 맞는다고 지적 — 실제 API 상태를 직접 확인) ──────
const media = await getJson(
  `${GRAPH_BASE}/${encodeURIComponent(accountId)}/media` +
  `?fields=id,media_type,media_product_type,permalink,timestamp` +
  `&limit=10&access_token=${encodeURIComponent(accessToken)}`,
);
let mediaList = [];
if (media.ok && Array.isArray(media.data?.data)) {
  mediaList = media.data.data;
  findings.push(["최근 게시물", `${mediaList.length}개 조회됨`]);
} else {
  findings.push(["최근 게시물", `조회 실패: HTTP ${media.status} ${sanitize(JSON.stringify(media.data?.error))}`]);
}

// ── 출력 ─────────────────────────────────────────────────────────────────────
console.log("");
console.log("─".repeat(56));
console.log("  Instagram 토큰 건강 검진");
console.log("─".repeat(56));
for (const [label, value] of findings) {
  console.log(`  ${label.padEnd(10)} ${value}`);
}
console.log("─".repeat(56));

if (exitCode === 0) {
  console.log("  결과: 게시 가능");
  if (daysLeft !== null && daysLeft <= 14) {
    console.log(`  주의: ${daysLeft}일 뒤 만료됩니다. 갱신을 준비하세요.`);
  }
} else {
  console.log("  결과: 게시 불가 — 위 항목을 해결해야 합니다.");
}
console.log("");

if (mediaList.length > 0) {
  console.log("─".repeat(56));
  console.log("  최근 게시물 상세");
  console.log("─".repeat(56));
  for (const item of mediaList) {
    console.log(`  ${item.timestamp}  ${item.media_type}/${item.media_product_type ?? "-"}`);
    console.log(`    ${item.permalink ?? "(permalink 없음)"}`);
  }
  console.log("");
}

process.exit(exitCode);
