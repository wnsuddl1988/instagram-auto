/**
 * 부엉박사 표시 21편(파일 22, 대출 갈아타기 금리 역전 — 내 조건으로 따져보세요) 릴스 커버 = 유튜브 썸네일 = 인스타 스토리 통합 스펙.
 * (Owner 2026-10-01: 스토리 이미지는 따로 만들지 않고 커버로 통일, 규칙 7. 표시 20편 `_owl-cover-ep21-spec.mjs` 방식 승계)
 *
 * 글자는 모델이 아니라 합성기(`run-cover-headline-overlay-once.mjs`)가 얹는다 → 글자·배지 없는 배경+캐릭터만 생성.
 * 윗 50%는 비운다(캐릭터 귀깃 끝 ≈50%·눈 ≈62%). "경제번역소" 배지는 제외(통합 커버 제약).
 * 색: 직전 표시 20편(인디고 바이올렛→라일락 실버)·19편(먹색 남청→꿀빛 골드)·18편(자두→핑크)·17편(남색→청록)과 겹치지 않게
 *     짙은 올리브 그린(#1C2A0C) → 밝은 라임 시트러스(#E3F58A) 글로우. 경고색(빨강)·은행 로고·실제 은행명·글자·숫자 없음.
 * 훅 감정: "대출 갈아타려는 사람, 손해 볼 수 있는 거 알고 있었어?" — 놀라고 뜨끔한 표정(눈 크게, 부리 살짝 벌림), 날개 두 개를 양옆으로 펼쳐 두 쪽을 저울질하는 포즈.
 */

const OWL_CHARACTER_NOTE =
  "Include the same 3D-rendered owl mascot character from the attached reference image exactly " +
  "as shown — same owl body proportions, charcoal vest, white shirt, burgundy tie, sunglasses " +
  "pushed up on the forehead. Do not change its core design, but EXAGGERATE its expression far " +
  "beyond the reference image: eyes wide open and round, eyebrows raised high, beak slightly open in a " +
  "startled \"wait, switching my loan could actually cost me?\" look, both wings held out to the sides at " +
  "different heights as if weighing two options. Dramatic, attention-grabbing — think a news anchor who just " +
  "spotted a surprising number, not the usual calm analytical look. The wings hold no object and no card.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 22,
  character: "owl",
  title: "대출 갈아타기, 내 조건으로 따져보세요",
  slides: [
    {
      id: "cover_thumb",
      file: "00_owl_ep22_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover background image for a Korean finance ` +
        `Shorts video, designed to feel intriguing even when shrunk down to a tiny square grid ` +
        `thumbnail. ${OWL_CHARACTER_NOTE}\n\n` +
        `CRITICAL LAYOUT (a headline will be added later by software, so leave room for it): the ` +
        `upper 50% of the frame must contain NO character and NO text — only the decorative ` +
        `background (glow, flowing light ribbons, a few small shapes). The character's ear tufts start ` +
        `at about 50% of the frame height, its eyes and beak sit near 62% of the frame height, and ` +
        `its body continues down to the bottom edge (feet may be cropped). The character is centered ` +
        `horizontally and its full width stays within the central 70% of the frame (nothing closer ` +
        `than 15% to the left or right edge). Do NOT write any headline, title, caption, numbers, ` +
        `badge, logo or any other text anywhere in the image — there must be NO text at all; the ` +
        `headline area is intentionally left empty.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic scene. ` +
        `Use a dramatic gradient from deep olive-green (#1C2A0C) at the top to a bright lime-citrus ` +
        `(#E3F58A) glow radiating from behind the character at the bottom (green and lime tones, ` +
        `absolutely no red, orange, pink, purple or blue tint). Two smooth plain glowing ribbons of light cross ` +
        `each other behind the character in an X shape — one thin and pale, one thick and bright — like two paths ` +
        `swapping places (abstract, NO arrows, NO symbols, NO text, NO numbers), with a few small plain pale-green ` +
        `discs and plain golden squares floating around, kept abstract and dark enough at the top that white ` +
        `text placed over the upper half stays highly legible. Startled, "wait, I could lose money switching?" ` +
        `mood, high energy. No buildings, landmarks, flags, globes, charts with numbers, phones or real bank marks.\n\n` +
        `Style: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft 3D ` +
        `animated-film style matching the character.`,
    },
  ],
});
