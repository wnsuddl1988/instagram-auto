/**
 * 부엉이 카드뉴스 6편(IRP 안전자산 30% 규정, 혼합형 ETF도 인정) 슬라이드 스펙.
 * 원본 영상: scripts/_owl-assembly-spec.mjs (완성, C:/tmp/owl-ep6-episode-final/owl_episode_final.mp4).
 *
 * 게시는 6편 영상이 실제 배포되는 날 세트로 진행한다(Owner 확정 원칙) — 이미지는
 * 미리 만들어 저장만 해둔다.
 *
 * 1~5편 스펙의 배지 규칙·하단 텍스트 제거·무브랜드 원칙을 그대로 승계.
 */

const BADGE_RULE =
  "Top-left corner: a large rounded yellow badge (#FFD54A), noticeably big and prominent " +
  "(bigger than a normal UI badge, roughly 20% of the image width), containing bold dark " +
  "navy blue (#14213D) Korean text \"경제번역소\". Do not add any text at the bottom of the image.";

const OWL_CHARACTER_NOTE =
  "Include the same 3D-rendered chibi owl mascot character from the attached reference image " +
  "exactly as shown — same face, feathers, glasses, vest, tie. Do not change its design.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cardnews_spec_v1",
  episode: 6,
  title: "IRP 안전자산 규정, 채권 말고 다른 것도 인정된다는 거 알아?",
  slides: [
    {
      id: "cover",
      file: "01_ep6_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a Korean securities/bank investment ` +
        `consulting lounge interior, softly blurred, dark navy tone, with a subtle dark navy ` +
        `semi-transparent overlay (about 50% opacity) for text contrast.\n\n` +
        `Position the owl character on the right side of the frame, holding up a small card with ` +
        `a surprised but confident expression, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold white/yellow headline text, exactly as written, no typos:\n` +
        `"IRP 안전자산 규정,\n채권 말고 다른 것도\n인정된다는 거 알아?"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_ep6_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a retirement pension account card or a ` +
        `financial planning document with a circular gauge chart, softly blurred, with a dark navy ` +
        `semi-transparent overlay (about 55% opacity) for text contrast. No visible real brand ` +
        `name/logo — plain anonymous surfaces and generic charts only.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 3 numbered points stacked vertically: large bold yellow numbers (1, 2, 3) ` +
        `on the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `1. IRP는 포트폴리오 최소 30%를\n안전자산으로 채워야 하는 규정\n\n` +
        `2. 많은 사람들이 이 규정 때문에\n채권형 상품만 담아야 한다고 오해\n\n` +
        `3. 실제로는 주식·채권 5대 5\n혼합형 ETF도 안전자산 인정\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_ep6_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a smartphone showing a fund/ETF product list ` +
        `screen, or a person reviewing investment portfolio options at a desk, softly blurred, with ` +
        `a dark navy semi-transparent overlay (about 55% opacity) for text contrast. No visible ` +
        `real brand name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (4, 5) on ` +
        `the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF) and risk/warning phrases in red ` +
        `(#FF5F57). Render the Korean text EXACTLY as written, no typos:\n\n` +
        `4. 채권으로만 이해하면\n쓸 수 있는 성장 수단을 스스로 좁히는 셈\n\n` +
        `5. 혼합형 ETF 편입 가능 여부\n오늘 상품 목록에서 먼저 확인\n\n` +
        `Double-check point 5's second line character by character: it must read exactly ` +
        `"오늘 상품 목록에서 먼저 확인" — the word is "먼저" (first/before), not "면저" ` +
        `(not a real word). Do not substitute any character.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "closing",
      file: "04_ep6_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, closing slide for a Korean finance ` +
        `information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: same realistic securities/bank investment consulting lounge interior as the ` +
        `cover slide, softly blurred, dark navy semi-transparent overlay (about 50% opacity).\n\n` +
        `Position the owl character on the right side of the frame, standing warmly, one wing ` +
        `raised in a friendly gesture.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, bold white text, exactly as written, no typos:\n` +
        `"채권형만 채워뒀다면\n자산 구성 비율\n오늘 재점검해보기"\n\n` +
        `Below that, in bold yellow accent text:\n"팔로우하면 다음 소식도 먼저"\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `card, high contrast, photorealistic background.`,
    },
  ],
});
