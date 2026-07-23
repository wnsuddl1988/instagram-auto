import { HOME_PROBLEM_LAB_CONFIG } from "./config";

const shared = `엔진=${HOME_PROBLEM_LAB_CONFIG.engineId}; 채널=${HOME_PROBLEM_LAB_CONFIG.channelName}; 철학=${HOME_PROBLEM_LAB_CONFIG.philosophy}`;

export const HOME_PROBLEM_LAB_VISUAL_NEGATIVE_RULES = [
  "AI가 특정 실제 상품처럼 보이는 가짜 제품을 만들지 않는다.",
  "브랜드명, 로고, 패키지, 상품명, 가격표를 AI로 임의 생성하지 않는다.",
  "실제 상품 이미지는 product_card_optional 장면에서만 허용한다.",
  "일반 문제 재현 장면에는 중립적이고 비브랜드인 생활용품만 사용한다.",
  "mock 상태의 제품 구매 연결 장면은 placeholder card만 사용한다.",
  "AI 생성 장면을 실제 테스트 결과나 실제 사용 후기처럼 표현하지 않는다.",
] as const;

export const HOME_PROBLEM_LAB_PROMPTS = {
  topicGenerator: `${shared}\n두 콘텐츠 축 안에서 제품 구매보다 원인 진단과 0원 해결법을 우선하는 생활 문제 주제를 제안한다.`,
  scriptGenerator: `${shared}\nhook_problem, lumi_diagnosis, cause_explanation, free_solution, product_criteria, verdict_cta, next_case_teaser는 반드시 포함한다. product_card_optional은 실제 제품이 꼭 필요할 때만 넣는다.`,
  storyboardGenerator: `${shared}\n루미는 2.5D 반실사 고정 캐릭터다. 실제 제품 이미지와 AI 가짜 제품은 product_card_optional 밖에서 금지한다.`,
  visualPromptGenerator: `${shared}\n집안 문제 재현·그래픽·루미의 비율을 시각 계약에 맞추고 포토리얼 인플루언서 스타일을 금지한다.\nNEGATIVE RULES:\n${HOME_PROBLEM_LAB_VISUAL_NEGATIVE_RULES.map((rule) => `- ${rule}`).join("\n")}`,
  metadataGenerator: `${shared}\n허위 내돈내산, 가짜 후기, 과장 효능, 광고·수익배분 누락을 만들지 않는다.`,
  qualityChecker: `${shared}\n25점 중 22점 이상만 후보이며 Hard Fail은 점수와 무관하게 차단한다.`,
} as const;
