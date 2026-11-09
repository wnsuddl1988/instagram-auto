/**
 * 부엉이 카드뉴스 4편(서울 12평 이하 아파트값 1년 새 15% 상승) 슬라이드 스펙.
 * 원본 영상: scripts/_owl-ep4-assembly-spec.mjs (게시 완료).
 *
 * 1~3편 스펙의 배지 규칙·하단 텍스트 제거·아파트 배경 무브랜드 원칙을 그대로 승계.
 */

const BADGE_RULE =
  "Top-left corner: a large rounded yellow badge (#FFD54A), noticeably big and prominent " +
  "(bigger than a normal UI badge, roughly 20% of the image width), containing bold dark " +
  "navy blue (#14213D) Korean text \"경제번역소\". Do not add any text at the bottom of the image.";

const OWL_CHARACTER_NOTE =
  "Include the same 3D-rendered chibi owl mascot character from the attached reference image " +
  "exactly as shown — same face, feathers, glasses, vest, tie. Do not change its design.";

const NO_BRAND_RULE =
  "Any apartment buildings, documents, or signage shown must have NO visible real brand name, " +
  "logo, or company signage of any kind — plain anonymous surfaces and generic text only.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cardnews_spec_v1",
  episode: 4,
  title: "서울에서 제일 작은 아파트가 제일 많이 올랐다는 거 알아?",
  slides: [
    {
      id: "cover",
      file: "01_ep4_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a Korean bank/investment consulting ` +
        `lounge interior, softly blurred, dark navy tone, with a subtle dark navy semi-transparent ` +
        `overlay (about 50% opacity) for text contrast.\n\n` +
        `Position the owl character on the right side of the frame, standing with a surprised but ` +
        `sharp expression, one wing raised near its head as if pointing out something unexpected, ` +
        `not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold white/yellow headline text, exactly as written, no typos:\n` +
        `"서울에서 제일 작은 아파트가\n제일 많이 올랐다는 거 알아?"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_ep4_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a small compact studio apartment interior or a ` +
        `generic Seoul apartment complex skyline, softly blurred, with a subtle overlay of a rising ` +
        `bar chart graphic, and a dark navy semi-transparent overlay (about 55% opacity) for text ` +
        `contrast. ${NO_BRAND_RULE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 3 numbered points stacked vertically: large bold yellow numbers (1, 2, 3) ` +
        `on the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `1. 서울 12평 이하 아파트값\n1년 새 15% 상승\n\n` +
        `2. 서울 아파트 전체 평균\n14.6%보다도 더 올랐다\n\n` +
        `3. 기준금리 3%까지 오른 상황에도\n거래는 중저가 소형에 집중\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_ep4_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image comparing a small apartment room and a spacious ` +
        `apartment room side by side, or a young first-time homebuyer looking worried at a laptop ` +
        `with real estate listings, softly blurred, with a dark navy semi-transparent overlay (about ` +
        `55% opacity) for text contrast. ${NO_BRAND_RULE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (4, 5) on ` +
        `the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF) and risk/warning phrases in red ` +
        `(#FF5F57). Render the Korean text EXACTLY as written, no typos:\n\n` +
        `4. 넓은 집보다 좁은 집에서\n상승 압력이 오히려 더 크다\n\n` +
        `5. 자금 부족한 실수요자일수록\n소형 평형 진입 장벽만 더 높아져\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "closing",
      file: "04_ep4_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, closing slide for a Korean finance ` +
        `information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: same realistic bank/investment lounge interior as the cover slide, softly ` +
        `blurred, dark navy semi-transparent overlay (about 50% opacity).\n\n` +
        `Position the owl character on the right side of the frame, standing warmly, one wing ` +
        `raised in a friendly gesture.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, bold white text, exactly as written, no typos:\n` +
        `"국토부 실거래가에서\n관심 평형\n오늘 확인해보기"\n\n` +
        `Below that, in bold yellow accent text:\n"팔로우하면 다음 소식도 먼저"\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `card, high contrast, photorealistic background.`,
    },
  ],
});
