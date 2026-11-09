export const FINANCE_COVER_HOOK_CONTRACT_VERSION = "money_shorts_finance_cover_hook_v2";

const DANGLING_TOKENS = new Set([
  "더", "왜", "안", "못", "가장", "먼저", "진짜", "정작", "괜히", "꼭", "반드시",
  "바로", "결국", "이미", "또", "다시", "계속", "제일", "너무", "잘", "큰", "작은",
  "내", "이", "그", "한",
]);
const EXPLANATORY_CLOSURE_PATTERN = /(?:때문이야|때문입니다|정답은|결론은|해결책은|그래서)$/u;
const OPEN_LOOP_PATTERN = /(?:있어|갈려|아니야)$/u;
const PARTICLE_BREAK_PATTERN = /(?:을|를|와|과|의)$/u;
const PARTICLE_WORD_EXCEPTIONS = new Set(["결과", "효과", "성과", "평가", "대가", "국가", "주가", "원가", "단가", "학과", "마을"]);
const FORBIDDEN_PHRASES = new Set([
  "진짜 이유는 따로 있어",
  "그냥 넘기면 안 돼",
  "계좌가 먼저 흔들려",
]);

function normalizedWords(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[.!?…。！？]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function compactText(value) {
  return normalizedWords(value).replace(/\s+/gu, "").toLowerCase();
}

function endsWithDanglingToken(value) {
  const words = normalizedWords(value).split(/\s+/u).filter(Boolean);
  const last = words.at(-1) ?? "";
  return words.length === 0 ||
    DANGLING_TOKENS.has(last) ||
    (PARTICLE_BREAK_PATTERN.test(last) && !PARTICLE_WORD_EXCEPTIONS.has(last));
}

export function validateFinanceCoverHookContract(coverContract) {
  const audit = coverContract?.hookAudit;
  const lines = Array.isArray(coverContract?.lines) ? coverContract.lines : [];
  const spoken = lines.map((line) => String(line?.spokenText ?? "").trim());
  const mode = audit?.mode;
  const sourceText = String(audit?.sourceText ?? "").trim();
  const source = compactText(sourceText);
  const candidate = mode === "title_open_loop"
    ? compactText(spoken.slice(0, 2).join(" "))
    : compactText(spoken[1] ?? "");
  const sourceTextPreserved = mode === "title_open_loop"
    ? source.length >= 2 && candidate === source
    : mode === "part_two_reentry" && source.length >= 2 && candidate.includes(source);
  const danglingIndexes = mode === "title_open_loop" ? [0, 1] : [1];
  const danglingTokenFree = danglingIndexes.every((index) => !endsWithDanglingToken(spoken[index] ?? ""));
  const lastSpoken = spoken[2] ?? "";
  const explanatoryClosureFree =
    !EXPLANATORY_CLOSURE_PATTERN.test(lastSpoken) &&
    !FORBIDDEN_PHRASES.has(lastSpoken);
  const openLoopPresent = OPEN_LOOP_PATTERN.test(lastSpoken);
  const failures = [
    ...(audit?.contractVersion === FINANCE_COVER_HOOK_CONTRACT_VERSION ? [] : ["hook_contract_version_invalid"]),
    ...(mode === "title_open_loop" || mode === "part_two_reentry" ? [] : ["hook_mode_invalid"]),
    ...(lines.length === 3 ? [] : ["cover_line_count_invalid"]),
    ...(sourceTextPreserved ? [] : ["source_hook_semantics_lost"]),
    ...(danglingTokenFree ? [] : ["dangling_cover_token"]),
    ...(explanatoryClosureFree ? [] : ["explanatory_or_generic_closure"]),
    ...(openLoopPresent ? [] : ["open_loop_missing"]),
    ...(audit?.sourceTextCoverageRatio === 1 ? [] : ["source_hook_coverage_incomplete"]),
    ...(audit?.sourceTextPreserved === true ? [] : ["stored_source_hook_audit_failed"]),
    ...(audit?.danglingTokenFree === true ? [] : ["stored_dangling_audit_failed"]),
    ...(audit?.explanatoryClosureFree === true ? [] : ["stored_explanatory_audit_failed"]),
    ...(audit?.openLoopPresent === true ? [] : ["stored_open_loop_audit_failed"]),
    ...(audit?.displaySemanticsPreserved === true ? [] : ["stored_display_semantics_audit_failed"]),
    ...(audit?.visualOnlyPunctuation === true ? [] : ["stored_punctuation_audit_failed"]),
    ...(Array.isArray(audit?.failures) && audit.failures.length === 0 ? [] : ["stored_hook_failures_present"]),
    ...(audit?.passed === true ? [] : ["stored_hook_audit_not_passed"]),
  ];
  return { passed: failures.length === 0, failures };
}
