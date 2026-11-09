/**
 * 자막 분할 사전 점검(2026-10-14, Owner "임시로 넘어가지 말고 제대로") — 녹음을 만들기 전에 대본 문장이 자막 규칙 안에서
 * 나뉘는지 본다. 부엉 52편 s11 "…1억 9,200만 원이야"(854px)는 어느 자리로 나눠도 금지 경계("1억 | 9,200만", "9,200만 | 원이야")라
 * 예외 승인 말고는 방법이 없었다 — 조립·QA 단계에서야 드러나 유료 녹음을 다시 만들어야 했다. 같은 문제를 문장 단계에서 잡는다.
 *
 * 조립기(run-owl-assemble-shorts-v2.mjs)와 같은 규칙 모듈(_caption-linebreak-ko.mjs)을 쓴다: 글자 크기 96px·줄 폭 760px·최대 2줄.
 * 시간 정보 없이 글자만 보므로 "재생 시간이 짧아 블록이 스치는" 문제는 못 잡는다(그건 조립 후 QA). 반환은 문제 장면 목록(문자열).
 *
 * 잡는 것: ① 금지 경계 없이는 나눌 수 없는 블록 ② 한 어절 자체가 줄 폭을 넘음 ③ 블록 사이 금지 경계.
 * 못 푸는 문장은 어미를 띄어 쓰거나("…1억 9,200만 원이 되는 거야"), 어절을 쪼개거나("국회 예산정책처는") 문장을 바꾼다.
 */
import { segmentWordsIntoBlocks, splitPenalty, textWidthRatio, wrapToLinesScored } from "./_caption-linebreak-ko.mjs";

const FONT = 96;
const MAX_WIDTH = 760;
const strip = (t) => String(t).replace(/[,.·…]+$/u, "").trimEnd();

export function simulateCaptionBlocks(text) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const blockScore = (slice) => {
    const ends = [];
    slice.forEach((w, k) => { if (k < slice.length - 1 && /[.?!…]["'”’)]*$/u.test(w)) ends.push(k); });
    if (ends.length > 1) return null;
    if (ends.length === 1 && !(slice.length - ends[0] - 1 <= 2)) return null; // 장면 끝의 짧은 문장만 앞 문장과 함께 허용(조립기 근사)
    const s = wrapToLinesScored(strip(slice.join(" ")), FONT, MAX_WIDTH, { allowForced: true });
    return s ? s.score : null;
  };
  const ranges = segmentWordsIntoBlocks(words, blockScore);
  if (!ranges) return { ok: false, bad: ["어떤 방법으로도 나눌 수 없음"], blocks: [] };
  const bad = [];
  for (const [a, b] of ranges) {
    const t = strip(words.slice(a, b).join(" "));
    if (!wrapToLinesScored(t, FONT, MAX_WIDTH, { allowForced: false })) bad.push(`금지 경계에서만 나뉨: "${t}"`);
    for (const w of t.split(/\s+/)) {
      const px = Math.round(textWidthRatio(w) * FONT);
      if (px > MAX_WIDTH) bad.push(`한 어절이 줄 폭 초과(${px}px): "${w}"`);
    }
  }
  for (let i = 1; i < ranges.length; i += 1) {
    const L = words[ranges[i][0] - 1];
    const R = words[ranges[i][0]];
    if (!Number.isFinite(splitPenalty(strip(L), R))) bad.push(`블록 사이 금지 경계: "${L} || ${R}"`);
  }
  return { ok: bad.length === 0, bad: [...new Set(bad)], blocks: ranges.map(([a, b]) => words.slice(a, b).join(" ")) };
}

/** texts = 장면별 화면 표시 문장(captionDisplayText). 문제 있는 장면만 "N번 …" 문자열로 돌려준다. */
export function checkCaptionFit(texts) {
  const problems = [];
  texts.forEach((t, i) => {
    const r = simulateCaptionBlocks(t);
    if (!r.ok) problems.push(`${i + 1}번 ${r.bad.join(" / ")}`);
  });
  return problems;
}
