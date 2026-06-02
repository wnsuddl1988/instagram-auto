import OpenAI from "openai";

// 빌드 시점이 아닌 런타임에만 초기화 (Vercel 빌드 호환)
function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// 하위 호환성을 위한 named export (런타임에서만 사용)
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "placeholder-for-build",
});

export interface GenerateScriptParams {
  categoryId: string;
  categoryName: string;
  systemPrompt: string;
  duration: 15 | 30 | 60;
  tone: "유머" | "정보전달" | "충격" | "감성";
  useAiImage?: boolean;
}

export interface Scene {
  text: string;
  videoSearchQuery: string;
  imageGenPrompt: string;
}

export interface GeneratedScript {
  title: string;
  script: string;
  hashtags: string[];
  hook: string;
  callToAction: string;
  estimatedDuration: number;
  scenes: Scene[];
  id?: string;
  video_path?: string;
}

export interface ReelV2Scene {
  sceneNumber: number;
  durationSec: number;
  narration: string;
  caption: string;
  emphasis: string;
  imagePrompt: string;
  fallbackSearchQuery: string;
  motion:
    | "alive"
    | "character_breathe"
    | "character_pulse"
    | "character_nod"
    | "character_talk"
    | "slow_zoom_in"
    | "slow_zoom_out"
    | "pan_left"
    | "pan_right"
    | "hold";
  /**
   * emotional_story 전용: 시각 앵커 ID.
   * 같은 anchorId를 가진 씬은 첫 번째 씬의 이미지를 재사용해 시각적 연속성을 만든다.
   * reuseAnchorImages: true (기본값) 일 때 활성화.
   * 없으면 씬마다 독립 이미지 생성 (기존 동작).
   */
  visualAnchorId?: string;
}

export interface ReelV2Meta {
  categoryId: string;
  categoryName: string;
  subTopicId?: string;
  subTopicName?: string;
  topicMode: "preset" | "custom" | "random";
  concreteTopic?: string;
  customTopic?: string;
  storySeedTopic?: string;
  variationContext?: string;
  accountPreset?: {
    id: string;
    name: string;
    description: string;
    targetAudience: string;
    toneMemo: string;
    bannedTopics: string[];
    preferredSubTopicIds: string[];
  } | null;
  generatedAt: string; // ISO 8601
}

export interface GeneratedReelV2 {
  title: string;
  topTitle: string;
  subtitle?: string;
  script: string;
  hook: string;
  callToAction: string;
  hashtags: string[];
  targetAudience: string;
  visualStyle: string;
  estimatedDuration: number;
  scenes: ReelV2Scene[];
  /** 생성 컨텍스트 메타데이터 — 히스토리/운영 분석용 */
  _meta?: ReelV2Meta;
  // 하위 호환 필드 (기존 코드 유지)
  _referenceStyle?: string;
  _storySeedTopic?: string;
  _concreteTopic?: string;
  _topicMode?: string;
  _subTopicId?: string;
  _categoryId?: string;
}

