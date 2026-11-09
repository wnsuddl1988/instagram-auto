/**
 * 금박사 배포3편(파일명 ep2, ETF) 유튜브 썸네일 + 인스타 릴스 커버 공용
 * 이미지 스펙. 매 편 새로 설계 원칙 승계(2026-09-22, 금박사 7편에서 확정).
 *
 * 파일명 vs 배포순서 주의: 스펙 파일은 _geumbaksa-ep2-assembly-spec.mjs
 * (ETF)이지만 실제 배포는 3편이다(_ai/CURRENT_STANDARDS.md 매핑표 참고).
 * 산출물 폴더는 C:/tmp/geumbaksa-cardnews-ep2-v2, geumbaksa-ep2-episode-final-v3.
 */

const GEUMBAKSA_CHARACTER_NOTE =
  "Include the same 3D-rendered gold coin mascot character from the attached reference image " +
  "exactly as shown — same golden metallic disc-shaped body, same white gloved hands and feet, " +
  "no clothing. Do not change its core design (color, shape, gloves), but EXAGGERATE its facial " +
  "expression far beyond the reference image: wide curious/confused eyes, eyebrows raised high, " +
  "mouth open in a puzzled \"huh?\" expression, one hand scratching its head, the other hand " +
  "gesturing outward as if asking a question. This is a dramatic, funny, attention-grabbing " +
  "expression — think viral thumbnail energy, not the usual calm smile.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 2,
  character: "geumbaksa",
  title: "주식은 아는데 ETF는 뭔지 모르겠다면",
  slides: [
    {
      id: "cover_thumb",
      file: "00_geumbaksa_ep2_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover image for a Korean finance Shorts video, ` +
        `designed to grab attention and feel intriguing/puzzling even when shrunk down to a tiny ` +
        `square grid thumbnail. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `CRITICAL SAFE-ZONE LAYOUT (this image will be cropped differently by different apps — a ` +
        `tall rectangle on one platform, a centered square on another): every essential element ` +
        `(both text lines AND the character's full head/face) MUST fit within the vertical center ` +
        `40-50% band of the frame (roughly from 30% to 75% of the total height). Nothing essential ` +
        `may be placed in the top 25% or bottom 20% of the frame — those zones are decorative ` +
        `background only and may be cropped away safely.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic office ` +
        `scene. Use a dramatic gradient from deep navy (#0A1633) at the top to a bright blue-teal ` +
        `(#1B9BD1) glow radiating from behind the character, with a few large soft-focus stock/ETF ` +
        `icons faintly visible in the decorative top/bottom zones only (a basket of small chart ` +
        `icons, a big question mark), kept abstract and dark so text stays highly legible on top. ` +
        `Curious, energetic mood.\n\n` +
        `Layout inside the safe-zone band: at the top of the band, two short punchy bold text ` +
        `lines, white with a thick dark navy (#0A1633) outline and a subtle blue glow, exactly as ` +
        `written, no typos:\n"주식은 아는데,\nETF는 대체 뭘까"\n` +
        `Directly below the text within the same safe-zone band, the character's head and shoulders ` +
        `large enough that its exaggerated puzzled expression is clearly visible even at small ` +
        `thumbnail size — the character's eyes and open mouth must sit near the vertical center of ` +
        `the whole frame, not near the bottom edge.\n\n` +
        `Top-left corner (inside the decorative zone, may be cropped on some platforms — ` +
        `acceptable): a small rounded yellow badge (#FFD54A) with bold dark navy (#14213D) Korean ` +
        `text "경제번역소", about 14% of image width.\n\n` +
        `Do not add any other text, props, or captions besides what is specified above — keep the ` +
        `composition bold, high-contrast, and instantly readable, like a viral short-form video ` +
        `thumbnail designed to stop someone mid-scroll.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), maximum contrast, dramatic ` +
        `lighting, punchy and curious, not calm or corporate.`,
    },
  ],
});
