#!/usr/bin/env node
/**
 * run-golden-sample-v3-2-instagram-upload-once.mjs
 *
 * Golden Sample v3.2 — Instagram 단 1회 업로드 runner (fail-closed, one-shot).
 * task: golden-sample-v3-2-live-instagram-upload-with-buildgongjakso-public-url-v1
 *
 * Owner 승인 근거 (plan fixture에 문자 단위 기록):
 *   APPROVE_UPLOAD: t1_lifestyle_inflation — upload cap=1, platforms=Instagram, ...
 *   APPROVE_UPLOAD_PUBLIC_URL: t1_lifestyle_inflation — buildgongjakso.com 도메인 ...
 *
 * 안전 원칙:
 * - Instagram 전용. YouTube client/import/credential 접근 코드 경로 없음.
 * - cap 정확히 1: armed 상태에서 container API 호출 "직전"에 uploadAttempted:true ledger를
 *   먼저 기록한다. crash/재실행 시에도 GATE_2가 기존 ledger를 보고 즉시 차단한다. 재시도 루프 없음.
 * - credential은 allowlist 2개 key만 targeted 추출(.env.local broad parse 금지),
 *   값 원문/account ID는 절대 로그/result JSON에 기록하지 않는다(presence boolean만).
 * - 공개 URL은 buildgongjakso.com 아래 direct mp4(2xx + video/*, text/html 거부)일 때만 통과.
 * - render/mux/TTS/image/browser/subprocess/DB/deploy 코드 경로 없음.
 * - --arm 플래그가 없으면 GATE_6까지(비밀 없음, 네트워크는 URL HEAD만) 수행하는 preflight-only.
 *   credential read(GATE_7)와 업로드(GATE_8)는 --arm에서만 진입한다.
 *
 * Usage:
 *   node scripts/run-golden-sample-v3-2-instagram-upload-once.mjs           # preflight-only
 *   node scripts/run-golden-sample-v3-2-instagram-upload-once.mjs --arm     # 1회 업로드 시도
 */
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const PLAN_PATH = join(REPO_ROOT, "scripts", "fixtures", "golden_sample_v3_2_live_instagram_upload_run_plan.t1_lifestyle_inflation.v1.json");
const OWNER_QA_PASS_PATH = join(REPO_ROOT, "scripts", "fixtures", "golden_sample_v3_2_owner_qa_actual_pass.t1_lifestyle_inflation.v1.json");
const HARD_BLOCK_POLICY_PATH = join(REPO_ROOT, "scripts", "fixtures", "golden_sample_v3_2_upload_hard_block_policy.v1.json");

// credential allowlist — lib/instagram.ts의 정확한 기존 naming만. 이 외 어떤 env key도 읽지 않는다.
const ALLOWED_ENV_KEYS = ["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_BUSINESS_ACCOUNT_ID"];

const armed = process.argv.includes("--arm");

const gates = [];
function gate(name, pass, detail) {
  gates.push({ gate: name, pass: !!pass, detail: detail ?? "" });
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  [${detail}]` : ""}`);
  return !!pass;
}

let plan = null;
let resultPath = null;

function writeResult(status, blockerCode, extra) {
  const record = {
    schemaVersion: "golden_sample_live_instagram_upload_run_result_v1",
    taskId: "golden-sample-v3-2-live-instagram-upload-with-buildgongjakso-public-url-v1",
    topicId: "t1_lifestyle_inflation",
    planRef: "scripts/fixtures/golden_sample_v3_2_live_instagram_upload_run_plan.t1_lifestyle_inflation.v1.json",
    generatedAt: new Date().toISOString(),
    armed,
    status,
    blockerCode: blockerCode ?? null,
    gates,
    secretsWritten: false,
    note: "credential 값/token/account ID 원문은 이 record에 절대 기록되지 않는다 (presence boolean만).",
    ...extra,
  };
  if (resultPath) {
    mkdirSync(dirname(resultPath), { recursive: true });
    writeFileSync(resultPath, JSON.stringify(record, null, 2), "utf-8");
    console.log(`\n  result: ${resultPath}`);
  } else {
    console.log("\n  result path unavailable (plan not loaded) — record printed only:");
    console.log(JSON.stringify(record, null, 2));
  }
  return record;
}

