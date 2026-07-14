#!/usr/bin/env node
/**
 * run-final-e2e-dual-platform-publish-once.mjs
 *
 * FINAL E2E dual-platform publish runner — one-shot, approval-gated, fail-closed.
 * task: final-e2e-ready-content-unit-and-publish-one-v1
 * Owner approval token: APPROVE_FINAL_E2E_AUTOMATION_PUBLISH_ONE_NEW_CONTENT_UNIT
 *
 * Executes exactly ONE new non-default content unit end-to-end:
 *   1. Vercel Blob upload (put, allowOverwrite:false)  → public video URL
 *   2. Blob liveness HEAD (2xx + video/*)
 *   3. Instagram Reels publish (container → poll → media_publish)
 *   4. YouTube Shorts direct upload (videos.insert)
 *   5. publish ledger write — ONLY after BOTH platform publishes succeed (all-or-nothing)
 *
 * Gate order (fail-closed, no side effect before gate 9):
 *   1. --approval exact match
 *   2. --content-unit / --ledger / --out-dir required; out-dir outside repo
 *   3. one-shot: existing final-e2e-publish-result.json in out-dir blocks armed re-run
 *   4. content unit manifest loads + schema + NOT default evidence (t1_lifestyle_inflation forbidden)
 *   5. metadata optimization gates (exact orchestrator functions via buildDualPlatformPublishPlan)
 *   6. source files exist + Instagram source sha256 recomputed (deterministic Blob pathname)
 *   7. duplicate guard: reference existingPublishedKeys + publish ledger read (fail-closed on read error)
 *   8. credential presence booleans from process.env (values NEVER printed/derived/stored in output)
 *   9. --arm required for any external call; without it: preflight-only JSON, exit 0, zero side effects
 *
 * Security contract:
 * - No .env/.env.local read. Credentials come ONLY from process.env injected by the Owner
 *   no-log wrapper (scripts/run-owner-command-with-local-env-no-log.mjs) into this child process.
 * - Credential values are copied into local variables, passed as explicit arguments/headers,
 *   and never logged, hashed, measured, masked, or written to any file.
 * - All error text is sanitized (access_token=..., EAA…, ya29…, vercel_blob_rw_… → REDACTED).
 * - Default evidence hard-block: contentId t1_lifestyle_inflation (any version) is refused;
 *   result media ids are also compared against the forbidden evidence ids.
 * - Partial-failure contract: any platform failure → NO ledger success write. Failure result JSON
 *   records exactly what happened (including an already-published Instagram media id if YouTube
 *   later failed) so the Owner/Codex can decide manually. Ledger is written at most once,
 *   with both records, only on dual success (all-or-nothing via publish-ledger-runtime-write).
 *
 * Usage:
 *   node scripts/run-final-e2e-dual-platform-publish-once.mjs \
 *     --approval APPROVE_FINAL_E2E_AUTOMATION_PUBLISH_ONE_NEW_CONTENT_UNIT \
 *     --content-unit <dual_platform_content_unit_v1.json> \
 *     --ledger <publish-ledger.json> \
 *     --out-dir <outside-repo dir> \
 *     [--arm]
 */

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from "node:fs";
import { resolve, dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

import { buildDualPlatformPublishPlan } from "./run-dual-platform-final-publish-orchestrator.mjs";
import { evaluateLedgerDuplicateForUnit } from "../lib/publish-ledger-runtime.mjs";
import {
  recordDualPlatformPublishRuntime,
  writePublishLedgerRuntime,
} from "../lib/publish-ledger-runtime-write.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

export const APPROVAL_TOKEN = "APPROVE_FINAL_E2E_AUTOMATION_PUBLISH_ONE_NEW_CONTENT_UNIT";
const RESULT_SCHEMA = "final_e2e_dual_platform_publish_result_v1";
const RESULT_FILENAME = "final-e2e-publish-result.json";
const PREFLIGHT_FILENAME = "final-e2e-publish-preflight.json";

// 기존 완료 evidence — 어떤 경로로도 재게시/재업로드 금지.
const FORBIDDEN_CONTENT_ID = "t1_lifestyle_inflation";
const FORBIDDEN_IG_MEDIA_ID = "17916511431199303";
const FORBIDDEN_YT_VIDEO_ID = "r9jhckdpC9w";

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";
const INSTAGRAM_VARIANT_ID = "instagram_reels_full_frame_1080x1920";
const YOUTUBE_VARIANT_ID = "youtube_shorts_letterbox_1080x1920";
const BLOB_PATH_PREFIX = "instagram/reels";

const REQUIRED_ENV_KEY_NAMES = Object.freeze([
  "INSTAGRAM_BUSINESS_ACCOUNT_ID",
  "INSTAGRAM_ACCESS_TOKEN",
  "YOUTUBE_CLIENT_ID",
  "YOUTUBE_CLIENT_SECRET",
  "YOUTUBE_REFRESH_TOKEN",
  "BLOB_READ_WRITE_TOKEN",
]);

// ── args ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
}
const approval = getArg("--approval");
const contentUnitPath = getArg("--content-unit");
const ledgerPath = getArg("--ledger");
const outDirArg = getArg("--out-dir");
const armed = args.includes("--arm");

