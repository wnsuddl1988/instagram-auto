/**
 * 황소특보 11편(조선주 — 주가는 반토막 가까이인데 이익 전망은 올랐다) 유튜브 썸네일 +
 * 인스타 릴스 커버 공용 이미지 스펙.
 *
 * 10편 원칙 계승: 캐릭터 과장 표정 + 선명한 그라디언트 배경(흐릿한 사진톤 금지) + 궁금증 훅 문구 +
 * 세로 중앙 안전영역(30~75%) 안에 텍스트·캐릭터 얼굴 + 좌우 10% 이상 여백.
 *
 * ★(2026-09-30 11편 교훈) 모델은 글자 폭·위치 좌표를 지키지 못한다(1차: 문구가 폭 6~94%·세로 15~28%에
 * 나와 안전영역 이탈). 그래서 이 스펙은 글자 없는 배경+캐릭터만 생성하고, 헤드라인은
 * `scripts/run-cover-headline-overlay-once.mjs`가 BlackHanSans로 정확한 위치에 얹는다.
 *
 * 11편은 "주가는 빠지는데 이익 전망은 오르는 이유가 뭐지?"가 훅. 7편(빨강)·8편(주황)·9편(남색/청록·보라)·
 * 10편(에메랄드/민트)과 겹치지 않게 배경은 짙은 인디고 → 선명한 시안~사파이어 블루, 골드 글로우.
 * 경고색(빨강)은 쓰지 않고 호기심·갸우뚱 톤으로 간다. 종목명·로고 없음, 매수·매도 암시 없음.
 */

const BULL_CHARACTER_NOTE =
  "Include the same 3D-rendered gold bull mascot character from the attached reference image " +
  "exactly as shown — same extreme SD-proportion golden bull with glasses, white shirt, burgundy " +
  "tie, navy pants, no jacket, no logos or marks anywhere on the outfit. Do not change its core " +
  "design (color, glasses, outfit), but EXAGGERATE its facial expression far beyond the reference " +
  "image: one eyebrow raised very high and the other furrowed, eyes wide and round, mouth open in " +
  "a puzzled \"wait, what?! the price fell but the profit forecast rose?\" expression, one hand " +
  "on its chin and the head tilted slightly. This is a dramatic, attention-grabbing expression — " +
  "think viral thumbnail energy, not the usual calm smile.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 11,
  character: "bull",
  title: "조선주 반토막 가까이 빠졌는데 이익 전망은 올랐다",
  slides: [
    {
      id: "cover_thumb",
      file: "00_bull_ep11_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover background image for a Korean finance ` +
        `Shorts video, designed to feel intriguing even when shrunk down to a tiny square grid ` +
        `thumbnail. ${BULL_CHARACTER_NOTE}\n\n` +
        `CRITICAL LAYOUT (a headline will be added later by software, so leave room for it): the ` +
        `upper 50% of the frame must contain NO character and NO text — only the decorative ` +
        `background (glow, light rays, abstract cranes). The character's horn tips start at about ` +
        `50% of the frame height, its eyes and mouth sit near 62% of the frame height, and its ` +
        `body continues down to the bottom edge (legs and feet may be cropped). The character is ` +
        `centered horizontally and its full width stays within the central 70% of the frame ` +
        `(nothing closer than 15% to the left or right edge). Do NOT write any headline, title, ` +
        `caption, numbers or other text anywhere in the image — the headline area is ` +
        `intentionally left empty.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic scene. ` +
        `Use a dramatic gradient from deep indigo (#0B1026) at the top to a vivid bright cyan and ` +
        `sapphire blue (#0EA5E9 to #38BDF8) glow radiating from behind the character, with warm ` +
        `gold (#FBBF24) light rays and a few large soft-focus abstract silhouettes of giant harbor ` +
        `cranes and cargo-ship hulls (no text, no logos) kept abstract and dark enough that white ` +
        `text placed over the upper half stays highly legible. Puzzled, "wait, why?" mood, high ` +
        `energy. Do not use red or warning colors.\n\n` +
        `Top-left corner: a small rounded gold badge (#F5A623) with bold dark navy (#14213D) ` +
        `Korean text "경제번역소", about 14% of image width. This badge is the ONLY text in the ` +
        `image.\n\n` +
        `Style: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft cartoon ` +
        `3D style matching the character.`,
    },
  ],
});
