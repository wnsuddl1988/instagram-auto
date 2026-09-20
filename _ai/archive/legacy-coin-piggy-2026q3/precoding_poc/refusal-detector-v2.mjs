// 선행조사 PoC — refusal/quota 감지 견고화 (앱 미반영, 검증 전용)
// 현재 scripts/_gemini-veo-core.mjs 의 detectQuotaOrRefusal 약점 보완안.
//   1) 패턴 확장 (한/영 일반 거절 + 정책 위반 표현)
//   2) 정규식 기반 + 감지 텍스트 스니펫 반환 (디버깅용)
//   3) generation-started 신호 분리 (정상 생성 중 vs 무반응 구분)
//
// 반영 여부는 Codex 상의 후 결정. 앱/스크립트에는 미반영.

const QUOTA_PAT = [
  /한도가/, /초기화됩니다/, /동영상 한도/, /video limit/i, /limit resets/i,
  /try again later/i, /다시 시도/, /quota/i, /사용량/,
];

const REFUSAL_PAT = [
  // 한국어
  /만들 수 없/, /만들어 드릴 수 없/, /생성할 수 없/, /생성해 드릴 수 없/,
  /처리할 수 없/, /도와드릴 수 없/, /제공할 수 없/, /지원하지 않/,
  /정책에 위반/, /정책을 위반/, /policy를 위반/i, /안전 가이드라인/, /콘텐츠 정책/,
  /죄송하지만/, /부적절한/,
  // 영어
  /can'?t (make|create|generate|help|assist)/i,
  /cannot (make|create|generate|help|assist)/i,
  /(unable|not able) to (create|generate|help|make)/i,
  /won'?t be able to/i,
  /violates? (our )?(policy|policies|guidelines)/i,
  /against (our )?(policy|guidelines)/i,
  /I'?m sorry,? (but )?I/i,
];

const GENERATING_PAT = [
  /생성/, /만드는 중/, /Generating/i, /Creating/i, /처리 중/, /동영상 만들기/,
];

// page.evaluate(() => document.body.innerText) 의 결과를 받아 상태 분류.
// 기존 함수는 type/text만 반환했으나, 여기서는 pattern과 snippet까지 반환해
// 결과 JSON에 거절 사유를 남길 수 있게 한다.
export function classifyVeoState(bodyText) {
  const text = bodyText || "";
  const snippet = (re) => {
    const m = text.match(re);
    if (!m) return null;
    const i = Math.max(0, m.index - 30);
    return text.slice(i, m.index + m[0].length + 40).replace(/\s+/g, " ").trim();
  };
  // 하위호환: 기존 호출부(_gemini-veo-core.mjs:150 `quota.text`)가 깨지지 않도록
  // text 필드를 snippet 값으로 함께 채워 반환한다. (text === snippet)
  for (const re of QUOTA_PAT)      if (re.test(text)) { const s=snippet(re); return { type: "quota",      pattern: re.source, snippet: s, text: s }; }
  for (const re of REFUSAL_PAT)    if (re.test(text)) { const s=snippet(re); return { type: "refusal",    pattern: re.source, snippet: s, text: s }; }
  for (const re of GENERATING_PAT) if (re.test(text)) return { type: "generating", pattern: re.source, snippet: null, text: null };
  return { type: "unknown", pattern: null, snippet: null, text: null };
}
