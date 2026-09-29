/**
 * 부엉박사 14편(한국은행 금융안정 상황 경고, 집값 잡혔다더니 경고등이 다시
 * 켜진 진짜 이유) 유튜브 썸네일 + 인스타 릴스 커버 공용 이미지 스펙. 매 편
 * 새로 설계 원칙 승계(2026-09-22). 이 편은 "안심하고 있었는데 사실은
 * 위험 신호가 다시 켜졌다"는 경고/반전 구조라 문구 자체가 강한 훅이다.
 */

const OWL_CHARACTER_NOTE =
  "Include the same 3D-rendered owl mascot character from the attached reference image exactly " +
  "as shown — same owl body proportions, vest, tie, sunglasses pushed up on the forehead. Do not " +
  "change its core design, but EXAGGERATE its expression far beyond the reference image: eyes " +
  "wide with alarm, eyebrows raised high and sharply angled, mouth open in a serious \"warning\" " +
  "shape, one wing/hand raised near its cheek as if reacting to an urgent alert. Dramatic, " +
  "intense, attention-grabbing — think a sharp anchor reacting to a breaking warning, not the " +
  "usual calm analytical look.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 14,
  character: "owl",
  title: "집값 잡혔다더니, 한은이 다시 경고등을 켰다",
  slides: [
    {
      id: "cover_thumb",
      file: "00_owl_ep14_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover image for a Korean finance Shorts video, ` +
        `designed to grab attention and feel like an urgent warning even when shrunk down to a ` +
        `tiny square grid thumbnail. ${OWL_CHARACTER_NOTE}\n\n` +
        `CRITICAL SAFE-ZONE LAYOUT (this image will be cropped differently by different apps — a ` +
        `tall rectangle on one platform, a centered square on another): every essential element ` +
        `(both text lines AND the character's full head/face) MUST fit within the vertical center ` +
        `40-50% band of the frame (roughly from 30% to 75% of the total height). Nothing essential ` +
        `may be placed in the top 25% or bottom 20% of the frame — those zones are decorative ` +
        `background only and may be cropped away safely.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic office ` +
        `scene. Use a dramatic gradient from deep navy (#0A1633) at the top to a vivid warning-red ` +
        `(#D93A3A blending into #FF6B4A) glow radiating from behind the character, with a few large ` +
        `soft-focus warning-light and mixed-direction arrow icons faintly visible in the decorative ` +
        `top/bottom zones only, kept abstract and dark so text stays highly legible on top. High ` +
        `energy, urgent alarming mood.\n\n` +
        `Layout inside the safe-zone band: at the top of the band, two short punchy bold text ` +
        `lines, white with a thick dark navy (#0A1633) outline and a subtle red glow, exactly as ` +
        `written, no typos:\n"집값 잡혔다더니\n경고등 다시 켜짐"\n` +
        `Directly below the text within the same safe-zone band, the character's head and upper ` +
        `body large enough that its exaggerated alarmed expression is clearly visible even at ` +
        `small thumbnail size — the character's eyes must sit near the vertical center of the ` +
        `whole frame, not near the bottom edge.\n\n` +
        `Top-left corner (inside the decorative zone, may be cropped on some platforms — ` +
        `acceptable): a small rounded yellow badge (#FFD54A) with bold dark navy (#14213D) Korean ` +
        `text "경제번역소", about 14% of image width.\n\n` +
        `Do not add any other text, props, or captions besides what is specified above — keep the ` +
        `composition bold, high-contrast, and instantly readable, like a viral short-form video ` +
        `thumbnail designed to stop someone mid-scroll.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), maximum contrast, dramatic ` +
        `lighting, punchy and urgent, not calm or corporate.`,
    },
  ],
});