// ── side-effect counters (진실 보고) ─────────────────────────────────────────
const sideEffectCounters = {
  blobPutCount: 0,
  blobHeadCount: 0,
  instagramContainerCreateCount: 0,
  instagramStatusPollCount: 0,
  instagramPublishCount: 0,
  youtubeInsertCount: 0,
  ledgerWriteCount: 0,
  envSecretValuePrintCount: 0, // 항상 0이어야 한다
};

// ── secret-safe error text ───────────────────────────────────────────────────
function sanitizeErrorText(text) {
  return String(text ?? "")
    .replace(/access_token=[^&\s"']+/gi, "access_token=REDACTED")
    .replace(/EAA[A-Za-z0-9]+/g, "REDACTED_TOKEN")
    .replace(/ya29\.[A-Za-z0-9_-]+/g, "REDACTED_TOKEN")
    .replace(/vercel_blob_rw_[A-Za-z0-9_]+/g, "REDACTED_TOKEN")
    .replace(/"(client_secret|refresh_token|clientSecret|refreshToken)"\s*:\s*"[^"]*"/gi, '"$1":"REDACTED"')
    .slice(0, 700);
}

function nowIso() {
  return new Date().toISOString();
}

// ── result writer ────────────────────────────────────────────────────────────
let outDirAbs = null;
function writeResultJson(status, blockerCode, extra) {
  const record = {
    schemaVersion: RESULT_SCHEMA,
    approvalToken: APPROVAL_TOKEN,
    status,
    blockerCode: blockerCode ?? null,
    armed,
    finishedAtIso: nowIso(),
    contentUnitManifestPath: contentUnitPath ? resolve(contentUnitPath) : null,
    ledgerPath: ledgerPath ? resolve(ledgerPath) : null,
    envSecretValuesPrinted: false,
    dotEnvLocalDirectRead: false,
    sideEffectCounters,
    ...extra,
  };
  if (outDirAbs) {
    mkdirSync(outDirAbs, { recursive: true });
    const p = join(outDirAbs, armed ? RESULT_FILENAME : PREFLIGHT_FILENAME);
    writeFileSync(p, JSON.stringify(record, null, 2) + "\n", "utf8");
    console.log(`\n  result JSON: ${p}`);
  }
  return record;
}

function bail(status, blockerCode, extra, exitCode = 1) {
  console.error(`\nBLOCKED: ${blockerCode ?? status}`);
  writeResultJson(status, blockerCode, extra);
  process.exit(exitCode);
}

// ── gates ────────────────────────────────────────────────────────────────────
console.log("\n╔════════════════════════════════════════════════════════════════╗");
console.log("║  FINAL E2E dual-platform publish — one-shot (Blob→IG→YT→ledger) ║");
console.log("╚════════════════════════════════════════════════════════════════╝\n");

// [gate 1] approval
if (approval !== APPROVAL_TOKEN) {
  console.error(`BLOCKED: MISSING_OR_INVALID_APPROVAL_TOKEN — expected exact --approval ${APPROVAL_TOKEN}`);
  process.exit(1);
}

// [gate 2] required args + out-dir outside repo
if (!contentUnitPath || !ledgerPath || !outDirArg) {
  console.error("BLOCKED: MISSING_REQUIRED_ARGS — need --content-unit <path> --ledger <path> --out-dir <path>");
  process.exit(1);
}
outDirAbs = resolve(outDirArg);
if (outDirAbs.startsWith(REPO_ROOT + "\\") || outDirAbs.startsWith(REPO_ROOT + "/") || outDirAbs === REPO_ROOT) {
  console.error(`BLOCKED: OUT_DIR_INSIDE_REPO — ${outDirAbs}`);
  process.exit(1);
}
const ledgerAbs = resolve(ledgerPath);
if (ledgerAbs.startsWith(REPO_ROOT + "\\") || ledgerAbs.startsWith(REPO_ROOT + "/")) {
  console.error(`BLOCKED: LEDGER_INSIDE_REPO — explicit ledger must be outside repo: ${ledgerAbs}`);
  process.exit(1);
}

// [gate 3] one-shot: 기존 성공/실패 result가 있으면 armed 재실행 차단
const existingResultPath = join(outDirAbs, RESULT_FILENAME);
if (armed && existsSync(existingResultPath)) {
  console.error(`BLOCKED: RESULT_ALREADY_EXISTS_ONE_SHOT — ${existingResultPath}`);
  console.error("  이 러너는 정확히 1회만 실행된다. 재실행은 Codex/Owner 수동 판단 필요.");
  process.exit(1);
}

// [gate 4] content unit manifest 로드 + default evidence 하드 차단
if (!existsSync(contentUnitPath)) {
  bail("BLOCKED", "CONTENT_UNIT_NOT_FOUND", {});
}
let unit = null;
try {
  unit = JSON.parse(readFileSync(contentUnitPath, "utf8"));
} catch (e) {
  bail("BLOCKED", "CONTENT_UNIT_JSON_PARSE_FAILED", { errorExcerpt: sanitizeErrorText(e?.message) });
}
if (unit?.schemaVersion !== "dual_platform_content_unit_v1") {
  bail("BLOCKED", "CONTENT_UNIT_WRONG_SCHEMA", { got: String(unit?.schemaVersion ?? "") });
}
if (unit.contentId === FORBIDDEN_CONTENT_ID) {
  bail("BLOCKED", "DEFAULT_EVIDENCE_CONTENT_FORBIDDEN", {
    detail: `contentId ${FORBIDDEN_CONTENT_ID} is the already-published default evidence — republish forbidden`,
  });
}
if (typeof unit.contentId !== "string" || unit.contentId === "" || typeof unit.version !== "string" || unit.version === "") {
  bail("BLOCKED", "CONTENT_UNIT_ID_VERSION_INVALID", {});
}
console.log(`  content unit: ${unit.contentId}/${unit.version}`);
console.log(`  ledger:       ${ledgerAbs}`);
console.log(`  armed:        ${armed ? "YES — 실제 게시 시도" : "NO — preflight-only (외부 호출 0)"}\n`);

// [gate 5] metadata gates — orchestrator의 정확한 gate 함수 재사용(plan 경유)
const plan = buildDualPlatformPublishPlan(unit);
const igJob = plan.jobs.find((j) => j.id === "instagram_job");
const ytJob = plan.jobs.find((j) => j.id === "youtube_job");
const igGate = igJob?.metadataOptimizationGate ?? { ok: false, reasons: ["gate_not_computed"] };
const ytGate = ytJob?.metadataOptimizationGate ?? { ok: false, reasons: ["gate_not_computed"] };
console.log(`  [gate 5] IG metadata gate: ${igGate.ok}  YT metadata gate: ${ytGate.ok}`);
if (igGate.ok !== true || ytGate.ok !== true) {
  bail("BLOCKED", "METADATA_GATE_FAILED", { igReasons: igGate.reasons, ytReasons: ytGate.reasons });
}

// [gate 6] source files + sha256 + deterministic Blob pathname
const igSourcePath = unit.instagramSourcePath;
const ytSourcePath = unit.youtubeSourcePath;
if (typeof igSourcePath !== "string" || !existsSync(igSourcePath)) {
  bail("BLOCKED", "INSTAGRAM_SOURCE_NOT_FOUND", { igSourcePath: String(igSourcePath ?? "") });
}
if (typeof ytSourcePath !== "string" || !existsSync(ytSourcePath)) {
  bail("BLOCKED", "YOUTUBE_SOURCE_NOT_FOUND", { ytSourcePath: String(ytSourcePath ?? "") });
}
const igSourceSize = statSync(igSourcePath).size;
const ytSourceSize = statSync(ytSourcePath).size;
const igSourceBuffer = readFileSync(igSourcePath);
const igSha256 = createHash("sha256").update(igSourceBuffer).digest("hex");
const blobPathname = `${BLOB_PATH_PREFIX}/${unit.contentId}/${INSTAGRAM_VARIANT_ID}/${unit.version}/${igSha256.slice(0, 12)}.mp4`;
console.log(`  [gate 6] IG source: ${igSourceSize} bytes, sha256_12=${igSha256.slice(0, 12)}`);
console.log(`           YT source: ${ytSourceSize} bytes`);
console.log(`           blob pathname: ${blobPathname}`);

// [gate 7] duplicate guard — reference(existingPublishedKeys) + ledger read(fail-closed)
const igRefDup = igJob?.duplicatePublishGuard?.alreadyPublished === true;
const ytRefDup = ytJob?.duplicatePublishGuard?.alreadyPublished === true;
const ledgerEvidence = evaluateLedgerDuplicateForUnit(ledgerAbs, unit.contentId, unit.version);
console.log(`  [gate 7] reference dup: ig=${igRefDup} yt=${ytRefDup}  ledger: readOk=${ledgerEvidence.readOk} existed=${ledgerEvidence.existed} dup=${ledgerEvidence.anyDuplicate}`);
if (ledgerEvidence.readOk !== true) {
  bail("BLOCKED", "PUBLISH_LEDGER_READ_FAILED", { ledgerReadReason: ledgerEvidence.reason });
}
if (igRefDup || ytRefDup || ledgerEvidence.anyDuplicate) {
  bail("BLOCKED", "DUPLICATE_ALREADY_PUBLISHED", {
    referenceDuplicate: { instagram: igRefDup, youtube: ytRefDup },
    ledgerDuplicate: {
      instagram: ledgerEvidence.instagramAlreadyPublished,
      youtube: ledgerEvidence.youtubeAlreadyPublished,
    },
  });
}

// [gate 8] credential presence — boolean만. 값은 로컬 변수로만 이동, 출력/파생/기록 0.
const credentialPresence = {};
for (const name of REQUIRED_ENV_KEY_NAMES) {
  credentialPresence[name] = typeof process.env[name] === "string" && process.env[name] !== "";
}
const allCredentialsPresent = REQUIRED_ENV_KEY_NAMES.every((n) => credentialPresence[n] === true);
console.log(`  [gate 8] credentials present: ${REQUIRED_ENV_KEY_NAMES.filter((n) => credentialPresence[n]).length}/${REQUIRED_ENV_KEY_NAMES.length} (presence boolean만, 값 미출력)`);
for (const name of REQUIRED_ENV_KEY_NAMES) console.log(`           ${name}: ${credentialPresence[name]}`);

if (!allCredentialsPresent) {
  bail(
    "BLOCKED",
    "CREDENTIALS_ABSENT_OWNER_RUN_REQUIRED",
    {
      credentialPresence,
      ownerRunHint:
        "Run via the Owner no-log wrapper so approved keys are injected into this child env: " +
        "node scripts/run-owner-command-with-local-env-no-log.mjs final-e2e-publish --content-unit <manifest> --ledger <ledger> --out-dir <dir> --arm",
    },
    2,
  );
}

// [gate 9] arm 게이트 — 없으면 preflight-only로 종료(외부 호출 0)
if (!armed) {
  console.log("\n  PREFLIGHT_ONLY_OK — 모든 gate 통과. --arm 없이 외부 호출 0으로 종료.");
  writeResultJson("PREFLIGHT_ONLY_OK", null, {
    credentialPresence,
    blobPathname,
    igSourceSizeBytes: igSourceSize,
    ytSourceSizeBytes: ytSourceSize,
    igSha256_12: igSha256.slice(0, 12),
  });
  process.exit(0);
}

// ════════════════════════════ ARMED EXECUTION ════════════════════════════════
// credential 값을 로컬 변수로 추출(여기서만 사용, 어떤 출력/기록에도 넣지 않는다).
const IG_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const IG_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const YT_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YT_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const YT_REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

const executionResult = {
  blob: { status: "pending", pathname: blobPathname, url: null, headStatus: null, headContentType: null },
  instagram: { status: "pending", mediaId: null, containerId: null, errorExcerpt: null },
  youtube: { status: "pending", videoId: null, url: null, errorExcerpt: null },
  ledger: { status: "pending", path: ledgerAbs, recordedKeys: [], writeOk: false },
};

// ── step 1: Vercel Blob upload (put ×1, allowOverwrite:false) ─────────────────
console.log("\n  [step 1/5] Vercel Blob upload (put ×1, allowOverwrite:false)...");
let blobUrl = null;
try {
  const { put } = await import("@vercel/blob");
  // 업로드 직전 buffer sha256 재확인 — 검증한 바이트가 업로드되는 바이트(no TOCTOU).
  const uploadSha = createHash("sha256").update(igSourceBuffer).digest("hex");
  if (uploadSha !== igSha256) {
    bail("FAILED", "SOURCE_CHANGED_BETWEEN_HASH_AND_UPLOAD", { executionResult });
  }
  sideEffectCounters.blobPutCount += 1;
  const putResult = await put(blobPathname, igSourceBuffer, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: false,
    multipart: true,
    contentType: "video/mp4",
    token: BLOB_TOKEN, // explicit injection
  });
  blobUrl = putResult?.url ?? null;
  if (!blobUrl || !blobUrl.startsWith("https://")) {
    executionResult.blob.status = "failed";
    bail("FAILED", "BLOB_PUT_RETURNED_NO_URL", { executionResult });
  }
  executionResult.blob.status = "uploaded";
  executionResult.blob.url = blobUrl;
  console.log(`           uploaded: ${blobUrl}`);
} catch (e) {
  executionResult.blob.status = "failed";
  executionResult.blob.errorExcerpt = sanitizeErrorText(e?.message);
  bail("FAILED", "BLOB_UPLOAD_FAILED", { executionResult });
}

// ── step 2: Blob liveness HEAD ────────────────────────────────────────────────
console.log("  [step 2/5] Blob public URL liveness (HEAD)...");
try {
  sideEffectCounters.blobHeadCount += 1;
  const headRes = await fetch(blobUrl, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(30000) });
  executionResult.blob.headStatus = headRes.status;
  executionResult.blob.headContentType = headRes.headers.get("content-type");
  const ct = String(headRes.headers.get("content-type") ?? "");
  if (!(headRes.status >= 200 && headRes.status < 300) || !ct.startsWith("video/")) {
    bail("FAILED", "BLOB_LIVENESS_CHECK_FAILED", { executionResult });
  }
  console.log(`           HEAD ${headRes.status} ${ct}`);
} catch (e) {
  executionResult.blob.errorExcerpt = sanitizeErrorText(e?.message);
  bail("FAILED", "BLOB_LIVENESS_CHECK_FAILED", { executionResult });
}

