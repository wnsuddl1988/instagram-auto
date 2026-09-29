/**
 * 고정 CTA(채널 유입용) 영상 모션 프롬프트.
 *
 * 2편 콘텐츠 장면(_owl-ep2-veo-scene-prompts.mjs)과 안전장치(STYLE_LOCK/
 * CAMERA_LOCK/ABSOLUTE_RULES_SUFFIX)는 재사용하되, CHARACTER_LOCK과
 * ABSOLUTE_RULES_SUFFIX의 표정 지시만 CTA 전용으로 뒤집는다 — 콘텐츠 장면은
 * "날카로운 무표정 유지(미소 금지)"가 원칙이지만, 이 CTA 장면은 정반대로
 * "밝고 다정한 미소"가 핵심 요구사항이다(2026-09-17 Owner 확정: 시청자를
 * 반기며 팔로우를 유도하는 장면이므로 무표정이면 안 됨).
 *
 * 참조 이미지는 owl3dv5-canonical-reference.png 최종본(발목 링·미소·손짓·
 * 프레임 비율까지 전부 확정된 상태) 자체를 그대로 쓴다 — 이 이미지가 이미
 * "정지 상태의 목표 프레임"이므로, 모션 프롬프트는 그 안에서 미세한 동작만
 * 추가한다.
 */

const STYLE_LOCK =
  "Render style must stay EXACTLY as in the reference image: a stylized 3D-animated character illustration (Pixar/DreamWorks-style CG render) with smooth, slightly soft toy-like material shading and simplified studio lighting. This is NOT a photograph and NOT photorealistic — do NOT add photographic skin/feather micro-detail, do NOT add realistic camera lens depth-of-field grain, do NOT shift the lighting or materials toward realism. The output must look like a frame from a 3D animated film, not a live-action or photoreal render.";

// CTA 전용: 표정을 미소로 명시 — 콘텐츠 장면의 "no smiling" 지시를 쓰지 않는다.
const CHARACTER_LOCK_CTA =
  "Keep the owl analyst character's appearance exactly as in the reference image — same charcoal waistcoat, burgundy tie and pocket square, black sunglasses resting on the forehead, small gold ring on one talon. The character keeps its warm, friendly smile (eyes gently curved, beak slightly upturned) throughout — this is intentional for this welcoming CTA scene, unlike the sharp neutral expression used in other content scenes. Do NOT change the character design, outfit, or colors.";

const CAMERA_LOCK =
  "Continuous medium shot, camera stays mostly stable with only a very subtle handheld breathing motion. Silent, 9:16 vertical format. No camera cut, zoom, or pan — one continuous shot. Camera framing (character occupying roughly 50-55% of frame height, background elements clearly visible) must match the reference image exactly.";

// CTA 전용: "no smiling, no smirking" 대신 미소 유지 지시로 교체.
const ABSOLUTE_RULES_SUFFIX_CTA =
  "No new text, numbers, subtitles, logos, or UI ever appear anywhere in frame. No new person, hand, or object enters the frame. The character's face, outfit, and proportions must not distort or morph. Expression stays warm and smiling throughout — do not let it drift into a neutral or serious expression. The render style must not shift toward photorealism — see style lock above.";

const REQUIRED_KEYWORDS_CTA = [
  { key: "owl analyst character's appearance exactly", label: "캐릭터 외형 고정" },
  { key: "No camera cut, zoom, or pan", label: "단일 컷 고정" },
  { key: "warm and smiling throughout", label: "미소 유지(CTA 전용, 무표정 금지 아님)" },
  { key: "This is NOT a photograph and NOT photorealistic", label: "실사화 방지(스타일 고정)" },
];

function buildPrompt(actionSequence, extraAbsoluteRule) {
  const rules = extraAbsoluteRule ? `${extraAbsoluteRule} ${ABSOLUTE_RULES_SUFFIX_CTA}` : ABSOLUTE_RULES_SUFFIX_CTA;
  return `Animate this 3D character illustration. ${STYLE_LOCK} ${CHARACTER_LOCK_CTA}\n\n${CAMERA_LOCK}\n\nACTION SEQUENCE:\n${actionSequence}\n\nABSOLUTE RULES:\n${rules}`;
}

