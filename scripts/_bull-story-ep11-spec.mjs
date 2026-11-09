/**
 * 황소특보 Instagram Story 전용 이미지 스펙 — 11편(조선주: 주가는 반토막 가까이인데 이익 전망은
 * 올랐다).
 *
 * 커버를 재사용하지 않고 처음부터 9:16 풀프레임으로 따로 만든다(2026-09-20 원칙). 커버와 같은
 * 문구·캐릭터·톤이되 배경은 본편 도입·마무리 구역인 해 질 녘 조선소 도크로 통일한다
 * (편마다 소재에 맞는 배경, 트레이딩 라운지 재사용 금지 — 2026-09-30).
 *
 * ★(2026-09-30 11편 교훈) 글자는 모델이 아니라 `scripts/run-cover-headline-overlay-once.mjs`로 얹는다.
 * 이 스펙은 글자 없는 배경+캐릭터만 만든다(모델이 글자 폭·위치 좌표를 지키지 못함).
 */

const BADGE_RULE =
  "Top-left corner: a large rounded gold badge (#F5A623), noticeably big and prominent " +
  "(roughly 20% of the image width), containing bold dark navy blue (#14213D) Korean text " +
  "\"경제번역소\". This badge is the ONLY text in the image. Do not add any text at the bottom.";

const BULL_CHARACTER_NOTE =
  "Include the same 3D-rendered gold bull mascot character from the attached reference image " +
  "exactly as shown — same extreme SD-proportion golden bull with glasses, white shirt, burgundy " +
  "tie, navy pants, no jacket, no logos or marks anywhere on the outfit. Do not change its design.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_story_spec_v1",
  episode: 11,
  character: "bull",
  title: "조선주 반토막 가까이 빠졌는데 이익 전망은 올랐다",
  slides: [
    {
      id: "story_cover",
      file: "01_bull_ep11_story_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram Story background image, exactly 1080x1920px (9:16 ` +
        `full-screen portrait), for a Korean finance information account. ` +
        `${BULL_CHARACTER_NOTE}\n\n` +
        `Background: a bright, grand shipyard dock at golden hour with giant orange gantry cranes, ` +
        `a huge cargo-ship hull under construction (no text, no logos, no ship names), a wooden ` +
        `observation deck with glass railing and potted plants in the foreground, in the same ` +
        `cute, soft, cartoon 3D animation style as the character (never photorealistic), filling ` +
        `the entire 9:16 frame top to bottom, with a subtle dark indigo semi-transparent overlay ` +
        `(about 35% opacity) so that white text placed on the upper part stays legible.\n\n` +
        `CRITICAL LAYOUT (a headline will be added later by software, so leave room for it): the ` +
        `band from 12% to 38% of the frame height must contain NO character and NO text — only ` +
        `background scenery (sky, cranes). The character stands centered, one eyebrow raised high ` +
        `with wide puzzled eyes and one hand on its chin as if asking "why?". Its horn tips start ` +
        `at about 45% of the frame height, its whole body is visible down to the feet at about ` +
        `90% of the frame height, and its full width stays within the central 65% of the frame ` +
        `(nothing closer than 15% to the left or right edge). Do NOT write any headline, title, ` +
        `caption, numbers or other text anywhere in the image.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Style: professional but intriguing financial news card background, high contrast, ` +
        `composition designed for a full 9:16 vertical screen with no side cropping.`,
    },
  ],
});
