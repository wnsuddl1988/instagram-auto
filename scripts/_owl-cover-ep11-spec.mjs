/**
 * 부엉박사 11편(고용률 8월 사상 첫 70% 돌파, 근데 청년은 46개월째 취업난)
 * 유튜브 썸네일 + 인스타 릴스 커버 공용 이미지 스펙. 매 편 새로 설계 원칙
 * 승계(2026-09-22). 이 편은 "역대 최고 vs 청년 취업난"이라는 반전/역설
 * 구조라 문구 자체가 이미 강한 훅이다.
 */

const OWL_CHARACTER_NOTE =
  "Include the same 3D-rendered owl mascot character from the attached reference image exactly " +
  "as shown — same owl body proportions, vest, tie, sunglasses pushed up on the forehead. Do not " +
  "change its core design, but EXAGGERATE its expression far beyond the reference image: one " +
  "eyebrow raised in skepticism, eyes narrowed with a knowing, slightly incredulous look, mouth " +
  "in a tight questioning line, one wing/hand raised near its chin as if to say \"wait, really?\". " +
  "Dramatic, intense, attention-grabbing — think a sharp anchor catching a contradiction in the " +
  "numbers, not the usual calm analytical look.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 11,
  character: "owl",
  title: "고용률 8월 사상 첫 70% 돌파, 근데 청년은 46개월째 취업난",
  slides: [
    {
      id: "cover_thumb",
      file: "00_owl_ep11_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover image for a Korean finance Shorts video, ` +
        `designed to grab attention and feel like a puzzling contradiction even when shrunk down ` +
        `to a tiny square grid thumbnail. ${OWL_CHARACTER_NOTE}\n\n` +
        `CRITICAL SAFE-ZONE LAYOUT (this image will be cropped differently by different apps — a ` +
        `tall rectangle on one platform, a centered square on another): every essential element ` +
        `(both text lines AND the character's full head/face) MUST fit within the vertical center ` +
        `40-50% band of the frame (roughly from 30% to 75% of the total height). Nothing essential ` +
        `may be placed in the top 25% or bottom 20% of the frame — those zones are decorative ` +
        `background only and may be cropped away safely.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic office ` +
        `scene. Use a dramatic gradient from deep navy (#0A1633) at the top to a warning purple-` +
        `red (#8A2E7A blending into #E2352E) glow radiating from behind the character, with a few ` +
        `large soft-focus contrast icons faintly visible in the decorative top/bottom zones only ` +
        `(an up-arrow chart next to a down-arrow chart), kept abstract and dark so text stays ` +
        `highly legible on top. High energy, puzzling/tense mood.\n\n` +
        `Layout inside the safe-zone band: at the top of the band, two short punchy bold text ` +
        `lines, white with a thick dark navy (#0A1633) outline and a subtle purple-red glow, ` +
        `exactly as written, no typos:\n"고용률 최고인데\n청년은 취업난"\n` +
        `Directly below the text within the same safe-zone band, the character's head and upper ` +
        `body large enough that its exaggerated skeptical expression is clearly visible even at ` +
        `small thumbnail size — the character's eyes must sit near the vertical center of the ` +
        `whole frame, not near the bottom edge.\n\n` +
        `Top-left corner (inside the decorative zone, may be cropped on some platforms — ` +
        `acceptable): a small rounded yellow badge (#FFD54A) with bold dark navy (#14213D) Korean ` +
        `text "경제번역소", about 14% of image width.\n\n` +
        `Do not add any other text, props, or captions besides what is specified above — keep the ` +
        `composition bold, high-contrast, and instantly readable, like a viral short-form video ` +
        `thumbnail designed to stop someone mid-scroll.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), maximum contrast, dramatic ` +
        `lighting, punchy and tense, not calm or corporate.`,
    },
  ],
});
