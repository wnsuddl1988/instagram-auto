/**
 * 황소특보 13편(외국인 5개월째 135조 순매도 — 삼성전자·SK하이닉스, 돌아올 조건은?)
 * 릴스 커버 = 유튜브 썸네일 = 인스타 스토리 이미지 **통합** 스펙(Owner 2026-10-01: 스토리 이미지는 따로 만들지 않고 커버로 통일, 규칙 7).
 *
 * 통합 커버의 제약(12편과 동일): 스토리 상단 UI(y≈8~13%)와 프로필 그리드 3:4 크롭(위아래 12.5%)이 윗부분을 가린다 →
 * "경제번역소" 배지를 생성 이미지에 넣지 않는다(기본안 = 제외). 글자는 합성기(`run-cover-headline-overlay-once.mjs`)가
 * 좌우 8% 이상 안쪽·세로 17~34%에 얹는다. 모델은 글자 폭·위치 좌표를 지키지 못하므로 글자 없는 배경+캐릭터만 생성한다.
 *
 * 13편 훅 감정: "외국인이 5개월째 팔기만 했는데, 언제 돌아오지?" — 갸우뚱·궁금(턱에 손, 눈썹 한쪽 올림).
 * 배경색은 7편(빨강)·8편(주황)·9편(남색/청록·보라)·10편(에메랄드/민트)·11편(인디고→시안)·12편(바이올렛→마젠타)과
 * 겹치지 않게 심야 슬레이트 블루 → 새벽 레몬·앰버 옐로 글로우(돌아온다는 일출 느낌).
 * 경고색(빨강)·종목명·로고·랜드마크·지구본·글자 없음, 매수·매도 암시 없음.
 */

const BULL_CHARACTER_NOTE =
  "Include the same 3D-rendered gold bull mascot character from the attached reference image " +
  "exactly as shown — same extreme SD-proportion golden bull with glasses, white shirt, burgundy " +
  "tie, navy pants, no jacket, no logos or marks anywhere on the outfit. Do not change its core " +
  "design (color, glasses, outfit), but EXAGGERATE its facial expression far beyond the reference " +
  "image: one eyebrow raised very high and the other lowered, eyes wide and looking up and to the " +
  "side, mouth slightly open and twisted in a puzzled \"hmm... when will they come back?\" " +
  "expression, one hand under the chin in a thinking pose and the head tilted. This is a dramatic, " +
  "attention-grabbing expression — think viral thumbnail energy, not the usual calm smile.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 13,
  character: "bull",
  title: "외국인 5개월째 135조 순매도 — 삼성전자·SK하이닉스 돌아올 조건은?",
  slides: [
    {
      id: "cover_thumb",
      file: "00_bull_ep13_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover background image for a Korean finance ` +
        `Shorts video, designed to feel intriguing even when shrunk down to a tiny square grid ` +
        `thumbnail. ${BULL_CHARACTER_NOTE}\n\n` +
        `CRITICAL LAYOUT (a headline will be added later by software, so leave room for it): the ` +
        `upper 50% of the frame must contain NO character and NO text — only the decorative ` +
        `background (glow, flowing light ribbons, a few small paper airplanes). The character's horn ` +
        `tips start at about 50% of the frame height, its eyes and mouth sit near 62% of the frame ` +
        `height, and its body continues down to the bottom edge (legs and feet may be cropped). ` +
        `The character is centered horizontally and its full width stays within the central 70% of ` +
        `the frame (nothing closer than 15% to the left or right edge). Do NOT write any headline, ` +
        `title, caption, numbers, badge, logo or any other text anywhere in the image — there must ` +
        `be NO text at all; the headline area is intentionally left empty.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic scene. ` +
        `Use a dramatic gradient from deep midnight slate-blue (#0B1530) at the top to a bright ` +
        `lemon-yellow and amber (#FDE047 to #FBBF24) sunrise glow radiating from behind the ` +
        `character at the bottom, with soft white and pale-blue flowing ribbons of light curving ` +
        `from left to right, and a few small plain golden paper airplanes (no text, no logos, no ` +
        `airline marks) gliding across the lower background, kept abstract and dark enough at the ` +
        `top that white text placed over the upper half stays highly legible. Curious, "so when do ` +
        `they come back?" mood, high energy. Do not use red or warning colors. No buildings, ` +
        `landmarks, flags, globes or real airplanes.\n\n` +
        `Style: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft cartoon ` +
        `3D style matching the character.`,
    },
  ],
});
