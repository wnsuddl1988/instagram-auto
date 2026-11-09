/**
 * 황소특보(가칭) 신규 캐릭터 디자인 후보 생성 스펙.
 *
 * 배경: 부엉박사(정책뉴스, 앵커 톤, 정장+선글라스, 뉴스스튜디오 배경)와
 * 금박사(용어해설, 순금 동전 마스코트, 옷 없음, 단순 배경)에 이어 세 번째
 * 캐릭터. 포지션은 "1~2일 내 신선도 있는 국내·미국장 시황/섹터/종목
 * 소식을 빠르게 전달"하는 캐스터 — 부엉박사와 톤은 가깝지만(뉴스 전달),
 * 형태를 확실히 다른 동물(황소)로 차별화하고 증권 시황판/티커 소품으로
 * "실시간 시장" 정체성을 명확히 한다.
 *
 * 색상: 골드 계열(Owner 확정, 2026-09-23) — 금박사와 같은 계열이지만
 * 형태(동전형 vs 황소형)와 배경(단순 배경 vs 시황판 스튜디오)으로 구분되어
 * 혼동 위험은 낮다고 판단.
 *
 * 3개 후보를 생성해 비교 후 하나를 canonical reference로 확정한다.
 */

const BULL_BASE_NOTE =
  "A cute 3D-rendered chibi-style mascot character shaped like a bull (cow), with a golden " +
  "metallic/glossy body (rich warm gold color, like polished brass or gold bullion), large " +
  "expressive round eyes, a friendly confident smile, small golden horns, a small ring in the " +
  "nose (like a bull ring, in a slightly darker gold/bronze tone), stubby arms and legs, no human " +
  "clothing on the body itself except where noted below. The character should feel energetic, " +
  "fast, and confident — like a stock market \"bull run\" symbol, but still warm and approachable, " +
  "not aggressive or angry.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "bull_character_design_spec_v1",
  episode: 0,
  character: "bull_design_candidates",
  title: "황소특보 캐릭터 디자인 후보",
  slides: [
    {
      id: "candidate_a_news_desk",
      file: "candidate_a_news_desk.png",
      withCharacter: false,
      prompt:
        `Create a vertical 1080x1920px canonical character reference image (full body, front-facing, ` +
        `centered, clean studio lighting) for a Korean finance Shorts mascot. ${BULL_BASE_NOTE}\n\n` +
        `Style accent: wearing a small dark navy vest (waistcoat) over the chest like a news anchor, ` +
        `no shirt or tie underneath (bare golden chest showing through the open vest), giving a ` +
        `"market anchor" feel similar to a financial news host.\n\n` +
        `Background: a modern financial newsroom/trading-floor studio — dark navy background with a ` +
        `glowing stock ticker tape scrolling along the bottom (abstract numbers and small arrows, ` +
        `illegible, decorative only), a soft blurred world map or candlestick chart graphic behind, ` +
        `cool blue studio lighting with warm rim light on the character.\n\n` +
        `The character stands confidently with one front leg slightly forward, like mid-stride, ` +
        `conveying speed and momentum. Full body visible, no text overlays.\n\n` +
        `Style: same polished 3D-render quality as a Pixar/Disney mascot, photorealistic studio ` +
        `background, sharp focus on the character.`,
    },
    {
      id: "candidate_b_pure_mascot",
      file: "candidate_b_pure_mascot.png",
      withCharacter: false,
      prompt:
        `Create a vertical 1080x1920px canonical character reference image (full body, front-facing, ` +
        `centered, clean studio lighting) for a Korean finance Shorts mascot. ${BULL_BASE_NOTE}\n\n` +
        `No clothing at all — pure mascot design, similar in spirit to a simple gold coin mascot but ` +
        `shaped like a bull instead. Keep the design clean and iconic, easy to recognize at small ` +
        `thumbnail size.\n\n` +
        `Background: a simple soft gradient background (warm cream to light gold), minimal, no props, ` +
        `no scene — just the character on a plain backdrop, similar to a clean product/mascot shot.\n\n` +
        `Style: same polished 3D-render quality as a Pixar/Disney mascot, soft studio lighting, sharp ` +
        `focus on the character, no text.`,
    },
    {
      id: "candidate_c_trading_floor",
      file: "candidate_c_trading_floor.png",
      withCharacter: false,
      prompt:
        `Create a vertical 1080x1920px canonical character reference image (full body, front-facing, ` +
        `centered, clean studio lighting) for a Korean finance Shorts mascot. ${BULL_BASE_NOTE}\n\n` +
        `Style accent: no clothing on the body, but holding a small handheld card/tablet-like prop in ` +
        `one hand showing an abstract rising bar chart with a small upward arrow (illegible numbers, ` +
        `decorative only, colors green and gold).\n\n` +
        `Background: a bright, energetic trading-floor scene with large soft-focus screens showing ` +
        `abstract stock charts and tickers (illegible), warm gold and white lighting, a subtle sense ` +
        `of motion/speed (soft light streaks), daytime bright mood rather than a dark studio.\n\n` +
        `The character has a confident, slightly excited expression, one front leg raised as if about ` +
        `to charge forward — conveying momentum and urgency of breaking market news.\n\n` +
        `Style: same polished 3D-render quality as a Pixar/Disney mascot, photorealistic bright ` +
        `background, sharp focus on the character, no text.`,
    },
  ],
});
