/**
 * 부엉이 카드뉴스 1편(기준금리 인상→카드값 전가) 슬라이드 스펙.
 * 원본 영상: scripts/_owl-assembly-spec.mjs (EP1, 게시 완료).
 *
 * 배지 크기 확대 + 하단 채널명 제거(2026-09-19 Owner 피드백) 반영.
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
  episode: 1,
  title: "기준금리 0.25%p 올랐는데, 왜 내 카드 이자가 오르지?",
  slides: [
    {
      id: "cover",
      file: "01_ep1_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a Korean bank/investment consulting ` +
        `lounge interior, softly blurred, dark navy tone, with a subtle dark navy semi-transparent ` +
        `overlay (about 50% opacity) for text contrast.\n\n` +
        `Position the owl character on the right side of the frame, standing confidently with ` +
        `arms crossed, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold white/yellow headline text, exactly as written, no typos:\n` +
        `"기준금리 0.25%p 올랐는데,\n왜 내 카드 이자가 오르지?"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_ep1_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of Korean won banknotes, a generic unbranded ` +
        `credit card (no real bank or card company logo/name, plain solid color card), and a ` +
        `bank building sign, softly blurred, with a dark navy semi-transparent overlay (about 55% ` +
        `opacity) for text contrast.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 3 numbered points stacked vertically: large bold yellow numbers (1, 2, 3) ` +
        `on the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `1. 한국은행이 기준금리를 2.75%→3%로 인상\n\n` +
        `2. 카드사는 예금이 아니라 채권(여전채)으로 돈을 조달\n\n` +
        `3. 그 여전채 금리가 34개월 만에 최고치\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_ep1_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a person checking a credit card statement or ` +
        `smartphone banking app, softly blurred, with a dark navy semi-transparent overlay (about ` +
        `55% opacity) for text contrast.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (4, 5) on ` +
        `the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF) and risk/warning phrases in red ` +
        `(#FF5F57). Render the Korean text EXACTLY as written, no typos:\n\n` +
        `4. 결국 카드론 이자로 전가\n1,000만원 기준 연 2만 5천원↑\n\n` +
        `5. 특히 리볼빙은 금리 20% 육박\n마이너스통장에서만 6조원 추가 인출\n\n` +
        `Double-check point 4's second line character by character: it must read exactly ` +
        `"1,000만원 기준 연 2만 5천원↑" — the unit is "원" (currency), not "명" (people). ` +
        `Do not substitute any character.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "closing",
      file: "04_ep1_closing.png",
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
        `"카드 앱 열어서\n리볼빙 켜져 있는지\n지금 확인해보기"\n\n` +
        `Below that, in bold yellow accent text:\n"팔로우하면 다음 소식도 먼저"\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `card, high contrast, photorealistic background.`,
    },
  ],
});
