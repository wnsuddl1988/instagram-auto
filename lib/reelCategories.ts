/**
 * AutoShorts AI v2 — 운영용 릴스 카테고리 프로필
 *
 * 각 카테고리는 generateReelV2Plan()에 직접 넘길 수 있는 파라미터 세트를 포함한다.
 * 확장 시 이 파일에 항목을 추가하기만 하면 UI/API 모두 자동 반영된다.
 */

import type { ReelV2Scene } from "./openai";

export type ReferenceStyle =
  | "ai_character_tips"
  | "wealth_mindset"
  | "emotional_story"
  // QA-27 분리: 생활꿀팁 전용 스타일 — 캐릭터 없이 실물 오브젝트 중심, 정보형 구조
  | "living_tips";

// ── 소주제 구조 ──────────────────────────────────────────────────────────────
// contentAngles / targetSituations / hookTemplates는 향후 AI 조합 생성에 활용
export interface SubTopic {
  id: string;
  name: string;
  description: string;
  /** 바로 쓸 수 있는 구체 주제 예시 (사용자가 선택하거나 AI가 활용) */
  seedExamples: string[];
  /** 같은 소주제 안에서 각도를 달리하는 관점 목록 (소재 고갈 방지) */
  contentAngles: string[];
  /** 대상 상황/시청자 세분화 (다양한 후킹 조합용) */
  targetSituations: string[];
  /** 후킹 문구 템플릿 (콘티 생성 시 GPT 참고용) */
  hookTemplates: string[];
}

export interface ReelCategoryProfile {
  /** URL/파일명에 사용되는 고유 식별자 */
  id: string;
  /** 화면에 표시되는 이름 */
  name: string;
  emoji: string;
  description: string;
  /** 세부 주제/시리즈 목록 — UI에서 드롭다운으로 선택, API에서 자동 반영 */
  subTopics?: SubTopic[];

  // ── generateReelV2Plan 파라미터 ─────────────────────────────────
  categoryName: string;
  targetAudience: string;
  duration: 30 | 45 | 60;
  tone: string;
  referenceStyle: ReferenceStyle;

  // ── 나레이션 스타일 가이드 (프롬프트 보조 힌트) ─────────────────
  narrationStyle: string;

  // ── TTS 기본값 ───────────────────────────────────────────────────
  /** "openai" | "elevenlabs" */
  ttsProvider: "openai" | "elevenlabs";
  /** OpenAI TTS voice (sage/nova/alloy/echo/fable/onyx 등) */
  openaiVoice: string;
  /** OpenAI TTS model */
  openaiModel?: string;
  /** OpenAI TTS speed (0.25–4.0, 기본 1.0) */
  openaiSpeed: number;
  /** gpt-4o-mini-tts speech direction */
  openaiInstructions?: string;
  /** ElevenLabs Voice ID (ELEVENLABS_VOICE_ID env 대체용) */
  elevenLabsVoiceId?: string;

  // ── 영상 스타일 메타 ─────────────────────────────────────────────
  /** 카드 배경 Tailwind gradient */
  gradient: string;
  /** 대표 accent 색 (hex) */
  color: string;

  // ── 모션 힌트 (GPT motion 배정 보조 — 필수값 아님) ──────────────
  /** 이 카테고리에서 선호하는 motion 분포 힌트 */
  motionHints?: Partial<Record<ReelV2Scene["motion"], string>>;
}

