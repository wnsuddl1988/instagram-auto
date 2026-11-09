/**
 * 황소특보(가칭) 캐릭터 디자인 5차 — 최종 확정 시도.
 *
 * 베이스: v4의 bull_owl_proportion_desk_pointing(부엉박사 SD 비율, 귀여운
 * 얼굴형) — Owner가 "B가 더 나은 것 같다"고 확정.
 *
 * 거기에 참조 이미지(진지한 정장 버전, v2 계열)의 아래 요소를 섞는다
 * (Owner 2026-09-23 확정):
 *   - 선글라스를 이마에 걸치는 대신 일반 안경을 쓴 모습으로 변경
 *   - 표정: 단순히 웃는 게 아니라 날카롭게 응시하는 확신감 있는 눈빛
 *   - 배경 톤: 서재 + 도심 야경, 고급스럽고 반짝이는 톤
 *   - 소품: 만년필 등 관록 요소를 살짝 유지
 *
 * 프레임 구도 원칙(Owner 재확인 요청, 기존 [[feedback_thumbnail_cover_style_per_episode]]
 * 원칙과 동일): 캐릭터가 화면의 50~55%만 차지하도록 살짝 뒤로 물러난 구도,
 * 배경이 넓고 여유 있게 보여야 함 — 화면을 가득 채우는 클로즈업 금지.
 */

const OWL_PROPORTION_NOTE =
  "CRITICAL proportions — use an extreme chibi/super-deformed mascot proportion: the " +
  "head is HUGE relative to the body (roughly 60-65% of the total height), the body is short, round, " +
  "and plump like a beanbag, and the arms and legs are short and stubby. Do NOT draw this like a " +
  "person in a suit — draw it like an adorable round toy creature. The overall silhouette should be " +
  "egg-shaped / rounded, not tall and slim.";

const SHARP_CONFIDENT_EYES_NOTE =
  "The eyes must be LARGE and round (matching the cute chibi proportions), but the expression is " +
  "sharp and confident rather than a simple happy smile — narrowed slightly with a focused, knowing " +
  "gaze directly at the viewer, like someone who just spotted a great opportunity. The mouth has a " +
  "subtle closed-mouth smirk, not a big open grin. Eyebrows angled slightly for a sharp, intelligent " +
  "look. Overall: cute proportions, but a confident and perceptive expression — not goofy or overly " +
  "silly.";

const GLASSES_NOTE =
  "Wearing a pair of stylish rectangular wire-rim glasses ACTUALLY WORN over the eyes (not pushed up " +
  "on the forehead, not sunglasses) — the glasses should look sharp and intelligent, like a " +
  "distinguished analyst.";

const NO_NOSE_RING_NOTE =
  "Do NOT include a nose ring or any nose piercing — keep the snout/muzzle clean and simple.";

const VEST_ONLY_NOTE =
  "Clothing: only a small fitted dark navy vest (waistcoat) over the chest, with NO dress shirt, NO " +
  "tie, NO pants, and NO shoes underneath — the golden body, arms, and legs stay bare and visible " +
  "below the vest, like a simple minimal-clothing mascot design.";

const PEN_PROP_NOTE =
  "Holding a small classic fountain pen in one hand, held thoughtfully near the chest (not writing, " +
  "just held as a subtle mark of old-money wisdom and expertise) — this is the ONLY prop, kept small " +
  "and not the visual focus.";

const STUDY_SKYLINE_BACKGROUND_NOTE =
  "Background: an elegant private study/office blending warm wood-paneled bookshelves on one side " +
  "with a large window showing a glittering city skyline at dusk on the other side — warm golden " +
  "lamp light mixed with the cool blue-purple glow of city lights and a sunset, a subtle world globe " +
  "or antique map visible, a softly blurred stock chart screen faintly glowing nearby. Rich, " +
  "polished, upscale atmosphere.";

const FRAME_COMPOSITION_NOTE =
  "CRITICAL frame composition: the character's full body should occupy only about 50-55% of the " +
  "vertical frame height, positioned so there is generous background visible above, beside, and " +
  "below — a medium shot that shows the character stepped back within the scene, NOT a tight close-" +
  "up that fills the frame. The rich background environment must remain clearly visible and give " +
  "the image a sense of spacious, upscale place.";

const GLOSSY_TOY_TEXTURE_NOTE =
  "Rendering style: soft, glossy, rounded 3D mascot render (Pixar/DreamWorks toy quality) with a " +
  "smooth metallic-gold sheen on the body, polished and cute like a premium animated mascot " +
  "character.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "bull_character_design_spec_v5",
  episode: 0,
  character: "bull_design_candidates_v5",
  title: "황소특보 캐릭터 디자인 5차 (귀여운 비율 + 날카로운 눈빛 + 서재 배경)",
  slides: [
    {
      id: "bull_final_v5",
      file: "bull_final_v5.png",
      withCharacter: false,
      prompt:
        `Create a brand-new original vertical 1080x1920px character design image for a Korean ` +
        `finance Shorts mascot, generated entirely from the text description below (no existing ` +
        `image reference).\n\n` +
        `A cute chibi mascot character shaped like a young bull (cow), with a warm golden metallic ` +
        `body (rich gold color), small golden horns, small rounded ears. ${NO_NOSE_RING_NOTE}\n\n` +
        `${OWL_PROPORTION_NOTE}\n\n` +
        `${SHARP_CONFIDENT_EYES_NOTE}\n\n` +
        `${GLASSES_NOTE}\n\n` +
        `${VEST_ONLY_NOTE}\n\n` +
        `${PEN_PROP_NOTE}\n\n` +
        `${STUDY_SKYLINE_BACKGROUND_NOTE}\n\n` +
        `${FRAME_COMPOSITION_NOTE}\n\n` +
        `Pose: standing confidently, one short arm holding the pen near the chest, the other arm ` +
        `resting at the side or lightly on the hip — composed and confident, not jumping or overly ` +
        `energetic.\n\n` +
        `${GLOSSY_TOY_TEXTURE_NOTE} Sharp focus on the character, no text overlays.`,
    },
  ],
});
