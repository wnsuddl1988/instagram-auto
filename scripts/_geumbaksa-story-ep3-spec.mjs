/**
 * 금박사 Instagram Story 전용 이미지 스펙 — 표시 4편 배포(다들 무섭다고만
 * 하는 레버리지, 정확히 뭘까. 파일명 ep3 —
 * [[project_geumbaksa_episode_display_number_mapping]] 참고, 표시번호와
 * 파일명이 어긋나 있음).
 *
 * 배경(2026-09-20 확정 원칙): 카드뉴스 표지(1080x1350, 4:5)를 그대로
 * 스토리(1080x1920, 9:16)에 올리면 좌우가 크롭되어 헤드라인 텍스트가
 * 잘려나간다. 카드뉴스 이미지를 리사이즈/크롭하지 않고, 처음부터 9:16
 * 캔버스에 맞춰 별도로 새로 생성한다.
 *
 * 커버(00_geumbaksa_ep3_cover_thumb.png)와 같은 문구·캐릭터·톤을 쓰되,
 * 세로로 긴 캔버스에 맞게 구도만 재배치한다(텍스트를 상단, 캐릭터를
 * 중앙~하단에 배치해 세로 공간을 자연스럽게 채운다).
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
  episode: 3,
  character: "geumbaksa",
  title: "다들 무섭다고만 하는 레버리지, 정확히 뭘까",
  slides: [
    {
      id: "story_cover",
      file: "01_geumbaksa_ep3_story_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram Story image, exactly 1080x1920px (9:16 full-screen ` +
        `portrait), for a Korean finance information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: a bold dark navy-to-red gradient with faint downward red stock chart lines ` +
        `and a large translucent "3x" leverage badge in the corner, softly blurred, filling the ` +
        `entire 9:16 frame top to bottom, dramatic warning tone.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Upper third of the frame: large bold white/red headline text, exactly as written, no ` +
        `typos, centered horizontally with generous margin on both left and right so no letters ` +
        `are cut off at the edges:\n"레버리지,\n무섭다고만\n하지 말고"\n\n` +
        `Middle-to-lower area: position the gold coin character large and centered, both white ` +
        `gloved hands raised palms-forward in a startled "whoa, wait" gesture, wide alarmed eyes, ` +
        `open mouth. Leave comfortable safe margins on both sides (at least 8% of width) so ` +
        `nothing is cropped when displayed full-screen on a phone.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional but urgent ` +
        `financial news card, high contrast, no other text, composition designed for a full 9:16 ` +
        `vertical screen with no side cropping.`,
    },
  ],
});
