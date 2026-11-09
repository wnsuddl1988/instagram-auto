/**
 * 황소특보 Instagram Story 전용 이미지 스펙 — 10편(11월 2일 저PBR 기업 공표 × 10월 22일
 * 공시 마감).
 *
 * 배경(2026-09-20 확정 원칙): 커버(1080x1920)를 그대로 스토리에 올리면 레이아웃이
 * 커버 전용으로 짜여 있어 어색할 수 있으므로, 처음부터 9:16 캔버스에 맞춰 별도로
 * 새로 생성한다. 커버와 같은 문구·캐릭터·톤을 쓰되, 배경은 본편의 도입·마무리 구역인
 * 증권거래소 공표 로비 컨셉으로 통일해 편의 시각 정체성을 유지한다(2026-09-30 Owner 지시:
 * 편마다 소재에 맞는 배경 — 트레이딩 라운지 재사용 금지).
 */

const BADGE_RULE =
  "Top-left corner: a large rounded gold badge (#F5A623), noticeably big and prominent " +
  "(roughly 20% of the image width), containing bold dark navy blue (#14213D) Korean text " +
  "\"경제번역소\". Do not add any text at the bottom of the image.";

const BULL_CHARACTER_NOTE =
  "Include the same 3D-rendered gold bull mascot character from the attached reference image " +
  "exactly as shown — same extreme SD-proportion golden bull with glasses, white shirt, burgundy " +
  "tie, navy pants, no jacket, no logos or marks anywhere on the outfit. Do not change its design.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_story_spec_v1",
  episode: 10,
  character: "bull",
  title: "11월 2일, 저PBR 명단이 내 증권앱에 뜬다",
  slides: [
    {
      id: "story_cover",
      file: "01_bull_ep10_story_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram Story image, exactly 1080x1920px (9:16 full-screen ` +
        `portrait), for a Korean finance information account. ${BULL_CHARACTER_NOTE}\n\n` +
        `Background: a bright, grand stock-exchange announcement lobby with a huge curved display ` +
        `wall of abstract candlestick shapes (no text or numbers), round cream columns with gold ` +
        `bands, potted plants, a glossy marble floor and soft golden ambient light, in the same ` +
        `cute, soft, cartoon 3D animation style as the character (never photorealistic), filling ` +
        `the entire 9:16 frame top to bottom, with a subtle dark emerald semi-transparent overlay ` +
        `(about 35% opacity) for text contrast.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Upper third of the frame: large bold white/gold headline text, exactly as written, no ` +
        `typos, centered horizontally with generous margin on both left and right so no letters ` +
        `are cut off at the edges:\n"11월 2일\n내 종목에 저PBR 태그가?"\n\n` +
        `Middle-to-lower area: position the gold bull character large and centered, both eyebrows ` +
        `raised high with wide curious eyes and one hand raised with the index finger up as if ` +
        `saying "check this first". Leave comfortable safe margins on both sides (at least 8% of ` +
        `width) so nothing is cropped when displayed full-screen on a phone.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional but intriguing ` +
        `financial news card, high contrast, no other text, composition designed for a full 9:16 ` +
        `vertical screen with no side cropping.`,
    },
  ],
});
