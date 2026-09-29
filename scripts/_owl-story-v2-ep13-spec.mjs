/**
 * 부엉박사 Instagram Story 전용 이미지 — 13편(v2, 고용률 역대 최고 vs 청년 취업,
 * 구직촉진수당). 9:16 전용으로 새로 생성. 배경은 본편과 같은 고용센터.
 */

const BADGE_RULE =
  "Top-left corner: a large rounded yellow badge (#FFD54A), noticeably big and prominent " +
  "(roughly 20% of the image width), containing bold dark navy blue (#14213D) Korean text " +
  "\"경제번역소\". Do not add any text at the bottom of the image.";

const OWL_CHARACTER_NOTE =
  "Include the same 3D-rendered chibi owl mascot character from the attached reference image " +
  "exactly as shown — same face, feathers, glasses, vest, tie. Do not change its design.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_story_spec_v1",
  episode: 13,
  character: "owl",
  title: "고용률 역대 최고인데 취업은 왜 더 어려울까, 지금 챙길 지원금",
  slides: [
    {
      id: "story_cover",
      file: "01_owl_v2_ep13_story_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram Story image, exactly 1080x1920px (9:16 full-screen ` +
        `portrait), for a Korean finance information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a bright public employment center in the same cute, soft, cartoon 3D ` +
        `animation style as the character (never photorealistic) — a wall sign reading "고용센터", ` +
        `counseling desks, blue chairs, plants, warm daylight, filling the entire 9:16 frame top to ` +
        `bottom, with a subtle dark navy semi-transparent overlay (about 40% opacity) for text ` +
        `contrast. No other readable text in the background.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Upper third of the frame: large bold white/gold headline text, exactly as written, no ` +
        `typos, centered horizontally with generous margin on both left and right so no letters ` +
        `are cut off at the edges:\n"고용률 역대 최고,\n근데 나만 힘들어?"\n\n` +
        `Middle-to-lower area: position the owl character large and centered, one wing on its chin ` +
        `in a thoughtful pose, sharp curious eyes. Leave comfortable safe margins on both sides (at ` +
        `least 8% of width) so nothing is cropped when displayed full-screen on a phone.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional but energetic ` +
        `financial news card, high contrast, no other text, composition designed for a full 9:16 ` +
        `vertical screen with no side cropping.`,
    },
  ],
});
