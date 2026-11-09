/**
 * 금박사 카드뉴스 7편(예금자보호 한도 1억원, 진짜 다 보호되는 걸까) 슬라이드 스펙.
 * 원본 영상: scripts/_geumbaksa-ep7-assembly-spec.mjs (완성,
 * C:/tmp/geumbaksa-ep7-episode-final-v3/owl_episode_final.mp4).
 *
 * 밝은 배경 톤 원칙(6편부터 적용) 계승, 문구는 카피라이팅 문체로 재구성(영상
 * 대본 그대로 옮기지 않음, 5편부터 확정 원칙). 11씬 구조를 본문 3장으로 압축:
 *   본문1(1~4): 한도 상향(5천→1억) + 합산 기준(계좌 쪼개도 소용없음) + 진짜
 *     방법(은행 분산)
 *   본문2(5~6): 저축은행도 동일 한도 + 퇴직연금·연금저축은 별도 한도
 *   본문3(7~8): 자동 입금 아님(직접 신청 필요) + 신청 경로·기간
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
  episode: 7,
  character: "geumbaksa",
  title: "예금자보호 한도 1억원, 진짜 다 보호되는 걸까",
  slides: [
    {
      id: "cover",
      file: "01_geumbaksa_ep7_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a bright, calm bank consultation desk ` +
        `space with a blurred shield icon and savings poster on the wall (blurred, illegible), ` +
        `softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE}\n\n` +
        `Position the gold coin character on the right side of the frame, holding a small card ` +
        `reading "1억원" with a confident expression, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold navy/dark text (#14213D) with a thin white outline for contrast ` +
        `against the bright background, exactly as written, no typos:\n` +
        `"예금자보호 한도 1억원\n근데 이거 진짜\n다 보호되는 거 맞아?"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, bright and clean, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_geumbaksa_ep7_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of two bank building icons next to a rising ` +
        `arrow chart (blurred, numbers illegible), softly blurred, warm daylight tone, ` +
        `${BRIGHT_OVERLAY_NOTE} No visible real institution name/logo — plain anonymous surfaces ` +
        `and generic icons only.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (1, 2) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key numbers/phrases highlighted in blue (#1B6FD1). Render the Korean text ` +
        `EXACTLY as written, no typos:\n\n` +
        `1. 2025년 9월부터 예금자보호 한도가\n5천만원에서 1억원으로 두 배 올랐어\n\n` +
        `2. 근데 계좌를 여러 개로 쪼개도\n같은 은행이면 전부 합산해서 계산돼\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_geumbaksa_ep7_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of two separate bank building icons each with a ` +
        `small checkmark, next to a piggy bank icon (blurred, numbers illegible), softly blurred, ` +
        `warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real institution name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (3, 4) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key numbers/phrases highlighted in blue (#1B6FD1). Render the Korean text ` +
        `EXACTLY as written, no typos:\n\n` +
        `3. 진짜 방법은 은행을 나누는 것,\n은행마다 각각 1억원씩 따로 보호돼\n\n` +
        `4. 저축은행도 한도는 똑같이 1억원,\n퇴직연금·연금저축은 예금이랑 별도로 계산돼\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "body3",
      file: "04_geumbaksa_ep7_body3.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a passbook icon with a red X mark next to a ` +
        `smartphone showing a simple checkmark screen (blurred, numbers illegible), softly blurred, ` +
        `warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real institution name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 1 numbered point: a large bold yellow number (5) on the left, Korean text ` +
        `on the right in dark navy (#14213D) with white outline for readability, key phrases ` +
        `highlighted in red (#D93A3A) for the warning contrast. Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `5. 은행이 망해도 자동으로 안 들어와,\n예금보험공사에 직접 신청해야\n신청 다음 날 바로 입금돼\n\n` +
        `Double-check the text character by character: it must read exactly ` +
        `"은행이 망해도 자동으로 안 들어와, 예금보험공사에 직접 신청해야 신청 다음 날 바로 입금돼" — ` +
        `do not substitute or drop any character or digit.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "closing",
      file: "05_geumbaksa_ep7_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram carousel card, 1080x1350px, the LAST slide of a 5-slide Korean ` +
        `finance carousel post (cover, body1, body2, body3 already exist — this is slide 5/5, a ` +
        `text-heavy call-to-action card, NOT a character portrait or wallpaper). ` +
        `${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: same realistic bright bank consultation desk space as the cover slide, softly ` +
        `blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `This slide MUST contain large printed Korean text overlaid on the image — treat it like a ` +
        `news headline graphic, not a photo. Layout, top to bottom:\n` +
        `1) The yellow badge (top-left, as specified above)\n` +
        `2) A large bold yellow word with dark outline: "팔로우"\n` +
        `3) Below it, bold white text with black outline: "다음 소식도 먼저"\n` +
        `4) Below that, bold dark navy text (#14213D) with white outline, two lines exactly as ` +
        `written, no typos:\n"큰돈은 한 곳에 몰지 말고\n은행이랑 상품을 나눠서 넣어둬"\n\n` +
        `Position the gold coin character standing on the lower-right of the frame, smaller scale ` +
        `(about 35% of image height), waving one hand, positioned so it does NOT overlap or cover ` +
        `any of the text blocks above.\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `carousel closing card, bright and clean, high contrast, photorealistic background.`,
    },
  ],
});
