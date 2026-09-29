/**
 * 금박사 Instagram Story 전용 이미지 스펙 — 9편(DB형인지 DC형인지도 모르고
 * 회사 다니는 사람 진짜 많던데).
 *
 * 배경(2026-09-20 확정 원칙): 카드뉴스 표지(1080x1350, 4:5)를 그대로
 * 스토리(1080x1920, 9:16)에 올리면 좌우가 크롭되어 헤드라인 텍스트가
 * 잘려나간다. 카드뉴스 이미지를 리사이즈/크롭하지 않고, 처음부터 9:16
 * 캔버스에 맞춰 별도로 새로 생성한다.
 *
 * 카드뉴스 표지와 같은 문구·캐릭터·톤을 쓰되, 세로로 긴 캔버스에 맞게
 * 구도만 재배치한다(텍스트를 상단, 캐릭터를 중앙~하단에 배치해 세로
 * 공간을 자연스럽게 채운다).
 */

const BADGE_RULE =
  "Top-left corner: a large rounded yellow badge (#FFD54A), noticeably big and prominent " +
  "(bigger than a normal UI badge, roughly 20% of the image width), containing bold dark " +
  "navy blue (#14213D) Korean text \"경제번역소\". Do not add any text at the bottom of the image.";

const GEUMBAKSA_CHARACTER_NOTE =
  "Include the same 3D-rendered gold coin mascot character from the attached reference image " +
  "exactly as shown — same golden metallic disc-shaped body, same friendly smiling face, no " +
  "clothing. Do not change its design.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_story_spec_v1",
  episode: 9,
  character: "geumbaksa",
  title: "DB형인지 DC형인지도 모르고 회사 다니는 사람 진짜 많던데",
  slides: [
    {
      id: "story_cover",
      file: "01_geumbaksa_ep9_story_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram Story image, exactly 1080x1920px (9:16 full-screen ` +
        `portrait), for a Korean finance information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a bright retirement-pension consultation ` +
        `desk space with a blurred "퇴직연금 상담" wall sign, softly blurred, with a subtle dark ` +
        `navy semi-transparent overlay (about 45% opacity) for text contrast, filling the entire ` +
        `9:16 frame top to bottom.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Upper third of the frame: large bold white/yellow headline text, exactly as written, no ` +
        `typos, centered horizontally with generous margin on both left and right so no letters ` +
        `are cut off at the edges:\n"DB형인지 DC형인지도\n모르고 회사\n다니는 사람 많던데"\n\n` +
        `Middle-to-lower area: position the gold coin character large and centered, holding a ` +
        `small card with a question mark, surprised and curious expression. Leave comfortable safe ` +
        `margins on both sides (at least 8% of width) so nothing is cropped when displayed ` +
        `full-screen on a phone.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional but friendly ` +
        `financial news card, high contrast, no other text, composition designed for a full 9:16 ` +
        `vertical screen with no side cropping.`,
    },
  ],
});
