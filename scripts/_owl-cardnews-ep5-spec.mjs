/**
 * 부엉이 카드뉴스 5편(한국은행 기준금리 3.00%, 11월 추가 인상 유력) 슬라이드 스펙.
 * 원본 영상: scripts/_owl-ep5-assembly-spec.mjs (완성, 배포 대기).
 *
 * 게시는 5편 영상이 실제 배포되는 날 세트로 진행한다(Owner 확정 원칙) — 이미지는
 * 미리 만들어 저장만 해둔다.
 *
 * 1~4편 스펙의 배지 규칙·하단 텍스트 제거·무브랜드 원칙을 그대로 승계.
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
  episode: 5,
  title: "한국은행이 11월에 기준금리를 또 올릴 수 있다는 거 알아?",
  slides: [
    {
      id: "cover",
      file: "01_ep5_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a Korean bank/investment consulting ` +
        `lounge interior, softly blurred, dark navy tone, with a subtle dark navy semi-transparent ` +
        `overlay (about 50% opacity) for text contrast.\n\n` +
        `Position the owl character on the right side of the frame, standing with a sharp, alert ` +
        `expression, one wing raised as if warning about something important, not blocking the ` +
        `text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold white/yellow headline text, exactly as written, no typos:\n` +
        `"한국은행이 11월에\n기준금리를 또 올릴 수\n있다는 거 알아?"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_ep5_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a central bank building facade or a financial ` +
        `market data screen showing rising rate/exchange-rate charts, softly blurred, with a dark ` +
        `navy semi-transparent overlay (about 55% opacity) for text contrast. No visible real bank ` +
        `or company brand name/logo — plain anonymous surfaces and generic charts only.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 3 numbered points stacked vertically: large bold yellow numbers (1, 2, 3) ` +
        `on the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `1. 한국은행 기준금리 현재 3.00%\n8월에 0.25%p 인상\n\n` +
        `2. 원달러 환율 1,380원 돌파\n집값·유가까지 겹쳐 인상 압력\n\n` +
        `3. 유가 85달러 안 꺾이면\n기준금리 3.5%까지 전망\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_ep5_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a person reviewing a loan document or stock ` +
        `market chart with a worried expression, softly blurred, with a dark navy semi-transparent ` +
        `overlay (about 55% opacity) for text contrast. No visible real brand name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (4, 5) on ` +
        `the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF) and risk/warning phrases in red ` +
        `(#FF5F57). Render the Korean text EXACTLY as written, no typos:\n\n` +
        `4. 변동금리 대출자 이자 부담↑\n국고채 금리 상승으로 자산시장도 부담\n\n` +
        `5. 대출자든 투자자든\n이 흐름 모르고 지나치면 손해\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "closing",
      file: "04_ep5_closing.png",
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
        `"변동금리 대출이라면\n고정금리 전환·수수료\n오늘 확인해보기"\n\n` +
        `Below that, in bold yellow accent text:\n"팔로우하면 다음 소식도 먼저"\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `card, high contrast, photorealistic background.`,
    },
  ],
});
