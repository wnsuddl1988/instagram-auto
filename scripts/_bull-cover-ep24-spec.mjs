/**
 * 황소특보 24편(통합 48편, 코스피 3분기 -19.33%인데 대만은 올랐다) — 릴스 커버 = 유튜브 썸네일 = 인스타 스토리 통합 스펙(규칙 7).
 * ★ 헤드라인은 영상 제목(headerTitle)을 줄이지 않고 그대로 얹는다(규칙 30): "코스피가 19% 빠질 때, 대만은 왜 올랐을까?" — 영상 속 제목은 3줄이지만 커버는 140px 이상을 지키려고 4줄로 나눈다
 *   ("코스피가 19% / 빠질 때, / 대만은 / 왜 올랐을까?", 문구 그대로 줄바꿈만). 4줄이라 윗 62%를 비운다(뿔 끝 ≈62%·눈 ≈72%). 글자는 합성기(`run-cover-headline-overlay-once.mjs`)가 얹으므로 글자 없는 배경+캐릭터만 생성.
 * 24편 훅 감정: "코스피는 빠지는데 대만은 왜 올랐지?" — 눈을 크게 뜨고 눈썹을 높이 올린 놀란 궁금증 표정, 한 손 검지를 위로 세우고 다른 손은 허리(소품 없음).
 * 배경색은 직전 편들(23편 흑연 보라→시안 터쿼이즈, 22편 보틀 블루그린→로즈골드, 21편 잉크 네이비→탠저린, 20편 포레스트→샴페인 골드, 19편 로열 블루→민트, 18편 플럼→라벤더)과 겹치지 않게
 * 깊은 딥틸 블랙(#04201E) → 선명한 해바라기 옐로(#FFD400) 글로우, 뒤에 눈금·숫자·글자 없는 크기가 다른 매끈한 둥근 언덕 조형물 두 개(하나는 높이 솟고 하나는 낮게 가라앉은 모양, 추상).
 * 경고색(빨강)·종목명·로고·글자·숫자 없음, 매수·매도 암시 없음.
 */

const BULL_CHARACTER_NOTE =
  "Include the same 3D-rendered gold bull mascot character from the attached reference image " +
  "exactly as shown — same extreme SD-proportion golden bull with glasses, white shirt, burgundy " +
  "tie, navy pants, no jacket, no logos or marks anywhere on the outfit. Do not change its core " +
  "design (color, glasses, outfit), but EXAGGERATE its facial expression far beyond the reference " +
  "image: both eyebrows raised very high, eyes wide open and round behind the glasses, mouth open in a surprised \"wait, why?\" expression, " +
  "one hand raised with the index finger pointing up and the other hand on its hip (nothing in the hands), and the head tilted slightly. " +
  "This is a dramatic, attention-grabbing expression — think viral thumbnail energy, not the usual calm smile.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 24,
  character: "bull",
  title: "코스피가 19% 빠질 때, 대만은 왜 올랐을까?",
  slides: [
    {
      id: "cover_thumb",
      file: "00_bull_ep24_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover background image for a Korean finance ` +
        `Shorts video, designed to feel intriguing even when shrunk down to a tiny square grid ` +
        `thumbnail. ${BULL_CHARACTER_NOTE}\n\n` +
        `CRITICAL LAYOUT (a four-line headline will be added later by software, so leave a LOT of room for it): the ` +
        `upper 62% of the frame must contain NO character and NO text — only the decorative ` +
        `background (glow, light ribbons, a few small shapes). The character's horn ` +
        `tips start at about 62% of the frame height, its eyes and mouth sit near 72% of the frame ` +
        `height, and its body continues down to the bottom edge (legs and feet may be cropped). ` +
        `The character is centered horizontally and its full width stays within the central 70% of ` +
        `the frame (nothing closer than 15% to the left or right edge). Do NOT write any headline, ` +
        `title, caption, numbers, badge, logo or any other text anywhere in the image — there must ` +
        `be NO text at all; the headline area is intentionally left empty.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic scene. ` +
        `Use a dramatic gradient from deep teal-black (#04201E) at the top to a vivid sunflower-yellow ` +
        `(#FFD400) glow radiating from behind the character at the bottom (teal-black and sunflower-yellow tones, ` +
        `absolutely no red, crimson, orange or pink tint). Behind the character, two large smooth plain rounded hill sculptures of different heights ` +
        `side by side (one tall and rising, one low and sunken; abstract: NO tick marks, NO digits, NO letters, NO labels, NO arrows), ` +
        `placed mostly in the lower half so the upper half stays empty, and a few small plain glowing light streaks sweeping across the lower background. ` +
        `A few small plain cream discs float in the lower background, kept abstract and dark enough at the top that white text placed over the upper half stays highly legible. ` +
        `Curious, intriguing mood, high energy. No buildings, landmarks, flags, globes, cars, charts or real products.\n\n` +
        `Style: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft cartoon ` +
        `3D style matching the character.`,
    },
  ],
});
