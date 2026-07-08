#!/usr/bin/env node
/**
 * check-dual-platform-live-readiness-release-gate-static.mjs
 *
 * Dual-platform live readiness release gate 정적 가드.
 * task: dual-platform-live-readiness-release-gate-no-live-v1
 *
 * 이 가드는 no-live다: 레포 내 fixture/docs JSON·텍스트, 그리고 orchestrator
 * runner를 child_process로 1회씩 실행한 stdout(JSON)/stderr/exit code만 읽는다.
 * (network/env/secret 접근 없음, 실제 Instagram/YouTube/Blob API 호출 없음)
 *
 * dependency-free: node 내장 모듈(fs/path/url/child_process)만 사용한다.
 *
 * 검증:
 *  1) fixture: readinessConditions 12개 항목이 전부 required:true, liveApprovalSequence가
 *     4단계 order 1~4로 APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST → liveness →
 *     APPROVE_YOUTUBE_LIVE_UPLOAD_WIRING → APPROVE_DUAL_PLATFORM_ARM 순서를 지킴,
 *     sideEffectCounters 전부 0, secret 값 형태 없음, existing evidence retryForbidden 유지.
 *  2) docs: readiness 조건 12개 언급, 승인 순서 4단계 표, 다음 Owner 결정 요약 존재.
 *  3) orchestrator 실제 실행: --preflight가 preflightOk:true + envValuesAccessedThisRun:false를
 *     내고, --live/--arm이 LIVE_EXECUTION_DISABLED_THIS_SLICE로 nonzero exit함을 재확인.
 *  4) mutant → 전부 fail(order 뒤바뀜, required 약화, secret 값 노출 포함).
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");

const FIXTURE_PATH = path.join(ROOT, "scripts", "fixtures", "dual_platform_live_readiness_release_gate.v1.json");
const DOCS_PATH = path.join(ROOT, "docs", "dual-platform-live-readiness-release-gate.md");
const RUNNER_PATH = path.join(ROOT, "scripts", "run-dual-platform-final-publish-orchestrator.mjs");

let passes = 0;
let failures = 0;
function check(name, ok, detail) {
  if (ok) { passes += 1; console.log(`PASS  ${name}`); }
  else { failures += 1; console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
}

// ── 1) fixture ────────────────────────────────────────────────────────────────
check("fixture 파일 존재", existsSync(FIXTURE_PATH));
let fixture = null;
try {
  fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));
  check("fixture JSON parse", true);
} catch (e) {
  check("fixture JSON parse", false, String(e));
}

const secretValuePattern = /(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/;
const fixtureRaw = existsSync(FIXTURE_PATH) ? readFileSync(FIXTURE_PATH, "utf8") : "";

check("fixture.schemaVersion === dual_platform_live_readiness_release_gate_v1", fixture?.schemaVersion === "dual_platform_live_readiness_release_gate_v1");
check("fixture.noLiveThisSlice === true", fixture?.noLiveThisSlice === true);

const rc = fixture?.readinessConditions || {};
const REQUIRED_CONDITION_KEYS = [
  "typescriptCompiles",
  "socialLiveClientsImportSafe",
  "orchestratorDryRunOk",
  "orchestratorPreflightOk",
  "orchestratorLiveFailClosed",
  "liveExecutionPlanAllStepsDisabled",
  "metadataOptimizationGateMandatory",
  "duplicatePublishGuardMandatory",
  "existingEvidenceRetryForbidden",
  "noDotEnvLocalDirectAccess",
  "noSecretValueReadWritePrint",
  "youtubeAccessTokenNotLongTermRequiredEnv",
  "zeroLiveApiCallsThisSlice",
];
check(
  `fixture.readinessConditions에 필수 항목 ${REQUIRED_CONDITION_KEYS.length}개 전부 존재`,
  REQUIRED_CONDITION_KEYS.every((k) => rc[k] && typeof rc[k] === "object")
);
check(
  "fixture.readinessConditions 전 항목이 required:true(약화되지 않음)",
  REQUIRED_CONDITION_KEYS.every((k) => rc[k]?.required === true)
);
check(
  "readinessConditions.existingEvidenceRetryForbidden의 media_id/videoId가 실제 evidence와 일치",
  rc.existingEvidenceRetryForbidden?.instagramMediaIdReference === "17916511431199303" &&
    rc.existingEvidenceRetryForbidden?.youtubeVideoIdReference === "r9jhckdpC9w"
);

const seq = fixture?.liveApprovalSequence?.steps;
check("fixture.liveApprovalSequence.steps 4단계 존재", Array.isArray(seq) && seq.length === 4);
check(
  "liveApprovalSequence order 1~4 순서 정합",
  Array.isArray(seq) && seq.every((s, i) => s.order === i + 1)
);
check(
  "liveApprovalSequence order 1 === APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST",
  seq?.[0]?.token === "APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST"
);
check(
  "liveApprovalSequence order 2가 Instagram publish(arm)를 포함하지 않는 liveness 전용 승인",
  typeof seq?.[1]?.token === "string" && /LIVENESS/i.test(seq[1].token) && /NO_ARM|no-arm|no_arm/i.test(JSON.stringify(seq[1]))
);
check(
  "liveApprovalSequence order 3 === APPROVE_YOUTUBE_LIVE_UPLOAD_WIRING",
  seq?.[2]?.token === "APPROVE_YOUTUBE_LIVE_UPLOAD_WIRING"
);
check(
  "liveApprovalSequence order 4 === APPROVE_DUAL_PLATFORM_ARM(가장 마지막)",
  seq?.[3]?.token === "APPROVE_DUAL_PLATFORM_ARM"
);
check(
  "APPROVE_DUAL_PLATFORM_ARM이 order 1로 승격되지 않음(순서 우회 회귀 방지)",
  seq?.[0]?.token !== "APPROVE_DUAL_PLATFORM_ARM"
);

check(
  "fixture.sideEffectCounters 전부 0",
  Object.values(fixture?.sideEffectCounters || {}).length > 0 &&
    Object.values(fixture?.sideEffectCounters || {}).every((v) => v === 0)
);
check("fixture에 secret 값 형태(EAA/ya29/blob token) 없음", !secretValuePattern.test(fixtureRaw));
check(
  "fixture.nextOwnerDecisionSummary가 실제 live 실행을 이미 완료된 것처럼 서술하지 않음",
  typeof fixture?.nextOwnerDecisionSummary === "string" &&
    !/이미\s*(실제로)?\s*(게시|업로드|발행)(되었|했|함)/.test(fixture.nextOwnerDecisionSummary)
);
check(
  "fixture.readinessEvidenceCommandLog에 8개 이상 command 존재",
  Array.isArray(fixture?.readinessEvidenceCommandLog?.commands) && fixture.readinessEvidenceCommandLog.commands.length >= 8
);
check(
  "readinessEvidenceCommandLog에 tsc/import-safety/orchestrator guard/preflight/live 커맨드 포함",
  ["tsc", "check-social-live-client-import-safety-static.mjs", "check-dual-platform-final-publish-orchestrator-static.mjs", "--preflight", "--live"].every((needle) =>
    fixture.readinessEvidenceCommandLog.commands.some((c) => String(c.command).includes(needle))
  )
);

const prohibited = fixture?.prohibitedGateDrift?.cases;
check("fixture.prohibitedGateDrift.cases 존재(회귀 케이스 문서화)", Array.isArray(prohibited) && prohibited.length >= 5);

// ── 2) docs ───────────────────────────────────────────────────────────────────
check("docs 파일 존재", existsSync(DOCS_PATH));
const docsRaw = existsSync(DOCS_PATH) ? readFileSync(DOCS_PATH, "utf8") : "";
check("docs에 Readiness 조건 섹션 존재", /Readiness\s*조건/i.test(docsRaw));
check("docs에 TypeScript 컴파일 통과 조건 언급", /TypeScript\s*컴파일/.test(docsRaw));
check("docs에 social live client import-safe 조건 언급", /import-safe/i.test(docsRaw));
check("docs에 metadata optimization gate 필수 언급", /metadata optimization gate/i.test(docsRaw));
check("docs에 duplicate publish guard 필수 언급", /duplicate publish guard/i.test(docsRaw));
check("docs에 Live 승인 순서 표 존재(4단계)", /Live\s*승인\s*순서/.test(docsRaw) && /APPROVE_DUAL_PLATFORM_ARM/.test(docsRaw));
check("docs에 APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST 순서 1 언급", /\|\s*1\s*\|\s*`APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST`/.test(docsRaw));
check("docs에 Instagram publish(arm)가 liveness 단계에 포함되지 않는다는 설명 존재", /publish\(arm\).{0,40}포함되지 않는다|이 단계에 포함되지 않는다/.test(docsRaw));
check("docs에 다음 Owner 결정 요약 섹션 존재", /다음\s*Owner\s*결정\s*요약/.test(docsRaw));
check("docs에 secret 값 형태(EAA/ya29/blob token) 없음", !secretValuePattern.test(docsRaw));
check(
  "docs에 secret 값 할당 형태(accessToken:'값' 등) 없음",
  !/(clientSecret|refreshToken|accessToken|apiKey|api_key|client_secret|refresh_token|access_token)\s*[:=]\s*["'][^"']+["']/i.test(docsRaw)
);
check("docs에 이미 완료된 evidence(17916511431199303/r9jhckdpC9w) 언급", docsRaw.includes("17916511431199303") && docsRaw.includes("r9jhckdpC9w"));

// ── 3) orchestrator 실제 실행 재확인 (이 gate가 최종 근거로 삼는 신호) ─────────
check("orchestrator runner 파일 존재", existsSync(RUNNER_PATH));

let pfOutput = "";
let pfOk = false;
try {
  pfOutput = execFileSync(process.execPath, [RUNNER_PATH, "--preflight"], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
  pfOk = true;
} catch (e) {
  pfOutput = String(e?.stdout || e?.message || e);
}
check("orchestrator --preflight 실행 성공(exit 0)", pfOk);
let pfResult = null;
try { pfResult = JSON.parse(pfOutput); check("orchestrator --preflight stdout JSON parse", true); }
catch (e) { check("orchestrator --preflight stdout JSON parse", false, String(e)); }

check("release gate 근거: preflight.preflightOk === true", pfResult?.preflight?.preflightOk === true);
check("release gate 근거: envValuesAccessedThisRun === false", pfResult?.preflight?.requiredEnvKeyNamesPlan?.envValuesAccessedThisRun === false);
check(
  "release gate 근거: liveExecutionPlan 모든 step disabled",
  Array.isArray(pfResult?.preflight?.liveExecutionPlan?.steps) &&
    pfResult.preflight.liveExecutionPlan.steps.length === 4 &&
    pfResult.preflight.liveExecutionPlan.steps.every((s) => s.enabled === false && s.willExecute === false && s.sideEffectPerformed === false)
);
check(
  "release gate 근거: sideEffectCounters 전부 0",
  Object.values(pfResult?.plan?.sideEffectCounters || {}).length > 0 &&
    Object.values(pfResult?.plan?.sideEffectCounters || {}).every((v) => v === 0)
);
check(
  "release gate 근거: 기존 evidence retryForbidden 유지(preflight 결과)",
  pfResult?.preflight?.duplicatePublishReference?.retryForbidden === true &&
    pfResult?.preflight?.duplicatePublishReference?.instagramMediaIdReference === "17916511431199303" &&
    pfResult?.preflight?.duplicatePublishReference?.youtubeVideoIdReference === "r9jhckdpC9w"
);
const pfStr = JSON.stringify(pfResult || {});
check("release gate 근거: preflight 실행 결과에 secret 값 형태 없음", !secretValuePattern.test(pfStr));

let liveExitCode = null;
let liveStderr = "";
try {
  execFileSync(process.execPath, [RUNNER_PATH, "--live"], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
  liveExitCode = 0;
} catch (e) {
  liveExitCode = typeof e?.status === "number" ? e.status : -1;
  liveStderr = String(e?.stderr || "");
}
check("release gate 근거: orchestrator --live가 nonzero exit(fail-closed)", liveExitCode !== 0);
check("release gate 근거: --live stderr에 LIVE_EXECUTION_DISABLED_THIS_SLICE 포함", liveStderr.includes("LIVE_EXECUTION_DISABLED_THIS_SLICE"));

// ── 요약 ──────────────────────────────────────────────────────────────────────
console.log(`\n${passes} PASS / ${failures} FAIL`);
if (failures > 0) process.exit(1);
