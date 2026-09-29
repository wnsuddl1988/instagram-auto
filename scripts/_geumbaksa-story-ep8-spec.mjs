/**
 * 금박사 Instagram Story 전용 이미지 스펙 — 파일 ep8(표시 6편, 2026-09-26 재배치),
 * 강남3구·용산만 토지거래허가구역인 줄 알았는데.
 *
 * 9:16 전용으로 새로 생성(커버 재사용 금지). 커버(geumbaksa-cover-ep8, "우리 동네도
 * 해당될 수 있다")와 톤을 맞추고 문구는 스토리용 질문형. 같은 날 부엉박사 12편
 * ("우리 동네도 토지거래허가구역인지 궁금하면 금박사가")에서 넘어오는 시청자를 받는 편.
 */

const BADGE_RULE =
  "Top-left corner: a large rounded yellow badge (#FFD54A), noticeably big and prominent " +
  "(bigger than a normal UI badge, roughly 20% of the image width), containing bold dark " +
  "navy blue (#14213D) Korean text \"경제번역소\". Do not add any text at the bottom of the image.";

const GEUMBAKSA_CHARACTER_NOTE =
  "Include the same 3D-rendered gold coin mascot character from the attached reference image " +
  "exactly as shown — same golden metallic disc-shaped body, same friendly smiling face, white " +
  "gloved hands, round gold feet, no clothing. Do not change its design.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_story_spec_v1",
  episode: 8,
  character: "geumbaksa",
  title: "강남3구·용산만 토지거래허가구역인 줄 알았는데",
  slides: [
    {
      id: "story_cover",
      file: "01_geumbaksa_ep8_story_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram Story image, exactly 1080x1920px (9:16 full-screen ` +
        `portrait), for a Korean finance information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: a bright city-map themed scene in the same cute, soft, cartoon 3D animation ` +
        `style as the character (never photorealistic) — a large stylized city map on the wall ` +
        `with several red location pins and no readable place names, apartment buildings, warm ` +
        `daylight, with a subtle dark navy semi-transparent overlay (about 40% opacity) for text ` +
        `contrast, filling the entire 9:16 frame top to bottom.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Upper third of the frame: large bold white/gold headline text, exactly as written, no ` +
        `typos, centered horizontally with generous margin on both left and right so no letters ` +
        `are cut off at the edges:\n"우리 동네도\n토지거래허가구역?"\n\n` +
        `Middle-to-lower area: position the gold coin character large and centered, hugging a ` +
        `big red location pin with both gloved hands, curious and slightly surprised expression. ` +
        `Leave comfortable safe margins on both sides (at least 8% of width) so nothing is cropped ` +
        `when displayed full-screen on a phone.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional but friendly ` +
        `financial news card, high contrast, no other text, composition designed for a full 9:16 ` +
        `vertical screen with no side cropping.`,
    },
  ],
});
