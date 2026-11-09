/**
 * 금박사 카드뉴스 2편(ETF 기초 개념) 슬라이드 스펙.
 * 원본 영상: scripts/_geumbaksa-ep2-assembly-spec.mjs (완성,
 * C:/tmp/geumbaksa-ep2-episode-final/owl_episode_final.mp4).
 *
 * 실제 배포 편수는 3편이다(2026-09-20 Owner 확정) — 환율 소재를 실질적
 * 1편으로 신설하며 이 편(ETF)이 한 칸 뒤로 밀렸다. 파일명은 그대로 두고
 * 배포 시 캡션·헤더 타이틀·게시 순서에서만 "3편"으로 표기한다.
 *
 * 게시는 2편 영상이 실제 배포되는 날 세트로 진행한다(Owner 확정 원칙) — 이미지는
 * 미리 만들어 저장만 해둔다.
 *
 * 1편 스펙의 배지 규칙·하단 텍스트 제거·무브랜드 원칙을 그대로 승계.
 *
 * [주의, 2026-09-21] 아래 "톤 전환 이슈 없음"은 배경 장소(거실·스튜디오)가
 * 처음부터 밝다는 뜻일 뿐, 텍스트 대비용 오버레이 자체는 이 스펙도 다크
 * 네이비 45% opacity를 그대로 쓴다. 부엉박사가 7편부터 전환한 "오버레이
 * 밝은 톤"은 금박사 1~5편 전부 아직 미적용 상태다 — 실제 현황과 다음 조치는
 * _ai/CURRENT_STANDARDS.md §2 "카드뉴스" 참고.
 *
 * 정보량이 많은 편(11씬 표준 구조 전체)이라 본문을 3장으로 나눈다.
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
  episode: 2,
  character: "geumbaksa",
  title: "주식은 아는데 ETF는 뭔지 모르겠다면",
  slides: [
    {
      id: "cover",
      file: "01_geumbaksa_ep2_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a warm, bright home-studio or cozy office ` +
        `space, softly blurred, with a subtle dark navy semi-transparent overlay (about 45% ` +
        `opacity) for text contrast.\n\n` +
        `Position the gold coin character on the right side of the frame, holding a small shopping ` +
        `basket icon card with a curious, welcoming expression, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold white/yellow headline text, exactly as written, no typos:\n` +
        `"주식은 아는데\nETF는 뭔지\n모르겠다면"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional but friendly ` +
        `financial news headline card, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_geumbaksa_ep2_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a shopping basket filled with various small ` +
        `items on a bright desk, or a smartphone showing a simple stock trading app, softly ` +
        `blurred, with a dark navy semi-transparent overlay (about 55% opacity) for text contrast. ` +
        `No visible real brand name/logo — plain anonymous surfaces and generic icons only.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 3 numbered points stacked vertically: large bold yellow numbers (1, 2, 3) ` +
        `on the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `1. 여러 종목을 바구니 하나에,\n그게 바로 ETF\n\n` +
        `2. 증권 계좌만 있으면\n누구나 실시간으로 사고판다\n\n` +
        `3. ETF 하나로\n국내 대표기업 200곳을 한 번에 담기도\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_geumbaksa_ep2_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of two comparison cards or a bright desk with a ` +
        `financial chart, softly blurred, with a dark navy semi-transparent overlay (about 55% ` +
        `opacity) for text contrast. No visible real brand name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (4, 5) on ` +
        `the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `4. 지수를 그대로 따라가는 패시브부터\n전문가가 고르는 액티브까지\n\n` +
        `5. 반도체만, 로봇만\n원하는 분야만 골라 담는 테마형까지\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "body3",
      file: "04_geumbaksa_ep2_body3.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a growth chart with a piggy bank, or coins ` +
        `stacking up over time, softly blurred, with a dark navy semi-transparent overlay (about ` +
        `55% opacity) for text contrast. No visible real brand name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (6, 7) on ` +
        `the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `6. 오래 담아둘수록 복리로 불어나고\n매달 분배금까지 챙기는 ETF도 있다\n\n` +
        `7. 연 2~20%대 분배율에\n26조원이 몰린 이유가 있다\n\n` +
        `Double-check line by line, character by character — the numbers 2~20%대, 26조원 must be ` +
        `rendered EXACTLY as given, no digit substitutions.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "closing",
      file: "05_geumbaksa_ep2_closing.png",
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
        `"위험은 나누고\n오래 담을수록 든든한 ETF\n오늘부터 알아보기"\n\n` +
        `Below that, in bold yellow accent text:\n"팔로우하면 다음 소식도 먼저"\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `card, high contrast, photorealistic background.`,
    },
  ],
});
