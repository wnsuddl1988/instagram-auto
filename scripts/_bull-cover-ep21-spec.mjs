/**
 * 황소특보 21편(메모리 가격 상승 둔화, 삼성 잠정실적을 앞두고) — 릴스 커버 = 유튜브 썸네일 = 인스타 스토리 통합 스펙(규칙 7).
 * 글자는 합성기(`run-cover-headline-overlay-once.mjs`)가 얹으므로 글자 없는 배경+캐릭터만 생성, 윗 50%는 비움.
 * 21편 훅 감정: "메모리 값이 오르긴 하는데, 오르는 속도가 꺾였다?" — 갸웃하며 속도를 확인하는 호기심(한쪽 눈썹만 높이, 눈은 크게, 입 살짝 벌림, 한 손에 글자 없는 작은 메모리 모듈 하나를 쥐고 들여다보는 포즈).
 * 배경색은 7~20편(빨강·주황·남색/청록·에메랄드·인디고·바이올렛·슬레이트→레몬·흑연→은백·에스프레소→앰버·올리브→라임·차콜 틸→피치·플럼→라벤더·로열 블루→민트·포레스트→샴페인 골드)과 겹치지 않게
 * 짙은 잉크 네이비 → 선명한 탠저린 오렌지 글로우, 뒤에 눈금·숫자·글자 없는 반원 속도계 조형물 하나(바늘은 가운데에서 살짝 꺾임, 추상).
 * 경고색(빨강)·종목명·로고·글자·숫자 없음, 매수·매도 암시 없음.
 */

const BULL_CHARACTER_NOTE =
  "Include the same 3D-rendered gold bull mascot character from the attached reference image " +
  "exactly as shown — same extreme SD-proportion golden bull with glasses, white shirt, burgundy " +
  "tie, navy pants, no jacket, no logos or marks anywhere on the outfit. Do not change its core " +
  "design (color, glasses, outfit), but EXAGGERATE its facial expression far beyond the reference " +
  "image: both eyes wide open and round, one eyebrow raised very high and the other slightly lowered, mouth slightly open in a " +
  "puzzled and curious \"wait, is the pace slowing down?\" expression, one hand holding up one small plain slim green circuit-board memory module " +
  "(no marks, no logo, no text, no numbers) as if carefully examining it, the other hand relaxed at its side, and the head tilted slightly. " +
  "This is a dramatic, attention-grabbing expression — think viral thumbnail energy, not the usual calm smile.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 21,
  character: "bull",
  title: "메모리 가격 상승 둔화, 삼성 잠정실적을 앞두고",
  slides: [
    {
      id: "cover_thumb",
      file: "00_bull_ep21_cover_thumb.png",
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
        `Use a dramatic gradient from deep ink navy (#0A1230) at the top to a bright tangerine orange ` +
        `(#FF9F43) glow radiating from behind the character at the bottom (navy and warm orange tones, ` +
        `absolutely no red, crimson, pink, purple or green tint). Behind the character, a large smooth plain half-circle ` +
        `speedometer-style gauge sculpture in soft cream and gold with a single needle bent slightly past the middle ` +
        `(abstract: NO tick marks, NO digits, NO letters, NO labels), and a few small plain glowing light streaks ` +
        `sweeping across the lower background. A few small plain white discs float in the lower background, ` +
        `kept abstract and dark enough at the top that white text placed over the upper half stays highly legible. ` +
        `Curious, intriguing mood, high energy. No buildings, landmarks, flags, globes, cars, charts or real products.\n\n` +
        `Style: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft cartoon ` +
        `3D style matching the character.`,
    },
  ],
});