function bail(status, blockerCode, extra) {
  writeResult(status, blockerCode, extra);
  console.error(`\nBLOCKED: ${blockerCode}`);
  process.exit(1);
}

console.log(`\n[ig-upload-once] armed: ${armed ? "YES (1회 업로드 시도 활성화)" : "NO (preflight-only)"}\n`);

// ── [GATE_1_PLAN] plan fixture 로드 + 핵심 불변 조건 ─────────────────────────────
console.log("[GATE_1_PLAN] run plan invariants...");
try {
  plan = JSON.parse(readFileSync(PLAN_PATH, "utf-8"));
} catch (e) {
  gate("GATE_1_PLAN", false, `plan unreadable: ${e.message}`);
  bail("BLOCKED", "BLOCKED_PLAN_GATE_FAILED");
}
resultPath = plan?.oneShotLedger?.resultJsonPath ?? null;
{
  const scope = plan.approvalScope ?? {};
  const ok =
    scope.platform === "Instagram" &&
    Array.isArray(scope.platforms) && scope.platforms.length === 1 && scope.platforms[0] === "Instagram" &&
    scope.uploadCountCapMax === 1 &&
    scope.noRegeneration === true && scope.noRender === true && scope.noMux === true &&
    scope.noTts === true && scope.noImage === true && scope.noBrowser === true && scope.noYoutube === true &&
    typeof plan.ownerApprovals?.approveUpload === "string" &&
    plan.ownerApprovals.approveUpload.startsWith("APPROVE_UPLOAD: t1_lifestyle_inflation") &&
    typeof plan.ownerApprovals?.approveUploadPublicUrl === "string" &&
    plan.ownerApprovals.approveUploadPublicUrl.startsWith("APPROVE_UPLOAD_PUBLIC_URL: t1_lifestyle_inflation") &&
    plan.httpEndpointStillBlocked === true &&
    plan.publicUrlPolicy?.enabled === true &&
    typeof resultPath === "string" && resultPath.toLowerCase().startsWith("c:\\tmp\\money-shorts-os\\");
  if (!gate("GATE_1_PLAN", ok, ok ? "Instagram-only, cap=1, approvals recorded" : "plan invariant violation")) {
    bail("BLOCKED", "BLOCKED_PLAN_GATE_FAILED");
  }
}

// ── [GATE_2_LEDGER] one-shot cap ledger 0/1 ─────────────────────────────────────
console.log("[GATE_2_LEDGER] upload cap ledger 0/1...");
{
  let attemptedBefore = false;
  let priorStatus = null;
  if (existsSync(resultPath)) {
    try {
      const prior = JSON.parse(readFileSync(resultPath, "utf-8"));
      priorStatus = prior?.status ?? null;
      if (prior?.uploadAttempted === true) attemptedBefore = true;
    } catch {
      // 읽기 불가한 기존 ledger는 보수적으로 attempted 취급 (fail-closed)
      attemptedBefore = true;
      priorStatus = "UNREADABLE_LEDGER_FAIL_CLOSED";
    }
  }
  if (!gate("GATE_2_LEDGER", !attemptedBefore, attemptedBefore ? `prior attempt found (${priorStatus})` : "ledger 0/1")) {
    bail("BLOCKED", plan.oneShotLedger?.blockerIfAlreadyAttempted ?? "BLOCKED_ALREADY_ATTEMPTED");
  }
}

// ── [GATE_3_SOURCE_MP4] 승인된 로컬 원본 존재 + 크기 일치 ───────────────────────
console.log("[GATE_3_SOURCE_MP4] approved local mux mp4...");
{
  const p = plan.sourceMp4?.path;
  const expected = plan.sourceMp4?.expectedBytes;
  if (!gate("GATE_3_SOURCE_MP4 exists", typeof p === "string" && existsSync(p), p)) {
    bail("BLOCKED", "BLOCKED_SOURCE_MP4_MISSING");
  }
  const actual = statSync(p).size;
  if (!gate("GATE_3_SOURCE_MP4 size", actual === expected, `${actual} vs expected ${expected}`)) {
    bail("BLOCKED", "BLOCKED_SOURCE_MP4_SIZE_MISMATCH");
  }
}

