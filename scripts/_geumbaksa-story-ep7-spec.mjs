/**
 * 금박사 Instagram Story 전용 이미지 스펙 — 파일 ep7(표시 5편, 2026-09-26
 * 재배치), 예금자보호 한도 1억원, 진짜 다 보호되는 걸까.
 *
 * 9:16 전용으로 새로 생성(커버 재사용 금지 원칙). 커버(geumbaksa-cover-ep7-final,
 * "내 돈, 안전하지 않을 수도")와 톤은 맞추되 문구는 스토리용 질문형으로 바꾼다.
 * 같은 날 부엉박사 11편(청약통장, "예금자보호 한도가 궁금하면 금박사가")에서
 * 넘어오는 시청자를 받는 편.
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
  episode: 7,
  character: "geumbaksa",
  title: "예금자보호 한도 1억원, 진짜 다 보호되는 걸까",
  slides: [
    {
      id: "story_cover",
      file: "01_geumbaksa_ep7_story_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram Story image, exactly 1080x1920px (9:16 full-screen ` +
        `portrait), for a Korean finance information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: a bright, clean bank counter scene in the same cute, soft, cartoon 3D ` +
        `animation style as the character (never photorealistic) — a service counter, a large ` +
        `closed vault door with a shield icon, stacks of coins and bankbooks, warm daylight, ` +
        `with a subtle dark navy semi-transparent overlay (about 40% opacity) for text contrast, ` +
        `filling the entire 9:16 frame top to bottom. No real bank names or logos.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Upper third of the frame: large bold white/gold headline text, exactly as written, no ` +
        `typos, centered horizontally with generous margin on both left and right so no letters ` +
        `are cut off at the edges:\n"예금자보호 1억,\n진짜 다 지켜줄까?"\n\n` +
        `Middle-to-lower area: position the gold coin character large and centered, hugging a ` +
        `small shield icon with both gloved hands, curious and slightly worried expression. Leave ` +
        `comfortable safe margins on both sides (at least 8% of width) so nothing is cropped when ` +
        `displayed full-screen on a phone.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional but friendly ` +
        `financial news card, high contrast, no other text, composition designed for a full 9:16 ` +
        `vertical screen with no side cropping.`,
    },
  ],
});
