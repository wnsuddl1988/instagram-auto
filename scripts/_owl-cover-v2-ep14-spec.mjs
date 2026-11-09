/**
 * 부엉박사 14편(v2, 국민연금 보험료 2027년 10%) 유튜브 썸네일 + 릴스 커버.
 * v1 커버("27년 만에, 내 월급이 줄어든다")는 시점이 지난 표현이라 새로 만든다.
 */

const OWL_CHARACTER_NOTE =
  "Include the same 3D-rendered owl mascot character from the attached reference image exactly " +
  "as shown — same owl body proportions, vest, tie, sunglasses pushed up on the forehead. Do not " +
  "change its core design, but EXAGGERATE its expression far beyond the reference image: eyes " +
  "wide in alarm, eyebrows shot up, beak open in a \"again?!\" shape, one wing pointing at the " +
  "viewer. Dramatic, attention-grabbing — not the usual calm analytical look.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 14,
  character: "owl",
  title: "국민연금 보험료, 올해 오른 데 이어 내년 1월에 또 오른다",
  slides: [
    {
      id: "cover_thumb",
      file: "00_owl_v2_ep14_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover image for a Korean finance Shorts video, ` +
        `designed to grab attention even when shrunk down to a tiny square grid thumbnail. ` +
        `${OWL_CHARACTER_NOTE}\n\n` +
        `CRITICAL SAFE-ZONE LAYOUT (this image will be cropped differently by different apps — a ` +
        `tall rectangle on one platform, a centered square on another): every essential element ` +
        `(both text lines AND the character's full head/face) MUST fit within the vertical center ` +
        `band of the frame, roughly from 30% to 75% of the total height. Nothing essential may be ` +
        `placed in the top 25% or bottom 20% of the frame — decorative background only.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic office ` +
        `scene. A dramatic gradient from deep navy (#0A1633) at the top to a hot orange-red glow ` +
        `(#E2572E blending into #FFD54A) radiating from behind the character, with a few large ` +
        `soft-focus upward red arrows and coin icons faintly visible in the decorative top/bottom ` +
        `zones only, kept abstract and dark so the text stays highly legible.\n\n` +
        `Layout inside the safe-zone band: at the top of the band, two short punchy bold text ` +
        `lines, white with a thick dark navy (#0A1633) outline; make "또" bright yellow (#FFD54A) ` +
        `with the same outline. Exactly as written, no typos:\n"국민연금,\n내년에 또 오른다"\n` +
        `Directly below the text within the same band, the character's head and upper body large ` +
        `enough that its exaggerated alarmed expression is clearly visible at small thumbnail size ` +
        `— the character's eyes must sit near the vertical center of the whole frame.\n\n` +
        `Top-left corner (decorative zone, may be cropped — acceptable): a small rounded yellow ` +
        `badge (#FFD54A) with bold dark navy (#14213D) Korean text "경제번역소", about 14% of image ` +
        `width.\n\n` +
        `Do not add any other text, props, or captions. Style: bold sans-serif Korean font (Black ` +
        `Han Sans style), maximum contrast, dramatic lighting, punchy and urgent, not calm or ` +
        `corporate.`,
    },
  ],
});
