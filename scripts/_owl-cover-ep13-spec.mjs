/**
 * 부엉박사 13편(퇴직연금 실물이전, 팔지 않고 그대로 계좌만 옮긴다) 유튜브
 * 썸네일 + 인스타 릴스 커버 공용 이미지 스펙. 매 편 새로 설계 원칙 승계
 * (2026-09-22). 이 편은 "몰라서 그냥 묶여있던 손해를 이제 안 봐도 된다"는
 * 안도/의외성 구조라 문구 자체가 강한 훅이다.
 */

const OWL_CHARACTER_NOTE =
  "Include the same 3D-rendered owl mascot character from the attached reference image exactly " +
  "as shown — same owl body proportions, vest, tie, sunglasses pushed up on the forehead. Do not " +
  "change its core design, but EXAGGERATE its expression far beyond the reference image: eyes " +
  "wide with surprise, eyebrows raised high, mouth open in an astonished \"really?\" shape, one " +
  "wing/hand raised near its cheek as if reacting to unexpected good news. Dramatic, intense, " +
  "attention-grabbing — think a sharp anchor reacting to a surprising loophole, not the usual calm " +
  "analytical look.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 13,
  character: "owl",
  title: "퇴직연금 계좌, 팔지 않고 그대로 옮길 수 있다",
  slides: [
    {
      id: "cover_thumb",
      file: "00_owl_ep13_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover image for a Korean finance Shorts video, ` +
        `designed to grab attention and feel like a surprising realization even when shrunk down ` +
        `to a tiny square grid thumbnail. ${OWL_CHARACTER_NOTE}\n\n` +
        `CRITICAL SAFE-ZONE LAYOUT (this image will be cropped differently by different apps — a ` +
        `tall rectangle on one platform, a centered square on another): every essential element ` +
        `(both text lines AND the character's full head/face) MUST fit within the vertical center ` +
        `40-50% band of the frame (roughly from 30% to 75% of the total height). Nothing essential ` +
        `may be placed in the top 25% or bottom 20% of the frame — those zones are decorative ` +
        `background only and may be cropped away safely.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic office ` +
        `scene. Use a dramatic gradient from deep navy (#0A1633) at the top to a warm gold-orange ` +
        `(#E2A62E blending into #FFD54A) glow radiating from behind the character, with a few large ` +
        `soft-focus arrow/document icons faintly visible in the decorative top/bottom zones only, ` +
        `kept abstract and dark so text stays highly legible on top. High energy, surprising/` +
        `relieving mood.\n\n` +
        `Layout inside the safe-zone band: at the top of the band, two short punchy bold text ` +
        `lines, white with a thick dark navy (#0A1633) outline and a subtle gold glow, exactly as ` +
        `written, no typos:\n"팔지 않고\n계좌만 그대로 이전"\n` +
        `Directly below the text within the same safe-zone band, the character's head and upper ` +
        `body large enough that its exaggerated surprised expression is clearly visible even at ` +
        `small thumbnail size — the character's eyes must sit near the vertical center of the ` +
        `whole frame, not near the bottom edge.\n\n` +
        `Top-left corner (inside the decorative zone, may be cropped on some platforms — ` +
        `acceptable): a small rounded yellow badge (#FFD54A) with bold dark navy (#14213D) Korean ` +
        `text "경제번역소", about 14% of image width.\n\n` +
        `Do not add any other text, props, or captions besides what is specified above — keep the ` +
        `composition bold, high-contrast, and instantly readable, like a viral short-form video ` +
        `thumbnail designed to stop someone mid-scroll.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), maximum contrast, dramatic ` +
        `lighting, punchy and relieving, not calm or corporate.`,
    },
  ],
});
