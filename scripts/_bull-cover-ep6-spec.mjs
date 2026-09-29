/**
 * 황소특보 6편(삼성전자 3분기 배당, 9/28 오늘이 마지막 매수일) 유튜브
 * 썸네일 + 인스타 릴스 커버 공용 이미지 스펙.
 *
 * 1~5편 원칙 계승: 캐릭터 과장 표정 + 선명한 그라디언트 배경(흐릿한 사진톤
 * 금지) + 궁금증·긴급성 훅 문구 + 세로 중앙 안전영역 안에 텍스트·캐릭터
 * 얼굴 배치(플랫폼별 크롭 대응).
 *
 * 6편은 "오늘(9/28) 당장 행동해야 마지막 매수 기회를 놓치지 않는다"는
 * 긴급성이 핵심 훅. 삼성전자는 허용리스트 종목이라 실명 사용.
 */

const BULL_CHARACTER_NOTE =
  "Include the same 3D-rendered gold bull mascot character from the attached reference image " +
  "exactly as shown — same extreme SD-proportion golden bull with glasses, white shirt, burgundy " +
  "tie, navy pants, no jacket, no logos or marks anywhere on the outfit. Do not change its core " +
  "design (color, glasses, outfit), but EXAGGERATE its facial expression far beyond the reference " +
  "image: wide urgent eyes, eyebrows raised high, mouth open as if shouting an urgent warning, " +
  "one hand raised near its face with an index finger pointing at an invisible clock/deadline. " +
  "This is a dramatic, urgent, attention-grabbing expression — think viral thumbnail energy, not " +
  "the usual calm smile.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 6,
  character: "bull",
  title: "삼성전자 배당, 오늘까지 사야 30조 원 잔치에 낀다",
  slides: [
    {
      id: "cover_thumb",
      file: "00_bull_ep6_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover image for a Korean finance Shorts video, ` +
        `designed to grab attention and feel urgent/time-sensitive even when shrunk down to a tiny ` +
        `square grid thumbnail (this is NOT a calm carousel slide — it needs punch and urgency at a ` +
        `glance). ${BULL_CHARACTER_NOTE}\n\n` +
        `CRITICAL SAFE-ZONE LAYOUT (this image will be cropped differently by different apps — a ` +
        `tall rectangle on one platform, a centered square on another): every essential element ` +
        `(both text lines AND the character's full head/face) MUST fit within the vertical center ` +
        `40-50% band of the frame (roughly from 30% to 75% of the total height). Nothing essential ` +
        `may be placed in the top 25% or bottom 20% of the frame — those zones are decorative ` +
        `background only and may be cropped away safely.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic scene. ` +
        `Use a dramatic gradient from deep navy (#0A1633) at the top to a vivid red-orange ` +
        `(#E8452C) glow radiating from behind the character (urgency color, like a countdown ` +
        `warning), with a few large soft-focus clock-hand or calendar shapes and blue candlestick ` +
        `chart silhouettes faintly visible in the decorative top/bottom zones only, kept abstract ` +
        `and dark so text stays highly legible on top. High energy, urgent, time-pressure mood.\n\n` +
        `Layout inside the safe-zone band: at the top of the band, two short punchy bold text ` +
        `lines, white with a thick dark navy (#0A1633) outline and a subtle red glow, exactly as ` +
        `written, no typos:\n"삼성전자 배당 30조 원\n오늘 놓치면 끝"\n` +
        `Directly below the text within the same safe-zone band, the character's head and ` +
        `shoulders large enough that its exaggerated urgent expression (as described above) is ` +
        `clearly visible even at small thumbnail size — the character's eyes and open mouth must ` +
        `sit near the vertical center of the whole frame, not near the bottom edge.\n\n` +
        `Top-left corner (inside the decorative zone, may be cropped on some platforms — ` +
        `acceptable): a small rounded gold badge (#F5A623) with bold dark navy (#14213D) Korean ` +
        `text "경제번역소", about 14% of image width.\n\n` +
        `Do not add any other text, props, or captions besides what is specified above — keep the ` +
        `composition bold, high-contrast, and instantly readable, like a viral short-form video ` +
        `thumbnail designed to stop someone mid-scroll with time pressure.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), maximum contrast, dramatic ` +
        `lighting, punchy and urgent, not calm or corporate.`,
    },
  ],
});