// ── [GATE_4_OWNER_QA_PASS] Owner 직접 QA 통과 기록 ─────────────────────────────
console.log("[GATE_4_OWNER_QA_PASS] owner QA actual pass fixture...");
{
  let qa = null;
  try { qa = JSON.parse(readFileSync(OWNER_QA_PASS_PATH, "utf-8")); } catch { /* fail below */ }
  const ok = qa?.ownerQaPassed === true &&
    qa?.ownerQaActualPass?.passSource === "OWNER_DIRECT_VIEWING_LISTENING" &&
    qa?.ownerQaActualPass?.topicId === "t1_lifestyle_inflation";
  if (!gate("GATE_4_OWNER_QA_PASS", ok, ok ? "ownerQaPassed true (direct viewing/listening)" : "missing/invalid")) {
    bail("BLOCKED", "BLOCKED_OWNER_QA_PASS_MISSING");
  }
}

// ── [GATE_5_HARD_BLOCK_RECONCILE] HTTP hard block 정합 확인 ─────────────────────
// 이 runner는 HTTP /api/upload를 호출하지 않으며 hard block을 해제하지 않는다.
// policy가 예상 상태(uploadBlocked:true)와 다르면 계약 드리프트로 보고 중단한다.
console.log("[GATE_5_HARD_BLOCK_RECONCILE] upload hard block policy consistency...");
{
  let policy = null;
  try { policy = JSON.parse(readFileSync(HARD_BLOCK_POLICY_PATH, "utf-8")); } catch { /* fail below */ }
  const ok = policy?.uploadBlocked === true && policy?.uploadReady === false &&
    plan.httpEndpointStillBlocked === true;
  if (!gate("GATE_5_HARD_BLOCK_RECONCILE", ok, ok ? "HTTP endpoint blocked as expected; direct lane separately approved" : "policy drift")) {
    bail("BLOCKED", plan.hardBlock?.mismatchBlockerCode ?? "BLOCKED_HARD_BLOCK_MISMATCH");
  }
}

// ── [GATE_6_PUBLIC_URL] direct mp4 공개 URL 검증 (무인증 HEAD → range GET fallback) ─
console.log("[GATE_6_PUBLIC_URL] public direct-mp4 URL verification...");
let publicUrlCheck = null;
{
  const url = plan.publicUrlPolicy?.deterministicPublicUrl;
  let parsed = null;
  try { parsed = new URL(url); } catch { /* fail below */ }
  const hostOk = parsed && parsed.protocol === "https:" &&
    (plan.publicUrlPolicy?.allowedHosts ?? []).includes(parsed.hostname);
  if (!gate("GATE_6_PUBLIC_URL host/https", !!hostOk, parsed ? `${parsed.protocol}//${parsed.hostname}` : "unparsable URL")) {
    bail("BLOCKED", "BLOCKED_PUBLIC_URL_NOT_DEPLOYED", { publicUrlCheck: { url, error: "invalid host/protocol" } });
  }

  let httpStatus = null;
  let contentType = null;
  let fetchError = null;
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(20000) });
    if (res.status === 405 || res.status === 501) {
      // HEAD 미지원 서버 fallback: 1바이트 range GET (본문 소비 안 함)
      res = await fetch(url, { method: "GET", headers: { Range: "bytes=0-0" }, redirect: "follow", signal: AbortSignal.timeout(20000) });
      if (res.body?.cancel) await res.body.cancel();
    }
    httpStatus = res.status;
    contentType = (res.headers.get("content-type") ?? "").toLowerCase();
  } catch (e) {
    fetchError = e?.message ?? String(e);
  }
  publicUrlCheck = { url, httpStatus, contentType, fetchError };

  const is2xx = typeof httpStatus === "number" && ((httpStatus >= 200 && httpStatus < 300) || httpStatus === 206);
  const isHtml = typeof contentType === "string" && contentType.includes("text/html");
  const isVideo = typeof contentType === "string" && contentType.startsWith("video/");

  if (isHtml) {
    gate("GATE_6_PUBLIC_URL direct mp4", false, `content-type=${contentType} (HTML rejected)`);
    bail("BLOCKED", plan.publicUrlPolicy?.ifHtmlBlockerCode ?? "BLOCKED_PUBLIC_URL_NOT_DIRECT_MP4", { publicUrlCheck });
  }
  if (!is2xx || !isVideo) {
    gate("GATE_6_PUBLIC_URL direct mp4", false, `status=${httpStatus} content-type=${contentType ?? "n/a"} error=${fetchError ?? "none"}`);
    bail("BLOCKED", plan.publicUrlPolicy?.ifNotLiveBlockerCode ?? "BLOCKED_PUBLIC_URL_NOT_DEPLOYED", { publicUrlCheck });
  }
  gate("GATE_6_PUBLIC_URL direct mp4", true, `status=${httpStatus} content-type=${contentType}`);
}

