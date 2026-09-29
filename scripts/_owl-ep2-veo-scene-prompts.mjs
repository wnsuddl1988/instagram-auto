/**
 * 부엉이 애널리스트(owl3dv5) 2편 8장 각각의 Veo 모션 프롬프트.
 *
 * 1편(_owl-veo-scene-prompts.mjs)과 안전장치(STYLE_LOCK/CHARACTER_LOCK/CAMERA_LOCK/
 * ABSOLUTE_RULES_SUFFIX)는 동일하게 재사용한다 — 1편 프로덕션에서 실사화·캐릭터
 * 붕괴를 막은 검증된 문구이므로 손대지 않는다. 액션 시퀀스와 참조 이미지 경로만
 * 2편 소품(계산기·정부청사·지구본·깃발·세계지도)에 맞게 새로 쓴다.
 *
 * 공통 원칙(전 장면 동일하게 지킴):
 *   - 캐릭터 외형(조끼·넥타이·포켓치프·선글라스·발톱 골드 링) 고정, 변형 금지
 *   - 카메라 컷/줌/팬 없이 한 샷 유지, 움직임은 절제된 수준(과장 금지)
 *   - 화면·소품에 새 텍스트·숫자·로고 렌더링 금지(HC-10)
 *   - 표정은 날카롭고 진지함 유지 — 미소/능글맞은 표정 재발 금지(v4→v5 교정 사유)
 */

// STYLE_LOCK: Flow(Omni/Veo Lite/Fast 전부)가 이 문구 없이는 image-to-video
// 과정에서 3D 애니메이션 질감을 사실적인 실사 사진 질감으로 재해석하는 것이
// 반복 관찰됨(1편 Scene 6/7/8 전부 재현). 여기서 명시적으로 복원한다.
const STYLE_LOCK =
  "Render style must stay EXACTLY as in the reference image: a stylized 3D-animated character illustration (Pixar/DreamWorks-style CG render) with smooth, slightly soft toy-like material shading and simplified studio lighting. This is NOT a photograph and NOT photorealistic — do NOT add photographic skin/feather micro-detail, do NOT add realistic camera lens depth-of-field grain, do NOT shift the lighting or materials toward realism. The output must look like a frame from a 3D animated film, not a live-action or photoreal render.";

const CHARACTER_LOCK =
  "Keep the owl analyst character's appearance exactly as in the reference image — same charcoal waistcoat, burgundy tie and pocket square, black sunglasses resting on the forehead, small gold ring on one talon, sharp focused eyes. Do NOT change the character design, outfit, or colors.";

const CAMERA_LOCK =
  "Continuous medium shot, camera stays mostly stable with only a very subtle handheld breathing motion. Silent, 9:16 vertical format. No camera cut, zoom, or pan — one continuous shot.";

const ABSOLUTE_RULES_SUFFIX =
  "No new text, numbers, subtitles, logos, or UI ever appear anywhere in frame. No new person, hand, or object enters the frame. The character's face, outfit, and proportions must not distort or morph. Expression stays serious and sharp — no smiling, no smirking. The render style must not shift toward photorealism — see style lock above.";

const REQUIRED_KEYWORDS_COMMON = [
  { key: "owl analyst character's appearance exactly", label: "캐릭터 외형 고정" },
  { key: "No camera cut, zoom, or pan", label: "단일 컷 고정" },
  { key: "no smiling, no smirking", label: "느끼함 재발 방지" },
  { key: "This is NOT a photograph and NOT photorealistic", label: "실사화 방지(스타일 고정)" },
];

function buildPrompt(actionSequence, extraAbsoluteRule) {
  const rules = extraAbsoluteRule ? `${extraAbsoluteRule} ${ABSOLUTE_RULES_SUFFIX}` : ABSOLUTE_RULES_SUFFIX;
  return `Animate this 3D character illustration. ${STYLE_LOCK} ${CHARACTER_LOCK}\n\n${CAMERA_LOCK}\n\nACTION SEQUENCE:\n${actionSequence}\n\nABSOLUTE RULES:\n${rules}`;
}

const REF_DIR = "C:/tmp/owl-ep2-8scene";

