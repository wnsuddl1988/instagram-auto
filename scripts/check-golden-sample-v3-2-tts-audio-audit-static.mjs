#!/usr/bin/env node
/**
 * check-golden-sample-v3-2-tts-audio-audit-static.mjs
 *
 * Golden Sample v3.2 Slice 4 — TTS/audio/mux/audit 계약/plan/harness 정적 가드.
 * task: golden-sample-v3-2-tts-audio-audit-standardization-v1
 *
 * - no-live / no-network / no-env / no-secret / no-tts / no-audio-read / no-probe / no-render / no-write:
 *   레포 내 fixture JSON과 스크립트 소스를 읽어 검증만 한다.
 * - 검증 대상:
 *   1) tts/audio/audit contract ↔ production standard(ttsFirstStandard/qaReadiness) + mux manifest 정합
 *   2) sample plan — v3.2 mux manifest/acceptance-lock 참조 필수, gate/threshold 교차
 *   3) Script Impact Gate + audio gate + mux media gate + 4-gate audit 판정 로직 동작 (fail-closed mutant)
 *   4) harness 소스 — 금지 live-tts/audio/probe/mux/env/network/write 패턴 + import allowlist
 *   5) harness 동작 — import해 dry-run PASS + fail-closed mutant + pure gate helper 검증
 * - 전부 통과 시 exit 0 + PASS 카운트 출력, 위반 시 exit 1.
 * - 음성 테스트용: --plan <path> 로 plan 경로 대체 가능 (값 없으면 exit 2).
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const FX = (name) => path.join(ROOT, "scripts", "fixtures", name);

const CONTRACT_PATH = FX("golden_sample_v3_2_tts_audio_audit_contract.v1.json");
const DEFAULT_PLAN_PATH = FX("golden_sample_v3_2_tts_audio_audit_sample_plan.t1_lifestyle_inflation.v1.json");
const STANDARD_PATH = FX("golden_sample_v3_2_production_standard.v1.json");
const ACCEPTANCE_LOCK_PATH = FX("golden_sample_v3_2_acceptance_lock.t1_lifestyle_inflation.json");
const MUX_MANIFEST_PATH = FX("golden_sample_t1_lifestyle_inflation_tts_first_mux_manifest.v3_2.json");
const HARNESS_PATH = path.join(ROOT, "scripts", "run-golden-sample-tts-audio-audit-standard-v1.mjs");

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

const contractF = loadJson("tts/audio/audit contract fixture", CONTRACT_PATH);
const planF = loadJson(`sample plan fixture (${path.basename(PLAN_PATH)})`, PLAN_PATH);
const standardF = loadJson("production standard v1 fixture", STANDARD_PATH);
const lockF = loadJson("v3.2 acceptance lock", ACCEPTANCE_LOCK_PATH);
const muxManifestF = loadJson("v3.2 tts-first mux manifest", MUX_MANIFEST_PATH);

if (!contractF.parsed || !planF.parsed || !standardF.parsed || !lockF.parsed || !muxManifestF.parsed) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core fixture unreadable, aborting`);
  process.exit(1);
}

const contract = contractF.parsed;
const plan = planF.parsed;
const standard = standardF.parsed;
const lock = lockF.parsed;
const muxManifest = muxManifestF.parsed;

// ── 1. 계약 ↔ production standard + mux manifest 정합 (threshold drift 방지) ──
{
  const stdTts = standard.ttsFirstStandard ?? {};
  const stdAg = stdTts.audioQualityGates ?? {};
  const cAg = contract.audioQualityGateStandard ?? {};
  check("contract audio gate thresholds match production standard (0.6/0.8/0.18/0.72)",
    cAg.beginningSilenceMaxSec === stdAg.beginningSilenceMaxSec && cAg.beginningSilenceMaxSec === 0.6 &&
    cAg.first5sSilenceMaxSec === stdAg.first5sSilenceMaxSec && cAg.first5sSilenceMaxSec === 0.8 &&
    cAg.totalSilenceRatioMax === stdAg.totalSilenceRatioMax && cAg.totalSilenceRatioMax === 0.18 &&
    cAg.speechActiveRatioMin === stdAg.speechActiveRatioMin && cAg.speechActiveRatioMin === 0.72,
    `contract=${cAg.beginningSilenceMaxSec}/${cAg.first5sSilenceMaxSec}/${cAg.totalSilenceRatioMax}/${cAg.speechActiveRatioMin}`);
  check("contract tailHoldSecRange matches production standard [0.3,0.8]",
    setEq(cAg.tailHoldSecRange, stdAg.tailHoldSecRange) && cAg.tailHoldSecRange?.[0] === 0.3 && cAg.tailHoldSecRange?.[1] === 0.8);
  const cRa = contract.wordPhraseReAnchorStandard ?? {};
  const stdRa = stdTts.wordPhraseReAnchor ?? {};
  check("contract re-anchor tolerance/maxDelta match production standard (120/50)",
    cRa.entryToleranceMs === stdRa.entryToleranceMs && cRa.entryToleranceMs === 120 &&
    cRa.v32MeasuredMaxDeltaMs === stdRa.v32MeasuredMaxDeltaMs && cRa.v32MeasuredMaxDeltaMs === 50);
  check("contract tts oneShot/sceneByScene match production standard",
    contract.ttsStandard?.strategy === "full_narration_one_shot" && stdTts.oneShotOnly === true &&
    isStr(contract.ttsStandard?.sceneBySceneTts) && contract.ttsStandard.sceneBySceneTts.startsWith("금지") &&
    stdTts.sceneBySceneTts === "금지");
  check("contract mux padding/atempo/hardTrim/fixed forbidden (matches production standard)",
    contract.muxPolicyStandard?.paddingUsed === "금지" && stdTts.paddingToForceDuration === "금지" &&
    contract.muxPolicyStandard?.atempoUsed === "금지" &&
    contract.muxPolicyStandard?.hardTrimUsed === "금지" && stdTts.speechHardTrim === "금지" &&
    contract.muxPolicyStandard?.fixedDurationTarget === "금지" && String(stdTts.fixedDurationTarget).startsWith("금지"));

  // Script Impact Gate required ↔ mux manifest verbatim
  const cReq = contract.scriptImpactGateStandard?.requiredScores ?? {};
  const mReq = muxManifest.scriptImpactGate?.required ?? {};
  check("contract Script Impact Gate required scores verbatim match mux manifest (90/90/90/90/88/88)",
    ["hook_self_relevance_score", "story_causality_score", "problem_solution_bridge_score",
      "solution_specificity_score", "save_worthiness_score", "spoken_naturalness_score"].every((k) => cReq[k] === mReq[k]) &&
    cReq.hook_self_relevance_score === 90 && cReq.save_worthiness_score === 88);
  check("contract Script Impact Gate hardFailKeys verbatim match mux manifest (7 keys)",
    setEq(contract.scriptImpactGateStandard?.hardFailKeys, Object.keys(muxManifest.scriptImpactGate?.hardFailCheck ?? {})));

  // audio gate thresholds ↔ mux manifest
  const mAg = muxManifest.audioQualityGates ?? {};
  check("contract audio gate matches mux manifest (silencedetect -35db / 0.35s min)",
    cAg.silencedetectNoiseDb === mAg.silencedetectNoiseDb && cAg.silencedetectNoiseDb === -35 &&
    cAg.silencedetectMinSilenceSec === mAg.silencedetectMinSilenceSec && cAg.silencedetectMinSilenceSec === 0.35);
  check("contract tts apiCallBudgetMax matches mux manifest (2)",
    contract.ttsStandard?.apiCallBudgetMax === muxManifest.tts?.apiCallBudgetMax && contract.ttsStandard?.apiCallBudgetMax === 2);

  // mux probe expectation ↔ acceptance lock
  const cFp = contract.muxPolicyStandard?.expectedFfprobe ?? {};
  check("contract mux probe expectation matches acceptance lock (1080x1920, h264, 30/1, aac, 53.966667s)",
    cFp.width === lock.expectedFfprobe?.width && cFp.height === lock.expectedFfprobe?.height &&
    cFp.videoCodec === lock.expectedFfprobe?.videoCodec && cFp.rFrameRate === lock.expectedFfprobe?.rFrameRate &&
    cFp.videoDurationSec === lock.expectedFfprobe?.videoDurationSec);
  check("contract equivalence muxMd5 matches acceptance lock",
    contract.basedOn?.muxMd5 === lock.lockedArtifacts?.muxMd5 && contract.basedOn?.muxMd5 === "9f5ad22c02cb4f4f813a1ed16fd658b0");

  // qaReadiness ↔ production standard
  const cQa = contract.qaReadinessSeparation ?? {};
  check("contract qaReadiness preUploadGates verbatim match production standard (6 gates + owner_viewing_listening)",
    setEq(cQa.preUploadGates, standard.qaReadiness?.preUploadGates) &&
    cQa.preUploadGates?.includes("owner_viewing_listening_pass"));
}

// ── 2. 계약 핵심 의미 고정 (no-live / gate 순서 / 금지 route / audit 분리) ──
{
  const fl = contract.flags ?? {};
  check("contract flags: upload/automation/impl/liveTts/liveMux/liveAudioAnalysis 전부 false",
    fl.uploadReady === false && fl.automationExpansionReady === false && fl.implementationApproved === false &&
    fl.liveTtsApproved === false && fl.liveMuxApproved === false && fl.liveAudioAnalysisApproved === false);
  const nl = contract.noLivePolicy ?? {};
  const nlKeys = ["noLiveTts", "noPaidOrFreeTtsApiCall", "noAudioOrVideoFileRead", "noFfmpegOrProbeExecution",
    "noSilenceDetectExecution", "noRenderOrMuxRegeneration", "noAudioOrVideoGeneration", "noChatgptPlaywrightExecution",
    "noBrowserOrCdpLaunch", "noImageGeneration", "noOtherExternalApi", "noUpload", "noUploadQueue",
    "noEnvOrSecretAccess", "noNetwork", "noWrite"];
  check("contract noLivePolicy 16개 항목 전부 true + dry_run_static_validation_only",
    nlKeys.every((k) => nl[k] === true) && nl.standardHarnessMode === "dry_run_static_validation_only",
    `false=${nlKeys.filter((k) => nl[k] !== true).join(",")}`);
  check("contract harnessImportRule restricts to node:fs/path/url (read-only)",
    isStr(nl.harnessImportRule) && nl.harnessImportRule.includes("node:fs") && nl.harnessImportRule.includes("node:url"));

  const sig = contract.scriptImpactGateStandard ?? {};
  check("contract Script Impact Gate: evaluatedBeforeLiveTts + gateOrderRule (PASS 전 TTS 0회)",
    sig.evaluatedBeforeLiveTts === true && isStr(sig.gateOrderRule) && sig.gateOrderRule.includes("PASS"));
  check("contract Script Impact Gate: score producer는 Owner 결정 #1 미결로 명시",
    isStr(sig.scoreProducerNote) && sig.scoreProducerNote.includes("Owner"));

  const tts = contract.ttsStandard ?? {};
  check("contract tts: one-shot only + live guard required + retry false + budget 2",
    tts.strategy === "full_narration_one_shot" && tts.requireLiveTtsGuard === true &&
    tts.retry === false && tts.apiCallBudgetMax === 2);
  check("contract tts: live flag/env literal withheld (scan 청결) + secret 출력 금지",
    tts.liveGuardConvention?.cliFlagWithheld === true && tts.liveGuardConvention?.envKeyWithheld === true &&
    isStr(tts.keyValueInLogsOrFiles) && tts.keyValueInLogsOrFiles.startsWith("금지"));

  const aa = contract.artifactAuditStandard ?? {};
  check("contract artifact audit: 4-gate (media/audio/captionCard/story) + verdictRule",
    setEq(aa.gates, ["media", "audio", "captionCard", "story"]) && isStr(aa.verdictRule) &&
    aa.verdictRule.includes("PASS_CANDIDATE_PENDING_VISION_QA"));
  check("contract artifact audit: vision QA 분리 + storyGateAnchor '세 개'",
    isStr(aa.visionQaSeparation) && aa.storyGateAnchor?.word === "세 개");

  const qa = contract.qaReadinessSeparation ?? {};
  check("contract qaReadiness: technical pass != Golden Sample pass + owner viewing/listening 분리",
    isStr(qa.role) && qa.role.includes("Owner") && isStr(qa.ownerViewingListeningPass) &&
    qa.ownerViewingListeningPass.includes("자동화로 대체 불가"));

  check("contract pipelineOrder 7단계 (Script Impact Gate → TTS → re-anchor → mux → audio → audit → QA)",
    Array.isArray(contract.pipelineOrder) && contract.pipelineOrder.length === 7 &&
    contract.pipelineOrder[0].includes("Script Impact Gate") && contract.pipelineOrder[6].includes("acceptance lock"));
  check("contract integration mandates v3.2 mux manifest + acceptance-lock refs",
    setEq(contract.integration?.manifestRefRequired,
      ["v3.2 tts-first mux manifest", "v3.2 acceptance lock", "production standard fixture"]) &&
    isStr(contract.integration?.failIfMissing));
  check("contract forbiddenBehavior non-empty (>=10, audit 8번째 클론 금지 포함)",
    isStrArr(contract.forbiddenBehavior) && contract.forbiddenBehavior.length >= 10 &&
    contract.forbiddenBehavior.some((s) => s.includes("클론")));
  check("contract verifiedAuditLineage exists in repo",
    Array.isArray(contract.basedOn?.verifiedAuditLineage) &&
    contract.basedOn.verifiedAuditLineage.length === 2 &&
    contract.basedOn.verifiedAuditLineage.every((p) => existsSync(path.join(ROOT, p))));
}

// ── 3. sample plan 검증 (manifest 참조 / gate 판정 / threshold 교차) ─────────
{
  check("plan references the tts/audio/audit contract fixture",
    isStr(plan.contractRef) && plan.contractRef.endsWith("golden_sample_v3_2_tts_audio_audit_contract.v1.json"));
  const fl = plan.flags ?? {};
  check("plan flags: upload/automation/impl/liveTts/liveMux/liveAudioAnalysis 전부 false",
    fl.uploadReady === false && fl.automationExpansionReady === false && fl.implementationApproved === false &&
    fl.liveTtsApproved === false && fl.liveMuxApproved === false && fl.liveAudioAnalysisApproved === false);

  const refs = plan.manifestRefs ?? {};
  check("plan references v3.2 mux manifest + acceptance lock + production standard (파일 존재)",
    isStr(refs.ttsFirstMuxManifest) && refs.ttsFirstMuxManifest.endsWith(path.basename(MUX_MANIFEST_PATH)) &&
    isStr(refs.acceptanceLock) && refs.acceptanceLock.endsWith(path.basename(ACCEPTANCE_LOCK_PATH)) &&
    isStr(refs.productionStandard) && refs.productionStandard.endsWith(path.basename(STANDARD_PATH)) &&
    existsSync(path.join(ROOT, refs.ttsFirstMuxManifest)) && existsSync(path.join(ROOT, refs.acceptanceLock)));

  const ota = plan.ownerTopicApproval ?? {};
  check("plan ownerTopicApproval approved=true + permanentChannelWideTopicLock=false + topic matches lock",
    ota.approved === true && ota.permanentChannelWideTopicLock === false && ota.topicId === lock.topicId);

  // Script Impact Gate: plan 점수가 required 이상 + hardFail 0 + 실측=lock
  const sig = plan.scriptImpactGate ?? {};
  const lockScores = lock.acceptanceCriteria?.storyCausalityFirst?.scriptImpactGate?.scores ?? {};
  check("plan Script Impact Gate scores verbatim match acceptance lock (91/92/91/92/89/90)",
    ["hook_self_relevance_score", "story_causality_score", "problem_solution_bridge_score",
      "solution_specificity_score", "save_worthiness_score", "spoken_naturalness_score"].every((k) => sig.scores?.[k] === lockScores[k]) &&
    sig.scores?.hook_self_relevance_score === 91 && sig.hardFails === 0);
  check("plan Script Impact Gate evaluatedBeforeLiveTts=true + verdict PASS",
    sig.evaluatedBeforeLiveTts === true && sig.verdict === "PASS");

  // TTS 정책
  const tts = plan.tts ?? {};
  check("plan tts: one-shot + sceneByScene=false + liveTtsCalls(1) <= budget(2) + no secret leak",
    tts.strategy === "full_narration_one_shot" && tts.sceneBySceneTts === false &&
    tts.liveTtsCalls === 1 && tts.apiCallBudgetMax === 2 && tts.keyValueLeaked === false);

  // re-anchor
  const ra = plan.wordPhraseReAnchor ?? {};
  check("plan re-anchor: tolerance 120 / maxDelta 50 (<= tolerance) / overlayCount 29 / no padding-atempo-hardtrim",
    ra.entryToleranceMs === 120 && ra.measuredMaxDeltaMs === 50 && ra.measuredMaxDeltaMs <= ra.entryToleranceMs &&
    ra.overlayCount === 29 && ra.paddingUsed === false && ra.atempoUsed === false && ra.hardTrimUsed === false);

  // audio gate: plan 실측이 threshold 이내
  const ag = plan.audioQualityGate ?? {};
  const lockAq = lock.acceptanceCriteria?.audioQuality ?? {};
  check("plan audio gate measured values verbatim match acceptance lock (begin 0 / first5s 0.35 / ratio 0.0682 / active 0.932)",
    ag.beginningSilenceSec === lockAq.beginningSilenceSec && ag.first5sSilenceSec === lockAq.first5sSilenceSec &&
    ag.totalSilenceRatio === lockAq.totalSilenceRatio && ag.speechActiveRatio === lockAq.speechActiveRatio &&
    ag.clippedTail === lockAq.clippedTail);
  check("plan audio gate thresholds match contract (0.6/0.8/0.18/0.72)",
    ag.thresholds?.beginningSilenceMaxSec === contract.audioQualityGateStandard?.beginningSilenceMaxSec &&
    ag.thresholds?.totalSilenceRatioMax === contract.audioQualityGateStandard?.totalSilenceRatioMax);

  // mux policy
  const mux = plan.muxPolicy ?? {};
  check("plan mux: natural 53.97s + no fixed/padding/atempo/hardTrim + probe 1080x1920 h264 30/1 aac",
    mux.naturalDurationSec === 53.97 && mux.fixedTargetUsed === false && mux.paddingUsed === false &&
    mux.atempoUsed === false && mux.hardTrimUsed === false &&
    mux.probeExpected?.width === 1080 && mux.probeExpected?.videoCodec === "h264" && mux.probeExpected?.rFrameRate === "30/1" && mux.probeExpected?.audioCodec === "aac");

  // artifact audit
  const aa = plan.artifactAudit ?? {};
  check("plan artifact audit: 4-gate all true + verdict PASS_CANDIDATE + vision QA separate stage",
    aa.gates?.media === true && aa.gates?.audio === true && aa.gates?.captionCard === true && aa.gates?.story === true &&
    aa.verdict === "PASS_CANDIDATE_PENDING_VISION_QA" && aa.claudeVisionQaSeparateStage === true);
  check("plan story gate anchor '세 개' + threeVisibleWhenSpoken (matches lock threeSlotGate)",
    aa.storyGateAnchor?.word === "세 개" && aa.storyGateAnchor?.threeVisibleWhenSpoken === true &&
    aa.storyGateAnchor?.threeVisibleWhenSpoken === lock.acceptanceCriteria?.storyCausalityFirst?.threeSlotGate?.threeVisibleWhenSpoken);

  // QA readiness
  const qa = plan.qaReadiness ?? {};
  check("plan qaReadiness: uploadReady/automationExpansionReady false + owner viewing/listening PENDING",
    qa.uploadReady === false && qa.automationExpansionReady === false &&
    isStr(qa.ownerViewingListeningPass) && qa.ownerViewingListeningPass.includes("PENDING"));

  check("plan executionMode: dry_run_static_validation_only + liveTts/liveMux/liveAudioAnalysis approvedNow=false",
    plan.executionMode?.approvedNow === "dry_run_static_validation_only" &&
    plan.executionMode?.liveTtsApprovedNow === false && plan.executionMode?.liveMuxApprovedNow === false &&
    plan.executionMode?.liveAudioAnalysisApprovedNow === false);
}

// ── 4. harness 소스 정적 스캔 (live-tts/audio/probe/mux/env/network/write 차단) ──
// NOTE(HANDOFF 예외 보고): 이 스캐너는 금지 토큰을 분할-연결(split-concatenated) 형태로만
// 보유하므로 스캐너 소스 자체에는 금지 문자열이 literal로 존재하지 않는다.
const harnessSrc = readFileSync(HARNESS_PATH, "utf8");
{
  const J = (a, b) => a + b;
  const renderTokens = [
    J("child_", "process"),
    J("spawn", "("),
    J("exec", "("),
    J("execFile", "("),
    J("ff", "mpeg"),
    J("ff", "probe"),
    J("Image", "Draw"),
    J("process", ".env"),
    J("fetch", "("),
    J("eleven", "labs.io"),
    J("api.eleven", "labs"),
    J("chromium", ".launch"),
    J("page", ".goto"),
    J("browser", ".newPage"),
  ];
  const wordRegexes = [new RegExp(J("\\bpy", "thon\\b"), "i"), new RegExp(J("\\bPI", "L\\b"))];
  const writeTokens = [
    J("write", "File"),
    J("append", "File"),
    J("mk", "dir"),
    J("rm", "Sync"),
    J("un", "link"),
    J("re", "name("),
    J("createWrite", "Stream"),
  ];
  const flagTrue = (name) => new RegExp(J(name, "[\"']?\\s*[:=]\\s*true"), "i");
  const flagRegexes = ["uploadReady", "automationExpansionReady", "implementationApproved",
    "liveTtsApproved", "liveMuxApproved", "liveAudioAnalysisApproved"].map(flagTrue);

  const scan = (label, src) => {
    const rHit = renderTokens.find((t) => src.includes(t));
    const rwHit = wordRegexes.find((r) => r.test(src));
    const wHit = writeTokens.find((t) => src.includes(t));
    const fHit = flagRegexes.find((r) => r.test(src));
    check(`no forbidden live/tts/audio/write pattern in ${label}`, !rHit && !rwHit && !wHit && !fHit,
      rHit ? `render=${rHit}` : rwHit ? `word=${String(rwHit)}` : wHit ? `write=${wHit}` : fHit ? `regex=${String(fHit)}` : "");
  };
  scan("tts/audio/audit contract fixture", contractF.raw);
  scan("sample plan fixture", planF.raw);
  scan("standard harness source", harnessSrc);
  scan("guard script (self)", readFileSync(SELF, "utf8"));

  // harness 전용: dynamic import / subprocess / network 표면 금지
  const liveSurfaceTokens = [
    J("connectOver", "CDP"),
    J("node:", "http"),
    J("Web", "Socket"),
    J("require", "("),
    J("import", "("),
  ];
  const liveHit = liveSurfaceTokens.find((t) => harnessSrc.includes(t));
  check("harness source has no subprocess/network/dynamic-import surface", !liveHit, `token=${liveHit}`);

  // import allowlist: node:fs / node:path / node:url 만
  const specifiers = [...harnessSrc.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  const badImports = specifiers.filter((s) => !allow.has(s));
  check("harness imports restricted to node:fs/node:path/node:url", specifiers.length > 0 && badImports.length === 0,
    `bad=${badImports.join(",")}`);
  console.log("NOTE  scanner holds forbidden tokens split-concatenated only (denylist exception per HANDOFF)");
}

// ── 5. harness 동작 검증 (import + in-memory, no-live) ───────────────────────
const harness = await import(pathToFileURL(HARNESS_PATH).href);
{
  const fns = ["evaluateScriptImpactGate", "evaluateAudioGate", "isAnchorEntryOk", "evaluateMediaGate",
    "detectForbiddenMuxRoutes", "detectForbiddenTtsRoutes", "evaluateArtifactAudit",
    "validateContract", "validatePlanAgainstContract", "runDryRunValidation", "defaultIo"];
  check("harness exports all reusable gate logic surfaces", fns.every((f) => typeof harness[f] === "function"),
    `missing=${fns.filter((f) => typeof harness[f] !== "function").join(",")}`);
  check("harness refuses live/tts/mux/audio-mode flags (fail-closed list)",
    Array.isArray(harness.REFUSED_LIVE_FLAGS) &&
    ["--live-tts", "--tts", "--mux", "--audio", "--probe"].every((f) => harness.REFUSED_LIVE_FLAGS.includes(f)));
  check("harness default fixture paths point at standard contract/plan",
    String(harness.DEFAULT_CONTRACT_PATH).endsWith(path.basename(CONTRACT_PATH)) &&
    String(harness.DEFAULT_PLAN_PATH).endsWith(path.basename(DEFAULT_PLAN_PATH)));

  const dry = harness.runDryRunValidation({ contractPath: CONTRACT_PATH, planPath: PLAN_PATH });
  check("harness dry-run validation PASS on contract + sample plan (0 issues)",
    dry.ok === true && dry.issues.length === 0, dry.issues.slice(0, 3).join(" | "));
  check("harness dry-run summary: gates PASS + Owner QA pending",
    dry.summary && dry.summary.scriptImpactGate === "PASS" && dry.summary.audioGate === "PASS" &&
    dry.summary.artifactAudit === "PASS_CANDIDATE_PENDING_VISION_QA" && dry.summary.ownerQaPending.includes("PENDING"));

  // ── Script Impact Gate 직접 검증 (pure) ──
  const req = { hook_self_relevance_score: 90, story_causality_score: 90, problem_solution_bridge_score: 90, solution_specificity_score: 90, save_worthiness_score: 88, spoken_naturalness_score: 88 };
  const goodScores = { hook_self_relevance_score: 91, story_causality_score: 92, problem_solution_bridge_score: 91, solution_specificity_score: 92, save_worthiness_score: 89, spoken_naturalness_score: 90 };
  const noHardFail = { generic_hook: false, explains_but_does_not_sting: false, weak_problem_solution_bridge: false, abstract_solution_ending: false, three_things_unnamed: false, invented_stats_or_facts: false, topic_changed_from_accepted_visual: false };
  check("Script Impact Gate: all scores >= required + hardFail 0 → PASS",
    harness.evaluateScriptImpactGate(goodScores, req, noHardFail).pass === true);
  const lowScore = { ...goodScores, save_worthiness_score: 87 };
  check("Script Impact Gate: save_worthiness 87 < 88 → FAIL (fail-closed)",
    harness.evaluateScriptImpactGate(lowScore, req, noHardFail).pass === false);
  const oneHardFail = { ...noHardFail, generic_hook: true };
  check("Script Impact Gate: generic_hook true → FAIL (hardFail)",
    harness.evaluateScriptImpactGate(goodScores, req, oneHardFail).pass === false);
  const missingHardFail = { ...noHardFail }; delete missingHardFail.invented_stats_or_facts;
  check("Script Impact Gate: hardFail key 누락 → FAIL (fail-closed, 침묵 skip 아님)",
    harness.evaluateScriptImpactGate(goodScores, req, missingHardFail).pass === false);

  // ── audio gate 직접 검증 (pure) ──
  const th = { beginningSilenceMaxSec: 0.6, first5sSilenceMaxSec: 0.8, totalSilenceRatioMax: 0.18, speechActiveRatioMin: 0.72, tailHoldSecRange: [0.3, 0.8] };
  const goodAudio = { beginningSilenceSec: 0, first5sSilenceSec: 0.35, totalSilenceRatio: 0.0682, speechActiveRatio: 0.932, clippedTail: false, tailHoldSec: 0.61 };
  check("audio gate: v3.2 실측값 → PASS (6/6 서브체크)",
    harness.evaluateAudioGate(goodAudio, th).pass === true);
  const highRatio = { ...goodAudio, totalSilenceRatio: 0.2667 };
  check("audio gate: ratio 0.2667 > 0.18 (v3.1 attempt1 선례) → FAIL",
    harness.evaluateAudioGate(highRatio, th).pass === false && harness.evaluateAudioGate(highRatio, th).sub.ratioPass === false);
  const clipped = { ...goodAudio, clippedTail: true };
  check("audio gate: clippedTail true → FAIL", harness.evaluateAudioGate(clipped, th).pass === false);
  const badTail = { ...goodAudio, tailHoldSec: 1.2 };
  check("audio gate: tailHold 1.2 > 0.8 → FAIL", harness.evaluateAudioGate(badTail, th).pass === false);
  const missingAudio = { ...goodAudio }; delete missingAudio.speechActiveRatio;
  check("audio gate: speechActiveRatio 누락 → FAIL (fail-closed)",
    harness.evaluateAudioGate(missingAudio, th).pass === false);

  // ── re-anchor entry 판정 ──
  check("anchor entry: delta 50 <= tolerance 120 → OK",
    harness.isAnchorEntryOk(50, 120) === true);
  check("anchor entry: delta -200 (early) → OK (일찍 뜨는 건 허용)",
    harness.isAnchorEntryOk(-200, 120) === true);
  check("anchor entry: delta 200 > tolerance 120 (늦게) → FAIL",
    harness.isAnchorEntryOk(200, 120) === false);
  check("anchor entry: delta 누락 → FAIL (fail-closed)",
    harness.isAnchorEntryOk(undefined, 120) === false);

  // ── media gate 판정 ──
  const goodFp = { width: 1080, height: 1920, videoCodec: "h264", rFrameRate: "30/1", audioCodec: "aac", audioStreamCount: 1, videoDurationSec: 53.966667 };
  check("media gate: v3.2 probe values → PASS", harness.evaluateMediaGate(goodFp, 53.97).pass === true);
  check("media gate: 720x1280 → FAIL", harness.evaluateMediaGate({ ...goodFp, width: 720, height: 1280 }, 53.97).pass === false);
  check("media gate: duration gap 1s > 0.25 → FAIL", harness.evaluateMediaGate(goodFp, 55.0).pass === false);
  check("media gate: audioStreamCount 2 → FAIL", harness.evaluateMediaGate({ ...goodFp, audioStreamCount: 2 }, 53.97).pass === false);

  // ── mux/tts forbidden route ──
  check("detectForbiddenMuxRoutes: paddingUsed true → issue",
    harness.detectForbiddenMuxRoutes({ paddingUsed: true, atempoUsed: false, hardTrimUsed: false }).some((i) => i.includes("padding")));
  check("detectForbiddenTtsRoutes: sceneBySceneTts true → issue",
    harness.detectForbiddenTtsRoutes({ strategy: "full_narration_one_shot", sceneBySceneTts: true, requireLiveTtsGuard: true }).some((i) => i.includes("sceneByScene")));
  check("detectForbiddenTtsRoutes: apiCallBudgetMax 3 > 2 → issue",
    harness.detectForbiddenTtsRoutes({ strategy: "full_narration_one_shot", sceneBySceneTts: false, requireLiveTtsGuard: true, apiCallBudgetMax: 3 }).some((i) => i.includes("apiCallBudgetMax")));
  check("detectForbiddenTtsRoutes: liveTtsCalls 3 > budget 2 → issue",
    harness.detectForbiddenTtsRoutes({ strategy: "full_narration_one_shot", sceneBySceneTts: false, requireLiveTtsGuard: true, apiCallBudgetMax: 2, liveTtsCalls: 3 }).some((i) => i.includes("liveTtsCalls")));

  // ── artifact audit 판정 ──
  check("artifact audit: 4-gate all true → PASS_CANDIDATE_PENDING_VISION_QA",
    harness.evaluateArtifactAudit({ media: true, audio: true, captionCard: true, story: true }).verdict === "PASS_CANDIDATE_PENDING_VISION_QA");
  check("artifact audit: audio gate false → FAIL",
    harness.evaluateArtifactAudit({ media: true, audio: false, captionCard: true, story: true }).verdict === "FAIL");

  // ── fail-closed plan mutants (in-memory only) ──
  const io = harness.defaultIo();
  const mutate = (fn) => { const m = clone(plan); fn(m); return harness.validatePlanAgainstContract(m, contract, io); };
  const m1 = mutate((m) => { delete m.manifestRefs.acceptanceLock; });
  check("mutant: acceptance-lock 참조 제거 → plan fail (integration.failIfMissing)",
    m1.some((i) => i.includes("acceptance") || i.includes("manifestRefs")));
  const m2 = mutate((m) => { m.scriptImpactGate.scores.save_worthiness_score = 80; });
  check("mutant: save_worthiness 80 < 88 → Script Impact Gate fail",
    m2.some((i) => i.includes("scriptImpactGate") || i.includes("save_worthiness")));
  const m3 = mutate((m) => { m.scriptImpactGate.hardFailChecks.generic_hook = true; });
  check("mutant: hardFail generic_hook true → fail", m3.some((i) => i.includes("scriptImpactGate") || i.includes("generic_hook")));
  const m4 = mutate((m) => { m.tts.sceneBySceneTts = true; });
  check("mutant: sceneBySceneTts true → fail", m4.some((i) => i.includes("sceneByScene")));
  const m5 = mutate((m) => { m.tts.liveTtsCalls = 3; });
  check("mutant: liveTtsCalls 3 > budget 2 → fail", m5.some((i) => i.includes("liveTtsCalls")));
  const m6 = mutate((m) => { m.audioQualityGate.totalSilenceRatio = 0.25; m.audioQualityGate.subChecksPass.ratioPass = false; });
  check("mutant: totalSilenceRatio 0.25 > 0.18 → audio gate fail", m6.some((i) => i.includes("audioQualityGate")));
  const m7 = mutate((m) => { m.muxPolicy.paddingUsed = true; });
  check("mutant: mux paddingUsed true → fail", m7.some((i) => i.includes("padding")));
  const m8 = mutate((m) => { m.muxPolicy.probeExpected.width = 720; });
  check("mutant: mux probe width 720 → media gate fail", m8.some((i) => i.includes("media gate")));
  const m9 = mutate((m) => { m.artifactAudit.gates.audio = false; });
  check("mutant: artifact audit audio gate false → fail", m9.some((i) => i.includes("artifactAudit")));
  // uploadReady 값을 계산된 true로 설정 — self-scan denylist 정규식과 겹치는 literal 회피
  const truthyVal = 1 === 1;
  const m10 = mutate((m) => { m.qaReadiness.uploadReady = truthyVal; });
  check("mutant: qaReadiness uploadReady true → fail", m10.some((i) => i.includes("uploadReady")));
  const m11 = mutate((m) => { m.executionMode.liveTtsApprovedNow = true; });
  check("mutant: liveTtsApprovedNow true → fail", m11.some((i) => i.includes("liveTtsApprovedNow")));
  const m12 = mutate((m) => { m.wordPhraseReAnchor.measuredMaxDeltaMs = 200; });
  check("mutant: re-anchor measuredMaxDeltaMs 200 > tolerance 120 → fail", m12.some((i) => i.includes("measuredMaxDeltaMs")));

  // Codex review-fix regression: Owner viewing/listening QA는 automated pass로 대체 불가
  const m13 = mutate((m) => { m.qaReadiness.ownerViewingListeningPass = "PASS - automated"; });
  check("mutant(review-fix): ownerViewingListeningPass 'PASS - automated' → fail (Owner QA 자동 대체 금지)",
    m13.some((i) => i.includes("ownerViewingListeningPass")));
  // Codex review-fix regression: naturalDurationSec 누락은 침묵 skip이 아니라 fail
  const m14 = mutate((m) => { delete m.muxPolicy.naturalDurationSec; });
  check("mutant(review-fix): muxPolicy.naturalDurationSec 삭제 → fail (누락도 fail-closed)",
    m14.some((i) => i.includes("naturalDurationSec")));
  // Codex review-fix regression: fixedTargetUsed 누락은 침묵 skip이 아니라 fail
  const m15 = mutate((m) => { delete m.muxPolicy.fixedTargetUsed; });
  check("mutant(review-fix): muxPolicy.fixedTargetUsed 삭제 → fail (누락도 fail-closed)",
    m15.some((i) => i.includes("fixedTargetUsed")));

  // contract mutants
  const cMut1 = clone(contract); cMut1.audioQualityGateStandard.totalSilenceRatioMax = 0.3;
  check("mutant: contract totalSilenceRatioMax 0.3 (standard 불일치) → contract fail",
    harness.validateContract(cMut1).some((i) => i.includes("totalSilenceRatioMax")));
  const cMut2 = clone(contract); cMut2.ttsStandard.apiCallBudgetMax = 5;
  check("mutant: contract apiCallBudgetMax 5 → fail",
    harness.validateContract(cMut2).some((i) => i.includes("apiCallBudgetMax")));
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks) — plan=${PLAN_PATH}`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — plan=${PLAN_PATH}`);
process.exit(failures === 0 ? 0 : 1);
