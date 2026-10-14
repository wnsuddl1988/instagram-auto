/**
 * 부엉박사 파일 ep30(통합 53편) 릴스 커버 = 유튜브 썸네일 = 인스타 스토리 통합 스펙(규칙 7).
 * ★ 헤드라인은 영상 제목을 줄이지 않고 그대로 얹는다(규칙 30): "양육비 선지급, 소득 기준이 사라져요" — 줄바꿈: 양육비 선지급, / 소득 기준이 / 사라져요.
 * 글자는 합성기(run-cover-headline-overlay-once.mjs)가 얹으므로 글자·배지 없는 배경+캐릭터만 생성. 윗 55%를 비운다.
 * 생성: scripts/build-owl-batch-1015.mjs (연출 정의 _owl-batch-1015-defs.mjs OWL_BATCH_1015_COVERS).
 */

export const CARDNEWS_SPEC = Object.freeze({
  "specVersion": "owl_cover_thumbnail_spec_v1",
  "episode": 30,
  "character": "owl",
  "title": "양육비 선지급, 소득 기준이 사라져요",
  "slides": [
    {
      "id": "cover_thumb",
      "file": "00_owl_ep30_cover_thumb.png",
      "withCharacter": true,
      "prompt": "Create a vertical 1080x1920px thumbnail/cover background image for a Korean finance Shorts video, designed to feel intriguing even when shrunk down to a tiny square grid thumbnail. Include the same 3D-rendered owl mascot character from the attached reference image exactly as shown — same owl body proportions, charcoal vest, white shirt, burgundy tie, sunglasses pushed up on the forehead. Do not change its core design, but EXAGGERATE its expression far beyond the reference image: relieved and warmly hopeful, eyebrows raised high, a small open-beak \"you can apply now!\" look, one wing opened wide in a welcoming gesture and the other wing resting on its hip. Dramatic, attention-grabbing — think viral thumbnail energy, not the usual calm analytical look. The wings hold no object and no card.\n\nCRITICAL LAYOUT (a 3-line headline will be added later by software, so leave a LOT of room for it): the upper 55% of the frame must contain NO character and NO text — only the decorative background (glow, light ribbons, a few small shapes). The character's ear tufts start at about 55% of the frame height, its eyes and mouth sit near 65% of the frame height, and its body continues down to the bottom edge (legs and feet may be cropped). The character is centered horizontally and its full width stays within the central 70% of the frame (nothing closer than 15% to the left or right edge). Do NOT write any headline, title, caption, numbers, badge, logo or any other text anywhere in the image — there must be NO text at all; the headline area is intentionally left empty.\n\nBackground: a bold, vivid, high-contrast background — NOT a blurry photographic scene. Use a dramatic gradient from deep indigo-violet (#1A0B3D) at the top to soft warm peach glow (#FFB38A) radiating from behind the character at the bottom (no green, cyan or yellow tint). Behind the character: a few plain glowing heart sculptures and a plain round cradle-shaped sculpture behind the character (abstract: NO digits, NO letters, NO labels, NO logos), placed mostly in the lower half so the upper half stays empty, and a few small plain glowing light streaks sweeping across the lower background. A few small plain discs float in the lower background, kept abstract and dark enough at the top that white text placed over the upper half stays highly legible. High energy. No buildings, landmarks, flags, globes, cars, charts, real products or real organization marks.\n\nStyle: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft 3D animated-film style matching the character."
    }
  ]
});