// 3편부터 교체하는 밝은 톤 CTA(2026-09-18 Owner 확정) — 1·2편에 이미 게시된
// 위 owl_cta_signature/owl_cta_teaser(어두운 네이비 야간 뉴스룸)는 그대로
// 보존하고, 3편부터는 아래 bright 버전으로 전체 교체한다. 기준 이미지는
// probe-character-consistency-chatgpt-v1.mjs --owl-cta-bright-v2 로 생성한
// 화이트·라이트베이지·소프트골드 톤 뉴스룸 2장(follow: 정면+검지로 아래 가리키기,
// teaser: 측면에 가까운 구도)이다. 손짓/카메라 앵글은 이미 정지 이미지에
// 확정돼 있으므로, 모션 프롬프트는 그 포즈를 유지한 채 미세한 동작만 추가한다.
const CHARACTER_LOCK_CTA_BRIGHT =
  "Keep the owl analyst character's appearance exactly as in the reference image — same charcoal waistcoat, burgundy tie and pocket square, black sunglasses resting on the forehead, small gold ring on one talon. The character keeps its warm, friendly smile (eyes gently curved, beak slightly upturned) throughout. Do NOT change the character design, outfit, or colors. The bright, warm-toned newsroom background (white/light-beige/soft-gold tones) must stay exactly as shown — do NOT drift back toward a dark navy night-time look.";

function buildBrightPrompt(actionSequence, extraAbsoluteRule) {
  const rules = extraAbsoluteRule ? `${extraAbsoluteRule} ${ABSOLUTE_RULES_SUFFIX_CTA}` : ABSOLUTE_RULES_SUFFIX_CTA;
  return `Animate this 3D character illustration. ${STYLE_LOCK} ${CHARACTER_LOCK_CTA_BRIGHT}\n\n${CAMERA_LOCK}\n\nACTION SEQUENCE:\n${actionSequence}\n\nABSOLUTE RULES:\n${rules}`;
}

