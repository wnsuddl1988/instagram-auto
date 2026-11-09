/**
 * 부엉이 카드뉴스 11편(고용률 8월 사상 첫 70% 돌파 vs 청년고용 46개월 연속 감소)
 * 슬라이드 스펙.
 * 원본 영상: scripts/_owl-ep11-assembly-spec.mjs (완성,
 * C:/tmp/owl-ep11-episode-final-v2/owl_episode_final.mp4).
 *
 * 게시는 11편 영상이 실제 배포되는 날 세트로 진행한다(Owner 확정 원칙, 9편부터
 * 계승) — 이미지는 미리 만들어 저장만 해둔다.
 *
 * 문구는 영상 대본을 그대로 옮기지 않고 카피라이팅 문체로 재구성한다(전 편
 * 공통 원칙, 8편부터 계승). 영상 핵심 수치(고용률 70.4%, 청년 취업 46개월
 * 연속 감소, 15세~64세 전체 평균, 청년내일채움공제, 국민취업지원제도,
 * 구직촉진수당)는 유지하되 문장은 카드뉴스용으로 새로 쓴다.
 *
 * 배경은 11편 영상과 통일해 고용센터 상담 데스크 공간으로 설정 — 1~10편
 * 카드뉴스에 쓰지 않은 공간.
 *
 * 배경 텍스트 단순화 원칙(10편부터 확립) 계승: 영상 생성(Veo) 단계의 87씬
 * 전수조사([[project_veo_text_heavy_background_root_cause]])로 확정된 "핵심
 * 정보는 카드 하나에 모으고 배경 간판은 짧은 라벨 위주로" 원칙을 카드뉴스에도
 * 동일 적용해 시각적 일관성과 가독성을 높인다.
 *
 * 밝은 배경 톤 원칙(Owner 2026-09-19, 7편부터 적용) 계승. 1~10편 스펙의 배지
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

const SIMPLE_BACKGROUND_NOTE =
  "Keep any background signage or screen text minimal and generic (short labels or icons only, " +
  "no full sentences) — this is a background detail, not the main message.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cardnews_spec_v1",
  episode: 11,
  title: "고용률이 사상 처음 70%를 찍었다는데, 왜 청년들은 다 취업 못 했다고 할까",
  slides: [
    {
      id: "cover",
      file: "01_ep11_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a bright, well-lit employment center ` +
        `consultation desk with a simple "고용센터" sign (blurred details elsewhere), softly ` +
        `blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `Position the owl character on the right side of the frame, holding a circular gauge card ` +
        `showing "70.4%" with a confident expression, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold navy/dark text (#14213D) with a thin white outline for contrast ` +
        `against the bright background, exactly as written, no typos:\n` +
        `"고용률이 사상 처음\n70%를 찍었다는데\n청년들은 왜 다\n취업 못 했다고 할까"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, bright and clean, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_ep11_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of an employment center information board ` +
        `showing a simple gauge icon next to a small downward red arrow icon (blurred, numbers ` +
        `illegible), softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real ` +
        `institution logo — plain anonymous surfaces and generic icons only. ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (1, 2) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key numbers/phrases highlighted in blue (#1B6FD1). Render the Korean text ` +
        `EXACTLY as written, no typos:\n\n` +
        `1. 8월 고용률 70.4%,\n1989년 통계 작성 이래\n8월 기준 처음으로 70% 돌파\n\n` +
        `2. 근데 청년 취업자는\n46개월 연속 감소,\n청년 실업률은 4년 내 최고치\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_ep11_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a simple timeline diagram on an information ` +
        `board — an upward arrow icon labeled "고령층" and a downward arrow icon labeled "청년" ` +
        `converging into a flat middle arrow (blurred details elsewhere), softly blurred, warm ` +
        `daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real institution logo. ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 1 numbered point: a large bold yellow number (3) on the left, Korean text ` +
        `on the right in dark navy (#14213D) with white outline for readability, key phrases ` +
        `highlighted in red (#D93A3A) for the contrast point. Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `3. 고용률은 15세~64세 전체 평균,\n고령층 취업이 늘면\n청년이 힘들어도\n평균은 좋아 보여\n\n` +
        `Double-check the text character by character: it must read exactly ` +
        `"고용률은 15세부터 64세까지 전체 평균, 고령층 취업이 늘면 청년이 힘들어도 평균은 좋아 보여" — ` +
        `do not substitute or drop any character or digit.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "closing",
      file: "04_ep11_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram carousel card, 1080x1350px, the LAST slide of a 4-slide ` +
        `Korean finance carousel post (cover, body1, body2 already exist — this is slide 4/4, a ` +
        `text-heavy call-to-action card, NOT a character portrait or wallpaper). ` +
        `${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a bright employment center consultation desk scene with a smartphone screen ` +
        `icon (blurred, illegible), a standing information sign, softly blurred, warm daylight ` +
        `tone, ${BRIGHT_OVERLAY_NOTE} ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `This slide MUST contain large printed Korean text overlaid on the image — treat it like a ` +
        `news headline graphic, not a photo. Layout, top to bottom:\n` +
        `1) The yellow badge (top-left, as specified above)\n` +
        `2) A large bold yellow word with dark outline: "팔로우"\n` +
        `3) Below it, bold white text with black outline: "다음 소식도 먼저"\n` +
        `4) Below that, bold dark navy text (#14213D) with white outline, three lines exactly as ` +
        `written, no typos:\n"내 또래는 어떤지 궁금하다면\n워크넷이나 고용복지플러스센터에서\n채용 현황부터 확인해보기"\n\n` +
        `Position the owl character standing on the lower-right of the frame, smaller scale (about ` +
        `35% of image height), waving one wing, positioned so it does NOT overlap or cover any of ` +
        `the text blocks above.\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `carousel closing card, bright and clean, high contrast, photorealistic background.`,
    },
  ],
});
