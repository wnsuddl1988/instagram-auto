/**
 * 부엉이 애널리스트(owl3dv5) 5편 씬1~10 각각의 모션 프롬프트 — 2차 개정판.
 *
 * 1~4편과 안전장치(STYLE_LOCK/CHARACTER_LOCK/CAMERA_LOCK/ABSOLUTE_RULES_SUFFIX)는
 * 동일하게 재사용한다 — 실사화·캐릭터 붕괴를 막은 검증된 문구이므로 손대지
 * 않는다. 액션 시퀀스와 참조 이미지 경로만 5편 소재(한국은행 기준금리 3.00%,
 * 11월 추가 인상 유력 — macro_rate 도메인)와 실제 대본 나레이션에 맞춰 새로 쓴다.
 *
 * 2차 개정(2026-09-18 Owner 지적, 전면 재작업):
 *   - 대본을 8초 발화 분량(25~41자)에 맞춰 압축했다 — narration 참고.
 *   - 1차본 이미지가 "빈 소품이 방향성 없이 텅 비어" 허전하다는 지적으로 씬5를
 *     제외한 9씬의 참조 이미지를 방향성 아이콘(화살표/막대그래프/체크박스/
 *     파이차트 등)이 반영된 버전(REF_DIR: owl-ep5-10scene-v2)으로 교체했다.
 *   - 씬 1~10 전체를 Flow(8초)로 통일한다 — Gemini/Flow 씬 분할 없음.
 *   - 이번 편은 Flow를 Owner가 수동으로 실행한다(자동화 스크립트 미사용) —
 *     아래 프롬프트를 그대로 Flow UI에 붙여넣어 8초로 생성.
 *
 * 공통 원칙(전 장면 동일하게 지킴):
 *   - 캐릭터 외형(조끼·넥타이·포켓치프·선글라스·발톱 골드 링) 고정, 변형 금지
 *   - 카메라 컷/줌/팬 없이 한 샷 유지, 움직임은 절제된 수준(과장 금지)
 *   - 화면·소품에 새 텍스트·숫자·로고 렌더링 금지(HC-10) — 단, 참조 이미지에
 *     이미 있는 화살표/막대/체크 등 방향성 아이콘은 그대로 유지한다(숫자만 금지).
 *   - 표정은 날카롭고 진지함 유지 — 미소/능글맞은 표정 재발 금지(v4→v5 교정 사유)
 */

const STYLE_LOCK =
  "Render style must stay EXACTLY as in the reference image: a stylized 3D-animated character illustration (Pixar/DreamWorks-style CG render) with smooth, slightly soft toy-like material shading and simplified studio lighting. This is NOT a photograph and NOT photorealistic — do NOT add photographic skin/feather micro-detail, do NOT add realistic camera lens depth-of-field grain, do NOT shift the lighting or materials toward realism. The output must look like a frame from a 3D animated film, not a live-action or photoreal render.";

const CHARACTER_LOCK =
  "Keep the owl analyst character's appearance exactly as in the reference image — same charcoal waistcoat, burgundy tie and pocket square, black sunglasses resting on the forehead, small gold ring on one talon, sharp focused eyes. Do NOT change the character design, outfit, or colors.";

const CAMERA_LOCK =
  "Continuous medium shot, camera stays mostly stable with only a very subtle handheld breathing motion. Silent, 9:16 vertical format. No camera cut, zoom, or pan — one continuous shot. The video must be exactly 8 seconds long.";

const ABSOLUTE_RULES_SUFFIX =
  "No new text or numbers ever appear anywhere in frame beyond what is already on the prop in the reference image. No new person, hand, or object enters the frame. The character's face, outfit, and proportions must not distort or morph. Expression stays serious and sharp — no smiling, no smirking. The render style must not shift toward photorealism — see style lock above.";

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

const REF_DIR = "C:/tmp/owl-ep5-10scene-v2";

