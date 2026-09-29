/**
 * 금박사 카드뉴스 9편(DB형인지 DC형인지도 모르고 회사 다니는 사람 진짜
 * 많던데) 슬라이드 스펙.
 * 원본 영상: scripts/_geumbaksa-ep9-assembly-spec.mjs (완성,
 * C:/tmp/geumbaksa-ep9-episode-final-v12/owl_episode_final.mp4).
 *
 * 밝은 배경 톤 원칙(6편부터 적용) 계승, 문구는 카피라이팅 문체로 재구성(영상
 * 대본 그대로 옮기지 않음, 5편부터 확정 원칙). 9씬 구조를 본문 3장으로 압축:
 *   본문1(1~2): DB형 정의(회사가 운용, 금액 확정) + DC형 정의(내가 운용)
 *   본문2(3~4): 선택 기준(임금상승률 vs 투자자신감) + IRP(세액공제 개인계좌)
 *   본문3(5~6): 실물이전 제한(같은 종류끼리만) + 확인 방법(은행·증권사 앱)
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
  episode: 9,
  character: "geumbaksa",
  title: "DB형인지 DC형인지도 모르고 회사 다니는 사람 진짜 많던데",
  slides: [
    {
      id: "cover",
      file: "01_geumbaksa_ep9_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a bright, calm retirement-pension ` +
        `consultation desk space with a blurred "퇴직연금 상담" wall sign, softly blurred, warm ` +
        `daylight tone, ${BRIGHT_OVERLAY_NOTE}\n\n` +
        `Position the gold coin character on the right side of the frame, holding a small card ` +
        `with a question mark, surprised expression, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold navy/dark text (#14213D) with a thin white outline for contrast ` +
        `against the bright background, exactly as written, no typos:\n` +
        `"DB형인지 DC형인지도\n모르고 회사\n다니는 사람 많던데"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, bright and clean, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_geumbaksa_ep9_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of two info cards side by side — one with a ` +
        `building (company) icon, one with a person icon and a rising bar chart (blurred, ` +
        `illegible), softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real ` +
        `institution name/logo — plain anonymous icons only.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (1, 2) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key numbers/phrases highlighted in blue (#1B6FD1). Render the Korean text ` +
        `EXACTLY as written, no typos:\n\n` +
        `1. DB형은 회사가 직접 굴려주고,\n받을 금액이 미리 정해져 있어\n\n` +
        `2. DC형은 회사가 매년 월급\n한 달치를 내 계좌에 넣어주고,\n그 돈을 내가 직접 굴려\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_geumbaksa_ep9_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a balance scale icon next to a wallet icon ` +
        `with coin sparkles (blurred, illegible), softly blurred, warm daylight tone, ` +
        `${BRIGHT_OVERLAY_NOTE} No visible real institution name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (3, 4) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key phrases highlighted in blue (#1B6FD1). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `3. 월급이 매년 오르는 회사면\nDB형이, 투자에 자신 있으면\nDC형이 유리해\n\n` +
        `4. 퇴직하면 이 돈은 보통\n내 IRP 계좌로 들어가는데,\n세액공제까지 챙길 수 있어\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "body3",
      file: "04_geumbaksa_ep9_body3.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of two arrow icons pointing within matching ` +
        `colored boxes (labeled abstractly, blurred, illegible) next to a smartphone icon with a ` +
        `checkmark, softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real ` +
        `institution name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (5, 6) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key phrases highlighted in red (#D93A3A) for the warning/caution nuance on ` +
        `point 5. Render the Korean text EXACTLY as written, no typos:\n\n` +
        `5. 실물이전은 같은 종류\n안에서만 돼, DB는 DB끼리,\nDC는 DC끼리만 갈아탈 수 있어\n\n` +
        `6. 내가 DB형인지 DC형인지는\n거래하는 은행이나 증권사 앱에서\n바로 확인할 수 있어\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "closing",
      file: "05_geumbaksa_ep9_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram carousel card, 1080x1350px, the LAST slide of a 5-slide Korean ` +
        `finance carousel post (cover, body1, body2, body3 already exist — this is slide 5/5, a ` +
        `text-heavy call-to-action card, NOT a character portrait or wallpaper). ` +
        `${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: same realistic bright retirement-pension consultation desk space as the cover ` +
        `slide, softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `This slide MUST contain large printed Korean text overlaid on the image — treat it like a ` +
        `news headline graphic, not a photo. Layout, top to bottom:\n` +
        `1) The yellow badge (top-left, as specified above)\n` +
        `2) A large bold yellow word with dark outline: "팔로우"\n` +
        `3) Below it, bold white text with black outline: "다음 소식도 먼저"\n` +
        `4) Below that, bold dark navy text (#14213D) with white outline, two lines exactly as ` +
        `written, no typos:\n"오늘 내 퇴직연금이 DB형인지\nDC형인지 앱에서 확인해봐"\n\n` +
        `Position the gold coin character standing on the lower-right of the frame, smaller scale ` +
        `(about 35% of image height), waving one hand, positioned so it does NOT overlap or cover ` +
        `any of the text blocks above.\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `carousel closing card, bright and clean, high contrast, photorealistic background.`,
    },
  ],
});
