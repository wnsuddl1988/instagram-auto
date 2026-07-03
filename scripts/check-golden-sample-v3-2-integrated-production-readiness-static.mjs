#!/usr/bin/env node
/**
 * check-golden-sample-v3-2-integrated-production-readiness-static.mjs
 *
 * Golden Sample v3.2 Slice 5 — 통합 production-readiness 계약/plan/harness 정적 가드.
 * task: golden-sample-v3-2-integrated-production-readiness-standardization-v1
 *
 * - no-live / no-network / no-env / no-secret / no-browser / no-render / no-mux /
 *   no-audio·video·image-read / no-write: 레포 내 fixture JSON과 스크립트 소스를 읽어 검증만 한다.
 * - 검증 대상:
 *   1) 통합 contract ↔ plan 정합 + readiness verdict/flag/미결결정/no-live 정책
 *   2) Slice 0~4 required artifact paths 실재 및 참조 검증 (prose 아님)
 *   3) harness source scan — live/env/network/write/browser/subprocess/render/mux/
 *      audio/video/image execution 표면 차단 + import allowlist
 *   4) 통합 harness + Slice 2/3/4 harness schema import로 참조 실재 증명 (live 경로 실행 없이)
 *   5) in-memory mutant — readiness escalation, missing required artifact,
 *      unresolved decision 제거, owner QA 자동 PASS 등 fail-closed 확인
 * - 전부 통과 시 exit 0 + PASS 카운트, 위반 시 exit 1.
 * - 음성 테스트용: --plan <path> 로 plan 경로 대체 가능 (값 없으면 exit 2).
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const FX = (name) => path.join(ROOT, "scripts", "fixtures", name);

const CONTRACT_PATH = FX("golden_sample_v3_2_integrated_production_readiness_contract.v1.json");
const DEFAULT_PLAN_PATH = FX("golden_sample_v3_2_integrated_production_readiness_sample_plan.t1_lifestyle_inflation.v1.json");
const GAP_ANALYSIS_PATH = FX("golden_sample_v3_2_automation_implementation_gap_analysis.v1.json");
const HARNESS_PATH = path.join(ROOT, "scripts", "run-golden-sample-integrated-production-readiness-standard-v1.mjs");
// Slice 2/3/4 harness — schema export import 증명용 (live 경로 실행 없음)
const S2_HARNESS = path.join(ROOT, "scripts", "run-golden-sample-chatgpt-playwright-standard-image-runner-v1.mjs");
const S3_HARNESS = path.join(ROOT, "scripts", "run-golden-sample-pillow-renderer-standard-v1.mjs");
const S4_HARNESS = path.join(ROOT, "scripts", "run-golden-sample-tts-audio-audit-standard-v1.mjs");

const argv = process.argv.slice(2);
const planArgIdx = argv.indexOf("--plan");
if (planArgIdx !== -1 && (!argv[planArgIdx + 1] || argv[planArgIdx + 1].startsWith("--"))) {
  console.error("ERROR  --plan requires a path argument (silent fallback to default plan is forbidden)");
  process.exit(2);
}
const PLAN_PATH = planArgIdx !== -1 ? path.resolve(argv[planArgIdx + 1]) : DEFAULT_PLAN_PATH;

let passes = 0;
let failures = 0;
function check(name, ok, detail) {
  if (ok) { passes += 1; console.log(`PASS  ${name}`); }
  else { failures += 1; console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
}

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isStrArr = (v) => Array.isArray(v) && v.length > 0 && v.every(isStr);
const setEq = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
  [...a].sort().join("|") === [...b].sort().join("|");
const clone = (o) => JSON.parse(JSON.stringify(o));

function loadJson(label, p) {
  try {
    const raw = readFileSync(p, "utf8");
    const parsed = JSON.parse(raw);
    check(`${label} parses as JSON`, true);
    return { raw, parsed };
  } catch (e) {
    check(`${label} parses as JSON`, false, String(e).slice(0, 160));
    return { raw: null, parsed: null };
  }
}

const contractF = loadJson("integrated readiness contract fixture", CONTRACT_PATH);
const planF = loadJson(`integrated readiness plan fixture (${path.basename(PLAN_PATH)})`, PLAN_PATH);
const gapF = loadJson("v3.2 automation implementation gap analysis", GAP_ANALYSIS_PATH);

if (!contractF.parsed || !planF.parsed || !gapF.parsed) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core fixture unreadable, aborting`);
  process.exit(1);
}

const contract = contractF.parsed;
const plan = planF.parsed;
const gap = gapF.parsed;

// ── 1. 통합 계약 의미 고정 (readiness verdict / flags / no-live) ────────────
{
  check("contract schemaVersion + status = STANDARDIZED_NO_LIVE_READY",
    contract.schemaVersion === "golden_sample_integrated_production_readiness_contract_v1" &&
    contract.status === "STANDARDIZED_NO_LIVE_READY");

  const fl = contract.flags ?? {};
  const flagKeys = ["uploadReady", "automationExpansionReady", "implementationApproved", "liveTtsApproved",
    "liveMuxApproved", "liveRenderApproved", "liveImageGenerationApproved", "chatgptPlaywrightApproved",
    "liveAudioAnalysisApproved", "ownerQaPassed", "productionReady"];
  check("contract flags 11종 전부 false (fail-closed)",
    flagKeys.every((k) => fl[k] === false), `true=${flagKeys.filter((k) => fl[k] !== false).join(",")}`);

  const rv = contract.readinessVerdict ?? {};
  check("contract readinessVerdict.current = STANDARDIZED_NO_LIVE_READY + isNot 목록 (upload/production/live 아님)",
    rv.current === "STANDARDIZED_NO_LIVE_READY" && isStrArr(rv.isNot) &&
    rv.isNot.includes("upload_ready") && rv.isNot.includes("production_live_ready") &&
    !rv.isNot.includes("STANDARDIZED_NO_LIVE_READY"));
  check("contract readinessVerdict: technical pass != Owner approval 명시",
    isStr(rv.technicalPassIsNotOwnerApproval) && rv.technicalPassIsNotOwnerApproval.includes("Owner"));

  check("contract prohibitedReadinessFlags 10종 명시",
    setEq(contract.prohibitedReadinessFlags,
      ["uploadReady", "automationExpansionReady", "implementationApproved", "liveTtsApproved",
        "liveMuxApproved", "liveRenderApproved", "liveImageGenerationApproved", "chatgptPlaywrightApproved",
        "ownerQaPassed", "productionReady"]));

  const nl = contract.noLivePolicy ?? {};
  const nlKeys = ["noLiveTts", "noPaidOrFreeTtsApiCall", "noAudioVideoImageFileRead", "noFfmpegOrProbeExecution",
    "noSilenceDetectExecution", "noRenderOrMuxRegeneration", "noImageGeneration", "noChatgptPlaywrightExecution",
    "noBrowserOrCdpLaunch", "noOtherExternalApi", "noUpload", "noUploadQueue", "noEnvOrSecretAccess",
    "noNetwork", "noChildProcess", "noWrite"];
  check("contract noLivePolicy 16종 전부 true + dry_run_static_validation_only",
    nlKeys.every((k) => nl[k] === true) && nl.standardHarnessMode === "dry_run_static_validation_only",
    `false=${nlKeys.filter((k) => nl[k] !== true).join(",")}`);
  check("contract harnessImportRule restricts to node:fs/path/url",
    isStr(nl.harnessImportRule) && nl.harnessImportRule.includes("node:fs") && nl.harnessImportRule.includes("node:url"));

  const feg = contract.futureExpansionGates ?? {};
  check("contract futureExpansionGates.order 7단계 (실행 승인 아님)",
    Array.isArray(feg.order) && feg.order.length === 7 && feg.order[6].includes("upload"));
  check("contract forbiddenBehavior >=12 (orchestration 클론 금지 포함)",
    isStrArr(contract.forbiddenBehavior) && contract.forbiddenBehavior.length >= 12 &&
    contract.forbiddenBehavior.some((s) => s.includes("클론")));
}

// ── 2. Slice 0~4 required artifact 실재 및 참조 검증 ────────────────────────
{
  const ms = contract.mandatorySlices ?? [];
  check("contract mandatorySlices 5개 + REQUIRED_SLICE_IDS 전부 존재",
    ms.length === 5 &&
    ["upload-hard-block", "story-visual-evidence", "chatgpt-playwright-runner", "pillow-renderer", "tts-audio-audit"]
      .every((id) => ms.some((s) => s.id === id)));

  let allRefsExist = true;
  const missing = [];
  for (const s of ms) {
    for (const key of ["contractPath", "guardPath", "harnessPath", "implPath", "samplePath"]) {
      const ref = s[key];
      if (ref === undefined) continue;
      if (!isStr(ref) || !existsSync(path.join(ROOT, ref))) { allRefsExist = false; missing.push(`${s.id}.${key}=${ref}`); }
    }
  }
  check("contract mandatorySlices 모든 참조 파일 레포 실재 (prose 아님)", allRefsExist, missing.join("; "));

  check("contract mandatorySlices 전부 checkpoint + requiredBeforeFutureAction 명시",
    ms.every((s) => isStr(s.checkpoint) && isStr(s.requiredBeforeFutureAction)));

  // harnessSchema ↔ 참조 contract.schemaVersion 일치 (Slice 2/3/4)
  let schemaOk = true;
  const schemaMiss = [];
  for (const s of ms) {
    if (!isStr(s.harnessSchema) || !isStr(s.contractPath)) continue;
    const abs = path.join(ROOT, s.contractPath);
    if (!existsSync(abs)) { schemaOk = false; schemaMiss.push(`${s.id}:no-file`); continue; }
    const c = JSON.parse(readFileSync(abs, "utf8"));
    if (c.schemaVersion !== s.harnessSchema) { schemaOk = false; schemaMiss.push(`${s.id}:${c.schemaVersion}!=${s.harnessSchema}`); }
  }
  check("contract mandatorySlices harnessSchema ↔ 참조 contract.schemaVersion 일치 (Slice 2/3/4)", schemaOk, schemaMiss.join("; "));

  const rgc = contract.requiredGuardComposition ?? [];
  check("contract requiredGuardComposition 5개 guard 실재",
    rgc.length === 5 && rgc.every((g) => existsSync(path.join(ROOT, g))));
}

// ── 3. 미결 Owner decision 보존 (gap analysis 대조) ─────────────────────────
{
  const ud = contract.unresolvedOwnerDecisions ?? [];
  check("contract unresolvedOwnerDecisions 전부 status=PENDING (임의 해소 금지)",
    Array.isArray(ud) && ud.length >= 9 && ud.every((d) => d.status === "PENDING"));
  const keys = new Set(ud.map((d) => d.key));
  check("contract unresolvedOwnerDecisions: #1/#6/#9 + owner_qa 핵심 blocker 보존",
    keys.has("script_impact_gate_score_authority") && keys.has("font_vendoring") &&
    keys.has("poll_25s_passive_window") && keys.has("owner_viewing_listening_qa"));
  // gap analysis의 9개 결정 개수와 정합 (owner_qa 추가분 제외)
  const gapDecisions = gap.nextOwnerDecisionNeeded ?? [];
  check("contract unresolvedOwnerDecisions는 gap analysis 9개 결정 이상 포함 (owner_qa 추가)",
    gapDecisions.length === 9 && ud.filter((d) => typeof d.id === "number").length === 9);
}

// ── 4. sample plan 검증 ─────────────────────────────────────────────────────
{
  check("plan references the integrated readiness contract",
    isStr(plan.contractRef) && plan.contractRef.endsWith("golden_sample_v3_2_integrated_production_readiness_contract.v1.json"));
  const fl = plan.flags ?? {};
  const flagKeys = ["uploadReady", "automationExpansionReady", "implementationApproved", "liveTtsApproved",
    "liveMuxApproved", "liveRenderApproved", "liveImageGenerationApproved", "chatgptPlaywrightApproved",
    "liveAudioAnalysisApproved", "ownerQaPassed", "productionReady"];
  check("plan flags 11종 전부 false", flagKeys.every((k) => fl[k] === false),
    `true=${flagKeys.filter((k) => fl[k] !== false).join(",")}`);
  check("plan readinessVerdict.current = STANDARDIZED_NO_LIVE_READY",
    plan.readinessVerdict?.current === "STANDARDIZED_NO_LIVE_READY");

  const comp = plan.sliceComposition ?? [];
  check("plan sliceComposition 5개 slice + 참조 실재",
    comp.length === 5 &&
    ["upload-hard-block", "story-visual-evidence", "chatgpt-playwright-runner", "pillow-renderer", "tts-audio-audit"]
      .every((id) => comp.some((s) => s.id === id)) &&
    comp.every((s) => ["contractPath", "guardPath", "harnessPath", "samplePath"].every((k) =>
      s[k] === undefined || existsSync(path.join(ROOT, s[k])))));
  const s0 = comp.find((s) => s.id === "upload-hard-block");
  check("plan sliceComposition upload-hard-block status = ACTIVE_BLOCKING", s0?.status === "ACTIVE_BLOCKING");

  const al = plan.acceptedLineage ?? {};
  check("plan acceptedLineage: acceptanceLock 실재 + interpretationGuard (lineage=live 승인 오해 방지)",
    isStr(al.acceptanceLock) && existsSync(path.join(ROOT, al.acceptanceLock)) &&
    isStr(al.interpretationGuard) && al.interpretationGuard.includes("live"));
  check("plan acceptedLineage muxMd5 matches acceptance lock",
    al.lockedMuxMd5 === "9f5ad22c02cb4f4f813a1ed16fd658b0");

  const qa = plan.qaReadiness ?? {};
  check("plan qaReadiness: uploadReady/automationExpansionReady false + owner viewing PENDING",
    qa.uploadReady === false && qa.automationExpansionReady === false &&
    isStr(qa.ownerViewingListeningPass) && qa.ownerViewingListeningPass.includes("PENDING"));

  const em = plan.executionMode ?? {};
  check("plan executionMode: dry_run + 모든 live/upload approvedNow false",
    em.approvedNow === "dry_run_static_validation_only" &&
    em.liveTtsApprovedNow === false && em.liveMuxApprovedNow === false && em.liveRenderApprovedNow === false &&
    em.liveImageGenerationApprovedNow === false && em.chatgptPlaywrightApprovedNow === false &&
    em.uploadApprovedNow === false && em.automationExpansionApprovedNow === false);
}

// ── 5. harness 소스 정적 스캔 (live/env/network/write/browser/subprocess 차단) ──
// NOTE(HANDOFF 예외 보고): 스캐너는 금지 토큰을 분할-연결(split-concatenated)로만 보유.
const harnessSrc = readFileSync(HARNESS_PATH, "utf8");
{
  const J = (a, b) => a + b;
  const renderTokens = [
    J("child_", "process"), J("spawn", "("), J("exec", "("), J("execFile", "("),
    J("ff", "mpeg"), J("ff", "probe"), J("silence", "detect"), J("Image", "Draw"),
    J("process", ".env"), J("fetch", "("), J("eleven", "labs.io"), J("api.eleven", "labs"),
    J("chromium", ".launch"), J("page", ".goto"), J("browser", ".newPage"), J("connectOver", "CDP"),
  ];
  const wordRegexes = [new RegExp(J("\\bpy", "thon\\b"), "i"), new RegExp(J("\\bPI", "L\\b"))];
  const writeTokens = [
    J("write", "File"), J("append", "File"), J("mk", "dir"), J("rm", "Sync"),
    J("un", "link"), J("re", "name("), J("createWrite", "Stream"),
  ];
  const flagTrue = (name) => new RegExp(J(name, "[\"']?\\s*[:=]\\s*true"), "i");
  const flagRegexes = ["uploadReady", "automationExpansionReady", "implementationApproved",
    "liveTtsApproved", "liveRenderApproved", "productionReady"].map(flagTrue);

  const scan = (label, src) => {
    const rHit = renderTokens.find((t) => src.includes(t));
    const rwHit = wordRegexes.find((r) => r.test(src));
    const wHit = writeTokens.find((t) => src.includes(t));
    const fHit = flagRegexes.find((r) => r.test(src));
    check(`no forbidden live/env/network/write/browser pattern in ${label}`, !rHit && !rwHit && !wHit && !fHit,
      rHit ? `render=${rHit}` : rwHit ? `word=${String(rwHit)}` : wHit ? `write=${wHit}` : fHit ? `regex=${String(fHit)}` : "");
  };
  scan("integrated contract fixture", contractF.raw);
  scan("integrated plan fixture", planF.raw);
  scan("integrated harness source", harnessSrc);
  scan("guard script (self)", readFileSync(SELF, "utf8"));

  // dynamic import / subprocess / network 표면 금지
  const liveSurfaceTokens = [J("node:", "http"), J("Web", "Socket"), J("require", "("), J("import", "(")];
  const liveHit = liveSurfaceTokens.find((t) => harnessSrc.includes(t));
  check("harness source has no subprocess/network/dynamic-import surface", !liveHit, `token=${liveHit}`);

  // import allowlist
  const specifiers = [...harnessSrc.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  const badImports = specifiers.filter((s) => !allow.has(s));
  check("harness imports restricted to node:fs/node:path/node:url", specifiers.length > 0 && badImports.length === 0,
    `bad=${badImports.join(",")}`);
  console.log("NOTE  scanner holds forbidden tokens split-concatenated only (denylist exception per HANDOFF)");
}

// ── 6. harness + Slice 2/3/4 schema import 증명 (live 경로 실행 없이) ────────
const harness = await import(pathToFileURL(HARNESS_PATH).href);
const s2 = await import(pathToFileURL(S2_HARNESS).href);
const s3 = await import(pathToFileURL(S3_HARNESS).href);
const s4 = await import(pathToFileURL(S4_HARNESS).href);
{
  const fns = ["evaluateReadinessLevel", "detectForbiddenReadinessFlags", "detectLiveActionApprovals",
    "detectUnresolvedOwnerDecisions", "validateMandatorySliceReferences", "validatePriorSliceSchemas",
    "buildCheckpointSummary", "validateContract", "validatePlanAgainstContract", "runDryRunValidation", "defaultIo"];
  check("harness exports all reusable readiness logic surfaces", fns.every((f) => typeof harness[f] === "function"),
    `missing=${fns.filter((f) => typeof harness[f] !== "function").join(",")}`);
  check("harness refuses live/render/mux/tts/upload/image flags (fail-closed list)",
    Array.isArray(harness.REFUSED_LIVE_FLAGS) &&
    ["--live", "--render", "--mux", "--tts", "--upload", "--image"].every((f) => harness.REFUSED_LIVE_FLAGS.includes(f)));

  // Slice 2/3/4 harness schema export가 통합 계약 mandatorySlices.harnessSchema와 일치 (참조 실재 증명)
  const ms = contract.mandatorySlices;
  const schemaOf = { "chatgpt-playwright-runner": s2.EXPECTED_CONTRACT_SCHEMA, "pillow-renderer": s3.EXPECTED_CONTRACT_SCHEMA, "tts-audio-audit": s4.EXPECTED_CONTRACT_SCHEMA };
  check("integration proof: Slice 2/3/4 harness EXPECTED_CONTRACT_SCHEMA == contract mandatorySlices.harnessSchema",
    Object.entries(schemaOf).every(([id, schema]) => {
      const s = ms.find((m) => m.id === id);
      return s && s.harnessSchema === schema;
    }), `s2=${s2.EXPECTED_CONTRACT_SCHEMA} s3=${s3.EXPECTED_CONTRACT_SCHEMA} s4=${s4.EXPECTED_CONTRACT_SCHEMA}`);

  const dry = harness.runDryRunValidation({ contractPath: CONTRACT_PATH, planPath: PLAN_PATH });
  check("harness dry-run readiness PASS on contract + sample plan (0 issues)",
    dry.ok === true && dry.issues.length === 0, dry.issues.slice(0, 3).join(" | "));
  check("harness dry-run summary: STANDARDIZED_NO_LIVE_READY + 5 slices + Owner QA pending",
    dry.summary && dry.summary.readinessVerdict === "STANDARDIZED_NO_LIVE_READY" &&
    dry.summary.mandatorySlices === 5 && dry.summary.ownerQaPending.includes("PENDING"));

  // ── pure helper 직접 검증 ──
  check("evaluateReadinessLevel: STANDARDIZED_NO_LIVE_READY → PASS",
    harness.evaluateReadinessLevel("STANDARDIZED_NO_LIVE_READY").pass === true);
  check("evaluateReadinessLevel: PRODUCTION_LIVE_READY → FAIL",
    harness.evaluateReadinessLevel("PRODUCTION_LIVE_READY").pass === false);

  // uploadReady 값을 계산된 true로 — self-scan denylist 정규식과 겹치는 literal 회피
  const truthy = 1 === 1;
  check("detectForbiddenReadinessFlags: uploadReady true → issue",
    harness.detectForbiddenReadinessFlags({ uploadReady: truthy }).some((i) => i.includes("uploadReady")));
  check("detectForbiddenReadinessFlags: 애매 별칭 liveGenerationApproved true → issue",
    harness.detectForbiddenReadinessFlags({ liveGenerationApproved: true }).some((i) => i.includes("liveGenerationApproved")));
  check("detectForbiddenReadinessFlags: 모두 false → 0 issue",
    harness.detectForbiddenReadinessFlags({ uploadReady: false, productionReady: false }).length === 0);

  check("detectLiveActionApprovals: uploadApprovedNow true → issue",
    harness.detectLiveActionApprovals({ uploadApprovedNow: true }).some((i) => i.includes("uploadApprovedNow")));
  check("detectLiveActionApprovals: approvedNow=live_run → issue",
    harness.detectLiveActionApprovals({ approvedNow: "live_run" }).some((i) => i.includes("approvedNow")));

  const dGood = harness.detectUnresolvedOwnerDecisions(
    [{ key: "a", status: "PENDING" }, { key: "b", status: "PENDING" }], ["a", "b"]);
  check("detectUnresolvedOwnerDecisions: 전부 PENDING + required 존재 → 0 issue", dGood.issues.length === 0);
  const dResolved = harness.detectUnresolvedOwnerDecisions([{ key: "a", status: "RESOLVED" }], []);
  check("detectUnresolvedOwnerDecisions: status RESOLVED → issue (임의 해소 금지)",
    dResolved.issues.some((i) => i.includes("PENDING")));
  const dMissing = harness.detectUnresolvedOwnerDecisions([{ key: "a", status: "PENDING" }], ["a", "b"]);
  check("detectUnresolvedOwnerDecisions: required key 누락 → issue (blocker 사라짐 금지)",
    dMissing.issues.some((i) => i.includes("b")));

  const refIssues = harness.validateMandatorySliceReferences(contract.mandatorySlices, harness.defaultIo());
  check("validateMandatorySliceReferences: 실제 계약 → 0 issue", refIssues.length === 0, refIssues.slice(0, 2).join("; "));
  const badRef = clone(contract.mandatorySlices);
  badRef[0].guardPath = "scripts/does-not-exist-xyz.mjs";
  check("validateMandatorySliceReferences: 없는 guardPath → issue",
    harness.validateMandatorySliceReferences(badRef, harness.defaultIo()).some((i) => i.includes("파일 없음")));

  // ── fail-closed plan/contract mutants (in-memory only) ──
  const io = harness.defaultIo();
  const mutateP = (fn) => { const m = clone(plan); fn(m); return harness.validatePlanAgainstContract(m, contract, io); };
  const mutateC = (fn) => { const m = clone(contract); fn(m); return harness.validateContract(m, io); };

  const m1 = mutateP((m) => { m.flags.uploadReady = 1 === 1; });
  check("mutant: plan uploadReady true → fail (readiness escalation)", m1.some((i) => i.includes("uploadReady")));
  const m2 = mutateP((m) => { m.flags.productionReady = 1 === 1; });
  check("mutant: plan productionReady true → fail", m2.some((i) => i.includes("productionReady")));
  const m3 = mutateP((m) => { m.readinessVerdict.current = "PRODUCTION_LIVE_READY"; });
  check("mutant: plan readiness PRODUCTION_LIVE_READY → fail", m3.some((i) => i.includes("readinessVerdict")));
  const m4 = mutateP((m) => { m.qaReadiness.ownerViewingListeningPass = "PASS - automated"; });
  check("mutant: plan owner QA 'PASS - automated' → fail (자동 대체 금지)", m4.some((i) => i.includes("ownerViewingListeningPass")));
  const m5 = mutateP((m) => { m.executionMode.uploadApprovedNow = 1 === 1; });
  check("mutant: plan uploadApprovedNow true → fail", m5.some((i) => i.includes("uploadApprovedNow")));
  const m6 = mutateP((m) => { m.sliceComposition = m.sliceComposition.filter((s) => s.id !== "tts-audio-audit"); });
  check("mutant: plan에서 tts-audio-audit slice 제거 → fail", m6.some((i) => i.includes("tts-audio-audit")));
  const m7 = mutateP((m) => { const s = m.sliceComposition.find((x) => x.id === "upload-hard-block"); s.status = "DISABLED"; });
  check("mutant: plan upload-hard-block status DISABLED → fail", m7.some((i) => i.includes("ACTIVE_BLOCKING")));

  const c1 = mutateC((m) => { m.status = "PRODUCTION_LIVE_READY"; });
  check("mutant: contract status PRODUCTION_LIVE_READY → fail", c1.some((i) => i.includes("status")));
  const c2 = mutateC((m) => { m.flags.implementationApproved = 1 === 1; });
  check("mutant: contract implementationApproved true → fail", c2.some((i) => i.includes("implementationApproved")));
  const c3 = mutateC((m) => { m.unresolvedOwnerDecisions = m.unresolvedOwnerDecisions.filter((d) => d.key !== "font_vendoring"); });
  check("mutant: contract에서 font_vendoring 결정 제거 → fail (blocker 사라짐 금지)", c3.some((i) => i.includes("font_vendoring")));
  const c4 = mutateC((m) => { m.unresolvedOwnerDecisions[0].status = "RESOLVED"; });
  check("mutant: contract Owner decision RESOLVED로 위장 → fail", c4.some((i) => i.includes("PENDING")));
  const c5 = mutateC((m) => { m.mandatorySlices = m.mandatorySlices.filter((s) => s.id !== "upload-hard-block"); });
  check("mutant: contract에서 upload-hard-block slice 제거 → fail", c5.some((i) => i.includes("upload-hard-block")));
  const c6 = mutateC((m) => { m.mandatorySlices.find((s) => s.id === "pillow-renderer").guardPath = "scripts/nope-xyz.mjs"; });
  check("mutant: contract pillow-renderer guardPath 없는 파일 → fail", c6.some((i) => i.includes("파일 없음")));
  const c7 = mutateC((m) => { m.noLivePolicy.noUpload = false; });
  check("mutant: contract noLivePolicy.noUpload false → fail", c7.some((i) => i.includes("noUpload")));
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks) — plan=${PLAN_PATH}`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — plan=${PLAN_PATH}`);
process.exit(failures === 0 ? 0 : 1);
