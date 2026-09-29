/**
 * 황소특보 Instagram Story 전용 이미지 스펙 — 2편(레버리지 ETF 반전 수급,
 * 개미는 팔고 외국인·기관은 담았다).
 *
 * 배경(2026-09-20 확정 원칙): 커버(1080x1920)를 그대로 스토리에 올리면
 * 레이아웃이 커버 전용으로 짜여 있어 어색할 수 있으므로, 처음부터 9:16
 * 캔버스에 맞춰 별도로 새로 생성한다.
 *
 * 커버와 같은 문구·캐릭터·톤을 쓰되, 배경은 본편에서 확정한 증권사 트레이딩
 * 라운지(캔들차트 모니터, 파스텔톤) 컨셉으로 통일해 편의 시각 정체성을
 * 유지한다.
 */

const BADGE_RULE =
  "Top-left corner: a large rounded gold badge (#F5A623), noticeably big and prominent " +
  "(roughly 20% of the image width), containing bold dark navy blue (#14213D) Korean text " +
  "\"경제번역소\". Do not add any text at the bottom of the image.";

const BULL_CHARACTER_NOTE =
  "Include the same 3D-rendered gold bull mascot character from the attached reference image " +
  "exactly as shown — same extreme SD-proportion golden bull with glasses, white shirt, burgundy " +
  "tie, navy pants, no jacket. Do not change its design.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_story_spec_v1",
  episode: 2,
  character: "bull",
  title: "레버리지 ETF, 개미는 팔고 외국인·기관은 담았다",
  slides: [
    {
      id: "story_cover",
      file: "01_bull_ep2_story_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram Story image, exactly 1080x1920px (9:16 full-screen ` +
        `portrait), for a Korean finance information account. ${BULL_CHARACTER_NOTE}\n\n` +
        `Background: a securities trading lounge in the same cute, soft, cartoon 3D animation ` +
        `style as the character (never photorealistic) — smooth rounded monitors with faint ` +
        `candlestick chart silhouettes on both sides, pastel-toned lighting, smooth floor, filling ` +
        `the entire 9:16 frame top to bottom, with a subtle dark navy semi-transparent overlay ` +
        `(about 40% opacity) for text contrast.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Upper third of the frame: large bold white/gold headline text, exactly as written, no ` +
        `typos, centered horizontally with generous margin on both left and right so no letters ` +
        `are cut off at the edges:\n"개미 팔 때\n누가 담았을까"\n\n` +
        `Middle-to-lower area: position the gold bull character large and centered, one hand ` +
        `raised near its face in a surprised "can you believe this" gesture, wide excited eyes. ` +
        `Leave comfortable safe margins on both sides (at least 8% of width) so nothing is cropped ` +
        `when displayed full-screen on a phone.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional but energetic ` +
        `financial news card, high contrast, no other text, composition designed for a full 9:16 ` +
        `vertical screen with no side cropping.`,
    },
  ],
});
