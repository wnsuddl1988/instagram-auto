/**
 * 황소특보 19편(S&P500 종목 80%가 내렸는데 AI만 올랐다) — 릴스 커버 = 유튜브 썸네일 = 인스타 스토리 통합 스펙(규칙 7).
 * 통합 커버 제약(12~18편과 동일): 글자는 합성기(`run-cover-headline-overlay-once.mjs`)가 얹으므로 글자 없는 배경+캐릭터만 생성, 윗 50%는 비움.
 * 19편 훅 감정: "지수는 최고인데 종목 80%는 내렸다고?" — 놀람+의아함(한쪽 눈썹만 높이, 입 살짝 벌림, 양손 저울처럼 위아래로 펼친 대비 포즈).
 * 배경색은 7~18편(빨강·주황·남색/청록·에메랄드·인디고·바이올렛·슬레이트 블루→레몬·흑연·에스프레소→앰버·올리브·차콜 틸→코랄·미드나이트 플럼→라벤더)과 겹치지 않게
 * 깊은 로열 블루 → 밝은 아쿠아 민트 글로우, 한쪽(왼쪽)은 위로 솟는 금빛 막대 몇 개, 다른 쪽(오른쪽)은 작게 내려앉은 막대들(추상, 숫자·글자 없음).
 * 경고색(빨강)·종목명·로고·글자·숫자 없음, 매수·매도 암시 없음.
 */

const BULL_CHARACTER_NOTE =
  "Include the same 3D-rendered gold bull mascot character from the attached reference image " +
  "exactly as shown — same extreme SD-proportion golden bull with glasses, white shirt, burgundy " +
  "tie, navy pants, no jacket, no logos or marks anywhere on the outfit. Do not change its core " +
  "design (color, glasses, outfit), but EXAGGERATE its facial expression far beyond the reference " +
  "image: both eyes wide open, one eyebrow raised much higher than the other, mouth slightly open in a " +
  "puzzled \"wait, the index is at a record but most stocks fell?\" expression, both hands held out to the sides " +
  "with one palm up high and the other palm low like weighing something, and the head tilted slightly. " +
  "This is a dramatic, attention-grabbing expression — think viral thumbnail energy, not the usual calm smile.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 19,
  character: "bull",
  title: "S&P500 종목 80%가 내렸는데 AI만 올랐다",
  slides: [
    {
      id: "cover_thumb",
      file: "00_bull_ep19_cover_thumb.png",
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
        `Use a dramatic gradient from deep royal blue (#0B1F5C) at the top to a bright aqua-mint ` +
        `(#7FFFD4) glow radiating from behind the character at the bottom (cool blue and mint tones, ` +
        `absolutely no red, orange, purple or pink tint). On the left side of the lower background, a few tall ` +
        `smooth plain golden bars rise upward like glowing pillars; on the right side, many short plain ` +
        `golden bars sit low and small (abstract "a few big ones rise while most stay low" feeling — bars ` +
        `are plain smooth shapes with NO numbers, NO labels, NO text, NO axes, NO chart lines). A few small ` +
        `plain white discs float in the lower background, kept abstract and dark enough at the top that white ` +
        `text placed over the upper half stays highly legible. Puzzled, intriguing mood, high energy. ` +
        `No buildings, landmarks, flags, globes, cars or real products.\n\n` +
        `Style: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft cartoon ` +
        `3D style matching the character.`,
    },
  ],
});
