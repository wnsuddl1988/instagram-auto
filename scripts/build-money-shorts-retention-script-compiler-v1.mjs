#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// build-money-shorts-retention-script-compiler-v1.mjs
//
// MONEY SHORTS OS — RETENTION SCRIPT COMPILER v1 (rule-based, no-LLM, no-live)
//
// Creative Automation Layer Phase 2. Creative Quality Contract v1을 source of truth로
// 소비해, sample input topic list로부터 rule-based script package를 컴파일한다.
//
// 절대 하지 않는 것:
//   - LLM/OpenAI/ChatGPT/Playwright 호출
//   - 외부 API / network / env / secret 접근
//   - render / TTS / image generation / upload / deploy
//
// 향후 LLMHookGenerator / LLMScriptCompiler로 교체 가능한 슬롯 구조를 둔다(아래 클래스).
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTRACT_PATH = join(__dirname, "fixtures", "money-shorts-creative-quality-contract.v1.json");
const INPUT_PATH = join(__dirname, "fixtures", "money-shorts-retention-script-compiler.sample-input.v1.json");
const OUTPUT_PATH = join(__dirname, "fixtures", "money-shorts-retention-script-compiler.output.v1.json");

// ── contract + input load (read-only) ────────────────────────────────────────
const contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));
const input = JSON.parse(readFileSync(INPUT_PATH, "utf8"));

// contract-derived config (source of truth) ───────────────────────────────────
const HOOK_TYPES = contract.hookContract.hookTypes;
const HOOK_MIN_SCORE = contract.hookContract.selectedHookMinScore;
const HOOK_CANDIDATES_PER_TOPIC = contract.hookContract.candidatesPerTopic;
const MAX_CANDIDATES = contract.candidateSelectionPolicy.maxCandidatesPerTopic;
const PILLARS = contract.contentPillars;
const SOURCE_REQUIRED_PILLARS = contract.sourceGate.sourceRequiredPillars;
const REQUIRED_SOURCE_FIELDS = contract.sourceGate.requiredSourceMetadataFields;
const FORBIDDEN_DIRECTIONS = contract.forbiddenLanguagePolicy.forbiddenDirections;
const DG = contract.retentionScriptContract.durationGuard;
const CAPTION_SAFE_REF = contract.captionContract.captionSafeReference;
const CHANNEL_CONNECT = contract.channelPosition.everyVideoMustConnectToOneOf;

// ── duration estimation (Korean narration, deterministic heuristic) ──────────
// 한글 낭독 속도 근사: 공백 제외 글자 수 / 6.0 자/초. Math.random 미사용(결정론적).
function countKoreanChars(text) {
  return (text || "").replace(/\s/g, "").length;
}
function estimateDurationSec(text) {
  const chars = countKoreanChars(text);
  // 6.0 chars/sec, 최소 0.4s 바닥. 소수 2자리 반올림.
  return Math.round((chars / 6.0 + 0.4) * 100) / 100;
}

// ── forbidden / risk scanning ────────────────────────────────────────────────
const EXAGGERATION_PATTERNS = [/무조건/, /100%/, /확정 수익/, /반드시 부자/, /대박/, /지금 사세요/, /지금 매수/, /떡상/];
const INVESTMENT_SOLICITATION_PATTERNS = [/매수하세요/, /매도하세요/, /지금 사세요/, /지금 매수/, /종목 추천/, /사야 합니다/];
function scanForbidden(text) {
  const flags = [];
  for (const p of FORBIDDEN_DIRECTIONS) {
    if ((text || "").includes(p)) flags.push({ kind: "forbidden_phrase", match: p });
  }
  for (const re of EXAGGERATION_PATTERNS) {
    if (re.test(text || "")) flags.push({ kind: "exaggeration_or_guaranteed_return", match: re.source });
  }
  for (const re of INVESTMENT_SOLICITATION_PATTERNS) {
    if (re.test(text || "")) flags.push({ kind: "investment_solicitation", match: re.source });
  }
  return flags;
}

