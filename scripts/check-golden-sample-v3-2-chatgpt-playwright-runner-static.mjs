#!/usr/bin/env node
/**
 * check-golden-sample-v3-2-chatgpt-playwright-runner-static.mjs
 *
 * Golden Sample v3.2 Slice 2 — ChatGPT 이미지 생성 표준 runner 계약/plan/runner 정적 가드.
 * task: golden-sample-v3-2-chatgpt-playwright-runner-standardization-v1
 *
 * - no-live / no-network / no-env / no-secret / no-browser / no-write:
 *   레포 내 fixture JSON과 스크립트 소스를 읽어 검증만 한다.
 * - 검증 대상:
 *   1) runner contract fixture ↔ production standard v1 정합 (임계값 이중 관리 드리프트 방지)
 *   2) contract operationalProfile ↔ v2/v3/v3.1 lineage runner 실측 상수 verbatim 정합
 *      + Owner 결정 #9 passive-window resolution(accept_25s_passive_window_as_v3_2_behavior) —
 *        resolved value/decision ref/profile 값/pending 재도입/immediate-poll 주장 fail-closed mutant
 *   3) sample plan fixture — Slice 1 story/visual evidence 참조 필수, reject 코드/md5 lock 교차
 *   4) standard runner 소스 — 금지 live/browser/env/network/write 패턴 + import allowlist
 *   5) standard runner 동작 — import해 dry-run PASS + fail-closed mutant 검증 (in-memory)
 * - 전부 통과 시 exit 0 + PASS 카운트 출력, 위반 시 exit 1.
 * - 음성 테스트용: --plan <path> 로 plan 경로 대체 가능 (값 없으면 exit 2).
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const FX = (name) => path.join(ROOT, "scripts", "fixtures", name);

const CONTRACT_PATH = FX("golden_sample_v3_2_chatgpt_playwright_runner_contract.v1.json");
const DEFAULT_PLAN_PATH = FX("golden_sample_v3_2_chatgpt_playwright_runner_sample_plan.t1_lifestyle_inflation.v1.json");
const STANDARD_PATH = FX("golden_sample_v3_2_production_standard.v1.json");
const S1_CONTRACT_PATH = FX("golden_sample_v3_2_story_visual_evidence_contract.v1.json");
const S1_SAMPLE_PATH = FX("golden_sample_v3_2_story_visual_evidence_sample.t1_lifestyle_inflation.v1.json");
const BLUEPRINT_PATH = FX("golden_sample_t1_lifestyle_inflation_story_blueprint.v3_1_banknote_patch.json");
const PROMPTS_V3_PATH = FX("chatgpt_playwright_image_prompts.t1_lifestyle_inflation.v3.json");
const PROMPTS_V31_PATH = FX("chatgpt_playwright_image_prompts.t1_lifestyle_inflation.v3_1_banknote_patch.json");
const RUNNER_PATH = path.join(ROOT, "scripts", "run-golden-sample-chatgpt-playwright-standard-image-runner-v1.mjs");
const LINEAGE_V2_PATH = path.join(ROOT, "scripts", "run-chatgpt-playwright-image-method-revalidation-v2.mjs");
const LINEAGE_V3_PATH = path.join(ROOT, "scripts", "run-chatgpt-playwright-fresh-image-set-v3.mjs");
const LINEAGE_V31_PATH = path.join(ROOT, "scripts", "run-chatgpt-playwright-korean-banknote-patch-v3-1.mjs");

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
  if (ok) {
    passes += 1;
    console.log(`PASS  ${name}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`);
  }
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

const contractF = loadJson("runner contract fixture", CONTRACT_PATH);
const planF = loadJson(`sample plan fixture (${path.basename(PLAN_PATH)})`, PLAN_PATH);
const standardF = loadJson("production standard v1 fixture", STANDARD_PATH);
const s1ContractF = loadJson("slice 1 story/visual evidence contract", S1_CONTRACT_PATH);
const s1SampleF = loadJson("slice 1 accepted sample", S1_SAMPLE_PATH);
const blueprintF = loadJson("v3.1 banknote-patch blueprint", BLUEPRINT_PATH);
const promptsV3F = loadJson("prompts fixture v3", PROMPTS_V3_PATH);
const promptsV31F = loadJson("prompts fixture v3.1 patch", PROMPTS_V31_PATH);

if (!contractF.parsed || !planF.parsed || !standardF.parsed || !s1ContractF.parsed ||
    !s1SampleF.parsed || !blueprintF.parsed || !promptsV3F.parsed || !promptsV31F.parsed) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core fixture unreadable, aborting`);
  process.exit(1);
}

const contract = contractF.parsed;
const plan = planF.parsed;
const standard = standardF.parsed;
const s1contract = s1ContractF.parsed;
const s1sample = s1SampleF.parsed;
const blueprint = blueprintF.parsed;
const promptsV3 = promptsV3F.parsed;
const promptsV31 = promptsV31F.parsed;

// ── 1. 계약 ↔ production standard 정합 (드리프트 방지) ──────────────────────
{
  const speed = standard.imageGenerationStandard?.speedOps ?? {};
  const t = contract.timingStandard ?? {};
  const ec = t.expectedCompletionSec ?? {};
  const sec = speed.expectedCompletionSec ?? {};
  check("contract expectedCompletionSec matches standard (30/90/110)",
    ec.typicalMin === sec.typicalMin && ec.typicalMin === 30 &&
    ec.typicalMax === sec.typicalMax && ec.typicalMax === 90 &&
    ec.slowUpperBand === sec.slowUpperBand && ec.slowUpperBand === 110,
    `contract=${ec.typicalMin}/${ec.typicalMax}/${ec.slowUpperBand} standard=${sec.typicalMin}/${sec.typicalMax}/${sec.slowUpperBand}`);
  check("contract pollIntervalSecBounds matches standard (1~2s)",
    t.pollIntervalSecBounds?.min === speed.pollIntervalSec?.min && t.pollIntervalSecBounds?.min === 1 &&
    t.pollIntervalSecBounds?.max === speed.pollIntervalSec?.max && t.pollIntervalSecBounds?.max === 2);
  check("contract detectToSaveTargetSec matches standard (30)",
    t.detectToSaveTargetSec === speed.detectToSaveTargetSec && t.detectToSaveTargetSec === 30);
  check("contract sidebarScanProhibited matches standard (true)",
    contract.conversationHygiene?.sidebarScanProhibited === true && speed.sidebarScanProhibited === true);
  check("contract nativeResolutionRisk matches standard (941x1672, record-only)",
    contract.outputFacts?.nativeResolutionRisk?.value === standard.imageGenerationStandard?.nativeResolution?.value &&
    contract.outputFacts?.nativeResolutionRisk?.value === "941x1672" &&
    contract.outputFacts?.nativeResolutionRisk?.autoRejectForbidden === true);
  check("contract paidProviderFallback forbidden (standard와 동일하게 별도 승인 필수)",
    contract.approvalModel?.paidProviderFallback?.allowed === false);
  check("contract upscaling-as-fix forbidden", contract.outputFacts?.upscalingAsFixForbidden === true);
}

// ── 2. 계약 operationalProfile ↔ v2/v3/v3.1 lineage 실측 상수 verbatim 정합 ──
{
  const readSrc = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");
  const num = (src, name) => {
    const m = src.match(new RegExp(name + String.raw`\s*=\s*(\d+)`));
    return m ? Number(m[1]) : null;
  };
  const v3src = readSrc(LINEAGE_V3_PATH);
  const op = contract.timingStandard?.operationalProfile ?? {};
  check("contract operationalProfile verbatim-matches v3 lineage constants (25000/1800/3/150000/180000)",
    op.passiveWindowMs === num(v3src, "PASSIVE_UNTIL_MS") && op.passiveWindowMs === 25000 &&
    op.pollIntervalMs === num(v3src, "POLL_INTERVAL_MS") && op.pollIntervalMs === 1800 &&
    op.stablePollsToSave === num(v3src, "STABLE_POLLS") && op.stablePollsToSave === 3 &&
    op.diagnosticAtMs === num(v3src, "DIAG_AT_MS") && op.diagnosticAtMs === 150000 &&
    op.hardTimeoutMs === num(v3src, "HARD_TIMEOUT_MS") && op.hardTimeoutMs === 180000,
    `contract=${op.passiveWindowMs}/${op.pollIntervalMs}/${op.stablePollsToSave}/${op.diagnosticAtMs}/${op.hardTimeoutMs}`);
  check("contract pollIntervalMs sits inside standard 1~2s bounds",
    op.pollIntervalMs >= 1000 && op.pollIntervalMs <= 2000);
  const hp = contract.approvalModel?.hardCapRule?.historicalPrecedent ?? {};
  check("contract historicalPrecedent caps verbatim-match lineage runner constants (v2=8, v3=12, v3.1=6)",
    hp.v2 === num(readSrc(LINEAGE_V2_PATH), "SUBMISSION_HARD_CAP") && hp.v2 === 8 &&
    hp.v3 === num(v3src, "SUBMISSION_HARD_CAP") && hp.v3 === 12 &&
    hp.v3_1 === num(readSrc(LINEAGE_V31_PATH), "SUBMISSION_HARD_CAP") && hp.v3_1 === 6,
    `contract=${hp.v2}/${hp.v3}/${hp.v3_1}`);
  check("contract timeoutPolicy sec values consistent with operationalProfile ms values",
    contract.timingStandard?.timeoutPolicy?.diagnosticAtSec === 150 &&
    contract.timingStandard?.timeoutPolicy?.hardTimeoutSec === 180 &&
    op.diagnosticAtMs === 150000 && op.hardTimeoutMs === 180000);

  // Owner 결정 #9 — passive-window resolution (resolved, not pending)
  const pw = contract.timingStandard?.passiveWindowInterpretation ?? {};
  check("contract passive-window resolved = accept_25s_passive_window_as_v3_2_behavior (Owner 결정 #9)",
    pw.resolvedValue === "accept_25s_passive_window_as_v3_2_behavior" &&
    pw.passiveWindowIsStandardV32Behavior === true && pw.notLiveApproval === true);
  check("contract passive-window resolvedDecisionRef가 decision #9 = accept_25s + decision state fixture",
    pw.resolvedDecisionRef?.decisionId === 9 &&
    pw.resolvedDecisionRef?.resolvedValue === "accept_25s_passive_window_as_v3_2_behavior" &&
    isStr(pw.resolvedDecisionRef?.decisionStateFixture) &&
    pw.resolvedDecisionRef.decisionStateFixture.endsWith("golden_sample_v3_2_owner_decision_resolution_state.v1.json"));
  check("contract passive-window 섹션에 pending/open/TBD/미결 문구 없음 (openOwnerDecision 제거 확인)",
    pw.openOwnerDecision === undefined &&
    !/openOwnerDecision|pending|미결|확정 전까지|\bTBD\b/i.test(JSON.stringify({ ...pw, rejectedAlternative: undefined, rejectedAlternativeNote: undefined })));
  check("contract forbiddenBehavior: passive-window pending 재도입/immediate-poll 표준 주장/profile 변조 금지 포함",
    contract.forbiddenBehavior.some((s) => s.includes("resolved decision(#9)")) &&
    contract.forbiddenBehavior.some((s) => s.includes("immediate 1~2s poll-only")) &&
    contract.forbiddenBehavior.some((s) => s.includes("resolved profile 값 변조")));
}

// ── 3. 계약 핵심 의미 고정 (hard cap 소스 / no-live / 수집 / 위생 / 진단) ──
{
  const fl = contract.flags ?? {};
  check("contract flags: uploadReady/automationExpansionReady/implementationApproved/liveGenerationApproved 전부 false",
    fl.uploadReady === false && fl.automationExpansionReady === false &&
    fl.implementationApproved === false && fl.liveGenerationApproved === false);
  const nl = contract.noLivePolicy ?? {};
  const nlKeys = ["noChatgptPlaywrightExecution", "noBrowserOrCdpLaunch", "noImageGeneration", "noPaidApiCalls",
    "noLiveTts", "noRenderOrMux", "noUpload", "noUploadQueue", "noEnvOrSecretAccess", "noNetwork", "noWrite"];
  check("contract noLivePolicy 11개 항목 전부 true + dry_run_validation_only",
    nlKeys.every((k) => nl[k] === true) && nl.standardRunnerMode === "dry_run_validation_only",
    `false=${nlKeys.filter((k) => nl[k] !== true).join(",")}`);
  check("contract hard cap single-source pinned (plan_fixture, forbidRunnerConstants)",
    contract.approvalModel?.hardCapRule?.sourceType === "plan_fixture" &&
    contract.approvalModel?.hardCapRule?.forbidRunnerConstants === true);
  check("contract liveGenerationApprovedNow === false",
    contract.approvalModel?.liveGenerationApprovedNow === false);
  check("contract planInputSchema requires 8 blocks (topic/evidence/prompts/cap/cost/stop/quality/mode)",
    setEq(contract.approvalModel?.planInputSchema?.requiredBlocks,
      ["ownerTopicApproval", "storyVisualEvidenceRef", "promptSet", "submissionHardCap",
       "costCapUsd", "stopConditions", "expectedImageQuality", "executionMode"]));
  check("contract liveGuardConvention withholds flag literal (reference-only)",
    contract.approvalModel?.liveGuardConvention?.literalWithheld === true &&
    isStr(contract.approvalModel?.liveGuardConvention?.reference));
  const cs = contract.collectionStandard ?? {};
  check("contract collection: page-wide + user 첨부 제외 + stale 제외 + 200/400px",
    cs.method === "page_wide_generated_image_collection" && cs.excludeUserAttachments === true &&
    cs.excludeStaleImages === true && cs.minCandidateWidthPx === 200 && cs.minFreshWidthPx === 400);
  check("contract collection markers pinned (estuary/files/oaiusercontent/blob)",
    setEq(cs.generatedUrlMarkers, ["backend-api/estuary/content", "backend-api/files", "oaiusercontent", "blob:"]));
  check("contract assistant-scoped helper deprecated for golden sample",
    isStr(cs.assistantScopedHelperStatus) && cs.assistantScopedHelperStatus.startsWith("deprecated_for_golden_sample"));
  const ch = contract.conversationHygiene ?? {};
  check("contract hygiene: old-conversation reuse forbidden except same-run current-page recovery",
    ch.oldConversationReusePolicy === "forbidden_except_same_run_current_image_recovery" &&
    ch.sameRunRecovery?.allowedSource === "current_page_only" &&
    ch.sameRunRecovery?.requiresSameRun === true && ch.sameRunRecovery?.requiresKnownCurrentImage === true);
  const ld = contract.latencyDiagnostics ?? {};
  check("contract latency diagnostics metrics pinned (submit/first/saved/detection/delayed/result)",
    setEq(ld.requiredMetricsPerPrompt,
      ["submittedAtIso", "firstCandidateSec", "savedSec", "detectionLatencySec", "delayedSaveOver30s", "result"]));
  check("contract output facts per image pinned (md5/bytes/promptHash 포함)",
    setEq(contract.outputFacts?.requiredPerImage,
      ["order", "imageId", "beat", "width", "height", "format", "bytes", "md5", "saveMethod", "promptHash", "submitted"]));
  const s1refs = [contract.sliceOneIntegration?.sliceOneContract,
    contract.sliceOneIntegration?.sliceOneSample, contract.sliceOneIntegration?.sliceOneGuard];
  check("contract Slice 1 integration mandatory + referenced slice-1 files exist",
    contract.sliceOneIntegration?.planMustReferenceStoryVisualEvidence === true &&
    s1refs.every((p) => isStr(p) && existsSync(path.join(ROOT, p))));
  check("contract forbiddenBehavior non-empty (>=8 rules)",
    isStrArr(contract.forbiddenBehavior) && contract.forbiddenBehavior.length >= 8);
  check("contract verifiedRunnerLineage lists the 3 clone runners (존재 확인)",
    Array.isArray(contract.basedOn?.verifiedRunnerLineage) &&
    contract.basedOn.verifiedRunnerLineage.length === 3 &&
    contract.basedOn.verifiedRunnerLineage.every((p) => existsSync(path.join(ROOT, p))));
}

// ── 4. sample plan 검증 (Slice 1 참조 / reject 코드 / md5 lock / prompt 정합) ──
{
  check("plan references the runner contract fixture",
    isStr(plan.contractRef) && plan.contractRef.endsWith("golden_sample_v3_2_chatgpt_playwright_runner_contract.v1.json"));
  const fl = plan.flags ?? {};
  check("plan flags: uploadReady/automationExpansionReady/implementationApproved/liveGenerationApproved 전부 false",
    fl.uploadReady === false && fl.automationExpansionReady === false &&
    fl.implementationApproved === false && fl.liveGenerationApproved === false);

  const ota = plan.ownerTopicApproval ?? {};
  check("plan ownerTopicApproval approved=true + permanentChannelWideTopicLock=false + non-empty fields",
    ota.approved === true && ota.permanentChannelWideTopicLock === false &&
    isStr(ota.topicId) && isStr(ota.title) && isStr(ota.approvedScope) && isStr(ota.approvalSourceNote));
  check("plan topicId/title match accepted blueprint + slice 1 accepted sample",
    ota.topicId === blueprint.topicId && ota.title === blueprint.title &&
    ota.topicId === s1sample.owner_topic_confirmation?.topicId &&
    ota.title === s1sample.owner_topic_confirmation?.title,
    `plan=${ota.topicId}/${ota.title}`);

  const sve = plan.storyVisualEvidenceRef ?? {};
  check("plan has Slice 1 story/visual evidence reference (contract+sample, 파일 존재)",
    isStr(sve.contract) && sve.contract.endsWith(path.basename(S1_CONTRACT_PATH)) &&
    isStr(sve.sample) && sve.sample.endsWith(path.basename(S1_SAMPLE_PATH)) &&
    existsSync(path.join(ROOT, sve.contract)) && existsSync(path.join(ROOT, sve.sample)));

  const prim = plan.promptSet?.primary ?? {};
  check("plan promptSet.primary matches actual v3 prompts fixture (schema/count/topic)",
    isStr(prim.path) && prim.path.endsWith(path.basename(PROMPTS_V3_PATH)) &&
    prim.schemaVersion === promptsV3.schemaVersion &&
    prim.promptCount === (promptsV3.prompts?.length ?? -1) &&
    promptsV3.topicId === ota.topicId,
    `plan=${prim.schemaVersion}/${prim.promptCount} actual=${promptsV3.schemaVersion}/${promptsV3.prompts?.length}`);
  const patch = plan.promptSet?.patchRunLineage ?? {};
  check("plan promptSet.patchRunLineage matches actual v3.1 patch fixture (schema/count/historical cap 6)",
    isStr(patch.path) && patch.path.endsWith(path.basename(PROMPTS_V31_PATH)) &&
    patch.schemaVersion === promptsV31.schemaVersion &&
    patch.promptCount === (promptsV31.prompts?.length ?? -1) &&
    patch.historicalHardCap === 6);

  const cap = plan.submissionHardCap ?? {};
  check("plan hard cap: positive integer from plan fixture (sourceType=plan_fixture, forbidRunnerConstants)",
    Number.isInteger(cap.value) && cap.value >= 1 && cap.sourceType === "plan_fixture" &&
    cap.forbidRunnerConstants === true && isStr(cap.approvalSourceNote));
  check("plan hard cap equals v3 precedent (12) and >= primary promptCount",
    cap.value === 12 && cap.value >= (promptsV3.prompts?.length ?? Infinity));
  check("plan costCapUsd === 0 (ChatGPT 경로 무과금)", plan.costCapUsd === 0);
  check("plan stopConditions >= 3 and cover cap/timeout/owner-stop",
    isStrArr(plan.stopConditions) && plan.stopConditions.length >= 3 &&
    plan.stopConditions.some((s) => s.includes("submissionHardCap")) &&
    plan.stopConditions.some((s) => s.includes("TIMEOUT_BLOCKED")) &&
    plan.stopConditions.some((s) => s.includes("Owner")));

  const eq = plan.expectedImageQuality ?? {};
  check("plan rejectCodesBase set-match slice 1 contract baseRejectCodes",
    setEq(eq.rejectCodesBase, s1contract.visualEvidence?.baseRejectCodes));
  check("plan moneyDominantRejectCodes set-match slice 1 (화폐 hard-fail 7 + money_clarity_fail)",
    setEq(eq.moneyDominantRejectCodes, [
      ...(s1contract.visualEvidence?.koreanMoneyHardFailCodes ?? []),
      ...(s1contract.visualEvidence?.moneyDominantExtraRejectCodes ?? []),
    ]));
  check("plan nativeResolutionRisk records 941x1672 technical risk",
    isStr(eq.nativeResolutionRisk) && eq.nativeResolutionRisk.includes("941x1672"));
  const lock = Array.isArray(eq.acceptedSetMd5Lock) ? eq.acceptedSetMd5Lock : [];
  const sel = (blueprint.selected_image_set ?? []).map((e) => ({ imageId: e.imageId, md5: e.md5 }));
  check("plan acceptedSetMd5Lock verbatim-matches blueprint selected_image_set (9 imageId+md5, 순서 포함)",
    sel.length === 9 && lock.length === sel.length &&
    sel.every((e, i) => lock[i]?.imageId === e.imageId && lock[i]?.md5 === e.md5));
  const promptIds = new Set([...(promptsV3.prompts ?? []), ...(promptsV31.prompts ?? [])].map((p) => p.imageId));
  const orphan = lock.filter((e) => !promptIds.has(e.imageId));
  check("plan acceptedSetMd5Lock imageIds all originate from primary/patch prompt fixtures",
    lock.length > 0 && orphan.length === 0, `orphan=${orphan.map((e) => e.imageId).join(",")}`);

  check("plan executionMode: dry_run_validation_only + liveGenerationApprovedNow=false",
    plan.executionMode?.approvedNow === "dry_run_validation_only" &&
    plan.executionMode?.liveGenerationApprovedNow === false);

  // Owner 결정 #9 — plan timingInterpretation (resolved + profile verbatim)
  const ti = plan.timingInterpretation ?? {};
  const op = contract.timingStandard?.operationalProfile ?? {};
  check("plan timingInterpretation resolved = accept_25s_passive_window_as_v3_2_behavior + notLiveApproval",
    ti.resolvedValue === "accept_25s_passive_window_as_v3_2_behavior" &&
    ti.passiveWindowIsStandardV32Behavior === true && ti.notLiveApproval === true &&
    ti.resolvedDecisionRef?.decisionId === 9);
  check("plan timingInterpretation.profile verbatim-matches contract operationalProfile (25000/1800/3/150000/180000)",
    ti.profile?.passiveWindowMs === op.passiveWindowMs && ti.profile?.passiveWindowMs === 25000 &&
    ti.profile?.pollIntervalMs === op.pollIntervalMs && ti.profile?.pollIntervalMs === 1800 &&
    ti.profile?.stablePollsToSave === op.stablePollsToSave && ti.profile?.stablePollsToSave === 3 &&
    ti.profile?.diagnosticAtMs === op.diagnosticAtMs && ti.profile?.hardTimeoutMs === op.hardTimeoutMs,
    `plan=${ti.profile?.passiveWindowMs}/${ti.profile?.pollIntervalMs}`);
}

// ── 5. runner 소스 정적 스캔 (live/browser/env/network/write 차단) ──────────
// NOTE(HANDOFF 예외 보고): 이 스캐너는 금지 토큰을 분할-연결(split-concatenated) 형태로만
// 보유하므로 스캐너 소스 자체에는 금지 문자열이 literal로 존재하지 않는다.
const runnerSrc = readFileSync(RUNNER_PATH, "utf8");
{
  const J = (a, b) => a + b;
  const baseTokens = [
    J("chromium", ".launch"),
    J("page", ".goto"),
    J("browser", ".newPage"),
    J("fetch", "("),
    J("process", ".env"),
    J("OPENAI", "_API_KEY"),
    J("BFL", "_API_KEY"),
    J("ELEVENLABS", "_API_KEY"),
    J("ALLOW", "_"),
  ];
  const flagTrue = (name) => new RegExp(J(name, "[\"']?\\s*[:=]\\s*true"), "i");
  const flagRegexes = ["uploadReady", "automationExpansionReady", "implementationApproved", "liveGenerationApproved"].map(flagTrue);

  const scan = (label, src) => {
    const litHit = baseTokens.find((t) => src.includes(t));
    const reHit = flagRegexes.find((r) => r.test(src));
    check(`no forbidden live pattern in ${label}`, !litHit && !reHit,
      litHit ? `literal=${litHit}` : reHit ? `regex=${String(reHit)}` : "");
  };
  scan("runner contract fixture", contractF.raw);
  scan("sample plan fixture", planF.raw);
  scan("standard runner source", runnerSrc);
  scan("guard script (self)", readFileSync(SELF, "utf8"));

  // runner 전용 추가 차단: browser/CDP/network/subprocess/dynamic-import 표면
  const liveSurfaceTokens = [
    J("connectOver", "CDP"),
    J("child_", "process"),
    J("node:", "http"),
    J("Web", "Socket"),
    J("XMLHttp", "Request"),
    J("require", "("),
    J("import", "("),
    J("_chatgpt-image-", "core"),
  ];
  const liveHit = liveSurfaceTokens.find((t) => runnerSrc.includes(t));
  check("runner source has no browser/CDP/network/subprocess surface", !liveHit, `token=${liveHit}`);

  // runner는 read-only — 파일 쓰기 API 표면 금지
  const writeTokens = [
    J("write", "File"),
    J("append", "File"),
    J("mk", "dir"),
    J("un", "link"),
    J("re", "name("),
    J("renameS", "ync"),
    J("createWrite", "Stream"),
    J("copy", "File"),
    J("trunc", "ate"),
    J("rm", "Sync"),
  ];
  const writeHit = writeTokens.find((t) => runnerSrc.includes(t));
  check("runner source has no filesystem write surface (read-only)", !writeHit, `token=${writeHit}`);

  // import allowlist: node:fs / node:path / node:url 만 허용 (계약 runnerImportRule)
  const specifiers = [...runnerSrc.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  const badImports = specifiers.filter((s) => !allow.has(s));
  check("runner imports restricted to node:fs/node:path/node:url", specifiers.length > 0 && badImports.length === 0,
    `bad=${badImports.join(",")}`);
  console.log("NOTE  scanner holds forbidden tokens split-concatenated only (denylist exception per HANDOFF)");
}

// ── 6. runner 동작 검증 (import + in-memory, no-live) ───────────────────────
const runner = await import(pathToFileURL(RUNNER_PATH).href);
{
  const fns = ["imageFileNameFor", "isGeneratedImageCandidate", "filterFreshCandidates", "stableCandidateKey",
    "updateStableState", "createSubmissionLedger", "evaluateLatency", "evaluateRecoveryRequest",
    "validatePassiveWindowResolution", "hasPassiveWindowPendingWording",
    "validateContract", "validatePlanAgainstContract", "buildExecutionPlan", "runDryRunValidation", "defaultIo"];
  check("runner exports all reusable logic surfaces", fns.every((f) => typeof runner[f] === "function"),
    `missing=${fns.filter((f) => typeof runner[f] !== "function").join(",")}`);
  check("runner default fixture paths point at the standard contract/plan",
    String(runner.DEFAULT_CONTRACT_PATH).endsWith(path.basename(CONTRACT_PATH)) &&
    String(runner.DEFAULT_PLAN_PATH).endsWith(path.basename(DEFAULT_PLAN_PATH)));
  check("runner refuses live-mode flags (fail-closed list)",
    Array.isArray(runner.REFUSED_LIVE_FLAGS) &&
    ["--live", "--generate", "--submit", "--arm"].every((f) => runner.REFUSED_LIVE_FLAGS.includes(f)));

  const dry = runner.runDryRunValidation({ contractPath: CONTRACT_PATH, planPath: PLAN_PATH });
  check("runner dry-run validation PASS on contract + sample plan (0 issues)",
    dry.ok === true && dry.issues.length === 0, dry.issues.slice(0, 3).join(" | "));
  check("runner dry-run execution plan: 9 prompts simulated within cap 12 (잔여 3)",
    dry.executionPlan?.entries?.length === 9 &&
    dry.executionPlan?.submissionHardCap === 12 &&
    dry.executionPlan?.simulatedSubmissions === 9 &&
    dry.executionPlan?.remainingBudget === 3);
  check("runner dry-run entries carry beat + target file name (img-01-… 규약)",
    dry.executionPlan?.entries?.[0]?.targetFileName === "img-01-img_31_hook_envelope_vs_empty_jar.png" &&
    dry.executionPlan?.entries?.every((e) => isStr(e.beat) && /^img-\d{2}-/.test(e.targetFileName)));
  check("runner dry-run timingPolicy carries resolved passive-window value (Owner 결정 #9)",
    dry.executionPlan?.timingPolicy?.passiveWindowResolvedValue === "accept_25s_passive_window_as_v3_2_behavior" &&
    dry.executionPlan?.timingPolicy?.passiveWindowMs === 25000 &&
    dry.executionPlan?.timingPolicy?.pollIntervalMs === 1800);

  // fail-closed mutants (in-memory only — 파일 쓰기 없음)
  const io = runner.defaultIo();
  const mutate = (fn) => { const m = clone(plan); fn(m); return runner.validatePlanAgainstContract(m, contract, io); };
  const m1 = mutate((m) => { delete m.storyVisualEvidenceRef; });
  check("mutant: story/visual evidence reference 제거 → runner validation fail (Slice 1 integration)",
    m1.length > 0 && m1.some((i) => i.includes("storyVisualEvidence")), m1.slice(0, 2).join(" | "));
  const m2 = mutate((m) => { m.submissionHardCap.value = 0; });
  check("mutant: hard cap 0 → fail", m2.some((i) => i.includes("submissionHardCap")));
  const m3 = mutate((m) => { m.costCapUsd = 5; });
  check("mutant: costCapUsd 5 → fail", m3.some((i) => i.includes("costCapUsd")));
  const m4 = mutate((m) => { m.executionMode.liveGenerationApprovedNow = true; });
  check("mutant: liveGenerationApprovedNow true → fail", m4.some((i) => i.includes("liveGenerationApprovedNow")));
  const m5 = mutate((m) => { m.expectedImageQuality.acceptedSetMd5Lock[0].md5 = "0".repeat(32); });
  check("mutant: md5 lock 변조 → fail (verbatim 교차)", m5.some((i) => i.includes("acceptedSetMd5Lock")));
  const m6 = mutate((m) => { m.promptSet.primary.promptCount = 4; });
  check("mutant: promptCount 불일치 → fail", m6.some((i) => i.includes("promptCount")));

  // ── Owner 결정 #9 passive-window plan mutants (fail-closed) ──
  const pw1 = mutate((m) => { delete m.timingInterpretation; });
  check("mutant(#9): plan timingInterpretation 제거 → fail (resolution 필수)",
    pw1.some((i) => i.includes("timingInterpretation")));
  const pw2 = mutate((m) => { m.timingInterpretation.resolvedValue = "switch_to_immediate_1_2s_poll"; });
  check("mutant(#9): plan resolvedValue를 immediate-poll 대안으로 변조 → fail",
    pw2.some((i) => i.includes("resolvedValue")));
  const pw3 = mutate((m) => { delete m.timingInterpretation.resolvedDecisionRef; });
  check("mutant(#9): plan resolvedDecisionRef 제거 → fail",
    pw3.some((i) => i.includes("resolvedDecisionRef") || i.includes("decisionId")));
  const pw4 = mutate((m) => { m.timingInterpretation.profile.passiveWindowMs = 5000; });
  check("mutant(#9): plan profile passiveWindowMs 5000(≠25000) → fail",
    pw4.some((i) => i.includes("passiveWindowMs")));
  const pw5 = mutate((m) => { m.timingInterpretation.profile.pollIntervalMs = 1200; });
  check("mutant(#9): plan profile pollIntervalMs 1200(≠1800) → fail",
    pw5.some((i) => i.includes("pollIntervalMs")));
  const pw6 = mutate((m) => { m.timingInterpretation.notLiveApproval = false; });
  check("mutant(#9): plan notLiveApproval false → fail (live/생성 승인 아님 명시 필수)",
    pw6.some((i) => i.includes("notLiveApproval")));
  const pw7 = mutate((m) => { m.timingInterpretation.sourceNote = "openOwnerDecision pending 미결"; });
  check("mutant(#9): plan 섹션에 pending/미결 문구 재도입 → fail",
    pw7.some((i) => i.includes("pending") || i.includes("timingInterpretation")));

  // contract passive-window mutants
  const cpw1 = clone(contract); cpw1.timingStandard.passiveWindowInterpretation.resolvedValue = "switch_to_immediate_1_2s_poll";
  check("mutant(#9): contract resolvedValue immediate-poll 대안 → contract fail",
    runner.validateContract(cpw1).some((i) => i.includes("resolvedValue")));
  const cpw2 = clone(contract);
  delete cpw2.timingStandard.passiveWindowInterpretation.resolvedValue;
  cpw2.timingStandard.passiveWindowInterpretation.openOwnerDecision = "gap analysis Owner 결정 #9 pending";
  check("mutant(#9): contract pending 문구(openOwnerDecision) 재도입 → contract fail",
    runner.validateContract(cpw2).some((i) => i.includes("passiveWindow")));
  const cpw3 = clone(contract); cpw3.timingStandard.operationalProfile.passiveWindowMs = 10000;
  check("mutant(#9): contract operationalProfile passiveWindowMs 10000(≠25000) → contract fail",
    runner.validateContract(cpw3).some((i) => i.includes("passiveWindowMs")));

  // passive-window pure helper 직접 검증
  check("hasPassiveWindowPendingWording: openOwnerDecision 포함 → true",
    runner.hasPassiveWindowPendingWording({ openOwnerDecision: "x" }) === true);
  check("hasPassiveWindowPendingWording: resolved 섹션(대안 이름은 audit 필드) → false",
    runner.hasPassiveWindowPendingWording({
      resolvedValue: "accept_25s_passive_window_as_v3_2_behavior",
      rejectedAlternative: "switch_to_immediate_1_2s_poll",
    }) === false);
  check("validatePassiveWindowResolution: 정상 resolved 섹션 → 0 issues",
    runner.validatePassiveWindowResolution(
      contract.timingStandard.passiveWindowInterpretation,
      contract.timingStandard.operationalProfile).length === 0);
  check("validatePassiveWindowResolution: 섹션 누락 → fail-closed",
    runner.validatePassiveWindowResolution(undefined, contract.timingStandard.operationalProfile).length > 0);

  const cMut1 = clone(contract); cMut1.conversationHygiene.sidebarScanProhibited = false;
  check("mutant: contract sidebarScanProhibited=false → runner contract validation fail",
    runner.validateContract(cMut1).some((i) => i.includes("sidebarScanProhibited")));
  const cMut2 = clone(contract); cMut2.timingStandard.operationalProfile.pollIntervalMs = 5000;
  check("mutant: contract pollIntervalMs 5000 (1~2s 밖) → fail",
    runner.validateContract(cMut2).some((i) => i.includes("pollIntervalMs")));

  // pure helper 표면 검증
  let capThrew = false;
  const ledger = runner.createSubmissionLedger(2);
  ledger.recordSubmission(); ledger.recordSubmission();
  try { ledger.recordSubmission(); } catch { capThrew = true; }
  check("ledger: cap 2에서 3번째 제출 시도는 throw (hard cap 절대 초과 불가)", capThrew && ledger.used === 2);
  let capZeroThrew = false;
  try { runner.createSubmissionLedger(0); } catch { capZeroThrew = true; }
  check("ledger: cap 0/비정수는 생성 자체가 throw (plan fixture 단일 소스 강제)", capZeroThrew);

  const latOver = runner.evaluateLatency({ firstCandidateSec: 40, savedSec: 75 }, { detectToSaveTargetSec: 30 });
  const latOk = runner.evaluateLatency({ firstCandidateSec: 40, savedSec: 60 }, { detectToSaveTargetSec: 30 });
  const latNone = runner.evaluateLatency({}, { detectToSaveTargetSec: 30 });
  check("latency: detect-to-save 35s(>30) → diagnosticRequired + 사유 기록",
    latOver.detectionLatencySec === 35 && latOver.delayedSaveOverTarget === true &&
    latOver.diagnosticRequired === true && isStr(latOver.diagnosticReason));
  check("latency: detect-to-save 20s(<=30) → 진단 불필요",
    latOk.detectionLatencySec === 20 && latOk.delayedSaveOverTarget === false && latOk.diagnosticRequired === false);
  check("latency: 미감지 → diagnosticRequired (침묵 pass 금지)", latNone.diagnosticRequired === true);

  const genOk = runner.isGeneratedImageCandidate({ src: "https://chatgpt.com/backend-api/estuary/content?id=file-abc", naturalWidth: 900 });
  const genBlob = runner.isGeneratedImageCandidate({ src: "blob:https://chatgpt.com/xyz", naturalWidth: 900 });
  const genUser = runner.isGeneratedImageCandidate({ src: "https://chatgpt.com/backend-api/estuary/content?id=file-abc", naturalWidth: 900, insideUserAttachment: true });
  const genSmall = runner.isGeneratedImageCandidate({ src: "https://chatgpt.com/backend-api/estuary/content?id=file-abc", naturalWidth: 150 });
  const genForeign = runner.isGeneratedImageCandidate({ src: "https://example.com/x.png", naturalWidth: 900 });
  check("collection: estuary/blob 후보 인정, user 첨부·소형·외부 URL 제외",
    genOk === true && genBlob === true && genUser === false && genSmall === false && genForeign === false);
  const fresh = runner.filterFreshCandidates(
    [{ src: "https://chatgpt.com/backend-api/files/1?id=old1", cid: "old1", naturalWidth: 900, naturalHeight: 1600 },
     { src: "https://chatgpt.com/backend-api/files/2?id=new1", cid: "new1", naturalWidth: 941, naturalHeight: 1672 },
     { src: "https://chatgpt.com/backend-api/files/3?id=new2", cid: "new2", naturalWidth: 300, naturalHeight: 500 }],
    new Set(["old1"]));
  check("collection: baseline cid(stale) 제외 + fresh 최소 400px 강제",
    fresh.length === 1 && fresh[0].cid === "new1");

  let st = null;
  st = runner.updateStableState(st, "k1", 3);
  st = runner.updateStableState(st, "k1", 3);
  const before = st.saveNow;
  st = runner.updateStableState(st, "k1", 3);
  const reset = runner.updateStableState(st, "k2", 3);
  check("stable×3: 2회는 저장 보류, 3회 연속 stable → 즉시 저장, key 변경 시 리셋",
    before === false && st.saveNow === true && reset.count === 1 && reset.saveNow === false);

  const recSidebar = runner.evaluateRecoveryRequest({ source: "sidebar", sameRun: true, knownCurrentImage: true });
  const recOk = runner.evaluateRecoveryRequest({ source: "current_page", sameRun: true, knownCurrentImage: true });
  const recOtherRun = runner.evaluateRecoveryRequest({ source: "current_page", sameRun: false, knownCurrentImage: true });
  check("recovery: sidebar 금지 / same-run current-page만 허용 / 타 run 금지",
    recSidebar.allowed === false && recOk.allowed === true && recOtherRun.allowed === false);
  check("file naming: imageFileNameFor(1, id) === img-01-<id>.png",
    runner.imageFileNameFor(1, "img_x") === "img-01-img_x.png");
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks) — plan=${PLAN_PATH}`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — plan=${PLAN_PATH}`);
process.exit(failures === 0 ? 0 : 1);
