/**
 * 황소특보(가칭) 캐릭터 디자인 7차 — v6에서 "황소 느낌이 안 난다"는
 * Owner 피드백 반영.
 *
 * v6(bull_final_v6)은 몸통이 지나치게 둥글둥글해서 돼지/곰처럼 보이고
 * 황소 특유의 정체성(굵은 목, 다부진 어깨, 존재감 있는 뿔, 넓적한 소
 * 주둥이)이 약했다. 귀여운 SD 비율과 밝은 표정, 안경, 서재+도심야경
 * 배경은 그대로 유지하되, 아래 요소로 "이건 확실히 황소다"를 살린다:
 *   - 뿔을 더 크고 두껍고 존재감 있게
 *   - 목~어깨를 다부지게(살짝 근육감 있는 실루엣, 무한정 둥글기만 한
 *     몸통 지양)
 *   - 소 특유의 넓적하고 납작한 주둥이(muzzle) 강조
 *   - 목 아래 처진 턱살(dewlap) 살짝 추가 — 소의 상징적 디테일
 */

const OWL_PROPORTION_NOTE =
  "Use a cute chibi/super-deformed mascot proportion: the head is large relative to the body, but " +
  "the body should read clearly as a sturdy young bull, not a generic round blob — keep the arms " +
  "and legs short and stubby for cuteness, but give the shoulders and neck a slightly broad, sturdy " +
  "build (like a small but strong bull calf), not a perfectly spherical soft bear/pig shape.";

const BULL_IDENTITY_NOTE =
  "CRITICAL bull identity features (this must clearly read as a BULL, not a generic round animal): " +
  "large, thick, prominent curved horns (bigger and more noticeable than a token accessory), a " +
  "distinctly broad and flat bull muzzle/snout (wide flat nose area, not a small round pig-like " +
  "nose), and a small soft dewlap (the loose skin fold under the chin/neck that cattle have) subtly " +
  "visible. These features should be unmistakable at a glance.";

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
  specVersion: "bull_character_design_spec_v7",
  episode: 0,
  character: "bull_design_candidates_v7",
  title: "황소특보 캐릭터 디자인 7차 (황소 정체성 강화)",
  slides: [
    {
      id: "bull_final_v7",
      file: "bull_final_v7.png",
      withCharacter: false,
      prompt:
        `Create a brand-new original vertical 1080x1920px character design image for a Korean ` +
        `finance Shorts mascot, generated entirely from the text description below (no existing ` +
        `image reference).\n\n` +
        `A cute chibi mascot character shaped like a young bull (cow), with a warm golden metallic ` +
        `body (rich gold color), small rounded ears. ${NO_NOSE_RING_NOTE}\n\n` +
        `${OWL_PROPORTION_NOTE}\n\n` +
        `${BULL_IDENTITY_NOTE}\n\n` +
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
