/**
 * 황소특보 20편(엔비디아 GPU가 담보로 잡힌다, 수명 10년 vs 3~4년) — 릴스 커버 = 유튜브 썸네일 = 인스타 스토리 통합 스펙(규칙 7).
 * 글자는 합성기(`run-cover-headline-overlay-once.mjs`)가 얹으므로 글자 없는 배경+캐릭터만 생성, 윗 50%는 비움.
 * 20편 훅 감정: "칩이 집처럼 담보로 잡힌다고?" — 놀람+호기심(눈 크게, 눈썹 높이, 입 살짝 벌림, 양손으로 작은 칩 하나를 소중히 감싸 쥐고 들여다보는 포즈).
 * 배경색은 7~19편(빨강·주황·남색/청록·에메랄드·인디고·바이올렛·슬레이트→레몬·흑연·에스프레소·올리브·차콜 틸→코랄·플럼→라벤더·로열 블루→민트)과 겹치지 않게
 * 짙은 포레스트 그린-블랙 → 밝은 샴페인 골드 글로우, 뒤에 글자 없는 금빛 자물쇠 실루엣 하나와 작은 칩 모양 사각형 몇 개(추상, 로고·글자·숫자 없음).
 * 경고색(빨강)·종목명·로고·글자·숫자 없음, 매수·매도 암시 없음.
 */

const BULL_CHARACTER_NOTE =
  "Include the same 3D-rendered gold bull mascot character from the attached reference image " +
  "exactly as shown — same extreme SD-proportion golden bull with glasses, white shirt, burgundy " +
  "tie, navy pants, no jacket, no logos or marks anywhere on the outfit. Do not change its core " +
  "design (color, glasses, outfit), but EXAGGERATE its facial expression far beyond the reference " +
  "image: both eyes wide open and round, eyebrows raised very high, mouth slightly open in a " +
  "surprised and curious \"wait, a chip can be used as collateral like a house?\" expression, both hands cupped in front of the chest " +
  "holding one small plain dark square computer chip (no marks, no logo, no text) as if carefully examining it, and the head tilted slightly. " +
  "This is a dramatic, attention-grabbing expression — think viral thumbnail energy, not the usual calm smile.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 20,
  character: "bull",
  title: "엔비디아 GPU가 담보로 잡힌다, 수명 10년 vs 3~4년",
  slides: [
    {
      id: "cover_thumb",
      file: "00_bull_ep20_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover background image for a Korean finance ` +
        `Shorts video, designed to feel intriguing even when shrunk down to a tiny square grid ` +
        `thumbnail. ${BULL_CHARACTER_NOTE}\n\n` +
        `CRITICAL LAYOUT (a headline will be added later by software, so leave room for it): the ` +
        `upper 50% of the frame must contain NO character and NO text — only the decorative ` +
        `background (glow, light ribbons, a few small shapes). The character's horn ` +
        `tips start at about 50% of the frame height, its eyes and mouth sit near 62% of the frame ` +
        `height, and its body continues down to the bottom edge (legs and feet may be cropped). ` +
        `The character is centered horizontally and its full width stays within the central 70% of ` +
        `the frame (nothing closer than 15% to the left or right edge). Do NOT write any headline, ` +
        `title, caption, numbers, badge, logo or any other text anywhere in the image — there must ` +
        `be NO text at all; the headline area is intentionally left empty.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic scene. ` +
        `Use a dramatic gradient from deep forest green-black (#07170F) at the top to a bright champagne gold ` +
        `(#FFE8A3) glow radiating from behind the character at the bottom (green and gold tones, ` +
        `absolutely no red, orange, purple, pink or blue tint). Behind the character on the right, a large ` +
        `smooth plain golden padlock silhouette (no keyhole text, no marks), and a few small plain dark square ` +
        `chips with thin gold edges floating around it (abstract, NO logos, NO text, NO numbers). A few small ` +
        `plain white discs float in the lower background, kept abstract and dark enough at the top that white ` +
        `text placed over the upper half stays highly legible. Surprised, intriguing mood, high energy. ` +
        `No buildings, landmarks, flags, globes, cars, charts or real products.\n\n` +
        `Style: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft cartoon ` +
        `3D style matching the character.`,
    },
  ],
});
