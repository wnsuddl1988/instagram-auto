/**
 * 금박사 카드뉴스 5편(신용점수) 슬라이드 스펙.
 * 원본 영상: scripts/_geumbaksa-ep5-assembly-spec.mjs (완성,
 * C:/tmp/geumbaksa-ep5-assembly-v1/owl_shorts_final.mp4).
 *
 * 1~4편 스펙의 배지 규칙·하단 텍스트 제거·무브랜드 원칙을 그대로 승계.
 *
 * 10씬 구조를 본문 3장으로 나눈다:
 *   본문1(1~3): 체감 상황(대출금리 차이)+한 줄 정리(1~1000점)+평가 항목(4대 요소)
 *   본문2(4~6): 제도 배경(등급제→점수제)+핵심 수치(연체 기록 3/5년)+실제 영향(대출한도·금리·카드심사)
 *   본문3(7~9): 오해 바로잡기(조회 무관, 2011년부터)+액션 팁(성실납부 기록 제출)
 * 카피라이팅 문체로 재작성(영상 대본 재탕 금지 원칙 준수).
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
  episode: 5,
  character: "geumbaksa",
  title: "신용점수, 대체 뭘 보고 매기는 걸까",
  slides: [
    {
      id: "cover",
      file: "01_geumbaksa_ep5_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a warm, bright home-office or cozy study ` +
        `space, softly blurred, with a subtle dark navy semi-transparent overlay (about 45% ` +
        `opacity) for text contrast.\n\n` +
        `Position the gold coin character on the right side of the frame, holding a small card ` +
        `with a credit-score gauge icon (colorful arc from red to green), curious and confident ` +
        `expression, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold white/yellow headline text, exactly as written, no typos:\n` +
        `"신용점수\n대체 뭘 보고\n매기는 걸까"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional but friendly ` +
        `financial news headline card, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_geumbaksa_ep5_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of two loan comparison documents side by side ` +
        `on a desk, softly blurred, with a dark navy semi-transparent overlay (about 55% opacity) ` +
        `for text contrast. No visible real brand name/logo — plain anonymous surfaces and generic ` +
        `icons only.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 3 numbered points stacked vertically: large bold yellow numbers (1, 2, 3) ` +
        `on the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `1. 같은 금액을 빌려도\n누군가는 낮은 금리, 누군가는 훨씬 높은 금리\n\n` +
        `2. 그 차이를 가르는 숫자,\n1점부터 1000점까지 매겨지는 신용점수\n\n` +
        `3. 상환 이력, 부채 수준,\n거래 기간, 거래 형태 — 이 네 가지로 결정된다\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_geumbaksa_ep5_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a calendar and a credit report document on a ` +
        `desk, softly blurred, with a dark navy semi-transparent overlay (about 55% opacity) for ` +
        `text contrast. No visible real brand name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 3 numbered points stacked vertically: large bold yellow numbers (4, 5, 6) ` +
        `on the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `4. 2021년부터는 등급이 아니라\n점수로 촘촘하게 매기는 방식으로 바뀌었다\n\n` +
        `5. 연체는 갚아도 끝이 아니다,\n단기 최대 3년 장기 최장 5년 기록이 남는다\n\n` +
        `6. 대출 한도, 대출 금리,\n카드 발급 심사까지 이 점수 하나로 갈린다\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "body3",
      file: "04_geumbaksa_ep5_body3.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a smartphone showing a credit check app screen ` +
        `next to utility bills, softly blurred, with a dark navy semi-transparent overlay (about ` +
        `55% opacity) for text contrast. No visible real brand name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (7, 8) ` +
        `on the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `7. '조회만 해도 깎인다'는 말,\n2011년부터는 사실이 아니다\n\n` +
        `8. 통신비·공공요금 성실납부 기록을 제출하면\n신용점수 회복에 도움이 된다\n\n` +
        `Double-check line by line, character by character — the year 2011년 must be rendered ` +
        `EXACTLY as given, no digit substitutions.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "closing",
      file: "05_geumbaksa_ep5_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, closing slide for a Korean finance ` +
        `information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: same realistic warm home-office or cozy study space as the cover slide, ` +
        `softly blurred, dark navy semi-transparent overlay (about 45% opacity).\n\n` +
        `Position the gold coin character on the right side of the frame, gently holding a ` +
        `credit-score gauge prop close to its body, warm and content expression.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, bold white text, exactly as written, no typos:\n` +
        `"신용점수는 대출 받을 때만\n보는 숫자가 아니라\n평소에 관리해야 하는 신뢰도"\n\n` +
        `Below that, in bold yellow accent text:\n"팔로우하면 다음 소식도 먼저"\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `card, high contrast, photorealistic background.`,
    },
  ],
});
