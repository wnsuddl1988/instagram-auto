/**
 * 부엉이 애널리스트(owl3dv5) 4편 9장 각각의 Veo 모션 프롬프트.
 *
 * 1~3편과 안전장치(STYLE_LOCK/CHARACTER_LOCK/CAMERA_LOCK/ABSOLUTE_RULES_SUFFIX)는
 * 동일하게 재사용한다 — 실사화·캐릭터 붕괴를 막은 검증된 문구이므로 손대지
 * 않는다. 액션 시퀀스와 참조 이미지 경로만 4편 소재(서울 12평 이하 초소형
 * 아파트값 1년 새 15% 상승 — real_estate 도메인)와 실제 대본 나레이션에
 * 맞춰 새로 쓴다.
 *
 * 대본-동작 싱크로율 원칙(런북 6-0-3): 장면의 일반적인 역할(hook/impact/action
 * 등)이 아니라 그 장면 나레이션의 구체적인 단어·감정 전환에 맞춰 액션
 * 시퀀스를 쓴다. action(7~9)을 3개 씬(실거래가 조회 → 청약 자격 → 디딤돌대출
 * 계산)으로 나누는 새 표준(2026-09-18 Owner 확정) 적용 첫 편.
 *
 * 공통 원칙(전 장면 동일하게 지킴):
 *   - 캐릭터 외형(조끼·넥타이·포켓치프·선글라스·발톱 골드 링) 고정, 변형 금지
 *   - 카메라 컷/줌/팬 없이 한 샷 유지, 움직임은 절제된 수준(과장 금지)
 *   - 화면·소품에 새 텍스트·숫자·로고 렌더링 금지(HC-10)
 *   - 표정은 날카롭고 진지함 유지 — 미소/능글맞은 표정 재발 금지(v4→v5 교정 사유)
 */

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

const REF_DIR = "C:/tmp/owl-ep4-11scene";

