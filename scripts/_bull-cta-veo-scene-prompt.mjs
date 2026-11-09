/**
 * 황소특보(bull3dv1) 고정 CTA(단일 클립) 영상 모션 프롬프트 — v2 재작업.
 *
 * v1의 3가지 결함을 수정한다(Owner 지적, 2026-09-23):
 *   1. 배경: 서재+도심야경(캐릭터 디자인 확정용) → 현대적 트레이딩룸/뉴스룸
 *      (bull_cta_bg_v2.png, 숫자/종목명 없는 추상 차트 그래픽)로 교체.
 *   2. 입 움직임 누락: `_ai/CURRENT_STANDARDS.md`의 "영상 생성 프롬프트
 *      5요소" ⑤번 표준 문구("mouth actively opens and closes continuously...
 *      never static, never barely-moving, never closed-mouth talking")가
 *      v1에는 전혀 없었다(전수 grep으로 확인, 이 프로젝트 어디에도 이
 *      정확한 문구가 없었음) — 나레이션이 있는 CTA인데 입이 안 움직이는
 *      결과물이 나왔다. 이번엔 긍정 프롬프트(액션 시퀀스)와 부정 프롬프트
 *      (ABSOLUTE_RULES) 양쪽에 정확히 포함시킨다.
 *   3. 채널명 워터마크는 이 프롬프트가 아니라 조립 단계(ffmpeg drawtext)에서
 *      처리 — 이 파일과 무관.
 *
 * 참조 이미지: C:/tmp/bull-cta-fixed-v2/ref/bull_cta_bg_v2.png (canonical
 * reference와 얼굴/색/비율 동일, 배경만 교체된 새 정지 이미지). 포즈는 기존과
 * 동일(오른손 검지로 위를 가리키고, 왼손은 허리에 얹은 채 밝게 웃음).
 *
 * §0 절대규칙 대조:
 * - 규칙1(작은 글씨 금지): 배경 모니터 그래픽은 숫자/글자가 전혀 없는 추상
 *   차트 도형뿐이므로 안전. 모션 프롬프트에서 이 화면을 확대·클로즈업하지
 *   않는다.
 * - 규칙2(소품 그립): 이 CTA는 소품을 들지 않는다(양손 모두 맨손) — 해당 없음.
 * - 규칙3(빈 면 금지): 새 배경도 디스플레이 월+유리 인테리어로 채워져 있어
 *   크고 빈 면이 없음.
 * - 5요소 ⑤(입 움직임 필수): 아래 반영.
 */

const STYLE_LOCK =
  "Render style must stay EXACTLY as in the reference image: a stylized 3D-animated chibi mascot illustration (Pixar/DreamWorks-style CG render) with a soft, glossy, rounded toy-like metallic-gold material and warm studio/interior lighting. This is NOT a photograph and NOT photorealistic — do NOT add photographic fur/skin micro-detail, do NOT add realistic camera lens depth-of-field grain, do NOT shift the lighting or materials toward realism. The output must look like a frame from a 3D animated film, not a live-action or photoreal render.";

// 황소특보 외형 고정: 골드색 SD비율 황소, 큰 뿔, 넓적한 주둥이, dewlap, 안경
// (선글라스 아님, 실제로 착용), 흰 셔츠+넥타이+네이비 바지(재킷 없음) —
// _bull-character-design-v8-spec.mjs 확정 스펙과 canonical reference 이미지
// 기준. 배경은 v2에서 현대적 트레이딩룸/뉴스룸으로 교체됨(숫자/종목명 없는
// 추상 차트 그래픽 월, 유리·메탈 인테리어, 파란/흰색 조명).
const CHARACTER_LOCK_BULL_CTA =
  "Keep the bull mascot character's appearance exactly as in the reference image — a cute chibi/super-deformed young bull with a warm metallic-gold body, large thick curved horns, a broad flat bull muzzle/snout, small rounded ears, and a small soft dewlap under the chin. The character wears a pair of rectangular wire-rim glasses actually worn over the eyes (not sunglasses, not pushed up on the forehead), a crisp white dress shirt with a dark red necktie, dark navy dress pants, and brown dress shoes — no suit jacket. The character keeps its bright, cheerful, wide-open grin (large round glossy eyes with bright highlight dots) throughout — warm and welcoming, not stern. Do NOT change the character design, outfit, proportions, or colors. The modern glass-and-metal trading-room/newsroom background — the abstract decorative chart shapes on the monitor screens, the cool blue/white studio lighting, the city skyline visible through the glass — must stay exactly as shown, with no readable text or numbers appearing on the screens.";

const CAMERA_LOCK =
  "Continuous medium shot, camera stays mostly stable with only a very subtle handheld breathing motion. 9:16 vertical format. No camera cut, zoom, or pan — one continuous shot. Camera framing (character occupying roughly 50-55% of frame height, background elements clearly visible above, beside, and below) must match the reference image exactly.";

