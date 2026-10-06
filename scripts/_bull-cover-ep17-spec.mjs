/**
 * 황소특보 17편(외국인은 팔기만 한 게 아니다, 반도체 아니어도 끝까지 산 종목들)
 * 릴스 커버 = 유튜브 썸네일 = 인스타 스토리 이미지 **통합** 스펙(Owner 2026-10-01: 스토리 이미지는 따로 만들지 않고 커버로 통일, 규칙 7).
 *
 * 통합 커버의 제약(12~16편과 동일): 스토리 상단 UI(y≈8~13%)와 프로필 그리드 3:4 크롭(위아래 12.5%)이 윗부분을 가린다 →
 * "경제번역소" 배지를 생성 이미지에 넣지 않는다. 글자는 합성기(`run-cover-headline-overlay-once.mjs`)가 좌우 8% 이상 안쪽·세로 17~34%에 얹는다.
 * 모델은 글자 폭·위치 좌표를 지키지 못하므로 글자 없는 배경+캐릭터만 생성한다.
 *
 * 17편 훅 감정: "외국인이 팔기만 한 게 아니라고? 산 종목이 있었어?" — 놀람+호기심(눈 크게 뜨고 눈썹 높이 올림, 입 살짝 벌림, 한 손 검지를 위로 세운 '어?' 포즈).
 * 배경색은 7편(빨강)·8편(주황)·9편(남색/청록·보라)·10편(에메랄드/민트)·11편(인디고→시안)·12편(바이올렛→마젠타)·13편(슬레이트 블루→레몬 옐로)·
 * 14편(흑연→은빛 화이트)·15편(에스프레소→앰버 크림)·16편(올리브 포레스트→라임 골드)과 겹치지 않게 짙은 차콜 틸 → 밝은 피치 코랄 글로우.
 * 16편 금빛 원판 리본이 캐릭터에서 "빠져나가는" 구도였다면 17편은 양쪽에서 캐릭터 쪽으로 "들어오는"(=산다) 구도.
 * 경고색(빨강)·종목명·로고·랜드마크·지구본·글자·숫자 없음, 매수·매도 암시 없음.
 */

const BULL_CHARACTER_NOTE =
  "Include the same 3D-rendered gold bull mascot character from the attached reference image " +
  "exactly as shown — same extreme SD-proportion golden bull with glasses, white shirt, burgundy " +
  "tie, navy pants, no jacket, no logos or marks anywhere on the outfit. Do not change its core " +
  "design (color, glasses, outfit), but EXAGGERATE its facial expression far beyond the reference " +
  "image: both eyes wide open and round, eyebrows raised very high, mouth slightly open in a " +
  "surprised and curious \"wait, they were actually buying?\" expression, one hand raised with the index " +
  "finger pointing up in a 'huh?' pose and the head tilted slightly. This is a dramatic, " +
  "attention-grabbing expression — think viral thumbnail energy, not the usual calm smile.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 17,
  character: "bull",
  title: "외국인은 팔기만 한 게 아니다, 끝까지 산 종목들",
  slides: [
    {
      id: "cover_thumb",
      file: "00_bull_ep17_cover_thumb.png",
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
        `Use a dramatic gradient from deep charcoal-teal (#0E2A33) at the top to a bright peach-coral ` +
        `(#FFA07A) glow radiating from behind the character at the bottom, with two flowing ribbons of ` +
        `light made of many plain round golden discs (abstract coins with no marks, no numbers, no ` +
        `text) that stream in from the lower-left and the lower-right corners and curve inward ` +
        `toward the character, converging near its hands and fading out (an abstract "something is quietly ` +
        `being collected" feeling), plus a few small plain white discs and plain golden squares floating in ` +
        `the background, kept abstract and dark enough at the top that white text placed over the upper half ` +
        `stays highly legible. Surprised, curious "wait, they were buying?" mood, high energy. Do not use ` +
        `red or warning colors. No buildings, landmarks, flags, globes, cars, shopping bags, charts with ` +
        `numbers or real products.\n\n` +
        `Style: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft cartoon ` +
        `3D style matching the character.`,
    },
  ],
});