// ────────────────────────────────────────────────────────────────────────────
// 운영 카테고리 목록 (5개 핵심 + 확장 가능)
// ────────────────────────────────────────────────────────────────────────────
export const REEL_CATEGORIES: ReelCategoryProfile[] = [
  // ── 1. 생활꿀팁 ────────────────────────────────────────────────────
  {
    id: "life-hacks-v2",
    name: "생활꿀팁",
    emoji: "💡",
    description: "냉장고·청소·주방·수납 등 실용 생활 꿀팁. 사물 캐릭터 릴스 스타일.",
    subTopics: [
      {
        id: "food-storage",
        name: "음식 보관",
        description: "식재료를 오래 신선하게 보관하는 실용 팁",
        seedExamples: [
          "바나나를 오래 보관하는 방법",
          "남은 밥 냉동 보관 실수",
          "냉장고 문칸에 넣으면 안 되는 음식",
          "양파를 무르지 않게 보관하는 법",
        ],
        contentAngles: [
          "대부분이 잘못 알고 있는 실수",
          "돈 아끼는 보관법",
          "여름철에 특히 위험한 습관",
          "50대 이상이 알면 좋은 팁",
          "도구 없이 바로 하는 방법",
          "전문가가 추천하는 기본 원칙",
        ],
        targetSituations: [
          "혼자 사는 직장인",
          "아이 있는 집",
          "냉장고가 작은 집",
          "음식을 자주 버리는 사람",
        ],
        hookTemplates: [
          "이거 아직도 이렇게 보관하세요?",
          "대부분 이 실수 때문에 금방 상합니다",
          "냉장고에 넣으면 오히려 망가지는 음식",
          "이 방법 하나로 며칠 더 갑니다",
        ],
      },
      {
        id: "kitchen-cleaning",
        name: "주방 청소",
        description: "기름때·냄새·찌든 때를 쉽게 없애는 주방 청소 팁",
        seedExamples: [
          "전자레인지 기름때 5분 만에 없애는 법",
          "도마 냄새 제거 방법",
          "싱크대 배수구 막힘 예방법",
        ],
        contentAngles: [
          "주방 세제 없이도 되는 방법",
          "베이킹소다 + 식초 활용",
          "청소 시간을 반으로 줄이는 순서",
          "전문가가 먼저 청소하는 부위",
        ],
        targetSituations: [
          "청소가 귀찮은 직장인",
          "기름때가 심한 집",
          "어린 자녀가 있어 세제를 피하고 싶은 집",
        ],
        hookTemplates: [
          "주방 청소 이 순서 모르면 시간 낭비예요",
          "전자레인지 이렇게 하면 1분이면 됩니다",
          "도마에서 냄새 나는 이유, 알고 계세요?",
        ],
      },
      {
        id: "fridge-organization",
        name: "냉장고 정리",
        description: "냉장고를 효율적으로 정리하고 공간을 2배로 쓰는 방법",
        seedExamples: [
          "냉장고 정리 존 나누는 법",
          "냉동실 음식 오래 쓰는 수납 방법",
          "냉장고 냄새 없애는 법",
        ],
        contentAngles: [
          "냉장고 문 칸 활용 실수",
          "냉동실 공간 2배로 쓰는 방법",
          "유통기한 관리하는 정리 법칙",
          "마트 장보기 직후 바로 하는 정리 루틴",
        ],
        targetSituations: [
          "냉장고가 작은 1인 가구",
          "장보고 나서 정리가 막막한 분",
          "냉동 식품을 많이 쓰는 집",
        ],
        hookTemplates: [
          "냉장고 이렇게 쓰면 전기세 더 나옵니다",
          "냉동실 이 자리는 절대 안 됩니다",
          "장본 뒤 이것만 해도 음식 오래 갑니다",
        ],
      },
      {
        id: "bathroom-cleaning",
        name: "욕실 청소",
        description: "물때·곰팡이·변기 청소를 더 쉽고 빠르게 하는 팁",
        seedExamples: [
          "욕실 물때 한 번에 없애는 방법",
          "변기 청소 더 쉽게 하는 방법",
          "샤워 커튼 곰팡이 예방법",
        ],
        contentAngles: [
          "세제 없이 자연 재료로 청소",
          "청소 주기 줄이는 예방 습관",
          "10분 만에 욕실 전체 청소 루틴",
        ],
        targetSituations: [
          "청소가 싫은 직장인",
          "곰팡이 때문에 고민하는 집",
          "아이가 있어 화학 세제를 피하고 싶은 집",
        ],
        hookTemplates: [
          "욕실 이 부분 닦는 사람 거의 없어요",
          "물때 이렇게 없애면 훨씬 쉽습니다",
          "곰팡이 생기는 진짜 이유, 알고 계세요?",
        ],
      },
      {
        id: "storage-organization",
        name: "수납 정리",
        description: "집 안 공간을 넓게 쓰는 수납 아이디어와 정리 팁",
        seedExamples: [
          "신발장 공간 2배로 늘리는 방법",
          "옷장 계절별 정리 방법",
          "다이소 아이템으로 주방 수납 업그레이드",
        ],
        contentAngles: [
          "공간이 좁은 집을 위한 수납법",
          "다이소 아이템 100% 활용",
          "버리지 않고 공간 넓히는 방법",
          "계절 교체 수납 루틴",
        ],
        targetSituations: [
          "원룸·소형 아파트 거주자",
          "수납공간이 부족한 집",
          "정리 정돈을 못 하는 분",
        ],
        hookTemplates: [
          "이 수납 방법, 아직도 모르세요?",
          "좁은 집도 이렇게 하면 넓어 보여요",
          "다이소에서 사면 집이 달라집니다",
        ],
      },
      {
        id: "laundry-clothing",
        name: "세탁·의류",
        description: "옷 세탁 실수 방지, 얼룩 제거, 의류 보관 팁",
        seedExamples: [
          "흰 옷 황변 없애는 방법",
          "니트 세탁 실수 예방법",
          "운동화 세탁 방법",
        ],
        contentAngles: [
          "세탁기 세탁이 오히려 망치는 옷",
          "얼룩 종류별 제거 방법",
          "옷 수명 늘리는 보관 방법",
        ],
        targetSituations: [
          "옷 관리가 서툰 직장인",
          "아이 옷에 얼룩이 잘 생기는 집",
          "좋은 옷을 오래 입고 싶은 분",
        ],
        hookTemplates: [
          "이 옷, 세탁기에 넣으면 안 됩니다",
          "흰 옷 이렇게 하면 20년 입어요",
          "얼룩 이 방법으로 5분이면 없어집니다",
        ],
      },
    ],
    categoryName: "냉장고 보관 & 주방 꿀팁",
    targetAudience: "인스타그램과 유튜브 쇼츠를 보는 30~60대 한국 주부·직장인",
    duration: 45,
    tone: "친근하고 약간 놀라운 느낌으로",
    // QA-27: 감동사연(emotional_story)과 분리 — 생활꿀팁 전용 스타일
    // 캐릭터 오브젝트 없이 실물 생활용품 중심, 정보전달형 10씬 구조
    // imageMode: pollinations-only 또는 free-first 권장 (Imagen 유료 불필요)
    referenceStyle: "living_tips",
    narrationStyle:
      "친절하고 또렷하게 정보를 전달. '이거 알면 다름' 톤. 감정보다 실용. 짧고 명확한 문장.",
    ttsProvider: "openai",
    openaiVoice: "nova",
    openaiModel: "gpt-4o-mini-tts",
    openaiSpeed: 0.92,
    openaiInstructions:
      "Clear, friendly Korean lifestyle tip narrator. Practical and informative. " +
      "Speak naturally like a helpful friend, not an announcer. " +
      "Keep pitch steady and tone warm but efficient. No dramatic pauses, no emotional wavering. " +
      "Speed should feel brisk but comfortable — like someone sharing a useful tip they just discovered.",
    gradient: "from-emerald-400 to-teal-600",
    color: "#10b981",
    motionHints: {
      alive: "인트로 냉장고 캐릭터 등장",
      character_talk: "꿀팁 설명 씬",
      character_pulse: "비밀 공개 강조 씬",
      slow_zoom_out: "아웃트로 CTA",
    },
  },

  // ── 2. AI 생성 활용 ───────────────────────────────────────────────
  {
    id: "ai-creator-tools",
    name: "AI 생성활용",
    emoji: "🤖",
    description: "AI 도구·자동화·콘텐츠 제작 팁. 또렷하고 기술 친화적인 톤.",
    subTopics: [
      {
        id: "image-generation",
        name: "이미지 생성",
        description: "AI 이미지 생성 도구 활용 팁과 프롬프트 작성법",
        seedExamples: [
          "Midjourney vs Stable Diffusion 비교",
          "프롬프트 한 줄로 퀄리티 올리는 법",
          "AI 이미지 상업적 사용 주의사항",
        ],
        contentAngles: ["초보자도 되는 프롬프트 공식", "무료 vs 유료 도구 비교", "실수하면 망하는 포인트"],
        targetSituations: ["AI 이미지를 처음 써보는 분", "블로그·SNS에 이미지가 필요한 분", "디자인 비용을 줄이고 싶은 사업자"],
        hookTemplates: ["이 프롬프트 하나면 퀄리티가 달라집니다", "AI 이미지 이렇게 쓰면 저작권 문제 생겨요"],
      },
      {
        id: "shorts-automation",
        name: "쇼츠 자동화",
        description: "AI로 쇼츠·릴스 영상을 자동으로 만드는 방법",
        seedExamples: [
          "AI로 유튜브 쇼츠 1시간에 10개 만드는 법",
          "자동 자막 생성 도구 비교",
          "AI 영상 편집 무료 도구 TOP 3",
        ],
        contentAngles: ["비용 0원으로 자동화하는 방법", "초보자도 되는 단계별 세팅", "가장 많이 하는 실수"],
        targetSituations: ["유튜브를 시작하고 싶은 직장인", "영상 편집을 못 하는 분", "부업으로 콘텐츠를 만들고 싶은 분"],
        hookTemplates: ["영상 편집 못 해도 이건 됩니다", "AI가 대신 만들어주는 시대가 왔어요"],
      },
      {
        id: "work-automation",
        name: "업무 자동화",
        description: "반복 업무를 AI로 자동화해서 시간을 아끼는 방법",
        seedExamples: [
          "ChatGPT로 이메일 10초 만에 쓰는 법",
          "엑셀 작업 AI로 자동화하는 방법",
          "회의록 자동 정리 도구",
        ],
        contentAngles: ["직장인이 매일 쓸 수 있는 자동화", "무료 도구로 시작하는 방법", "팀장도 모르는 업무 단축 방법"],
        targetSituations: ["야근이 잦은 직장인", "반복 업무가 많은 사무직", "업무 효율을 올리고 싶은 분"],
        hookTemplates: ["이거 알면 야근 없어집니다", "직장인이 ChatGPT 쓰는 진짜 방법"],
      },
      {
        id: "blog-marketing",
        name: "블로그·마케팅",
        description: "AI로 블로그 글, 마케팅 카피, SNS 콘텐츠를 만드는 법",
        seedExamples: [
          "AI로 블로그 글 5분 만에 쓰는 방법",
          "상품 설명문 AI로 자동 생성하는 법",
          "인스타그램 캡션 AI로 쓰는 팁",
        ],
        contentAngles: ["SEO에 강한 글 쓰는 AI 활용법", "광고 카피 자동 생성", "소상공인을 위한 AI 마케팅"],
        targetSituations: ["블로그를 시작하고 싶은 분", "마케팅 예산이 없는 소상공인", "SNS 콘텐츠가 고갈된 크리에이터"],
        hookTemplates: ["글 못 써도 이건 됩니다", "AI가 마케팅 카피를 대신 써줍니다"],
      },
      {
        id: "prompt-writing",
        name: "프롬프트 작성",
        description: "AI에게 원하는 결과를 얻는 프롬프트 작성 기술",
        seedExamples: [
          "ChatGPT 프롬프트 이렇게 쓰면 달라집니다",
          "역할 부여 프롬프트 작성법",
          "프롬프트 한 줄로 글 퀄리티 올리는 방법",
        ],
        contentAngles: ["초보자가 가장 많이 하는 실수", "프롬프트 공식 5가지", "업무별 프롬프트 템플릿"],
        targetSituations: ["AI를 막 시작한 직장인", "ChatGPT 결과에 실망한 분", "프롬프트를 체계적으로 배우고 싶은 분"],
        hookTemplates: ["ChatGPT 이렇게 쓰면 10배 달라집니다", "프롬프트 이 한 줄이 전부입니다"],
      },
      {
        id: "ai-tools-comparison",
        name: "AI 도구 비교",
        description: "ChatGPT·Claude·Gemini 등 AI 도구를 직접 비교하는 콘텐츠",
        seedExamples: [
          "ChatGPT vs Claude 어떤 게 더 좋나요?",
          "무료 AI 도구 TOP 5 비교",
          "글쓰기에 가장 좋은 AI는?",
        ],
        contentAngles: ["용도별 최적 AI 도구 추천", "무료 vs 유료 실전 비교", "한국어 성능 비교"],
        targetSituations: ["어떤 AI를 써야 할지 모르는 분", "AI 구독을 고민하는 직장인", "여러 AI를 써본 경험자"],
        hookTemplates: ["이 AI가 진짜 더 좋습니다", "ChatGPT 유료 결제, 필요 없을 수도 있어요"],
      },
    ],
    categoryName: "AI 도구 활용 & 콘텐츠 자동화 팁",
    targetAudience: "AI로 콘텐츠와 업무 자동화를 해보고 싶은 20~40대 한국 크리에이터·직장인",
    duration: 45,
    tone: "명확하고 빠르게, 실용적인 예시 중심으로",
    referenceStyle: "ai_character_tips",
    narrationStyle:
      "AI 도구를 잘 아는 진행자가 쉽게 설명하는 느낌. 어렵지 않게, 단계별로 짧게.",
    ttsProvider: "openai",
    openaiVoice: "cedar",
    openaiModel: "gpt-4o-mini-tts",
    openaiSpeed: 0.9,
    openaiInstructions: "Premium Korean narrator. Warm, grounded, and professional, while explaining AI tools clearly.",
    gradient: "from-cyan-400 to-blue-600",
    color: "#06b6d4",
    motionHints: {
      alive: "인트로 AI 도구 캐릭터",
      character_talk: "사용법 설명 씬",
      character_pulse: "효율 상승 포인트",
      slow_zoom_out: "자동화 CTA",
    },
  },

  // ── 3. 시니어 건강 ─────────────────────────────────────────────────
  {
    id: "senior-health",
    name: "시니어 건강",
    emoji: "🌿",
    description: "50대 이상 건강·영양·운동 꿀팁. 따뜻하고 신뢰감 있는 목소리.",
    subTopics: [
      {
        id: "blood-sugar",
        name: "혈당 관리",
        description: "공복혈당·식후혈당을 낮추는 식습관과 생활 팁",
        seedExamples: [
          "아침 공복혈당을 망치는 습관",
          "혈당 스파이크 막는 식사 순서",
          "혈당에 좋은 간식 vs 나쁜 간식",
        ],
        contentAngles: ["몰랐던 혈당 올리는 음식", "혈당 낮추는 식사 순서 공식", "운동과 혈당의 관계"],
        targetSituations: ["당뇨 전단계 진단을 받은 분", "혈당이 걱정되는 50대 이상", "단 음식을 자주 먹는 분"],
        hookTemplates: ["이 습관이 혈당을 망치고 있습니다", "아침에 이것만 바꿔도 혈당이 달라져요"],
      },
      {
        id: "joint-health",
        name: "관절 건강",
        description: "무릎·허리·어깨 관절 통증을 줄이는 생활 습관과 운동",
        seedExamples: [
          "무릎 통증 악화시키는 잘못된 자세",
          "관절에 좋은 음식 TOP 5",
          "50대 무릎 운동, 이것만 해도 됩니다",
        ],
        contentAngles: ["관절 통증의 숨은 원인", "관절에 좋은 vs 나쁜 운동", "일상 자세 교정법"],
        targetSituations: ["무릎이 아픈 50~70대", "계단 오르내릴 때 불편한 분", "운동을 못 하는 관절 환자"],
        hookTemplates: ["무릎 이렇게 쓰면 더 빨리 망가집니다", "50대 무릎 통증, 이것 때문입니다"],
      },
      {
        id: "muscle-strength",
        name: "근력·근감소",
        description: "나이 들수록 중요한 근육 유지와 근감소증 예방법",
        seedExamples: [
          "60대에도 근육 유지하는 운동",
          "근감소증 초기 신호 체크리스트",
          "단백질 얼마나 먹어야 할까요?",
        ],
        contentAngles: ["근감소증 모르면 나중에 후회", "집에서 하는 근력 운동", "단백질 식품 현실적인 섭취법"],
        targetSituations: ["체력이 눈에 띄게 줄어든 50대", "운동을 싫어하는 어르신", "부모님 건강이 걱정되는 자녀"],
        hookTemplates: ["50대부터 이 운동 안 하면 후회합니다", "근육 줄면 생기는 무서운 일들"],
      },
      {
        id: "sleep-health",
        name: "수면 개선",
        description: "잠이 안 오거나 자주 깨는 문제를 해결하는 수면 관리법",
        seedExamples: [
          "잠 못 자는 50대를 위한 수면 루틴",
          "새벽에 자꾸 깨는 이유",
          "수면에 좋은 음식 vs 피해야 할 음식",
        ],
        contentAngles: ["숙면을 방해하는 의외의 습관", "자기 전 절대 하면 안 되는 것", "수면의 질 높이는 환경 만들기"],
        targetSituations: ["만성 불면으로 고생하는 분", "새벽 2~3시에 자주 깨는 분", "수면제 없이 자고 싶은 분"],
        hookTemplates: ["이것 때문에 잠이 안 오는 겁니다", "새벽에 깨는 이유, 몸이 보내는 신호예요"],
      },
      {
        id: "dementia-prevention",
        name: "치매 예방",
        description: "뇌 건강을 지키고 치매를 예방하는 생활 습관과 음식",
        seedExamples: [
          "치매 위험 높이는 일상 습관",
          "뇌에 좋은 음식 TOP 5",
          "50대부터 해야 하는 치매 예방 운동",
        ],
        contentAngles: ["치매 초기 신호 체크리스트", "뇌를 자극하는 일상 습관", "가족력이 있어도 예방하는 방법"],
        targetSituations: ["치매가 걱정되는 50대 이상", "부모님 치매를 예방하고 싶은 자녀", "건망증이 심해진 분"],
        hookTemplates: ["이 습관이 뇌를 서서히 망치고 있어요", "치매 걱정된다면 이것부터 바꾸세요"],
      },
      {
        id: "senior-diet",
        name: "시니어 식단",
        description: "50대 이상에게 맞는 영양소·식단·식사 습관 조언",
        seedExamples: [
          "50대 이상이 꼭 먹어야 할 영양소",
          "나이 들면 줄여야 할 음식",
          "혼밥해도 영양 채우는 방법",
        ],
        contentAngles: ["나이별 달라지는 영양 필요량", "약 먹을 때 피해야 할 음식", "저렴하게 영양 채우는 방법"],
        targetSituations: ["혼자 식사하는 어르신", "입맛이 없어진 50대", "부모님 식단이 걱정되는 자녀"],
        hookTemplates: ["50대부터 이 음식 줄여야 합니다", "이 영양소 부족하면 몸이 보내는 신호"],
      },
      {
        id: "walking-exercise",
        name: "걷기·운동",
        description: "걷기만 제대로 해도 건강이 달라지는 방법과 루틴",
        seedExamples: [
          "걷기 운동 효과 최대화하는 방법",
          "잘못된 걸음걸이가 무릎을 망친다",
          "하루 몇 걸음이 적당할까?",
        ],
        contentAngles: ["걸음수보다 중요한 걷는 방법", "걷기와 혈당·혈압의 관계", "비가 올 때 실내 대체 운동"],
        targetSituations: ["운동을 처음 시작하는 50대", "헬스장 가기 싫은 어르신", "체중 감량이 목표인 분"],
        hookTemplates: ["만보 걷기, 이렇게 하면 역효과입니다", "걸을 때 이 자세, 무릎 망가집니다"],
      },
    ],
    categoryName: "50대 이후 건강 꿀팁",
    targetAudience: "건강이 걱정되기 시작한 50~70대 한국 시청자",
    duration: 45,
    tone: "따뜻하고 신뢰감 있게, 과장 없이",
    referenceStyle: "ai_character_tips",
    narrationStyle:
      "천천히, 또렷하게. '몰랐죠? 이제 알면 돼요.' 식의 부드러운 확신 톤.",
    ttsProvider: "openai",
    openaiVoice: "nova",
    openaiModel: "gpt-4o-mini-tts",
    openaiSpeed: 0.88,
    openaiInstructions: "Warm Korean lifestyle reels narrator. Natural pauses, friendly curiosity, and clear pacing for senior viewers.",
    gradient: "from-green-400 to-emerald-600",
    color: "#22c55e",
    motionHints: {
      alive: "인트로 건강 캐릭터",
      character_nod: "차분한 정보 씬",
      character_talk: "건강 설명 씬",
      slow_zoom_out: "마무리 응원 CTA",
    },
  },

  // ── 4. 동기부여 ────────────────────────────────────────────────────
  {
    id: "motivation-v2",
    name: "동기부여",
    emoji: "🔥",
    description: "짧고 강한 동기부여 릴스. 부 마인드셋·성공 습관. 프리미엄 다크 스타일.",
    subTopics: [
      {
        id: "office-worker-mindset",
        name: "직장인 멘탈",
        description: "직장 스트레스와 번아웃을 극복하는 멘탈 관리 조언",
        seedExamples: [
          "직장인이 번아웃에서 벗어나는 법",
          "상사의 말에 흔들리지 않는 방법",
          "퇴근 후 진짜 쉬는 방법",
        ],
        contentAngles: ["번아웃 신호 체크리스트", "직장에서 감정 소모를 줄이는 법", "내 가치를 스스로 증명하는 방법"],
        targetSituations: ["매일 지쳐있는 직장인", "이직을 고민하는 30대", "상사와 갈등 중인 직장인"],
        hookTemplates: ["이 신호 있으면 번아웃 직전입니다", "직장에서 감정 낭비, 이제 그만하세요"],
      },
      {
        id: "wealth-mindset",
        name: "부 마인드셋",
        description: "부자들이 가진 생각의 방식과 돈에 대한 마인드셋 전환",
        seedExamples: [
          "가난한 사람과 부자의 생각 차이",
          "돈을 끌어당기는 마인드셋",
          "월급쟁이가 부자 되는 첫 번째 단계",
        ],
        contentAngles: ["부자들의 공통된 사고방식", "돈을 못 버는 숨겨진 이유", "지금 당장 바꿀 수 있는 습관"],
        targetSituations: ["돈이 모이지 않는 30~40대", "재테크를 시작하고 싶은 직장인", "경제적 자유를 꿈꾸는 분"],
        hookTemplates: ["부자들은 이런 생각 절대 안 합니다", "돈이 안 모이는 진짜 이유는 이겁니다"],
      },
      {
        id: "habits",
        name: "습관 만들기",
        description: "좋은 습관을 만들고 나쁜 습관을 끊는 실전 방법",
        seedExamples: [
          "작심삼일 없애는 습관 만들기 방법",
          "아침 루틴으로 하루가 달라지는 이유",
          "나쁜 습관을 끊는 심리학 방법",
        ],
        contentAngles: ["습관이 안 되는 과학적 이유", "21일 법칙은 거짓말이다", "아주 작게 시작하는 방법"],
        targetSituations: ["작심삼일을 반복하는 분", "루틴을 만들고 싶은 직장인", "나쁜 습관이 있는 모든 분"],
        hookTemplates: ["습관이 안 되는 이유, 의지력 문제 아닙니다", "이 방법으로 하면 습관이 됩니다"],
      },
      {
        id: "failure-recovery",
        name: "실패 극복",
        description: "실패와 좌절을 딛고 다시 일어서는 마음가짐",
        seedExamples: [
          "실패 후 빠르게 회복하는 방법",
          "사업 실패 후 다시 시작하는 마인드셋",
          "실패를 두려워하지 않는 방법",
        ],
        contentAngles: ["성공한 사람들의 실패 경험", "실패에서 배우는 기술", "포기하고 싶을 때 버티는 방법"],
        targetSituations: ["큰 실패를 겪은 30~40대", "자신감이 떨어진 직장인", "다시 시작하고 싶은 분"],
        hookTemplates: ["실패는 끝이 아닙니다, 이유가 있어요", "성공한 사람들은 실패 후 이렇게 합니다"],
      },
      {
        id: "relationships",
        name: "인간관계",
        description: "인간관계에서 에너지를 아끼고 진짜 사람을 남기는 방법",
        seedExamples: [
          "인간관계로 지치는 사람의 특징",
          "에너지 뱀파이어를 멀리하는 법",
          "진짜 내 편을 만드는 방법",
        ],
        contentAngles: ["관계를 정리해야 하는 신호", "말 한 마디로 상대방을 움직이는 법", "갈등 없이 거절하는 방법"],
        targetSituations: ["인간관계로 지친 직장인", "관계를 정리하고 싶은 30대", "소통이 힘든 내향인"],
        hookTemplates: ["이 사람 주변에 있으면 에너지 빠집니다", "인간관계 이것만 알면 편해집니다"],
      },
      {
        id: "self-management",
        name: "자기관리",
        description: "시간·체력·감정을 효율적으로 관리하는 자기계발 루틴",
        seedExamples: [
          "바쁜 직장인을 위한 자기관리 루틴",
          "하루 1시간 투자로 인생 바꾸는 방법",
          "자기관리 못 하는 사람의 공통점",
        ],
        contentAngles: ["자기관리의 핵심 3가지", "시간이 없어도 되는 자기관리", "체력이 곧 경쟁력인 이유"],
        targetSituations: ["자기관리를 시작하고 싶은 30대", "시간이 없다고 느끼는 직장인", "번아웃 직후 회복하려는 분"],
        hookTemplates: ["자기관리 안 되는 진짜 이유", "이것만 해도 삶이 달라집니다"],
      },
    ],
    categoryName: "성공 마인드셋 & 동기부여",
    targetAudience: "더 나은 삶을 원하는 20~40대 한국 직장인·청년",
    duration: 30,
    tone: "강렬하고 자신감 있게, 짧게 끊어서",
    referenceStyle: "wealth_mindset",
    narrationStyle:
      "카리스마 있는 코치처럼. 문장은 짧고 강하게. '지금 이 순간이 전부다.' 식.",
    ttsProvider: "openai",
    openaiVoice: "onyx",
    openaiModel: "gpt-4o-mini-tts",
    openaiSpeed: 0.96,
    openaiInstructions: "Speak in Korean like a confident motivational coach. Strong, concise, and cinematic, without shouting.",
    gradient: "from-amber-500 to-orange-600",
    color: "#f59e0b",
    motionHints: {
      character_pulse: "핵심 명언 강조",
      slow_zoom_in: "일반 씬",
      slow_zoom_out: "아웃트로",
    },
  },

  // ── 5. 절약·재테크 ─────────────────────────────────────────────────
  {
    id: "money-saving",
    name: "절약·재테크",
    emoji: "💰",
    description: "실생활 절약 꿀팁·재테크 시작하기. 사물 캐릭터(지갑·동전 캐릭터) 스타일.",
    subTopics: [
      {
        id: "everyday-saving",
        name: "일상 절약",
        description: "매일 생활에서 돈을 아끼는 실용적인 방법",
        seedExamples: ["편의점 할인 꿀팁", "전기세 아끼는 방법", "마트에서 낭비 줄이는 법"],
        contentAngles: ["모르면 손해 보는 할인 방법", "습관 하나로 연간 수십만 원 절약", "충동구매 막는 실전 방법"],
        targetSituations: ["월급이 빠듯한 직장인", "절약을 시작하고 싶은 20~30대", "카드값이 많은 분"],
        hookTemplates: ["이거 알면 한 달에 5만 원 아낍니다", "이 습관이 돈을 새게 만들고 있어요"],
      },
      {
        id: "investment-start",
        name: "재테크 시작",
        description: "주식·ETF·적금 등 재테크를 처음 시작하는 방법",
        seedExamples: ["월급쟁이 재테크 첫 번째 단계", "ETF 처음 시작하는 방법", "적금 vs 주식 어디에 넣을까"],
        contentAngles: ["소액으로 시작하는 방법", "가장 안전한 첫 투자", "재테크 실패하는 흔한 실수"],
        targetSituations: ["재테크 아무것도 모르는 직장인", "종잣돈 모으는 중인 20대", "이직 후 돈 관리가 필요한 분"],
        hookTemplates: ["재테크 처음이면 이것부터 하세요", "월 10만 원으로 시작하는 방법"],
      },
      {
        id: "subscription-management",
        name: "구독 관리",
        description: "넷플릭스·유튜브프리미엄 등 구독 비용 줄이는 방법",
        seedExamples: ["구독 서비스 정리하는 방법", "안 쓰는 구독 찾아내는 법", "구독 공유로 비용 절반 내는 법"],
        contentAngles: ["모르고 내는 구독비 찾기", "연간 결제 vs 월간 결제 비교", "무료 대체 서비스 활용"],
        targetSituations: ["구독 서비스가 많은 직장인", "카드 내역 잘 안 보는 분", "알뜰하게 살고 싶은 분"],
        hookTemplates: ["지금 당장 카드 내역 확인해보세요", "이 구독료, 매달 새고 있었어요"],
      },
    ],
    categoryName: "월급쟁이 절약 & 재테크 꿀팁",
    targetAudience: "월급만으로 빠듯한 20~40대 한국 직장인",
    duration: 45,
    tone: "현실적이고 공감가게, 살짝 놀라운 팩트 포함",
    referenceStyle: "ai_character_tips",
    narrationStyle:
      "'이거 알면 달라져요' 팩트 폭격 스타일. 구체적 숫자/상황 언급. 말하듯 짧게.",
    ttsProvider: "openai",
    openaiVoice: "alloy",
    openaiModel: "gpt-4o-mini-tts",
    openaiSpeed: 0.93,
    openaiInstructions: "Clear Korean tech-style explainer adapted to money-saving tips. Practical, modern, and confident.",
    gradient: "from-lime-400 to-green-600",
    color: "#84cc16",
    motionHints: {
      alive: "인트로 지갑/동전 캐릭터",
      character_talk: "절약법 설명",
      character_pulse: "놀라운 절약 금액 공개",
      slow_zoom_out: "CTA",
    },
  },

  // ── 6. 심리·관계 ───────────────────────────────────────────────────
  {
    id: "psychology-relations",
    name: "심리·관계",
    emoji: "🧠",
    description: "심리학 기반 관계·소통·자존감 꿀팁. 따뜻한 공감 톤.",
    subTopics: [
      {
        id: "self-esteem",
        name: "자존감",
        description: "자존감을 높이고 자기 자신을 존중하는 방법",
        seedExamples: ["자존감 낮은 사람의 공통 패턴", "자존감 높이는 말 습관", "타인의 시선에서 자유로워지는 법"],
        contentAngles: ["자존감 낮아지는 숨겨진 이유", "자존감과 관계의 관계", "작은 행동으로 자존감 회복하기"],
        targetSituations: ["자존감이 낮다고 느끼는 분", "타인의 말에 쉽게 상처받는 분", "비교를 자주 하는 분"],
        hookTemplates: ["자존감 낮은 사람이 하는 말 습관", "이게 자존감을 갉아먹고 있습니다"],
      },
      {
        id: "communication",
        name: "소통·대화",
        description: "갈등 없이 원하는 것을 말하는 소통 방법",
        seedExamples: ["거절을 상처 없이 하는 방법", "화를 내지 않고 감정 표현하는 법", "말 한 마디로 상대방 마음 여는 법"],
        contentAngles: ["갈등을 최소화하는 대화 방법", "상대방이 움직이게 하는 말", "감정적이지 않게 NO 하는 방법"],
        targetSituations: ["갈등이 두려운 내향인", "직장에서 소통이 힘든 분", "감정 표현이 서툰 분"],
        hookTemplates: ["거절 이렇게 하면 관계 안 망가집니다", "이 한 마디가 대화를 바꿉니다"],
      },
      {
        id: "toxic-relationships",
        name: "관계 정리",
        description: "에너지를 빼앗는 관계를 정리하고 진짜 사람을 남기는 방법",
        seedExamples: ["에너지 뱀파이어 특징 5가지", "독이 되는 관계를 끊는 방법", "진짜 내 편을 알아보는 방법"],
        contentAngles: ["관계를 정리해야 하는 신호", "끊기 힘든 관계를 끊는 심리 방법", "혼자여도 괜찮은 이유"],
        targetSituations: ["인간관계로 지친 모든 분", "관계를 정리하고 싶지만 못 하는 분", "혼자가 편한 내향인"],
        hookTemplates: ["이 사람 주변에 있으면 에너지 빠집니다", "관계 정리해야 할 때의 신호"],
      },
    ],
    categoryName: "심리학으로 보는 관계 & 소통 꿀팁",
    targetAudience: "인간관계가 고민인 20~40대 한국 여성·직장인",
    duration: 45,
    tone: "따뜻하고 공감가는, 살짝 놀라운 심리 팩트 포함",
    referenceStyle: "ai_character_tips",
    narrationStyle:
      "심리 상담사가 친구처럼 이야기해주는 느낌. '사실 이게 왜 그런지 알아요?' 톤.",
    ttsProvider: "openai",
    openaiVoice: "coral",
    openaiModel: "gpt-4o-mini-tts",
    openaiSpeed: 0.92,
    openaiInstructions: "Bright Korean short-form narrator. Cheerful but not childish, with warmth for psychology and relationship topics.",
    gradient: "from-violet-400 to-purple-600",
    color: "#8b5cf6",
    motionHints: {
      alive: "인트로 뇌/하트 캐릭터",
      character_nod: "공감 씬",
      character_talk: "심리 설명 씬",
      character_pulse: "핵심 팩트 강조",
      slow_zoom_out: "마무리 CTA",
    },
  },

  // ── 7. 감동사연 ───────────────────────────────────────────────────
  {
    id: "emotional-stories",
    name: "감동사연",
    emoji: "💌",
    description: "가족·부모·인생 반전 사연. 따뜻하고 잔잔한 감정형 릴스.",
    subTopics: [
      {
        id: "parents-children",
        name: "부모와 자녀",
        description: "부모님의 사랑과 희생이 담긴 감동 사연",
        seedExamples: [
          "아버지 지갑 속 오래된 사진",
          "엄마가 숨겨둔 병원 영수증",
          "아버지 서랍 속 낡은 노트",
          "엄마의 빈 도시락통",
        ],
        contentAngles: [
          "오래된 물건 속에 숨겨진 사랑",
          "말하지 못했던 걱정과 희생",
          "돌아가신 뒤에야 알게 된 사실",
          "작은 행동의 의미를 뒤늦게 깨달음",
        ],
        targetSituations: [
          "부모님과 멀리 사는 자녀",
          "부모님을 여읜 경험이 있는 분",
          "부모님 곁에 있으면서도 소홀했던 분",
        ],
        hookTemplates: [
          "아버지 서랍을 열었을 때, 몰랐던 걸 알았어요",
          "엄마는 그걸 매일 숨겨뒀었어요",
          "돌아가신 뒤에야, 이걸 발견했어요",
        ],
      },
      {
        id: "couple-love",
        name: "부부·연인",
        description: "배우자와 연인 사이의 작은 배려와 감동 사연",
        seedExamples: [
          "배우자가 남긴 작은 쪽지",
          "남편이 몰래 준비한 것",
          "아내가 매일 챙겨둔 것",
        ],
        contentAngles: [
          "말하지 않아도 알아준 배려",
          "오래된 커플의 작은 루틴",
          "아프거나 힘들 때 나타난 진심",
          "뒤늦게 발견한 배우자의 마음",
        ],
        targetSituations: [
          "결혼 생활이 힘든 분",
          "배우자에게 서운함을 느끼는 분",
          "오랜 연인 관계에 있는 분",
        ],
        hookTemplates: [
          "배우자가 매일 이걸 해뒀었어요",
          "아내의 가방 속에서 이걸 발견했어요",
          "남편이 아무 말도 안 하고, 이걸 했더라고요",
        ],
      },
      {
        id: "siblings",
        name: "형제·자매",
        description: "형제자매 사이의 말 못한 사랑과 추억이 담긴 사연",
        seedExamples: [
          "언니가 버리지 못한 오래된 것",
          "형이 몰래 챙겨준 것",
          "동생이 남긴 편지",
        ],
        contentAngles: [
          "말은 안 해도 챙겨줬던 형제",
          "어릴 때 다퉜지만 나중에 안 사실",
          "오래된 물건에 남아있는 형제의 흔적",
        ],
        targetSituations: [
          "형제자매와 오랫동안 연락 못 한 분",
          "형제를 잃은 경험이 있는 분",
          "형제간 갈등을 겪고 있는 분",
        ],
        hookTemplates: [
          "형이 아무 말도 없이 이걸 해줬었어요",
          "동생 방을 정리하다가 이걸 발견했어요",
        ],
      },
      {
        id: "neighbors-strangers",
        name: "이웃·낯선 사람",
        description: "이웃이나 모르는 사람에게서 받은 예상치 못한 따뜻함",
        seedExamples: [
          "이웃 할머니가 두고 간 반찬통",
          "모르는 사람이 남긴 쪽지",
          "늘 같은 자리에 앉아 있던 할아버지",
        ],
        contentAngles: [
          "기대하지 않았던 곳에서 받은 친절",
          "작은 배려가 삶을 바꾼 이야기",
          "이름도 모르는 사람이 준 감동",
        ],
        targetSituations: [
          "도시에서 외로움을 느끼는 분",
          "이웃과 단절된 현대인",
          "작은 친절에 감동받는 분",
        ],
        hookTemplates: [
          "이웃 할머니가 매주 이걸 두고 가셨어요",
          "모르는 분이 남긴 쪽지, 읽고 울었어요",
        ],
      },
      {
        id: "elderly-life",
        name: "노년의 삶",
        description: "나이 드신 어르신의 일상 속에 담긴 감동과 삶의 지혜",
        seedExamples: [
          "할머니의 빈 밥그릇",
          "할아버지가 매일 하던 작은 일",
          "혼자 사시는 어머니의 식탁",
        ],
        contentAngles: [
          "혼자 남겨진 어르신의 일상",
          "평생 해온 작은 습관의 의미",
          "자식들이 몰랐던 부모님의 하루",
        ],
        targetSituations: [
          "홀로 사시는 부모님이 걱정되는 분",
          "고령화 사회에 공감하는 분",
          "부모님과 더 많은 시간을 보내고 싶은 분",
        ],
        hookTemplates: [
          "할머니는 매일 그 밥그릇을 씻어두셨어요",
          "혼자 사시는 어머니의 식탁에는, 항상 이게 있었어요",
        ],
      },
      {
        id: "hospital-care",
        name: "병원·간병",
        description: "병원에서 일어난 감동적인 간병 이야기와 회복의 기록",
        seedExamples: [
          "병원 복도 빈 의자",
          "간병하던 아버지의 수첩",
          "퇴원 전날 엄마가 한 일",
        ],
        contentAngles: [
          "병원에서 나타난 가족의 진심",
          "간병 중 발견한 부모님의 마음",
          "아픈 시간이 알려준 것",
        ],
        targetSituations: [
          "가족을 간병한 경험이 있는 분",
          "입원 경험이 있는 분",
          "가족의 건강이 걱정되는 분",
        ],
        hookTemplates: [
          "아버지는 병원 그 의자에, 매일 앉아 계셨어요",
          "간병하던 중에, 이걸 발견했어요",
        ],
      },
      {
        id: "old-objects",
        name: "오래된 물건의 사연",
        description: "낡은 물건 속에 담긴 기억과 삶의 흔적 이야기",
        seedExamples: [
          "팔지 못한 오래된 집 열쇠",
          "아무도 받지 않은 전화기",
          "오래된 가족사진 액자",
          "냉장고에 붙은 메모",
        ],
        contentAngles: [
          "버리지 못했던 이유",
          "물건에 남아있는 사람의 온기",
          "오래된 것이 보내는 메시지",
          "정리하다 발견한 뜻밖의 사실",
        ],
        targetSituations: [
          "이사 중 오래된 물건을 발견한 분",
          "돌아가신 분의 물건을 정리한 경험이 있는 분",
          "추억이 담긴 물건을 버리지 못하는 분",
        ],
        hookTemplates: [
          "이 열쇠, 평생 버리지 못한 이유가 있었어요",
          "오래된 가족사진 뒷면에, 이게 적혀 있었어요",
          "정리하다가 이걸 발견하고, 한참을 울었어요",
        ],
      },
    ],
    categoryName: "가족과 인생을 담은 감동 사연 — 매번 다른 소재와 작은 반전",
    targetAudience: "가족 이야기와 따뜻한 사연에 공감하는 30~70대 한국 시청자",
    duration: 45,
    tone: "차분하고 따뜻하게, 마지막에 작은 여운이 남도록",
    referenceStyle: "emotional_story",
    narrationStyle:
      "조용한 사연을 들려주는 내레이터처럼. 과장하지 말고, 문장 사이에 감정의 쉼을 둔다.",
    ttsProvider: "openai",
    openaiVoice: "sage",
    openaiModel: "gpt-4o-mini-tts",
    // ── 감동사연 OpenAI TTS 확정값 (2026-05-22) ──────────────────────────────
    // QA-22 재렌더(v2_qa22_sage094) 결과 "이전보다 훨씬 좋아졌다" 사용자 확인.
    // sage 0.94 + 감정 지시문을 감동사연 OpenAI 기본값으로 확정.
    // 이전값: speed 1.08, voice shimmer → 설명조/또렷함 지적으로 교체.
    // ElevenLabs voiceId 설정 시 추후 비교 후 교체 검토.
    openaiSpeed: 0.94,
    openaiInstructions:
      "Quiet emotional Korean storytelling. Soft, intimate, and reflective. Natural pauses and gentle sadness. Do not sound like a news anchor, classroom leader, explainer, tutorial, or announcer.",
    gradient: "from-rose-400 to-pink-600",
    color: "#f43f5e",
    motionHints: {
      alive: "인트로 감정 오브젝트 등장",
      character_nod: "잔잔한 회상",
      character_pulse: "반전 또는 감정 포인트",
      slow_zoom_out: "여운 있는 마무리",
    },
  },
];

/** ID로 카테고리 찾기 */
export function getReelCategory(id: string): ReelCategoryProfile | undefined {
  return REEL_CATEGORIES.find((c) => c.id === id);
}

/** generateReelV2Plan 호출용 파라미터 추출 */
export function categoryToV2Params(cat: ReelCategoryProfile) {
  return {
    categoryName: cat.categoryName,
    targetAudience: cat.targetAudience,
    duration: cat.duration,
    tone: cat.tone,
    referenceStyle: cat.referenceStyle,
  };
}

/** render-v2 API 호출용 TTS 파라미터 추출 */
export function categoryToTtsOptions(cat: ReelCategoryProfile) {
  return {
    ttsProvider: cat.ttsProvider,
    ttsVoice: cat.openaiVoice,
    ttsModel: cat.openaiModel,
    ttsSpeed: cat.openaiSpeed,
    ttsInstructions: cat.openaiInstructions,
    elevenLabsVoiceId: cat.elevenLabsVoiceId,
  };
}