export const OWL_EP4_VEO_SCENES = {
  // 씬1 (hook): "서울에서 제일 작은 아파트가 제일 많이 올랐다는 거 알아?" —
  // 미니어처 아파트 모형을 들어 보이며 놀란 듯 확신에 찬 톤으로 질문.
  s1_hook: {
    id: "owl_ep4_s1_hook",
    refImage: `${REF_DIR}/owl_ep4_s1_hook.png`,
    outputName: "owl_ep4_s1_hook_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding up the small miniature apartment model in one wing at chest height, looking directly at the camera with a sharp, slightly surprised expression.\n" +
      "2. The owl gives the model a small, deliberate tilt toward the camera, as if presenting it more clearly, eyebrows lifting slightly.\n" +
      "3. The gaze stays locked on the camera, confident and pointed, as if about to ask a question.\n" +
      "4. Feathers show subtle, natural micro-movement (breathing, light settling) — no exaggerated bouncing.",
      "The miniature apartment model stays exactly as in the reference image — no new text, numbers, or signage appear on it.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "no new text, numbers, or signage appear", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬2 (loss_aversion): "돈 모아서 나중에 작은 집부터 사면 된다고 미뤘다면,
  // 이 흐름을 모르고 지나치면 그사이 가격이 더 올라 오히려 손해를 볼 수 있어." —
  // 걱정스러운 손실회피 톤, 저금통 소품.
  s2_loss_aversion: {
    id: "owl_ep4_s2_loss_aversion",
    refImage: `${REF_DIR}/owl_ep4_s2_loss_aversion.png`,
    outputName: "owl_ep4_s2_loss_aversion_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the small blank piggy bank in one wing at the bright office window, the other wing raised near the head in a slightly worried gesture.\n" +
      "2. The owl's eyebrows press inward and the head tilts down a few degrees, as if realizing a growing problem — a small, deliberate worried motion.\n" +
      "3. The piggy-bank-holding wing stays steady, with only a small natural settling motion.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The piggy bank stays blank throughout — no text or numbers appear on it. The bright office window and Seoul skyline background stay exactly as in the reference image — do not shift to a dark or blue-toned newsroom setting.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "piggy bank stays blank", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬3 (evidence_card): "한국부동산원 집계로 7월 기준 서울 12평 이하 아파트값이
  // 1년 새 15% 상승, 서울 아파트 전체 평균인 14.6%보다도 더 올랐어." — 냉철하게
  // 두 상승 그래프를 비교 제시.
  s3_evidence_card: {
    id: "owl_ep4_s3_evidence_card",
    refImage: `${REF_DIR}/owl_ep4_s3_evidence_card.png`,
    outputName: "owl_ep4_s3_evidence_card_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding up the two blank bar-graph cards, one in each wing, side by side toward the camera, serious and analytical expression.\n" +
      "2. The owl gives the wing holding the right-hand card (the taller-looking upward graph) a small, deliberate emphasizing lift, as if pointing out the bigger number.\n" +
      "3. The owl's gaze stays fixed and confident on the camera, no smiling.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "Both graph cards stay completely blank throughout — no numbers, percentages, or text appear on them. Both graphs' bars must stay in their upward-trending shape from the reference image — do not let either card's bars appear to shrink or trend downward.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "cards stay completely blank", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬4 (background): "한국은행이 기준금리를 3%까지 올린 상황에서도 최근 거래가
  // 중저가 아파트로 몰리면서 초소형 평형에 수요가 집중된 거야." — 진지하게
  // 게이지 소품을 짚으며 설명.
  s4_background: {
    id: "owl_ep4_s4_background",
    refImage: `${REF_DIR}/owl_ep4_s4_background.png`,
    outputName: "owl_ep4_s4_background_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the small blank gauge/dial prop in one wing, the other wing pointing at it, standing in front of the classical stone building with the dome, explaining expression.\n" +
      "2. The pointing wing makes a small, deliberate tapping motion near the gauge's needle, as if emphasizing a specific reading — a short, restrained gesture.\n" +
      "3. The owl's gaze stays fixed and confident, no smiling.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The gauge/dial stays completely blank of numbers throughout — only the needle position from the reference image is visible, no digits or labels appear.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "gauge/dial stays completely blank", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬5 (twist): "핵심은 집값이 올랐다는 사실만이 아니야. 실제로는 넓은 집보다
  // 좁은 집에서 상승 압력이 더 크게 나타나고 있다는 거지." — 큰 집 vs 작은 집
  // 비교하며 확신에 찬 반전 제시.
  s5_twist: {
    id: "owl_ep4_s5_twist",
    refImage: `${REF_DIR}/owl_ep4_s5_twist.png`,
    outputName: "owl_ep4_s5_twist_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the large house model in one wing and the small house model in the other, arms spread to compare them, confident expression.\n" +
      "2. The owl gives the wing holding the small house model a small, deliberate lift toward the camera, emphasizing it over the large house model.\n" +
      "3. The owl's gaze stays fixed and confident on the camera, no smiling.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "Both house models stay exactly as in the reference image — no new text, numbers, or signage appear on either model.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "no new text, numbers, or signage appear", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬6 (impact): "그래서 자금이 넉넉하지 않은 실수요자일수록 소형 평형 진입
  // 장벽이 오히려 더 높아지고 있어." — 벽돌 장벽을 가리키며 안타까운 진지한 톤.
  s6_impact: {
    id: "owl_ep4_s6_impact",
    refImage: `${REF_DIR}/owl_ep4_s6_impact.png`,
    outputName: "owl_ep4_s6_impact_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already standing beside the small brick wall prop, one wing gesturing toward it, serious and slightly concerned expression, dim evening cityscape behind.\n" +
      "2. The gesturing wing makes a small, deliberate motion tracing the height of the brick wall, as if emphasizing a barrier.\n" +
      "3. The owl's gaze stays fixed and confident, no smiling.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The brick wall prop stays exactly as in the reference image — no new text, numbers, or signage appear on it.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "no new text, numbers, or signage appear", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬7 (실행 1/3 — 실거래가 조회): "국토부 실거래가 공개시스템에서 관심 있는
  // 평형의 최근 3개월 거래가부터 오늘 바로 확인해보자." — 태블릿을 들고 안내.
  s7_action_a: {
    id: "owl_ep4_s7_action_a",
    refImage: `${REF_DIR}/owl_ep4_s7_action_a.png`,
    outputName: "owl_ep4_s7_action_a_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the blank tablet in one wing, the other wing pointing at its blank screen, calm and trustworthy expression, bright living room behind.\n" +
      "2. The pointing wing makes a small, deliberate tapping motion on the tablet screen, as if guiding the viewer to check something.\n" +
      "3. The owl's gaze stays fixed and confident on the camera, no smiling.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The tablet screen stays completely blank white throughout — no text, numbers, icons, or UI elements ever appear on it.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "tablet screen stays completely blank", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬8 (실행 2/3 — 청약 자격 확인): "소형 평형을 노린다면 청약홈에서
  // 생애최초·신혼부부 특별공급 자격과 일정도 같이 확인해봐." — 서류를 펼쳐 들고
  // 부드럽게 안내.
  s8_action_b: {
    id: "owl_ep4_s8_action_b",
    refImage: `${REF_DIR}/owl_ep4_s8_action_b.png`,
    outputName: "owl_ep4_s8_action_b_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the blank open document/booklet spread open with both wings at chest height, warm and trustworthy expression, same bright living room as before.\n" +
      "2. The owl gives the document a small, deliberate tilt toward the camera, as if inviting the viewer to look closer.\n" +
      "3. The owl's gaze stays fixed and confident on the camera, no smiling but warm.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The document stays completely blank throughout — no text, numbers, or forms ever appear on its pages.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "document stays completely blank", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬9 (실행 3/3 — 디딤돌대출 한도 계산, 마무리): "자금이 부족하다면 주택도시
  // 기금 디딤돌대출 한도부터 미리 계산해두면 실제 매수 시점에 덜 급해져." —
  // 계산기를 들고 고개를 끄덕이며 확신에 찬 마무리.
  s9_action_c: {
    id: "owl_ep4_s9_action_c",
    refImage: `${REF_DIR}/owl_ep4_s9_action_c.png`,
    outputName: "owl_ep4_s9_action_c_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the small blank calculator in one wing at chest height, the other wing resting near the body, confident and trustworthy expression, same bright living room as before.\n" +
      "2. The owl gives one small, deliberate nod toward the camera, as if confirming a final recommendation.\n" +
      "3. The owl's gaze stays fixed and confident on the camera, no smiling.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The calculator's screen stays completely blank throughout — no digits or numbers ever appear on it.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "calculator's screen stays completely blank", label: "텍스트/숫자 금지(HC-10)" }],
  },
};
