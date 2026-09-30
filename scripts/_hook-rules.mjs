/**
 * 훅 규칙 검사 (2026-09-30 Owner 확정 — CURRENT_STANDARDS 최우선 규칙 17).
 *
 * 근거: 인스타 릴스 32편 평균 시청 시간(_ai/performance-report-2026-09-30.md). 통념 뒤집기·내 돈 안전·대상 이득·
 * 사건+이유형 첫 문장은 13~28초, 자기소개·용어 정의·긴장 없는 사실 확인형은 2~4초.
 *
 * H1 첫 문장(0~3초)에 긴장(통념 뒤집기 / 내 돈 손실·안전 / 대상 이득·변경 / 사건+큰 변동+이유)
 * H2 금지: 자기소개로 시작, 용어 정의로 시작, 긴장 없는 사실 확인형, 첫 문장 숫자 3개 이상
 * H3 첫 문장 주어는 시청자가 아는 구체 대상(추상 제도명은 둘째 문장으로)
 * H4 긴장 단어는 첫 문장 앞 절반
 * 자동 검사는 기계적으로 잡을 수 있는 것(H2 전부, H1 긴장 단어 유무, H4 위치)만 한다. H3은 사람이 본다.
 */

export const HOOK_TYPES = Object.freeze({
  T1: "통념 뒤집기",
  T2: "내 돈 안전·손실",
  T3: "특정 대상 이득·변경",
  T4: "사건 + 큰 변동 + 예상 밖 이유",
  T5: "손실 경고 + 행동 시점",
});

const SELF_INTRO = /^(안녕|반가워|나는|난 )|(특보|박사)(야|입니다)[.!,]?\s*오늘은/u;
const DEFINITION_START = /^[^\s,]{1,12}(,\s*(결국|정확히|쉽게 말해|한마디로)|(이)?란\s)/u;
const FACT_CHECK_END = /(거|것|걸)\s*(알아|알고 있었어|아니|알았어)\?\s*$/u;
// 긴장 단어(H1): 반전·손실·안전·이득·변경·급변동
const TENSION = /(생각했|줄 알|아니야|아니고|달라|반대|뒤집|놓친|손해|잃|깎|위험|안전할까|괜찮을까|날아|날리|바뀌|바뀐|달라졌|생겼|미룰|늦은|안 늦|더 받|덜 받|못 받|한 푼도|돌려받|아직도|뛰|뛴|뛸|빠진|빠졌|급등|급락|상한가|하한가|폭락|폭등|떨어|올랐|터졌|취소|처음|믿어져)/u;

function firstSentence(text) {
  const t = String(text ?? "").trim();
  const m = t.match(/^[^.?!]*[.?!]?/u);
  return (m ? m[0] : t).trim();
}
function countNumbers(text) {
  return (String(text).match(/[0-9][0-9,.]*/g) ?? []).length;
}

/**
 * spec의 첫 씬 훅 검사. 반환: { mustFix: string[], warn: string[], info: string[] }
 * spec.hookRuleException === true(규칙 이전에 TTS·영상까지 만든 재고)면 위반을 info로만 남긴다.
 */
export function checkHook(spec) {
  const out = { mustFix: [], warn: [], info: [] };
  const first = spec.scenes?.[0];
  if (!first) {
    out.mustFix.push("첫 씬이 없음");
    return out;
  }
  const s1 = firstSentence(first.narration);
  const half = s1.slice(0, Math.ceil(s1.length / 2));
  const problems = [];
  if (SELF_INTRO.test(s1)) problems.push("H2 자기소개로 시작(오프닝은 훅 뒤로)");
  if (DEFINITION_START.test(s1)) problems.push("H2 용어 정의로 시작");
  if (countNumbers(s1) >= 3) problems.push(`H2 첫 문장 숫자 ${countNumbers(s1)}개(3개 이상 금지)`);
  const hasTension = TENSION.test(s1);
  if (FACT_CHECK_END.test(s1) && !hasTension) problems.push("H2 긴장 없는 사실 확인형(\"~라는 거 알아?\")");
  if (!hasTension) problems.push("H1 첫 문장에 긴장 단어가 없음(반전·손실·안전·이득·변경·급변동)");
  else if (!TENSION.test(half) && s1.length > 20) out.warn.push("H4 긴장 단어가 첫 문장 뒤쪽에만 있음(3초 안에 안 들릴 수 있음)");

  const hookType = first.hookType ?? spec.hookType;
  if (hookType && !HOOK_TYPES[hookType]) out.warn.push(`hookType "${hookType}"은 T1~T5가 아님`);
  if (!hookType && spec.sceneBackgrounds) out.warn.push("스펙에 hookType(T1~T5)이 없음 — 성과 비교용 기록");

  if (spec.hookRuleException === true) {
    if (problems.length) out.info.push(`훅 규칙 예외(재고): ${problems.join(" / ")}`);
  } else {
    out.mustFix.push(...problems.map((p) => `훅: ${p} — "${s1}"`));
  }
  out.info.push(`첫 문장: "${s1}"${hookType ? ` [${hookType} ${HOOK_TYPES[hookType] ?? ""}]` : ""}`);
  return out;
}