// ── step 3: Instagram Reels publish (container → poll → publish) ─────────────
console.log("  [step 3/5] Instagram Reels publish (container → poll → media_publish)...");
const igMeta = unit.instagramMetadata ?? {};
const igCaption = [
  igMeta.captionFirstLineHook ?? "",
  "",
  igMeta.caption ?? "",
  "",
  igMeta.callToAction ?? "",
  "",
  (Array.isArray(igMeta.hashtags) ? igMeta.hashtags : []).map((t) => `#${t}`).join(" "),
].join("\n").replace(/\n{3,}/g, "\n\n").trim();

let igMediaId = null;
try {
  // container 생성 (access_token은 body로만 — URL/로그 미노출)
  sideEffectCounters.instagramContainerCreateCount += 1;
  const containerRes = await fetch(`${GRAPH_API_BASE}/${IG_ACCOUNT_ID}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "REELS",
      video_url: blobUrl,
      caption: igCaption,
      share_to_feed: true,
      access_token: IG_ACCESS_TOKEN,
    }),
    signal: AbortSignal.timeout(60000),
  });
  const container = await containerRes.json();
  if (!container?.id) {
    executionResult.instagram.status = "failed";
    executionResult.instagram.errorExcerpt = sanitizeErrorText(JSON.stringify(container?.error ?? container ?? {}));
    bail("FAILED", "INSTAGRAM_CONTAINER_CREATE_FAILED", { executionResult });
  }
  executionResult.instagram.containerId = container.id;
  console.log(`           containerId=${container.id}`);

  // poll — status_code FINISHED까지 (Bearer 헤더: 토큰 URL 미노출)
  let finished = false;
  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    sideEffectCounters.instagramStatusPollCount += 1;
    try {
      const stRes = await fetch(`${GRAPH_API_BASE}/${container.id}?fields=status_code`, {
        headers: { Authorization: `Bearer ${IG_ACCESS_TOKEN}` },
        signal: AbortSignal.timeout(30000),
      });
      const st = await stRes.json();
      if (st?.status_code === "FINISHED") { finished = true; break; }
      if (st?.status_code === "ERROR") break;
    } catch { /* transient poll error — 다음 poll에서 재확인 (업로드 재시도 아님) */ }
  }
  if (!finished) {
    executionResult.instagram.status = "failed";
    bail("FAILED", "INSTAGRAM_CONTAINER_NOT_FINISHED", { executionResult });
  }

  // publish
  sideEffectCounters.instagramPublishCount += 1;
  const pubRes = await fetch(`${GRAPH_API_BASE}/${IG_ACCOUNT_ID}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: container.id, access_token: IG_ACCESS_TOKEN }),
    signal: AbortSignal.timeout(60000),
  });
  const pub = await pubRes.json();
  if (!pub?.id) {
    executionResult.instagram.status = "failed";
    executionResult.instagram.errorExcerpt = sanitizeErrorText(JSON.stringify(pub?.error ?? pub ?? {}));
    bail("FAILED", "INSTAGRAM_MEDIA_PUBLISH_FAILED", { executionResult });
  }
  igMediaId = String(pub.id);
  if (igMediaId === FORBIDDEN_IG_MEDIA_ID) {
    executionResult.instagram.status = "failed";
    bail("FAILED", "INSTAGRAM_RETURNED_FORBIDDEN_EVIDENCE_ID", { executionResult });
  }
  executionResult.instagram.status = "published";
  executionResult.instagram.mediaId = igMediaId;
  console.log(`           published mediaId=${igMediaId}`);
} catch (e) {
  if (executionResult.instagram.status !== "failed") {
    executionResult.instagram.status = "failed";
    executionResult.instagram.errorExcerpt = sanitizeErrorText(e?.message);
  }
  bail("FAILED", "INSTAGRAM_PUBLISH_FAILED", { executionResult });
}

