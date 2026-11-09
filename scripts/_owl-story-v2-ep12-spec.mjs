/**
 * 부엉박사 Instagram Story 전용 이미지 — 12편(v2, 토지거래허가구역 실거주 유예).
 * 9:16 전용으로 새로 생성(커버 재사용 금지). 배경은 본편과 같은 부동산 상담 사무소.
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
  episode: 12,
  character: "owl",
  title: "세입자 있는 집, 이제 입주를 2029년 말까지 미룰 수 있다",
  slides: [
    {
      id: "story_cover",
      file: "01_owl_v2_ep12_story_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram Story image, exactly 1080x1920px (9:16 full-screen ` +
        `portrait), for a Korean finance information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a bright real-estate consultation office in the same cute, soft, cartoon 3D ` +
        `animation style as the character (never photorealistic) — a navy wall sign reading ` +
        `"부동산", framed house photos, a consultation desk, beige chairs, plants, warm daylight, ` +
        `filling the entire 9:16 frame top to bottom, with a subtle dark navy semi-transparent ` +
        `overlay (about 40% opacity) for text contrast.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Upper third of the frame: large bold white/gold headline text, exactly as written, no ` +
        `typos, centered horizontally with generous margin on both left and right so no letters ` +
        `are cut off at the edges:\n"세입자 있는 집,\n바로 안 들어가도 돼?"\n\n` +
        `Middle-to-lower area: position the owl character large and centered, holding a small ` +
        `house-key card against its chest with one wing, sharp curious expression. Leave ` +
        `comfortable safe margins on both sides (at least 8% of width) so nothing is cropped when ` +
        `displayed full-screen on a phone.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional but energetic ` +
        `financial news card, high contrast, no other text, composition designed for a full 9:16 ` +
        `vertical screen with no side cropping.`,
    },
  ],
});
