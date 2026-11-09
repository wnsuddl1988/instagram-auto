/**
 * 황소특보 12편(서학개미 — 금리가 뛰는데도 서학개미가 제일 많이 산 건 반도체가 아니었다)
 * 릴스 커버 = 유튜브 썸네일 = 인스타 스토리 이미지 **통합** 스펙(Owner 2026-10-01: 스토리 이미지는 따로 만들지 않고 커버로 통일, 규칙 7).
 *
 * 통합 커버의 제약: 스토리 상단 UI(프로필 줄 y≈8~13%)와 프로필 그리드 3:4 크롭(위아래 12.5%)이 윗부분을 가린다 →
 * "경제번역소" 배지를 생성 이미지에 넣지 않는다(배지는 Owner 결정 대기, 기본안 = 제외). 글자는 합성기가 좌우 8% 이상 안쪽·세로 17~34%에 얹는다.
 * 모델은 글자 폭·위치 좌표를 지키지 못하므로(11편 교훈) 글자 없는 배경+캐릭터만 생성하고
 * `scripts/run-cover-headline-overlay-once.mjs`가 BlackHanSans 헤드라인을 얹는다.
 *
 * 12편 훅 감정: "잠깐, 서학개미 1위가 반도체가 아니라고?!" — 충격·갸우뚱. 배경색은 7편(빨강)·8편(주황)·9편(남색/청록·보라)·
 * 10편(에메랄드/민트)·11편(인디고→시안)과 겹치지 않게 짙은 바이올렛 → 마젠타 퍼플, 골드·시안 빛줄기.
 * 경고색(빨강)·종목명·로고·랜드마크·지구본 없음, 매수·매도 암시 없음.
 */

const BULL_CHARACTER_NOTE =
  "Include the same 3D-rendered gold bull mascot character from the attached reference image " +
  "exactly as shown — same extreme SD-proportion golden bull with glasses, white shirt, burgundy " +
  "tie, navy pants, no jacket, no logos or marks anywhere on the outfit. Do not change its core " +
  "design (color, glasses, outfit), but EXAGGERATE its facial expression far beyond the reference " +
  "image: both eyes wide and round with one eyebrow raised very high, mouth open in a shocked " +
  "\"wait, what?! the top pick isn't semiconductors?!\" expression, one hand raised beside the " +
  "cheek and the head tilted slightly. This is a dramatic, attention-grabbing expression — " +
  "think viral thumbnail energy, not the usual calm smile.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 12,
  character: "bull",
  title: "금리가 뛰는데도 서학개미가 제일 많이 산 건 반도체가 아니었다",
  slides: [
    {
      id: "cover_thumb",
      file: "00_bull_ep12_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover background image for a Korean finance ` +
        `Shorts video, designed to feel intriguing even when shrunk down to a tiny square grid ` +
        `thumbnail. ${BULL_CHARACTER_NOTE}\n\n` +
        `CRITICAL LAYOUT (a headline will be added later by software, so leave room for it): the ` +
        `upper 50% of the frame must contain NO character and NO text — only the decorative ` +
        `background (glow, flowing light ribbons, scattered gold coins). The character's horn tips ` +
        `start at about 50% of the frame height, its eyes and mouth sit near 62% of the frame ` +
        `height, and its body continues down to the bottom edge (legs and feet may be cropped). ` +
        `The character is centered horizontally and its full width stays within the central 70% of ` +
        `the frame (nothing closer than 15% to the left or right edge). Do NOT write any headline, ` +
        `title, caption, numbers, badge, logo or any other text anywhere in the image — there must ` +
        `be NO text at all; the headline area is intentionally left empty.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic scene. ` +
        `Use a dramatic gradient from deep violet (#1E0B3A) at the top to a vivid bright purple and ` +
        `magenta-purple (#7C3AED to #C084FC) glow radiating from behind the character, with warm ` +
        `gold (#FBBF24) and cyan (#22D3EE) flowing ribbons of light curving from left to right ` +
        `like streams of money, a few large soft-focus gold coins floating (plain coins with no ` +
        `symbols, no text, no currency marks), kept abstract and dark enough that white text ` +
        `placed over the upper half stays highly legible. Surprised, "wait, really?" mood, high ` +
        `energy. Do not use red or warning colors. No buildings, landmarks, flags or globes.\n\n` +
        `Style: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft cartoon ` +
        `3D style matching the character.`,
    },
  ],
});