// §0 5요소 ⑤(입 움직임 필수): CURRENT_STANDARDS.md 표준 문구를 그대로 포함.
// 긍정 프롬프트(아래 buildPrompt의 action sequence)와 부정 프롬프트(여기)
// 양쪽에 대응 문구를 넣는다.
const MOUTH_MOVEMENT_NEGATIVE_NOTE =
  "The mouth must never stay static, never be barely-moving, and never look like closed-mouth talking — it should be clearly, continuously opening and closing in sync with active speech throughout the entire clip.";

const ABSOLUTE_RULES_SUFFIX_BULL_CTA =
  "No new text, numbers, subtitles, logos, or UI ever appear anywhere in frame. Do not add, change, or sharpen any text on the background chart monitor screens — keep them as purely abstract chart shapes with zero readable text, exactly as rendered in the reference image. No new person, hand, or object enters the frame. The character's face, outfit, and proportions must not distort or morph. Expression stays warm and smiling throughout — do not let it drift into a neutral or serious expression. The render style must not shift toward photorealism — see style lock above. Hands stay empty throughout — no props are held. " +
  MOUTH_MOVEMENT_NEGATIVE_NOTE;

const REQUIRED_KEYWORDS_BULL_CTA = [
  { key: "bull mascot character's appearance exactly", label: "캐릭터 외형 고정" },
  { key: "No camera cut, zoom, or pan", label: "단일 컷 고정" },
  { key: "bright, cheerful, wide-open grin", label: "미소 유지" },
  { key: "This is NOT a photograph and NOT photorealistic", label: "실사화 방지(스타일 고정)" },
  { key: "Hands stay empty throughout", label: "소품 없음(그립 이슈 해당 없음)" },
  { key: "mouth actively opens and closes continuously", label: "입 움직임 필수(5요소 ⑤)" },
  { key: "never static, never barely-moving, never closed-mouth talking", label: "입 움직임 부정프롬프트(5요소 ⑤)" },
];

function buildPrompt(actionSequence, extraAbsoluteRule) {
  const rules = extraAbsoluteRule ? `${extraAbsoluteRule} ${ABSOLUTE_RULES_SUFFIX_BULL_CTA}` : ABSOLUTE_RULES_SUFFIX_BULL_CTA;
  return `Animate this 3D character illustration. ${STYLE_LOCK} ${CHARACTER_LOCK_BULL_CTA}\n\nCAMERA_LOCK\n\nACTION SEQUENCE:\n${actionSequence}\n\nABSOLUTE RULES:\n${rules}`.replace(
    "CAMERA_LOCK",
    CAMERA_LOCK,
  );
}

// 단일 CTA 클립(follow+teaser 통합, Owner 확정) — 나레이션: "실시간 시황,
// 놓치면 손해야. 팔로우해두면 장 열리자마자 가장 먼저 받아볼 수 있어 —
// 황소특보였어." (rawAudioDurationSec 6.5s → 8초 이내 티어).
// 참조 이미지에 이미 확정된 포즈(오른손을 들어 검지로 위쪽을 향해 뻗고,
// 왼손은 허리에 얹은 채 밝게 웃는 자세)를 그대로 유지한 채, 규칙2에 따라
// 동작은 소품을 들지 않은 손에만 배정한다(이 캐릭터는 애초에 두 손 모두
// 비어 있으므로 별도 제약 없이 자유롭게 움직여도 안전하다).
export const BULL_CTA_VEO_SCENE = {
  bull_cta_fixed_follow_teaser: {
    id: "bull_cta_fixed_follow_teaser",
    refImage: "C:/tmp/bull-cta-fixed-v2/ref/bull_cta_bg_v2.png",
    outputName: "bull_cta_fixed_follow_teaser_motion.mp4",
    prompt: buildPrompt(
      "1. The bull is already standing with a bright, wide-open cheerful grin, one arm raised with the index finger pointed upward and slightly forward, exactly as in the reference image, the other hand resting on the hip. Hold this exact arm angle and pose throughout — do not retract or re-extend the raised arm.\n" +
      "2. The raised pointing finger makes a small, gentle repeating motion — a subtle few-degree tap/bounce at the wrist and fingertip only, like an energetic 'listen up, follow me' gesture, while the raised arm's overall angle stays locked in place.\n" +
      "3. The head tilts very slightly with an enthusiastic, confident nod, as if excitedly urging the viewer not to miss out, grin constant and bright throughout.\n" +
      "4. The mouth actively opens and closes continuously as if speaking energetically the entire time — never static, never barely-moving, never closed-mouth talking — clearly synced to an enthusiastic, fast-paced breaking-news delivery.\n" +
      "5. Subtle natural micro-movement in the fur/body (breathing, light settling, ears twitching slightly) — no exaggerated bouncing. The hand resting on the hip stays relaxed and still.",
      "No blank screens or props are needed — both hands are empty throughout, one raised pointing, one resting on the hip. Do not change the raised arm's angle or position from the reference image.",
    ),
    requiredKeywords: REQUIRED_KEYWORDS_BULL_CTA,
  },
};
