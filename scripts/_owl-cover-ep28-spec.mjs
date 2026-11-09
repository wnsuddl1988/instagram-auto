/**
 * 부엉박사 파일 ep28(통합 52편) 릴스 커버 = 유튜브 썸네일 = 인스타 스토리 통합 스펙(규칙 7).
 * ★ 헤드라인은 영상 제목을 줄이지 않고 그대로 얹는다(규칙 30): "잠자는 돈 15.7조, 내 몫 찾는 법" — 140px 이상을 지키려고 4줄로 나눔(문구 그대로 줄바꿈만).
 * 글자는 합성기(`run-cover-headline-overlay-once.mjs`)가 얹으므로 글자·배지 없는 배경+캐릭터만 생성. 윗 62%를 비운다.
 * 표정: 잠자는 금융자산 15.7조 — 졸린 눈과 놀란 눈이 섞인 "내 돈이 자고 있다?!" 표정.
 * 색: deep midnight blue-black(#070B1F) → cool ice-blue moonlight(#BFE9FF) 글로우 — 직전 편들(황소 24 틸블랙→옐로, 23 흑연보라→시안, 부엉 25 틸→코랄 등)과 겹치지 않게.
 */

const CHARACTER_NOTE = "Include the same 3D-rendered owl mascot character from the attached reference image exactly as shown — same owl body proportions, charcoal vest, white shirt, burgundy tie, sunglasses pushed up on the forehead. Do not change its core design, but EXAGGERATE its expression far beyond the reference image: one eye half closed sleepily and the other eye wide open in sudden surprise, one eyebrow raised very high, beak slightly open in a \"wait, there is money asleep?!\" look, one wing pointing down toward the floor as if revealing something hidden and the other wing resting on its hip. Dramatic, attention-grabbing — think viral thumbnail energy, not the usual calm analytical look. The wings hold no object and no card.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 28,
  character: "owl",
  title: "잠자는 돈 15.7조, 내 몫 찾는 법",
  slides: [
    {
      id: "cover_thumb",
      file: "00_owl_ep28_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover background image for a Korean finance ` +
        `Shorts video, designed to feel intriguing even when shrunk down to a tiny square grid ` +
        `thumbnail. ${CHARACTER_NOTE}\n\n` +
        `CRITICAL LAYOUT (a four-line headline will be added later by software, so leave a LOT of room for it): the ` +
        `upper 62% of the frame must contain NO character and NO text — only the decorative ` +
        `background (glow, light ribbons, a few small shapes). The character's ear tufts ` +
        `start at about 62% of the frame height, its eyes and mouth sit near 72% of the frame ` +
        `height, and its body continues down to the bottom edge (legs and feet may be cropped). ` +
        `The character is centered horizontally and its full width stays within the central 70% of ` +
        `the frame (nothing closer than 15% to the left or right edge). Do NOT write any headline, title, caption, numbers, badge, logo or any other text anywhere in the image — there must be NO text at all; the headline area is intentionally left empty.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic scene. ` +
        `Use a dramatic gradient from deep midnight blue-black (#070B1F) at the top to a cool ice-blue moonlight ` +
        `(#BFE9FF) glow radiating from behind the character at the bottom (no red, orange, yellow or pink tint). ` +
        `Behind the character: a large plain glowing crescent moon sculpture and a few plain soft pillows and plain closed drawers floating behind the character (abstract: NO digits, NO letters, NO labels, NO coins with symbols), placed mostly in the lower half so the upper half stays empty, ` +
        `and a few small plain glowing light streaks sweeping across the lower background. A few small plain cream discs float ` +
        `in the lower background, kept abstract and dark enough at the top that white text placed over the upper half stays highly legible. ` +
        `High energy. No buildings, landmarks, flags, globes, cars, charts, real products or real organization marks.\n\n` +
        `Style: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft 3D ` +
        `animated-film style matching the character.`,
    },
  ],
});
