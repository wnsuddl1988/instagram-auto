/**
 * 금박사 9편(DB형인지 DC형인지도 모르고 회사 다니는 사람 진짜 많던데) 유튜브
 * 썸네일 + 인스타 릴스 커버 공용 이미지 스펙.
 *
 * 7편 v2.1(안전영역 보정, Owner 확정) 원칙 계승: 캐릭터 과장 표정 + 선명한
 * 그라디언트 배경(흐릿한 사무실톤 금지) + 위기감·반전형 훅 문구 + 세로 중앙
 * 40~50% 안전영역 안에 텍스트·캐릭터 얼굴 배치(플랫폼별 크롭 대응).
 *
 * 9편은 "내 퇴직연금이 DB형인지 DC형인지도 모르면 손해 본다"는 경각심이
 * 핵심 훅이라, 당황/놀람 표정과 "이거 모르면 손해"류의 직접적 경고형
 * 문구로 구성.
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
  episode: 9,
  character: "geumbaksa",
  title: "DB형인지 DC형인지도 모르고 회사 다니는 사람 진짜 많던데",
  slides: [
    {
      id: "cover_thumb",
      file: "00_geumbaksa_ep9_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover image for a Korean finance Shorts video, ` +
        `designed to grab attention and feel alarming/intriguing even when shrunk down to a tiny ` +
        `square grid thumbnail (this is NOT a calm carousel slide — it needs punch and drama at a ` +
        `glance). ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `CRITICAL SAFE-ZONE LAYOUT (this image will be cropped differently by different apps — a ` +
        `tall rectangle on one platform, a centered square on another): every essential element ` +
        `(both text lines AND the character's full head/face) MUST fit within the vertical center ` +
        `40-50% band of the frame (roughly from 30% to 75% of the total height). Nothing essential ` +
        `may be placed in the top 25% or bottom 20% of the frame — those zones are decorative ` +
        `background only and may be cropped away safely.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic office ` +
        `scene. Use a dramatic gradient from deep navy (#0A1633) at the top to a warning red-orange ` +
        `(#E23E2E) glow radiating from behind the character, with a few large soft-focus document/ ` +
        `pension-icon shapes faintly visible in the decorative top/bottom zones only, kept abstract ` +
        `and dark so text stays highly legible on top. High energy, slightly urgent mood.\n\n` +
        `Layout inside the safe-zone band: at the top of the band, two short punchy bold text lines, ` +
        `white with a thick dark navy (#0A1633) outline and a subtle red glow, exactly as written, ` +
        `no typos:\n"내 퇴직연금\n뭔지도 몰랐다"\n` +
        `Directly below the text within the same safe-zone band, the character's head and shoulders ` +
        `large enough that its exaggerated shocked expression (as described above) is clearly ` +
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
