/**
 * 금박사 카드뉴스 1편(IRP 세액공제, 나라가 세금까지 깎아주는 노후 통장) 슬라이드 스펙.
 * 원본 영상: scripts/_geumbaksa-assembly-spec.mjs (완성, C:/tmp/geumbaksa-ep1-FINAL-v2.mp4).
 *
 * 실제 배포 편수는 2편이다(2026-09-20 Owner 확정) — 환율 소재를 실질적
 * 1편으로 신설하며 이 편(IRP)이 한 칸 뒤로 밀렸다. 파일명은 그대로 두고
 * 배포 시 캡션·헤더 타이틀·게시 순서에서만 "2편"으로 표기한다.
 *
 * 부엉이 카드뉴스 스펙(_owl-cardnews-epN-spec.mjs)과 동일한 배지 규칙·하단 텍스트
 * 제거·무브랜드 원칙을 쓰되, 등장 캐릭터는 금박사(coin3dv1)로 교체한다.
 * 정보량이 많은 편(9씬 표준 구조 전체)이라 본문을 3장으로 나눈다.
 */

const BADGE_RULE =
  "Top-left corner: a large rounded yellow badge (#FFD54A), noticeably big and prominent " +
  "(bigger than a normal UI badge, roughly 20% of the image width), containing bold dark " +
  "navy blue (#14213D) Korean text \"경제번역소\". Do not add any text at the bottom of the image.";

const GEUMBAKSA_CHARACTER_NOTE =
  "Include the same 3D-rendered gold coin mascot character from the attached reference image " +
  "exactly as shown — same golden metallic disc-shaped body, same friendly smiling face, no " +
  "clothing. Do not change its design.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cardnews_spec_v1",
  episode: 1,
  character: "geumbaksa",
  title: "IRP, 알고 보면 나라가 세금까지 깎아주는 내 노후 통장이라는 거 알아?",
  slides: [
    {
      id: "cover",
      file: "01_geumbaksa_ep1_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a warm, bright home-studio or cozy office ` +
        `space, softly blurred, with a subtle dark navy semi-transparent overlay (about 45% ` +
        `opacity) for text contrast.\n\n` +
        `Position the gold coin character on the right side of the frame, in a cheerful, welcoming ` +
        `pose, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold white/yellow headline text, exactly as written, no typos:\n` +
        `"IRP, 알고 보면\n나라가 세금까지 깎아주는\n내 노후 통장이라는 거 알아?"\n\n` +
        `Double-check the second line character by character: it must read exactly "나라가 세금까지 ` +
        `깎아주는" — the word is "깎아주는" (gives/cuts for you), not "깎아추는" (not a real word). ` +
        `Do not substitute any character.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional but friendly ` +
        `financial news headline card, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_geumbaksa_ep1_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a piggy bank or savings passbook on a desk, ` +
        `softly blurred, with a dark navy semi-transparent overlay (about 55% opacity) for text ` +
        `contrast. No visible real bank or company brand name/logo — plain anonymous surfaces and ` +
        `generic text only.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 3 numbered points stacked vertically: large bold yellow numbers (1, 2, 3) ` +
        `on the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `1. 넣을수록 세금을 돌려주는\n내가 직접 굴리는 은퇴 저금통\n\n` +
        `2. 직장인도 자영업자도 프리랜서도,\n소득만 있으면 문은 열려 있다\n\n` +
        `3. 은행이든 증권사든 앱 하나면 신청 끝,\n예금부터 ETF까지 내 손으로\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_geumbaksa_ep1_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a tax refund calculation document or a ` +
        `calculator with Korean won banknotes, softly blurred, with a dark navy semi-transparent ` +
        `overlay (about 55% opacity) for text contrast. No visible real brand name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (4, 5) on ` +
        `the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `4. 1년에 넣을 수 있는 한도, 900만원\n\n` +
        `5. 총급여 5,500만원 이하는 15%,\n넘어도 12%는 돌려받는다\n\n` +
        `Double-check line by line, character by character — the numbers 900만원, 5,500만원, 15%, ` +
        `12% must be rendered EXACTLY as given, no digit substitutions.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "body3",
      file: "04_geumbaksa_ep1_body3.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a growth chart or a retirement savings jar ` +
        `filling up over time concept, softly blurred, with a dark navy semi-transparent overlay ` +
        `(about 55% opacity) for text contrast. No visible real brand name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (6, 7) on ` +
        `the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `6. 한도를 다 채우면 환급금 최대 135만원,\n한 달로 나누면 75만원씩\n\n` +
        `7. 20년을 이렇게 모으면\n원금 1억 8천만원에 환급금까지 더해진다\n\n` +
        `Double-check line by line, character by character — the numbers 900만원, 135만원, 75만원, ` +
        `1억 8천만원, 20년 must be rendered EXACTLY as given, no digit substitutions.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "closing",
      file: "05_geumbaksa_ep1_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, closing slide for a Korean finance ` +
        `information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: same realistic warm home-studio or cozy office space as the cover slide, ` +
        `softly blurred, dark navy semi-transparent overlay (about 45% opacity).\n\n` +
        `Position the gold coin character on the right side of the frame, in a warm, friendly, ` +
        `waving or welcoming pose.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, bold white text, exactly as written, no typos:\n` +
        `"나라가 세금까지 깎아주는\n내 노후 통장, IRP\n오늘 가입 여부 확인해보기"\n\n` +
        `Below that, in bold yellow accent text:\n"팔로우하면 다음 소식도 먼저"\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `card, high contrast, photorealistic background.`,
    },
  ],
});
