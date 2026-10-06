/**
 * 황소특보 22편(삼성전자 8일, 규칙 때문에 팔린다 — 반도체 ETF 리밸런싱) — 릴스 커버 = 유튜브 썸네일 = 인스타 스토리 통합 스펙(규칙 7).
 * ★ 헤드라인은 영상 제목(headerTitle)을 줄이지 않고 그대로 얹는다(규칙 30, Owner 2026-10-06): "삼성전자 8일 / 규칙 때문에 / 팔린다".
 *   3줄이라 윗 55%를 비운다(뿔 끝 ≈55%·눈 ≈66%). 글자는 합성기(`run-cover-headline-overlay-once.mjs`)가 얹으므로 글자 없는 배경+캐릭터만 생성.
 * 22편 훅 감정: "삼성전자가 규칙 때문에 팔린다고?" — 눈을 크게 뜨고 눈썹을 높이 올린 놀람, 양손을 가슴 높이에 펴 올려 무게를 달아보는 포즈(한 손이 더 아래로 처짐).
 * 배경색은 직전 편들(21편 잉크 네이비→탠저린, 20편 포레스트→샴페인 골드, 19편 로열 블루→민트, 18편 플럼→라벤더, 7~17편 빨강·주황·남색/청록·에메랄드·인디고·바이올렛·슬레이트→레몬·흑연→은백·에스프레소→앰버·올리브→라임·차콜 틸→피치)과 겹치지 않게
 * 짙은 보틀 블루그린(#06242B) → 로즈골드(#F2A58C) 글로우, 뒤에 눈금·숫자·글자 없는 큼직한 황금 균형 저울 조형물 하나(한쪽 접시가 아래로 기움, 추상).
 * 경고색(빨강)·종목명·ETF 상품명·로고·글자·숫자 없음, 매수·매도 암시 없음.
 */

const BULL_CHARACTER_NOTE =
  "Include the same 3D-rendered gold bull mascot character from the attached reference image " +
  "exactly as shown — same extreme SD-proportion golden bull with glasses, white shirt, burgundy " +
  "tie, navy pants, no jacket, no logos or marks anywhere on the outfit. Do not change its core " +
  "design (color, glasses, outfit), but EXAGGERATE its facial expression far beyond the reference " +
  "image: both eyes wide open and round, both eyebrows raised very high, mouth open in a surprised " +
  "\"wait, it gets sold because of a rule?!\" expression, both hands raised at chest height with open palms up as if weighing something heavy " +
  "(one hand slightly lower than the other, nothing in the hands), and the head tilted slightly. " +
  "This is a dramatic, attention-grabbing expression — think viral thumbnail energy, not the usual calm smile.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 22,
  character: "bull",
  title: "삼성전자 8일, 규칙 때문에 팔린다",
  slides: [
    {
      id: "cover_thumb",
      file: "00_bull_ep22_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover background image for a Korean finance ` +
        `Shorts video, designed to feel intriguing even when shrunk down to a tiny square grid ` +
        `thumbnail. ${BULL_CHARACTER_NOTE}\n\n` +
        `CRITICAL LAYOUT (a three-line headline will be added later by software, so leave a LOT of room for it): the ` +
        `upper 55% of the frame must contain NO character and NO text — only the decorative ` +
        `background (glow, light ribbons, a few small shapes). The character's horn ` +
        `tips start at about 55% of the frame height, its eyes and mouth sit near 66% of the frame ` +
        `height, and its body continues down to the bottom edge (legs and feet may be cropped). ` +
        `The character is centered horizontally and its full width stays within the central 70% of ` +
        `the frame (nothing closer than 15% to the left or right edge). Do NOT write any headline, ` +
        `title, caption, numbers, badge, logo or any other text anywhere in the image — there must ` +
        `be NO text at all; the headline area is intentionally left empty.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic scene. ` +
        `Use a dramatic gradient from deep bottle blue-green (#06242B) at the top to a warm rose-gold ` +
        `(#F2A58C) glow radiating from behind the character at the bottom (deep teal-green and rose-gold tones, ` +
        `absolutely no red, crimson, purple or blue-violet tint). Behind the character, a large smooth plain golden ` +
        `balance-scale sculpture (a single tall post with a wide beam and two plain pans, one pan tilted lower than the other; ` +
        `abstract: NO tick marks, NO digits, NO letters, NO labels), placed mostly in the lower half so the upper half stays empty, ` +
        `and a few small plain glowing light streaks sweeping across the lower background. A few small plain cream discs float ` +
        `in the lower background, kept abstract and dark enough at the top that white text placed over the upper half stays highly legible. ` +
        `Surprised, intriguing mood, high energy. No buildings, landmarks, flags, globes, cars, charts or real products.\n\n` +
        `Style: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft cartoon ` +
        `3D style matching the character.`,
    },
  ],
});
