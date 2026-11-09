/**
 * 금박사 카드뉴스 8편(강남3구·용산만 토지거래허가구역인 줄 알았는데) 슬라이드 스펙.
 * 원본 영상: scripts/_geumbaksa-ep8-assembly-spec.mjs (완성,
 * C:/tmp/geumbaksa-ep8-episode-final-v3/owl_episode_final.mp4).
 *
 * 밝은 배경 톤 원칙(6편부터 적용) 계승, 문구는 카피라이팅 문체로 재구성(영상
 * 대본 그대로 옮기지 않음, 5편부터 확정 원칙). 8씬 구조를 본문 3장으로 압축:
 *   본문1(1~2): 확대된 지정 범위(강남3구·용산뿐 아니라 서울 거의 전역) +
 *     정의(계약 전 구청 허가 필수)
 *   본문2(3~4): 위반 시 처벌(무효·징역·벌금) + 실거주 2년 의무(투기 수요 차단 목적)
 *   본문3(5~6): 유예기간 확대(최장 3년 3개월) + 국토부 장관 직접 지정 권한(법 통과)
 */

const BADGE_RULE =
  "Top-left corner: a large rounded yellow badge (#FFD54A), noticeably big and prominent " +
  "(bigger than a normal UI badge, roughly 20% of the image width), containing bold dark " +
  "navy blue (#14213D) Korean text \"경제번역소\". Do not add any text at the bottom of the image.";

const GEUMBAKSA_CHARACTER_NOTE =
  "Include the same 3D-rendered gold coin mascot character from the attached reference image " +
  "exactly as shown — same golden metallic disc-shaped body, same friendly smiling face, no " +
  "clothing. Do not change its design.";

const BRIGHT_OVERLAY_NOTE =
  "with a light, bright semi-transparent overlay (warm off-white/light gray, about 25-30% " +
  "opacity, NOT a dark navy overlay) so the background stays clearly visible and airy, not moody " +
  "or dim.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cardnews_spec_v1",
  episode: 8,
  character: "geumbaksa",
  title: "강남3구·용산만 토지거래허가구역인 줄 알았는데",
  slides: [
    {
      id: "cover",
      file: "01_geumbaksa_ep8_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a bright, calm real-estate consultation desk ` +
        `space with a blurred Seoul district map poster on the wall (blurred, illegible), softly ` +
        `blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE}\n\n` +
        `Position the gold coin character on the right side of the frame, holding a small card ` +
        `reading "서울 전역" with a surprised expression, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold navy/dark text (#14213D) with a thin white outline for contrast ` +
        `against the bright background, exactly as written, no typos:\n` +
        `"강남3구·용산만\n토지거래허가구역인 줄\n알았는데"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, bright and clean, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_geumbaksa_ep8_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a Seoul district map with a small highlighted ` +
        `area next to a much larger highlighted area (blurred, illegible), softly blurred, warm ` +
        `daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real institution name/logo — plain ` +
        `anonymous map shapes only.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (1, 2) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key numbers/phrases highlighted in blue (#1B6FD1). Render the Korean text ` +
        `EXACTLY as written, no typos:\n\n` +
        `1. 지금은 서울 거의 전역이랑\n경기 여러 곳도 다 해당돼\n\n` +
        `2. 토지거래허가구역은 집이나 땅을\n살 때 계약 전에 구청 허가부터\n받아야 하는 지역을 말해\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_geumbaksa_ep8_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a contract document icon with a red X mark ` +
        `next to a small house icon with a red prohibition symbol over a rising chart (blurred, ` +
        `illegible), softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real ` +
        `institution name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (3, 4) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key phrases highlighted in red (#D93A3A) for the warning contrast. Render the ` +
        `Korean text EXACTLY as written, no typos:\n\n` +
        `3. 허가 없이 계약하면 거래 자체가\n무효 처리되고, 2년 이하 징역이나\n벌금까지 물 수 있어\n\n` +
        `4. 허가를 받으려면 보통 2년 동안\n직접 실거주해야 해,\n투기 수요를 막으려는 거야\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "body3",
      file: "04_geumbaksa_ep8_body3.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a calendar icon with an extended date range ` +
        `next to a government building icon (blurred, illegible), softly blurred, warm daylight ` +
        `tone, ${BRIGHT_OVERLAY_NOTE} No visible real institution name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 1 numbered point: a large bold yellow number (5) on the left, Korean text ` +
        `on the right in dark navy (#14213D) with white outline for readability, key numbers/` +
        `phrases highlighted in blue (#1B6FD1). Render the Korean text EXACTLY as written, no ` +
        `typos:\n\n` +
        `5. 최근엔 실거주 유예 기간도\n최대 3년 3개월까지 늘어났고,\n국토부 장관이 직접 지역을 지정할\n` +
        `수 있는 법도 국회를 통과했어\n\n` +
        `Double-check the text character by character: it must read exactly ` +
        `"최근엔 실거주 유예 기간도 최대 3년 3개월까지 늘어났고, 국토부 장관이 직접 지역을 지정할 수 ` +
        `있는 법도 국회를 통과했어" — do not substitute or drop any character or digit.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "closing",
      file: "05_geumbaksa_ep8_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram carousel card, 1080x1350px, the LAST slide of a 5-slide Korean ` +
        `finance carousel post (cover, body1, body2, body3 already exist — this is slide 5/5, a ` +
        `text-heavy call-to-action card, NOT a character portrait or wallpaper). ` +
        `${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: same realistic bright real-estate consultation desk space as the cover slide, ` +
        `softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `This slide MUST contain large printed Korean text overlaid on the image — treat it like a ` +
        `news headline graphic, not a photo. Layout, top to bottom:\n` +
        `1) The yellow badge (top-left, as specified above)\n` +
        `2) A large bold yellow word with dark outline: "팔로우"\n` +
        `3) Below it, bold white text with black outline: "다음 소식도 먼저"\n` +
        `4) Below that, bold dark navy text (#14213D) with white outline, two lines exactly as ` +
        `written, no typos:\n"내 집이나 살 집이 여기 해당되는지\n토지이음에서 계약 전에 꼭 확인해봐"\n\n` +
        `Position the gold coin character standing on the lower-right of the frame, smaller scale ` +
        `(about 35% of image height), waving one hand, positioned so it does NOT overlap or cover ` +
        `any of the text blocks above.\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `carousel closing card, bright and clean, high contrast, photorealistic background.`,
    },
  ],
});
