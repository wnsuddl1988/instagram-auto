/**
 * 부엉이 카드뉴스 14편(한국은행 금융안정 상황 경고, 집값 잡혔다더니
 * 경고등이 다시 켜진 진짜 이유) 슬라이드 스펙.
 * 원본 영상: scripts/_owl-ep14-assembly-spec.mjs.
 *
 * 게시는 14편 영상이 실제 배포되는 날 세트로 진행한다(Owner 확정 원칙, 9편부터
 * 계승) — 이미지는 미리 만들어 저장만 해둔다.
 *
 * 문구는 영상 대본을 그대로 옮기지 않고 카피라이팅 문체로 재구성한다(전 편
 * 공통 원칙, 8편부터 계승). 영상 핵심 수치(금융불안지수 19.5, 강남·서초
 * 하락 vs 중랑·성북·강북 상승, 취약 자영업자 연체율 12.71%, 9개월/15개월
 * 시차)는 유지하되 문장은 카드뉴스용으로 새로 쓴다.
 *
 * 배경은 14편 영상과 통일해 금융감독 브리핑룸으로 설정 — 1~13편 카드뉴스에
 * 쓰지 않은 새 공간.
 *
 * 배경 텍스트 단순화 원칙(10편부터 확립) 계승, 밝은 배경 톤 원칙(7편부터)
 * 계승, 1~13편 스펙의 배지 규칙·하단 텍스트 제거·무브랜드 원칙도 동일 적용.
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
  episode: 14,
  character: "owl",
  title: "집값 잡혔다더니, 한은이 다시 경고등을 켰다",
  slides: [
    {
      id: "cover",
      file: "01_ep14_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a bright, well-lit financial briefing room ` +
        `with a simple "경제 브리핑" podium sign (blurred details elsewhere), softly blurred, warm ` +
        `daylight tone, ${BRIGHT_OVERLAY_NOTE} ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `Position the owl character on the right side of the frame, holding a small warning-light ` +
        `icon card, sharp and serious expression, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold navy/dark text (#14213D) with a thin white outline for contrast ` +
        `against the bright background, exactly as written, no typos:\n` +
        `"집값 잡혔다더니\n한은이 다시\n경고등을\n켰다"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, bright and clean, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_ep14_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a financial briefing room information screen ` +
        `showing a simple mixed-direction chart icon (one red up arrow, one blue down arrow, ` +
        `blurred, numbers illegible), softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No ` +
        `visible real institution logo — plain anonymous surfaces and generic icons only. ` +
        `${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (1, 2) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key numbers/phrases highlighted in blue (#1B6FD1). Render the Korean text ` +
        `EXACTLY as written, no typos:\n\n` +
        `1. 한국은행이 이번 달\n금융불안지수가\n다시 올라서 주의 단계에\n들어갔다고 발표했어\n\n` +
        `2. 근데 진짜 이유는 의외야,\n강남·서초는 오히려\n집값이 떨어졌거든\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_ep14_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a simple two-panel comparison chart on an ` +
        `information screen — a blue upward bar chart on one side and a red upward bar chart on ` +
        `the other (blurred details elsewhere), softly blurred, warm daylight tone, ` +
        `${BRIGHT_OVERLAY_NOTE} No visible real institution logo. ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (3, 4) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key phrases highlighted in red (#D93A3A) for the risk numbers. Render the ` +
        `Korean text EXACTLY as written, no typos:\n\n` +
        `3. 대신 중랑·성북·강북처럼\n상대적으로 저렴한 동네가\n3% 넘게 올랐어,\n취약 자영업자 연체율은\n12.71%까지 상승\n\n` +
        `4. 금리 인상 효과는\n형편이 어려운 사람일수록\n더 빨리 온대,\n전체는 15개월,\n취약차주는 9개월 만에\n\n` +
        `Double-check the text character by character: it must read exactly ` +
        `"중랑·성북·강북처럼 상대적으로 저렴한 동네가 3% 넘게 올랐어, 취약 자영업자 연체율은 12.71%까지 상승" and ` +
        `"금리 인상 효과는 형편이 어려운 사람일수록 더 빨리 온대, 전체는 15개월, 취약차주는 9개월 만에" — do not ` +
        `substitute or drop any character or digit.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "closing",
      file: "04_ep14_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram carousel card, 1080x1350px, the LAST slide of a 4-slide ` +
        `Korean finance carousel post (cover, body1, body2 already exist — this is slide 4/4, a ` +
        `text-heavy call-to-action card, NOT a character portrait or wallpaper). ` +
        `${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a bright financial briefing room scene with a smartphone screen icon ` +
        `(blurred, illegible), a standing information board, softly blurred, warm daylight tone, ` +
        `${BRIGHT_OVERLAY_NOTE} ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `This slide MUST contain large printed Korean text overlaid on the image — treat it like a ` +
        `news headline graphic, not a photo. Layout, top to bottom:\n` +
        `1) The yellow badge (top-left, as specified above)\n` +
        `2) A large bold yellow word with dark outline: "방심 금지"\n` +
        `3) Below it, bold white text with black outline: "지금 이자 괜찮아도 안심 금물"\n` +
        `4) Below that, bold dark navy text (#14213D) with white outline, three lines exactly as ` +
        `written, no typos:\n"변동금리로 대출 받았다면\n지금 여유가 있어도\n상환 계획부터 미리 점검해보기"\n\n` +
        `Position the owl character standing on the lower-right of the frame, smaller scale (about ` +
        `35% of image height), waving one wing, positioned so it does NOT overlap or cover any of ` +
        `the text blocks above.\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `carousel closing card, bright and clean, high contrast, photorealistic background.`,
    },
  ],
});
