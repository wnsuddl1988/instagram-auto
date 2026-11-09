/**
 * 황소특보 23편(삼성전자 3분기 잠정실적 — 영업이익 107조인데 증권가 예상과 거의 같았다) — 릴스 커버 = 유튜브 썸네일 = 인스타 스토리 통합 스펙(규칙 7).
 * ★ 헤드라인은 영상 제목(headerTitle)을 줄이지 않고 그대로 얹는다(규칙 30): "삼성전자 107조, 근데 왜 안 놀랍지?" — 영상 속 제목은 3줄이지만 커버는 140px 이상을 지키려고 4줄로 나눈다
 *   ("삼성전자 / 107조, / 근데 왜 / 안 놀랍지?", 문구 그대로 줄바꿈만). 4줄이라 윗 62%를 비운다(뿔 끝 ≈62%·눈 ≈72%). 글자는 합성기(`run-cover-headline-overlay-once.mjs`)가 얹으므로 글자 없는 배경+캐릭터만 생성.
 * 23편 훅 감정: "영업이익이 107조인데 왜 안 놀랍지?" — 한쪽 눈썹만 높이 올리고 입을 옆으로 오므린 갸웃한 의문 표정, 한 손은 턱에 대고 다른 손은 허리(소품 없음).
 * 배경색은 직전 편들(22편 보틀 블루그린→로즈골드, 21편 잉크 네이비→탠저린, 20편 포레스트→샴페인 골드, 19편 로열 블루→민트, 18편 플럼→라벤더, 7~17편 빨강·주황·남색/청록·에메랄드·인디고·바이올렛·슬레이트→레몬·흑연→은백·에스프레소→앰버·올리브→라임·차콜 틸→피치)과 겹치지 않게
 * 짙은 흑연 보라(#14101F) → 선명한 시안 터쿼이즈(#2EC4D6) 글로우, 뒤에 눈금·숫자·글자 없는 큼직한 황금 동심원 과녁 조형물 하나(추상).
 * 경고색(빨강)·종목명·로고·글자·숫자 없음, 매수·매도 암시 없음.
 */

const BULL_CHARACTER_NOTE =
  "Include the same 3D-rendered gold bull mascot character from the attached reference image " +
  "exactly as shown — same extreme SD-proportion golden bull with glasses, white shirt, burgundy " +
  "tie, navy pants, no jacket, no logos or marks anywhere on the outfit. Do not change its core " +
  "design (color, glasses, outfit), but EXAGGERATE its facial expression far beyond the reference " +
  "image: one eyebrow raised very high and the other lowered, eyes looking slightly sideways in doubt, mouth pursed to one side in a " +
  "skeptical \"hmm, that's it?\" expression, one hand resting on its chin and the other hand on its hip (nothing in the hands), and the head tilted slightly. " +
  "This is a dramatic, attention-grabbing expression — think viral thumbnail energy, not the usual calm smile.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 23,
  character: "bull",
  title: "삼성전자 107조, 근데 왜 안 놀랍지?",
  slides: [
    {
      id: "cover_thumb",
      file: "00_bull_ep23_cover_thumb.png",
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
        `Use a dramatic gradient from deep graphite-violet (#14101F) at the top to a vivid cyan-turquoise ` +
        `(#2EC4D6) glow radiating from behind the character at the bottom (graphite-violet and cyan-turquoise tones, ` +
        `absolutely no red, crimson, orange or pink tint). Behind the character, a large smooth plain golden ` +
        `concentric-ring target sculpture (several plain gold rings around a plain gold center disc; ` +
        `abstract: NO tick marks, NO digits, NO letters, NO labels, NO arrows), placed mostly in the lower half so the upper half stays empty, ` +
        `and a few small plain glowing light streaks sweeping across the lower background. A few small plain cream discs float ` +
        `in the lower background, kept abstract and dark enough at the top that white text placed over the upper half stays highly legible. ` +
        `Skeptical, intriguing mood, high energy. No buildings, landmarks, flags, globes, cars, charts or real products.\n\n` +
        `Style: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft cartoon ` +
        `3D style matching the character.`,
    },
  ],
});