// ── step 4: YouTube Shorts direct upload ──────────────────────────────────────
console.log("  [step 4/5] YouTube Shorts direct upload (videos.insert ×1)...");
const ytMeta = unit.youtubeMetadata ?? {};
let ytVideoId = null;
try {
  const { google } = await import("googleapis");
  const oauth2 = new google.auth.OAuth2(YT_CLIENT_ID, YT_CLIENT_SECRET, "http://localhost:3000/api/auth/youtube/callback");
  oauth2.setCredentials({ refresh_token: YT_REFRESH_TOKEN }); // access token은 refresh로 in-memory 발급
  const youtube = google.youtube({ version: "v3", auth: oauth2 });
  sideEffectCounters.youtubeInsertCount += 1;
  const resp = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: ytMeta.titleWithShortsSuffix ?? ytMeta.titleBase,
        description: ytMeta.descriptionBase ?? "",
        tags: Array.isArray(ytMeta.tags) ? ytMeta.tags : [],
        categoryId: ytMeta.categoryId ?? "22",
        defaultLanguage: ytMeta.defaultLanguage ?? "ko",
      },
      status: {
        privacyStatus: ytMeta.privacyStatus ?? "public",
        selfDeclaredMadeForKids: ytMeta.selfDeclaredMadeForKids === true,
        containsSyntheticMedia: ytMeta.containsSyntheticMedia === true,
      },
    },
    media: { mimeType: "video/mp4", body: createReadStream(ytSourcePath) },
  });
  if (!resp?.data?.id) {
    executionResult.youtube.status = "failed";
    bail("FAILED", "YOUTUBE_INSERT_RETURNED_NO_ID", { executionResult, partialExternalState: "instagram_published_youtube_failed" });
  }
  ytVideoId = String(resp.data.id);
  if (ytVideoId === FORBIDDEN_YT_VIDEO_ID) {
    executionResult.youtube.status = "failed";
    bail("FAILED", "YOUTUBE_RETURNED_FORBIDDEN_EVIDENCE_ID", { executionResult, partialExternalState: "instagram_published_youtube_failed" });
  }
  executionResult.youtube.status = "uploaded";
  executionResult.youtube.videoId = ytVideoId;
  executionResult.youtube.url = `https://www.youtube.com/shorts/${ytVideoId}`;
  console.log(`           uploaded videoId=${ytVideoId}`);
} catch (e) {
  if (executionResult.youtube.status !== "failed") {
    executionResult.youtube.status = "failed";
    executionResult.youtube.errorExcerpt = sanitizeErrorText(e?.message);
  }
  // Instagram은 이미 게시됨 — partial 상태를 정확히 기록하되 ledger 성공 기록은 절대 하지 않는다.
  bail("FAILED", "YOUTUBE_UPLOAD_FAILED_AFTER_INSTAGRAM_PUBLISHED", {
    executionResult,
    partialExternalState: "instagram_published_youtube_failed",
    ledgerNotWritten: true,
  });
}