export const OWL_EP5_VEO_SCENES = {
  // 씬1 (hook): "한국은행이 11월에 기준금리를 또 올릴 수 있다는 거 알아?" —
  // 날짜 격자 달력(빨간 동그라미 표시)을 들어 보이며 놀란 듯 확신에 찬 톤.
  s1_hook: {
    id: "owl_ep5_s1_hook",
    refImage: `${REF_DIR}/owl_ep5_s1_hook.png`,
    outputName: "owl_ep5_s1_hook_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding up the small spiral desk calendar in one wing at chest height, looking directly at the camera with a sharp, slightly surprised expression.\n" +
      "2. The owl gives the calendar a small, deliberate tilt toward the camera, as if presenting it more clearly, eyebrows lifting slightly.\n" +
      "3. The gaze stays locked on the camera, confident and pointed, as if about to ask a question.\n" +
      "4. Feathers show subtle, natural micro-movement (breathing, light settling) — no exaggerated bouncing.",
      "The calendar grid and the small red circle mark stay exactly as in the reference image — no new numbers or dates ever appear on it.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "no new numbers or dates ever appear", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬2 (loss_aversion): "대출도 투자도 모르고 지나치면 여기저기서 부담이
  // 커질 수 있어." — 걱정스러운 손실회피 톤, 빨강 상승/파랑 하강 화살표 카드.
  s2_loss_aversion: {
    id: "owl_ep5_s2_loss_aversion",
    refImage: `${REF_DIR}/owl_ep5_s2_loss_aversion.png`,
    outputName: "owl_ep5_s2_loss_aversion_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the red up-arrow card in one wing and the blue down-arrow card in the other, slightly raised at chest height, glancing between the two, worried expression.\n" +
      "2. The owl's eyebrows press inward and the head tilts down a few degrees, as if realizing a growing problem — a small, deliberate worried motion.\n" +
      "3. Both arrow cards stay steady, with only a small natural settling motion.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "Both arrow cards stay exactly as in the reference image — only the single red up-arrow and single blue down-arrow are visible, no text or numbers ever appear on them. The dark wood desk, leather chair, bookshelf, and city-skyline window background stay exactly as in the reference image.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "no text or numbers ever appear", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬3 (evidence_card): "오늘 기준 한국은행 기준금리는 3.00%, 8월에 0.25%p
  // 올린 수준이야." — 냉철하게 상승 막대그래프 카드를 가리키며 근거 제시.
  s3_evidence_card: {
    id: "owl_ep5_s3_evidence_card",
    refImage: `${REF_DIR}/owl_ep5_s3_evidence_card.png`,
    outputName: "owl_ep5_s3_evidence_card_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding up the bar-graph card in one wing at chest height, the other wing pointing at it, serious and analytical expression.\n" +
      "2. The pointing wing makes a small, deliberate tapping motion near the taller right-hand bar, as if emphasizing the rising figure.\n" +
      "3. The owl's gaze stays fixed and confident on the camera, no smiling.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The two outline bars and the upward arrow stay exactly as in the reference image — no numbers or percentages ever appear on the card.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "no numbers or percentages ever appear", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬4 (background): "원달러 환율도 1380.3원을 넘었고, 집값·유가까지 겹치며
  // 3연속 인상 가능성이 열렸어." — 네온 상승 화살표 3개 전광판을 가리키며 설명.
  s4_background: {
    id: "owl_ep5_s4_background",
    refImage: `${REF_DIR}/owl_ep5_s4_background.png`,
    outputName: "owl_ep5_s4_background_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the digital board with three glowing up-arrows in one wing, the other wing pointing at it, explaining expression.\n" +
      "2. The pointing wing makes a small, deliberate tapping motion tracing across the three arrows one by one, as if walking through several rising factors.\n" +
      "3. The owl's gaze stays fixed and confident, no smiling.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The three glowing orange up-arrows on the dark board stay exactly as in the reference image — no digits or labels ever appear on it.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "no digits or labels ever appear", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬5 (twist): "핵심은 인상 여부가 아니야. 유가가 85달러 밑으로 안 꺾이면
  // 3.5%까지 갈 수 있어." — 유가 게이지를 들고 확신에 찬 반전 제시. (씬5는
  // 1차본 그대로 재사용 — 게이지 바늘이 이미 방향성을 표현하고 있어 문제없음)
  s5_twist: {
    id: "owl_ep5_s5_twist",
    refImage: "C:/tmp/owl-ep5-10scene/owl_ep5_s5_twist.png",
    outputName: "owl_ep5_s5_twist_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the small gauge/dial prop with both wings at chest height, confident expression.\n" +
      "2. The owl gives the gauge a small, deliberate tilt toward the camera, as if pointing out a critical threshold on the dial.\n" +
      "3. The owl's gaze stays fixed and confident on the camera, no smiling.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The gauge/dial needle position stays exactly as in the reference image — no digits or labels ever appear on it.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "no digits or labels ever appear", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬6 (영향 1/2 — 대출자 이자 부담): "신규 대출뿐 아니라 기존 변동금리
  // 대출자의 이자 부담도 커질 수 있어." — 빨간 상승 꺾은선 카드를 든 안타까운 톤.
  s6_impact_a: {
    id: "owl_ep5_s6_impact_a",
    refImage: `${REF_DIR}/owl_ep5_s6_impact_a.png`,
    outputName: "owl_ep5_s6_impact_a_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the card with the red rising zigzag arrow with both wings at chest height, serious and slightly concerned expression.\n" +
      "2. The owl gives the card a small, deliberate downward tilt, as if underscoring a growing burden.\n" +
      "3. The owl's gaze stays fixed and confident, no smiling.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The red rising zigzag arrow stays exactly as in the reference image — no text, numbers, or additional marks ever appear on it.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "no text, numbers, or additional marks ever appear", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬7 (영향 2/2 — 자산시장 부담): "동시에 국고채 3년물 금리도 4.063%까지
  // 오르며 자산시장에도 부담을 주고 있어." — 하락 격자 곡선 카드를 든 걱정스러운 톤.
  s7_impact_b: {
    id: "owl_ep5_s7_impact_b",
    refImage: `${REF_DIR}/owl_ep5_s7_impact_b.png`,
    outputName: "owl_ep5_s7_impact_b_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding up the grid-graph card with the downward-trending red line in one wing, the other wing pointing at it, worried and serious expression.\n" +
      "2. The pointing wing makes a small, deliberate tracing motion along the descending line, as if walking through a concerning trend.\n" +
      "3. The owl's gaze stays fixed and confident on the camera, no smiling.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The grid lines and the single downward-trending red line stay exactly as in the reference image — no numbers or labels ever appear on it.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "no numbers or labels ever appear", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬8 (실행 1/3 — 변동금리 대출자, 고정금리 전환 확인): "변동금리 대출이
  // 있다면 오늘 고정금리 전환과 중도상환 수수료부터 확인해보자." — 변동→고정
  // 전환 화살표 태블릿을 들고 차분하게 안내.
  s8_action_a: {
    id: "owl_ep5_s8_action_a",
    refImage: `${REF_DIR}/owl_ep5_s8_action_a.png`,
    outputName: "owl_ep5_s8_action_a_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the tablet showing the wavy red arrow turning into a straight blue arrow in one wing, the other wing pointing at its screen, calm and trustworthy expression, bright living room behind.\n" +
      "2. The pointing wing makes a small, deliberate tapping motion on the tablet screen, as if guiding the viewer to check something.\n" +
      "3. The owl's gaze stays fixed and confident on the camera, no smiling.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The wavy-to-straight arrow icon on the tablet screen stays exactly as in the reference image — no text, numbers, or UI elements ever appear on it.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "no text, numbers, or UI elements ever appear", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬9 (실행 2/3 — 신규 대출 예정자, 대출 조건 미리 확인): "반대로 대출
  // 전이라면, 금리가 더 오르기 전에 조건부터 미리 알아보는 게 나아." — 체크박스
  // 서류(3개 중 2개 체크)를 펼쳐 들고 부드럽게 안내.
  s9_action_b: {
    id: "owl_ep5_s9_action_b",
    refImage: `${REF_DIR}/owl_ep5_s9_action_b.png`,
    outputName: "owl_ep5_s9_action_b_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the checklist document with two checked boxes and one empty box with both wings at chest height, warm and trustworthy expression, same bright living room as before.\n" +
      "2. The owl gives the document a small, deliberate tilt toward the camera, as if inviting the viewer to look closer.\n" +
      "3. The owl's gaze stays fixed and confident on the camera, no smiling but warm.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The three checkboxes and the two red checkmarks stay exactly as in the reference image — no text or numbers ever appear on the page.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "no text or numbers ever appear", label: "텍스트/숫자 금지(HC-10)" }],
  },
  // 씬10 (실행 3/3 — 투자자, 금리 취약 종목 비중 점검, 마무리): "투자 쪽도
  // 마찬가지야. 금리에 취약한 종목 비중부터 오늘 점검해보자." — 2분할 파이차트를
  // 들고 고개를 끄덕이며 확신에 찬 마무리.
  s10_action_c: {
    id: "owl_ep5_s10_action_c",
    refImage: `${REF_DIR}/owl_ep5_s10_action_c.png`,
    outputName: "owl_ep5_s10_action_c_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already holding the card with the two-toned pie chart in one wing at chest height, the other wing resting near the body, confident and trustworthy expression, same bright living room as before.\n" +
      "2. The owl gives one small, deliberate nod toward the camera, as if confirming a final recommendation.\n" +
      "3. The owl's gaze stays fixed and confident on the camera, no smiling.\n" +
      "4. Feathers show subtle, natural micro-movement — no exaggerated bouncing.",
      "The two-toned pie chart split stays exactly as in the reference image — no numbers or labels ever appear on it.",
    ),
    requiredKeywords: [...REQUIRED_KEYWORDS_COMMON, { key: "no numbers or labels ever appear", label: "텍스트/숫자 금지(HC-10)" }],
  },
};
