/**
 * 부엉박사 7편(3배 레버리지 ETF, 이달 1.1조 다시 몰린 이유) 유튜브 썸네일 +
 * 인스타 릴스 커버 공용 이미지 스펙.
 *
 * 금박사 7편에서 확정된 디자인 원칙 승계(2026-09-22 Owner 확정, 매 편 새로
 * 설계): 캐릭터를 화면 크게 과장된 표정으로, 선명한 컬러 배경, 위기감·반전형
 * 훅 문구. 크롭 안전영역(세로 중앙 40~50%)에 텍스트+캐릭터 얼굴을 몰아넣는다.
 *
 * 부엉박사 톤: 날카롭고 냉정한 표정이 기본값이지만, 이 이미지에서는 "위험
 * 신호를 감지한 경고" 느낌으로 눈을 크게 뜨고 진지하게 굳은 표정으로 과장한다
 * (금박사의 순수한 "놀람"과는 결이 다른, 분석가가 위험을 포착한 긴장감).
 */

const OWL_CHARACTER_NOTE =
  "Include the same 3D-rendered owl mascot character from the attached reference image exactly " +
  "as shown — same owl body proportions, vest, tie, sunglasses pushed up on the forehead. Do not " +
  "change its core design, but EXAGGERATE its expression far beyond the reference image: eyes " +
  "wide open and sharply focused, one eyebrow raised high in alarm, mouth slightly open as if " +
  "about to deliver urgent news, both wings/hands gesturing outward in a \"look at this\" alert " +
  "pose. Dramatic, intense, attention-grabbing — think breaking-news anchor spotting a red flag, " +
  "not the usual calm analytical look.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 7,
  character: "owl",
  title: "한국예탁결제원 집계, 이달 3배 ETF에 1.1조 다시 몰린 이유",
  slides: [
    {
      id: "cover_thumb",
      file: "00_owl_ep7_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover image for a Korean finance Shorts video, ` +
        `designed to grab attention and feel urgent/intriguing even when shrunk down to a tiny ` +
        `square grid thumbnail. ${OWL_CHARACTER_NOTE}\n\n` +
        `CRITICAL SAFE-ZONE LAYOUT (this image will be cropped differently by different apps — a ` +
        `tall rectangle on one platform, a centered square on another): every essential element ` +
        `(both text lines AND the character's full head/face) MUST fit within the vertical center ` +
        `40-50% band of the frame (roughly from 30% to 75% of the total height). Nothing essential ` +
        `may be placed in the top 25% or bottom 20% of the frame — those zones are decorative ` +
        `background only and may be cropped away safely.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic office ` +
        `scene. Use a dramatic gradient from deep navy (#0A1633) at the top to a warning amber-` +
        `orange (#E28A2E) glow radiating from behind the character, with a few large soft-focus ` +
        `finance-warning icons faintly visible in the decorative top/bottom zones only (a rocketing ` +
        `up-arrow chart, a caution triangle), kept abstract and dark so text stays highly legible ` +
        `on top. High energy, urgent mood.\n\n` +
        `Layout inside the safe-zone band: at the top of the band, two short punchy bold text ` +
        `lines, white with a thick dark navy (#0A1633) outline and a subtle amber glow, exactly as ` +
        `written, no typos:\n"1.1조가\n다시 몰렸다"\n` +
        `Directly below the text within the same safe-zone band, the character's head and upper ` +
        `body large enough that its exaggerated alert expression (as described above) is clearly ` +
        `visible even at small thumbnail size — the character's eyes must sit near the vertical ` +
        `center of the whole frame, not near the bottom edge.\n\n` +
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
