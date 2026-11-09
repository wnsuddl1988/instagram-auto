/**
 * 부엉박사 Instagram Story 전용 이미지 스펙 — 18편(v2, 전세사기 최소보장제).
 *
 * 배경 원칙(2026-09-20 확정): 커버(1080x1920)를 그대로 스토리에 올리면 레이아웃이 커버
 * 전용이라 어색할 수 있으므로, 처음부터 9:16 캔버스에 맞춰 별도로 새로 생성한다.
 * 커버와 같은 문구·캐릭터·톤을 쓰되, 배경은 본편의 주거·임대차 법률상담 창구로 통일한다.
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
  episode: 18,
  character: "owl",
  title: "전세사기 보증금, 국가가 채워준다고?",
  slides: [
    {
      id: "story_cover",
      file: "01_owl_ep18_story_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram Story image, exactly 1080x1920px (9:16 full-screen ` +
        `portrait), for a Korean finance information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a housing and lease legal consultation counter in the same cute, soft, ` +
        `cartoon 3D animation style as the character (never photorealistic) — a round consultation ` +
        `desk, a wall sign with simple contract, coin and house icons (icons only, no long text), ` +
        `potted plants, navy chairs, warm bright lighting, smooth floor, filling the entire 9:16 ` +
        `frame top to bottom, with a subtle dark navy semi-transparent overlay (about 40% opacity) ` +
        `for text contrast.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Upper third of the frame: large bold white/gold headline text, exactly as written, no ` +
        `typos, centered horizontally with generous margin on both left and right so no letters ` +
        `are cut off at the edges:\n"전세사기 보증금\n국가가 채워준다고?"\n\n` +
        `Middle-to-lower area: position the owl character large and centered, holding a small card ` +
        `at chest height with a surprised, hopeful "wait, really?" expression, wide alert eyes. ` +
        `Leave comfortable safe margins on both sides (at least 8% of width) so nothing is cropped ` +
        `when displayed full-screen on a phone.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional but hopeful ` +
        `financial news card, high contrast, no other text, composition designed for a full 9:16 ` +
        `vertical screen with no side cropping.`,
    },
  ],
});
