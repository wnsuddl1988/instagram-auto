/**
 * 한국어 자막 줄바꿈·블록 분할 규칙 (2026-09-30 Owner 지적으로 신설).
 *
 * 이전 조립기는 "두 줄 폭이 비슷한 지점"만 보고 줄을 나눴고(관형사·부정부사만 예외),
 * 폭을 넘는 자막은 어절 수로 N등분했다. 그 결과 의미 단위가 깨졌다 — 10편 실제 사례:
 *   "11월 / 2일부터", "5천 / 원이 되면", "자본 / 효율 계획을", "업종 / 안의 순위로",
 *   "결론이 / 아니라", 블록 사이 "쉽고 / 빠르게".
 *
 * 새 기준은 "어디서 끊는 게 자연스러운가"를 점수로 매기고, 폭 균형은 마지막 기준이다.
 *   끊기 좋은 곳: 쉼표·마침표 뒤 > 전환어(그래서·하지만·다만…) 앞 > 연결어미(-고·-는데·-면…) 뒤
 *                 > 조사(은·는·이·가·을·를·에…) 뒤
 *   끊으면 안 되는 곳: 숫자+단위("5천 원", "11월 2일"), 관형사·부정부사+명사("한 달", "못 받게"),
 *                 명사+의존명사("~는 게", "~할 수"), "A가 아니라", 본용언+보조용언("늘고 있는지")
 *   피할 곳: 조사·어미 없는 맨 명사 뒤("자본 / 효율"), 대등 연결("쉽고 / 빠르게")
 *
 * 회귀 테스트: scripts/check-caption-linebreak-ko.mjs — 수정 요청이 오면 사례를 거기에 추가한다.
 */

/** Black Han Sans 기준 글자폭 근사. 한글은 거의 정사각, 영숫자는 약 0.55배. */
export function textWidthRatio(text) {
  let ratio = 0;
  for (const char of String(text)) {
    if (char === " ") ratio += 0.3;
    else if (/[0-9A-Za-z.%,→?!]/.test(char)) ratio += 0.55;
    else ratio += 1;
  }
  return ratio;
}

