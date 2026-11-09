/**
 * 황소특보 파일 ep25(통합 51편) 릴스 커버 = 유튜브 썸네일 = 인스타 스토리 통합 스펙(규칙 7).
 * ★ 헤드라인은 영상 제목을 줄이지 않고 그대로 얹는다(규칙 30): "이번 달 금리 발표 3개, 결과보다 말투를 읽어라" — 140px 이상을 지키려고 4줄로 나눔(문구 그대로 줄바꿈만).
 * 글자는 합성기(`run-cover-headline-overlay-once.mjs`)가 얹으므로 글자·배지 없는 배경+캐릭터만 생성. 윗 62%를 비운다.
 * 표정: 10월 금리 발표 3개 — 한 손을 귀에 대고 "말투를 읽는" 집중 청취 표정.
 * 색: deep brown-black(#1F1208) → vivid magenta-pink(#FF4FA3) 글로우 — 직전 편들(황소 24 틸블랙→옐로, 23 흑연보라→시안, 부엉 25 틸→코랄 등)과 겹치지 않게.
 */

const CHARACTER_NOTE = "Include the same 3D-rendered gold bull mascot character from the attached reference image exactly as shown — same extreme SD-proportion golden bull with glasses, white shirt, burgundy tie, navy pants, no jacket, no logos or marks anywhere on the outfit. Do not change its core design (color, glasses, outfit), but EXAGGERATE its facial expression far beyond the reference image: one eyebrow raised very high and the other lowered, eyes narrowed in a sharp listening look, one hand cupped behind its ear as if listening carefully to the tone of voice and the other hand on its hip (nothing in the hands), and the head tilted slightly. This is a dramatic, attention-grabbing expression — think viral thumbnail energy, not the usual calm smile.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 25,
  character: "bull",
  title: "이번 달 금리 발표 3개, 결과보다 말투를 읽어라",
  slides: [
    {
      id: "cover_thumb",
      file: "00_bull_ep25_cover_thumb.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover background image for a Korean finance ` +
        `Shorts video, designed to feel intriguing even when shrunk down to a tiny square grid ` +
        `thumbnail. ${CHARACTER_NOTE}\n\n` +
        `CRITICAL LAYOUT (a four-line headline will be added later by software, so leave a LOT of room for it): the ` +
        `upper 62% of the frame must contain NO character and NO text — only the decorative ` +
        `background (glow, light ribbons, a few small shapes). The character's horn tips ` +
        `start at about 62% of the frame height, its eyes and mouth sit near 72% of the frame ` +
        `height, and its body continues down to the bottom edge (legs and feet may be cropped). ` +
        `The character is centered horizontally and its full width stays within the central 70% of ` +
        `the frame (nothing closer than 15% to the left or right edge). Do NOT write any headline, title, caption, numbers, badge, logo or any other text anywhere in the image — there must be NO text at all; the headline area is intentionally left empty.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic scene. ` +
        `Use a dramatic gradient from deep brown-black (#1F1208) at the top to a vivid magenta-pink ` +
        `(#FF4FA3) glow radiating from behind the character at the bottom (no green, yellow or blue tint). ` +
        `Behind the character: three large smooth plain golden bells of different sizes hanging behind the character (abstract: NO tick marks, NO digits, NO letters, NO labels), placed mostly in the lower half so the upper half stays empty, ` +
        `and a few small plain glowing light streaks sweeping across the lower background. A few small plain cream discs float ` +
        `in the lower background, kept abstract and dark enough at the top that white text placed over the upper half stays highly legible. ` +
        `High energy. No buildings, landmarks, flags, globes, cars, charts, real products or real organization marks.\n\n` +
        `Style: dramatic lighting, punchy and intriguing, not calm or corporate, cute soft 3D ` +
        `animated-film style matching the character.`,
    },
  ],
});
