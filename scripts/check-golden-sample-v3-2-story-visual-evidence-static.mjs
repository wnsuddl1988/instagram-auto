#!/usr/bin/env node
/**
 * check-golden-sample-v3-2-story-visual-evidence-static.mjs
 *
 * Golden Sample v3.2 Slice 1 — Story-Causality First + Visual Evidence Second
 * 계약/샘플 정적 가드.
 *
 * - no-live / no-network / no-env / no-secret / no-write: 레포 내 fixture JSON을
 *   읽어 검증만 한다. 외부 API·이미지 생성·TTS·render·upload 호출 없음.
 * - 검증 대상: 계약 fixture + 샘플 fixture + production standard JSON
 *   + accepted v3.2 blueprint/manifest (정규화 fidelity 교차 검증).
 * - 전부 통과 시 exit 0 + PASS 카운트 출력, 위반 시 exit 1.
 * - 음성 테스트(fail-closed 증명)용: --sample <path> 로 샘플 경로 대체 가능.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");

const CONTRACT_PATH = path.join(ROOT, "scripts", "fixtures", "golden_sample_v3_2_story_visual_evidence_contract.v1.json");
const DEFAULT_SAMPLE_PATH = path.join(ROOT, "scripts", "fixtures", "golden_sample_v3_2_story_visual_evidence_sample.t1_lifestyle_inflation.v1.json");
const STANDARD_PATH = path.join(ROOT, "scripts", "fixtures", "golden_sample_v3_2_production_standard.v1.json");
const BLUEPRINT_PATH = path.join(ROOT, "scripts", "fixtures", "golden_sample_t1_lifestyle_inflation_story_blueprint.v3_1_banknote_patch.json");
const TTS_MANIFEST_PATH = path.join(ROOT, "scripts", "fixtures", "golden_sample_t1_lifestyle_inflation_visual_render_manifest.v3_2_tts_anchored.json");

const argv = process.argv.slice(2);
const sampleArgIdx = argv.indexOf("--sample");
if (sampleArgIdx !== -1 && (!argv[sampleArgIdx + 1] || argv[sampleArgIdx + 1].startsWith("--"))) {
  // 값 없는 --sample이 기본 fixture로 조용히 fallback하면 mutant 테스트가 위양성 ALL PASS를 낼 수 있다
  console.error("ERROR  --sample requires a path argument (silent fallback to default sample is forbidden)");
  process.exit(2);
}
const SAMPLE_PATH = sampleArgIdx !== -1 ? path.resolve(argv[sampleArgIdx + 1]) : DEFAULT_SAMPLE_PATH;

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

// zero-width/필러 등 보이지 않는 코드포인트로 non-empty를 위장하는 것 차단 + 실문자(글자/숫자) 1개 이상 요구
const INVISIBLES = /[​‌‍⁠﻿ㅤ⠀]/g;
const isStr = (v) => typeof v === "string" && v.replace(INVISIBLES, "").trim().length > 0 && /[\p{L}\p{N}]/u.test(v);
const isStrArr = (v) => Array.isArray(v) && v.length > 0 && v.every(isStr);
const setEq = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");
const includesAll = (arr, req) => Array.isArray(arr) && req.every((c) => arr.includes(c));

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

const contractF = loadJson("contract fixture", CONTRACT_PATH);
const sampleF = loadJson(`sample fixture (${path.basename(SAMPLE_PATH)})`, SAMPLE_PATH);
const standardF = loadJson("production standard v1 fixture", STANDARD_PATH);
const blueprintF = loadJson("v3.1 banknote-patch blueprint fixture", BLUEPRINT_PATH);
const manifestF = loadJson("v3.2 tts-anchored render manifest fixture", TTS_MANIFEST_PATH);

if (!contractF.parsed || !sampleF.parsed || !standardF.parsed || !blueprintF.parsed || !manifestF.parsed) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core fixture unreadable, aborting`);
  process.exit(1);
}

const contract = contractF.parsed;
const sample = sampleF.parsed;
const standard = standardF.parsed;
const blueprint = blueprintF.parsed;
const manifest = manifestF.parsed;

const SIX_FIELDS = ["claim", "must_show", "must_not_show", "no_card_understanding", "card_caption_role", "reject_reasons"];
const PLACEHOLDERS = (contract.storyCausalityChain?.placeholderPatterns ?? []).map((p) => p.toUpperCase());
// placeholder 금지 + 최소 길이 — provenance/승인 텍스트가 'TBD'/'-' 같은 무의미 값으로 채워지는 것 차단
const cleanText = (t, minLen = 1) =>
  isStr(t) && String(t).trim().length >= minLen && !PLACEHOLDERS.some((p) => String(t).toUpperCase().includes(p));

// ── 1. 계약 ↔ production standard 일치 (임계값 이중 관리 드리프트 방지) ──
{
  const cs = contract.storyGate?.requiredScores ?? {};
  const ss = standard.storyGate?.requiredScores ?? {};
  const keysOk = setEq(Object.keys(cs), Object.keys(ss));
  const valsOk = keysOk && Object.keys(ss).every((k) => cs[k] === ss[k]);
  check("contract storyGate thresholds exactly match production standard", keysOk && valsOk,
    `contract=${JSON.stringify(cs)} standard=${JSON.stringify(ss)}`);

  check("contract hardFailCodes set-match standard storyGate.hardFails",
    setEq(contract.storyGate?.hardFailCodes, standard.storyGate?.hardFails));

  check("contract koreanMoneyHardFailCodes set-match standard koreanMoneyVisualStandard.hardFails",
    setEq(contract.visualEvidence?.koreanMoneyHardFailCodes, standard.koreanMoneyVisualStandard?.hardFails));

  const sf = contract.safeFrame ?? {};
  const stdSf = standard.typographyCaptionStandard?.safeFrame ?? {};
  check("contract safeFrame textMaxY/graphicMaxY match standard (1580/1632)",
    sf.textMaxY === stdSf.textMaxY && sf.textMaxY === 1580 && sf.graphicMaxY === stdSf.graphicMaxY && sf.graphicMaxY === 1632,
    `contract=${sf.textMaxY}/${sf.graphicMaxY} standard=${stdSf.textMaxY}/${stdSf.graphicMaxY}`);
  check("contract forbids bottom-fixed subtitle bar and karaoke lower line (matches standard)",
    sf.bottomFixedSubtitleBar === false && sf.karaokeFixedLowerLine === false &&
    standard.typographyCaptionStandard?.bottomFixedSubtitleBar === false &&
    standard.typographyCaptionStandard?.karaokeFixedLowerLine === false);
  check("contract safeFrame documents geometry limitation + TODO (no silent skip)",
    isStr(sf.geometryCheckLimitation) && isStr(sf.todo));

  check("contract visualEvidence.requiredFields are exactly the six stable names",
    contract.visualEvidence?.exactlySixFields === true && setEq(contract.visualEvidence?.requiredFields, SIX_FIELDS));

  check("contract scoreProvenance required with scorer/source/date/method/notes",
    contract.storyGate?.scoreProvenance?.required === true &&
    setEq(contract.storyGate?.scoreProvenance?.requiredFields, ["scorer", "source", "date", "method", "notes"]));

  // 계약 리스트가 삭제/축소되면 하위 검사가 공허하게 통과(?? [] fallback)하는 것 차단 — literal 기대값으로 고정
  check("contract chain lists pinned (canonicalPhaseOrder 7 / requiredPhases 6 / placeholderPatterns)",
    setEq(contract.storyCausalityChain?.canonicalPhaseOrder, ["hook", "problem", "cause", "illusion", "reframe", "action", "result"]) &&
    setEq(contract.storyCausalityChain?.requiredPhases, ["problem", "cause", "illusion", "reframe", "action", "result"]) &&
    // 패턴은 "???" 같은 순수 문장부호일 수 있으므로 isStr(실문자 요구) 대신 raw non-empty 문자열 조건으로 검증
    Array.isArray(contract.storyCausalityChain?.placeholderPatterns) &&
    contract.storyCausalityChain.placeholderPatterns.length > 0 &&
    contract.storyCausalityChain.placeholderPatterns.every((p) => typeof p === "string" && p.length > 0) &&
    includesAll(contract.storyCausalityChain?.placeholderPatterns, ["TBD", "TODO", "PLACEHOLDER"]));
  check("contract reject code lists pinned (baseRejectCodes / moneyDominantExtraRejectCodes)",
    setEq(contract.visualEvidence?.baseRejectCodes, ["visual_evidence_mismatch", "korean_context_break"]) &&
    setEq(contract.visualEvidence?.moneyDominantExtraRejectCodes, ["money_clarity_fail"]));

  const fl = contract.flags ?? {};
  check("contract flags: uploadReady=false, automationExpansionReady=false, implementationApproved=false",
    fl.uploadReady === false && fl.automationExpansionReady === false && fl.implementationApproved === false);
}

// ── 2. 샘플 기본/flags ──
{
  check("sample references the contract fixture",
    isStr(sample.contractRef) && sample.contractRef.endsWith("golden_sample_v3_2_story_visual_evidence_contract.v1.json"));
  const fl = sample.flags ?? {};
  check("sample flags: uploadReady=false, automationExpansionReady=false, implementationApproved=false",
    fl.uploadReady === false && fl.automationExpansionReady === false && fl.implementationApproved === false);
}

// ── 3. Owner topic confirmation (기계 판독) ──
{
  const otc = sample.owner_topic_confirmation;
  check("sample has owner_topic_confirmation block", Boolean(otc));
  const reqFields = contract.ownerTopicConfirmation?.requiredFields ?? [];
  check("owner_topic_confirmation has all contract-required fields",
    Boolean(otc) && reqFields.length === 6 && reqFields.every((f) => otc[f] !== undefined),
    Boolean(otc) ? `missing=${reqFields.filter((f) => otc[f] === undefined).join(",")}` : "block missing");
  check("owner_topic_confirmation.approved === true", otc?.approved === true);
  check("owner_topic_confirmation.permanentChannelWideTopicLock === false (영구 채널 lock 아님)",
    otc?.permanentChannelWideTopicLock === false);
  check("owner_topic_confirmation topicId/title/approvedScope/approvalSourceNote non-empty, placeholder-free (min 4자)",
    cleanText(otc?.topicId, 4) && cleanText(otc?.title, 4) && cleanText(otc?.approvedScope, 4) && cleanText(otc?.approvalSourceNote, 4));
  check("owner_topic_confirmation topicId/title match accepted blueprint",
    otc?.topicId === blueprint.topicId && otc?.title === blueprint.title,
    `sample=${otc?.topicId}/${otc?.title} blueprint=${blueprint.topicId}/${blueprint.title}`);
}

// ── 4. Story gate: 점수 + provenance + hard fail ──
{
  const gate = sample.storyGate ?? {};
  const thresholds = contract.storyGate?.requiredScores ?? {};
  const scores = gate.scores ?? {};
  check("sample storyGate score keys exactly match contract thresholds",
    setEq(Object.keys(scores), Object.keys(thresholds)));
  const failing = Object.keys(thresholds).filter((k) =>
    !(typeof scores[k] === "number" && Number.isFinite(scores[k]) && scores[k] >= thresholds[k] && scores[k] <= 100));
  check("all sample storyGate scores meet thresholds and are bounded (finite, <=100)",
    Object.keys(thresholds).length === 6 && failing.length === 0,
    `out-of-band=${failing.join(",")}`);

  const hasScores = Object.keys(scores).length > 0;
  const prov = gate.scoreProvenance;
  const provFields = contract.storyGate?.scoreProvenance?.requiredFields ?? [];
  check("scores are not anonymous: scoreProvenance present when scores exist",
    !hasScores || Boolean(prov), "scores exist without scoreProvenance");
  check("scoreProvenance scorer/source/date/method/notes non-empty, placeholder-free (min 4자 — 익명/무의미 점수 차단)",
    Boolean(prov) && provFields.every((f) => cleanText(prov[f], 4)),
    Boolean(prov) ? `bad=${provFields.filter((f) => !cleanText(prov?.[f], 4)).join(",")}` : "provenance missing");

  const hf = gate.hardFailChecks ?? {};
  check("sample hardFailChecks keys exactly match contract hardFailCodes",
    setEq(Object.keys(hf), contract.storyGate?.hardFailCodes ?? []));
  const trueFails = Object.keys(hf).filter((k) => hf[k] !== false);
  check("all sample hardFailChecks are false (no hard fail)", Object.keys(hf).length === 6 && trueFails.length === 0,
    `not-false=${trueFails.join(",")}`);
  check("sample storyGate verdict is PASS", gate.verdict === "PASS");
}

// ── 5. Story-Causality 체인: 정렬/순서/bridge/placeholder ──
const chain = Array.isArray(sample.chain) ? sample.chain : [];
{
  check("sample chain is a non-empty array", chain.length > 0);

  // beat = phrase = scene 1:1 — accepted 아티팩트와 개수 일치
  check("beat=phrase=scene counts match accepted artifacts (blueprint story_chain, manifest scenes, manifest narration)",
    chain.length === (blueprint.story_chain?.length ?? -1) &&
    chain.length === (manifest.scenes?.length ?? -1) &&
    chain.length === (manifest.narration?.length ?? -1),
    `chain=${chain.length} blueprint=${blueprint.story_chain?.length} scenes=${manifest.scenes?.length} narration=${manifest.narration?.length}`);

  const sceneIds = chain.map((c) => c.sceneId);
  const phraseIds = chain.map((c) => c.phraseId);
  const beats = chain.map((c) => c.beat);
  check("sceneId / phraseId / beat labels are unique (1:1:1, 중복 없음)",
    new Set(sceneIds).size === chain.length && new Set(phraseIds).size === chain.length && new Set(beats).size === chain.length);

  const beatPhaseMap = contract.storyCausalityChain?.beatPhaseMap ?? {};
  const unknownBeats = chain.filter((c) => !(c.beat in beatPhaseMap));
  check("every beat maps to a canonical phase via contract beatPhaseMap", unknownBeats.length === 0,
    `unknown=${unknownBeats.map((c) => c.beat).join(",")}`);
  const phaseMismatch = chain.filter((c) => c.phase !== beatPhaseMap[c.beat]);
  check("every entry.phase equals beatPhaseMap[beat]", phaseMismatch.length === 0,
    `mismatch=${phaseMismatch.map((c) => `${c.beat}:${c.phase}`).join(",")}`);

  const order = contract.storyCausalityChain?.canonicalPhaseOrder ?? [];
  const phaseIdx = chain.map((c) => order.indexOf(c.phase));
  const monotonic = phaseIdx.every((v, i) => v !== -1 && (i === 0 || v >= phaseIdx[i - 1]));
  check("phases progress in canonical order (비내림차순)", monotonic, `sequence=${chain.map((c) => c.phase).join("->")}`);

  const present = new Set(chain.map((c) => c.phase));
  const missingPhases = (contract.storyCausalityChain?.requiredPhases ?? []).filter((p) => !present.has(p));
  check("all required phases appear (problem/cause/illusion/reframe/action/result)", missingPhases.length === 0,
    `missing=${missingPhases.join(",")}`);
  check("hook phase leads the chain (hookRule)", chain[0]?.phase === "hook");

  const bridgeBad = chain.filter((c, i) => i < chain.length - 1 ? !isStr(c.bridge_to_next) : c.bridge_to_next !== null);
  check("every beat has non-empty bridge_to_next except final result (final is null)", bridgeBad.length === 0,
    `bad=${bridgeBad.map((c) => c.sceneId).join(",")}`);

  const emptyCore = chain.filter((c) => !isStr(c.message) || !isStr(c.narrationText));
  check("every entry has non-empty message and narrationText (presence는 fidelity 검사에 의존하지 않음)",
    emptyCore.length === 0, `scenes=${emptyCore.map((c) => c.sceneId).join(",")}`);

  const textOf = (c) => {
    const ve = c.image?.visual_evidence ?? {};
    // bridge null은 마지막 beat의 계약상 정상값 — placeholder 텍스트 검사 대상에서 제외 (null 검증은 bridgeRule 검사가 담당)
    return [c.message, c.narrationText, ...(c.bridge_to_next === null ? [] : [c.bridge_to_next]),
      ve.claim, ve.card_caption_role, ve.no_card_understanding?.reason,
      ...(ve.must_show ?? []), ...(ve.must_not_show ?? []), ...(ve.reject_reasons ?? [])];
  };
  const placeholderHits = chain.filter((c) =>
    textOf(c).some((t) => !isStr(t ?? "x") || PLACEHOLDERS.some((p) => String(t).toUpperCase().includes(p))));
  check("no placeholder beat/phrase/scene text (message/narration/bridge/evidence)", placeholderHits.length === 0,
    `scenes=${placeholderHits.map((c) => c.sceneId).join(",")}`);
}

// ── 6. 정규화 fidelity: accepted blueprint와 교차 검증 ──
{
  const bp = blueprint.story_chain ?? [];
  const md5ByImage = Object.fromEntries((blueprint.selected_image_set ?? []).map((e) => [e.imageId, e.md5]));
  const mismatches = [];
  chain.forEach((c, i) => {
    const b = bp[i] ?? {};
    if (c.beat !== b.beat) mismatches.push(`${i}:beat`);
    if (c.sceneId !== b.sceneId) mismatches.push(`${i}:sceneId`);
    if (c.message !== b.message) mismatches.push(`${i}:message`);
    if ((c.bridge_to_next ?? null) !== (b.bridge_to_next ?? null)) mismatches.push(`${i}:bridge`);
    if (c.image?.imageId !== b.image) mismatches.push(`${i}:imageId`);
    if (c.image?.md5 !== md5ByImage[c.image?.imageId]) mismatches.push(`${i}:md5`);
  });
  check("chain verbatim-matches accepted blueprint (beat/sceneId/message/bridge/imageId/md5)", mismatches.length === 0,
    mismatches.join(","));
}

// ── 7. 정규화 fidelity: accepted v3.2 tts-anchored manifest와 교차 검증 ──
{
  const mismatches = [];
  chain.forEach((c, i) => {
    const sc = manifest.scenes?.[i] ?? {};
    const na = manifest.narration?.[i] ?? {};
    if (sc.id !== c.sceneId || sc.beat !== c.beat || sc.phraseId !== c.phraseId) mismatches.push(`${i}:scene-map`);
    if (na.phraseId !== c.phraseId || na.beat !== c.beat) mismatches.push(`${i}:narration-map`);
    if (na.text !== c.narrationText) mismatches.push(`${i}:narration-text`);
    const t = c.timing ?? {};
    if (t.sceneStartSec !== sc.startSec || t.sceneEndSec !== sc.endSec) mismatches.push(`${i}:scene-timing`);
    if (t.audioStartSec !== na.audioStartSec || t.audioEndSec !== na.audioEndSec) mismatches.push(`${i}:audio-timing`);
  });
  check("chain verbatim-matches accepted v3.2 manifest (scene/phrase mapping, narration text, timing)", mismatches.length === 0,
    mismatches.join(","));
}

// ── 8. Visual Evidence 6필드 (per-scene) ──
{
  const bad = (label, pred) => {
    const hits = chain.filter((c) => !pred(c.image?.visual_evidence ?? {}, c));
    check(label, hits.length === 0, `scenes=${hits.map((c) => c.sceneId).join(",")}`);
  };

  bad("every scene: visual_evidence has exactly the six stable fields",
    (ve) => setEq(Object.keys(ve), SIX_FIELDS));
  bad("every scene: claim is non-empty string", (ve) => isStr(ve.claim));
  bad("every scene: must_show is non-empty string array", (ve) => isStrArr(ve.must_show));
  bad("every scene: must_not_show is non-empty string array", (ve) => isStrArr(ve.must_not_show));
  bad("every scene: card_caption_role is non-empty string", (ve) => isStr(ve.card_caption_role));
  bad("every scene: reject_reasons is non-empty string array", (ve) => isStrArr(ve.reject_reasons));
  bad("every scene: understandable without card (no_card_understanding.understandable_without_card===true + reason)",
    (ve) => ve.no_card_understanding?.understandable_without_card === true && isStr(ve.no_card_understanding?.reason));
  bad("every scene: image has money_dominant boolean", (_ve, c) => typeof c.image?.money_dominant === "boolean");

  const baseCodes = contract.visualEvidence?.baseRejectCodes ?? [];
  bad("every scene: reject_reasons include base codes (visual_evidence_mismatch, korean_context_break)",
    (ve) => includesAll(ve.reject_reasons, baseCodes));

  const moneyCodes = [
    ...(contract.visualEvidence?.koreanMoneyHardFailCodes ?? []),
    ...(contract.visualEvidence?.moneyDominantExtraRejectCodes ?? []),
  ];
  const moneyScenes = chain.filter((c) => c.image?.money_dominant === true);
  check("sample has at least one money_dominant scene (Korean money standard applies)", moneyScenes.length > 0);
  const moneyBad = moneyScenes.filter((c) => !includesAll(c.image?.visual_evidence?.reject_reasons, moneyCodes));
  check("every money_dominant scene: reject_reasons include all 7 Korean money hard-fail codes + money_clarity_fail",
    moneyBad.length === 0, `scenes=${moneyBad.map((c) => c.sceneId).join(",")}`);

  bad("every scene: reject_reasons has no duplicate codes",
    (ve) => Array.isArray(ve.reject_reasons) && new Set(ve.reject_reasons).size === ve.reject_reasons.length);

  // money_dominant는 자기 신고 값이 아니다 — blueprint patch_summary(patched=_krw 돈 주연 / retained=비주연)가 ground truth.
  // 이 교차 검증이 없으면 돈 주연 scene을 false로 위장해 화폐 hard-fail 7코드를 회피할 수 있다.
  const patchedNew = new Set((blueprint.patch_summary?.patched ?? []).map((p) => p.new));
  const retainedIds = new Set((blueprint.patch_summary?.retained ?? []).map((p) => p.imageId));
  check("blueprint patch_summary provides money-lead ground truth (patched/retained 모두 비어있지 않음)",
    patchedNew.size > 0 && retainedIds.size > 0);
  const mdMismatch = chain.filter((c) => {
    const id = c.image?.imageId;
    if (patchedNew.has(id)) return c.image?.money_dominant !== true;
    if (retainedIds.has(id)) return c.image?.money_dominant !== false;
    return true; // patched/retained 어느 쪽에도 없는 imageId는 출처 불명 — fail-closed
  });
  check("money_dominant matches blueprint patch_summary ground truth (patched → true, retained → false, 미기재 → fail)",
    mdMismatch.length === 0, `scenes=${mdMismatch.map((c) => c.sceneId).join(",")}`);
}

// ── 9. mediaFacts / safe frame — accepted manifest·standard와 일치 ──
{
  const mf = sample.mediaFacts ?? {};
  check("mediaFacts duration/speechEnd/tailHold match accepted v3.2 manifest",
    mf.fullDurationSec === manifest.fullDurationSec &&
    mf.speechEndSec === manifest.ttsEvidence?.speechEndSec &&
    mf.tailHoldSec === manifest.ttsEvidence?.tailHoldSec,
    `sample=${mf.fullDurationSec}/${mf.speechEndSec}/${mf.tailHoldSec} manifest=${manifest.fullDurationSec}/${manifest.ttsEvidence?.speechEndSec}/${manifest.ttsEvidence?.tailHoldSec}`);

  const range = standard.ttsFirstStandard?.audioQualityGates?.tailHoldSecRange ?? [];
  check("tailHoldSec within standard range [0.3, 0.8]",
    range.length === 2 && mf.tailHoldSec >= range[0] && mf.tailHoldSec <= range[1]);

  check("no padding / no atempo / no hard trim (sample과 manifest boundary 모두 false)",
    mf.paddingUsed === false && mf.atempoUsed === false && mf.hardTrimUsed === false &&
    manifest.boundary?.paddingUsed === false && manifest.boundary?.atempoUsed === false && manifest.boundary?.hardTrimUsed === false);

  check("one-shot narration (sceneTtsUsed=false, oneShotNarration=true)",
    mf.sceneTtsUsed === false && mf.oneShotNarration === true);

  check("no bottom-fixed subtitle (sample mediaFacts + manifest typography 모두 false)",
    mf.bottomFixedSubtitle === false && manifest.typography?.bottomFixedSubtitle === false);

  const sf = sample.safeFrame ?? {};
  check("sample safeFrame matches contract (1580/1632, no bottom bar, no karaoke line)",
    sf.textMaxY === contract.safeFrame?.textMaxY && sf.graphicMaxY === contract.safeFrame?.graphicMaxY &&
    sf.bottomFixedSubtitleBar === false && sf.karaokeFixedLowerLine === false);
  check("sample safeFrame documents geometry evidence limitation (no silent skip)",
    isStr(sf.geometryEvidenceNote));
}

// ── 10. 금지 패턴 스캔 (신규 3파일: 계약/샘플/이 스크립트) ──
// NOTE(HANDOFF 예외 보고): 이 스캐너는 금지 토큰을 분할-연결(split-concatenated) 형태로만
// 보유하므로 스캐너 소스 자체에는 금지 문자열이 literal로 존재하지 않는다.
{
  const J = (a, b) => a + b;
  const literalTokens = [
    J("fetch", "("),
    J("ALLOW", "_"),
    J("process", ".env"),
    J("OPENAI", "_API_KEY"),
    J("BFL", "_API_KEY"),
    J("ELEVENLABS", "_API_KEY"),
  ];
  const flagTrue = (name) => new RegExp(J(name, "[\"']?\\s*[:=]\\s*true"), "i");
  const regexTokens = [flagTrue("uploadReady"), flagTrue("automationExpansionReady"), flagTrue("implementationApproved")];

  const targets = [
    ["contract fixture", contractF.raw],
    ["sample fixture", sampleF.raw],
    ["guard script (self)", readFileSync(SELF, "utf8")],
  ];
  for (const [label, src] of targets) {
    const litHit = literalTokens.find((t) => src.includes(t));
    const reHit = regexTokens.find((r) => r.test(src));
    check(`no forbidden pattern in ${label}`, !litHit && !reHit,
      litHit ? `literal=${litHit}` : reHit ? `regex=${String(reHit)}` : "");
  }
  console.log("NOTE  scanner holds forbidden tokens split-concatenated only (denylist exception per HANDOFF)");
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks) — sample=${SAMPLE_PATH}`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — sample=${SAMPLE_PATH}`);
process.exit(failures === 0 ? 0 : 1);
