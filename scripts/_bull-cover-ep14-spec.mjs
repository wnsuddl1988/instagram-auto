/**
 * 황소특보 14편(마이크론 역대급 실적인데 주가는 내렸다가 올랐다 — 이익률 우려와 수요 기대)
 * 릴스 커버 = 유튜브 썸네일 = 인스타 스토리 이미지 **통합** 스펙(Owner 2026-10-01: 스토리 이미지는 따로 만들지 않고 커버로 통일, 규칙 7).
 *
 * 통합 커버의 제약(12·13편과 동일): 스토리 상단 UI(y≈8~13%)와 프로필 그리드 3:4 크롭(위아래 12.5%)이 윗부분을 가린다 →
 * "경제번역소" 배지를 생성 이미지에 넣지 않는다. 글자는 합성기(`run-cover-headline-overlay-once.mjs`)가 좌우 8% 이상 안쪽·세로 17~34%에 얹는다.
 * 모델은 글자 폭·위치 좌표를 지키지 못하므로 글자 없는 배경+캐릭터만 생성한다.
 *
 * 14편 훅 감정: "역대급 실적인데 주가가 내렸다?" — 깜짝 놀람과 의문(눈 크게 뜬 채 눈썹 높이 올림, 입 살짝 벌림, 한 손은 뺨에).
 * 배경색은 7편(빨강)·8편(주황)·9편(남색/청록·보라)·10편(에메랄드/민트)·11편(인디고→시안)·12편(바이올렛→마젠타)·13편(슬레이트 블루→레몬 옐로)과
 * 겹치지 않게 흑연(그래파이트) → 은빛 화이트 + 골드 줄무늬(반도체 웨이퍼·칩 느낌의 단색 계열).
 * 경고색(빨강)·종목명·로고·랜드마크·지구본·글자·숫자 없음, 매수·매도 암시 없음.
 */

const BULL_CHARACTER_NOTE =
  "Include the same 3D-rendered gold bull mascot character from the attached reference image " +
  "exactly as shown — same extreme SD-proportion golden bull with glasses, white shirt, burgundy " +
  "tie, navy pants, no jacket, no logos or marks anywhere on the outfit. Do not change its core " +
  "design (color, glasses, outfit), but EXAGGERATE its facial expression far beyond the reference " +
  "image: both eyes wide open and round, eyebrows raised very high, mouth slightly open in a " +
  "surprised \"wait, what? why did it drop?\" expression, one hand on the cheek in a puzzled pose and " +
  "the head tilted slightly. This is a dramatic, attention-grabbing expression — think viral " +
  "thumbnail energy, not the usual calm smile.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 14,
  character: "bull",
  title: "마이크론 역대급 실적인데, 주가는 왜 내렸다가 올랐을까",
  slides: [
    {
      id: "cover_thumb",
      file: "00_bull_ep14_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover background image for a Korean finance ` +
        `Shorts video, designed to feel intriguing even when shrunk down to a tiny square grid ` +
        `thumbnail. ${BULL_CHARACTER_NOTE}\n\n` +
        `CRITICAL LAYOUT (a headline will be added later by software, so leave room for it): the ` +
        `upper 50% of the frame must contain NO character and NO text — only the decorative ` +
        `background (glow, flowing light ribbons, a few small shapes). The character's horn ` +
        `tips start at about 50% of the frame height, its eyes and mouth sit near 62% of the frame ` +
        `height, and its body continues down to the bottom edge (legs and feet may be cropped). ` +
        `The character is centered horizontally and its full width stays within the central 70% of ` +
        `the frame (nothing closer than 15% to the left or right edge). Do NOT write any headline, ` +
        `title, caption, numbers, badge, logo or any other text anywhere in the image — there must ` +
        `be NO text at all; the headline area is intentionally left empty.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic scene. ` +
        `Use a dramatic gradient from deep graphite-black (#0A0F1A) at the top to a bright icy ` +
        `silver-white (#E2E8F0) glow radiating from behind the character at the bottom, with ` +
        `flowing ribbons of light in gold (#F5C542) and white that dip down and then swing back up ` +
        `from left to right (an abstract down-then-up motion), and a few small plain silver circular ` +
        `discs and plain golden squares (abstract, no text, no numbers, no logos) floating in the ` +
        `lower background, kept abstract and dark enough at the top that white text placed over the ` +
        `upper half stays highly legible. Surprised, "why did it dip and then rise?" mood, high ` +
        `energy. Do not use red or warning colors. No buildings, landmarks, flags, globes, charts ` +
        `with numbers or real products.\n\n` +
        `Style: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft cartoon ` +
        `3D style matching the character.`,
    },
  ],
});
