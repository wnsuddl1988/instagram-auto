/**
 * 부엉이 카드뉴스 18편(v2 — 전세사기 최소보장제, 2026-11-13 시행) 슬라이드 스펙.
 * 원본 영상: scripts/_owl-v2-ep18-assembly-spec.mjs.
 *
 * 문구는 영상 대본을 그대로 옮기지 않고 카피라이팅 문체로 재구성한다(전 편 공통 원칙).
 * 핵심 수치(11월 13일 시행, 보증금 3분의 1, 한도 5억·재량 최대 7억, 2027.5.31,
 * 결정일+3년)는 유지하되 문장은 카드뉴스용으로 새로 쓴다. 팩트는 2026-09-30에
 * 인천일보·헤럴드 등 원문으로 재대조했다.
 *
 * 배경은 18편 영상과 통일해 주거·임대차 법률상담 창구. 배경 텍스트 단순화 원칙, 밝은 배경
 * 톤 원칙, 배지 규칙·하단 텍스트 제거·무브랜드 원칙 동일 적용. 금박사 연결은 18편부터 폐지.
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
  episode: 18,
  character: "owl",
  title: "전세사기 보증금, 국가가 채워준다고?",
  slides: [
    {
      id: "cover",
      file: "01_ep18_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a bright, well-lit housing and lease legal ` +
        `consultation counter with a round desk and a simple house icon sign (blurred details ` +
        `elsewhere), softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} ` +
        `${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `Position the owl character on the right side of the frame, holding a small card with a ` +
        `shield icon, surprised and hopeful expression, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold navy/dark text (#14213D) with a thin white outline for contrast ` +
        `against the bright background, exactly as written, no typos:\n` +
        `"전세사기 보증금,\n국가가 채워준다고?"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, bright and clean, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_ep18_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of an information board showing a simple ` +
        `calendar icon and a house icon side by side (blurred, illegible details), softly blurred, ` +
        `warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real institution logo — plain ` +
        `anonymous surfaces and generic icons only. ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (1, 2) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key numbers/phrases highlighted in blue (#1B6FD1). Render the Korean text ` +
        `EXACTLY as written, no typos:\n\n` +
        `1. 11월 13일부터\n전세사기 최소보장제가\n시행돼\n\n` +
        `2. 돌려받은 돈과 지원금을\n합쳐도 보증금의 3분의 1에\n못 미치면 차액을 국가가 채워줘\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_ep18_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a simple checklist icon and a shield icon on ` +
        `an information board (blurred details elsewhere), softly blurred, warm daylight tone, ` +
        `${BRIGHT_OVERLAY_NOTE} No visible real institution logo. ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (3, 4) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key phrases highlighted in red (#D93A3A) for the impact point. Render the ` +
        `Korean text EXACTLY as written, no typos:\n\n` +
        `3. 피해자로 결정된 사람만\n해당돼, 보증금 한도는\n5억 원(재량 최대 7억)이야\n\n` +
        `4. 신청 기한은 인정 전이면\n2027년 5월 31일까지,\n인정 후면 결정일부터 3년이야\n\n` +
        `Double-check the text character by character: the words "전세사기", "보증금", "결정일" ` +
        `must be rendered exactly as written — do not substitute or drop any character.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "closing",
      file: "04_ep18_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram carousel card, 1080x1350px, the LAST slide of a 4-slide ` +
        `Korean finance carousel post (cover, body1, body2 already exist — this is slide 4/4, a ` +
        `text-heavy call-to-action card, NOT a character portrait or wallpaper). ` +
        `${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a bright housing and lease consultation counter scene with a small round desk ` +
        `icon (blurred, illegible), softly blurred, warm daylight tone, ` +
        `${BRIGHT_OVERLAY_NOTE} ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `This slide MUST contain large printed Korean text overlaid on the image — treat it like a ` +
        `news headline graphic, not a photo. Layout, top to bottom:\n` +
        `1) The yellow badge (top-left, as specified above)\n` +
        `2) A large bold yellow word with dark outline: "팔로우"\n` +
        `3) Below it, bold white text with black outline: "다음 소식도 먼저"\n` +
        `4) Below that, bold dark navy text (#14213D) with white outline, three lines exactly as ` +
        `written, no typos:\n"저장해 두고,\n신청하기 전에\n한 번 더 확인해"\n\n` +
        `Position the owl character standing on the lower-right of the frame, smaller scale (about ` +
        `35% of image height), waving one wing, positioned so it does NOT overlap or cover any of ` +
        `the text blocks above.\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `carousel closing card, bright and clean, high contrast, photorealistic background.`,
    },
  ],
});
