/**
 * 부엉박사 Instagram Story 전용 이미지 스펙 — 15편(v2 재제작, 실업급여 22년
 * 만의 개편).
 *
 * 배경 원칙(2026-09-20 확정, 황소특보 트랙에서 계승): 커버(1080x1920)를
 * 그대로 스토리에 올리면 레이아웃이 커버 전용으로 짜여 있어 어색할 수
 * 있으므로, 처음부터 9:16 캔버스에 맞춰 별도로 새로 생성한다.
 *
 * 커버와 같은 문구·캐릭터·톤을 쓰되, 배경은 본편에서 확정한 고용노동부
 * 정책 브리핑룸 컨셉으로 통일해 편의 시각 정체성을 유지한다.
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
  episode: 15,
  character: "owl",
  title: "실업급여 22년 만의 개편, 내년부터 얼마나 달라질까",
  slides: [
    {
      id: "story_cover",
      file: "01_owl_ep15_story_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram Story image, exactly 1080x1920px (9:16 full-screen ` +
        `portrait), for a Korean finance information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a government employment policy briefing room in the same cute, soft, ` +
        `cartoon 3D animation style as the character (never photorealistic) — a wooden podium, ` +
        `a large screen showing only faint employment policy icon silhouettes (no real logos or ` +
        `numbers), green/navy toned banners, potted plants on both sides, warm bright lighting, ` +
        `smooth floor, filling the entire 9:16 frame top to bottom, with a subtle dark navy ` +
        `semi-transparent overlay (about 40% opacity) for text contrast.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Upper third of the frame: large bold white/orange headline text, exactly as written, no ` +
        `typos, centered horizontally with generous margin on both left and right so no letters ` +
        `are cut off at the edges:\n"실업급여 22년 만에\n확 바뀐다"\n\n` +
        `Middle-to-lower area: position the owl character large and centered, one wing raised near ` +
        `its cheek in a puzzled "wait, what?" gesture, wide alert eyes. Leave comfortable safe ` +
        `margins on both sides (at least 8% of width) so nothing is cropped when displayed ` +
        `full-screen on a phone.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional but urgent ` +
        `financial news card, high contrast, no other text, composition designed for a full 9:16 ` +
        `vertical screen with no side cropping.`,
    },
  ],
});