// ── step 5: publish ledger write — 양쪽 성공 후에만, all-or-nothing ───────────
console.log("  [step 5/5] publish ledger write (all-or-nothing, both platforms succeeded)...");
{
  const publishedAtIso = nowIso();
  const readBack = evaluateLedgerDuplicateForUnit(ledgerAbs, unit.contentId, unit.version);
  if (readBack.readOk !== true || readBack.anyDuplicate) {
    // 실행 도중 ledger가 바뀐 극단 케이스 — 성공 기록 없이 실패로 보고(fail-closed).
    bail("FAILED", "LEDGER_STATE_CHANGED_DURING_EXECUTION", { executionResult, ledgerReadBack: { readOk: readBack.readOk, anyDuplicate: readBack.anyDuplicate } });
  }
  // 현재 ledger 로드(없으면 빈 ledger) 후 두 record를 all-or-nothing으로 추가.
  let baseLedger = { schemaVersion: "publish_ledger_v1", records: [] };
  if (existsSync(ledgerAbs)) {
    try {
      baseLedger = JSON.parse(readFileSync(ledgerAbs, "utf8"));
    } catch {
      bail("FAILED", "LEDGER_PARSE_FAILED_AT_WRITE", { executionResult });
    }
  }
  const recordResult = recordDualPlatformPublishRuntime(baseLedger, {
    contentId: unit.contentId,
    version: unit.version,
    instagram: {
      publishedId: igMediaId,
      variantId: INSTAGRAM_VARIANT_ID,
      publishedAtIso,
      metadata: { blobPathname, sourceSha256_12: igSha256.slice(0, 12) },
    },
    youtube: {
      publishedId: ytVideoId,
      publishedUrl: `https://www.youtube.com/shorts/${ytVideoId}`,
      variantId: YOUTUBE_VARIANT_ID,
      publishedAtIso,
      metadata: { sourceFileName: basename(ytSourcePath) },
    },
  });
  if (recordResult.ok !== true) {
    bail("FAILED", "LEDGER_RECORD_ALL_OR_NOTHING_REFUSED", {
      executionResult,
      anyDuplicateBlocked: recordResult.anyDuplicateBlocked,
    });
  }
  const writeResult = writePublishLedgerRuntime(ledgerAbs, recordResult.ledger);
  sideEffectCounters.ledgerWriteCount += 1;
  if (writeResult.ok !== true) {
    bail("FAILED", "LEDGER_FILE_WRITE_FAILED", { executionResult, ledgerWriteReason: writeResult.reason ?? null });
  }
  executionResult.ledger.status = "written";
  executionResult.ledger.writeOk = true;
  executionResult.ledger.recordedKeys = [recordResult.instagram.key, recordResult.youtube.key];
  console.log(`           ledger written: ${executionResult.ledger.recordedKeys.join(", ")}`);
}

// ── 성공 결과 ────────────────────────────────────────────────────────────────
console.log("\n  E2E PUBLISH SUCCESS — both platforms published, ledger recorded once.");
writeResultJson("PUBLISHED_DUAL_PLATFORM_OK", null, {
  contentId: unit.contentId,
  version: unit.version,
  igSourcePath: resolve(igSourcePath),
  igSourceSizeBytes: igSourceSize,
  ytSourcePath: resolve(ytSourcePath),
  ytSourceSizeBytes: ytSourceSize,
  executionResult,
  credentialPresence,
  defaultEvidenceRepublished: false,
});
process.exit(0);
