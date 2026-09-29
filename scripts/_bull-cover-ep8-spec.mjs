/**
 * 황소특보 8편(삼성전자 -5% 날 태양광만 +14%, 미국 최저수입가격 시행 기대) 유튜브
 * 썸네일 + 인스타 릴스 커버 공용 이미지 스펙.
 *
 * 1~6편 원칙 계승: 캐릭터 과장 표정 + 선명한 그라디언트 배경(흐릿한 사진톤
 * 금지) + 궁금증 훅 문구 + 세로 중앙 안전영역 안에 텍스트·캐릭터 얼굴 배치
 * (플랫폼별 크롭 대응).
 *
 * 8편은 "삼성전자가 5% 빠진 날 태양광만 14% 뛰었다"는 대비(반전)가 핵심 훅.
 * 종목명은 삼성전자만 실명(허용리스트), 태양광은 업종으로만 표기.
 */

const BULL_CHARACTER_NOTE =
  "Include the same 3D-rendered gold bull mascot character from the attached reference image " +
  "exactly as shown — same extreme SD-proportion golden bull with glasses, white shirt, burgundy " +
  "tie, navy pants, no jacket, no logos or marks anywhere on the outfit. Do not change its core " +
  "design (color, glasses, outfit), but EXAGGERATE its facial expression far beyond the reference " +
  "image: one eyebrow raised high, a knowing smirk with wide curious eyes, one finger raised beside " +
  "its face as if it just spotted something everyone else missed. This is a dramatic, attention-grabbing expression — " +
  "think viral thumbnail energy, not the usual calm smile.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 8,
  character: "bull",
  title: "삼성전자 -5% 날 태양광만 +14%",
  slides: [
    {
      id: "cover_thumb",
      file: "00_bull_ep8_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover image for a Korean finance Shorts video, ` +
        `designed to grab attention and feel exciting/surprising even when shrunk down to a tiny ` +
        `square grid thumbnail (this is NOT a calm carousel slide — it needs punch at a glance). ` +
        `${BULL_CHARACTER_NOTE}\n\n` +
        `CRITICAL SAFE-ZONE LAYOUT (this image will be cropped differently by different apps — a ` +
        `tall rectangle on one platform, a centered square on another): every essential element ` +
        `(both text lines AND the character's full head/face) MUST fit within the vertical center ` +
        `40-50% band of the frame (roughly from 30% to 75% of the total height). Nothing essential ` +
        `may be placed in the top 25% or bottom 20% of the frame — those zones are decorative ` +
        `background only and may be cropped away safely.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic scene. ` +
        `Use a dramatic gradient from deep navy (#0A1633) at the top to a vivid sunny orange-gold (#FFA31A) glow ` +
        `radiating from behind the character (limit-up surge color), with a few large soft-focus ` +
        `upward red arrow shapes and blue candlestick chart silhouettes faintly visible in the ` +
        `decorative top/bottom zones only, kept abstract and dark so text stays highly legible on ` +
        `top. High energy, curious, "wait, why?" mood.\n\n` +
        `Layout inside the safe-zone band: at the top of the band, two short punchy bold text ` +
        `lines, white with a thick dark navy (#0A1633) outline and a subtle gold glow, exactly as ` +
        `written, no typos:\n"삼성전자 -5%\n태양광만 +14%"\n` +
        `Directly below the text within the same safe-zone band, the character's head and ` +
        `shoulders large enough that its exaggerated knowing-smirk expression (as described above) is ` +
        `clearly visible even at small thumbnail size — the character's eyes and open mouth must ` +
        `sit near the vertical center of the whole frame, not near the bottom edge.\n\n` +
        `Top-left corner (inside the decorative zone, may be cropped on some platforms — ` +
        `acceptable): a small rounded gold badge (#F5A623) with bold dark navy (#14213D) Korean ` +
        `text "경제번역소", about 14% of image width.\n\n` +
        `Do not add any other text, props, or captions besides what is specified above — keep the ` +
        `composition bold, high-contrast, and instantly readable, like a viral short-form video ` +
        `thumbnail designed to stop someone mid-scroll with a surprising contrast.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), maximum contrast, dramatic ` +
        `lighting, punchy and exciting, not calm or corporate.`,
    },
  ],
});
