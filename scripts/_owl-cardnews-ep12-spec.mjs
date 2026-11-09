/**
 * 부엉이 카드뉴스 12편(토지거래허가구역 실거주 유예 1년 연장, 갱신계약까지
 * 유예 인정) 슬라이드 스펙.
 * 원본 영상: scripts/_owl-ep12-assembly-spec.mjs.
 *
 * 게시는 12편 영상이 실제 배포되는 날 세트로 진행한다(Owner 확정 원칙, 9편부터
 * 계승) — 이미지는 미리 만들어 저장만 해둔다.
 *
 * 문구는 영상 대본을 그대로 옮기지 않고 카피라이팅 문체로 재구성한다(전 편
 * 공통 원칙, 8편부터 계승). 영상 핵심 수치(신청기한 1년 연장, 갱신계약 1회
 * 유예 인정, 최장 2029년 말, 무주택 유지, 입주 후 2년 거주)는 유지하되
 * 문장은 카드뉴스용으로 새로 쓴다.
 *
 * 배경은 12편 영상과 통일해 공인중개사 사무소 상담 공간으로 설정 — 1~11편
 * 카드뉴스에 쓰지 않은 새 공간.
 *
 * 배경 텍스트 단순화 원칙(10편부터 확립) 계승, 밝은 배경 톤 원칙(7편부터)
 * 계승, 1~11편 스펙의 배지 규칙·하단 텍스트 제거·무브랜드 원칙도 동일 적용.
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

const SIMPLE_BACKGROUND_NOTE =
  "Keep any background signage or screen text minimal and generic (short labels or icons only, " +
  "no full sentences) — this is a background detail, not the main message.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cardnews_spec_v1",
  episode: 12,
  character: "owl",
  title: "세입자 있는 집, 실거주 안 하고도 최장 2029년까지 산다",
  slides: [
    {
      id: "cover",
      file: "01_ep12_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a bright, well-lit real-estate agency ` +
        `office with a simple "부동산" wall sign (blurred details elsewhere), softly blurred, warm ` +
        `daylight tone, ${BRIGHT_OVERLAY_NOTE} ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `Position the owl character on the right side of the frame, holding a small house-key ` +
        `icon card with a confident, reassuring expression, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold navy/dark text (#14213D) with a thin white outline for contrast ` +
        `against the bright background, exactly as written, no typos:\n` +
        `"세입자 있는 집\n실거주 안 하고도\n최장 2029년까지\n산다"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, bright and clean, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_ep12_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a real-estate office information board ` +
        `showing a simple house icon next to a small clock icon (blurred, numbers illegible), ` +
        `softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real institution ` +
        `logo — plain anonymous surfaces and generic icons only. ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (1, 2) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key numbers/phrases highlighted in blue (#1B6FD1). Render the Korean text ` +
        `EXACTLY as written, no typos:\n\n` +
        `1. 토지거래허가구역에서\n집을 사면 원래\n4개월 안에 들어가서\n2년을 직접 살아야 해\n\n` +
        `2. 근데 이 규정 때문에\n집이 팔릴 때마다\n세입자가 쫓겨나면서\n전월세 물량이 줄어들었어\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_ep12_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a simple calendar/timeline diagram on an ` +
        `information board — an icon showing a calendar page with a "+1" arrow next to a house ` +
        `icon (blurred details elsewhere), softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} ` +
        `No visible real institution logo. ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 1 numbered point: a large bold yellow number (3) on the left, Korean text ` +
        `on the right in dark navy (#14213D) with white outline for readability, key phrases ` +
        `highlighted in red (#D93A3A) for the impact numbers. Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `3. 유예 신청 기한이\n1년 더 늘고, 세입자가\n계약 한 번 갱신하면\n최장 2029년 말까지\n입주를 미룰 수 있어\n\n` +
        `Double-check the text character by character: it must read exactly ` +
        `"유예 신청 기한이 1년 더 늘고, 세입자가 계약 한 번 갱신하면 최장 2029년 말까지 입주를 미룰 수 있어" — ` +
        `do not substitute or drop any character or digit.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "closing",
      file: "04_ep12_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram carousel card, 1080x1350px, the LAST slide of a 4-slide ` +
        `Korean finance carousel post (cover, body1, body2 already exist — this is slide 4/4, a ` +
        `text-heavy call-to-action card, NOT a character portrait or wallpaper). ` +
        `${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a bright real-estate agency office scene with a smartphone screen icon ` +
        `(blurred, illegible), a standing information sign, softly blurred, warm daylight tone, ` +
        `${BRIGHT_OVERLAY_NOTE} ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `This slide MUST contain large printed Korean text overlaid on the image — treat it like a ` +
        `news headline graphic, not a photo. Layout, top to bottom:\n` +
        `1) The yellow badge (top-left, as specified above)\n` +
        `2) A large bold yellow word with dark outline: "팔로우"\n` +
        `3) Below it, bold white text with black outline: "다음 소식도 먼저"\n` +
        `4) Below that, bold dark navy text (#14213D) with white outline, three lines exactly as ` +
        `written, no typos:\n"세입자 있는 집을 살 계획이라면\n유예 신청 기한이랑 대상 지역인지\n관할 구청에 확인해보기"\n\n` +
        `Position the owl character standing on the lower-right of the frame, smaller scale (about ` +
        `35% of image height), waving one wing, positioned so it does NOT overlap or cover any of ` +
        `the text blocks above.\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `carousel closing card, bright and clean, high contrast, photorealistic background.`,
    },
  ],
});
