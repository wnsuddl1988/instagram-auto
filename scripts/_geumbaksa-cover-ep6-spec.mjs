/**
 * 금박사 배포6편(파일명 ep6, 소득대체율 43%) 유튜브 썸네일 + 인스타 릴스 커버
 * 공용 이미지 스펙. 매 편 새로 설계 원칙 승계(2026-09-22).
 */

const GEUMBAKSA_CHARACTER_NOTE =
  "Include the same 3D-rendered gold coin mascot character from the attached reference image " +
  "exactly as shown — same golden metallic disc-shaped body, same white gloved hands and feet, " +
  "no clothing. Do not change its core design (color, shape, gloves), but EXAGGERATE its facial " +
  "expression far beyond the reference image: wide shocked eyes, eyebrows raised high, mouth open " +
  "in an alarmed gasp, both hands raised up near its face in a startled \"uh-oh\" gesture. This is " +
  "a dramatic, funny, attention-grabbing expression — think viral thumbnail energy, not the usual " +
  "calm smile.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 6,
  character: "geumbaksa",
  title: "국민연금 소득대체율 43%, 진짜 내 몫은 얼마일까",
  slides: [
    {
      id: "cover_thumb",
      file: "00_geumbaksa_ep6_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover image for a Korean finance Shorts video, ` +
        `designed to grab attention and feel alarming/revealing even when shrunk down to a tiny ` +
        `square grid thumbnail. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `CRITICAL SAFE-ZONE LAYOUT (this image will be cropped differently by different apps — a ` +
        `tall rectangle on one platform, a centered square on another): every essential element ` +
        `(both text lines AND the character's full head/face) MUST fit within the vertical center ` +
        `40-50% band of the frame (roughly from 30% to 75% of the total height). Nothing essential ` +
        `may be placed in the top 25% or bottom 20% of the frame — those zones are decorative ` +
        `background only and may be cropped away safely.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic office ` +
        `scene. Use a dramatic gradient from deep navy (#0A1633) at the top to a warning red-orange ` +
        `(#E23E2E) glow radiating from behind the character, with a few large soft-focus pension/ ` +
        `percentage icons faintly visible in the decorative top/bottom zones only (a shrinking pie ` +
        `chart slice, a big "43%" ghost outline), kept abstract and dark so text stays highly ` +
        `legible on top. High energy, revealing mood.\n\n` +
        `Layout inside the safe-zone band: at the top of the band, two short punchy bold text ` +
        `lines, white with a thick dark navy (#0A1633) outline and a subtle red glow, exactly as ` +
        `written, no typos:\n"43%,\n내 몫이 아니었다"\n` +
        `Directly below the text within the same safe-zone band, the character's head and shoulders ` +
        `large enough that its exaggerated shocked expression is clearly visible even at small ` +
        `thumbnail size — the character's eyes and open mouth must sit near the vertical center of ` +
        `the whole frame, not near the bottom edge.\n\n` +
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
