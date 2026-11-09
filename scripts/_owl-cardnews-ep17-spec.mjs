/**
 * 부엉이 카드뉴스 17편(v2 재제작 — 2027년 최저임금 확정) 슬라이드 스펙.
 * 원본 영상: scripts/_owl-v2-ep17-assembly-spec.mjs.
 *
 * 문구는 영상 대본을 그대로 옮기지 않고 카피라이팅 문체로 재구성한다(전 편
 * 공통 원칙). 핵심 수치(시간당 10,700원, +380원, +3.7%, 최근 3년 최고,
 * 월 223만 6천 원, 실업급여 최저금액 연동 계산식)는 유지하되 문장은
 * 카드뉴스용으로 새로 쓴다.
 *
 * 배경은 17편 영상과 통일해 최저임금위원회 심의장으로 설정.
 *
 * 배경 텍스트 단순화 원칙, 밝은 배경 톤 원칙, 이전 편 스펙의 배지 규칙·하단
 * 텍스트 제거·무브랜드 원칙 동일 적용.
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
  episode: 17,
  character: "owl",
  title: "최저임금 올랐다는데, 나랑 상관없다고?",
  slides: [
    {
      id: "cover",
      file: "01_ep17_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a bright, well-lit minimum wage council ` +
        `chamber with a round committee table and a simple rising bar chart icon on a screen ` +
        `(blurred details elsewhere), softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} ` +
        `${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `Position the owl character on the right side of the frame, holding a small card with a ` +
        `rising arrow icon, confident and alarmed expression, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold navy/dark text (#14213D) with a thin white outline for contrast ` +
        `against the bright background, exactly as written, no typos:\n` +
        `"최저임금 올랐는데,\n나랑 상관없다고?"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, bright and clean, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_ep17_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a wage information board showing a simple ` +
        `rising bar chart icon and a coin stack icon side by side (blurred, illegible numbers), ` +
        `softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real institution ` +
        `logo — plain anonymous surfaces and generic icons only. ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (1, 2) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key numbers/phrases highlighted in blue (#1B6FD1). Render the Korean text ` +
        `EXACTLY as written, no typos:\n\n` +
        `1. 내년 최저임금이 시간당\n만 700원으로 확정됐어,\n올해보다 380원 올랐어\n\n` +
        `2. 인상률로 보면 3.7퍼센트,\n최근 3년 중\n가장 높은 수치야\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_ep17_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a simple formula icon on an information board ` +
        `showing a multiplication symbol and a linking arrow between two boxes (blurred details ` +
        `elsewhere), softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real ` +
        `institution logo. ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (3, 4) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key phrases highlighted in red (#D93A3A) for the impact point. Render the ` +
        `Korean text EXACTLY as written, no typos:\n\n` +
        `3. 실업급여 최저 금액도\n이 최저임금 기준으로\n정해지거든\n\n` +
        `4. 최저임금이 오르면,\n내가 받을 실업급여\n최저 금액도 같이 올라가\n\n` +
        `Double-check the text character by character: the words "실업급여", "최저임금" must be ` +
        `rendered exactly as written — do not substitute or drop any character.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "closing",
      file: "04_ep17_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram carousel card, 1080x1350px, the LAST slide of a 4-slide ` +
        `Korean finance carousel post (cover, body1, body2 already exist — this is slide 4/4, a ` +
        `text-heavy call-to-action card, NOT a character portrait or wallpaper). ` +
        `${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a bright minimum wage council chamber scene with a small committee table icon ` +
        `(blurred, illegible), softly blurred, warm daylight tone, ` +
        `${BRIGHT_OVERLAY_NOTE} ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `This slide MUST contain large printed Korean text overlaid on the image — treat it like a ` +
        `news headline graphic, not a photo. Layout, top to bottom:\n` +
        `1) The yellow badge (top-left, as specified above)\n` +
        `2) A large bold yellow word with dark outline: "팔로우"\n` +
        `3) Below it, bold white text with black outline: "다음 소식도 먼저"\n` +
        `4) Below that, bold dark navy text (#14213D) with white outline, three lines exactly as ` +
        `written, no typos:\n"당장 상관없어 보여도,\n퇴사하거나 실직하면\n이 숫자가 내 얘기가 돼"\n\n` +
        `Position the owl character standing on the lower-right of the frame, smaller scale (about ` +
        `35% of image height), waving one wing, positioned so it does NOT overlap or cover any of ` +
        `the text blocks above.\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `carousel closing card, bright and clean, high contrast, photorealistic background.`,
    },
  ],
});
