/**
 * 부엉박사 표시 22편(파일 ep23, 근로장려금 — 기한 후 신청) 릴스 커버 = 유튜브 썸네일 = 인스타 스토리 통합 스펙.
 * (Owner 2026-10-01: 스토리는 커버로 통일, 규칙 7. 표시 21편 `_owl-cover-ep22-spec.mjs` 방식 승계)
 *
 * ★ 헤드라인은 영상 제목(headerTitle)을 줄이지 않고 그대로 얹는다(Owner 2026-10-06): "근로장려금, / 아직 신청할 / 수 있어요".
 *   글자 3줄이라 블록 높이가 커서 윗 55%를 비운다(캐릭터 귀깃 끝 ≈55%·눈 ≈66%).
 * 글자는 모델이 아니라 합성기(`run-cover-headline-overlay-once.mjs`)가 얹는다 → 글자·배지 없는 배경+캐릭터만 생성.
 * 색: 직전 표시 21편(올리브→라임)·20편(인디고→라일락)·19편(남청→골드)·18편(자두→핑크)·17편(남색→청록)과 겹치지 않게
 *     짙은 에스프레소 브라운(#2A1608) → 따뜻한 피치 코랄(#FFB48A) 글로우. 글자·숫자·실제 기관 로고 없음.
 * 훅 감정: "아직 신청할 수 있다니!" — 반가운 놀람(눈 크게, 부리 살짝 벌림), 한 날개는 위로 치켜 알리고 다른 날개는 환영하듯 펼침.
 */

const OWL_CHARACTER_NOTE =
  "Include the same 3D-rendered owl mascot character from the attached reference image exactly " +
  "as shown — same owl body proportions, charcoal vest, white shirt, burgundy tie, sunglasses " +
  "pushed up on the forehead. Do not change its core design, but EXAGGERATE its expression far " +
  "beyond the reference image: eyes wide open and round, eyebrows raised high, beak slightly open in a " +
  "delighted \"wait, I can still apply?!\" look, one wing raised up high as if announcing good news and the " +
  "other wing opened wide to the side in a welcoming gesture. Dramatic, attention-grabbing — think a news " +
  "anchor who just spotted good news, not the usual calm analytical look. The wings hold no object and no card.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 23,
  character: "owl",
  title: "근로장려금, 아직 신청할 수 있어요",
  slides: [
    {
      id: "cover_thumb",
      file: "00_owl_ep23_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover background image for a Korean finance ` +
        `Shorts video, designed to feel intriguing even when shrunk down to a tiny square grid ` +
        `thumbnail. ${OWL_CHARACTER_NOTE}\n\n` +
        `CRITICAL LAYOUT (a three-line headline will be added later by software, so leave a LOT of room for it): the ` +
        `upper 55% of the frame must contain NO character and NO text — only the decorative ` +
        `background (glow, flowing light ribbons, a few small shapes). The character's ear tufts start ` +
        `at about 55% of the frame height, its eyes and beak sit near 66% of the frame height, and ` +
        `its body continues down to the bottom edge (feet may be cropped). The character is centered ` +
        `horizontally and its full width stays within the central 70% of the frame (nothing closer ` +
        `than 15% to the left or right edge). Do NOT write any headline, title, caption, numbers, ` +
        `badge, logo or any other text anywhere in the image — there must be NO text at all; the ` +
        `headline area is intentionally left empty.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic scene. ` +
        `Use a dramatic gradient from deep espresso-brown (#2A1608) at the top to a warm peach-coral ` +
        `(#FFB48A) glow radiating from behind the character at the bottom (warm brown, peach and soft amber tones, ` +
        `no green, blue, purple or pink tint). A smooth plain glowing ribbon of light sweeps in a gentle arc behind ` +
        `the character like a rising path, with a few plain golden coins (blank, NO symbols, NO numbers, NO text) ` +
        `and small plain cream discs floating around the lower half, kept abstract and dark enough at the top that ` +
        `white text placed over the upper half stays highly legible. Delighted, "good news, there is still time!" ` +
        `mood, high energy. No buildings, landmarks, flags, globes, charts with numbers, phones or real organization marks.\n\n` +
        `Style: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft 3D ` +
        `animated-film style matching the character.`,
    },
  ],
});
