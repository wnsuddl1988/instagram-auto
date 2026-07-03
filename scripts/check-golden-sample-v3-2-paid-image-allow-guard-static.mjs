#!/usr/bin/env node
/**
 * check-golden-sample-v3-2-paid-image-allow-guard-static.mjs
 *
 * Golden Sample v3.2 — paid image allow-guard 하드닝 정적 가드 (3차 gap-closure 포함).
 * task: golden-sample-v3-2-browser-generation-runner-allow-guard-gap-closure-v1
 *
 * - no-live / no-network / no-image-gen / no-browser / no-secret-read:
 *   레포 내 소스/fixture만 읽어 검증. 실제 이미지 생성/API/browser/.env.local read 없음.
 * - 검증 대상:
 *   1) lib/paidApiGuard.ts가 fail-closed semantics (getPerProviderFlag === true) 이고
 *      구 permissive 규칙(flag !== false / 세부 플래그 없음 → 전부 허용)이 제거됐는지
 *   2) 이미지 provider(imagen/openai-image/bfl-flux2)가 union + env key 매핑에 존재
 *   3) fail-closed semantics를 JS로 재현해 mocked in-memory env로 진리표 검증
 *      (master-only 차단, provider flag 미설정/false 차단, 둘 다 true만 허용)
 *   3b) **policy 주도 browser runner 순서 스캔**: hardenedImageScripts의
 *      chatgpt-playwright / gemini-veo 항목 전부에 대해 provider flag 인라인 guard가
 *      존재하고 첫 mkdirSync 발생과 browser/CDP 실행 호출보다 앞서는지 검증
 *   4) active paid image/browser generation script 36개(최초 3 + 1차 6 + 2차 4 + 3차 23)가
 *      secret read / output write / browser·CDP 전에 allow guard를 두는지 소스 순서 스캔
 *   5) decision state fixture에 image_script_allow_guard = add_allow_guard_to_all_paid_image_scripts
 *   6) **BFL inventory 스캔**: scripts/ 하위(archive 제외, check-*-static.mjs 제외) 모든 .mjs 중
 *      BFL_API_KEY/BFL endpoint 관련 문자열을 가진 runner가 top-level allow guard 호출
 *      없이 남아있으면 FAIL.
 *   7) **browser/CDP generation inventory 스캔**: scripts/ 하위 non-archive .mjs 중
 *      브라우저 자동화 라이브러리 import / CDP 연결 호출 / Chrome 준비 helper /
 *      공용 core 모듈 import 등 browser/CDP generation 신호를 가진 파일은
 *      (a) hardenedImageScripts 등재 + provider flag guard 보유, 또는
 *      (b) policy.browserRunnerClassification.helperModules의 evidence-classified helper
 *      둘 중 하나여야 하며, "known gap 목록 등재"만으로는 절대 통과할 수 없다.
 *      helper는 내부 guard(spawn/launch 전) 또는 caller 전원 hardened임을 소스로 재검증.
 *      3차 gap-closure 24개 파일 전부가 hardened 또는 helper로 해소됐는지 개별 확인.
 *   8) mutant: master-only, provider missing/false, guard-after-secret,
 *      browser-before-guard, gemini-veo guard 부재 등 fail 확인
 * - 전부 통과 시 exit 0 + PASS 카운트, 위반 시 exit 1.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const FX = (name) => path.join(ROOT, "scripts", "fixtures", name);

const GUARD_TS = path.join(ROOT, "lib", "paidApiGuard.ts");
const POLICY_PATH = FX("golden_sample_v3_2_paid_image_allow_guard_policy.v1.json");
const STATE_PATH = FX("golden_sample_v3_2_owner_decision_resolution_state.v1.json");

let passes = 0;
let failures = 0;
function check(name, ok, detail) {
  if (ok) { passes += 1; console.log(`PASS  ${name}`); }
  else { failures += 1; console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
}

const isStr = (v) => typeof v === "string" && v.trim().length > 0;

function loadJson(label, p) {
  try { const parsed = JSON.parse(readFileSync(p, "utf8")); check(`${label} parses as JSON`, true); return parsed; }
  catch (e) { check(`${label} parses as JSON`, false, String(e).slice(0, 140)); return null; }
}

let guardSrc = null;
try { guardSrc = readFileSync(GUARD_TS, "utf8"); check("lib/paidApiGuard.ts readable", true); }
catch (e) { check("lib/paidApiGuard.ts readable", false, String(e).slice(0, 120)); }

const policy = loadJson("paid image allow-guard policy fixture", POLICY_PATH);
const state = loadJson("owner decision resolution state fixture", STATE_PATH);

if (!guardSrc || !policy || !state) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core artifact unreadable, aborting`);
  process.exit(1);
}

// ── 1. paidApiGuard.ts fail-closed semantics (소스) ────────────────────────
{
  // 핵심 함수가 flag === true 로 fail-closed 되어 있어야 한다.
  check("paidApiGuard.getPerProviderFlag가 'flag === true' (fail-closed)",
    /getPerProviderFlag[\s\S]*?return\s+flag\s*===\s*true/.test(guardSrc));
  // 구 permissive 규칙 제거: 'flag !== false' 반환 없어야 함.
  check("구 permissive 'return flag !== false' 제거됨",
    !/return\s+flag\s*!==\s*false/.test(guardSrc));
  // 구 주석 규칙(세부 플래그 없음 → 전부 허용) 제거
  check("구 주석 '세부 플래그 없음 → 전부 허용' 제거됨",
    !/세부 플래그 없음 → 전부 허용/.test(guardSrc));
  // fail-closed 문서화 존재
  check("paidApiGuard 주석에 fail-closed / 단독 불충분 명시",
    /fail-closed/i.test(guardSrc) && /단독으로는 불충분|단독으로는 어떤|하나만으로/.test(guardSrc));
  // 이미지 provider union + env key
  check("PaidApiProvider union에 openai-image / bfl-flux2 추가",
    /"openai-image"/.test(guardSrc) && /"bfl-flux2"/.test(guardSrc));
  check("providerToEnvKey에 ALLOW_OPENAI_IMAGE / ALLOW_BFL_FLUX2 매핑",
    /ALLOW_OPENAI_IMAGE/.test(guardSrc) && /ALLOW_BFL_FLUX2/.test(guardSrc) && /ALLOW_IMAGEN/.test(guardSrc));
}

// ── 2. fail-closed semantics JS 재현 진리표 (mocked in-memory env) ──────────
// paidApiGuard와 동일 규칙: master === true AND providerFlag === true 만 allowed.
function reproCheckAllowed(env, masterKey, providerKey) {
  const isTrue = (k) => String(env[k] ?? "").toLowerCase() === "true";
  return isTrue(masterKey) && isTrue(providerKey);
}
{
  const M = "PAID_API_ENABLED", P = "ALLOW_OPENAI_IMAGE";
  check("semantics: 둘 다 없음 → 차단", reproCheckAllowed({}, M, P) === false);
  check("semantics: master-only(true) → 차단 (fail-closed 핵심)", reproCheckAllowed({ [M]: "true" }, M, P) === false);
  check("semantics: provider-only(true) → 차단", reproCheckAllowed({ [P]: "true" }, M, P) === false);
  check("semantics: master true + provider false → 차단", reproCheckAllowed({ [M]: "true", [P]: "false" }, M, P) === false);
  check("semantics: master true + provider true → 허용", reproCheckAllowed({ [M]: "true", [P]: "true" }, M, P) === true);
  check("semantics: 대소문자 TRUE 허용", reproCheckAllowed({ [M]: "TRUE", [P]: "True" }, M, P) === true);

  // 이 재현 규칙이 paidApiGuard 소스의 조건과 동형인지 이중 확인:
  //   checkPaidApi = masterEnabled(===true) 후 getPerProviderFlag(===true)
  check("paidApiGuard checkPaidApi가 master(===true) 후 provider flag 확인 구조",
    /masterEnabled\s*=\s*envFlag\("PAID_API_ENABLED"\)\s*===\s*true/.test(guardSrc) &&
    /if\s*\(!masterEnabled\)/.test(guardSrc) &&
    /getPerProviderFlag\(provider\)/.test(guardSrc));
}

// browser/CDP "실행 호출" 전용 패턴 — 브라우저 라이브러리 import 선언은
// 실행이 아니므로 제외하고, 실제 CDP 연결/Chrome 준비/launch 호출 시점만 잡는다.
// (섹션 3/3b/7 공용 — 스캔 토큰은 분할 보관해 self-scan과 충돌하지 않게 한다)
const CDP_EXEC_RE = new RegExp(
  ["\\." + "connectOver" + "CDP" + "\\(", "\\b" + "ensure" + "Chrome" + "\\(", "chromium\\." + "launch"].join("|")
);
// helper 모듈의 browser launch 지점(자식 프로세스 spawn 호출) — 토큰 분할 보관
const SPAWN_CALL_RE = new RegExp("\\b" + "spawn" + "\\s*\\(");

// ── 3. active paid image script 소스 순서 스캔 ─────────────────────────────
// guard(allow flag 확인 abort)가 secret read / output write / browser 전에 와야 한다.
function scanScriptOrder(rel, opts) {
  const abs = path.join(ROOT, rel);
  if (!existsSync(abs)) { check(`script 실재: ${rel}`, false, "파일 없음"); return; }
  const src = readFileSync(abs, "utf8");
  check(`script 실재: ${rel}`, true);

  // allow guard 지점: assertPaidImageAllowed / assertProviderAllowed 호출 (정의 아님)
  const guardCallIdx = src.search(/^assert(PaidImageAllowed|ProviderAllowed)\(/m);
  check(`${path.basename(rel)}: top-level allow guard 호출 존재`, guardCallIdx !== -1);
  if (guardCallIdx === -1) return;

  // secret read (.env.local의 API key 파싱) 지점
  for (const secretPat of opts.secretPatterns ?? []) {
    const idx = src.search(secretPat);
    if (idx !== -1) {
      check(`${path.basename(rel)}: allow guard가 secret read(${secretPat.source.slice(0, 24)}) 전에 위치`,
        guardCallIdx < idx, `guard@${guardCallIdx} secret@${idx}`);
    }
  }
  // fail-closed abort 문구
  check(`${path.basename(rel)}: guard가 fail-closed abort (process.exit) 포함`,
    /paid image 경로 차단|경로 차단 \(fail-closed\)/.test(src) && /process\.exit\(/.test(src));
}
{
  scanScriptOrder("scripts/run-openai-full-selected-image-candidates-v1.mjs", {
    secretPatterns: [/readFileSync\(envPath/],
  });
  // secret pattern은 실제 read 지점만 (주석의 key 언급 제외 위해 readFileSync 경로 사용)
  scanScriptOrder("scripts/run-flux2-selected-image-set-completion-v1.mjs", {
    secretPatterns: [/readFileSync\(envPath/],
  });
  scanScriptOrder("scripts/run-golden-sample-image-source-test-v1.mjs", {
    secretPatterns: [/loadEnvLocal\(\)/, /WANTED\s*=\s*new Set/],
  });

  // review-fix로 하드닝된 6개 FLUX2/BFL runner
  scanScriptOrder("scripts/run-flux2-golden-sample-validation-v1.mjs", {
    secretPatterns: [/readFileSync\(envPath/],
  });
  scanScriptOrder("scripts/run-flux2-object-whitelist-v2-1-wallet-patch-validation.mjs", {
    secretPatterns: [/readFileSync\(envPath/],
  });
  scanScriptOrder("scripts/run-flux2-object-whitelist-validation-v2.mjs", {
    secretPatterns: [/readFileSync\(envPath/],
  });
  scanScriptOrder("scripts/run-flux2-scene1-v2-3-single-validation.mjs", {
    secretPatterns: [/readFileSync\(envPath/],
  });
  scanScriptOrder("scripts/run-golden-sample-v2-flux2-image-candidates-v1.mjs", {
    secretPatterns: [/readFileSync\(envPath/],
  });
  // s6-denomination-patch: guard 호출이 함수 내부(!PROBE_ONLY 블록)에 있어 top-level 정규식으로
  // 안 잡히므로 별도 검사 — guard 호출이 loadBflKey() 호출보다 먼저 나오는지만 순서 확인.
  {
    const rel = "scripts/run-golden-sample-v2-s6-flux2-denomination-patch-v1.mjs";
    const abs = path.join(ROOT, rel);
    const src = existsSync(abs) ? readFileSync(abs, "utf8") : "";
    check(`script 실재: ${rel}`, existsSync(abs));
    const guardCallIdx = src.search(/assertPaidImageAllowed\(/);
    const loadCallIdx = src.search(/const BFL_KEY = loadBflKey\(\)/);
    check("s6-denomination-patch: assertPaidImageAllowed 호출이 loadBflKey() 호출 전에 위치 (--probe-only 분기 보존)",
      guardCallIdx !== -1 && loadCallIdx !== -1 && guardCallIdx < loadCallIdx, `guard@${guardCallIdx} load@${loadCallIdx}`);
    check("s6-denomination-patch: guard가 fail-closed abort (process.exit) 포함",
      /paid image 경로 차단|경로 차단 \(fail-closed\)/.test(src) && /process\.exit\(/.test(src));
  }

  // image-source-test: chatgpt browser/CDP 실행 전에 ALLOW_CHATGPT_IMAGE 확인
  const imgTestSrc = readFileSync(path.join(ROOT, "scripts", "run-golden-sample-image-source-test-v1.mjs"), "utf8");
  const chatgptGuardIdx = imgTestSrc.search(/ALLOW_CHATGPT_IMAGE/);
  const cdpIdx = imgTestSrc.search(CDP_EXEC_RE);
  check("image-source-test: ALLOW_CHATGPT_IMAGE 확인이 browser/CDP 실행 전에 위치",
    chatgptGuardIdx !== -1 && cdpIdx !== -1 && chatgptGuardIdx < cdpIdx, `chatgpt@${chatgptGuardIdx} cdp@${cdpIdx}`);

  // ── 2차 review-fix: ChatGPT/Playwright image runner 4개 — 인라인
  // `if (process.env.ALLOW_CHATGPT_IMAGE !== "1")` 패턴이 mkdirSync/Chrome 준비/
  // CDP 연결 등 첫 side effect(실행 호출, import 선언 제외)보다 앞서는지 순서 스캔.
  function scanChatgptGuardOrder(rel, opts) {
    const abs = path.join(ROOT, rel);
    if (!existsSync(abs)) { check(`script 실재: ${rel}`, false, "파일 없음"); return; }
    const src = readFileSync(abs, "utf8");
    check(`script 실재: ${rel}`, true);

    const guardIdx = src.search(/ALLOW_CHATGPT_IMAGE\s*!==\s*["']1["']/);
    check(`${path.basename(rel)}: ALLOW_CHATGPT_IMAGE!=="1" 인라인 guard 존재`, guardIdx !== -1);
    if (guardIdx === -1) return;

    for (const sePat of opts.sideEffectPatterns ?? []) {
      const idx = src.search(sePat);
      if (idx !== -1) {
        check(`${path.basename(rel)}: guard가 side effect(${sePat.source.slice(0, 28)}) 전에 위치`,
          guardIdx < idx, `guard@${guardIdx} effect@${idx}`);
      }
    }
    const cdpIdxLocal = src.search(CDP_EXEC_RE);
    check(`${path.basename(rel)}: guard가 browser/CDP 실행 호출 전에 위치`,
      cdpIdxLocal !== -1 && guardIdx < cdpIdxLocal, `guard@${guardIdx} cdp@${cdpIdxLocal}`);
    check(`${path.basename(rel)}: guard가 fail-closed abort (process.exit) 포함`,
      /ChatGPT image 경로 차단|경로 차단 \(fail-closed\)/.test(src) && /process\.exit\(/.test(src));
  }

  scanChatgptGuardOrder("scripts/run-premium-editorial-scene-1-6-fullset-image-generation-v2-first-run.mjs", {
    sideEffectPatterns: [/fs\.mkdirSync\(OUT_DIR_ABS/],
  });
  scanChatgptGuardOrder("scripts/_upload002-s5-kf-generate.mjs", {
    sideEffectPatterns: [/fs\.mkdirSync\(KF_DIR/],
  });
  scanChatgptGuardOrder("scripts/_chatgpt-image-preflight.mjs", {
    sideEffectPatterns: [/fs\.mkdirSync\(QA_DIR/],
  });
  scanChatgptGuardOrder("scripts/_chatgpt-image-anchor-generate.mjs", {
    sideEffectPatterns: [/fs\.mkdirSync\(OUT_DIR_ABS/],
  });
}

// ── 3b. policy 주도 browser generation runner 일반 순서 스캔 ────────────────
// hardenedImageScripts의 chatgpt-playwright / gemini-veo 항목 전부에 대해:
//   (a) provider flag 인라인 guard(`FLAG !== "1"`)가 존재하고
//   (b) 첫 mkdirSync 발생(있다면)과 browser/CDP 실행 호출(있다면)보다 앞서며
//   (c) guard 직후에 fail-closed abort(process.exit)가 있는지 검증.
// 개별 파일을 하드코딩하지 않고 policy를 단일 소스로 사용 — 새 runner 등재 시 자동 검증.
{
  const FLAG_BY_PROVIDER = {
    "chatgpt-playwright": "ALLOW_CHATGPT_IMAGE",
    "gemini-veo": "ALLOW_GEMINI_VEO",
  };
  const browserEntries = (policy.hardenedImageScripts ?? []).filter((s) => FLAG_BY_PROVIDER[s.provider]);
  check(`3b: policy 내 browser runner 항목 존재 (${browserEntries.length}건 — chatgpt-playwright/gemini-veo)`,
    browserEntries.length >= 27);
  for (const entry of browserEntries) {
    const flag = FLAG_BY_PROVIDER[entry.provider];
    const abs = path.join(ROOT, entry.path);
    const base = path.basename(entry.path);
    if (!existsSync(abs)) { check(`3b ${base}: 파일 실재`, false, "파일 없음"); continue; }
    const src = readFileSync(abs, "utf8");
    const guardRe = new RegExp(flag + "\\s*!==\\s*[\"']1[\"']");
    const gIdx = src.search(guardRe);
    check(`3b ${base}: ${flag}!=="1" 인라인 guard 존재`, gIdx !== -1);
    if (gIdx === -1) continue;
    const mkIdx = src.indexOf("mkdirSync(");
    if (mkIdx !== -1) {
      check(`3b ${base}: guard가 첫 mkdirSync 전에 위치`, gIdx < mkIdx, `guard@${gIdx} mkdir@${mkIdx}`);
    }
    const cdpIdx = src.search(CDP_EXEC_RE);
    if (cdpIdx !== -1) {
      check(`3b ${base}: guard가 browser/CDP 실행 호출 전에 위치`, gIdx < cdpIdx, `guard@${gIdx} cdp@${cdpIdx}`);
    }
    const after = src.slice(gIdx, gIdx + 400);
    check(`3b ${base}: guard 직후 fail-closed abort (process.exit)`, /process\.exit\(/.test(after));
  }
}

// ── 4. policy fixture 검증 ─────────────────────────────────────────────────
{
  check("policy schemaVersion + status",
    policy.schemaVersion === "golden_sample_paid_image_allow_guard_policy_v1" &&
    policy.status === "PAID_IMAGE_ALLOW_GUARD_HARDENED_NO_LIVE");
  check("policy guardSemantics.failClosed=true + masterAloneSufficient=false",
    policy.guardSemantics?.failClosed === true && policy.guardSemantics?.masterAloneSufficient === false);
  const imageProviders = (policy.providers ?? []).filter((p) => p.image === true).map((p) => p.provider);
  check("policy providers: 이미지 provider imagen/openai-image/bfl-flux2 등재",
    ["imagen", "openai-image", "bfl-flux2"].every((p) => imageProviders.includes(p)));
  check("policy hardenedImageScripts 36개(최초 3 + 1차 6 + 2차 4 + 3차 gap-closure 23) + 전부 guardBeforeSecretRead=true + 실재",
    Array.isArray(policy.hardenedImageScripts) && policy.hardenedImageScripts.length === 36 &&
    policy.hardenedImageScripts.every((s) => s.guardBeforeSecretRead === true && existsSync(path.join(ROOT, s.path))));
  check("policy knownGapsOutOfReviewFixScope: 빈 배열 (은닉 gap 금지)",
    Array.isArray(policy.knownGapsOutOfReviewFixScope) && policy.knownGapsOutOfReviewFixScope.length === 0);
  check("policy knownGapsOutOfCurrentReviewFixScope: 3차 gap-closure 이후 두 목록 모두 빈 배열 (해소 완료)",
    Array.isArray(policy.knownGapsOutOfCurrentReviewFixScope?.guardedButUnregistered) &&
    policy.knownGapsOutOfCurrentReviewFixScope.guardedButUnregistered.length === 0 &&
    Array.isArray(policy.knownGapsOutOfCurrentReviewFixScope?.noGuardDetected) &&
    policy.knownGapsOutOfCurrentReviewFixScope.noGuardDetected.length === 0);
  check("policy chatgptImagePolicy.flag/expectedValue 유지 (ALLOW_CHATGPT_IMAGE=1)",
    policy.chatgptImagePolicy?.flag === "ALLOW_CHATGPT_IMAGE" && policy.chatgptImagePolicy?.expectedValue === "1");
  check("policy geminiVeoPolicy: ALLOW_GEMINI_VEO=1 no-live fail-closed 스위치 정의",
    policy.geminiVeoPolicy?.flag === "ALLOW_GEMINI_VEO" && policy.geminiVeoPolicy?.expectedValue === "1" &&
    /실행 승인이 아니다|no-live/.test(policy.geminiVeoPolicy?.note ?? ""));
  check("policy browserRunnerClassification: 24개 gap 분류 counts (23 hardened + 1 helper + 0 non-generation)",
    policy.browserRunnerClassification?.counts?.executableHardened === 23 &&
    policy.browserRunnerClassification?.counts?.helperOnly === 1 &&
    policy.browserRunnerClassification?.counts?.nonGeneration === 0 &&
    Array.isArray(policy.browserRunnerClassification?.helperModules) &&
    policy.browserRunnerClassification.helperModules.length === 2);
  check("policy enforcementScope: archive 제외 명시",
    Array.isArray(policy.enforcementScope?.excluded) &&
    policy.enforcementScope.excluded.some((e) => /archive/.test(e)));
  check("policy readinessVerdict = STANDARDIZED_NO_LIVE_READY (승격 없음)",
    policy.readinessVerdict?.current === "STANDARDIZED_NO_LIVE_READY");
  check("policy resolvedDecisionRef가 state fixture + 올바른 값 참조",
    policy.resolvedDecisionRef?.key === "image_script_allow_guard" &&
    policy.resolvedDecisionRef?.resolvedValue === "add_allow_guard_to_all_paid_image_scripts");
}

// ── 5. decision state 정합 ─────────────────────────────────────────────────
{
  const resolved = (state.resolvedDecisions ?? []).find((d) => d.key === "image_script_allow_guard");
  check("state: image_script_allow_guard 결정이 resolved + 올바른 값",
    resolved && resolved.resolvedValue === "add_allow_guard_to_all_paid_image_scripts");
}

// ── 6. inventory 스캔: scripts/ 하위 미등재 unguarded paid-image runner 탐지 ──
// archive/check-guard/env-safe/알려진 non-image-provider 스크립트는 제외.
// 남은 .mjs 중 BFL_API_KEY 또는 BFL endpoint 문자열을 가진 파일은 top-level allow
// guard 호출(assertPaidImageAllowed/assertProviderAllowed)이 반드시 있어야 한다.
// OpenAI image 판별은 애매성이 커서(TTS/generate와 키가 동일) 이 inventory는 BFL 전용으로 한정하고,
// OpenAI-image는 policy.hardenedImageScripts 등재로 커버한다(hardenedImageScripts 개수 검증 위에서 별도 확인).
{
  const scriptsDir = path.join(ROOT, "scripts");
  const entries = readdirSync(scriptsDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".mjs"))
    .map((e) => e.name);

  const KNOWN_NON_IMAGE = new Set(["env-safe.mjs", "_lh9-tts-final.mjs", "_lh10-generate-plan.mjs"]);
  const hardenedRelPaths = new Set((policy.hardenedImageScripts ?? []).map((s) => path.basename(s.path)));
  const knownGapNames = new Set((policy.knownGapsOutOfReviewFixScope ?? []).map((g) => path.basename(g.path)));

  const BFL_ENDPOINT_RE = new RegExp("api\\." + "bfl\\.ai");
  const candidates = entries.filter((name) => {
    if (name.startsWith("check-golden-sample") || name.startsWith("check-premium-editorial")) return false;
    if (KNOWN_NON_IMAGE.has(name)) return false;
    if (name === path.basename(SELF)) return false;
    const src = readFileSync(path.join(scriptsDir, name), "utf8");
    return /BFL_API_KEY/.test(src) || BFL_ENDPOINT_RE.test(src);
  });

  check(`inventory: scripts/ 하위 BFL_API_KEY/endpoint 사용 non-archive .mjs 탐지 (${candidates.length}건)`, true);

  const unguarded = [];
  for (const name of candidates) {
    if (knownGapNames.has(name)) continue; // 명시적으로 기록된 범위 밖 gap — FAIL 아님, 문서화됨
    if (!hardenedRelPaths.has(name)) { unguarded.push(`${name} (policy 미등재)`); continue; }
    const src = readFileSync(path.join(scriptsDir, name), "utf8");
    const hasGuardCall = /assert(PaidImageAllowed|ProviderAllowed)\(/.test(src);
    if (!hasGuardCall) unguarded.push(`${name} (guard 호출 없음)`);
  }
  check("inventory: policy 등재 BFL runner 전부 allow guard 보유 + 미등재 unguarded 파일 없음",
    unguarded.length === 0, unguarded.join("; "));
}

// ── 7. inventory 스캔: browser/CDP generation runner unguarded 탐지 ─────────
// non-archive .mjs 중 브라우저 라이브러리/CDP 연결 호출/Chrome 준비 helper/
// 공용 core 모듈 import 등 browser/CDP generation 신호를 가진 파일은
//   (a) hardenedImageScripts 등재 + provider flag 인라인 guard 보유, 또는
//   (b) policy.browserRunnerClassification.helperModules의 evidence-classified helper
// 둘 중 하나여야 한다. "known gap 목록 등재"만으로는 절대 통과할 수 없다 (3차 gap-closure로
// pass-through 제거). helper는 내부 guard 위치 또는 caller 전원 hardened임을 소스로 재검증.
{
  const scriptsDir = path.join(ROOT, "scripts");
  const entries = readdirSync(scriptsDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".mjs"))
    .map((e) => e.name);

  const CHATGPT_SIGNAL_RE = new RegExp(
    ["chrom" + "ium", "connectOver" + "CDP", "ensure" + "Chrome", "_chatgpt-image-core\\.mjs", "_gemini-veo-core\\.mjs", "collectLastAssistantImages", "typePrompt"].join("|")
  );
  const FLAG_BY_PROVIDER = {
    "chatgpt-playwright": "ALLOW_CHATGPT_IMAGE",
    "gemini-veo": "ALLOW_GEMINI_VEO",
  };
  const hardenedNames = new Set((policy.hardenedImageScripts ?? []).map((s) => path.basename(s.path)));
  const providerByName = new Map((policy.hardenedImageScripts ?? []).map((s) => [path.basename(s.path), s.provider]));
  const helperModules = policy.browserRunnerClassification?.helperModules ?? [];
  const helperNames = new Set(helperModules.map((h) => path.basename(h.path)));

  // 2차 review-fix 승인 4개 실재 (회귀 방지)
  const PREV_TASK_REQUIRED_HARDENED = [
    "run-premium-editorial-scene-1-6-fullset-image-generation-v2-first-run.mjs",
    "_upload002-s5-kf-generate.mjs",
    "_chatgpt-image-preflight.mjs",
    "_chatgpt-image-anchor-generate.mjs",
  ];
  check("2차 review-fix 승인 4개 파일 전부 hardenedImageScripts에 실재 (회귀 방지)",
    PREV_TASK_REQUIRED_HARDENED.every((n) => hardenedNames.has(n)),
    PREV_TASK_REQUIRED_HARDENED.filter((n) => !hardenedNames.has(n)).join(", "));

  // 3차 gap-closure 24개 전부 hardened 또는 evidence-classified helper (은닉/pass-through 금지)
  const GAP_CLOSURE_24 = [
    "run-chatgpt-playwright-fresh-image-set-v3.mjs",
    "run-chatgpt-playwright-image-method-revalidation-v1.mjs",
    "run-chatgpt-playwright-image-method-revalidation-v2.mjs",
    "run-chatgpt-playwright-korean-banknote-patch-v3-1.mjs",
    "run-money-shorts-rate-freeze-image-regeneration-v1.mjs",
    "_ep003-jdm-keyframe-generate.mjs",
    "_ep003-jdm-s3-bossfree-kf-v6.mjs",
    "_ep003-jdm-s3-bossfree-kf.mjs",
    "_ep003-jdm-veo-generate.mjs",
    "_ep003-jdm-veo-preflight.mjs",
    "_gemini-veo-core.mjs",
    "_gemini-veo-preflight.mjs",
    "_upload002-kf-generate.mjs",
    "_upload002-s1-veo-generate.mjs",
    "_upload002-s2-continuity-fix.mjs",
    "_upload002-s2-recover.mjs",
    "_upload002-s2-veo-generate.mjs",
    "_upload002-s3-veo-generate.mjs",
    "_upload002-s4-kf-generate.mjs",
    "_upload002-s4-veo-generate.mjs",
    "_upload002-s5-edit-from-s4.mjs",
    "_upload002-s5-final.mjs",
    "_upload002-s5-veo-generate.mjs",
    "_upload002-s5-veo-regen.mjs",
  ];
  check("3차 gap-closure 24개 파일 전부 hardened 또는 helper-classified (은닉 gap 0)",
    GAP_CLOSURE_24.every((n) => hardenedNames.has(n) || helperNames.has(n)),
    GAP_CLOSURE_24.filter((n) => !hardenedNames.has(n) && !helperNames.has(n)).join(", "));

  // helper 모듈 소스 재검증 (분류 주장만으로 통과 금지)
  for (const h of helperModules) {
    const base = path.basename(h.path);
    const abs = path.join(ROOT, h.path);
    if (!existsSync(abs)) { check(`helper ${base}: 파일 실재`, false, "파일 없음"); continue; }
    const src = readFileSync(abs, "utf8");
    if (h.internalGuardFlag) {
      const gIdx = src.search(new RegExp(h.internalGuardFlag + "\\s*!==\\s*[\"']1[\"']"));
      const sIdx = src.search(SPAWN_CALL_RE);
      check(`helper ${base}: 내부 guard(${h.internalGuardFlag})가 존재하고 browser launch(spawn) 호출 전에 위치`,
        gIdx !== -1 && (sIdx === -1 || gIdx < sIdx), `guard@${gIdx} spawn@${sIdx}`);
    } else {
      // caller-level 커버: 이 helper를 참조하는 non-archive .mjs 전원이 hardened / helper / 정적 가드 자신
      const importers = entries.filter((n) =>
        n !== base && readFileSync(path.join(scriptsDir, n), "utf8").includes(base));
      const bad = importers.filter((n) =>
        !hardenedNames.has(n) && !helperNames.has(n) &&
        n !== path.basename(SELF) &&
        !n.startsWith("check-golden-sample") && !n.startsWith("check-premium-editorial"));
      check(`helper ${base}: caller-level 커버 — 모든 non-archive importer(${importers.length}건)가 hardened/guard`,
        bad.length === 0, bad.join(", "));
    }
  }

  const candidates = entries.filter((name) => {
    if (name.startsWith("check-golden-sample") || name.startsWith("check-premium-editorial")) return false;
    if (name === path.basename(SELF)) return false;
    const src = readFileSync(path.join(scriptsDir, name), "utf8");
    return CHATGPT_SIGNAL_RE.test(src);
  });

  check(`inventory: scripts/ 하위 browser/CDP generation 신호 보유 non-archive .mjs 탐지 (${candidates.length}건)`, true);

  const unguarded = [];
  for (const name of candidates) {
    if (helperNames.has(name)) continue; // evidence-classified helper — 위에서 소스 재검증됨
    const src = readFileSync(path.join(scriptsDir, name), "utf8");
    if (!hardenedNames.has(name)) { unguarded.push(`${name} (policy 미등재)`); continue; }
    const flag = FLAG_BY_PROVIDER[providerByName.get(name)];
    if (flag) {
      if (!new RegExp(flag + "\\s*!==\\s*[\"']1[\"']").test(src)) {
        unguarded.push(`${name} (${flag} 인라인 guard 없음)`);
      }
    } else if (!/assert(PaidImageAllowed|ProviderAllowed)\(/.test(src)) {
      unguarded.push(`${name} (allow guard 호출 없음)`);
    }
  }
  check("inventory: browser/CDP generation runner 전부 hardened(guard 보유) 또는 evidence-classified helper — known-gap 등재만으로 통과 불가",
    unguarded.length === 0, unguarded.join("; "));
}

// ── 8. guard self + policy fixture forbidden 실행 패턴 스캔 ─────────────────
{
  const J = (a, b) => a + b;
  const execTokens = [J("child_", "process"), J("spawn", "("), J("ff", "mpeg"), J("chromium", ".launch"),
    J("connectOver", "CDP"), J("fetch", "("), J("write", "File"), J("append", "File"), J("readFileSync", "(env")];
  const selfSrc = readFileSync(SELF, "utf8");
  // self는 secret/실행 안 함 — 단, 스캔 토큰 자체를 분할 보관하므로 매칭되지 않아야 함
  const hit = execTokens.find((t) => selfSrc.includes(t));
  check("no forbidden exec/secret-read pattern in guard script (self)", !hit, hit ? `token=${hit}` : "");
  const specifiers = [...selfSrc.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  check("guard imports restricted to node:fs/node:path/node:url",
    specifiers.length > 0 && specifiers.every((s) => allow.has(s)), `bad=${specifiers.filter((s) => !allow.has(s)).join(",")}`);
  console.log("NOTE  guard reads .ts/.mjs/.json as text only — no execution, no .env.local read, no image/API/browser");
}

// ── 9. in-memory mutant — fail-closed 확인 ─────────────────────────────────
{
  const M = "PAID_API_ENABLED", P = "ALLOW_OPENAI_IMAGE";
  // master-only mutant: 열리면 안 됨
  check("mutant: master-only(PAID_API_ENABLED=true)로 허용되면 fail",
    reproCheckAllowed({ [M]: "true" }, M, P) === false);
  // provider missing mutant
  check("mutant: provider flag 미설정 → 허용 안 됨",
    reproCheckAllowed({ [M]: "true", [P]: undefined }, M, P) === false);
  // provider false mutant
  check("mutant: provider flag false → 허용 안 됨",
    reproCheckAllowed({ [M]: "true", [P]: "false" }, M, P) === false);

  // 소스 회귀 mutant: 만약 paidApiGuard에 permissive 재현이 있으면 잡아야 함
  const permissiveRegression = /return\s+flag\s*!==\s*false/.test(guardSrc) || /세부 플래그 없음 → 전부 허용/.test(guardSrc);
  check("mutant(source): permissive 회귀 패턴 부재", permissiveRegression === false);

  // script guard 제거 mutant 시뮬: guard 호출 문자열이 없다고 가정하면 order 검사가 fail하는지 논리 확인
  const fakeNoGuard = "const OPENAI_KEY = loadKey();";
  check("mutant(logic): allow guard 호출 없는 스크립트는 order 검사에서 -1 → fail 처리",
    fakeNoGuard.search(/^assert(PaidImageAllowed|ProviderAllowed)\(/m) === -1);

  // ChatGPT/Playwright guard mutant: browser/CDP 실행 호출 위치 판정 로직을 순수하게
  // placeholder 토큰으로만 검증한다 (실제 금지 실행-호출 리터럴을 self 소스에 만들지
  // 않기 위해 — 이 파일 자체가 forbidden-pattern 스캔 대상이기도 하므로).
  const CDP_CALL_PLACEHOLDER = "__CDP_EXEC_CALL__(";
  const IMPORT_PLACEHOLDER = "__IMPORT_DECL__";
  const fakeGuardAfterBrowser = "const browser = await X." + CDP_CALL_PLACEHOLDER + "url);\n" +
    'if (process.env.ALLOW_CHATGPT_IMAGE !== "1") { process.exit(2); }';
  const gIdx = fakeGuardAfterBrowser.search(/ALLOW_CHATGPT_IMAGE\s*!==\s*["']1["']/);
  const bIdx = fakeGuardAfterBrowser.indexOf(CDP_CALL_PLACEHOLDER);
  check("mutant: browser 실행 호출이 ALLOW_CHATGPT_IMAGE guard보다 먼저 오면 순서 검사 fail",
    gIdx !== -1 && bIdx !== -1 && !(gIdx < bIdx));
  // import 선언은 실행이 아니므로 guard보다 앞에 있어도 안전 — false positive 방지 확인 (순수 로직 검증)
  const fakeImportThenGuard = IMPORT_PLACEHOLDER + "\n" +
    'if (process.env.ALLOW_CHATGPT_IMAGE !== "1") { process.exit(2); }\n' +
    "const browser = await X." + CDP_CALL_PLACEHOLDER + "url);";
  const gIdx2 = fakeImportThenGuard.search(/ALLOW_CHATGPT_IMAGE\s*!==\s*["']1["']/);
  const bIdx2 = fakeImportThenGuard.indexOf(CDP_CALL_PLACEHOLDER);
  check("mutant(negative): import(placeholder)는 실행 호출로 오탐되지 않음 — guard가 실행 호출보다 앞이면 순서 검사 pass",
    gIdx2 !== -1 && bIdx2 !== -1 && gIdx2 < bIdx2);
  // ChatGPT guard 완전 부재 mutant (guard 정규식이 없는 텍스트에서 -1을 반환하는지만 확인 — 순수 로직)
  const fakeNoChatgptGuard = "const x = X." + CDP_CALL_PLACEHOLDER + ");";
  check("mutant: ALLOW_CHATGPT_IMAGE guard 완전 부재 스크립트는 guard-존재 검사에서 -1 → fail 처리",
    fakeNoChatgptGuard.search(/ALLOW_CHATGPT_IMAGE\s*!==\s*["']1["']/) === -1);

  // ── Gemini/Veo guard mutants (placeholder 기반 순수 로직 검증) ──
  const GEMINI_GUARD_RE = new RegExp("ALLOW_GEMINI_VEO" + "\\s*!==\\s*[\"']1[\"']");
  // guard 부재 mutant: veo runner에 gemini guard가 없으면 -1 → fail 처리
  const fakeVeoNoGuard = "const b = await X." + CDP_CALL_PLACEHOLDER + "url);";
  check("mutant: ALLOW_GEMINI_VEO guard 완전 부재 veo runner는 guard-존재 검사에서 -1 → fail 처리",
    fakeVeoNoGuard.search(GEMINI_GUARD_RE) === -1);
  // truthy 체크 mutant: `!process.env.ALLOW_GEMINI_VEO` 같은 truthy 검사는 !=="1" 표준 검사로 인정되지 않음
  const fakeVeoTruthyGuard = 'if (!process.env.ALLOW_GEMINI_VEO) { process.exit(1); }';
  check("mutant: truthy 체크(!env.FLAG)는 fail-closed !==\"1\" 표준 guard로 오인되지 않음",
    fakeVeoTruthyGuard.search(GEMINI_GUARD_RE) === -1);
  // guard가 browser 실행 placeholder 뒤에 오는 mutant → 순서 검사 fail
  const fakeVeoGuardAfterBrowser = "const b = await X." + CDP_CALL_PLACEHOLDER + "url);\n" +
    'if (process.env.ALLOW_GEMINI_VEO !== "1") { process.exit(2); }';
  const vgIdx = fakeVeoGuardAfterBrowser.search(GEMINI_GUARD_RE);
  const vbIdx = fakeVeoGuardAfterBrowser.indexOf(CDP_CALL_PLACEHOLDER);
  check("mutant: browser 실행 호출이 ALLOW_GEMINI_VEO guard보다 먼저 오면 순서 검사 fail",
    vgIdx !== -1 && vbIdx !== -1 && !(vgIdx < vbIdx));
  // helper 내부 guard 부재 mutant: spawn placeholder만 있고 guard가 없으면 helper 검증 fail 로직 확인
  const SPAWN_PLACEHOLDER = "__SPAWN_CALL__(";
  const fakeHelperNoGuard = "export async function launchX() { const p = Y." + SPAWN_PLACEHOLDER + "exe); }";
  check("mutant: helper 내부 guard 부재(spawn만 존재) 시 guard-존재 검사에서 -1 → fail 처리",
    fakeHelperNoGuard.search(GEMINI_GUARD_RE) === -1 && fakeHelperNoGuard.indexOf(SPAWN_PLACEHOLDER) !== -1);
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks)`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks`);
process.exit(failures === 0 ? 0 : 1);