if (!armed) {
  writeResult("PREFLIGHT_ONLY_NO_UPLOAD", null, { publicUrlCheck, uploadAttempted: false, uploadPublished: false });
  console.log("\nPREFLIGHT PASS — --arm 없이 실행되어 credential read/upload는 수행하지 않았다.");
  process.exit(0);
}

// ══ ARMED_ONLY_BEGIN — 아래 경로는 --arm 에서만 진입한다 ═══════════════════════

// ── [GATE_7_CREDENTIALS_ARMED_ONLY] allowlist 2-key targeted 추출 (presence만 기록) ─
console.log("[GATE_7_CREDENTIALS_ARMED_ONLY] Instagram credential allowlist read...");
function readAllowlistedEnv() {
  const out = {};
  for (const k of ALLOWED_ENV_KEYS) {
    const v = process.env[k];
    if (typeof v === "string" && v.trim().length > 0) out[k] = v.trim();
  }
  const envLocalPath = join(REPO_ROOT, ".env.local");
  if (existsSync(envLocalPath)) {
    let content = "";
    try { content = readFileSync(envLocalPath, "utf-8"); } catch { return out; }
    for (const line of content.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      for (const k of ALLOWED_ENV_KEYS) {
        // allowlist key로 시작하는 라인만 추출 — 그 외 라인/키는 파싱·보관하지 않는다.
        if (!out[k] && t.startsWith(k + "=")) {
          let v = t.slice(k.length + 1).trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
          if (v.length > 0) out[k] = v;
        }
      }
    }
  }
  return out;
}
const igEnv = readAllowlistedEnv();
const credentialPresence = {
  INSTAGRAM_ACCESS_TOKEN: typeof igEnv.INSTAGRAM_ACCESS_TOKEN === "string" && igEnv.INSTAGRAM_ACCESS_TOKEN.length > 0,
  INSTAGRAM_BUSINESS_ACCOUNT_ID: typeof igEnv.INSTAGRAM_BUSINESS_ACCOUNT_ID === "string" && igEnv.INSTAGRAM_BUSINESS_ACCOUNT_ID.length > 0,
};
console.log(`  presence: accessToken=${credentialPresence.INSTAGRAM_ACCESS_TOKEN} accountId=${credentialPresence.INSTAGRAM_BUSINESS_ACCOUNT_ID}`);
if (!gate("GATE_7_CREDENTIALS_ARMED_ONLY", credentialPresence.INSTAGRAM_ACCESS_TOKEN && credentialPresence.INSTAGRAM_BUSINESS_ACCOUNT_ID, "presence-only check")) {
  bail("BLOCKED", plan.credentialPolicy?.missingBlockerCode ?? "BLOCKED_INSTAGRAM_CREDENTIALS_MISSING", { publicUrlCheck, credentialPresence, uploadAttempted: false, uploadPublished: false });
}

