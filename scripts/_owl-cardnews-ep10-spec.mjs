/**
 * 부엉이 카드뉴스 10편(27년 만에 오르는 국민연금 보험료) 슬라이드 스펙.
 * 원본 영상: scripts/_owl-ep10-assembly-spec.mjs (완성,
 * C:/tmp/owl-ep10-episode-final-v1/owl_episode_final.mp4).
 *
 * 게시는 10편 영상이 실제 배포되는 날 세트로 진행한다(Owner 확정 원칙, 9편부터
 * 계승) — 이미지는 미리 만들어 저장만 해둔다.
 *
 * 문구는 영상 대본을 그대로 옮기지 않고 카피라이팅 문체로 재구성한다(전 편
 * 공통 원칙, 8편부터 계승). 영상 핵심 수치(보험료율 9%→13%, 1998년 이후 27년
 * 동결, 소득대체율 41.5%→43%, 국민연금공단 1355)는 유지하되 문장은 카드뉴스용
 * 으로 새로 쓴다.
 *
 * 배경은 10편 영상과 통일해 국민연금공단 상담 창구 공간으로 설정 — 1~9편
 * 카드뉴스에 쓰지 않은 공간.
 *
 * 배경 텍스트 단순화 원칙(신규, 2026-09-21 — 10편 영상 제작 중 발견한 교훈
 * 반영): 영상 생성(Veo) 단계에서 배경에 완전한 한글 문장을 여러 개 넣으면
 * 프레임마다 텍스트가 깨지는 문제를 겪었다([[project_veo_text_heavy_background_root_cause]]).
 * 카드뉴스는 정지 이미지라 이 문제 자체는 없지만, 같은 배경 설계 원칙(핵심
 * 정보는 카드/뱃지 하나에 모으고 배경 간판은 짧은 라벨 위주로 단순화)을
 * 카드뉴스에도 적용해 시각적 일관성과 가독성을 높인다.
 *
 * 밝은 배경 톤 원칙(Owner 2026-09-19, 7편부터 적용) 계승. 1~9편 스펙의 배지
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

// 배경에는 완전한 문장을 넣지 않고 짧은 라벨/아이콘 위주로만 지시한다(위 신규
// 원칙 적용). 자세한 수치는 전부 badge 아래 텍스트 블록에 모아서 표시한다.
const SIMPLE_BACKGROUND_NOTE =
  "Keep any background signage or screen text minimal and generic (short labels or icons only, " +
  "no full sentences) — this is a background detail, not the main message.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cardnews_spec_v1",
  episode: 10,
  title: "국민연금 보험료, 27년 만에 처음으로 오른다는 거 알아?",
  slides: [
    {
      id: "cover",
      file: "01_ep10_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a bright, well-lit public pension ` +
        `consultation counter with a large screen showing a simple pension-inquiry menu ` +
        `(blurred, illegible), softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} ` +
        `${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `Position the owl character on the right side of the frame, holding up a payslip-like ` +
        `card showing a small "국민연금" label with a red upward arrow mark, serious but ` +
        `confident expression, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold navy/dark text (#14213D) with a thin white outline for contrast ` +
        `against the bright background, exactly as written, no typos:\n` +
        `"국민연금 보험료\n27년 만에\n처음으로 오른다"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, bright and clean, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_ep10_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a pension consultation counter information ` +
        `board showing a rising bar graph next to an upward arrow icon (blurred, numbers ` +
        `illegible), softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real ` +
        `institution logo — plain anonymous surfaces and generic charts only. ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (1, 2) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key numbers/phrases highlighted in blue (#1B6FD1). Render the Korean text ` +
        `EXACTLY as written, no typos:\n\n` +
        `1. 1998년 9%로 정해진 뒤\n27년째 한 번도 안 바뀌었어\n\n` +
        `2. 2026년부터 매년 0.5%p씩 올라\n2033년엔 13%가 돼\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_ep10_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of two information cards side by side on a ` +
        `pension consultation counter desk — one showing a "더 낸다" concept and the other showing ` +
        `a "더 받는다" concept with a small shield icon (blurred, numbers illegible), softly ` +
        `blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real institution logo. ` +
        `${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 1 numbered point: a large bold yellow number (3) on the left, Korean text ` +
        `on the right in dark navy (#14213D) with white outline for readability, key phrases ` +
        `highlighted in blue (#1B6FD1) for the reassuring counterpoint. Render the Korean text ` +
        `EXACTLY as written, no typos:\n\n` +
        `3. 더 내는 대신 돌려받는 비율도 올라\n소득대체율 41.5% → 43%\n국가 지급 책임도 법에 명시됐어\n\n` +
        `Double-check the text character by character: it must read exactly ` +
        `"더 내는 대신 돌려받는 비율도 올라, 소득대체율 41.5퍼센트에서 43퍼센트로. 국가 지급 책임도 ` +
        `법에 명시됐어" — do not substitute or drop any character.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "closing",
      file: "04_ep10_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram carousel card, 1080x1350px, the LAST slide of a 4-slide ` +
        `Korean finance carousel post (cover, body1, body2 already exist — this is slide 4/4, a ` +
        `text-heavy call-to-action card, NOT a character portrait or wallpaper). ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a bright pension consultation counter desk scene with a phone-call screen ` +
        `icon (blurred, illegible), a notepad, softly blurred, warm daylight tone, ` +
        `${BRIGHT_OVERLAY_NOTE} ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `This slide MUST contain large printed Korean text overlaid on the image — treat it like a ` +
        `news headline graphic, not a photo. Layout, top to bottom:\n` +
        `1) The yellow badge (top-left, as specified above)\n` +
        `2) A large bold yellow word with dark outline: "팔로우"\n` +
        `3) Below it, bold white text with black outline: "다음 소식도 먼저"\n` +
        `4) Below that, bold dark navy text (#14213D) with white outline, three lines exactly as ` +
        `written, no typos:\n"내 인상분이 궁금하다면\n국민연금공단 1355에 먼저 물어보고\n공제액부터 비교해보기"\n\n` +
        `Position the owl character standing on the lower-right of the frame, smaller scale (about ` +
        `35% of image height), waving one wing, positioned so it does NOT overlap or cover any of ` +
        `the text blocks above.\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `carousel closing card, bright and clean, high contrast, photorealistic background.`,
    },
  ],
});
