/**
 * 부엉이 카드뉴스 16편(v2 재제작 — 퇴직연금 실물이전) 슬라이드 스펙.
 * 원본 영상: scripts/_owl-v2-ep16-assembly-spec.mjs.
 *
 * 문구는 영상 대본을 그대로 옮기지 않고 카피라이팅 문체로 재구성한다(전 편
 * 공통 원칙). 핵심 수치(상반기 6.9조 원, 은행→증권사, 같은 종류 계좌만,
 * DB→DB·DC→DC·IRP→IRP, DC형→타사 IRP는 아직 추진 중, 리츠·ELS 등 예외
 * 상품)는 유지하되 문장은 카드뉴스용으로 새로 쓴다.
 *
 * 배경은 16편 영상과 통일해 퇴직연금 상담 데스크로 설정.
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
  episode: 16,
  character: "owl",
  title: "퇴직연금 계좌, 팔지 않고 그대로 옮길 수 있다",
  slides: [
    {
      id: "cover",
      file: "01_ep16_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a bright, well-lit retirement-pension ` +
        `consultation lounge with a reception desk and simple pension-related icons on a screen ` +
        `(blurred details elsewhere), softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} ` +
        `${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `Position the owl character on the right side of the frame, holding a small card with a ` +
        `rightward arrow icon, confident and surprised expression, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold navy/dark text (#14213D) with a thin white outline for contrast ` +
        `against the bright background, exactly as written, no typos:\n` +
        `"퇴직연금 계좌,\n안 팔고 옮긴다고?"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, bright and clean, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_ep16_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a pension information board showing a simple ` +
        `rising bar chart icon and a rightward arrow icon side by side (blurred, illegible ` +
        `numbers), softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real ` +
        `institution logo — plain anonymous surfaces and generic icons only. ` +
        `${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (1, 2) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key numbers/phrases highlighted in blue (#1B6FD1). Render the Korean text ` +
        `EXACTLY as written, no typos:\n\n` +
        `1. 예전엔 퇴직연금 계좌를 옮기려면\n갖고 있던 상품을 전부 팔아서\n현금으로만 옮겨야 했어\n\n` +
        `2. 2년 전부터는 펀드나 ETF를\n팔지 않고 상품 그대로\n옮기는 실물이전이 생겼어\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_ep16_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a simple three-row table icon on an ` +
        `information board showing three short arrows (blurred details elsewhere), softly blurred, ` +
        `warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real institution logo. ` +
        `${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (3, 4) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key phrases highlighted in red (#D93A3A) for the impact point. Render the ` +
        `Korean text EXACTLY as written, no typos:\n\n` +
        `3. 올해 상반기에만 6조 9천억 원이\n은행에서 증권사로\n실물이전됐어\n\n` +
        `4. 단, 같은 종류 계좌 안에서만 가능해\nDB는 DB끼리, DC는 DC끼리,\nIRP는 IRP끼리만 옮길 수 있어\n\n` +
        `Double-check the text character by character: the numbers "6조 9천억 원", "DB", "DC", ` +
        `"IRP" must be rendered exactly as written — do not substitute or drop any character.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "closing",
      file: "04_ep16_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram carousel card, 1080x1350px, the LAST slide of a 4-slide ` +
        `Korean finance carousel post (cover, body1, body2 already exist — this is slide 4/4, a ` +
        `text-heavy call-to-action card, NOT a character portrait or wallpaper). ` +
        `${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a bright retirement-pension consultation lounge scene with a small reception ` +
        `desk icon (blurred, illegible), softly blurred, warm daylight tone, ` +
        `${BRIGHT_OVERLAY_NOTE} ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `This slide MUST contain large printed Korean text overlaid on the image — treat it like a ` +
        `news headline graphic, not a photo. Layout, top to bottom:\n` +
        `1) The yellow badge (top-left, as specified above)\n` +
        `2) A large bold yellow word with dark outline: "팔로우"\n` +
        `3) Below it, bold white text with black outline: "다음 소식도 먼저"\n` +
        `4) Below that, bold dark navy text (#14213D) with white outline, three lines exactly as ` +
        `written, no typos:\n"리츠나 ELS처럼\n아예 안 되는 상품도 있으니\n미리 확인은 꼭 해둬"\n\n` +
        `Position the owl character standing on the lower-right of the frame, smaller scale (about ` +
        `35% of image height), waving one wing, positioned so it does NOT overlap or cover any of ` +
        `the text blocks above.\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `carousel closing card, bright and clean, high contrast, photorealistic background.`,
    },
  ],
});