export async function generateScript(
  params: GenerateScriptParams
): Promise<GeneratedScript> {
  const { categoryName, systemPrompt, duration, tone, useAiImage } = params;

  // 씬 수 자동 계산
  const sceneCount = duration === 15 ? 4 : duration === 30 ? 7 : 12;

  const userPrompt = `
카테고리: ${categoryName}
영상 길이: ${duration}초 분량
톤: ${tone}
useAiImage: ${useAiImage ? "true" : "false"}

중요 요구사항:
1. **[극강 규칙]** 전체 script의 대본 내용은 scenes 배열 안에 있는 모든 text를 하나로 합친 것과 단 한 글자도 다르지 않고 100% 일치해야 합니다. (영상 싱크용 필수)
2. **[극강 규칙]** imageGenPrompt 작성 시 무조건 마지막에 ', cinematic lighting, Unreal Engine 5, 8k resolution, highly detailed, masterpiece, photorealistic'을 붙여 옛날 사진 느낌을 완벽히 없애세요.
3. **[극강 규칙]** videoSearchQuery 작성 시 무조건 'aesthetic, cinematic, 4k' 같은 고화질 감성 키워드를 붙이세요. (예: "aesthetic cinematic sunset 4k", "cinematic portrait 4k aesthetic")
4. **[극강 규칙]** 기승전결(후킹 → 흥미 전개 → 절정 → 결말)이 명확하고 흡입력 있는 스토리텔링으로 작성하세요. 각 씬이 유기적으로 연결되어야 함.
5. 씬별 text는 반드시 15자 이내 (자막 가독성 최우선)
6. useAiImage가 true인 경우 imageGenPrompt를 매우 구체적으로 작성
7. 감정 곡선: 1씬=충격·궁금증 유발 / 중간씬=공감·정보 전달 / 마지막씬=감동·저장CTA
8. 씬 수를 정확히 ${sceneCount}개 맞출 것

아래 JSON 형식으로 반드시 응답해줘. JSON 외 다른 텍스트 절대 금지:
{
  "title": "유튜브/인스타 제목 (35자 이내, 클릭하고 싶게)",
  "hook": "첫 3초 후킹 멘트 (시청자가 스크롤 멈추게 만드는 강렬한 첫 마디)",
  "script": "본문 스크립트 전체 (${duration}초 분량, 자연스러운 구어체, 자막용)",
  "callToAction": "마지막 팔로우/구독 유도 멘트 (5초 이내)",
  "hashtags": ["해시태그1", "해시태그2", "해시태그3", "해시태그4", "해시태그5"],
  "estimatedDuration": ${duration},
  "scenes": [
    {
      "text": "자막 텍스트 (15자 이내)",
      "videoSearchQuery": "영어 키워드 (예: cinematic slow motion)",
      "imageGenPrompt": "Pollinations.ai Flux용 상세 영어 프롬프트"
    }
  ]
}

주의: scenes 배열은 정확히 ${sceneCount}개 항목을 포함해야 함
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.9,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("GPT 응답이 비어있습니다.");

  return JSON.parse(content) as GeneratedScript;
}

export async function generateReelV2Plan(params: {
  categoryName: string;
  targetAudience: string;
  duration?: 30 | 45 | 60;
  tone?: string;
  referenceStyle?: "ai_character_tips" | "wealth_mindset" | "emotional_story" | "living_tips";
  /** emotional_story 전용: 서버에서 직접 선택한 소재 씨앗. 있으면 GPT의 자유 선택을 막고 이 소재로 강제 고정. */
  storySeedTopic?: string;
  /**
   * 구체 주제: 카테고리/소주제 선택 또는 사용자 직접 입력값.
   * 있으면 GPT가 이 주제를 중심으로 콘티를 생성한다.
   * emotional_story의 경우 storySeedTopic과 함께 사용 가능 (concreteTopic이 더 세부적).
   */
  concreteTopic?: string;
  /**
   * 소재 변주 컨텍스트: subTopic + contentAngle + targetSituation 조합 문자열.
   * 있으면 GPT가 같은 소주제 안에서 각도를 달리해 변주 생성.
   */
  variationContext?: string;
  /** 운영 프리셋 이름 (프롬프트 context용) */
  accountPresetName?: string;
  /** 운영 프리셋 타겟 독자 (category 기본값보다 우선) */
  accountTargetAudience?: string;
  /** 운영 프리셋 톤 메모 (category 기본값보다 우선) */
  accountToneMemo?: string;
  /** 운영 프리셋 금지 소재 목록 */
  bannedTopics?: string[];
}): Promise<GeneratedReelV2> {
  const {
    categoryName,
    targetAudience,
    duration = 45,
    tone = "차분하지만 몰입감 있게",
    referenceStyle = "ai_character_tips",
    storySeedTopic,
    concreteTopic,
    variationContext,
    accountPresetName,
    accountTargetAudience,
    accountToneMemo,
    bannedTopics,
  } = params;

  // emotional_story: TTS가 길어지는 경향이 있어 씬 수를 일반보다 줄임
  // living_tips: 10씬 고정 (훅1 + 실수2~3 + 해결4~7 + 보너스8~9 + CTA10)
  const sceneCount =
    referenceStyle === "emotional_story"
      ? duration <= 30 ? 9 : duration <= 45 ? 10 : 12
      : referenceStyle === "living_tips"
      ? 10
      : duration <= 30 ? 11 : duration <= 45 ? 14 : 18;
  const styleGuide =
    referenceStyle === "living_tips"
      ? `A practical Korean lifestyle tips reel — clean, informative, and actionable:
- Visual style: clean household object photography style. Real-life kitchen / fridge / bathroom / laundry items. Clear focus on the tip object. No cartoon characters. No AI 3D chibi.
- Each scene shows the ACTUAL object or action relevant to the tip — fridge shelf, cutting board, detergent bottle, food container, etc.
- imagePrompt style: "clean practical household object, soft studio lighting, minimal clean background, 9:16 portrait, no text, no logo, no people, clear object focus"
- Scene beat structure (STRICT — follow this order):
  · Scene 1 (hook): Bold opening that stops scrolling — "이거 아직도 이렇게 하세요?" / "대부분 이 실수 합니다" style. 1~2초 안에 궁금증 자극.
  · Scenes 2~3 (mistake): Show the common wrong way people do it. Relatable, not shaming.
  · Scenes 4~7 (solution): Step-by-step correct method. Each scene = one clear action.
  · Scenes 8~9 (bonus/result): Before/after contrast, extra tip, or why it works.
  · Scene 10 (CTA): "저장해두면 유용해요" / "공유하면 도움돼요" style closing.
- Narration tone: clear, friendly, practical — like a helpful neighbor sharing a discovery. NOT emotional. NOT sad. NOT dramatic.
- imageMode recommendation: pollinations-only or free-first (Imagen paid plan NOT required for this category).`
      : referenceStyle === "wealth_mindset"
      ? "A premium financial motivation reel: black negative space, documentary/interview inserts, gold/white emphasis typography, calm authoritative narration."
      : referenceStyle === "emotional_story"
        ? `A warm hand-drawn animated Korean emotional story reel:
- Visual style: warm hand-drawn cinematic animation, soft watercolor background, nostalgic family story feel, gentle pastel colors, cozy indoor lighting, emotional storybook illustration. Think moving picture-book frames, not photorealistic renders.
- Characters: expressive but simple — back view, small figure in a room, hands holding an object, silhouette by a window. Small figures walking or sitting are fine. No close-up faces, no realistic face detail.
- Visual language: the story's central object (wallet, photo, letter, lunchbox, key, etc.) must appear in every scene's imagePrompt. Each scene should feel like the NEXT FRAME of the same illustrated story — same cozy room, same warm palette, different moment.
- Scene visual beats (wallet+photo story example — adapt to the actual story object):
  Scene 1: worn leather wallet on a wooden desk in a cozy room, warm afternoon light, hand-drawn storybook style
  Scene 2: adult hands opening an old wallet, faded photo peeking out, soft watercolor tones
  Scene 3: elderly man's hands holding faded old photo, face not visible, gentle storybook lighting
  Scene 4: back view of adult figure looking at photo, quiet room, warm pastel glow
  Scene 5: close-up of photo corner, worn edges, soft painted texture, no faces
  Scene 6: worn leather wallet and old photo on weathered wooden table, dawn light, watercolor wash
  Scene 7: back of old photo, plain painted surface with soft faded marks, storybook illustration
  Scene 8: adult hands cradling photo close, emotional close-up, hand-drawn detail
  Scene 9: wallet and photo beside an old coat on wooden table, nostalgic room ambiance
  Scene 10: adult hands gently tucking photo into a wallet, warm morning light, story ending frame
- Narration style (CRITICAL): quiet personal diary tone — a close friend sharing a heartfelt memory. NOT news narration, NOT documentary explainer, NOT lecture. Sentences must feel soft, warm, with natural breathing pauses (use commas deliberately for pause placement).`
      : `A high-quality AI character lifestyle reel matching Korean Instagram Reels reference style (인스타 13/14 기준):
- ONE expressive, cute 3D/illustrated OBJECT character per scene (e.g., a fridge, a tube of sunscreen, a bottle of soy sauce) — not a human.
- The character should have a face and a personality: eyes, expression, a subtle personality posture.
- Cinematic clean background — solid pastel or gradient, never cluttered.
- Motion feel: the character looks ALIVE — slight lean, tilt, or reach — captured in a single still.
- Short, punchy captions like viral Korean reels (e.g., "수박은 따로", "입구를 닦아요").
- Narration is conversational, warm, slightly surprising — like a knowledgeable friend talking, not a lecture.`;

  // ── referenceStyle별 품질 규칙 블록 ────────────────────────────────
  const qualityBar =
    referenceStyle === "living_tips"
      ? `
Quality bar — LIVING TIPS rules (QA-LH-2 강화 기준 — all mandatory):

⚠️ 감동사연(emotional_story) 기준 적용 금지:
- 반전/여운/감정축/장면 연속성 같은 감동사연 평가 기준은 이 카테고리에 해당 없음.
- 이미지-내레이션 감정 정합성 불필요. 오브젝트-행동 정합성만 필요.

STORY STRUCTURE RULES (anti-listicle — mandatory, QA-LH-8 피드백 반영):
Do NOT create a listicle of items (Top 5 / Top 10 / A, B, C, D 나열) unless the user explicitly requests a numbered list.
Even if the topic says "TOP 5" or "5가지", reframe it into ONE mini problem-solving story.

The video MUST feel like a mini story arc — not a slideshow of facts:
  Act 1 (scenes 1~3): "나도 이런 문제 겪었는데 → 원인이 이거였네" (공감 → 숨은 원인)
  Act 2 (scenes 4~6): "이렇게 바꾸면 해결되네" (행동 변화)
  Act 3 (scenes 7~9): "바꾸면 이렇게 달라짐 → 주의사항 → 한 줄 규칙" (결과 + 정리)
  CTA (scene 10): "저장하고 오늘 바로 해보세요" (행동 유도)

Each scene must change the viewer's understanding from the previous scene:
  ✅ scene 2 → 3: "이 행동이 왜 문제인지" 원인 reveal
  ✅ scene 6 → 7: "바꾸면 구체적으로 뭐가 달라지는지" 결과
  ❌ "유제품도 안 됩니다 → 과일도 안 됩니다 → 채소도 안 됩니다" — 같은 규칙 반복 금지

TOPIC REFRAME rule (listicle 방지):
  ❌ "냉장고 문칸 금지 식재료 TOP 5" → ✅ "왜 냉장고에 넣었는데도 빨리 상할까?"
  ❌ "흰 옷 황변 없애는 방법" → ✅ "흰 옷을 망치는 세탁 실수, 지금도 하고 있어요"
  ❌ "냉장고 정리법" → ✅ "냉장고 문칸에 뭘 넣는지가 식재료 유통기한을 바꿔요"

SCENE STRUCTURE (mandatory — follow exactly):
- Scene 1 (공감형 문제 제기): 시청자가 지금 겪고 있을 법한 이상한 현상 또는 문제.
  Hook MUST use at least ONE of these 6 patterns (mandatory):
    A. 금지형: "[오브젝트/행동]하면 안 됩니다" / "바로 넣지 마세요" / "더 망가집니다"
    B. 손실형: "더 빨리 상합니다" / "전기세 더 나옵니다" / "돈 버립니다"
    C. 반전형: "[상식]인 줄 알았는데 반대입니다" / "이게 오히려 더 나빠요"
    D. 타깃형: "[문제 겪는 분들], 이게 원인이에요"
    E. 즉시성형: "지금 바로 확인하세요" / "오늘 저녁에 꼭 해보세요"
    F. 비교형: "대부분 이 방법이 틀렸어요" / "찬물 vs 뜨거운 물, 결과 달라요"
  Hook self-check (BOTH must be YES — if no, rewrite):
    1. "이 hook을 본 시청자가 '혹시 나도 잘못하고 있나?'라고 느끼는가?"
    2. "상식을 뒤집는 요소 또는 구체적 손실 경고가 있는가?"
  ⚠️ Scene 1 narration — 명령형 단독 시작 금지:
    ❌ BAD (명령/선언으로만 시작 — 공감 없음):
      "문칸에 달걀 넣는 집, 오늘 바로 바꾸세요." — 명령형 시작, 시청자 공감 없음
      "흰 옷 황변, 이 방법으로 5분이면 없어집니다!" — 결과보장형, 패턴 없음
      "오늘은 냉장고 정리법을 알려드릴게요." — 도입형
    ✅ GOOD (경험/질문/현상으로 시작 — 공감 먼저):
      "냉장고에 넣었는데도 음식이 빨리 상하나요?" [타깃형D]
      "달걀을 샀는데 며칠 만에 비린내가 난 적 있나요?" [타깃형D]
      "수건을 빨았는데도 냄새가 다시 올라오나요?" [타깃형D]
      "전자레인지 기름때, 닦아도 다시 끈적이나요?" [타깃형D]
      "흰 옷을 빨수록 더 누렇게 느껴지나요?" [타깃형D + 반전형C]
  ❌ 도입형 절대 금지: "오늘은 보관법을 알아볼게요" / "유용한 팁입니다" / "함께 볼까요"
  ⚠️ 과장/공포 마케팅 금지: 신뢰감 있는 생활꿀팁 톤 유지. 사실 기반 경고만 허용.
  고후킹 소재 angle 힌트:
    냄새 / 곰팡이 / 세균 / 전기세 / 빨리 상함 / 누렇게 변함 / 물때·기름때 / 옷 손상 / 음식물 낭비
- Scene 2 (흔한 행동 묘사): 시청자가 지금 하고 있는 잘못된 행동을 구체 오브젝트 + 행동으로.
  ✅ "대부분 달걀을 냉장고 문칸에 넣는데, 사실 그게 가장 위험한 자리예요."
  ❌ 씬 1 반복. 새로운 정보 없이 "그래서 안 됩니다" 반복 금지.
- Scene 3 (숨은 원인 reveal — CRITICAL): 왜 그 행동이 문제인지 surprising/non-obvious 원인.
  이 씬이 시청자의 "아, 그래서였구나!" 반응을 만든다.
  ✅ GOOD (구체적, 예상 밖):
    "냉장고 문을 하루 10~15번 열면 문칸 온도가 4~10도를 왔다 갔다 해요." — 수치로 구체화
    "수건 냄새는 세제 부족이 아니라 세제 잔여물이 원인일 수 있어요." — 상식 반전
    "뜨거운 물은 흰 옷 얼룩을 더 깊이 고정시켜요." — 예상 밖 원인
  ❌ BAD (원인 reveal 아님):
    "그래서 조심해야 합니다." — 원인 없는 경고
    "안쪽 칸에 두세요." — 해결책이지 원인이 아님
    "온도 변화가 심해요." — 수치/근거 없이 모호한 반복
- Scenes 4~6 (해결 행동 1~3): 하나의 문제를 해결하는 구체 단계.
  ✅ 씬 하나 = 행동 하나. "무엇을/어떻게" 한 줄로 설명 가능해야 함.
  ❌ 씬 4~6에서 같은 규칙을 대상만 바꿔 반복 금지:
    "달걀은 안쪽" → "우유도 안쪽" → "치즈도 안쪽" 패턴 금지 — 이건 나열이다
    대신: 각 씬마다 새로운 행동/이유/상황을 추가할 것.
- Scene 7 (전/후 결과 — CRITICAL): 바꾸면 구체적으로 뭐가 달라지는지 보여줘야 함.
  ✅ GOOD (수치/비교/구체 결과):
    "달걀을 안쪽으로 옮겼더니 비린내가 없어지고 유통기한이 1~2주 늘었어요."
    "찬물로 바꿨더니 세탁 후 흰 옷이 더 하얘졌어요."
  ❌ BAD (모호한 반복):
    "이렇게 하면 신선해요." — 비교 없음, 결과 불명확
    "냉장고 안쪽 칸에 두면 신선함이 유지돼요." — 얼마나? 언제?
- Scene 8 (예외/주의사항): 규칙이 적용 안 되는 경우 또는 추가 실수.
  ✅ "소스류와 잼은 문칸이 맞아요. 온도 변화에 덜 민감하거든요."
  ❌ 씬 4~6 반복. "이 방법을 기억하세요" 단순 재강조 금지.
- Scene 9 (한 줄 규칙): 이 릴스 전체를 한 줄로 요약.
  ✅ "신선식품은 안쪽, 소스류는 문칸 — 이 규칙 하나만."
  ✅ "찬물 세탁 + 라벨 확인 — 이 두 가지가 흰 옷 수명을 바꿔요."
  ❌ "이 방법을 기억하세요." / "도움이 됐으면 좋겠어요." — 정보 없는 마무리 금지.
- Scene 10 (CTA + 행동 요약): 핵심 팁 키워드 + 저장/공유 + 오늘 할 행동.
  ✅ "저장해두세요, 달걀·유제품은 안쪽 칸, 소스류만 문칸입니다."
  ✅ "저장해두세요, 찬물 세탁·라벨 확인이 핵심입니다."
  ❌ "저장해두면 유용해요." (핵심 키워드 없는 단독 CTA 금지)
  ❌ "이 방법을 기억하세요." — 단순 반복 절대 금지
  Motion: Scene 10은 반드시 slow_zoom_out 사용.

NARRATION RULES (CRITICAL — violations cause review/fail grade):
- 16~28 Korean characters per scene. MINIMUM 16자 (단, scene 1 hook은 10자 이상 허용).
- Scenes 2~10: 14자 미만 절대 금지. 16자 이상 목표.
  ❌ BAD (too short — all banned):
    "저장해두면 유용해요." (10자)
    "이 방법을 기억하세요." (10자)
    "바나나는 서늘한 곳에 두세요." (13자)
    "통풍이 잘 되는 곳에서 보관." (13자)
    "양파도 냉장고에 넣지 마세요." (13자)
    "달걀은 문칸에 넣으면 안 돼요." (13자)
    "유제품은 문칸에 보관하지 마세요." (14자 이지만 정보 없음 — 16자 이상 권장)
  ✅ GOOD (16자 이상, 구체 정보 포함):
    "바나나는 냉장고보다 서늘한 실온이 더 오래갑니다." (22자)
    "양파는 통풍되는 망에 담아야 물러지지 않아요." (21자)
    "달걀과 유제품은 온도 변화가 적은 안쪽 칸이 좋아요." (23자)
    "저장해두세요, 문칸은 소스류만 두는 게 안전합니다." (23자)
    "문칸은 온도 변화가 커서 신선식품 보관에 적합하지 않아요." (26자)
- Tone: friendly and clear — like a helpful neighbor, NOT emotional narrator.
- Each scene narration = one actionable or informational sentence. No filler.
  ❌ "알아두면 좋아요", "함께 알아볼까요", "기억해 두세요" — filler, banned
  ✅ 구체 오브젝트 + 구체 행동/이유가 함께 있어야 함

CAPTION RULES:
- 4~10 Korean characters. Short, practical, keyword-style.
  ✅ "냉장 금지", "이게 실수", "밀봉이 답", "5분이면 됩니다", "이 순서대로"
  ❌ "따뜻함", "그 마음", "기억" — 생활꿀팁에서는 추상어 캡션 절대 금지
- Each caption = the tip's key action or object. Never abstract emotion.

IMAGE PROMPT RULES (living_tips 전용):
- NO cute 3D chibi character. NO cartoon face on objects. 이 카테고리는 캐릭터 없음.
- Show the ACTUAL real-life object that the tip is about.
  ✅ "fresh banana on kitchen counter, soft natural light, clean minimal background, no text, 9:16 portrait"
  ✅ "open refrigerator shelf with organized containers, studio light, clean white background, no text"
  ✅ "kitchen cutting board close-up with lemon slice, practical household object shot, no text, no logo"
  ❌ "cute fridge character with eyes" — 생활꿀팁에 캐릭터 사용 금지
- Style keywords: "clean practical household object, soft studio lighting, minimal background, clear object focus, 9:16 portrait, no text, no logo, no people"
- imageMode recommendation: pollinations-only or free-first. Imagen paid plan NOT required.

STORY-ROLE IMAGE STRATEGY (각 씬의 서사 역할에 맞는 이미지 방향):
  Scene 1 (문제 제기): problem evidence — 문제가 보이는 이미지.
    ✅ "spoiled food in refrigerator" / "wilted vegetables fridge" / "yellowed white shirt close-up"
    ❌ "clean organized refrigerator" — 문제 없는 이미지로 시작하면 위기감 없음
  Scene 2 (흔한 행동): wrong placement or common mistake.
    ✅ "eggs on refrigerator door shelf" / "white shirt hot water wash"
  Scene 3 (숨은 원인): cause visualization — 원인이 보이는 이미지.
    ✅ "refrigerator door condensation" (온도 변화) / "detergent residue on fabric" (세제 잔여)
    ❌ "generic refrigerator interior" — 원인을 시각화하지 않으면 배경 사진에 불과함
  Scenes 4~6 (해결 행동): correct action or placement.
    ✅ "eggs inner refrigerator shelf" / "cold water tap laundry" / "organized fridge interior"
  Scene 7 (결과/비교): improved result or before-after.
    ✅ "fresh organized refrigerator shelves" / "bright clean white shirt"
    ❌ 씬 4~6과 동일한 이미지 반복 금지
  Scene 8 (예외/주의): exception object in correct context.
    ✅ "sauce bottles on refrigerator door shelf" / "condiments fridge door organized"
  Scene 9~10 (요약/CTA): final rule object or tidy result.
    ✅ "clean organized refrigerator full view" / "neatly folded white shirts"
  ❌ 같은 "clean refrigerator" 이미지를 씬 4~5~6~7에 반복 사용 금지.
  ❌ People/face 노출 회피: 사람 중심 쿼리 대신 오브젝트 중심 쿼리 사용.
    ❌ "woman putting milk in fridge" → ✅ "milk bottle refrigerator door shelf"

HOOK QUALITY CHECK (scene 1 — final gate before output):
- The hook MUST use at least one of the 6 patterns above (A~F). No exceptions.
- BAD hook examples (all banned — rewrite if you generate these):
    ❌ "흰 옷 황변, 이 방법으로 5분이면 없어집니다!" — 결과보장형 단독, 패턴 없음
    ❌ "오늘은 냉장고 정리법을 알려드릴게요." — 도입형
    ❌ "저장해두면 유용한 생활팁입니다." — 도입형
    ❌ "문칸에 달걀 넣는 집, 오늘 바로 바꾸세요." — 명령형 단독 시작, 공감 없음 (LH-8 실패 패턴)
- GOOD hook examples (경험/질문/현상 → 공감 먼저):
    ✅ "냉장고에 넣었는데도 음식이 빨리 상하나요? 위치 때문입니다." [타깃형D]
    ✅ "달걀을 샀는데 며칠 만에 비린내가 난 적 있나요?" [타깃형D]
    ✅ "수건을 빨았는데도 냄새가 다시 올라오나요?" [타깃형D]
    ✅ "흰 옷, 뜨거운 물 쓰면 더 누래집니다." [반전형C]
    ✅ "수건 냄새, 세제 더 넣으면 더 심해집니다." [손실형B]
    ✅ "전자레인지 기름때, 바로 닦지 마세요." [금지형A]
    ✅ "냉동실 이 자리, 전기세 더 나옵니다." [손실형B]
- Self-check (BOTH must pass — if no, rewrite):
    1. "If a viewer sees only this first scene, will they stop scrolling?" → must be YES
    2. "Does scene 1 make the viewer feel 'maybe I'm doing this wrong right now'?" → must be YES

ENDING CHECK (scene 10 — MANDATORY):
- Scene 10 motion MUST be slow_zoom_out. No exceptions.
- Must include at least 2 tip keywords from the reel (e.g., 문칸/양파/통풍/안쪽 칸).
- Must include a CTA verb: 저장, 공유, 팔로우, 댓글.
- No emotional closing. No "감사합니다" type ending.

- Produce exactly 10 scenes. Sum of durationSec ≈ ${duration} seconds.
- Stay strictly on the tip topic. One tip per reel — do not mix multiple unrelated tips.`
      : referenceStyle === "emotional_story"
      ? `
Quality bar — EMOTIONAL STORY rules (all mandatory):

${storySeedTopic
  ? `STORY TOPIC (server-assigned — ABSOLUTE RULE, no exceptions):
- The topic for this story has been assigned by the server. You MUST use it exactly. This overrides any creative impulse.
- Assigned topic: "${storySeedTopic}"
- ⚠️ HARD CONSTRAINT: Every single scene's caption and narration must be grounded in the central object from this topic.
  · Extract the core object(s) from the topic string. Example: "아버지 서랍 속 낡은 노트" → core object = "낡은 노트"
  · "할머니의 빈 밥그릇" → core object = "빈 밥그릇"
  · If you catch yourself writing about 의자, 열쇠, 쪽지, 지갑, or ANY object not in the topic — STOP and rewrite.
- The topic's central object MUST appear verbatim in:
  1. The top title (12–20 Korean characters)
  2. Scene 1 hook narration (first sentence)
  3. Scene 1 caption
- That same object must remain the story's anchor throughout ALL ${sceneCount} scenes.
  Do NOT introduce a secondary object as the new anchor. Do NOT drift mid-story.
- The story must raise a "why did they do that?" question by scene 3.
- VIOLATION CHECK (before submitting): Count how many scenes mention the core object. If fewer than 6 out of ${sceneCount}, rewrite.
- Do NOT choose a different topic. Do NOT substitute a related item. Use exactly: "${storySeedTopic}"`
  : `STORY TOPIC (strictly enforced):
- Choose ONE fresh, specific topic each time from the PRIORITY TOPIC POOL below.
- The story must contain a "why did they do that?" question by scene 3.
- PRIORITY TOPIC POOL — pick one (prefer C → D → E → F → G → H → I → J → A, skip B entirely):
  C) 병원 복도 빈 의자 — 매일 그 자리에만 앉으셨던 이유  [HIGH PRIORITY]
  E) 오래된 지갑 속 낡은 사진 한 장 — 끝내 버리지 않았던 이유  [HIGH PRIORITY]
  F) 냉장고에 붙은 작은 메모 — 20년째 그 자리에 있는 이유  [HIGH PRIORITY]
  G) 이웃 할머니가 두고 간 반찬통 — 아무 말 없이 매주 남긴 이유
  H) 팔지 못한 오래된 집 열쇠 — 평생 가방 안에 넣고 다닌 이유
  I) 아버지 서랍 속 낡은 노트 — 돌아가신 뒤에야 열어본 이유
  J) 배우자가 몰래 남긴 작은 쪽지 — 매일 다른 자리에 두었던 이유
  A) 엄마의 빈 도시락통 — 매일 씻어두셨던 이유  [use only if C–J already covered]
- ⚠️ STRICTLY FORBIDDEN central objects (do NOT use as the story's main object):
  · 우산, 신발, 운동화, 택배상자 — overused. BANNED as central object.
- TOPIC SELECTION RULE:
  1. Choose a letter from C–J.
  2. The chosen topic's central object MUST appear verbatim in the title, scene 1 hook, and scene 1 caption.
  3. That same object must remain the story's anchor through all scenes. Do NOT drift mid-story.
- Do NOT repeat the topic from any previous response in this session.`}

STORY STRUCTURE — ${sceneCount} scenes, timed layout (strictly enforced):
- The scenes array MUST contain exactly ${sceneCount} objects. Not ${sceneCount - 1}, not ${Math.max(1, sceneCount - 4)}, not a compressed summary.
- Do not merge two story beats into one scene to reduce count.
${sceneCount <= 9
  ? `- Scenes 1–2   (상황): Quietly introduce the setting. No drama yet.
- Scenes 3–5   (갈등/결핍): Show a quiet conflict, misunderstanding, or absence.
- Scenes 6–7   (감정 전환): Small details surface; the audience senses something is coming.
- Scene 8      (작은 반전): ONE understated twist. MUST use "character_pulse". Do not use on any other scene.
- Scene 9      (여운): Resolution fades into silence. Last line must feel worth saving.`
  : sceneCount === 10
  ? `- Scenes 1–2   (상황): Quietly introduce the object and setting. Hook viewer in scene 1.
- Scene 3      (관계): Show the person connected to this object. One specific detail.
- Scene 4      (의문): Raise the "why?" question — but anchor it to the OBJECT, not to a vague feeling.
  narration MUST name the object + the unanswered action: "왜 그 [object]을 매일 [action]하셨는지, 몰랐어요."
  caption MUST be the concrete object (e.g., "병원 의자", "빈 도시락", "액자 뒷면") — NEVER "의문", "왜?", "누구를 위해?".
- Scene 5      (첫 단서): A physical clue about the object — texture, handwriting, wear mark.
- Scene 6      (행동 증거): Show a concrete action someone actually did — not feelings, a real act.
- Scene 7      (반전 단서): A piece of hard evidence (note / photo / receipt / worn mark) that reframes everything.
  narration MUST name a SPECIFIC CONCRETE clue: a date, a name, a place, a handwritten note content, or a physical detail.
  ❌ Bad: "그날, 사진 속 인물과 함께했던 시간이 떠올랐어요." — no new evidence, just memory recap.
  ✅ Good: "사진 뒷면엔, 작은 글씨로 날짜와 장소가 적혀 있었어요."
- Scene 8      (반전/발견): The quiet twist — what was really happening. MUST use "character_pulse". Do NOT use on any other scene.
  ⚠️ IF scene 7 already used "character_pulse" by mistake — STOP. Move it to scene 8. Scene 7 gets "slow_zoom_in" or "character_nod" instead.
  The twist narration MUST state a CONCRETE FACT connecting the parent's action TO THE CHILD — not just a feeling, and not a third party's story.
  ⚡ SCENE 8 NARRATION MUST contain ONE of: date / name / place / handwritten content / physical discovery / "~이었어요" fact.
  ⚡ SCENE 8 is NOT a realization scene. Do NOT write "그제야 알…" or "이제야 알…" here — those belong in scene 9.
  ❌ BANNED (QA-23 exact failure): "그제야 알 것 같았어요, 아버지가 왜 그 사진을 꺼내 보셨는지." — this is scene 9 content, NOT scene 8.
  ❌ BANNED — any sentence starting with or containing: "그제야 알", "이제야 알", "처음으로 알", "알 것 같았어요", "알게 됐어요", "이해가 됐어요", "왜 …보셨는지", "왜 …하셨는지"
  ❌ BANNED — closing formula: "남긴 마음이었어요", "낡은 물건이 아니라", "오래된 종이가 아니라" → these are scene 9/10 content.
  ❌ Bad: "아버지가 고백하신 그 비밀은, 곧 나에게 다가왔죠." — what was the secret? Say it.
  ❌ Bad: "사랑하는 사람과 함께 찍었음을 알게 되었어요." — too vague. Who? What detail proved it?
  ❌ Bad (BANNED — third party drift): "그 사진은, 아버지가 세상을 떠난 친구와 마지막으로 찍은 사진이었어요." — friend is the center, not child.
  ✅ Good: "사진 속 날짜는, 내가 태어난 바로 그날이었어요." — concrete fact, child is the emotional center.
  ✅ Good: "사진 뒷면엔, 아버지가 내게 남긴 짧은 메모가 있었어요." — physical discovery directed at child.
  ✅ Good: "그 날짜는, 아버지가 나를 처음 안았던 날이었어요." — concrete parent-to-child fact.
  ✅ Good: "사진 뒤 작은 날짜가, 내 생일과 같았어요." — short but specific: date + child link. ← QA-24 TARGET
  ✅ Good: "그 날짜는 내가 태어난 날, 아버지가 처음 울던 날이었어요." — date + emotional detail (18자+, high density)
  ✅ Good: "사진 뒤엔 내 생일과, 아버지의 짧은 메모가 남아 있었어요." — object + child link + physical evidence
  ❌ BANNED (QA-24 exact failure): "그 날짜는, 나의 생일이었어요." — only 14자, no emotional anchor to the parent's act.
  ❌ BANNED short forms: "그날이었어요." / "알게 됐어요." / "나의 생일이었어요." alone — too short, no parent-child emotional bridge.
  ⚡ LENGTH RULE: Scene 8 narration MUST be 16 Korean characters or more (excluding spaces). Under 16 chars = automatic review grade.
  ⚠️ SELF-CHECK for scene 8: (1) Does it name a SPECIFIC DATE, NAME, PLACE, or WRITTEN CONTENT? (2) Is it 16+ chars? (3) Does it connect parent's act TO the child? All 3 must be YES.
- Scene 9      (감정 정리 / 깨달음): Realization ONLY — the narrator emotionally interprets the twist. This scene MUST be about FEELING or UNDERSTANDING, never about a present-day action.
  ⚡ SCENE 9 NARRATION FORMULA: "[그제야/이제야/처음으로] [깨달음/이해/감정 해석] — [구체 사실과 연결]"
  ✅ Good: "그제야 알 것 같았어요. 아버지가 왜 매일 그 사진을 꺼내 보셨는지."
  ✅ Good: "이제야 이해가 됐어요. 그 날짜가 아버지에게 무엇이었는지."
  ✅ Good: "아버지가 내가 태어난 날부터, 그 사진을 지갑에 넣으셨던 거예요." (reveals WHY = realization)
  ❌ BANNED (present action): "그래서 나는 지금도 그 사진을 지갑에 넣고 다녀요." — this is scene 10 material.
  ✅ Good: "그제야 아버지의 마음이, 조금은 이해됐어요." — emotional interpretation
  ✅ Good: "아버지는 말로는 한 번도, 사랑한다고 하지 않으셨어요." — unspoken truth revealed
  ✅ Good: "그때서야 알았어요, 그 사진이 왜 그렇게 소중했는지." — realization of meaning
  ❌ BANNED (action): "그래서 나는 지금도, 그 사진을 지갑 안에 넣고 다녀요." — this is an ACTION → belongs in scene 10, NOT scene 9.
  ❌ BANNED (action): Any sentence containing "지금도", "아직도", "넣고 다녀요", "간직하고 있어요", "품고 다녀요" → these are ALL present-day actions and must NEVER appear in scene 9.
  ❌ BANNED (closing formula stolen from scene 10): "낡은 물건이 아니라…", "오래된 종이가 아니라…", "남긴 마음이었어요" → scene 10 ONLY.
    · QA-23 failure: scene 9 = "그 사진은 오래된 종이가 아니라, 아버지가 남긴 마음이었어요." → this is scene 10's job. Scene 9 must be realization.
    · If scene 9 uses the closing formula, scene 10 has nothing left to say → the ending collapses.
  ⚠️ STRICT RULE: If you wrote "지금도" or "넣고 다녀요" in scene 9, DELETE it and replace with a realization sentence about feelings/understanding.
  ⚠️ STRICT RULE: If you wrote "남긴 마음이었어요" or "오래된 종이가 아니라" in scene 9, DELETE it — move it to scene 10 and replace scene 9 with a pure realization.
- Scene 10     (여운 / closing line): The final resonance — reframe the object's meaning, NOT just a plain action report.
  ⚡ SCENE 10 NARRATION FORMULA (choose ONE):
    (A) Concrete meaning reframe — "[오브젝트]은 [낡은 물건]이 아니라, [관계자]가 [구체행동/기간/관계] [구체감정/사람]이었어요."
        → The key: after "아니라" must come a CONCRETE anchor — not just "사랑" or "마음" alone.
    (B) Quiet inheritance — "[오브젝트]을/를, [나는 지금도/아직도] [구체 행동]." — ONLY if it carries a new emotional layer not already in scene 9.
  ✅ BEST (A+): "그 사진은 오래된 종이가 아니라, 아버지가 끝까지 붙잡고 있던 나였어요." ← child as the concrete anchor — quote-worthy
  ✅ BEST (A+): "지갑 속 사진은 추억이 아니라, 아버지가 매일 꺼내 본 나였어요." ← "나" = most powerful anchor
  ✅ PREFERRED (A): "아버지는 사진 한 장으로, 평생의 마음을 남겨두셨던 거예요." ← reveals the WHY behind the object
  ✅ PREFERRED (A): "그 지갑은 낡은 가죽이 아니라, 아버지가 매일 꺼내보던 하루였어요."
  ⚠️ WEAK (A- — avoid): "그 사진은 오래된 종이가 아니라, 아버지가 남긴 마음이었어요." ← QA-24 semipass — "마음이었어요" alone is too generic. Add a concrete qualifier.
  ⚠️ WEAK (A- — avoid): "아버지가 남긴 사랑이었어요." / "남긴 마음이었어요." — abstract nouns without concrete qualifier → review grade.
  ✅ Acceptable (B): "낡은 열쇠는 지금도, 내 열쇠고리에 달려 있어요." — ONLY if scene 9 has NO action words
  ❌ BANNED — plain action report (most common QA failure):
    · "그 사진을, 나는 지금도 지갑 안에 넣고 다녀요." ← QA-23 failure: action only, no meaning reframe
    · "그래서 나는 그 사진을, 아직 지갑에 넣고 다녀요." ← same — action report without emotional reframe
    · Any sentence where the ONLY new information is "I still carry/keep/put [object] in my wallet/bag"
    · English equivalents: "I still keep it in my wallet." / "I still carry it with me." / "I put it there to this day." → ALL BANNED
  ❌ BANNED: Repeating scene 9's realization with different words — scene 10 must ADD a new dimension.
  ❌ BANNED: Ending with pure emotion "마음이 뭉클했어요" / "눈물이 났어요" — anchor to the OBJECT first.
  ⚠️ MANDATORY SELF-CHECK before finalizing: Read scenes 9 and 10 aloud.
     - Scene 9: pure realization/feeling — NO "지금도/아직도/넣고 다녀요/간직" etc.
     - Scene 10: must ADD something scene 9 did not say. Preferred = meaning reframe (formula A).
     - If scene 10 only says "I still do X" → rewrite using formula A (meaning reframe).
     - If both scenes feel like realizations with no action → add formula B action to scene 10 only.
- IMPORTANT: Scenes 5, 6, 7 MUST carry different information types — physical detail / action / evidence. Never let two consecutive scenes describe the same kind of information.`
  : `- Scenes 1–3   (상황): Quietly introduce the setting and protagonist. No drama yet.
- Scenes 4–5   (갈등/결핍): Show a quiet conflict, misunderstanding, or absence.
- Scenes 6–9   (감정 전환): Small details surface; the audience senses something is coming.
- Scenes 10–11 (작은 반전): ONE understated twist — a discovery, a returned item, a quiet gesture.
  One of these two scenes MUST use "character_pulse"; the other MUST NOT.
- Scene 12     (여운): Resolution fades into silence. Last line must feel worth saving.`}
- NO preachy lessons. NO "교훈은 이것입니다". NO melodrama. Quiet sincerity only.
- Top title: 12–20 Korean characters. It must create curiosity or a small mystery.
  ✅ Good: "엄마의 빈 도시락", "매일 온 택배상자", "냉장고 속 메모 한 장", "병원 복도 빈 의자", "지갑 속 낡은 사진"
  ❌ Bad: "오래된 쪽지 이야기", "따뜻한 가족 이야기", "추억과 사랑"

HOOK / RETENTION (strictly enforced):
- The hook must stop scrolling in the first 2 seconds.
- Scene 1 narration must open with a concrete curiosity gap, not a calm mood sentence.
  ✅ Good (use variety — BANNED: 우산/신발/운동화 as central object):
  · "엄마는 빈 도시락을, 매일 씻어두셨죠."
  · "그 택배 상자는, 아무도 주문한 적이 없었어요."
  · "냉장고 문에 붙은 메모가, 20년째 그 자리에 있었어요."
  · "할머니는 그 반찬통을, 아무 말 없이 매주 두고 가셨어요."
  · "지갑 안에서 낡은 사진 한 장이, 나왔어요."
  · "병원 복도 그 의자에, 아버지는 매일 앉아 계셨어요."
  ❌ Bad:
  · "아버지는 그 우산을, 절대 버리지 않았어요." ← 우산 금지
  · "비 내리던 날, 우산이 필요했어요."
  · "낡은 열쇠를 발견했었어요."
  · "마음이 이상하게 따뜻했어요."
  · "아버지의 손길이 느껴졌죠." ← mood-only, no hook word
- Scene 2 MUST raise a clear curiosity-gap question anchored to the central object. Do NOT wait until scene 3 or 4.
  ✅ Good: "왜 그 지갑 속 사진을, 아버지는 매일 꺼내 보셨을까요?", "왜 그 사진을 매일 보셨는지, 그땐 몰랐어요."
  ❌ Bad: "아버지의 손길이 느껴졌죠." (no question, no hook word)
  ❌ Bad: "왜 그랬을까요?", "누가 둔 걸까요?", "누구를 위해 준비됐던 걸까요?" — too vague, no object.
- Every 3 scenes, reveal a new concrete clue so viewers feel progress.
- MANDATORY by scene 3 — both rules must pass or rewrite:
  (R1) RELATIONSHIP: At least one of these words must appear in scenes 1–3 narration or caption:
       엄마, 어머니, 아버지, 아빠, 부모님, 남편, 아내, 배우자, 딸, 아들, 할머니, 할아버지, 이웃, 형, 언니, 오빠.
       ✅ Good: "아버지는 그 지갑을, 절대 버리지 않았어요." (scene 1)
       ❌ Bad: Scene 1–3 only says "그 사람은" or "누군가" — relationship is invisible until scene 4+.
  (R2) HOOK TRIGGER — HARD RULE: MUST appear in scenes 1 or 2 narration (NOT scene 3 or later):
       Required: at least ONE of these words in scene 1 OR scene 2 narration:
       왜, 매일, 아무도, 말하지, 숨긴, 몰래, 기다렸, 버리지, 주문한 적, 몰랐, 한 번도.
       ✅ Good: scene 1 "아버지는 그 사진을, 매일 지갑에서 꺼내 보셨죠." (매일 in scene 1 ✓)
       ✅ Good: scene 2 "왜 그 사진을, 한 번도 버리지 않으셨는지 궁금했어요." (왜/버리지/한 번도 ✓)
       ❌ Bad: scene 2 "아버지의 손길이 느껴졌죠, 그땐 몰랐었죠." — 몰랐 is in scene 4, not scene 1~2.
       ❌ Bad: scene 3 has the first hook word — too late, viewer already scrolled away.

STORY CLARITY (strictly enforced):
- The story must communicate ONE concrete human situation clearly enough that viewers can retell it in one sentence.
- Use a simple cause-effect chain: object found → memory/problem revealed → concrete act discovered → emotional resolution.
- The twist must reveal a specific action, not a vague feeling.
  ✅ Good twist examples:
  · "아버지가 해진 우산을 매년 몰래 고쳐두셨다"
  · "병원 복도 의자는 어머니가 매주 기다리던 자리였다"
  · "낡은 열쇠는 팔린 집이 아니라, 아버지의 작업실 열쇠였다"
  · "빈 도시락통은 혼자 먹은 흔적이 아니라, 매일 나눠준 흔적이었다"
  ❌ Bad: "그제야 마음을 알았어요", "무언가 깨달았어요", "기억이 떠올랐어요" without a concrete fact.
- Scenes 1–3 must establish WHO/WHERE/OBJECT. Avoid anonymous mood-only openings.
- Scenes 4–9 must show a concrete misunderstanding, absence, or question.
- Scenes 10–11 must answer that question with a visible object/action.
- Scene 12 must leave a clear after-feeling tied to the same object, not a generic emotional sentence.
- At least one family/social relationship MUST be explicit by scene 3 (not scene 4 or later):
  엄마, 어머니, 아버지, 아빠, 부모님, 남편, 아내, 배우자, 딸, 아들, 할머니, 할아버지, 이웃.
  This is a hard rule. If you cannot name the relationship by scene 3, restructure the opening.
- Avoid fully anonymous stories. "someone", "a person", or only objects with no relationship is too weak for mass appeal.

TWIST CONCRETENESS — scenes 7, 8, 9 (strictly enforced):
- The twist in scenes 7–9 MUST be built on a CONCRETE PHYSICAL FACT, not a vague emotion or abstract word.
- FORBIDDEN in scenes 7–9 (abstract-only twist):
  ❌ "아버지의 마음이었어요" — "마음" is abstract. What physical thing showed the feeling?
  ❌ "그 비밀이 다가왔죠" — What WAS the secret? Name the fact.
  ❌ "사랑이 담긴 사진이었어요" — "사랑" is abstract. What did the photo actually contain?
  ❌ "사랑하는 사람과 함께 찍었음을 알게 되었어요" — still vague. Who? When? What detail on the photo?
  ❌ "그제야 이해하게 되었어요" — what exactly did you understand?
  ❌ "무언가 깨달았어요" — not a fact, no object, no action.
- REQUIRED in scenes 7–9 — pick ONE concrete anchor per scene:
  · A DATE or PLACE written on the back of the photo / object
  · A NAME or a relationship clue (e.g., a person the protagonist didn't know existed)
  · An OLD PROMISE that explains a recurring action
  · A SPECIFIC REASON why the object was kept (e.g., it was given the day before a death/departure)
  · A HIDDEN ACTION discovered (e.g., the wallet photo was taken at the last meeting before a friend died)
  · A CONCRETE DETAIL that reframes the whole story (e.g., the date on the photo is the protagonist's own birthday)
  ✅ Good twist narration examples (scene 8 / character_pulse scene — child MUST be the emotional center):
  · "사진 뒷면엔, 내가 태어난 날 아버지가 직접 쓴 날짜가 있었어요." — child's birth = emotional anchor
  · "사진 속 날짜는, 내가 태어난 바로 그날이었어요." — child is the reason the photo was kept
  · "사진 뒷면엔, 아버지가 내게 남긴 짧은 메모가 있었어요." — parent's message directed at child
  · "그 날짜는, 아버지가 나를 처음 안았던 날이었어요." — parent-to-child moment as the reveal
  · "아버지는 그 약속을, 내가 태어난 날부터 지켜오셨어요." — promise made for the child
  ❌ Banned examples (third party becomes central):
  · "그 사진은, 돌아가신 친구와 마지막으로 찍은 사진이었어요." — friend is center, child absent → BANNED
  · "그 사진은, 아버지가 세상을 떠난 친구와 마지막으로 찍은 사진이었어요." → BANNED
- The concrete fact must be VISIBLE or READABLE from the object — something you could literally point at.
- Do NOT use "비밀", "마음", "사랑", "기억", "감동" as the sole content of a twist scene. Pair each abstract word with a physical clue that proves it.

EMOTIONAL AXIS — 감정축 보호 (strictly enforced):
- The story's emotional core MUST match the subTopic of the seed.
- If the seedTopic contains "아버지", "엄마", "어머니", "부모", "지갑", "사진", "도시락", "의자", "열쇠", "노트", "반찬통":
  → The emotional axis MUST be "부모가 자녀에게 말하지 못한 사랑·걱정·희생" or "자녀가 부모를 뒤늦게 이해함".
  → The twist MUST reveal something the PARENT did FOR the CHILD, or something the CHILD finally understands about the PARENT.
  → In scenes 7–10, the words "나", "내가", "나에게", "내게", "딸", "아들" MUST appear at least once.
     If scenes 7–10 contain only the parent and a third party (friend/colleague/stranger) with NO mention of the child, rewrite.

  ✅ Good axis — scene 7~10 narration structure (부모→자녀):
  · Scene 7: "사진 뒷면엔, 작은 글씨로 날짜가 적혀 있었어요." — physical clue
  · Scene 8: "그 날짜는, 내가 태어난 바로 그날이었어요." — twist anchored to child ("내가")
  · Scene 9: "아버지는 내가 태어난 날부터, 그 사진을 지갑에 넣으셨던 거예요." — reason for child
  · Scene 10: "그 사진을, 나는 지금도 지갑 안에 넣고 다녀요." — child inherits the meaning

  ✅ Another good structure:
  · Scene 8: "사진 뒷면엔, 아버지가 내게 남긴 짧은 메모가 있었어요." — parent's message to child
  · Scene 9: "아버지는 말로는 한 번도, 사랑한다고 하지 않으셨어요." — unspoken love
  · Scene 10: "그래서 나는 이제, 그 사진을 지갑에 넣고 다녀요." — child continues parent's act

  ❌ FORBIDDEN axis drift — these turn the story away from parent–child:
  · "그 사진은, 아버지가 마지막으로 만난 친구와의 사진이었어요." then "그 친구는, 아버지에게 소중한 존재였죠." — friend becomes the center, child disappears. BANNED.
  · "아버지는 그날을, 절대 잊지 않으셨던 것 같아요." — vague memory with no child connection. BANNED as the final emotional beat.
  · The twist reveals a friend's death or the parent's friendship story → BANNED unless the child ("나", "내가", "딸", "아들") is the DIRECT recipient of that story and the twist sentence explicitly names the child (e.g., "그 사진은, 내가 태어난 날 아버지가 처음 지갑에 넣으신 거였어요." — child-centric).
  · ⛔ CRITICAL BANNED PATTERN: "그 사진은, 아버지가 세상을 떠난 친구와 마지막으로 찍은 사진이었어요." — even if a later scene says "내가 태어난 날부터", the TWIST SCENE itself is about the friend, not the child. The twist scene (scene with "character_pulse") MUST center the child, not the third party.
  · A third party (친구, 동료, 지인) becomes the emotional center of scenes 7–10 → BANNED.
  · The story becomes about the parent's past life/youth with no connection back to the child → BANNED.
  · SELF-CHECK before submitting: "Is the TWIST scene (character_pulse) about the parent's love/action FOR the child, not about the parent's friendship?" If the twist sentence does not contain "나", "내가", "딸", "아들", or "자녀" → rewrite that scene.
  · For parents-children stories: a deceased friend or third party must NEVER become the central reveal. The friend may appear only as a background detail that explains a parent's action toward the child.

- If the seedTopic does NOT have a parent–child relationship (e.g., "이웃 할머니 반찬통"):
  → The emotional axis should match the actual relationship in the seed. Do not force a parent–child frame.
- The emotional axis set in scene 1–3 must be maintained through the twist and resolution. Do not change the protagonist or relationship in scene 7+.

STORY CONSISTENCY (strictly enforced):
- Choose ONE primary object and keep it central from scene 1 to scene 12.
- You may introduce at most ONE secondary object, and only if it directly explains the primary object.
- Do NOT switch the story object near the ending. Example: if the title is about a key, the twist must still be about that key, not suddenly an umbrella.
- The last 2 scenes (scenes 9 and 10) MUST reference the primary object from the seedTopic. If you introduced a secondary object, return to the primary object for the final resolution.
  ✅ Good: seedTopic "가족사진 액자" → scene 9 "거실 액자", scene 10 "액자 속 사진"
  ❌ Bad: seedTopic "가족사진 액자" → scene 9 "거실 액자", scene 10 "지갑 속 사진" (switching primary object at the end)
- Every scene must be causally connected to the previous scene. No random memory montage.
- Avoid unnatural or typo-like Korean nouns. Do not use "파리" unless the story is literally about a fly or Paris, which this category should not be.
- Before returning JSON, silently check: "Can this story be summarized in one sentence?" If not, rewrite it.

NARRATION (strictly enforced):
- Every scene narration MUST be 18–24 Korean characters (spaces removed). No exceptions, including the final scene.
  · Each scene narration MUST be a complete sentence. Do NOT split one sentence across two scenes.
  · NEVER end with a dangling comma or unfinished clause.
  · NEVER write a single standalone phrase like "알 수 있었어요.", "그땐 몰랐어요.", or "마음이 뭉클해졌어요." as an entire scene.
  · If a thought is short, merge it with context: "왜 그랬는지, 그땐 정말 몰랐었어요."
  · Minimum 2 short clauses per line. Most lines should contain a comma.
  · Minimum 3 meaningful content words per line.
  · Bad: "비 오는 날, 우산을 찾으려는 손길이,"
  · Bad: "먼지가 쌓인 손잡이,"
  · Bad: "그땐 몰랐었어요."
  · Bad: "마음이 따뜻해졌던 순간, 그립던 추억이 함께 했어요."
  · Bad: "그 우산을 닫으며, 무언가 깨달았어요."
  · Bad: "낡은 열쇠를 발견했었어요, 오래된 서랍 속에서." (awkward translated word order)
  · Bad: "열쇠가 없던 날, 아버지가 파리를 몰래 고치셨었죠." (nonsense / typo-like noun)
  · Bad: "그 열쇠를 찾다가, 갑자기 우산이 전부였어요." (object drift)
  · Good: "오래된 서랍 속에서, 낡은 열쇠를 발견했어요." (22자)
  · Good: "손잡이에 감긴 테이프가, 아버지 손길이었어요." (23자)
  · Good: "병원 의자 밑에는, 엄마 쪽지가 놓여 있었죠." (22자)
  · Good: "냉장고 문 위 메모가, 그날도 그 자리에 있었어요." (23자)
  · Good: "택배 상자 안에는, 아무 설명이 없었어요." (20자)
  · Good: "엄마는 빈 도시락을, 매일 씻어두셨죠." (19자)
  · Good: "지갑 속 사진을, 꺼내본 적이 없었어요." (19자)
  · Keep each line to ONE thought — short, clear, breathing room between scenes.
  · If a line is under 18 chars, add concrete context from the object or place instead of padding.
- Use natural Korean word order. Do NOT place location/time phrases awkwardly after the verb like a translated English sentence.
  ❌ "낡은 열쇠를 발견했었어요, 오래된 서랍 속에서." → subject/verb before the location
  ✅ "오래된 서랍 속에서, 낡은 열쇠를 발견했어요."
  ❌ "아버지 기다렸었죠, 그 이웃은 매일." → particle missing + inverted order
  ✅ "그 이웃은 매일, 아버지를 기다렸었죠."
- DO NOT omit particles (은/는/이/가/을/를/에게). Every subject and object must have its particle.
  ❌ "아버지 기다렸" ✅ "아버지를 기다렸"
- Sentence endings: vary naturally. Do NOT overuse the same ending more than twice in a row.
  ✅ Allowed: "…더라고요.", "…했어요.", "…있었어요.", "…없었어요.", "…몰랐어요.", "…봤어요."
  ❌ Overused patterns to avoid: 3+ consecutive "…했었어요." or "…였었죠." in a row
  · "했었어요" / "였었죠" are grammatically correct but feel over-dramatic if used every line — use sparingly (max 2 per 12 scenes)
- Spoken like a quiet personal diary — NOT a narrator reading a script.
- Do NOT use "우리는 ~해야", "이것이 바로", or any lecture-style phrasing.
- Add a comma inside longer sentences for a natural breath pause.
- Full script = all narration texts joined in scene order, comma-separated.
- TOTAL SCRIPT LENGTH: With ${sceneCount} scenes × ~18–22 chars avg ≈ ${Math.round(sceneCount * 3.5)}–${Math.round(sceneCount * 4.5)} seconds TTS. Keep total under 55 seconds.

CAPTION (strictly enforced):
- 4–10 Korean characters (spaces removed count). Specific to that scene's CONCRETE OBJECT or precise moment.
- MUST contain a concrete noun (물건·장소·행동) — NEVER a single abstract noun standing alone.
- ✅ Good: "빈 의자", "문 앞 상자", "오래된 열쇠", "빈 밥그릇", "작은 상자", "녹슨 자물쇠", "접힌 쪽지", "병원 의자", "아버지 지갑", "엄마 메모", "냉장고 쪽지", "사진 모서리", "낡은 노트".
- ❌ Bad (FORBIDDEN vague/abstract captions): "걱정", "기억", "그때", "기다림", "상자", "울컥", "따뜻함", "그날", "그 마음", "마음의 여운", "감정의 파도", "따뜻한 순간", "이상한 느낌", "훈훈한 신발", "따뜻한 마음", "그리운 추억", "사랑", "희망" — these are abstract labels with no concrete anchor.
- FORBIDDEN adjectives in captions: "훈훈한", "따뜻한", "그리운", "슬픈", "외로운", "아픈", "감동적인" — these are emotional labels, NOT scene descriptions. Remove the adjective and keep only the concrete noun.
  ❌ "훈훈한 신발" → ✅ "낡은 운동화"
  ❌ "따뜻한 손길" → ✅ "엄마 손길"
  ❌ "그리운 추억" → ✅ "빛바랜 사진"
- Rule of thumb: if you can't picture a specific physical object or scene location from the caption alone, rewrite it.
- Caption must directly name (or describe in 2+ words) the story object shown in imagePrompt.
- Each scene must have one emphasis word that appears verbatim inside caption.
- NO listicle numbers.

IMAGE PROMPT RULES (strictly enforced):
- ⚡ NARRATION-IMAGE MATCH RULE (新 — most common QA failure):
  Each scene's imagePrompt MUST include the 1–2 most concrete nouns from THAT SCENE'S narration.
  The image generator reads only the imagePrompt — not the narration. If the key object in narration is absent from imagePrompt, the image will show something unrelated.
  ✅ Correct matching:
    · narration: "사진 뒷면엔, 내가 태어난 날의 날짜가 적혀 있었어요."
      imagePrompt MUST contain: "back of old photo", "blurred marks" (not vase, not room, not window)
    · narration: "아버지는 그 사진을, 지갑에서 꺼내 보셨죠."
      imagePrompt MUST contain: "worn leather wallet", "old photo" — not just "cozy room"
    · narration: "낡은 지갑 안에, 빛바랜 사진 한 장이 있었어요."
      imagePrompt MUST contain: "leather wallet", "faded photo"
  ❌ Mismatch examples (QA-22 failure patterns):
    · narration mentions "사진 뒷면" but imagePrompt shows "flower vase on table" → BANNED
    · narration mentions "지갑을 꺼내" but imagePrompt shows "sunlit empty room" → BANNED
    · narration mentions "날짜가 적혀" but imagePrompt shows "hands folded on table, no photo" → BANNED
  RULE: Extract the 1–2 most specific physical nouns from the narration first. Then write imagePrompt around those nouns.
  If you cannot find a concrete noun in the narration, use the scene's central object from the seed topic.
  ⛔ DO NOT write imagePrompt based on the caption — captions are short and may omit the key object.
     Always derive imagePrompt from the FULL narration sentence, not from the 4–10 char caption.
  ⛔ DO NOT use vase / flower / window / curtain / generic room background as the MAIN subject of imagePrompt
     unless the narration explicitly mentions that object. These are filler visuals with no story connection.

- ⚡ SCENE 7~8 TWIST VISUALIZATION RULE (QA-24 — most common visual failure):
  If scene 7 or 8 narration mentions: 날짜 / 뒷면 / 메모 / 생일 / 이름이 적힌 / 날이 적혀
  → The imagePrompt MUST include at least 2 of the following visual cues:
    · "plain back of the photo" or "back of old photo"
    · "soft blurred indistinct marks" or "faded date marks" or "blurred trace"
    · "fingertips gently touching the back of the photo" or "finger pointing to corner"
    · "worn leather wallet beside the photo" (proximity = emotional weight)
    · "adult hands turning the photo over, face not visible"
  ⛔ FORBIDDEN for scenes 7~8 when narration mentions date/back/note:
    · Generic "worn leather wallet on wooden table" alone (no back-of-photo or touch cue)
    · "old photo and wallet" without any date/touch/turn gesture
  ✅ QA-24 scene 7 target: "plain back of old photo with soft blurred indistinct marks, adult fingertips gently touching corner, warm hand-drawn storybook style, emotional close-up, no readable writing, no numbers"
  ✅ QA-24 scene 8 target: "adult hands cradling old photo turned over, soft emotional close-up of photo back, faded blurred marks, worn leather wallet beside photo on wooden table, gentle storybook light, no readable writing"

- ⚡ SCENE-BY-SCENE imagePrompt REQUIRED ELEMENTS (QA-26 — scenes 4~10):
  Each scene MUST show the narration's main object AND its scene role. Use these as a checklist:
  · Scene 4: worn leather wallet + old photo tucked inside — "why was this photo kept?" angle. Must include "wallet" and "photo".
  · Scene 5: close-up of faded photo corner, worn edge, soft blur — "the corner is worn from repeated touching". Must include "corner" or "faded" or "edge".
  · Scene 6: adult hands gently pulling old photo out of wallet — the daily ritual of looking at it. Must include "hand" and "wallet" and "photo".
  · Scene 7: faded old photo showing a young figure (no face), hands holding it — the reveal of who is in the photo. Must include "photo" and "hold".
  · Scene 8: plain back of old photo, soft blurred marks, fingertips — the date or note on the back. Must include "back" or "fingert" or "blurred".
  · Scene 9: worn wallet and old photo on wooden table in warm morning light — quiet emotional understanding. Must include "wallet" and "photo".
  · Scene 10: worn wallet and old photo beside coat, golden light — final resting image with emotional warmth. Must include "wallet" and "photo".
  ❌ BANNED for scenes 4~10: any imagePrompt that does NOT mention "wallet" or "photo" — these are the story's anchor objects.

- ⚡ VISUAL CONTINUITY RULE (most important): This is ONE illustrated story, not 10 unrelated images.
  The same cozy room / same core objects MUST anchor ALL scenes. Think of each scene as the next frame of a picture-book.
  · visual anchor A (scenes 1~3): "worn leather wallet on wooden desk, cozy room, warm afternoon light, hand-drawn storybook style"
  · visual anchor B (scenes 4~5): "worn leather wallet with old photo, faded photo corner close-up, watercolor texture"
  · visual anchor C (scenes 6~7): "adult hands pulling photo from wallet, worn leather wallet and old photo on wooden table, dawn light"
  · visual anchor D (scene 8): "plain back of old photo, adult hands touching the back, faded blurred marks, emotional close-up"
  · visual anchor E (scenes 9~10): "wallet and photo on wooden table, nostalgic room, warm morning light, storybook ending frame"
  Each scene's imagePrompt must be a VARIATION of its anchor — same objects/room, different framing/moment.
- Use CONCRETE story objects specific to this reel's topic — do NOT default to generic glowing light, abstract heart, or light bulb.
  Preferred objects: worn leather wallet on wooden desk, elderly man's weathered hands holding old photo, adult hands opening wallet, faded old photo, back of old photo, worn coat on wooden table, quiet window at dusk, empty chair with afternoon light.
- ⛔ FORBIDDEN imagePrompt objects (do NOT use — unrelated to emotional story, will make the video feel disconnected):
  · vase / flower vase / ceramic vase / flower arrangement / decorative flowers
  · generic still life / decorative object / abstract decoration
  · empty room with no story object / random table with no connection to the story
  → Every scene's imagePrompt MUST include at least ONE of the story's core objects (wallet / photo / coat / hands / specific story object from scene 1).
- Person representation rules — safe for AI image generators:
  · ALLOWED: back view of small figure, elderly man's hands, adult hands, over-the-shoulder view, simple silhouette by window, figure in distance, hands holding object
  · NOT ALLOWED: close-up faces, realistic face detail, direct eye contact
  · Use "face not visible", "back view", "no close-up faces" when including a person
- ⛔ AVOID the word "child" in imagePrompt — AI image generators may safety-reject prompts with "child".
  Use instead: "adult hands", "young adult's hands", "a pair of hands", "over-the-shoulder view"
  ✅ Good: "adult hands opening an old wallet"  ❌ Bad: "child opening father's wallet"
  ✅ Good: "over-the-shoulder view of an old photo back, face not visible"  ❌ Bad: "child looking at photo back"
- "아버지 존재감"은 직접 묘사 대신 손·낡은 코트·지갑·사진·뒷모습 실루엣으로 표현:
  ✅ "elderly man's weathered hands holding old photo"
  ✅ "elderly man's worn coat beside old wallet on table"
  ✅ "small elderly man silhouette at window, back view, warm light"
  ❌ "elderly father silhouette taking photo" → ✅ "elderly man's hands taking a photo from a wallet, face not visible"
- Lighting: warm golden for memories/resolution scenes, cool blue-grey for conflict/absence scenes.
- Style: warm hand-drawn cinematic animation, soft watercolor background, gentle pastel colors, emotional storybook illustration, 9:16 portrait.
- Append to every prompt: ", warm hand-drawn animation, soft watercolor background, gentle pastel colors, emotional storybook illustration, 9:16 portrait, no text, no close-up faces, no numbers, no readable writing"
- NO photorealistic style. NO cartoon chibi. NO abstract floating shapes. NO stock photo style.
- ⛔ STRICTLY FORBIDDEN — these phrases will cause AI image generators to render readable text, numbers, or dates in the image:
  · "handwritten date" / "handwritten note" / "handwriting" / "date written" / "handwritten inscription"
  · "birthday date" / "showing a date" / "calendar marked with dates" / "numbers on the photo"
  · "note that reads" / "photo that reads" / "a note saying" / "inscription on the back"
  · "writing on the back" / "back of the photo showing [a date / text / numbers]"
  · "readable memo" / "showing the date" / "special dates" / "digits"
  → Instead use: "plain back of the photo with blurred marks", "faded unreadable trace", "soft smudged marks", "blurred handwritten trace", "indistinct faded marks"
  → Example: ❌ "back of the photo showing a date written in small handwriting" → ✅ "plain back of the photo with blurred indistinct marks"
  → Example: ❌ "calendar marked with special dates" → ✅ "plain surface with no visible markings"

MOTION RULES (strictly enforced):
- Scene 1 (intro, 상황 시작): "alive" — gentle sway only.
- 상황/갈등 development scenes: "slow_zoom_in" (primary) or "character_nod" (memory/flashback feel).
- 감정 전환 scenes: "character_nod" — contemplative, unhurried.
- The ONE twist scene (반전): "character_pulse" — MANDATORY, use EXACTLY ONCE.
  · For 10-scene stories: MUST be scene 8. No other scene may use "character_pulse".
  · For 9-scene stories: MUST be scene 8. No other scene may use "character_pulse".
  · For 12-scene stories: MUST be scene 11. No other scene may use "character_pulse".
  · ❌ Scene 7 MUST NOT use "character_pulse" — scene 7 is the clue/discovery, scene 8 is the reveal. If you feel the urge to put "character_pulse" on scene 7, that means scene 7 narration is too reveal-like — rewrite scene 7 as a concrete clue and move the reveal to scene 8.
  · ⚠️ VIOLATION CHECK: If you finish writing all scenes and "character_pulse" appears 0 times or 2+ times, or it appears on scene 7 instead of scene 8 — STOP and rewrite scene 8 to use "character_pulse", set scene 7 to "slow_zoom_in". There is no exception.
- 여운 outro scenes: "slow_zoom_out".
- "character_talk" is ABSOLUTELY BANNED — do NOT use it anywhere.
- "hold" is BANNED.
- "pan_left" / "pan_right": only if image has clear wide horizontal composition.
- Do NOT assign the same motion to more than 3 consecutive scenes.

SCENE DUPLICATION RULES (strictly enforced):
- Every scene narration must be UNIQUE. Never write two scenes with similar or paraphrased versions of the same sentence.
- The last 2 scenes (scenes 11–12) must be meaningfully different from each other:
  ❌ Scene 11: "비 오는 날마다, 그 우산의 의미가 남았어요." + Scene 12: "빗속에서도, 우산의 기억이 남아 있었어요." — same idea, different words.
  ✅ Scene 11 (반전): Reveals the specific concrete act/fact. Uses "character_pulse".
  ✅ Scene 12 (여운): Shows the aftermath tied to the same object — NOT a restatement of the twist.
- Before writing each scene, check: "Is this narration meaningfully different from the previous scene?" If not, rewrite.

CAPTION RULES (additional):
- FORBIDDEN: Direct speech, dialogue, or phrases a person would say ("사랑한다", "기다릴게", "고마워", "미안해", "보고싶어", "잘있어").
  These generate readable text in AI images, which breaks the no-text rule.
- FORBIDDEN: Adjective-only captions without a concrete noun ("먼지 쌓인", "오래된", "낡은" — must add the noun: "먼지 쌓인 사진").
- FORBIDDEN: Generic 2-character location captions with no object ("문 앞" alone — add the object: "문 앞 상자").
- FORBIDDEN: Single person-name only — NEVER use a relationship word alone as the entire caption:
  ❌ "아버지" → ✅ "아버지 지갑" or "아버지 서랍"
  ❌ "엄마" → ✅ "엄마 메모" or "엄마 도시락"
  ❌ "이웃" → ✅ "이웃 반찬통" or "문 앞 반찬"
- FORBIDDEN: Question-only captions — never a single question word or vague noun:
  ❌ "왜?" → ✅ "반복된 배달"
  ❌ "의문" → ✅ "병원 의자" or "빈 도시락" (use the central object instead)
  ❌ "궁금증" → ✅ "매달 온 상자"
  ❌ "누구를 위해?" → ✅ "빈 도시락" or "반찬통" (anchor to object, not to the question)
  ❌ "팔걸이" → ✅ "의자 팔걸이" (add context noun if ambiguous alone)
- FORBIDDEN: Standalone short abstract nouns with no concrete anchor:
  ❌ "손때" → ✅ "사진 모서리"
  ❌ "먼지" → ✅ "먼지 쌓인 노트"
  ❌ "향" → ✅ "도시락 냄새"
- RULE: Every caption must contain at least ONE concrete physical noun (the central object, a place, or a specific prop).
  ✅ Concrete noun + optional modifier: "접힌 쪽지", "빈 밥그릇", "서랍 속 열쇠", "냉장고 메모", "낡은 사진", "아버지 지갑", "병원 의자".
- RULE: No two scenes may share the same caption. Every scene must have a DISTINCT caption that marks a new moment.
  ❌ sc1: "병원 의자", sc2: "빈 의자", sc3: "병원 의자" — repeated, nearly identical
  ✅ sc1: "병원 복도 의자", sc2: "빈 의자 옆 가방", sc3: "의자 팔걸이"
- RULE: The caption must NEVER be a relationship word alone followed by an abstract noun ("이웃 감사", "아버지 손길", "이웃의 손길").
  The noun must be a physical object, not an emotion or quality: ❌ "이웃 감사" → ✅ "이웃 반찬통" / ❌ "아버지 손길" → ✅ "아버지 서랍" / ❌ "기다림의 자리" → ✅ "병원 의자"

ENDING RULES (scene ${sceneCount}, 여운 — strictly enforced):
- The final scene MUST be tied to the central object AND contain a specific concrete fact or action.
  ❌ Bad endings (emotion-only, no concrete anchor):
    · "그제야 아버지의 마음을 알았어요."
    · "의미가 남았어요."
    · "마음이 뭉클했어요."
    · "추억이 떠올라요."
    · "무언가를 깨달았어요."
  ✅ Good endings (object + specific fact — do NOT use 우산/신발 as examples):
    · "빈 도시락통 안에, 매일 남긴 쪽지 한 장이 있었어요."
    · "낡은 열쇠는 지금도, 내 열쇠고리에 달려 있어요."
    · "메모는 지금도, 냉장고 문 그 자리에 붙어 있어요."
    · "그 사진을, 나는 지금도 지갑 안에 넣고 다녀요."
    · "반찬통은 아직도, 그 날과 같은 냄새가 나요."
- The final line must feel worth saving as a quote — specific, not generic.

- Produce exactly ${sceneCount} scenes. Sum of durationSec ≈ ${duration} seconds.
- Do NOT write aspect ratio text inside imagePrompt.`
      : `
Quality bar — every point is mandatory:
- Must feel like a top-performing Korean Instagram Reel, not a slideshow.
- Top title: 12–20 Korean characters, specific & curiosity-driven. Bad: "일상에서 유용한 꿀팁". Good: "냉장고 보관 비밀 7가지".
- Each scene caption: 4–10 Korean characters, punchy, viral. Examples: "수박은 따로", "입구를 닦아요", "비밀은 온도", "밀봉이 답".
- Each scene must have one emphasized Korean word or phrase; the exact emphasis text MUST appear verbatim inside caption.
- Narration is warm spoken Korean — short sentences, natural rhythm, occasional surprise. End sentences naturally: "…그거 알고 계셨나요?", "…해봤더니 달랐어요."
- Each scene narration must be 18–25 Korean characters. Do NOT write tiny filler lines like "알아두면 좋아요" or "시작해볼까요".
- The full script must feel complete at roughly ${duration} seconds when spoken. For ${duration}s, use enough concrete narration detail to fill the time naturally.
- Add a comma inside long sentences for a natural pause.
- The whole script = all scene narration texts concatenated in order, with a comma separator between scenes.
- Image prompts must be English, optimized for 9:16 portrait AI illustration.
- IMAGE PROMPT RULES (strictly enforced):
  · ONE expressive object character with a face — fridge, sauce bottle, sunscreen tube, etc.
  · The character should have an emotional pose: leaning, surprised, winking, reaching.
  · Clean, minimal pastel or gradient background. No clutter.
  · NO text, letters, numbers, UI, labels, clocks, calendars, charts, signs, watermarks.
  · NO human faces. NO stock photo style. NO realistic photography.
  · Style: "cute 3D illustrated character, chibi proportion, soft studio lighting, editorial quality"
- Motion assignment rules per scene (choose the BEST fit, vary across scenes):
  · Scene 1 (intro): "alive" — character breathes and sways. Sets the tone.
  · Scenes where the character explains or narrates a tip: "character_talk" — rapid subtle bob simulating speech rhythm.
  · Scenes with a strong emphasis word or surprising fact: "character_pulse" — double-pop zoom + brightness flash.
  · Calm transition or supporting info scenes: "character_nod" — gentle vertical nod.
  · Standard info scenes without strong emphasis: "slow_zoom_in".
  · Final scene (outro / CTA): "slow_zoom_out".
  · Use "pan_left" or "pan_right" only when image has wide horizontal composition.
  · "hold" is BANNED unless the scene is an intentional freeze-frame title card.
  · Do NOT assign the same motion to more than 3 consecutive scenes. Distribute variety.
- Produce exactly ${sceneCount} scenes. Sum of durationSec ≈ ${duration} seconds.
- Stay strictly on the category topic. Do not drift to unrelated tips.
- Avoid generic visual ideas like note, lightbulb, reminder icon unless the category specifically needs them. Prefer concrete objects from the tip itself.
- Do NOT use "첫 번째", "두 번째" etc. as listicle headers. Each caption must stand alone.
- No quotation marks around emphasis words in narration.
- Do NOT write aspect ratio text inside imagePrompt.`;

  // ── 구체 주제 / 소재 변주 컨텍스트 블록 ─────────────────────────────────────
  const concreteTopicBlock = concreteTopic
    ? `
SELECTED TOPIC (ABSOLUTE RULE — strictly enforced):
- This reel MUST be about: "${concreteTopic}"
- Keep the account niche consistent: same audience, same promise.
- Do NOT drift to another object, tip, story, or category.
- Captions, narration, imagePrompt must all support this exact topic throughout ALL ${sceneCount} scenes.
- If the selected topic is broad, choose one concrete angle but keep it inside the topic.
- Do NOT repeat the exact same angle you've used before. Generate a FRESH take on this topic.
- Reuse the same theme only with a different object, target situation, mistake, benefit, or hook.
- Consistency means same audience and promise, not same script.${variationContext ? `
- VARIATION CONTEXT (use this to differentiate from previous episodes):
  ${variationContext}` : ""}
`
    : variationContext
    ? `
VARIATION CONTEXT (for niche consistency with fresh angle):
- Keep the account niche consistent.
- Generate a FRESH angle inside the selected subtopic. Do NOT repeat exact same episode angle.
- ${variationContext}
`
    : "";

  // ── 운영 프리셋 컨텍스트 블록 ───────────────────────────────────────────────
  const effectiveTargetAudience = accountTargetAudience || targetAudience;
  const effectiveTone = accountToneMemo || tone;
  const accountPresetBlock =
    accountPresetName || accountTargetAudience || accountToneMemo || (bannedTopics && bannedTopics.length > 0)
      ? `
ACCOUNT PRESET — OPERATING RULES (strictly enforced):${accountPresetName ? `
- Account: "${accountPresetName}"` : ""}${accountTargetAudience ? `
- Target audience: "${accountTargetAudience}"` : ""}${accountToneMemo ? `
- Tone: "${accountToneMemo}"` : ""}${bannedTopics && bannedTopics.length > 0 ? `
- BANNED topics (never mention, imply, or reference): ${bannedTopics.join(", ")}` : ""}
- Keep content style, audience, and tone consistent with this account. Do not drift.
`
      : "";

  const prompt = `
Create a Korean short-form reel production plan.

Category: ${categoryName}
Target audience: ${effectiveTargetAudience}
Duration: ${duration} seconds
Tone: ${effectiveTone}
Reference style: ${styleGuide}
${accountPresetBlock}${concreteTopicBlock}${qualityBar}

Return JSON only:
{
  "title": "clickable Korean title under 35 chars",
  "topTitle": "persistent Korean top title",
  "subtitle": "optional short subtitle",
  "hook": "first line hook",
  "script": "full narration script",
  "callToAction": "short CTA",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "targetAudience": "${targetAudience}",
  "visualStyle": "brief visual style description",
  "estimatedDuration": ${duration},
  "scenes": [
    {
      "sceneNumber": 1,
      "durationSec": 5,
      "narration": "${referenceStyle === "emotional_story" ? "Complete Korean diary sentence, 18–24 chars, never a dangling clause" : referenceStyle === "living_tips" ? "Korean practical tip sentence, 18–25 chars, one actionable fact per scene" : "Korean narration sentence (≤25 chars, spoken style)"}",
      "caption": "short Korean caption (4–10 chars)",
      "emphasis": "highlight word (must appear in caption)",
      "imagePrompt": "${referenceStyle === "emotional_story" ? "VISUAL CONTINUITY RULE: Use the same core objects (wallet/photo/coat/hands) across ALL scenes — do NOT invent new objects per scene. Each prompt must name the story's central object. NO vase, flowers, or unrelated still life. Example: 'worn leather wallet on wooden desk, old photo half pulled out, warm cinematic 3D illustration, soft emotional lighting, 9:16 portrait, no text, no faces, no numbers, no readable writing'" : referenceStyle === "living_tips" ? "clean practical household object, soft studio lighting, minimal clean background, clear object focus, 9:16 portrait, no text, no logo, no people — show the ACTUAL real-life object the tip is about. NO cute characters, NO cartoon eyes on objects." : "one cute expressive object character, chibi 3D illustration, pastel background, soft studio lighting, no text, no humans, no numbers, no watermark"}",
      "fallbackSearchQuery": "${referenceStyle === "emotional_story" ? "English keywords matching the story object (e.g. worn leather wallet old photo cinematic)" : referenceStyle === "living_tips" ? "English stock photo keywords for the household object or tip action" : "English stock media keywords"}",
      "motion": "${referenceStyle === "emotional_story" ? "alive | character_pulse | character_nod | slow_zoom_in | slow_zoom_out | pan_left | pan_right" : "alive | character_talk | character_pulse | character_nod | slow_zoom_in | slow_zoom_out | pan_left | pan_right"}",
      ${referenceStyle === "emotional_story" ? `"visualAnchorId": "one of: wallet_photo_anchor | photo_back_anchor | memory_table_anchor | hands_closeup_anchor | present_wallet_anchor — assign based on scene beat: scenes 1~3 = wallet_photo_anchor, scenes 4~5 = photo_back_anchor, scenes 6~7 = memory_table_anchor, scene 8 = hands_closeup_anchor, scenes 9~10 = present_wallet_anchor"` : `"visualAnchorId": "optional, omit for non-emotional stories"`}
    }
  ]
}
`;

  // OPENAI_PLAN_MODEL 환경변수로 모델 선택 가능
  // - gpt-4o-mini : 구조 QA / 저비용 테스트 (~$0.002/회)
  // - gpt-4o      : 품질 QA / 실사용 후보 (~$0.02~0.03/회) ← 기본값
  const planModel = process.env.OPENAI_PLAN_MODEL || "gpt-4o";

  const response = await openai.chat.completions.create({
    model: planModel,
    messages: [
      {
        role: "system",
        content:
          "You are a senior Korean short-form video producer. You create concise, high-retention reel storyboards and visual prompts.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.8,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("GPT 응답이 비어있습니다.");

  return JSON.parse(content) as GeneratedReelV2;
}
