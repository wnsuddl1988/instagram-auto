/**
 * 금박사 10편(실업급여 하루 6만8480원으로 올랐다는데, 왜 통장엔 22만원이
 * 덜 들어올까) 유튜브 썸네일 + 인스타 릴스 커버 공용 이미지 스펙.
 *
 * 8, 9편 원칙 계승: 캐릭터 과장 표정 + 선명한 그라디언트 배경(흐릿한
 * 사무실톤 금지) + 반전형 훅 문구 + 세로 중앙 40~50% 안전영역 안에
 * 텍스트·캐릭터 얼굴 배치(플랫폼별 크롭 대응).
 *
 * 10편은 "실업급여 하루 금액은 오르는데 한 달 통장은 오히려 준다"는
 * 반전이 핵심 훅이라, 당황/혼란 표정과 "오른다는데 왜 줄어?"류의
 * 반전형 문구로 구성.
 */

const GEUMBAKSA_CHARACTER_NOTE =
  "Include the same 3D-rendered gold coin mascot character from the attached reference image " +
  "exactly as shown — same golden metallic disc-shaped body, same white gloved hands and feet, " +
  "no clothing. Do not change its core design (color, shape, gloves), but EXAGGERATE its facial " +
  "expression far beyond the reference image: wide confused eyes, one eyebrow raised, mouth open " +
  "in a puzzled \"wait, what?\" gasp, both hands raised near its face in a baffled gesture. This is " +
  "a dramatic, funny, attention-grabbing expression — think viral thumbnail energy, not the usual " +
  "calm smile.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 10,
  character: "geumbaksa",
  title: "실업급여 하루 6만8480원으로 올랐다는데, 왜 통장엔 22만원이 덜 들어올까",
  slides: [
    {
      id: "cover_thumb",
      file: "00_geumbaksa_ep10_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover image for a Korean finance Shorts video, ` +
        `designed to grab attention and feel confusing/intriguing even when shrunk down to a tiny ` +
        `square grid thumbnail (this is NOT a calm carousel slide — it needs punch and drama at a ` +
        `glance). ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `CRITICAL SAFE-ZONE LAYOUT (this image will be cropped differently by different apps — a ` +
        `tall rectangle on one platform, a centered square on another): every essential element ` +
        `(both text lines AND the character's full head/face) MUST fit within the vertical center ` +
        `40-50% band of the frame (roughly from 30% to 75% of the total height). Nothing essential ` +
        `may be placed in the top 25% or bottom 20% of the frame — those zones are decorative ` +
        `background only and may be cropped away safely.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic office ` +
        `scene. Use a dramatic gradient from deep navy (#0A1633) at the top to an electric blue-teal ` +
        `(#0EA5B7) glow radiating from behind the character, with a few large soft-focus coin/ ` +
        `banknote icon shapes faintly visible in the decorative top/bottom zones only, kept abstract ` +
        `and dark so text stays highly legible on top. High energy, puzzled/urgent mood.\n\n` +
        `Layout inside the safe-zone band: at the top of the band, two short punchy bold text lines, ` +
        `white with a thick dark navy (#0A1633) outline and a subtle blue glow, exactly as written, ` +
        `no typos:\n"오른다더니\n통장은 왜 줄어?"\n` +
        `Directly below the text within the same safe-zone band, the character's head and shoulders ` +
        `large enough that its exaggerated puzzled expression (as described above) is clearly ` +
        `visible even at small thumbnail size — the character's eyes and open mouth must sit near ` +
        `the vertical center of the whole frame, not near the bottom edge.\n\n` +
        `Top-left corner (inside the decorative zone, may be cropped on some platforms — acceptable): ` +
        `a small rounded yellow badge (#FFD54A) with bold dark navy (#14213D) Korean text ` +
        `"경제번역소", about 14% of image width.\n\n` +
        `Do not add any other text, props, or captions besides what is specified above — keep the ` +
        `composition bold, high-contrast, and instantly readable, like a viral short-form video ` +
        `thumbnail designed to stop someone mid-scroll.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), maximum contrast, dramatic ` +
        `lighting, punchy and slightly urgent, not calm or corporate.`,
    },
  ],
});
