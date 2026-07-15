import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const ROOT = process.cwd();
const BANK_PATH = path.join(ROOT, "lib", "finance-editorial-topic-bank.ts");
const ENGINE_PATH = path.join(ROOT, "lib", "finance-editorial-script-engine.ts");
const HELPER_PATH = path.join(ROOT, "lib", "owner-web-operator.ts");

let pass = 0;
let fail = 0;
function check(name, ok, detail = "") {
  if (ok) {
    pass += 1;
    console.log(`PASS  ${name}`);
  } else {
    fail += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function loadTypescriptModule(filePath) {
  const source = readFileSync(filePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const sandboxModule = { exports: {} };
  vm.runInNewContext(output, {
    module: sandboxModule,
    exports: sandboxModule.exports,
    console,
  });
  return { source, exports: sandboxModule.exports };
}

const joinParts = (parts) => [
  parts.hook,
  parts.situation,
  parts.consequence,
  parts.psychology,
  parts.mindset,
  parts.habit,
  parts.recommendation,
].join("\n");

const lines = (text) => String(text ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

check("500-title bank exists", existsSync(BANK_PATH));
check("500-title script engine exists", existsSync(ENGINE_PATH));

const bankModule = loadTypescriptModule(BANK_PATH);
const engineModule = loadTypescriptModule(ENGINE_PATH);
const bank = bankModule.exports.FINANCE_EDITORIAL_TOPIC_BANK ?? [];
const build = engineModule.exports.buildFinanceEditorialScriptParts;
const buildVideoStrategy = engineModule.exports.buildFinanceEditorialVideoStrategy;
const auditCoverHook = engineModule.exports.auditFinanceEditorialCoverHook;
const strategyCoverHooksPass = engineModule.exports.financeEditorialVideoStrategyCoverHooksPass;
const inferLane = engineModule.exports.inferFinanceEditorialLane;
const helper = readFileSync(HELPER_PATH, "utf8");
const scripts = bank.map((topic) => ({ topic, parts: build(topic) }));
const videoStrategies = scripts.map(({ topic, parts }) => ({ topic, strategy: buildVideoStrategy(topic, parts) }));

check("engine builds exactly 500 scripts", scripts.length === 500);
check("all seven narrative parts are present", scripts.every(({ parts }) =>
  ["hook", "situation", "consequence", "psychology", "mindset", "habit", "recommendation"]
    .every((key) => typeof parts[key] === "string" && parts[key].trim().length > 0)));
check("all 500 scripts receive the semantic prehook and series strategy", videoStrategies.length === 500 &&
  videoStrategies.every(({ strategy }) => strategy.contractVersion === "money_shorts_semantic_prehook_series_v1"));
const coverPunctuationCount = (value) => (String(value ?? "").match(/[!?…]|\.{2,}/gu) ?? []).length;
check("all 500 opening covers use three spoken/display lines with visual-only punctuation", videoStrategies.every(({ strategy }) =>
  strategy.parts.every((part) => part.coverLines.length === 3 && part.coverLines.every((line) =>
    typeof line.spokenText === "string" && line.spokenText.length > 0 &&
    typeof line.displayText === "string" && line.displayText.length > 0 &&
    !/[!?]{2,}/.test(line.spokenText) &&
    coverPunctuationCount(line.displayText) > coverPunctuationCount(line.spokenText)))));
check("all 500 covers pass the current hook-preservation audit", videoStrategies.every(({ strategy }) =>
  strategyCoverHooksPass(strategy) && strategy.parts.every((part) =>
    part.coverHookAudit?.contractVersion === "money_shorts_finance_cover_hook_v2" &&
    part.coverHookAudit?.sourceTextCoverageRatio === 1 &&
    part.coverHookAudit?.passed === true)));
const rejectedCoverTopic = videoStrategies.find(({ topic }) => topic.title === "주가가 싸졌는데 더 위험해질 수 있는 이유");
check("the rejected investing cover keeps the full hook and breaks after a complete clause",
  JSON.stringify(rejectedCoverTopic?.strategy.parts[0]?.coverLines.map((line) => line.spokenText)) ===
    JSON.stringify(["주가가 싸졌는데", "더 위험해질 수 있는 이유", "문제는 가격이 아니야"]));
const particleBreakTopic = videoStrategies.find(({ topic }) => topic.title === "뉴스를 많이 봐도 돈을 못 지키는 결정적 이유");
check("cover lines prefer a spoken clause boundary over a dangling object particle",
  JSON.stringify(particleBreakTopic?.strategy.parts[0]?.coverLines.slice(0, 2).map((line) => line.spokenText)) ===
    JSON.stringify(["뉴스를 많이 봐도", "돈을 못 지키는 결정적 이유"]));
const malformedDanglingAudit = auditCoverHook({
  mode: "title_open_loop",
  sourceText: "주가가 싸졌는데 더 위험해질 수 있는 이유",
  coverLines: [
    { spokenText: "주가가 싸졌는데 더", displayText: "주가가 싸졌는데 더...", emphasis: "topic" },
    { spokenText: "위험해질 수 있는 이유", displayText: "위험해질 수 있는 이유?", emphasis: "tension" },
    { spokenText: "계좌가 먼저 흔들려", displayText: "계좌가 먼저 흔들려!", emphasis: "impact" },
  ],
});
check("dangling and generic rejected cover is fail-closed", malformedDanglingAudit.passed === false &&
  malformedDanglingAudit.failures.includes("dangling_cover_token") &&
  malformedDanglingAudit.failures.includes("explanatory_or_generic_closure"));
const explanatoryCoverAudit = auditCoverHook({
  mode: "title_open_loop",
  sourceText: "주가가 싸져도 선뜻 못 사는 건",
  coverLines: [
    { spokenText: "주가가 싸져도", displayText: "주가가 싸져도...", emphasis: "topic" },
    { spokenText: "선뜻 못 사는 건", displayText: "선뜻 못 사는 건?", emphasis: "tension" },
    { spokenText: "마음이 먼저 흔들리기 때문이야", displayText: "마음이 먼저 흔들리기 때문이야!", emphasis: "impact" },
  ],
});
check("explanatory answer-style cover is blocked before production", explanatoryCoverAudit.passed === false &&
  explanatoryCoverAudit.failures.includes("explanatory_or_generic_closure") &&
  explanatoryCoverAudit.failures.includes("open_loop_missing"));
check("all opening voice contracts are confident without a rushed speed", videoStrategies.every(({ strategy }) =>
  strategy.openingVoice.v3AudioTag === "confidently" && strategy.openingVoice.speedCap === 0.98));
check("split decisions are semantic and never time-only", videoStrategies.every(({ strategy }) =>
  strategy.splitAudit.timeOnlyDecisionForbidden === true &&
  strategy.splitAudit.requiredCount === 7 &&
  strategy.splitAudit.passed === (strategy.splitAudit.passedCount === 7)));
const splitStrategies = videoStrategies.filter(({ strategy }) => strategy.mode === "two_part");
check("semantic gate selects a bounded subset instead of forcing every title into two parts",
  splitStrategies.length >= 1 && splitStrategies.length < 250, `${splitStrategies.length} split titles`);
check("every two-part plan explicitly connects part one and marks part two", splitStrategies.every(({ strategy }) => {
  const [partOne, partTwo] = strategy.parts;
  return strategy.parts.length === 2 &&
    partOne.id === "part-1" && partOne.explicitContinuationCue === true &&
    /2편/.test(partOne.bridgeNarration ?? "") && /지금 이어서 봐/.test(partOne.bridgeNarration ?? "") &&
    partTwo.id === "part-2" && partTwo.explicitPartMarker === true &&
    partTwo.coverLines.some((line) => /이 편/.test(line.displayText));
}));
const durationRepairTopic = bank.find((topic) => topic.title === "계좌가 흔들릴 때 수익보다 먼저 되찾을 것");
const durationRepairParts = durationRepairTopic ? build(durationRepairTopic) : null;
const durationRepairStrategy = durationRepairTopic && durationRepairParts
  ? buildVideoStrategy(durationRepairTopic, durationRepairParts, { singleTargetDurationSec: 81 })
  : null;
check("over-60 production may split only through the shared semantic duration guard",
  durationRepairStrategy?.mode === "two_part" &&
  durationRepairStrategy.durationRepair?.applied === true &&
  durationRepairStrategy.durationRepair.sourceTargetDurationSec === 81 &&
  durationRepairStrategy.splitAudit.timeOnlyDecisionForbidden === true);
check("the duration guard preserves the natural part-one bridge and part-two re-entry",
  /2편/.test(durationRepairStrategy?.parts?.[0]?.bridgeNarration ?? "") &&
  /1편에서/.test(durationRepairStrategy?.parts?.[1]?.recapNarration ?? ""));
check("duration at the 60-second ceiling never forces a semantic split",
  durationRepairTopic && durationRepairParts
    ? buildVideoStrategy(durationRepairTopic, durationRepairParts, { singleTargetDurationSec: 60 }).durationRepair == null
    : false);
check("every script hook starts with its exact title", scripts.every(({ topic, parts }) => lines(parts.hook)[0] === topic.title));
check("every script carries a semantic profile and focus", scripts.every(({ parts }) =>
  typeof parts.profileId === "string" && parts.profileId.includes(":") && typeof parts.focus === "string" && parts.focus.length >= 2));

const lineContractFailures = scripts.filter(({ parts }) => {
  const counts = {
    hook: lines(parts.hook).length,
    situation: lines(parts.situation).length,
    consequence: lines(parts.consequence).length,
    psychology: lines(parts.psychology).length,
    mindset: lines(parts.mindset).length,
    habit: lines(parts.habit).length,
    recommendation: lines(parts.recommendation).length,
  };
  return counts.hook < 2 || counts.situation < 2 || counts.consequence < 2 || counts.psychology < 3 ||
    counts.mindset < 3 || counts.habit < 2 || counts.recommendation < 3;
});
check("all scripts keep the approved 3-to-8 flow depth", lineContractFailures.length === 0, `${lineContractFailures.length} failures`);

const rhythmFailures = scripts.filter(({ parts }) => {
  const narrationLines = lines(joinParts(parts));
  return narrationLines.length < 18 || narrationLines.length > 34 || narrationLines.some((line) => line.length > 64);
});
check("all scripts keep 18~34 short narration lines", rhythmFailures.length === 0, `${rhythmFailures.length} failures`);

const forbiddenPattern = /제목 속 선택|같은 돈 문제|비슷한 선택|정보 감각|오늘 한 번만 직접 확인|다음 선택의 기준으로 남겨|회피이|자기합리화이|근데 진짜 문제는 따로 있어/;
const forbiddenFailures = scripts.filter(({ parts }) => forbiddenPattern.test(joinParts(parts)));
check("old generic and malformed phrases are absent from all 500 scripts", forbiddenFailures.length === 0, `${forbiddenFailures.length} failures`);

const politePattern = /(?:합|입)니다(?:\s|$)|(?:하|해)세요(?:\s|$)|해요(?:\s|$)|거예요(?:\s|$)/;
const politeFailures = scripts.filter(({ parts }) => politePattern.test(joinParts(parts)));
check("all scripts avoid explanatory polite endings", politeFailures.length === 0, `${politeFailures.length} failures`);

const moneyResultPattern = /돈|이자|카드|생활비|월급|저축|비용|현금|원금|지출|결제|수입|소득|자산|손실|예산|비상금|주거비|가격|보험|연금|금액|납부|상환|고정비|할부|계좌|잔액|금리|연봉|월비용|총액|매출|수당|보증금|빚|납입액|금융비용|식비|물건값|영수증|할인|관계비|체면비|수익|투자금|집값|월세|관리비|한도|신용|노후|단가|물건|음식|투자|매수|매도|종목|수수료|세금|복리/;
const resultFailures = scripts.filter(({ parts }) => !moneyResultPattern.test(parts.consequence));
check("every consequence names a concrete financial result", resultFailures.length === 0,
  `${resultFailures.length} failures: ${resultFailures.slice(0, 8).map(({ topic, parts }) => `${topic.title}[${parts.profileId}]`).join(" | ")}`);

const actionPattern = /앱|영수증|자동이체|적어|적고|확인|열고|열어|계산|해지|표시|타이머|사진|목록|설정|분리|비교|모아|꺼|남겨|정해|작성|묶어|나눠|빼|옮겨|찍어|끄고|떼어|답해|합쳐|한 줄|표에/;
const actionFailures = scripts.filter(({ parts }) => !actionPattern.test(parts.habit));
check("every habit contains a concrete observable action", actionFailures.length === 0,
  `${actionFailures.length} failures: ${actionFailures.slice(0, 8).map(({ topic, parts }) => `${topic.title}[${parts.profileId}]`).join(" | ")}`);

const ctaFailures = scripts.filter(({ parts }) =>
  !/(다시 봐|저장해 둬)/.test(parts.recommendation) || !/팔로우해 둬/.test(parts.recommendation));
check("every ending gives a contextual recall cue and follow reason", ctaFailures.length === 0,
  `${ctaFailures.length} failures: ${ctaFailures.slice(0, 8).map(({ topic, parts }) => `${topic.title}[${parts.profileId}]`).join(" | ")}`);

const fullScripts = scripts.map(({ parts }) => joinParts(parts));
check("all 500 full scripts are unique", new Set(fullScripts).size === 500, `${new Set(fullScripts).size} unique`);
const bodySignatures = scripts.map(({ parts }) => [
  parts.situation,
  parts.consequence,
  parts.psychology,
  parts.mindset,
  parts.habit,
  parts.recommendation,
].join("\n"));
const bodyGroups = new Map();
for (const signature of bodySignatures) bodyGroups.set(signature, (bodyGroups.get(signature) ?? 0) + 1);
const distinctBodyCount = bodyGroups.size;
const maxBodyReuse = Math.max(...bodyGroups.values());
check("script bodies have at least 400 distinct semantic combinations", distinctBodyCount >= 400, `${distinctBodyCount} unique`);
check("no semantic body is reused by more than three related titles", maxBodyReuse <= 3, `${maxBodyReuse} max reuse`);

const domains = [...new Set(bank.map((topic) => topic.financeSubtopic))];
const domainProfileCounts = Object.fromEntries(domains.map((domain) => [
  domain,
  new Set(scripts.filter(({ topic }) => topic.financeSubtopic === domain).map(({ parts }) => parts.profileId)).size,
]));
check("every subtopic uses at least six semantic profiles", Object.values(domainProfileCounts).every((count) => count >= 6), JSON.stringify(domainProfileCounts));

const defaultCounts = Object.fromEntries(domains.map((domain) => [
  domain,
  scripts.filter(({ topic, parts }) => topic.financeSubtopic === domain && parts.profileId.endsWith(":default")).length,
]));
check("no subtopic leaves more than 15 titles on its default profile", Object.values(defaultCounts).every((count) => count <= 15), JSON.stringify(defaultCounts));

const defaultEconomicSignals = scripts.filter(({ topic, parts }) => topic.lane === "economic_signal" && parts.profileId.endsWith(":default"));
check("all 48 economic-signal titles use topic-specific economic profiles", defaultEconomicSignals.length === 0,
  `${defaultEconomicSignals.length} defaults: ${defaultEconomicSignals.slice(0, 8).map(({ topic }) => topic.title).join(" | ")}`);

const inferredLaneCases = [
  ["대출 전에 확인할 숫자 3개", "number_gap"],
  ["빚 줄이기 전에 가장 먼저 끊어야 할 결제", "action_one"],
  ["부자는 월급보다 남는 비율을 본다", "wealth_standard"],
  ["돈 관리가 늦어도 오늘 되찾을 기준", "recovery"],
  ["경기침체 전에 월급에서 먼저 보이는 신호", "economic_signal"],
  ["카드값이 생활비를 넘기 시작하면 위험하다", "warning"],
  ["대출 한도를 잔고로 보는 사람의 착각", "habit_exposure"],
  ["월급 올랐는데 저축은 줄어든 이유", "reversal"],
  ["잔고가 적을수록 앱을 닫고 싶은 심리", "psychology_gap"],
];
check("future finance titles are deterministically routed across all nine editorial lanes",
  typeof inferLane === "function" && inferredLaneCases.every(([title, lane]) => inferLane(title) === lane));

check("owner helper imports and calls the shared script engine", /from "\.\/finance-editorial-script-engine"/.test(helper) && /buildFinanceEditorialScriptParts\(editorialTopic\)/.test(helper));
check("owner helper removes temporary per-topic calibration exceptions", !/WIZARD_SCRIPT_CALIBRATION_TOPIC_ID|buildCalibrationTopicScriptParts/.test(helper));
check("Veo scene selection cache contract is v14", /money_shorts_editorial_package_script_v14/.test(helper));
check("semantic video strategy participates in the final-script fingerprint", /s:\s*preview\.videoStrategy/.test(helper));
check("Claude polish cannot replace the fixed title", /입력 title은 확정 제목/.test(helper) && /v\.title !== local\.title/.test(helper));
check("Claude polish must preserve contextual save and follow closing", /contextual_save_follow_closing_missing/.test(helper) && /저장해 둬/.test(helper) && /팔로우해 둬/.test(helper));
check("scene planner omits a forced generic problem bridge when the hook has no extra beat",
  /const hookB = hookLines\.slice\(2\)\.join\("\\n"\)/.test(helper) &&
  /\.\.\.\(hookB[\s\S]{0,120}\? \[\{ id: "problem" as const/.test(helper) &&
  !/const hookB = block\(hookLines\.slice\(2\), "근데 진짜 문제는 따로 있어"\)/.test(helper));
check("post-500 and legacy finance titles enter the same shared engine",
  /function resolveFinanceEditorialTopic/.test(helper) &&
  /lane: rec\.editorialLane \?\? inferFinanceEditorialLane\(rec\.title, rec\.angle\)/.test(helper) &&
  /const editorialTopic = resolveFinanceEditorialTopic\(rec\)/.test(helper) &&
  /usesEditorialScriptEngine = rec\.category === "finance" && Boolean\(rec\.financeSubtopic\)/.test(helper));

console.log(`\nprofile counts: ${JSON.stringify(domainProfileCounts)}`);
console.log(`default counts: ${JSON.stringify(defaultCounts)}`);
console.log(`\n${pass + fail} checks — ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exitCode = 1;
