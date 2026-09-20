/**
 * 부엉이 카드뉴스 3편(서울 집값 84주 연속 상승, 전세난 역설) 슬라이드 스펙.
 * 원본 영상: scripts/_owl-ep3-assembly-spec.mjs (게시 완료).
 *
 * 1·2편 스펙의 배지 규칙·하단 텍스트 제거 원칙을 그대로 승계.
 * 2편 body1에서 배경 아파트에 실제 브랜드명(래미안/힐스테이트)이 노출된 사고가
 * 있어(2026-09-19), 이 편부터 아파트 배경을 쓰는 모든 슬라이드 프롬프트에
 * "no visible brand name/logo/signage" 조항을 기본으로 넣는다.
 */

const BADGE_RULE =
  "Top-left corner: a large rounded yellow badge (#FFD54A), noticeably big and prominent " +
  "(bigger than a normal UI badge, roughly 20% of the image width), containing bold dark " +
  "navy blue (#14213D) Korean text \"경제번역소\". Do not add any text at the bottom of the image.";

const OWL_CHARACTER_NOTE =
  "Include the same 3D-rendered chibi owl mascot character from the attached reference image " +
  "exactly as shown — same face, feathers, glasses, vest, tie. Do not change its design.";

const NO_BRAND_RULE =
  "Any apartment buildings, credit cards, documents, or signage shown must have NO visible real " +
  "brand name, logo, or company signage of any kind — plain anonymous surfaces and generic text only.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cardnews_spec_v1",
  episode: 3,
  title: "서울 집값 84주 연속 상승, 전세난은 왜 더 심해졌을까?",
  slides: [
    {
      id: "cover",
      file: "01_ep3_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a Korean bank/investment consulting ` +
        `lounge interior, softly blurred, dark navy tone, with a subtle dark navy semi-transparent ` +
        `overlay (about 50% opacity) for text contrast.\n\n` +
        `Position the owl character on the right side of the frame, standing with a serious, ` +
        `sharp expression, one wing pointing slightly upward as if presenting a surprising fact, ` +
        `not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold white/yellow headline text, exactly as written, no typos:\n` +
        `"서울 집값 84주 연속 상승,\n전세난은 왜 더 심해졌을까?"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_ep3_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a generic Seoul apartment complex skyline at ` +
        `dusk, softly blurred, with a subtle overlay of a rising line chart graphic, and a dark ` +
        `navy semi-transparent overlay (about 55% opacity) for text contrast. ${NO_BRAND_RULE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 3 numbered points stacked vertically: large bold yellow numbers (1, 2, 3) ` +
        `on the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `1. 서울 아파트값 84주 연속 상승\n역대 최장 기록에 근접\n\n` +
        `2. 그런데 강남 3구는\n오히려 6주째 하락 중\n\n` +
        `3. 역대 최장 기록\n2020.06 ~ 2022.01에 다가서는 중\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_ep3_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of an empty apartment for rent or a "for lease" ` +
        `door sign concept, or a person looking worried at a rental contract on a desk, softly ` +
        `blurred, with a dark navy semi-transparent overlay (about 55% opacity) for text contrast. ` +
        `${NO_BRAND_RULE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (4, 5) on ` +
        `the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF) and risk/warning phrases in red ` +
        `(#FF5F57). Render the Korean text EXACTLY as written, no typos:\n\n` +
        `4. 종부세·양도세·대출규제가\n실거주를 유도했는데\n\n` +
        `5. 오히려 전세 매물 품귀로\n전세난만 더 키운 역설\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "closing",
      file: "04_ep3_closing.png",
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
        `"전세 만료 앞뒀다면\n갱신청구권부터\n오늘 확인해보기"\n\n` +
        `Below that, in bold yellow accent text:\n"팔로우하면 다음 소식도 먼저"\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `card, high contrast, photorealistic background.`,
    },
  ],
});
