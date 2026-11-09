/**
 * 부엉이 카드뉴스 7편(3배 레버리지 ETF, 이달 1.1조 다시 몰린 이유) 슬라이드 스펙.
 * 원본 영상: scripts/_owl-ep7-assembly-spec.mjs (완성, C:/tmp/owl-ep7-episode-final/owl_episode_final.mp4).
 *
 * 게시는 7편 영상이 실제 배포되는 날 세트로 진행한다(Owner 확정 원칙) — 이미지는
 * 미리 만들어 저장만 해둔다.
 *
 * 밝은 배경 톤 적용(Owner 2026-09-19: "카드뉴스가 너무 어둡다, 앞으론 조금 더
 * 밝은 느낌이었으면 좋겠어 — 너무 어두울 필요는 없는 거 같아"). 1~6편은 dark
 * navy 오버레이(50~55% 불투명도)를 썼는데, 이 지적 이후 첫 신규 편인 7편부터
 * 밝은 톤 오버레이로 전환한다 — 어두운 네이비 대신 밝은 회백색/연한 네이비
 * 오버레이를 낮은 불투명도로 깔아 배경이 눈에 잘 보이게 한다.
 *
 * 배경은 7편 영상과 통일해 홈트레이딩 데스크(1~6편 카드뉴스에 없던 공간)로 설정.
 *
 * 1~6편 스펙의 배지 규칙·하단 텍스트 제거·무브랜드 원칙을 그대로 승계.
 */

const BADGE_RULE =
  "Top-left corner: a large rounded yellow badge (#FFD54A), noticeably big and prominent " +
  "(bigger than a normal UI badge, roughly 20% of the image width), containing bold dark " +
  "navy blue (#14213D) Korean text \"경제번역소\". Do not add any text at the bottom of the image.";

const OWL_CHARACTER_NOTE =
  "Include the same 3D-rendered chibi owl mascot character from the attached reference image " +
  "exactly as shown — same face, feathers, glasses, vest, tie. Do not change its design.";

// 밝은 톤 오버레이 — 어두운 네이비 대신 밝은 회백색을 낮은 불투명도로. 배경이
// 잘 보이면서도 흰 텍스트가 읽히도록 텍스트 자체는 검정 아웃라인을 함께 쓴다.
const BRIGHT_OVERLAY_NOTE =
  "with a light, bright semi-transparent overlay (warm off-white/light gray, about 25-30% " +
  "opacity, NOT a dark navy overlay) so the background stays clearly visible and airy, not moody " +
  "or dim.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cardnews_spec_v1",
  episode: 7,
  title: "이달 3배 레버리지 ETF에 1.1조 다시 몰렸다는 거 알아?",
  slides: [
    {
      id: "cover",
      file: "01_ep7_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a bright, well-lit home trading desk with ` +
        `large monitors showing candlestick charts (blurred, numbers illegible), softly blurred, ` +
        `warm daylight tone, ${BRIGHT_OVERLAY_NOTE}\n\n` +
        `Position the owl character on the right side of the frame, holding up a smartphone with a ` +
        `surprised but confident expression, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold navy/dark text (#14213D) with a thin white outline for contrast ` +
        `against the bright background, exactly as written, no typos:\n` +
        `"이달 3배 레버리지 ETF에\n1.1조 다시\n몰렸다는 거 알아?"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, bright and clean, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_ep7_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a bright home trading desk with a monitor ` +
        `showing an upward-trending bar chart (blurred, numbers illegible), softly blurred, warm ` +
        `daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real brand name/logo — plain anonymous ` +
        `surfaces and generic charts only.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 3 numbered points stacked vertically: large bold yellow numbers (1, 2, 3) ` +
        `on the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key numbers/phrases highlighted in blue (#1B6FD1). Render the Korean text ` +
        `EXACTLY as written, no typos:\n\n` +
        `1. 한국예탁결제원 집계로\n반도체 3배 레버리지 ETF 순매수 전환\n\n` +
        `2. 많은 사람들이 3배 ETF라고 하면\n수익을 3배로 불릴 수 있다는 점만 보고 몰림\n\n` +
        `3. 핵심은 단기 수익만이 아니라\n배율만큼 손실도 커지는 구조\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_ep7_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a calculator next to a declining bar chart on ` +
        `a bright desk, softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real ` +
        `brand name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (4, 5) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key numbers/phrases highlighted in blue (#1B6FD1) and risk/warning phrases in ` +
        `red (#D93A3A). Render the Korean text EXACTLY as written, no typos:\n\n` +
        `4. 지수 10% 빠지면\n3배 ETF 잔고는 30% 가까이 빠짐\n\n` +
        `5. 반복되면 원금이\n순식간에 사라질 수 있는 구조\n\n` +
        `Double-check point 4's second line character by character: it must read exactly ` +
        `"3배 ETF 잔고는 30% 가까이 빠짐" — do not substitute or drop any character.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "closing",
      file: "04_ep7_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram carousel card, 1080x1350px, the LAST slide of a 4-slide ` +
        `Korean finance carousel post (cover, body1, body2 already exist — this is slide 4/4, a ` +
        `text-heavy call-to-action card, NOT a character portrait or wallpaper). ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a bright home office desk scene with a laptop showing a simple green upward ` +
        `line chart (blurred, numbers illegible), a coffee cup, and a potted plant, softly blurred, ` +
        `warm daylight tone, ${BRIGHT_OVERLAY_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `This slide MUST contain large printed Korean text overlaid on the image — treat it like a ` +
        `news headline graphic, not a photo. Layout, top to bottom:\n` +
        `1) The yellow badge (top-left, as specified above)\n` +
        `2) A large bold yellow word with dark outline: "팔로우"\n` +
        `3) Below it, bold white text with black outline: "다음 소식도 먼저"\n` +
        `4) Below that, bold dark navy text (#14213D) with white outline, three lines exactly as ` +
        `written, no typos:\n"레버리지에 넣을 자금이\n대출이나 급전은 아닌지\n오늘부터 점검해보기"\n\n` +
        `Position the owl character standing on the lower-right of the frame, smaller scale (about ` +
        `35% of image height), waving one wing, positioned so it does NOT overlap or cover any of ` +
        `the text blocks above.\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `carousel closing card, bright and clean, high contrast, photorealistic background.`,
    },
  ],
});