function core(word) {
  return String(word ?? "")
    .replace(/^[\s"'“”‘’([{]+/u, "")
    .replace(/[\s"'“”‘’.,!?…，。！？:;\])}]+$/u, "");
}

const PUNCT_END = /[,.!?…，。！？;:]["'”’)]*$/u;
const PIVOT_WORD = /^(그리고|하지만|그런데|근데|그래서|그러면|그럼|반면|대신|결국|특히|먼저|다음|이때|다만|물론|또|또한|반대로|즉|그러니까|왜냐하면|이것만은)$/u;
const CLAUSE_ENDING = /(고|는데|은데|인데|면|으면|서|아서|어서|해서|지만|니까|으니까|며|면서|려면|으려면|는지|은지|도록|더라도|라도|든지|거나|자마자)$/u;
const CASE_PARTICLE = /(은|는|이|가|을|를|에서|에게|께|에|으로|로|와|과|도|만|까지|부터|보다|처럼|마다|이나|나|랑|이랑)$/u;
// 어절이 조사·어미로 끝나는지(= 끊어도 되는 형태인지) 대략 판정. 여기에 안 걸리면 맨 명사로 본다.
const HAS_ENDING = /(은|는|이|가|을|를|에|의|도|로|와|과|만|서|고|면|며|데|지|게|야|요|다|죠|까|네|께|랑|나|든|자|해|어|아|여|워|와|니|래|대|래요|죠|걸|건|거든|인)$/u;
const DETERMINER = /^(한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|그|이|저|또|몇|못|안|더|덜|약|총|각|매|첫|모든|어느|무슨|어떤|이런|그런|저런|이번|지난|다음|올해|내년|작년|내|우리|저희)$/u; // 내·우리·저희 = 소유("우리 / 지갑을" 금지, CTA 재제작 2026-09-30)
const UNIT_START = /^(원|만|천|억|조|년|월|일|개월|주|시간|시|분|초|%|퍼센트|배|곳|명|개|위|달|번|살|세|대|건|가지|포인트|달러|엔|위안|p)/u;
const NUMBER_END = /([0-9]|[0-9][.,][0-9]+|십|백|천|만|억|조)$/u;
const DEPENDENT_NOUN = /^(것|거|게|걸|건|수|때|데|줄|뿐|만큼|대로|듯|중|적|채|바|지|터|편|쪽)(이|가|을|를|은|는|도|만|에|의|로|야|이야|이다|예요|다|이라|라)?$/u;
const AUX_START = /^(있|없|싶|않|못하|말|버리|두|놓|주|보|봐)/u;
const AUX_LEFT_END = /(고|어|아|게|지|해|여|워|와|려|러)$/u;
const ANI_START = /^아니(라|고|야|다|에요|잖아|지|면)/u;
// '-고'로 끝나지만 연결어미가 아닌 명사("기업가치 제고 계획", "광고", "재고"…). 맨 명사로 취급한다.
const GO_NOUN = /^(제고|재고|광고|보고|신고|최고|창고|참고|경고|사고|원고|잔고|노고|수고|공고|예고|선고|권고|파고|등고)$/u;

export const HARD_FORBIDDEN = Number.POSITIVE_INFINITY;

/** 마지막 글자의 받침(종성) 인덱스. 0=받침 없음, 4=ㄴ, 8=ㄹ. 한글이 아니면 -1. */
function finalConsonant(word) {
  const ch = [...word].at(-1) ?? "";
  const code = ch.codePointAt(0) - 0xac00;
  if (code < 0 || code > 11171) return -1;
  return code % 28;
}
/**
 * 왼쪽 어절이 의존명사를 꾸미는 관형형인지(= 의존명사와 붙어야 하는지).
 * "할 수", "할 줄"은 ㄹ 받침만, "하는 게", "한 것"은 ㄴ·ㄹ 받침이나 "는/던"으로 끝날 때만.
 * (2026-09-30: "발행은 / 줄 거라는"의 '줄'(줄다)을 의존명사로 오판한 사례로 정밀화.)
 */
function isAdnominal(L, R) {
  const jong = finalConsonant(L);
  if (/^(수|줄)/u.test(R)) return jong === 8;
  if (/(는|던)$/u.test(L)) return true;
  if (/(은)$/u.test(L)) return false; // 주제 조사 "은"과 구분 불가 — 끊는 쪽을 허용
  return jong === 4 || jong === 8;
}

/**
 * 어절 L과 R 사이에서 끊을 때의 벌점. 낮을수록 자연스럽다. Infinity는 절대 금지.
 */
export function splitPenalty(leftWord, rightWord) {
  const Lraw = String(leftWord ?? "");
  const L = core(Lraw);
  const R = core(rightWord);
  if (!L || !R) return 6;

  // 시간어 + 숫자("올해 / 9조 8천억 원에서")는 금지가 아니라 벌점. 숫자 덩어리(숫자+단위 연쇄)는 못 가르므로
  // "올해 9조 8천억 원에서"(840px)가 폭 760에 안 들어갈 때 금지로 두면 숫자 중간에서 끊기는 더 나쁜 해만 남는다
  // (황소 11편 s4, 2026-09-30). 그래도 붙이는 쪽을 선호하도록 벌점은 높게 둔다.
  if (/^(올해|내년|작년|이번|지난)$/u.test(L) && /^[0-9]/.test(R)) return 25;
  // 절대 금지
  if (DETERMINER.test(L)) return HARD_FORBIDDEN;
  if (/[0-9]/.test(L) && NUMBER_END.test(L) && UNIT_START.test(R)) return HARD_FORBIDDEN; // 5천 / 원, 3 / 년
  if (/[0-9](월|년)$/.test(L) && /^[0-9]/.test(R)) return HARD_FORBIDDEN;               // 11월 / 2일
  if (/(^|[0-9])(만|억|조|천)$/.test(L) && /^[0-9]/.test(R)) return HARD_FORBIDDEN;      // 6만 / 8천480원, 만 / 700원(한 숫자)
  if (/^[0-9.,]+$/.test(L)) return HARD_FORBIDDEN;                                          // 숫자만 떨어짐
  if (DEPENDENT_NOUN.test(R) && isAdnominal(L, R)) return HARD_FORBIDDEN;                     // ~는 / 게, 할 / 수
  if (ANI_START.test(R)) return HARD_FORBIDDEN;                                              // 결론이 / 아니라

  // 끊기 좋은 곳
  if (PUNCT_END.test(Lraw)) return 0;
  const leftIsBare = /[0-9A-Za-z]$/.test(L) || !HAS_ENDING.test(L) || GO_NOUN.test(L);
  // 전환어 앞은 좋은 자리 — 단 "제일 먼저"처럼 왼쪽이 맨 부사·명사면 전환어가 아니라 수식 관계다.
  if (PIVOT_WORD.test(R) && !leftIsBare) return 1;
  if (AUX_START.test(R) && AUX_LEFT_END.test(L)) return 30;                                  // 늘고 / 있는지
  if (/^(있|없)(어|다|음|지|죠|네|는데|으면|고|을까|나)?$/u.test(R)) return 14;                // 절차도 / 있어(짧은 서술어만 떨어짐)
  if (CLAUSE_ENDING.test(L) && !GO_NOUN.test(L)) {
    if (/고$/.test(L) && /게$/.test(R)) return 12;                                            // 쉽고 / 빠르게 (대등 연결)
    return 2;
  }
  if (CASE_PARTICLE.test(L) && !GO_NOUN.test(L)) return 4;
  if (leftIsBare) {
    // 맨 명사 뒤. 오른쪽도 맨 명사면 복합명사("자본 효율", "기업가치 제고")를 가르는 것이라 더 나쁘다.
    return /[0-9A-Za-z]$/.test(R) || !HAS_ENDING.test(R) ? 20 : 14;
  }
  return 6;
}

function visibleChars(text) {
  return [...String(text).replace(/\s+/gu, "")].length;
}

/**
 * 한 자막 블록을 최대 2줄로 나눈다. 폭에 안 들어가면 null(호출부가 블록을 시간축으로 나눔).
 */
export function wrapToLines(text, fontSize, maxWidth) {
  return wrapToLinesScored(text, fontSize, maxWidth)?.lines ?? null;
}

/** wrapToLines와 같지만 고른 줄바꿈의 벌점(score)도 함께 돌려준다. 한 줄이면 score 0. */
export function wrapToLinesScored(text, fontSize, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return { lines: [String(text)], score: 0 };
  if (words.length === 1 || textWidthRatio(words.join(" ")) * fontSize <= maxWidth) {
    return { lines: [words.join(" ")], score: 0 };
  }
  let best = null;
  for (let split = 1; split < words.length; split += 1) {
    const penalty = splitPenalty(words[split - 1], words[split]);
    if (!Number.isFinite(penalty)) continue;
    const left = words.slice(0, split).join(" ");
    const right = words.slice(split).join(" ");
    const leftWidth = textWidthRatio(left) * fontSize;
    const rightWidth = textWidthRatio(right) * fontSize;
    if (leftWidth > maxWidth || rightWidth > maxWidth) continue;
    const balance = Math.abs(leftWidth - rightWidth) / maxWidth;
    const orphan = (split === 1 && visibleChars(left) <= 2) || (split === words.length - 1 && visibleChars(right) <= 2) ? 8 : 0;
    const score = penalty + balance * 4 + orphan;
    if (!best || score < best.score) best = { score, lines: [left, right] };
  }
  return best;
}

/**
 * 폭 안에 안 들어가는 어절 배열을 여러 블록으로 나눈다(동적계획법).
 * blockScore(wordsSlice) → 2줄 이내로 들어가면 그 블록 안 줄바꿈 벌점(number), 안 들어가면 null.
 * (true/false를 돌려주는 옛 방식도 받는다 — true는 벌점 0으로 본다.)
 * 비용 = 블록 사이 경계 벌점 + 블록 안 줄바꿈 벌점 + 블록 수 — 블록 안에서 복합명사를 가르는
 * 한 블록짜리 해("그래서 회사들이 자본 / 효율 계획을…")보다 자연스러운 두 블록을 고르게 한다.
 * 반환: [[start, end), ...] 인덱스 구간. 어떤 구간도 불가하면 null.
 */
export function segmentWordsIntoBlocks(words, blockScore) {
  const n = words.length;
  const best = new Array(n + 1).fill(null);
  best[0] = { cost: 0, prev: -1 };
  for (let end = 1; end <= n; end += 1) {
    for (let start = end - 1; start >= 0; start -= 1) {
      if (!best[start]) continue;
      const slice = words.slice(start, end);
      const raw = blockScore(slice, start, end);
      if (raw === null || raw === false || raw === undefined) continue;
      const inner = raw === true ? 0 : Number(raw);
      const boundary = start > 0 ? splitPenalty(words[start - 1], words[start]) : 0;
      const boundaryCost = Number.isFinite(boundary) ? boundary : 1000;
      const lonely = slice.length === 1 && n > 1 ? 15 : 0;
      const short = visibleChars(slice.join("")) < 4 && n > 1 ? 10 : 0;
      const cost = best[start].cost + boundaryCost + inner + lonely + short + 3;
      if (!best[end] || cost < best[end].cost) best[end] = { cost, prev: start };
    }
  }
  if (!best[n]) return null;
  const ranges = [];
  for (let end = n; end > 0; end = best[end].prev) ranges.unshift([best[end].prev, end]);
  return ranges;
}
