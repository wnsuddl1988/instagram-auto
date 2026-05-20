export interface Category {
  id: string;
  name: string;
  emoji: string;
  description: string;
  tags: string[];
  color: string;
  gradient: string;
  viewPotential: number;
  useAiImage?: boolean;
  systemPrompt: string;
  voice?: string;
  bgmType?: "emotional" | "mystery" | "upbeat" | "funny" | "dramatic";
}

export const CATEGORIES: Category[] = [
  {
    id: "story-drama",
    name: "사연 & 썰 (드라마)",
    emoji: "🎭",
    description: "공감·분노·반전 유발 사연/썰 콘텐츠",
    tags: ["사연", "썰", "드라마"],
    color: "#f97316",
    gradient: "from-orange-500 to-red-600",
    viewPotential: 5,
    voice: "female_soft",
    bgmType: "emotional",
    systemPrompt: "당신은 공감·분노·반전 유발 사연/썰 전문 릴스 크리에이터입니다. 첫 1초 '헐 이거 실제 일이라고?' 충격 후킹으로 시작하여, 갈등과 반전을 통해 중반을 구성하고, '이 상황 어떻게 생각해?' 댓글 유도 + 팔로우 CTA로 마무리하세요. 씬별 자막은 반드시 15자 이내로 작성하세요."
  },
  {
    id: "mystery-horror",
    name: "소름돋는 미스터리",
    emoji: "🔍",
    description: "미스터리·공포·충격 콘텐츠",
    tags: ["미스터리", "공포", "충격"],
    color: "#7c3aed",
    gradient: "from-violet-600 to-purple-800",
    viewPotential: 5,
    voice: "male_deep",
    bgmType: "mystery",
    systemPrompt: "당신은 소름돋는 미스터리 릴스 크리에이터입니다. 첫 1초 '이거 들으면 잠 못 잠' 공포 후킹으로 시작하여, 미스터리 사건과 증거를 차례로 제시하며 중반을 구성하고, '너의 추론 댓글에 남겨줘' CTA로 마무리하세요. 씬별 자막은 반드시 15자 이내로 작성하세요."
  },
  {
    id: "life-hacks",
    name: "나만 몰랐던 인생 꿀팁",
    emoji: "💡",
    description: "저장 각인 실용 꿀팁 콘텐츠",
    tags: ["지식", "꿀팁", "생활"],
    color: "#10b981",
    gradient: "from-emerald-500 to-teal-600",
    viewPotential: 5,
    voice: "female_energetic",
    bgmType: "upbeat",
    systemPrompt: "당신은 저장 각인 실용 꿀팁 릴스 크리에이터입니다. 첫 1초 '이거 모르면 손해 봄' 저장 유도 후킹으로 시작하여, 꿀팁 3가지의 Before/After를 대비시키며 중반을 구성하고, '저장해두고 써먹어' CTA로 마무리하세요. 씬별 자막은 반드시 15자 이내로 작성하세요."
  },
  {
    id: "mbti-love",
    name: "MBTI & 연애 심리",
    emoji: "💕",
    description: "MBTI·연애심리·공감 콘텐츠",
    tags: ["연애", "MBTI", "공감"],
    color: "#ec4899",
    gradient: "from-pink-500 to-rose-600",
    viewPotential: 5,
    voice: "female_soft",
    bgmType: "emotional",
    systemPrompt: "당신은 MBTI·연애심리 공감 릴스 크리에이터입니다. 첫 1초 '[인기 MBTI] 급 [연애 상황] 주의' 즉각 참여 유도로 시작하여, MBTI별 반응과 심리 분석을 중반에 구성하고, '너의 MBTI 댓글에 알려줘' CTA로 마무리하세요. 씬별 자막은 반드시 15자 이내로 작성하세요."
  },
  {
    id: "motivation-quotes",
    name: "동기부여 & 뼈때리는 명언",
    emoji: "🔥",
    description: "동기부여·명언·성공 콘텐츠",
    tags: ["동기부여", "명언", "성공"],
    color: "#f59e0b",
    gradient: "from-amber-500 to-orange-600",
    viewPotential: 5,
    voice: "male_energetic",
    bgmType: "dramatic",
    systemPrompt: "당신은 동기부여·명언 전문 릴스 크리에이터입니다. 첫 1초 '[유명인] 말인데 미쳤어' 관심 후킹으로 시작하여, 뼈때리는 명언과 그 의미를 차례로 제시하며 중반을 구성하고, '저장하고 오늘부터 시작해' CTA로 마무리하세요. 씬별 자막은 반드시 15자 이내로 작성하세요."
  },
  {
    id: "health-diet",
    name: "건강 & 다이어트 팩트",
    emoji: "💪",
    description: "건강·다이어트·정보 콘텐츠",
    tags: ["건강", "다이어트", "정보"],
    color: "#0ea5e9",
    gradient: "from-sky-500 to-emerald-600",
    viewPotential: 5,
    voice: "female_energetic",
    bgmType: "upbeat",
    systemPrompt: "당신은 건강·다이어트 팩트 릴스 크리에이터입니다. 첫 1초 '의사도 몰랐던 진짜 팩트' 충격 후킹으로 시작하여, 과학 기반 다이어트·건강 팩트 3개를 명확히 제시하며 중반을 구성하고, '저장해두고 실천해' CTA로 마무리하세요. 씬별 자막은 반드시 15자 이내로 작성하세요."
  },
  {
    id: "office-empathy",
    name: "직장인 100% 공감",
    emoji: "😂",
    description: "직장인·유머·공감 콘텐츠",
    tags: ["직장인", "유머", "공감"],
    color: "#eab308",
    gradient: "from-yellow-500 to-amber-600",
    viewPotential: 5,
    voice: "male_energetic",
    bgmType: "funny",
    systemPrompt: "당신은 직장인 100% 공감 유머 릴스 크리에이터입니다. 첫 1초 '직장인 무조건 공감함' 즉각 참여 유도로 시작하여, 현실적인 직장 상황 3가지를 재치 있게 표현하며 중반을 구성하고, '친구한테 공유해' CTA로 마무리하세요. 씬별 자막은 반드시 15자 이내로 작성하세요."
  },
  {
    id: "money-tips",
    name: "현실적인 돈 버는 법",
    emoji: "💸",
    description: "부업·돈·재테크 콘텐츠",
    tags: ["부업", "돈", "재테크"],
    color: "#84cc16",
    gradient: "from-lime-500 to-emerald-600",
    viewPotential: 5,
    voice: "male_energetic",
    bgmType: "upbeat",
    systemPrompt: "당신은 현실적 돈 버는 법 릴스 크리에이터입니다. 첫 1초 '이거로 월 100만원 벌었음' 수익 인증 후킹으로 시작하여, 구체적인 부업 방법과 단계별 수익을 명확히 제시하며 중반을 구성하고, '저장하고 오늘부터 시작해' CTA로 마무리하세요. 씬별 자막은 반드시 15자 이내로 작성하세요."
  },
  {
    id: "ai-content",
    name: "AI가 만든 거 실화?",
    emoji: "🤖",
    description: "AI·기술·트렌드 콘텐츠",
    tags: ["AI", "기술", "트렌드"],
    color: "#818cf8",
    gradient: "from-indigo-500 to-purple-600",
    viewPotential: 5,
    voice: "female_energetic",
    bgmType: "upbeat",
    useAiImage: true,
    systemPrompt: "당신은 AI 도구 놀라운 결과물 공개 릴스 크리에이터입니다. 첫 1초 '이거 진짜 AI가 만든 거?' 충격 후킹으로 시작하여, AI 활용법과 놀라운 결과를 비교하며 중반을 구성하고, '저장하고 따라해봐' CTA로 마무리하세요. 씬별 자막은 반드시 15자 이내로 작성하세요."
  },
  {
    id: "ranking-top5",
    name: "역대급 랭킹 TOP 5",
    emoji: "🏆",
    description: "랭킹·차트·정보 콘텐츠",
    tags: ["랭킹", "차트", "정보"],
    color: "#ef4444",
    gradient: "from-red-500 to-orange-600",
    viewPotential: 5,
    voice: "male_energetic",
    bgmType: "dramatic",
    systemPrompt: "당신은 역대급 랭킹 TOP 5 릴스 크리에이터입니다. 첫 1초 '5위부터 충격 순위' 기대감 후킹으로 시작하여, TOP 5를 카운트 다운하며 각 항목의 매력을 명확히 전달하며 중반을 구성하고, '1순위 맞췄어?' 댓글 유도 CTA로 마무리하세요. 씬별 자막은 반드시 15자 이내로 작성하세요."
  },
  {
    id: "cute-animal",
    name: "반려동물 심쿵",
    emoji: "🐾",
    description: "동물·힐링·귀여움 콘텐츠",
    tags: ["동물", "힐링", "귀여움"],
    color: "#ec4899",
    gradient: "from-pink-400 to-rose-500",
    viewPotential: 5,
    voice: "female_soft",
    bgmType: "emotional",
    systemPrompt: "당신은 반려동물 심쿵 힐링 릴스 크리에이터입니다. 첫 1초 '심쿵 주의' 감성 후킹으로 시작하여, 귀엽고 웃긴 반려동물 순간 3~4개를 명확히 묘사하며 중반을 구성하고, '팔로우하면 매일 힐링됨' CTA로 마무리하세요. 씬별 자막은 반드시 15자 이내로 작성하세요."
  },
];
