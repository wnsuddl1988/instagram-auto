import { writeFile } from "fs/promises";
import { dirname } from "path";
import { mkdir } from "fs/promises";

/**
 * Pollinations.ai에서 AI 이미지 생성 (API Key 불필요, 완전 무료)
 * @param prompt - 영어 이미지 설명
 * @param width - 이미지 너비 (기본: 1080)
 * @param height - 이미지 높이 (기본: 1920)
 * @returns 이미지 바이너리 Buffer
 */
export async function generateAiImage(
  prompt: string,
  width: number = 1080,
  height: number = 1920
): Promise<Buffer> {
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=turbo&nologo=true`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60초 타임아웃

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `Pollinations API 오류: ${response.status} ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`AI 이미지 생성 실패: ${error.message}`);
    }
    throw error;
  }
}

/**
 * AI 이미지를 생성하여 파일로 저장 (1080x1920 자동 설정)
 * @param prompt - 영어 이미지 설명
 * @param outputPath - 저장할 파일 경로 (.png 확장자)
 * @returns 성공 true, 실패 false (에러 throw 안함)
 */
export async function downloadAiImageToFile(
  prompt: string,
  outputPath: string
): Promise<boolean> {
  try {
    // 이미지 생성 (1080x1920 쇼츠 규격)
    const imageBuffer = await generateAiImage(prompt, 1080, 1920);

    // 디렉토리 생성 (필요시)
    const dir = dirname(outputPath);
    await mkdir(dir, { recursive: true });

    // 파일 저장
    await writeFile(outputPath, imageBuffer);

    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `[Pollinations] AI 이미지 저장 실패: ${error.message}`,
        error
      );
    } else {
      console.error(`[Pollinations] AI 이미지 저장 실패: 알 수 없는 오류`, error);
    }
    return false;
  }
}

/**
 * food-3d 카테고리 전용 Flux 프롬프트 생성
 * @param foodName - 음식 이름 (예: "kimchi", "kimbap")
 * @returns Pollinations.ai Flux 모델용 상세 프롬프트
 */
export function getFood3dPrompt(foodName: string): string {
  return `cute 3D cartoon ${foodName} character with big eyes and warm smile, kawaii style, pastel colors, white clean background, studio lighting, pixar style, adorable expression, chibi proportions, glossy texture, professional render`;
}
