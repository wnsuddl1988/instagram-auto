/**
 * 부엉이 카드뉴스 8편(투자경고 종목, 4건 중 1건 30% 급락) 슬라이드 스펙.
 * 원본 영상: scripts/_owl-ep8-assembly-spec.mjs (완성, C:/tmp/owl-ep8-assembly-v2/owl_shorts_final.mp4).
 *
 * 게시는 8편 영상이 실제 배포되는 날 세트로 진행한다(Owner 확정 원칙) — 이미지는
 * 미리 만들어 저장만 해둔다.
 *
 * 문구는 영상 대본을 그대로 옮기지 않고 카피라이팅 문체로 재구성한다(Owner
 * 2026-09-20: 금박사 1편 카드뉴스가 대본을 그대로 옮겨놓은 문제 지적 이후
 * 전 편 공통 원칙으로 확정). 영상 핵심 수치(1,548건/68%/398건/30%/41종목 중
 * 13종목)는 유지하되, 문장은 카드뉴스용으로 새로 쓴다.
 *
 * 배경은 8편 영상과 통일해 증권사 트레이딩룸/리서치 데스크(경고 알림창이 뜬
 * 대형 모니터)로 설정 — 1~7편 카드뉴스에 쓰지 않은 공간.
 *
 * 밝은 배경 톤 원칙(Owner 2026-09-19, 7편부터 적용) 계승. 1~6편 스펙의 배지
 * 규칙·하단 텍스트 제거·무브랜드 원칙도 동일하게 승계.
 */

const BADGE_RULE =
  "Top-left corner: a large rounded yellow badge (#FFD54A), noticeably big and prominent " +
  "(bigger than a normal UI badge, roughly 20% of the image width), containing bold dark " +
  "navy blue (#14213D) Korean text \"경제번역소\". Do not add any text at the bottom of the image.";

const OWL_CHARACTER_NOTE =
  "Include the same 3D-rendered chibi owl mascot character from the attached reference image " +
  "exactly as shown — same face, feathers, glasses, vest, tie. Do not change its design.";

const BRIGHT_OVERLAY_NOTE =
  "with a light, bright semi-transparent overlay (warm off-white/light gray, about 25-30% " +
  "opacity, NOT a dark navy overlay) so the background stays clearly visible and airy, not moody " +
  "or dim.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cardnews_spec_v1",
  episode: 8,
  title: "투자경고 뜬 종목, 4개 중 1개는 한 달 안에 30% 급락한다는 거 알아?",
  slides: [
    {
      id: "cover",
      file: "01_ep8_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a bright, well-lit securities trading room ` +
        `with large monitors showing a red "투자경고" warning alert and declining charts (blurred, ` +
        `numbers illegible), softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE}\n\n` +
        `Position the owl character on the right side of the frame, holding up a smartphone showing ` +
        `a small red warning icon, serious but confident expression, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold navy/dark text (#14213D) with a thin white outline for contrast ` +
        `against the bright background, exactly as written, no typos:\n` +
        `"투자경고 뜬 종목\n4개 중 1개는\n한 달 안에 30% 급락"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, bright and clean, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_ep8_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a securities trading room monitor showing a ` +
        `declining red bar chart next to a warning triangle icon (blurred, numbers illegible), ` +
        `softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real brand name/logo ` +
        `— plain anonymous surfaces and generic charts only.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (1, 2) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key numbers/phrases highlighted in blue (#1B6FD1). Render the Korean text ` +
        `EXACTLY as written, no typos:\n\n` +
        `1. 최근 3년간 투자경고·위험 지정\n1,548건 중 68%가 20거래일 안에 하락\n\n` +
        `2. 그중 398건, 4건 중 1건은\n30% 넘게 급락\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_ep8_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of two arrows pointing opposite directions (one ` +
        `down, one up) over a stock ticker board, softly blurred, warm daylight tone, ` +
        `${BRIGHT_OVERLAY_NOTE} No visible real brand name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 1 numbered point: a large bold yellow number (3) on the left, Korean text ` +
        `on the right in dark navy (#14213D) with white outline for readability, key phrases ` +
        `highlighted in red (#D93A3A) for the contradiction. Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `3. 8월 지정 41종목 중 13종목에서\n외국인·기관은 팔고\n개인만 사는 반대 매매\n\n` +
        `Double-check the text character by character: it must read exactly ` +
        `"8월 지정 41종목 중 13종목에서 외국인·기관은 팔고 개인만 사는 반대 매매" — do not ` +
        `substitute or drop any character.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "closing",
      file: "04_ep8_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram carousel card, 1080x1350px, the LAST slide of a 4-slide ` +
        `Korean finance carousel post (cover, body1, body2 already exist — this is slide 4/4, a ` +
        `text-heavy call-to-action card, NOT a character portrait or wallpaper). ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a bright securities trading room desk scene with a monitor showing a DART ` +
        `disclosure-style document icon (blurred, numbers illegible), a stack of books, softly ` +
        `blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `This slide MUST contain large printed Korean text overlaid on the image — treat it like a ` +
        `news headline graphic, not a photo. Layout, top to bottom:\n` +
        `1) The yellow badge (top-left, as specified above)\n` +
        `2) A large bold yellow word with dark outline: "팔로우"\n` +
        `3) Below it, bold white text with black outline: "다음 소식도 먼저"\n` +
        `4) Below that, bold dark navy text (#14213D) with white outline, three lines exactly as ` +
        `written, no typos:\n"보유 종목에 경고 딱지가 붙었다면\n지정 사유부터 확인하고\n근거 있는 판단인지 점검해보기"\n\n` +
        `Position the owl character standing on the lower-right of the frame, smaller scale (about ` +
        `35% of image height), waving one wing, positioned so it does NOT overlap or cover any of ` +
        `the text blocks above.\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `carousel closing card, bright and clean, high contrast, photorealistic background.`,
    },
  ],
});
