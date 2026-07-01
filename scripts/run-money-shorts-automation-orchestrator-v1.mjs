#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// run-money-shorts-automation-orchestrator-v1.mjs
//
// MONEY SHORTS OS — AUTOMATION ORCHESTRATOR v1 (NO-LIVE)
//
// 목적: 이미 검증된 scripts/fixtures + published record를 소비해, money-shorts
//       pipeline 상태를 한 command로 점검하고 다음 실행 준비 여부를 판정한다.
//
// 이 runner는 절대 다음을 하지 않는다:
//   - 이미지/TTS/render/mux/ffmpeg 생성 또는 재실행
//   - YouTube/Instagram 업로드/수정/삭제
//   - Vercel deploy
//   - ECOS/BOK 재조회
//   - env/secret 직접 읽기 (process.env, .env 파일 접근 없음)
//   - dependency install
//
// 지원 모드: --mode status | preflight  (둘 다 no-live)
//   status   : 파일/record 존재 + pipeline stage 상태 요약 (네트워크·guard 실행 없음).
//   preflight: 위 + static guard 실행(read-only) + accepted video 존재 + platform
//              profile 존재 + public URL 접근성 + publish record 정합성 확인.
//
// live 옵션(--arm/--publish/--upload/--deploy)이 들어오면 즉시 ABORT.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, isAbsolute } from "node:path";
import { spawnSync } from "node:child_process";
import { get as httpsGet } from "node:https";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

// ── CLI parse ────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
function getArg(flag) {
  const i = argv.indexOf(flag);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
}
function hasFlag(flag) {
  return argv.includes(flag);
}

// ── LIVE-OPTION ABORT GATE (must run before anything else) ────────────────────
const FORBIDDEN_LIVE_FLAGS = ["--arm", "--publish", "--upload", "--deploy", "--live", "--generate"];
const suppliedLive = FORBIDDEN_LIVE_FLAGS.filter((f) => argv.includes(f));
if (suppliedLive.length > 0) {
  console.error(
    `ABORT: Automation Orchestrator v1 is NO-LIVE only. ` +
      `Live options are not supported: ${suppliedLive.join(", ")}. ` +
      `This runner never uploads, publishes, renders, or deploys. ` +
      `Use --mode status|preflight only.`
  );
  process.exit(3);
}

const jobPath = getArg("--job");
const mode = getArg("--mode") ?? "status";
const asJson = hasFlag("--json");
const outDir = getArg("--out-dir");

if (!jobPath) {
  console.error("ABORT: --job <path> is required.");
  process.exit(2);
}
if (mode !== "status" && mode !== "preflight") {
  console.error(`ABORT: --mode must be 'status' or 'preflight' (got '${mode}'). No-live only.`);
  process.exit(2);
}

// ── load job manifest (read-only) ─────────────────────────────────────────────
const jobAbs = isAbsolute(jobPath) ? jobPath : resolve(REPO_ROOT, jobPath);
let job;
try {
  job = JSON.parse(readFileSync(jobAbs, "utf8"));
} catch (e) {
  console.error(`ABORT: cannot read/parse job manifest: ${jobAbs}\n  ${e.message}`);
  process.exit(2);
}

