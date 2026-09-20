/**
 * 부엉이 카드뉴스 2편(가계부채 목표 근접인데 규제는 그대로) 슬라이드 스펙.
 * 원본 영상: scripts/_owl-ep2-assembly-spec.mjs (게시 완료).
 *
 * 1편 스펙(_owl-cardnews-ep1-spec.mjs)의 배지 규칙·하단 텍스트 제거 원칙을 그대로 승계.
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
  episode: 2,
  title: "가계부채 목표치 코앞인데, 대출 규제는 왜 그대로일까?",
  slides: [
    {
      id: "cover",
      file: "01_ep2_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a Korean bank/investment consulting ` +
        `lounge interior, softly blurred, dark navy tone, with a subtle dark navy semi-transparent ` +
        `overlay (about 50% opacity) for text contrast.\n\n` +
        `Position the owl character on the right side of the frame, standing with a thoughtful, ` +
        `slightly puzzled expression, one wing raised near its chin, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold white/yellow headline text, exactly as written, no typos:\n` +
        `"가계부채 목표치 코앞인데,\n대출 규제는 왜 그대로일까?"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_ep2_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a generic Korean city apartment skyline at ` +
        `dusk with a subtle overlay of a rising bar chart or gauge graphic suggesting a ratio ` +
        `approaching a target, softly blurred, with a dark navy semi-transparent overlay (about ` +
        `55% opacity) for text contrast. The apartment buildings must have NO visible brand name, ` +
        `logo, or signage of any kind — plain anonymous building facades only, no text on buildings.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 3 numbered points stacked vertically: large bold yellow numbers (1, 2, 3) ` +
        `on the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `1. 가계부채 비율 81.3%\n정부 목표 80%에 근접\n\n` +
        `2. 원래 2030년 목표였는데\n4년이나 앞당겨 달성 직전\n\n` +
        `3. 그런데도 당국은\n"총량 규제 계속 유지" 발표\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_ep2_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a world map or global ranking chart concept, ` +
        `or a person reviewing a loan document at a desk, softly blurred, with a dark navy ` +
        `semi-transparent overlay (about 55% opacity) for text contrast.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (4, 5) on ` +
        `the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF) and risk/warning phrases in red ` +
        `(#FF5F57). Render the Korean text EXACTLY as written, no typos:\n\n` +
        `4. 이유는 한국 가계부채가\n세계 9위로 여전히 많기 때문\n\n` +
        `5. 전문가들은 규제 유지가\n대출금리를 더 올릴 수 있다고 경고\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "closing",
      file: "04_ep2_closing.png",
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
        `"변동금리 대출이라면\n고정금리 전환\n오늘 검토해보기"\n\n` +
        `Below that, in bold yellow accent text:\n"팔로우하면 다음 소식도 먼저"\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `card, high contrast, photorealistic background.`,
    },
  ],
});
