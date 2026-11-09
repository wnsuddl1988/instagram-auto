/**
 * 금박사 카드뉴스 6편(소득대체율 43%, 진짜 내 몫은 얼마일까) 슬라이드 스펙.
 * 원본 영상: scripts/_geumbaksa-ep6-assembly-spec.mjs (완성,
 * C:/tmp/geumbaksa-ep6-episode-final-v1/owl_episode_final.mp4).
 *
 * 밝은 배경 톤 원칙(Owner 2026-09-21, 6편부터 적용) 계승 — 1~5편의 다크 네이비
 * 오버레이 대신 부엉이 9편과 동일한 BRIGHT_OVERLAY_NOTE(밝은 오프화이트/라이트그레이,
 * 25~30% opacity)를 사용한다. 배지 규칙·하단 텍스트 제거·무브랜드 원칙은 동일 승계.
 *
 * 문구는 영상 대본을 그대로 옮기지 않고 카피라이팅 문체로 재구성(5편부터 확정 원칙).
 * 10씬 구조를 본문 3장으로 나눈다:
 *   본문1(1~2): 소득대체율 정의 + 계산식(가입기간×1.075%)
 *   본문2(3): 43%의 조건(40년 만근)과 현실(평균 20년, 21.5%)의 반전
 *   본문3(4~5): 가입기간을 늘리는 실질적 방법(추후납부/임의계속가입) + 조회 액션
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
  episode: 6,
  character: "geumbaksa",
  title: "국민연금 소득대체율 43%, 진짜 내 몫은 얼마일까",
  slides: [
    {
      id: "cover",
      file: "01_geumbaksa_ep6_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a warm, bright home-office or cozy study ` +
        `space with a calendar and timeline graph on the wall (blurred, illegible), softly blurred, ` +
        `warm daylight tone, ${BRIGHT_OVERLAY_NOTE}\n\n` +
        `Position the gold coin character on the right side of the frame, holding a small card ` +
        `reading "43%" with a curious, puzzled expression, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold navy/dark text (#14213D) with a thin white outline for contrast ` +
        `against the bright background, exactly as written, no typos:\n` +
        `"국민연금 소득대체율 43%\n사실 이게 그대로\n내 몫은 아니라는 거 알아?"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, bright and clean, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_geumbaksa_ep6_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a balance scale next to a rising staircase-bar ` +
        `chart icon on a wooden desk (blurred, numbers illegible), softly blurred, warm daylight ` +
        `tone, ${BRIGHT_OVERLAY_NOTE} No visible real institution name/logo — plain anonymous ` +
        `surfaces and generic icons only.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (1, 2) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key numbers/phrases highlighted in blue (#1B6FD1). Render the Korean text ` +
        `EXACTLY as written, no typos:\n\n` +
        `1. 소득대체율은 내가 벌던 돈 대비\n연금으로 몇 % 돌려받는지 보여주는 비율\n\n` +
        `2. 계산법은 가입기간(년) 곱하기 1.075%,\n1년마다 매년 쌓이는 구조야\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_geumbaksa_ep6_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a timeline graph spanning from age 20 to 60 ` +
        `next to a shorter highlighted segment marking 20 years (blurred, numbers illegible), softly ` +
        `blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real institution name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 1 numbered point: a large bold yellow number (3) on the left, Korean text ` +
        `on the right in dark navy (#14213D) with white outline for readability, key phrases ` +
        `highlighted in red (#D93A3A) for the reality-check contrast. Render the Korean text EXACTLY ` +
        `as written, no typos:\n\n` +
        `3. 43%는 40년 만근 기준 최댓값,\n실제 평균 가입기간은 20년\n소득대체율로 치면 21.5%에 그쳐\n\n` +
        `Double-check the text character by character: it must read exactly ` +
        `"43%는 40년 만근 기준 최댓값, 실제 평균 가입기간은 20년, 소득대체율로 치면 21.5%에 그쳐" — ` +
        `do not substitute or drop any character or digit.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "body3",
      file: "04_geumbaksa_ep6_body3.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: realistic photographic image of a puzzle piece filling a gap in a timeline, ` +
        `next to a smartphone showing a simple checkmark screen (blurred, numbers illegible), softly ` +
        `blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} No visible real institution name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold yellow numbers (4, 5) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key numbers/phrases highlighted in blue (#1B6FD1). Render the Korean text ` +
        `EXACTLY as written, no typos:\n\n` +
        `4. 과거 공백기간은 추후납부로 최대 119개월,\n60세 이후는 임의계속가입으로 65세 전까지\n\n` +
        `5. 내 정확한 예상 가입기간은\n국민연금공단 앱·홈페이지에서 바로 조회 가능\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast, photorealistic background.`,
    },
    {
      id: "closing",
      file: "05_geumbaksa_ep6_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram carousel card, 1080x1350px, the LAST slide of a 5-slide Korean ` +
        `finance carousel post (cover, body1, body2, body3 already exist — this is slide 5/5, a ` +
        `text-heavy call-to-action card, NOT a character portrait or wallpaper). ` +
        `${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: same realistic warm home-office or cozy study space as the cover slide, softly ` +
        `blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `This slide MUST contain large printed Korean text overlaid on the image — treat it like a ` +
        `news headline graphic, not a photo. Layout, top to bottom:\n` +
        `1) The yellow badge (top-left, as specified above)\n` +
        `2) A large bold yellow word with dark outline: "팔로우"\n` +
        `3) Below it, bold white text with black outline: "다음 소식도 먼저"\n` +
        `4) Below that, bold dark navy text (#14213D) with white outline, two lines exactly as ` +
        `written, no typos:\n"43%는 최댓값이지 내 몫이 아니야\n내 가입기간을 곱해봐야 진짜 숫자가 나와"\n\n` +
        `Position the gold coin character standing on the lower-right of the frame, smaller scale ` +
        `(about 35% of image height), waving one hand, positioned so it does NOT overlap or cover ` +
        `any of the text blocks above.\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `carousel closing card, bright and clean, high contrast, photorealistic background.`,
    },
  ],
});