// ── helpers ────────────────────────────────────────────────────────────────
function repoPath(rel) {
  return isAbsolute(rel) ? rel : resolve(REPO_ROOT, rel);
}
function fileExists(p) {
  try {
    return existsSync(p);
  } catch {
    return false;
  }
}
function fileSize(p) {
  try {
    return statSync(p).size;
  } catch {
    return null;
  }
}
function readJsonSafe(p) {
  try {
    return { ok: true, data: JSON.parse(readFileSync(p, "utf8")) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

const findings = [];
function record(id, label, state, detail = "") {
  // state: ready | not_ready | env_network_failure | skipped
  findings.push({ id, label, state, detail });
}

// ── STAGE-LEVEL STATUS (no network, both modes) ──────────────────────────────

// source facts
const sf = job.sourceFactRef ?? {};
record(
  "source_facts",
  "Source facts (ECOS base rate)",
  sf.latestPeriod && sf.currentValueText && sf.changeDirection ? "ready" : "not_ready",
  sf.latestPeriod ? `${sf.latestPeriod} ${sf.currentValueText} ${sf.changeDirection}` : "missing sourceFactRef fields"
);

// visual set manifest
const visualManifestPath = job.selectedImageSetManifest?.path
  ? repoPath(job.selectedImageSetManifest.path)
  : null;
record(
  "visual_set",
  "Selected scene image set",
  visualManifestPath && fileExists(visualManifestPath) ? "ready" : "not_ready",
  visualManifestPath ? job.selectedImageSetManifest.path : "no selectedImageSetManifest.path"
);

// platform render profiles fixture present + both profiles + safe-frame profile id
const prpPath = job.platformRenderProfilesManifest?.path
  ? repoPath(job.platformRenderProfilesManifest.path)
  : null;
let prpData = null;
if (prpPath && fileExists(prpPath)) {
  const r = readJsonSafe(prpPath);
  if (r.ok) prpData = r.data;
}
const hasBothProfiles =
  !!prpData?.platformProfiles?.instagram_reels && !!prpData?.platformProfiles?.youtube_shorts;
record(
  "platform_render_profiles",
  "Platform render profiles (IG Reels / YT Shorts safe-frame)",
  prpData && hasBothProfiles ? "ready" : "not_ready",
  prpData ? (hasBothProfiles ? "both profiles present" : "missing a platform profile") : "profiles fixture missing/unparseable"
);

// final video accepted (manifest + accepted video path exists)
const fvaPath = job.finalVideoAcceptanceManifest?.path ? repoPath(job.finalVideoAcceptanceManifest.path) : null;
let fvaData = null;
if (fvaPath && fileExists(fvaPath)) {
  const r = readJsonSafe(fvaPath);
  if (r.ok) fvaData = r.data;
}
const acceptedVideoPath = job.acceptedFinalVideoPath ?? null;
const acceptedVideoExists = acceptedVideoPath ? fileExists(acceptedVideoPath) : false;
const acceptedByOwner = fvaData?.acceptedByOwner === true;
record(
  "final_video_accepted",
  "Final video accepted by Owner",
  acceptedByOwner && acceptedVideoExists ? "ready" : "not_ready",
  `acceptedByOwner=${acceptedByOwner}, videoExists=${acceptedVideoExists}${acceptedVideoExists ? ` (${fileSize(acceptedVideoPath)} bytes)` : ""}`
);

// publish records (read-only) — youtube + instagram
const ytRec = job.publishRecords?.youtube_shorts ?? {};
const igRec = job.publishRecords?.instagram_reels ?? {};

function evalPublish(recCfg, kind) {
  const p = recCfg?.recordPath;
  if (!p) return { state: "not_ready", detail: "no recordPath" };
  if (!fileExists(p)) return { state: "not_ready", detail: `record missing: ${p}` };
  const r = readJsonSafe(p);
  if (!r.ok) return { state: "not_ready", detail: `record unparseable: ${r.error}` };
  const res = r.data?.results?.[kind] ?? {};
  if (kind === "youtube") {
    const idMatch = recCfg.expectedVideoId ? res.videoId === recCfg.expectedVideoId : !!res.videoId;
    const ok = res.status === "uploaded" && idMatch;
    return { state: ok ? "ready" : "not_ready", detail: `status=${res.status}, videoId=${res.videoId ?? "null"}` };
  } else {
    const idMatch = recCfg.expectedMediaId ? res.mediaId === recCfg.expectedMediaId : !!res.mediaId;
    const ok = res.status === "uploaded" && idMatch && r.data?.publishExecuted === true;
    return {
      state: ok ? "ready" : "not_ready",
      detail: `status=${res.status}, mediaId=${res.mediaId ?? "null"}, publishExecuted=${r.data?.publishExecuted}`,
    };
  }
}

const ytEval = evalPublish(ytRec, "youtube");
record("youtube_published", "YouTube Shorts published", ytEval.state, ytEval.detail);
const igEval = evalPublish(igRec, "instagram");
record("instagram_published", "Instagram Reels published", igEval.state, igEval.detail);

// public bridge — status: URL presence only; preflight: reachability
async function checkPublicUrlReachable(url) {
  return new Promise((res) => {
    let done = false;
    const finish = (state, detail) => {
      if (!done) {
        done = true;
        res({ state, detail });
      }
    };
    try {
      const req = httpsGet(url, { method: "GET", headers: { Range: "bytes=0-0" } }, (r) => {
        const code = r.statusCode ?? 0;
        r.resume();
        if (code >= 200 && code < 400) finish("ready", `HTTP ${code}`);
        else finish("not_ready", `HTTP ${code}`);
      });
      req.setTimeout(8000, () => {
        req.destroy();
        finish("env_network_failure", "timeout after 8s");
      });
      req.on("error", (e) => finish("env_network_failure", `network error: ${e.code || e.message}`));
    } catch (e) {
      finish("env_network_failure", `request setup failed: ${e.message}`);
    }
  });
}

const publicUrl = job.publicVideoUrl ?? null;
if (mode === "status") {
  record(
    "public_bridge",
    "Public mp4 bridge (buildgongjakso.com)",
    publicUrl && /^https:\/\//.test(publicUrl) ? "ready" : "not_ready",
    publicUrl ? "URL present (reachability checked in preflight)" : "no publicVideoUrl"
  );
} else {
  if (!publicUrl || !/^https:\/\//.test(publicUrl)) {
    record("public_bridge", "Public mp4 bridge (buildgongjakso.com)", "not_ready", "no https publicVideoUrl");
  } else {
    const rr = await checkPublicUrlReachable(publicUrl);
    record("public_bridge", "Public mp4 bridge (buildgongjakso.com)", rr.state, rr.detail);
  }
}

// ── PREFLIGHT-ONLY: static guards (read-only, no install) ────────────────────
const guardResults = [];
if (mode === "preflight") {
  const guards = Array.isArray(job.requiredStaticGuards) ? job.requiredStaticGuards : [];
  for (const g of guards) {
    const gAbs = repoPath(g);
    if (!fileExists(gAbs)) {
      guardResults.push({ guard: g, pass: false, detail: "guard file missing" });
      record(`guard:${g}`, `Static guard ${g}`, "not_ready", "guard file missing");
      continue;
    }
    // read-only: run node on the guard with no extra args, no install, shell:false.
    const proc = spawnSync(process.execPath, [gAbs], {
      cwd: REPO_ROOT,
      shell: false,
      encoding: "utf8",
      timeout: 60000,
    });
    const pass = proc.status === 0;
    const tail = (proc.stdout || "").trim().split(/\r?\n/).slice(-1)[0] || "";
    guardResults.push({ guard: g, pass, detail: pass ? tail.slice(0, 120) : `exit ${proc.status}` });
    record(`guard:${g}`, `Static guard ${g}`, pass ? "ready" : "not_ready", pass ? "PASS" : `exit ${proc.status}`);
  }
}

// ── platform policy sanity (both modes) ──────────────────────────────────────
const ppp = job.platformPublishPolicy ?? {};
record(
  "policy_youtube_profile",
  "YouTube publish policy requires safe-frame profile",
  ppp.youtube_shorts?.requiredRenderProfileId === "youtube_shorts_safe_frame_v1" ? "ready" : "not_ready",
  `requiredRenderProfileId=${ppp.youtube_shorts?.requiredRenderProfileId}`
);
record(
  "policy_instagram_profile",
  "Instagram publish policy requires full-vertical profile",
  ppp.instagram_reels?.requiredRenderProfileId === "instagram_reels_full_vertical_v1" ? "ready" : "not_ready",
  `requiredRenderProfileId=${ppp.instagram_reels?.requiredRenderProfileId}`
);
record(
  "policy_side_effect_no_live",
  "Side-effect policy is no-live",
  job.sideEffectPolicy?.mode === "no_live" ? "ready" : "not_ready",
  `mode=${job.sideEffectPolicy?.mode}`
);

// ── ROLLUP: derived status decisions ─────────────────────────────────────────
function stateOf(id) {
  return findings.find((f) => f.id === id)?.state ?? "missing";
}
const anyEnvNetFailure = findings.some((f) => f.state === "env_network_failure");
const coreStageIds = [
  "source_facts",
  "visual_set",
  "platform_render_profiles",
  "final_video_accepted",
  "youtube_published",
  "instagram_published",
];
const coreAllReady = coreStageIds.every((id) => stateOf(id) === "ready");
const publicBridgeReady = stateOf("public_bridge") === "ready";
const guardsAllPass = mode === "preflight" ? guardResults.every((g) => g.pass) : null;

// derived flags
const sourceFactsReady = stateOf("source_facts") === "ready";
const visualSetReady = stateOf("visual_set") === "ready";
const platformProfilesReady = stateOf("platform_render_profiles") === "ready";
const finalVideoAccepted = stateOf("final_video_accepted") === "ready";
const youtubePublished = stateOf("youtube_published") === "ready";
const instagramPublished = stateOf("instagram_published") === "ready";

// next job can start: this job fully complete (published both) AND owner has NOT
// yet approved next-job automation → orchestrator reports it as "gated_owner_approval".
const thisJobComplete = coreAllReady && (mode === "status" ? true : publicBridgeReady) && (guardsAllPass !== false);
const nextJobAutomationApproved = job.ownerApprovalState?.nextJobAutomationApprovedByOwner === true;
const nextJobCanStart = thisJobComplete && nextJobAutomationApproved;
const nextJobGatedReason = !thisJobComplete
  ? "current job not fully complete"
  : !nextJobAutomationApproved
  ? "owner has not approved next-job automation"
  : "ok";

// rerun required: any core stage not ready, OR (preflight) any guard fail / public bridge not reachable
const rerunRequired =
  !coreAllReady || (mode === "preflight" && (guardsAllPass === false || (!publicBridgeReady && !anyEnvNetFailure)));

const rollup = {
  jobId: job.jobId,
  mode,
  sourceFactsReady,
  visualSetReady,
  platformRenderProfilesReady: platformProfilesReady,
  finalVideoAccepted,
  publicBridgeReady: mode === "preflight" ? publicBridgeReady : "not_checked_in_status",
  youtubePublished,
  instagramPublished,
  thisJobComplete,
  nextJobCanStart,
  nextJobGatedReason,
  rerunRequired,
  envOrNetworkFailure: anyEnvNetFailure,
  guardsAllPass,
};

// ── OUTPUT ───────────────────────────────────────────────────────────────────
const output = {
  schemaVersion: "money_shorts_automation_orchestrator_status_v1",
  generatedBy: "run-money-shorts-automation-orchestrator-v1.mjs",
  mode,
  jobId: job.jobId,
  category: job.category,
  sideEffectMode: job.sideEffectPolicy?.mode ?? null,
  liveExecuted: false,
  findings,
  guardResults: mode === "preflight" ? guardResults : undefined,
  rollup,
};

// optional record write (only into out-dir, must be outside repo root)
let recordWritten = null;
if (outDir) {
  const outAbs = resolve(outDir);
  if (outAbs === REPO_ROOT || outAbs.startsWith(REPO_ROOT + "\\") || outAbs.startsWith(REPO_ROOT + "/")) {
    console.error(`ABORT: --out-dir must be OUTSIDE repo root (no writes into repo).\n  repo: ${REPO_ROOT}\n  out-dir: ${outAbs}`);
    process.exit(2);
  }
  try {
    mkdirSync(outAbs, { recursive: true });
    const recPath = join(outAbs, "automation-status.json");
    writeFileSync(recPath, JSON.stringify(output, null, 2), "utf8");
    recordWritten = recPath;
  } catch (e) {
    console.error(`WARN: could not write record to out-dir: ${e.message}`);
  }
}

if (asJson) {
  console.log(JSON.stringify({ ...output, recordWritten }, null, 2));
} else {
  console.log(`\n══════════════════════════════════════════════════════════`);
  console.log(`  MONEY SHORTS OS — AUTOMATION ORCHESTRATOR v1  [${mode.toUpperCase()}]  (NO-LIVE)`);
  console.log(`══════════════════════════════════════════════════════════`);
  console.log(`  job: ${job.jobId}  |  category: ${job.category}`);
  console.log(`  side-effect mode: ${job.sideEffectPolicy?.mode}  |  liveExecuted: false`);
  console.log(`──────────────────────────────────────────────────────────`);
  for (const f of findings) {
    const mark = f.state === "ready" ? "OK " : f.state === "env_network_failure" ? "NET" : "—  ";
    console.log(`  [${mark}] ${f.label}${f.detail ? `  (${f.detail})` : ""}`);
  }
  console.log(`──────────────────────────────────────────────────────────`);
  console.log(`  sourceFactsReady        : ${rollup.sourceFactsReady}`);
  console.log(`  visualSetReady          : ${rollup.visualSetReady}`);
  console.log(`  platformProfilesReady   : ${rollup.platformRenderProfilesReady}`);
  console.log(`  finalVideoAccepted      : ${rollup.finalVideoAccepted}`);
  console.log(`  publicBridgeReady       : ${rollup.publicBridgeReady}`);
  console.log(`  youtubePublished        : ${rollup.youtubePublished}`);
  console.log(`  instagramPublished      : ${rollup.instagramPublished}`);
  console.log(`  thisJobComplete         : ${rollup.thisJobComplete}`);
  console.log(`  nextJobCanStart         : ${rollup.nextJobCanStart}  (${rollup.nextJobGatedReason})`);
  console.log(`  rerunRequired           : ${rollup.rerunRequired}`);
  console.log(`  envOrNetworkFailure     : ${rollup.envOrNetworkFailure}`);
  if (mode === "preflight") console.log(`  guardsAllPass           : ${rollup.guardsAllPass}`);
  if (recordWritten) console.log(`  record written          : ${recordWritten}`);
  console.log(`══════════════════════════════════════════════════════════\n`);
}

// exit code: 0 if this job's core stages are consistent (published state recognized),
// non-zero only on hard rerun-required (missing core artifact / guard fail).
// env/network failure in preflight public-bridge does NOT hard-fail (classified separately).
if (rerunRequired && !(mode === "preflight" && anyEnvNetFailure && coreAllReady && guardsAllPass !== false)) {
  process.exit(1);
}
process.exit(0);