// ══════════════════════════════════════════════════════════════════════════════
// RuleBasedTopicClassifier — topic을 content pillar로 분류/검증
// ══════════════════════════════════════════════════════════════════════════════
class RuleBasedTopicClassifier {
  constructor(pillars) {
    this.pillarIds = pillars.map((p) => p.id);
    this.pillarById = new Map(pillars.map((p) => [p.id, p]));
  }
  classify(topic) {
    const pillar = topic.contentPillar;
    const known = this.pillarIds.includes(pillar);
    const sourceRequired = this.pillarById.get(pillar)?.sourceRequired === true;
    return { contentPillar: pillar, known, sourceRequired };
  }
  // channel fit: 돈/기회/선택/행동 중 하나와 연결되는가
  channelFit(topic) {
    const blob = [topic.title, topic.angle, ...(topic.keyIdeas || [])].join(" ");
    const connected = CHANNEL_CONNECT.filter((w) => blob.includes(w));
    return { connected, isConnected: connected.length > 0 };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// SourceGate — source_required pillar는 metadata 9필드 없으면 hard fail
// ══════════════════════════════════════════════════════════════════════════════
function evaluateSourceGate(topic, sourceRequired) {
  if (!sourceRequired) {
    return { sourceRequired: false, ok: true, missingFields: [], hardFail: false };
  }
  const src = topic.sourceMetadata || {};
  const missing = REQUIRED_SOURCE_FIELDS.filter((f) => {
    const v = src[f];
    if (v == null) return true;
    if (typeof v === "string" && v.trim() === "") return true;
    if (Array.isArray(v) && v.length === 0) return true;
    return false;
  });
  const ok = missing.length === 0;
  return { sourceRequired: true, ok, missingFields: missing, hardFail: !ok };
}

// ══════════════════════════════════════════════════════════════════════════════
// RuleBasedHookGenerator — topic당 hook 10개. (교체 슬롯: LLMHookGenerator)
// ══════════════════════════════════════════════════════════════════════════════
class RuleBasedHookGenerator {
  generate(topic, variantSeed) {
    const t = topic;
    // hook type별 rule-based 템플릿. variantSeed로 후보 간 문구를 다르게.
    const base = t.hookSeeds || {};
    const specifics = t.keyIdeas && t.keyIdeas.length ? t.keyIdeas : ["이 정보"];
    const primary = specifics[variantSeed % specifics.length];
    const templates = [
      { type: "loss", text: base.loss || `${primary}, 모르면 그냥 손해입니다.`, score: 82 },
      { type: "gain", text: base.gain || `${primary} 하나로 지갑이 달라집니다.`, score: 80 },
      { type: "twist", text: base.twist || `사실 ${primary}는 반대로 작동합니다.`, score: 84 },
      { type: "question", text: base.question || `${primary}, 왜 지금 봐야 할까요?`, score: 78 },
      { type: "number", text: base.number || `${primary}, 딱 3가지만 기억하세요.`, score: 79 },
      { type: "risk", text: base.risk || `${primary}를 놓치면 위험합니다.`, score: 81 },
      { type: "wallet_impact", text: base.wallet_impact || `${primary}가 내 돈에 바로 영향을 줍니다.`, score: 83 },
      { type: "psychology", text: base.psychology || `${primary} 앞에서 사람들은 실행을 미룹니다.`, score: 80 },
      { type: "loss", text: `${primary}, 지금 안 챙기면 나만 놓칩니다.`, score: 77 },
      { type: "twist", text: `${primary}, 다들 아는데 아무도 안 합니다.`, score: 76 },
    ];
    // exactly HOOK_CANDIDATES_PER_TOPIC 개
    const hooks = templates.slice(0, HOOK_CANDIDATES_PER_TOPIC).map((h, i) => {
      const estDur = estimateDurationSec(h.text);
      // hook duration 1.5~2.5초 범위 밖이면 감점
      const inHookWindow = estDur >= DG.hookMinSec && estDur <= DG.hookMaxSec;
      const forbidden = scanForbidden(h.text);
      let score = h.score;
      if (!inHookWindow) score -= 4;
      if (forbidden.length) score -= 40;
      return {
        text: h.text,
        type: HOOK_TYPES.includes(h.type) ? h.type : "twist",
        score,
        reason: `type=${h.type}, estDur=${estDur}s, hookWindow=${inHookWindow}, forbidden=${forbidden.length}`,
        estimated_duration: estDur,
      };
    });
    return hooks;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// RuleBasedScriptCompiler — retention 5파트 구조로 script 컴파일.
// (교체 슬롯: LLMScriptCompiler)
// ══════════════════════════════════════════════════════════════════════════════
class RuleBasedScriptCompiler {
  compile(topic, selectedHook) {
    const t = topic;
    const ideas = t.keyIdeas && t.keyIdeas.length >= 3 ? t.keyIdeas : [t.title, t.title, t.title];
    const curiosity = t.curiosity || `왜 이게 지금 중요한지 30초 안에 정리했습니다.`;
    const points = [
      t.points?.[0] || `첫째, ${ideas[0]}를 먼저 확인하세요.`,
      t.points?.[1] || `둘째, ${ideas[1]}가 실제 흐름을 바꿉니다.`,
      t.points?.[2] || `셋째, ${ideas[2]}는 지금 챙겨야 합니다.`,
    ];
    const twist = t.twist || `대부분은 정보가 없어서가 아니라 실행을 미뤄서 놓칩니다.`;
    const action = t.action || `지금 저장해두고 오늘 하나만 실행해 보세요.`;

    const sentences = [selectedHook.text, curiosity, ...points, twist, action];
    const full_voiceover = sentences.join(" ");
    const estimated_voiceover_duration = sentences.reduce((s, x) => s + estimateDurationSec(x), 0);
    const rounded = Math.round(estimated_voiceover_duration * 100) / 100;
    const needs_compression = rounded > DG.fullVoiceoverMaxSec;

    // per-sentence timing metadata
    const sentenceTimings = sentences.map((s, i) => ({
      index: i,
      text: s,
      estimated_duration: estimateDurationSec(s),
      // within_preferred: contract의 엄격한 1.5~3.5초(hook은 1.5~2.5초) preferred window.
      within_preferred: (() => {
        const d = estimateDurationSec(s);
        if (i === 0) return d >= DG.hookMinSec && d <= DG.hookMaxSec;
        return d >= DG.sentencePreferredMinSec && d <= DG.sentencePreferredMaxSec;
      })(),
      // acceptable: 전체 27~30초에 7문장을 담으려면 일부 문장은 preferred 상한(3.5s)을 넘길
      // 수밖에 없다. acceptable은 "과도하게 길지 않음"(<=5.0s) 상한만 본다. clarity score는
      // 이 acceptable 기준으로 계산해, 30초 정합 후보가 부당하게 감점되지 않게 한다.
      acceptable: (() => {
        const d = estimateDurationSec(s);
        if (i === 0) return d >= DG.hookMinSec && d <= DG.hookMaxSec;
        return d >= DG.sentencePreferredMinSec && d <= 5.0;
      })(),
    }));

    const emphasis_words = (t.emphasisWords || []).slice(0, 6);
    const risk_flags = scanForbidden(full_voiceover).map((f) => f.kind);

    return {
      topic: t.title,
      content_pillar: t.contentPillar,
      angle: t.angle || "",
      hook: selectedHook.text,
      curiosity,
      points, // exactly 3
      twist_or_reframe: twist,
      action_or_save_reason: action,
      full_voiceover,
      caption_lines: sentences.map((s) => this._captionize(s)),
      emphasis_words,
      risk_flags,
      estimated_voiceover_duration: rounded,
      target_duration: 30,
      needs_compression,
      _sentenceTimings: sentenceTimings,
    };
  }
  _captionize(sentence) {
    // caption은 한 줄 기준. 너무 길면 앞부분을 우선 노출(압축 표시).
    const MAX = 22;
    const clean = sentence.trim();
    if (countKoreanChars(clean) <= MAX) return clean;
    return clean.slice(0, MAX) + "…";
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// RuleBasedCaptionPlanner — caption_plan.json artifact 생성.
// ══════════════════════════════════════════════════════════════════════════════
class RuleBasedCaptionPlanner {
  plan(script) {
    const lines = script.caption_lines.map((line, i) => ({
      index: i,
      script_part: ["hook", "curiosity", "point_1", "point_2", "point_3", "twist_reframe", "action_save_reason"][i] || `line_${i}`,
      caption: line,
      char_count: countKoreanChars(line),
      compressed: line.endsWith("…"),
    }));
    const maxLen = Math.max(...lines.map((l) => l.char_count));
    return {
      captionSafeReference: CAPTION_SAFE_REF,
      style: "single_line_bold_bottom_safe",
      lines,
      maxCaptionCharCount: maxLen,
      densityOk: maxLen <= 22,
    };
  }
}

// ── future LLM replacement slots (declared, NOT used in v1) ──────────────────
// These are intentional extension points. v1 never calls them; they exist so a
// later phase can swap the rule-based generators for LLM-backed ones without
// changing the pipeline shape. No network/LLM code lives here.
class LLMHookGenerator {
  generate() {
    throw new Error("LLMHookGenerator is a v-next slot and is not used in rule_based_v1.");
  }
}
class LLMScriptCompiler {
  compile() {
    throw new Error("LLMScriptCompiler is a v-next slot and is not used in rule_based_v1.");
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// pipeline
// ══════════════════════════════════════════════════════════════════════════════
const classifier = new RuleBasedTopicClassifier(PILLARS);
const hookGen = new RuleBasedHookGenerator();
const scriptCompiler = new RuleBasedScriptCompiler();
const captionPlanner = new RuleBasedCaptionPlanner();

function scoreScriptClarity(script) {
  // heuristic: acceptable-duration sentence 비율 기반 (전체 30초 정합과 양립).
  const timings = script._sentenceTimings;
  const ok = timings.filter((t) => t.acceptable).length;
  return Math.round((ok / timings.length) * 100);
}

function buildCandidate(topic, sourceGateResult, variantSeed) {
  const hooks = hookGen.generate(topic, variantSeed);
  const eligible = hooks.filter((h) => h.score >= HOOK_MIN_SCORE && scanForbidden(h.text).length === 0);
  const selectedHook = (eligible.length ? eligible : hooks).slice().sort((a, b) => b.score - a.score)[0];

  const script = scriptCompiler.compile(topic, selectedHook);
  const caption_plan = captionPlanner.plan(script);

  const hard_fail_reasons = [];
  const soft_fail_reasons = [];

  // source gate hard fail
  if (sourceGateResult.hardFail) {
    hard_fail_reasons.push("source_required_true_but_source_metadata_missing:" + sourceGateResult.missingFields.join(","));
  }
  // forbidden / investment / exaggeration hard fail
  const scriptForbidden = scanForbidden(script.full_voiceover);
  for (const f of scriptForbidden) hard_fail_reasons.push("forbidden:" + f.kind + ":" + f.match);
  // selected hook below threshold → soft fail
  if (selectedHook.score < HOOK_MIN_SCORE) soft_fail_reasons.push("selected_hook_below_75:" + selectedHook.score);
  // duration over → soft fail (needs_compression)
  if (script.needs_compression) soft_fail_reasons.push("voiceover_over_30s_needs_compression:" + script.estimated_voiceover_duration);
  // caption density
  if (!caption_plan.densityOk) soft_fail_reasons.push("caption_density_high:" + caption_plan.maxCaptionCharCount);

  const voiceover_timing_metadata = {
    estimated_voiceover_duration: script.estimated_voiceover_duration,
    target_duration: 30,
    needs_compression: script.needs_compression,
    hook_duration: selectedHook.estimated_duration,
    hook_within_window: selectedHook.estimated_duration >= DG.hookMinSec && selectedHook.estimated_duration <= DG.hookMaxSec,
    per_sentence: script._sentenceTimings,
  };

  // strip internal field before emitting script artifact
  const { _sentenceTimings, ...scriptClean } = script;

  return {
    candidateId: `${topic.topicId}-cand-${variantSeed + 1}`,
    hook_candidates: hooks,
    selectedHookText: selectedHook.text,
    selectedHookScore: selectedHook.score,
    script: scriptClean,
    caption_plan,
    voiceover_timing_metadata,
    risk_flags: script.risk_flags,
    scores: {
      hook_score: selectedHook.score,
      script_clarity_score: scoreScriptClarity(script),
      channel_fit: classifier.channelFit(topic).isConnected,
    },
    hard_fail_reasons,
    soft_fail_reasons,
  };
}

const topicsOut = [];
for (const topic of input.topics) {
  const cls = classifier.classify(topic);
  const sourceGateResult = evaluateSourceGate(topic, cls.sourceRequired);
  const channelFit = classifier.channelFit(topic);

  const candidates = [];
  for (let v = 0; v < MAX_CANDIDATES; v++) {
    candidates.push(buildCandidate(topic, sourceGateResult, v));
  }

  // candidate selection: hard fail 없는 것 중 최고 hook_score
  const noHardFail = candidates.filter((c) => c.hard_fail_reasons.length === 0);
  const pool = noHardFail.length ? noHardFail : candidates;
  const selected = pool.slice().sort((a, b) => b.selectedHookScore - a.selectedHookScore)[0];
  const anyHardFail = candidates.every((c) => c.hard_fail_reasons.length > 0);

  topicsOut.push({
    topicId: topic.topicId,
    contentPillar: topic.contentPillar,
    sourceGateResult,
    channelFit,
    candidates,
    selectedCandidateId: anyHardFail ? null : selected.candidateId,
    phase2Readiness: {
      classified: cls.known,
      sourceGatePassed: sourceGateResult.ok,
      channelFitConnected: channelFit.isConnected,
      hasSelectableCandidate: !anyHardFail,
      finalDecisionHint: anyHardFail
        ? (sourceGateResult.hardFail ? "skip_topic_or_regenerate_all_source_missing" : "regenerate_all")
        : "render_candidate_ready_for_scene_planner",
    },
  });
}

// ── artifact file mapping (Phase 2 outputs) ──────────────────────────────────
const output = {
  schemaVersion: "money_shorts_retention_script_compiler_output_v1",
  status: "data_only_rule_based_dry_run",
  sourceContractRef: "scripts/fixtures/money-shorts-creative-quality-contract.v1.json",
  sourceContractSchemaVersion: contract.schemaVersion,
  inputRef: "scripts/fixtures/money-shorts-retention-script-compiler.sample-input.v1.json",
  compilerMode: "rule_based_v1",
  ruleBasedComponents: ["RuleBasedTopicClassifier", "RuleBasedHookGenerator", "RuleBasedScriptCompiler", "RuleBasedCaptionPlanner"],
  futureLlmSlots: ["LLMHookGenerator", "LLMScriptCompiler"],
  isLlmGeneration: false,
  externalApiExecuted: false,
  renderExecuted: false,
  ttsExecuted: false,
  imageGenerationExecuted: false,
  artifactFileMapping: {
    "hook_candidates.json": "per-candidate hook_candidates array",
    "script.json": "per-candidate script object (retention 5-part structure)",
    "caption_plan.json": "per-candidate caption_plan (single-line, safe-frame)",
    "voiceover_timing_metadata.json": "per-candidate voiceover timing + duration guard",
    "note": "Phase 2 산출물. Creative Quality Contract의 requiredFinalArtifacts와 충돌하지 않으며, 최종 production plan의 동일 파일명(script.json/hook_candidates.json/caption_plan.json)에 대응하는 Phase 2 컴파일 결과다.",
  },
  phase2Outputs: ["hook_candidates.json", "script.json", "caption_plan.json", "voiceover_timing_metadata.json"],
  topics: topicsOut,
  boundary: {
    noLlmCall: true,
    noExternalApiCall: true,
    noRenderMuxFfmpeg: true,
    noTtsGeneration: true,
    noImageGeneration: true,
    noUploadOrPublish: true,
    noEnvOrSecretAccess: true,
    dataOnly: true,
  },
};

writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");

// ── console summary ──────────────────────────────────────────────────────────
console.log("── RETENTION SCRIPT COMPILER v1 (rule_based, no-live) ──");
console.log(`  contract: ${contract.schemaVersion}`);
console.log(`  topics: ${topicsOut.length}`);
for (const t of topicsOut) {
  console.log(
    `  [${t.topicId}] pillar=${t.contentPillar} sourceGate=${t.sourceGateResult.ok ? "OK" : "HARD_FAIL"} ` +
      `channelFit=${t.channelFit.isConnected} candidates=${t.candidates.length} selected=${t.selectedCandidateId ?? "(none)"}`
  );
}
console.log(`  output written: ${OUTPUT_PATH}`);
process.exit(0);
