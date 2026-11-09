/**
 * 부엉박사 표시 19편(파일 20, 광고 최고금리 vs 내가 받는 금리 — 예금) 릴스 커버 = 유튜브 썸네일 = 인스타 스토리 통합 스펙.
 * (Owner 2026-10-01: 스토리 이미지는 따로 만들지 않고 커버로 통일, 규칙 7. 18편 `_owl-cover-ep19-spec.mjs` 방식 승계)
 *
 * 글자는 모델이 아니라 합성기(`run-cover-headline-overlay-once.mjs`)가 얹는다 → 글자·배지 없는 배경+캐릭터만 생성.
 * 윗 50%는 비운다(캐릭터 귀깃 끝 ≈50%·눈 ≈62%). "경제번역소" 배지는 제외(통합 커버 제약).
 * 색: 직전 18편(자두색→핑크·피치)과 겹치지 않게 짙은 먹색 남청(#0B1B33) → 따뜻한 꿀빛 골드(#FBBF24~#FEF3C7) 글로우. 경고색(빨강)·로고·랜드마크·글자·숫자 없음.
 * 훅 감정: "광고하는 4%가 전부 내 금리라고? 글쎄" — 의심하듯 한쪽 눈썹을 높이 올리고 눈을 가늘게 뜬 표정, 날개 하나를 턱 아래에.
 * 헤드라인(합성기, 줄당 6자 이하): "광고 4%" / "내 금리는?".
 */

const OWL_CHARACTER_NOTE =
  "Include the same 3D-rendered owl mascot character from the attached reference image exactly " +
  "as shown — same owl body proportions, charcoal vest, white shirt, burgundy tie, sunglasses " +
  "pushed up on the forehead. Do not change its core design, but EXAGGERATE its expression far " +
  "beyond the reference image: one eyebrow raised very high and the other lowered, eyes narrowed " +
  "in suspicion and looking sideways, beak twisted into a skeptical \"hmm, is that 4% really " +
  "mine?\" smirk, one wing resting under the beak in a doubtful thinking pose. Dramatic, " +
  "attention-grabbing — think a sharp anchor squinting at a too-good-to-be-true offer, not the " +
  "usual calm analytical look. The wings hold no object and no card.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 20,
  character: "owl",
  title: "광고 4% 예금, 기본금리부터 확인하세요",
  slides: [
    {
      id: "cover_thumb",
      file: "00_owl_ep20_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover background image for a Korean finance ` +
        `Shorts video, designed to feel intriguing even when shrunk down to a tiny square grid ` +
        `thumbnail. ${OWL_CHARACTER_NOTE}\n\n` +
        `CRITICAL LAYOUT (a headline will be added later by software, so leave room for it): the ` +
        `upper 50% of the frame must contain NO character and NO text — only the decorative ` +
        `background (glow, flowing light ribbons, scattered coins). The character's ear tufts start ` +
        `at about 50% of the frame height, its eyes and beak sit near 62% of the frame height, and ` +
        `its body continues down to the bottom edge (feet may be cropped). The character is centered ` +
        `horizontally and its full width stays within the central 70% of the frame (nothing closer ` +
        `than 15% to the left or right edge). Do NOT write any headline, title, caption, numbers, ` +
        `badge, logo or any other text anywhere in the image — there must be NO text at all; the ` +
        `headline area is intentionally left empty.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic scene. ` +
        `Use a dramatic gradient from deep ink-navy (#0B1B33) at the top to a warm honey-gold and ` +
        `pale cream (#FBBF24 to #FEF3C7) glow radiating from behind the character, with soft white ` +
        `and pale-gold flowing ribbons of light curving from left to right, a few large soft-focus ` +
        `plain gold coins (one coin sliced in two clean halves) and small rounded piggy-bank-like ` +
        `shapes floating (no symbols, no text, no numbers, no currency marks), kept abstract and dark ` +
        `enough at the top that white text placed over the upper half stays highly legible. ` +
        `Doubtful, "is that really mine?" mood, high energy. Do not use red or warning colors. No ` +
        `buildings, landmarks, flags or globes.\n\n` +
        `Style: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft 3D ` +
        `animated-film style matching the character.`,
    },
  ],
});
