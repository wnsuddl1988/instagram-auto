/**
 * 금박사 Instagram Story 전용 이미지 스펙 — 4편(파일명 순번, 실제 배포는
 * 1편 — 환율).
 *
 * 배경(2026-09-20): 카드뉴스 표지(1080x1350, 4:5)를 그대로 스토리(1080x1920,
 * 9:16)에 올렸더니 좌우가 크롭되어 헤드라인 텍스트가 잘려나갔다(Owner
 * 스크린샷으로 확인). 카드뉴스 이미지를 리사이즈/크롭하지 않고, 처음부터
 * 9:16 캔버스에 맞춰 별도로 새로 생성한다 — 단순 크롭은 텍스트 위치를
 * 다시 계산해야 해서 오히려 더 위험하다.
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
  episode: 4,
  character: "geumbaksa",
  title: "환율이 오르면 왜 내 지갑부터 나라 금리까지 흔들릴까",
  slides: [
    {
      id: "story_cover",
      file: "01_geumbaksa_ep4_story_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram Story image, exactly 1080x1920px (9:16 full-screen ` +
        `portrait), for a Korean finance information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a warm, bright home-studio or cozy office ` +
        `space, softly blurred, with a subtle dark navy semi-transparent overlay (about 45% ` +
        `opacity) for text contrast, filling the entire 9:16 frame top to bottom.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Upper third of the frame: large bold white/yellow headline text, exactly as written, no ` +
        `typos, centered horizontally with generous margin on both left and right so no letters ` +
        `are cut off at the edges:\n"환율이 오르면\n내 지갑에\n생기는 일"\n\n` +
        `Middle-to-lower area: position the gold coin character large and centered, holding a ` +
        `small card with a balance scale showing ₩ and $ symbols, with a curious, welcoming ` +
        `expression. Leave comfortable safe margins on both sides (at least 8% of width) so ` +
        `nothing is cropped when displayed full-screen on a phone.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional but friendly ` +
        `financial news card, high contrast, no other text, composition designed for a full 9:16 ` +
        `vertical screen with no side cropping.`,
    },
  ],
});
