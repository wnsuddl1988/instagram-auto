/**
 * 황소특보 Instagram Story 전용 이미지 스펙 — 9편(오픈AI 신모델 출시 취소 × 마이크론
 * 실적 D-1).
 *
 * 배경(2026-09-20 확정 원칙): 커버(1080x1920)를 그대로 스토리에 올리면 레이아웃이
 * 커버 전용으로 짜여 있어 어색할 수 있으므로, 처음부터 9:16 캔버스에 맞춰 별도로
 * 새로 생성한다. 커버와 같은 문구·캐릭터·톤을 쓰되, 배경은 본편에서 확정한 증권사
 * 트레이딩 라운지 컨셉으로 통일해 편의 시각 정체성을 유지한다.
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
  episode: 9,
  character: "bull",
  title: "오픈AI가 접었는데 마이크론은 500억 달러?",
  slides: [
    {
      id: "story_cover",
      file: "01_bull_ep9_story_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram Story image, exactly 1080x1920px (9:16 full-screen ` +
        `portrait), for a Korean finance information account. ${BULL_CHARACTER_NOTE}\n\n` +
        `Background: a modern securities trading lounge with large wall-mounted monitors showing ` +
        `blue candlestick stock charts, a city skyline visible through floor-to-ceiling windows, ` +
        `soft golden ambient lighting, in the same cute, soft, cartoon 3D animation style as the ` +
        `character (never photorealistic), filling the entire 9:16 frame top to bottom, with a ` +
        `subtle dark navy semi-transparent overlay (about 40% opacity) for text contrast.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Upper third of the frame: large bold white/gold headline text, exactly as written, no ` +
        `typos, centered horizontally with generous margin on both left and right so no letters ` +
        `are cut off at the edges:\n"오픈AI가 접었는데\n마이크론은 500억 달러?"\n\n` +
        `Middle-to-lower area: position the gold bull character large and centered, one hand on ` +
        `its chin as if thinking hard, one eyebrow raised high in a puzzled, skeptical look with ` +
        `wide curious eyes. Leave comfortable safe margins on both sides (at least 8% of width) so ` +
        `nothing is cropped when displayed full-screen on a phone.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional but intriguing ` +
        `financial news card, high contrast, no other text, composition designed for a full 9:16 ` +
        `vertical screen with no side cropping.`,
    },
  ],
});
