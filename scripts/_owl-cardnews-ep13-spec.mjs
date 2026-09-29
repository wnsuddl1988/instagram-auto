/**
 * 부엉이 카드뉴스 13편(퇴직연금 실물이전, 팔지 않고 그대로 계좌만 옮긴다)
 * 슬라이드 스펙.
 * 원본 영상: scripts/_owl-ep13-assembly-spec.mjs.
 *
 * 게시는 13편 영상이 실제 배포되는 날 세트로 진행한다(Owner 확정 원칙, 9편부터
 * 계승) — 이미지는 미리 만들어 저장만 해둔다.
 *
 * 문구는 영상 대본을 그대로 옮기지 않고 카피라이팅 문체로 재구성한다(전 편
 * 공통 원칙, 8편부터 계승). 영상 핵심 수치(상반기 6.9조 원, DB↔DB·DC↔DC·
 * IRP↔IRP만 가능, DC→타사 IRP 확대 추진 중)는 유지하되 문장은 카드뉴스용으로
 * 새로 쓴다.
 *
 * 배경은 13편 영상과 통일해 퇴직연금 고객센터 상담 공간으로 설정 — 1~12편
 * 카드뉴스에 쓰지 않은 새 공간.
 *
 * 배경 텍스트 단순화 원칙(10편부터 확립) 계승, 밝은 배경 톤 원칙(7편부터)
 * 계승, 1~12편 스펙의 배지 규칙·하단 텍스트 제거·무브랜드 원칙도 동일 적용.
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
  episode: 13,
  character: "owl",
  title: "퇴직연금 계좌, 팔지 않고 그대로 옮길 수 있다",
  slides: [
    {
      id: "cover",
      file: "01_ep13_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a bright, well-lit retirement-pension ` +
        `customer service center with a simple "퇴직연금 상담" wall sign (blurred details ` +
        `elsewhere), softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `Position the owl character on the right side of the frame, holding a small arrow-icon ` +
        `card (symbolizing account transfer) with a confident, reassuring expression, not ` +
        `blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold navy/dark text (#14213D) with a thin white outline for contrast ` +
        `against the bright background, exactly as written, no typos:\n` +
        `"퇴직연금 계좌\n팔지 않고\n그대로 옮길 수\n있다"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, bright and clean, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_ep13_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a retirement-pension office information ` +
        `board showing a simple downward red arrow icon next to a chain-link icon (blurred, ` +
        `numbers illegible), softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No ` +
        `visible real institution logo — plain anonymous surfaces and generic icons only. ` +
        `${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (1, 2) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key numbers/phrases highlighted in blue (#1B6FD1). Render the Korean text ` +
        `EXACTLY as written, no typos:\n\n` +
        `1. 예전엔 퇴직연금 회사를\n옮기려면 펀드를\n전부 팔아야 했어\n\n` +
        `2. 근데 파는 순간 손해를\n보거나 다시 살 땐\n더 비싸지는 경우가 많았어\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_ep13_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a simple flow diagram on an information ` +
        `board — an icon showing a document/fund icon with an arrow pointing to another office ` +
        `icon (blurred details elsewhere), softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} ` +
        `No visible real institution logo. ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 1 numbered point: a large bold yellow number (3) on the left, Korean text ` +
        `on the right in dark navy (#14213D) with white outline for readability, key phrases ` +
        `highlighted in red (#D93A3A) for the impact numbers. Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `3. 근데 2년 전부터\n펀드를 팔지 않고\n그대로 옮기는\n실물이전 제도가 생겼어,\n상반기에만 6.9조 원 이동\n\n` +
        `Double-check the text character by character: it must read exactly ` +
        `"근데 2년 전부터 펀드를 팔지 않고 그대로 옮기는 실물이전 제도가 생겼어, 상반기에만 6.9조 원 이동" — ` +
        `do not substitute or drop any character or digit.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "closing",
      file: "04_ep13_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram carousel card, 1080x1350px, the LAST slide of a 4-slide ` +
        `Korean finance carousel post (cover, body1, body2 already exist — this is slide 4/4, a ` +
        `text-heavy call-to-action card, NOT a character portrait or wallpaper). ` +
        `${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a bright retirement-pension customer service center scene with a smartphone ` +
        `screen icon (blurred, illegible), a standing information sign, softly blurred, warm ` +
        `daylight tone, ${BRIGHT_OVERLAY_NOTE} ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `This slide MUST contain large printed Korean text overlaid on the image — treat it like a ` +
        `news headline graphic, not a photo. Layout, top to bottom:\n` +
        `1) The yellow badge (top-left, as specified above)\n` +
        `2) A large bold yellow word with dark outline: "팔로우"\n` +
        `3) Below it, bold white text with black outline: "다음 소식도 먼저"\n` +
        `4) Below that, bold dark navy text (#14213D) with white outline, three lines exactly as ` +
        `written, no typos:\n"퇴직연금 수익률이 마음에 안 든다면\n지금 다니는 회사에 실물이전으로\n옮길 수 있는지부터 확인해보기"\n\n` +
        `Position the owl character standing on the lower-right of the frame, smaller scale (about ` +
        `35% of image height), waving one wing, positioned so it does NOT overlap or cover any of ` +
        `the text blocks above.\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `carousel closing card, bright and clean, high contrast, photorealistic background.`,
    },
  ],
});
