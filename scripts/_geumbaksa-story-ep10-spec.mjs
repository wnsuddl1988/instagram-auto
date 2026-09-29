/**
 * 금박사 Instagram Story 전용 이미지 스펙 — 10편(실업급여 하루 6만8480원으로
 * 올랐다는데, 왜 통장엔 22만원이 덜 들어올까).
 *
 * 배경(2026-09-20 확정 원칙): 커버(1080x1920)를 그대로 스토리에 올리면
 * 레이아웃이 커버 전용으로 짜여 있어 어색할 수 있으므로, 처음부터 9:16
 * 캔버스에 맞춰 별도로 새로 생성한다.
 *
 * 커버와 같은 문구·캐릭터·톤을 쓰되, 세로로 긴 캔버스에 맞게 구도만
 * 재배치한다(텍스트를 상단, 캐릭터를 중앙~하단에 배치해 세로 공간을
 * 자연스럽게 채운다).
 */

const BADGE_RULE =
  "Top-left corner: a large rounded yellow badge (#FFD54A), noticeably big and prominent " +
  "(bigger than a normal UI badge, roughly 20% of the image width), containing bold dark " +
  "navy blue (#14213D) Korean text \"경제번역소\". Do not add any text at the bottom of the image.";

const GEUMBAKSA_CHARACTER_NOTE =
  "Include the same 3D-rendered gold coin mascot character from the attached reference image " +
  "exactly as shown — same golden metallic disc-shaped body, same friendly face, no clothing. " +
  "Do not change its design.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_story_spec_v1",
  episode: 10,
  character: "geumbaksa",
  title: "실업급여 하루 6만8480원으로 올랐다는데, 왜 통장엔 22만원이 덜 들어올까",
  slides: [
    {
      id: "story_cover",
      file: "01_geumbaksa_ep10_story_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram Story image, exactly 1080x1920px (9:16 full-screen ` +
        `portrait), for a Korean finance information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a bright unemployment insurance ` +
        `consultation desk space with a blurred "실업급여 안내" wall sign, softly blurred, with a ` +
        `subtle dark navy semi-transparent overlay (about 45% opacity) for text contrast, filling ` +
        `the entire 9:16 frame top to bottom.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Upper third of the frame: large bold white/yellow headline text, exactly as written, no ` +
        `typos, centered horizontally with generous margin on both left and right so no letters ` +
        `are cut off at the edges:\n"실업급여 인상됐다는데\n통장은 왜\n오히려 줄어들까"\n\n` +
        `Middle-to-lower area: position the gold coin character large and centered, holding a small ` +
        `card with a downward arrow icon, puzzled and surprised expression. Leave comfortable safe ` +
        `margins on both sides (at least 8% of width) so nothing is cropped when displayed ` +
        `full-screen on a phone. Do not add any government emblem, national flag, official seal, or ` +
        `agency logo anywhere in the image, even in the blurred background — keep the background ` +
        `signage generic with no symbols beyond the text itself.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional but attention` +
        `-grabbing financial news card, high contrast, no other text, composition designed for a ` +
        `full 9:16 vertical screen with no side cropping.`,
    },
  ],
});
