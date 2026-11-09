/**
 * 황소특보 3편(반도체 랠리 착시, 외국인 종목별 반대 베팅) 유튜브 썸네일 +
 * 인스타 릴스 커버 공용 이미지 스펙.
 *
 * 1·2편 원칙 계승: 캐릭터 과장 표정 + 선명한 그라디언트 배경(흐릿한 사진톤
 * 금지) + 궁금증·반전형 훅 문구 + 세로 중앙 40~50% 안전영역 안에
 * 텍스트·캐릭터 얼굴 배치(플랫폼별 크롭 대응).
 *
 * 3편은 "삼성전자·SK하이닉스 둘 다 반도체주인데 외국인이 완전히 반대로
 * 베팅했다"는 반전이 핵심 훅이라, 놀람/확신에 찬 표정과 반전형 문구로 구성.
 */

const BULL_CHARACTER_NOTE =
  "Include the same 3D-rendered gold bull mascot character from the attached reference image " +
  "exactly as shown — same extreme SD-proportion golden bull with glasses, white shirt, burgundy " +
  "tie, navy pants, no jacket. Do not change its core design (color, glasses, outfit), but " +
  "EXAGGERATE its facial expression far beyond the reference image: wide excited eyes, eyebrows " +
  "raised high, mouth open in a big astonished grin, one hand raised near its face in a dramatic " +
  "\"can you believe this\" gesture. This is a dramatic, energetic, attention-grabbing expression " +
  "— think viral thumbnail energy, not the usual calm smile.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 3,
  character: "bull",
  title: "반도체가 다 같이 오른다고? 외국인은 그렇게 안 봤다",
  slides: [
    {
      id: "cover_thumb",
      file: "00_bull_ep3_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover image for a Korean finance Shorts video, ` +
        `designed to grab attention and feel exciting/intriguing even when shrunk down to a tiny ` +
        `square grid thumbnail (this is NOT a calm carousel slide — it needs punch and drama at a ` +
        `glance). ${BULL_CHARACTER_NOTE}\n\n` +
        `CRITICAL SAFE-ZONE LAYOUT (this image will be cropped differently by different apps — a ` +
        `tall rectangle on one platform, a centered square on another): every essential element ` +
        `(both text lines AND the character's full head/face) MUST fit within the vertical center ` +
        `40-50% band of the frame (roughly from 30% to 75% of the total height). Nothing essential ` +
        `may be placed in the top 25% or bottom 20% of the frame — those zones are decorative ` +
        `background only and may be cropped away safely.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic scene. ` +
        `Use a dramatic gradient from deep navy (#0A1633) at the top to a vivid gold-orange ` +
        `(#F5A623) glow radiating from behind the character, with a few large soft-focus red ` +
        `upward-arrow and blue downward-arrow candlestick-chart shapes faintly visible in the ` +
        `decorative top/bottom zones only (hinting at opposite directions), kept abstract and dark ` +
        `so text stays highly legible on top. High energy, slightly urgent excited mood.\n\n` +
        `Layout inside the safe-zone band: at the top of the band, two short punchy bold text ` +
        `lines, white with a thick dark navy (#0A1633) outline and a subtle gold glow, exactly as ` +
        `written, no typos:\n"같은 반도체인데\n외국인은 갈랐다"\n` +
        `Directly below the text within the same safe-zone band, the character's head and ` +
        `shoulders large enough that its exaggerated excited expression (as described above) is ` +
        `clearly visible even at small thumbnail size — the character's eyes and open mouth must ` +
        `sit near the vertical center of the whole frame, not near the bottom edge.\n\n` +
        `Top-left corner (inside the decorative zone, may be cropped on some platforms — ` +
        `acceptable): a small rounded gold badge (#F5A623) with bold dark navy (#14213D) Korean ` +
        `text "경제번역소", about 14% of image width.\n\n` +
        `Do not add any other text, props, or captions besides what is specified above — keep the ` +
        `composition bold, high-contrast, and instantly readable, like a viral short-form video ` +
        `thumbnail designed to stop someone mid-scroll.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), maximum contrast, dramatic ` +
        `lighting, punchy and energetic, not calm or corporate.`,
    },
  ],
});
