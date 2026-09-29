/**
 * 부엉박사 12편(v2, 토지거래허가구역 실거주 유예) 유튜브 썸네일 + 릴스 커버.
 * v1 커버(owl-cover-ep12)는 "세 낀 집"이라는 은어(v1 대본 1차 피드백에서 Owner가
 * 지적한 표현)를 써서 새로 만든다. 문구는 v2 헤더·훅과 맞춘다.
 */

const OWL_CHARACTER_NOTE =
  "Include the same 3D-rendered owl mascot character from the attached reference image exactly " +
  "as shown — same owl body proportions, vest, tie, sunglasses pushed up on the forehead. Do not " +
  "change its core design, but EXAGGERATE its expression far beyond the reference image: eyes " +
  "wide open in surprise, eyebrows raised high, beak open in a \"really?!\" shape, one wing " +
  "raised near its cheek as if it just found good news. Dramatic, attention-grabbing — not the " +
  "usual calm analytical look.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 12,
  character: "owl",
  title: "세입자 있는 집, 이제 입주를 2029년 말까지 미룰 수 있다",
  slides: [
    {
      id: "cover_thumb",
      file: "00_owl_v2_ep12_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover image for a Korean finance Shorts video, ` +
        `designed to grab attention even when shrunk down to a tiny square grid thumbnail. ` +
        `${OWL_CHARACTER_NOTE}\n\n` +
        `CRITICAL SAFE-ZONE LAYOUT (this image will be cropped differently by different apps — a ` +
        `tall rectangle on one platform, a centered square on another): every essential element ` +
        `(both text lines AND the character's full head/face) MUST fit within the vertical center ` +
        `band of the frame, roughly from 30% to 75% of the total height. Nothing essential may be ` +
        `placed in the top 25% or bottom 20% of the frame — those zones are decorative background ` +
        `only and may be cropped away safely.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic office ` +
        `scene. A dramatic gradient from deep navy (#0A1633) at the top to a warm gold-orange ` +
        `(#E2A62E blending into #FFD54A) glow radiating from behind the character, with a few large ` +
        `soft-focus house and key icons faintly visible in the decorative top/bottom zones only, ` +
        `kept abstract and dark so the text stays highly legible.\n\n` +
        `Layout inside the safe-zone band: at the top of the band, two short punchy bold text ` +
        `lines, white with a thick dark navy (#0A1633) outline and a subtle gold glow; make ` +
        `"2029년" bright yellow (#FFD54A) with the same outline. Exactly as written, no typos:\n` +
        `"세입자 있는 집,\n2029년까지 안 들어가도?"\n` +
        `Directly below the text within the same band, the character's head and upper body large ` +
        `enough that its exaggerated surprised expression is clearly visible at small thumbnail ` +
        `size — the character's eyes must sit near the vertical center of the whole frame.\n\n` +
        `Top-left corner (decorative zone, may be cropped — acceptable): a small rounded yellow ` +
        `badge (#FFD54A) with bold dark navy (#14213D) Korean text "경제번역소", about 14% of image ` +
        `width.\n\n` +
        `Do not add any other text, props, or captions. Style: bold sans-serif Korean font (Black ` +
        `Han Sans style), maximum contrast, dramatic lighting, punchy and surprising, not calm or ` +
        `corporate.`,
    },
  ],
});
