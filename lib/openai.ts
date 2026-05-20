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