// ── [GATE_8_UPLOAD_ONCE_ARMED_ONLY] 단 1회 업로드: ledger 선기록 → container → poll → publish ─
console.log("[GATE_8_UPLOAD_ONCE_ARMED_ONLY] one-shot Instagram upload...");
{
  const GRAPH = plan.instagram?.graphApiBase ?? "https://graph.facebook.com/v19.0";
  const caption = plan.instagram?.caption ?? "";
  const videoUrl = plan.publicUrlPolicy.deterministicPublicUrl;

  // cap=1 구조 보증: container API 호출 "전"에 attempted ledger를 기록한다.
  writeResult("UPLOAD_ATTEMPT_IN_PROGRESS", null, { publicUrlCheck, credentialPresence, uploadAttempted: true, uploadPublished: false });

  let containerId = null;
  try {
    const containerRes = await fetch(`${GRAPH}/${igEnv.INSTAGRAM_BUSINESS_ACCOUNT_ID}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: plan.instagram?.mediaType ?? "REELS",
        video_url: videoUrl,
        caption,
        share_to_feed: plan.instagram?.shareToFeed !== false,
        access_token: igEnv.INSTAGRAM_ACCESS_TOKEN,
      }),
      signal: AbortSignal.timeout(60000),
    });
    const container = await containerRes.json();
    if (!container?.id) {
      const detail = JSON.stringify(container?.error ?? container ?? {}).slice(0, 300);
      gate("GATE_8 container create", false, detail);
      bail("UPLOAD_FAILED", "UPLOAD_FAILED_CONTAINER_CREATE", { publicUrlCheck, credentialPresence, uploadAttempted: true, uploadPublished: false, platformErrorExcerpt: detail });
    }
    containerId = container.id;
    gate("GATE_8 container create", true, `containerId=${containerId}`);
  } catch (e) {
    gate("GATE_8 container create", false, e.message);
    bail("UPLOAD_FAILED", "UPLOAD_FAILED_CONTAINER_CREATE", { publicUrlCheck, credentialPresence, uploadAttempted: true, uploadPublished: false, platformErrorExcerpt: String(e.message).slice(0, 300) });
  }

  // poll — 재시도 아님(동일 시도 내 처리 대기). FINISHED가 아니면 publish로 진행하지 않는다.
  let finished = false;
  const maxPolls = plan.instagram?.pollMaxAttempts ?? 24;
  const pollMs = plan.instagram?.pollIntervalMs ?? 5000;
  for (let i = 0; i < maxPolls; i++) {
    await new Promise((r) => setTimeout(r, pollMs));
    try {
      const stRes = await fetch(`${GRAPH}/${containerId}?fields=status_code&access_token=${igEnv.INSTAGRAM_ACCESS_TOKEN}`, { signal: AbortSignal.timeout(30000) });
      const st = await stRes.json();
      if (st?.status_code === "FINISHED") { finished = true; break; }
      if (st?.status_code === "ERROR") break;
    } catch { /* transient poll error — 다음 poll에서 재확인 (업로드 재시도 아님) */ }
  }
  if (!finished) {
    gate("GATE_8 container FINISHED", false, `not FINISHED within ${maxPolls}×${pollMs}ms — publish 진행 안 함`);
    bail("UPLOAD_FAILED", plan.instagram?.notFinishedBlockerCode ?? "UPLOAD_FAILED_CONTAINER_NOT_FINISHED", { publicUrlCheck, credentialPresence, uploadAttempted: true, uploadPublished: false, containerId });
  }
  gate("GATE_8 container FINISHED", true);

  try {
    const pubRes = await fetch(`${GRAPH}/${igEnv.INSTAGRAM_BUSINESS_ACCOUNT_ID}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: containerId, access_token: igEnv.INSTAGRAM_ACCESS_TOKEN }),
      signal: AbortSignal.timeout(60000),
    });
    const published = await pubRes.json();
    if (!published?.id) {
      const detail = JSON.stringify(published?.error ?? published ?? {}).slice(0, 300);
      gate("GATE_8 publish", false, detail);
      bail("UPLOAD_FAILED", "UPLOAD_FAILED_PUBLISH", { publicUrlCheck, credentialPresence, uploadAttempted: true, uploadPublished: false, containerId, platformErrorExcerpt: detail });
    }
    gate("GATE_8 publish", true, `mediaId=${published.id}`);
    writeResult("UPLOAD_EXECUTED_PUBLISHED", null, {
      publicUrlCheck, credentialPresence,
      uploadAttempted: true, uploadPublished: true,
      containerId, publishedMediaId: published.id,
    });
    console.log(`\nUPLOAD_EXECUTED_PUBLISHED — mediaId=${published.id}`);
    process.exit(0);
  } catch (e) {
    gate("GATE_8 publish", false, e.message);
    bail("UPLOAD_FAILED", "UPLOAD_FAILED_PUBLISH", { publicUrlCheck, credentialPresence, uploadAttempted: true, uploadPublished: false, containerId, platformErrorExcerpt: String(e.message).slice(0, 300) });
  }
}
