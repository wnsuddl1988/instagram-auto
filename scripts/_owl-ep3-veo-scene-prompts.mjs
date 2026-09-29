/**
 * 부엉이 애널리스트(owl3dv5) 3편 11장 각각의 Veo 모션 프롬프트.
 *
 * 1편(_owl-veo-scene-prompts.mjs)·2편(_owl-ep2-veo-scene-prompts.mjs)과
 * 안전장치(STYLE_LOCK/CHARACTER_LOCK/CAMERA_LOCK/ABSOLUTE_RULES_SUFFIX)는
 * 동일하게 재사용한다 — 실사화·캐릭터 붕괴를 막은 검증된 문구이므로 손대지
 * 않는다. 액션 시퀀스와 참조 이미지 경로만 3편 소재(전세난 역설·HUG 안심신탁)와
 * 실제 대본 나레이션에 맞춰 새로 쓴다.
 *
 * 대본-동작 싱크로율 원칙(런북 6-0-3, Owner 2026-09-17): 장면의 일반적인
 * 역할(hook/impact/action 등)이 아니라 그 장면 나레이션의 구체적인 단어·감정
 * 전환에 맞춰 액션 시퀀스를 쓴다. 8장면 고정 규칙 폐기 이후 첫 편이라 11장이며,
 * impact(6~7)·action(8~11) 역할이 여러 장면으로 나뉜 만큼 장면 간 자세·소품
 * 연속성(앞 장면에서 이어지는 자세)도 명시한다.
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

const REF_DIR = "C:/tmp/owl-ep3-11scene";

export const OWL_EP3_VEO_SCENES = {
  // 씬1 (hook): "서울 집값이 84주째 연속 상승 중인 거 알고 있었어?" — 날카로운
  // 정보격차형 훅. 스카이라인을 가리키다 카메라로 시선을 돌려 질문을 던지는 전환.
  s1_hook: {
    id: "owl_ep3_s1_hook",
    refImage: `${REF_DIR}/owl_ep3_s1_hook.png`,
    outputName: "owl_ep3_s1_hook_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already standing at the office window with one wing gesturing toward the Seoul skyline outside, sharp and focused expression.\n" +
      "2. The owl's gaze shifts from the skyline to look directly at the camera, as if about to ask a pointed question — a small, deliberate head turn.\n" +
      "3. The gesturing wing settles slightly, coming to rest near the body while eye contact with the camera stays fixed and confident.\n" +
      "4. Feathers show subtle, natural micro-movement (breathing, light settling) — no exaggerated bouncing.",
      "The city skyline outside the window stays exactly as in the reference image — no new buildings, numbers, or text appear.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "no new buildings, numbers, or text appear", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬2 (loss_aversion): "전세 구하던 사람이라면 이거 놓치면 손해야. 집주인이
  // 실거주한다고 나가라는 일이 늘고 있거든." — 걱정스러운 손실회피 톤.
  s2_loss_aversion: {
    id: "owl_ep3_s2_loss_aversion",
    refImage: `${REF_DIR}/owl_ep3_s2_loss_aversion.png`,
    outputName: "owl_ep3_s2_loss_aversion_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the small blank notepad in the real-estate office lobby setting, one wing raised near the head in a slightly worried gesture.\n" +
      "2. The owl's eyebrows press inward and the head tilts down a few degrees, as if realizing a growing problem — a small, deliberate worried motion.\n" +
      "3. The notepad-holding wing stays steady, with only a small natural settling motion.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The notepad stays blank throughout — no text or numbers appear on it.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "notepad stays blank", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬3 (evidence_card): "한국부동산원 집계로 이번 주 서울 아파트값은 0.16%
  // 상승, 84주 연속 오른 거야." — 냉철하게 근거를 짚는 톤.
  s3_evidence_card: {
    id: "owl_ep3_s3_evidence_card",
    refImage: `${REF_DIR}/owl_ep3_s3_evidence_card.png`,
    outputName: "owl_ep3_s3_evidence_card_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already pointing one wing toward the blank information board beside it, serious and analytical expression, Seoul skyline visible through the window behind.\n" +
      "2. The pointing wing makes a small, deliberate tapping motion on the board, as if emphasizing a specific figure — a short, restrained gesture.\n" +
      "3. The owl's gaze stays fixed and confident, no smiling.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The information board stays completely blank throughout — no numbers, percentages, or text appear on it.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "board stays completely blank", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬4 (background): "역대 최장 기록은 문재인 정부 때인 2020년 6월~2022년
  // 1월인데, 지금 다가서고 있어." — 과거를 짚으며 먼 곳을 가리키는 회상 톤.
  s4_background: {
    id: "owl_ep3_s4_background",
    refImage: `${REF_DIR}/owl_ep3_s4_background.png`,
    outputName: "owl_ep3_s4_background_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the blank calendar/notepad prop in the study, one wing gesturing outward as if pointing back through time.\n" +
      "2. The gesturing wing makes a small, deliberate sweeping motion, as if indicating a past period drawing closer to the present — a short, restrained gesture.\n" +
      "3. The calendar-holding wing stays steady, with only a small natural settling motion.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The calendar/notepad pages stay blank throughout — no dates, numbers, or text appear on them.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "pages stay blank", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬5 (twist): "핵심은 집값 상승만이 아니야. 강남 3구는 오히려 6주째 하락
  // 중이거든." — 반전을 짚는 확신에 찬 톤, 두 막대(상승/하락) 대비.
  s5_twist: {
    id: "owl_ep3_s5_twist",
    refImage: `${REF_DIR}/owl_ep3_s5_twist.png`,
    outputName: "owl_ep3_s5_twist_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding up the blank blue bar-chart prop in one wing and the blank red bar-chart prop in the other, comparing them with a confident, sharp expression.\n" +
      "2. The owl gives a small, deliberate motion raising the red (falling) chart slightly while the blue chart stays steady, as if highlighting the contrast — a short, restrained gesture.\n" +
      "3. The eyes stay sharply focused on the camera, no smiling.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "Both bar-chart props stay exactly as in the reference image throughout — no numbers or text appear on them.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "bar-chart props stay exactly as in the reference image", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬6 (impact 1/2): "진짜 아이러니는 이거야. 종부세·양도세·대출규제가
  // 실거주를 유도했는데," — 정책 표지판을 가리키며 아이러니를 짚기 시작.
  s6_impact_a: {
    id: "owl_ep3_s6_impact_a",
    refImage: `${REF_DIR}/owl_ep3_s6_impact_a.png`,
    outputName: "owl_ep3_s6_impact_a_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already standing between the two blank policy signboards, one wing gesturing toward them, serious and analytical expression.\n" +
      "2. The owl tilts its head slightly, as if pointing out something ironic about the signboards — a small, deliberate curious-but-sharp head tilt.\n" +
      "3. The gesturing wing makes a small, restrained motion between the two signboards, as if connecting them.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "Both policy signboards stay completely blank throughout — no text or numbers appear on them.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "signboards stay completely blank", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬7 (impact 2/2): "오히려 전세 매물 품귀로 이어졌어. 규제가 전세난을 키운
  // 역설인 셈이지." — 씁쓸한 아이러니를 완성하는 표정 전환.
  s7_impact_b: {
    id: "owl_ep3_s7_impact_b",
    refImage: `${REF_DIR}/owl_ep3_s7_impact_b.png`,
    outputName: "owl_ep3_s7_impact_b_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already standing with one wing raised, head tilted with a thoughtful, slightly ironic expression, continuing from the previous gesture toward the signboards.\n" +
      "2. The owl gives a small, deliberate head shake and a faint, restrained ironic half-smile (not a full smile), as if landing on the paradox's conclusion.\n" +
      "3. The raised wing settles slightly, coming to rest near the body.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The apartment building silhouette in the background stays exactly as in the reference image — no new text, numbers, or logos appear.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "no new text, numbers, or logos appear", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬8 (action 1/4): "만료가 다가온다면 등기부등본으로 갱신청구권 썼는지부터
  // 확인해." — 차분하고 신뢰감 있게 서류를 펼쳐 안내하는 톤.
  s8_action_a: {
    id: "owl_ep3_s8_action_a",
    refImage: `${REF_DIR}/owl_ep3_s8_action_a.png`,
    outputName: "owl_ep3_s8_action_a_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the blank document (registry certificate shape) open with both wings, calm and trustworthy expression, facing the camera directly.\n" +
      "2. The owl gives a small, deliberate nod while looking directly at the camera, as if guiding the viewer through a checklist step — a short, restrained motion.\n" +
      "3. The document stays held steady, with only a small natural settling motion.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The document stays completely blank throughout — no text or numbers appear on it.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "document stays completely blank", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬9 (action 2/4): "안 썼으면 집주인한테 연장 요구할 수 있어. 몰라서 그냥
  // 나가는 사람이 많거든." — 안심시키듯 설명하는 부드러운 전환.
  s9_action_b: {
    id: "owl_ep3_s9_action_b",
    refImage: `${REF_DIR}/owl_ep3_s9_action_b.png`,
    outputName: "owl_ep3_s9_action_b_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already standing in the living-room setting with one wing raised, palm open in a reassuring gesture, explaining expression toward the camera.\n" +
      "2. The owl gives a small, deliberate reassuring gesture with the raised wing, as if saying 'you have an option' — a short, restrained motion, slightly softer expression than the previous scene.\n" +
      "3. The other wing stays resting naturally, with only a small settling motion.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The front-door silhouette in the background stays exactly as in the reference image — no new text, numbers, or logos appear.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "no new text, numbers, or logos appear", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬10 (action 3/4): "HUG 안심신탁 쓰면 집주인이 보증금을 못 건드려서
  // 전세사기 걱정이 줄어." — 금고를 가리키며 안심시키는 따뜻한 톤.
  s10_action_c: {
    id: "owl_ep3_s10_action_c",
    refImage: `${REF_DIR}/owl_ep3_s10_action_c.png`,
    outputName: "owl_ep3_s10_action_c_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already standing beside the small blank safe/vault prop with one wing resting on top of it, warm and reassuring expression, bank-counter setting behind.\n" +
      "2. The owl gives a small, deliberate reassuring gesture — a gentle pat or point toward the safe with the resting wing, as if saying 'this is protected' — a short, restrained motion.\n" +
      "3. The eyes stay warm but composed, no smiling.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The safe/vault prop stays completely blank throughout — no numbers, dials, or text appear on it.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "safe/vault prop stays completely blank", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬11 (action 4/4): "운용수익률도 4.35% 확정이니, 계약 앞뒀다면 이것도
  // 같이 알아봐." — 확신에 찬 마무리 권유, 고개를 끄덕이는 클로징.
  s11_action_d: {
    id: "owl_ep3_s11_action_d",
    refImage: `${REF_DIR}/owl_ep3_s11_action_d.png`,
    outputName: "owl_ep3_s11_action_d_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already standing beside the same blank safe/vault prop, giving a thumbs-up gesture with one wing, confident and trustworthy expression, facing the camera directly.\n" +
      "2. The owl gives a small, deliberate confident nod directly at the camera, as if wrapping up a recommendation — a short, restrained motion.\n" +
      "3. The thumbs-up wing stays held steady, with only a small natural settling motion.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The safe/vault prop and bank-counter background stay exactly as in the reference image — no new numbers, dials, or text appear.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "no new numbers, dials, or text appear", label: "텍스트/숫자 금지(HC-10)" }],
  },
};
