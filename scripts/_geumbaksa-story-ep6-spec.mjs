/**
 * 금박사 Instagram Story 전용 이미지 스펙 — 파일 ep6(표시 8편, 2026-09-26 재배치),
 * 국민연금 소득대체율 43%, 진짜 내 몫은 얼마일까.
 * 9:16 전용으로 새로 생성(커버 재사용 금지). 같은 날 부엉박사 14편(국민연금 보험료 인상)에서
 * "소득대체율"을 넘겨받는 편.
 */

const BADGE_RULE =
  "Top-left corner: a large rounded yellow badge (#FFD54A), noticeably big and prominent " +
  "(bigger than a normal UI badge, roughly 20% of the image width), containing bold dark " +
  "navy blue (#14213D) Korean text \"경제번역소\". Do not add any text at the bottom of the image.";

const GEUMBAKSA_CHARACTER_NOTE =
  "Include the same 3D-rendered gold coin mascot character from the attached reference image " +
  "exactly as shown — same golden metallic disc-shaped body, same friendly smiling face, white " +
  "gloved hands, round gold feet, no clothing. Do not change its design. The coin surface must be " +
  "smooth and blank — no engraved letters, logos, or words on the coin body.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_story_spec_v1",
  episode: 6,
  character: "geumbaksa",
  title: "국민연금 소득대체율 43%, 진짜 내 몫은 얼마일까",
  slides: [
    {
      id: "story_cover",
      file: "01_geumbaksa_ep6_story_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram Story image, exactly 1080x1920px (9:16 full-screen ` +
        `portrait), for a Korean finance information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: a bright, cozy study with wooden bookshelves and a wall calendar in the same ` +
        `cute, soft, cartoon 3D animation style as the character (never photorealistic), warm ` +
        `daylight, with a subtle dark navy semi-transparent overlay (about 40% opacity) for text ` +
        `contrast, filling the entire 9:16 frame top to bottom. No readable text in the background.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Upper third of the frame: large bold white/gold headline text, exactly as written, no ` +
        `typos, centered horizontally with generous margin on both left and right so no letters ` +
        `are cut off at the edges:\n"연금 43%,\n진짜 내 몫일까?"\n\n` +
        `Middle-to-lower area: position the gold coin character large and centered, holding a ` +
        `small card showing only a big question mark with both gloved hands, curious expression. ` +
        `Leave comfortable safe margins on both sides (at least 8% of width) so nothing is cropped ` +
        `when displayed full-screen on a phone.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional but friendly ` +
        `financial news card, high contrast, no other text, composition designed for a full 9:16 ` +
        `vertical screen with no side cropping.`,
    },
  ],
});
