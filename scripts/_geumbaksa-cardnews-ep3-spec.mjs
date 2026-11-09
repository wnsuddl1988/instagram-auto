/**
 * 금박사 카드뉴스 3편(레버리지 원리·리스크) 슬라이드 스펙.
 * 원본 영상: scripts/_geumbaksa-ep3-assembly-spec.mjs (완성,
 * C:/tmp/geumbaksa-ep3-episode-final-v2/owl_episode_final.mp4).
 *
 * 실제 배포 편수는 4편이다(2026-09-20 Owner 확정) — 환율 소재를 실질적
 * 1편으로 신설하며 이 편(레버리지)이 한 칸 뒤로 밀렸다. 파일명은 그대로 두고
 * 배포 시 캡션·헤더 타이틀·게시 순서에서만 "4편"으로 표기한다.
 *
 * 게시는 4편 영상이 실제 배포되는 날 세트로 진행한다(Owner 확정 원칙) — 이미지는
 * 미리 만들어 저장만 해둔다.
 *
 * 1·2편 스펙의 배지 규칙·하단 텍스트 제거·무브랜드 원칙을 그대로 승계.
 *
 * 정보량이 많은 편(10씬 표준 구조)이라 본문을 3장으로 나눈다:
 *   본문1(1~3): 레버리지 정의(내 돈+빌린 돈, 배율 개념)
 *   본문2(4~5): 접근성(레버리지 ETF도 검색으로 매매 가능) + 경각심(순매수 8조원)
 *   본문3(6~9): 작동원리(하루 등락률 배수)·리스크 사례(-2%→-17%)·변동성 끌림·재조정 비용
 * 마무리(10): 잘 쓰면 득, 잘못 쓰면 리스크 — 신중한 판단 촉구.
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
  episode: 3,
  character: "geumbaksa",
  title: "다들 무섭다고만 하는 레버리지, 정확히 뭘까",
  slides: [
    {
      id: "cover",
      file: "01_geumbaksa_ep3_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a warm, bright home-studio or cozy office ` +
        `space, softly blurred, with a subtle dark navy semi-transparent overlay (about 45% ` +
        `opacity) for text contrast.\n\n` +
        `Position the gold coin character on the right side of the frame, holding a small lever/ ` +
        `seesaw diagram card with a confident, slightly serious expression, not blocking the text ` +
        `area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold white/yellow headline text, exactly as written, no typos:\n` +
        `"다들 무섭다고만 하는\n레버리지\n정확히 뭘까"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional but friendly ` +
        `financial news headline card, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_geumbaksa_ep3_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of two stacks of cash bundles on a bright desk, ` +
        `or a lever/seesaw diagram illustration, softly blurred, with a dark navy semi-transparent ` +
        `overlay (about 55% opacity) for text contrast. No visible real brand name/logo — plain ` +
        `anonymous surfaces and generic icons only.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 3 numbered points stacked vertically: large bold yellow numbers (1, 2, 3) ` +
        `on the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `1. 내 돈 100만원에 빌린 돈 900만원,\n합치면 천만원짜리 베팅\n\n` +
        `2. 10%만 올라도\n내 돈 기준 수익률은 열 배\n\n` +
        `3. 레버리지, 수익도 손실도\n몇 배로 부풀리는 장치\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_geumbaksa_ep3_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a smartphone showing a simple stock trading ` +
        `app search screen, or a rising arrow chart with coin stacks, softly blurred, with a dark ` +
        `navy semi-transparent overlay (about 55% opacity) for text contrast. No visible real brand ` +
        `name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (4, 5) on ` +
        `the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `4. 레버리지 ETF도 원리는 똑같다,\n검색 한 번이면 매매 끝\n\n` +
        `5. 올해만 8조원,\n개인투자자가 레버리지 ETF에 쏟아부은 돈\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "body3",
      file: "04_geumbaksa_ep3_body3.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a declining zigzag line chart with a red ` +
        `warning tone, or gears turning with a cost icon, softly blurred, with a dark navy ` +
        `semi-transparent overlay (about 55% opacity) for text contrast. No visible real brand ` +
        `name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 4 numbered points stacked vertically: large bold yellow numbers (6, 7, 8, 9) ` +
        `on the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF) for neutral figures and in red (#FF5C5C) ` +
        `for loss/risk figures. Render the Korean text EXACTLY as written, no typos:\n\n` +
        `6. 지수 +3%, 2배는 +6%, 3배는 +9%,\n하루 등락률에만 곱해지는 배율\n\n` +
        `7. 지수는 겨우 -2%인데\n3배 ETF는 -17%까지 무너진 적도\n\n` +
        `8. 지수는 제자리로 돌아와도\n못 메우는 손실, 이름하여 변동성 끌림\n\n` +
        `9. 배율을 매일 다시 맞추는 값까지,\n3배는 연 12%, 2배는 연 6~7%\n\n` +
        `Double-check line by line, character by character — the numbers +6%, +9%, -2%, -17%, ` +
        `12%, 6~7% must be rendered EXACTLY as given, no digit substitutions.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "closing",
      file: "05_geumbaksa_ep3_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, closing slide for a Korean finance ` +
        `information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: same realistic warm home-studio or cozy office space as the cover slide, ` +
        `softly blurred, dark navy semi-transparent overlay (about 45% opacity).\n\n` +
        `Position the gold coin character on the right side of the frame, holding a balance scale ` +
        `with a green up-arrow on one side and a red down-arrow on the other, with a thoughtful, ` +
        `sincere expression — calm, not overly cheerful.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, bold white text, exactly as written, no typos:\n` +
        `"잘 쓰면 큰 수익,\n잘못 쓰면 큰 손실\n쓰기 전에 신중하게"\n\n` +
        `Below that, in bold yellow accent text:\n"팔로우하면 다음 소식도 먼저"\n\n` +
        `Style: bold sans-serif Korean font, warm but composed tone, professional financial news ` +
        `card, high contrast, photorealistic background.`,
    },
  ],
});
