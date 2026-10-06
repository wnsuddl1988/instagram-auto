/**
 * 부엉박사 표시 20편(파일 21, 시중은행 정보 유출·내 정보 지키는 법) 릴스 커버 = 유튜브 썸네일 = 인스타 스토리 통합 스펙.
 * (Owner 2026-10-01: 스토리 이미지는 따로 만들지 않고 커버로 통일, 규칙 7. 표시 19편 `_owl-cover-ep20-spec.mjs` 방식 승계)
 *
 * 글자는 모델이 아니라 합성기(`run-cover-headline-overlay-once.mjs`)가 얹는다 → 글자·배지 없는 배경+캐릭터만 생성.
 * 윗 50%는 비운다(캐릭터 귀깃 끝 ≈50%·눈 ≈62%). "경제번역소" 배지는 제외(통합 커버 제약).
 * 색: 직전 표시 19편(먹색 남청→꿀빛 골드)·18편(자두색→핑크)과 겹치지 않게 짙은 인디고 바이올렛(#1B1146) → 연한 라일락 실버(#E8DFFF) 글로우.
 *     경고색(빨강)·은행 로고·실제 은행명·글자·숫자 없음.
 * 훅 감정: "은행 앱 쓰는 사람, 내 정보 괜찮을까?" — 걱정스럽게 두 눈썹을 안쪽으로 모으고 눈을 크게 뜬 표정, 날개 하나를 가슴에 얹음.
 */

const OWL_CHARACTER_NOTE =
  "Include the same 3D-rendered owl mascot character from the attached reference image exactly " +
  "as shown — same owl body proportions, charcoal vest, white shirt, burgundy tie, sunglasses " +
  "pushed up on the forehead. Do not change its core design, but EXAGGERATE its expression far " +
  "beyond the reference image: both eyebrows pulled up and inward in worry, eyes wide open and " +
  "glancing to the side, beak slightly open in an anxious \"wait, is my personal information safe?\" " +
  "look, one wing pressed to its chest in a protective, worried pose. Dramatic, attention-grabbing — " +
  "think a news anchor who just heard alarming news, not the usual calm analytical look. " +
  "The wings hold no object and no card.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 21,
  character: "owl",
  title: "은행 정보 유출, 내 정보 지키는 법",
  slides: [
    {
      id: "cover_thumb",
      file: "00_owl_ep21_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover background image for a Korean finance ` +
        `Shorts video, designed to feel intriguing even when shrunk down to a tiny square grid ` +
        `thumbnail. ${OWL_CHARACTER_NOTE}\n\n` +
        `CRITICAL LAYOUT (a headline will be added later by software, so leave room for it): the ` +
        `upper 50% of the frame must contain NO character and NO text — only the decorative ` +
        `background (glow, flowing light ribbons, a few small shapes). The character's ear tufts start ` +
        `at about 50% of the frame height, its eyes and beak sit near 62% of the frame height, and ` +
        `its body continues down to the bottom edge (feet may be cropped). The character is centered ` +
        `horizontally and its full width stays within the central 70% of the frame (nothing closer ` +
        `than 15% to the left or right edge). Do NOT write any headline, title, caption, numbers, ` +
        `badge, logo or any other text anywhere in the image — there must be NO text at all; the ` +
        `headline area is intentionally left empty.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic scene. ` +
        `Use a dramatic gradient from deep indigo-violet (#1B1146) at the top to a pale lilac-silver ` +
        `(#E8DFFF) glow radiating from behind the character at the bottom (cool violet and silver tones, ` +
        `absolutely no red, orange, pink or yellow tint). Behind the character, a large smooth plain ` +
        `silver-and-gold shield shape with a simple padlock silhouette in the middle (NO keyhole text, NO ` +
        `letters, NO marks), glowing softly, with a few thin cracks of light on one edge, and a few small plain ` +
        `silver discs and tiny plain square data cubes drifting away from it (abstract, NO logos, NO text, NO ` +
        `numbers). Kept abstract and dark enough at the top that white text placed over the upper half stays ` +
        `highly legible. Worried, "is my information safe?" mood, high energy. No buildings, landmarks, flags, ` +
        `globes, phones with screens or real bank marks.\n\n` +
        `Style: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft 3D ` +
        `animated-film style matching the character.`,
    },
  ],
});
