/**
 * 금박사 Instagram Story 전용 이미지 스펙 — 11편(주 5일 알바하는데 하루는
 * 안 나가도 돈이 들어온다면?).
 *
 * 배경(2026-09-20 확정 원칙): 커버(1080x1920)를 그대로 스토리에 올리면
 * 레이아웃이 커버 전용으로 짜여 있어 어색할 수 있으므로, 처음부터 9:16
 * 캔버스에 맞춰 별도로 새로 생성한다.
 *
 * 커버와 같은 문구·캐릭터·톤을 쓰되, 배경은 11편 본편에서 확정한
 * 인사총무팀 근로계약 상담 창구 컨셉으로 통일해 편의 시각 정체성을
 * 유지한다.
 */

const BADGE_RULE =
  "Top-left corner: a large rounded yellow badge (#FFD54A), noticeably big and prominent " +
  "(bigger than a normal UI badge, roughly 20% of the image width), containing bold dark " +
  "navy blue (#14213D) Korean text \"경제번역소\". Do not add any text at the bottom of the image.";

const GEUMBAKSA_CHARACTER_NOTE =
  "Include the same 3D-rendered gold coin mascot character from the attached reference image " +
  "exactly as shown — same golden metallic disc-shaped body, same white gloved hands and feet, no " +
  "clothing. Do not change its design.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_story_spec_v1",
  episode: 11,
  character: "geumbaksa",
  title: "주 5일 알바하는데 하루는 안 나가도 돈이 들어온다면?",
  slides: [
    {
      id: "story_cover",
      file: "01_geumbaksa_ep11_story_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram Story image, exactly 1080x1920px (9:16 full-screen ` +
        `portrait), for a Korean finance information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: an HR/labor-contract consultation desk office space, with blurred payslip and ` +
        `labor-contract poster signage on the wall, warm lighting, in the same cute, soft, cartoon ` +
        `3D animation style as the character (never photorealistic), filling the entire 9:16 frame ` +
        `top to bottom, with a subtle dark navy semi-transparent overlay (about 40% opacity) for ` +
        `text contrast.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Upper third of the frame: large bold white/yellow headline text, exactly as written, no ` +
        `typos, centered horizontally with generous margin on both left and right so no letters ` +
        `are cut off at the edges:\n"안 나가도 돈이?\n주휴수당"\n\n` +
        `Middle-to-lower area: position the gold coin character large and centered, both hands ` +
        `raised near its face in an excited "wait, really?" gesture, wide surprised eyes, mouth open ` +
        `in a delighted gasp. Leave comfortable safe margins on both sides (at least 8% of width) so ` +
        `nothing is cropped when displayed full-screen on a phone.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional but exciting ` +
        `financial news card, high contrast, no other text, composition designed for a full 9:16 ` +
        `vertical screen with no side cropping.`,
    },
  ],
});
