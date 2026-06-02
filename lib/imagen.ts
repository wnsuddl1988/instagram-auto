import { mkdir, writeFile } from "fs/promises";
import { dirname } from "path";

interface ImagenPrediction {
  bytesBase64Encoded?: string;
  mimeType?: string;
}

interface ImagenResponse {
  predictions?: ImagenPrediction[];
  error?: {
    message?: string;
  };
}

export async function generateImagenImage(prompt: string): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  const model =
    process.env.IMAGEN_MODEL || "imagen-4.0-fast-generate-001";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "9:16",
          personGeneration: "dont_allow",
        },
      }),
    }
  );

  const data = (await response.json()) as ImagenResponse;
  if (!response.ok) {
    const msg = data.error?.message || `Imagen API 오류: ${response.status}`;
    // 429 / quota 에러는 별도 태그를 달아 상위에서 감지할 수 있게 한다
    if (
      response.status === 429 ||
      /quota|rate.?limit|resource.?exhausted/i.test(msg)
    ) {
      // Retry-After 헤더 파싱 (초 단위 또는 HTTP 날짜 형식 모두 지원)
      const retryAfterHeader = response.headers.get("Retry-After");
      let retryAfterSeconds = 60; // 기본 60초
      if (retryAfterHeader) {
        const parsed = Number(retryAfterHeader);
        if (!isNaN(parsed)) {
          retryAfterSeconds = parsed;
        } else {
          // HTTP 날짜 형식
          const retryDate = new Date(retryAfterHeader).getTime();
          if (!isNaN(retryDate)) {
            retryAfterSeconds = Math.max(1, Math.ceil((retryDate - Date.now()) / 1000));
          }
        }
      } else {
        // 에러 메시지에서 "retry after N seconds" 패턴 추출 시도
        const match = msg.match(/retry.{0,20}?(\d+)\s*s/i);
        if (match) retryAfterSeconds = Number(match[1]);
      }
      const err = new Error(msg) as Error & {
        isQuotaError: boolean;
        retryAfterSeconds: number;
      };
      err.isQuotaError = true;
      err.retryAfterSeconds = retryAfterSeconds;
      throw err;
    }
    throw new Error(msg);
  }

  const imageBase64 = data.predictions?.[0]?.bytesBase64Encoded;
  if (!imageBase64) {
    throw new Error("Imagen 응답에 이미지 데이터가 없습니다.");
  }

  return Buffer.from(imageBase64, "base64");
}

export async function downloadImagenImageToFile(
  prompt: string,
  outputPath: string
): Promise<boolean> {
  try {
    const image = await generateImagenImage(prompt);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, image);
    return true;
  } catch (error) {
    // quota / rate-limit 에러는 상위로 전파해서 429 응답을 내보낸다
    if (error instanceof Error && (error as Error & { isQuotaError?: boolean }).isQuotaError) {
      throw error;
    }
    console.warn(
      "[Imagen] 이미지 생성 실패:",
      error instanceof Error ? error.message : error
    );
    return false;
  }
}
