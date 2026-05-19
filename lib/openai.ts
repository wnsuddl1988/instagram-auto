import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GenerateScriptParams {
  categoryId: string;
  categoryName: string;
  systemPrompt: string;
  duration: 15 | 30 | 60;
  tone: "유머" | "정보전달" | "충격" | "감성";
}

export interface GeneratedScript {
  title: string;
  script: string;
  hashtags: string[];
  hook: string;
  callToAction: string;
  estimatedDuration: number;
}

export async function generateScript(
  params: GenerateScriptParams
): Promise<GeneratedScript> {
  const { categoryName, systemPrompt, duration, tone } = params;

  const userPrompt = `
카테고리: ${categoryName}
영상 길이: ${duration}초 분량
톤: ${tone}

아래 JSON 형식으로 반드시 응답해줘. JSON 외 다른 텍스트 절대 금지:
{
  "title": "유튜브/인스타 제목 (35자 이내, 클릭하고 싶게)",
  "hook": "첫 3초 후킹 멘트 (시청자가 스크롤 멈추게 만드는 강렬한 첫 마디)",
  "script": "본문 스크립트 전체 (${duration}초 분량, 자연스러운 구어체, 자막용)",
  "callToAction": "마지막 팔로우/구독 유도 멘트 (5초 이내)",
  "hashtags": ["해시태그1", "해시태그2", "해시태그3", "해시태그4", "해시태그5"],
  "estimatedDuration": ${duration}
}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.85,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("GPT 응답이 비어있습니다.");

  return JSON.parse(content) as GeneratedScript;
}
