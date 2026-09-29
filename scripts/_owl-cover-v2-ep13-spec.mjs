/**
 * 부엉박사 13편(v2, 고용률 8월 사상 첫 70% 돌파 vs 청년 취업난) 유튜브 썸네일
 * + 릴스 커버. v1 커버(owl-cover-ep13)는 옛 소재(퇴직연금 실물이전)용이라
 * 재사용하지 않고, v2 소재(고용률 평균의 함정)에 맞춰 새로 만든다.
 */

const OWL_CHARACTER_NOTE =
  "Include the same 3D-rendered owl mascot character from the attached reference image exactly " +
  "as shown — same owl body proportions, vest, tie, sunglasses pushed up on the forehead. Do not " +
  "change its core design, but EXAGGERATE its expression far beyond the reference image: eyes " +
  "wide open in confusion, one eyebrow raised, beak open as if puzzled by a contradiction, one " +
  "wing raised near its chin in a thinking/questioning pose. Dramatic, attention-grabbing — not " +
  "the usual calm analytical look.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 13,
  character: "owl",
  title: "고용률 역대 최고인데 취업은 왜 더 어려울까, 지금 챙길 지원금",
  slides: [
    {
      id: "cover_thumb",
      file: "00_owl_v2_ep13_cover_thumb.png",
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
        `soft-focus upward-arrow and document icons faintly visible in the decorative top/bottom ` +
        `zones only, kept abstract and dark so the text stays highly legible.\n\n` +
        `Layout inside the safe-zone band: at the top of the band, two short punchy bold text ` +
        `lines, white with a thick dark navy (#0A1633) outline and a subtle gold glow; make ` +
        `"70%" bright yellow (#FFD54A) with the same outline. Exactly as written, no typos:\n` +
        `"고용률 70% 역대 최고,\n근데 나만 취업 안 될까?"\n` +
        `Directly below the text within the same band, the character's head and upper body large ` +
        `enough that its exaggerated puzzled expression is clearly visible at small thumbnail ` +
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
