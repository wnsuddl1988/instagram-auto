/**
 * 황소특보(가칭) 캐릭터 디자인 6차 — v4의 B(bull_owl_proportion_desk_pointing)를
 * 베이스로 딱 2가지만 바꾼다.
 *
 * Owner 확정(2026-09-23): "B의 귀여움은 유지하고, 안경이랑 배경만 바꿔줘."
 * 즉 v5에서 시도했던 "날카로운 눈빛/만년필/차분한 포즈"는 전부 되돌리고,
 * B의 밝은 표정·포인팅 포즈·통통한 비율은 그대로 유지한다. 바꾸는 건 딱
 * 2가지:
 *   1. 선글라스(이마에 걸침) → 안경(착용)
 *   2. 밝은 트레이딩플로어 배경 → 서재+도심야경 배경(고급스러운 톤)
 */

const OWL_PROPORTION_NOTE =
  "CRITICAL proportions — use an extreme chibi/super-deformed mascot proportion: the head is HUGE " +
  "relative to the body (roughly 60-65% of the total height), the body is short, round, and plump " +
  "like a beanbag, and the arms and legs are short and stubby. Do NOT draw this like a person in a " +
  "suit — draw it like an adorable round toy creature. The overall silhouette should be egg-shaped / " +
  "rounded, not tall and slim.";

const BRIGHT_CHEERFUL_EXPRESSION_NOTE =
  "The eyes are LARGE, round, and glossy with bright highlight dots, with a warm, bright, cheerful " +
  "expression — a big open friendly grin showing excitement, like a mascot happily reporting great " +
  "news. Eyebrows can be slightly angled for a touch of confidence, but the overall feeling stays " +
  "playful, energetic, and adorable, not stern.";

const GLASSES_NOTE =
  "Wearing a pair of stylish rectangular wire-rim glasses ACTUALLY WORN over the eyes (not pushed up " +
  "on the forehead, not sunglasses) — the glasses look sharp and smart while keeping the big cute " +
  "eyes clearly visible behind the lenses.";

const NO_NOSE_RING_NOTE =
  "Do NOT include a nose ring or any nose piercing — keep the snout/muzzle clean and simple.";

const VEST_ONLY_NOTE =
  "Clothing: only a small fitted dark navy vest (waistcoat) over the chest, with NO dress shirt, NO " +
  "tie, NO pants, and NO shoes underneath — the golden body, arms, and legs stay bare and visible " +
  "below the vest, like a simple minimal-clothing mascot design.";

const STUDY_SKYLINE_BACKGROUND_NOTE =
  "Background: an elegant private study/office blending warm wood-paneled bookshelves on one side " +
  "with a large window showing a glittering city skyline at dusk on the other side — warm golden " +
  "lamp light mixed with the cool blue-purple glow of city lights and a sunset, a subtle world globe " +
  "or antique map visible, a softly blurred stock chart screen faintly glowing nearby. Rich, " +
  "polished, upscale atmosphere.";

const FRAME_COMPOSITION_NOTE =
  "Frame composition: the character's full body should occupy only about 50-55% of the vertical " +
  "frame height, positioned so there is generous background visible above, beside, and below — a " +
  "medium shot that shows the character stepped back within the scene, NOT a tight close-up that " +
  "fills the frame.";

const GLOSSY_TOY_TEXTURE_NOTE =
  "Rendering style: soft, glossy, rounded 3D mascot render (Pixar/DreamWorks toy quality) with a " +
  "smooth metallic-gold sheen on the body, polished and cute like a premium animated mascot " +
  "character.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "bull_character_design_spec_v6",
  episode: 0,
  character: "bull_design_candidates_v6",
  title: "황소특보 캐릭터 디자인 6차 (B 기반, 안경+서재배경만 변경)",
  slides: [
    {
      id: "bull_final_v6",
      file: "bull_final_v6.png",
      withCharacter: false,
      prompt:
        `Create a brand-new original vertical 1080x1920px character design image for a Korean ` +
        `finance Shorts mascot, generated entirely from the text description below (no existing ` +
        `image reference).\n\n` +
        `A cute chibi mascot character shaped like a young bull (cow), with a warm golden metallic ` +
        `body (rich gold color), small golden horns, small rounded ears. ${NO_NOSE_RING_NOTE}\n\n` +
        `${OWL_PROPORTION_NOTE}\n\n` +
        `${BRIGHT_CHEERFUL_EXPRESSION_NOTE}\n\n` +
        `${GLASSES_NOTE}\n\n` +
        `${VEST_ONLY_NOTE}\n\n` +
        `${STUDY_SKYLINE_BACKGROUND_NOTE}\n\n` +
        `${FRAME_COMPOSITION_NOTE}\n\n` +
        `Pose: one short arm pointing confidently forward/upward like presenting breaking news, the ` +
        `other arm resting on the hip, a bright cheerful grin, dynamic and energetic but still cute ` +
        `and rounded — like a mascot excitedly reporting hot market news.\n\n` +
        `${GLOSSY_TOY_TEXTURE_NOTE} Sharp focus on the character, no text overlays.`,
    },
  ],
});
