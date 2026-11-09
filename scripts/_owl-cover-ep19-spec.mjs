/**
 * 부엉박사 표시 18편(파일 19, 청년미래적금 2차 — 10/7~16 신청) 릴스 커버 = 유튜브 썸네일 = 인스타 스토리 통합 스펙.
 * (Owner 2026-10-01: 스토리 이미지는 따로 만들지 않고 커버로 통일, 규칙 7. 12편 `_bull-cover-ep12-spec.mjs` 방식 승계)
 *
 * 글자는 모델이 아니라 합성기(`run-cover-headline-overlay-once.mjs`)가 얹는다 → 글자·배지 없는 배경+캐릭터만 생성.
 * 윗 50%는 비운다(캐릭터 귀깃 끝 ≈50%·눈 ≈62%). "경제번역소" 배지는 Owner 결정 대기, 기본안 = 제외.
 * 색: 이전 편(황금·남색→청록·보라·에메랄드 등)과 겹치지 않게 짙은 자두색(#3B0F3F) → 장미핑크·피치 글로우. 경고색(빨강)·로고·랜드마크 없음.
 * 훅 감정: "잠깐, 열흘 안에 신청 못 하면 정부 돈을 놓친다고?" — 놀람·다급. 헤드라인(합성기): "청년미래적금 / 열흘 안에 신청".
 */

const OWL_CHARACTER_NOTE =
  "Include the same 3D-rendered owl mascot character from the attached reference image exactly " +
  "as shown — same owl body proportions, charcoal vest, white shirt, burgundy tie, sunglasses " +
  "pushed up on the forehead. Do not change its core design, but EXAGGERATE its expression far " +
  "beyond the reference image: eyes wide open in alarm, both eyebrows raised high, beak open in an " +
  "urgent \"wait, you could miss it?!\" shape, one wing raised with a pointing gesture. Dramatic, " +
  "attention-grabbing — think a sharp anchor flagging a deadline, not the usual calm analytical look. " +
  "The wings hold no object and no card.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 19,
  character: "owl",
  title: "청년미래적금 2차, 열흘 안에 신청 못 하면 정부 돈을 놓쳐",
  slides: [
    {
      id: "cover_thumb",
      file: "00_owl_ep19_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover background image for a Korean finance ` +
        `Shorts video, designed to feel intriguing even when shrunk down to a tiny square grid ` +
        `thumbnail. ${OWL_CHARACTER_NOTE}\n\n` +
        `CRITICAL LAYOUT (a headline will be added later by software, so leave room for it): the ` +
        `upper 50% of the frame must contain NO character and NO text — only the decorative ` +
        `background (glow, flowing light ribbons, scattered coins). The character's ear tufts start ` +
        `at about 50% of the frame height, its eyes and beak sit near 62% of the frame height, and ` +
        `its body continues down to the bottom edge (feet may be cropped). The character is centered ` +
        `horizontally and its full width stays within the central 70% of the frame (nothing closer ` +
        `than 15% to the left or right edge). Do NOT write any headline, title, caption, numbers, ` +
        `badge, logo or any other text anywhere in the image — there must be NO text at all; the ` +
        `headline area is intentionally left empty.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic scene. ` +
        `Use a dramatic gradient from deep plum (#3B0F3F) at the top to a vivid rose-pink and warm ` +
        `peach (#F472B6 to #FDBA74) glow radiating from behind the character, with soft white and ` +
        `mint (#6EE7B7) flowing ribbons of light curving from left to right, a few large soft-focus ` +
        `plain gold coins and small rounded piggy-bank-like shapes floating (no symbols, no text, no ` +
        `currency marks), kept abstract and dark enough that white text placed over the upper half ` +
        `stays highly legible. Urgent, "don't miss it" mood, high energy. Do not use red or warning ` +
        `colors. No buildings, landmarks, flags or globes.\n\n` +
        `Style: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft 3D ` +
        `animated-film style matching the character.`,
    },
  ],
});
