/**
 * 부엉이 카드뉴스 9편(카드론·현금서비스가 신용점수를 깎는 구조) 슬라이드 스펙.
 * 원본 영상: scripts/_owl-ep9-assembly-spec.mjs (완성, C:/tmp/owl-ep9-episode-final/owl_episode_final.mp4).
 *
 * 게시는 9편 영상이 실제 배포되는 날 세트로 진행한다(Owner 확정 원칙) — 이미지는
 * 미리 만들어 저장만 해둔다.
 *
 * 문구는 영상 대본을 그대로 옮기지 않고 카피라이팅 문체로 재구성한다(전 편
 * 공통 원칙, 8편부터 계승). 영상 핵심 수치(28조원/+20.9%/서민금융진흥원 1397)는
 * 유지하되, 문장은 카드뉴스용으로 새로 쓴다.
 *
 * 팩트체크 원칙 계승(2026-09-20, 9편 대본 작성 시 확정): "카드론 쓰면 몇 점
 * 하락한다"는 공식 수치가 NICE·KCB·금감원 어디에도 없어, 카드뉴스에도 확정
 * 하락폭을 적지 않는다. 정성적 표현("위험 신호로 평가") + 검증된 통계만 사용.
 *
 * 배경은 9편 영상과 통일해 은행 창구/모바일뱅킹 앱 UI 공간으로 설정 — 1~8편
 * 카드뉴스에 쓰지 않은 공간.
 *
 * 밝은 배경 톤 원칙(Owner 2026-09-19, 7편부터 적용) 계승. 1~6편 스펙의 배지
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

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cardnews_spec_v1",
  episode: 9,
  title: "급할 때 쓰는 카드론, 사실 신용점수엔 위험 신호로 찍힌다는 거 알아?",
  slides: [
    {
      id: "cover",
      file: "01_ep9_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a bright, well-lit bank lobby with a large ` +
        `mobile banking app screen showing simple icons (blurred, numbers illegible), softly ` +
        `blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE}\n\n` +
        `Position the owl character on the right side of the frame, holding up a smartphone showing ` +
        `small "카드론"/"현금서비스" icons with a tiny red warning mark, serious but confident ` +
        `expression, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold navy/dark text (#14213D) with a thin white outline for contrast ` +
        `against the bright background, exactly as written, no typos:\n` +
        `"급할 때 쓰는 카드론\n사실 신용점수엔\n위험 신호로 찍힌다"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, bright and clean, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_ep9_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a bank digital signage panel showing a rising ` +
        `bar graph next to a warning triangle icon (blurred, numbers illegible), softly blurred, ` +
        `warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real bank name/logo — plain anonymous ` +
        `surfaces and generic charts only.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (1, 2) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key numbers/phrases highlighted in blue (#1B6FD1). Render the Korean text ` +
        `EXACTLY as written, no typos:\n\n` +
        `1. 담보 없는 고금리 대출이라\n이용 자체가 상환 능력 부족 신호로 평가돼\n\n` +
        `2. 올해 상반기 카드론 이용액만 28조원\n작년보다 20.9% 늘었어\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_ep9_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a stack of question-mark blocks rising next to ` +
        `a red upward arrow on a bank counter desk, softly blurred, warm daylight tone, ` +
        `${BRIGHT_OVERLAY_NOTE} No visible real bank name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 1 numbered point: a large bold yellow number (3) on the left, Korean text ` +
        `on the right in dark navy (#14213D) with white outline for readability, key phrases ` +
        `highlighted in red (#D93A3A) for the risk. Render the Korean text EXACTLY as written, no ` +
        `typos:\n\n` +
        `3. 문제는 한두 번이 아니라\n반복해서 자주 쓰는 습관\n신용평가사엔 물음표만 쌓여\n\n` +
        `Double-check the text character by character: it must read exactly ` +
        `"문제는 한두 번이 아니라 반복해서 자주 쓰는 습관, 신용평가사엔 물음표만 쌓여" — do not ` +
        `substitute or drop any character.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "closing",
      file: "04_ep9_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram carousel card, 1080x1350px, the LAST slide of a 4-slide ` +
        `Korean finance carousel post (cover, body1, body2 already exist — this is slide 4/4, a ` +
        `text-heavy call-to-action card, NOT a character portrait or wallpaper). ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a bright bank lobby desk scene with a phone-call screen icon (blurred, numbers ` +
        `illegible), a notepad, softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `This slide MUST contain large printed Korean text overlaid on the image — treat it like a ` +
        `news headline graphic, not a photo. Layout, top to bottom:\n` +
        `1) The yellow badge (top-left, as specified above)\n` +
        `2) A large bold yellow word with dark outline: "팔로우"\n` +
        `3) Below it, bold white text with black outline: "다음 소식도 먼저"\n` +
        `4) Below that, bold dark navy text (#14213D) with white outline, three lines exactly as ` +
        `written, no typos:\n"급전이 필요하다면\n서민금융진흥원 1397에 먼저 물어보고\n반복 이용은 아닌지 점검해보기"\n\n` +
        `Position the owl character standing on the lower-right of the frame, smaller scale (about ` +
        `35% of image height), waving one wing, positioned so it does NOT overlap or cover any of ` +
        `the text blocks above.\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `carousel closing card, bright and clean, high contrast, photorealistic background.`,
    },
  ],
});
