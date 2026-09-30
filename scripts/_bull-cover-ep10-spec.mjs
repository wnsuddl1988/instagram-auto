/**
 * 황소특보 10편(11월 2일 저PBR 기업 공표 × 10월 22일 공시 마감) 유튜브 썸네일 +
 * 인스타 릴스 커버 공용 이미지 스펙.
 *
 * 1~9편 원칙 계승: 캐릭터 과장 표정 + 선명한 그라디언트 배경(흐릿한 사진톤 금지) +
 * 궁금증 훅 문구 + 세로 중앙 안전영역 안에 텍스트·캐릭터 얼굴 배치(플랫폼별 크롭 대응).
 *
 * 10편은 "내 종목에 저PBR 태그가 붙을까?"가 훅. 7편(빨강)·8편(주황)·9편(남색/청록·보라)과
 * 겹치지 않게 배경은 짙은 에메랄드 → 선명한 민트, 골드 글로우. 저PBR을 나쁜 것으로 몰지 않도록
 * 경고색(빨강)은 쓰지 않고 호기심 톤으로 간다. 종목명·로고 없음.
 */

const BULL_CHARACTER_NOTE =
  "Include the same 3D-rendered gold bull mascot character from the attached reference image " +
  "exactly as shown — same extreme SD-proportion golden bull with glasses, white shirt, burgundy " +
  "tie, navy pants, no jacket, no logos or marks anywhere on the outfit. Do not change its core " +
  "design (color, glasses, outfit), but EXAGGERATE its facial expression far beyond the reference " +
  "image: both eyebrows raised very high, eyes wide open and round with surprise, mouth open in a " +
  "\"huh?! is my stock on the list?\" expression, both hands pressed to its cheeks. This is a " +
  "dramatic, attention-grabbing expression — think viral thumbnail energy, not the usual calm smile.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 10,
  character: "bull",
  title: "11월 2일, 저PBR 명단이 내 증권앱에 뜬다",
  slides: [
    {
      id: "cover_thumb",
      file: "00_bull_ep10_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover image for a Korean finance Shorts video, ` +
        `designed to grab attention and feel intriguing even when shrunk down to a tiny ` +
        `square grid thumbnail (this is NOT a calm carousel slide — it needs punch at a glance). ` +
        `${BULL_CHARACTER_NOTE}\n\n` +
        `CRITICAL SAFE-ZONE LAYOUT (this image will be cropped differently by different apps — a ` +
        `tall rectangle on one platform, a centered square on another): every essential element ` +
        `(both text lines AND the character's full head/face) MUST fit within the vertical center ` +
        `40-50% band of the frame (roughly from 30% to 75% of the total height). Nothing essential ` +
        `may be placed in the top 25% or bottom 20% of the frame — those zones are decorative ` +
        `background only and may be cropped away safely.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic scene. ` +
        `Use a dramatic gradient from deep emerald (#04342C) at the top to a vivid bright mint ` +
        `(#10B981 to #6EE7B7) glow radiating from behind the character, with warm gold (#FBBF24) ` +
        `light rays and a few large soft-focus glowing round price-tag shapes (no text on them) ` +
        `faintly visible in the decorative top/bottom zones only, kept abstract and dark enough so ` +
        `text stays highly legible on top. Curious, "wait, is mine on it?" mood, high energy. Do ` +
        `not use red or warning colors.\n\n` +
        `Layout inside the safe-zone band: at the top of the band, two short punchy bold text ` +
        `lines, white with a thick dark emerald (#04342C) outline and a subtle gold glow, exactly ` +
        `as written, no typos:\n"내 종목에\n저PBR 태그가?"\n` +
        `Directly below the text within the same safe-zone band, the character's head and ` +
        `shoulders large enough that its exaggerated surprised expression (as described above) is ` +
        `clearly visible even at small thumbnail size — the character's eyes and mouth must ` +
        `sit near the vertical center of the whole frame, not near the bottom edge.\n\n` +
        `Top-left corner (inside the decorative zone, may be cropped on some platforms — ` +
        `acceptable): a small rounded gold badge (#F5A623) with bold dark navy (#14213D) Korean ` +
        `text "경제번역소", about 14% of image width.\n\n` +
        `Do not add any other text, props, or captions besides what is specified above — keep the ` +
        `composition bold, high-contrast, and instantly readable, like a viral short-form video ` +
        `thumbnail designed to stop someone mid-scroll with a curious question.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), maximum contrast, dramatic ` +
        `lighting, punchy and intriguing, not calm or corporate.`,
    },
  ],
});
