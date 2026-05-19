export interface Category {
  id: string;
  name: string;
  emoji: string;
  description: string;
  tags: string[];
  color: string;
  gradient: string;
  viewPotential: number;
  systemPrompt: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "ai-content",
    name: "AI 생성 활용",
    emoji: "🤖",
    description: "놀라운 AI 기술 & 생성 쇼케이스",
    tags: ["AI", "기술", "트렌드"],
    color: "#818cf8",
    gradient: "from-indigo-500 to-purple-600",
    viewPotential: 5,
    systemPrompt: "당신은 최신 AI 기술 트렌드 전문 숏폼 크리에이터입니다. 시청자가 'AI가 이런 것도 해?!'라며 놀랄 만한 30초 이내 쇼츠 스크립트를 작성하세요."
  },
  {
    id: "meme",
    name: "밈 & 짤",
    emoji: "😂",
    description: "실시간 트렌드 밈 & 유머 콘텐츠",
    tags: ["밈", "유머", "바이럴"],
    color: "#f59e0b",
    gradient: "from-yellow-400 to-orange-500",
    viewPotential: 5,
    systemPrompt: "당신은 MZ세대 밈 전문 크리에이터입니다. 현재 유행하는 밈 포맷을 활용한 30초 이내 웃긴 쇼츠 스크립트를 작성하세요."
  },
  {
    id: "shocking-news",
    name: "오늘의 충격뉴스",
    emoji: "📰",
    description: "실시간 이슈 & 충격 뉴스 요약",
    tags: ["뉴스", "이슈", "충격"],
    color: "#ef4444",
    gradient: "from-red-500 to-rose-600",
    viewPotential: 4,
    systemPrompt: "당신은 쇼츠 전문 뉴스 크리에이터입니다. '이게 실화?'라는 반응이 나올 충격적인 실제 뉴스를 30초 이내 쇼츠 스크립트로 만드세요."
  },
  {
    id: "tmi-knowledge",
    name: "TMI 지식",
    emoji: "💡",
    description: "몰랐던 놀라운 잡학 지식",
    tags: ["지식", "TMI", "교육"],
    color: "#10b981",
    gradient: "from-emerald-400 to-teal-500",
    viewPotential: 4,
    systemPrompt: "당신은 잡학지식 전문 쇼츠 크리에이터입니다. '나만 몰랐나?' 반응이 나올 놀라운 TMI 지식을 30초 이내 스크립트로 작성하세요."
  },
  {
    id: "game-clip",
    name: "게임 클립",
    emoji: "🎮",
    description: "게임 명장면 & 하이라이트 해설",
    tags: ["게임", "클립", "하이라이트"],
    color: "#8b5cf6",
    gradient: "from-violet-500 to-purple-700",
    viewPotential: 3,
    systemPrompt: "당신은 게임 하이라이트 전문 쇼츠 크리에이터입니다. 게임 명장면을 흥미롭게 해설하는 30초 이내 스크립트를 작성하세요."
  },
  {
    id: "finance-tip",
    name: "재테크 팁",
    emoji: "💰",
    description: "주식 코인 절약 한 줄 꿀팁",
    tags: ["재테크", "투자", "절약"],
    color: "#f59e0b",
    gradient: "from-amber-400 to-yellow-500",
    viewPotential: 4,
    systemPrompt: "당신은 재테크 전문 쇼츠 크리에이터입니다. 실용적인 재테크 팁을 '이걸 왜 몰랐지?' 반응이 나오게 30초 이내 스크립트로 작성하세요."
  },
  {
    id: "cute-animal",
    name: "귀여운 동물",
    emoji: "🐾",
    description: "힐링되는 동물 콘텐츠",
    tags: ["동물", "힐링", "귀여움"],
    color: "#ec4899",
    gradient: "from-pink-400 to-rose-500",
    viewPotential: 4,
    systemPrompt: "당신은 동물 콘텐츠 전문 쇼츠 크리에이터입니다. '너무 귀여워 죽겠다'는 반응이 나올 동물 콘텐츠 30초 이내 스크립트를 작성하세요."
  },
  {
    id: "celeb-enter",
    name: "셀럽/엔터",
    emoji: "🌟",
    description: "연예인 트렌드 & 엔터 이슈",
    tags: ["셀럽", "연예", "엔터"],
    color: "#06b6d4",
    gradient: "from-cyan-400 to-sky-500",
    viewPotential: 3,
    systemPrompt: "당신은 연예/엔터 전문 쇼츠 크리에이터입니다. 현재 화제의 셀럽 이슈를 30초 이내 흥미로운 스크립트로 작성하세요."
  },
];