export const OWL_EP2_VEO_SCENES = {
  s1_hook: {
    id: "owl_ep2_s1_hook",
    refImage: `${REF_DIR}/owl_ep2_s1_hook.png`,
    outputName: "owl_s1_hook_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the phone up, looking at its blank screen with a sharp, focused expression (mouth closed, no smiling).\n" +
      "2. The owl slowly narrows its eyes slightly further, as if noticing something surprising on the screen — a small, restrained head tilt of a few degrees toward the phone.\n" +
      "3. The free wing/hand resting near the waist stays mostly still, with only a small natural settling motion.\n" +
      "4. Feathers show subtle, natural micro-movement (breathing, light settling) — no exaggerated bouncing.",
      "The phone screen stays blank throughout.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "phone screen stays blank", label: "텍스트/숫자 금지(HC-10)" }],
  },
  s2_loss_aversion: {
    id: "owl_ep2_s2_loss_aversion",
    refImage: `${REF_DIR}/owl_ep2_s2_loss_aversion.png`,
    outputName: "owl_s2_loss_aversion_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the blank calculator prop, looking at it with a worried, calculating expression.\n" +
      "2. The owl's eyebrows press slightly further inward, deepening the worried expression, while the free wing/talon near the chin makes a small, deliberate thinking gesture.\n" +
      "3. The head tilts down a few more degrees, as if the number is sinking in.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The calculator display stays blank throughout — no digits or text appear on it.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "calculator display stays blank", label: "텍스트/숫자 금지(HC-10)" }],
  },
  s3_evidence_card: {
    id: "owl_ep2_s3_evidence_card",
    refImage: `${REF_DIR}/owl_ep2_s3_evidence_card.png`,
    outputName: "owl_s3_evidence_card_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the small notebook open, looking at it with a focused, serious expression, standing near the government-building silhouette with the blank info-board prop beside it.\n" +
      "2. The owl's gaze shifts slightly, as if reading closely — a small, restrained eye and head motion.\n" +
      "3. The free wing/hand stays mostly still near the notebook, with only a small natural settling motion.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The notebook pages and the blank info-board prop stay blank throughout — no text or numbers appear on them.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "stay blank throughout", label: "텍스트/숫자 금지(HC-10)" }],
  },
  s4_background: {
    id: "owl_ep2_s4_background",
    refImage: `${REF_DIR}/owl_ep2_s4_background.png`,
    outputName: "owl_s4_background_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the blank notepad/calendar prop and gesturing toward the distance with its other wing, in the study/library background.\n" +
      "2. The pointing wing makes a small, deliberate gesture as if indicating a far-off point in time — a short, restrained motion.\n" +
      "3. The notepad stays held steady in the other wing, with only a small natural settling motion.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The notepad/calendar pages stay blank throughout — no dates, numbers, or text appear on them.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "notepad/calendar pages stay blank", label: "텍스트/숫자 금지(HC-10)" }],
  },
  s5_twist: {
    id: "owl_ep2_s5_twist",
    refImage: `${REF_DIR}/owl_ep2_s5_twist.png`,
    outputName: "owl_s5_twist_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding up one wing in a firm stop gesture while the other wing holds a small blank flag prop, with a confident, sharp expression.\n" +
      "2. The raised stop-gesture wing makes a small, deliberate emphasis motion — a short, restrained forward push, as if firmly saying no.\n" +
      "3. The eyes stay sharply focused forward, unblinking intensity, no smiling.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The flag prop stays blank throughout — no numbers or text appear on it.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "flag prop stays blank", label: "텍스트/숫자 금지(HC-10)" }],
  },
  s6_impact: {
    id: "owl_ep2_s6_impact",
    refImage: `${REF_DIR}/owl_ep2_s6_impact.png`,
    outputName: "owl_s6_impact_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding a small pointer stick toward the blank world-map panel, explaining with a serious expression.\n" +
      "2. The pointer wing makes a small, deliberate tapping or sliding motion along the map, as if indicating a ranking position — a restrained motion.\n" +
      "3. The free wing stays steady near the body, with only a small natural settling motion.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The world-map panel stays exactly as in the reference image throughout — no new country names, numbers, or text appear on it.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "map panel stays exactly as in the reference image", label: "텍스트/숫자 금지(HC-10)" }],
  },
  s7_action: {
    id: "owl_ep2_s7_action",
    refImage: `${REF_DIR}/owl_ep2_s7_action.png`,
    outputName: "owl_s7_action_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the phone up, looking at its blank screen with a calm, steady, trustworthy expression (a small amount of ease, but not a big smile).\n" +
      "2. The owl gives a small, calm nod, as if confirming something on the screen — a short, restrained motion.\n" +
      "3. The free wing rests naturally, with only a small settling motion.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The phone screen and any background props (mugs, frames, plants) stay exactly as in the reference image with no new text, numbers, or logos appearing anywhere.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "no new text, numbers, or logos appearing", label: "텍스트/숫자 금지(HC-10)" }],
  },
  s8_closing: {
    id: "owl_ep2_s8_closing",
    refImage: `${REF_DIR}/owl_ep2_s8_closing.png`,
    outputName: "owl_s8_closing_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already standing with both wings spread slightly outward in a welcoming gesture, facing forward with a calm, composed expression.\n" +
      "2. The owl gives a small, calm settling breath motion — a very subtle chest/feather rise and fall, wings staying gently spread.\n" +
      "3. Both wings stay resting in the spread pose, with only a small natural settling motion.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "No new props or objects appear in frame — the character remains alone against the simple background.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "No new props or objects appear", label: "소품 없음 유지" }],
  },
};
