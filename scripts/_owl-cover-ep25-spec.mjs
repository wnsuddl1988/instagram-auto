/**
 * 부엉박사 표시 24편(파일 ep25, 아동수당 두 배·절반은 상품권) 릴스 커버 = 유튜브 썸네일 = 인스타 스토리 통합 스펙.
 * (Owner 2026-10-01: 스토리는 커버로 통일, 규칙 7. 표시 23편 `_owl-cover-ep24-spec.mjs` 방식 승계)
 *
 * ★ 헤드라인은 영상 제목(headerTitle)을 줄이지 않고 그대로 얹는다(규칙 30, Owner 2026-10-06): "아동수당 두 배, / 절반은 / 상품권이에요" 3줄.
 *   가장 긴 줄 "상품권이에요"·"아동수당 두 배,"가 140px 게이트를 넘는지는 합성기가 판정한다(넘지 못하면 줄이지 말고 4줄 분할을 보고).
 *   3줄 블록이라 윗 58%를 비운다(캐릭터 귀깃 끝 ≈58%·눈 ≈68%).
 * 글자는 모델이 아니라 합성기(`run-cover-headline-overlay-once.mjs`)가 얹는다 → 글자·배지 없는 배경+캐릭터만 생성.
 * 색: 직전 표시 23편(포레스트→앰버)·22편(에스프레소→피치)·21편(올리브→라임)·20편(인디고→라일락)·19편(남청→골드)·18편(자두→핑크)과 겹치지 않게
 *     깊은 틸(#0B3B3A) → 따뜻한 코랄 핑크(#FF8A7A) 글로우. 글자·숫자·실제 기관 로고·카드·상품권 실물 없음.
 * 훅 감정: "두 배인데 절반이 상품권?!" — 반가움과 의아함이 섞인 표정(눈 크게, 한쪽 눈썹 높이, 부리 살짝 벌림), 한 날개는 "두 배" 알리듯 위로, 다른 날개는 "그런데…" 하듯 옆으로 펼침.
 */

const OWL_CHARACTER_NOTE =
  "Include the same 3D-rendered owl mascot character from the attached reference image exactly " +
  "as shown — same owl body proportions, charcoal vest, white shirt, burgundy tie, sunglasses " +
  "pushed up on the forehead. Do not change its core design, but EXAGGERATE its expression far " +
  "beyond the reference image: eyes wide open and round, one eyebrow raised very high and the other slightly lowered, beak slightly open in a " +
  "delighted-but-suspicious \"double?! but half of it is a voucher?\" look, one wing raised up high as if announcing \"doubled\" and the " +
  "other wing opened wide to the side with the palm turned up as if saying \"but wait...\". Dramatic, attention-grabbing — think a news " +
  "anchor who just spotted a surprising catch in good news, not the usual calm analytical look. The wings hold no object and no card.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 25,
  character: "owl",
  title: "아동수당 두 배, 절반은 상품권이에요",
  slides: [
    {
      id: "cover_thumb",
      file: "00_owl_ep25_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover background image for a Korean finance ` +
        `Shorts video, designed to feel intriguing even when shrunk down to a tiny square grid ` +
        `thumbnail. ${OWL_CHARACTER_NOTE}\n\n` +
        `CRITICAL LAYOUT (a three-line headline will be added later by software, so leave a HUGE amount of room for it): the ` +
        `upper 58% of the frame must contain NO character and NO text and no bright objects — only the dark decorative ` +
        `background (soft glow, a few small shapes). The character's ear tufts start ` +
        `at about 58% of the frame height (NOT higher), its eyes and beak sit near 68% of the frame height, and ` +
        `its body continues down to the bottom edge (the lower body and feet may be cropped by the frame edge). The character is centered ` +
        `horizontally and its full width stays within the central 70% of the frame (nothing closer ` +
        `than 15% to the left or right edge). Do NOT write any headline, title, caption, numbers, ` +
        `badge, logo or any other text anywhere in the image — there must be NO text at all; the ` +
        `headline area is intentionally left empty.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic scene. ` +
        `Use a dramatic gradient from deep teal (#0B3B3A) at the top to a warm coral-pink (#FF8A7A) ` +
        `glow radiating from behind the character at the bottom (deep teal, coral, soft peach and cream tones, ` +
        `no green-yellow, purple or blue tint). A smooth plain glowing ribbon of light sweeps in a gentle arc behind ` +
        `the character like a path, with a few plain blank gift boxes with ribbons (NO symbols, NO numbers, NO text) ` +
        `and small plain cream circles floating around the lower half, kept abstract and dark enough at the top that ` +
        `white text placed over the upper half stays highly legible. Playful-but-wary, "wait, what's the catch?" ` +
        `mood, high energy. No buildings, landmarks, flags, globes, charts with numbers, phones, coins with symbols, vouchers or gift cards with printing, or real organization marks.\n\n` +
        `Style: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft 3D ` +
        `animated-film style matching the character.`,
    },
  ],
});