export const OWL_CTA_VEO_SCENE = {
  owl_cta_signature: {
    id: "owl_cta_signature",
    refImage: "C:/tmp/owl-cta-final/owl_cta_signature.png",
    outputName: "owl_cta_signature_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already standing with a warm, friendly smile, one wing extended forward with the index finger pointed downward toward the bottom of the screen, as if pointing at a follow button below the frame.\n" +
      "2. The pointing gesture makes a small, gentle repeating motion — the wing dips slightly down and back up once, like a soft inviting tap, while the smile stays constant.\n" +
      "3. The head tilts very slightly, a warm and inviting nod, as if genuinely welcoming the viewer.\n" +
      "4. Feathers show subtle, natural micro-movement (breathing, light settling) — no exaggerated bouncing. The other wing stays relaxed at the side.",
      "No blank screens or props are needed — hands are empty throughout.",
    ),
    requiredKeywords: REQUIRED_KEYWORDS_CTA,
  },
  // 고정 CTA(owl_cta_signature, "팔로우해두면 다음 이야기도 가장 먼저
  // 만나볼 수 있어"로 끝남) 뒤에 이어붙이는 8초 예고 클립. 대본(Owner 확정
  // 2026-09-18): "다음 편엔 우리 지갑을 또 뭐가 건드릴지, 알짜만 골라올게.
  // 경제번역소였어." — 이미 팔로우 유도는 끝난 뒤라 손가락으로 가리키는
  // 동작을 반복하지 않는다. 대신 다음 편을 기대하게 만드는 여운 있는 예고
  // 동작(먼 곳을 보다가 다시 카메라로 시선을 돌리는 티저 제스처)과, 마지막
  // 소절("경제번역소였어")에 맞춘 담백한 사인오프 인사로 마무리한다.
  owl_cta_teaser: {
    id: "owl_cta_teaser",
    refImage: "C:/tmp/owl-cta-final/owl_cta_signature.png",
    outputName: "owl_cta_teaser_motion.mp4",
    prompt: buildPrompt(
      "1. The owl is already standing with a warm, friendly smile, both wings resting calmly at its sides, continuing naturally from the previous welcoming pose.\n" +
      "2. The owl's gaze drifts briefly off to the side as if thinking ahead to something exciting coming next, eyebrows lifting slightly with anticipation — still smiling.\n" +
      "3. The gaze returns to look directly at the camera with a confident, reassuring smile, as if promising something good is coming.\n" +
      "4. In the final moment, the owl gives one small, warm nod — a gentle sign-off gesture — while feathers show subtle, natural micro-movement (breathing, light settling), no exaggerated bouncing.",
      "No blank screens or props are needed — hands are empty throughout. No pointing gesture in this scene — the previous scene already covered that.",
    ),
    requiredKeywords: REQUIRED_KEYWORDS_CTA,
  },
  // 밝은 톤 CTA #1 — 팔로우 유도. 나레이션: "어려운 경제 뉴스를 내 지갑
  // 얘기로 매번 쉽게 번역해주는 경제번역소, 팔로우해두면 다음 이야기도
  // 가장 먼저 만나볼 수 있어." 기준 이미지에 이미 팔을 완전히 뻗어 검지로
  // 아래를 가리키는 자세가 확정돼 있으므로, 모션은 그 팔을 유지한 채
  // 작은 반복 동작만 더한다(팔을 다시 접었다 펴는 큰 동작 금지 — 참조
  // 이미지의 팔 각도가 흐트러지면 안 됨).
  owl_cta_bright_follow: {
    id: "owl_cta_bright_follow",
    refImage: "C:/tmp/owl-cta-bright-v2/owl_cta_bright_follow.png",
    outputName: "owl_cta_bright_follow_motion.mp4",
    prompt: buildBrightPrompt(
      "1. The owl starts already in the reference pose: warm smile, one wing fully extended straight down and outward at roughly 45+ degrees from the body, index finger pointed at the bottom of the screen toward a follow button below the frame. Hold this exact arm angle throughout — do not retract or re-extend the arm.\n" +
      "2. The pointing finger makes a small, gentle repeating tap motion — a subtle few-degree dip and return at the wrist/fingertip only, like a soft inviting tap, while the extended arm angle stays locked in place.\n" +
      "3. The head tilts very slightly, a warm and inviting nod, as if genuinely welcoming the viewer, smile constant throughout.\n" +
      "4. Feathers show subtle, natural micro-movement (breathing, light settling) — no exaggerated bouncing. The other wing stays relaxed at the side.",
      "No blank screens or props are needed — hands are empty throughout. Do not change the extended arm's angle or position from the reference image.",
    ),
    requiredKeywords: REQUIRED_KEYWORDS_CTA,
  },
  // 밝은 톤 CTA #2 — 다음 편 예고. 나레이션: "다음 편엔 우리 지갑을 또
  // 뭐가 건드릴지, 알짜만 골라올게. 경제번역소였어." (7.7초, 8초 규칙
  // 준수). 기준 이미지에 이미 90도에 가까운 측면(profile) 구도가 확정돼
  // 있으므로, 카메라 앵글은 그대로 두고 얼굴 방향/시선과 사인오프 동작만
  // 움직인다.
  owl_cta_bright_teaser: {
    id: "owl_cta_bright_teaser",
    refImage: "C:/tmp/owl-cta-bright-v2/owl_cta_bright_teaser.png",
    outputName: "owl_cta_bright_teaser_motion.mp4",
    prompt: buildBrightPrompt(
      "1. The owl starts already in the reference pose: body turned to a near-profile side view (roughly 90 degrees), face turned only slightly (about 15 degrees) back toward the camera so one eye meets the viewer, warm smile, both wings resting calmly at its sides.\n" +
      "2. The owl's gaze drifts briefly further away toward the window/cityscape as if thinking ahead to something exciting coming next, eyebrows lifting slightly with anticipation — still smiling, body angle staying in profile.\n" +
      "3. The gaze returns to meet the camera again with a confident, reassuring smile, as if promising something good is coming — body still in the same near-profile angle as the reference image.\n" +
      "4. In the final moment, the owl gives one small, warm nod — a gentle sign-off gesture, timed to land on the last beat of the line — while feathers show subtle, natural micro-movement (breathing, light settling), no exaggerated bouncing.",
      "No blank screens or props are needed — hands are empty throughout. No pointing gesture in this scene. Do not rotate the body back toward a frontal angle — keep the near-profile framing from the reference image throughout.",
    ),
    requiredKeywords: REQUIRED_KEYWORDS_CTA,
  },
};
